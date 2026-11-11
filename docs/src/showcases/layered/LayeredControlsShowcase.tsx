import { useRef, useState } from 'react'
import {
  AdjacencyMatrix,
  BridgeNodeList,
  Button,
  CameraControls,
  DEFAULT_LINK_FILTERS,
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
  SegmentedControl,
  ViewSwitcher,
  useLayeredGraph,
  useLayeredGraphProp,
  type BuildLayeredIndexOptions,
  type CameraPresetName,
  type LayerLayoutOptions,
  type LayerStackHandle,
  type LayeredGraphState,
  type LayeredGraphView,
} from '@tinkermonkey/heimdall-ui'
import {
  drCategoryOrder,
  drLayers,
  drSpecEdges,
  drSpecNodes,
  heimdallUxEdges,
  heimdallUxNodes,
} from '@/test-pages/fixtures/layeredGraphFixtures'
import { PageHeader, ShowcaseSection, DemoCard, PropsTable, PropRow } from '../../components/ShowcaseSection'

const fg1 = 'rgb(var(--canvas-fg-1, 17 24 39))'
const fg2 = 'rgb(var(--canvas-fg-2, 75 85 99))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'
const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

// ─── Data ──────────────────────────────────────────────────────────────────

type DatasetKey = 'spec' | 'ux'

const DATASETS = {
  spec: {
    label: 'Spec meta-model',
    nodes: drSpecNodes,
    edges: drSpecEdges,
    layout: { layoutCategories: ['structural'] } as LayerLayoutOptions,
    selected: 'application.applicationcomponent' as string | null,
  },
  ux: {
    label: 'heimdall-ux model',
    nodes: heimdallUxNodes,
    edges: heimdallUxEdges,
    layout: { layoutCategories: null } as LayerLayoutOptions,
    selected: 'application.applicationcomponent.graph-canvas-component' as string | null,
  },
} as const

const LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'layer',
  layers: drLayers,
  categoryOrder: drCategoryOrder,
  linkCategoryBy: 'category',
}

const LANE_OPTIONS = { orientation: 'horizontal', intraLinks: 'arc' } as const

const CATEGORY_LABELS = { structural: 'Structure', behavioral: 'Behavior', dependency: 'Dependency', security: 'Access' }

// ─── Code samples ──────────────────────────────────────────────────────────

const PATTERN_CODE = `const graph = useLayeredGraph({ nodes, edges, layering, defaultFollow: 1 })

// Context: every control and view below reads the same state.
<LayeredGraphContext.Provider value={graph}>
  <FollowControl />
  <AdjacencyMatrix />
</LayeredGraphContext.Provider>

// Or pass it explicitly; the prop wins over any context.
<FollowControl graph={graph} />

// Your own chrome: the same lookup, with a clear error when neither is present.
function SelectionReadout({ graph }: { graph?: LayeredGraphState }) {
  const g = useLayeredGraphProp(graph, 'SelectionReadout')
  const node = g.selectedId ? g.index.nodeById.get(g.selectedId) : undefined
  return (
    <div>
      <span>{node ? node.id : 'no selection'}</span>
      <Button variant="ghost" size="sm" disabled={!node} onClick={() => g.select(null)}>Clear</Button>
    </div>
  )
}`

const FOLLOW_CODE = `<FollowControl />

<FollowControl
  options={[0, 1, 2, 3]}
  formatOption={(n) => (n === 0 ? 'Direct' : \`\${n} hop\${n === 1 ? '' : 's'}\`)}
  label="Reach"
/>`

const PREDICATE_CODE = `<PredicateLabelControl />

<PredicateLabelControl
  optionLabels={{ off: 'None', highlighted: 'Reached', all: 'Every link' }}
  label="Labels"
/>`

const PLANE_CODE = `<PlaneLayoutControl />

<PlaneLayoutControl optionLabels={{ independent: 'Own layout', coupled: 'Aligned' }} label={null} />

<LayerStack nodeLabels="reached" />`

