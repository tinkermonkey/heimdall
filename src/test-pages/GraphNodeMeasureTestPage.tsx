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

// A custom card whose root has a margin: the measured box must keep the margin, since the card
// still renders offset by it inside its foreignObject.
const CARD_MARGIN = 6 // tests/graph-node-measure.spec.ts expects this value

const renderMarginCard = (node: GraphNodeData) => (
  <div
    className="measure-margin-card"
    style={{
      margin: CARD_MARGIN,
      padding: '2px 8px',
      border: '1px solid rgb(var(--canvas-border-strong))',
      borderRadius: 4,
      background: 'rgb(var(--canvas-card))',
      fontSize: 12,
      whiteSpace: 'nowrap',
    }}
  >
    {node.label}
  </div>
)

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
      <GraphCanvas
        data-testid="node-measure-margin-canvas"
        layout="organic"
        fitView
        nodes={NODES}
        edges={EDGES}
        renderNode={renderMarginCard}
        style={{ height: 360, marginTop: 16 }}
      />
    </div>
  )
}
