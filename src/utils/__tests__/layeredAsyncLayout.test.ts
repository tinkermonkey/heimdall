// layoutLayersAsync and the hook's asynchronous layout for large graphs (tinkermonkey/heimdall#338).
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildLayeredIndex, layoutLayers, layoutLayersAsync } from '../layered'
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

describe('useLayeredGraph asynchronous layout', () => {
  const render = (opts: Partial<UseLayeredGraphOptions>): LayeredGraphState => {
    let out: LayeredGraphState | null = null
    renderToStaticMarkup(createElement(() => { out = useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout, ...opts }); return null }))
    return out!
  }

  it('lays out synchronously below the threshold', () => {
    expect(ASYNC_LAYOUT_MIN_NODES).toBe(200)
    const g = render({})
    expect(g.layout).not.toBeNull()
    expect(g.layoutPending).toBe(false)
    expect(render({ asyncLayoutMinNodes: false }).layout).not.toBeNull()
  })

  it('is pending, with no layout, from the threshold up until the run lands', () => {
    const g = render({ asyncLayoutMinNodes: 36 })
    expect(g.layout).toBeNull()
    expect(g.layoutPending).toBe(true)
    // `layout: false` never lays out, so nothing is pending.
    expect(render({ asyncLayoutMinNodes: 0, layout: false }).layoutPending).toBe(false)
  })
})
