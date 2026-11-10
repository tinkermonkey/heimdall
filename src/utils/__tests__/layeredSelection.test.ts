// Multi-select reach, the selection model of useLayeredGraph (single and multi), shared node
// labels and the exported useControllable (tinkermonkey/heimdall#338).
import { describe, it, expect, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildLayeredIndex, computeReach, reachPath, DEFAULT_LINK_FILTERS } from '../layered'
import { useLayeredGraph, type LayeredGraphState, type UseLayeredGraphOptions } from '../../hooks/useLayeredGraph'
import { useControllable } from '../../hooks/useControllable'
import { drLayers, drCategoryOrder, drSpecNodes, drSpecEdges } from '../../test-pages/fixtures/layeredGraphFixtures'

const layering = { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }
const spec = () => buildLayeredIndex(drSpecNodes, drSpecEdges, layering)
const APP = 'application.applicationcomponent'
const PROCESS = 'business.businessprocess'

function renderHook<T>(hook: () => T): T {
  let out: T | undefined
  renderToStaticMarkup(createElement(() => { out = hook(); return null }))
  return out as T
}
const render = (opts: Partial<UseLayeredGraphOptions>): LayeredGraphState =>
  renderHook(() => useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout: false, ...opts }))

describe('computeReach with several origins', () => {
  it('is the union of each origin’s reach, lowest hop first', () => {
    const ix = spec()
    const a = computeReach(ix, APP, { follow: 1 })
    const b = computeReach(ix, PROCESS, { follow: 1 })
    const both = computeReach(ix, [APP, PROCESS], { follow: 1 })
    expect(both.originId).toBe(APP)
    expect(both.originIds).toEqual([APP, PROCESS])
    expect(both.hopOf.get(APP)).toBe(0)
    expect(both.hopOf.get(PROCESS)).toBe(0)
    const ids = new Set([...a.hopOf.keys(), ...b.hopOf.keys()])
    expect(both.hopOf.size).toBe(ids.size)
    for (const id of ids) {
      if (id === APP || id === PROCESS) continue
      expect(both.hopOf.get(id)).toBe(Math.min(a.hopOf.get(id) ?? Infinity, b.hopOf.get(id) ?? Infinity))
    }
    for (const id of new Set([...a.linkHop.keys(), ...b.linkHop.keys()])) {
      expect(both.linkHop.get(id)).toBe(Math.min(a.linkHop.get(id) ?? Infinity, b.linkHop.get(id) ?? Infinity))
    }
    expect(both.maxHop).toBe(Math.max(...both.linkHop.values()))
  })

  it('walks a reached node back to the origin that reached it', () => {
    const ix = spec()
    const both = computeReach(ix, [APP, PROCESS], { follow: 1 })
    const onlyB = [...both.hopOf].find(([id, h]) => h > 0 && !computeReach(ix, APP, { follow: 1 }).hopOf.has(id))
    expect(onlyB).toBeDefined()
    const path = reachPath(both, onlyB![0])
    expect(path.nodeIds[0]).toBe(PROCESS)
    expect(path.nodeIds.at(-1)).toBe(onlyB![0])
  })

  it('skips missing, duplicate and hidden origins; one left is a plain single reach', () => {
    const ix = spec()
    const single = computeReach(ix, APP, { follow: 2 })
    const r = computeReach(ix, ['missing', APP, APP], { follow: 2 })
    expect(r.originIds).toEqual([APP])
    expect(r.hopOf).toEqual(single.hopOf)
    const hidden = computeReach(ix, [PROCESS, APP], { follow: 2, filters: { ...DEFAULT_LINK_FILTERS, hiddenLayers: ['business'] } })
    expect(hidden.originId).toBe(APP)
    expect(computeReach(ix, [], { follow: 2 }).originId).toBeNull()
    expect(computeReach(ix, [], { follow: 2 }).originIds).toEqual([])
  })
})

