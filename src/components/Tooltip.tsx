import React, { useEffect, useLayoutEffect, useRef, useState, useId } from 'react'
import './Tooltip.css'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  placement?: TooltipPlacement
  delay?: number
  offset?: number
  className?: string
  disabled?: boolean
  /**
   * Drives visibility externally instead of the component's own pointer-enter/leave and
   * focus/blur tracking on `children` — e.g. GraphCanvas's nodeTooltip/edgeTooltip overlay, whose
   * hover state lives on the node/edge itself rather than on whatever wraps this Tooltip. When
   * set, `children`'s pointer/focus events no longer show or hide the tooltip and `delay` has no
   * effect; visibility tracks this prop directly. Omit for the default hover/focus-driven
   * behavior.
   */
  open?: boolean
  /**
   * Optional externally-controlled id for the tooltip card element. When provided, this id is used
   * instead of the auto-generated one, allowing trigger elements elsewhere in the DOM to reference
   * it via `aria-describedby`. Omit to use the default auto-generated id.
   */
  id?: string
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  offset = 6,
  className = '',
  disabled = false,
  open,
  id,
}) => {
  const isControlled = open !== undefined
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false)
  const visible = isControlled ? open : uncontrolledVisible
  const [resolvedPlacement, setResolvedPlacement] = useState<TooltipPlacement>(placement)
  const showTimer = useRef<ReturnType<typeof setTimeout>>()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const autoId = useId()
  const tooltipId = id ?? autoId

  useEffect(() => () => clearTimeout(showTimer.current), [])

  useEffect(() => {
    if (disabled) {
      clearTimeout(showTimer.current)
      if (!isControlled) setUncontrolledVisible(false)
    }
  }, [disabled, isControlled])

  // Resets to the caller-requested placement on hide, so a flip applied while visible (below)
  // doesn't linger unflipped into the next show — uncontrolled mode gets this for free from
  // show()'s own setResolvedPlacement(placement), but controlled mode has no per-show hook to
  // reset from, since visibility just follows `open` directly.
  useEffect(() => {
    if (!visible) setResolvedPlacement(placement)
  }, [visible, placement])

  useLayoutEffect(() => {
    if (!visible) return
    const tooltipEl = tooltipRef.current
    if (!tooltipEl) return

    const rect = tooltipEl.getBoundingClientRect()
    if (placement === 'top' && rect.top < 0) {
      setResolvedPlacement('bottom')
    } else if (placement === 'bottom' && rect.bottom > window.innerHeight) {
      setResolvedPlacement('top')
    } else if (placement === 'left' && rect.left < 0) {
      setResolvedPlacement('right')
    } else if (placement === 'right' && rect.right > window.innerWidth) {
      setResolvedPlacement('left')
    }
  }, [visible, placement])

  const show = () => {
    if (disabled || isControlled) return
    clearTimeout(showTimer.current)
    showTimer.current = setTimeout(() => {
      setResolvedPlacement(placement)
      setUncontrolledVisible(true)
    }, delay)
  }

  const hide = () => {
    if (isControlled) return
    clearTimeout(showTimer.current)
    setUncontrolledVisible(false)
  }

  const showTooltip = visible && !disabled && content != null

  return (
    <span
      className="tooltip-wrapper"
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children, showTooltip ? { 'aria-describedby': tooltipId } : {})}
      {showTooltip && (
        <div
          ref={tooltipRef}
          role="tooltip"
          id={tooltipId}
          className={['tooltip', `tooltip--${resolvedPlacement}`, className].filter(Boolean).join(' ')}
          style={{ '--tooltip-offset': `${offset}px` } as React.CSSProperties}
        >
          {content}
        </div>
      )}
    </span>
  )
}

Tooltip.displayName = 'Tooltip'

export default Tooltip
