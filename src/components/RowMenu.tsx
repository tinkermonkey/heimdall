import React, { useEffect, useRef, useState } from 'react'
import './RowMenu.css'
import { Icon, type IconName } from './Icon'

export interface RowMenuAction {
  id: string
  label: string
  icon?: IconName
  danger?: boolean
}

export interface RowMenuProps {
  actions: RowMenuAction[]
  onAction: (actionId: string) => void
  trigger?: React.ReactNode
  triggerIcon?: IconName
}

export const RowMenu = React.forwardRef<HTMLDivElement, RowMenuProps>(
  ({ actions, onAction, trigger, triggerIcon = 'moreVertical' }) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
    }, [isOpen])

    const handleActionClick = (actionId: string) => {
      onAction(actionId)
      setIsOpen(false)
    }

    const handleTriggerClick = () => {
      setIsOpen(!isOpen)
    }

    return (
      <div ref={containerRef} className="row-menu" data-testid="row-menu">
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
            {actions.map((action) => (
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
            ))}
          </div>
        )}
      </div>
    )
  }
)

RowMenu.displayName = 'RowMenu'

export default RowMenu
