import React, { useEffect, useState } from 'react'
import { AppTitle, AppTitleProps } from './AppTitle'
import { Titlebar, TitlebarProps } from './Titlebar'
import { Statusbar, StatusbarProps } from './Statusbar'
import { Sidebar, SidebarProps } from './Sidebar'
import { Topbar, TopbarProps } from './Topbar'
import { Drawer } from './Drawer'
import { Icon } from './Icon'
import { useMediaQueryMatch } from '../hooks/useMediaQuery'
import { isModifiedClick } from '../utils/linkClick'
import './ShellLayout.css'

// Link targets that still open in this tab (or its frame tree).
const SAME_TAB_TARGETS = new Set(['_self', '_parent', '_top'])

export interface ShellLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  titlebar?: TitlebarProps & { hide?: boolean }
  appTitle?: AppTitleProps & { hide?: boolean }
  topbar?: TopbarProps & { hide?: boolean }
  sidebar?: SidebarProps & { hide?: boolean }
  statusbar?: StatusbarProps & { hide?: boolean }
  /** Mobile breakpoint in pixels (default: 768, matching Topbar/Statusbar and ADR-2/ADR-4). Set to false to disable mobile sidebar overlay behavior. */
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

    // undefined until the client knows (server render, hydration). The server HTML is the desktop
    // layout with data-mobile off, so ShellLayout.css's @media (max-width: 768px) rules hide the
    // sidebar column on a phone until hydration swaps in the mobile layout.
    const mobileMatch = useMediaQueryMatch(
      mobileBreakpoint !== false ? `(max-width: ${mobileBreakpoint}px)` : '(max-width: 0px)'
    )
    const isMobile = mobileMatch === true

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

    const handleSidebarSelect = (itemId: string, event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      try {
        sidebarProps?.onSelectItem?.(itemId, event)
      } finally {
        setMobileMenuOpen(false)
      }
    }

    // A link in the mobile sidebar (an item with `href`, or one in the footer) navigates this tab,
    // so close the drawer behind it. Not for a modifier or middle click, or a link with a target
    // like _blank: those open elsewhere and the drawer stays. A preventDefault()ed click still
    // closes it, since a client-side router prevents the default to navigate itself.
    const handleSidebarClick = (event: React.MouseEvent<HTMLDivElement>) => {
      sidebarProps?.onClick?.(event)
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      const target = link?.getAttribute('target')
      if (link && !isModifiedClick(event) && (!target || SAME_TAB_TARGETS.has(target))) {
        setMobileMenuOpen(false)
      }
    }

    const sidebarPropsWithMobileOverrides = isMobile
      ? {
          ...sidebarProps,
          collapsed: false,
          showCollapseToggle: false,
          onSelectItem: handleSidebarSelect,
          onClick: handleSidebarClick,
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
          mobileBreakpoint: topbarProps.mobileBreakpoint ?? mobileBreakpoint,
          leadingContent: (
            <>
              {isMobile && mobileMenuToggle}
              {topbarProps?.leadingContent}
            </>
          ),
        }
      : topbarProps

    return (
      <div ref={ref} className={classNames} data-mobile={mobileMatch} {...props}>
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
        {renderStatusbar && (
          <Statusbar
            {...statusbarProps}
            mobileBreakpoint={statusbarProps.mobileBreakpoint ?? mobileBreakpoint}
          />
        )}

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
