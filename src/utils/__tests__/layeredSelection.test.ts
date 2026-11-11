// Multi-select reach, the selection model of useLayeredGraph (single and multi), shared node
// labels and the exported useControllable (tinkermonkey/heimdall#338).
import { describe, it, expect, vi } from 'vitest'
import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
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

  it('restore: a changed selectedId over a carried-along selectedIds wins, and onSelect fires', () => {
    const onSelect = vi.fn()
    const onSelectedIdsChange = vi.fn()
    const g = render({ selectedIds: [APP], onSelect, onSelectedIdsChange })
    g.restore({ ...g.snapshot, selectedId: PROCESS }) // the 0.10.0 pattern
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([PROCESS])
    expect(onSelect).toHaveBeenLastCalledWith(PROCESS)
    g.restore({ ...g.snapshot }) // agreeing ids: re-applied, onSelect still fires
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([APP])
    expect(onSelect).toHaveBeenLastCalledWith(APP)
  })

  it('onSelect reports the visible primary, skipping ids hidden or not in the graph', () => {
    const hideBusiness = { ...DEFAULT_LINK_FILTERS, hiddenLayers: ['business'] }
    const TECH = 'technology.device'
    // ['gone', A] then toggleSelected(A): the visible primary goes from A to none.
    const a = { onSelect: vi.fn() }
    render({ selectedIds: ['gone', APP], ...a }).toggleSelected(APP)
    expect(a.onSelect).toHaveBeenLastCalledWith(null)
    // Hidden H1 first: [H1, A] → [H1, B] changes the visible primary from A to B.
    const b = { onSelect: vi.fn() }
    render({ selectedIds: [PROCESS, APP], filters: hideBusiness, ...b }).setSelectedIds([PROCESS, TECH])
    expect(b.onSelect).toHaveBeenLastCalledWith(TECH)
    // [H1, A] → toggleSelected(A) leaves only the hidden H1: no visible primary.
    const c = { onSelect: vi.fn() }
    render({ selectedIds: [PROCESS, APP], filters: hideBusiness, ...c }).toggleSelected(APP)
    expect(c.onSelect).toHaveBeenLastCalledWith(null)
    // An unchanged visible primary is not reported.
    const d = { onSelect: vi.fn() }
    render({ selectedIds: [PROCESS, APP], filters: hideBusiness, ...d }).setSelectedIds([APP, PROCESS])
    expect(d.onSelect).not.toHaveBeenCalled()
  })

  it('restore uses selectedIds when it agrees with selectedId or that is left out', () => {
    const onSelectedIdsChange = vi.fn()
    const g = render({ selectedIds: [], onSelectedIdsChange })
    g.restore({ selectedIds: [PROCESS, APP] })
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([PROCESS, APP])
    g.restore({ selectedId: APP, selectedIds: [APP, PROCESS] })
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([APP, PROCESS])
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

describe('useLayeredGraph restore and setFilters (review cycle 2)', () => {
  const hideBusiness = { ...DEFAULT_LINK_FILTERS, hiddenLayers: ['business'] }
  const TECH = 'technology.device'

  it('applies whichever selection field the caller changed', () => {
    const onSelectedIdsChange = vi.fn()
    const onSelect = vi.fn()
    const g = render({ selectedIds: [APP], onSelect, onSelectedIdsChange })
    g.restore({ ...g.snapshot, selectedIds: [PROCESS, APP] }) // changed ids, unchanged id
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([PROCESS, APP])
    expect(onSelect).toHaveBeenLastCalledWith(PROCESS)
    g.restore({ ...g.snapshot, selectedId: PROCESS }) // changed id, unchanged ids
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([PROCESS])
    // Both changed and disagreeing: selectedId wins, as in 0.10.0.
    g.restore({ selectedId: TECH, selectedIds: [PROCESS, APP] })
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([TECH])
    expect(onSelect).toHaveBeenLastCalledWith(TECH)
  })

  it('restore({}) changes nothing; restore({ selectedId: null }) clears and reports', () => {
    const onSelect = vi.fn()
    const onSelectedIdsChange = vi.fn()
    const onFiltersChange = vi.fn()
    const g = render({ selectedIds: [APP], onSelect, onSelectedIdsChange, onFiltersChange })
    g.restore({})
    expect(onSelect).not.toHaveBeenCalled()
    expect(onSelectedIdsChange).not.toHaveBeenCalled()
    expect(onFiltersChange).not.toHaveBeenCalled()
    g.restore({ selectedId: null })
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([])
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })

  it('restore with filters and a selection reports the visible primary of the restored state', () => {
    const onSelect = vi.fn()
    const onFiltersChange = vi.fn()
    const g = render({ selectedIds: [], onSelect, onFiltersChange })
    g.restore({ filters: hideBusiness, selectedIds: [PROCESS, APP] })
    expect(onFiltersChange).toHaveBeenLastCalledWith(hideBusiness)
    expect(onSelect).toHaveBeenLastCalledWith(APP) // PROCESS is on the hidden layer
  })

  it('setFilters reports a visible-primary change, and composes with selection actions', () => {
    const onSelect = vi.fn()
    const onSelectedIdsChange = vi.fn()
    const g = render({ selectedIds: [PROCESS, APP], onSelect, onSelectedIdsChange })
    g.setFilters(hideBusiness)
    expect(onSelect).toHaveBeenLastCalledWith(APP)
    // In the same handler, toggleSelected reads the filters just set: dropping APP leaves only the hidden PROCESS.
    g.toggleSelected(APP)
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([PROCESS])
    expect(onSelect).toHaveBeenLastCalledWith(null)
    g.setFilters(DEFAULT_LINK_FILTERS) // unhiding makes PROCESS visible again
    expect(onSelect).toHaveBeenLastCalledWith(PROCESS)
    onSelect.mockClear()
    g.setFilters({ ...DEFAULT_LINK_FILTERS, showIntra: false }) // no layer change, no report
    expect(onSelect).not.toHaveBeenCalled()
  })
})

// Re-render tests: react-test-renderer drives state updates through the hook.
describe('useLayeredGraph selection, rendered', () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

  function mount<T>(hook: () => T) {
    const out: T[] = []
    const Probe = () => { out.push(hook()); return null }
    let r!: ReactTestRenderer
    act(() => { r = create(createElement(Probe)) })
    return { last: () => out[out.length - 1], rerender: () => act(() => r.update(createElement(Probe))), unmount: () => act(() => r.unmount()) }
  }

  it('an inline followCategories array keeps reach and emphasis stable across renders', () => {
    const m = mount(() => useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout: false, defaultSelectedId: APP, followCategories: ['structural'] }))
    const { reach, nodeEmphasis } = m.last()
    m.rerender()
    expect(m.last().reach).toBe(reach)
    expect(m.last().nodeEmphasis).toBe(nodeEmphasis)
    m.unmount()
  })

  it('toggleSelected and setSelectedIds update selectedIds and the union reach', () => {
    const m = mount(() => useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout: false, defaultFollow: 1 }))
    act(() => m.last().select(APP))
    expect(m.last().selectedIds).toEqual([APP])
    const single = m.last().reach.hopOf.size
    act(() => m.last().toggleSelected(PROCESS))
    expect(m.last().selectedIds).toEqual([APP, PROCESS])
    expect(m.last().selectedId).toBe(APP)
    expect(m.last().reach.hopOf.size).toBe(computeReach(spec(), [APP, PROCESS], { follow: 1 }).hopOf.size)
    expect(m.last().reach.hopOf.size).toBeGreaterThan(single)
    act(() => m.last().setSelectedIds([PROCESS]))
    expect(m.last().selectedId).toBe(PROCESS)
    expect(m.last().reach.originIds).toEqual([PROCESS])
    act(() => { m.last().toggleSelected(APP); m.last().toggleSelected(PROCESS) }) // compose in one handler
    expect(m.last().selectedIds).toEqual([APP])
    act(() => m.last().toggleLayer('application'))
    expect(m.last().selectedIds).toEqual([])
    m.unmount()
  })

  it('toggleLayer reports the primary change once, rendered', () => {
    const onSelect = vi.fn()
    const m = mount(() => useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout: false, defaultSelectedIds: [PROCESS, APP], onSelect }))
    act(() => m.last().toggleLayer('business'))
    expect(m.last().selectedIds).toEqual([APP])
    expect(m.last().selectedId).toBe(APP)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenLastCalledWith(APP)
    act(() => m.last().toggleLayer('application'))
    expect(m.last().selectedId).toBeNull()
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onSelect).toHaveBeenLastCalledWith(null)
    m.unmount()
  })

  it('setNodeLabels updates the shared state', () => {
    const m = mount(() => useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout: false }))
    act(() => m.last().setNodeLabels(false))
    expect(m.last().nodeLabels).toBe(false)
    expect(m.last().snapshot.nodeLabels).toBe(false)
    m.unmount()
  })

  it('useControllable: uncontrolled updates, setter identity, and switching modes', () => {
    let value: number | undefined
    const onChange = vi.fn()
    const m = mount(() => useControllable<number>(value, 1, onChange))
    const setter = m.last()[1]
    act(() => m.last()[1](5))
    expect(m.last()[0]).toBe(5)
    expect(onChange).toHaveBeenLastCalledWith(5)
    expect(m.last()[1]).toBe(setter) // stable while uncontrolled
    value = 9
    m.rerender()
    expect(m.last()[0]).toBe(9) // controlled: the prop wins
    const controlledSetter = m.last()[1]
    expect(controlledSetter).not.toBe(setter)
    act(() => controlledSetter(2))
    expect(m.last()[0]).toBe(9) // only reports
    expect(onChange).toHaveBeenLastCalledWith(2)
    m.rerender()
    expect(m.last()[1]).toBe(controlledSetter) // stable while controlled
    value = undefined
    m.rerender()
    expect(m.last()[0]).toBe(5) // back to its own state
    m.unmount()
  })
})
