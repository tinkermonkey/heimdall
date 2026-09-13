import type { Point, EdgeEndpointRect } from './graph'

export interface RoutedEdge {
  d: string
  mid: Point
  angle: number
  points: Point[]
}

export function routeNavigationEdge(
  source: EdgeEndpointRect,
  target: EdgeEndpointRect,
  obstacles: readonly EdgeEndpointRect[] = []
): RoutedEdge {
  // Exit point from source (middle of right/left edge depending on target position)
  const sourceExit = getExitPoint(source, target)

  // Entry point to target (middle of right/left edge depending on source position)
  const targetEntry = getEntryPoint(target, source)

  // Build the orthogonal path with obstacle avoidance
  const points = buildOrthogonalPath(sourceExit, targetEntry, obstacles)

  // Convert points to SVG path string
  const d = pointsToPathString(points)

  // Compute midpoint and angle for label placement
  const mid = points[Math.floor(points.length / 2)]
  const angle = Math.atan2(
    points[points.length - 1].y - points[points.length - 2].y,
    points[points.length - 1].x - points[points.length - 2].x
  )

  return { d, mid, angle, points }
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
  obstacles: readonly EdgeEndpointRect[]
): Point[] {
  const padding = 20

  // Try horizontal-first routing (right/left then up/down)
  const hFirstPath = tryHorizontalFirstPath(source, target, obstacles, padding)
  if (hFirstPath) return hFirstPath

  // Try vertical-first routing (up/down then right/left)
  const vFirstPath = tryVerticalFirstPath(source, target, obstacles, padding)
  if (vFirstPath) return vFirstPath

  // Fallback: route outside the bounding box of all obstacles
  if (obstacles.length > 0) {
    const minX = Math.min(...obstacles.map(o => o.x - o.width / 2))
    const maxX = Math.max(...obstacles.map(o => o.x + o.width / 2))
    const minY = Math.min(...obstacles.map(o => o.y - o.height / 2))
    const maxY = Math.max(...obstacles.map(o => o.y + o.height / 2))

    // Try routing above or below the obstacle cluster
    const aboveY = minY - padding
    const belowY = maxY + padding

    const distToAbove = Math.abs(aboveY - source.y)
    const distToBelow = Math.abs(belowY - source.y)
    const routeY = distToAbove <= distToBelow ? aboveY : belowY

    return [source, { x: source.x, y: routeY }, { x: target.x, y: routeY }, target]
  }

  // No obstacles: simple L-path
  return [source, { x: target.x, y: source.y }, target]
}

function tryHorizontalFirstPath(
  source: Point,
  target: Point,
  obstacles: readonly EdgeEndpointRect[],
  padding: number
): Point[] | null {
  const midX = target.x
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
    const routeY = topmost.y - topmost.height / 2 - padding
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
  padding: number
): Point[] | null {
  const midY = target.y
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
    const routeX = rightmost.x + rightmost.width / 2 + padding
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

export function nudgeOverlappingSegments(routes: RoutedEdge[]): string[] {
  // For now, return the original paths — full implementation would detect shared segments
  // and apply perpendicular offsets to make them visually distinct. This is a foundation
  // that can be enhanced in future iterations.
  return routes.map(r => r.d)
}
