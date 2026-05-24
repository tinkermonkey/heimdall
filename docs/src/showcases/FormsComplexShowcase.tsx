import { useState } from 'react'
import {
  EntityPicker,
  KeyValueEditor,
  OrderedList,
  RelationshipBuilder,
  RowMenu,
  PipelineCard,
  FormCallout,
  type EntityPickerResult,
  type KeyValueRow,
  type OrderedItem,
  type RelationshipBuilderValue,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'

const ALL_ENTITIES: EntityPickerResult[] = [
  { id: '1', label: 'users', domain: 'identity', domainColor: 'cyan' },
  { id: '2', label: 'accounts', domain: 'identity', domainColor: 'cyan' },
  { id: '3', label: 'products', domain: 'commerce', domainColor: 'emerald' },
  { id: '4', label: 'orders', domain: 'commerce', domainColor: 'emerald' },
  { id: '5', label: 'payments', domain: 'billing', domainColor: 'amber' },
]

export function EntityPickerShowcase() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<EntityPickerResult | null>(null)

  const results = query
    ? ALL_ENTITIES.filter(e => e.label.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <div>
      <PageHeader name="EntityPicker" description="Text input that filters a dropdown of entity results with domain-colored badges. Supports a selected state with clear." />
      <ShowcaseSection label="Picker" description="Start typing to see results (try 'user' or 'o').">
        <div style={{ maxWidth: 360 }}>
          <EntityPicker
            query={query}
            onQueryChange={setQuery}
            results={results}
            onSelect={e => { setSelected(e); setQuery('') }}
            onClear={() => { setSelected(null); setQuery('') }}
            placeholder="Search entities..."
          />
        </div>
        {selected && (
          <div style={{ marginTop: 10, fontSize: 12, color: fg2 }}>
            Selected: <span style={{ fontFamily: 'var(--font-mono)' }}>{selected.domain}/{selected.label}</span>
          </div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="query" type="string" description="Controlled search input value" />
          <PropRow name="onQueryChange" type="(q: string) => void" description="Called on every keystroke" />
          <PropRow name="results" type="EntityPickerResult[]" description="Filtered results to display in the dropdown" />
          <PropRow name="onSelect" type="(entity) => void" description="Called when user picks a result" />
          <PropRow name="onClear" type="() => void" description="Called when the × clear button is clicked" />
          <PropRow name="placeholder" type="string" description="Input placeholder text" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function KeyValueEditorShowcase() {
  const [rows, setRows] = useState<KeyValueRow[]>([
    { id: '1', key: 'environment', value: 'production', datatype: 'string' },
    { id: '2', key: 'max_retries', value: '3', datatype: 'number' },
  ])

  return (
    <div>
      <PageHeader name="KeyValueEditor" description="Editable key/value row pairs with add-row and per-row remove. Optional datatype column adds a third selector." />
      <ShowcaseSection label="With datatype column">
        <KeyValueEditor
          rows={rows}
          onChange={setRows}
          datatypeColumn
          datatypes={['string', 'number', 'boolean', 'array']}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Without datatype column">
        <KeyValueEditor
          rows={[{ id: 'a', key: 'host', value: 'localhost' }]}
          onChange={() => {}}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="rows" type="KeyValueRow[]" description="Array of {id, key, value, datatype?} rows" />
          <PropRow name="onChange" type="(rows: KeyValueRow[]) => void" description="Called whenever rows are added, removed, or edited" />
          <PropRow name="datatypeColumn" type="boolean" def="false" description="Show a datatype selector as a third column" />
          <PropRow name="datatypes" type="string[]" description="Options for the datatype selector" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function OrderedListShowcase() {
  const [items, setItems] = useState<OrderedItem[]>([
    { id: '1', label: 'Initialize schema' },
    { id: '2', label: 'Migrate data' },
    { id: '3', label: 'Validate indexes' },
    { id: '4', label: 'Run smoke tests' },
  ])

  return (
    <div>
      <PageHeader name="OrderedList" description="Ranked list with per-item move-up/move-down controls. The first item can be designated as 'primary' with a star badge." />
      <ShowcaseSection label="Reorderable list" description="Use the arrow buttons to reorder items.">
        <div style={{ maxWidth: 420 }}>
          <OrderedList items={items} onChange={setItems} primaryItemId={items[0]?.id} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="items" type="OrderedItem[]" description="Array of {id, label} items in display order" />
          <PropRow name="onChange" type="(items: OrderedItem[]) => void" description="Called whenever item order changes" />
          <PropRow name="primaryItemId" type="string" description="ID of the item to mark as primary with a star badge" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function RelationshipBuilderShowcase() {
  const [value, setValue] = useState<RelationshipBuilderValue>({
    source: undefined,
    predicate: 'contains',
    target: undefined,
  })
  const [sourceQuery, setSourceQuery] = useState('')
  const [targetQuery, setTargetQuery] = useState('')

  const sourceResults = sourceQuery
    ? ALL_ENTITIES.filter(e => e.label.toLowerCase().includes(sourceQuery.toLowerCase()))
    : []
  const targetResults = targetQuery
    ? ALL_ENTITIES.filter(e => e.label.toLowerCase().includes(targetQuery.toLowerCase()))
    : []

  return (
    <div>
      <PageHeader name="RelationshipBuilder" description="Three-column layout composing a source EntityPicker, predicate selector, and target EntityPicker into a single relationship definition." />
      <ShowcaseSection label="Build a relationship" description="Search source and target, then select a predicate.">
        <RelationshipBuilder
          value={value}
          onChange={setValue}
          sourceResults={sourceResults}
          targetResults={targetResults}
          sourceQuery={sourceQuery}
          onSourceQueryChange={setSourceQuery}
          targetQuery={targetQuery}
          onTargetQueryChange={setTargetQuery}
          predicates={['contains', 'relates to', 'depends on', 'is used by', 'owns']}
          onSourceClear={() => { setSourceQuery(''); setValue({ ...value, source: undefined }) }}
          onTargetClear={() => { setTargetQuery(''); setValue({ ...value, target: undefined }) }}
        />
        {value.source && value.target && (
          <div style={{ marginTop: 10, fontSize: 12, color: fg2 }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{value.source.label}</span>{' '}
            <em>{value.predicate}</em>{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>{value.target.label}</span>
          </div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="value" type="RelationshipBuilderValue" description="{source, predicate, target} — controlled state" />
          <PropRow name="onChange" type="(v) => void" description="Called whenever any field changes" />
          <PropRow name="sourceResults / targetResults" type="EntityPickerResult[]" description="Filtered results for the source / target pickers" />
          <PropRow name="sourceQuery / targetQuery" type="string" description="Controlled query for the source / target pickers" />
          <PropRow name="predicates" type="string[]" description="List of available predicate options" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function RowMenuShowcase() {
  const [lastAction, setLastAction] = useState<string | null>(null)

  const actions = [
    { id: 'edit', label: 'Edit', icon: 'edit' as const },
    { id: 'duplicate', label: 'Duplicate', icon: 'copy' as const },
    { id: 'delete', label: 'Delete', icon: 'trash' as const, danger: true },
  ]

  return (
    <div>
      <PageHeader name="RowMenu" description="Three-dot trigger that opens a positioned action dropdown. Danger-styled items render in rose text. Closes on outside click, Escape, or selection." />
      <ShowcaseSection label="In a table row context" description="Click the ⋯ button to open the menu.">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 12px', border: '1px solid rgb(var(--canvas-border, 229 231 235))', borderRadius: 6, maxWidth: 360 }}>
          <span style={{ fontSize: 13, color: fg2, flex: 1, fontFamily: 'var(--font-mono)' }}>record_12345</span>
          <RowMenu actions={actions} onAction={setLastAction} />
        </div>
        {lastAction && (
          <div style={{ marginTop: 8, fontSize: 12, color: fg2 }}>Last action: <em>{lastAction}</em></div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="actions" type="RowMenuAction[]" description="Array of {id, label, icon, danger?} action items" />
          <PropRow name="onAction" type="(id: string) => void" description="Called with the action ID when an item is selected" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

const CONTEXT_PIPELINE = {
  id: 'ctx_ingest_v2',
  name: 'ctx_ingest_v2',
  description: 'Ingests raw context files and persists structured records to the context store.',
  status: 'running' as const,
  target: 'context.records',
  flow: [
    {
      id: '1',
      name: 'parse',
      label: 'FileText',
      icon: (
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2 L6 2 C4.9 2 4 2.9 4 4 L4 20 C4 21.1 4.9 22 6 22 L18 22 C19.1 22 20 21.1 20 20 L20 8 Z M14 2 L14 8 L20 8 M16 13 L8 13 M16 17 L8 17 M10 9 L8 9" />
        </svg>
      ),
    },
    {
      id: '2',
      name: 'enrich',
      label: 'Zap',
      icon: (
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z" />
        </svg>
      ),
    },
    {
      id: '3',
      name: 'persist',
      label: 'HardDrive',
      icon: (
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12 L2 12 M2 9 C2 7.9 2.9 7 4 7 L20 7 C21.1 7 22 7.9 22 9 L22 19 C22 20.1 21.1 21 20 21 L4 21 C2.9 21 2 20.1 2 19 Z M6 17 L6.01 17" />
        </svg>
      ),
    },
    {
      id: '4',
      name: 'link',
      label: 'Link',
      icon: 'link' as const,
    },
  ],
  recent: { ingested: 4821, created: 4719, updated: 102, errors: 0 },
  lastRun: '12s ago',
  tags: ['nightly'],
}

export function PipelineCardShowcase() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div>
      <PageHeader name="PipelineCard" description="Card representing a pipeline with flow nodes, status, and statistics footer." />

      <ShowcaseSection label="Running pipeline">
        <PipelineCard
          pipeline={{
            id: 'data_migration_v2',
            name: 'data_migration_v2',
            status: 'running',
            target: 'analytics.events',
            flow: [
              { id: '1', name: 'validate', label: 'Validate', icon: 'check' },
              { id: '2', name: 'transform', label: 'Transform', icon: 'data' },
              { id: '3', name: 'load', label: 'Load', icon: 'upload' },
              { id: '4', name: 'verify', label: 'Verify', icon: 'eye' },
            ],
            recent: { ingested: 15000, created: 15000, updated: 0, errors: 0 },
            lastRun: '30s ago',
          }}
        />
      </ShowcaseSection>

      <ShowcaseSection label="Completed pipeline">
        <PipelineCard
          pipeline={{
            id: 'data_migration_v1',
            name: 'data_migration_v1',
            status: 'success',
            target: 'analytics.events',
            flow: [
              { id: '1', name: 'validate', label: 'Validate', icon: 'check' },
              { id: '2', name: 'transform', label: 'Transform', icon: 'data' },
              { id: '3', name: 'load', label: 'Load', icon: 'upload' },
              { id: '4', name: 'verify', label: 'Verify', icon: 'eye' },
            ],
            recent: { ingested: 12500, created: 12500, updated: 0, errors: 0 },
            lastRun: '2h ago',
          }}
        />
      </ShowcaseSection>

      <ShowcaseSection label="Failed pipeline">
        <PipelineCard
          pipeline={{
            id: 'data_migration_v3',
            name: 'data_migration_v3',
            status: 'failed',
            target: 'analytics.events',
            flow: [
              { id: '1', name: 'validate', label: 'Validate', icon: 'check' },
              { id: '2', name: 'transform', label: 'Transform', icon: 'data' },
              { id: '3', name: 'load', label: 'Load', icon: 'upload' },
              { id: '4', name: 'verify', label: 'Verify', icon: 'eye' },
            ],
            recent: { ingested: 0, created: 0, updated: 0, errors: 8 },
            lastRun: '5m ago',
          }}
        />
      </ShowcaseSection>

      <ShowcaseSection label="ReactElement stage icons">
        <PipelineCard
          pipeline={CONTEXT_PIPELINE}
          headerAction={
            <button
              type="button"
              style={{
                padding: '0 10px',
                height: 28,
                background: 'rgb(var(--accent-primary))',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Run now
            </button>
          }
        />
      </ShowcaseSection>

      <ShowcaseSection label="Custom footer content">
        <PipelineCard
          pipeline={{ ...CONTEXT_PIPELINE, id: 'ctx_nightly', name: 'ctx_nightly', status: 'idle' as const, lastRun: undefined }}
          footerContent={
            <div style={{ padding: '10px 16px', color: 'rgb(var(--canvas-fg-3))', fontSize: 12, fontStyle: 'italic' }}>
              No runs yet.
            </div>
          }
        />
      </ShowcaseSection>

      <ShowcaseSection label="Selected state (click to toggle)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(['ctx_ingest_v2', 'ctx_ingest_v1'] as const).map((id) => (
            <PipelineCard
              key={id}
              pipeline={{
                ...CONTEXT_PIPELINE,
                id,
                name: id,
                status: id === 'ctx_ingest_v1' ? 'success' as const : 'running' as const,
              }}
              selected={selectedId === id}
              onClick={() => setSelectedId(selectedId === id ? null : id)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="pipeline" type="object" description="Pipeline object with id, name, description, status, target, flow, recent, tags, lastRun" />
          <PropRow name="pipeline.id" type="string" description="Unique pipeline identifier" />
          <PropRow name="pipeline.name" type="string" description="Pipeline name (rendered monospace)" />
          <PropRow name="pipeline.description" type="string" description="Optional secondary description line" />
          <PropRow name="pipeline.status" type="'running' | 'success' | 'idle' | 'failed'" description="Overall pipeline status" />
          <PropRow name="pipeline.flow" type="FlowNode[]" description="Ordered stage nodes. Each node: { id, name, label?, icon: IconName | ReactElement }" />
          <PropRow name="pipeline.recent" type="object" description="Statistics object: ingested, created, updated, errors" />
          <PropRow name="onRun" type="() => void" description="Callback fired when Run button is clicked (hidden while running)" />
          <PropRow name="onCancel" type="() => void" description="Callback fired when Cancel button is clicked (shown while running)" />
          <PropRow name="headerAction" type="ReactNode" description="Element injected into the header action row alongside Run/Cancel/kebab" />
          <PropRow name="footerContent" type="ReactNode" description="Replaces the default stats grid when provided" />
          <PropRow name="selected" type="boolean" description="Applies amber border + glow ring — use for drawer-open or active selection state" />
          <PropRow name="compact" type="boolean" description="Compact variant for dense layouts" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function FormCalloutShowcase() {
  return (
    <div>
      <PageHeader name="FormCallout" description="Inline callout banner for contextual guidance within forms. Supports info, warn, and error variants." />
      <ShowcaseSection label="Variants">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520 }}>
          <FormCallout icon="info">
            This field is required before the pipeline can be submitted.
          </FormCallout>
          <FormCallout icon="alert">
            Changing this value will reset all downstream configurations.
          </FormCallout>
          <FormCallout icon="trash">
            Deleting this entity is permanent and cannot be undone.
          </FormCallout>
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="icon" type="IconName" description="Icon shown at the left edge of the callout" />
          <PropRow name="children" type="ReactNode" description="Callout body content" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
