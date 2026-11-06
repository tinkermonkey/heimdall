import type { GraphAttributeValue, GraphEdge, GraphNodeData } from '../../components/GraphCanvas'
import { assignPredicateCodes } from './predicates'
import type {
  BuildLayeredIndexOptions,
  IndexedLayer,
  IndexedLink,
  IndexedNode,
  LayerAccessor,
  LayeredIndex,
  LayeredIndexIssue,
  LayerPairSummary,
} from './types'

/** Number of `--graph-layer-<n>` palette tokens; layers past it reuse the palette from the start. */
export const LAYER_PALETTE_SIZE = 12

/** CSS color for the layer at `rank` when its `LayerDef` sets none. */
export function layerPaletteColor(rank: number): string {
  return `rgb(var(--graph-layer-${(rank % LAYER_PALETTE_SIZE) + 1}))`
}

/** The pair key for two layers, in rank order: a JSON array of the two layer ids. */
export function layerPairKey(a: { id: string; rank: number }, b: { id: string; rank: number }): string {
  return JSON.stringify(a.rank <= b.rank ? [a.id, b.id] : [b.id, a.id])
}

/** `base`, or `base#2`, `base#3`, … — the first not in `taken`; added to `taken`. */
function uniqueId(base: string, taken: Set<string>): string {
  let id = base
  for (let k = 2; taken.has(id); k++) id = `${base}#${k}`
  taken.add(id)
  return id
}

function truncate(label: string, max: number): string {
  return label.length > max ? label.slice(0, Math.max(1, max - 1)) + '…' : label
}

/** The node's layering values, normalized to strings; [] when it has none. */
export function readLayerValues(node: GraphNodeData, layerBy: LayerAccessor): string[] {
  let raw: GraphAttributeValue | readonly GraphAttributeValue[] | undefined
  if (typeof layerBy === 'function') raw = layerBy(node)
  else if (layerBy === 'kind') raw = node.kind
  else if (layerBy === 'domainColor') raw = node.domainColor
  else raw = node.attributes?.[layerBy]
  const list = Array.isArray(raw) ? raw : [raw]
  const out: string[] = []
  for (const v of list as readonly (GraphAttributeValue | undefined)[]) {
    if (v === null || v === undefined || v === '') continue
    const s = String(v)
    if (!out.includes(s)) out.push(s)
  }
  return out
}

function readCategory(edge: GraphEdge, by: BuildLayeredIndexOptions['linkCategoryBy']): string | undefined {
  if (!by) return undefined
  if (typeof by === 'function') return by(edge) || undefined
  const v = edge.attributes?.[by]
  const first = Array.isArray(v) ? v[0] : v
  return first === null || first === undefined || first === '' ? undefined : String(first)
}

/**
 * Indexes a graph for the layered views. Each node goes on the layer its `layerBy` attribute
 * names (with the `multiValue` and `missingValue` policies for several or no values); edges that
 * share a source and target instance are bundled into one link (direction kept: A→B and B→A stay
 * separate), with each link's predicates (edge labels), categories, cross-layer flag and layer
 * pair; degrees and per-layer and per-pair link totals are counted. Pure; memoize on the inputs.
 * Input that can't be placed is left out and reported in `issues` rather than thrown.
 */
