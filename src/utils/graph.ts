export interface Point {
  x: number
  y: number
}

export interface BezierPathResult {
  d: string
  mid: Point
  angle: number
  /** Control polygon behind `d` — [p1, c, p2] for a quadratic curve, [p1, c1, c2, p2] for a
   *  cubic one. Lets a caller sample the curve at points other than t=0.5 (see
   *  findClearLabelPosition) without reparsing the path string. */
  points: Point[]
}

/** Accessible name for an edge: "<label>: <source> to <target>", or "<source> to <target>"
 *  without a label. Endpoint names are node labels, falling back to ids when there's none, so
 *  screen readers don't announce opaque ids (UUIDs) when a readable label exists. */
export function edgeAccessibleName(
  label: string | undefined,
  sourceName: string,
  targetName: string,
): string {
  const endpoints = `${sourceName} to ${targetName}`
  return label ? `${label}: ${endpoints}` : endpoints
}

export function rectEdgePoint(cx: number, cy: number, w: number, h: number, tx: number, ty: number): Point {
  const dx = tx - cx
  const dy = ty - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  const hw = w / 2
  const hh = h / 2

  if (adx * hh > ady * hw) {
    const sign = dx > 0 ? 1 : -1
    return { x: cx + sign * hw, y: cy + (dy * hw) / adx }
  } else {
    const sign = dy > 0 ? 1 : -1
    return { x: cx + (dx * hh) / ady, y: cy + sign * hh }
  }
}

export interface BoundingBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Grows `bbox` so it also covers every circle (center `x`/`y`, radius `r`). Used to fit cluster
 * boundaries and hierarchy rings, which can reach well past the nodes they enclose. Returns
 * `bbox` itself when there are no circles.
 */
export function extendBoundingBoxByCircles(
  bbox: BoundingBox,
  circles: Iterable<{ x: number; y: number; r: number }>
): BoundingBox {
  let { minX, maxX, minY, maxY } = bbox
  let grew = false
  for (const c of circles) {
    if (!Number.isFinite(c.x) || !Number.isFinite(c.y) || !Number.isFinite(c.r)) continue
    minX = Math.min(minX, c.x - c.r)
    maxX = Math.max(maxX, c.x + c.r)
    minY = Math.min(minY, c.y - c.r)
    maxY = Math.max(maxY, c.y + c.r)
    grew = true
  }
  return grew ? { minX, maxX, minY, maxY } : bbox
}

export interface FitViewportResult {
  zoom: number
  panX: number
  panY: number
}

/** Computes the zoom/pan needed to fit `bbox` within a container, centered, clamped to [minZoom, maxZoom]. */
export function computeFitViewport(
  bbox: BoundingBox,
  containerWidth: number,
  containerHeight: number,
  padding: number,
  minZoom: number,
  maxZoom: number
): FitViewportResult {
  const bbW = bbox.maxX - bbox.minX
  const bbH = bbox.maxY - bbox.minY
  const zoom = Math.min(
    maxZoom,
    Math.max(
      minZoom,
      Math.min((containerWidth - 2 * padding) / (bbW || 1), (containerHeight - 2 * padding) / (bbH || 1))
    )
  )
  const centroidX = (bbox.minX + bbox.maxX) / 2
  const centroidY = (bbox.minY + bbox.maxY) / 2
  return {
    zoom,
    panX: containerWidth / 2 - centroidX * zoom,
    panY: containerHeight / 2 - centroidY * zoom,
  }
}

export const DEFAULT_QUADRATIC_CURVATURE = 0.22

export function bezierPath(p1: Point, p2: Point, curvature: number = DEFAULT_QUADRATIC_CURVATURE): BezierPathResult {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.hypot(dx, dy)

  const nx = -dy / (dist || 1)
  const ny = dx / (dist || 1)
  const offset = Math.min(80, dist * curvature)

  const mx = (p1.x + p2.x) / 2 + nx * offset
  const my = (p1.y + p2.y) / 2 + ny * offset

  return {
    d: `M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`,
    mid: { x: (p1.x + 2 * mx + p2.x) / 4, y: (p1.y + 2 * my + p2.y) / 4 },
    angle: Math.atan2(p2.y - my, p2.x - mx),
    points: [p1, { x: mx, y: my }, p2],
  }
}

export type EdgeAnchor = 'auto' | 'left' | 'right' | 'top' | 'bottom'

