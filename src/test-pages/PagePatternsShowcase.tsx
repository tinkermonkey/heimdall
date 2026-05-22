import { useState } from 'react'
import {
  PageHeader,
  FilterBar,
  ActivityTimeline,
  AlertStrip,
  QuickAccessGrid,
  QuickAccessTile,
  ConfigTile,
  Button,
  ShellLayout,
} from '../index'
import type { FilterChip, ActivityEvent, Alert } from '../index'

export default function PagePatternsShowcase() {
  const [filters, setFilters] = useState<FilterChip[]>([
    { id: 'active', label: 'Active' },
    { id: 'syncing', label: 'Syncing' },
  ])

  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 'alert-1', severity: 'error', message: 'Database connection lost' },
    { id: 'alert-2', severity: 'warn', message: 'High memory usage detected' },
    { id: 'alert-3', severity: 'info', message: 'New update available' },
    { id: 'alert-4', severity: 'success', message: 'Migration completed successfully' },
  ])

  const activities: ActivityEvent[] = [
    {
      id: 'event-1',
      type: 'create',
      subject: 'Created new entity `cls_organism`',
      timestamp: new Date(Date.now() - 5 * 60000),
      kindLabel: 'create',
    },
    {
      id: 'event-2',
      type: 'update',
      subject: 'Updated schema definition for `life`',
      timestamp: new Date(Date.now() - 2 * 3600000),
      kindLabel: 'update',
    },
    {
      id: 'event-3',
      type: 'run',
      subject: 'Executed migration pipeline',
      timestamp: new Date(Date.now() - 24 * 3600000),
    },
    {
      id: 'event-4',
      type: 'delete',
      subject: 'Deleted temporary index',
      timestamp: new Date(Date.now() - 48 * 3600000),
    },
    {
      id: 'event-5',
      type: 'create',
      subject: 'Event with invalid timestamp',
      timestamp: 'not-a-date',
    },
  ]

  const handleSearchChange = (query: string) => {
    console.log('Search:', query)
  }

  const handleFilterRemove = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId))
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId))
  }

  return (
    <ShellLayout
      appTitle={{ title: 'Heimdall', version: 'v0.1.0' }}
      topbar={{
        breadcrumbs: [{ label: 'Dashboard' }, { label: 'Patterns' }],
      }}
      sidebar={{
        sections: [
          {
            title: 'Workspace',
            items: [
              { id: 'patterns', label: 'Page Patterns', icon: 'component' },
            ],
          },
        ],
        activeItemId: 'patterns',
      }}
    >
      <div style={{ maxWidth: '1200px', padding: '0 26px' }}>
        {/* Alerts */}
        <AlertStrip alerts={alerts} onDismiss={handleDismissAlert} />

        {/* Page Header */}
        <PageHeader
          eyebrow="DATABASE"
          title="Entity Browser"
          idChip="db_main"
          subtitle="Browse and manage your data entities"
          actions={
            <Button variant="primary" size="sm">
              Create Entity
            </Button>
          }
        />

        {/* Filter Bar */}
        <section style={{ marginBottom: '2rem' }}>
          <FilterBar
            filters={filters}
            onSearchChange={handleSearchChange}
            onFilterRemove={handleFilterRemove}
            searchPlaceholder="Search entities..."
          />
        </section>

        {/* Activity Timeline */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Recent Activity
          </h2>
          <ActivityTimeline events={activities} emptyState="No activity yet" />
        </section>

        {/* Activity Timeline - Empty State */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Empty Activity Timeline
          </h2>
          <ActivityTimeline events={[]} emptyState="No activity yet" data-testid="activity-timeline-empty-state" />
        </section>

        {/* QuickAccessGrid */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Quick Access Grid
          </h2>
          <QuickAccessGrid
            tiles={[
              { id: 'create', icon: 'plus', title: 'Create Entity', description: 'Add a new entity' },
              { id: 'read', icon: 'search', title: 'Browse Entities', description: 'Search and view entities' },
              { id: 'update', icon: 'edit', title: 'Update Schema', description: 'Modify schema definitions' },
              { id: 'delete', icon: 'trash', title: 'Delete Entity', description: 'Remove an entity' },
            ]}
            onAction={(id) => console.log(`QuickAccess action: ${id}`)}
          />
        </section>

        {/* QuickAccessTile - Individual Tiles */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Quick Access Tiles (Individual)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <QuickAccessTile icon="data" title="Databases" description="Manage database connections" onClick={() => console.log('Databases clicked')} />
            <QuickAccessTile icon="settings" title="Settings" description="System configuration" onClick={() => console.log('Settings clicked')} />
          </div>
        </section>

        {/* ConfigTile */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'rgb(var(--canvas-fg-1))' }}>
            Configuration Tiles
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} data-testid="config-tiles-container">
            <ConfigTile
              icon="settings"
              title="API Configuration"
              description="Configure API endpoints"
              summary={[
                { label: 'Endpoint', value: 'api.example.com' },
                { label: 'Version', value: 'v2' },
              ]}
              onClick={() => console.log('API Config clicked')}
            />
            <ConfigTile
              icon="data"
              title="Database Config"
              description="Database connection settings"
              summary={[
                { label: 'Host', value: 'db.example.com' },
                { label: 'Port', value: '5432' },
              ]}
              onClick={() => console.log('DB Config clicked')}
            />
          </div>
        </section>
      </div>
    </ShellLayout>
  )
}
