import {
  StatTile,
  StatGrid,
  Table,
  MetricRow,
  KVGrid,
  ProgressBar,
  type ProgressBarColor,
  type Column,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const STATUS_COLORS: ProgressBarColor[] = ['emerald', 'amber', 'rose', 'cyan', 'violet', 'neutral']

const SPARK = [12, 18, 14, 22, 19, 26, 24, 31, 27, 33]

export function BareStatTile() {
  return (
    <BareSection name="StatTile">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 220 }}>
          <StatTile label="Throughput" value="1,284" />
        </div>
      </AxisRow>
      <AxisRow label="color" align="stretch">
        {STATUS_COLORS.map(c => (
          <Caption key={c} label={c}>
            <div style={{ width: 200 }}>
              <StatTile label={c} value="42" color={c} />
            </div>
          </Caption>
        ))}
      </AxisRow>
      <AxisRow label="with delta" align="stretch">
        <Caption label="up">
          <div style={{ width: 200 }}>
            <StatTile label="Records" value="12,401" delta={{ value: 8.4, label: '24h', direction: 'up' }} color="emerald" />
          </div>
        </Caption>
        <Caption label="down">
          <div style={{ width: 200 }}>
            <StatTile label="Errors" value="42" delta={{ value: 12.1, label: '24h', direction: 'down' }} color="rose" />
          </div>
        </Caption>
      </AxisRow>
      <AxisRow label="with icon" align="stretch">
        <div style={{ width: 220 }}>
          <StatTile label="Active" value="231" icon="zap" color="amber" />
        </div>
      </AxisRow>
      <AxisRow label="with sparkline" align="stretch">
        <div style={{ width: 220 }}>
          <StatTile label="Trend" value="33" sparkData={SPARK} color="cyan" />
        </div>
      </AxisRow>
      <AxisRow label="with meta" align="stretch">
        <div style={{ width: 220 }}>
          <StatTile label="Uptime" value="99.92%" meta="last 30 days" metaIcon="clock" color="emerald" />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareStatGrid() {
  return (
    <BareSection name="StatGrid">
      <AxisRow label="default (4 cols)" align="stretch">
        <div style={{ width: '100%' }}>
          <StatGrid>
            <StatTile label="Records" value="12,401" color="emerald" />
            <StatTile label="Pipelines" value="14" color="cyan" />
            <StatTile label="Errors" value="3" color="rose" />
            <StatTile label="Latency" value="42ms" color="amber" />
          </StatGrid>
        </div>
      </AxisRow>
      <AxisRow label="columns=3" align="stretch">
        <div style={{ width: '100%' }}>
          <StatGrid columns={3}>
            <StatTile label="A" value="1" />
            <StatTile label="B" value="2" />
            <StatTile label="C" value="3" />
          </StatGrid>
        </div>
      </AxisRow>
      <AxisRow label="columns=2" align="stretch">
        <div style={{ width: '100%' }}>
          <StatGrid columns={2}>
            <StatTile label="Left" value="L" />
            <StatTile label="Right" value="R" />
          </StatGrid>
        </div>
      </AxisRow>
    </BareSection>
  )
}

interface Row {
  id: string
  name: string
  status: string
  count: number
}

const TABLE_DATA: Row[] = [
  { id: 'cls_4f3a', name: 'cls_organism', status: 'running', count: 1284 },
  { id: 'cls_92a1', name: 'cls_climate', status: 'idle', count: 412 },
  { id: 'cls_77fd', name: 'cls_software', status: 'failed', count: 3 },
]

const TABLE_COLUMNS: Column<Row>[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'count', label: 'Count', sortable: true },
]

export function BareTable() {
  return (
    <BareSection name="Table">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%' }}>
          <Table columns={TABLE_COLUMNS} data={TABLE_DATA} rowKey="id" />
        </div>
      </AxisRow>
      <AxisRow label="selectable" align="stretch">
        <div style={{ width: '100%' }}>
          <Table columns={TABLE_COLUMNS} data={TABLE_DATA} rowKey="id" selectable />
        </div>
      </AxisRow>
      <AxisRow label="empty" align="stretch">
        <div style={{ width: '100%' }}>
          <Table columns={TABLE_COLUMNS} data={[]} rowKey="id" />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareMetricRow() {
  return (
    <BareSection name="MetricRow">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 480 }}>
          <MetricRow label="CPU" value={42} unit="%" percent={42} />
        </div>
      </AxisRow>
      <AxisRow label="color" align="stretch">
        {STATUS_COLORS.map(c => (
          <Caption key={c} label={c}>
            <div style={{ width: 360 }}>
              <MetricRow label={c} value={60} unit="%" percent={60} color={c} />
            </div>
          </Caption>
        ))}
      </AxisRow>
      <AxisRow label="with sparkline" align="stretch">
        <div style={{ width: 480 }}>
          <MetricRow label="Throughput" value={1284} unit="rps" percent={64} sparklineData={SPARK} color="cyan" />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareKVGrid() {
  return (
    <BareSection name="KVGrid">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 420 }}>
          <KVGrid
            rows={[
              { key: 'id', value: 'cls_4f3a' },
              { key: 'name', value: 'cls_organism' },
              { key: 'status', value: 'running' },
              { key: 'created', value: '2026-03-12' },
            ]}
          />
        </div>
      </AxisRow>
      <AxisRow label="empty" align="stretch">
        <div style={{ width: 420 }}>
          <KVGrid rows={[]} />
        </div>
      </AxisRow>
      <AxisRow label="keyWidth=140" align="stretch">
        <div style={{ width: 420 }}>
          <KVGrid
            keyWidth={140}
            rows={[
              { key: 'long key name', value: 'compact' },
              { key: 'another', value: 'value' },
            ]}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareProgressBar() {
  return (
    <BareSection name="ProgressBar">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 320 }}>
          <ProgressBar percent={42} />
        </div>
      </AxisRow>
      <AxisRow label="color" align="stretch">
        {STATUS_COLORS.map(c => (
          <Caption key={c} label={c}>
            <div style={{ width: 240 }}>
              <ProgressBar percent={64} color={c} />
            </div>
          </Caption>
        ))}
      </AxisRow>
      <AxisRow label="percent" align="stretch">
        {[0, 25, 50, 75, 100].map(p => (
          <Caption key={p} label={`${p}%`}>
            <div style={{ width: 200 }}>
              <ProgressBar percent={p} />
            </div>
          </Caption>
        ))}
      </AxisRow>
      <AxisRow label="height" align="stretch">
        <Caption label="2px"><div style={{ width: 240 }}><ProgressBar percent={50} height={2} /></div></Caption>
        <Caption label="6px (default)"><div style={{ width: 240 }}><ProgressBar percent={50} height={6} /></div></Caption>
        <Caption label="12px"><div style={{ width: 240 }}><ProgressBar percent={50} height={12} /></div></Caption>
      </AxisRow>
    </BareSection>
  )
}
