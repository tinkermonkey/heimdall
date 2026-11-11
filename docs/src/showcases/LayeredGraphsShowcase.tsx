import { useMemo, useState } from 'react'
import {
  AdjacencyMatrix,
  BridgeNodeList,
  FollowControl,
  GraphCanvas,
  HivePlot,
  LayerList,
  LayerPairList,
  LayerStack,
  LayeredGraphContext,
  LinkCategoryFilter,
  PlaneLayoutControl,
  PredicateLabelControl,
  ReachInspector,
  SegmentedControl,
  useLayeredGraph,
  type BuildLayeredIndexOptions,
  type LayerLayoutOptions,
  type LayerStackNodeLabels,
} from '@tinkermonkey/heimdall-ui'
import {
  drCategoryOrder,
  drLayers,
  drSpecEdges,
  drSpecNodes,
  heimdallUxEdges,
  heimdallUxNodes,
} from '@/test-pages/fixtures/layeredGraphFixtures'
import { PageHeader, ShowcaseSection, DemoCard } from '../components/ShowcaseSection'
import { ExplorerPlayground } from './layered/ExplorerPlayground'
import {
  ExplorerControlsTable,
  ExplorerHandleTable,
  ExplorerPropsTable,
  LayeredGraphActionsTable,
  LayeredGraphExportsTable,
  LayeredGraphStateTable,
  SnapshotHelpersTable,
  SnapshotTypesTable,
  UseLayeredGraphOptionsTable,
} from './layered/LayeredGraphReference'

const fg1 = 'rgb(var(--canvas-fg-1, 17 24 39))'
const fg2 = 'rgb(var(--canvas-fg-2, 75 85 99))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'
const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

// ─── Datasets ──────────────────────────────────────────────────────────────

type DatasetKey = 'spec' | 'ux'

const DATASETS = {
  spec: {
    label: 'Spec meta-model',
    summary: 'Documentation Robotics spec meta-model: element types and the relationship schemas between them.',
    nodes: drSpecNodes,
    edges: drSpecEdges,
    // The spec is dense; laying out on structural links only keeps each layer readable.
    layout: { layoutCategories: ['structural'] } as LayerLayoutOptions,
    selected: 'application.applicationcomponent',
  },
  ux: {
    label: 'heimdall-ux model',
    summary: 'A model of heimdall-ui itself: many links within each layer, few across.',
    nodes: heimdallUxNodes,
    edges: heimdallUxEdges,
    layout: { layoutCategories: null } as LayerLayoutOptions,
    selected: null,
  },
} as const

// Shared by both datasets: the fixtures carry a `layer` attribute and an edge `category`.
const LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'layer',
  layers: drLayers,
  categoryOrder: drCategoryOrder,
  linkCategoryBy: 'category',
}

const LANE_OPTIONS = { orientation: 'horizontal', intraLinks: 'arc' } as const

// ─── Code samples ──────────────────────────────────────────────────────────

const SETUP_CODE = `import { useLayeredGraph, LayeredGraphContext } from '@tinkermonkey/heimdall-ui'

// Memoize: a new layering object rebuilds the index.
const layering = useMemo(() => ({
  layerBy: 'layer',              // node.attributes.layer
  layers: [{ id: 'business', label: 'Business' }, { id: 'application' }, { id: 'technology' }],
  linkCategoryBy: 'category',    // edge.attributes.category
}), [])

const graph = useLayeredGraph({ nodes, edges, layering, defaultFollow: 1 })

<LayeredGraphContext.Provider value={graph}>
  <FollowControl />
  <PredicateLabelControl />
  {/* any of the views and chrome below */}
</LayeredGraphContext.Provider>`

