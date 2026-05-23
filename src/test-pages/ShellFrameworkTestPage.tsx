import { useState } from 'react'
import { Topbar } from '../components/Topbar'
import { TabBar } from '../components/TabBar'
import { ShellLayout } from '../components/ShellLayout'

export default function ShellFrameworkTestPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const breadcrumbs = [
    { label: 'Dashboard' },
    { label: 'Systems' },
    { label: 'Compute Cluster' },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', count: undefined },
    { id: 'metrics', label: 'Metrics', count: 24 },
    { id: 'logs', label: 'Logs', count: 156 },
    { id: 'alerts', label: 'Alerts', count: 3 },
  ]

  return (
    <ShellLayout
      appTitle={{ title: 'System Monitor' }}
      sidebar={{
        sections: [
          {
            title: 'Navigation',
            items: [
              { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
              { id: 'systems', label: 'Systems', icon: 'data' },
              { id: 'monitoring', label: 'Monitoring', icon: 'clock' },
              { id: 'logs', label: 'Logs', icon: 'info' },
              { id: 'settings', label: 'Settings', icon: 'settings' },
            ],
          },
        ],
        collapsed: !sidebarOpen,
        onCollapse: setSidebarOpen,
      }}
      statusbar={{
        left: (
          <>
            <div className="statusbar__item statusbar__item--pulse">
              <div className="statusbar__pulse statusbar__pulse--emerald" />
              <span className="statusbar__label">graph daemon</span>
              <span className="statusbar__label--mono">:7474</span>
            </div>
            <div className="statusbar__divider" />
            <div className="statusbar__item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--shell-fg-3))" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12 9 6 21 6"/>
                <path d="M3 12 9 18 21 18"/>
                <circle cx="3" cy="12" r="2"/>
              </svg>
              <span className="statusbar__label--mono">20 cls · 267 ind · 9 rel</span>
            </div>
            <div className="statusbar__divider" />
            <div className="statusbar__item statusbar__item--pulse">
              <div className="statusbar__pulse statusbar__pulse--amber" style={{ width: '6px', height: '6px' }} />
              <span className="statusbar__label--mono">pubmed_genes</span>
              <span className="statusbar__label">·</span>
              <span className="statusbar__label--mono">38%</span>
            </div>
          </>
        ),
        right: (
          <>
            <div className="statusbar__item">
              <span className="statusbar__label">cpu</span>
              <span className="statusbar__label--mono">14%</span>
            </div>
            <div className="statusbar__divider" />
            <div className="statusbar__item">
              <span className="statusbar__label">mem</span>
              <span className="statusbar__label--mono">423 MB</span>
            </div>
            <div className="statusbar__divider" />
            <div className="statusbar__item">
              <span className="statusbar__label">synced 2m ago</span>
            </div>
          </>
        ),
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar
          breadcrumbs={breadcrumbs}
          searchPlaceholder="Search systems..."
          onSearch={(query) => console.log('Search:', query)}
        />

        <div style={{ borderBottom: '1px solid rgb(var(--canvas-border))' }}>
          <TabBar tabs={tabs} activeTabId={activeTab} onSelectTab={setActiveTab} />
        </div>

        <div style={{ flex: 1, padding: '22px 26px', overflowY: 'auto' }}>
          <section style={{ marginBottom: '32px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgb(var(--canvas-fg-3))',
                marginBottom: '14px',
              }}
            >
              Topbar Component · Breadcrumbs & Search
            </div>
            <p style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px' }}>
              The Topbar above displays breadcrumbs and search functionality. It supports:
            </p>
            <ul style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px', paddingLeft: '20px' }}>
              <li>Breadcrumb navigation with optional click handlers</li>
              <li>Search input with callback support</li>
              <li>Custom children for additional actions</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgb(var(--canvas-fg-3))',
                marginBottom: '14px',
              }}
            >
              TabBar Component · Tab Selection
            </div>
            <p style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px' }}>
              The TabBar above shows tab selection with optional counters. Current active tab: <strong>{activeTab}</strong>
            </p>
            <p style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px' }}>
              Features:
            </p>
            <ul style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px', paddingLeft: '20px' }}>
              <li>Tab selection with active state styling</li>
              <li>Optional count badges for each tab</li>
              <li>Callback on tab selection</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgb(var(--canvas-fg-3))',
                marginBottom: '14px',
              }}
            >
              ShellLayout Component
            </div>
            <p style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px' }}>
              The ShellLayout wraps the entire interface and provides:
            </p>
            <ul style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px', paddingLeft: '20px' }}>
              <li>Titlebar with title and subtitle</li>
              <li>Collapsible sidebar navigation</li>
              <li>Dark shell background with light/dark canvas support</li>
              <li>Responsive layout structure</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgb(var(--canvas-fg-3))',
                marginBottom: '14px',
              }}
            >
              Titlebar Component
            </div>
            <p style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px' }}>
              Displayed at the top with title "{breadcrumbs[0].label}" and additional subtitle information.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgb(var(--canvas-fg-3))',
                marginBottom: '14px',
              }}
            >
              Sidebar Component
            </div>
            <p style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px' }}>
              The sidebar on the left shows navigation items. Currently {sidebarOpen ? 'expanded' : 'collapsed'}.
            </p>
            <p style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px' }}>
              Features:
            </p>
            <ul style={{ color: 'rgb(var(--canvas-fg-2))', fontSize: '14px', paddingLeft: '20px' }}>
              <li>Expandable/collapsible navigation</li>
              <li>Icon-only mode when collapsed</li>
              <li>Active item highlighting</li>
              <li>Optional navigation icons</li>
            </ul>
          </section>
        </div>
      </div>
    </ShellLayout>
  )
}
