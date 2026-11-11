import { useEffect, useMemo, useState } from 'react'
import { AdjacencyMatrix } from '../components/AdjacencyMatrix'
import { SegmentedControl } from '../components/SegmentedControl'
import { LayeredGraphContext, useLayeredGraph } from '../hooks/useLayeredGraph'
import type { BuildLayeredIndexOptions, IndexedLink, PredicateLabelMode } from '../utils/layered/types'
import { drCategoryOrder, drLayers, drSpecEdges, drSpecNodes, heimdallUxEdges, heimdallUxNodes } from './fixtures/layeredGraphFixtures'

// AdjacencyMatrix on the layered-graph fixtures. URL params make screenshots deterministic:
//   ?example=adjacency-matrix&data=spec|ux&select=<node id>&follow=0|1|2&labels=off|highlighted|all&dark=1
//   &symmetric=1&aggregate=layer&order=cluster|degree|label
//   &report=1|legacy (onCellSelect, or the deprecated onLinkSelect, and onLayerCellSelect write to a status line)
const params = new URLSearchParams(window.location.search)
const DATA = params.get('data') === 'ux' ? 'ux' : 'spec'
const REPORT = params.get('report') === '1' || params.get('report') === 'legacy'
const LEGACY = params.get('report') === 'legacy'
const ORDER = (['cluster', 'degree', 'label'] as const).find((o) => o === params.get('order'))

export default function AdjacencyMatrixTestPage() {
  useEffect(() => {
    document.body.classList.toggle('dark-canvas', params.get('dark') === '1')
    return () => document.body.classList.remove('dark-canvas')
  }, [])
  const [report, setReport] = useState('none')

  const layering = useMemo<BuildLayeredIndexOptions>(
    () => ({ layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }),
    [],
  )
  const layout = useMemo(() => ({ layoutCategories: DATA === 'spec' ? ['structural'] : null }), [])
  const graph = useLayeredGraph({
    nodes: DATA === 'spec' ? drSpecNodes : heimdallUxNodes,
    edges: DATA === 'spec' ? drSpecEdges : heimdallUxEdges,
    layering,
    layout,
    defaultSelectedId: params.get('select'),
    defaultFollow: params.has('follow') ? Number(params.get('follow')) : 1,
    defaultPredicateLabels: (params.get('labels') as PredicateLabelMode | null) ?? 'highlighted',
  })

  return (
    <LayeredGraphContext.Provider value={graph}>
      <div style={{ minHeight: '100vh', background: 'rgb(var(--canvas-bg))', color: 'rgb(var(--canvas-fg-1))', padding: '16px 20px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 12, fontSize: 12 }}>
          <span data-testid="adjacency-matrix-caption" style={{ fontFamily: 'var(--font-mono)' }}>
            AdjacencyMatrix · {DATA} · {graph.index.nodes.length} nodes · {graph.index.links.length} links · {graph.index.links.filter((l) => l.cross).length} cross-layer
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
          <span data-testid="adjacency-matrix-selection" style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-3))' }}>
            {graph.selectedId ? `selected ${graph.selectedId} · reach ${graph.reach.hopOf.size - 1}` : 'no selection'}
          </span>
          {REPORT && <span data-testid="adjacency-matrix-report" style={{ fontFamily: 'var(--font-mono)' }}>{report}</span>}
          <span data-testid="adjacency-matrix-layer-state" style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-3))' }}>
            {`pair ${graph.filters.layerPair ?? 'none'} · focus ${graph.focusedLayerId ?? 'none'}`}
          </span>
        </div>
        <AdjacencyMatrix data-testid="adjacency-matrix" symmetric={params.get('symmetric') === '1'} aggregate={params.get('aggregate') === 'layer' ? 'layer' : 'none'}
          order={ORDER}
          {...{ [LEGACY ? 'onLinkSelect' : 'onCellSelect']: REPORT ? (link: IndexedLink, links: readonly IndexedLink[]) => setReport(`link ${link.sourceId} -> ${link.targetId} · ${links.length} in cell`) : undefined }}
          onLayerCellSelect={REPORT ? (c) => setReport(`layers ${c.rowLayerId} -> ${c.colLayerId} · ${c.linkCount} · pair ${c.pairKey ?? 'none'}`) : undefined}
        />
      </div>
    </LayeredGraphContext.Provider>
  )
}