const URL_SYNC_CODE = `import {
  LayeredGraphExplorer,
  sanitizeLayeredGraphExplorerSnapshot,
  type LayeredGraphExplorerHandle,
} from '@tinkermonkey/heimdall-ui'

const readUrl = () => {
  const raw = new URLSearchParams(location.search).get('state')
  try {
    // Untrusted: sanitize drops malformed fields. defaultSnapshot and restore sanitize too.
    return raw ? sanitizeLayeredGraphExplorerSnapshot(JSON.parse(raw)) : undefined
  } catch {
    return undefined
  }
}

const saved = useMemo(readUrl, [])
const explorer = useRef<LayeredGraphExplorerHandle>(null)

useEffect(() => {
  const onPop = () => { const s = readUrl(); if (s) explorer.current?.restore(s) }
  window.addEventListener('popstate', onPop)
  return () => window.removeEventListener('popstate', onPop)
}, [])

<LayeredGraphExplorer
  nodes={nodes}
  edges={edges}
  layering={layering}
  defaultSnapshot={saved}               // read once, on mount
  explorerRef={explorer}
  onSnapshotChange={(s) =>              // not on mount; camera moves once settled
    history.replaceState(null, '', \`?state=\${encodeURIComponent(JSON.stringify(s))}\`)
  }
/>`

const EXTERNAL_SNAPSHOT_CODE = `// With your own state (graph prop or a context), seed it from the snapshot;
// the explorer still applies view, nodeLabels and the stack camera.
const graph = useLayeredGraph({
  nodes, edges, layering,
  ...layeredGraphSnapshotDefaults(saved),   // selectedId → defaultSelectedId, …
})
<LayeredGraphExplorer graph={graph} defaultSnapshot={saved} />

// useLayeredGraph's own restore does not check its input:
graph.restore(sanitizeLayeredGraphSnapshot(untrusted))`

const MULTI_SELECT_CODE = `const graph = useLayeredGraph({ nodes, edges, layering, defaultSelectedIds: ['a', 'b'] })

graph.selectedIds          // ['a', 'b']: primary first
graph.selectedId           // 'a': the primary
graph.toggleSelected('c')  // ['a', 'b', 'c']
graph.setSelectedIds(['c', 'a'])
graph.select('b')          // ['b']: one node, replacing the rest`

const ASYNC_CODE = `// Opt in from 200 nodes. nodes, edges, layering and layout must be memoized.
const layout = useMemo(() => ({ layoutCategories: ['structural'] }), [])
const graph = useLayeredGraph({
  nodes, edges, layering, layout,
  asyncLayoutMinNodes: ASYNC_LAYOUT_MIN_NODES,
})
graph.layoutPending        // true while a run is in flight
graph.layout               // null until the first run lands

// Outside React:
const ctrl = new AbortController()
const result = await layoutLayersAsync(index, { layoutCategories: ['structural'] }, { signal: ctrl.signal })`

const CONTEXT_CODE = `function SelectionBadge() {
  const { selectedIds, nodeLabels, setNodeLabels } = useLayeredGraphContext()  // throws outside a provider
  return (
    <Button size="sm" onClick={() => setNodeLabels(!nodeLabels)}>
      {selectedIds.length} selected · labels {nodeLabels ? 'on' : 'off'}
    </Button>
  )
}`

const STACK_CODE = `<LayerStack
  defaultCameraPreset="stack"
  nodeLabels="reached"
/>
<PlaneLayoutControl />`

const LANES_CODE = `<GraphCanvas
  layout="layer-lanes"
  nodes={nodes}
  edges={edges}
  laneOptions={{ orientation: 'horizontal', intraLinks: 'arc' }}
  fitView
/>`

const MATRIX_CODE = `<AdjacencyMatrix order="coupled-x" showCodeLegend />`

const HIVE_CODE = `<HivePlot rank="degree" axisLabels={1} />`

const FILTER_CODE = `<LinkCategoryFilter nodeLabels={labels} onNodeLabelsChange={setLabels} />`

const INSPECTOR_CODE = `<ReachInspector
  empty={<><LayerList /><LayerPairList /><BridgeNodeList /></>}
/>`

