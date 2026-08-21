import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useId,
  useCallback,
} from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import './Popover.css'

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface PopoverProps {
  /** Controlled open state. Omit for uncontrolled (internal state). */
  open?: boolean
  /** Called when open state changes — required for controlled mode. */
  onOpenChange?: (open: boolean) => void
  /** Panel placement relative to trigger. Default: 'bottom'. */
  placement?: PopoverPlacement
  /** Gap between trigger and panel in px. Default: 8. */
  offset?: number
  children: React.ReactNode
}

export interface PopoverTriggerProps {
  children: React.ReactElement
}

export interface PopoverPanelProps {
  /** Accessible label for the dialog. */
  'aria-label'?: string
  /** ID of the element labeling this dialog. */
  'aria-labelledby'?: string
  className?: string
  children: React.ReactNode
}

interface PopoverContextValue {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  panelId: string
  triggerId: string
  placement: PopoverPlacement
  offset: number
  triggerRef: React.RefObject<HTMLElement>
  panelRef: React.RefObject<HTMLDivElement>
}

const PopoverContext = createContext<PopoverContextValue | undefined>(undefined)

function usePopoverContext() {
  const context = useContext(PopoverContext)
  if (!context) {
    throw new Error('Popover subcomponents must be used within Popover')
  }
  return context
}

const PopoverComponent = React.forwardRef<
  HTMLDivElement,
  PopoverProps
>(
  (
    {
      open,
      onOpenChange,
      placement = 'bottom',
      offset = 8,
      children,
    },
    ref
  ) => {
    const isControlled = open !== undefined
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const isOpen = isControlled ? open : uncontrolledOpen
    const [resolvedPlacement, setResolvedPlacement] = useState<PopoverPlacement>(placement)

    const panelId = useId()
    const triggerId = useId()
    const triggerRef = useRef<HTMLElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useFocusTrap(panelRef, isOpen, { mode: 'popup' })

    // Reset placement when closed or placement prop changes
    useEffect(() => {
      if (!isOpen) {
        setResolvedPlacement(placement)
      }
    }, [isOpen, placement])

    // Viewport edge flip logic
    useLayoutEffect(() => {
      if (!isOpen) return
      const panelEl = panelRef.current
      if (!panelEl) return

      const rect = panelEl.getBoundingClientRect()
      if (placement === 'top' && rect.top < 0) {
        setResolvedPlacement('bottom')
      } else if (placement === 'bottom' && rect.bottom > window.innerHeight) {
        setResolvedPlacement('top')
      } else if (placement === 'left' && rect.left < 0) {
        setResolvedPlacement('right')
      } else if (placement === 'right' && rect.right > window.innerWidth) {
        setResolvedPlacement('left')
      }
    }, [isOpen, placement])

    const handleOpenChange = useCallback(
      (newOpen: boolean) => {
        if (isControlled) {
          onOpenChange?.(newOpen)
        } else {
          setUncontrolledOpen(newOpen)
        }
      },
      [isControlled, onOpenChange]
    )

    // Escape key handler
    useEffect(() => {
      if (!isOpen) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          handleOpenChange(false)
          triggerRef.current?.focus()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, handleOpenChange])

    // Outside click handler
    useEffect(() => {
      if (!isOpen) return

      const handleMouseDown = (e: MouseEvent) => {
        const target = e.target as Node
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(target)
        ) {
          handleOpenChange(false)
        }
      }

      document.addEventListener('mousedown', handleMouseDown)
      return () => document.removeEventListener('mousedown', handleMouseDown)
    }, [isOpen, handleOpenChange])

    const contextValue: PopoverContextValue = {
      isOpen,
      onOpenChange: handleOpenChange,
      panelId,
      triggerId,
      placement: resolvedPlacement,
      offset,
      triggerRef,
      panelRef,
    }

    return (
      <PopoverContext.Provider value={contextValue}>
        <div
          ref={(node) => {
            ;(wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
            }
          }}
          className="popover-wrapper"
        >
          {children}
        </div>
      </PopoverContext.Provider>
    )
  }
)

PopoverComponent.displayName = 'Popover'

function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { isOpen, onOpenChange, triggerId, panelId, triggerRef } = usePopoverContext()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenChange(!isOpen)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onOpenChange(!isOpen)
    }
  }

  return React.cloneElement(children, {
    ref: triggerRef,
    id: triggerId,
    onClick: (e: React.MouseEvent) => {
      handleClick(e)
      children.props.onClick?.(e)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      handleKeyDown(e)
      children.props.onKeyDown?.(e)
    },
    'aria-haspopup': 'dialog',
    'aria-expanded': isOpen,
    ...(isOpen && { 'aria-controls': panelId }),
  })
}

function PopoverPanel({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className = '',
  children,
}: PopoverPanelProps) {
  const { isOpen, panelId, placement, offset, panelRef } = usePopoverContext()

  if (!isOpen) {
    return null
  }

  return (
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-modal="false"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={['popover-panel', `popover-panel--${placement}`, className]
        .filter(Boolean)
        .join(' ')}
      style={{ '--popover-offset': `${offset}px` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

export const Popover = Object.assign(PopoverComponent, {
  Trigger: PopoverTrigger,
  Panel: PopoverPanel,
})

export default Popover
