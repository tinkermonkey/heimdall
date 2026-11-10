// layeredGraphSnapshotDefaults: seeding useLayeredGraph from a saved snapshot (tinkermonkey/heimdall#338).
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULT_LINK_FILTERS, sanitizeLayeredGraphSnapshot, type LayeredGraphSnapshot } from '../layered'
import { sanitizeLayeredGraphExplorerSnapshot } from '../../components/LayeredGraphExplorer'
import { layeredGraphSnapshotDefaults, useLayeredGraph, type LayeredGraphState } from '../../hooks/useLayeredGraph'
import { drLayers, drCategoryOrder, drSpecNodes, drSpecEdges } from '../../test-pages/fixtures/layeredGraphFixtures'

const layering = { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }

describe('layeredGraphSnapshotDefaults', () => {
  it('maps each snapshot field to its default option, leaving out what the snapshot leaves out', () => {
    expect(layeredGraphSnapshotDefaults(undefined)).toEqual({})
    expect(layeredGraphSnapshotDefaults({ follow: 2, focusedLayerId: null })).toEqual({ defaultFollow: 2, defaultFocusedLayerId: null })
  })

  it('round-trips a snapshot through JSON into a fresh hook', () => {
    const saved: LayeredGraphSnapshot = {
      selectedId: 'application.applicationcomponent',
      follow: 2,
      filters: { ...DEFAULT_LINK_FILTERS, categories: { structural: false }, showIntra: false },
      predicateLabels: 'all',
      focusedLayerId: 'business',
      planeLayout: 'coupled',
    }
    const parsed = JSON.parse(JSON.stringify(saved)) as LayeredGraphSnapshot
    let g: LayeredGraphState | null = null
    renderToStaticMarkup(
      createElement(() => {
        g = useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering, layout: false, ...layeredGraphSnapshotDefaults(parsed) })
        return null
      }),
    )
    expect(g!.snapshot).toMatchObject(saved)
  })
})

describe('sanitizeLayeredGraphSnapshot', () => {
  it('keeps well-formed fields and drops the rest', () => {
    expect(sanitizeLayeredGraphSnapshot(null)).toEqual({})
    expect(sanitizeLayeredGraphSnapshot('x')).toEqual({})
    expect(
      sanitizeLayeredGraphSnapshot({
        selectedId: 42, selectedIds: ['a', 3, 'b'], follow: 'two', predicateLabels: 'loud',
        focusedLayerId: null, planeLayout: 'coupled', nodeLabels: 'yes', extra: 1,
      }),
    ).toEqual({ selectedIds: ['a', 'b'], focusedLayerId: null, planeLayout: 'coupled' })
    expect(sanitizeLayeredGraphSnapshot({ follow: 2.7 }).follow).toBe(2)
    expect(sanitizeLayeredGraphSnapshot({ follow: -3 }).follow).toBe(0)
    expect(sanitizeLayeredGraphSnapshot({ follow: null }).follow).toBeUndefined()
  })

  it('completes partial filters from the defaults and type-checks each field', () => {
    expect(sanitizeLayeredGraphSnapshot({ filters: { categories: { structural: false, bad: 'no' } } }).filters).toEqual({
      ...DEFAULT_LINK_FILTERS,
      categories: { structural: false },
    })
    expect(sanitizeLayeredGraphSnapshot({ filters: { hiddenLayers: 'business', showIntra: 0, layerPair: 5 } }).filters).toEqual(DEFAULT_LINK_FILTERS)
    expect(sanitizeLayeredGraphSnapshot({ filters: [] }).filters).toBeUndefined()
  })

  it('makes layeredGraphSnapshotDefaults safe on malformed input', () => {
    const defaults = layeredGraphSnapshotDefaults({ filters: { categories: {} }, follow: null } as never)
    expect(defaults.defaultFilters).toEqual({ ...DEFAULT_LINK_FILTERS, categories: {} })
    expect('defaultFollow' in defaults).toBe(false)
  })
})

describe('sanitizeLayeredGraphExplorerSnapshot', () => {
  it('checks the view, labels and stack camera', () => {
    expect(
      sanitizeLayeredGraphExplorerSnapshot({
        view: 'bogus', nodeLabels: 1,
        stack: { preset: 'bogus', camera: { yaw: 0.5, pitch: 'x', zoom: null, targetY: Infinity }, layerGap: -4 },
      }),
    ).toEqual({ stack: { camera: { yaw: 0.5 } } })
    expect(sanitizeLayeredGraphExplorerSnapshot({ view: 'hive', nodeLabels: false, stack: { preset: null, layerGap: 220 } })).toEqual({
      view: 'hive', nodeLabels: false, stack: { preset: null, layerGap: 220 },
    })
    // A view the explorer doesn't offer is dropped.
    expect(sanitizeLayeredGraphExplorerSnapshot({ view: 'hive' }, ['stack', 'matrix'])).toEqual({})
    expect(sanitizeLayeredGraphExplorerSnapshot({ stack: { preset: 'top' } })).toEqual({ stack: { preset: 'top' } })
  })
})
