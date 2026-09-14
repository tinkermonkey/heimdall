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
}

/** Default spacing (px) between parallel segments when nudging overlapping edges apart */
export const DEFAULT_TRACE_SPACING = 16

/**
 * Extracts routing channels from node positions in the layout.
 * Channels are the vertical and horizontal lines that pass through node centers,
 * representing the gaps between nodes where edges can naturally flow.
 */
function extractChannels(nodes: readonly EdgeEndpointRect[]): {
  verticalChannels: number[]
  horizontalChannels: number[]
} {
  if (nodes.length === 0) {
    return { verticalChannels: [], horizontalChannels: [] }
  }

  const xs = new Set<number>()
  const ys = new Set<number>()

  for (const node of nodes) {
    xs.add(Math.round(node.x))
    ys.add(Math.round(node.y))
  }

  return {
    verticalChannels: Array.from(xs).sort((a, b) => a - b),
    horizontalChannels: Array.from(ys).sort((a, b) => a - b),
  }
}

/**
 * Snaps a coordinate to the nearest channel line if it's close enough.
 * This encourages routing along layout channels.
 */
function snapToChannel(value: number, channels: number[], threshold: number = 30): number {
  let closest = value
  let minDist = threshold

  for (const channel of channels) {
    const dist = Math.abs(value - channel)
    if (dist < minDist) {
      minDist = dist
      closest = channel
    }
  }

  return closest
}

export function routeNavigationEdge(
  source: EdgeEndpointRect,
  target: EdgeEndpointRect,
  obstacles: readonly EdgeEndpointRect[] = [],
  channels?: { verticalChannels: number[]; horizontalChannels: number[] }
): RoutedEdge {
  // Exit point from source (middle of right/left edge depending on target position)
  const sourceExit = getExitPoint(source, target)

  // Entry point to target (middle of right/left edge depending on source position)
  const targetEntry = getEntryPoint(target, source)

  // Build the orthogonal path with obstacle avoidance and channel awareness
  const points = buildOrthogonalPath(sourceExit, targetEntry, obstacles, channels)

  // Convert points to SVG path string
  const d = pointsToPathString(points)

  // Compute midpoint and angle for label placement
  const mid = points[Math.floor(points.length / 2)]
  const angle = Math.atan2(
    points[points.length - 1].y - points[points.length - 2].y,
    points[points.length - 1].x - points[points.length - 2].x
  )

  return { d, mid, angle, points, isPolyline: true }
}

/**
 * Routes multiple navigation edges at once with channel-based awareness.
 * Extracts routing channels from node positions in the layout and routes edges through them,
 * then applies a nudge pass to spread overlapping segments.
 */
export function routeNavigationEdges(
  edges: Array<{ id: string; source: EdgeEndpointRect; target: EdgeEndpointRect }>,
  allObstacles: readonly EdgeEndpointRect[] = [],
  traceSpacing: number = DEFAULT_TRACE_SPACING,
  layoutNodes?: readonly EdgeEndpointRect[]
): Map<string, RoutedEdge> {
  // Extract channels from layout nodes (all obstacles + endpoints)
  const channelNodes = layoutNodes || allObstacles
  const channels = extractChannels(channelNodes)

  // Route each edge individually, but consider previous routes as soft obstacles
  const routes = new Map<string, RoutedEdge>()
  const routedRects: EdgeEndpointRect[] = []

  for (const edge of edges) {
    const obstacles = [...allObstacles, ...routedRects]
    const routed = routeNavigationEdge(edge.source, edge.target, obstacles, channels)
    routes.set(edge.id, routed)

    // Create a bounding rect for this route to use as obstacle for subsequent edges
    const allX = routed.points.map(p => p.x)
    const allY = routed.points.map(p => p.y)
    routedRects.push({
      x: (Math.min(...allX) + Math.max(...allX)) / 2,
      y: (Math.min(...allY) + Math.max(...allY)) / 2,
      width: Math.max(...allX) - Math.min(...allX) + 10,
      height: Math.max(...allY) - Math.min(...allY) + 10,
    })
  }

  // Apply nudge pass to spread overlapping segments
  nudgeOverlappingSegments(routes, traceSpacing)

  return routes
}

/**
 * Post-processes routed edges to spread overlapping segments by applying perpendicular offsets.
 * This ensures that parallel segments from different routes are visually distinct and don't
 * completely overlap.
 */
