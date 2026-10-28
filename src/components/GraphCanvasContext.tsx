import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

export interface GraphNodeRect {
  x: number
  y: number
  width: number
  height: number
}

/** A viewport in world coordinates — the same space node x/y live in — so it means the same
 *  thing at any container size and can round-trip through a URL. */
export interface GraphViewportSnapshot {
  /** The world point at the middle of the canvas. */
  center: { x: number; y: number }
  zoom: number
  /** The visible world rectangle. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

/** The part of a snapshot needed to restore it: `initialViewport`, `setViewport`. */
export interface GraphViewport {
  center: { x: number; y: number }
  zoom: number
}

/** Why GraphCanvas moved the viewport itself (see GraphCanvasProps.onViewportNavigate).
 *  - `center-on-select`: centerOnSelect panned to the newly selected node.
 *  - `fit`: the canvas framed the graph. `mount` is the first-layout fit (or plain centring when
 *    fitView is off), `toolbar` the toolbar's zoom-to-fit button, `fullscreen` the fit on entering
 *    fullscreen, `resize` the galaxy re-layout and re-frame after an aspect-ratio change.
 *    `layout` is reserved for a re-fit after a layout recompute; GraphCanvas doesn't currently
 *    make one.
 *  - `imperative`: the app moved it through the context (setZoom, setPan, zoomBy, zoomToFit,
 *    setViewport) or the viewportRef handle (setViewport without `silent`). */
export type GraphViewportCause =
  | { kind: 'center-on-select'; nodeId: string }
  | { kind: 'fit'; reason: 'mount' | 'layout' | 'resize' | 'toolbar' | 'fullscreen' }
  | { kind: 'imperative' }

export interface GraphSetViewportOptions {
  /** Ease to the new viewport over 150ms instead of jumping. Ignored (always a jump) under
   *  prefers-reduced-motion. Any user pan/zoom or other viewport move cancels the ease. */
  animate?: boolean
  /** Don't fire onViewportNavigate for this call — for restoring a history entry without
   *  recording a new one. */
  silent?: boolean
}

/** The imperative handle GraphCanvas writes into its `viewportRef` prop. */
export interface GraphViewportHandle {
  /** Centres `viewport.center` at `viewport.zoom` (clamped to minZoom/maxZoom). Called before
   *  the first layout has been framed, it replaces that mount fit, like initialViewport. Works
   *  while pan/zoom is locked, like every other imperative call. Fires onViewportNavigate with
   *  `{ kind: 'imperative' }` once the move lands, unless `silent`. */
  setViewport: (viewport: GraphViewport, options?: GraphSetViewportOptions) => void
  /** The current viewport, or null before the container has been measured. */
  getViewport: () => GraphViewportSnapshot | null
}

export interface GraphCanvasContextValue {
  getNodeRect: (id: string) => GraphNodeRect | null
  /** Every currently-visible node's rect — used by edges to keep their label clear of nodes
   *  (see findClearLabelPosition in utils/graph). Not for hit-testing; use getNodeRect for that. */
  nodeRects: GraphNodeRect[]
  zoom: number
  pan: { x: number; y: number }
  selectedNodeId?: string
  /** Recomputes the current node bounding box and fits it within the container, optionally overriding fitPadding. */
  zoomToFit: (padding?: number) => void
  /** Sets zoom without altering pan — the fixed point of the resulting transform is wherever
   *  world (0, 0) currently projects to, which is usually off-screen after any pan/fitView. For a
   *  zoom step that should visually stay centered in the viewport (e.g. a zoom in/out button),
   *  use `zoomBy` instead. */
  setZoom: (zoom: number) => void
  /** Multiplies the current zoom by `factor`, anchored at the container's own visual center
   *  (falls back to `setZoom(zoom * factor)`'s world-origin anchor only if the container hasn't
   *  been measured yet) — GraphToolbar's zoom in/out buttons use this so the visible content stays
   *  put instead of flinging sideways toward wherever world-origin happens to currently project. */
  zoomBy: (factor: number) => void
  /** Sets pan without altering zoom. */
  setPan: (x: number, y: number) => void
  /** Same as the viewportRef handle's setViewport — see GraphViewportHandle. */
  setViewport: GraphViewportHandle['setViewport']
  /** Same as the viewportRef handle's getViewport — see GraphViewportHandle. */
  getViewport: GraphViewportHandle['getViewport']
  /** Whether wheel-zoom, drag-to-pan, and the keyboard zoom/pan shortcuts are frozen. Doesn't
   *  affect setZoom/setPan/zoomToFit — those are deliberate calls, not the accidental scroll/drag
   *  input locking is meant to guard against. Read/set by GraphToolbar's lock button. */
  locked: boolean
  setLocked: Dispatch<SetStateAction<boolean>>
  /** Whether the canvas's own container element is the page's current Fullscreen API element.
   *  Kept in sync with the platform's own fullscreen state (not just calls through
   *  toggleFullscreen) — Esc, browser chrome, or any other exit path all update this too. */
  isFullscreen: boolean
  /** Requests/exits fullscreen on the canvas container via the Fullscreen API. A no-op (resolves
   *  immediately) in an environment without Fullscreen API support (e.g. iOS Safari) — check
   *  `document.fullscreenEnabled` yourself first if you need to hide the affordance entirely
   *  there instead of having it silently do nothing. */
  toggleFullscreen: () => void
  /** The canvas's own `layout` prop, exposed read-only — GraphToolbar uses this to conditionally
   *  show controls that are only meaningful for one engine (e.g. its live-simulation button,
   *  galaxy-only). Not settable through context; change the `layout` prop on GraphCanvas itself. */
  layout: 'manual' | 'force' | 'organic' | 'orthogonal' | 'galaxy' | 'force-clustered' | 'ux-navigation' | 'radial-tree'
  /** Whether GraphCanvas is running galaxy layout as a continuous, draggable elastic simulation
   *  instead of a one-shot computed-then-frozen layout. Meaningful only when layout="galaxy" — no
   *  effect otherwise. Read/set by GraphToolbar's live-simulation button. */
  liveSimulation: boolean
  setLiveSimulation: Dispatch<SetStateAction<boolean>>
  /** The currently pointer-hovered node's id, or undefined when none is hovered. Mirrors
   *  GraphCanvas's onNodeHover callback prop — read this instead of wiring up the callback
   *  yourself if a consumer already has access to context. */
  hoveredNodeId?: string
  /** The currently pointer-hovered edge's id (via its invisible hit-stroke), or undefined.
   *  Mirrors GraphCanvas's onEdgeHover callback prop. */
  hoveredEdgeId?: string
}

export const GraphCanvasContext = createContext<GraphCanvasContextValue | null>(null)

/**
 * Not exported from the package. The built-in GraphToolbar's own zoom actions, so GraphCanvas can
 * tell a toolbar click apart from an app calling the same thing through useGraphCanvas(): the
 * toolbar's zoom in/out are user moves (onViewportDwell), its zoom-to-fit reports
 * `{ kind: 'fit', reason: 'toolbar' }`, while the context's zoomBy/zoomToFit report
 * `{ kind: 'imperative' }`. GraphToolbar falls back to the public context when this is absent.
 */
export interface GraphToolbarActions {
  zoomBy: (factor: number) => void
  zoomToFit: () => void
}
export const GraphToolbarActionsContext = createContext<GraphToolbarActions | null>(null)

export function useGraphCanvas(): GraphCanvasContextValue {
  const ctx = useContext(GraphCanvasContext)
  if (!ctx) throw new Error('useGraphCanvas must be used within a GraphCanvas')
  return ctx
}
