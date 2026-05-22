import { useState } from 'react'
import {
  FilterDropdown,
  Button,
  Icon,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

export function FilterDropdownShowcase() {
  const [open, setOpen] = useState(false)
  const [checkedDomains, setCheckedDomains] = useState<string[]>(['life', 'physics'])
  const [selectedNode, setSelectedNode] = useState<string>('graph')

  return (
    <div>
      <PageHeader name="FilterDropdown" description="Dropdown panel with filterable sections, checkboxes, and radio options. Compound component pattern." />
      <ShowcaseSection label="Multi-select checkboxes">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <Icon name="filter" size={14} /> Filter domains
          </Button>
          {open && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9,
                }}
                onClick={() => setOpen(false)}
              />
              <FilterDropdown.Panel
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  zIndex: 11,
                }}
              >
                <FilterDropdown.Section label="DOMAINS">
                  {['life', 'physics', 'chemistry', 'biology'].map(domain => (
                    <FilterDropdown.Checkbox
                      key={domain}
                      label={domain}
                      checked={checkedDomains.includes(domain)}
                      onChange={e => {
                        if (e.target.checked) {
                          setCheckedDomains([...checkedDomains, domain])
                        } else {
                          setCheckedDomains(checkedDomains.filter(d => d !== domain))
                        }
                      }}
                    />
                  ))}
                </FilterDropdown.Section>
              </FilterDropdown.Panel>
            </>
          )}
        </div>
        {checkedDomains.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>
            Selected domains: <span style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-2))' }}>{checkedDomains.join(', ')}</span>
          </div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="Radio selection">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <Icon name="filter" size={14} /> Node type: {selectedNode}
          </Button>
          {open && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9,
                }}
                onClick={() => setOpen(false)}
              />
              <FilterDropdown.Panel
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  zIndex: 11,
                }}
              >
                <FilterDropdown.Section label="NODE TYPE">
                  {['graph', 'entity', 'relationship', 'attribute'].map(nodeType => (
                    <FilterDropdown.Radio
                      key={nodeType}
                      label={nodeType}
                      checked={selectedNode === nodeType}
                      onChange={() => {
                        setSelectedNode(nodeType)
                        setOpen(false)
                      }}
                    />
                  ))}
                </FilterDropdown.Section>
              </FilterDropdown.Panel>
            </>
          )}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="FilterDropdown.Panel" type="component" description="Dropdown panel container" />
          <PropRow name="FilterDropdown.Section" type="component" description="Labeled section within the panel" />
          <PropRow name="FilterDropdown.Checkbox" type="component" description="Checkbox option" />
          <PropRow name="FilterDropdown.Radio" type="component" description="Radio option" />
          <PropRow name="label (Section)" type="string" description="Eyebrow label above the section" />
          <PropRow name="checked (Checkbox/Radio)" type="boolean" description="Whether the option is selected" />
          <PropRow name="onChange" type="(e: ChangeEvent) => void" description="Change handler" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