const FILTER_CODE = `const [labels, setLabels] = useState(true)

<LinkCategoryFilter
  categoryLabels={{ structural: 'Structure', behavioral: 'Behavior', security: 'Access' }}
  nodeLabels={labels}
  onNodeLabelsChange={setLabels}
>
  <Button variant="ghost" size="sm" onClick={() => graph.setFilters(DEFAULT_LINK_FILTERS)}>Reset</Button>
</LinkCategoryFilter>

<HivePlot axisLabels={labels ? 2 : 0} />`

const LAYER_LIST_CODE = `<LayerList />
<LayerList hideable={false} />
<LayerList focusable={false} showCounts={false} label="Layers · read only" />`

const PAIR_CODE = `<LayerPairList />
<LayerPairList sort="count" limit={2} />`

const BRIDGE_CODE = `<BridgeNodeList />
<BridgeNodeList limit={3} label="Top 3 bridges" />`

const VIEW_CODE = `const [view, setView] = useState<LayeredGraphView>('matrix')

<ViewSwitcher value={view} onChange={setView} />
{view === 'stack' && <LayerStack />}
{view === 'matrix' && <AdjacencyMatrix />}
{view === 'hive' && <HivePlot />}`

const CAMERA_CODE = `const stack = useRef<LayerStackHandle>(null)
const [preset, setPreset] = useState<CameraPresetName | null>('stack')
const [turntable, setTurntable] = useState(false)

<CameraControls
  stack={stack}
  preset={preset}
  turntable={turntable}
  onTurntableChange={setTurntable}
  showFit
  label="Camera"
/>
<LayerStack
  ref={stack}
  cameraPreset={preset}
  onCameraPresetChange={setPreset}
  turntable={turntable}
  onTurntableChange={setTurntable}
/>`

// ─── Bits ──────────────────────────────────────────────────────────────────

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

/** A control row above the view it drives. */
function Live({ controls, view }: { controls: React.ReactNode; view: React.ReactNode }) {
  return (
    <DemoCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20, rowGap: 12 }}>{controls}</div>
        <div style={{ borderTop: `1px solid ${border}`, paddingTop: 14 }}>{view}</div>
      </div>
    </DemoCard>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: '1 1 240px', minWidth: 0, border: `1px solid ${border}`, borderRadius: 6, padding: 12 }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: fg3, marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  )
}

function MiniMatrix() {
  return <AdjacencyMatrix cellSize={12} labelWidth={180} showCodeLegend={false} />
}

function MiniHive({ axisLabels }: { axisLabels?: number }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <HivePlot axisLabels={axisLabels} />
    </div>
  )
}

function MiniStack() {
  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <LayerStack nodeLabels="reached" />
    </div>
  )
}

/** Custom chrome built on useLayeredGraphProp. */
function SelectionReadout({ graph }: { graph?: LayeredGraphState }) {
  const g = useLayeredGraphProp(graph, 'SelectionReadout')
  const node = g.selectedId ? g.index.nodeById.get(g.selectedId) : undefined
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <Eyebrow>Selection</Eyebrow>
      <span style={{ fontFamily: mono, fontSize: 11, color: node ? fg1 : fg3 }}>
        {node ? `${node.id} · reach ${g.reach.hopOf.size - 1}` : 'no selection'}
      </span>
      <Button variant="ghost" size="sm" disabled={!node} onClick={() => g.select(null)}>
        Clear
      </Button>
    </div>
  )
}