function nudgeOverlappingSegments(
  routes: Map<string, RoutedEdge>,
  traceSpacing: number = DEFAULT_TRACE_SPACING
): void {
  // Track which route pairs have already been nudged to avoid double-nudging
  const nudgedPairs = new Set<string>()

  // Group segments by their axis and position
  const horizontalSegments = new Map<number, Array<{ id: string; segmentIndex: number; x1: number; x2: number }>>()
  const verticalSegments = new Map<number, Array<{ id: string; segmentIndex: number; y1: number; y2: number }>>()

  for (const [id, route] of routes) {
    for (let i = 0; i < route.points.length - 1; i++) {
      const p1 = route.points[i]
      const p2 = route.points[i + 1]

      // Horizontal segment
      if (p1.y === p2.y) {
        const y = Math.round(p1.y)
        if (!horizontalSegments.has(y)) {
          horizontalSegments.set(y, [])
        }
        horizontalSegments.get(y)!.push({
          id,
          segmentIndex: i,
          x1: Math.min(p1.x, p2.x),
          x2: Math.max(p1.x, p2.x),
        })
      }

      // Vertical segment
      if (p1.x === p2.x) {
        const x = Math.round(p1.x)
        if (!verticalSegments.has(x)) {
          verticalSegments.set(x, [])
        }
        verticalSegments.get(x)!.push({
          id,
          segmentIndex: i,
          y1: Math.min(p1.y, p2.y),
          y2: Math.max(p1.y, p2.y),
        })
      }
    }
  }

  // Detect overlapping horizontal segments and nudge them apart vertically
  for (const segments of horizontalSegments.values()) {
    for (let i = 0; i < segments.length - 1; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i]
        const seg2 = segments[j]

        // Check if segments overlap in x
        if (seg1.x1 < seg2.x2 && seg1.x2 > seg2.x1) {
          const pairKey = [seg1.id, seg2.id].sort().join(':')
          if (!nudgedPairs.has(pairKey)) {
            const route1 = routes.get(seg1.id)!
            const route2 = routes.get(seg2.id)!
            if (route1 && route2) {
              nudgeHorizontalSegment(route1, seg1.segmentIndex, route2, seg2.segmentIndex, traceSpacing)
              nudgedPairs.add(pairKey)
            }
          }
        }
      }
    }
  }

  // Detect overlapping vertical segments and nudge them apart horizontally
  for (const segments of verticalSegments.values()) {
    for (let i = 0; i < segments.length - 1; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i]
        const seg2 = segments[j]

        // Check if segments overlap in y
        if (seg1.y1 < seg2.y2 && seg1.y2 > seg2.y1) {
          const pairKey = [seg1.id, seg2.id].sort().join(':')
          if (!nudgedPairs.has(pairKey)) {
            const route1 = routes.get(seg1.id)!
            const route2 = routes.get(seg2.id)!
            if (route1 && route2) {
              nudgeVerticalSegment(route1, seg1.segmentIndex, route2, seg2.segmentIndex, traceSpacing)
              nudgedPairs.add(pairKey)
            }
          }
        }
      }
    }
  }
}

/**
 * Nudges a specific horizontal segment of a route vertically to separate from another.
 * Propagates the offset to connected perpendicular segments to maintain 90° joints.
 */
function nudgeHorizontalSegment(
  route1: RoutedEdge,
  segmentIndex1: number,
  route2: RoutedEdge,
  segmentIndex2: number,
  spacing: number
): void {
  const offset = spacing / 2

  // Nudge the two endpoints of each segment
  const seg1Start = segmentIndex1
  const seg1End = segmentIndex1 + 1
  const seg2Start = segmentIndex2
  const seg2End = segmentIndex2 + 1

  route1.points[seg1Start] = { x: route1.points[seg1Start].x, y: route1.points[seg1Start].y - offset }
  route1.points[seg1End] = { x: route1.points[seg1End].x, y: route1.points[seg1End].y - offset }

  route2.points[seg2Start] = { x: route2.points[seg2Start].x, y: route2.points[seg2Start].y + offset }
  route2.points[seg2End] = { x: route2.points[seg2End].x, y: route2.points[seg2End].y + offset }

  // Propagate offset to connected perpendicular segments in route1
  propagateHorizontalNudge(route1, seg1Start, seg1End, -offset)
  // Propagate offset to connected perpendicular segments in route2
  propagateHorizontalNudge(route2, seg2Start, seg2End, offset)

  // Recompute path string and metadata after nudging
  updateRouteMetadata(route1)
  updateRouteMetadata(route2)
}

