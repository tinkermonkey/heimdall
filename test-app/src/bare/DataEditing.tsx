import { useState } from 'react'
import {
  KeyValueEditor,
  OrderedList,
  EntityPicker,
  RelationshipBuilder,
  RowMenu,
  type KeyValueRow,
  type OrderedItem,
  type EntityPickerResult,
  type RelationshipBuilderValue,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const SEED_ROWS: KeyValueRow[] = [
  { id: '1', key: 'name', value: 'cls_organism' },
  { id: '2', key: 'kind', value: 'class' },
  { id: '3', key: 'version', value: '4' },
]

export function BareKeyValueEditor() {
  const [rows, setRows] = useState<KeyValueRow[]>(SEED_ROWS)
  const [typed, setTyped] = useState<KeyValueRow[]>([
    { id: '1', key: 'count', value: '42', datatype: 'number' },
    { id: '2', key: 'enabled', value: 'true', datatype: 'boolean' },
  ])
  return (
    <BareSection name="KeyValueEditor">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 560 }}>
          <KeyValueEditor rows={rows} onChange={setRows} />
        </div>
      </AxisRow>
      <AxisRow label="empty" align="stretch">
        <div style={{ width: 560 }}>
          <KeyValueEditor rows={[]} onChange={() => {}} />
        </div>
      </AxisRow>
      <AxisRow label="with datatype column" align="stretch">
        <div style={{ width: 640 }}>
          <KeyValueEditor rows={typed} onChange={setTyped} datatypeColumn />
        </div>
      </AxisRow>
      <AxisRow label="disabled" align="stretch">
        <div style={{ width: 560 }}>
          <KeyValueEditor rows={SEED_ROWS} onChange={() => {}} disabled />
        </div>
      </AxisRow>
    </BareSection>
  )
}

const SEED_ITEMS: OrderedItem[] = [
  { id: '1', label: 'name' },
  { id: '2', label: 'kind' },
  { id: '3', label: 'version' },
  { id: '4', label: 'created_at' },
]

export function BareOrderedList() {
  const [items, setItems] = useState<OrderedItem[]>(SEED_ITEMS)
  return (
    <BareSection name="OrderedList">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 420 }}>
          <OrderedList items={items} onChange={setItems} />
        </div>
      </AxisRow>
      <AxisRow label="with primary" align="stretch">
        <div style={{ width: 420 }}>
          <OrderedList items={SEED_ITEMS} onChange={() => {}} primaryItemId="1" />
        </div>
      </AxisRow>
      <AxisRow label="disabled" align="stretch">
        <div style={{ width: 420 }}>
          <OrderedList items={SEED_ITEMS} onChange={() => {}} disabled />
        </div>
      </AxisRow>
    </BareSection>
  )
}

const ALL_ENTITIES: EntityPickerResult[] = [
  { id: 'cls_organism', label: 'cls_organism', domain: 'life', domainColor: 'emerald' },
  { id: 'cls_climate', label: 'cls_climate', domain: 'climate', domainColor: 'cyan' },
  { id: 'cls_software', label: 'cls_software', domain: 'software', domainColor: 'violet' },
  { id: 'cls_event', label: 'cls_event', domain: 'life', domainColor: 'emerald' },
]

function filterEntities(query: string): EntityPickerResult[] {
  if (!query) return ALL_ENTITIES
  const q = query.toLowerCase()
  return ALL_ENTITIES.filter(e => e.label.toLowerCase().includes(q))
}

export function BareEntityPicker() {
  const [query, setQuery] = useState('')
  return (
    <BareSection name="EntityPicker">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 420 }}>
          <EntityPicker
            query={query}
            onQueryChange={setQuery}
            results={filterEntities(query)}
            onSelect={() => setQuery('')}
            onClear={() => setQuery('')}
          />
        </div>
      </AxisRow>
      <AxisRow label="disabled" align="stretch">
        <div style={{ width: 420 }}>
          <EntityPicker
            query=""
            onQueryChange={() => {}}
            results={[]}
            onSelect={() => {}}
            onClear={() => {}}
            disabled
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareRelationshipBuilder() {
  const [value, setValue] = useState<RelationshipBuilderValue>({ predicate: 'contains' })
  const [sourceQ, setSourceQ] = useState('')
  const [targetQ, setTargetQ] = useState('')
  return (
    <BareSection name="RelationshipBuilder">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 720 }}>
          <RelationshipBuilder
            value={value}
            onChange={setValue}
            sourceQuery={sourceQ}
            onSourceQueryChange={setSourceQ}
            sourceResults={filterEntities(sourceQ)}
            targetQuery={targetQ}
            onTargetQueryChange={setTargetQ}
            targetResults={filterEntities(targetQ)}
            onSourceClear={() => setValue(v => ({ ...v, source: undefined }))}
            onTargetClear={() => setValue(v => ({ ...v, target: undefined }))}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareRowMenu() {
  return (
    <BareSection name="RowMenu">
      <AxisRow label="default">
        <RowMenu
          actions={[
            { id: 'edit', label: 'Edit', icon: 'edit' },
            { id: 'copy', label: 'Duplicate', icon: 'copy' },
            { type: 'separator' },
            { id: 'delete', label: 'Delete', icon: 'trash', danger: true },
          ]}
          onAction={() => {}}
        />
      </AxisRow>
      <AxisRow label="with disabled item">
        <RowMenu
          actions={[
            { id: 'a', label: 'Available' },
            { id: 'b', label: 'Unavailable', disabled: true },
          ]}
          onAction={() => {}}
        />
      </AxisRow>
      <AxisRow label="custom trigger icon">
        <Caption label="moreHorizontal">
          <RowMenu
            triggerIcon="moreHorizontal"
            actions={[
              { id: 'a', label: 'One' },
              { id: 'b', label: 'Two' },
            ]}
            onAction={() => {}}
          />
        </Caption>
      </AxisRow>
    </BareSection>
  )
}
