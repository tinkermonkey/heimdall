import React from 'react'
import { Icon, type IconName } from './Icon'
import './NavItem.css'

export interface NavItemProps {
  icon?: IconName
  label: string
  count?: number
  active?: boolean
  onClick?: () => void
  className?: string
}

export const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  ({ icon, label, count, active = false, onClick, className = '', ...props }, ref) => {
    const classNames = ['nav-item', active && 'nav-item--active', className]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classNames}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        {...props}
      >
        {icon && <Icon name={icon} size={16} className="nav-item__icon" />}
        <span className="nav-item__label">{label}</span>
        {count !== undefined && <span className="nav-item__count">{count}</span>}
      </button>
    )
  }
)

NavItem.displayName = 'NavItem'

export default NavItem
