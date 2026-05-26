import { useState, useCallback } from 'react'
import {
  GraphCanvas,
  GraphNode,
  GraphInspector,
  TopologyNode,
  SplitPane,
  type GraphNodeData,
  type GraphEdgeData,
  type GraphNodeMetadata,
  type RelationshipLink,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'

const NODES: (GraphNodeData & { title?: string; domain?: string; description?: string })[] = [
  { id: 'cls_cell', x: 200, y: 160, label: 'Cell', kind: 'C', domainColor: 'life', title: 'Cell', domain: 'life', description: 'Basic unit of life' },
  { id: 'cls_nucleus', x: 60, y: 50, label: 'Nucleus', kind: 'C', domainColor: 'life', title: 'Nucleus', domain: 'life' },
  { id: 'cls_mito', x: 340, y: 45, label: 'Mitochondrion', kind: 'C', domainColor: 'life', title: 'Mitochondrion', domain: 'life' },
  { id: 'cls_protein', x: 450, y: 200, label: 'Protein', kind: 'C', domainColor: 'life', title: 'Protein', domain: 'life' },
]

const EDGES: GraphEdgeData[] = [
  { id: 'e1', sourceId: 'cls_cell', targetId: 'cls_nucleus', label: 'contains' },
  { id: 'e2', sourceId: 'cls_cell', targetId: 'cls_mito', label: 'contains' },
  { id: 'e3', sourceId: 'cls_nucleus', targetId: 'cls_protein', label: 'encodes' },
]

const TOPOLOGY_NODES = [
  {
    title: 'API Server',
    role: 'backend',
    status: 'ok' as const,
    metrics: [
      { label: 'CPU', value: '45%', percent: 45, sparklineData: [20, 30, 45, 40, 50, 45], color: 'emerald' as const },
      { label: 'Memory', value: '62%', percent: 62, sparklineData: [55, 58, 60, 62, 61, 62], color: 'amber' as const },
    ],
  },
  {
    title: 'Database',
    role: 'storage',
    status: 'warning' as const,
    metrics: [
      { label: 'Connections', value: '342/500', percent: 68, sparklineData: [60, 65, 68, 70, 68, 68], color: 'amber' as const },
    ],
  },
  {
    title: 'Cache',
    role: 'cache',
    status: 'ok' as const,
    metrics: [
      { label: 'Hit Rate', value: '94%', percent: 94, sparklineData: [90, 92, 93, 94, 94, 94], color: 'emerald' as const },
    ],
  },
  {
    title: 'Message Queue',
    role: 'queue',
    status: 'error' as const,
    metrics: [
      { label: 'Backlog', value: '1.2K', percent: 85, sparklineData: [20, 40, 60, 80, 85, 85], color: 'rose' as const },
    ],
  },
]

const EDGE_VARIANT_NODES: GraphNodeData[] = [
  { id: 'ev_a', x: 60, y: 80, label: 'Source A', kind: 'C', domainColor: 'life' },
  { id: 'ev_b', x: 300, y: 80, label: 'Target B', kind: 'C', domainColor: 'life' },
  { id: 'ev_c', x: 60, y: 200, label: 'Source C', kind: 'C', domainColor: 'software' },
  { id: 'ev_d', x: 300, y: 200, label: 'Target D', kind: 'C', domainColor: 'software' },
  { id: 'ev_e', x: 60, y: 320, label: 'Source E', kind: 'C', domainColor: 'climate' },
  { id: 'ev_f', x: 300, y: 320, label: 'Target F', kind: 'C', domainColor: 'climate' },
]

const EDGE_VARIANT_EDGES: GraphEdgeData[] = [
  { id: 'ee1', sourceId: 'ev_a', targetId: 'ev_b', label: 'contains' },
  { id: 'ee2', sourceId: 'ev_c', targetId: 'ev_d', label: 'encodes', variant: 'hot' },
  { id: 'ee3', sourceId: 'ev_e', targetId: 'ev_f', label: 'deprecated', variant: 'irrelevant' },
]

export function GraphEdgeShowcase() {
  const renderNode = useCallback((node: GraphNodeData) => (
    <GraphNode id={node.id} label={node.label} kind={node.kind} domainColor={node.domainColor} />
  ), [])

  return (
    <div>
      <PageHeader name="GraphEdge" description="SVG bezier edge drawn between two nodes inside a GraphCanvas. Supports variant styling for active and deprecated relationships." />
      <ShowcaseSection label="Variant comparison" description="Default (neutral), hot (active/highlighted), and irrelevant (deprecated/dashed) variants shown side-by-side.">
        <DemoCard>
          <div style={{ height: 400 }}>
            <GraphCanvas
              nodes={EDGE_VARIANT_NODES}
              edges={EDGE_VARIANT_EDGES}
              renderNode={renderNode}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="id" type="string" description="Unique edge identifier" />
          <PropRow name="sourceId" type="string" description="ID of the source node" />
          <PropRow name="targetId" type="string" description="ID of the target node" />
          <PropRow name="label" type="string" description="Optional text label rendered at the midpoint of the edge" />
          <PropRow name="variant" type="'default' | 'hot' | 'irrelevant'" def="'default'" description="Visual style: default is neutral, hot highlights an active relationship in amber, irrelevant renders a dashed rose line for deprecated links" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function GraphNodeShowcase() {
  const [selectedId, setSelectedId] = useState<string | undefined>()

  return (
    <div>
      <PageHeader name="GraphNode" description="Inline node chip used within GraphCanvas. Displays a colored domain swatch, a label, and an optional kind badge." />
      <ShowcaseSection label="Domain color variants">
        <DemoCard>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <GraphNode id="n1" label="Default" onSelect={setSelectedId} selected={selectedId === 'n1'} />
            <GraphNode id="n2" label="Life" domainColor="life" onSelect={setSelectedId} selected={selectedId === 'n2'} />
            <GraphNode id="n3" label="Climate" domainColor="climate" onSelect={setSelectedId} selected={selectedId === 'n3'} />
            <GraphNode id="n4" label="Software" domainColor="software" onSelect={setSelectedId} selected={selectedId === 'n4'} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="With kind badge">
        <DemoCard>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <GraphNode id="n5" label="Organism" kind="C" domainColor="life" onSelect={setSelectedId} selected={selectedId === 'n5'} />
            <GraphNode id="n6" label="individual" kind="individual" domainColor="life" onSelect={setSelectedId} selected={selectedId === 'n6'} />
            <GraphNode id="n7" label="API Server" kind="svc" domainColor="software" onSelect={setSelectedId} selected={selectedId === 'n7'} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Selected state">
        <DemoCard>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <GraphNode id="s1" label="Not selected" domainColor="life" onSelect={setSelectedId} selected={false} />
            <GraphNode id="s2" label="Selected" domainColor="life" kind="C" onSelect={setSelectedId} selected />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Non-interactive (read-only)">
        <DemoCard>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <GraphNode id="r1" label="Read-only" domainColor="climate" />
            <GraphNode id="r2" label="Read-only with kind" domainColor="software" kind="svc" />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="id" type="string" description="Unique node identifier passed back to onSelect" />
          <PropRow name="label" type="string" description="Primary text displayed in the node" />
          <PropRow name="kind" type="string" description="Optional type badge rendered in monospace beside the label" />
          <PropRow name="domainColor" type="string" def="'default'" description="Named domain key used to color the left swatch (e.g. 'life', 'climate', 'software')" />
          <PropRow name="selected" type="boolean" def="false" description="Renders the node in the selected/highlighted state" />
          <PropRow name="onSelect" type="(id: string) => void" description="Called when the node is clicked or activated via keyboard. When provided the node is keyboard-focusable." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function GraphCanvasShowcase() {
  const [selectedId, setSelectedId] = useState<string | undefined>()

  const renderNode = useCallback((node: GraphNodeData, selected: boolean) => (
    <GraphNode
      id={node.id}
      label={node.label}
      kind={node.kind}
      domainColor={node.domainColor}
      selected={selected}
      onSelect={setSelectedId}
    />
  ), [])

  const selectedNode = NODES.find(n => n.id === selectedId)
  const inspectorData: GraphNodeMetadata | undefined = selectedNode
    ? {
        id: selectedNode.id,
        title: selectedNode.title ?? selectedNode.label,
        kind: selectedNode.kind,
        domain: selectedNode.domain,
        description: selectedNode.description,
        metadata: {
          kind: selectedNode.kind ?? '—',
          domain: selectedNode.domain ?? '—',
        },
      }
    : undefined

  const relationships: RelationshipLink[] = EDGES
    .filter(e => selectedId && (e.sourceId === selectedId || e.targetId === selectedId))
    .map(e => {
      const isOutgoing = e.sourceId === selectedId
      const otherId = isOutgoing ? e.targetId : e.sourceId
      const otherNode = NODES.find(n => n.id === otherId)
      return {
        id: e.id,
        predicate: e.label ?? '',
        target: otherId,
        targetTitle: otherNode?.label ?? otherId,
        targetDomain: otherNode?.domain,
        direction: isOutgoing ? 'out' as const : 'in' as const,
      }
    })

  return (
    <div>
      <PageHeader name="GraphCanvas" description="Pan-and-zoom SVG/HTML graph canvas. Renders GraphNode children positioned at (x, y) and GraphEdge children as bezier curves between nodes." />
      <ShowcaseSection label="Interactive canvas" description="Pan by dragging the canvas. Click a node to select it and inspect it in the panel.">
        <DemoCard>
          <div style={{ height: 360, position: 'relative' }}>
            <SplitPane
              first={
                <GraphCanvas
                  nodes={NODES}
                  edges={EDGES}
                  selectedNodeId={selectedId}
                  onNodeSelect={setSelectedId}
                  renderNode={renderNode}
                  style={{ width: '100%', height: '100%' }}
                />
              }
              second={
                <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
                  {inspectorData
                    ? <GraphInspector node={inspectorData} relationships={relationships} />
                    : <p style={{ fontSize: 13, color: fg2 }}>Select a node to inspect it.</p>
                  }
                </div>
              }
              initialSplitPercent={65}
            />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props (GraphCanvas)">
        <PropsTable>
          <PropRow name="nodes" type="GraphNodeData[]" description="Node positions and metadata used to place and render nodes" />
          <PropRow name="edges" type="GraphEdgeData[]" def="[]" description="Edge definitions linking node IDs with optional labels" />
          <PropRow name="selectedNodeId" type="string" description="Currently selected node ID (controlled)" />
          <PropRow name="onNodeSelect" type="(id: string) => void" description="Called when a node is clicked" />
          <PropRow name="renderNode" type="(node: GraphNodeData, selected: boolean) => ReactNode" description="Custom node renderer. Omit to use the default GraphNode." />
          <PropRow name="layout" type="'manual' | 'force'" def="'manual'" description="'manual' uses explicit x/y per node; 'force' runs a spring layout for nodes without coordinates" />
        </PropsTable>
      </ShowcaseSection>
      <ShowcaseSection label="Props (GraphNode)">
        <PropsTable>
          <PropRow name="id" type="string" description="Unique node identifier passed back to onSelect" />
          <PropRow name="label" type="string" description="Primary text displayed in the node" />
          <PropRow name="kind" type="string" description="Optional type badge rendered in monospace beside the label" />
          <PropRow name="domainColor" type="string" def="'default'" description="Named domain key used to color the left swatch (e.g. 'life', 'climate', 'software')" />
          <PropRow name="selected" type="boolean" def="false" description="Renders the node in the selected/highlighted state" />
          <PropRow name="onSelect" type="(id: string) => void" description="Called when the node is clicked or activated via keyboard. When provided the node is keyboard-focusable." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function GraphInspectorShowcase() {
  const node: GraphNodeMetadata = {
    id: 'cls_organism',
    title: 'Organism',
    kind: 'C',
    domain: 'life',
    description: 'Any individual living entity that exhibits all properties of life.',
    metadata: {
      kind: 'Class',
      domain: 'life',
      individuals: 428,
    },
  }

  const relationships: RelationshipLink[] = [
    { id: 'r1', predicate: 'contains', target: 'cls_cell', targetTitle: 'Cell', targetDomain: 'life', direction: 'out' },
    { id: 'r2', predicate: 'instanceOf', target: 'cls_eukaryote', targetTitle: 'Eukaryote', targetDomain: 'life', direction: 'in' },
  ]

  return (
    <div>
      <PageHeader name="GraphInspector" description="Side-panel component for displaying node metadata, properties, and relationships when a graph node is selected." />
      <ShowcaseSection label="Node detail panel">
        <div style={{ maxWidth: 320, border: '1px solid rgb(var(--canvas-border, 229 231 235))', borderRadius: 8, overflow: 'hidden' }}>
          <GraphInspector node={node} relationships={relationships} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Empty state (no node selected)">
        <div style={{ maxWidth: 320, height: 120, border: '1px solid rgb(var(--canvas-border, 229 231 235))', borderRadius: 8, overflow: 'hidden' }}>
          <GraphInspector node={null} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Custom empty state text">
        <div style={{ maxWidth: 320, height: 120, border: '1px solid rgb(var(--canvas-border, 229 231 235))', borderRadius: 8, overflow: 'hidden' }}>
          <GraphInspector node={null} emptyStateText="Click a node on the canvas to inspect it." />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="No relationships">
        <div style={{ maxWidth: 320, border: '1px solid rgb(var(--canvas-border, 229 231 235))', borderRadius: 8, overflow: 'hidden' }}>
          <GraphInspector node={node} relationships={[]} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="node" type="GraphNodeMetadata | null" description="Node to inspect. When null or undefined, the empty state is shown." />
          <PropRow name="relationships" type="RelationshipLink[]" def="[]" description="Edges connected to the selected node, split into incoming and outgoing sections." />
          <PropRow name="onNodeSelect" type="(nodeId: string) => void" description="Called when a relationship target button is clicked, enabling navigation to that node." />
          <PropRow name="emptyStateText" type="string" def="'Select a node to inspect.'" description="Text shown when no node is selected." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function TopologyNodeShowcase() {
  return (
    <div>
      <PageHeader name="TopologyNode" description="Service/infrastructure node card with status indicator, role label, and live metric rows (MetricRow). Used for infrastructure topology maps." />
      <ShowcaseSection label="Status variants">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {TOPOLOGY_NODES.map(n => (
            <TopologyNode
              key={n.title}
              title={n.title}
              nodeRole={n.role}
              status={n.status}
              metrics={n.metrics}
            />
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Idle / no metrics">
        <TopologyNode title="Load Balancer" nodeRole="network" status="idle" metrics={[]} />
      </ShowcaseSection>
      <ShowcaseSection label="Selected state">
        <div style={{ display: 'flex', gap: 16 }}>
          <TopologyNode title="API Server" nodeRole="backend" status="ok" metrics={[{ label: 'CPU', value: '45%', percent: 45, sparklineData: [], color: 'emerald' }]} selected={false} />
          <TopologyNode title="Database" nodeRole="storage" status="warning" metrics={[{ label: 'Connections', value: '342/500', percent: 68, sparklineData: [], color: 'amber' }]} selected />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="title" type="string" description="Service name displayed as the card header" />
          <PropRow name="nodeRole" type="string" description="Role label (backend, storage, cache, etc.)" />
          <PropRow name="status" type="'ok' | 'warning' | 'error' | 'idle'" def="'idle'" description="Overall status — drives the colored indicator dot" />
          <PropRow name="metrics" type="TopologyNodeMetric[]" def="[]" description="Array of metric rows shown inside the card" />
          <PropRow name="selected" type="boolean" def="false" description="Renders the card in a visually selected state with an amber border ring" />
          <PropRow name="x" type="number" description="Absolute left position when used inside a canvas layout" />
          <PropRow name="y" type="number" description="Absolute top position when used inside a canvas layout" />
          <PropRow name="onSelect" type="() => void" description="Called when the node is clicked or activated via keyboard; also makes the node focusable" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
