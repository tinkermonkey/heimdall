import { useState } from 'react'
import { GraphCanvas, type GraphNodeData, type GraphEdgeData } from '../index'

// Deliberately spread far apart (manual layout, exact coordinates) so several are
// guaranteed off-screen in the bounded panel below at the initial centered/1x view —
// exactly the "selected something not currently visible" case centerOnSelect targets.
const NODES: GraphNodeData[] = [
  { id: 'origin', label: 'Origin', kind: 'C', x: 0, y: 0 },
  { id: 'east', label: 'East', kind: 'C', x: 900, y: 0 },
  { id: 'south', label: 'South', kind: 'C', x: 0, y: 700 },
  { id: 'far', label: 'Far Corner', kind: 'C', x: 1200, y: 900 },
]

const EDGES: GraphEdgeData[] = [
  { id: 'e1', sourceId: 'origin', targetId: 'east' },
  { id: 'e2', sourceId: 'origin', targetId: 'south' },
  { id: 'e3', sourceId: 'east', targetId: 'far' },
]

/**
 * Not a component showcase — the target of tests/center-on-select.spec.ts. Proves
 * GraphCanvas's centerOnSelect prop: the buttons below stand in for an EXTERNAL
 * selector (a sidebar, a nav tree) that sets selectedNodeId directly, the same way a
 * caller like documentation_robotics_viewer's own NavTree does — not a click on the
 * canvas itself, which is what this prop exists to handle (a nav-tree selection can
 * pick a node that's currently off-screen; clicking a node ON the canvas never has
 * that problem, since you had to see it to click it).
 */
export default function CenterOnSelectTestPage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{ padding: '12px 16px', borderBottom: '1px solid rgb(var(--canvas-border))', display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgb(var(--canvas-fg-3))', marginRight: 8 }}>
          external selector (stands in for a sidebar/nav tree):
        </span>
        {NODES.map(n => (
          <button
            key={n.id}
            type="button"
            data-testid={`select-${n.id}`}
            onClick={() => setSelectedNodeId(n.id)}
            aria-pressed={selectedNodeId === n.id}
          >
            {n.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GraphCanvas
          nodes={NODES}
          edges={EDGES}
          layout="manual"
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          centerOnSelect
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
