// Cell building for AdjacencyMatrix: node cells (directed or symmetric), the layer heat map, the
// cluster order, and a link's GraphEdgeInspector metadata.
import type { GraphEdgeMetadata } from '../../components/GraphEdgeInspector'
import { louvainCluster, type ClusterTreeNode } from '../graphClustering'
import { linkPredicateLabel } from './labels'
import { orderAcrossLayers } from './layout'
import type { IndexedLink, LayeredIndex } from './types'

/**
 * Row and column order for `order="cluster"`: within each layer, Louvain communities over that
 * layer's own links (either direction), bigger communities first and nested communities kept
 * together. (Over every link, the communities are simply the layers.) Deterministic: Louvain runs
 * on the `degree` order (degree, then label) with edges sorted the same way, never on input order,
 * and ties go to the earlier node. Filters do not change it.
 */
export function clusterOrder(index: LayeredIndex): string[] {
  const base = orderAcrossLayers(index, null, 'degree')
  const pos = new Map(base.map((id, i) => [id, i]))
  const layerOf = (id: string) => index.nodeById.get(id)!.layerId

  const size = new Map<ClusterTreeNode, { n: number; first: number }>()
  const measure = (t: ClusterTreeNode): { n: number; first: number } => {
    let m = { n: 1, first: pos.get(t.id) ?? Infinity }
    if (t.children?.length) {
      m = { n: 0, first: Infinity }
      for (const c of t.children) {
        const cm = measure(c)
        m.n += cm.n
        m.first = Math.min(m.first, cm.first)
      }
    }
    size.set(t, m)
    return m
  }
  const walk = (t: ClusterTreeNode, out: string[]) => {
    if (!t.children?.length) {
      if (pos.has(t.id)) out.push(t.id)
      return
    }
    const kids = [...t.children].sort((a, b) => size.get(b)!.n - size.get(a)!.n || size.get(a)!.first - size.get(b)!.first)
    for (const k of kids) walk(k, out)
  }

  return index.layers.flatMap((layer) => {
    const ids = base.filter((id) => layerOf(id) === layer.id)
    const edges = index.links
      .filter((l) => !l.cross && layerOf(l.sourceId) === layer.id)
      .map((l) => ({ source: l.sourceId, target: l.targetId, s: pos.get(l.sourceId)!, t: pos.get(l.targetId)! }))
      .sort((a, b) => a.s - b.s || a.t - b.t)
    const tree = louvainCluster(ids, edges)
    measure(tree)
    const out: string[] = []
    walk(tree, out)
    return out
  })
}

/** A link as `GraphEdgeInspector` metadata: predicates as the title, layers and category as rows. */
export function linkEdgeMetadata(index: LayeredIndex, link: IndexedLink): GraphEdgeMetadata {
  const s = index.nodeById.get(link.sourceId)!
  const t = index.nodeById.get(link.targetId)!
  const sl = index.layerById.get(s.layerId)?.label ?? s.layerId
  const tl = index.layerById.get(t.layerId)?.label ?? t.layerId
  return {
    id: link.id,
    predicate: link.predicates.length ? linkPredicateLabel(link, index.catalog) : link.primaryCategory,
    sourceId: s.id,
    sourceTitle: s.label,
    targetId: t.id,
    targetTitle: t.label,
    metadata: {
      layers: link.cross ? `${sl} → ${tl}` : `within ${sl}`,
      category: link.primaryCategory,
      edges: link.edgeIds.length,
    },
  }
}

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
