// reachRelationships, reachSummaryText and ReachInspector's context requirement
// (tinkermonkey/heimdall#338). ReachInspector itself is covered by the chrome Playwright spec.
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ReachInspector, reachRelationships, reachSummaryText } from '../ReachInspector'
import { LayeredGraphContext, useLayeredGraph } from '../../hooks/useLayeredGraph'
import type { GraphEdge, GraphNodeData } from '../GraphCanvas'
import { buildLayeredIndex, computeReach, DEFAULT_LINK_FILTERS, type LinkFilterState } from '../../utils/layered'
import type { LayeredIndex } from '../../utils/layered/types'
import { drLayers, drCategoryOrder, drSpecNodes, drSpecEdges } from '../../test-pages/fixtures/layeredGraphFixtures'

const node = (id: string, layer: string): GraphNodeData => ({ id, label: id.toUpperCase(), attributes: { layer } })
const edge = (id: string, s: string, t: string, label: string, category = 'structural'): GraphEdge =>
  ({ id, sourceId: s, targetId: t, label, attributes: { category } })

// a (L1) —owns→ b (L2); c (L1) —uses→ a; b —serves→ d (L3); b —runs→ e (L3); d —feeds→ a.
const small = () =>
  buildLayeredIndex(
    [node('a', 'L1'), node('b', 'L2'), node('c', 'L1'), node('d', 'L3'), node('e', 'L3')],
    [
      edge('ab', 'a', 'b', 'owns'),
      edge('ca', 'c', 'a', 'uses', 'behavioral'),
      edge('bd', 'b', 'd', 'serves'),
      edge('be', 'b', 'e', 'runs', 'behavioral'),
      edge('da', 'd', 'a', 'feeds', 'behavioral'),
    ],
    { layerBy: 'layer', linkCategoryBy: 'category' },
  )

function graphFor(index: LayeredIndex, selectedId: string | null, follow = 1, f: Partial<LinkFilterState> = {}) {
  const filters = { ...DEFAULT_LINK_FILTERS, ...f }
  return { index, filters, selectedId, reach: computeReach(index, selectedId, { follow, filters }) }
}

