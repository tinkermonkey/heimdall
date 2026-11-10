import { useEffect, useMemo } from 'react'
import { AdjacencyMatrix } from '../components/AdjacencyMatrix'
import {
  BridgeNodeList,
  FollowControl,
  LayerList,
  LayerPairList,
  LinkCategoryFilter,
  PlaneLayoutControl,
  PredicateLabelControl,
} from '../components/LayeredGraphControls'
import { ReachInspector } from '../components/ReachInspector'
import { LayeredGraphContext, useLayeredGraph } from '../hooks/useLayeredGraph'
import type { BuildLayeredIndexOptions } from '../utils/layered/types'
import { drCategoryOrder, drLayers, drSpecEdges, drSpecNodes, heimdallUxEdges, heimdallUxNodes } from './fixtures/layeredGraphFixtures'

// The layered-graph chrome (controls and ReachInspector) around an AdjacencyMatrix, all wired
// through one useLayeredGraph + LayeredGraphContext. URL params make screenshots deterministic:
//   ?example=layered-graph-chrome&data=spec|ux&select=<node id>[,<node id>…]&follow=0|1|2&dark=1
// Several ids in `select` make a multi-selection (`defaultSelectedIds`), primary first.
const params = new URLSearchParams(window.location.search)
const DATA = params.get('data') === 'ux' ? 'ux' : 'spec'

const mono = { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgb(var(--canvas-fg-3))' } as const

export default function LayeredGraphChromeTestPage() {
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
    nodes: DATA === 'spec' ? drSpecNodes : heimdallUxNodes,
    edges: DATA === 'spec' ? drSpecEdges : heimdallUxEdges,
    layering,
    layout,
    defaultSelectedIds: params.get('select')?.split(',').filter(Boolean),
    defaultFollow: params.has('follow') ? Number(params.get('follow')) : 1,
  })
  const { filters } = graph

  return (
    <LayeredGraphContext.Provider value={graph}>
      <div style={{ minHeight: '100vh', background: 'rgb(var(--canvas-bg))', color: 'rgb(var(--canvas-fg-1))', boxSizing: 'border-box' }}>
        <div data-testid="chrome-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 22px', padding: '12px 20px', borderBottom: '1px solid rgb(var(--canvas-border))' }}>
          <FollowControl />
          <PredicateLabelControl />
          <PlaneLayoutControl />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <main style={{ flex: '999 1 640px', minWidth: 0, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span data-testid="chrome-state" style={mono}>
              {[
                graph.selectedId ? `selected ${graph.selectedIds.join(',')} · reach ${graph.reach.hopOf.size - graph.selectedIds.length}` : 'no selection',
                `follow ${graph.follow}`,
                `labels ${graph.predicateLabels}`,
                `plane ${graph.planeLayout}`,
                `focus ${graph.focusedLayerId ?? 'none'}`,
                `pair ${filters.layerPair ?? 'none'}`,
                `hidden ${filters.hiddenLayers.join(',') || 'none'}`,
                `off ${Object.keys(filters.categories).filter((c) => filters.categories[c] === false).join(',') || 'none'}`,
                `intra ${filters.showIntra ? 'on' : 'off'}`,
                `node-labels ${graph.nodeLabels ? 'on' : 'off'}`,
              ].join(' · ')}
            </span>
            <AdjacencyMatrix data-testid="adjacency-matrix" cellSize={12} labelWidth={170} />
            {/* Node labels are the graph's shared state: the toggle writes `graph.nodeLabels`. */}
            <LinkCategoryFilter data-testid="link-bar" showLabelToggle />
          </main>
          <aside
            data-testid="chrome-aside"
            style={{ flex: '1 1 320px', maxWidth: 360, boxSizing: 'border-box', minHeight: '100vh', borderLeft: '1px solid rgb(var(--canvas-border))', background: 'rgb(var(--canvas-bg-2))', padding: '18px 18px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <ReachInspector data-testid="reach-inspector" />
            <LayerList data-testid="layer-list" />
            <LayerPairList data-testid="layer-pair-list" />
            <BridgeNodeList data-testid="bridge-node-list" />
          </aside>
        </div>
      </div>
    </LayeredGraphContext.Provider>
  )
}
