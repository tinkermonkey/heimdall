import { useState } from 'react'
import {
  TextInput,
  TextArea,
  NumberInput,
  Select,
  TriState,
  Field,
  SegmentedControl,
  FilterDropdown,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

export function BareTextInput() {
  return (
    <BareSection name="TextInput">
      <AxisRow label="default">
        <TextInput placeholder="Enter text…" />
      </AxisRow>
      <AxisRow label="with value">
        <TextInput defaultValue="some value" />
      </AxisRow>
      <AxisRow label="mono">
        <TextInput mono defaultValue="cls_4f3a2b1" />
      </AxisRow>
      <AxisRow label="state">
        <Caption label="error"><TextInput error defaultValue="bad value" /></Caption>
        <Caption label="disabled"><TextInput disabled defaultValue="disabled" /></Caption>
        <Caption label="readonly"><TextInput readOnly defaultValue="readonly" /></Caption>
      </AxisRow>
    </BareSection>
  )
}

export function BareTextArea() {
  return (
    <BareSection name="TextArea">
      <AxisRow label="default">
        <TextArea placeholder="Enter text…" rows={3} />
      </AxisRow>
      <AxisRow label="with value">
        <TextArea rows={3} defaultValue={'Line one.\nLine two.\nLine three.'} />
      </AxisRow>
      <AxisRow label="mono">
        <TextArea mono rows={3} defaultValue={'name: cls_organism\nkind: class\nversion: 1'} />
      </AxisRow>
      <AxisRow label="state">
        <Caption label="error"><TextArea error rows={2} defaultValue="bad" /></Caption>
        <Caption label="disabled"><TextArea disabled rows={2} defaultValue="disabled" /></Caption>
      </AxisRow>
    </BareSection>
  )
}

export function BareNumberInput() {
  return (
    <BareSection name="NumberInput">
      <AxisRow label="default">
        <NumberInput placeholder="0" />
      </AxisRow>
      <AxisRow label="with value">
        <NumberInput defaultValue={42} />
      </AxisRow>
      <AxisRow label="mono">
        <NumberInput mono defaultValue={1024} />
      </AxisRow>
      <AxisRow label="state">
        <Caption label="error"><NumberInput error defaultValue={-1} /></Caption>
        <Caption label="disabled"><NumberInput disabled defaultValue={0} /></Caption>
      </AxisRow>
    </BareSection>
  )
}

export function BareSelect() {
  return (
    <BareSection name="Select">
      <AxisRow label="default">
        <Select defaultValue="b">
          <Select.Item value="a">Alpha</Select.Item>
          <Select.Item value="b">Bravo</Select.Item>
          <Select.Item value="c">Charlie</Select.Item>
        </Select>
      </AxisRow>
      <AxisRow label="state">
        <Caption label="error">
          <Select error defaultValue="a">
            <Select.Item value="a">Invalid</Select.Item>
            <Select.Item value="b">Other</Select.Item>
          </Select>
        </Caption>
        <Caption label="disabled">
          <Select disabled defaultValue="a">
            <Select.Item value="a">Disabled</Select.Item>
          </Select>
        </Caption>
      </AxisRow>
    </BareSection>
  )
}

export function BareTriState() {
  return (
    <BareSection name="TriState">
      <AxisRow label="default">
        <TriState />
      </AxisRow>
      <AxisRow label="state">
        <Caption label="unchecked"><TriState /></Caption>
        <Caption label="checked"><TriState defaultChecked /></Caption>
        <Caption label="indeterminate"><TriState indeterminate /></Caption>
        <Caption label="disabled"><TriState disabled /></Caption>
        <Caption label="disabled checked"><TriState disabled defaultChecked /></Caption>
      </AxisRow>
    </BareSection>
  )
}

export function BareField() {
  return (
    <BareSection name="Field">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 280 }}>
          <Field label="Label">
            <TextInput placeholder="Type here" />
          </Field>
        </div>
      </AxisRow>
      <AxisRow label="with hint" align="stretch">
        <div style={{ width: 280 }}>
          <Field label="Name" hint="Lowercase letters and underscores.">
            <TextInput placeholder="cls_…" mono />
          </Field>
        </div>
      </AxisRow>
      <AxisRow label="required" align="stretch">
        <div style={{ width: 280 }}>
          <Field label="Identifier" required>
            <TextInput />
          </Field>
        </div>
      </AxisRow>
      <AxisRow label="error" align="stretch">
        <div style={{ width: 280 }}>
          <Field label="Identifier" error="Already in use.">
            <TextInput error defaultValue="dup" />
          </Field>
        </div>
      </AxisRow>
      <AxisRow label="disabled" align="stretch">
        <div style={{ width: 280 }}>
          <Field label="Identifier" disabled>
            <TextInput disabled />
          </Field>
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareSegmentedControl() {
  const [a, setA] = useState<string | number>('list')
  const [b, setB] = useState<string | number>('day')
  const [c, setC] = useState<string | number>('a')
  return (
    <BareSection name="SegmentedControl">
      <AxisRow label="default">
        <SegmentedControl
          value={a}
          onChange={setA}
          options={[
            { value: 'list', label: 'List' },
            { value: 'grid', label: 'Grid' },
            { value: 'graph', label: 'Graph' },
          ]}
        />
      </AxisRow>
      <AxisRow label="four options">
        <SegmentedControl
          value={b}
          onChange={setB}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
        />
      </AxisRow>
      <AxisRow label="with disabled option">
        <SegmentedControl
          value={c}
          onChange={setC}
          options={[
            { value: 'a', label: 'On' },
            { value: 'b', label: 'Off' },
            { value: 'c', label: 'N/A', disabled: true },
          ]}
        />
      </AxisRow>
      <AxisRow label="disabled">
        <SegmentedControl
          value="a"
          onChange={() => {}}
          disabled
          options={[
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ]}
        />
      </AxisRow>
    </BareSection>
  )
}

export function BareFilterDropdown() {
  return (
    <BareSection name="FilterDropdown">
      <AxisRow label="checkbox (default)" align="stretch">
        <FilterDropdown defaultValue={['emerald']}>
          <FilterDropdown.Trigger label="Status" summary="1 selected" />
          <FilterDropdown.Panel>
            <FilterDropdown.Section title="Status">
              <FilterDropdown.Checkbox value="emerald" label="Running" />
              <FilterDropdown.Checkbox value="amber" label="Warning" />
              <FilterDropdown.Checkbox value="rose" label="Failed" />
              <FilterDropdown.Checkbox value="neutral" label="Idle" />
            </FilterDropdown.Section>
          </FilterDropdown.Panel>
        </FilterDropdown>
      </AxisRow>
      <AxisRow label="radio" align="stretch">
        <FilterDropdown mode="radio" defaultValue={['week']}>
          <FilterDropdown.Trigger label="Range" summary="This week" />
          <FilterDropdown.Panel>
            <FilterDropdown.Section title="Range">
              <FilterDropdown.Radio value="day" label="Today" />
              <FilterDropdown.Radio value="week" label="This week" />
              <FilterDropdown.Radio value="month" label="This month" />
            </FilterDropdown.Section>
          </FilterDropdown.Panel>
        </FilterDropdown>
      </AxisRow>
    </BareSection>
  )
}
