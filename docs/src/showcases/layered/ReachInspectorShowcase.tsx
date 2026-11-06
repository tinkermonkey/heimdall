import { useState } from 'react'
import {
  BridgeNodeList,
  FollowControl,
  GraphInspector,
  HivePlot,
  LayerList,
  LayeredGraphContext,
  ReachInspector,
  SegmentedControl,
  reachRelationships,
  useLayeredGraph,
  type BuildLayeredIndexOptions,
  type GraphNodeMetadata,
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
    selected: 'application.applicationcomponent',
  },
  ux: {
    label: 'heimdall-ux model',
    nodes: heimdallUxNodes,
    edges: heimdallUxEdges,
    selected: 'application.applicationcomponent.graph-canvas-component',
  },
} as const

const LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'layer',
  layers: drLayers,
  categoryOrder: drCategoryOrder,
  linkCategoryBy: 'category',
}

// ─── Code samples ──────────────────────────────────────────────────────────

const EMPTY_CODE = `<ReachInspector />

<ReachInspector
  empty={<><LayerList hideable={false} /><BridgeNodeList limit={4} /></>}
/>`

const RELATIONSHIPS_CODE = `const graph = useLayeredGraph({ nodes, edges, layering, defaultFollow: 1 })
const rels = reachRelationships(graph)   // null with no selection

<GraphInspector
  node={rels && {
    id: rels.node.id,
    title: rels.node.label,
    kind: rels.layer.label,
    description: String(rels.node.source.attributes?.description ?? ''),
  }}
  relationships={rels ? [...rels.cross, ...rels.intra, ...rels.followed] : []}
  onNodeSelect={graph.select}
/>

// Each RelationshipLink carries the layered fields:
// hop: 1 direct, 2+ followed (a +n badge)
// via: { id, title, predicate } — the node and predicate it was reached through
// layer: { id, label, color } — fills the row swatch`

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

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: fg3 }}>{label}</span>
      {children}
    </div>
  )
}

function OnOff({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Control label={label}>
      <SegmentedControl
        aria-label={label}
        value={value ? 'on' : 'off'}
        onChange={(v) => onChange(v === 'on')}
        options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]}
      />
    </Control>
  )
}

/** A scene beside a side panel; the panel drops below the scene when the row is narrow. */
function SceneWithPanel({ scene, panel }: { scene: React.ReactNode; panel: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 380px', minWidth: 0 }}>{scene}</div>
      <div style={{ flex: '0 1 320px', minWidth: 260, border: `1px solid ${border}`, borderRadius: 8, padding: 14 }}>{panel}</div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function ReachInspectorShowcase() {
  const [dataset, setDataset] = useState<DatasetKey>('spec')
  return (
    <div>
      <PageHeader
        name="ReachInspector"
        description="Inspector for the layered views' selection. A head with the layer eyebrow, clear button, name, identifier and description; stat tiles for cross-layer and within-layer link counts; the direct relationships across layers and within the layer; a mono reach line; then the nodes followed across layers, each with the node and predicate it was reached through and a +n hop badge. Rows are buttons that select their node. Only links the filters leave traversable are listed."
      />

      {/* Keyed by dataset: switching data resets the selection. */}
      <Playground key={dataset} dataset={dataset} onDatasetChange={setDataset} />

      <EmptyDemo />

      <RelationshipsDemo />

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="graph" type="LayeredGraphState" def="context" description="State from useLayeredGraph; unset uses the enclosing LayeredGraphContext." />
          <PropRow name="emptyText" type="ReactNode" def="'No node selected.'" description="Shown with no selection." />
          <PropRow name="empty" type="ReactNode" description="Replaces the empty text with no selection, e.g. a LayerList and BridgeNodeList." />
          <PropRow name="showClear" type="boolean" def="true" description="Clear-selection button beside the layer eyebrow." />
          <PropRow name="showDescription" type="boolean" def="true" description="The node's attributes.description." />
          <PropRow name="showStats" type="boolean" def="true" description="Across-layers and within-layer stat tiles." />
          <PropRow name="showFollowed" type="boolean" def="true" description="The Followed across layers list (hop 2 and deeper)." />
          <PropRow name="showReachSummary" type="boolean" def="true" description="The mono reach line under the cross-layer rows." />
          <PropRow name="onNodeSelect" type="(nodeId: string) => void" description="Row handler; unset selects the row's node." />
          <PropRow name="...divProps" type="HTMLAttributes<HTMLDivElement>" description="Remaining props spread onto the root div." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

function Playground({ dataset, onDatasetChange }: { dataset: DatasetKey; onDatasetChange: (d: DatasetKey) => void }) {
  const data = DATASETS[dataset]
  const graph = useLayeredGraph({
    nodes: data.nodes,
    edges: data.edges,
    layering: LAYERING,
    layout: false,
    defaultSelectedId: data.selected,
    defaultFollow: 1,
  })
  const [showClear, setShowClear] = useState(true)
  const [showDescription, setShowDescription] = useState(true)
  const [showStats, setShowStats] = useState(true)
  const [showFollowed, setShowFollowed] = useState(true)
  const [showReachSummary, setShowReachSummary] = useState(true)

  const jsxProps = [
    !showClear && 'showClear={false}',
    !showDescription && 'showDescription={false}',
    !showStats && 'showStats={false}',
    !showFollowed && 'showFollowed={false}',
    !showReachSummary && 'showReachSummary={false}',
  ].filter(Boolean)
  const jsx = `<ReachInspector${jsxProps.length ? ' ' + jsxProps.join(' ') : ''} />`

  return (
    <LayeredGraphContext.Provider value={graph}>
      <ShowcaseSection
        label="Playground"
        description="The inspector and a hive plot over one shared state. Click a node in the plot or a row in the inspector to select it. Raise the follow depth and the Followed across layers list grows: each row names the node and predicate it was reached through. Direct leaves only the direct relationships."
      >
        <DemoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, rowGap: 10 }}>
              <Control label="Data">
                <SegmentedControl
                  aria-label="Dataset"
                  value={dataset}
                  onChange={(v) => onDatasetChange(v as DatasetKey)}
                  options={[{ value: 'spec', label: 'Spec' }, { value: 'ux', label: 'UX' }]}
                />
              </Control>
              <FollowControl options={[0, 1, 2]} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, rowGap: 10 }}>
              <OnOff label="Clear" value={showClear} onChange={setShowClear} />
              <OnOff label="Description" value={showDescription} onChange={setShowDescription} />
              <OnOff label="Stats" value={showStats} onChange={setShowStats} />
              <OnOff label="Followed" value={showFollowed} onChange={setShowFollowed} />
              <OnOff label="Reach line" value={showReachSummary} onChange={setShowReachSummary} />
            </div>
            <SceneWithPanel
              scene={<HivePlot />}
              panel={
                <ReachInspector
                  showClear={showClear}
                  showDescription={showDescription}
                  showStats={showStats}
                  showFollowed={showFollowed}
                  showReachSummary={showReachSummary}
                  emptyText="No node selected. Click a node in the plot."
                />
              }
            />
          </div>
        </DemoCard>
        <Code>{jsx}</Code>
      </ShowcaseSection>
    </LayeredGraphContext.Provider>
  )
}

