import { DEFAULT_LINK_FILTERS, isLinkTraversable } from './filters'
import type { LayeredIndex, ReachOptions, ReachResult, ReachVia } from './types'

const EMPTY: ReachResult = Object.freeze({
  originId: null,
  originIds: [],
  hopOf: new Map(),
  linkHop: new Map(),
  via: new Map(),
  maxHop: 0,
})

/**
 * Which nodes and links a selection reaches. Hop 1 is every traversable link of the origin, in
 * either direction and on any layer. Then, up to `follow` more times, it continues from the nodes
 * the previous hop reached over a cross-layer link, along cross-layer links into any layer but the
 * origin's own ("away from the clicked layer"). A node keeps the first (lowest) hop that reached
 * it, and a link never leads back to a node reached at an earlier hop. Hidden layers, categories
 * and predicates (`filters`) are not traversed.
 *
 * Several origins (a multi-selection) reach the union of what each reaches on its own: every
 * origin is hop 0, any other node keeps the lowest hop any origin reached it at (with that
 * origin's `via`), and each link its lowest hop. `originId` is the first origin in the graph, and
 * `originIds` lists them all. Origins missing from the graph or on a hidden layer are skipped.
 */
export function computeReach(
  index: LayeredIndex,
  origin: string | readonly string[] | null | undefined,
  options: ReachOptions = {},
): ReachResult {
  if (origin == null || typeof origin === 'string') return reachFrom(index, origin, options)
  const results: ReachResult[] = []
  for (const id of new Set(origin)) {
    const r = reachFrom(index, id, options)
    if (r.originId !== null) results.push(r)
  }
  if (results.length === 0) return EMPTY
  if (results.length === 1) return results[0]
  return mergeReach(results)
}

/** The union of several single-origin reaches, lowest hop first (see `computeReach`). */
function mergeReach(results: readonly ReachResult[]): ReachResult {
  const originIds = results.map((r) => r.originId!)
  const hopOf = new Map<string, number>(originIds.map((id) => [id, 0]))
  const linkHop = new Map<string, number>()
  const via = new Map<string, ReachVia>()
  for (const r of results) {
    for (const [id, hop] of r.hopOf) {
      const prior = hopOf.get(id)
      if (prior !== undefined && prior <= hop) continue
      hopOf.set(id, hop)
      const v = r.via.get(id)
      if (v) via.set(id, v)
    }
    for (const [id, hop] of r.linkHop) {
      const prior = linkHop.get(id)
      if (prior === undefined || hop < prior) linkHop.set(id, hop)
    }
  }
  let maxHop = 0
  for (const hop of linkHop.values()) maxHop = Math.max(maxHop, hop)
  return { originId: originIds[0], originIds, hopOf, linkHop, via, maxHop }
}

function reachFrom(index: LayeredIndex, originId: string | null | undefined, options: ReachOptions): ReachResult {
  const origin = originId != null ? index.nodeById.get(originId) : undefined
  if (!origin) return EMPTY
  const filters = options.filters ?? DEFAULT_LINK_FILTERS
  if (filters.hiddenLayers.includes(origin.layerId)) return EMPTY
  const follow = Math.max(0, Math.floor(options.follow ?? 1))
  const followCats = options.followCategories ?? null

  const hopOf = new Map<string, number>([[origin.id, 0]])
  const linkHop = new Map<string, number>()
  const via = new Map<string, ReachVia>()
  let maxHop = 0

  let frontier: string[] = []
  for (const a of origin.adjacency) {
    const link = index.linkById.get(a.linkId)!
    if (!isLinkTraversable(link, index, filters)) continue
    linkHop.set(link.id, 1)
    maxHop = 1
    if (!hopOf.has(a.otherId)) {
      hopOf.set(a.otherId, 1)
      via.set(a.otherId, { fromId: origin.id, linkId: link.id })
      if (link.cross) frontier.push(a.otherId)
    }
  }

  for (let hop = 2; hop <= follow + 1 && frontier.length > 0; hop++) {
    const next: string[] = []
    for (const fromId of frontier) {
      for (const a of index.nodeById.get(fromId)!.adjacency) {
        const link = index.linkById.get(a.linkId)!
        if (!link.cross) continue
        const to = index.nodeById.get(a.otherId)!
        if (to.layerId === origin.layerId) continue
        const prior = hopOf.get(to.id)
        if (prior !== undefined && prior < hop) continue
        if (!isLinkTraversable(link, index, filters)) continue
        if (followCats && !link.categories.some((c) => followCats.includes(c))) continue
        if (!linkHop.has(link.id)) linkHop.set(link.id, hop)
        maxHop = Math.max(maxHop, hop)
        if (prior === undefined) {
          hopOf.set(to.id, hop)
          via.set(to.id, { fromId, linkId: link.id })
          next.push(to.id)
        }
      }
    }
    frontier = next
  }

  return { originId: origin.id, originIds: [origin.id], hopOf, linkHop, via, maxHop }
}

/**
 * The chain from the origin to `nodeId`: node ids origin first, and the link ids between them;
 * empty if unreached. With several origins, the chain starts at the origin that reached it.
 */
export function reachPath(reach: ReachResult, nodeId: string): { nodeIds: string[]; linkIds: string[] } {
  if (!reach.hopOf.has(nodeId)) return { nodeIds: [], linkIds: [] }
  const nodeIds = [nodeId]
  const linkIds: string[] = []
  let cur = nodeId
  while (reach.hopOf.get(cur) !== 0) {
    const v = reach.via.get(cur)
    if (!v) break
    linkIds.unshift(v.linkId)
    nodeIds.unshift(v.fromId)
    cur = v.fromId
  }
  return { nodeIds, linkIds }
}
