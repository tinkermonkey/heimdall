// layoutLayersAsync and the hook's asynchronous layout for large graphs (tinkermonkey/heimdall#338).
import { describe, it, expect, vi } from 'vitest'
import { Component, StrictMode, createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import type { GraphNodeData } from '../../components/GraphCanvas'
import type { IndexedNode } from '../layered/types'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildLayeredIndex, layoutLayers, layoutLayersAsync } from '../layered'
import { layoutInputKey, sameLayoutOptions } from '../layered/layout'
import { ASYNC_LAYOUT_MIN_NODES, useLayeredGraph, type LayeredGraphState, type UseLayeredGraphOptions } from '../../hooks/useLayeredGraph'
import { drLayers, drCategoryOrder, drSpecNodes, drSpecEdges } from '../../test-pages/fixtures/layeredGraphFixtures'

const layering = { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }
const spec = () => buildLayeredIndex(drSpecNodes, drSpecEdges, layering)
const layout = { layoutCategories: ['structural'] }

describe('layoutLayersAsync', () => {
  it('resolves to the same result as layoutLayers', async () => {
    const ix = spec()
    const result = await layoutLayersAsync(ix, layout)
    const sync = layoutLayers(ix, layout)
    expect([...result.independent]).toEqual([...sync.independent])
    expect([...result.coupled]).toEqual([...sync.coupled])
    expect(result.scale.coupled).toBe(sync.scale.coupled)
  })

  it('yields before solving: nothing runs in the calling tick', async () => {
    let calls = 0
    const promise = layoutLayersAsync(spec(), { ...layout, nodeSize: () => (calls++, { width: 40, height: 24 }) })
    expect(calls).toBe(0)
    await promise
    expect(calls).toBeGreaterThan(0)
  })

  it('rejects with an AbortError when aborted, before or during the run', async () => {
    const before = new AbortController()
    before.abort()
    await expect(layoutLayersAsync(spec(), layout, { signal: before.signal })).rejects.toMatchObject({ name: 'AbortError' })

    const during = new AbortController()
    let calls = 0
    const promise = layoutLayersAsync(spec(), {
      ...layout,
      nodeSize: () => {
        if (++calls === 1) setTimeout(() => during.abort(), 0)
        return { width: 40, height: 24 }
      },
    }, { signal: during.signal })
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    const afterAbort = calls
    await new Promise((r) => setTimeout(r, 50))
    expect(calls).toBe(afterAbort) // no solve ran after the abort
  })

  it('rejects with a solve’s error', async () => {
    const boom = new Error('boom')
    await expect(layoutLayersAsync(spec(), { ...layout, nodeSize: () => { throw boom } })).rejects.toBe(boom)
  })
})

describe('layout request equality', () => {
  it('keys an index by content', () => {
    expect(layoutInputKey(spec())).toBe(layoutInputKey(buildLayeredIndex([...drSpecNodes], [...drSpecEdges], layering)))
    const relabeled = drSpecNodes.map((n, i) => (i === 0 ? { ...n, label: 'Renamed' } : n))
    expect(layoutInputKey(buildLayeredIndex(relabeled, drSpecEdges, layering))).not.toBe(layoutInputKey(spec()))
  })

  it('compares options field by field', () => {
    const size = () => ({ width: 1, height: 1 })
    expect(sameLayoutOptions({ layoutCategories: ['a'], organic: { preferredEdgeLength: 90 } }, { layoutCategories: ['a'], organic: { preferredEdgeLength: 90 } })).toBe(true)
    expect(sameLayoutOptions({}, { engine: 'organic', layoutCategories: null })).toBe(true)
    expect(sameLayoutOptions({ layoutCategories: ['a'] }, { layoutCategories: ['b'] })).toBe(false)
    expect(sameLayoutOptions({ nodeSize: size }, { nodeSize: () => ({ width: 1, height: 1 }) })).toBe(false)
  })
})

describe('useLayeredGraph asynchronous layout', () => {
  const render = (opts: Partial<UseLayeredGraphOptions>): LayeredGraphState => {
    let out: LayeredGraphState | null = null
    renderToStaticMarkup(createElement(() => { out = useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout, ...opts }); return null }))
    return out!
  }

  it('is opt-in: synchronous by default, as before', () => {
    expect(ASYNC_LAYOUT_MIN_NODES).toBe(200)
    const g = render({})
    expect(g.layout).not.toBeNull()
    expect(g.layoutPending).toBe(false)
    expect(render({ asyncLayoutMinNodes: false }).layout).not.toBeNull()
    expect(render({ asyncLayoutMinNodes: ASYNC_LAYOUT_MIN_NODES }).layout).not.toBeNull() // 36 nodes, below it
  })

  it('opted in, is pending with no layout from the threshold up until the run lands', () => {
    const g = render({ asyncLayoutMinNodes: 36 })
    expect(g.layout).toBeNull()
    expect(g.layoutPending).toBe(true)
    // `layout: false` never lays out, so nothing is pending.
    expect(render({ asyncLayoutMinNodes: 0, layout: false }).layoutPending).toBe(false)
  })
})

