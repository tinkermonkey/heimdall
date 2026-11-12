import React, { useState } from 'react'
import { Icon, type IconName } from './Icon'
import { AppTitle, type AppTitleProps } from './AppTitle'
import { isPlainLinkClick } from '../utils/linkClick'
import './Sidebar.css'

export interface SidebarItem {
  id: string
  label: string
  icon?: IconName
  count?: number
  /** Render the item as a link (`<a href>`) instead of a button. A plain click calls
   *  `onSelectItem`, then the browser follows the link (unless the callback calls
   *  `event.preventDefault()`, e.g. to route client-side); a modifier or middle click doesn't call it. Ignored on an item with `children`,
   *  which stays the button that expands and collapses them. */
  href?: string
  children?: Array<{
    id: string
    label: string
    count?: number
    /** Render the child as a link (`<a href>`); a plain click still calls `onSelectItem`. */
    href?: string
  }>
}

export interface SidebarSection {
  title: string
  items: SidebarItem[]
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  sections: SidebarSection[]
  activeItemId?: string
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  /** Called with the item's id and the click. For a link item it runs on plain clicks only (not
   *  cmd/ctrl/shift/alt or middle clicks, or ones already `preventDefault`ed); call
   *  `event.preventDefault()` to stop the browser following the link, e.g. to route client-side. */
  onSelectItem?: (itemId: string, event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
  /** Ids of parent items expanded on first render (uncontrolled). */
  defaultExpandedIds?: string[]
  /** Controlled expansion. When provided, the component reflects this set and
   *  reports changes via onExpandedChange instead of managing its own state. */
  expandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  /** Show the built-in collapse toggle. Ignored when `appTitle` is provided —
   *  in that case the toggle is rendered inside the AppTitle action slot. */
  showCollapseToggle?: boolean
  /** Render an AppTitle as the sidebar header. The collapse toggle is wired
   *  into its `action` slot so the caret sits to the right of the title. */
  appTitle?: AppTitleProps
  /** Optional content rendered at the bottom of the sidebar (e.g. user identity). */
  footer?: React.ReactNode
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      sections,
      activeItemId,
      collapsed = false,
      onCollapse,
      onSelectItem,
      defaultExpandedIds,
      expandedIds,
      onExpandedChange,
      showCollapseToggle = true,
      appTitle,
      footer,
      className = '',
      ...props
    },
    ref
  ) => {
    const isControlled = expandedIds !== undefined
    const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
      () => new Set(defaultExpandedIds)
    )
    const expandedItems = isControlled ? new Set(expandedIds) : internalExpanded

    const toggleExpanded = (id: string) => {
      const next = new Set(expandedItems)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      if (!isControlled) {
        setInternalExpanded(next)
      }
      onExpandedChange?.(Array.from(next))
    }

    const classNames = [
      'sidebar',
      collapsed && 'sidebar--collapsed',
      className
    ]
      .filter(Boolean)
      .join(' ')

    const collapseButton = (
      <button
        type="button"
        className="sidebar__toggle"
        onClick={() => onCollapse?.(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} />
      </button>
    )

    return (
      <div ref={ref} className={classNames} {...props}>
        {appTitle ? (
          <>
            <AppTitle
              {...appTitle}
              collapsed={collapsed}
              action={collapsed ? appTitle.action : (appTitle.action ?? collapseButton)}
            />
            {collapsed && collapseButton}
          </>
        ) : (
          showCollapseToggle && collapseButton
        )}

        <nav className="sidebar__nav" aria-label="Sidebar navigation">
          {sections.map(section => (
            <div key={section.title} className="sidebar__section">
              {!collapsed && <div className="sidebar__section-title">{section.title}</div>}
              <div className="sidebar__items">
                {section.items.map(item => {
                  const hasChildren = item.children && item.children.length > 0
                  const isExpanded = expandedItems.has(item.id)
                  const isActive = activeItemId === item.id

                  const itemContent = (
                    <>
                      {item.icon && (
                        <Icon name={item.icon} size={18} className="sidebar__item-icon" />
                      )}
                      {!collapsed && (
                        <span className="sidebar__item-label">{item.label}</span>
                      )}
                      {!collapsed && item.count !== undefined && (
                        <span className="sidebar__item-count">{item.count}</span>
                      )}
                      {!collapsed && hasChildren && (
                        <Icon
                          name="chevronRight"
                          size={14}
                          className={`sidebar__item-chevron ${isExpanded ? 'sidebar__item-chevron--open' : ''}`}
                        />
                      )}
                    </>
                  )
                  const itemClassName = `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`

                  return (
                    <React.Fragment key={item.id}>
                      {item.href !== undefined && !hasChildren ? (
                        <a
                          href={item.href}
                          className={itemClassName}
                          onClick={(event) => {
                            if (isPlainLinkClick(event)) onSelectItem?.(item.id, event)
                          }}
                          title={collapsed ? item.label : undefined}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {itemContent}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className={itemClassName}
                          onClick={(event) => {
                            if (hasChildren) {
                              toggleExpanded(item.id)
                            } else {
                              onSelectItem?.(item.id, event)
                            }
                          }}
                          title={collapsed ? item.label : undefined}
                          aria-current={isActive ? 'page' : undefined}
                          aria-expanded={hasChildren ? isExpanded : undefined}
                        >
                          {itemContent}
                        </button>
                      )}

                      {!collapsed && hasChildren && isExpanded && item.children!.map(child => {
                        const childActive = activeItemId === child.id
                        const childProps = {
                          className: `sidebar__item sidebar__item--child ${childActive ? 'sidebar__item--active' : ''}`,
                          onClick: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
                            if (child.href === undefined || isPlainLinkClick(event)) onSelectItem?.(child.id, event)
                          },
                          'aria-current': childActive ? ('page' as const) : undefined,
                        }
                        const childContent = (
                          <>
                            <span className="sidebar__item-label">{child.label}</span>
                            {child.count !== undefined && (
                              <span className="sidebar__item-count">{child.count}</span>
                            )}
                          </>
                        )
                        return child.href !== undefined ? (
                          <a key={child.id} href={child.href} {...childProps}>
                            {childContent}
                          </a>
                        ) : (
                          <button key={child.id} type="button" {...childProps}>
                            {childContent}
                          </button>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        {footer && (
          <div className="sidebar__footer">{footer}</div>
        )}
      </div>
    )
  }
)

Sidebar.displayName = 'Sidebar'

export default Sidebar
