import { GraphCanvas, type GraphEdge, type GraphNodeData } from '../components/GraphCanvas'

// Regression page for tinkermonkey/heimdall#331: node measurement must match the rendered node.
// The host container sets the font-size/line-height a Tailwind-preflight page has, which used to
// inflate each measured node's height by the line-height strut. The short labels have fractional
// widths, which offsetWidth rounded down, so the label ellipsized inside its foreignObject.
const NODES: GraphNodeData[] = [
  { id: 'a', label: 'Value', kind: 'C' },
  { id: 'b', label: 'Driver', kind: 'C' },
  { id: 'c', label: 'Principle', kind: 'C' },
  { id: 'd', label: 'Outcome', kind: 'C' },
  { id: 'e', label: 'Assessment', kind: 'C' },
  { id: 'f', label: 'Goal', kind: 'C' },
]

const EDGES: GraphEdge[] = [
  { id: 'e1', sourceId: 'a', targetId: 'b' },
  { id: 'e2', sourceId: 'c', targetId: 'a' },
  { id: 'e3', sourceId: 'd', targetId: 'a' },
  { id: 'e4', sourceId: 'e', targetId: 'b' },
  { id: 'e5', sourceId: 'f', targetId: 'c' },
  { id: 'e6', sourceId: 'd', targetId: 'f' },
]

export default function GraphNodeMeasureTestPage() {
  return (
    <div style={{ padding: 24, fontSize: 16, lineHeight: 1.5 }}>
      <GraphCanvas
        data-testid="node-measure-canvas"
        layout="organic"
        fitView
        nodes={NODES}
        edges={EDGES}
        style={{ height: 480 }}
      />
    </div>
  )
}
