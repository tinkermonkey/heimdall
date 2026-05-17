import React from 'react'
import { Icon, type IconName } from './Icon'
import './NavItem.css'

interface NavItemProps {
  icon?: IconName
  label: string
  count?: number
  active?: boolean
  onClick?: () => void
  className?: string
}

export const NavItem = React.forwardRef<HTMLDivElement, NavItemProps>(
  ({ icon, label, count, active = false, onClick, className = '', ...props }, ref) => {
    const classNames = ['nav-item', active && 'nav-item--active', className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} onClick={onClick} {...props}>
        {icon && <Icon name={icon} size={16} className="nav-item__icon" />}
        <span className="nav-item__label">{label}</span>
        {count !== undefined && <span className="nav-item__count">{count}</span>}
      </div>
    )
  }
)

NavItem.displayName = 'NavItem'

export default NavItem
