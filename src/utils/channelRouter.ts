import type { Point, EdgeEndpointRect } from './graph'

export interface RoutedEdge {
  d: string
  mid: Point
  angle: number
  points: Point[]
  /** Marks this as an orthogonal polyline (not a bezier curve). Used to distinguish from
   *  BezierPathResult when sampling label positions — polylines use linear interpolation,
   *  while beziers use curve functions. */
  isPolyline: true
  /** Label anchors in order of preference: the midpoint of each straight segment, longest first
   *  (polylineToRoutedEdge). A renderer tries these before sampling the path by parameter, which
   *  lands on a bend corner for an L-shaped route. */
  labelAnchors?: Point[]
}

/** Default spacing (px) between parallel segments when nudging overlapping edges apart */
export const DEFAULT_TRACE_SPACING = 16

/**
 * Router contract version, read by callers that need to know how to build the obstacle set:
 *   1 — the caller removed every route endpoint from `obstacles` itself.
 *   2 — the caller passes every node rect; the router drops each route's own two endpoints
 *       (and only those) when routing that route. GraphCanvas passes all node rects.
 */
export const ROUTER_CONTRACT_VERSION = 2

/** Clearance kept between a route and any node box it detours around. */
const OBSTACLE_PADDING = 20

/** A port is kept at least this far from its node's corner when nudged along the side. */
const PORT_CORNER_MARGIN = 2

/**
 * Wraps a precomputed orthogonal polyline (e.g. from utils/orthogonalLayout) in the RoutedEdge
 * shape GraphCanvas renders: SVG path, label midpoint and end angle, same formulas as
 * routeNavigationEdge. Returns null for anything shorter than two points.
 */
export function polylineToRoutedEdge(points: readonly Point[]): RoutedEdge | null {
  if (points.length < 2) return null
  const pts = points.map(p => ({ x: p.x, y: p.y }))
  const d = pointsToPathString(pts)
  // Label anchors: three points on every segment (its midpoint, then 30% and 70% along it),
  // longest segment first (ties by segment order), so a label sits on a straight run instead of a
  // corner and a renderer has alternatives when two labels would collide; `mid` (tooltips,
  // popovers) is the longest segment's midpoint.
  const labelAnchors = pts.slice(1)
    .map((p, i) => ({ len: Math.abs(p.x - pts[i].x) + Math.abs(p.y - pts[i].y), a: pts[i], b: p, i }))
    .sort((a, b) => b.len - a.len || a.i - b.i)
    .flatMap(s => [0.5, 0.3, 0.7].map(t => ({ x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t })))
  const mid = labelAnchors[0]
  const angle = Math.atan2(pts[pts.length - 1].y - pts[pts.length - 2].y, pts[pts.length - 1].x - pts[pts.length - 2].x)
  return { d, mid, angle, points: pts, isPolyline: true, labelAnchors }
}

export function routeNavigationEdge(
  source: EdgeEndpointRect,
  target: EdgeEndpointRect,
  obstacles: readonly EdgeEndpointRect[] = []
): RoutedEdge {
  const points = buildOrthogonalPath(source, target, withoutEndpoints(obstacles, source, target))
  return finishRoute(points)
}

/**
 * Routes multiple navigation edges at once with obstacle avoidance: each route is built
 * against the node boxes and priced against the routes already drawn (crossings, shared
 * corridors), then collinear overlapping segments of different routes are nudged apart by
 * `traceSpacing` without moving a port off its node side.
 *
 * Which route claims a corridor first decides the rest, so the batch is routed in three orders
 * (as given, shortest first, longest first — by Manhattan distance between centres) and the
 * set with the lowest total cost wins (ties keep the earlier order).
 */
