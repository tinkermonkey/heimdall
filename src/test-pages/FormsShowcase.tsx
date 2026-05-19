import { useState } from 'react'
import {
  ShellLayout,
  EntityPicker,
  KeyValueEditor,
  OrderedList,
  RelationshipBuilder,
  RowMenu,
  PipelineCard,
  FormCallout,
} from '../index'
import type { EntityPickerResult, KeyValueRow, OrderedItem, RelationshipBuilderValue } from '../index'

export default function FormsShowcase() {
  // EntityPicker state
  const [entityQuery, setEntityQuery] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<EntityPickerResult | null>(null)
  const allEntities: EntityPickerResult[] = [
    { id: '1', label: 'users', domain: 'identity', domainColor: 'cyan' },
    { id: '2', label: 'accounts', domain: 'identity', domainColor: 'cyan' },
    { id: '3', label: 'products', domain: 'commerce', domainColor: 'emerald' },
    { id: '4', label: 'orders', domain: 'commerce', domainColor: 'emerald' },
    { id: '5', label: 'payments', domain: 'billing', domainColor: 'amber' },
  ]
  const filteredEntities = entityQuery
    ? allEntities.filter((e) => e.label.toLowerCase().includes(entityQuery.toLowerCase()))
    : []

  // KeyValueEditor state
  const [kvRows, setKvRows] = useState<KeyValueRow[]>([
    { id: '1', key: 'environment', value: 'production', datatype: 'string' },
    { id: '2', key: 'max_retries', value: '3', datatype: 'number' },
  ])

  // OrderedList state
  const [orderedItems, setOrderedItems] = useState<OrderedItem[]>([
    { id: '1', label: 'Initialize schema' },
    { id: '2', label: 'Migrate data' },
    { id: '3', label: 'Validate indexes' },
  ])

  // RelationshipBuilder state
  const [relationshipValue, setRelationshipValue] = useState<RelationshipBuilderValue>({
    source: undefined,
    predicate: 'contains',
    target: undefined,
  })
  const [sourceQuery, setSourceQuery] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const sourceResults = sourceQuery
    ? allEntities.filter((e) => e.label.toLowerCase().includes(sourceQuery.toLowerCase()))
    : []
  const targetResults = targetQuery
    ? allEntities.filter((e) => e.label.toLowerCase().includes(targetQuery.toLowerCase()))
    : []

  // RowMenu state
  const handleRowMenuAction = (actionId: string) => {
    console.log('Row menu action:', actionId)
  }

  const rowMenuActions = [
    { id: 'edit', label: 'Edit', icon: 'edit' as const },
    { id: 'duplicate', label: 'Duplicate', icon: 'copy' as const },
    { id: 'delete', label: 'Delete', icon: 'trash' as const, danger: true },
  ]

  return (
    <ShellLayout
      appTitle={{ title: 'Heimdall', version: 'v0.1.0' }}
      topbar={{
        breadcrumbs: [{ label: 'Components' }, { label: 'Forms' }],
      }}
      sidebar={{
        sections: [
          {
            title: 'Components',
            items: [
              { id: 'forms', label: 'Forms & Inputs', icon: 'component' },
            ],
          },
        ],
        activeItemId: 'forms',
      }}
    >
      <div style={{ maxWidth: '1200px', padding: '0 26px 32px' }}>
        {/* Entity Picker */}
        <section className="showcase-section" data-testid="forms-showcase-entity-picker">
          <h2 className="showcase-title">Entity Picker</h2>
          <FormCallout icon="info">
            Text input that filters a dropdown of results with domain-colored badges.
          </FormCallout>

          <div className="showcase-content">
            <EntityPicker
              query={entityQuery}
              onQueryChange={setEntityQuery}
              results={filteredEntities}
              onSelect={(entity) => {
                setSelectedEntity(entity)
                setEntityQuery('')
              }}
              onClear={() => {
                setSelectedEntity(null)
                setEntityQuery('')
              }}
              placeholder="Search entities..."
            />
            {selectedEntity && (
              <div style={{ marginTop: '12px', padding: '8px 10px', backgroundColor: '#f0f1f3', borderRadius: '4px' }}>
                Selected: {selectedEntity.domain}/{selectedEntity.label}
              </div>
            )}
          </div>
        </section>

        {/* KeyValueEditor */}
        <section className="showcase-section" data-testid="forms-showcase-key-value-editor">
          <h2 className="showcase-title">Key-Value Editor</h2>
          <FormCallout icon="info">
            Editable key/value row pairs with add-row and per-row remove. The `datatypeColumn` prop adds a third selector column.
          </FormCallout>

          <div className="showcase-content">
            <KeyValueEditor
              rows={kvRows}
              onChange={setKvRows}
              datatypeColumn={true}
              datatypes={['string', 'number', 'boolean', 'array']}
            />
          </div>
        </section>

        {/* OrderedList */}
        <section className="showcase-section" data-testid="forms-showcase-ordered-list">
          <h2 className="showcase-title">Ordered List</h2>
          <FormCallout icon="info">
            Ranked list with per-item move-up/move-down controls and a primary-item indicator using a star badge.
          </FormCallout>

          <div className="showcase-content">
            <OrderedList
              items={orderedItems}
              onChange={setOrderedItems}
              primaryItemId={orderedItems[0]?.id}
            />
          </div>
        </section>

        {/* RelationshipBuilder */}
        <section className="showcase-section" data-testid="forms-showcase-relationship-builder">
          <h2 className="showcase-title">Relationship Builder</h2>
          <FormCallout icon="info">
            Three-column layout composing source EntityPicker + predicate selector + target EntityPicker.
          </FormCallout>

          <div className="showcase-content">
            <RelationshipBuilder
              value={relationshipValue}
              onChange={setRelationshipValue}
              sourceResults={sourceResults}
              targetResults={targetResults}
              sourceQuery={sourceQuery}
              onSourceQueryChange={setSourceQuery}
              targetQuery={targetQuery}
              onTargetQueryChange={setTargetQuery}
              predicates={['contains', 'relates to', 'depends on', 'is used by', 'owns']}
              onSourceClear={() => {
                setSourceQuery('')
                setRelationshipValue({ ...relationshipValue, source: undefined })
              }}
              onTargetClear={() => {
                setTargetQuery('')
                setRelationshipValue({ ...relationshipValue, target: undefined })
              }}
            />
          </div>
        </section>

        {/* RowMenu */}
        <section className="showcase-section" data-testid="forms-showcase-row-menu">
          <h2 className="showcase-title">Row Menu</h2>
          <FormCallout icon="info">
            Trigger element opens a positioned dropdown containing action items. Danger-styled items render in rose text. Closes on outside click, Escape, or selection.
          </FormCallout>

          <div className="showcase-content">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span>Record #12345</span>
              <RowMenu
                actions={rowMenuActions}
                onAction={handleRowMenuAction}
              />
            </div>
          </div>
        </section>

        {/* PipelineCard */}
        <section className="showcase-section" data-testid="forms-showcase-pipeline-card">
          <h2 className="showcase-title">Pipeline Card</h2>
          <FormCallout icon="info">
            Sequential flow of named stage nodes connected by arrow connectors, with a status badge and statistics footer row.
          </FormCallout>

          <div className="showcase-content">
            <PipelineCard
              data-testid="pipeline-card-ingest"
              title="Ingest organisms · GBIF"
              description="Pull species records, normalize names, write to life.organism"
              stages={[
                { id: '1', name: 'GBIF API', label: 'source', icon: 'schema', status: 'success', statusColor: 'cyan' },
                { id: '2', name: 'Extract', label: '12 fields', icon: 'download', status: 'success', statusColor: 'violet' },
                { id: '3', name: 'Resolve', label: 'match by name', icon: 'lock', status: 'success', statusColor: 'amber' },
                { id: '4', name: 'Write', label: 'life.organism', icon: 'data', status: 'success', statusColor: 'emerald' },
              ]}
              statusLabel="healthy"
              stats={[
                { label: 'Last run', value: '2m ago' },
                { label: 'Records', value: '12,480' },
                { label: 'Status', value: 'healthy' },
              ]}
            />

            <PipelineCard
              title="Sync user profiles · OAuth"
              description="Fetch latest profile data from OAuth provider"
              stages={[
                { id: '1', name: 'Auth', label: 'pending', icon: 'lock', status: 'pending', statusColor: 'neutral' },
                { id: '2', name: 'Fetch', label: 'pending', icon: 'download', status: 'pending', statusColor: 'neutral' },
                { id: '3', name: 'Transform', label: 'pending', icon: 'edit', status: 'pending', statusColor: 'neutral' },
                { id: '4', name: 'Write', label: 'pending', icon: 'data', status: 'pending', statusColor: 'neutral' },
              ]}
              statusLabel="waiting"
              stats={[
                { label: 'Created', value: 'now' },
                { label: 'Est. time', value: '2m 30s' },
                { label: 'Status', value: 'queued' },
              ]}
            />

            <PipelineCard
              title="Process transactions · Stripe"
              description="Batch process pending transaction records"
              stages={[
                { id: '1', name: 'Query', label: 'completed', icon: 'schema', status: 'success', statusColor: 'cyan' },
                { id: '2', name: 'Validate', label: 'in progress', icon: 'check', status: 'running', statusColor: 'amber' },
                { id: '3', name: 'Post', label: 'pending', icon: 'send', status: 'pending', statusColor: 'neutral' },
                { id: '4', name: 'Archive', label: 'pending', icon: 'lock', status: 'pending', statusColor: 'neutral' },
              ]}
              statusLabel="running"
              stats={[
                { label: 'Started', value: '45s ago' },
                { label: 'Progress', value: '45%' },
                { label: 'Status', value: 'processing' },
              ]}
            />

            <PipelineCard
              title="Import compliance data"
              description="Ingest regulatory documentation from external source"
              stages={[
                { id: '1', name: 'Connect', label: 'completed', icon: 'link', status: 'success', statusColor: 'cyan' },
                { id: '2', name: 'Download', label: 'completed', icon: 'download', status: 'success', statusColor: 'violet' },
                { id: '3', name: 'Parse', label: 'failed', icon: 'alert', status: 'failed', statusColor: 'rose' },
                { id: '4', name: 'Write', label: 'cancelled', icon: 'x', status: 'failed', statusColor: 'rose' },
              ]}
              statusLabel="failed"
              stats={[
                { label: 'Failed', value: '2m ago' },
                { label: 'Completed', value: '2 of 4' },
                { label: 'Error', value: 'parsing_error' },
              ]}
            />
          </div>
        </section>

        {/* FormCallout */}
        <section className="showcase-section" data-testid="forms-showcase-form-callout">
          <h2 className="showcase-title">Form Callout</h2>
          <FormCallout icon="info">
            Icon + body text with inline code formatting (backtick-wrapped segments → monospace).
          </FormCallout>

          <div className="showcase-content">
            <FormCallout icon="info">
              The configuration file `config.yml` must be present in the root directory with valid YAML syntax.
            </FormCallout>

            <FormCallout icon="alert">
              Warning: Deleting the index `users_idx` will affect all `SELECT` queries on the users table.
            </FormCallout>

            <FormCallout>
              No icon provided: this callout displays without an icon placeholder gap.
            </FormCallout>
          </div>
        </section>
      </div>

      <style>{`
        .showcase-section {
          margin-bottom: 40px;
        }

        .showcase-title {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 600;
          color: #0f1729;
        }

        .showcase-content {
          margin-top: 16px;
          padding: 16px;
          background-color: #ffffff;
          border: 1px solid #e5e9ee;
          border-radius: 8px;
        }

        .showcase-content > * + * {
          margin-top: 16px;
        }
      `}</style>
    </ShellLayout>
  )
}
