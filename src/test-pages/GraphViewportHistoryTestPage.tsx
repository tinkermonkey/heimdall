import { useEffect, useMemo, useRef, useState } from 'react'
import {
  GraphCanvas,
  type GraphNodeData,
  type GraphEdgeData,
  type GraphViewportCause,
  type GraphViewportHandle,
  type GraphViewportSnapshot,
} from '../index'

// Target of tests/graph-viewport-history.spec.ts (tinkermonkey/heimdall#309). Every
// onViewportDwell / onViewportNavigate call is pushed onto window.__viewportEvents with a
// performance.now() timestamp, and the viewportRef handle is exposed as window.__viewportHandle,
// so the spec can drive and read the API directly.
//
// Query params: fitView=1, centerOnSelect=1, dwellMs=<ms>, initialViewport=<cx>,<cy>,<zoom>.

const NODES: GraphNodeData[] = [
  { id: 'origin', label: 'Origin', kind: 'C', x: 0, y: 0 },
  { id: 'east', label: 'East', kind: 'C', x: 900, y: 0 },
  { id: 'south', label: 'South', kind: 'C', x: 0, y: 700 },
  { id: 'far', label: 'Far corner', kind: 'C', x: 1200, y: 900 },
]

const EDGES: GraphEdgeData[] = [
  { id: 'e1', sourceId: 'origin', targetId: 'east' },
  { id: 'e2', sourceId: 'origin', targetId: 'south' },
  { id: 'e3', sourceId: 'east', targetId: 'far' },
]

export type ViewportEvent =
  | { type: 'dwell'; t: number; viewport: GraphViewportSnapshot }
  | { type: 'navigate'; t: number; viewport: GraphViewportSnapshot; cause: GraphViewportCause }

declare global {
  interface Window {
    __viewportEvents?: ViewportEvent[]
    __viewportHandle?: GraphViewportHandle | null
  }
}

export default function GraphViewportHistoryTestPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const [count, setCount] = useState(0)
  const handleRef = useRef<GraphViewportHandle>(null)

  const initialViewport = useMemo(() => {
    const raw = params.get('initialViewport')
    if (!raw) return undefined
    const [x, y, zoom] = raw.split(',').map(Number)
    return { center: { x, y }, zoom }
  }, [params])

  if (!window.__viewportEvents) window.__viewportEvents = []

  useEffect(() => {
    window.__viewportHandle = handleRef.current
    return () => {
      window.__viewportHandle = null
    }
  }, [])

  // Inline arrows on purpose: the canvas reads them through refs, so a new identity on every
  // render (this page re-renders on each event) must not re-fire anything.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
        {NODES.map((n) => (
          <button key={n.id} type="button" data-testid={`select-${n.id}`} onClick={() => setSelectedNodeId(n.id)}>
            {n.label}
          </button>
        ))}
        <span data-testid="event-count" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {count}
        </span>
      </div>
      <div style={{ width: 800, height: 500 }}>
        <GraphCanvas
          data-testid="history-canvas"
          nodes={NODES}
          edges={EDGES}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          centerOnSelect={params.get('centerOnSelect') === '1'}
          fitView={params.get('fitView') === '1'}
          dwellMs={params.has('dwellMs') ? Number(params.get('dwellMs')) : undefined}
          initialViewport={initialViewport}
          viewportRef={handleRef}
          onViewportDwell={(viewport) => {
            window.__viewportEvents!.push({ type: 'dwell', t: performance.now(), viewport })
            setCount((c) => c + 1)
          }}
          onViewportNavigate={(viewport, cause) => {
            window.__viewportEvents!.push({ type: 'navigate', t: performance.now(), viewport, cause })
            setCount((c) => c + 1)
          }}
        />
      </div>
    </div>
  )
}