export function routeNavigationEdges(
  edges: Array<{ id: string; source: EdgeEndpointRect; target: EdgeEndpointRect }>,
  allObstacles: readonly EdgeEndpointRect[] = [],
  traceSpacing: number = DEFAULT_TRACE_SPACING
): Map<string, RoutedEdge> {
  const endpoints = new Map<string, { source: EdgeEndpointRect; target: EdgeEndpointRect }>()
  for (const edge of edges) endpoints.set(edge.id, { source: edge.source, target: edge.target })

  const span = (e: (typeof edges)[number]) => Math.abs(e.target.x - e.source.x) + Math.abs(e.target.y - e.source.y)
  const orders = [edges, [...edges].sort((a, b) => span(a) - span(b)), [...edges].sort((a, b) => span(b) - span(a))]

  let best: Map<string, Point[]> | null = null
  let bestCost = Infinity
  for (const order of orders) {
    const paths = new Map<string, Point[]>()
    const drawn: Point[][] = []
    for (const edge of order) {
      const points = buildOrthogonalPath(edge.source, edge.target, withoutEndpoints(allObstacles, edge.source, edge.target), drawn)
      drawn.push(points)
      paths.set(edge.id, points)
    }
    const cost = batchCost(drawn, allObstacles)
    if (cost < bestCost) {
      best = paths
      bestCost = cost
    }
  }

  const routes = new Map<string, RoutedEdge>()
  for (const edge of edges) routes.set(edge.id, finishRoute(best!.get(edge.id)!))
  nudgeOverlappingSegments(routes, endpoints, allObstacles, traceSpacing)
  return routes
}

/** The cost buildOrthogonalPath ranks one route by, summed over a whole batch (each pair priced once). */
function batchCost(paths: readonly Point[][], obstacles: readonly EdgeEndpointRect[]): number {
  let cost = 0
  paths.forEach((points, i) => {
    const earlier = paths.slice(0, i)
    cost += pathLength(points) + BEND_COST * (points.length - 2) + CROSSING_COST * crossingsWith(points, earlier) +
      OVERLAP_COST * sharedLength(points, earlier) + NEAR_BOX_COST * pathHits(points, obstacles, OBSTACLE_PADDING)
  })
  return cost
}

function finishRoute(points: Point[]): RoutedEdge {
  const route = { d: '', mid: points[0], angle: 0, points, isPolyline: true as const }
  updateRouteMetadata(route)
  return route
}

function sameRect(a: EdgeEndpointRect, b: EdgeEndpointRect): boolean {
  return a === b || (a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height)
}

/** The obstacle set for one route: every box except the route's own two endpoints. */
function withoutEndpoints(
  obstacles: readonly EdgeEndpointRect[],
  source: EdgeEndpointRect,
  target: EdgeEndpointRect
): EdgeEndpointRect[] {
  return obstacles.filter(o => !sameRect(o, source) && !sameRect(o, target))
}

// ─── nudging ────────────────────────────────────────────────────────────────

interface SegmentRef {
  id: string
  segmentIndex: number
  lo: number
  hi: number
}

/**
 * Post-processes routed edges to spread overlapping collinear segments by applying perpendicular
 * offsets, so parallel segments from different routes stay visually distinct. Overlapping
 * segments on one line form a cluster that is fanned out symmetrically around the line,
 * `traceSpacing` apart, in one assignment — the earlier pairwise nudge accumulated ±8 px per
 * pair, so four routes sharing a lane pushed one of them 32 px, into the boxes the lane was
 * routed around. A shift is applied only if it keeps every port on its node side (a first or
 * last segment can slide along the side, never off it) and does not run the route into a box.
 */
