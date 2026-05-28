import {
  ChartWrapper,
  Sparkline,
  LineChart,
  BarChart,
  BarV,
  BarH,
  StackedBar,
  Donut,
  PieChart,
  Heatmap,
  StatusTimeline,
  type SparklineColor,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const STATUS_COLORS: SparklineColor[] = ['emerald', 'amber', 'rose', 'cyan', 'violet', 'neutral']
const SERIES_A = [12, 18, 14, 22, 19, 26, 24, 31, 27, 33]
const SERIES_B = [22, 16, 19, 12, 18, 14, 24, 20, 28, 26]
const SERIES_C = [4, 8, 6, 12, 9, 14, 11, 16, 18, 22]

export function BareChartWrapper() {
  return (
    <BareSection name="ChartWrapper">
      <AxisRow label="default" align="stretch">
        <ChartWrapper label="Demo" width={200} height={80} viewBox="0 0 200 80">
          <rect x="0" y="0" width="200" height="80" fill="rgb(var(--canvas-bg-2))" />
          <polyline
            fill="none"
            stroke="rgb(var(--accent-primary))"
            strokeWidth={1.75}
            points="0,60 40,40 80,50 120,20 160,30 200,10"
          />
        </ChartWrapper>
      </AxisRow>
    </BareSection>
  )
}

export function BareSparkline() {
  return (
    <BareSection name="Sparkline">
      <AxisRow label="default" align="stretch">
        <Sparkline data={SERIES_A} />
      </AxisRow>
      <AxisRow label="color" align="stretch">
        {STATUS_COLORS.map(c => (
          <Caption key={c} label={c}><Sparkline data={SERIES_A} color={c} /></Caption>
        ))}
      </AxisRow>
      <AxisRow label="area=false" align="stretch">
        <Sparkline data={SERIES_A} area={false} />
      </AxisRow>
      <AxisRow label="size" align="stretch">
        <Caption label="60×20"><Sparkline data={SERIES_A} width={60} height={20} /></Caption>
        <Caption label="120×40"><Sparkline data={SERIES_A} width={120} height={40} /></Caption>
        <Caption label="200×60"><Sparkline data={SERIES_A} width={200} height={60} /></Caption>
      </AxisRow>
    </BareSection>
  )
}

export function BareLineChart() {
  return (
    <BareSection name="LineChart">
      <AxisRow label="default" align="stretch">
        <LineChart series={[SERIES_A]} />
      </AxisRow>
      <AxisRow label="multiple series" align="stretch">
        <LineChart series={[SERIES_A, SERIES_B, SERIES_C]} />
      </AxisRow>
      <AxisRow label="axes + grid" align="stretch">
        <LineChart series={[SERIES_A]} axes grid />
      </AxisRow>
      <AxisRow label="area" align="stretch">
        <LineChart series={[SERIES_A]} area />
      </AxisRow>
      <AxisRow label="with threshold" align="stretch">
        <LineChart series={[SERIES_A]} axes grid threshold={{ value: 25, label: 'limit' }} />
      </AxisRow>
      <AxisRow label="with markers" align="stretch">
        <LineChart
          series={[SERIES_A]}
          axes
          grid
          markers={[
            { x: 3, label: 'deploy' },
            { x: 7, label: 'spike' },
          ]}
        />
      </AxisRow>
    </BareSection>
  )
}

export function BareBarChart() {
  return (
    <BareSection name="BarChart">
      <AxisRow label="default" align="stretch">
        <BarChart series={[{ name: 'a', data: SERIES_A }]} />
      </AxisRow>
      <AxisRow label="multiple series" align="stretch">
        <BarChart
          series={[
            { name: 'a', data: SERIES_A, color: 'emerald' },
            { name: 'b', data: SERIES_B, color: 'cyan' },
          ]}
        />
      </AxisRow>
      <AxisRow label="with legend" align="stretch">
        <BarChart
          legend
          series={[
            { name: 'requests', data: SERIES_A, color: 'emerald' },
            { name: 'errors', data: SERIES_C, color: 'rose' },
          ]}
        />
      </AxisRow>
      <AxisRow label="with x labels" align="stretch">
        <BarChart
          xLabels={['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed']}
          series={[{ name: 'a', data: SERIES_A }]}
        />
      </AxisRow>
      <AxisRow label="empty" align="stretch">
        <BarChart series={[]} />
      </AxisRow>
    </BareSection>
  )
}

export function BareBarV() {
  return (
    <BareSection name="BarV">
      <AxisRow label="default" align="stretch">
        <BarV values={SERIES_A} />
      </AxisRow>
      <AxisRow label="axes + grid" align="stretch">
        <BarV values={SERIES_A} axes grid />
      </AxisRow>
      <AxisRow label="with threshold" align="stretch">
        <BarV values={SERIES_A} axes grid threshold={{ value: 24, label: 'limit' }} />
      </AxisRow>
      <AxisRow label="with x labels" align="stretch">
        <BarV
          values={SERIES_A}
          axes
          xLabels={['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed']}
        />
      </AxisRow>
    </BareSection>
  )
}

export function BareBarH() {
  const items = [
    { label: 'Schemas', value: 12 },
    { label: 'Records', value: 412 },
    { label: 'Pipelines', value: 8 },
    { label: 'Failures', value: 3 },
  ]
  return (
    <BareSection name="BarH">
      <AxisRow label="default" align="stretch">
        <BarH items={items} />
      </AxisRow>
      <AxisRow label="showValues=false" align="stretch">
        <BarH items={items} showValues={false} />
      </AxisRow>
      <AxisRow label="per-item color" align="stretch">
        <BarH
          items={[
            { label: 'ok', value: 80, color: 'rgb(16 185 129)' },
            { label: 'warn', value: 12, color: 'rgb(245 158 11)' },
            { label: 'fail', value: 3, color: 'rgb(244 63 94)' },
          ]}
        />
      </AxisRow>
    </BareSection>
  )
}

export function BareStackedBar() {
  const stacks = [
    { label: 'mon', parts: [8, 4, 2] },
    { label: 'tue', parts: [12, 6, 1] },
    { label: 'wed', parts: [9, 8, 3] },
    { label: 'thu', parts: [14, 7, 2] },
    { label: 'fri', parts: [11, 9, 4] },
  ]
  return (
    <BareSection name="StackedBar">
      <AxisRow label="default" align="stretch">
        <StackedBar stacks={stacks} />
      </AxisRow>
      <AxisRow label="axes + grid" align="stretch">
        <StackedBar stacks={stacks} axes grid />
      </AxisRow>
      <AxisRow label="normalized (100%)" align="stretch">
        <StackedBar stacks={stacks} axes grid normalized />
      </AxisRow>
    </BareSection>
  )
}

export function BareDonut() {
  return (
    <BareSection name="Donut">
      <AxisRow label="default" align="stretch">
        <Donut slices={[{ value: 64 }, { value: 22 }, { value: 14 }]} />
      </AxisRow>
      <AxisRow label="with center" align="stretch">
        <Donut
          slices={[{ value: 64 }, { value: 22 }, { value: 14 }]}
          centerValue="64%"
          centerLabel="ok"
        />
      </AxisRow>
      <AxisRow label="thickness" align="stretch">
        <Caption label="6"><Donut slices={[{ value: 50 }, { value: 30 }, { value: 20 }]} thickness={6} /></Caption>
        <Caption label="14 (default)"><Donut slices={[{ value: 50 }, { value: 30 }, { value: 20 }]} /></Caption>
        <Caption label="28"><Donut slices={[{ value: 50 }, { value: 30 }, { value: 20 }]} thickness={28} /></Caption>
      </AxisRow>
    </BareSection>
  )
}

export function BarePieChart() {
  const segments = [
    { name: 'a', value: 40 },
    { name: 'b', value: 30 },
    { name: 'c', value: 20 },
    { name: 'd', value: 10 },
  ]
  return (
    <BareSection name="PieChart">
      <AxisRow label="default" align="stretch">
        <PieChart segments={segments} />
      </AxisRow>
      <AxisRow label="with legend" align="stretch">
        <PieChart segments={segments} legend />
      </AxisRow>
    </BareSection>
  )
}

export function BareHeatmap() {
  const data = Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 12 }, (_, c) => Math.round((Math.sin((r + 1) * (c + 1) * 0.3) + 1) * 50)),
  )
  return (
    <BareSection name="Heatmap">
      <AxisRow label="default" align="stretch">
        <Heatmap data={data} />
      </AxisRow>
      <AxisRow label="with axes + labels" align="stretch">
        <Heatmap
          data={data}
          axes
          xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
          yLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
        />
      </AxisRow>
      <AxisRow label="with nulls" align="stretch">
        <Heatmap
          data={[
            [10, 20, null, 40, 50],
            [null, 30, 20, null, 60],
            [50, null, 40, 30, null],
          ]}
        />
      </AxisRow>
    </BareSection>
  )
}

export function BareStatusTimeline() {
  const tracks = [
    {
      label: 'api',
      segments: [
        { start: 0, end: 30, kind: 'ok' as const },
        { start: 30, end: 50, kind: 'warn' as const },
        { start: 50, end: 80, kind: 'ok' as const },
        { start: 80, end: 100, kind: 'error' as const },
      ],
    },
    {
      label: 'worker',
      segments: [
        { start: 0, end: 20, kind: 'idle' as const },
        { start: 20, end: 70, kind: 'ok' as const },
        { start: 70, end: 100, kind: 'info' as const },
      ],
    },
  ]
  return (
    <BareSection name="StatusTimeline">
      <AxisRow label="default" align="stretch">
        <StatusTimeline tracks={tracks} />
      </AxisRow>
      <AxisRow label="with axes + marker" align="stretch">
        <StatusTimeline
          tracks={tracks}
          axes
          xLabels={['00:00', '06:00', '12:00', '18:00', '24:00']}
          marker={{ x: 65, label: 'now' }}
        />
      </AxisRow>
    </BareSection>
  )
}
