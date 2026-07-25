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

export type EdgeAnchor = 'auto' | 'left' | 'right' | 'top' | 'bottom'

const ANCHOR_DIRECTION: Record<Exclude<EdgeAnchor, 'auto'>, Point> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
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

export const DEFAULT_CUBIC_CURVATURE = 0.4

/**
 * Cubic bezier whose control points project outward from each endpoint's anchor direction
 * (or, for 'auto', straight toward the other endpoint). Midpoint and tangent angle are
 * found via De Casteljau subdivision at t=0.5 rather than approximated from the control points.
 */
export function cubicBezierPath(
  p1: Point,
  p2: Point,
  sourceAnchor: EdgeAnchor = 'auto',
  targetAnchor: EdgeAnchor = 'auto',
  curvature: number = DEFAULT_CUBIC_CURVATURE
): BezierPathResult {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.hypot(dx, dy) || 1
  const offset = Math.min(120, dist * curvature)

  const dir1 = sourceAnchor === 'auto' ? { x: dx / dist, y: dy / dist } : ANCHOR_DIRECTION[sourceAnchor]
  const dir2 = targetAnchor === 'auto' ? { x: -dx / dist, y: -dy / dist } : ANCHOR_DIRECTION[targetAnchor]

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
  }
}

export interface EdgeEndpointRect {
  x: number
  y: number
  width: number
  height: number
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

  const sp = anchoredEdgePoint(source.x, source.y, source.width, source.height, sourceAnchor, target.x, target.y)
  const tp = anchoredEdgePoint(target.x, target.y, target.width, target.height, targetAnchor, source.x, source.y)

  if (sourceAnchor === 'auto' && targetAnchor === 'auto') {
    return bezierPath(sp, tp, options.curvature ?? 0.22)
  }
  return cubicBezierPath(sp, tp, sourceAnchor, targetAnchor, options.curvature ?? DEFAULT_CUBIC_CURVATURE)
}
