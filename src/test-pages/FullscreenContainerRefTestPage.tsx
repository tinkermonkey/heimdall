import { useRef, useState } from 'react'
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
 *
 * `?omitRef=1` skips passing fullscreenContainerRef entirely, so the same page also covers the
 * prop's "omitted is identical to previous behavior" guarantee — the toolbar's Fullscreen button
 * should fall back to fullscreening GraphCanvas's own `.graph-canvas` root, exactly as before this
 * prop existed.
 *
 * The "grow control strip" button changes the CONTROL STRIP's own height (via extra padding),
 * which — since it's a flex sibling of the flex:1 graph area — shrinks GraphCanvas's own
 * container in turn, without needing to change the fullscreen WRAPPER's own outer box. That
 * indirection is deliberate: browsers pin a fullscreen element's own box to the screen's size
 * while genuinely fullscreen (confirmed empirically — neither Playwright's page.setViewportSize
 * nor an inline style height change on the wrapper itself has any effect there), so this is the
 * only way to trigger a real, later containerSize change for GraphCanvas from inside real
 * fullscreen, which is what the pending-fit staleness bug this feeds into actually cares about.
 */
export default function FullscreenContainerRefTestPage() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const omitRef = new URLSearchParams(window.location.search).get('omitRef') === '1'
  const [controlStripGrown, setControlStripGrown] = useState(false)

  return (
    <div
      ref={wrapperRef}
      data-testid="fullscreen-wrapper"
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'rgb(var(--canvas-bg))' }}
    >
      <div
        data-testid="control-strip"
        style={{ padding: controlStripGrown ? '60px 12px' : '8px 12px', borderBottom: '1px solid rgb(var(--canvas-border))', fontFamily: 'var(--font-mono)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}
      >
        control strip (sibling of GraphCanvas — must stay visible while fullscreen)
        <button type="button" data-testid="grow-control-strip" onClick={() => setControlStripGrown(v => !v)}>
          {controlStripGrown ? 'shrink control strip' : 'grow control strip'}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <GraphCanvas
          nodes={NODES}
          edges={EDGES}
          fullscreenContainerRef={omitRef ? undefined : wrapperRef}
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