describe('useLayeredGraph selection', () => {
  it('single select: selectedIds mirrors selectedId', () => {
    const g = render({ selectedId: APP })
    expect(g.selectedIds).toEqual([APP])
    expect(g.snapshot.selectedIds).toEqual([APP])
    expect(render({ selectedId: null }).selectedIds).toEqual([])
    expect(render({ defaultSelectedId: APP }).selectedIds).toEqual([APP])
  })

  it('multi-select: the primary is the first id, and reach is the union', () => {
    const g = render({ selectedIds: [PROCESS, APP], follow: 1 })
    expect(g.selectedId).toBe(PROCESS)
    expect(g.selectedIds).toEqual([PROCESS, APP])
    expect(g.reach.originIds).toEqual([PROCESS, APP])
    expect(g.reach.hopOf.size).toBe(computeReach(spec(), [PROCESS, APP], { follow: 1 }).hopOf.size)
    expect(g.snapshot).toMatchObject({ selectedId: PROCESS, selectedIds: [PROCESS, APP] })
    // selectedIds wins over selectedId; the default seeds an uncontrolled selection.
    expect(render({ selectedIds: [APP], selectedId: PROCESS }).selectedId).toBe(APP)
    expect(render({ defaultSelectedIds: [APP, PROCESS] }).selectedIds).toEqual([APP, PROCESS])
  })

  it('leaves out ids not in the graph or on a hidden layer', () => {
    const g = render({ selectedIds: ['nope', PROCESS, APP], filters: { ...DEFAULT_LINK_FILTERS, hiddenLayers: ['business'] } })
    expect(g.selectedIds).toEqual([APP])
    expect(g.selectedId).toBe(APP)
  })

  it('select replaces the selection and always reports the primary', () => {
    const onSelect = vi.fn()
    const onSelectedIdsChange = vi.fn()
    const g = render({ selectedIds: [APP, PROCESS], onSelect, onSelectedIdsChange })
    g.select(APP)
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([APP])
    expect(onSelect).toHaveBeenLastCalledWith(APP)
    g.select(null)
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([])
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })

  it('toggleSelected and setSelectedIds compose, and report the primary only when it changes', () => {
    const onSelect = vi.fn()
    const onSelectedIdsChange = vi.fn()
    const g = render({ selectedIds: [APP], onSelect, onSelectedIdsChange })
    g.toggleSelected(PROCESS)
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([APP, PROCESS])
    expect(onSelect).not.toHaveBeenCalled()
    g.toggleSelected(APP) // builds on the ids written above
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([PROCESS])
    expect(onSelect).toHaveBeenLastCalledWith(PROCESS)
    g.setSelectedIds([APP, APP, PROCESS])
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([APP, PROCESS])
    expect(onSelect).toHaveBeenLastCalledWith(APP)
  })

  it('a controlled selectedId alone reports changes through onSelect', () => {
    const onSelect = vi.fn()
    const g = render({ selectedId: APP, onSelect })
    g.toggleSelected(PROCESS)
    expect(onSelect).not.toHaveBeenCalled() // primary unchanged; a single-select parent keeps one node
    g.toggleSelected(APP)
    expect(onSelect).toHaveBeenLastCalledWith(PROCESS)
  })

  it('hiding a layer drops the selected nodes on it', () => {
    const onSelectedIdsChange = vi.fn()
    const onSelect = vi.fn()
    const g = render({ selectedIds: [PROCESS, APP], onSelect, onSelectedIdsChange })
    g.toggleLayer('business')
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([APP])
    expect(onSelect).toHaveBeenLastCalledWith(APP)
  })

  it('restore prefers selectedIds over selectedId', () => {
    const onSelectedIdsChange = vi.fn()
    const g = render({ selectedIds: [], onSelectedIdsChange })
    g.restore({ selectedId: APP, selectedIds: [PROCESS, APP] })
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([PROCESS, APP])
    g.restore({ selectedId: APP })
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([APP])
  })
})

describe('useLayeredGraph node labels', () => {
  it('defaults on, is controllable and is in the snapshot', () => {
    expect(render({}).nodeLabels).toBe(true)
    expect(render({ defaultNodeLabels: false }).nodeLabels).toBe(false)
    const onNodeLabelsChange = vi.fn()
    const g = render({ nodeLabels: false, onNodeLabelsChange })
    expect(g.nodeLabels).toBe(false)
    expect(g.snapshot.nodeLabels).toBe(false)
    g.setNodeLabels(true)
    expect(onNodeLabelsChange).toHaveBeenLastCalledWith(true)
    g.restore({ nodeLabels: false })
    expect(onNodeLabelsChange).toHaveBeenLastCalledWith(false)
  })
})

describe('useControllable', () => {
  it('returns the controlled value and only reports changes', () => {
    const onChange = vi.fn()
    const [value, set] = renderHook(() => useControllable<string | null>(null, 'default', onChange))
    expect(value).toBeNull() // null is a controlled value
    set('next')
    expect(onChange).toHaveBeenCalledWith('next')
  })

  it('holds its own state, seeded from the default, when uncontrolled', () => {
    const [value] = renderHook(() => useControllable<number>(undefined, 3))
    expect(value).toBe(3)
  })
})
