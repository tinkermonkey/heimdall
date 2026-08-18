import { useRef } from 'react'
import { GraphCanvas, type GraphNodeData, type GraphEdgeData } from '../index'

const NODES: GraphNodeData[] = [
  { id: 'a', label: 'Alpha', kind: 'C', domainColor: 'life' },
  { id: 'b', label: 'Beta', kind: 'C', domainColor: 'life' },
  { id: 'c', label: 'Gamma', kind: 'C', domainColor: 'climate' },
]

const EDGES: GraphEdgeData[] = [
  { id: 'e1', sourceId: 'a', targetId: 'b', label: 'relates' },
  { id: 'e2', sourceId: 'b', targetId: 'c', label: 'relates' },
]

/**
 * Not a component showcase — the target of tests/fullscreen-container-ref.spec.ts. Proves
 * GraphCanvas's fullscreenContainerRef prop: a "control strip" and a "detail drawer" here are
 * both plain sibling elements of GraphCanvas, OUTSIDE its own root, so without this prop they'd
 * be excluded from the Fullscreen API's target element (and disappear the moment the toolbar's
 * Fullscreen button is used) exactly like documentation_robotics_viewer's GraphControls/
 * DetailDrawer-based Inspector were before this feature existed. Passing the wrapper's own ref
 * as fullscreenContainerRef makes the browser fullscreen the wrapper instead of GraphCanvas's
 * root, so both siblings stay in the DOM subtree that's actually fullscreened.
 */
export default function FullscreenContainerRefTestPage() {
  const wrapperRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={wrapperRef}
      data-testid="fullscreen-wrapper"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'rgb(var(--canvas-bg))' }}
    >
      <div
        data-testid="control-strip"
        style={{ padding: '8px 12px', borderBottom: '1px solid rgb(var(--canvas-border))', fontFamily: 'var(--font-mono)', fontSize: 12 }}
      >
        control strip (sibling of GraphCanvas — must stay visible while fullscreen)
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <GraphCanvas
          nodes={NODES}
          edges={EDGES}
          fullscreenContainerRef={wrapperRef}
          style={{ width: '100%', height: '100%' }}
        />
        <div
          data-testid="detail-drawer"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 120, background: 'rgb(var(--canvas-card) / 0.5)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: 8 }}
        >
          detail drawer
        </div>
      </div>
    </div>
  )
}