describe('reachRelationships', () => {
  it('is null without a selection or with an unknown one', () => {
    const ix = small()
    expect(reachRelationships(graphFor(ix, null))).toBeNull()
    expect(reachRelationships(graphFor(ix, 'zzz'))).toBeNull()
  })

  it('splits direct links into cross-layer and intra-layer rows, with direction, predicate and layer', () => {
    const rels = reachRelationships(graphFor(small(), 'a', 0))!
    expect(rels.node.id).toBe('a')
    expect(rels.layer.id).toBe('L1')
    expect(rels.cross.map((r) => [r.target, r.direction, r.predicate, r.hop, r.layer?.id])).toEqual([
      ['b', 'out', 'owns', 1, 'L2'],
      ['d', 'in', 'feeds', 1, 'L3'],
    ])
    expect(rels.intra.map((r) => [r.target, r.direction, r.predicate, r.layer?.id])).toEqual([['c', 'in', 'uses', 'L1']])
    expect(rels.cross[0]).toMatchObject({ targetTitle: 'B', id: 'ab:out' })
    expect(rels.followed).toEqual([])
    expect(rels.reachCount).toBe(3)
    expect(rels.reachLayerCount).toBe(3)
  })

  it('lists followed nodes with their hop and the node and predicate they came through', () => {
    const rels = reachRelationships(graphFor(small(), 'a', 1))!
    // d is direct (hop 1); e is followed from b along `runs`.
    expect(rels.followed).toEqual([
      {
        id: 'followed:e',
        target: 'e',
        targetTitle: 'E',
        predicate: 'runs',
        direction: 'out',
        hop: 2,
        via: { id: 'b', title: 'B', predicate: 'runs' },
        layer: { id: 'L3', label: 'L3', color: expect.any(String) },
      },
    ])
    expect(rels.reachCount).toBe(4)
  })

  it('leaves out links the filters make untraversable', () => {
    const ix = small()
    const noBehavioral = reachRelationships(graphFor(ix, 'a', 1, { categories: { behavioral: false } }))!
    expect(noBehavioral.cross.map((r) => r.target)).toEqual(['b'])
    expect(noBehavioral.intra).toEqual([])
    // Without `feeds`, d is no longer direct: it is followed from b along `serves`.
    expect(noBehavioral.followed.map((r) => [r.target, r.hop, r.via?.id, r.predicate])).toEqual([['d', 2, 'b', 'serves']])
    const hiddenL3 = reachRelationships(graphFor(ix, 'a', 1, { hiddenLayers: ['L3'] }))!
    expect(hiddenL3.cross.map((r) => r.target)).toEqual(['b'])
    expect(hiddenL3.reachLayerCount).toBe(2)
  })

  it('labels a bundled link with its visible predicates only', () => {
    const ix = buildLayeredIndex(
      [node('a', 'L1'), node('b', 'L2')],
      [edge('ab1', 'a', 'b', 'owns'), edge('ab2', 'a', 'b', 'serves')],
      { layerBy: 'layer', linkCategoryBy: 'category' },
    )
    expect(reachRelationships(graphFor(ix, 'a'))!.cross[0].predicate).toBe('owns · serves')
    expect(reachRelationships(graphFor(ix, 'a', 1, { hiddenPredicates: ['owns'] }))!.cross[0].predicate).toBe('serves')
  })

  it('lists no followed nodes when the reach belongs to another node', () => {
    const ix = small()
    const g = { ...graphFor(ix, 'a', 1), reach: computeReach(ix, 'b', { follow: 1 }) }
    expect(reachRelationships(g)!.followed).toEqual([])
  })

  it('orders followed nodes by hop, then layer, then name (spec fixture)', () => {
    const ix = buildLayeredIndex(drSpecNodes, drSpecEdges, { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' })
    const rels = reachRelationships(graphFor(ix, 'application.applicationcomponent', 2))!
    expect(rels.reachCount).toBe(14)
    // One row per link and direction, so a node linked both ways has two rows.
    const direct = new Set([...rels.cross, ...rels.intra].map((r) => r.target))
    expect(direct.size).toBe(10)
    expect([...rels.cross, ...rels.intra].every((r) => r.hop === 1)).toBe(true)
    expect(rels.followed).toHaveLength(4)
    for (let i = 1; i < rels.followed.length; i++) {
      const [p, q] = [rels.followed[i - 1], rels.followed[i]]
      const [pr, qr] = [ix.layerById.get(p.layer!.id)!.rank, ix.layerById.get(q.layer!.id)!.rank]
      expect(p.hop! < q.hop! || (p.hop === q.hop && (pr < qr || (pr === qr && p.targetTitle.localeCompare(q.targetTitle) <= 0)))).toBe(true)
    }
    for (const f of rels.followed) expect(f.via?.predicate).toBe(f.predicate)
  })
})

describe('reachSummaryText', () => {
  it('counts nodes and layers and names the follow depth', () => {
    expect(reachSummaryText({ reachCount: 13, reachLayerCount: 3 }, 1)).toBe('reach 13 nodes across 3 layers · follow +1 layer')
    expect(reachSummaryText({ reachCount: 1, reachLayerCount: 1 }, 0)).toBe('reach 1 node across 1 layer · follow direct only')
  })
})

describe('ReachInspector', () => {
  it('throws without a graph prop or a LayeredGraphContext provider', () => {
    expect(() => renderToStaticMarkup(createElement(ReachInspector))).toThrow(
      'ReachInspector needs a `graph` prop or an enclosing <LayeredGraphContext.Provider>',
    )
  })

  it('renders from the enclosing provider', () => {
    const layering = { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }
    const page = (selectedId: string | null) =>
      renderToStaticMarkup(
        createElement(() => {
          const g = useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout: false, selectedId })
          return createElement(LayeredGraphContext.Provider, { value: g }, createElement(ReachInspector))
        }),
      )
    expect(page(null)).toContain('No node selected.')
    expect(page('application.applicationcomponent')).toContain('ApplicationComponent')
  })
})
