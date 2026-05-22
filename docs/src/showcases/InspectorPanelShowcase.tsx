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
            head={{
              title: 'Entity Details',
              version: 'v2.1.0',
            }}
            actions={[
              { icon: 'edit', label: 'Edit' },
              { icon: 'trash', label: 'Delete' },
            ]}
          >
            <InspectorPanel.Section label="Properties">
              <KVGrid rows={SAMPLE_KV_ROWS} />
            </InspectorPanel.Section>
            <InspectorPanel.Section label="Tags">
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
          <PropRow name="head" type="{ title: string; version?: string }" description="Optional head section with title and optional version pill" />
          <PropRow name="actions" type="Array<{ icon: IconName; label: string }>" description="Action icons in the head" />
          <PropRow name="children" type="ReactNode" description="Panel sections and content" />
          <PropRow name="InspectorPanel.Section" type="component" description="Labeled section divider" />
          <PropRow name="KVGrid.rows" type="KVGridRow[]" description="Array of {key, value} pairs" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
