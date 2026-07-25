export interface Point {
  x: number
  y: number
}

export interface BezierPathResult {
  d: string
  mid: Point
  angle: number
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

export function bezierPath(p1: Point, p2: Point, curvature: number = 0.28): BezierPathResult {
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
  }
}
