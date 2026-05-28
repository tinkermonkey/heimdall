import {
  PageHeader,
  FilterBar,
  AlertStrip,
  ActivityTimeline,
  QuickAccessTile,
  QuickAccessGrid,
  ConfigTile,
  FormCallout,
  Button,
  type FormCalloutVariant,
  type AlertSeverity,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const FORM_CALLOUT_VARIANTS: FormCalloutVariant[] = ['info', 'warn', 'error']
const ALERT_SEVERITIES: AlertSeverity[] = ['error', 'warn', 'info', 'success']

export function BarePageHeader() {
  return (
    <BareSection name="PageHeader">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%' }}>
          <PageHeader title="Schemas" />
        </div>
      </AxisRow>
      <AxisRow label="with subtitle" align="stretch">
        <div style={{ width: '100%' }}>
          <PageHeader title="Schemas" subtitle="Organize records by class and inheritance." />
        </div>
      </AxisRow>
      <AxisRow label="with eyebrow + id" align="stretch">
        <div style={{ width: '100%' }}>
          <PageHeader eyebrow="Schema" title="Organism" idChip="cls_4f3a" />
        </div>
      </AxisRow>
      <AxisRow label="with actions" align="stretch">
        <div style={{ width: '100%' }}>
          <PageHeader
            title="Schemas"
            subtitle="3 active"
            actions={
              <>
                <Button variant="secondary">Export</Button>
                <Button>New schema</Button>
              </>
            }
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareFilterBar() {
  return (
    <BareSection name="FilterBar">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%' }}>
          <FilterBar />
        </div>
      </AxisRow>
      <AxisRow label="with filters" align="stretch">
        <div style={{ width: '100%' }}>
          <FilterBar
            filters={[
              { id: 'running', label: 'running' },
              { id: 'failed', label: 'failed' },
            ]}
          />
        </div>
      </AxisRow>
      <AxisRow label="with count" align="stretch">
        <div style={{ width: '100%' }}>
          <FilterBar
            filters={[{ id: 'running', label: 'running' }]}
            showingCount={12}
            totalCount={124}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareAlertStrip() {
  return (
    <BareSection name="AlertStrip">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%' }}>
          <AlertStrip />
        </div>
      </AxisRow>
      <AxisRow label="severity" align="stretch">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ALERT_SEVERITIES.map(severity => (
            <AlertStrip
              key={severity}
              alerts={[{ id: severity, severity, message: `Default ${severity} message.` }]}
            />
          ))}
        </div>
      </AxisRow>
      <AxisRow label="multiple" align="stretch">
        <div style={{ width: '100%' }}>
          <AlertStrip
            alerts={[
              { id: '1', severity: 'error', message: 'Schema build failed.' },
              { id: '2', severity: 'warn', message: 'Backfill incomplete.' },
              { id: '3', severity: 'info', message: 'New version available.' },
            ]}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareActivityTimeline() {
  const now = new Date()
  const ago = (mins: number) => new Date(now.getTime() - mins * 60_000)
  return (
    <BareSection name="ActivityTimeline">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%' }}>
          <ActivityTimeline />
        </div>
      </AxisRow>
      <AxisRow label="events" align="stretch">
        <div style={{ width: '100%' }}>
          <ActivityTimeline
            events={[
              { id: '1', type: 'create', subject: 'cls_organism', timestamp: ago(2), kindLabel: 'schema' },
              { id: '2', type: 'update', subject: 'cls_climate', timestamp: ago(12), kindLabel: 'schema', meta: 'fields: 8 → 9' },
              { id: '3', type: 'run', subject: 'ingest_v2', timestamp: ago(34), kindLabel: 'pipeline', dotColor: 'cyan' },
              { id: '4', type: 'delete', subject: 'cls_legacy', timestamp: ago(120), kindLabel: 'schema', dotColor: 'rose' },
            ]}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareQuickAccessTile() {
  return (
    <BareSection name="QuickAccessTile">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 240 }}>
          <QuickAccessTile icon="schema" title="Schemas" />
        </div>
      </AxisRow>
      <AxisRow label="with description" align="stretch">
        <div style={{ width: 240 }}>
          <QuickAccessTile icon="pipeline" title="Pipelines" description="4 active" />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareQuickAccessGrid() {
  return (
    <BareSection name="QuickAccessGrid">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%' }}>
          <QuickAccessGrid
            tiles={[
              { id: 'schemas', icon: 'schema', title: 'Schemas', description: '12 classes' },
              { id: 'data', icon: 'data', title: 'Data', description: '412 records' },
              { id: 'pipelines', icon: 'pipeline', title: 'Pipelines', description: '4 active' },
              { id: 'graph', icon: 'graph', title: 'Graph', description: 'Topology view' },
            ]}
          />
        </div>
      </AxisRow>
      <AxisRow label="columns=2" align="stretch">
        <div style={{ width: '100%' }}>
          <QuickAccessGrid
            columns={2}
            tiles={[
              { id: 'a', icon: 'schema', title: 'A', description: 'desc a' },
              { id: 'b', icon: 'data', title: 'B', description: 'desc b' },
            ]}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareConfigTile() {
  return (
    <BareSection name="ConfigTile">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 320 }}>
          <ConfigTile icon="settings" title="Workspace" />
        </div>
      </AxisRow>
      <AxisRow label="with description" align="stretch">
        <div style={{ width: 320 }}>
          <ConfigTile icon="gitBranch" title="Git" description="Repository connection" />
        </div>
      </AxisRow>
      <AxisRow label="with summary" align="stretch">
        <div style={{ width: 360 }}>
          <ConfigTile
            icon="lock"
            title="Access"
            description="Permissions and visibility"
            summary={[
              { label: 'role', value: 'admin' },
              { label: 'visibility', value: 'private' },
            ]}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareFormCallout() {
  return (
    <BareSection name="FormCallout">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 480 }}>
          <FormCallout>Default callout text with `code` segments.</FormCallout>
        </div>
      </AxisRow>
      <AxisRow label="variant" align="stretch">
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FORM_CALLOUT_VARIANTS.map(v => (
            <FormCallout key={v} variant={v}>
              {`${v}: a short message about the form state.`}
            </FormCallout>
          ))}
        </div>
      </AxisRow>
      <AxisRow label="with icon" align="stretch">
        <div style={{ width: 480 }}>
          <FormCallout icon="info">Callout with an explicit icon.</FormCallout>
        </div>
      </AxisRow>
    </BareSection>
  )
}
