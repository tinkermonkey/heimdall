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

    const { hide: _titlebarHide, ...titlebarProps } = titlebar ?? {} as TitlebarProps & { hide?: boolean }
    const renderTitlebar = titlebar && !titlebar.hide

    const { hide: _topbarHide, ...topbarProps } = topbar ?? {} as TopbarProps & { hide?: boolean }
    const renderTopbar = topbar && !topbar.hide

    const { hide: _sidebarHide, ...sidebarProps } = sidebar ?? {} as SidebarProps & { hide?: boolean }
    const renderSidebar = sidebar && !sidebar.hide

    const { hide: _statusbarHide, ...statusbarProps } = statusbar ?? {} as StatusbarProps & { hide?: boolean }
    const renderStatusbar = statusbar && !statusbar.hide

    return (
      <div ref={ref} className={classNames} {...props}>
        {renderTitlebar && <Titlebar {...titlebarProps} />}
        <div className="shell-layout__main">
          {renderSidebar && <Sidebar {...sidebarProps} />}
          <div className="shell-layout__content">
            {renderTopbar && <Topbar {...topbarProps} />}
            <div className="shell-layout__canvas">{children}</div>
          </div>
        </div>
        {renderStatusbar && <Statusbar {...statusbarProps} />}
      </div>
    )
  }
)

ShellLayout.displayName = 'ShellLayout'

export default ShellLayout
