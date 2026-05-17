import { useState } from 'react'
import {
  Button,
  Chip,
  Icon,
  StatTile,
  ShellLayout,
  NavItem,
  Sidebar,
} from '../index'

export default function ContextStudioRebuilt() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const sidebarSections = [
    {
      title: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const },
        { id: 'schema', label: 'Schema', icon: 'schema' as const, count: 128 },
        { id: 'individuals', label: 'Individuals', icon: 'data' as const, count: 12480 },
        { id: 'pipelines', label: 'Pipelines', icon: 'pipeline' as const, count: 17 },
        { id: 'reference', label: 'Reference', icon: 'reference' as const },
        { id: 'settings', label: 'Settings', icon: 'settings' as const },
      ],
    },
  ]

  return (
    <ShellLayout
      titlebar={{
        left: <span style={{ fontSize: '14px', fontWeight: 500 }}>Context Studio</span>,
        center: <span style={{ fontSize: '14px' }}>Knowledge Graph Management</span>,
      }}
      topbar={{
        breadcrumbs: [
          { label: 'Workspace · default' },
          { label: 'Dashboard' },
        ],
        searchPlaceholder: 'Search entities...',
      }}
      sidebar={{
        collapsed: sidebarCollapsed,
        onCollapse: setSidebarCollapsed,
        sections: sidebarSections,
        activeItemId: 'dashboard',
      }}
      statusbar={{
        left: <span>Context Studio</span>,
        right: <span>UI · Phase 7 · Integration Validation</span>,
      }}
    >
      <div style={{ padding: '22px 26px 32px', maxWidth: '1200px' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Chip variant="cyan">workspace · default</Chip>
            <span style={{ fontSize: '11px', color: 'rgb(var(--canvas-fg-3))' }}>
              last sync 2 min ago
            </span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, color: 'rgb(var(--canvas-fg-1))' }}>
            Dashboard
          </h1>
          <span style={{ fontSize: '14px', color: 'rgb(var(--canvas-fg-2))' }}>
            /workspace/default
          </span>
          <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: 'rgb(var(--canvas-fg-2))' }}>
            Curate knowledge graphs for retrieval-augmented generation and agents.
          </p>
        </div>

        {/* Stat Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
          <StatTile label="Taxonomies" value="3" color="cyan" />
          <StatTile
            label="Classes"
            value="128"
            color="violet"
            delta={{ value: 4, label: 'this week', direction: 'up' }}
          />
          <StatTile
            label="Individuals"
            value="12,480"
            color="emerald"
            delta={{ value: 38, label: 'last run', direction: 'up' }}
          />
          <StatTile
            label="Pipelines"
            value="1/17"
            color="amber"
            delta={{ value: 1, label: 'running', direction: 'up' }}
          />
        </div>

        {/* Main Content Area */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.55fr 1fr',
            gap: '14px',
            marginBottom: '22px',
          }}
        >
          {/* Knowledge Graph Structure Panel */}
          <div
            style={{
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgb(var(--canvas-border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
                <Icon name="schema" size={14} />
                Knowledge Graph Structure
              </div>
              <Button variant="ghost" size="sm">
                Open
              </Button>
            </div>
            <div
              style={{
                padding: '16px',
                color: 'rgb(var(--canvas-fg-2))',
                fontSize: '13px',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  3 taxonomies · 128 classes
                </div>
                <p style={{ margin: '0 0 12px 0' }}>Core structure with 128 domain classes organized across 3 taxonomies</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Chip variant="cyan">organism</Chip>
                <Chip variant="violet">climate</Chip>
                <Chip variant="emerald">software</Chip>
              </div>
            </div>
          </div>

          {/* Recent Activity Panel */}
          <div
            style={{
              border: '1px solid rgb(var(--canvas-border))',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgb(var(--canvas-border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
                <Icon name="history" size={14} />
                Recent activity
              </div>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
            <div style={{ padding: '16px', color: 'rgb(var(--canvas-fg-2))', fontSize: '13px' }}>
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgb(var(--canvas-border))' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', color: 'rgb(var(--canvas-fg-3))' }}>
                  UPDATE
                </div>
                <div>Updated <span style={{ fontWeight: 500 }}>organism class</span> — Added 4 new properties</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: 'rgb(var(--canvas-fg-3))' }}>2m ago · by system</div>
              </div>
              <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgb(var(--canvas-border))' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', color: 'rgb(var(--canvas-fg-3))' }}>
                  SYNC
                </div>
                <div>Synced <span style={{ fontWeight: 500 }}>individuals dataset</span> — 38 new records</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: 'rgb(var(--canvas-fg-3))' }}>12m ago · by pipeline</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', color: 'rgb(var(--canvas-fg-3))' }}>
                  CREATE
                </div>
                <div>Created <span style={{ fontWeight: 500 }}>climate taxonomy</span> — Initialized with 2 classes</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: 'rgb(var(--canvas-fg-3))' }}>1h ago · by user</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Pipelines */}
        <div
          style={{
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgb(var(--canvas-border))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
              <Icon name="pipeline" size={14} />
              Active pipelines
            </div>
            <Button variant="ghost" size="sm">
              All pipelines
            </Button>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { name: 'Ingestion Pipeline', status: 'running', progress: 75 },
              { name: 'Entity Linking', status: 'completed', progress: 100 },
            ].map((pipeline) => (
              <div key={pipeline.name} style={{ border: '1px solid rgb(var(--canvas-border))', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500, fontSize: '13px' }}>{pipeline.name}</span>
                  <Chip variant={pipeline.status === 'running' ? 'cyan' : 'emerald'}>
                    {pipeline.status}
                  </Chip>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'rgb(var(--canvas-border))', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pipeline.progress}%`,
                      backgroundColor: 'rgb(var(--status-cyan))',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Quick access</h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
            Jump to common workflows
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Taxonomies', description: 'Manage top-level domains', icon: 'schema' as const },
              { label: 'Classes', description: 'Define knowledge structure', icon: 'graph' as const },
              { label: 'Properties', description: 'Property definitions', icon: 'tag' as const },
              { label: 'Individuals', description: 'Browse populated instances', icon: 'data' as const },
              { label: 'Pipelines', description: 'Configure & run workflows', icon: 'pipeline' as const },
              { label: 'Reference', description: 'External data sources', icon: 'reference' as const },
            ].map((item) => (
              <button
                key={item.label}
                style={{
                  padding: '12px 14px',
                  border: '1px solid rgb(var(--canvas-border))',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgb(var(--canvas-surface))'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--canvas-border-strong))'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--canvas-border))'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    backgroundColor: 'rgb(var(--canvas-surface))',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={item.icon} size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '2px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-3))' }}>
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ShellLayout>
  )
}
