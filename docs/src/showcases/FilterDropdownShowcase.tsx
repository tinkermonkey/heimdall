import { useState } from 'react'
import {
  FilterDropdown,
  Button,
  Icon,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

export function FilterDropdownShowcase() {
  const [checkedDomains, setCheckedDomains] = useState<string[]>(['life', 'physics'])
  const [selectedNode, setSelectedNode] = useState<string>('graph')

  return (
    <div>
      <PageHeader name="FilterDropdown" description="Dropdown panel with filterable sections, checkboxes, and radio options. Compound component pattern." />
      <ShowcaseSection label="Multi-select checkboxes">
        <FilterDropdown mode="checkbox" onChange={setCheckedDomains}>
          <FilterDropdown.Trigger label="Filter domains" summary={checkedDomains.length > 0 ? `${checkedDomains.length} selected` : 'None'} />
          <FilterDropdown.Panel style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 11 }}>
            <FilterDropdown.Section title="DOMAINS">
              {['life', 'physics', 'chemistry', 'biology'].map(domain => (
                <FilterDropdown.Checkbox
                  key={domain}
                  value={domain}
                  label={domain}
                />
              ))}
            </FilterDropdown.Section>
          </FilterDropdown.Panel>
        </FilterDropdown>
        {checkedDomains.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>
            Selected domains: <span style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-2))' }}>{checkedDomains.join(', ')}</span>
          </div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="Radio selection">
        <FilterDropdown mode="radio" onChange={(values) => setSelectedNode(values[0] || 'graph')}>
          <FilterDropdown.Trigger label="Node type" summary={selectedNode} />
          <FilterDropdown.Panel style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 11 }}>
            <FilterDropdown.Section title="NODE TYPE">
              {['graph', 'entity', 'relationship', 'attribute'].map(nodeType => (
                <FilterDropdown.Radio
                  key={nodeType}
                  value={nodeType}
                  label={nodeType}
                />
              ))}
            </FilterDropdown.Section>
          </FilterDropdown.Panel>
        </FilterDropdown>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="FilterDropdown" type="component" description="Root component managing dropdown state and context" />
          <PropRow name="FilterDropdown.Trigger" type="component" description="Trigger button to open/close dropdown" />
          <PropRow name="FilterDropdown.Panel" type="component" description="Dropdown panel container" />
          <PropRow name="FilterDropdown.Section" type="component" description="Labeled section within the panel" />
          <PropRow name="FilterDropdown.Checkbox" type="component" description="Checkbox option" />
          <PropRow name="FilterDropdown.Radio" type="component" description="Radio option" />
          <PropRow name="mode (FilterDropdown)" type="'checkbox' | 'radio'" description="Selection mode" />
          <PropRow name="title (Section)" type="string" description="Eyebrow label above the section" />
          <PropRow name="value (Checkbox/Radio)" type="string" description="The value for this option" />
          <PropRow name="label (Checkbox/Radio)" type="ReactNode" description="The displayed label" />
          <PropRow name="onChange (FilterDropdown)" type="(selectedValues: string[]) => void" description="Change handler" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
