import React from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import './QuickAccessGrid.css'

export interface QuickAccessTile {
  id: string
  icon: IconName
  title: string
  description: string
}

export interface QuickAccessGridProps extends React.HTMLAttributes<HTMLDivElement> {
  tiles: QuickAccessTile[]
  onAction?: (tileId: string) => void
  columns?: number
}

export const QuickAccessGrid = React.forwardRef<HTMLDivElement, QuickAccessGridProps>(
  ({ tiles, onAction, columns = 4, className = '', ...props }, ref) => {
    const classNames = ['quick-access-grid', className].filter(Boolean).join(' ')

    return (
      <div
        ref={ref}
        className={classNames}
        style={{ '--qa-columns': columns } as React.CSSProperties}
        data-testid="quick-access-grid"
        {...props}
      >
        {tiles.map(tile => (
          <button
            key={tile.id}
            className="quick-access-tile"
            onClick={() => onAction?.(tile.id)}
            data-testid={`quick-access-tile-${tile.id}`}
          >
            <div className="quick-access-tile__icon">
              <Icon name={tile.icon} size={24} />
            </div>
            <div className="quick-access-tile__title">{tile.title}</div>
            <div className="quick-access-tile__description">{tile.description}</div>
          </button>
        ))}
      </div>
    )
  }
)

QuickAccessGrid.displayName = 'QuickAccessGrid'

export default QuickAccessGrid
