import React from 'react'
import { Titlebar, TitlebarProps } from './Titlebar'
import { Statusbar, StatusbarProps } from './Statusbar'
import { Sidebar, SidebarProps } from './Sidebar'
import { Topbar, TopbarProps } from './Topbar'
import './ShellLayout.css'

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

    const renderTitlebar = titlebar && !titlebar.hide
    const renderTopbar = topbar && !topbar.hide
    const renderSidebar = sidebar && !sidebar.hide
    const renderStatusbar = statusbar && !statusbar.hide

    const titlebarProps = titlebar ? { ...titlebar, hide: undefined } : undefined
    const topbarProps = topbar ? { ...topbar, hide: undefined } : undefined
    const sidebarProps = sidebar ? { ...sidebar, hide: undefined } : undefined
    const statusbarProps = statusbar ? { ...statusbar, hide: undefined } : undefined

    return (
      <div ref={ref} className={classNames} {...props}>
        {renderTitlebar && titlebarProps && <Titlebar {...(titlebarProps as TitlebarProps)} />}
        <div className="shell-layout__main">
          {renderSidebar && sidebarProps && <Sidebar {...(sidebarProps as SidebarProps)} />}
          <div className="shell-layout__content">
            {renderTopbar && topbarProps && <Topbar {...(topbarProps as TopbarProps)} />}
            <div className="shell-layout__canvas">{children}</div>
          </div>
        </div>
        {renderStatusbar && statusbarProps && <Statusbar {...(statusbarProps as StatusbarProps)} />}
      </div>
    )
  }
)

ShellLayout.displayName = 'ShellLayout'

export default ShellLayout
