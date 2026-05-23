import { Sparkline } from '../components/Sparkline'
import { LineChart } from '../components/LineChart'
import { BarV } from '../components/BarV'
import { BarH } from '../components/BarH'
import { StackedBar } from '../components/StackedBar'
import { Donut } from '../components/Donut'
import { Heatmap } from '../components/Heatmap'
import { StatusTimeline } from '../components/StatusTimeline'
import { ProgressBar } from '../components/ProgressBar'
import { MetricRow } from '../components/MetricRow'

// ── Sample data ──────────────────────────────────────────────────────────────
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
    { start: 0,  end: 22, kind: 'ok' as const },
    { start: 22, end: 28, kind: 'warn' as const },
    { start: 28, end: 64, kind: 'ok' as const },
    { start: 64, end: 68, kind: 'error' as const },
    { start: 68, end: 100, kind: 'ok' as const },
  ]},
  { label: 'pubmed_genes', segments: [
    { start: 0,  end: 14, kind: 'idle' as const },
    { start: 14, end: 38, kind: 'info' as const },
    { start: 38, end: 41, kind: 'idle' as const },
    { start: 41, end: 86, kind: 'info' as const },
    { start: 86, end: 100, kind: 'idle' as const },
  ]},
  { label: 'nyx.lab', segments: [
    { start: 0, end: 100, kind: 'ok' as const },
  ]},
  { label: 'vega.lab', segments: [
    { start: 0,  end: 48, kind: 'ok' as const },
    { start: 48, end: 56, kind: 'error' as const },
    { start: 56, end: 100, kind: 'warn' as const },
  ]},
]

