/**
 * Link batching for a projected scene: links that share a style are drawn as one SVG path, their
 * segments concatenated in `d`, so a frame restyles one element per style instead of one per link
 * (tinkermonkey/heimdall#379). Not in the package index.
 */

/** One link (or arrowhead) to batch: its geometry and the style it is drawn with. */
export interface BatchItem {
  /** Path data for this link alone (`M… L…`, or a closed arrowhead). */
  d: string
  color: string
  /** Stroke opacity for links, fill opacity for arrowheads. */
  opacity: number
  /** SVG stroke-dasharray; '' = solid. Unused for arrowheads. */
  dash: string
  /** Stroke width, scene units (already scaled by perspective). Unused for arrowheads (0). */
  width: number
  /** Emphasis draw order: higher on top. */
  z: number
  /** Depth of the link's midpoint; larger is farther. */
  depth: number
}

/** One path: every item that shares a style. */
export interface LinkBatch {
  /** Stable while the style is the same: color, opacity, dash, width step and z. */
  key: string
  color: string
  opacity: number
  dash: string
  width: number
  z: number
  /** The members' path data, concatenated (each starts with its own `M`). */
  d: string
  count: number
}

/**
 * Stroke widths are rounded to this step, so links whose perspective scale differs a little share
 * a path. Batches are therefore also depth bands: near links (wider) and far links (narrower)
 * fall into different batches, which keeps painter's order roughly right between them.
 */
export const BATCH_WIDTH_STEP = 0.1

export function batchWidth(width: number): number {
  return Math.max(BATCH_WIDTH_STEP, Math.round(width / BATCH_WIDTH_STEP) * BATCH_WIDTH_STEP)
}

/**
 * Groups items by style and returns the batches in painter's order: lower z first, then farther
 * (mean member depth) first. Within a batch, overlapping segments no longer compound their
 * opacity where they cross; that is the accepted cost of drawing them as one path.
 */
export function batchLinks(items: readonly BatchItem[]): LinkBatch[] {
  const byKey = new Map<string, LinkBatch & { parts: string[]; depthSum: number }>()
  for (const it of items) {
    const width = it.width > 0 ? batchWidth(it.width) : 0
    const key = `${it.z}|${it.color}|${it.opacity}|${it.dash}|${width.toFixed(1)}`
    let b = byKey.get(key)
    if (!b) {
      b = { key, color: it.color, opacity: it.opacity, dash: it.dash, width, z: it.z, d: '', count: 0, parts: [], depthSum: 0 }
      byKey.set(key, b)
    }
    b.parts.push(it.d)
    b.count += 1
    b.depthSum += it.depth
  }
  return [...byKey.values()]
    .map((b) => ({ b, depth: b.depthSum / b.count }))
    .sort((x, y) => x.b.z - y.b.z || y.depth - x.depth || (x.b.key < y.b.key ? -1 : 1))
    .map(({ b }) => ({ key: b.key, color: b.color, opacity: b.opacity, dash: b.dash, width: b.width, z: b.z, d: b.parts.join(''), count: b.count }))
}

/** An arrowhead's `points` string (`x,y x,y x,y`) as closed path data. */
export function pointsToPath(points: string): string {
  const [a, b, c] = points.split(' ')
  return `M${a}L${b}L${c}Z`
}
