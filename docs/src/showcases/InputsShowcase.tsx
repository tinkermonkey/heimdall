import { useState } from 'react'
import { TextInput, TextArea, NumberInput, Select, TriState, Field } from '@tinkermonkey/heimdall-ui'
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
          <DemoCard label="Mono font">
            <TextArea placeholder="SELECT * FROM entities&#10;WHERE active = true" mono rows={3} />
          </DemoCard>
          <DemoCard label="Mono + value">
            <TextArea defaultValue="life.organism&#10;cls_4f3a" mono rows={3} />
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="mono" type="boolean" def="false" description="Renders with JetBrains Mono font — for code and identifiers" />
          <PropRow name="error" type="boolean" def="false" description="Error state — rose border + focus ring" />
          <PropRow name="...TextareaHTMLAttributes" type="" description="All native textarea attributes (rows, cols, value, onChange, etc.)" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function NumberInputShowcase() {
  return (
    <div>
      <PageHeader name="NumberInput" description="Numeric input with design system styling. Extends the native <input type=number> element with step/min/max support." />
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
          <DemoCard label="Mono font">
            <NumberInput defaultValue={1024} mono />
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="mono" type="boolean" def="false" description="Renders with JetBrains Mono font — for numeric identifiers and code" />
          <PropRow name="error" type="boolean" def="false" description="Error state — rose border + focus ring" />
          <PropRow name="step" type="number" description="Step increment for up/down controls" />
          <PropRow name="min / max" type="number" description="Clamp the valid range" />
          <PropRow name="...InputHTMLAttributes" type="" description="All native input attributes (value, onChange, placeholder, disabled, etc.)" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function SelectShowcase() {
  const [multi, setMulti] = useState<string[]>(['a'])
  return (
    <div>
      <PageHeader name="Select" description="Custom dropdown styled to match the design system. Supports single and multi modes, item icons, descriptions, separators, section titles, disabled and danger states." />
      <ShowcaseSection label="States">
        <DemoGrid cols={2} gap={12}>
          <DemoCard label="Default">
            <Select placeholder="Choose…">
              <Select.Item value="a">Option A</Select.Item>
              <Select.Item value="b">Option B</Select.Item>
              <Select.Item value="c">Option C</Select.Item>
            </Select>
          </DemoCard>
          <DemoCard label="With selected value">
            <Select defaultValue="b">
              <Select.Item value="a">Option A</Select.Item>
              <Select.Item value="b">Option B</Select.Item>
              <Select.Item value="c">Option C</Select.Item>
            </Select>
          </DemoCard>
          <DemoCard label="Error">
            <Select error placeholder="Required">
              <Select.Item value="a">Option A</Select.Item>
            </Select>
          </DemoCard>
          <DemoCard label="Disabled">
            <Select disabled defaultValue="a">
              <Select.Item value="a">Locked value</Select.Item>
            </Select>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Item variants">
        <DemoGrid cols={2} gap={12}>
          <DemoCard label="With icons">
            <Select placeholder="Pick a status" defaultValue="ok">
              <Select.Item value="ok" icon="check">Healthy</Select.Item>
              <Select.Item value="warn" icon="alert">Warning</Select.Item>
              <Select.Item value="err" icon="x">Failed</Select.Item>
            </Select>
          </DemoCard>
          <DemoCard label="With descriptions">
            <Select placeholder="Choose a tier">
              <Select.Item value="free" description="No cost. Public projects only.">Free</Select.Item>
              <Select.Item value="pro" description="$10/mo. Private projects.">Pro</Select.Item>
              <Select.Item value="team" description="$25/mo. Includes seats.">Team</Select.Item>
            </Select>
          </DemoCard>
          <DemoCard label="With separator + section titles">
            <Select placeholder="Choose action">
              <Select.SectionTitle>Recent</Select.SectionTitle>
              <Select.Item value="open" icon="folder">Open project…</Select.Item>
              <Select.Item value="recent" icon="clock">Recent</Select.Item>
              <Select.Separator />
              <Select.SectionTitle>Other</Select.SectionTitle>
              <Select.Item value="settings" icon="settings">Settings</Select.Item>
              <Select.Item value="archive" icon="hardDrive" disabled>Archive (disabled)</Select.Item>
            </Select>
          </DemoCard>
          <DemoCard label="Multi-select (checkbox items)">
            <Select
              multiple
              values={multi}
              onValuesChange={setMulti}
              placeholder="None selected"
            >
              <Select.CheckboxItem value="a">Option A</Select.CheckboxItem>
              <Select.CheckboxItem value="b">Option B</Select.CheckboxItem>
              <Select.CheckboxItem value="c">Option C</Select.CheckboxItem>
              <Select.CheckboxItem value="d" description="With a description">Option D</Select.CheckboxItem>
            </Select>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="value" type="string" description="Controlled single value" />
          <PropRow name="defaultValue" type="string" description="Uncontrolled single value" />
          <PropRow name="onChange" type="(value: string) => void" description="Single-mode value change" />
          <PropRow name="multiple" type="boolean" def="false" description="Enable multi-select" />
          <PropRow name="values" type="string[]" description="Controlled multi values" />
          <PropRow name="defaultValues" type="string[]" description="Uncontrolled multi values" />
          <PropRow name="onValuesChange" type="(values: string[]) => void" description="Multi-mode values change" />
          <PropRow name="placeholder" type="string" def='"Select…"' description="Trigger text when no value" />
          <PropRow name="error" type="boolean" def="false" description="Error state — rose border + aria-invalid" />
          <PropRow name="disabled" type="boolean" def="false" description="Disable the trigger" />
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
      <ShowcaseSection label="Disabled">
        <DemoRow gap={24}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TriState defaultChecked={false} disabled />
            <span style={{ fontSize: 13, color: fg2 }}>Unchecked</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TriState indeterminate disabled />
            <span style={{ fontSize: 13, color: fg2 }}>Indeterminate</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TriState defaultChecked disabled />
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
              <Select placeholder="Choose…">
                <Select.Item value="active">Active</Select.Item>
                <Select.Item value="paused">Paused</Select.Item>
              </Select>
            </Field>
          </DemoCard>
          <DemoCard label="With TextArea">
            <Field label="Notes" hint="Optional">
              <TextArea placeholder="Add a description…" rows={3} />
            </Field>
          </DemoCard>
          <DemoCard label="Disabled">
            <Field label="Identifier" hint="Cannot be changed after creation" disabled>
              <TextInput placeholder="my_identifier" mono disabled />
            </Field>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="label" type="ReactNode" description="Label text rendered above the input" />
          <PropRow name="htmlFor" type="string" description="Associates the label with an input by id" />
          <PropRow name="required" type="boolean" def="false" description="Shows a red asterisk after the label" />
          <PropRow name="disabled" type="boolean" def="false" description="Dims label, hint, and error text at 45% opacity" />
          <PropRow name="hint" type="ReactNode" description="Secondary text shown inline after the label" />
          <PropRow name="error" type="ReactNode" description="Error message shown below the input in rose color" />
          <PropRow name="errorId" type="string" description="id applied to the error element for aria-describedby wiring" />
          <PropRow name="children" type="ReactNode" description="The input element" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
