import { useState } from 'react'
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

export function GraphCanvasShowcase() {
  const [selectedId, setSelectedId] = useState<string | undefined>()

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
                  style={{ width: '100%', height: '100%' }}
                >
                  {NODES.map(n => (
                    <GraphNode
                      key={n.id}
                      id={n.id}
                      x={n.x}
                      y={n.y}
                      label={n.label}
                      selected={n.id === selectedId}
                      onSelect={setSelectedId}
                    />
                  ))}
                </GraphCanvas>
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
          <PropRow name="nodes" type="GraphNodeData[]" description="Node positions and metadata used to drive edge rendering" />
          <PropRow name="edges" type="GraphEdge[]" description="Edge definitions linking node IDs" />
          <PropRow name="selectedNodeId" type="string" description="Currently selected node ID (controlled)" />
          <PropRow name="onNodeSelect" type="(id: string) => void" description="Called when a node is clicked" />
          <PropRow name="children" type="ReactNode" description="GraphNode and GraphEdge components to render" />
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
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="node" type="GraphNodeMetadata" description="Node to inspect — id, title, kind, domain, description, properties[]" />
          <PropRow name="relationships" type="RelationshipLink[]" description="Edges connected to the selected node with direction labels" />
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
              role={n.role}
              status={n.status}
              metrics={n.metrics}
            />
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Idle / no metrics">
        <TopologyNode title="Load Balancer" role="network" status="idle" metrics={[]} />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="title" type="string" description="Service name displayed as the card header" />
          <PropRow name="role" type="string" description="Role label (backend, storage, cache, etc.)" />
          <PropRow name="status" type="'ok' | 'warning' | 'error' | 'idle'" def="'idle'" description="Overall status — drives the colored indicator dot" />
          <PropRow name="metrics" type="TopologyNodeMetric[]" description="Array of metric rows shown inside the card" />
          <PropRow name="x / y" type="number" description="Absolute position when used inside a canvas layout" />
          <PropRow name="onSelect" type="() => void" description="Called when the node is clicked" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
