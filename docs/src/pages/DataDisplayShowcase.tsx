import { Column, StatTile, Table } from '@heimdall/ui'

export default function DataDisplayShowcase() {
  const tableData = [
    { id: 'cls_4f3a', name: 'organism', class: 'life', status: 'active', updated: '2m ago' },
    { id: 'cls_8b21', name: 'station', class: 'climate', status: 'syncing', updated: '12m ago' },
    { id: 'cls_e007', name: 'service', class: 'software', status: 'error', updated: '1h ago' },
    { id: 'cls_f124', name: 'location', class: 'geography', status: 'active', updated: '5m ago' },
  ]

  const tableColumns = [
    { key: 'id' as const, label: 'ID', width: '120px' },
    { key: 'name' as const, label: 'Name' },
    { key: 'class' as const, label: 'Class' },
    { key: 'status' as const, label: 'Status' },
    { key: 'updated' as const, label: 'Updated' },
  ] satisfies Column<typeof tableData[0]>[]

  return (
    <div>
      {/* Stat Tiles - Full Width */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Stat Tiles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <StatTile label="Classes" value="128" color="cyan" delta={{ value: 4, label: 'this week', direction: 'up' }} />
          <StatTile label="Individuals" value="12,480" color="violet" delta={{ value: 312, label: 'today', direction: 'up' }} />
          <StatTile label="Pipelines" value="17" color="amber" />
          <StatTile label="Uptime" value="99.8%" color="emerald" delta={{ value: 0.1, label: '24h', direction: 'down' }} />
        </div>
      </section>

      {/* Stat Tiles - 2 Column */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Stat Tiles (2 Column)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          <StatTile label="Taxonomies" value="3" color="cyan" />
          <StatTile
            label="Active Pipelines"
            value="5"
            color="emerald"
            delta={{ value: 2, label: 'from last week', direction: 'up' }}
          />
        </div>
      </section>

      {/* Table */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Data Table</h2>
        <div style={{ border: '1px solid rgb(var(--canvas-border))', borderRadius: '8px', overflow: 'hidden' }}>
          <Table
            columns={tableColumns}
            data={tableData}
            rowKey="id"
            selectedRows={[]}
            onSelectRows={() => {}}
          />
        </div>
      </section>

      {/* Table with Selection */}
      <section>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Data Table with Selection</h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'rgb(var(--canvas-fg-2))' }}>
          Tables can support row selection and multi-selection
        </p>
        <div style={{ border: '1px solid rgb(var(--canvas-border))', borderRadius: '8px', overflow: 'hidden' }}>
          <Table
            columns={tableColumns}
            data={tableData.slice(0, 2)}
            rowKey="id"
            selectedRows={[]}
            onSelectRows={() => {}}
          />
        </div>
      </section>
    </div>
  )
}
