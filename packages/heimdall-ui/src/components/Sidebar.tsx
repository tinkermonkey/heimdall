import React from 'react'
import { Icon } from './Icon'
import './Sidebar.css'

interface SidebarSection {
  title: string
  items: Array<{
    id: string
    label: string
    icon?: string
    count?: number
  }>
}

interface SidebarProps {
  sections: SidebarSection[]
  activeItemId?: string
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  onSelectItem?: (itemId: string) => void
  className?: string
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      sections,
      activeItemId,
      collapsed = false,
      onCollapse,
      onSelectItem,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      'sidebar',
      collapsed && 'sidebar--collapsed',
      className
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        <button
          className="sidebar__toggle"
          onClick={() => onCollapse?.(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name="menu" size={20} />
        </button>

        <nav className="sidebar__nav">
          {sections.map(section => (
            <div key={section.title} className="sidebar__section">
              {!collapsed && <div className="sidebar__section-title">{section.title}</div>}
              <div className="sidebar__items">
                {section.items.map(item => (
                  <button
                    key={item.id}
                    className={`sidebar__item ${activeItemId === item.id ? 'sidebar__item--active' : ''}`}
                    onClick={() => onSelectItem?.(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon && <Icon name={item.icon as any} size={18} className="sidebar__item-icon" />}
                    {!collapsed && <span className="sidebar__item-label">{item.label}</span>}
                    {item.count !== undefined && (
                      <span className={`sidebar__item-count ${activeItemId === item.id ? 'sidebar__item-count--active' : ''}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    )
  }
)

Sidebar.displayName = 'Sidebar'

export default Sidebar