function ChromeProps({ extra }: { extra?: React.ReactNode }) {
  return (
    <>
      <PropRow name="graph" type="LayeredGraphState" def="context" description="State from useLayeredGraph; unset uses the enclosing LayeredGraphContext." />
      {extra}
    </>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function LayeredControlsShowcase() {
  const [dataset, setDataset] = useState<DatasetKey>('spec')
  return (
    <div>
      <PageHeader
        name="Layered controls"
        description="The chrome around the layered views: follow depth, predicate labels, plane layout, the link bar, the layer, layer-pair and bridge-node lists, and the explorer's view switcher and camera controls. Every section below runs against one shared useLayeredGraph state, so a change in any control shows in every view on the page."
      />
      {/* Keyed by dataset: switching data resets selection, filters and cameras. */}
      <ControlsDemo key={dataset} dataset={dataset} onDatasetChange={setDataset} />
    </div>
  )
}

function ControlsDemo({ dataset, onDatasetChange }: { dataset: DatasetKey; onDatasetChange: (d: DatasetKey) => void }) {
  const data = DATASETS[dataset]
  const graph = useLayeredGraph({
    nodes: data.nodes,
    edges: data.edges,
    layering: LAYERING,
    layout: data.layout,
    defaultSelectedId: data.selected,
    defaultFollow: 1,
    defaultPredicateLabels: 'highlighted',
  })
  const [nodeLabels, setNodeLabels] = useState(true)
  const [view, setView] = useState<LayeredGraphView>('matrix')
  const stackRef = useRef<LayerStackHandle>(null)
  const [preset, setPreset] = useState<CameraPresetName | null>('stack')
  const [turntable, setTurntable] = useState(false)

  return (
    <LayeredGraphContext.Provider value={graph}>
      {/* Shared state readout stays in view while scrolling through the controls. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          margin: '0 0 28px',
          padding: '10px 14px',
          background: 'rgb(var(--canvas-bg))',
          border: `1px solid ${border}`,
          borderRadius: 8,
          boxShadow: '0 -24px 0 0 rgb(var(--canvas-bg))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          rowGap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eyebrow>Data</Eyebrow>
          <SegmentedControl
            aria-label="Dataset"
            value={dataset}
            onChange={(v) => onDatasetChange(v as DatasetKey)}
            options={[{ value: 'spec', label: 'Spec' }, { value: 'ux', label: 'UX' }]}
          />
        </div>
        <SelectionReadout />
      </div>

      <ShowcaseSection
        label="Shared pattern"
        description="Every control takes an optional graph prop and otherwise reads the enclosing LayeredGraphContext, throwing a clear error with neither. useLayeredGraphProp(graph, name) is the same lookup for custom chrome: the selection readout in the bar above is built on it."
      >
        <Code>{PATTERN_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="FollowControl"
        description="How far the selection's reach follows cross-layer links past the direct links. Writes follow. options sets the depths offered; formatOption sets each segment's text (followOptionLabel by default: Direct, +1 layer, +2 layers)."
      >
        <Live
          controls={
            <>
              <FollowControl />
              <FollowControl
                options={[0, 1, 2, 3]}
                formatOption={(n) => (n === 0 ? 'Direct' : `${n} hop${n === 1 ? '' : 's'}`)}
                label="Reach"
              />
            </>
          }
          view={<MiniMatrix />}
        />
        <Code>{FOLLOW_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <ChromeProps />
            <PropRow name="options" type="readonly number[]" def="[0, 1, 2]" description="Follow depths offered (hops past the direct links)." />
            <PropRow name="formatOption" type="(follow: number) => ReactNode" def="followOptionLabel" description="Segment text per depth: Direct, +1 layer, +2 layers." />
            <PropRow name="label" type="ReactNode" def="'Follow'" description="Mono eyebrow before the control; null hides it." />
            <PropRow name="disabled" type="boolean" def="false" description="Disables every segment." />
            <PropRow name="surface" type="ChromeSurface" def="'canvas'" description="'shell' for a dark chrome bar in either canvas theme; same prop as SegmentedControl." />
          </PropsTable>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="PredicateLabelControl"
        description="Which links show predicate labels: Off, Highlighted (reached links and the active layer pair) or All. Writes predicateLabels; the hive plot shows them as pills, the matrix as cell codes."
      >
        <Live
          controls={
            <>
              <PredicateLabelControl />
              <PredicateLabelControl optionLabels={{ off: 'None', highlighted: 'Reached', all: 'Every link' }} label="Labels" />
            </>
          }
          view={<MiniHive />}
        />
        <Code>{PREDICATE_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <ChromeProps />
            <PropRow name="options" type="readonly PredicateLabelMode[]" def="['off', 'highlighted', 'all']" description="Modes offered, in order." />
            <PropRow name="optionLabels" type="Partial<Record<PredicateLabelMode, ReactNode>>" description="Segment text per mode; default Off, Highlighted, All." />
            <PropRow name="label" type="ReactNode" def="'Predicates'" description="Mono eyebrow before the control; null hides it." />
            <PropRow name="disabled" type="boolean" def="false" description="Disables every segment." />
            <PropRow name="surface" type="ChromeSurface" def="'canvas'" description="'shell' for a dark chrome bar in either canvas theme; same prop as SegmentedControl." />
          </PropsTable>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="PlaneLayoutControl"
        description="Independent lays each layer out on its own; Coupled pulls cross-layer neighbours into line. Writes planeLayout; views that position nodes per layer, such as the layer stack, read it."
      >
        <Live
          controls={
            <>
              <PlaneLayoutControl />
              <PlaneLayoutControl optionLabels={{ independent: 'Own layout', coupled: 'Aligned' }} label={null} />
            </>
          }
          view={<MiniStack />}
        />
        <Code>{PLANE_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <ChromeProps />
            <PropRow name="optionLabels" type="Partial<Record<PlaneLayoutMode, ReactNode>>" description="Segment text per mode; default Independent, Coupled." />
            <PropRow name="label" type="ReactNode" def="'Plane layout'" description="Mono eyebrow before the control; null hides it." />
            <PropRow name="disabled" type="boolean" def="false" description="Disables both segments." />
            <PropRow name="surface" type="ChromeSurface" def="'canvas'" description="'shell' for a dark chrome bar in either canvas theme; same prop as SegmentedControl." />
          </PropsTable>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="LinkCategoryFilter"
        description="The link bar: one toggle per category with its dash sample and link count, then the intra-layer toggle and, when onNodeLabelsChange is set, a node-label toggle. Category and intra toggles write filters. Node labels are view state, so that toggle is controlled; here it drives the hive's busiest-node labels. children render after a divider at the end."
      >
        <Live
          controls={
            <LinkCategoryFilter categoryLabels={CATEGORY_LABELS} nodeLabels={nodeLabels} onNodeLabelsChange={setNodeLabels}>
              <Button variant="ghost" size="sm" onClick={() => graph.setFilters(DEFAULT_LINK_FILTERS)}>
                Reset
              </Button>
            </LinkCategoryFilter>
          }
          view={<MiniHive axisLabels={nodeLabels ? 2 : 0} />}
        />
        <Code>{FILTER_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <ChromeProps />
            <PropRow name="categories" type="readonly string[]" def="all in the index" description="Categories offered, in order." />
            <PropRow name="categoryLabels" type="Readonly<Record<string, ReactNode>>" description="Display text per category; unset uses categoryDisplayLabel (sentence case)." />
            <PropRow name="showCounts" type="boolean" def="true" description="Link count per category (bundled links by primary category)." />
            <PropRow name="label" type="ReactNode" def="'Links'" description="Mono eyebrow before the toggles; null hides it." />
            <PropRow name="showIntraToggle" type="boolean" def="true" description="Toggle for filters.showIntra." />
            <PropRow name="intraLabel" type="ReactNode" def="'Intra-layer links'" description="Intra toggle text." />
            <PropRow name="showLabelToggle" type="boolean" def="set when onNodeLabelsChange is" description="Toggle for node labels." />
            <PropRow name="nodeLabels" type="boolean" def="true" description="Node labels on or off (controlled)." />
            <PropRow name="onNodeLabelsChange" type="(on: boolean) => void" description="Called by the node-label toggle." />
            <PropRow name="labelToggleLabel" type="ReactNode" def="'Labels'" description="Node-label toggle text." />
            <PropRow name="children" type="ReactNode" description="Rendered after a divider at the end of the bar." />
            <PropRow name="surface" type="ChromeSurface" def="'canvas'" description="'shell' for a dark chrome bar in either canvas theme; same prop as SegmentedControl." />
          </PropsTable>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="LayerList"
        description="One row per layer: swatch, name, and node and within-layer link counts. With focusable, the row is a button that focuses the layer (again to clear); with hideable, the eye button hides or shows it. Hidden layers drop out of every view."
      >
        <Live
          controls={
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: '100%' }}>
              <Panel label="default">
                <LayerList />
              </Panel>
              <Panel label="hideable={false}">
                <LayerList hideable={false} />
              </Panel>
              <Panel label="focusable={false} showCounts={false}">
                <LayerList focusable={false} showCounts={false} label="Layers · read only" />
              </Panel>
            </div>
          }
          view={<MiniMatrix />}
        />
        <Code>{LAYER_LIST_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <ChromeProps />
            <PropRow name="label" type="ReactNode" def="'Layers'" description="Eyebrow; null hides it." />
            <PropRow name="focusable" type="boolean" def="true" description="Rows are buttons that focus the layer; false renders plain rows." />
            <PropRow name="hideable" type="boolean" def="true" description="Eye button per row that hides or shows the layer." />
            <PropRow name="showCounts" type="boolean" def="true" description="Node and intra-layer link counts per row." />
          </PropsTable>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="LayerPairList"
        description="One row per layer pair with cross-layer links: both swatches, the names and the link count. A row toggles layer-pair focus, so only that pair's cross-layer links show, and by default clears the selection. sort orders by layer rank or by count; limit caps the rows."
      >
        <Live
          controls={
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: '100%' }}>
              <Panel label={`sort="rank"`}>
                <LayerPairList />
              </Panel>
              <Panel label={`sort="count" limit={2}`}>
                <LayerPairList sort="count" limit={2} />
              </Panel>
            </div>
          }
          view={<MiniHive />}
        />
        <Code>{PAIR_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <ChromeProps />
            <PropRow name="label" type="ReactNode" def="'Cross-layer links'" description="Eyebrow; null hides it." />
            <PropRow name="showEmptyPairs" type="boolean" def="false" description="List pairs with no cross-layer links." />
            <PropRow name="sort" type="'rank' | 'count'" def="'rank'" description="Row order: layer rank, or link count (most first)." />
            <PropRow name="limit" type="number" description="At most this many rows." />
            <PropRow name="clearSelection" type="boolean" def="true" description="Picking a pair clears the selection." />
            <PropRow name="emptyText" type="ReactNode" def="'No cross-layer links.'" description="Shown when no pair qualifies." />
          </PropsTable>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="BridgeNodeList"
        description="The nodes with the most cross-layer links, ties broken by total degree, skipping hidden layers. A row selects the node."
      >
        <Live
          controls={
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: '100%' }}>
              <Panel label="default (limit 6)">
                <BridgeNodeList />
              </Panel>
              <Panel label="limit={3}">
                <BridgeNodeList limit={3} label="Top 3 bridges" />
              </Panel>
            </div>
          }
          view={<MiniMatrix />}
        />
        <Code>{BRIDGE_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <ChromeProps />
            <PropRow name="label" type="ReactNode" def="'Bridge nodes · most cross-layer links'" description="Eyebrow; null hides it." />
            <PropRow name="limit" type="number" def="6" description="Number of nodes listed." />
            <PropRow name="emptyText" type="ReactNode" def="'No cross-layer links.'" description="Shown when no node has a cross-layer link." />
          </PropsTable>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="ViewSwitcher"
        description="From LayeredGraphExplorer, for custom layouts. A plain controlled segmented control over LayeredGraphView values; it holds no state and does not read the layered graph. LAYERED_GRAPH_VIEWS lists the views, LAYERED_GRAPH_VIEW_LABELS their default text. Selection, follow and filters carry across a switch because the views share one state."
      >
        <Live
          controls={<ViewSwitcher value={view} onChange={setView} />}
          view={
            <>
              {view === 'stack' && <MiniStack />}
              {view === 'lanes' && (
                <div style={{ height: 460, border: `1px solid ${border}`, borderRadius: 6, overflow: 'hidden' }}>
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
              )}
              {view === 'matrix' && <MiniMatrix />}
              {view === 'hive' && <MiniHive />}
            </>
          }
        />
        <Code>{VIEW_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <PropRow name="value" type="LayeredGraphView" required description="The active view: 'stack' | 'lanes' | 'matrix' | 'hive'." />
            <PropRow name="onChange" type="(view: LayeredGraphView) => void" required description="Called with the picked view." />
            <PropRow name="views" type="readonly LayeredGraphView[]" def="LAYERED_GRAPH_VIEWS" description="Views offered, in order." />
            <PropRow name="viewLabels" type="Partial<Record<LayeredGraphView, ReactNode>>" description="Segment text per view; default 3D stack, Lanes, Matrix, Hive." />
            <PropRow name="label" type="ReactNode" def="'View'" description="Mono eyebrow; null hides it." />
            <PropRow name="disabled" type="boolean" def="false" description="Disables every segment." />
            <PropRow name="surface" type="ChromeSurface" def="'canvas'" description="'shell' for a dark chrome bar in either canvas theme; same prop as SegmentedControl." />
          </PropsTable>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        label="CameraControls"
        description="From LayeredGraphExplorer: camera chrome for a LayerStack. Preset segmented control, zoom out and in, an optional fit button and a turntable toggle, driven through the stack's ref handle. The active preset and turntable shown come from props, so wire them to the stack's controlled props. An orbit by hand clears the preset."
      >
        <Live
          controls={
            <CameraControls
              stack={stackRef}
              preset={preset}
              turntable={turntable}
              onTurntableChange={setTurntable}
              showFit
              label="Camera"
            />
          }
          view={
            <div style={{ maxWidth: 620, margin: '0 auto' }}>
              <LayerStack
                ref={stackRef}
                nodeLabels="reached"
                cameraPreset={preset}
                onCameraPresetChange={setPreset}
                turntable={turntable}
                onTurntableChange={setTurntable}
              />
              <div style={{ marginTop: 8, fontFamily: mono, fontSize: 11, color: fg2 }}>
                preset {preset ?? 'none'} · turntable {turntable ? 'on' : 'off'}
              </div>
            </div>
          }
        />
        <Code>{CAMERA_CODE}</Code>
        <div style={{ marginTop: 12 }}>
          <PropsTable>
            <PropRow name="stack" type="RefObject<LayerStackHandle | null>" description="The LayerStack to drive (presets, zoom, fit, turntable)." />
            <PropRow name="preset" type="CameraPresetName | null" def="null" description="Preset shown as active; wire to the stack's cameraPreset / onCameraPresetChange." />
            <PropRow name="onPresetChange" type="(preset: CameraPresetName) => void" description="Called with a picked preset (the handle applies it as well)." />
            <PropRow name="presets" type="readonly CameraPresetName[]" def="all four" description="Presets offered; empty hides the control." />
            <PropRow name="presetLabels" type="Partial<Record<CameraPresetName, ReactNode>>" description="Segment text per preset; default Stack, Exploded, Top, Profile." />
            <PropRow name="turntable" type="boolean" def="false" description="Turntable state shown on the toggle." />
            <PropRow name="onTurntableChange" type="(on: boolean) => void" description="Called by the toggle; unset calls the handle's setTurntable." />
            <PropRow name="showZoom" type="boolean" def="true" description="Zoom out / in buttons." />
            <PropRow name="showFit" type="boolean" def="false" description="Fit button." />
            <PropRow name="showTurntable" type="boolean" def="true" description="Turntable toggle." />
            <PropRow name="zoomStep" type="number" def="1.2" description="Zoom factor per press." />
            <PropRow name="label" type="ReactNode" def="null" description="Mono eyebrow before the presets." />
            <PropRow name="disabled" type="boolean" def="false" description="Disables every control." />
          </PropsTable>
        </div>
      </ShowcaseSection>
    </LayeredGraphContext.Provider>
  )
}