function nudgeOverlappingSegments(
  routes: Map<string, RoutedEdge>,
  endpoints: Map<string, { source: EdgeEndpointRect; target: EdgeEndpointRect }>,
  obstacles: readonly EdgeEndpointRect[],
  traceSpacing: number = DEFAULT_TRACE_SPACING
): void {
  const horizontal = new Map<number, SegmentRef[]>()
  const vertical = new Map<number, SegmentRef[]>()

  for (const [id, route] of routes) {
    for (let i = 0; i < route.points.length - 1; i++) {
      const p1 = route.points[i]
      const p2 = route.points[i + 1]
      if (p1.x === p2.x && p1.y === p2.y) continue
      if (p1.y === p2.y) {
        const key = Math.round(p1.y)
        if (!horizontal.has(key)) horizontal.set(key, [])
        horizontal.get(key)!.push({ id, segmentIndex: i, lo: Math.min(p1.x, p2.x), hi: Math.max(p1.x, p2.x) })
      } else if (p1.x === p2.x) {
        const key = Math.round(p1.x)
        if (!vertical.has(key)) vertical.set(key, [])
        vertical.get(key)!.push({ id, segmentIndex: i, lo: Math.min(p1.y, p2.y), hi: Math.max(p1.y, p2.y) })
      }
    }
  }

  for (const [axis, groups] of [['y', horizontal], ['x', vertical]] as const) {
    for (const segments of groups.values()) {
      // Clusters of mutually overlapping intervals (connected components along the line).
      const sorted = [...segments].sort((a, b) => a.lo - b.lo || a.id.localeCompare(b.id))
      let cluster: SegmentRef[] = []
      let clusterHi = -Infinity
      const clusters: SegmentRef[][] = []
      for (const seg of sorted) {
        if (cluster.length > 0 && seg.lo < clusterHi) {
          cluster.push(seg)
          clusterHi = Math.max(clusterHi, seg.hi)
        } else {
          if (cluster.length > 1) clusters.push(cluster)
          cluster = [seg]
          clusterHi = seg.hi
        }
      }
      if (cluster.length > 1) clusters.push(cluster)

      for (const members of clusters) {
        // One slot per route (a route with two collinear segments here keeps one offset).
        const ids = [...new Set(members.map(m => m.id))]
        if (ids.length < 2) continue
        // A route whose slot would run it into a box or off a port takes the nearest free
        // slot instead (mirrored first, then further out), never one another route holds.
        const taken = new Set<number>()
        ids.forEach((id, slot) => {
          const delta = (slot - (ids.length - 1) / 2) * traceSpacing
          const route = routes.get(id)!
          const ends = endpoints.get(id)!
          const own = withoutEndpoints(obstacles, ends.source, ends.target)
          const options = [delta, -delta]
          for (let k = Math.ceil(ids.length / 2); k <= ids.length; k++) options.push(k * traceSpacing, -k * traceSpacing)
          for (const d of options) {
            if (taken.has(d)) continue
            if (d === 0) {
              taken.add(d)
              break
            }
            const segs = members.filter(m => m.id === id)
            if (!segs.every(seg => canShiftSegment(route, seg.segmentIndex, axis, d, ends))) continue
            let points = route.points
            for (const seg of segs) points = shiftedPoints(points, seg.segmentIndex, axis, d)
            if (pathHits(points, own, 0) > pathHits(route.points, own, 0)) continue
            route.points = points
            updateRouteMetadata(route)
            taken.add(d)
            break
          }
        })
      }
    }
  }
}

/** Whether shifting segment `index` of `route` by `delta` along `axis` keeps both ports on their node sides. */
function canShiftSegment(
  route: RoutedEdge,
  index: number,
  axis: 'x' | 'y',
  delta: number,
  ends: { source: EdgeEndpointRect; target: EdgeEndpointRect }
): boolean {
  const last = route.points.length - 2
  if (index === 0 && !portStaysOnSide(route.points[0], ends.source, axis, delta)) return false
  if (index === last && !portStaysOnSide(route.points[last + 1], ends.target, axis, delta)) return false
  return true
}

function portStaysOnSide(port: Point, rect: EdgeEndpointRect, axis: 'x' | 'y', delta: number): boolean {
  // A port on the left/right side may slide in y within the side; one on the top/bottom side
  // may slide in x. Sliding it in the other direction would take it off the box.
  const onVerticalSide = Math.abs(Math.abs(port.x - rect.x) - rect.width / 2) < 0.01
  const onHorizontalSide = Math.abs(Math.abs(port.y - rect.y) - rect.height / 2) < 0.01
  if (axis === 'y') {
    if (!onVerticalSide) return false
    return Math.abs(port.y + delta - rect.y) <= rect.height / 2 - PORT_CORNER_MARGIN
  }
  if (!onHorizontalSide) return false
  return Math.abs(port.x + delta - rect.x) <= rect.width / 2 - PORT_CORNER_MARGIN
}

function shiftedPoints(points: Point[], index: number, axis: 'x' | 'y', delta: number): Point[] {
  return points.map((p, k) => (k === index || k === index + 1 ? (axis === 'y' ? { x: p.x, y: p.y + delta } : { x: p.x + delta, y: p.y }) : p))
}

/**
 * Updates the path string and metadata (mid, angle) of a route after points have been modified.
 */
function updateRouteMetadata(route: RoutedEdge): void {
  route.d = pointsToPathString(route.points)
  route.mid = route.points[Math.floor(route.points.length / 2)]
  const n = route.points.length
  route.angle = n >= 2
    ? Math.atan2(route.points[n - 1].y - route.points[n - 2].y, route.points[n - 1].x - route.points[n - 2].x)
    : 0
}

