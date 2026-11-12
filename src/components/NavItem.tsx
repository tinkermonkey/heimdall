import React from 'react'
import { Icon, type IconName } from './Icon'
import './NavItem.css'

interface NavItemOwnProps {
  icon?: IconName
  label: string
  count?: number
  active?: boolean
  depth?: 0 | 1
}

/** A nav item that is a `<button>` (no `href`). */
export type NavItemButtonProps = NavItemOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof NavItemOwnProps> & { href?: undefined }

/** A nav item that is a link: with `href` it renders `<a href>` with the same classes. */
export type NavItemLinkProps = NavItemOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NavItemOwnProps> & { href: string }

export type NavItemProps = NavItemButtonProps | NavItemLinkProps

export const NavItem = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, NavItemProps>(
  ({ icon, label, count, active = false, depth = 0, className = '', ...props }, ref) => {
    const classNames = [
      'nav-item',
      active && 'nav-item--active',
      depth === 1 && 'nav-item--depth-1',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const content = (
      <>
        {depth === 0 && icon && <Icon name={icon} size={16} className="nav-item__icon" />}
        <span className="nav-item__label">{label}</span>
        {count !== undefined && <span className="nav-item__count">{count}</span>}
      </>
    )

    if (props.href !== undefined) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classNames}
          aria-current={active ? 'page' : undefined}
          {...(props as Omit<NavItemLinkProps, keyof NavItemOwnProps | 'className'>)}
        >
          {content}
        </a>
      )
    }

    const { type = 'button', ...buttonProps } = props as Omit<NavItemButtonProps, keyof NavItemOwnProps | 'className'>
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type} // eslint-disable-line react/button-has-type
        className={classNames}
        aria-current={active ? 'page' : undefined}
        {...buttonProps}
      >
        {content}
      </button>
    )
  }
)

NavItem.displayName = 'NavItem'

export default NavItem
