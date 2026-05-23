import React from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import './QuickAccessTile.css'

export interface QuickAccessTileProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: IconName
  title: string
  description: string
  onClick: () => void
}

export const QuickAccessTile = React.forwardRef<HTMLButtonElement, QuickAccessTileProps>(
  ({ icon, title, description, onClick, className = '', ...props }, ref) => {
    const classNames = ['quick-access-tile', className].filter(Boolean).join(' ')

    return (
      <button
        ref={ref}
        className={classNames}
        onClick={onClick}
        data-testid="quick-access-tile"
        {...props}
      >
        <div className="quick-access-tile__icon">
          <Icon name={icon} size={24} />
        </div>
        <div className="quick-access-tile__title">{title}</div>
        <div className="quick-access-tile__description">{description}</div>
      </button>
    )
  }
)

QuickAccessTile.displayName = 'QuickAccessTile'

export default QuickAccessTile
