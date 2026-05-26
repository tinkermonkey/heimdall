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
      <ShowcaseSection label="PropertySection — tabular key/value rows">
        <div style={{ backgroundColor: 'rgb(var(--canvas-bg))', borderRadius: 8, overflow: 'hidden' }}>
          <InspectorPanel
            eyebrow="SCHEMA"
            title="cls_organism"
            id="cls_4f3a"
          >
            <InspectorPanel.PropertySection
              title="Fields"
              count={3}
              actionIcon={<Icon name="plus" size={12} />}
              actionLabel="Add field"
              onAction={() => {}}
              rows={[
                { key: 'name', value: 'string', usageCount: 47 },
                { key: 'status', value: 'enum', usageCount: 47 },
                { key: 'created_at', value: 'datetime', usageCount: 12 },
              ]}
            />
            <InspectorPanel.PropertySection
              title="Relations"
              count={1}
              rows={[
                { key: 'parent_class', value: 'cls_entity' },
              ]}
            />
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
      <ShowcaseSection label="InspectorPanel props">
        <PropsTable>
          <PropRow name="eyebrow" type="string" required description="Monospace eyebrow label above the title" />
          <PropRow name="title" type="string" required description="Primary title displayed in the panel head" />
          <PropRow name="id" type="string" required description="Identifier displayed below the title in monospace" />
          <PropRow name="version" type="number" defaultValue="—" description="Optional version number rendered as an amber pill" />
          <PropRow name="actions" type="ReactNode" defaultValue="—" description="Action elements (buttons, icons) rendered in the panel head" />
          <PropRow name="children" type="ReactNode" defaultValue="—" description="Panel body content — typically Section or PropertySection children" />
        </PropsTable>
      </ShowcaseSection>
      <ShowcaseSection label="InspectorPanel.Section props">
        <PropsTable>
          <PropRow name="title" type="string" required description="Section label rendered as a monospace eyebrow" />
          <PropRow name="count" type="number" defaultValue="—" description="Optional count shown after the title" />
          <PropRow name="actions" type="ReactNode" defaultValue="—" description="Action elements rendered on the right side of the section header" />
          <PropRow name="children" type="ReactNode" defaultValue="—" description="Section body content" />
        </PropsTable>
      </ShowcaseSection>
      <ShowcaseSection label="InspectorPanel.PropertySection props">
        <PropsTable>
          <PropRow name="title" type="string" required description="Section label rendered as a monospace eyebrow" />
          <PropRow name="rows" type="PropertyRow[]" required description="Array of {key, value, usageCount?} rows" />
          <PropRow name="count" type="number" defaultValue="—" description="Optional count badge shown next to the title" />
          <PropRow name="actionIcon" type="ReactNode" defaultValue="—" description="Icon rendered inside the action button (requires onAction)" />
          <PropRow name="actionLabel" type="string" defaultValue="—" description="aria-label for the action button" />
          <PropRow name="onAction" type="() => void" defaultValue="—" description="Click handler for the action button; button only renders when provided" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
