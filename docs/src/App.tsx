import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ShellLayout, Icon, NavItem, Sidebar, Button, Chip, Badge, StatTile, Table, Titlebar, Statusbar } from '@heimdall/ui'
import PrimitivesShowcase from './pages/PrimitivesShowcase'
import DataDisplayShowcase from './pages/DataDisplayShowcase'
import ShellFrameworkShowcase from './pages/ShellFrameworkShowcase'
import FoundationShowcase from './pages/FoundationShowcase'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const showcases = [
    { id: 'foundations', label: 'Foundations', icon: 'palette' as const, description: 'Colors, typography, spacing, and tokens' },
    { id: 'primitives', label: 'Primitives', icon: 'component' as const, description: 'Basic components: buttons, inputs, chips' },
    { id: 'data-display', label: 'Data Display', icon: 'table' as const, description: 'Tables, stat tiles, and data visualization' },
    { id: 'shell-framework', label: 'Shell Framework', icon: 'layout' as const, description: 'Layout components: titlebar, sidebar, topbar' },
  ]

  const currentShowcase = 'foundations'

  return (
    <ShellLayout
      titlebar={{
        left: <span style={{ fontSize: '14px', fontWeight: 500 }}>Heimdall</span>,
        center: <span style={{ fontSize: '14px' }}>Design System Documentation</span>,
      }}
      topbar={{
        breadcrumbs: [{ label: 'Components' }, { label: 'Showcase' }],
        searchPlaceholder: 'Search components...',
      }}
      sidebar={{
        collapsed: sidebarCollapsed,
        onCollapse: setSidebarCollapsed,
        sections: [
          {
            title: 'Documentation',
            items: showcases,
          },
        ],
        activeItemId: currentShowcase,
      }}
      statusbar={{
        right: <span>Heimdall Design System · Documentation</span>,
      }}
    >
      <div style={{ padding: '22px 26px 32px', maxWidth: '1400px' }}>
        {/* Component Showcase Grid */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700 }}>Design System Components</h1>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'rgb(var(--canvas-fg-2))' }}>
            A complete showcase of all Heimdall design system components, organized by category.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {showcases.map((showcase) => (
              <button
                key={showcase.id}
                style={{
                  padding: '16px',
                  border: '1px solid rgb(var(--canvas-border))',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--accent-cyan))'
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgb(var(--canvas-surface))'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--canvas-border))'
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Icon name={showcase.icon} size={20} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{showcase.label}</h3>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgb(var(--canvas-fg-2))' }}>
                  {showcase.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Component Showcase */}
        <div
          style={{
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid rgb(var(--canvas-border))', backgroundColor: 'rgb(var(--canvas-surface))' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Component Preview</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
              A preview of key components from each category
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Primitives */}
            <section style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Buttons
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </section>

            {/* Chips */}
            <section style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Chips
              </h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Chip variant="cyan">cyan</Chip>
                <Chip variant="emerald">emerald</Chip>
                <Chip variant="amber">amber</Chip>
                <Chip variant="violet">violet</Chip>
              </div>
            </section>

            {/* Badges */}
            <section style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Badges
              </h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Badge color="cyan" />
                <Badge color="emerald" />
                <Badge color="amber" />
              </div>
            </section>

            {/* Stat Tiles */}
            <section style={{ marginBottom: '32px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Stat Tiles
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <StatTile label="Classes" value="128" color="cyan" delta={{ value: 4, label: 'this week', direction: 'up' }} />
                <StatTile label="Individuals" value="12,480" color="violet" delta={{ value: 312, label: 'today', direction: 'up' }} />
                <StatTile label="Pipelines" value="17" color="amber" />
                <StatTile label="Uptime" value="99.8%" color="emerald" delta={{ value: 0.1, label: '24h', direction: 'down' }} />
              </div>
            </section>
          </div>
        </div>

        {/* Documentation Notes */}
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Documentation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div
              style={{
                padding: '16px',
                border: '1px solid rgb(var(--canvas-border))',
                borderRadius: '6px',
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Design Tokens</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgb(var(--canvas-fg-2))' }}>
                Color scales, typography, spacing, and radius tokens that power all components.
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                border: '1px solid rgb(var(--canvas-border))',
                borderRadius: '6px',
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Component API</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgb(var(--canvas-fg-2))' }}>
                Props, variants, and customization options for each component in the library.
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                border: '1px solid rgb(var(--canvas-border))',
                borderRadius: '6px',
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Usage Patterns</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgb(var(--canvas-fg-2))' }}>
                Best practices, accessibility guidelines, and real-world usage examples.
              </p>
            </div>
            <div
              style={{
                padding: '16px',
                border: '1px solid rgb(var(--canvas-border))',
                borderRadius: '6px',
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Visual Regression</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgb(var(--canvas-fg-2))' }}>
                All components validated with Playwright visual regression tests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  )
}

export default App
