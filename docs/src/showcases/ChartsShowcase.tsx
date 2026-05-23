import {
  Sparkline,
  LineChart,
  BarChart,
  BarV,
  BarH,
  StackedBar,
  Donut,
  Heatmap,
  StatusTimeline,
  PieChart,
  ProgressBar,
  MetricRow,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, DemoGrid, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

const chartBg = 'rgb(var(--canvas-surface-2, 243 244 246))'
const darkBg  = '#0B1426'

// ── Shared data ──────────────────────────────────────────────────────────────
const LINE  = [12, 14, 13, 16, 19, 17, 21, 24, 22, 27, 31, 28, 34, 38, 36, 42, 45, 48, 46, 52]
const LINE2 = [22, 24, 25, 24, 26, 28, 27, 30, 29, 31, 30, 33, 34, 32, 35, 37, 36, 39, 41, 40]
const BAR   = [82, 64, 91, 47, 73, 88, 56, 79, 95, 68, 72, 84]
const BAR_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const BAR_H_ITEMS = [
  { label: 'nyx',    value: 92, color: '#22D3EE' },
  { label: 'aether', value: 78, color: '#818CF8' },
  { label: 'vega',   value: 64, color: '#F59E0B' },
  { label: 'helios', value: 41, color: '#10B981' },
]
const STACKS = [
  { label: 'Mon', parts: [42, 28, 14, 8] },
  { label: 'Tue', parts: [48, 31, 12, 11] },
  { label: 'Wed', parts: [38, 26, 18, 9] },
  { label: 'Thu', parts: [52, 34, 9, 14] },
  { label: 'Fri', parts: [61, 30, 11, 7] },
  { label: 'Sat', parts: [44, 24, 8, 5] },
  { label: 'Sun', parts: [31, 22, 6, 4] },
]
const DONUT_SLICES = [
  { value: 134, color: '#10B981' },
  { value: 72,  color: '#818CF8' },
  { value: 45,  color: '#22D3EE' },
  { value: 16,  color: '#F59E0B' },
]
const HEATMAP = (() => {
  const rows = []
  for (let r = 0; r < 7; r++) {
    const row = []
    for (let c = 0; c < 24; c++) {
      const m = Math.sin((c - 8) / 24 * Math.PI) * 0.5 + 0.5
      const e = Math.exp(-Math.pow(c - 20, 2) / 8) * 0.8
      const wknd = (r === 5 || r === 6) ? 0.7 : 1
      row.push(Math.max(0, (m * 0.4 + e * 0.6) * wknd * 0.9))
    }
    rows.push(row)
  }
  return rows
})()
const TIMELINE = [
  { label: 'graph daemon', segments: [
    { start: 0, end: 22, kind: 'ok' as const },
    { start: 22, end: 28, kind: 'warn' as const },
    { start: 28, end: 64, kind: 'ok' as const },
    { start: 64, end: 68, kind: 'error' as const },
    { start: 68, end: 100, kind: 'ok' as const },
  ]},
  { label: 'pubmed_genes', segments: [
    { start: 0, end: 14, kind: 'idle' as const },
    { start: 14, end: 38, kind: 'info' as const },
    { start: 38, end: 41, kind: 'idle' as const },
    { start: 41, end: 86, kind: 'info' as const },
    { start: 86, end: 100, kind: 'idle' as const },
  ]},
  { label: 'nyx.lab', segments: [{ start: 0, end: 100, kind: 'ok' as const }]},
  { label: 'vega.lab', segments: [
    { start: 0, end: 48, kind: 'ok' as const },
    { start: 48, end: 56, kind: 'error' as const },
    { start: 56, end: 100, kind: 'warn' as const },
  ]},
]

// ─────────────────────────────────────────────────────────────────────────────

export function SparklineShowcase() {
  return (
    <div>
      <PageHeader name="Sparkline" description="88×28 shape-only trend line. Single series, inherits host domain color. No axes, no labels — shape only." />
      <ShowcaseSection label="Canonical series palette">
        <DemoGrid cols={6} gap={16}>
          {[
            { c: '#22D3EE', n: 'cyan' },
            { c: '#10B981', n: 'emerald' },
            { c: '#F59E0B', n: 'amber' },
            { c: '#818CF8', n: 'indigo' },
            { c: '#8B5CF6', n: 'violet' },
            { c: '#F43F5E', n: 'rose' },
          ].map(({ c, n }) => (
            <DemoCard key={n} label={n}>
              <Sparkline data={LINE} color={c} />
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="StatusColor backward compat">
        <DemoGrid cols={5} gap={16}>
          {(['emerald', 'amber', 'rose', 'cyan', 'neutral'] as const).map(color => (
            <DemoCard key={color} label={color}>
              <Sparkline data={LINE} color={color} />
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="data" type="number[]" description="Values to plot" />
          <PropRow name="color" type="string" def="'emerald'" description="StatusColor name or hex string" />
          <PropRow name="area" type="boolean" def="true" description="Show gradient area fill" />
          <PropRow name="width" type="number" def="88" description="SVG width" />
          <PropRow name="height" type="number" def="28" description="SVG height" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function LineChartShowcase() {
  return (
    <div>
      <PageHeader name="LineChart" description="Continuous change over time. Four tiers: micro (shape), standard (+axes +grid), feature (+tooltip +markers +threshold)." />
      <ShowcaseSection label="Micro — shape only">
        <DemoCard>
          <div style={{ background: chartBg, padding: 12, borderRadius: 6, display: 'inline-block' }}>
            <LineChart series={[LINE]} colors={['#10B981']} area
              width={200} height={72} padding={{ top: 6, right: 6, bottom: 6, left: 6 }} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Standard — axes + grid + threshold">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <LineChart series={[LINE]} colors={['#F59E0B']} area
              width={480} height={220} axes grid ticks={4}
              xLabels={['W1','W4','W8','W12','W16','W20']}
              threshold={{ value: 40, label: 'target' }} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Feature — multi-series + tooltip + markers">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <LineChart series={[LINE, LINE2]} colors={['#22D3EE','#818CF8']} area
              width={720} height={320} axes grid ticks={5}
              xLabels={['W1','W4','W8','W12','W16','W20']}
              threshold={{ value: 40, label: 'target' }}
              markers={[{ x: 8, label: 'release 1.4' }]}
              tooltip />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Dark canvas">
        <DemoCard>
          <div style={{ background: darkBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <LineChart series={[LINE, LINE2]} colors={['#22D3EE','#818CF8']} area
              width={480} height={200} axes grid ticks={4}
              xLabels={['W1','W6','W12','W18']}
              threshold={{ value: 40, label: 'target' }}
              tone="dark" />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="series" type="number[][]" description="Each inner array is one series" />
          <PropRow name="colors" type="string[]" description="Hex color per series (defaults to canonical palette)" />
          <PropRow name="area" type="boolean" def="false" description="Gradient area fill" />
          <PropRow name="axes" type="boolean" def="false" description="Show axis lines + tick labels" />
          <PropRow name="grid" type="boolean" def="false" description="Horizontal grid lines" />
          <PropRow name="ticks" type="number" def="4" description="Y-axis tick count" />
          <PropRow name="threshold" type="{ value, label? }" description="Dashed threshold line" />
          <PropRow name="markers" type="{ x, label? }[]" description="Vertical event markers" />
          <PropRow name="tooltip" type="boolean" def="false" description="Feature-tier hover card" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function BarVShowcase() {
  return (
    <div>
      <PageHeader name="BarV" description="Single-series vertical bar chart. Discrete categories — always start y-axis at zero." />
      <ShowcaseSection label="Micro">
        <DemoCard>
          <div style={{ background: chartBg, padding: 12, borderRadius: 6, display: 'inline-block' }}>
            <BarV values={BAR} color="#10B981" width={180} height={64} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Standard — axes + grid + threshold">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <BarV values={BAR} xLabels={BAR_MONTHS} color="#10B981"
              width={480} height={200} axes grid ticks={4}
              threshold={{ value: 80, label: 'sla' }} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="values" type="number[]" description="Data values (y-axis always starts at 0)" />
          <PropRow name="xLabels" type="string[]" description="X-axis tick labels" />
          <PropRow name="color" type="string" description="Bar fill hex color (default amber)" />
          <PropRow name="axes" type="boolean" def="false" description="Show axis lines + tick labels" />
          <PropRow name="grid" type="boolean" def="false" description="Horizontal grid lines" />
          <PropRow name="threshold" type="{ value, label? }" description="Dashed threshold line" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function BarHShowcase() {
  return (
    <div>
      <PageHeader name="BarH" description="Horizontal bar chart for ranked categories with labels — hostnames, top-N lists." />
      <ShowcaseSection label="Standard">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <BarH items={BAR_H_ITEMS} width={320} height={140} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Feature">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <BarH items={BAR_H_ITEMS} width={460} height={180} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="items" type="{ label, value, color? }[]" description="Ranked items. Color defaults to canonical palette." />
          <PropRow name="showValues" type="boolean" def="true" description="Show value label after each bar" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function StackedBarShowcase() {
  return (
    <div>
      <PageHeader name="StackedBar" description="Composition over time. Up to 4 segments. Use normalized mode when totals diverge." />
      <ShowcaseSection label="Standard — absolute">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <StackedBar stacks={STACKS} width={320} height={140} axes grid ticks={3} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Feature — normalized (100 %)">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <StackedBar stacks={STACKS} width={480} height={180} axes grid ticks={4} normalized />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="stacks" type="{ label, parts: number[] }[]" description="Each stack has a label and array of part values" />
          <PropRow name="colors" type="string[]" description="Hex colors per part (defaults to canonical palette)" />
          <PropRow name="normalized" type="boolean" def="false" description="Percent-normalize all stacks to 100 %" />
          <PropRow name="axes" type="boolean" def="false" description="Show axis lines + labels" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function DonutShowcase() {
  return (
    <div>
      <PageHeader name="Donut" description="Composition at a glance. Max 5 slices. Always show total in the center." />
      <ShowcaseSection label="Micro">
        <DemoCard>
          <div style={{ background: chartBg, padding: 12, borderRadius: 6, display: 'inline-block' }}>
            <Donut slices={DONUT_SLICES} width={84} height={84} thickness={9} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Standard — with center value">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
              centerValue="267" centerLabel="ind." />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Feature — dark canvas">
        <DemoCard>
          <div style={{ background: darkBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
              centerValue="267" centerLabel="ind." tone="dark" />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="slices" type="{ value, color? }[]" description="Max 5 slices (6th+ should be merged as 'other')" />
          <PropRow name="thickness" type="number" def="14" description="Ring width in pixels" />
          <PropRow name="centerValue" type="string" description="Bold number in the ring center" />
          <PropRow name="centerLabel" type="string" description="Mono label below center value" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function HeatmapShowcase() {
  return (
    <div>
      <PageHeader name="Heatmap" description="Two-dimensional density — calendar/hour, host/metric. Single-hue scale of the domain color." />
      <ShowcaseSection label="Standard — 7 × 24 (emerald)">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <Heatmap data={HEATMAP} width={320} height={110}
              baseColor="#10B981" axes
              yLabels={['M','T','W','T','F','S','S']}
              xLabels={['0','','','','','','6','','','','','','12','','','','','','18','','','','','23']} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Feature — 7 × 24 (cyan)">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <Heatmap data={HEATMAP} width={460} height={140}
              baseColor="#22D3EE" axes
              yLabels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
              xLabels={['0','','','','','','6','','','','','','12','','','','','','18','','','','','23']} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="data" type="number[][]" description="2-D array [rows][cols]" />
          <PropRow name="baseColor" type="string" def="'#10B981'" description="Hex color for the hot end of the single-hue scale" />
          <PropRow name="xLabels / yLabels" type="string[]" description="Axis tick labels (requires axes=true)" />
          <PropRow name="axes" type="boolean" def="false" description="Show axis labels" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function StatusTimelineShowcase() {
  return (
    <div>
      <PageHeader name="StatusTimeline" description="Status of N services across a time window. Color = semantic status: ok / warn / error / idle / info." />
      <ShowcaseSection label="Standard — 4 tracks">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <StatusTimeline tracks={TIMELINE} width={480} height={150} range={[0,100]} axes
              xLabels={['-24h','-18','-12','-6','now']} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Feature — with event marker">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <StatusTimeline tracks={TIMELINE} width={720} height={180} range={[0,100]} axes
              xLabels={['-24h','-20','-16','-12','-8','-4','now']}
              marker={{ x: 64, label: 'incident #142' }} />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="tracks" type="{ label, segments: { start, end, kind }[] }[]" description="One track per service/host" />
          <PropRow name="range" type="[number, number]" def="[0, 100]" description="Numeric time range" />
          <PropRow name="xLabels" type="string[]" description="X-axis time labels (requires axes=true)" />
          <PropRow name="marker" type="{ x, label? }" description="Amber vertical event marker" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function BarChartShowcase() {
  return (
    <div>
      <PageHeader name="BarChart" description="Grouped multi-series vertical bar chart (legacy). For single-series use BarV; for stacked use StackedBar." />
      <ShowcaseSection label="Grouped bars">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6 }}>
            <BarChart
              series={[
                { name: 'Requests', data: [120, 145, 130, 170, 200], color: 'amber' as const },
                { name: 'Errors',   data: [8, 12, 10, 14, 6],       color: 'rose' as const },
              ]}
              xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May']}
              yMin={0} yMax={220} yTickCount={6} legend
              width={480} height={250} />
          </div>
        </DemoCard>
      </ShowcaseSection>
    </div>
  )
}

export function PieChartShowcase() {
  return (
    <div>
      <PageHeader name="PieChart" description="Solid-wedge pie chart (legacy). Use Donut for the ring variant specified in the v2.4 chart spec." />
      <ShowcaseSection label="Distribution">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <PieChart
              segments={[
                { name: 'CPU Bound', value: 35, color: 'rgb(245, 158, 11)' },
                { name: 'I/O Wait',  value: 25, color: 'rgb(16, 185, 129)' },
                { name: 'Memory',    value: 20, color: 'rgb(244, 63, 94)' },
                { name: 'Network',   value: 20, color: 'rgb(34, 211, 238)' },
              ]}
              legend width={280} height={280} />
          </div>
        </DemoCard>
      </ShowcaseSection>
    </div>
  )
}

export function ProgressBarShowcase() {
  return (
    <div>
      <PageHeader name="ProgressBar" description="Horizontal fill bar with five color variants. Clamps to 0–100; handles NaN gracefully." />
      <ShowcaseSection label="All variants">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
          {[
            { label: '0% — emerald',  percent: 0,   color: 'emerald'  as const },
            { label: '25% — cyan',    percent: 25,  color: 'cyan'     as const },
            { label: '50% — amber',   percent: 50,  color: 'amber'    as const },
            { label: '75% — rose',    percent: 75,  color: 'rose'     as const },
            { label: '100% — neutral',percent: 100, color: 'neutral'  as const },
          ].map(({ label, percent, color }) => (
            <div key={label}>
              <div style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-2))', marginBottom: 4 }}>{label}</div>
              <ProgressBar percent={percent} color={color} />
            </div>
          ))}
        </div>
      </ShowcaseSection>
    </div>
  )
}

export function MetricRowShowcase() {
  return (
    <div>
      <PageHeader name="MetricRow" description="Composite row combining label, progress bar, sparkline trend, and value. Used for live resource metrics." />
      <ShowcaseSection label="Resource metrics">
        <div style={{ background: chartBg, padding: 16, borderRadius: 6, maxWidth: 560 }}>
          <MetricRow label="CPU Usage"   value={72}   unit="%" percent={72} sparklineData={[45,52,48,65,72,68,75,70,72,68]} color="amber" />
          <MetricRow label="Memory"      value={1084} unit="MB" percent={45} sparklineData={[890,920,950,1000,1050,1080,1084,1075,1070,1065]} color="emerald" />
          <MetricRow label="Network I/O" value={234}  unit="Mbps" percent={85} sparklineData={[150,180,200,220,210,230,234,225,220,215]} color="cyan" />
          <MetricRow label="Error Rate"  value={5}    unit="%" percent={5} sparklineData={[2,3,2,4,5,4,3,5,4,2]} color="rose" />
        </div>
      </ShowcaseSection>
    </div>
  )
}

export function ChartsOverviewShowcase() {
  return (
    <div>
      <PageHeader
        name="Charts"
        description="8 chart types across 4 tiers (sparkline → micro → standard → feature). Canonical series palette: cyan → emerald → amber → indigo → violet → rose. Light + dark canvas."
      />
      <ShowcaseSection label="Sparklines — canonical palette">
        <DemoGrid cols={6} gap={16}>
          {[
            { c: '#22D3EE', n: 'cyan' }, { c: '#10B981', n: 'emerald' },
            { c: '#F59E0B', n: 'amber' }, { c: '#818CF8', n: 'indigo' },
            { c: '#8B5CF6', n: 'violet' }, { c: '#F43F5E', n: 'rose' },
          ].map(({ c, n }) => (
            <DemoCard key={n} label={n}>
              <Sparkline data={LINE} color={c} />
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Line chart — feature tier">
        <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
          <LineChart series={[LINE, LINE2]} colors={['#22D3EE','#818CF8']} area
            width={720} height={320} axes grid ticks={5}
            xLabels={['W1','W4','W8','W12','W16','W20']}
            threshold={{ value: 40, label: 'target' }}
            markers={[{ x: 8, label: 'release 1.4' }]}
            tooltip />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Bar (vertical) + Bar (horizontal)">
        <DemoGrid cols={2} gap={16}>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <BarV values={BAR} xLabels={BAR_MONTHS} color="#10B981"
              width={360} height={160} axes grid ticks={3}
              threshold={{ value: 80, label: 'sla' }} />
          </div>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <BarH items={BAR_H_ITEMS} width={320} height={140} />
          </div>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Stacked bar + Donut">
        <DemoGrid cols={2} gap={16}>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <StackedBar stacks={STACKS} width={320} height={160} axes grid ticks={3} />
          </div>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
              centerValue="267" centerLabel="ind." />
          </div>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Heatmap + StatusTimeline">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <Heatmap data={HEATMAP} width={460} height={140}
              baseColor="#22D3EE" axes
              yLabels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
              xLabels={['0','','','','','','6','','','','','','12','','','','','','18','','','','','23']} />
          </div>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <StatusTimeline tracks={TIMELINE} width={720} height={180} range={[0,100]} axes
              xLabels={['-24h','-20','-16','-12','-8','-4','now']}
              marker={{ x: 64, label: 'incident #142' }} />
          </div>
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Progress bars">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
          {([
            [0, 'emerald'], [33, 'cyan'], [66, 'amber'], [100, 'rose'],
          ] as [number, 'emerald' | 'cyan' | 'amber' | 'rose'][]).map(([p, c]) => (
            <ProgressBar key={p} percent={p} color={c} />
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Metric rows">
        <div style={{ background: chartBg, padding: 16, borderRadius: 6, maxWidth: 560 }}>
          <MetricRow label="CPU" value={72} unit="%" percent={72} sparklineData={[45,52,48,65,72]} color="amber" />
          <MetricRow label="Memory" value={62} unit="%" percent={62} sparklineData={[55,58,60,62,61]} color="emerald" />
          <MetricRow label="Network" value={85} unit="%" percent={85} sparklineData={[60,70,75,80,85]} color="cyan" />
        </div>
      </ShowcaseSection>
    </div>
  )
}