// ─── path construction ──────────────────────────────────────────────────────

type Side = 'left' | 'right' | 'top' | 'bottom'

function portOn(rect: EdgeEndpointRect, side: Side): Point {
  switch (side) {
    case 'left': return { x: rect.x - rect.width / 2, y: rect.y }
    case 'right': return { x: rect.x + rect.width / 2, y: rect.y }
    case 'top': return { x: rect.x, y: rect.y - rect.height / 2 }
    case 'bottom': return { x: rect.x, y: rect.y + rect.height / 2 }
  }
}

function hSegmentIntersectsBox(x1: number, x2: number, y: number, box: EdgeEndpointRect, padding: number = 0): boolean {
  const boxLeft = box.x - box.width / 2 - padding
  const boxRight = box.x + box.width / 2 + padding
  const boxTop = box.y - box.height / 2 - padding
  const boxBottom = box.y + box.height / 2 + padding
  // Strict: a lane that runs exactly `padding` outside a box is clear of it.
  return y > boxTop && y < boxBottom && Math.min(x1, x2) < boxRight && Math.max(x1, x2) > boxLeft
}

function vSegmentIntersectsBox(x: number, y1: number, y2: number, box: EdgeEndpointRect, padding: number = 0): boolean {
  const boxLeft = box.x - box.width / 2 - padding
  const boxRight = box.x + box.width / 2 + padding
  const boxTop = box.y - box.height / 2 - padding
  const boxBottom = box.y + box.height / 2 + padding
  return x > boxLeft && x < boxRight && Math.min(y1, y2) < boxBottom && Math.max(y1, y2) > boxTop
}

/** Number of (segment, obstacle) pairs where a segment of the path crosses a padded obstacle box. */
function pathHits(points: Point[], obstacles: readonly EdgeEndpointRect[], padding: number): number {
  let hits = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (a.x === b.x && a.y === b.y) continue
    for (const obs of obstacles) {
      if (a.y === b.y ? hSegmentIntersectsBox(a.x, b.x, a.y, obs, padding) : vSegmentIntersectsBox(a.x, a.y, b.y, obs, padding)) hits++
    }
  }
  return hits
}

function dropDuplicatePoints(points: Point[]): Point[] {
  const out: Point[] = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (!last || last.x !== p.x || last.y !== p.y) out.push(p)
  }
  return out
}

/** A bend costs as much as this much extra route length (px) when candidates are ranked. */
const BEND_COST = 40

/** Crossing a route already drawn costs as much as this much extra route length (px). */
const CROSSING_COST = 250

/**
 * Hard clearance a candidate must keep from every box. Lanes past boxes are still placed
 * OBSTACLE_PADDING out; a lane through a gap between two boxes sits in its middle and only has
 * to clear this, so a 30-40 px gap (common between a page's fan and the next page) is usable.
 */
const MIN_CLEARANCE = 10

/** Each (segment, box) pair closer than OBSTACLE_PADDING (but clear of MIN_CLEARANCE) costs this. */
const NEAR_BOX_COST = 30

/** Parallel segments of different routes closer than this count as sharing a corridor. */
const SHARED_TOLERANCE = 8

/** Running along a route already drawn costs this much per px of shared length (on top of length). */
const OVERLAP_COST = 2

/** Shortest first and last leg of a bent route: a shorter stub reads as arriving at the box's corner. */
const MIN_STUB = 10

/** Gap lanes per axis that the three-bend combinations try, nearest the route first. */
const MAX_COMBO_LANES = 12

/** Drops repeated points and the middle point of three collinear ones. */
function simplifyPath(points: Point[]): Point[] {
  const out: Point[] = []
  for (const p of dropDuplicatePoints(points)) {
    const n = out.length
    if (n >= 2) {
      const a = out[n - 2]
      const b = out[n - 1]
      if ((a.x === b.x && b.x === p.x) || (a.y === b.y && b.y === p.y)) {
        out[n - 1] = p
        continue
      }
    }
    out.push(p)
  }
  return out
}