const ANCHOR_DIRECTION: Record<Exclude<EdgeAnchor, 'auto'>, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
}

/**
 * The outward-facing direction of whichever side of the rectangle rectEdgePoint would put the
 * point on for the same (cx, cy, w, h, tx, ty) — i.e. the tangent a bezier control point should
 * project along so it approaches from the side the point is actually on, rather than a generic
 * line-of-sight offset that can disagree with it.
 *
 * This matters specifically for a mixed anchor pair (one fixed, one 'auto'): cubicBezierPath,
 * given only the resolved points, has no way to know which rectangle side an 'auto' point landed
 * on and falls back to offsetting perpendicular to the straight line between the two points. When
 * that guessed direction doesn't match the side rectEdgePoint actually chose, the curve's tangent
 * at that endpoint fights its way onto the correct side, producing a visible curl right at the
 * node instead of a clean approach. computeEdgePath uses this to give the 'auto' side its real
 * direction instead of relying on that fallback.
 */
export function rectEdgeDirection(cx: number, cy: number, w: number, h: number, tx: number, ty: number): Point {
  const dx = tx - cx
  const dy = ty - cy
  if (dx === 0 && dy === 0) return { x: 0, y: 0 }

  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  const hw = w / 2
  const hh = h / 2

  if (adx * hh > ady * hw) {
    return { x: dx > 0 ? 1 : -1, y: 0 }
  } else {
    return { x: 0, y: dy > 0 ? 1 : -1 }
  }
}

/**
 * Endpoint on a node's rectangle. For a fixed anchor, the midpoint of that side regardless
 * of (tx, ty). For 'auto', the perimeter point facing (tx, ty), i.e. rectEdgePoint.
 */
export function anchoredEdgePoint(cx: number, cy: number, w: number, h: number, anchor: EdgeAnchor, tx: number, ty: number): Point {
  switch (anchor) {
    case 'left':
      return { x: cx - w / 2, y: cy }
    case 'right':
      return { x: cx + w / 2, y: cy }
    case 'top':
      return { x: cx, y: cy - h / 2 }
    case 'bottom':
      return { x: cx, y: cy + h / 2 }
    default:
      return rectEdgePoint(cx, cy, w, h, tx, ty)
  }
}

function endpointFor(rect: EdgeEndpointRect, anchor: EdgeAnchor, tx: number, ty: number): Point {
  if (anchor === 'auto' && rect.radius !== undefined && rect.radius > 0) {
    const dx = tx - rect.x
    const dy = ty - rect.y
    const d = Math.hypot(dx, dy)
    if (d === 0) return { x: rect.x, y: rect.y }
    return { x: rect.x + (dx / d) * rect.radius, y: rect.y + (dy / d) * rect.radius }
  }
  return anchoredEdgePoint(rect.x, rect.y, rect.width, rect.height, anchor, tx, ty)
}

export const DEFAULT_CUBIC_CURVATURE = 0.22

/**
 * Cubic bezier whose control points project outward from each endpoint's anchor direction
 * (or, for 'auto', the perpendicular offset used by bezierPath). Midpoint and tangent angle
 * are found via De Casteljau subdivision at t=0.5 rather than approximated from the control points.
 *
 * sourceDirection/targetDirection override the anchor-derived direction for that endpoint —
 * computeEdgePath passes rectEdgeDirection's result here for an 'auto' side paired with a fixed
 * one, so its tangent matches the rectangle side the point is actually on. Called without them
 * (e.g. directly, with only points and no rectangle to derive a better direction from), 'auto'
 * still falls back to the perpendicular-of-line-of-sight offset, same as always.
 */
