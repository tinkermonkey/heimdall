export type GraphEdgeVariant = 'default' | 'hot' | 'irrelevant'

export const MIN_EDGE_STROKE_WIDTH = 1
export const MAX_EDGE_STROKE_WIDTH = 8
export const MAX_EDGE_MARKER_SIZE = 20

/** Default (CSS-driven) stroke width per variant, absent an explicit weight. */
export const DEFAULT_EDGE_STROKE_WIDTH: Record<GraphEdgeVariant, number> = {
  default: 1.25,
  hot: 1.75,
  irrelevant: 1.25,
}

/** Default (CSS-driven) arrow marker size per variant, absent an explicit weight. */
export const DEFAULT_EDGE_MARKER_SIZE: Record<GraphEdgeVariant, number> = {
  default: 7,
  hot: 8,
  irrelevant: 7,
}

/**
 * Maps a 0-100 weight to a 1-8px stroke width via a square-root curve, so
 * differences at the low end stay visually distinguishable.
 */
export function weightToStrokeWidth(weight: number): number {
  const clamped = Math.min(100, Math.max(0, weight))
  const range = MAX_EDGE_STROKE_WIDTH - MIN_EDGE_STROKE_WIDTH
  return MIN_EDGE_STROKE_WIDTH + range * Math.sqrt(clamped / 100)
}

/** Scales a base marker size proportionally to the rendered stroke width, capped at a sane maximum. */
export function markerSizeForStrokeWidth(baseSize: number, baseStrokeWidth: number, strokeWidth: number): number {
  return Math.min(baseSize * (strokeWidth / baseStrokeWidth), MAX_EDGE_MARKER_SIZE)
}

/** Normalizes a strokeDash value into an SVG stroke-dasharray string, e.g. `4` -> "4 4", `[6, 2]` -> "6 2". */
export function strokeDashToDasharray(strokeDash: number | [number, number]): string {
  return Array.isArray(strokeDash) ? `${strokeDash[0]} ${strokeDash[1]}` : `${strokeDash} ${strokeDash}`
}