/**
 * Propagates a horizontal nudge (vertical offset) to connected perpendicular (vertical) segments.
 */
function propagateHorizontalNudge(route: RoutedEdge, segStart: number, segEnd: number, yOffset: number): void {
  // Check segment before segStart for perpendicular connection
  if (segStart > 0) {
    const prevSeg = route.points[segStart - 1]
    const currStart = route.points[segStart]
    // If previous segment is vertical and shares the point, propagate offset
    if (Math.abs(prevSeg.x - currStart.x) < 0.01) {
      route.points[segStart - 1] = { x: prevSeg.x, y: prevSeg.y + yOffset }
    }
  }

  // Check segment after segEnd for perpendicular connection
  if (segEnd < route.points.length - 1) {
    const currEnd = route.points[segEnd]
    const nextSeg = route.points[segEnd + 1]
    // If next segment is vertical and shares the point, propagate offset
    if (Math.abs(currEnd.x - nextSeg.x) < 0.01) {
      route.points[segEnd + 1] = { x: nextSeg.x, y: nextSeg.y + yOffset }
    }
  }
}

/**
 * Nudges a specific vertical segment of a route horizontally to separate from another.
 * Propagates the offset to connected perpendicular segments to maintain 90° joints.
 */
function nudgeVerticalSegment(
  route1: RoutedEdge,
  segmentIndex1: number,
  route2: RoutedEdge,
  segmentIndex2: number,
  spacing: number
): void {
  const offset = spacing / 2

  // Nudge the two endpoints of each segment
  const seg1Start = segmentIndex1
  const seg1End = segmentIndex1 + 1
  const seg2Start = segmentIndex2
  const seg2End = segmentIndex2 + 1

  route1.points[seg1Start] = { x: route1.points[seg1Start].x - offset, y: route1.points[seg1Start].y }
  route1.points[seg1End] = { x: route1.points[seg1End].x - offset, y: route1.points[seg1End].y }

  route2.points[seg2Start] = { x: route2.points[seg2Start].x + offset, y: route2.points[seg2Start].y }
  route2.points[seg2End] = { x: route2.points[seg2End].x + offset, y: route2.points[seg2End].y }

  // Propagate offset to connected perpendicular segments in route1
  propagateVerticalNudge(route1, seg1Start, seg1End, -offset)
  // Propagate offset to connected perpendicular segments in route2
  propagateVerticalNudge(route2, seg2Start, seg2End, offset)

  // Recompute path string and metadata after nudging
  updateRouteMetadata(route1)
  updateRouteMetadata(route2)
}

/**
 * Propagates a vertical nudge (horizontal offset) to connected perpendicular (horizontal) segments.
 */
function propagateVerticalNudge(route: RoutedEdge, segStart: number, segEnd: number, xOffset: number): void {
  // Check segment before segStart for perpendicular connection
  if (segStart > 0) {
    const prevSeg = route.points[segStart - 1]
    const currStart = route.points[segStart]
    // If previous segment is horizontal and shares the point, propagate offset
    if (Math.abs(prevSeg.y - currStart.y) < 0.01) {
      route.points[segStart - 1] = { x: prevSeg.x + xOffset, y: prevSeg.y }
    }
  }

  // Check segment after segEnd for perpendicular connection
  if (segEnd < route.points.length - 1) {
    const currEnd = route.points[segEnd]
    const nextSeg = route.points[segEnd + 1]
    // If next segment is horizontal and shares the point, propagate offset
    if (Math.abs(currEnd.y - nextSeg.y) < 0.01) {
      route.points[segEnd + 1] = { x: nextSeg.x + xOffset, y: nextSeg.y }
    }
  }
}

/**
 * Updates the path string and metadata (mid, angle) of a route after points have been modified.
 */
function updateRouteMetadata(route: RoutedEdge): void {
  route.d = pointsToPathString(route.points)
  route.mid = route.points[Math.floor(route.points.length / 2)]
  route.angle = Math.atan2(
    route.points[route.points.length - 1].y - route.points[route.points.length - 2].y,
    route.points[route.points.length - 1].x - route.points[route.points.length - 2].x
  )
}