/** The side of `rect` a boundary point sits on. */
function sideOfPort(p: Point, rect: EdgeEndpointRect): Side {
  const dl = Math.abs(p.x - (rect.x - rect.width / 2))
  const dr = Math.abs(p.x - (rect.x + rect.width / 2))
  const dt = Math.abs(p.y - (rect.y - rect.height / 2))
  const db = Math.abs(p.y - (rect.y + rect.height / 2))
  const m = Math.min(dl, dr, dt, db)
  return m === dl ? 'left' : m === dr ? 'right' : m === dt ? 'top' : 'bottom'
}

/** Whether the path leaves its source and enters its target perpendicular to the port's side. */
function portsMatchPath(points: Point[], source: EdgeEndpointRect, target: EdgeEndpointRect): boolean {
  if (points.length < 2) return false
  const [a, b] = points
  const outward = (side: Side, from: Point, to: Point): boolean => {
    switch (side) {
      case 'left': return from.y === to.y && to.x < from.x
      case 'right': return from.y === to.y && to.x > from.x
      case 'top': return from.x === to.x && to.y < from.y
      case 'bottom': return from.x === to.x && to.y > from.y
    }
  }
  const y = points[points.length - 2]
  const z = points[points.length - 1]
  // Arriving at the target = leaving it backwards along the last segment.
  return outward(sideOfPort(a, source), a, b) && outward(sideOfPort(z, target), z, y)
}

/** Segments that run into the route's own endpoints (anything but the first leg into the source, the last into the target). */
function ownEndpointHits(points: Point[], source: EdgeEndpointRect, target: EdgeEndpointRect): number {
  let hits = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const boxes = [i > 0 ? source : null, i < points.length - 2 ? target : null]
    for (const box of boxes) {
      if (!box) continue
      if (a.y === b.y ? hSegmentIntersectsBox(a.x, b.x, a.y, box) : vSegmentIntersectsBox(a.x, a.y, b.y, box)) hits++
    }
  }
  return hits
}

/** Whether a bent route's first and last legs are at least MIN_STUB long. */
function stubsLongEnough(points: Point[]): boolean {
  if (points.length <= 2) return true
  const leg = (a: Point, b: Point) => Math.abs(b.x - a.x) + Math.abs(b.y - a.y)
  const n = points.length
  return leg(points[0], points[1]) >= MIN_STUB && leg(points[n - 2], points[n - 1]) >= MIN_STUB
}

/** Length a path shares with routes already drawn (parallel, overlapping segments within SHARED_TOLERANCE). */
function sharedLength(points: Point[], drawn: readonly Point[][]): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    for (const other of drawn) {
      for (let k = 0; k < other.length - 1; k++) {
        const c = other[k]
        const d = other[k + 1]
        if (a.y === b.y && c.y === d.y && Math.abs(a.y - c.y) < SHARED_TOLERANCE) {
          total += Math.max(0, Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) - Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)))
        } else if (a.x === b.x && c.x === d.x && Math.abs(a.x - c.x) < SHARED_TOLERANCE) {
          total += Math.max(0, Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) - Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)))
        }
      }
    }
  }
  return total
}

/** Proper crossings between an axis-parallel path and routes already drawn. */
function crossingsWith(points: Point[], drawn: readonly Point[][]): number {
  let count = 0
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    for (const other of drawn) {
      for (let k = 0; k < other.length - 1; k++) {
        const c = other[k]
        const d = other[k + 1]
        const h1 = a.y === b.y
        const h2 = c.y === d.y
        if (h1 === h2) continue
        const [h, hEnd, v, vEnd] = h1 ? [a, b, c, d] : [c, d, a, b]
        if (
          v.x > Math.min(h.x, hEnd.x) && v.x < Math.max(h.x, hEnd.x) &&
          h.y > Math.min(v.y, vEnd.y) && h.y < Math.max(v.y, vEnd.y)
        ) count++
      }
    }
  }
  return count
}

function pathLength(points: Point[]): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) total += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y)
  return total
}

/**
 * Lane coordinates along `axis` through the free space between `boxes` (each padded): the
 * middle of every gap between merged box intervals, plus just outside the outermost ones. Only
 * boxes whose extent on the other axis overlaps [lo, hi] — the run the lane connects across —
 * count, so the gaps of one row are not closed by the boxes of another.
 */