// Re-render tests: react-test-renderer drives the hook through effects, landings and unmounts.
describe('useLayeredGraph asynchronous layout, rendered', () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const settle = (ms = 30) => act(() => new Promise<void>((r) => setTimeout(r, ms)))
  /** Lets timers run (inside act) until `check` passes. */
  const until = (check: () => void) => vi.waitFor(async () => { await settle(5); check() }, { timeout: 3000, interval: 5 })
  const memoLayering = layering

  /** Mounts a probe that records every render's state; `opts()` is read on each render. Opted in at any size. */
  function mount(opts: () => Partial<UseLayeredGraphOptions>, wrap: (el: React.ReactElement) => React.ReactElement = (el) => el) {
    const states: LayeredGraphState[] = []
    const Probe = () => {
      states.push(useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering: memoLayering, layout, asyncLayoutMinNodes: 0, ...opts() }))
      return null
    }
    let renderer!: ReactTestRenderer
    act(() => { renderer = create(wrap(createElement(Probe))) })
    return { states, last: () => states[states.length - 1], renderer, rerender: () => act(() => renderer.update(wrap(createElement(Probe)))) }
  }
  const landed = (m: ReturnType<typeof mount>) => until(() => expect(m.last().layoutPending).toBe(false))

  it('lands: pending with no layout first, then the same layout as the synchronous run', async () => {
    const m = mount(() => ({}))
    expect(m.states[0].layout).toBeNull()
    expect(m.states[0].layoutPending).toBe(true)
    await landed(m)
    expect([...m.last().layout!.coupled]).toEqual([...layoutLayers(spec(), layout).coupled])
    act(() => m.renderer.unmount())
  })

  it('converges with unmemoized nodes, edges and layout options without nodeSize (no restart loop)', async () => {
    const m = mount(() => ({ nodes: [...drSpecNodes], edges: [...drSpecEdges], layout: { layoutCategories: ['structural'], organic: { affectedIds: ['x'] } } }))
    await landed(m)
    expect(m.last().layout).not.toBeNull()
    const renders = m.states.length
    await settle(60)
    expect(m.states.length).toBe(renders) // no render loop
    // A re-render with rebuilt but equal inputs keeps the landed layout.
    m.rerender()
    expect(m.last().layoutPending).toBe(false)
    expect(m.last().layout).toBe(m.states[renders - 1].layout)
    act(() => m.renderer.unmount())
  })

  it('with a custom nodeSize, rebuilt data with an equal key lays out again', async () => {
    // A stable nodeSize that reads a node attribute the content key does not cover.
    const nodeSize = (n: IndexedNode) => ({ width: Number(n.source.attributes?.w ?? 60), height: 24 })
    let nodes: GraphNodeData[] = drSpecNodes.map((n) => ({ ...n, attributes: { ...n.attributes, w: 60 } }))
    const opts = { layout: { ...layout, nodeSize } }
    const m = mount(() => ({ ...opts, nodes }))
    await landed(m)
    const first = m.last().layout!
    nodes = drSpecNodes.map((n) => ({ ...n, attributes: { ...n.attributes, w: 400 } }))
    expect(layoutInputKey(buildLayeredIndex(nodes, drSpecEdges, layering))).toBe(layoutInputKey(m.last().index))
    m.rerender()
    expect(m.last().layoutPending).toBe(true)
    await landed(m)
    expect(m.last().layout).not.toBe(first)
    expect([...m.last().layout!.coupled]).toEqual([...layoutLayers(m.last().index, opts.layout).coupled])
    act(() => m.renderer.unmount())
  })

  it('a newer index supersedes the older one, keeping the old layout while pending', async () => {
    let nodes: GraphNodeData[] = drSpecNodes
    const m = mount(() => ({ nodes }))
    await landed(m)
    const first = m.last().layout!
    nodes = drSpecNodes.filter((n) => n.attributes?.layer !== 'technology')
    m.rerender()
    expect(m.last().layoutPending).toBe(true)
    expect(m.last().layout).toBe(first) // stale while pending
    await landed(m)
    expect(m.last().layout!.coupled.size).toBe(m.last().index.nodes.length)
    expect(m.last().layout!.coupled.size).toBeLessThan(first.coupled.size)
    act(() => m.renderer.unmount())
  })

  it('unmounting aborts the run', async () => {
    let solves = 0
    const opts = { layout: { ...layout, nodeSize: () => (solves++, { width: 60, height: 24 }) } }
    const m = mount(() => opts)
    act(() => m.renderer.unmount())
    await settle(60)
    expect(solves).toBe(0)
  })

  it('lands under StrictMode (double effects)', async () => {
    const m = mount(() => ({}), (el) => createElement(StrictMode, null, el))
    await landed(m)
    expect(m.last().layout).not.toBeNull()
    act(() => m.renderer.unmount())
  })

  it('a failed run reaches an error boundary', async () => {
    class Boundary extends Component<{ children: React.ReactNode }, { error: unknown }> {
      state = { error: null as unknown }
      static getDerivedStateFromError(error: unknown) { return { error } }
      render() { return this.state.error ? createElement('span', null, `failed: ${(this.state.error as Error).message}`) : this.props.children }
    }
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const opts = { layout: { ...layout, nodeSize: () => { throw new Error('boom') } } }
    const m = mount(() => opts, (el) => createElement(Boundary, null, el))
    await until(() => expect(m.renderer.toJSON()).toMatchObject({ type: 'span', children: ['failed: boom'] }))
    errors.mockRestore()
    act(() => m.renderer.unmount())
  })

  it('warns in development when the layout options change on every render', async () => {
    const env = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const m = mount(() => ({ layout: { ...layout, nodeSize: () => ({ width: 60, height: 24 }) } }))
      m.rerender()
      m.rerender()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`layout` options change on every render'))
      act(() => m.renderer.unmount())
    } finally {
      warn.mockRestore()
      process.env.NODE_ENV = env
    }
  })
})
