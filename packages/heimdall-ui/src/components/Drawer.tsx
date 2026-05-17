import React, { useEffect } from 'react'
import './Drawer.css'
import { Icon } from './Icon'

export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  position?: 'left' | 'right'
  width?: string
  children: React.ReactNode
}

export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  ({ isOpen, onClose, title, position = 'right', width = '320px', children, className = '', ...props }, ref) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose()
        }
      }

      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
        return () => {
          document.removeEventListener('keydown', handleEscape)
          document.body.style.overflow = 'unset'
        }
      }
    }, [isOpen, onClose])

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }

    if (!isOpen) return null

    return (
      <div
        className="drawer-backdrop"
        onClick={handleBackdropClick}
      >
        <div
          ref={ref}
          className={['drawer', `drawer--${position}`, className].filter(Boolean).join(' ')}
          style={{ width }}
          role="dialog"
          aria-modal="true"
          {...props}
        >
          {title && (
            <div className="drawer__header">
              <h2 className="drawer__title">{title}</h2>
              <button
                className="drawer__close"
                onClick={onClose}
                aria-label="Close drawer"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          )}
          <div className="drawer__body">{children}</div>
        </div>
      </div>
    )
  }
)

Drawer.displayName = 'Drawer'

export default Drawer