function getExitPoint(source: EdgeEndpointRect, target: EdgeEndpointRect): Point {
  const sourceCenter = { x: source.x, y: source.y }
  const targetCenter = { x: target.x, y: target.y }

  // Prefer horizontal exit (right/left sides) if target is significantly left or right
  if (Math.abs(targetCenter.x - sourceCenter.x) > Math.abs(targetCenter.y - sourceCenter.y)) {
    return {
      x: targetCenter.x > sourceCenter.x
        ? source.x + source.width / 2  // exit right
        : source.x - source.width / 2, // exit left
      y: source.y, // middle height of source
    }
  }

  // Otherwise exit top or bottom
  return {
    x: source.x,
    y: targetCenter.y > sourceCenter.y
      ? source.y + source.height / 2  // exit bottom
      : source.y - source.height / 2, // exit top
  }
}

function getEntryPoint(target: EdgeEndpointRect, source: EdgeEndpointRect): Point {
  const sourceCenter = { x: source.x, y: source.y }
  const targetCenter = { x: target.x, y: target.y }

  // Prefer horizontal entry (right/left sides) if source is significantly left or right
  if (Math.abs(sourceCenter.x - targetCenter.x) > Math.abs(sourceCenter.y - targetCenter.y)) {
    return {
      x: sourceCenter.x > targetCenter.x
        ? target.x + target.width / 2  // enter from right
        : target.x - target.width / 2, // enter from left
      y: target.y, // middle height of target
    }
  }

  // Otherwise enter from top or bottom
  return {
    x: target.x,
    y: sourceCenter.y > targetCenter.y
      ? target.y + target.height / 2  // enter from bottom
      : target.y - target.height / 2, // enter from top
  }
}

function hSegmentIntersectsBox(
  x1: number,
  x2: number,
  y: number,
  box: EdgeEndpointRect,
  padding: number = 0
): boolean {
  const boxLeft = box.x - box.width / 2 - padding
  const boxRight = box.x + box.width / 2 + padding
  const boxTop = box.y - box.height / 2 - padding
  const boxBottom = box.y + box.height / 2 + padding

  const segLeft = Math.min(x1, x2)
  const segRight = Math.max(x1, x2)

  return (
    y >= boxTop &&
    y <= boxBottom &&
    segLeft < boxRight &&
    segRight > boxLeft
  )
}

function vSegmentIntersectsBox(
  x: number,
  y1: number,
  y2: number,
  box: EdgeEndpointRect,
  padding: number = 0
): boolean {
  const boxLeft = box.x - box.width / 2 - padding
  const boxRight = box.x + box.width / 2 + padding
  const boxTop = box.y - box.height / 2 - padding
  const boxBottom = box.y + box.height / 2 + padding

  const segTop = Math.min(y1, y2)
  const segBottom = Math.max(y1, y2)

  return (
    x >= boxLeft &&
    x <= boxRight &&
    segTop < boxBottom &&
    segBottom > boxTop
  )
}

function buildOrthogonalPath(
  source: Point,
  target: Point,
  obstacles: readonly EdgeEndpointRect[],
  channels?: { verticalChannels: number[]; horizontalChannels: number[] }
): Point[] {
  const padding = 20

  // Try horizontal-first routing (right/left then up/down)
  const hFirstPath = tryHorizontalFirstPath(source, target, obstacles, padding, channels)
  if (hFirstPath) return hFirstPath

  // Try vertical-first routing (up/down then right/left)
  const vFirstPath = tryVerticalFirstPath(source, target, obstacles, padding, channels)
  if (vFirstPath) return vFirstPath

  // Fallback: route outside the bounding box of all obstacles
  if (obstacles.length > 0) {
    const minY = Math.min(...obstacles.map(o => o.y - o.height / 2))
    const maxY = Math.max(...obstacles.map(o => o.y + o.height / 2))

    // Try routing above or below the obstacle cluster
    const aboveY = minY - padding
    const belowY = maxY + padding

    const distToAbove = Math.abs(aboveY - source.y)
    const distToBelow = Math.abs(belowY - source.y)
    let routeY = distToAbove <= distToBelow ? aboveY : belowY

    // Snap to nearest channel if available
    if (channels) {
      routeY = snapToChannel(routeY, channels.horizontalChannels, padding)
    }

    return [source, { x: source.x, y: routeY }, { x: target.x, y: routeY }, target]
  }

  // No obstacles: simple L-path, snapped to channels if available
  let cornerX = target.x
  let cornerY = source.y

  if (channels) {
    cornerX = snapToChannel(cornerX, channels.verticalChannels)
    cornerY = snapToChannel(cornerY, channels.horizontalChannels)
  }

  return [source, { x: cornerX, y: cornerY }, target]
}

