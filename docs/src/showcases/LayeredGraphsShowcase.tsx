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
  LayeredGraphExplorer,
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
const EXPLORER_GRAPH_OPTIONS = { defaultSelectedId: 'application.applicationcomponent', defaultFollow: 1, layout: { layoutCategories: ['structural'] } }

const EXPLORER_CODE = `<LayeredGraphExplorer
  nodes={nodes}
  edges={edges}
  layering={layering}
  views={['stack', 'lanes', 'matrix', 'hive']}
  controls={{ camera: true, bridgeNodes: false }}
/>`

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
        <DemoCard>
          <LayeredGraphExplorer
            nodes={drSpecNodes}
            edges={drSpecEdges}
            layering={LAYERING}
            graphOptions={EXPLORER_GRAPH_OPTIONS}
            statusLabel="dr spec meta-model"
          />
        </DemoCard>
        <Code>{EXPLORER_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Shared state" description="One useLayeredGraph result in a LayeredGraphContext drives every view and control on this page.">
        <Code>{SETUP_CODE}</Code>
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
