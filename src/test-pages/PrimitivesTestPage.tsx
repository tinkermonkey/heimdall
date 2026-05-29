import { useState } from 'react'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { Badge } from '../components/Badge'
import { TextInput } from '../components/TextInput'
import { TextArea } from '../components/TextArea'
import { NumberInput } from '../components/NumberInput'
import { Select } from '../components/Select'
import { TriState } from '../components/TriState'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { VersionPill } from '../components/VersionPill'
import { SegmentedControl } from '../components/SegmentedControl'

export default function PrimitivesTestPage() {
  const [selectedCheckbox, setSelectedCheckbox] = useState(false)
  const [segmentedValue, setSegmentedValue] = useState<string | number>('all')

  return (
    <div style={{ padding: '22px 28px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <section style={{ marginBottom: '32px' }}>
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
          Icon Component
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Icon name="check" size={24} />
          <Icon name="plus" size={24} />
          <Icon name="chevronUp" size={24} />
          <Icon name="chevronDown" size={24} />
          <Icon name="folder" size={24} />
          <Icon name="tag" size={24} />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Button Component · All Variants
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Chip Component · Semantic Variants
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Chip variant="cyan">
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
            cyan
          </Chip>
          <Chip variant="amber">
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
            amber
          </Chip>
          <Chip variant="violet">
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
            violet
          </Chip>
          <Chip variant="emerald">
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
            emerald
          </Chip>
          <Chip variant="rose">
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
            rose
          </Chip>
          <Chip variant="neutral">
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'currentColor' }} />
            gray
          </Chip>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Badge Component · Status Indicators
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge color="cyan" />
          <Badge color="emerald" />
          <Badge color="amber" />
          <Badge color="rose" />
          <Badge color="violet" />
          <Badge color="cyan" pulse />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Input Components
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
          <TextInput placeholder="Default input" defaultValue="default value" />
          <TextInput placeholder="Error input" defaultValue="error value" className="error" />
          <TextInput placeholder="Disabled input" defaultValue="disabled" disabled />
          <TextInput placeholder="Monospace input" defaultValue="mono_value" className="mono" />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          TextArea Component
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
          <TextArea placeholder="Default textarea">Sample text</TextArea>
          <TextArea placeholder="Error textarea" className="error">
            Error message here
          </TextArea>
          <TextArea placeholder="Disabled textarea" disabled>
            Disabled text
          </TextArea>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          NumberInput Component
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
          <NumberInput placeholder="Default number" defaultValue="42" />
          <NumberInput placeholder="Error number" defaultValue="999" className="error" />
          <NumberInput placeholder="Disabled number" defaultValue="10" disabled />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Select Component
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
          <Select defaultValue="2">
            <Select.Item value="1">Option 1</Select.Item>
            <Select.Item value="2">Option 2</Select.Item>
            <Select.Item value="3">Option 3</Select.Item>
          </Select>
          <Select error defaultValue="b">
            <Select.Item value="a">Option A</Select.Item>
            <Select.Item value="b">Option B</Select.Item>
          </Select>
          <Select disabled defaultValue="y">
            <Select.Item value="x">Option X</Select.Item>
            <Select.Item value="y">Option Y</Select.Item>
          </Select>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          TriState Checkbox Component
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <TriState checked={false} onChange={() => {}} />
          <TriState checked={true} onChange={() => {}} />
          <TriState checked={selectedCheckbox} onChange={(e) => setSelectedCheckbox(e.target.checked)} indeterminate />
          <TriState checked={false} onChange={() => {}} disabled />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          VersionPill Component
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <VersionPill>v1</VersionPill>
          <VersionPill>v3</VersionPill>
          <VersionPill>v12</VersionPill>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          SegmentedControl Component
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SegmentedControl
            value={segmentedValue}
            onChange={setSegmentedValue}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
          <SegmentedControl
            value={segmentedValue}
            onChange={setSegmentedValue}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
            ]}
          />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
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
          Field Wrapper Component
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '300px' }}>
          <Field label="Class name" required hint="snake_case">
            <TextInput defaultValue="organism" />
          </Field>
          <Field label="Description" hint="Markdown supported">
            <TextInput defaultValue="Organism model" />
          </Field>
          <Field label="Email" required error="Please enter a valid email address">
            <TextInput defaultValue="invalid" />
          </Field>
        </div>
      </section>
    </div>
  )
}