export function buildLayeredIndex(
  nodeDefs: readonly GraphNodeData[],
  edgeDefs: readonly GraphEdge[],
  options: BuildLayeredIndexOptions,
): LayeredIndex {
  const catalog = options.catalog ?? {}
  const fallbackCategory = options.fallbackCategory ?? 'other'
  const multiValue = options.multiValue ?? 'first'
  const missingValue = options.missingValue ?? 'exclude'
  const maxLabel = options.maxLabelLength ?? 30
  const issues: LayeredIndexIssue[] = []

  // 1. assign layer values to node instances
  type Placement = { node: GraphNodeData; layerIds: string[] }
  const placements: Placement[] = []
  const seenNode = new Set<string>()
  const appearance: string[] = []
  for (const node of nodeDefs) {
    if (seenNode.has(node.id)) {
      issues.push({ kind: 'duplicate-node', id: node.id, detail: `Node "${node.id}" appears more than once; the first is used.` })
      continue
    }
    seenNode.add(node.id)
    let values = readLayerValues(node, options.layerBy)
    if (values.length === 0) {
      if (missingValue === 'exclude') {
        issues.push({ kind: 'missing-layer-value', id: node.id, detail: `Node "${node.id}" has no layer value and is left out.` })
        continue
      }
      values = ['']
    } else if (values.length > 1) {
      if (multiValue === 'exclude') {
        issues.push({ kind: 'multi-value-excluded', id: node.id, detail: `Node "${node.id}" has ${values.length} layer values and is left out.` })
        continue
      }
      if (multiValue === 'first') values = [values[0]]
      else if (multiValue === 'last') values = [values[values.length - 1]]
    }
    for (const v of values) if (!appearance.includes(v)) appearance.push(v)
    placements.push({ node, layerIds: values })
  }

  // 2. layers: listed defs first (in their order, when present), then the rest by appearance
  const defs = new Map((options.layers ?? []).map((d) => [d.id, d]))
  const listed = (options.layers ?? []).map((d) => d.id).filter((id) => appearance.includes(id))
  const ordered = [...listed, ...appearance.filter((id) => !defs.has(id))]
  const layers: IndexedLayer[] = ordered.map((id, rank) => {
    const def = defs.get(id)
    return {
      id,
      label: def?.label ?? (id === '' ? options.missingLayerLabel ?? 'Unassigned' : id),
      color: def?.color ?? layerPaletteColor(rank),
      rank,
      nodeIds: [],
      intraLinkCount: 0,
      crossLinkCount: 0,
    }
  })
  const layerById = new Map(layers.map((l) => [l.id, l]))

  // 3. node instances. Derived ids (multi-layer copies, spanning links) must not collide with input ids.
  const takenNodeIds = new Set(placements.map((p) => p.node.id))
  const takenLinkIds = new Set(edgeDefs.map((e) => e.id))
  const nodes: IndexedNode[] = []
  const nodeById = new Map<string, IndexedNode>()
  const instancesOf = new Map<string, string[]>()
  for (const { node, layerIds } of placements) {
    const ids: string[] = []
    for (const layerId of layerIds) {
      const layer = layerById.get(layerId)!
      const id = layerIds.length > 1 ? uniqueId(`${node.id}@${layerId}`, takenNodeIds) : node.id
      const desc = node.attributes?.description
      const inst: IndexedNode = {
        id,
        nodeId: node.id,
        layerId,
        layerRank: layer.rank,
        label: node.label,
        displayLabel: truncate(node.label, maxLabel),
        kind: node.kind,
        description: typeof desc === 'string' ? desc : undefined,
        weight: node.weight,
        position: node.x !== undefined && node.y !== undefined ? { x: node.x, y: node.y } : undefined,
        source: node,
        degree: 0,
        crossDegree: 0,
        adjacency: [],
      }
      nodes.push(inst)
      nodeById.set(id, inst)
      layer.nodeIds.push(id)
      ids.push(id)
    }
    instancesOf.set(node.id, ids)
  }

  // 4. links: bundle edges per directed instance pair
  const links: IndexedLink[] = []
  const linkByPair = new Map<string, IndexedLink>()
  const rawCats = new Map<IndexedLink, string[]>()
  for (const e of edgeDefs) {
    const srcs = instancesOf.get(e.sourceId)
    const tgts = instancesOf.get(e.targetId)
    if (!srcs || !tgts) {
      if (!seenNode.has(e.sourceId) || !seenNode.has(e.targetId)) {
        issues.push({ kind: 'dangling-edge', id: e.id, detail: `Edge "${e.id}" references missing node "${!seenNode.has(e.sourceId) ? e.sourceId : e.targetId}".` })
      }
      continue // an end was left out by a layer policy: already reported on the node
    }
    if (e.sourceId === e.targetId) {
      issues.push({ kind: 'self-loop', id: e.id, detail: `Edge "${e.id}" is a self-loop on "${e.sourceId}"; self-loops are not drawn.` })
      continue
    }
    const category = readCategory(e, options.linkCategoryBy) ?? (e.label ? catalog[e.label]?.category : undefined) ?? fallbackCategory
    const spans = srcs.length * tgts.length > 1
    for (const sId of srcs) {
      for (const tId of tgts) {
        const pairId = JSON.stringify([sId, tId])
        let link = linkByPair.get(pairId)
        if (!link) {
          const s = nodeById.get(sId)!
          const t = nodeById.get(tId)!
          link = {
            id: spans ? uniqueId(`${e.id}@${sId}>${tId}`, takenLinkIds) : e.id,
            sourceId: sId,
            targetId: tId,
            predicates: [],
            predicateCategories: [],
            categories: [],
            primaryCategory: fallbackCategory,
            cross: s.layerId !== t.layerId,
            pairKey: layerPairKey(layerById.get(s.layerId)!, layerById.get(t.layerId)!),
            edgeIds: [],
          }
          linkByPair.set(pairId, link)
          links.push(link)
          rawCats.set(link, [])
        }
        link.edgeIds.push(e.id)
        if (e.label && !link.predicates.includes(e.label)) {
          link.predicates.push(e.label)
          link.predicateCategories.push(category)
        }
        const cats = rawCats.get(link)!
        if (!cats.includes(category)) cats.push(category)
      }
    }
  }

  // 5. categories in categoryOrder, then first appearance
  const appearanceCats: string[] = []
  for (const l of links) for (const c of rawCats.get(l)!) if (!appearanceCats.includes(c)) appearanceCats.push(c)
  const categoryOrder = options.categoryOrder ?? []
  const categories = [...categoryOrder.filter((c) => appearanceCats.includes(c)), ...appearanceCats.filter((c) => !categoryOrder.includes(c))]
  const catRank = new Map(categories.map((c, i) => [c, i]))

  // 6. derived link fields, degrees, counts
  const linkById = new Map<string, IndexedLink>()
  const categoryCounts: Record<string, number> = {}
  const pairCounts = new Map<string, number>()
  for (const link of links) {
    link.categories = rawCats.get(link)!.slice().sort((a, b) => catRank.get(a)! - catRank.get(b)!)
    link.primaryCategory = link.categories[0] ?? fallbackCategory
    linkById.set(link.id, link)
    categoryCounts[link.primaryCategory] = (categoryCounts[link.primaryCategory] ?? 0) + 1
    const s = nodeById.get(link.sourceId)!
    const t = nodeById.get(link.targetId)!
    s.adjacency.push({ linkId: link.id, otherId: t.id, direction: 'out' })
    t.adjacency.push({ linkId: link.id, otherId: s.id, direction: 'in' })
    s.degree++
    t.degree++
    if (link.cross) {
      s.crossDegree++
      t.crossDegree++
      layerById.get(s.layerId)!.crossLinkCount++
      layerById.get(t.layerId)!.crossLinkCount++
      pairCounts.set(link.pairKey, (pairCounts.get(link.pairKey) ?? 0) + 1)
    } else {
      layerById.get(s.layerId)!.intraLinkCount++
    }
  }

  const layerPairs: LayerPairSummary[] = []
  for (let i = 0; i < layers.length; i++) {
    for (let j = i + 1; j < layers.length; j++) {
      const key = layerPairKey(layers[i], layers[j])
      layerPairs.push({ key, layerIds: [layers[i].id, layers[j].id], linkCount: pairCounts.get(key) ?? 0 })
    }
  }

  const predicateCodes = assignPredicateCodes(links.flatMap((l) => l.predicates), catalog)

  return { layers, nodes, links, layerById, nodeById, linkById, instancesOf, layerPairs, categoryCounts, categories, catalog, predicateCodes, issues }
}
