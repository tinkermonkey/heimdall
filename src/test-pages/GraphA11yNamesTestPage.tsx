import { useState } from 'react'
import { GraphCanvas, type GraphEdge, type GraphNodeData } from '../components/GraphCanvas'

// Regression page for tinkermonkey/heimdall#304: node ids are UUIDs, as in real consumers, and
// labels are readable. Accessible names for edges and popover dialogs must use the labels.
const A11Y_NODE_IDS = {
  alert: '758a1c95-870f-4667-b49d-6d6a1724fcd0',
  gauge: '430cdd17-5a41-45c0-b393-fac66e6e250b',
  socket: '9f2d6c1e-3b7a-4e58-a1c4-0d8e5f7b2a91',
}

const NODES: GraphNodeData[] = [
  { id: A11Y_NODE_IDS.alert, label: 'WebSocket Disconnect Alert', x: 120, y: 120 },
  { id: A11Y_NODE_IDS.gauge, label: 'Connection State Gauge', x: 480, y: 120 },
  { id: A11Y_NODE_IDS.socket, label: 'Socket Client', x: 300, y: 320 },
]

const EDGES: GraphEdge[] = [
  { id: 'b1e4f0a2-6c3d-4f9e-8a7b-2d5c1e0f9a83', sourceId: A11Y_NODE_IDS.alert, targetId: A11Y_NODE_IDS.gauge, label: 'monitors' },
  { id: 'c7a9d3e5-1f2b-4c6a-9e8d-3b4a5f6c7d02', sourceId: A11Y_NODE_IDS.socket, targetId: A11Y_NODE_IDS.gauge },
]

export default function GraphA11yNamesTestPage() {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>()
  return (
    <div style={{ padding: 24 }}>
      <GraphCanvas
        data-testid="a11y-names-canvas"
        nodes={NODES}
        edges={EDGES}
        selectedEdgeId={selectedEdgeId}
        onEdgeSelect={setSelectedEdgeId}
        nodePopover={(node) => <div data-testid="node-popover-content">{node.kind ?? 'Node'}</div>}
        edgePopover={(edge) => <div data-testid="edge-popover-content">{edge.label ?? 'Edge'}</div>}
        style={{ height: 480 }}
      />
    </div>
  )
}
