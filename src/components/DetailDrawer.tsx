import React, { useCallback, useEffect, useRef, useState } from 'react'
import './DetailDrawer.css'

export interface DetailDrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether there's content to show. Drives auto-expand/auto-hide — the drawer animates its
   *  own width to/from 0 rather than needing a caller to manage a separate layout slot for it. */
  open: boolean
  /** Width while open, in px. Default 360. When resizable, this is only the initial value — the
   *  component tracks width itself from then on; pass onWidthChange to read (and persist) it. */
  width?: number
  /** Called with the new width as the user drags the left-edge resize handle. Omit to disable
   *  resizing — the handle (and its hover highlight) isn't rendered at all without it. */
  onWidthChange?: (width: number) => void
  minWidth?: number
  maxWidth?: number
  children: React.ReactNode
}

const DEFAULT_WIDTH = 360
const DEFAULT_MIN_WIDTH = 260
const DEFAULT_MAX_WIDTH = 640

/**
 * A translucent panel that overlays the right edge of its nearest `position: relative` ancestor
 * — meant for a "detail panel" driven by a selection (a graph node/edge, a list row, ...) that
 * shouldn't cost dedicated layout space when nothing's selected. Unlike Drawer, this isn't modal:
 * no backdrop, no focus trap, no body scroll lock — the content behind it stays fully interactive.
 *
 * Resize handle is invisible until hovered (or focused, or actively dragged) by design — it reads
 * as a plain edge until the user goes looking for it, then highlights in the accent color.
 */
export const DetailDrawer = React.forwardRef<HTMLDivElement, DetailDrawerProps>(
  (
    {
      open,
      width = DEFAULT_WIDTH,
      onWidthChange,
      minWidth = DEFAULT_MIN_WIDTH,
      maxWidth = DEFAULT_MAX_WIDTH,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const [internalWidth, setInternalWidth] = useState(width)
    const [dragging, setDragging] = useState(false)
    const resizable = !!onWidthChange
    const currentWidth = resizable ? internalWidth : width

    const dragStartRef = useRef<{ startX: number; startWidth: number } | null>(null)
    // Exactly the two function references actually passed to addEventListener, captured at attach
    // time — removeEventListener only works with the identical reference it was given, and
    // handleResizeMove/handleResizeUp can get new identities between mousedown and unmount (e.g. a
    // minWidth/maxWidth/onWidthChange prop change mid-drag), so the unmount-cleanup effect below
    // can't just close over whatever the latest render's handleResizeMove/handleResizeUp happen to
    // be — it needs these exact ones or the removal silently no-ops.
    const attachedHandlersRef = useRef<{ move: (e: MouseEvent) => void; up: () => void } | null>(null)

    const handleResizeMove = useCallback((e: MouseEvent) => {
      const drag = dragStartRef.current
      if (!drag) return
      // Dragging the left edge left widens the drawer (it's anchored to the right), so the sign
      // is inverted relative to a typical left-anchored resize handle.
      const next = Math.min(maxWidth, Math.max(minWidth, drag.startWidth - (e.clientX - drag.startX)))
      setInternalWidth(next)
      onWidthChange?.(next)
    }, [minWidth, maxWidth, onWidthChange])

    const handleResizeUp = useCallback(() => {
      dragStartRef.current = null
      setDragging(false)
      const attached = attachedHandlersRef.current
      if (attached) {
        document.removeEventListener('mousemove', attached.move)
        document.removeEventListener('mouseup', attached.up)
        attachedHandlersRef.current = null
      }
    }, [])

    const handleResizeDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      dragStartRef.current = { startX: e.clientX, startWidth: currentWidth }
      setDragging(true)
      attachedHandlersRef.current = { move: handleResizeMove, up: handleResizeUp }
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeUp)
    }, [currentWidth, handleResizeMove, handleResizeUp])

    // Unmounting mid-drag (a route change, the host closing the panel outright, `resizable`
    // flipping off) would otherwise leave both document listeners attached forever, each future
    // mouse move calling setInternalWidth on an unmounted component. Empty deps deliberately —
    // this must run only on mount/unmount, reading whatever's currently in attachedHandlersRef at
    // that moment rather than closing over a specific render's handlers.
    useEffect(() => {
      return () => {
        const attached = attachedHandlersRef.current
        if (attached) {
          document.removeEventListener('mousemove', attached.move)
          document.removeEventListener('mouseup', attached.up)
        }
      }
    }, [])

    const handleResizeKeyDown = useCallback((e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 40 : 10
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const next = Math.min(maxWidth, currentWidth + step)
        setInternalWidth(next)
        onWidthChange?.(next)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const next = Math.max(minWidth, currentWidth - step)
        setInternalWidth(next)
        onWidthChange?.(next)
      }
    }, [currentWidth, minWidth, maxWidth, onWidthChange])

    return (
      <div
        ref={ref}
        className={['detail-drawer', open && 'detail-drawer--open', className].filter(Boolean).join(' ')}
        style={{ width: open ? currentWidth : 0 }}
        aria-hidden={!open}
        {...props}
      >
        {resizable && (
          <div
            className={['detail-drawer__resize-handle', dragging && 'detail-drawer__resize-handle--active'].filter(Boolean).join(' ')}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize detail panel"
            aria-valuenow={Math.round(currentWidth)}
            aria-valuemin={minWidth}
            aria-valuemax={maxWidth}
            tabIndex={open ? 0 : -1}
            onMouseDown={handleResizeDown}
            onKeyDown={handleResizeKeyDown}
          />
        )}
        {/* Fixed to the open width (not animated, unlike the outer element) so content doesn't
            reflow mid-transition — it's revealed/clipped by the outer element's width instead. */}
        <div className="detail-drawer__content" style={{ width: currentWidth }}>
          {children}
        </div>
      </div>
    )
  }
)

DetailDrawer.displayName = 'DetailDrawer'

export default DetailDrawer