export function cubicBezierPath(
  p1: Point,
  p2: Point,
  sourceAnchor: EdgeAnchor = 'auto',
  targetAnchor: EdgeAnchor = 'auto',
  curvature: number = DEFAULT_CUBIC_CURVATURE,
  sourceDirection?: Point,
  targetDirection?: Point
): BezierPathResult {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.hypot(dx, dy) || 1
  const offset = Math.min(120, dist * curvature)

  const nx = -dy / dist
  const ny = dx / dist

  const dir1 = sourceDirection ?? (sourceAnchor === 'auto' ? { x: nx, y: ny } : ANCHOR_DIRECTION[sourceAnchor])
  const dir2 = targetDirection ?? (targetAnchor === 'auto' ? { x: nx, y: ny } : ANCHOR_DIRECTION[targetAnchor])

  const c1 = { x: p1.x + dir1.x * offset, y: p1.y + dir1.y * offset }
  const c2 = { x: p2.x + dir2.x * offset, y: p2.y + dir2.y * offset }

  // De Casteljau subdivision at t=0.5: exact midpoint and tangent, not a control-point approximation.
  const q0 = { x: (p1.x + c1.x) / 2, y: (p1.y + c1.y) / 2 }
  const q1 = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 }
  const q2 = { x: (c2.x + p2.x) / 2, y: (c2.y + p2.y) / 2 }
  const r0 = { x: (q0.x + q1.x) / 2, y: (q0.y + q1.y) / 2 }
  const r1 = { x: (q1.x + q2.x) / 2, y: (q1.y + q2.y) / 2 }
  const mid = { x: (r0.x + r1.x) / 2, y: (r0.y + r1.y) / 2 }

  return {
    d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`,
    mid,
    angle: Math.atan2(r1.y - r0.y, r1.x - r0.x),
    points: [p1, c1, c2, p2],
  }
}

export interface EdgeEndpointRect {
  x: number
  y: number
  width: number
  height: number
  /** Set for a round body (galaxy's default node): an 'auto' endpoint sits on the circle, not on
   *  the bounding box — box corners stick out past the circle, so two close round bodies left a
   *  diagonal edge almost no visible line. */
  radius?: number
}

export interface EdgePathOptions {
  sourceAnchor?: EdgeAnchor
  targetAnchor?: EdgeAnchor
  curvature?: number
}

/**
 * Resolves the full path between two node rectangles, choosing a quadratic bezier when both
 * anchors are 'auto' (today's center-facing behavior) or a cubic bezier when either is fixed.
 */
export function computeEdgePath(source: EdgeEndpointRect, target: EdgeEndpointRect, options: EdgePathOptions = {}): BezierPathResult {
  const sourceAnchor = options.sourceAnchor ?? 'auto'
  const targetAnchor = options.targetAnchor ?? 'auto'

  const sp = endpointFor(source, sourceAnchor, target.x, target.y)
  const tp = endpointFor(target, targetAnchor, source.x, source.y)

  if (sourceAnchor === 'auto' && targetAnchor === 'auto') {
    return bezierPath(sp, tp, options.curvature ?? DEFAULT_QUADRATIC_CURVATURE)
  }

  // Give an 'auto' side its real rectangle-side direction rather than letting cubicBezierPath
  // fall back to guessing from the straight line between the two points — see rectEdgeDirection.
  const sourceDirection = sourceAnchor === 'auto'
    ? rectEdgeDirection(source.x, source.y, source.width, source.height, target.x, target.y)
    : undefined
  const targetDirection = targetAnchor === 'auto'
    ? rectEdgeDirection(target.x, target.y, target.width, target.height, source.x, source.y)
    : undefined

  return cubicBezierPath(sp, tp, sourceAnchor, targetAnchor, options.curvature ?? DEFAULT_CUBIC_CURVATURE, sourceDirection, targetDirection)
}

// ─── Edge label placement ──────────────────────────────────────────────────

const LABEL_CHAR_WIDTH = 6.6
const LABEL_PADDING_X = 14
const LABEL_HEIGHT = 18

/** The rendered footprint of an edge label pill — same sizing GraphEdgeShape draws, reused here
 *  so collision-avoidance checks against the exact box that will actually be on screen. */
export function edgeLabelSize(label: string): { width: number; height: number } {
  return { width: label.length * LABEL_CHAR_WIDTH + LABEL_PADDING_X, height: LABEL_HEIGHT }
}

function quadraticPointAt(p1: Point, c: Point, p2: Point, t: number): Point {
  const mt = 1 - t
  return {
    x: mt * mt * p1.x + 2 * mt * t * c.x + t * t * p2.x,
    y: mt * mt * p1.y + 2 * mt * t * c.y + t * t * p2.y,
  }
}

function cubicPointAt(p1: Point, c1: Point, c2: Point, p2: Point, t: number): Point {
  const mt = 1 - t
  return {
    x: mt * mt * mt * p1.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p2.x,
    y: mt * mt * mt * p1.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p2.y,
  }
}

function polylinePointAt(points: readonly Point[], t: number): Point {
  const totalLength = points.length - 1
  const segmentIndex = Math.floor(t * totalLength)
  const localT = (t * totalLength) - segmentIndex

  const p1 = points[Math.min(segmentIndex, points.length - 1)]
  const p2 = points[Math.min(segmentIndex + 1, points.length - 1)]

  return {
    x: p1.x + (p2.x - p1.x) * localT,
    y: p1.y + (p2.y - p1.y) * localT,
  }
}

// Tried in order, starting at the curve's true midpoint and stepping outward toward each
// endpoint — the first candidate whose label footprint clears every obstacle wins, so the label
// stays as close to the visual middle of the edge as the nearby nodes allow.
const LABEL_CANDIDATE_TS = [0.5, 0.38, 0.62, 0.26, 0.74, 0.15, 0.85]

/** A point at parameter t ∈ [0, 1] along an edge path given as `computeEdgePath`/`RoutedEdge`
 *  points: a polyline when `isPolyline`, else a quadratic (3 points) or cubic (4) control polygon. */
export function edgePathSampler(points: readonly Point[], isPolyline?: boolean): (t: number) => Point {
  return isPolyline
    ? (t: number) => polylinePointAt(points, t)
    : points.length === 4
    ? (t: number) => cubicPointAt(points[0], points[1], points[2], points[3], t)
    : (t: number) => quadraticPointAt(points[0], points[1], points[2], t)
}

/** findClearLabelPosition's samples, in its order: the candidates a single edge's label tries. */
export const EDGE_LABEL_TS: readonly number[] = LABEL_CANDIDATE_TS

/** Extra positions a label may move to when it collides with another label or a node (only then:
 *  a label that is already clear never moves). Finer steps between findClearLabelPosition's. */
export const EDGE_LABEL_REPAIR_TS: readonly number[] = [0.44, 0.56, 0.32, 0.68, 0.2, 0.8, 0.1, 0.9]

/**
 * Where to center an edge label so it clears every node in `obstacles` by `margin` px, without
 * moving the edge or any node — just samples a handful of points along the path `points` already
 * describes and picks the first that's clear. Falls back to the path's exact midpoint (t=0.5)
 * if every candidate collides; occasionally sitting a label over a node beats a more complex
 * routing/repositioning scheme for what's meant to stay "just that".
 *
 * Handles both bezier control polygons (3-4 points) and orthogonal polylines (3+ points).
 * Polylines use linear interpolation; bezier paths use curve functions.
 * @param isPolyline - If true, treats points as an orthogonal polyline (linear sampling).
 *                     If false/undefined, interprets based on point count (3=quadratic, 4=cubic).
 */
export function findClearLabelPosition(
  points: readonly Point[],
  size: { width: number; height: number },
  obstacles: readonly EdgeEndpointRect[],
  margin: number = 6,
  isPolyline?: boolean
): Point {
  const sampleAt = edgePathSampler(points, isPolyline)

  const halfW = size.width / 2 + margin
  const halfH = size.height / 2 + margin

  for (const t of LABEL_CANDIDATE_TS) {
    const p = sampleAt(t)
    const clear = obstacles.every(o => {
      const oHalfW = o.width / 2
      const oHalfH = o.height / 2
      return Math.abs(p.x - o.x) >= halfW + oHalfW || Math.abs(p.y - o.y) >= halfH + oHalfH
    })
    if (clear) return p
  }
  return sampleAt(0.5)
}

// ─── Joint edge label placement ────────────────────────────────────────────

/** One edge label to place: its pill size, the points along its own edge it may sit at (most
 *  preferred first), and where it sits when none of them clears the nodes. */
export interface EdgeLabelRequest {
  id: string
  size: { width: number; height: number }
  /** Tried in order for the label's own spot: the first clear of every node wins, exactly as
   *  findClearLabelPosition (or a route's label anchors) would choose for this edge alone. */
  candidates: readonly Point[]
  /** Where the label sits when no candidate clears the nodes (findClearLabelPosition: the midpoint). */
  fallback: Point
  /** More points along the same edge, tried only to resolve a collision. */
  alternatives?: readonly Point[]
  /** The label's own edge as a polyline (a bezier sampled). With it, the placement can tell when
   *  another labelled edge runs parallel to this one closer than the pill (a "parallel track"),
   *  and can offer a spot beside this edge's line, on the side away from the other track. */
  path?: readonly Point[]
}

export interface PlaceEdgeLabelsJointlyOptions {
  /** Clearance kept between a label and a node box, px (EDGE_LABEL_MARGIN). Default 6. */
  margin?: number
  /** Clearance kept between two labels, px. Default 2. */
  gap?: number
  /** Repair rounds over the colliding labels; 0 places each label as if alone. Default 8. */
  maxRounds?: number
  /** Repair work limit, in box-against-box tests; past it, labels keep where they are. Default
   *  300 000 (a few ms), so a hub with hundreds of labelled spokes cannot stall a frame. */
  maxWork?: number
  /** Labels already drawn that this placement must not move (GraphCanvas: the resting labels,
   *  when placing the labels a hover or selection reveals). They count as labels to avoid, but a
   *  placed label may still end over one; they are never moved, marked or returned. */
  fixedLabels?: readonly EdgeEndpointRect[]
  /** Mark a label `noRoom` when, after the repair, it still overlaps a node box or another label
   *  by more than `tolerance` on both axes. Of two overlapping labels the earlier keeps its spot.
   *  GraphCanvas hides such labels at rest and shows them on focus. Default false. */
  markNoRoom?: boolean
  /** Overlap, px, up to which a touch is not a collision for `markNoRoom` (the label checks'
   *  1 px). Default 1. */
  tolerance?: number
  /** Space between a pill offset beside its line and that line, px. Default 3. */
  trackGap?: number
}

/** Where a label goes. `noRoom`: it has no spot clear of the nodes and the other labels (only with
 *  `markNoRoom`). `offset`: it sits beside its own line, off a parallel labelled track. */
export interface PlacedEdgeLabel extends Point {
  noRoom?: true
  offset?: true
}

/** A spot's overlap, compared in order: how many node boxes the label covers (each hides a card's
 *  name), how many other labels it covers, how many parallel labelled tracks other than its own it
 *  lies across (it is then unclear which line it names), then the areas covered (nodes, labels),
 *  then intrusion into the clearance bands only. Counts come first so a move never adds a
 *  collision to shrink another one: a label never trades a stack for a spot over a card, nor the
 *  reverse. */
type LabelCost = [nodeHits: number, labelHits: number, trackHits: number, nodeArea: number, labelArea: number, band: number]
const lessCost = (a: LabelCost, b: LabelCost) => {
  for (let k = 0; k < a.length; k++) {
    if (a[k] < b[k] - 1e-9) return true
    if (a[k] > b[k] + 1e-9) return false
  }
  return false
}
const isZero = (c: LabelCost) => c.every((v) => v === 0)

/** Two segments closer to parallel than this (sine of the angle, ~10 degrees) are parallel tracks. */
const TRACK_PARALLEL_SIN = 0.17

/** Whether segment a-b crosses the box [x0, x1] x [y0, y1] (Liang-Barsky clip). */
function segmentCrossesBox(ax: number, ay: number, bx: number, by: number, x0: number, y0: number, x1: number, y1: number): boolean {
  let t0 = 0, t1 = 1
  const dx = bx - ax, dy = by - ay
  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0
    const r = q / p
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r }
    else { if (r < t0) return false; if (r < t1) t1 = r }
    return true
  }
  return clip(-dx, ax - x0) && clip(dx, x1 - ax) && clip(-dy, ay - y0) && clip(dy, y1 - ay) && t0 <= t1
}

/**
 * Places every edge label at once so labels stay clear of each other as well as of the nodes.
 *
 * 1. Each label first takes the spot it would take alone (the first candidate clear of every node by
 *    `margin`, else `fallback`), so a graph without collisions renders exactly as before.
 * 2. Repair: a label that overlaps another label (closer than `gap`) or a node (closer than
 *    `margin`), or lies across another labelled edge running parallel to its own (a parallel
 *    track, needs `path`), moves to whichever of its spots has the least overlap, compared in order:
 *    node boxes covered, other labels covered, parallel tracks crossed, then those areas, then
 *    clearance-band intrusion (see LabelCost; a move never adds a collision), preferring earlier
 *    spots on ties. Its spots: its candidates and alternatives along its own line, then, where a
 *    parallel labelled track crowds a spot from one side, that spot moved beside its own line on
 *    the other side. Rounds repeat over the labels still colliding until nothing moves or `maxWork`
 *    is spent. Labels that never collide are never moved.
 * 3. With `markNoRoom`, a label still over a node or another label is marked `noRoom` (the caller
 *    decides whether to draw it).
 *
 * Pure and deterministic (input order breaks ties). Returns id -> where the label's centre goes.
 */
export function placeEdgeLabelsJointly(
  requests: readonly EdgeLabelRequest[],
  obstacles: readonly EdgeEndpointRect[],
  options: PlaceEdgeLabelsJointlyOptions = {},
): Map<string, PlacedEdgeLabel> {
  const margin = options.margin ?? 6
  const gap = options.gap ?? 2
  const maxRounds = options.maxRounds ?? 8
  const maxWork = options.maxWork ?? 300_000
  const tolerance = options.tolerance ?? 1
  const trackGap = options.trackGap ?? 3
  const fixed = options.fixedLabels ?? []
  let work = 0
  const n = requests.length
  const out = new Map<string, PlacedEdgeLabel>()
  if (n === 0) return out

  // Uniform grid over node boxes, placed labels and labelled edge segments, so a query touches
  // only nearby boxes.
  let maxW = 0, maxH = 0
  for (const r of requests) { maxW = Math.max(maxW, r.size.width); maxH = Math.max(maxH, r.size.height) }
  const cell = Math.max(64, maxW + 2 * margin, maxH + 2 * margin)
  const key = (cx: number, cy: number) => cx * 73856093 ^ cy * 19349663
  const boxCells = (x: number, y: number, hw: number, hh: number, fn: (k: number) => void) => {
    const x0 = Math.floor((x - hw) / cell), x1 = Math.floor((x + hw) / cell)
    const y0 = Math.floor((y - hh) / cell), y1 = Math.floor((y + hh) / cell)
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) fn(key(cx, cy))
  }
  const nodeGrid = new Map<number, number[]>()
  obstacles.forEach((o, i) => boxCells(o.x, o.y, o.width / 2, o.height / 2, (k) => {
    const b = nodeGrid.get(k); if (b) b.push(i); else nodeGrid.set(k, [i])
  }))
  // Labels: 0..n-1 are the requests, n.. the fixed labels (never moved).
  const boxW = (i: number) => (i < n ? requests[i].size.width : fixed[i - n].width)
  const boxH = (i: number) => (i < n ? requests[i].size.height : fixed[i - n].height)
  const labelGrid = new Map<number, Set<number>>()
  const pos: Point[] = new Array(n)
  const at = (i: number): Point => (i < n ? pos[i] : fixed[i - n])
  const addLabel = (i: number) => boxCells(at(i).x, at(i).y, boxW(i) / 2, boxH(i) / 2, (k) => {
    const b = labelGrid.get(k); if (b) b.add(i); else labelGrid.set(k, new Set([i]))
  })
  const removeLabel = (i: number) => boxCells(at(i).x, at(i).y, boxW(i) / 2, boxH(i) / 2, (k) => {
    labelGrid.get(k)?.delete(i)
  })
  const fine = (p: Point) => Number.isFinite(p.x) && Number.isFinite(p.y)
  fixed.forEach((f, j) => { if (fine(f)) addLabel(n + j) })

  // Labelled edge segments, for parallel tracks.
  interface Seg { owner: number; ax: number; ay: number; bx: number; by: number; ux: number; uy: number }
  const segs: Seg[] = []
  const segGrid = new Map<number, number[]>()
  const ownSegs: number[][] = requests.map(() => [])
  requests.forEach((r, i) => {
    const pts = r.path ?? []
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k]
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      if (!(len > 1e-6) || !fine(a) || !fine(b)) continue
      const s = segs.length
      segs.push({ owner: i, ax: a.x, ay: a.y, bx: b.x, by: b.y, ux: (b.x - a.x) / len, uy: (b.y - a.y) / len })
      ownSegs[i].push(s)
      boxCells((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, (k2) => {
        const c = segGrid.get(k2); if (c) c.push(s); else segGrid.set(k2, [s])
      })
    }
  })
  // The direction of label i's own edge nearest p (its closest own segment), or null without a path.
  const ownDirection = (i: number, p: Point): Seg | null => {
    let best: Seg | null = null, bestD = Infinity
    for (const s of ownSegs[i]) {
      const g = segs[s]
      const t = Math.max(0, Math.min(1, ((p.x - g.ax) * (g.bx - g.ax) + (p.y - g.ay) * (g.by - g.ay)) / ((g.bx - g.ax) ** 2 + (g.by - g.ay) ** 2)))
      const d = Math.hypot(g.ax + t * (g.bx - g.ax) - p.x, g.ay + t * (g.by - g.ay) - p.y)
      if (d < bestD) { bestD = d; best = g }
    }
    return best
  }
  // Other labelled edges' segments parallel to `dir` crossing label i's box at p.
  const parallelTracks = (i: number, p: Point, dir: Seg, fn: (g: Seg) => void) => {
    const hw = requests[i].size.width / 2 - tolerance, hh = requests[i].size.height / 2 - tolerance
    const seen = new Set<number>()
    boxCells(p.x, p.y, hw, hh, (k) => {
      for (const s of segGrid.get(k) ?? []) {
        if (seen.has(s)) continue
        seen.add(s)
        const g = segs[s]
        if (g.owner === i) continue
        work++
        if (Math.abs(g.ux * dir.uy - g.uy * dir.ux) > TRACK_PARALLEL_SIN) continue
        if (segmentCrossesBox(g.ax, g.ay, g.bx, g.by, p.x - hw, p.y - hh, p.x + hw, p.y + hh)) fn(g)
      }
    })
  }
  const trackCost = (i: number, p: Point): number => {
    if (!ownSegs[i].length) return 0
    const dir = ownDirection(i, p)
    if (!dir) return 0
    const owners = new Set<number>()
    parallelTracks(i, p, dir, (g) => owners.add(g.owner))
    return owners.size
  }
  // Spot p moved beside label i's own line, on the side away from the parallel labelled tracks
  // crowding it there; null when none crowds it, or tracks crowd it from both sides.
  const outsideOffset = (i: number, p: Point): Point | null => {
    if (!ownSegs[i].length || !fine(p)) return null
    const dir = ownDirection(i, p)
    if (!dir) return null
    const nx = -dir.uy, ny = dir.ux
    let side = 0, mixed = false
    parallelTracks(i, p, dir, (g) => {
      // Signed distance of the other track from p, across this edge.
      const t = Math.max(0, Math.min(1, ((p.x - g.ax) * (g.bx - g.ax) + (p.y - g.ay) * (g.by - g.ay)) / ((g.bx - g.ax) ** 2 + (g.by - g.ay) ** 2)))
      const s = (g.ax + t * (g.bx - g.ax) - p.x) * nx + (g.ay + t * (g.by - g.ay) - p.y) * ny
      const sign = Math.sign(s)
      if (sign === 0) { mixed = true; return }
      if (side === 0) side = sign
      else if (side !== sign) mixed = true
    })
    if (side === 0 || mixed) return null
    const { width, height } = requests[i].size
    const across = Math.abs(nx) * width / 2 + Math.abs(ny) * height / 2 + trackGap
    return { x: p.x - side * nx * across, y: p.y - side * ny * across }
  }

  // Overlap of two centred boxes along one axis, past a clearance `c`: [true overlap, band overlap].
  const axis = (d: number, sum: number, c: number): [number, number] => {
    const band = sum + c - d
    if (band <= 0) return [0, 0]
    return [Math.max(0, sum - d), band]
  }
  const nodeCost = (p: Point, hw: number, hh: number): [number, number, number] => {
    let hits = 0, hard = 0, band = 0
    const seen = new Set<number>()
    boxCells(p.x, p.y, hw + margin, hh + margin, (k) => {
      for (const j of nodeGrid.get(k) ?? []) {
        if (seen.has(j)) continue
        seen.add(j)
        work++
        const o = obstacles[j]
        const [tx, bx] = axis(Math.abs(p.x - o.x), hw + o.width / 2, margin)
        if (bx === 0) continue
        const [ty, by] = axis(Math.abs(p.y - o.y), hh + o.height / 2, margin)
        if (by === 0) continue
        if (tx > 0 && ty > 0) hits++
        hard += tx * ty
        band += bx * by
      }
    })
    return [hits, hard, band]
  }
  const labelCost = (i: number, p: Point): [number, number, number] => {
    const hw = requests[i].size.width / 2, hh = requests[i].size.height / 2
    let hits = 0, hard = 0, band = 0
    const seen = new Set<number>()
    boxCells(p.x, p.y, hw + gap, hh + gap, (k) => {
      for (const j of labelGrid.get(k) ?? []) {
        if (j === i || seen.has(j)) continue
        seen.add(j)
        work++
        const q = at(j)
        const [tx, bx] = axis(Math.abs(p.x - q.x), hw + boxW(j) / 2, gap)
        if (bx === 0) continue
        const [ty, by] = axis(Math.abs(p.y - q.y), hh + boxH(j) / 2, gap)
        if (by === 0) continue
        if (tx > 0 && ty > 0) hits++
        hard += tx * ty
        band += bx * by
      }
    })
    return [hits, hard, band]
  }
  const cost = (i: number, p: Point): LabelCost => {
    const [nHits, nArea, nBand] = nodeCost(p, requests[i].size.width / 2, requests[i].size.height / 2)
    const [lHits, lArea, lBand] = labelCost(i, p)
    return [nHits, lHits, trackCost(i, p), nArea, lArea, nBand + lBand]
  }

  // 1. Each label's own spot, as if alone.
  requests.forEach((r, i) => {
    const hw = r.size.width / 2, hh = r.size.height / 2
    pos[i] = r.candidates.find((p) => fine(p) && nodeCost(p, hw, hh)[2] === 0) ?? r.fallback
    if (fine(pos[i])) addLabel(i)
  })

  // 2. Repair the collisions.
  work = 0
  const offsetSpots = new Set<Point>()
  repair: for (let round = 0; round < maxRounds; round++) {
    let moved = false
    for (let i = 0; i < n; i++) {
      if (work > maxWork) break repair
      if (!fine(pos[i])) continue
      const current = cost(i, pos[i])
      if (isZero(current)) continue
      const onLine = [...requests[i].candidates, ...(requests[i].alternatives ?? [])]
      let best = pos[i], bestCost: LabelCost = current
      const consider = (p: Point) => {
        const c = cost(i, p)
        if (lessCost(c, bestCost)) { best = p; bestCost = c }
      }
      for (const p of onLine) {
        if (!fine(p)) continue
        consider(p)
        if (isZero(bestCost)) break
      }
      // Beside its own line, away from a parallel labelled track: only when no spot on the line is
      // clear, so a label leaves its line only for a parallel track.
      if (!isZero(bestCost) && ownSegs[i].length) {
        for (const p of onLine) {
          const q = outsideOffset(i, p)
          if (!q) continue
          offsetSpots.add(q)
          consider(q)
          if (isZero(bestCost)) break
        }
      }
      if (best !== pos[i]) {
        removeLabel(i)
        pos[i] = best
        addLabel(i)
        moved = true
      }
    }
    if (!moved) break
  }

  // 3. No room: still over a node or another label past the tolerance. Over a node first (that
  //    doesn't depend on the other labels); then, of two overlapping labels, the earlier keeps.
  const noRoom = new Array<boolean>(n).fill(false)
  if (options.markNoRoom) {
    const over = (p: Point, w: number, h: number, q: Point, w2: number, h2: number) =>
      Math.min(p.x + w / 2, q.x + w2 / 2) - Math.max(p.x - w / 2, q.x - w2 / 2) > tolerance &&
      Math.min(p.y + h / 2, q.y + h2 / 2) - Math.max(p.y - h / 2, q.y - h2 / 2) > tolerance
    for (let i = 0; i < n; i++) {
      if (!fine(pos[i])) continue
      const { width: w, height: h } = requests[i].size
      boxCells(pos[i].x, pos[i].y, w / 2, h / 2, (k) => {
        if (noRoom[i]) return
        for (const j of nodeGrid.get(k) ?? []) {
          const o = obstacles[j]
          if (over(pos[i], w, h, o, o.width, o.height)) { noRoom[i] = true; return }
        }
      })
    }
    for (let i = 0; i < n; i++) {
      if (!fine(pos[i]) || noRoom[i]) continue
      const { width: w, height: h } = requests[i].size
      boxCells(pos[i].x, pos[i].y, w / 2, h / 2, (k) => {
        if (noRoom[i]) return
        for (const j of labelGrid.get(k) ?? []) {
          if (j === i || (j < n && (j > i || noRoom[j]))) continue
          if (over(pos[i], w, h, at(j), boxW(j), boxH(j))) { noRoom[i] = true; return }
        }
      })
    }
  }

  requests.forEach((r, i) => {
    const p: PlacedEdgeLabel = { x: pos[i].x, y: pos[i].y }
    if (noRoom[i]) p.noRoom = true
    if (offsetSpots.has(pos[i])) p.offset = true
    out.set(r.id, p)
  })
  return out
}
