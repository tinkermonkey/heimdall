import { useCallback, useContext, useState } from 'react'
import { GraphCanvas } from '../components/GraphCanvas'
import { GraphCanvasContext } from '../components/GraphCanvasContext'
import GraphNode from '../components/GraphNode'
import GraphInspector, { type GraphNodeMetadata, type RelationshipLink } from '../components/GraphInspector'
import { SplitPane } from '../components/SplitPane'
import TopologyNode from '../components/TopologyNode'
import type { EdgeAnchor } from '../utils/graph'
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
  weight?: number
  opacity?: number
  strokeDash?: number | [number, number]
  sourceAnchor?: EdgeAnchor
  targetAnchor?: EdgeAnchor
  curvature?: number
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
  // Weighted-edge demo edges for visual regression.
  { id: 'edge_weight_low',  sourceId: 'cls_cell',    targetId: 'cls_protein', weight: 10 },
  { id: 'edge_weight_mid',  sourceId: 'cls_nucleus', targetId: 'cls_mito',    weight: 50 },
  { id: 'edge_weight_high', sourceId: 'ind_brca1',   targetId: 'cls_warming', weight: 90 },
  { id: 'edge_opacity',     sourceId: 'ind_tp53',    targetId: 'cls_protein', opacity: 0.3 },
  { id: 'edge_dash',        sourceId: 'ind_co2_atm', targetId: 'cls_warming', strokeDash: [6, 2] },
]

// Spans well beyond the 470x320 bounded panel below, so fitView must zoom out to frame it.
const FIT_VIEW_NODES: GraphNodeData[] = [
  { id: 'fv_a', x: 0,   y: 0,   label: 'Node A' },
  { id: 'fv_b', x: 900, y: 0,   label: 'Node B' },
  { id: 'fv_c', x: 0,   y: 500, label: 'Node C' },
  { id: 'fv_d', x: 900, y: 500, label: 'Node D' },
  // Positioned at the centroid so it stays within the other nodes' bounding box.
  { id: 'fv_controls', x: 450, y: 250, label: '' },
]

const FIT_VIEW_EDGES = [
  { id: 'fv_edge_1', sourceId: 'fv_a', targetId: 'fv_b' },
  { id: 'fv_edge_2', sourceId: 'fv_a', targetId: 'fv_c' },
  { id: 'fv_edge_3', sourceId: 'fv_b', targetId: 'fv_d' },
]

// Bus-style directed flow: gateway -> agent -> dependencies, all edges anchored right-to-left.
const BUS_NODES: GraphNodeData[] = [
  { id: 'bus_gateway', x: 40, y: 170, label: 'Gateway' },
  { id: 'bus_agent_a', x: 320, y: 60, label: 'Agent A' },
  { id: 'bus_agent_b', x: 320, y: 280, label: 'Agent B' },
  { id: 'bus_dep_1', x: 600, y: 20, label: 'Dep 1' },
  { id: 'bus_dep_2', x: 600, y: 110, label: 'Dep 2' },
  { id: 'bus_dep_3', x: 600, y: 230, label: 'Dep 3' },
  { id: 'bus_dep_4', x: 600, y: 320, label: 'Dep 4' },
]

const BUS_EDGES: EdgeData[] = [
  { id: 'bus_edge_gateway_a', sourceId: 'bus_gateway', targetId: 'bus_agent_a', sourceAnchor: 'right', targetAnchor: 'left' },
  // Mixed anchor: only the source side is pinned, the target retains center-facing 'auto' behavior.
  { id: 'bus_edge_gateway_b', sourceId: 'bus_gateway', targetId: 'bus_agent_b', sourceAnchor: 'right' },
  { id: 'bus_edge_a_dep1', sourceId: 'bus_agent_a', targetId: 'bus_dep_1', sourceAnchor: 'right', targetAnchor: 'left' },
  // Two edges between the same node pair, separated visually via distinct curvature values.
  { id: 'bus_edge_a_dep2_low', sourceId: 'bus_agent_a', targetId: 'bus_dep_2', sourceAnchor: 'right', targetAnchor: 'left', curvature: 0.15 },
  { id: 'bus_edge_a_dep2_high', sourceId: 'bus_agent_a', targetId: 'bus_dep_2', sourceAnchor: 'right', targetAnchor: 'left', curvature: 0.6 },
  { id: 'bus_edge_b_dep3', sourceId: 'bus_agent_b', targetId: 'bus_dep_3', sourceAnchor: 'right', targetAnchor: 'left' },
  { id: 'bus_edge_b_dep4', sourceId: 'bus_agent_b', targetId: 'bus_dep_4', sourceAnchor: 'right', targetAnchor: 'left', label: 'depends on' },
]

