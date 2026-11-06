import { useEffect, useMemo } from 'react'
import { GraphCanvas } from '../components/GraphCanvas'
import { SegmentedControl } from '../components/SegmentedControl'
import { LayeredGraphContext, useLayeredGraph } from '../hooks/useLayeredGraph'
import type { LaneOrientation } from '../utils/laneLayout'
import type { BuildLayeredIndexOptions, PredicateLabelMode } from '../utils/layered/types'
import { drCategoryOrder, drLayers, drSpecEdges, drSpecNodes, heimdallUxEdges, heimdallUxNodes } from './fixtures/layeredGraphFixtures'

// GraphCanvas layout="layer-lanes" on the layered-graph fixtures. URL params make screenshots deterministic:
//   ?example=layer-lanes&data=spec|ux&select=<node id>&follow=0|1|2&labels=off|highlighted|all&orientation=vertical&intra=none&dark=1
const params = new URLSearchParams(window.location.search)
const DATA = params.get('data') === 'ux' ? 'ux' : 'spec'
const NODES = DATA === 'spec' ? drSpecNodes : heimdallUxNodes
const EDGES = DATA === 'spec' ? drSpecEdges : heimdallUxEdges
const ORIENTATION: LaneOrientation = params.get('orientation') === 'vertical' ? 'vertical' : 'horizontal'
const INTRA = params.get('intra') === 'none' ? 'none' : 'arc'

export default function LayerLanesTestPage() {
  useEffect(() => {
    document.body.classList.toggle('dark-canvas', params.get('dark') === '1')
    return () => document.body.classList.remove('dark-canvas')
  }, [])

  const layering = useMemo<BuildLayeredIndexOptions>(
    () => ({ layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }),
    [],
  )
  const layout = useMemo(() => ({ layoutCategories: DATA === 'spec' ? ['structural'] : null }), [])
  const graph = useLayeredGraph({
    nodes: NODES,
    edges: EDGES,
    layering,
    layout,
    defaultSelectedId: params.get('select'),
    defaultFollow: params.has('follow') ? Number(params.get('follow')) : 1,
    defaultPredicateLabels: (params.get('labels') as PredicateLabelMode | null) ?? 'highlighted',
  })
  const laneOptions = useMemo(() => ({ orientation: ORIENTATION, intraLinks: INTRA } as const), [])

  return (
    <LayeredGraphContext.Provider value={graph}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'rgb(var(--canvas-bg))', color: 'rgb(var(--canvas-fg-1))', padding: '16px 20px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 12, fontSize: 12 }}>
          <span data-testid="layer-lanes-caption" style={{ fontFamily: 'var(--font-mono)' }}>
            layer-lanes · {DATA} · {graph.index.nodes.length} nodes · {graph.index.links.length} links · {graph.index.links.filter((l) => l.cross).length} cross-layer
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
          <span data-testid="layer-lanes-selection" style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-3))' }}>
            {graph.selectedId ? `selected ${graph.selectedId} · reach ${graph.reach.hopOf.size - 1}` : 'no selection'}
          </span>
        </div>
        <div style={{ flex: '1 1 auto', minHeight: 0, border: '1px solid rgb(var(--canvas-border))', borderRadius: 8, overflow: 'hidden' }}>
          <GraphCanvas
            data-testid="layer-lanes"
            nodes={NODES}
            edges={EDGES}
            layout="layer-lanes"
            laneOptions={laneOptions}
            fitView
            fitPadding={24}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </LayeredGraphContext.Provider>
  )
}
