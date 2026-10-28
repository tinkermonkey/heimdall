import { useState } from 'react'
import { GraphCanvas, type GraphEdge, type GraphLayoutState, type GraphNodeData } from '../components/GraphCanvas'
import type { GraphToolbarPosition } from '../components/GraphToolbar'

// Regression page for tinkermonkey/heimdall#307: the layout busy state (data-layout-state,
// onLayoutStateChange) and the "Laying out…" indicator. "slow" is layout="orthogonal" with an
// isPageNode that blocks the main thread for SLOW_LAYOUT_MS once per layout run, the
// deterministic stand-in for a multi-second orthogonal layout on a real graph; "fast" is
// layout="force" on the same 20 nodes. Query params: ?initial=slow|fast|galaxy (default slow)
// and ?toolbar=<GraphToolbarPosition>.
const SLOW_LAYOUT_MS = 600

const NODES: GraphNodeData[] = Array.from({ length: 20 }, (_, i) => ({
  id: `n${i}`,
  label: `node_${i}`,
  kind: i === 0 ? 'R' : 'C',
  domainColor: ['life', 'climate', 'software'][i % 3],
}))
// A tree (each node's parent is (i - 1) / 3) plus two cross links.
const EDGES: GraphEdge[] = [
  ...NODES.slice(1).map((n, i) => ({ id: `t${i + 1}`, sourceId: `n${Math.floor(i / 3)}`, targetId: n.id })),
  { id: 'x1', sourceId: 'n5', targetId: 'n9' },
  { id: 'x2', sourceId: 'n12', targetId: 'n2' },
]
const isStructuralEdge = (e: GraphEdge) => e.id.startsWith('t')

// Called by the orthogonal engine for every node of a run, all within a few ms; the first call
// of each run blocks.
let lastSlowCall = -Infinity
const slowIsPageNode = () => {
  const now = performance.now()
  if (now - lastSlowCall > 100) {
    while (performance.now() - now < SLOW_LAYOUT_MS) {
      // Busy-wait: a synchronous layout engine taking SLOW_LAYOUT_MS.
    }
  }
  lastSlowCall = performance.now()
  return true
}

type Mode = 'slow' | 'fast' | 'galaxy'
const params = new URLSearchParams(window.location.search)
const INITIAL: Mode = (params.get('initial') as Mode | null) ?? 'slow'
const TOOLBAR = (params.get('toolbar') as GraphToolbarPosition | null) ?? 'bottom-right'

export default function GraphLayoutBusyTestPage() {
  const [mode, setMode] = useState<Mode>(INITIAL)
  const [log, setLog] = useState<GraphLayoutState[]>([])
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, alignItems: 'center' }}>
        <button type="button" data-testid="mode-slow" onClick={() => setMode('slow')}>Slow layout</button>
        <button type="button" data-testid="mode-fast" onClick={() => setMode('fast')}>Fast layout</button>
        <button type="button" data-testid="mode-galaxy" onClick={() => setMode('galaxy')}>Galaxy</button>
        <button type="button" data-testid="clear-log" onClick={() => setLog([])}>Clear log</button>
        <span data-testid="layout-state-log" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{log.join(' ')}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GraphCanvas
          data-testid="busy-canvas"
          nodes={NODES}
          edges={EDGES}
          layout={mode === 'slow' ? 'orthogonal' : mode === 'fast' ? 'force' : 'galaxy'}
          isStructuralEdge={isStructuralEdge}
          isPageNode={mode === 'slow' ? slowIsPageNode : undefined}
          fitView
          toolbarPosition={TOOLBAR}
          // Inline on purpose: the callback is read through a ref, so re-rendering this page on
          // every report must not loop.
          onLayoutStateChange={(s) => setLog((l) => [...l, s])}
        />
      </div>
    </div>
  )
}
