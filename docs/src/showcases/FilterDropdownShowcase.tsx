import { useState } from 'react'
import {
  FilterDropdown,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

/** Portal section shared by the dropdown pages (behaviour change in 0.11). */
function DropdownPortalSection({ panelClass, example }: { panelClass: string; example: string }) {
  return (
    <ShowcaseSection
      label="Portal"
      description={`Changed in 0.11: the panel renders in a portal on document.body, positioned from the trigger with position: fixed, so a scrolling or overflow: hidden ancestor can't clip it; it flips to the other side when there's no room, follows the trigger on scroll and resize, and keeps focus handling and keyboard navigation. The panel is no longer a DOM descendant of the component, so CSS that reached it by position stops matching: target ${panelClass} directly, or pass portal={false} to render it in place as before. Document-level outside-click handlers see a click in the panel as outside their container; containsAcrossPortals(container, target) counts it as inside the trigger's container.`}
    >
      <pre style={{ margin: 0, padding: '10px 12px', background: 'rgb(var(--canvas-bg-2))', border: '1px solid rgb(var(--canvas-border))', borderRadius: 6, fontFamily: 'var(--font-mono, monospace)', fontSize: 11.5, lineHeight: 1.6, color: 'rgb(var(--canvas-fg-2))', overflowX: 'auto' }}>
        {`// Render the panel in place, as before 0.11
${example}

// Outside-click handler that ignores clicks in a portalled panel
import { containsAcrossPortals } from '@tinkermonkey/heimdall-ui'

if (!containsAcrossPortals(containerRef.current, event.target as Node)) close()`}
      </pre>
    </ShowcaseSection>
  )
}

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

      <DropdownPortalSection panelClass=".filter-dropdown__panel" example="<FilterDropdown portal={false}>…</FilterDropdown>" />

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="mode" type="'checkbox' | 'radio'" description="Selection mode. Checkbox allows multiple selections; radio allows one." />
          <PropRow name="value" type="string[]" description="Controlled selected values." />
          <PropRow name="defaultValue" type="string[]" description="Initial selected values for uncontrolled usage." />
          <PropRow name="onChange" type="(selectedValues: string[]) => void" description="Called when selection changes." />
          <PropRow name="className" type="string" description="Additional class on the root element." />
          <PropRow name="portal" type="boolean" def="true" description="Render the panel in a portal on document.body (position: fixed) so scrolling or overflow: hidden ancestors can't clip it. false renders it in place." />
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
