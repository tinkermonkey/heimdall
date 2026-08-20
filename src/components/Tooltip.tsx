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
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  offset = 6,
  className = '',
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false)
  const [resolvedPlacement, setResolvedPlacement] = useState<TooltipPlacement>(placement)
  const showTimer = useRef<ReturnType<typeof setTimeout>>()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  useEffect(() => () => clearTimeout(showTimer.current), [])

  useEffect(() => {
    if (disabled) {
      clearTimeout(showTimer.current)
      setVisible(false)
    }
  }, [disabled])

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
    if (disabled) return
    clearTimeout(showTimer.current)
    showTimer.current = setTimeout(() => {
      setResolvedPlacement(placement)
      setVisible(true)
    }, delay)
  }

  const hide = () => {
    clearTimeout(showTimer.current)
    setVisible(false)
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
