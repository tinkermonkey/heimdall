import { useState } from 'react'
import { FilterDropdown } from '../components/FilterDropdown'

export default function FilterDropdownTestPage() {
  const [checkboxSelected, setCheckboxSelected] = useState<string[]>([])
  const [radioSelected, setRadioSelected] = useState<string[]>(['graph'])

  const checkboxSummary = checkboxSelected.length === 0
    ? 'None'
    : checkboxSelected.length === 1
    ? checkboxSelected[0]
    : `${checkboxSelected.length} selected`

  const radioSummary = radioSelected.length === 0 ? 'None' : radioSelected[0]

  return (
    <div style={{ padding: '22px 28px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <h1 style={{ color: 'rgb(var(--canvas-fg-1))', marginBottom: '32px' }}>FilterDropdown Component</h1>

      {/* Checkbox Mode */}
      <section style={{ marginBottom: '48px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Checkbox Mode (Multiple Selection)
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
          <FilterDropdown
            mode="checkbox"
            onChange={setCheckboxSelected}
          >
            <FilterDropdown.Trigger label="Filter" summary={checkboxSummary} />
            <FilterDropdown.Panel>
              <FilterDropdown.Section title="DOMAINS">
                <FilterDropdown.Checkbox value="life" label="life" />
                <FilterDropdown.Checkbox value="physics" label="physics" />
                <FilterDropdown.Checkbox value="chemistry" label="chemistry" />
                <FilterDropdown.Checkbox value="biology" label="biology" />
              </FilterDropdown.Section>
            </FilterDropdown.Panel>
          </FilterDropdown>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'rgb(var(--canvas-bg-2))', borderRadius: '4px', fontSize: '13px' }}>
          Selected: {checkboxSelected.length === 0 ? 'None' : checkboxSelected.join(', ')}
        </div>
      </section>

      {/* Radio Mode */}
      <section style={{ marginBottom: '48px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Radio Mode (Single Selection)
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
          <FilterDropdown
            mode="radio"
            onChange={setRadioSelected}
            defaultValue={radioSelected}
          >
            <FilterDropdown.Trigger label="Node type" summary={radioSummary} />
            <FilterDropdown.Panel>
              <div className="filter-dropdown__section-content">
                <FilterDropdown.Radio value="graph" label="graph" />
                <FilterDropdown.Radio value="entity" label="entity" />
                <FilterDropdown.Radio value="relationship" label="relationship" />
                <FilterDropdown.Radio value="attribute" label="attribute" />
              </div>
            </FilterDropdown.Panel>
          </FilterDropdown>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'rgb(var(--canvas-bg-2))', borderRadius: '4px', fontSize: '13px' }}>
          Selected: {radioSelected.length === 0 ? 'None' : radioSelected[0]}
        </div>
      </section>

      {/* Keyboard Navigation Instructions */}
      <section style={{ marginTop: '48px', padding: '16px', backgroundColor: 'rgb(var(--canvas-surface-2))', borderRadius: '6px' }}>
        <h3 style={{ color: 'rgb(var(--canvas-fg-1))', marginTop: 0, marginBottom: '12px' }}>Keyboard Navigation</h3>
        <ul style={{ color: 'rgb(var(--canvas-fg-2))', margin: 0, paddingLeft: '20px' }}>
          <li><strong>Tab/Shift+Tab:</strong> Navigate rows within the panel</li>
          <li><strong>Arrow Up/Down:</strong> Move focus between rows</li>
          <li><strong>Enter/Space:</strong> Toggle selection (checkboxes) or select (radio)</li>
          <li><strong>Escape:</strong> Close panel and return focus to trigger</li>
          <li><strong>Click outside:</strong> Close the panel</li>
        </ul>
      </section>
    </div>
  )
}
