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

    return (
      <div ref={ref} className={classNames} {...props}>
        {titlebar && !titlebar.hide && <Titlebar {...titlebar} />}
        <div className="shell-layout__main">
          {sidebar && !sidebar.hide && <Sidebar {...sidebar} />}
          <div className="shell-layout__content">
            {topbar && !topbar.hide && <Topbar {...topbar} />}
            <div className="shell-layout__canvas">{children}</div>
          </div>
        </div>
        {statusbar && !statusbar.hide && <Statusbar {...statusbar} />}
      </div>
    )
  }
)

ShellLayout.displayName = 'ShellLayout'

export default ShellLayout
