// layeredGraphSnapshotDefaults: seeding useLayeredGraph from a saved snapshot (tinkermonkey/heimdall#338).
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULT_LINK_FILTERS, type LayeredGraphSnapshot } from '../layered'
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
