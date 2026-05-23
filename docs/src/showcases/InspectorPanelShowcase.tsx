import {
  InspectorPanel,
  KVGrid,
  VersionPill,
  Icon,
  Button,
  type KVGridRow,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const SAMPLE_KV_ROWS: KVGridRow[] = [
  { key: 'id', value: 'entity_001' },
  { key: 'status', value: 'active' },
  { key: 'created', value: '2025-05-22' },
  { key: 'modified', value: '2025-05-22 14:30' },
  { key: 'owner', value: 'data-team' },
]

export function InspectorPanelShowcase() {
  return (
    <div>
      <PageHeader name="InspectorPanel" description="Inline panel with optional head section (title, version), body, and sections. Displays metadata and structured content." />
      <ShowcaseSection label="Full inspector panel">
        <div style={{ backgroundColor: 'rgb(var(--canvas-bg))', padding: '14px', borderRadius: 8 }}>
          <InspectorPanel
            eyebrow="DETAILS"
            title="Entity Details"
            id="entity_001"
            version={2}
            actions={
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" size="sm"><Icon name="edit" size={14} /></Button>
                <Button variant="ghost" size="sm"><Icon name="trash" size={14} /></Button>
              </div>
            }
          >
            <InspectorPanel.Section title="Properties">
              <KVGrid rows={SAMPLE_KV_ROWS} />
            </InspectorPanel.Section>
            <InspectorPanel.Section title="Tags" count={2}>
              <div style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-2))' }}>
                <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: 'rgb(var(--canvas-border))', borderRadius: 4, marginRight: 6, marginBottom: 6 }}>
                  production
                </span>
                <span style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: 'rgb(var(--canvas-border))', borderRadius: 4, marginRight: 6, marginBottom: 6 }}>
                  critical
                </span>
              </div>
            </InspectorPanel.Section>
          </InspectorPanel>
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="KVGrid component">
        <div style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-3))', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
          Key-value display with fixed 130px key column
        </div>
        <KVGrid
          rows={[
            { key: 'hostname', value: 'nyx-01.internal' },
            { key: 'ip_address', value: '192.168.1.100' },
            { key: 'cpu_cores', value: '16' },
            { key: 'memory_gb', value: '64' },
            { key: 'uptime_days', value: '47' },
          ]}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="eyebrow" type="string" description="Eyebrow label above the title" />
          <PropRow name="title" type="string" description="Primary title for the panel" />
          <PropRow name="id" type="string" description="Unique identifier for the panel" />
          <PropRow name="version" type="number" description="Optional version number displayed as a pill" />
          <PropRow name="actions" type="ReactNode" description="Rendered action elements (buttons, icons, etc.)" />
          <PropRow name="children" type="ReactNode" description="Panel sections and content" />
          <PropRow name="InspectorPanel.Section" type="component" description="Labeled section divider with optional count" />
          <PropRow name="InspectorPanel.Section.title" type="string" description="Section label" />
          <PropRow name="InspectorPanel.Section.count" type="number" description="Optional count badge" />
          <PropRow name="KVGrid.rows" type="KVGridRow[]" description="Array of {key, value} pairs" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
