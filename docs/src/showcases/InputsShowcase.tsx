import { useState } from 'react'
import { TextInput, TextArea, NumberInput, Select, TriState, Field } from '@heimdall/ui'
import { PageHeader, ShowcaseSection, DemoRow, DemoGrid, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

export function TextInputShowcase() {
  const [val, setVal] = useState('')
  return (
    <div>
      <PageHeader name="TextInput" description="Single-line text input. Extends the native <input> element with design system styling." />
      <ShowcaseSection label="States">
        <DemoGrid cols={2} gap={12}>
          <DemoCard label="Default">
            <TextInput placeholder="Enter value…" />
          </DemoCard>
          <DemoCard label="With value">
            <TextInput value="example content" onChange={() => {}} />
          </DemoCard>
          <DemoCard label="Error">
            <TextInput placeholder="Invalid value" error />
          </DemoCard>
          <DemoCard label="Disabled">
            <TextInput placeholder="Not editable" disabled />
          </DemoCard>
          <DemoCard label="Mono font">
            <TextInput placeholder="cls_4f3a" mono />
          </DemoCard>
          <DemoCard label="Mono + value">
            <TextInput value="life.organism" mono onChange={() => {}} />
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="mono" type="boolean" def="false" description="Renders with JetBrains Mono font — for identifiers and code" />
          <PropRow name="error" type="boolean" def="false" description="Error state — rose border + focus ring" />
          <PropRow name="...InputHTMLAttributes" type="" description="All native input attributes (value, onChange, placeholder, disabled, etc.)" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function TextAreaShowcase() {
  return (
    <div>
      <PageHeader name="TextArea" description="Multi-line text input. Extends the native <textarea> element." />
      <ShowcaseSection label="States">
        <DemoGrid cols={2} gap={12}>
          <DemoCard label="Default">
            <TextArea placeholder="Enter notes…" rows={3} />
          </DemoCard>
          <DemoCard label="With value">
            <TextArea defaultValue="Line one&#10;Line two" rows={3} />
          </DemoCard>
          <DemoCard label="Error">
            <TextArea placeholder="Too long" error rows={3} />
          </DemoCard>
          <DemoCard label="Disabled">
            <TextArea placeholder="Not editable" disabled rows={3} />
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="error" type="boolean" def="false" description="Error state — rose border" />
          <PropRow name="...TextareaHTMLAttributes" type="" description="All native textarea attributes (rows, cols, value, onChange, etc.)" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function NumberInputShowcase() {
  return (
    <div>
      <PageHeader name="NumberInput" description="Numeric input. Extends TextInput with type=number and step/min/max support." />
      <ShowcaseSection label="States">
        <DemoGrid cols={2} gap={12}>
          <DemoCard label="Default">
            <NumberInput placeholder="0" />
          </DemoCard>
          <DemoCard label="With value">
            <NumberInput defaultValue={42} />
          </DemoCard>
          <DemoCard label="With step">
            <NumberInput defaultValue={10} step={5} min={0} max={100} />
          </DemoCard>
          <DemoCard label="Error">
            <NumberInput placeholder="-1" error />
          </DemoCard>
          <DemoCard label="Disabled">
            <NumberInput defaultValue={0} disabled />
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="error" type="boolean" def="false" description="Error state" />
          <PropRow name="step" type="number" description="Step increment for up/down controls" />
          <PropRow name="min / max" type="number" description="Clamp the valid range" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function SelectShowcase() {
  return (
    <div>
      <PageHeader name="Select" description="Native <select> element with design system styling. Inherits all select HTML attributes." />
      <ShowcaseSection label="States">
        <DemoGrid cols={2} gap={12}>
          <DemoCard label="Default">
            <Select>
              <option value="">Choose…</option>
              <option value="a">Option A</option>
              <option value="b">Option B</option>
              <option value="c">Option C</option>
            </Select>
          </DemoCard>
          <DemoCard label="With selected value">
            <Select defaultValue="b">
              <option value="a">Option A</option>
              <option value="b">Option B</option>
              <option value="c">Option C</option>
            </Select>
          </DemoCard>
          <DemoCard label="Error">
            <Select error>
              <option value="">Required</option>
            </Select>
          </DemoCard>
          <DemoCard label="Disabled">
            <Select disabled>
              <option value="a">Locked value</option>
            </Select>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="error" type="boolean" def="false" description="Error state — rose border" />
          <PropRow name="...SelectHTMLAttributes" type="" description="All native select attributes" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function TriStateShowcase() {
  const [checked, setChecked] = useState(false)
  const [indeterminate, setIndeterminate] = useState(false)
  const mono = 'var(--font-mono, monospace)'
  const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'

  return (
    <div>
      <PageHeader name="TriState" description="Checkbox with three visual states: unchecked, indeterminate (–), and checked. Used for select-all rows in tables." />
      <ShowcaseSection label="All three states">
        <DemoRow gap={24}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <TriState defaultChecked={false} readOnly />
            <span style={{ fontSize: 13, color: fg2 }}>Unchecked</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <TriState indeterminate readOnly />
            <span style={{ fontSize: 13, color: fg2 }}>Indeterminate</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <TriState defaultChecked readOnly />
            <span style={{ fontSize: 13, color: fg2 }}>Checked</span>
          </label>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="Interactive">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <TriState checked={checked} indeterminate={indeterminate} onChange={e => setChecked(e.target.checked)} />
          <span style={{ fontSize: 13, color: fg2 }}>
            State: <span style={{ fontFamily: mono }}>{indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}</span>
          </span>
        </label>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="indeterminate" type="boolean" def="false" description="Shows the minus/dash indeterminate state" />
          <PropRow name="...InputHTMLAttributes" type="" description="All native checkbox input attributes (checked, onChange, disabled, etc.)" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function FieldShowcase() {
  return (
    <div>
      <PageHeader name="Field" description="Layout wrapper that adds a label, required marker, hint text, and error message to any input." />
      <ShowcaseSection label="Variants">
        <DemoGrid cols={2} gap={16}>
          <DemoCard label="With label">
            <Field label="Display name">
              <TextInput placeholder="Enter name…" />
            </Field>
          </DemoCard>
          <DemoCard label="Required">
            <Field label="Email" required>
              <TextInput placeholder="user@example.com" type="email" />
            </Field>
          </DemoCard>
          <DemoCard label="With hint">
            <Field label="Identifier" hint="Cannot be changed after creation">
              <TextInput placeholder="my_identifier" mono />
            </Field>
          </DemoCard>
          <DemoCard label="With error">
            <Field label="Email" required error="This field is required">
              <TextInput placeholder="user@example.com" error />
            </Field>
          </DemoCard>
          <DemoCard label="With Select">
            <Field label="Status">
              <Select>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </Select>
            </Field>
          </DemoCard>
          <DemoCard label="With TextArea">
            <Field label="Notes" hint="Optional">
              <TextArea placeholder="Add a description…" rows={3} />
            </Field>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="label" type="ReactNode" description="Label text rendered above the input" />
          <PropRow name="required" type="boolean" def="false" description="Shows a red asterisk after the label" />
          <PropRow name="hint" type="ReactNode" description="Secondary text shown inline after the label" />
          <PropRow name="error" type="ReactNode" description="Error message shown below the input in rose color" />
          <PropRow name="children" type="ReactNode" description="The input element" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
