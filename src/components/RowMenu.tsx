import React, { useEffect, useRef, useState } from 'react'
import './RowMenu.css'
import { Icon, type IconName } from './Icon'

export type RowMenuAction = {
  id: string
  label: string
  icon?: IconName
  danger?: boolean
} | {
  type: 'separator'
}

export interface RowMenuProps {
  actions: RowMenuAction[]
  onAction: (actionId: string) => void
  trigger?: React.ReactNode
  triggerIcon?: IconName
}

const isSeparator = (action: RowMenuAction): action is { type: 'separator' } => {
  return 'type' in action && action.type === 'separator'
}

export const RowMenu = React.forwardRef<HTMLDivElement, RowMenuProps>(
  ({ actions, onAction, trigger, triggerIcon = 'moreVertical' }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
      const container = (typeof ref === 'object' && ref !== null) ? ref.current : containerRef.current
      const handleClickOutside = (e: MouseEvent) => {
        if (container && !container.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
          document.removeEventListener('mousedown', handleClickOutside)
          document.removeEventListener('keydown', handleEscape)
        }
      }
    }, [isOpen, ref])

    const handleActionClick = (actionId: string) => {
      onAction(actionId)
      setIsOpen(false)
    }

    const handleTriggerClick = () => {
      setIsOpen(!isOpen)
    }

    return (
      <div ref={ref || containerRef} className="row-menu" data-testid="row-menu">
        <button
          ref={triggerRef}
          className="row-menu__trigger"
          onClick={handleTriggerClick}
          aria-label="Menu"
          data-testid="row-menu-trigger"
        >
          {trigger || <Icon name={triggerIcon} size={16} />}
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="row-menu__dropdown"
            data-testid="row-menu-dropdown"
          >
            {actions.map((action, index) =>
              isSeparator(action) ? (
                <div
                  key={`separator-${index}`}
                  className="row-menu__separator"
                  data-testid={`row-menu-separator-${index}`}
                />
              ) : (
                <button
                  key={action.id}
                  className={[
                    'row-menu__action',
                    action.danger && 'row-menu__action--danger',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleActionClick(action.id)}
                  data-testid={`row-menu-action-${action.id}`}
                >
                  {action.icon && <Icon name={action.icon} size={16} />}
                  <span className="row-menu__label">{action.label}</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    )
  }
)

RowMenu.displayName = 'RowMenu'

export default RowMenu