function EmptyDemo() {
  const graph = useLayeredGraph({ nodes: drSpecNodes, edges: drSpecEdges, layering: LAYERING, layout: false, defaultFollow: 1 })
  return (
    <LayeredGraphContext.Provider value={graph}>
      <ShowcaseSection
        label="Empty state"
        description="With no selection the inspector shows emptyText, or the empty slot in its place. The slot here holds a LayerList and a BridgeNodeList: pick a bridge node to select it, then the clear button returns to the slot. Both inspectors read the same state."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <DemoCard label="emptyText (default)">
            <ReachInspector />
          </DemoCard>
          <DemoCard label="empty slot">
            <ReachInspector
              empty={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <LayerList hideable={false} />
                  <BridgeNodeList limit={4} />
                </div>
              }
            />
          </DemoCard>
        </div>
        <Code>{EMPTY_CODE}</Code>
      </ShowcaseSection>
    </LayeredGraphContext.Provider>
  )
}

function RelationshipsDemo() {
  const graph = useLayeredGraph({
    nodes: drSpecNodes,
    edges: drSpecEdges,
    layering: LAYERING,
    layout: false,
    defaultSelectedId: 'business.businessservice',
    defaultFollow: 1,
  })
  const rels = reachRelationships(graph)
  const node: GraphNodeMetadata | null = rels
    ? {
        id: rels.node.id,
        title: rels.node.label,
        kind: rels.layer.label,
        description: String(rels.node.source.attributes?.description ?? ''),
      }
    : null

  return (
    <LayeredGraphContext.Provider value={graph}>
      <ShowcaseSection
        label="reachRelationships with GraphInspector"
        description="reachRelationships(graph) returns the inspector's data as RelationshipLinks split into cross, intra and followed, or null with no selection. Fed to the existing GraphInspector, the optional layered fields show: layer fills the row swatch, hop above 1 adds a +n badge, and via names the node and predicate a followed node was reached through."
      >
        <DemoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FollowControl />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, alignItems: 'start' }}>
              <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, marginBottom: 10 }}>ReachInspector</div>
                <ReachInspector />
              </div>
              <div style={{ border: `1px solid ${border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, marginBottom: 10 }}>GraphInspector · reachRelationships</div>
                <GraphInspector
                  node={node}
                  relationships={rels ? [...rels.cross, ...rels.intra, ...rels.followed] : []}
                  onNodeSelect={graph.select}
                  emptyStateText="No node selected."
                />
              </div>
            </div>
            {rels && (
              <div style={{ fontFamily: mono, fontSize: 11, color: fg2 }}>
                cross {rels.cross.length} · intra {rels.intra.length} · followed {rels.followed.length} · reach {rels.reachCount} nodes across {rels.reachLayerCount} layers
              </div>
            )}
          </div>
        </DemoCard>
        <Code>{RELATIONSHIPS_CODE}</Code>
      </ShowcaseSection>
    </LayeredGraphContext.Provider>
  )
}
