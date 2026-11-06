import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { GraphEdge, GraphNodeData } from '../../components/GraphCanvas'
import {
  buildLayeredIndex,
  computeReach,
  reachPath,
  isLinkVisible,
  isLinkTraversable,
  layerPairNodeIds,
  linkEmphasis,
  nodeEmphasis,
  linkCategoryStyleAt,
  layoutLayers,
  mixLayerPositions,
  orderWithinLayers,
  orderAcrossLayers,
  rankWithinLayers,
  assignPredicateCodes,
  arrowHeadPoints,
  linkPredicateLabel,
  DEFAULT_LINK_FILTERS,
  type LinkFilterState,
} from '../layered'
import { useLayeredGraph, type LayeredGraphState } from '../../hooks/useLayeredGraph'
import { drLayers, drCategoryOrder, drSpecNodes, drSpecEdges, heimdallUxNodes, heimdallUxEdges } from '../../test-pages/fixtures/layeredGraphFixtures'

const spec = () => buildLayeredIndex(drSpecNodes, drSpecEdges, { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' })
const filters = (f: Partial<LinkFilterState>): LinkFilterState => ({ ...DEFAULT_LINK_FILTERS, ...f })
const node = (id: string, layer: string): GraphNodeData => ({ id, label: id, attributes: { layer } })
const edge = (id: string, s: string, t: string, label?: string, category?: string): GraphEdge =>
  ({ id, sourceId: s, targetId: t, label, attributes: category ? { category } : undefined })

describe('buildLayeredIndex', () => {
  it('indexes the DR spec fixture: layers in order, bundled links, cross-layer counts', () => {
    const ix = spec()
    expect(ix.layers.map((l) => l.id)).toEqual(['business', 'application', 'technology'])
    expect(ix.layers.map((l) => l.nodeIds.length)).toEqual([14, 9, 13])
    expect(ix.nodes).toHaveLength(36)
    expect(ix.links).toHaveLength(162)
    expect(ix.links.filter((l) => l.cross)).toHaveLength(22)
    expect(ix.layerPairs.map((p) => p.linkCount)).toEqual([8, 7, 7])
    expect(ix.categories.slice(0, 3)).toEqual(['structural', 'behavioral', 'dependency'])
    expect(ix.issues.every((i) => i.kind === 'self-loop')).toBe(true)
    expect(ix.issues.length).toBeGreaterThan(0)
  })

  it('bundles parallel edges per direction and keeps reverse edges separate', () => {
    const ix = buildLayeredIndex(
      [node('a', 'L1'), node('b', 'L2')],
      [edge('e1', 'a', 'b', 'serves'), edge('e2', 'a', 'b', 'realizes'), edge('e3', 'b', 'a', 'uses'), edge('e4', 'a', 'b', 'serves')],
      { layerBy: 'layer' },
    )
    expect(ix.links).toHaveLength(2)
    const ab = ix.linkById.get('e1')!
    expect(ab.predicates).toEqual(['serves', 'realizes'])
    expect(ab.edgeIds).toEqual(['e1', 'e2', 'e4'])
    expect(ix.nodeById.get('a')!.degree).toBe(2)
  })

  it('reads the layer from an attribute, kind, or an accessor', () => {
    const nodes = [{ id: 'a', label: 'a', kind: 'K1', attributes: { tier: 2 } }, { id: 'b', label: 'b', kind: 'K2', attributes: { tier: 1 } }]
    expect(buildLayeredIndex(nodes, [], { layerBy: 'kind' }).layers.map((l) => l.id)).toEqual(['K1', 'K2'])
    expect(buildLayeredIndex(nodes, [], { layerBy: 'tier', layers: [{ id: '1' }, { id: '2' }] }).layers.map((l) => l.id)).toEqual(['1', '2'])
    expect(buildLayeredIndex(nodes, [], { layerBy: (n) => n.id.toUpperCase() }).layers.map((l) => l.label)).toEqual(['A', 'B'])
  })

  it('applies the multi-value policies', () => {
    const nodes: GraphNodeData[] = [{ id: 'm', label: 'm', attributes: { layer: ['L1', 'L2'] } }, node('x', 'L3')]
    const edges = [edge('e', 'm', 'x', 'uses')]
    expect(buildLayeredIndex(nodes, edges, { layerBy: 'layer' }).nodeById.get('m')!.layerId).toBe('L1')
    expect(buildLayeredIndex(nodes, edges, { layerBy: 'layer', multiValue: 'last' }).nodeById.get('m')!.layerId).toBe('L2')
    const ex = buildLayeredIndex(nodes, edges, { layerBy: 'layer', multiValue: 'exclude' })
    expect(ex.nodeById.has('m')).toBe(false)
    expect(ex.links).toHaveLength(0)
    expect(ex.issues.map((i) => i.kind)).toEqual(['multi-value-excluded'])
    const all = buildLayeredIndex(nodes, edges, { layerBy: 'layer', multiValue: 'all' })
    expect(all.instancesOf.get('m')).toEqual(['m@L1', 'm@L2'])
    expect(all.nodeById.get('m@L2')!.nodeId).toBe('m')
    expect(all.links.map((l) => l.sourceId)).toEqual(['m@L1', 'm@L2'])
  })

  it('excludes or collects nodes with no layer value', () => {
    const nodes = [node('a', 'L1'), { id: 'b', label: 'b' }]
    const ex = buildLayeredIndex(nodes, [edge('e', 'a', 'b')], { layerBy: 'layer' })
    expect(ex.nodes).toHaveLength(1)
    expect(ex.issues.map((i) => i.kind)).toEqual(['missing-layer-value'])
    const kept = buildLayeredIndex(nodes, [edge('e', 'a', 'b')], { layerBy: 'layer', missingValue: 'layer', missingLayerLabel: 'None' })
    expect(kept.layers.map((l) => [l.id, l.label])).toEqual([['L1', 'L1'], ['', 'None']])
    expect(kept.links[0].cross).toBe(true)
  })

  it('reports dangling edges and takes categories from attributes, then the catalog', () => {
    const ix = buildLayeredIndex(
      [node('a', 'L1'), node('b', 'L1')],
      [edge('e1', 'a', 'zz', 'uses'), edge('e2', 'a', 'b', 'serves'), edge('e3', 'b', 'a', 'realizes', 'structural')],
      { layerBy: 'layer', catalog: { serves: { category: 'behavioral' } }, linkCategoryBy: 'category' },
    )
    expect(ix.issues.map((i) => i.kind)).toEqual(['dangling-edge'])
    expect(ix.linkById.get('e2')!.primaryCategory).toBe('behavioral')
    expect(ix.linkById.get('e3')!.primaryCategory).toBe('structural')
  })

  it('gives every predicate a unique two-letter code, catalog codes first', () => {
    const codes = assignPredicateCodes(['provides', 'protects', 'assigned-to', 'performs'], { protects: { category: 'x', code: 'PR' } })
    expect(codes.get('protects')).toBe('PR')
    expect(new Set(codes.values()).size).toBe(4)
    expect(codes.get('assigned-to')).toBe('AT')
  })
})

describe('filters', () => {
  it('hides by layer, category, predicate, intra-layer and layer pair', () => {
    const ix = spec()
    const cross = ix.links.find((l) => l.cross)!
    const intra = ix.links.find((l) => !l.cross)!
    expect(isLinkVisible(intra, ix, filters({ showIntra: false }))).toBe(false)
    expect(isLinkTraversable(intra, ix, filters({ showIntra: false }))).toBe(true)
    expect(isLinkVisible(cross, ix, filters({ categories: Object.fromEntries(cross.categories.map((c) => [c, false])) }))).toBe(false)
    expect(isLinkVisible(cross, ix, filters({ hiddenPredicates: cross.predicates }))).toBe(false)
    expect(isLinkVisible(cross, ix, filters({ hiddenLayers: [ix.nodeById.get(cross.sourceId)!.layerId] }))).toBe(false)
    expect(isLinkVisible(cross, ix, filters({ layerPair: cross.pairKey }))).toBe(true)
    expect(isLinkVisible(intra, ix, filters({ layerPair: cross.pairKey }))).toBe(false)
    expect(layerPairNodeIds(ix, cross.pairKey).has(cross.sourceId)).toBe(true)
  })

  it('shows unlabeled links while their category is visible', () => {
    const ix = buildLayeredIndex([node('a', 'L1'), node('b', 'L2')], [edge('e', 'a', 'b', undefined, 'c1')], { layerBy: 'layer', linkCategoryBy: 'category' })
    const l = ix.links[0]
    expect(l.predicates).toEqual([])
    expect(isLinkVisible(l, ix, DEFAULT_LINK_FILTERS)).toBe(true)
    expect(isLinkVisible(l, ix, filters({ categories: { c1: false } }))).toBe(false)
  })
})

describe('computeReach', () => {
  const idOf = (ix: ReturnType<typeof spec>, label: string) => ix.nodes.find((n) => n.label === label)!.id

  it('matches the prototype: ApplicationComponent reaches 10 / 13 / 14 nodes at follow 0 / 1 / 2', () => {
    const ix = spec()
    const origin = idOf(ix, 'ApplicationComponent')
    expect([0, 1, 2].map((follow) => computeReach(ix, origin, { follow }).hopOf.size - 1)).toEqual([10, 13, 14])
  })

  it('never follows back into the origin layer and records the chain', () => {
    const ix = spec()
    const origin = idOf(ix, 'ApplicationComponent')
    const r = computeReach(ix, origin, { follow: 2 })
    for (const [id, hop] of r.hopOf) {
      if (hop >= 2) expect(ix.nodeById.get(id)!.layerId).not.toBe('application')
    }
    const followed = [...r.hopOf].find(([, h]) => h === 2)![0]
    const path = reachPath(r, followed)
    expect(path.nodeIds[0]).toBe(origin)
    expect(path.nodeIds.at(-1)).toBe(followed)
    expect(path.linkIds).toHaveLength(2)
    expect(r.via.get(followed)!.fromId).toBe(path.nodeIds[1])
  })

  it('continues only from nodes reached over cross-layer links', () => {
    // a(L1) -intra- b(L1) -cross- c(L2); following must not start from b.
    const ix = buildLayeredIndex([node('a', 'L1'), node('b', 'L1'), node('c', 'L2'), node('d', 'L3')],
      [edge('ab', 'a', 'b', 'x'), edge('bc', 'b', 'c', 'x'), edge('ad', 'a', 'd', 'x'), edge('dc', 'd', 'c', 'x')], { layerBy: 'layer' })
    const r = computeReach(ix, 'a', { follow: 1 })
    expect(r.hopOf.get('c')).toBe(2)
    expect(r.via.get('c')!.fromId).toBe('d')
    expect(r.linkHop.has('bc')).toBe(false)
  })

  it('does not traverse hidden layers or categories, and honours followCategories', () => {
    const ix = spec()
    const origin = idOf(ix, 'ApplicationComponent')
    const r = computeReach(ix, origin, { follow: 2, filters: filters({ hiddenLayers: ['technology'] }) })
    for (const id of r.hopOf.keys()) expect(ix.nodeById.get(id)!.layerId).not.toBe('technology')
    const structOnly = computeReach(ix, origin, { follow: 2, followCategories: ['structural'] })
    const all = computeReach(ix, origin, { follow: 2 })
    expect(structOnly.hopOf.size).toBeLessThanOrEqual(all.hopOf.size)
    expect(computeReach(ix, 'missing').originId).toBeNull()
  })
})

describe('emphasis', () => {
  it('ramps reached links by hop and dims the rest', () => {
    const ix = spec()
    const origin = ix.nodes.find((n) => n.label === 'ApplicationComponent')!.id
    const reach = computeReach(ix, origin, { follow: 1 })
    const ctx = { index: ix, filters: DEFAULT_LINK_FILTERS, reach }
    const direct = ix.linkById.get([...reach.linkHop].find(([, h]) => h === 1)![0])!
    const followed = ix.linkById.get([...reach.linkHop].find(([, h]) => h === 2)![0])!
    const other = ix.links.find((l) => !reach.linkHop.has(l.id))!
    expect(linkEmphasis(direct, ctx)).toMatchObject({ highlighted: true, color: 'rgb(var(--graph-hop-1))', arrow: true, label: true })
    expect(linkEmphasis(followed, ctx).color).toBe('rgb(var(--graph-hop-2))')
    expect(linkEmphasis(other, ctx)).toMatchObject({ highlighted: false, opacity: 0.06, label: false })
    expect(linkEmphasis(other, { ...ctx, predicateLabels: 'all' }).label).toBe(false)
    expect(linkEmphasis(other, { index: ix, filters: DEFAULT_LINK_FILTERS, predicateLabels: 'all' }).label).toBe(true)
    expect(nodeEmphasis(ix.nodeById.get(origin)!, ctx)).toMatchObject({ selected: true, tint: 'selected', opacity: 1 })
  })

  it('styles categories by position, with overrides', () => {
    expect(linkCategoryStyleAt(0)).toEqual({ color: 'rgb(var(--graph-link-1))', dash: '' })
    expect(linkCategoryStyleAt(7).color).toBe('rgb(var(--graph-link-2))')
    const ix = spec()
    const link = ix.links.find((l) => l.primaryCategory === 'behavioral')!
    expect(linkEmphasis(link, { index: ix, filters: DEFAULT_LINK_FILTERS }).dash).toBe('6 4')
    expect(linkEmphasis(link, { index: ix, filters: DEFAULT_LINK_FILTERS, styles: { behavioral: { color: 'red', dash: '1 1' } } }).color).toBe('red')
  })

  it('builds labels and arrowheads', () => {
    const ix = spec()
    const link = ix.links.find((l) => l.predicates.length > 1) ?? ix.links[0]
    expect(linkPredicateLabel(link, { [link.predicates[0]]: { category: 'x', label: 'LBL' } }).startsWith('LBL')).toBe(true)
    expect(arrowHeadPoints({ x: 10, y: 0 }, 1, 0, 7, 3)).toBe('10,0 3,3 3,-3')
  })
})

describe('layoutLayers', () => {
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

  it('normalizes into [-1, 1], is deterministic, and coupled shortens cross-layer links', () => {
    const ix = spec()
    const a = layoutLayers(ix, { layoutCategories: ['structural'] })
    const b = layoutLayers(ix, { layoutCategories: ['structural'] })
    expect([...a.coupled]).toEqual([...b.coupled])
    for (const m of [a.independent, a.coupled]) {
      expect(m.size).toBe(36)
      for (const p of m.values()) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(1)
        expect(Math.abs(p.y)).toBeLessThanOrEqual(1)
      }
    }
    const crossLen = (m: ReadonlyMap<string, { x: number; y: number }>) =>
      mean(ix.links.filter((l) => l.cross).map((l) => Math.hypot(m.get(l.sourceId)!.x - m.get(l.targetId)!.x, m.get(l.sourceId)!.y - m.get(l.targetId)!.y)))
    expect(crossLen(a.coupled)).toBeLessThan(crossLen(a.independent))
    const half = mixLayerPositions(a, 0.5)
    const id = ix.nodes[0].id
    expect(half.get(id)!.x).toBeCloseTo((a.independent.get(id)!.x + a.coupled.get(id)!.x) / 2)
  })

  it('orders nodes within and across layers, and ranks them for axes', () => {
    const ix = buildLayeredIndex(heimdallUxNodes, heimdallUxEdges, { layerBy: 'layer', layers: drLayers })
    const layout = layoutLayers(ix)
    const across = orderAcrossLayers(ix, layout)
    expect(across).toHaveLength(ix.nodes.length)
    expect(across.map((id) => ix.nodeById.get(id)!.layerRank)).toEqual([...across.map((id) => ix.nodeById.get(id)!.layerRank)].sort((x, y) => x - y))
    const byLabel = orderWithinLayers(ix, null, 'label').get('business')!
    expect(byLabel).toEqual([...byLabel].sort((x, y) => ix.nodeById.get(x)!.label.localeCompare(ix.nodeById.get(y)!.label)))
    const ranks = rankWithinLayers(ix)
    const app = ix.layerById.get('application')!.nodeIds
    const busiest = app.reduce((m, id) => (ix.nodeById.get(id)!.degree > ix.nodeById.get(m)!.degree ? id : m))
    expect(ranks.get(busiest)).toBe(Math.max(...app.map((id) => ranks.get(id)!)))
  })
})

describe('useLayeredGraph', () => {
  const render = (opts: Parameters<typeof useLayeredGraph>[0]) => {
    let out: LayeredGraphState | null = null
    renderToStaticMarkup(createElement(() => { out = useLayeredGraph(opts); return null }))
    return out! as LayeredGraphState
  }
  const layering = { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }

  it('derives index, layout and reach from controlled state', () => {
    const origin = 'application.applicationcomponent'
    const g = render({ nodes: drSpecNodes, edges: drSpecEdges, layering, selectedId: origin, follow: 2, layout: false })
    expect(g.layout).toBeNull()
    expect(g.selectedId).toBe(origin)
    expect(g.reach.hopOf.size - 1).toBe(14)
    expect(g.snapshot).toMatchObject({ selectedId: origin, follow: 2, predicateLabels: 'highlighted', planeLayout: 'independent' })
    expect(g.linkEmphasis(g.index.links[0]).visible).toBe(true)
  })

  it('drops a selection that is not in the graph and uses defaults when uncontrolled', () => {
    const g = render({ nodes: drSpecNodes, edges: drSpecEdges, layering, defaultSelectedId: 'nope', defaultFollow: 0, layout: false })
    expect(g.selectedId).toBeNull()
    expect(g.follow).toBe(0)
    expect(g.reach.originId).toBeNull()
  })
})
