import type { IndexedLink, IndexedNode, LayeredIndex, LinkFilterState } from './types'

export const DEFAULT_LINK_FILTERS: LinkFilterState = Object.freeze({
  hiddenLayers: [],
  categories: {},
  hiddenPredicates: [],
  showIntra: true,
  layerPair: null,
})

export function isNodeVisible(node: IndexedNode, filters: LinkFilterState): boolean {
  return !filters.hiddenLayers.includes(node.layerId)
}

/** The link's predicates left after category and predicate filters. */
export function visiblePredicates(link: IndexedLink, filters: LinkFilterState): string[] {
  return link.predicates.filter(
    (p, i) => filters.categories[link.predicateCategories[i]] !== false && !filters.hiddenPredicates.includes(p),
  )
}

/**
 * Whether reach may travel along the link: both ends on visible layers and at least one predicate
 * left after category and predicate filters. Ignores `showIntra` and `layerPair`, which only hide.
 */
export function isLinkTraversable(link: IndexedLink, index: LayeredIndex, filters: LinkFilterState): boolean {
  const s = index.nodeById.get(link.sourceId)
  const t = index.nodeById.get(link.targetId)
  if (!s || !t || !isNodeVisible(s, filters) || !isNodeVisible(t, filters)) return false
  // A link from unlabeled edges has no predicates: it shows while any of its categories does.
  if (link.predicates.length === 0) return link.categories.some((c) => filters.categories[c] !== false)
  return visiblePredicates(link, filters).length > 0
}

/** Whether a view should draw the link: traversable, plus the intra-layer and layer-pair filters. */
export function isLinkVisible(link: IndexedLink, index: LayeredIndex, filters: LinkFilterState): boolean {
  if (!link.cross && !filters.showIntra) return false
  if (filters.layerPair && !(link.cross && link.pairKey === filters.layerPair)) return false
  return isLinkTraversable(link, index, filters)
}

/** Ids of the nodes at either end of the cross-layer links of a layer pair. */
export function layerPairNodeIds(index: LayeredIndex, pairKey: string | null): Set<string> {
  const ids = new Set<string>()
  if (!pairKey) return ids
  for (const l of index.links) {
    if (l.cross && l.pairKey === pairKey) {
      ids.add(l.sourceId)
      ids.add(l.targetId)
    }
  }
  return ids
}
