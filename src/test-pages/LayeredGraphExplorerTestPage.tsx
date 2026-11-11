import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayeredGraphExplorer,
  LAYERED_GRAPH_VIEWS,
  type LayeredGraphExplorerControls,
  type LayeredGraphExplorerHandle,
  type LayeredGraphExplorerSnapshot,
  type LayeredGraphExplorerSnapshotInput,
  type LayeredGraphView,
} from '../components/LayeredGraphExplorer'
import { LayeredGraphContext, useLayeredGraph } from '../hooks/useLayeredGraph'
import type { BuildLayeredIndexOptions } from '../utils/layered/types'
import { drCategoryOrder, drLayers, drSpecEdges, drSpecNodes, heimdallUxEdges, heimdallUxNodes } from './fixtures/layeredGraphFixtures'

// LayeredGraphExplorer on the layered-graph fixtures. Turntable off and a fixed camera; URL params
// make screenshots deterministic:
//   ?example=layered-graph-explorer&data=spec|ux&view=stack|lanes|matrix|hive&select=<node id>
//     &follow=0|1|2&dark=1&views=stack,matrix&hide=follow,camera,…&height=720&mode=external
// `mode=external` drives the explorer from the page's own useLayeredGraph through the `graph` prop.
// `sync=1` round-trips the explorer through the URL: `state` (JSON) is its `defaultSnapshot`, and
// every `onSnapshotChange` writes it back (`snapshot-count` counts them). Save / Restore buttons
// drive the `explorerRef` handle. `gap=<n>` passes `stackProps={{ defaultLayerGap: n }}`.
const params = new URLSearchParams(window.location.search)
const DATA = params.get('data') === 'ux' ? 'ux' : 'spec'
const NODES = DATA === 'spec' ? drSpecNodes : heimdallUxNodes
const EDGES = DATA === 'spec' ? drSpecEdges : heimdallUxEdges
const isView = (v: string): v is LayeredGraphView => (LAYERED_GRAPH_VIEWS as readonly string[]).includes(v)
const VIEWS = (params.get('views')?.split(',').filter(isView) ?? LAYERED_GRAPH_VIEWS) as LayeredGraphView[]
const VIEW = isView(params.get('view') ?? '') ? (params.get('view') as LayeredGraphView) : VIEWS[0]
const CONTROLS: LayeredGraphExplorerControls = Object.fromEntries((params.get('hide') ?? '').split(',').filter(Boolean).map((k) => [k, false]))
const HEIGHT = params.has('height') ? Number(params.get('height')) : undefined
const EXTERNAL = params.get('mode') === 'external'
const FOLLOW = params.has('follow') ? Number(params.get('follow')) : 1
const SYNC = params.get('sync') === '1'
function parseSnapshot(): LayeredGraphExplorerSnapshotInput | undefined {
  try {
    const raw = params.get('state')
    return raw ? (JSON.parse(raw) as LayeredGraphExplorerSnapshotInput) : undefined
  } catch {
    return undefined
  }
}
const SNAPSHOT = SYNC ? parseSnapshot() : undefined
const STACK_PROPS = params.has('gap') ? { defaultLayerGap: Number(params.get('gap')) } : undefined
// `matrix=symmetric` passes `matrixProps={{ symmetric: true }}`.
const MATRIX_PROPS = params.get('matrix') === 'symmetric' ? { symmetric: true } : undefined
const DATA_LABEL = DATA === 'spec' ? 'documentation robotics spec 0.10.0' : 'heimdall ux model'

const mono = { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgb(var(--canvas-fg-3))' } as const

export default function LayeredGraphExplorerTestPage() {
  useEffect(() => {
    document.body.classList.toggle('dark-canvas', params.get('dark') === '1')
    return () => document.body.classList.remove('dark-canvas')
  }, [])

  const layering = useMemo<BuildLayeredIndexOptions>(
    () => ({ layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }),
    [],
  )
  const layout = useMemo(() => ({ layoutCategories: DATA === 'spec' ? ['structural'] : null }), [])
  const [selected, setSelected] = useState<string | null>(SNAPSHOT?.selectedId ?? params.get('select'))
  const [follow, setFollow] = useState(SNAPSHOT?.follow ?? FOLLOW)
  const [view, setView] = useState<LayeredGraphView>(SNAPSHOT?.view ?? VIEW)
  const explorerRef = useRef<LayeredGraphExplorerHandle>(null)
  const [saved, setSaved] = useState<LayeredGraphExplorerSnapshot | null>(null)
  const [snapshotCount, setSnapshotCount] = useState(0)
  const writeUrl = (snapshot: LayeredGraphExplorerSnapshot) => {
    setSnapshotCount((n) => n + 1)
    const url = new URL(window.location.href)
    url.searchParams.set('state', JSON.stringify(snapshot))
    window.history.replaceState(null, '', url)
  }
  const graphOptions = useMemo(
    () => ({ layout, defaultSelectedId: params.get('select'), defaultFollow: FOLLOW, onSelect: setSelected, onFollowChange: setFollow }),
    [layout],
  )
  // Only used with mode=external.
  const externalGraph = useLayeredGraph({ nodes: NODES, edges: EDGES, layering, ...graphOptions })

  const explorer = (
    <LayeredGraphExplorer
      data-testid="explorer"
      nodes={NODES}
      edges={EDGES}
      layering={layering}
      graphOptions={graphOptions}
      graph={EXTERNAL ? externalGraph : undefined}
      views={VIEWS}
      defaultView={VIEW}
      onViewChange={setView}
      controls={CONTROLS}
      explorerRef={explorerRef}
      defaultSnapshot={SNAPSHOT}
      onSnapshotChange={SYNC ? writeUrl : undefined}
      stackProps={STACK_PROPS}
      matrixProps={MATRIX_PROPS}
      eyebrow="Layered graph"
      title={DATA === 'spec' ? 'Documentation robotics spec' : 'Heimdall UX model'}
      statusLabel={DATA_LABEL}
      height={HEIGHT}
    />
  )

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(var(--canvas-bg))', color: 'rgb(var(--canvas-fg-1))', padding: 16, boxSizing: 'border-box' }}>
      <span data-testid="explorer-state" style={{ ...mono, display: 'block', marginBottom: 8 }}>
        {[`view ${view}`, selected ? `selected ${selected}` : 'no selection', `follow ${follow}`].join(' · ')}
      </span>
      {SYNC && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <button type="button" onClick={() => setSaved(explorerRef.current?.getSnapshot() ?? null)}>
            Save snapshot
          </button>
          <button type="button" disabled={!saved} onClick={() => saved && explorerRef.current?.restore(saved)}>
            Restore snapshot
          </button>
          <span data-testid="snapshot-count" style={mono}>{`snapshots ${snapshotCount}`}</span>
          <span data-testid="saved-snapshot" style={mono}>
            {saved ? `${saved.view} · ${saved.stack.preset ?? 'custom'} · gap ${Math.round(saved.stack.layerGap)}` : 'none saved'}
          </span>
        </div>
      )}
      {EXTERNAL ? <LayeredGraphContext.Provider value={externalGraph}>{explorer}</LayeredGraphContext.Provider> : explorer}
    </div>
  )
}
