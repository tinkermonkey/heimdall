import React from 'react'
import { Titlebar } from './Titlebar'
import { Statusbar } from './Statusbar'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import './ShellLayout.css'

interface TitlebarProps {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
  className?: string
}

interface StatusbarProps {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
  className?: string
}

interface TopbarProps {
  breadcrumbs?: Array<{
    label: string
    href?: string
    onClick?: () => void
  }>
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  children?: React.ReactNode
  className?: string
}

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

interface ShellLayoutProps {
  titlebar?: TitlebarProps & { hide?: boolean }
  topbar?: TopbarProps & { hide?: boolean }
  sidebar?: SidebarProps & { hide?: boolean }
  statusbar?: StatusbarProps & { hide?: boolean }
  children: React.ReactNode
  className?: string
}

export const ShellLayout = React.forwardRef<HTMLDivElement, ShellLayoutProps>(
  (
    {
      titlebar,
      topbar,
      sidebar,
      statusbar,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = ['shell-layout', className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        {!titlebar?.hide && <Titlebar {...(titlebar || {})} />}
        <div className="shell-layout__main">
          {!sidebar?.hide && <Sidebar {...(sidebar || {})} />}
          <div className="shell-layout__content">
            {!topbar?.hide && <Topbar {...(topbar || {})} />}
            <div className="shell-layout__canvas">{children}</div>
          </div>
        </div>
        {!statusbar?.hide && <Statusbar {...(statusbar || {})} />}
      </div>
    )
  }
)

ShellLayout.displayName = 'ShellLayout'

export default ShellLayout
