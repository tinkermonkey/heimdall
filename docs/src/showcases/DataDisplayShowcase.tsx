import { useState } from 'react'
import { StatTile, StatGrid, Table, Chip, StatusBadge, Icon, KVGrid, type Column, type KVGridRow } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoCard, DemoGrid, PropsTable, PropRow } from '../components/ShowcaseSection'

export function StatTileShowcase() {
  return (
    <div>
      <PageHeader name="StatTile" description="KPI tile with a colored left bar, label, value, and optional delta. Used inside StatGrid." />
      <ShowcaseSection label="Colors">
        <DemoGrid cols={4} gap={10}>
          <StatTile label="UPTIME" value="99.9%" color="cyan" />
          <StatTile label="MEMORY" value="12.4 GB" color="violet" />
          <StatTile label="REQUESTS" value="1.2M" color="emerald" />
          <StatTile label="ERRORS" value="0.04%" color="amber" />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="With delta">
        <DemoGrid cols={4} gap={10}>
          <StatTile label="UPTIME" value="99.9%" color="cyan" delta={{ value: 0.1, label: 'vs last week', direction: 'up' }} />
          <StatTile label="LATENCY" value="42 ms" color="violet" delta={{ value: 3, label: 'vs yesterday', direction: 'down' }} />
          <StatTile label="THROUGHPUT" value="8.4k/s" color="emerald" delta={{ value: 12, label: 'vs last hour', direction: 'up' }} />
          <StatTile label="ERROR RATE" value="0.04%" color="amber" delta={{ value: 0.01, label: 'vs last week', direction: 'up' }} />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="With icon">
        <DemoGrid cols={4} gap={10}>
          <StatTile label="CPU" value="42%" color="cyan" icon="clock" />
          <StatTile label="MEMORY" value="12.4 GB" color="violet" icon="schema" />
          <StatTile label="THROUGHPUT" value="1.2M" color="emerald" icon="trending-up" />
          <StatTile label="ERRORS" value="23" color="amber" icon="alert" />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="With sparkline">
        <DemoGrid cols={2} gap={10}>
          <StatTile
            label="REQUESTS"
            value="1.2M"
            color="emerald"
            sparkData={[10, 20, 15, 30, 25, 40, 35]}
          />
          <StatTile
            label="ERRORS"
            value="0.04%"
            color="rose"
            sparkData={[2, 1, 1, 3, 2, 1, 0]}
          />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="With meta">
        <DemoGrid cols={2} gap={10}>
          <StatTile
            label="UPTIME"
            value="99.9%"
            color="cyan"
            meta="Last 30 days"
          />
          <StatTile
            label="PERFORMANCE"
            value="1.2s"
            color="violet"
            meta="Avg response time"
          />
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="label" type="string" description="Eyebrow label — rendered monospace uppercase" />
          <PropRow name="value" type="string | number" description="Primary metric value" />
          <PropRow name="color" type="'cyan' | 'violet' | 'amber' | 'emerald' | 'rose' | 'neutral'" def="'cyan'" description="Left bar accent color" />
          <PropRow name="delta" type="{ value, label?, direction? }" description="Secondary trend row below the value" />
          <PropRow name="icon" type="IconName" description="Optional icon rendered in the header" />
          <PropRow name="sparkData" type="number[]" description="Optional data points for a sparkline chart" />
          <PropRow name="meta" type="ReactNode" description="Optional content rendered below the value" />
          <PropRow name="metaIcon" type="IconName" description="Optional icon rendered alongside meta content" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function StatGridShowcase() {
  return (
    <div>
      <PageHeader name="StatGrid" description="Responsive grid wrapper for StatTile. Default 4 columns; configurable down to 1." />
      <ShowcaseSection label="4 columns (default)">
        <StatGrid columns={4}>
          <StatTile label="HOSTS ONLINE" value="12 / 12" color="emerald" delta={{ value: 1, direction: 'up', label: 'since last week' }} />
          <StatTile label="CPU LOAD" value="34%" color="cyan" delta={{ value: 2, direction: 'down', label: 'vs 1 hr ago' }} />
          <StatTile label="MEMORY USED" value="62%" color="violet" />
          <StatTile label="ALERTS" value="3" color="amber" delta={{ value: 1, direction: 'up', label: 'new today' }} />
        </StatGrid>
      </ShowcaseSection>
      <ShowcaseSection label="2 columns">
        <StatGrid columns={2}>
          <StatTile label="STORAGE USED" value="4.2 TB" color="emerald" />
          <StatTile label="STORAGE FREE" value="8.1 TB" color="cyan" />
        </StatGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="columns" type="number" def="4" description="Number of columns in the grid" />
          <PropRow name="children" type="ReactNode" description="StatTile components" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

type Host = { id: string; name: string; status: string; cpu: string; memory: string; uptime: string }

const HOSTS: Host[] = [
  { id: '1', name: 'nyx-01', status: 'running', cpu: '34%', memory: '62%', uptime: '47d 14h' },
  { id: '2', name: 'helios-01', status: 'running', cpu: '12%', memory: '41%', uptime: '31d 2h' },
  { id: '3', name: 'aether-01', status: 'degraded', cpu: '88%', memory: '91%', uptime: '3d 7h' },
  { id: '4', name: 'vega-01', status: 'stopped', cpu: '0%', memory: '0%', uptime: '—' },
  { id: '5', name: 'nyx-02', status: 'running', cpu: '22%', memory: '55%', uptime: '14d 6h' },
]

const STATUS_MAP: Record<string, 'emerald' | 'amber' | 'neutral'> = {
  running: 'emerald',
  degraded: 'amber',
  stopped: 'neutral',
}

export function TableShowcase() {
  const [selected, setSelected] = useState<(string | number)[]>([])
  const [lastClicked, setLastClicked] = useState<string | null>(null)

  const columns: Column<Host>[] = [
    {
      key: 'name',
      label: 'HOST',
      sortable: true,
      render: (v) => <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>{String(v)}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const s = String(v)
        return <Chip variant={STATUS_MAP[s] ?? 'neutral'}>{s}</Chip>
      },
    },
    { key: 'cpu', label: 'CPU', sortable: true },
    { key: 'memory', label: 'MEMORY', sortable: true },
    { key: 'uptime', label: 'UPTIME' },
  ]

  return (
    <div>
      <PageHeader name="Table" description="Data table with sortable columns, row selection, and custom cell rendering." />
      <ShowcaseSection label="Basic table">
        <Table columns={columns} data={HOSTS} rowKey="id" selectable={false} />
      </ShowcaseSection>
      <ShowcaseSection label="With row selection">
        <Table
          columns={columns}
          data={HOSTS}
          rowKey="id"
          selectable
          selectedRows={selected}
          onSelectRows={setSelected}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: 'rgb(var(--canvas-fg-3, 107 114 128))' }}>
          {selected.length === 0 ? 'No rows selected' : `${selected.length} row${selected.length > 1 ? 's' : ''} selected: ${selected.join(', ')}`}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="With row click">
        <Table
          columns={columns}
          data={HOSTS}
          rowKey="id"
          onRowClick={(row) => setLastClicked(row.name)}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: 'rgb(var(--canvas-fg-3, 107 114 128))' }}>
          {lastClicked ? `Last clicked: ${lastClicked}` : 'Click a row'}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Empty state">
        <Table
          columns={columns}
          data={[]}
          rowKey="id"
          emptyState="No hosts match these filters."
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="columns" type="Column<T>[]" description="Column definitions — key, label, sortable?, width?, render?" />
          <PropRow name="data" type="T[]" description="Array of data objects" />
          <PropRow name="rowKey" type="keyof T | function" description="Unique key per row" />
          <PropRow name="selectable" type="boolean" def="false" description="Show checkbox column for row selection" />
          <PropRow name="selectedRows" type="(string | number)[]" description="Controlled selection state" />
          <PropRow name="onSelectRows" type="(keys) => void" description="Selection change handler" />
          <PropRow name="onRowClick" type="(row, key) => void" description="Row click handler — makes rows keyboard-focusable and shows pointer cursor" />
          <PropRow name="onSort" type="(key, dir) => void" description="Sort change handler" />
          <PropRow name="emptyState" type="ReactNode" description="Content shown when data is empty" />
          <PropRow name="className" type="string" description="Additional CSS class on the table element" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function KVGridShowcase() {
  const basicRows: KVGridRow[] = [
    { key: 'hostname', value: 'nyx-01.internal' },
    { key: 'ip_address', value: '192.168.1.100' },
    { key: 'cpu_cores', value: '16' },
    { key: 'memory_gb', value: '64' },
    { key: 'uptime_days', value: '47' },
  ]

  const longValueRows: KVGridRow[] = [
    { key: 'image', value: 'registry.io/api-server:1.2.3' },
    { key: 'env', value: 'PROD_API_ENDPOINT=https://api.example.com:8443' },
    { key: 'description', value: 'Main API server handling authentication and data synchronization' },
  ]

  const denseManyRows: KVGridRow[] = [
    { key: 'id', value: 'entity_001' },
    { key: 'status', value: 'active' },
    { key: 'created', value: '2025-05-22' },
    { key: 'modified', value: '2025-05-22 14:30' },
    { key: 'owner', value: 'data-team' },
    { key: 'region', value: 'us-east-1' },
    { key: 'version', value: 'v2.1.0' },
    { key: 'replicas', value: '3' },
  ]

  return (
    <div>
      <PageHeader name="KVGrid" description="Key-value pairs display with a fixed key column (130px) and flexible value column. Used for metadata and configuration display." />
      <ShowcaseSection label="Basic key-value pairs">
        <KVGrid rows={basicRows} />
      </ShowcaseSection>
      <ShowcaseSection label="With long values">
        <KVGrid rows={longValueRows} />
      </ShowcaseSection>
      <ShowcaseSection label="Many rows">
        <KVGrid rows={denseManyRows} />
      </ShowcaseSection>
      <ShowcaseSection label="Custom key column width">
        <KVGrid rows={basicRows} keyWidth={180} />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="rows" type="KVGridRow[]" description="Array of {key, value} pairs. Keys are rendered monospace uppercase; values preserve input formatting." />
          <PropRow name="keyWidth" type="number | string" defaultValue="130" description="Width of the key column. Accepts a pixel number or any CSS length string (e.g. '25%')." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