function Code({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: '12px 0 0',
        padding: '12px 14px',
        background: 'rgb(var(--canvas-bg-2))',
        border: `1px solid ${border}`,
        borderRadius: 8,
        fontFamily: mono,
        fontSize: 12,
        lineHeight: 1.6,
        color: fg1,
        overflowX: 'auto',
      }}
    >
      {children}
    </pre>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: fg3 }}>
      {children}
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function LayeredGraphsShowcase() {
  const [dataset, setDataset] = useState<DatasetKey>('spec')

  return (
    <div>
      <PageHeader
        name="Layered graphs"
        description="Nodes and edges plus one layering attribute. Every node with the same attribute value lands on one layer; edges become links within a layer or across layers. Selecting a node lights its direct links, then follows cross-layer links away from the clicked layer for as many layers as the follow depth allows. All four views below read one shared state, so a selection, filter or follow change in one shows in all."
      />

      <ShowcaseSection
        label="LayeredGraphExplorer"
        description="The ready-made composite: view switcher, follow and camera controls, the scene, the link bar, the reach inspector and a status line, over one shared state. Selection, follow and filters carry across view switches; the stack keeps its camera. The controls prop turns each piece of chrome on or off."
      >
        <ExplorerPlayground />
      </ShowcaseSection>

      <ShowcaseSection label="LayeredGraphExplorer props">
        <ExplorerPropsTable />
      </ShowcaseSection>

      <ShowcaseSection
        label="Explorer controls"
        description="The controls prop (LayeredGraphExplorerControls) turns each piece of chrome on or off. Every field defaults to true, so pass only the ones to hide: controls={{ bridgeNodes: false, status: false }}."
      >
        <ExplorerControlsTable />
      </ShowcaseSection>

      <ShowcaseSection
        label="Matrix link panel"
        description="Changed in 0.11: in the explorer's matrix view, a cell click (or Enter or Space on a focused cell) opens a Link details panel at the top of the inspector aside instead of selecting the link's source node."
      >
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>The panel shows the cell's link in a GraphEdgeInspector and the matrix outlines the cell. Clicking an endpoint selects that node.</li>
          <li>A symmetric cell holding both directions gets a Reverse button that steps to the other link.</li>
          <li>Escape or the close button closes the panel and returns focus to the matrix cell that was clicked.</li>
          <li>The panel closes itself when a filter hides all of its links or the view changes.</li>
          <li>matrixProps.onCellSelect, or the deprecated onLinkSelect, replaces the panel: that handler runs instead, as in 0.10.0. With controls.inspector off there is no panel, and a click selects the source node.</li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection
        label="Snapshot and URL sync"
        description="LayeredGraphExplorerSnapshot is the whole explorer as plain JSON: the graph state (selection, follow, filters, predicate labels, layer focus, plane layout, node labels), the view, and the 3D stack's preset, camera and layer gap, kept while another view shows. defaultSnapshot seeds a fresh explorer from one, onSnapshotChange reports each change, and explorerRef restores one later, for example on popstate. Snapshots from a URL are untrusted, so every entry point sanitizes them."
      >
        <Code>{URL_SYNC_CODE}</Code>
        <Code>{EXTERNAL_SNAPSHOT_CODE}</Code>
        <ul style={{ margin: '14px 0 0', paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>A preset is active only while the stored camera and gap are the preset's own. Picking one stores its camera and gap at once, so a preset click reports once, already settled.</li>
          <li>A snapshot with a preset plus other camera fields, or a stackProps camera or gap override, keeps that camera and gap and drops the preset.</li>
          <li>A restored camera is clamped like the stack's own and stops the turntable. restore remounts the stack only when the camera changes; read stack() again after one that does.</li>
        </ul>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ExplorerHandleTable />
          <SnapshotTypesTable />
          <SnapshotHelpersTable />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="Shared state"
        description="One useLayeredGraph result in a LayeredGraphContext drives every view and control on this page. Each piece of state is controlled when its prop is set (with an on…Change callback) and otherwise held by the hook, seeded from its default… option."
      >
        <Code>{SETUP_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="useLayeredGraph options">
        <UseLayeredGraphOptionsTable />
      </ShowcaseSection>

      <ShowcaseSection
        label="useLayeredGraph state"
        description="The returned LayeredGraphState: derived data and the current value of each piece of state. Filter and selection actions build on the latest state, so several called in one handler compose."
      >
        <LayeredGraphStateTable />
      </ShowcaseSection>

      <ShowcaseSection label="useLayeredGraph actions">
        <LayeredGraphActionsTable />
      </ShowcaseSection>

      <ShowcaseSection
        label="Multi-select"
        description="selectedIds lists every selected node, primary first; selectedId is the primary. Reach is the union of each node's reach: every selected node is hop 0 and the others keep their lowest hop. A selected node missing from the graph or on a hidden layer reads as not selected, and hiding a layer drops its selected nodes."
      >
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>selectedId and onSelect are the single-select path and work as before. Controlling only selectedId keeps the selection to one node; selectedIds, when set, takes precedence.</li>
          <li>onSelect reports the primary: on every select and restore, and from the other selection and filter actions when the visible primary changes. onSelectedIdsChange reports every write of the ids.</li>
          <li>The views still select one node per click (no shift-click yet) and draw the primary's drill-through and inspector. A multi-selection comes from setSelectedIds, toggleSelected or the selectedIds prop; the other selected nodes light up through the reach.</li>
        </ul>
        <Code>{MULTI_SELECT_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Shared node labels">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>nodeLabels (controlled), defaultNodeLabels (default true) and onNodeLabelsChange hold node labels on or off in the shared state; setNodeLabels writes them, and the snapshot carries them.</li>
          <li>LayerStack (all or reached), HivePlot (axisLabels 1 or 0) and the layer-lanes canvas (all or reached) default to it. The label toggle in LinkCategoryFilter writes it, so one toggle switches labels in every view.</li>
          <li>A view's own nodeLabels, axisLabels or laneOptions.nodeLabels prop still overrides it.</li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection
        label="Follow categories"
        description="followCategories limits which link categories reach follows past the direct links; direct links are unaffected, and unset follows any category. It is compared by content, so an inline array does not recompute reach, emphasis or label placement on every render."
      >
        <Code>{`useLayeredGraph({ nodes, edges, layering, followCategories: ['structural'] })  // inline is fine`}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Async layout"
        description="In-layer layout runs synchronously by default. asyncLayoutMinNodes opts in to layoutLayersAsync from that many nodes (default false; ASYNC_LAYOUT_MIN_NODES, 200, is the recommended value; 0 means always). It computes the same result one solve at a time with a paint between, so a large graph does not block the page for the whole run."
      >
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>layoutPending is true while a run is in flight. layout is null until the first run lands, then keeps the last landed result while a newer run is pending. Meanwhile the views draw their fallbacks: circles in LayerStack, degree order in AdjacencyMatrix and lanes.</li>
          <li>Opting in requires memoized nodes, edges, layering and layout, including any nodeSize function. A layout or nodeSize rebuilt on every render restarts the run so it never lands; a dev warning names it.</li>
          <li>Without a custom nodeSize, an index rebuilt with the same content reuses the landed result (with a dev warning).</li>
        </ul>
        <Code>{ASYNC_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Context and exports"
        description="LayeredGraphContext shares one state with every view and control below it; each reads a graph prop first, then the context. useLayeredGraphContext reads it in custom views and chrome."
      >
        <LayeredGraphExportsTable />
        <Code>{CONTEXT_CODE}</Code>
      </ShowcaseSection>

      {/* Keyed by dataset: switching data resets selection, filters and camera. */}
      <LayeredDemo key={dataset} dataset={dataset} onDatasetChange={setDataset} />
    </div>
  )
}

function LayeredDemo({ dataset, onDatasetChange }: { dataset: DatasetKey; onDatasetChange: (d: DatasetKey) => void }) {
  const data = DATASETS[dataset]
  const layering = useMemo(() => LAYERING, [])
  const graph = useLayeredGraph({
    nodes: data.nodes,
    edges: data.edges,
    layering,
    layout: data.layout,
    defaultSelectedId: data.selected,
    defaultFollow: 1,
    defaultPredicateLabels: 'highlighted',
  })
  const [nodeLabelsOn, setNodeLabelsOn] = useState(true)
  // Reached labels read best around a selection; with none, label every node.
  const stackLabels: LayerStackNodeLabels = !nodeLabelsOn ? 'none' : graph.selectedId ? 'reached' : 'all'

  const crossCount = graph.index.links.filter((l) => l.cross).length
  const selectedNode = graph.selectedId ? graph.index.nodeById.get(graph.selectedId) : undefined

  return (
    <LayeredGraphContext.Provider value={graph}>
      {/* Controls stay in view while scrolling through the views. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          margin: '0 0 28px',
          padding: '12px 14px',
          background: 'rgb(var(--canvas-bg))',
          border: `1px solid ${border}`,
          borderRadius: 8,
          // Masks the canvas top padding above the stuck bar so content doesn't peek through.
          boxShadow: '0 -24px 0 0 rgb(var(--canvas-bg))',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eyebrow>Data</Eyebrow>
            <SegmentedControl
              aria-label="Dataset"
              value={dataset}
              onChange={(v) => onDatasetChange(v as DatasetKey)}
              options={[
                { value: 'spec', label: 'Spec' },
                { value: 'ux', label: 'UX' },
              ]}
            />
          </div>
          <FollowControl />
          <PredicateLabelControl />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, fontSize: 12, color: fg2 }}>
          <span style={{ fontFamily: mono, fontSize: 11 }}>
            {graph.index.layers.length} layers · {graph.index.nodes.length} nodes · {graph.index.links.length} links · {crossCount} cross-layer
          </span>
          <span style={{ fontFamily: mono, fontSize: 11, color: fg3 }}>
            {selectedNode
              ? `selected ${selectedNode.id} · reach ${graph.reach.hopOf.size - 1}`
              : 'no selection'}
          </span>
        </div>
      </div>

      <p style={{ margin: '-14px 0 28px', fontSize: 12, color: fg2, lineHeight: 1.65 }}>
        {data.label}: {data.summary}
      </p>

      <ShowcaseSection
        label="Layer stack"
        description="One plane per layer in a perspective projection. Drag to orbit, click a plane title to focus its layer. A selection adds a drill-through column through every plane."
      >
        <DemoCard label="LayerStack">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <PlaneLayoutControl />
          </div>
          <LayerStack defaultCameraPreset="stack" nodeLabels={stackLabels} />
        </DemoCard>
        <Code>{STACK_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Lanes"
        description="A GraphCanvas layout: one swimlane per layer, nodes packed in rows ordered so linked nodes line up. Intra-layer links arc above their row; cross-layer links curve between lanes."
      >
        <DemoCard label='GraphCanvas layout="layer-lanes"'>
          <div style={{ height: 520, border: `1px solid ${border}`, borderRadius: 6, overflow: 'hidden' }}>
            <GraphCanvas
              nodes={data.nodes}
              edges={data.edges}
              layout="layer-lanes"
              laneOptions={LANE_OPTIONS}
              fitView
              fitPadding={24}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </DemoCard>
        <Code>{LANES_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Adjacency matrix"
        description="Row is source, column is target. Diagonal blocks hold links within a layer, off-diagonal blocks links across layers. Nothing crosses, so it stays readable where node-link drawings tangle."
      >
        <DemoCard label="AdjacencyMatrix">
          <AdjacencyMatrix />
        </DemoCard>
        <Code>{MATRIX_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Hive plot"
        description="One doubled axis per layer, nodes ranked outward by degree. Compares how layers connect rather than where nodes sit. Reads well for 3 to about 6 layers."
      >
        <DemoCard label="HivePlot">
          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            <HivePlot />
          </div>
        </DemoCard>
        <Code>{HIVE_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Link filter"
        description="Category toggles with dash sample and count, the intra-layer toggle and a node-label toggle. Filters apply to every view; the label toggle here drives the layer stack."
      >
        <DemoCard label="LinkCategoryFilter">
          <LinkCategoryFilter nodeLabels={nodeLabelsOn} onNodeLabelsChange={setNodeLabelsOn} />
        </DemoCard>
        <Code>{FILTER_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Inspector and lists"
        description="ReachInspector shows the selection's direct and followed links. With no selection it shows the layer, layer-pair and bridge-node lists; each row focuses, filters or selects."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <DemoCard label="ReachInspector">
            <ReachInspector emptyText="No node selected. Pick a bridge node or click any node above." />
          </DemoCard>
          <DemoCard label="LayerList · LayerPairList · BridgeNodeList">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <LayerList />
              <LayerPairList />
              <BridgeNodeList />
            </div>
          </DemoCard>
        </div>
        <Code>{INSPECTOR_CODE}</Code>
      </ShowcaseSection>
    </LayeredGraphContext.Provider>
  )
}