function gapLanes(axis: 'x' | 'y', boxes: readonly EdgeEndpointRect[], lo: number, hi: number, padding: number): number[] {
  const size = (b: EdgeEndpointRect) => (axis === 'x' ? b.width : b.height)
  const crossSize = (b: EdgeEndpointRect) => (axis === 'x' ? b.height : b.width)
  const cross = (b: EdgeEndpointRect) => (axis === 'x' ? b.y : b.x)
  const intervals = boxes
    .filter(b => cross(b) + crossSize(b) / 2 > lo && cross(b) - crossSize(b) / 2 < hi)
    .map(b => [b[axis] - size(b) / 2 - padding, b[axis] + size(b) / 2 + padding] as [number, number])
    .sort((p, q) => p[0] - q[0])
  if (intervals.length === 0) return []
  const merged: Array<[number, number]> = []
  for (const iv of intervals) {
    const last = merged[merged.length - 1]
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1])
    else merged.push([iv[0], iv[1]])
  }
  const lanes = [merged[0][0], merged[merged.length - 1][1]]
  for (let i = 0; i < merged.length - 1; i++) lanes.push((merged[i][1] + merged[i + 1][0]) / 2)
  return lanes
}

/**
 * Builds the orthogonal path between two boxes. Candidates: the direct runs and both L shapes;
 * one-lane detours (down/up to a horizontal lane and across, or out sideways to a vertical lane
 * and along) on lanes past the blocking boxes, past everything, and through the free gaps
 * between boxes; and three-bend combinations of a horizontal and a vertical lane. Every
 * candidate's ports match the direction the path leaves and arrives in, and its segments are
 * checked against the obstacles (MIN_CLEARANCE) and against its own two endpoints.
 *
 * A bent candidate whose first or last leg is shorter than MIN_STUB is dropped (it reads as
 * arriving at the box's corner). Among the clear candidates the cheapest wins: length +
 * BEND_COST per bend + CROSSING_COST per crossing with a route already drawn (`drawn`) +
 * OVERLAP_COST per px run along one + NEAR_BOX_COST per box passed closer than OBSTACLE_PADDING. If none is clear, the one crossing the fewest
 * boxes. Before 2026-11-04 the first clear candidate won and lanes existed only at the
 * extremes of the obstacles, so a route whose straight run was blocked by one box in a row of
 * boxes went around the whole drawing even when a gap in that row was free (heimdall test page:
 * Dashboard → Settings, directly below it, ran out to the canvas's left edge and back).
 */
