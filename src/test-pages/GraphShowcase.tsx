import { useCallback, useState } from 'react'
import { GraphCanvas } from '../components/GraphCanvas'
import GraphNode from '../components/GraphNode'
import GraphInspector, { type GraphNodeMetadata, type RelationshipLink } from '../components/GraphInspector'
import { SplitPane } from '../components/SplitPane'
import TopologyNode from '../components/TopologyNode'
import type { GraphNodeData } from '../components/GraphCanvas'

interface NodeData extends GraphNodeData {
  title?: string
  domain?: string
  description?: string
}

interface EdgeData {
  id: string
  sourceId: string
  targetId: string
  label?: string
}

const GRAPH_NODES: NodeData[] = [
  { id: 'cls_cell',    x: 230,  y: 250, label: 'Cell',          kind: 'C', domainColor: 'life',    title: 'Cell',            domain: 'life',    description: 'Basic unit of life' },
  { id: 'cls_nucleus', x: 90,   y: 110, label: 'Nucleus',       kind: 'C', domainColor: 'life',    title: 'Nucleus',         domain: 'life' },
  { id: 'cls_mito',    x: 380,  y: 95,  label: 'Mitochondrion', kind: 'C', domainColor: 'life',    title: 'Mitochondrion',   domain: 'life' },
  { id: 'cls_protein', x: 560,  y: 320, label: 'Protein',       kind: 'C', domainColor: 'life',    title: 'Protein',         domain: 'life' },
  { id: 'cls_co2',     x: 1100, y: 215, label: 'CO2',           kind: 'C', domainColor: 'climate', title: 'CO2',             domain: 'climate' },
  { id: 'cls_warming', x: 920,  y: 365, label: 'Warming',       kind: 'C', domainColor: 'climate', title: 'Global Warming',  domain: 'climate' },
  { id: 'ind_brca1',   x: 380,  y: 575, label: 'BRCA1',         kind: 'I', domainColor: 'life',    title: 'BRCA1',           domain: 'life' },
  { id: 'ind_tp53',    x: 540,  y: 605, label: 'TP53',          kind: 'I', domainColor: 'life',    title: 'TP53',            domain: 'life' },
  { id: 'ind_co2_atm', x: 1115, y: 600, label: 'CO2 Atm',       kind: 'I', domainColor: 'climate', title: 'CO2 Atmosphere',  domain: 'climate' },
]

const GRAPH_EDGES: EdgeData[] = [
  { id: 'edge_1', sourceId: 'cls_cell',    targetId: 'cls_nucleus', label: 'contains'    },
  { id: 'edge_2', sourceId: 'cls_cell',    targetId: 'cls_mito',    label: 'contains'    },
  { id: 'edge_3', sourceId: 'cls_nucleus', targetId: 'cls_protein', label: 'contains'    },
  { id: 'edge_4', sourceId: 'cls_co2',     targetId: 'cls_warming', label: 'causes'      },
  { id: 'edge_5', sourceId: 'ind_brca1',   targetId: 'cls_protein', label: 'encodes'     },
  { id: 'edge_6', sourceId: 'ind_co2_atm', targetId: 'cls_co2',     label: 'instanceOf'  },
]

const TOPOLOGY_NODES = [
  {
    title: 'API Server',
    role: 'backend',
    status: 'ok' as const,
    metrics: [
      { label: 'CPU',    value: '45%',     percent: 45, sparklineData: [20, 30, 45, 40, 50, 45], color: 'emerald' as const },
      { label: 'Memory', value: '62%',     percent: 62, sparklineData: [55, 58, 60, 62, 61, 62], color: 'amber'   as const },
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
  {
    title: 'Load Balancer',
    role: 'network',
    status: 'idle' as const,
    metrics: [],
  },
]

export default function GraphShowcase() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const [canvasMode, setCanvasMode] = useState<'graph' | 'topology'>('graph')

  const selectedNode = GRAPH_NODES.find(n => n.id === selectedNodeId)
  const inspectorNode: GraphNodeMetadata | undefined = selectedNode
    ? {
        id: selectedNode.id,
        title: selectedNode.title || selectedNode.label,
        kind: selectedNode.kind,
        domain: selectedNode.domain,
        description: selectedNode.description,
      }
    : undefined

  const relationships: RelationshipLink[] = selectedNodeId
    ? GRAPH_EDGES
        .filter(e => e.sourceId === selectedNodeId || e.targetId === selectedNodeId)
        .map(e => {
          const isOutgoing = e.sourceId === selectedNodeId
          const otherId = isOutgoing ? e.targetId : e.sourceId
          const other = GRAPH_NODES.find(n => n.id === otherId)!
          return {
            id: e.id,
            target: otherId,
            targetTitle: other.title || other.label,
            targetDomain: other.domain,
            predicate: e.label || 'related',
            direction: isOutgoing ? 'out' : 'in',
          }
        })
    : []

  const renderGraphNode = useCallback((node: GraphNodeData, selected: boolean) => (
    <GraphNode
      id={node.id}
      label={node.label}
      kind={node.kind}
      domainColor={node.domainColor}
      selected={selected}
      onSelect={setSelectedNodeId}
    />
  ), [])

  const graphCanvas = (
    <GraphCanvas
      nodes={GRAPH_NODES}
      edges={GRAPH_EDGES}
      selectedNodeId={selectedNodeId}
      onNodeSelect={setSelectedNodeId}
      renderNode={renderGraphNode}
      style={{ height: '100%' }}
    />
  )

  const topologyCanvas = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        padding: '20px',
        overflow: 'auto',
        height: '100%',
      }}
    >
      {TOPOLOGY_NODES.map((node, idx) => (
        <TopologyNode
          key={idx}
          title={node.title}
          nodeRole={node.role}
          status={node.status}
          metrics={node.metrics}
          onSelect={() => setSelectedNodeId(node.title)}
        />
      ))}
    </div>
  )

  return (
    <div data-testid="graph-showcase" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ marginBottom: '12px' }}>Graph Canvas Components</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            data-testid="graph-view-button"
            onClick={() => setCanvasMode('graph')}
            style={{
              padding: '8px 16px',
              background: canvasMode === 'graph' ? 'var(--accent-primary, #f59e0b)' : '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: canvasMode === 'graph' ? 600 : 400,
            }}
          >
            Graph View
          </button>
          <button
            data-testid="topology-view-button"
            onClick={() => setCanvasMode('topology')}
            style={{
              padding: '8px 16px',
              background: canvasMode === 'topology' ? 'var(--accent-primary, #f59e0b)' : '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: canvasMode === 'topology' ? 600 : 400,
            }}
          >
            Topology View
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <SplitPane
          data-testid="graph-inspector-split-pane"
          direction="horizontal"
          initialSplitPercent={70}
          minSize={300}
          maxSize={900}
          first={canvasMode === 'graph' ? graphCanvas : topologyCanvas}
          second={
            <GraphInspector
              data-testid="graph-inspector-panel"
              node={inspectorNode}
              relationships={relationships}
              onNodeSelect={setSelectedNodeId}
              emptyStateText={canvasMode === 'graph' ? 'Select a node to inspect.' : 'Select a service to view details.'}
            />
          }
          style={{ height: '100%', flex: 1 }}
        />
      </div>
    </div>
  )
}
