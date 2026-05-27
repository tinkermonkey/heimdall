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
      appTitle={{ title: 'Heimdall', version: 'v0.3.0' }}
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
            Sequential flow of named nodes connected by arrow connectors, with status badge, target, tags, and statistics footer row.
          </FormCallout>

          <div className="showcase-content">
            <PipelineCard
              data-testid="pipeline-card-ingest"
              pipeline={{
                id: 'ingest_gbif_v2',
                name: 'Ingest organisms',
                description: 'Pull species records, normalize names, write to life.organism',
                status: 'success',
                target: 'life.organism',
                flow: [
                  { id: '1', name: 'GBIF API', label: 'source', icon: 'schema', color: 'cyan' },
                  { id: '2', name: 'Extract', label: '12 fields', icon: 'download', color: 'violet' },
                  { id: '3', name: 'Resolve', label: 'match by name', icon: 'lock', color: 'amber' },
                  { id: '4', name: 'Write', label: 'life.organism', icon: 'data', color: 'emerald' },
                ],
                recent: { ingested: 12480, created: 12480, updated: 0, errors: 0 },
                tags: ['prod', 'critical'],
                lastRun: '2m ago',
              }}
              onRun={() => console.log('Run clicked')}
            />

            <PipelineCard
              flowLayout="auto"
              pipeline={{
                id: 'oauth_sync_v1',
                name: 'Sync user profiles',
                description: 'Fetch latest profile data from OAuth provider',
                status: 'idle',
                target: 'identity.user',
                flow: [
                  { id: '1', name: 'Auth', label: 'pending', icon: 'lock' },
                  { id: '2', name: 'Fetch', label: 'pending', icon: 'download' },
                  { id: '3', name: 'Transform', label: 'pending', icon: 'edit' },
                  { id: '4', name: 'Write', label: 'pending', icon: 'data' },
                ],
                recent: { ingested: 0, created: 0, updated: 0, errors: 0 },
                tags: ['scheduled'],
                lastRun: '1h ago',
              }}
              onRun={() => console.log('Run clicked')}
            />

            <PipelineCard
              pipeline={{
                id: 'stripe_tx_v3',
                name: 'Process transactions',
                description: 'Batch process pending transaction records',
                status: 'running',
                target: 'billing.transaction',
                flow: [
                  { id: '1', name: 'Query', label: 'completed', icon: 'schema' },
                  { id: '2', name: 'Validate', label: 'in progress', icon: 'check' },
                  { id: '3', name: 'Post', label: 'pending', icon: 'send' },
                  { id: '4', name: 'Archive', label: 'pending', icon: 'lock' },
                ],
                recent: { ingested: 8500, created: 8500, updated: 0, errors: 2 },
                tags: ['stripe', 'async'],
                lastRun: '45s ago',
              }}
              onCancel={() => console.log('Cancel clicked')}
            />

            <PipelineCard
              pipeline={{
                id: 'compliance_import_v2',
                name: 'Import compliance data',
                description: 'Ingest regulatory documentation from external source',
                status: 'failed',
                target: 'legal.compliance',
                flow: [
                  { id: '1', name: 'Connect', label: 'completed', icon: 'link' },
                  { id: '2', name: 'Download', label: 'completed', icon: 'download' },
                  { id: '3', name: 'Parse', label: 'failed', icon: 'alert' },
                  { id: '4', name: 'Write', label: 'cancelled', icon: 'x' },
                ],
                recent: { ingested: 0, created: 0, updated: 0, errors: 5 },
                tags: ['compliance', 'critical'],
                lastRun: '2m ago',
              }}
              onRun={() => console.log('Run clicked')}
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
