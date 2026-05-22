import { useState } from 'react'
import { FilterDropdown } from '../components/FilterDropdown'

export default function FilterDropdownTestPage() {
  const [checkboxSelected, setCheckboxSelected] = useState<string[]>([])
  const [radioSelected, setRadioSelected] = useState<string[]>([])

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
            <FilterDropdown.Trigger label="Status" summary={checkboxSummary} />
            <FilterDropdown.Panel>
              <FilterDropdown.Section title="Status Options">
                <FilterDropdown.Checkbox value="running" label="Running" />
                <FilterDropdown.Checkbox value="stopped" label="Stopped" />
                <FilterDropdown.Checkbox value="error" label="Error" description="Something went wrong" />
                <FilterDropdown.Checkbox value="pending" label="Pending" />
              </FilterDropdown.Section>
              <FilterDropdown.Section title="Other">
                <FilterDropdown.Checkbox value="archived" label="Archived" />
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
          >
            <FilterDropdown.Trigger label="Env" summary={radioSummary} />
            <FilterDropdown.Panel>
              <FilterDropdown.Section>
                <FilterDropdown.Radio value="development" label="Development" description="Local environment" />
                <FilterDropdown.Radio value="staging" label="Staging" description="Pre-production" />
                <FilterDropdown.Radio value="production" label="Production" description="Live environment" />
              </FilterDropdown.Section>
            </FilterDropdown.Panel>
          </FilterDropdown>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'rgb(var(--canvas-bg-2))', borderRadius: '4px', fontSize: '13px' }}>
          Selected: {radioSelected.length === 0 ? 'None' : radioSelected[0]}
        </div>
      </section>

      {/* Empty Panel */}
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
          Complex Example with Multiple Sections
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <FilterDropdown
            mode="checkbox"
            onChange={(selected) => console.log('Complex filter selected:', selected)}
          >
            <FilterDropdown.Trigger label="Service" summary="All" />
            <FilterDropdown.Panel>
              <FilterDropdown.Section title="Core Services">
                <FilterDropdown.Checkbox value="api" label="API" description="REST API service" />
                <FilterDropdown.Checkbox value="auth" label="Authentication" description="Auth service" />
                <FilterDropdown.Checkbox value="database" label="Database" description="Data storage" />
              </FilterDropdown.Section>
              <FilterDropdown.Section title="Monitoring">
                <FilterDropdown.Checkbox value="logs" label="Logs" description="Log aggregation" />
                <FilterDropdown.Checkbox value="metrics" label="Metrics" description="Performance metrics" />
              </FilterDropdown.Section>
            </FilterDropdown.Panel>
          </FilterDropdown>
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
