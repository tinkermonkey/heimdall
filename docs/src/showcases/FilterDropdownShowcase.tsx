import { useState } from 'react'
import {
  FilterDropdown,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

export function FilterDropdownShowcase() {
  const [checkedDomains, setCheckedDomains] = useState<string[]>(['life', 'physics'])
  const [selectedNode, setSelectedNode] = useState<string>('graph')

  return (
    <div>
      <PageHeader name="FilterDropdown" description="Dropdown panel with filterable sections, checkboxes, and radio options. Compound component pattern." />

      <ShowcaseSection label="Multi-select checkboxes">
        <FilterDropdown mode="checkbox" defaultValue={['life', 'physics']} onChange={setCheckedDomains}>
          <FilterDropdown.Trigger label="Filter domains" summary={checkedDomains.length > 0 ? `${checkedDomains.length} selected` : 'None'} />
          <FilterDropdown.Panel>
            <FilterDropdown.Section title="DOMAINS">
              <FilterDropdown.Checkbox value="life" label="life" description="Life sciences domain" />
              <FilterDropdown.Checkbox value="physics" label="physics" description="Physical sciences domain" />
              <FilterDropdown.Checkbox value="chemistry" label="chemistry" />
              <FilterDropdown.Checkbox value="biology" label="biology" />
            </FilterDropdown.Section>
          </FilterDropdown.Panel>
        </FilterDropdown>
        {checkedDomains.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>
            Selected: <span style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-2))' }}>{checkedDomains.join(', ')}</span>
          </div>
        )}
      </ShowcaseSection>

      <ShowcaseSection label="Radio selection">
        <FilterDropdown mode="radio" defaultValue={['graph']} onChange={(values) => setSelectedNode(values[0] || 'graph')}>
          <FilterDropdown.Trigger label="Node type" summary={selectedNode} />
          <FilterDropdown.Panel>
            <FilterDropdown.Section title="NODE TYPE">
              <FilterDropdown.Radio value="graph" label="graph" description="Top-level graph node" />
              <FilterDropdown.Radio value="entity" label="entity" />
              <FilterDropdown.Radio value="relationship" label="relationship" />
              <FilterDropdown.Radio value="attribute" label="attribute" />
            </FilterDropdown.Section>
          </FilterDropdown.Panel>
        </FilterDropdown>
      </ShowcaseSection>

      <ShowcaseSection label="Multiple sections">
        <FilterDropdown mode="checkbox" onChange={() => {}}>
          <FilterDropdown.Trigger label="Filter" summary="Mixed" />
          <FilterDropdown.Panel>
            <FilterDropdown.Section title="TYPE">
              <FilterDropdown.Checkbox value="node" label="node" />
              <FilterDropdown.Checkbox value="edge" label="edge" />
            </FilterDropdown.Section>
            <FilterDropdown.Section title="STATUS">
              <FilterDropdown.Checkbox value="active" label="active" />
              <FilterDropdown.Checkbox value="inactive" label="inactive" />
            </FilterDropdown.Section>
          </FilterDropdown.Panel>
        </FilterDropdown>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="mode" type="'checkbox' | 'radio'" description="Selection mode. Checkbox allows multiple selections; radio allows one." />
          <PropRow name="value" type="string[]" description="Controlled selected values." />
          <PropRow name="defaultValue" type="string[]" description="Initial selected values for uncontrolled usage." />
          <PropRow name="onChange" type="(selectedValues: string[]) => void" description="Called when selection changes." />
          <PropRow name="className" type="string" description="Additional class on the root element." />
          <PropRow name="label (Trigger)" type="string" description="Monospace uppercase eyebrow label on the trigger button." />
          <PropRow name="summary (Trigger)" type="ReactNode" description="Main text shown in the trigger button." />
          <PropRow name="title (Section)" type="string" description="Monospace uppercase section header." />
          <PropRow name="value (Checkbox/Radio)" type="string" description="The option value string." />
          <PropRow name="label (Checkbox/Radio)" type="ReactNode" description="Displayed label for the option." />
          <PropRow name="description (Checkbox/Radio)" type="ReactNode" description="Secondary descriptive text below the label." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
