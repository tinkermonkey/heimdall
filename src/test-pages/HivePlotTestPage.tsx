import { useEffect, useMemo } from 'react'
import { HivePlot } from '../components/HivePlot'
import { SegmentedControl } from '../components/SegmentedControl'
import { LayeredGraphContext, useLayeredGraph } from '../hooks/useLayeredGraph'
import { DEFAULT_LINK_FILTERS } from '../utils/layered/filters'
import type { BuildLayeredIndexOptions, PredicateLabelMode } from '../utils/layered/types'
import { drCategoryOrder, drLayers, drSpecEdges, drSpecNodes, heimdallUxEdges, heimdallUxNodes } from './fixtures/layeredGraphFixtures'

// HivePlot on the layered-graph fixtures. URL params make screenshots deterministic:
//   ?example=hive-plot&data=spec|ux&select=<node id>&follow=0|1|2&labels=off|highlighted|all&split=0&hide=<layer id>,…&dark=1
const params = new URLSearchParams(window.location.search)
const DATA = params.get('data') === 'ux' ? 'ux' : 'spec'
const HIDDEN = params.get('hide')?.split(',').filter(Boolean) ?? []

export default function HivePlotTestPage() {
  useEffect(() => {
    document.body.classList.toggle('dark-canvas', params.get('dark') === '1')
    return () => document.body.classList.remove('dark-canvas')
  }, [])

  const layering = useMemo<BuildLayeredIndexOptions>(
    () => ({ layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }),
    [],
  )
  const graph = useLayeredGraph({
    nodes: DATA === 'spec' ? drSpecNodes : heimdallUxNodes,
    edges: DATA === 'spec' ? drSpecEdges : heimdallUxEdges,
    layering,
    layout: false,
    defaultSelectedId: params.get('select'),
    defaultFollow: params.has('follow') ? Number(params.get('follow')) : 1,
    defaultPredicateLabels: (params.get('labels') as PredicateLabelMode | null) ?? 'highlighted',
    defaultFilters: { ...DEFAULT_LINK_FILTERS, hiddenLayers: HIDDEN },
  })

  return (
    <LayeredGraphContext.Provider value={graph}>
      <div style={{ minHeight: '100vh', background: 'rgb(var(--canvas-bg))', color: 'rgb(var(--canvas-fg-1))', padding: '16px 20px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 12, fontSize: 12 }}>
          <span data-testid="hive-plot-caption" style={{ fontFamily: 'var(--font-mono)' }}>
            HivePlot · {DATA} · {graph.index.nodes.length} nodes · {graph.index.links.length} links · {graph.index.links.filter((l) => l.cross).length} cross-layer
          </span>
          <SegmentedControl
            aria-label="Follow"
            value={graph.follow}
            onChange={(v) => graph.setFollow(Number(v))}
            options={[{ value: 0, label: 'Direct' }, { value: 1, label: '+1 layer' }, { value: 2, label: '+2 layers' }]}
          />
          <SegmentedControl
            aria-label="Predicate labels"
            value={graph.predicateLabels}
            onChange={(v) => graph.setPredicateLabels(v as PredicateLabelMode)}
            options={[{ value: 'off', label: 'Off' }, { value: 'highlighted', label: 'Highlighted' }, { value: 'all', label: 'All' }]}
          />
          {graph.index.layers.map((l) => (
            <button
              key={l.id}
              type="button"
              data-testid={`hive-plot-toggle-${l.id}`}
              aria-pressed={!graph.filters.hiddenLayers.includes(l.id)}
              onClick={() => graph.toggleLayer(l.id)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
            >
              {l.id}
            </button>
          ))}
          <span data-testid="hive-plot-selection" style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-3))' }}>
            {graph.selectedId ? `selected ${graph.selectedId} · reach ${graph.reach.hopOf.size - 1}` : 'no selection'}
          </span>
        </div>
        <HivePlot data-testid="hive-plot" splitAxes={params.get('split') !== '0'} style={{ maxWidth: 1100 }} />
      </div>
    </LayeredGraphContext.Provider>
  )
}
