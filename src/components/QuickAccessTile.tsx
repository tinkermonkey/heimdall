import React from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import './QuickAccessTile.css'

interface QuickAccessTileOwnProps {
  icon: IconName
  title: string
  description?: string
}

/** A tile that is a `<button>` (no `href`). */
export type QuickAccessTileButtonProps = QuickAccessTileOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof QuickAccessTileOwnProps> & { href?: undefined }

/** A tile that is a link: with `href` it renders `<a href>` with the same classes. */
export type QuickAccessTileLinkProps = QuickAccessTileOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof QuickAccessTileOwnProps> & { href: string }

export type QuickAccessTileProps = QuickAccessTileButtonProps | QuickAccessTileLinkProps

export const QuickAccessTile = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, QuickAccessTileProps>(
  ({ icon, title, description, className = '', ...props }, ref) => {
    const classNames = ['quick-access-tile', className].filter(Boolean).join(' ')

    const content = (
      <>
        <div className="quick-access-tile__icon">
          <Icon name={icon} size={16} />
        </div>
        <div className="quick-access-tile__body">
          <div className="quick-access-tile__title">{title}</div>
          {description && <div className="quick-access-tile__description">{description}</div>}
        </div>
        <Icon name="chevronRight" size={13} className="quick-access-tile__chev" />
      </>
    )

    if (props.href !== undefined) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classNames}
          data-testid="quick-access-tile"
          {...(props as Omit<QuickAccessTileLinkProps, keyof QuickAccessTileOwnProps | 'className'>)}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={classNames}
        data-testid="quick-access-tile"
        {...(props as Omit<QuickAccessTileButtonProps, keyof QuickAccessTileOwnProps | 'className'>)}
      >
        {content}
      </button>
    )
  }
)

QuickAccessTile.displayName = 'QuickAccessTile'

export default QuickAccessTile
