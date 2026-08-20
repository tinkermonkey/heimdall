import React, { useEffect, useState } from 'react'
import { AppTitle, AppTitleProps } from './AppTitle'
import { Titlebar, TitlebarProps } from './Titlebar'
import { Statusbar, StatusbarProps } from './Statusbar'
import { Sidebar, SidebarProps } from './Sidebar'
import { Topbar, TopbarProps } from './Topbar'
import { Drawer } from './Drawer'
import { Icon } from './Icon'
import { useMediaQuery } from '../hooks/useMediaQuery'
import './ShellLayout.css'

export interface ShellLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  titlebar?: TitlebarProps & { hide?: boolean }
  appTitle?: AppTitleProps & { hide?: boolean }
  topbar?: TopbarProps & { hide?: boolean }
  sidebar?: SidebarProps & { hide?: boolean }
  statusbar?: StatusbarProps & { hide?: boolean }
  /** Mobile breakpoint in pixels (default: 768, matching Topbar/Statusbar). Set to false to disable mobile sidebar overlay behavior. */
  mobileBreakpoint?: number | false
}

export const ShellLayout = React.forwardRef<HTMLDivElement, ShellLayoutProps>(
  (
    {
      titlebar,
      appTitle,
      topbar,
      sidebar,
      statusbar,
      children,
      className = '',
      mobileBreakpoint = 768,
      ...props
    },
    ref
  ) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const isMobile = useMediaQuery(
      mobileBreakpoint !== false ? `(max-width: ${mobileBreakpoint}px)` : '(max-width: 0px)'
    )

    useEffect(() => {
      if (!isMobile) {
        setMobileMenuOpen(false)
      }
    }, [isMobile])

    const classNames = ['shell-layout', className].filter(Boolean).join(' ')

    const { hide: _titlebarHide, ...titlebarProps } = titlebar ?? {} as TitlebarProps & { hide?: boolean }
    const renderTitlebar = titlebar && !titlebar.hide

    const { hide: _appTitleHide, ...appTitleProps } = appTitle ?? {} as AppTitleProps & { hide?: boolean }
    const renderAppTitle = appTitle && !appTitle.hide

    const { hide: _topbarHide, ...topbarProps } = topbar ?? {} as TopbarProps & { hide?: boolean }
    const renderTopbar = topbar && !topbar.hide

    const { hide: _sidebarHide, ...sidebarProps } = sidebar ?? {} as SidebarProps & { hide?: boolean }
    const renderSidebar = sidebar && !sidebar.hide

    const { hide: _statusbarHide, ...statusbarProps } = statusbar ?? {} as StatusbarProps & { hide?: boolean }
    const renderStatusbar = statusbar && !statusbar.hide

    const handleSidebarSelect = (itemId: string) => {
      try {
        sidebarProps?.onSelectItem?.(itemId)
      } finally {
        setMobileMenuOpen(false)
      }
    }

    const sidebarPropsWithMobileOverrides = isMobile
      ? {
          ...sidebarProps,
          collapsed: false,
          showCollapseToggle: false,
          onSelectItem: handleSidebarSelect,
        }
      : sidebarProps

    const mobileMenuToggle = isMobile && renderSidebar && (
      <button
        type="button"
        className="shell-layout__mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open sidebar menu"
      >
        <Icon name="menu" size={20} />
      </button>
    )

    const topbarPropsWithMobileMenu = renderTopbar
      ? {
          ...topbarProps,
          mobileBreakpoint: mobileBreakpoint,
          leadingContent: (
            <>
              {isMobile && mobileMenuToggle}
              {topbarProps?.leadingContent}
            </>
          ),
        }
      : topbarProps

    return (
      <div ref={ref} className={classNames} data-mobile={isMobile} {...props}>
        {renderTitlebar && <Titlebar {...titlebarProps} />}
        <div className="shell-layout__main">
          {renderSidebar ? (
            !isMobile && (
              <div className="shell-layout__sidebar-col">
                <Sidebar
                  {...sidebarPropsWithMobileOverrides}
                  appTitle={renderAppTitle ? appTitleProps : sidebarPropsWithMobileOverrides.appTitle}
                />
              </div>
            )
          ) : renderAppTitle ? (
            <AppTitle {...appTitleProps} />
          ) : null}
          <div className="shell-layout__content">
            {renderTopbar && <Topbar {...topbarPropsWithMobileMenu} />}
            {!renderTopbar && isMobile && mobileMenuToggle && (
              <div className="shell-layout__mobile-header">
                {mobileMenuToggle}
              </div>
            )}
            <main className="shell-layout__canvas">{children}</main>
          </div>
        </div>
        {renderStatusbar && <Statusbar {...statusbarProps} mobileBreakpoint={mobileBreakpoint} />}

        {isMobile && renderSidebar && (
          <Drawer
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            position="left"
            width="280px"
            keepMounted={true}
          >
            <Sidebar
              {...sidebarPropsWithMobileOverrides}
              appTitle={renderAppTitle ? appTitleProps : sidebarPropsWithMobileOverrides.appTitle}
            />
          </Drawer>
        )}
      </div>
    )
  }
)

ShellLayout.displayName = 'ShellLayout'

export default ShellLayout
