import React, { useCallback } from 'react'
import { useGraphCanvas } from './GraphCanvasContext'
import { Icon } from './Icon'
import './GraphToolbar.css'

/** Any of the 4 corners or the 4 edge-centers of the canvas. */
export type GraphToolbarPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'right-center'
  | 'bottom-right' | 'bottom-center' | 'bottom-left'
  | 'left-center'

export interface GraphToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Default 'bottom-right'. left-center/right-center stack the buttons vertically instead of
   *  in a row, matching the edge they sit against. */
  position?: GraphToolbarPosition
}

// Multiplicative step for the zoom in/out buttons — matches the discrete-step feel users expect
// from explicit buttons (as opposed to wheel-zoom's continuous, gesture-scaled response).
const ZOOM_BUTTON_FACTOR = 1.3

/**
 * Floating zoom in / zoom out / zoom to fit / lock / fullscreen controls for a GraphCanvas. Must
 * be rendered where useGraphCanvas() can reach it — GraphCanvas renders one itself by default
 * (see its showToolbar/toolbarPosition props), so most consumers never need to use this directly;
 * it's exported for anyone building a custom placement or a different control set.
 */
export const GraphToolbar = React.forwardRef<HTMLDivElement, GraphToolbarProps>(
  ({ position = 'bottom-right', className = '', ...props }, ref) => {
    const { zoom, setZoom, zoomToFit, locked, setLocked, isFullscreen, toggleFullscreen } = useGraphCanvas()

    const zoomIn = useCallback(() => setZoom(zoom * ZOOM_BUTTON_FACTOR), [zoom, setZoom])
    const zoomOut = useCallback(() => setZoom(zoom / ZOOM_BUTTON_FACTOR), [zoom, setZoom])
    const fitToView = useCallback(() => zoomToFit(), [zoomToFit])
    const toggleLocked = useCallback(() => setLocked(l => !l), [setLocked])

    const classNames = [
      'graph-toolbar',
      `graph-toolbar--${position}`,
      className,
    ].filter(Boolean).join(' ')

    return (
      <div
        ref={ref}
        className={classNames}
        // Keeps GraphCanvas's own pointerdown handler from treating a click here as the start of
        // a canvas pan — same escape hatch the default GraphNode content relies on.
        data-no-drag
        {...props}
      >
        <button type="button" className="graph-toolbar__btn" onClick={zoomIn} aria-label="Zoom in">
          <Icon name="zoomIn" size={16} />
        </button>
        <button type="button" className="graph-toolbar__btn" onClick={zoomOut} aria-label="Zoom out">
          <Icon name="zoomOut" size={16} />
        </button>
        <button type="button" className="graph-toolbar__btn" onClick={fitToView} aria-label="Zoom to fit">
          <Icon name="maximize" size={16} />
        </button>
        <div className="graph-toolbar__divider" />
        <button
          type="button"
          className="graph-toolbar__btn"
          onClick={toggleLocked}
          aria-pressed={locked}
          aria-label={locked ? 'Unlock pan and zoom' : 'Lock pan and zoom'}
        >
          <Icon name={locked ? 'lock' : 'unlock'} size={16} />
        </button>
        <div className="graph-toolbar__divider" />
        <button
          type="button"
          className="graph-toolbar__btn"
          onClick={toggleFullscreen}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Icon name={isFullscreen ? 'fullscreenExit' : 'fullscreen'} size={16} />
        </button>
      </div>
    )
  }
)

GraphToolbar.displayName = 'GraphToolbar'

export default GraphToolbar
