import { useState } from 'react'
import {
  PageHeader as HPageHeader,
  FilterBar,
  ActivityTimeline,
  AlertStrip,
  QuickAccessGrid,
  Button,
  type FilterChip,
  type ActivityEvent,
  type Alert,
  type QuickAccessTile,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const ACTIVITIES: ActivityEvent[] = [
  { id: '1', type: 'create', subject: 'Created entity `cls_organism`', timestamp: new Date(Date.now() - 5 * 60000) },
  { id: '2', type: 'update', subject: 'Updated schema for `life`', timestamp: new Date(Date.now() - 2 * 3600000) },
  { id: '3', type: 'run', subject: 'Executed migration pipeline', timestamp: new Date(Date.now() - 24 * 3600000) },
  { id: '4', type: 'delete', subject: 'Removed temporary index', timestamp: new Date(Date.now() - 48 * 3600000) },
]

const TILES: QuickAccessTile[] = [
  { id: 'create', icon: 'plus', title: 'Create Entity', description: 'Add a new entity to the schema' },
  { id: 'schema', icon: 'schema', title: 'View Schema', description: 'Browse the full schema graph' },
  { id: 'export', icon: 'data', title: 'Export Data', description: 'Download a filtered data export' },
  { id: 'pipeline', icon: 'pipeline', title: 'Run Pipeline', description: 'Execute a processing task' },
]

export function PageHeaderShowcase() {
  return (
    <div>
      <PageHeader name="PageHeader" description="Structured page title block with eyebrow label, title, optional ID chip, subtitle, and action slot." />
      <ShowcaseSection label="Full variant">
        <HPageHeader
          eyebrow="DATABASE"
          title="Entity Browser"
          idChip="db_main"
          subtitle="Browse and manage your data entities"
          actions={<Button variant="primary" size="sm">Create Entity</Button>}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Minimal (eyebrow + title)">
        <HPageHeader eyebrow="CONFIG" title="Settings" />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="eyebrow" type="string" description="Monospace uppercase label above the title" />
          <PropRow name="title" type="string" description="Primary page title" />
          <PropRow name="idChip" type="string" description="Identifier rendered as a monospace chip beside the title" />
          <PropRow name="subtitle" type="string" description="Secondary description line below title" />
          <PropRow name="actions" type="ReactNode" description="Action slot — renders right-aligned beside the title" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function FilterBarShowcase() {
  const [filters, setFilters] = useState<FilterChip[]>([
    { id: 'active', label: 'Active' },
    { id: 'syncing', label: 'Syncing' },
  ])
  const [query, setQuery] = useState('')

  return (
    <div>
      <PageHeader name="FilterBar" description="Search input paired with removable filter chips. Supports a 'clear all' action when chips are present." />
      <ShowcaseSection label="With active filters" description="Type in the search field and click × on chips to remove them.">
        <FilterBar
          filters={filters}
          onSearchChange={setQuery}
          onFilterRemove={id => setFilters(f => f.filter(c => c.id !== id))}
          searchPlaceholder="Search entities..."
        />
        {query && <div style={{ marginTop: 8, fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>Query: {query}</div>}
      </ShowcaseSection>
      <ShowcaseSection label="No filters">
        <FilterBar filters={[]} searchPlaceholder="Search..." onSearchChange={() => {}} />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="filters" type="FilterChip[]" description="Active filter chips — each has id and label" />
          <PropRow name="onSearchChange" type="(q: string) => void" description="Called on every keystroke in the search field" />
          <PropRow name="onFilterRemove" type="(id: string) => void" description="Called when a chip's × is clicked" />
          <PropRow name="onClearAll" type="() => void" description="Called when 'Clear all' is clicked (visible when chips exist)" />
          <PropRow name="searchPlaceholder" type="string" def="'Search...'" description="Placeholder text for the search field" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ActivityTimelineShowcase() {
  return (
    <div>
      <PageHeader name="ActivityTimeline" description="Chronological event list with typed icons (create, update, delete, run, link) and relative timestamps." />
      <ShowcaseSection label="Event types">
        <ActivityTimeline events={ACTIVITIES} />
      </ShowcaseSection>
      <ShowcaseSection label="Empty state">
        <ActivityTimeline events={[]} emptyState="No activity recorded yet." />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="events" type="ActivityEvent[]" description="Array of activity events to render" />
          <PropRow name="emptyState" type="string" def="'No activity yet.'" description="Message shown when events array is empty" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function AlertStripShowcase() {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', severity: 'error', message: 'Database connection lost' },
    { id: '2', severity: 'warn', message: 'High memory usage detected' },
    { id: '3', severity: 'info', message: 'New update available' },
    { id: '4', severity: 'success', message: 'Migration completed successfully' },
  ])

  return (
    <div>
      <PageHeader name="AlertStrip" description="Compact banner strip displaying multiple dismissible alert messages. Severities: error, warn, info, success." />
      <ShowcaseSection label="All severities" description="Click × to dismiss individual alerts.">
        <AlertStrip alerts={alerts} onDismiss={id => setAlerts(a => a.filter(x => x.id !== id))} />
        {alerts.length === 0 && (
          <Button size="sm" variant="ghost" onClick={() => setAlerts([
            { id: '1', severity: 'error', message: 'Database connection lost' },
            { id: '2', severity: 'warn', message: 'High memory usage detected' },
            { id: '3', severity: 'info', message: 'New update available' },
            { id: '4', severity: 'success', message: 'Migration completed successfully' },
          ])}>Reset alerts</Button>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="alerts" type="Alert[]" description="Array of {id, severity, message} alert objects" />
          <PropRow name="onDismiss" type="(id: string) => void" description="Called when user dismisses an alert by ID" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function QuickAccessGridShowcase() {
  const [lastClicked, setLastClicked] = useState<string | null>(null)

  return (
    <div>
      <PageHeader name="QuickAccessGrid" description="Grid of action tiles with icon, title, and description. Click triggers onAction with the tile ID." />
      <ShowcaseSection label="4-column grid" description="Click a tile to see which ID was selected.">
        <QuickAccessGrid tiles={TILES} onAction={setLastClicked} columns={4} />
        {lastClicked && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>
            Last action: <span style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-2))' }}>{lastClicked}</span>
          </div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="2-column grid">
        <QuickAccessGrid tiles={TILES.slice(0, 2)} onAction={() => {}} columns={2} />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="tiles" type="QuickAccessTile[]" description="Array of {id, icon, title, description} tile definitions" />
          <PropRow name="onAction" type="(id: string) => void" description="Called when a tile is clicked, with the tile's id" />
          <PropRow name="columns" type="number" def="4" description="Number of columns in the grid" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