function buildOrthogonalPath(
  source: EdgeEndpointRect,
  target: EdgeEndpointRect,
  obstacles: readonly EdgeEndpointRect[],
  drawn: readonly Point[][] = []
): Point[] {
  const padding = OBSTACLE_PADDING
  const dx = target.x - source.x
  const dy = target.y - source.y
  const hSide = (from: Point | EdgeEndpointRect, to: Point | EdgeEndpointRect): Side => (to.x >= from.x ? 'right' : 'left')
  const vSide = (from: Point | EdgeEndpointRect, to: Point | EdgeEndpointRect): Side => (to.y >= from.y ? 'bottom' : 'top')
  const opposite = (side: Side): Side => ({ left: 'right', right: 'left', top: 'bottom', bottom: 'top' } as const)[side]

  if (dx === 0 && dy === 0) {
    return [portOn(source, 'right'), portOn(target, 'right')]
  }

  const candidates: Point[][] = []

  // Direct connections: same row or column.
  if (dy === 0) candidates.push([portOn(source, hSide(source, target)), portOn(target, opposite(hSide(source, target)))])
  if (dx === 0) candidates.push([portOn(source, vSide(source, target)), portOn(target, opposite(vSide(source, target)))])

  if (dx !== 0 && dy !== 0) {
    // Horizontal-first L: leave sideways, arrive from above/below.
    const exitH = portOn(source, hSide(source, target))
    const entryV = portOn(target, opposite(vSide(source, target)))
    candidates.push([exitH, { x: entryV.x, y: exitH.y }, entryV])
    // Vertical-first L: leave up/down, arrive sideways.
    const exitV = portOn(source, vSide(source, target))
    const entryH = portOn(target, opposite(hSide(source, target)))
    candidates.push([exitV, { x: exitV.x, y: entryH.y }, entryH])
  }

  // Lanes just outside a set of boxes: above/below, left/right.
  const hLanes = (boxes: readonly EdgeEndpointRect[]): number[] => {
    if (boxes.length === 0) return []
    const above = Math.min(...boxes.map(o => o.y - o.height / 2)) - padding
    const below = Math.max(...boxes.map(o => o.y + o.height / 2)) + padding
    return [above, below]
  }
  const vLanes = (boxes: readonly EdgeEndpointRect[]): number[] => {
    if (boxes.length === 0) return []
    const left = Math.min(...boxes.map(o => o.x - o.width / 2)) - padding
    const right = Math.max(...boxes.map(o => o.x + o.width / 2)) + padding
    return [left, right]
  }
  const hLanePath = (laneY: number): Point[] => {
    const exit = portOn(source, vSide(source, { x: source.x, y: laneY }))
    const entry = portOn(target, vSide(target, { x: target.x, y: laneY }))
    return [exit, { x: exit.x, y: laneY }, { x: entry.x, y: laneY }, entry]
  }
  const vLanePath = (laneX: number): Point[] => {
    const exit = portOn(source, hSide(source, { x: laneX, y: source.y }))
    const entry = portOn(target, hSide(target, { x: laneX, y: target.y }))
    return [exit, { x: laneX, y: exit.y }, { x: laneX, y: entry.y }, entry]
  }

  // Lanes past the boxes that block the direct horizontal / vertical run, past everything, and
  // through the gaps between the boxes the lane's own run passes (sources and targets included).
  const sourceExitH = portOn(source, hSide(source, target))
  const onHRun = obstacles.filter(o => hSegmentIntersectsBox(sourceExitH.x, target.x, source.y, o, padding))
  const sourceExitV = portOn(source, vSide(source, target))
  const onVRun = obstacles.filter(o => vSegmentIntersectsBox(source.x, sourceExitV.y, target.y, o, padding))
  const everything = [...obstacles, source, target]
  const xLo = Math.min(source.x, target.x)
  const xHi = Math.max(source.x, target.x)
  const yLo = Math.min(source.y, target.y)
  const yHi = Math.max(source.y, target.y)
  const byDistance = (centre: number) => (a: number, b: number) => Math.abs(a - centre) - Math.abs(b - centre) || a - b
  const laneYs = [...new Set([...hLanes(onHRun), ...hLanes(obstacles), ...gapLanes('y', everything, xLo, xHi, MIN_CLEARANCE)])]
    .sort(byDistance((source.y + target.y) / 2))
  const laneXs = [...new Set([...vLanes(onVRun), ...vLanes(obstacles), ...gapLanes('x', everything, yLo, yHi, MIN_CLEARANCE)])]
    .sort(byDistance((source.x + target.x) / 2))
  for (const laneY of laneYs) candidates.push(hLanePath(laneY))
  for (const laneX of laneXs) candidates.push(vLanePath(laneX))

  // The same one-lane detours leaving / entering the top or bottom side off-centre, at a gap
  // lane inside the box's span, so the first or last leg can drop straight through a gap of
  // the row next to it instead of from the side's middle into a box.
  // Also one trace spacing either side of the centre, so a second route into the same side can
  // arrive beside the first instead of sharing its corridor.
  const offCentre = (rect: EdgeEndpointRect) =>
    [...new Set([...laneXs, rect.x - DEFAULT_TRACE_SPACING, rect.x + DEFAULT_TRACE_SPACING])]
      .filter(x => x > rect.x - rect.width / 2 + MIN_STUB && x < rect.x + rect.width / 2 - MIN_STUB && x !== rect.x)
  const sourceXs = [source.x, ...offCentre(source)]
  const targetXs = [target.x, ...offCentre(target)]
  for (const laneY of laneYs) {
    const exitY = portOn(source, vSide(source, { x: source.x, y: laneY })).y
    const entryY = portOn(target, vSide(target, { x: target.x, y: laneY })).y
    for (const ex of sourceXs) {
      for (const tx of targetXs) {
        if (ex === source.x && tx === target.x) continue
        candidates.push([{ x: ex, y: exitY }, { x: ex, y: laneY }, { x: tx, y: laneY }, { x: tx, y: entryY }])
      }
    }
  }

  // Straight shots off-centre: when the two boxes overlap in x (or y), a straight vertical (or
  // horizontal) run anywhere in the shared span, through a gap of the boxes between them. The
  // centre-to-centre run above only exists when the centres line up (heimdall test page:
  // Dashboard and Settings overlap by 70 px, and a gap in the row between them sits inside it).
  const sharedSpan = (lo1: number, hi1: number, lo2: number, hi2: number) => [Math.max(lo1, lo2) + MIN_STUB, Math.min(hi1, hi2) - MIN_STUB]
  const [sxLo, sxHi] = sharedSpan(source.x - source.width / 2, source.x + source.width / 2, target.x - target.width / 2, target.x + target.width / 2)
  if (sxLo <= sxHi && dy !== 0) {
    const fromY = source.y + Math.sign(dy) * source.height / 2
    const toY = target.y - Math.sign(dy) * target.height / 2
    const between = obstacles.filter(o => o.y > Math.min(source.y, target.y) && o.y < Math.max(source.y, target.y))
    for (const x of [...gapLanes('x', between, Math.min(fromY, toY), Math.max(fromY, toY), MIN_CLEARANCE), (sxLo + sxHi) / 2]) {
      if (x >= sxLo && x <= sxHi) candidates.push([{ x, y: fromY }, { x, y: toY }])
    }
  }
  const [syLo, syHi] = sharedSpan(source.y - source.height / 2, source.y + source.height / 2, target.y - target.height / 2, target.y + target.height / 2)
  if (syLo <= syHi && dx !== 0) {
    const fromX = source.x + Math.sign(dx) * source.width / 2
    const toX = target.x - Math.sign(dx) * target.width / 2
    const between = obstacles.filter(o => o.x > Math.min(source.x, target.x) && o.x < Math.max(source.x, target.x))
    for (const y of [...gapLanes('y', between, Math.min(fromX, toX), Math.max(fromX, toX), MIN_CLEARANCE), (syLo + syHi) / 2]) {
      if (y >= syLo && y <= syHi) candidates.push([{ x: fromX, y }, { x: toX, y }])
    }
  }

  // Three-bend combinations of a horizontal and a vertical lane, for the case no single lane
  // clears (e.g. a target directly below another box, reached from a source whose row is full):
  // up/down to the lane, across to the vertical lane, down/up to the target's row, and in from
  // the side — or the mirrored order.
  for (const laneY of laneYs.slice(0, MAX_COMBO_LANES)) {
    for (const laneX of laneXs.slice(0, MAX_COMBO_LANES)) {
      const exitV = portOn(source, vSide(source, { x: source.x, y: laneY }))
      const entryH = portOn(target, hSide(target, { x: laneX, y: target.y }))
      candidates.push([exitV, { x: exitV.x, y: laneY }, { x: laneX, y: laneY }, { x: laneX, y: entryH.y }, entryH])
      const exitH = portOn(source, hSide(source, { x: laneX, y: source.y }))
      const entryV = portOn(target, vSide(target, { x: target.x, y: laneY }))
      candidates.push([exitH, { x: laneX, y: exitH.y }, { x: laneX, y: laneY }, { x: entryV.x, y: laneY }, entryV])
    }
  }

  let best: Point[] | null = null
  let bestHits = Infinity
  let bestCost = Infinity
  for (const candidate of candidates) {
    const points = simplifyPath(candidate)
    if (points.length < 2 || !portsMatchPath(points, source, target) || !stubsLongEnough(points)) continue
    const hits = pathHits(points, obstacles, MIN_CLEARANCE) + ownEndpointHits(points, source, target)
    if (hits > bestHits) continue
    const cost = pathLength(points) + BEND_COST * (points.length - 2) + CROSSING_COST * crossingsWith(points, drawn) +
      OVERLAP_COST * sharedLength(points, drawn) + NEAR_BOX_COST * pathHits(points, obstacles, padding)
    if (hits < bestHits || cost < bestCost) {
      best = points
      bestHits = hits
      bestCost = cost
    }
  }
  return best ?? [portOn(source, 'right'), portOn(target, 'left')]
}

function pointsToPathString(points: Point[]): string {
  if (points.length === 0) return ''
  const parts = [
    `M ${Math.round(points[0].x)} ${Math.round(points[0].y)}`,
    ...points.slice(1).map(p => `L ${Math.round(p.x)} ${Math.round(p.y)}`),
  ]
  return parts.join(' ')
}
