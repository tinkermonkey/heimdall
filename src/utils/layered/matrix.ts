// Cell building for AdjacencyMatrix: node cells (directed or symmetric) and the layer heat map.
import type { IndexedLink, LayeredIndex } from './types'

/** One node-matrix cell. */
export interface MatrixCell {
  /** Row and column positions in the node order. */
  r: number
  c: number
  /** The links drawn here: one, or two when a symmetric cell merges both directions (row → column first). */
  links: IndexedLink[]
}

/**
 * One cell per link at (source, target). With `symmetric`, a link below the diagonal moves to
 * (target, source), so `A→B` and `B→A` share one cell in the upper triangle.
 */
export function matrixCells(links: Iterable<IndexedLink>, at: ReadonlyMap<string, number>, symmetric: boolean): MatrixCell[] {
  const out: MatrixCell[] = []
  const byKey = new Map<string, MatrixCell>()
  for (const link of links) {
    let r = at.get(link.sourceId)
    let c = at.get(link.targetId)
    if (r === undefined || c === undefined) continue
    const forward = !symmetric || r <= c
    if (!forward) [r, c] = [c, r]
    const key = r + ':' + c
    const cell = byKey.get(key)
    if (!cell) {
      const next = { r, c, links: [link] }
      byKey.set(key, next)
      out.push(next)
    } else if (forward) cell.links.unshift(link)
    else cell.links.push(link)
  }
  return out
}

/** One layer heat-map cell. */
export interface LayerMatrixCell {
  /** Row layer: the links' source layer (either end when symmetric). */
  rowLayerId: string
  /** Column layer: the links' target layer (the other end when symmetric). */
  colLayerId: string
  /** Links counted in this cell. */
  linkCount: number
  /** The layer pair (`layerPairKey`) for a cross-layer cell; null on the diagonal. */
  pairKey: string | null
}

/**
 * Link counts per (source layer, target layer) over `layerIds`, in that order. With `symmetric`,
 * both directions add into the upper triangle. Only non-empty cells are returned.
 */
export function layerMatrixCells(
  index: LayeredIndex,
  layerIds: readonly string[],
  links: Iterable<IndexedLink>,
  symmetric: boolean,
): { cells: (LayerMatrixCell & { r: number; c: number })[]; max: number } {
  const at = new Map(layerIds.map((id, i) => [id, i]))
  const byKey = new Map<string, LayerMatrixCell & { r: number; c: number }>()
  let max = 0
  for (const link of links) {
    let r = at.get(index.nodeById.get(link.sourceId)!.layerId)
    let c = at.get(index.nodeById.get(link.targetId)!.layerId)
    if (r === undefined || c === undefined) continue
    if (symmetric && r > c) [r, c] = [c, r]
    const key = r + ':' + c
    let cell = byKey.get(key)
    if (!cell) {
      cell = { r, c, rowLayerId: layerIds[r], colLayerId: layerIds[c], linkCount: 0, pairKey: r === c ? null : link.pairKey }
      byKey.set(key, cell)
    }
    cell.linkCount++
    max = Math.max(max, cell.linkCount)
  }
  const cells = [...byKey.values()].sort((a, b) => a.r - b.r || a.c - b.c)
  return { cells, max }
}
