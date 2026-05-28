import { InspectorPanel, Chip, KVGrid, Icon } from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow } from '../components/BareSection'

export function BareInspectorPanel() {
  return (
    <BareSection name="InspectorPanel">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 360 }}>
          <InspectorPanel title="cls_organism" id="cls_4f3a">
            <InspectorPanel.Section title="Overview">
              <KVGrid
                rows={[
                  { key: 'id', value: 'cls_4f3a' },
                  { key: 'name', value: 'cls_organism' },
                  { key: 'kind', value: 'class' },
                ]}
              />
            </InspectorPanel.Section>
          </InspectorPanel>
        </div>
      </AxisRow>
      <AxisRow label="full (eyebrow + version + sections)" align="stretch">
        <div style={{ width: 360 }}>
          <InspectorPanel eyebrow="Schema" title="cls_organism" id="cls_4f3a" version={4}>
            <InspectorPanel.Section title="Overview">
              <KVGrid
                rows={[
                  { key: 'name', value: 'cls_organism' },
                  { key: 'kind', value: 'class' },
                ]}
              />
            </InspectorPanel.Section>
            <InspectorPanel.Section title="Tags" count={3}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Chip variant="emerald">life</Chip>
                <Chip variant="cyan">core</Chip>
                <Chip variant="amber">v4</Chip>
              </div>
            </InspectorPanel.Section>
            <InspectorPanel.PropertySection
              title="Properties"
              count={3}
              actionIcon={<Icon name="plus" size={12} />}
              actionLabel="Add property"
              onAction={() => {}}
              rows={[
                { key: 'fields', value: '9' },
                { key: 'subclasses', value: '4', usageCount: 12 },
                { key: 'records', value: '412' },
              ]}
            />
          </InspectorPanel>
        </div>
      </AxisRow>
    </BareSection>
  )
}
