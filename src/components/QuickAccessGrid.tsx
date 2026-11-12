import React from 'react'
import { QuickAccessTile } from './QuickAccessTile'
import type { IconName } from './Icon'
import { isPlainLinkClick } from '../utils/linkClick'
import './QuickAccessGrid.css'

export interface QuickAccessGridItem {
  id: string
  icon: IconName
  title: string
  description: string
  /** Render the tile as a link (`<a href>`). A plain click still calls `onAction`; a modifier
   *  or middle click (new tab) doesn't. */
  href?: string
}

export interface QuickAccessGridProps extends React.HTMLAttributes<HTMLDivElement> {
  tiles: QuickAccessGridItem[]
  /** Called with the tile's id and the click. For a tile with `href`, plain clicks only; call
   *  `event.preventDefault()` to stop the browser following the link, e.g. to route client-side. */
  onAction?: (tileId: string, event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  columns?: number
}

// Backward compatibility export
export type QuickAccessTile = QuickAccessGridItem

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
          <QuickAccessTile
            key={tile.id}
            icon={tile.icon}
            title={tile.title}
            description={tile.description}
            href={tile.href}
            onClick={(event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
              if (tile.href === undefined || isPlainLinkClick(event)) onAction?.(tile.id, event)
            }}
            data-testid={`quick-access-tile-${tile.id}`}
          />
        ))}
      </div>
    )
  }
)

QuickAccessGrid.displayName = 'QuickAccessGrid'

export default QuickAccessGrid