function FitViewControls() {
  // GraphCanvas also renders node content off-screen (outside the context provider) to
  // measure natural size, so this must tolerate a missing context rather than throw.
  const ctx = useContext(GraphCanvasContext)
  if (!ctx) return null
  const { zoomToFit, setZoom, setPan } = ctx
  return (
    <div style={{ display: 'flex', gap: '6px' }} data-no-drag>
      <button type="button" data-testid="fitview-zoom-to-fit" onClick={() => zoomToFit()}>
        Fit
      </button>
      <button type="button" data-testid="fitview-set-zoom" onClick={() => setZoom(1.5)}>
        Zoom 1.5
      </button>
      <button type="button" data-testid="fitview-set-pan" onClick={() => setPan(0, 0)}>
        Pan 0,0
      </button>
    </div>
  )
}

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
  const [canvasMode, setCanvasMode] = useState<'graph' | 'topology' | 'fitview' | 'bus'>('graph')

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

  const renderFitViewNode = useCallback((node: GraphNodeData, selected: boolean) => {
    if (node.id === 'fv_controls') return <FitViewControls />
    return <GraphNode id={node.id} label={node.label} selected={selected} onSelect={setSelectedNodeId} />
  }, [])

  const graphCanvas = (
    <GraphCanvas
      key="graph-canvas"
      nodes={GRAPH_NODES}
      edges={GRAPH_EDGES}
      selectedNodeId={selectedNodeId}
      onNodeSelect={setSelectedNodeId}
      renderNode={renderGraphNode}
      style={{ height: '100%' }}
    />
  )

  const busCanvas = (
    <GraphCanvas
      key="bus-canvas"
      data-testid="bus-canvas"
      nodes={BUS_NODES}
      edges={BUS_EDGES}
      fitView
      fitPadding={40}
      selectedNodeId={selectedNodeId}
      onNodeSelect={setSelectedNodeId}
      renderNode={renderFitViewNode}
      style={{ height: '100%' }}
    />
  )

  const fitViewCanvas = (
    <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
      <div
        data-testid="fitview-panel"
        style={{ width: '470px', height: '320px', border: '1px solid var(--shell-border, #1e2a44)' }}
      >
        <GraphCanvas
          data-testid="fitview-canvas"
          nodes={FIT_VIEW_NODES}
          edges={FIT_VIEW_EDGES}
          fitView
          fitPadding={20}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          renderNode={renderFitViewNode}
          style={{ height: '100%' }}
        />
      </div>
    </div>
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
            type="button"
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
            type="button"
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
          <button
            type="button"
            data-testid="fitview-view-button"
            onClick={() => setCanvasMode('fitview')}
            style={{
              padding: '8px 16px',
              background: canvasMode === 'fitview' ? 'var(--accent-primary, #f59e0b)' : '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: canvasMode === 'fitview' ? 600 : 400,
            }}
          >
            Fit View Demo
          </button>
          <button
            type="button"
            data-testid="bus-view-button"
            onClick={() => setCanvasMode('bus')}
            style={{
              padding: '8px 16px',
              background: canvasMode === 'bus' ? 'var(--accent-primary, #f59e0b)' : '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: canvasMode === 'bus' ? 600 : 400,
            }}
          >
            Bus View
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
          first={
            canvasMode === 'graph'
              ? graphCanvas
              : canvasMode === 'topology'
                ? topologyCanvas
                : canvasMode === 'bus'
                  ? busCanvas
                  : fitViewCanvas
          }
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