// ── Layout helpers ────────────────────────────────────────────────────────────
const monoLabel = (text: string) => (
  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'rgb(var(--canvas-fg-3))', marginBottom: '14px' }}>
    {text}
  </div>
)
const section = { marginBottom: '40px' }
const bg = { backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh', padding: '22px 28px' }
const card = { background: 'rgb(var(--canvas-card))', border: '1px solid rgb(var(--canvas-border))',
  borderRadius: '8px', padding: '16px', display: 'inline-block' }
const darkCard = { background: '#0B1426', border: '1px solid #243763', borderRadius: '8px',
  padding: '16px', display: 'inline-block' }

export default function ChartsTestPage() {
  return (
    <div style={bg}>

      {/* ── 1. Sparkline ────────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('Sparkline · Color Variants')}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {(['#22D3EE','#10B981','#F59E0B','#818CF8','#8B5CF6','#F43F5E'] as const).map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Sparkline data={LINE} color={c} data-testid={`sparkline-${i}`} />
            </div>
          ))}
        </div>
        {monoLabel('Sparkline · StatusColor backward compat')}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {(['emerald','amber','rose','cyan','neutral'] as const).map(c => (
            <Sparkline key={c} data={LINE} color={c} data-testid={`sparkline-${c}`} />
          ))}
        </div>
        {monoLabel('Sparkline · No area')}
        <Sparkline data={LINE} color="#22D3EE" area={false} data-testid="sparkline-no-area" />
      </section>

      {/* ── 2. LineChart ────────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('LineChart · Micro (no axes)')}
        <div style={card}>
          <LineChart series={[LINE]} colors={['#10B981']} area
            width={200} height={72}
            padding={{ top: 6, right: 6, bottom: 6, left: 6 }}
            data-testid="linechart-micro" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('LineChart · Standard (axes + grid + threshold)')}
        <div style={card}>
          <LineChart series={[LINE]} colors={['#F59E0B']} area
            width={480} height={220} axes grid ticks={4}
            xLabels={['W1','W4','W8','W12','W16','W20']}
            threshold={{ value: 40, label: 'target' }}
            data-testid="linechart-standard" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('LineChart · Feature (multi-series + markers + tooltip)')}
        <div style={card}>
          <LineChart series={[LINE, LINE2]} colors={['#22D3EE','#818CF8']} area
            width={720} height={320} axes grid ticks={5}
            xLabels={['W1','W4','W8','W12','W16','W20']}
            threshold={{ value: 40, label: 'target' }}
            markers={[{ x: 8, label: 'release 1.4' }]}
            tooltip
            data-testid="linechart-feature" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('LineChart · Dark canvas')}
        <div style={darkCard}>
          <LineChart series={[LINE, LINE2]} colors={['#22D3EE','#818CF8']} area
            width={480} height={200} axes grid ticks={4}
            xLabels={['W1','W6','W12','W18']}
            threshold={{ value: 40, label: 'target' }}
            tone="dark"
            data-testid="linechart-dark" />
        </div>
      </section>

      {/* ── 3. BarV ─────────────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('BarV · Micro')}
        <div style={card}>
          <BarV values={BAR} color="#10B981" width={180} height={64} data-testid="barv-micro" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('BarV · Standard (axes + grid + threshold)')}
        <div style={card}>
          <BarV values={BAR} xLabels={BAR_MONTHS} color="#10B981"
            width={480} height={200} axes grid ticks={4}
            threshold={{ value: 80, label: 'sla' }}
            data-testid="barv-standard" />
        </div>
      </section>

      {/* ── 4. BarH ─────────────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('BarH · Standard')}
        <div style={card}>
          <BarH items={BAR_H_ITEMS} width={320} height={140} data-testid="barh-standard" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('BarH · Feature')}
        <div style={card}>
          <BarH items={BAR_H_ITEMS} width={460} height={180} data-testid="barh-feature" />
        </div>
      </section>

      {/* ── 5. StackedBar ───────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('StackedBar · Standard absolute')}
        <div style={card}>
          <StackedBar stacks={STACKS} width={320} height={140} axes grid ticks={3}
            data-testid="stackedbar-standard" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('StackedBar · Feature normalized')}
        <div style={card}>
          <StackedBar stacks={STACKS} width={480} height={180} axes grid ticks={4} normalized
            data-testid="stackedbar-normalized" />
        </div>
      </section>

      {/* ── 6. Donut ────────────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('Donut · Micro')}
        <div style={card}>
          <Donut slices={DONUT_SLICES} width={84} height={84} thickness={9} data-testid="donut-micro" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('Donut · Standard with center value')}
        <div style={card}>
          <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
            centerValue="267" centerLabel="ind."
            data-testid="donut-standard" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('Donut · Single slice (full circle)')}
        <div style={card}>
          <Donut slices={[{ value: 1 }]} width={84} height={84} thickness={9}
            centerValue="100%" data-testid="donut-single" />
        </div>
      </section>

      {/* ── 7. Heatmap ──────────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('Heatmap · Standard 7×24')}
        <div style={card}>
          <Heatmap data={HEATMAP} width={320} height={110}
            baseColor="#10B981" axes
            yLabels={['M','T','W','T','F','S','S']}
            xLabels={['0','','','','','','6','','','','','','12','','','','','','18','','','','','23']}
            data-testid="heatmap-standard" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('Heatmap · Feature 7×24')}
        <div style={card}>
          <Heatmap data={HEATMAP} width={460} height={140}
            baseColor="#22D3EE" axes
            yLabels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
            xLabels={['0','','','','','','6','','','','','','12','','','','','','18','','','','','23']}
            data-testid="heatmap-feature" />
        </div>
      </section>

      {/* ── 8. StatusTimeline ───────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('StatusTimeline · Standard 4 tracks')}
        <div style={card}>
          <StatusTimeline tracks={TIMELINE} width={480} height={150} range={[0,100]} axes
            xLabels={['-24h','-18','-12','-6','now']}
            data-testid="timeline-standard" />
        </div>
      </section>

      <section style={section}>
        {monoLabel('StatusTimeline · Feature with marker')}
        <div style={card}>
          <StatusTimeline tracks={TIMELINE} width={720} height={180} range={[0,100]} axes
            xLabels={['-24h','-20','-16','-12','-8','-4','now']}
            marker={{ x: 64, label: 'incident #142' }}
            data-testid="timeline-feature" />
        </div>
      </section>

      {/* ── 9. ProgressBar ──────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('ProgressBar · All variants')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
          <ProgressBar percent={0}   color="emerald" data-testid="progress-0" />
          <ProgressBar percent={25}  color="cyan"    data-testid="progress-25" />
          <ProgressBar percent={50}  color="amber"   data-testid="progress-50" />
          <ProgressBar percent={75}  color="rose"    data-testid="progress-75" />
          <ProgressBar percent={100} color="neutral" data-testid="progress-100" />
          <ProgressBar percent={NaN} color="emerald" data-testid="progress-nan" />
        </div>
      </section>

      {/* ── 10. MetricRow ───────────────────────────────────────────────── */}
      <section style={section}>
        {monoLabel('MetricRow · Resource metrics')}
        <div style={{ background: 'rgb(var(--canvas-surface-2))', padding: '16px', borderRadius: '6px', maxWidth: '600px' }}>
          <MetricRow label="CPU Usage"   value={72}   unit="%" percent={72} sparklineData={[45,52,48,65,72,68,75,70,72,68]} color="amber"   data-testid="metric-row-cpu" />
          <MetricRow label="Memory"      value={1084} unit="MB" percent={45} sparklineData={[890,920,950,1000,1050,1080,1084,1075,1070,1065]} color="emerald" data-testid="metric-row-memory" />
          <MetricRow label="Network I/O" value={234}  unit="Mbps" percent={85} sparklineData={[150,180,200,220,210,230,234,225,220,215]} color="cyan"    data-testid="metric-row-network" />
          <MetricRow label="Error Rate"  value={5}    unit="%" percent={5} sparklineData={[2,3,2,4,5,4,3,5,4,2]} color="rose"    data-testid="metric-row-error" />
        </div>
      </section>

    </div>
  )
}
