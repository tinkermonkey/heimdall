import { GraphCanvas, type GraphEdge, type GraphNodeData } from '../components/GraphCanvas'

// Regression page for tinkermonkey/heimdall#323: GraphCanvas's hover edgeTooltip used to sit on
// the edge midpoint, covering the edge label it explains, and its 200ms show delay was fixed.
// Fixed node positions + fitView put the straight "top" edge's label close to the canvas top (so
// the card must flip below it), the "bottom" edge's label low in the canvas (room above), and leave one
// edge unlabelled (anchors at its midpoint). tooltipDelay is long so the spec can check the card
// is still hidden partway through it.
const TOOLTIP_PLACEMENT_DELAY_MS = 600 // tests/graph-tooltip-placement.spec.ts expects this value

const NODES: GraphNodeData[] = [
  { id: 'a', label: 'Source', kind: 'C', x: 0, y: 0 },
  { id: 'b', label: 'Target', kind: 'C', x: 420, y: 0 },
  { id: 'c', label: 'Upstream', kind: 'C', x: 0, y: 260 },
  { id: 'd', label: 'Downstream', kind: 'C', x: 420, y: 260 },
]

const EDGES: GraphEdge[] = [
  { id: 'top', sourceId: 'a', targetId: 'b', label: 'depends on', curvature: 0 },
  { id: 'bottom', sourceId: 'c', targetId: 'd', label: 'feeds' },
  { id: 'left', sourceId: 'a', targetId: 'c', label: 'derives' },
  { id: 'unlabelled', sourceId: 'b', targetId: 'd' },
]

const tooltip = (title: string) => (
  <div>
    <strong>{title}</strong>
    <div>Explains the relationship between the two nodes it connects.</div>
  </div>
)

export default function GraphTooltipPlacementTestPage() {
  return (
    <div style={{ padding: 24 }}>
      <GraphCanvas
        data-testid="tooltip-placement-canvas"
        fitView
        nodes={NODES}
        edges={EDGES}
        tooltipDelay={TOOLTIP_PLACEMENT_DELAY_MS}
        edgeTooltip={(edge) => tooltip(edge.label ?? edge.id)}
        nodeTooltip={(node) => tooltip(node.label)}
        onEdgeSelect={() => {}}
        style={{ height: 420 }}
      />
    </div>
  )
}
