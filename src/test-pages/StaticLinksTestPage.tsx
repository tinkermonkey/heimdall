import { useEffect, useRef, useState } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Sidebar, type SidebarSection } from '../components/Sidebar'
import { NavItem } from '../components/NavItem'
import { QuickAccessTile } from '../components/QuickAccessTile'
import { QuickAccessGrid } from '../components/QuickAccessGrid'
import { ShellLayout } from '../components/ShellLayout'
import { ActivityTimeline } from '../components/ActivityTimeline'
import { MiniCalendar } from '../components/MiniCalendar'

// Link variants (`href`) next to the button variants they must match, and a server render that is
// hydrated in place, for a static site (Astro, Next) that ships server HTML. tests/static-links.spec.ts.

// A site stylesheet's usual link rules. The `a` variants must not pick up its underline.
const SITE_LINK_CSS = `
a { color: #2563eb; text-decoration: underline; }
a:hover { text-decoration: underline; }
`

const sections = (withHref: boolean): SidebarSection[] => [
  {
    title: 'Notes',
    items: [
      { id: 'home', label: 'Home', icon: 'dashboard', ...(withHref && { href: '#home' }) },
      {
        id: 'topics',
        label: 'Topics',
        icon: 'schema',
        count: 2,
        // A parent with children stays the expand button, even with an href.
        ...(withHref && { href: '#topics' }),
        children: [
          { id: 'topic-graphs', label: 'Graphs', count: 4, ...(withHref && { href: '#topic-graphs' }) },
          { id: 'topic-layout', label: 'Layout', ...(withHref && { href: '#topic-layout' }) },
        ],
      },
      { id: 'about', label: 'About', icon: 'data', count: 3, ...(withHref && { href: '#about' }) },
    ],
  },
]

// Fixed instants, so the server render and the hydrating client print the same text.
const NOW = '2026-11-12T12:00:00Z'
const EVENTS = [
  { id: 'e1', type: 'create' as const, subject: 'cls_organism', timestamp: '2026-11-12T11:55:00Z' },
  { id: 'e2', type: 'update' as const, subject: 'cls_station', timestamp: '2026-11-12T09:00:00Z' },
]

function HydratedShell({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <ShellLayout
      style={{ height: '480px' }}
      appTitle={{ title: 'Notes' }}
      topbar={{ breadcrumbs: [{ label: 'Notes', href: '#home' }, { label: 'Graphs' }], onSearch: () => {} }}
      sidebar={{
        sections: sections(true),
        activeItemId: 'home',
        defaultExpandedIds: ['topics'],
        onSelectItem: onSelect,
        footer: (
          <>
            <a href="#footer-link" data-testid="hydrated-footer-link">
              Footer link
            </a>{' '}
            <a href="#footer-external" target="_blank" data-testid="hydrated-footer-external">
              External
            </a>
          </>
        ),
      }}
      statusbar={{ left: <span>ready</span> }}
    >
      <ActivityTimeline events={EVENTS} now={NOW} data-testid="hydrated-timeline" />
      <MiniCalendar focusedDate="2026-11-12T12:00:00Z" today={NOW} />
    </ShellLayout>
  )
}

declare global {
  interface Window {
    __staticLinks?: { hydrationErrors: string[]; hydrated: boolean; serverHtml: string }
  }
}

function HydrationHarness() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState('')

  useEffect(() => {
    const host = hostRef.current
    // Once per page load: StrictMode runs effects twice in development.
    if (!host || window.__staticLinks) return
    const element = <HydratedShell onSelect={setSelected} />
    // What a static site generator ships: the server render of the same tree.
    const serverHtml = renderToString(element)
    const state = { hydrationErrors: [] as string[], hydrated: false, serverHtml }
    window.__staticLinks = state
    host.innerHTML = serverHtml
    host.dataset.serverMobile = host.querySelector('.shell-layout')?.getAttribute('data-mobile') ?? 'unset'
    hydrateRoot(host, element, {
      onRecoverableError: (error) => {
        state.hydrationErrors.push(error instanceof Error ? error.message : String(error))
      },
    })
    // Two frames: hydration commits, then the media query re-render.
    requestAnimationFrame(() => requestAnimationFrame(() => (state.hydrated = true)))
  }, [])

  return (
    <div>
      <div data-testid="hydrated-selected">{selected}</div>
      <div ref={hostRef} data-testid="hydration-host" />
    </div>
  )
}

export default function StaticLinksTestPage() {
  const [selected, setSelected] = useState('')
  const [tileClicks, setTileClicks] = useState(0)
  const [routed, setRouted] = useState('')

  return (
    <div style={{ padding: '22px 28px', minHeight: '100vh', backgroundColor: 'rgb(var(--canvas-bg))' }}>
      <style>{SITE_LINK_CSS}</style>
      <div data-testid="selected-item">{selected}</div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', backgroundColor: 'rgb(var(--shell-bg))', padding: '12px' }}>
        <Sidebar
          data-testid="sidebar-buttons"
          sections={sections(false)}
          activeItemId="home"
          defaultExpandedIds={['topics']}
          showCollapseToggle={false}
          onSelectItem={setSelected}
        />
        <Sidebar
          data-testid="sidebar-links"
          sections={sections(true)}
          activeItemId="home"
          defaultExpandedIds={['topics']}
          showCollapseToggle={false}
          onSelectItem={setSelected}
        />
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <NavItem data-testid="nav-button" icon="dashboard" label="Dashboard" count={4} active />
          <NavItem data-testid="nav-link" href="#dashboard" icon="dashboard" label="Dashboard" count={4} active />
          <NavItem data-testid="nav-button-idle" icon="data" label="Data" />
          <NavItem data-testid="nav-link-idle" href="#data" icon="data" label="Data" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 280px)', gap: '14px', marginTop: '16px' }}>
        <QuickAccessTile
          data-testid="tile-button"
          icon="schema"
          title="Schema"
          description="Classes and properties"
          onClick={() => setTileClicks((n) => n + 1)}
        />
        <QuickAccessTile
          data-testid="tile-link"
          href="#schema"
          icon="schema"
          title="Schema"
          description="Classes and properties"
          onClick={() => setTileClicks((n) => n + 1)}
        />
      </div>
      <div data-testid="tile-clicks">{tileClicks}</div>

      {/* A client-side router: onAction takes the click and prevents the browser's navigation. */}
      <QuickAccessGrid
        columns={2}
        style={{ width: '574px', marginTop: '16px' }}
        tiles={[{ id: 'routed', icon: 'data', title: 'Routed', description: 'Client-side route', href: '#routed' }]}
        onAction={(id, event) => {
          event.preventDefault()
          setRouted(id)
        }}
      />
      <div data-testid="routed">{routed}</div>

      <div style={{ marginTop: '24px' }}>
        <HydrationHarness />
      </div>
    </div>
  )
}