function tryHorizontalFirstPath(
  source: Point,
  target: Point,
  obstacles: readonly EdgeEndpointRect[],
  padding: number,
  channels?: { verticalChannels: number[]; horizontalChannels: number[] }
): Point[] | null {
  let midX = target.x
  if (channels) {
    midX = snapToChannel(midX, channels.verticalChannels)
  }
  const corner = { x: midX, y: source.y }

  // Check if direct path crosses obstacles
  const hSegClear = !obstacles.some(obs =>
    hSegmentIntersectsBox(source.x, midX, source.y, obs, padding)
  )
  const vSegClear = !obstacles.some(obs =>
    vSegmentIntersectsBox(midX, source.y, target.y, obs, padding)
  )

  if (hSegClear && vSegClear) {
    return [source, corner, target]
  }

  // If blocked, try routing above/below obstacles
  const obstaclesOnPath = obstacles.filter(obs =>
    hSegmentIntersectsBox(source.x, midX, source.y, obs, padding)
  )

  if (obstaclesOnPath.length > 0) {
    // Route above the topmost obstacle
    const topmost = obstaclesOnPath.reduce((min, obs) =>
      obs.y - obs.height / 2 < min.y - min.height / 2 ? obs : min
    )
    let routeY = topmost.y - topmost.height / 2 - padding
    if (channels) {
      routeY = snapToChannel(routeY, channels.horizontalChannels, padding)
    }
    const waypoint1 = { x: source.x, y: routeY }
    const waypoint2 = { x: midX, y: routeY }
    const waypoint3 = { x: midX, y: target.y }
    return [source, waypoint1, waypoint2, waypoint3, target]
  }

  return null
}

function tryVerticalFirstPath(
  source: Point,
  target: Point,
  obstacles: readonly EdgeEndpointRect[],
  padding: number,
  channels?: { verticalChannels: number[]; horizontalChannels: number[] }
): Point[] | null {
  let midY = target.y
  if (channels) {
    midY = snapToChannel(midY, channels.horizontalChannels)
  }
  const corner = { x: source.x, y: midY }

  // Check if direct path crosses obstacles
  const vSegClear = !obstacles.some(obs =>
    vSegmentIntersectsBox(source.x, source.y, midY, obs, padding)
  )
  const hSegClear = !obstacles.some(obs =>
    hSegmentIntersectsBox(source.x, target.x, midY, obs, padding)
  )

  if (vSegClear && hSegClear) {
    return [source, corner, target]
  }

  // If blocked, try routing left/right of obstacles
  const obstaclesOnPath = obstacles.filter(obs =>
    vSegmentIntersectsBox(source.x, source.y, midY, obs, padding)
  )

  if (obstaclesOnPath.length > 0) {
    // Route right of the rightmost obstacle
    const rightmost = obstaclesOnPath.reduce((max, obs) =>
      obs.x + obs.width / 2 > max.x + max.width / 2 ? obs : max
    )
    let routeX = rightmost.x + rightmost.width / 2 + padding
    if (channels) {
      routeX = snapToChannel(routeX, channels.verticalChannels, padding)
    }
    const waypoint1 = { x: routeX, y: source.y }
    const waypoint2 = { x: routeX, y: midY }
    const waypoint3 = { x: target.x, y: midY }
    return [source, waypoint1, waypoint2, waypoint3, target]
  }

  return null
}

function pointsToPathString(points: Point[]): string {
  if (points.length === 0) return ''
  const parts = [
    `M ${Math.round(points[0].x)} ${Math.round(points[0].y)}`,
    ...points.slice(1).map(p => `L ${Math.round(p.x)} ${Math.round(p.y)}`),
  ]
  return parts.join(' ')
}
