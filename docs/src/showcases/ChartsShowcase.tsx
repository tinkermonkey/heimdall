import {
  ChartWrapper,
  Sparkline,
  LineChart,
  BarChart,
  BarV,
  BarH,
  StackedBar,
  Donut,
  Heatmap,
  StatusTimeline,
  ProgressBar,
  MetricRow,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, DemoGrid, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

// ── Canvas surfaces ───────────────────────────────────────────────────────────
const darkBg = '#0B1426'
const darkBorder = '#243763'

// ── Shared sample data ────────────────────────────────────────────────────────
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
  const rows: number[][] = []
  for (let r = 0; r < 7; r++) {
    const row: number[] = []
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
  { label: 'nyx.lab',  segments: [{ start: 0, end: 100, kind: 'ok' as const }] },
  { label: 'vega.lab', segments: [
    { start: 0, end: 48, kind: 'ok' as const },
    { start: 48, end: 56, kind: 'error' as const },
    { start: 56, end: 100, kind: 'warn' as const },
  ]},
]
const X_LABELS_20 = ['W1','W4','W8','W12','W16','W20']
const X_HOURS = ['0','','','','','','6','','','','','','12','','','','','','18','','','','','23']

// ── Layout helpers ────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: 'sparkline' | 'micro' | 'standard' | 'feature' }) {
  const map: Record<string, [string, string]> = {
    sparkline: ['#22D3EE', 'rgba(34,211,238,0.12)'],
    micro:     ['#10B981', 'rgba(16,185,129,0.12)'],
    standard:  ['#F59E0B', 'rgba(245,158,11,0.12)'],
    feature:   ['#818CF8', 'rgba(129,140,248,0.12)'],
  }
  const [color, bg] = map[tier]
  return (
    <span style={{
      fontFamily: 'var(--font-mono, monospace)', fontSize: 9, fontWeight: 500,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '2px 5px', borderRadius: 3,
      background: bg, color,
    }}>{tier}</span>
  )
}

function TierLabel({ tier, caption }: { tier: 'sparkline' | 'micro' | 'standard' | 'feature'; caption?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <TierBadge tier={tier} />
      {caption && <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'rgb(var(--canvas-fg-3, 100 116 139))' }}>{caption}</span>}
    </div>
  )
}

function ChartFrame({ children, pad = 16 }: { children: React.ReactNode; pad?: number }) {
  return (
    <div style={{
      background: 'rgb(var(--canvas-bg-2, 247 249 251))',
      border: '1px solid rgb(var(--canvas-border, 229 233 238))',
      borderRadius: 8, padding: pad, display: 'inline-block',
    }}>
      {children}
    </div>
  )
}

function DarkFrame({ children, pad = 16 }: { children: React.ReactNode; pad?: number }) {
  return (
    <div style={{
      background: darkBg, border: `1px solid ${darkBorder}`,
      borderRadius: 8, padding: pad, display: 'inline-block',
    }}>
      {children}
    </div>
  )
}

function TierRow({ items }: { items: { tier: 'sparkline' | 'micro' | 'standard' | 'feature'; caption?: string; node: React.ReactNode }[] }) {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {items.map(({ tier, caption, node }) => (
        <div key={tier}>
          <TierLabel tier={tier} caption={caption} />
          {node}
        </div>
      ))}
    </div>
  )
}

const SERIES_COLORS = [
  { hex: '#22D3EE', name: 'cyan' },
  { hex: '#10B981', name: 'emerald' },
  { hex: '#F59E0B', name: 'amber' },
  { hex: '#818CF8', name: 'indigo' },
  { hex: '#8B5CF6', name: 'violet' },
  { hex: '#F43F5E', name: 'rose' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 1. Sparkline
// ─────────────────────────────────────────────────────────────────────────────

export function SparklineShowcase() {
  return (
    <div>
      <PageHeader
        name="Sparkline"
        description="88 × 28 shape-only trend indicator. Answers 'going up or down?' — nothing more. Single series, inherits the host's domain color. No axes, no labels, no tooltip."
      />

      <ShowcaseSection label="Canonical series palette">
        <DemoGrid cols={6} gap={12}>
          {SERIES_COLORS.map(({ hex, name }) => (
            <DemoCard key={name} label={name}>
              <Sparkline data={LINE} color={hex} />
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>

      <ShowcaseSection label="Area fill vs line-only">
        <DemoRow gap={16}>
          <DemoCard label="area=true (default)">
            <Sparkline data={LINE} color="#22D3EE" area />
          </DemoCard>
          <DemoCard label="area=false">
            <Sparkline data={LINE} color="#22D3EE" area={false} />
          </DemoCard>
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="StatusColor backward compatibility">
        <DemoGrid cols={5} gap={12}>
          {(['emerald', 'amber', 'rose', 'cyan', 'neutral'] as const).map(color => (
            <DemoCard key={color} label={color}>
              <Sparkline data={LINE} color={color} />
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>

      <ShowcaseSection label="In context — StatTile bottom-right slot" description="88 × 28 at default size; scales proportionally with width/height overrides.">
        <DemoRow gap={16}>
          {SERIES_COLORS.slice(0, 4).map(({ hex, name }) => (
            <div key={name} style={{
              background: 'rgb(var(--canvas-card, 255 255 255))',
              border: `1px solid rgb(var(--canvas-border, 229 233 238))`,
              borderLeft: `2px solid ${hex}`,
              borderRadius: 8, padding: '10px 12px 10px 12px',
              display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', minWidth: 140,
            }}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--canvas-fg-3, 100 116 139))' }}>INDIVIDUALS</div>
              <div style={{ fontFamily: 'var(--font-sans, Inter)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'rgb(var(--canvas-fg-1, 11 18 32))', fontVariantNumeric: 'tabular-nums' }}>267</div>
              <div style={{ position: 'absolute', right: 10, bottom: 10 }}>
                <Sparkline data={LINE} color={hex} />
              </div>
            </div>
          ))}
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="data" type="number[]" required description="Values to plot (min 2 points)" />
          <PropRow name="color" type="SparklineColor | string" def="'emerald'" description="StatusColor name or any hex string" />
          <PropRow name="area" type="boolean" def="true" description="Gradient area fill beneath the line" />
          <PropRow name="width" type="number" def="88" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="28" description="SVG height in pixels" />
          <PropRow name="label" type="string" def="'trend sparkline'" description="aria-label for screen readers" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LineChart
// ─────────────────────────────────────────────────────────────────────────────

export function LineChartShowcase() {
  return (
    <div>
      <PageHeader
        name="LineChart"
        description="Continuous change over time. Supports all four tiers. Multi-series cycles the canonical palette. Tooltip, threshold, and event markers available at feature tier."
      />

      <ShowcaseSection label="Tier ladder — same data, four containers">
        <TierRow items={[
          {
            tier: 'sparkline',
            caption: '88 × 28',
            node: <Sparkline data={LINE} color="#22D3EE" />,
          },
          {
            tier: 'micro',
            caption: '200 × 72',
            node: (
              <ChartFrame pad={8}>
                <LineChart series={[LINE]} colors={['#10B981']} area
                  width={200} height={72} padding={{ top: 6, right: 6, bottom: 6, left: 6 }} />
              </ChartFrame>
            ),
          },
          {
            tier: 'standard',
            caption: '480 × 220',
            node: (
              <ChartFrame>
                <LineChart series={[LINE]} colors={['#F59E0B']} area
                  width={480} height={220} axes grid ticks={4}
                  xLabels={X_LABELS_20}
                  threshold={{ value: 40, label: 'target' }} />
              </ChartFrame>
            ),
          },
        ]} />
      </ShowcaseSection>

      <ShowcaseSection label="Feature — multi-series + tooltip + threshold + markers" description="Hover to see the column tooltip. Cursor snaps to nearest data column.">
        <ChartFrame>
          <LineChart series={[LINE, LINE2]} colors={['#22D3EE', '#818CF8']} area
            width={720} height={320} axes grid ticks={5}
            xLabels={X_LABELS_20}
            threshold={{ value: 40, label: 'target' }}
            markers={[{ x: 8, label: 'release 1.4' }]}
            tooltip />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Dark canvas">
        <DarkFrame>
          <LineChart series={[LINE, LINE2]} colors={['#22D3EE', '#818CF8']} area
            width={480} height={200} axes grid ticks={4}
            xLabels={['W1','W6','W12','W18']}
            threshold={{ value: 40, label: 'target' }}
            tone="dark" />
        </DarkFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="series" type="number[][]" description="Each inner array is one series. Multi-series cycles the canonical palette." />
          <PropRow name="colors" type="string[]" description="Hex color per series. Overrides palette." />
          <PropRow name="width" type="number" def="480" description="SVG width in px" />
          <PropRow name="height" type="number" def="200" description="SVG height in px" />
          <PropRow name="area" type="boolean" def="false" description="Gradient area fill (22 % → 0 % vertical)" />
          <PropRow name="axes" type="boolean" def="false" description="Y-axis line + x/y tick labels" />
          <PropRow name="grid" type="boolean" def="false" description="Horizontal grid lines at each y-tick" />
          <PropRow name="ticks" type="number" def="4" description="Number of y-axis ticks (max 6 per spec)" />
          <PropRow name="xLabels" type="string[]" description="X-axis tick labels" />
          <PropRow name="threshold" type="{ value, label? }" description="1 px dashed line in fg-3. Max one per chart." />
          <PropRow name="markers" type="{ x, label? }[]" description="Amber vertical event markers. Max 4." />
          <PropRow name="tooltip" type="boolean" def="false" description="Feature-tier hover card. Flips left if it clips right edge." />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
          <PropRow name="padding" type="{ top?, right?, bottom?, left? }" description="Override default plot-area padding" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BarV
// ─────────────────────────────────────────────────────────────────────────────

export function BarVShowcase() {
  return (
    <div>
      <PageHeader
        name="BarV"
        description="Single-series vertical bar chart for discrete categories. Y-axis always starts at zero. Available at micro, standard, and feature tiers."
      />

      <ShowcaseSection label="Micro — shape only">
        <ChartFrame pad={12}>
          <BarV values={BAR} color="#10B981" width={180} height={64} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Standard — axes + grid + threshold">
        <ChartFrame>
          <BarV values={BAR} xLabels={BAR_MONTHS} color="#10B981"
            width={480} height={200} axes grid ticks={4}
            threshold={{ value: 80, label: 'sla' }} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Feature — amber + threshold at 80">
        <ChartFrame>
          <BarV values={BAR} xLabels={BAR_MONTHS} color="#F59E0B"
            width={640} height={240} axes grid ticks={5}
            threshold={{ value: 80, label: 'sla target' }} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Dark canvas">
        <DarkFrame>
          <BarV values={BAR} xLabels={BAR_MONTHS} color="#10B981"
            width={480} height={200} axes grid ticks={4}
            threshold={{ value: 80, label: 'sla' }}
            tone="dark" />
        </DarkFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="values" type="number[]" description="Bar heights. Y-axis always starts at 0." />
          <PropRow name="xLabels" type="string[]" description="X-axis label per bar (requires axes=true)" />
          <PropRow name="color" type="string" def="amber (#F59E0B)" description="Bar fill — inherit host domain color for single-series" />
          <PropRow name="width" type="number" def="480" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="200" description="SVG height in pixels" />
          <PropRow name="axes" type="boolean" def="false" description="Axis lines + y-tick labels" />
          <PropRow name="grid" type="boolean" def="false" description="Horizontal grid lines" />
          <PropRow name="ticks" type="number" def="4" description="Y-axis tick count" />
          <PropRow name="threshold" type="{ value, label? }" description="Dashed SLA / target line" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
          <PropRow name="label" type="string" description="Accessible label for the chart (aria-label on the SVG)" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BarH
// ─────────────────────────────────────────────────────────────────────────────

export function BarHShowcase() {
  return (
    <div>
      <PageHeader
        name="BarH"
        description="Horizontal bar chart for ranked categories — hostnames, file paths, top-N lists. Each item has a label, value, and optional color. Inset track shows the full range; filled bar shows actual value."
      />

      <ShowcaseSection label="Standard — 320 × 140">
        <ChartFrame>
          <BarH items={BAR_H_ITEMS} width={320} height={140} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Feature — 460 × 180">
        <ChartFrame>
          <BarH items={BAR_H_ITEMS} width={460} height={180} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Dark canvas">
        <DarkFrame>
          <BarH items={BAR_H_ITEMS} width={320} height={140} tone="dark" />
        </DarkFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Without value labels">
        <ChartFrame pad={12}>
          <BarH items={BAR_H_ITEMS} width={240} height={110} showValues={false} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Custom value format — latency (ms)">
        <ChartFrame>
          <BarH
            items={[
              { label: 'nyx',    value: 4.2 },
              { label: 'aether', value: 12.7 },
              { label: 'vega',   value: 8.1 },
              { label: 'helios', value: 31.4 },
            ]}
            width={320}
            height={140}
            valueFormat={v => `${v.toFixed(1)} ms`}
          />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Fixed maxValue — normalised scale">
        <ChartFrame>
          <BarH items={BAR_H_ITEMS} width={320} height={140} maxValue={100} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Per-item color override">
        <ChartFrame>
          <BarH
            items={[
              { label: 'ok',      value: 84, color: '#10B981' },
              { label: 'warn',    value: 12, color: '#F59E0B' },
              { label: 'error',   value: 4,  color: '#F43F5E' },
            ]}
            width={320}
            height={120}
            maxValue={100}
            label="Status breakdown"
          />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="items" type="{ label, value, color? }[]" description="Ranked items. color defaults to SERIES_COLORS cycle." />
          <PropRow name="showValues" type="boolean" def="true" description="Value label to the right of each bar" />
          <PropRow name="valueFormat" type="(value: number) => string" description="Custom number formatter. Defaults to the built-in fmt helper (k-suffix)." />
          <PropRow name="maxValue" type="number" description="Fixed scale maximum. Defaults to the largest item value." />
          <PropRow name="label" type="string" description="aria-label for the SVG element. Defaults to 'Horizontal bar chart'." />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
          <PropRow name="width" type="number" def="320" description="SVG width" />
          <PropRow name="height" type="number" def="200" description="SVG height" />
          <PropRow name="className" type="string" description="Extra class names applied to the SVG element" />
          <PropRow name="style" type="React.CSSProperties" description="Inline styles applied to the SVG element" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. StackedBar
// ─────────────────────────────────────────────────────────────────────────────

export function StackedBarShowcase() {
  return (
    <div>
      <PageHeader
        name="StackedBar"
        description="Composition over time. Up to 4 segments per stack. Use normalized (100 %) mode when totals diverge — it reveals proportion even when volume varies."
      />

      <ShowcaseSection label="Standard — absolute values">
        <ChartFrame>
          <StackedBar stacks={STACKS} width={320} height={140} axes grid ticks={3} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Feature — 100 % normalized" description="Each stack is normalized to 100 %. Y-axis shows percentage labels.">
        <ChartFrame>
          <StackedBar stacks={STACKS} width={480} height={180} axes grid ticks={4} normalized />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Dark canvas">
        <DarkFrame>
          <StackedBar stacks={STACKS} width={320} height={140} axes grid ticks={3} tone="dark" />
        </DarkFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="stacks" type="{ label, parts: number[] }[]" description="Each stack has a x-label and array of part values (≤ 4 parts)" />
          <PropRow name="colors" type="string[]" description="Hex colors per part. Defaults to canonical SERIES_COLORS." />
          <PropRow name="normalized" type="boolean" def="false" description="Normalize all stacks to 100 %. Shows percentage y-labels." />
          <PropRow name="axes" type="boolean" def="false" description="Axis lines + tick labels" />
          <PropRow name="grid" type="boolean" def="false" description="Horizontal grid lines" />
          <PropRow name="ticks" type="number" def="4" description="Y-axis tick count" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
          <PropRow name="label" type="string" def="'Stacked bar chart'" description="aria-label for the SVG element." />
          <PropRow name="width" type="number" def="480" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="200" description="SVG height in pixels" />
          <PropRow name="className" type="string" description="Extra class names applied to the SVG element" />
          <PropRow name="style" type="React.CSSProperties" description="Inline styles applied to the SVG element" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Donut
// ─────────────────────────────────────────────────────────────────────────────

const DONUT_LEGEND = [
  { color: '#10B981', label: 'life',     value: 134 },
  { color: '#818CF8', label: 'software', value: 72  },
  { color: '#22D3EE', label: 'default',  value: 45  },
  { color: '#F59E0B', label: 'climate',  value: 16  },
]

export function DonutShowcase() {
  return (
    <div>
      <PageHeader
        name="Donut"
        description="Composition at a glance. Max 5 slices — merge the rest as 'other'. Show the total in the center. Available at micro and standard tiers; feature tier adds a legend."
      />

      <ShowcaseSection label="Tier comparison">
        <TierRow items={[
          {
            tier: 'micro',
            caption: '84 × 84 · 9 px ring',
            node: (
              <ChartFrame pad={12}>
                <Donut slices={DONUT_SLICES} width={84} height={84} thickness={9} />
              </ChartFrame>
            ),
          },
          {
            tier: 'standard',
            caption: '140 × 140 · 14 px ring + center value',
            node: (
              <ChartFrame>
                <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
                  centerValue="267" centerLabel="ind." />
              </ChartFrame>
            ),
          },
        ]} />
      </ShowcaseSection>

      <ShowcaseSection label="Feature — with legend" description="Donut does not have a built-in legend; compose it alongside with a ul.">
        <ChartFrame>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
              centerValue="267" centerLabel="ind." />
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DONUT_LEGEND.map(({ color, label, value }) => (
                <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgb(var(--canvas-fg-2, 71 85 105))' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgb(var(--canvas-fg-3, 100 116 139))', marginLeft: 'auto', paddingLeft: 16 }}>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Dark canvas">
        <DarkFrame>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
              centerValue="267" centerLabel="ind." tone="dark" />
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DONUT_LEGEND.map(({ color, label, value }) => (
                <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#94A3B8' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: '#64748B', marginLeft: 'auto', paddingLeft: 16 }}>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </DarkFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="slices" type="{ value, color? }[]" description="Up to 5 slices. Merge the 6th+ into an 'other' slice at call site." />
          <PropRow name="colors" type="string[]" description="Hex colors per slice. Defaults to canonical SERIES_COLORS." />
          <PropRow name="width" type="number" def="160" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="160" description="SVG height in pixels" />
          <PropRow name="thickness" type="number" def="14" description="Ring width in pixels" />
          <PropRow name="gap" type="number" def="0.03" description="Gap in radians between slices. Pass 0 to disable." />
          <PropRow name="centerValue" type="string" description="Bold number in the center (Inter 700)" />
          <PropRow name="centerLabel" type="string" description="Mono eyebrow below the center value" />
          <PropRow name="aria-label" type="string" def="'Donut chart'" description="Accessible label for screen readers" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Heatmap
// ─────────────────────────────────────────────────────────────────────────────

export function HeatmapShowcase() {
  return (
    <div>
      <PageHeader
        name="Heatmap"
        description="Two-dimensional density — calendar/hour grids, host/metric matrices. Single-hue scale: low values at 12 % alpha → high at 100 %. Color inherits the domain color of the host (emerald for activity, cyan for throughput, etc.)."
      />

      <ShowcaseSection label="Standard — 7 × 24, emerald (activity)">
        <ChartFrame>
          <Heatmap data={HEATMAP} width={320} height={110}
            baseColor="#10B981" axes
            yLabels={['M','T','W','T','F','S','S']}
            xLabels={X_HOURS} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Feature — 7 × 24, cyan (throughput)">
        <ChartFrame>
          <Heatmap data={HEATMAP} width={480} height={140}
            baseColor="#22D3EE" axes
            yLabels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
            xLabels={X_HOURS} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Color variants — same data, different domain colors">
        <DemoGrid cols={3} gap={12}>
          {([['#10B981','emerald'],['#F59E0B','amber'],['#F43F5E','rose']] as const).map(([c, name]) => (
            <DemoCard key={name} label={name}>
              <Heatmap data={HEATMAP} width={220} height={80} baseColor={c} />
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>

      <ShowcaseSection label="Dark canvas">
        <DarkFrame>
          <Heatmap data={HEATMAP} width={320} height={110}
            baseColor="#10B981" axes tone="dark"
            yLabels={['M','T','W','T','F','S','S']}
            xLabels={X_HOURS} />
        </DarkFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="data" type="(number | null)[][]" description="2-D array [rows][cols]. null cells render as inset background." />
          <PropRow name="baseColor" type="string" def="'#10B981'" description="Hot end of the single-hue alpha scale" />
          <PropRow name="xLabels" type="string[]" description="Axis tick labels along the x axis. Empty strings skip that label." />
          <PropRow name="yLabels" type="string[]" description="Axis tick labels along the y axis. Empty strings skip that label." />
          <PropRow name="axes" type="boolean" def="false" description="Show x/y axis labels" />
          <PropRow name="width" type="number" def="480" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="120" description="SVG height in pixels" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
          <PropRow name="ariaLabel" type="string" description="Accessible label for the SVG element" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. StatusTimeline
// ─────────────────────────────────────────────────────────────────────────────

export function StatusTimelineShowcase() {
  return (
    <div>
      <PageHeader
        name="StatusTimeline"
        description="Gantt-style status history for N services across a time window. Color encodes semantic status: ok · warn · error · idle · info. Event markers are always amber."
      />

      <ShowcaseSection label="Standard — 4 tracks, 24-hour window">
        <ChartFrame>
          <StatusTimeline tracks={TIMELINE} width={480} height={150} range={[0,100]} axes
            xLabels={['-24h','-18','-12','-6','now']} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Feature — with event marker" description="Amber dashed line + dot marks the incident timestamp. Label anchors top-left of the dot.">
        <ChartFrame>
          <StatusTimeline tracks={TIMELINE} width={720} height={180} range={[0,100]} axes
            xLabels={['-24h','-20','-16','-12','-8','-4','now']}
            marker={{ x: 64, label: 'incident #142' }} />
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Dark canvas">
        <DarkFrame>
          <StatusTimeline tracks={TIMELINE} width={480} height={150} range={[0,100]} axes
            xLabels={['-24h','-18','-12','-6','now']}
            tone="dark" />
        </DarkFrame>
      </ShowcaseSection>

      <ShowcaseSection label="Segment kinds — color reference">
        <DemoGrid cols={5} gap={10}>
          {([
            ['ok',    '#10B981', 'Healthy / running'],
            ['warn',  '#F59E0B', 'Degraded / slow'],
            ['error', '#F43F5E', 'Down / failed'],
            ['idle',  '#F7F9FB', 'Stopped / not scheduled'],
            ['info',  '#22D3EE', 'Updating / pulling'],
          ] as const).map(([kind, color, desc]) => (
            <DemoCard key={kind} label={kind}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 28, height: 8, borderRadius: 2, background: color, border: kind === 'idle' ? '1px solid #E5E9EE' : 'none' }} />
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'rgb(var(--canvas-fg-3))' }}>{color}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgb(var(--canvas-fg-2))' }}>{desc}</div>
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="tracks" type="{ label, segments: { start, end, kind }[] }[]" description="One track per service. Segments are drawn left-to-right; gaps show inset background." />
          <PropRow name="range" type="[number, number]" def="[0, 100]" description="Numeric range of the time axis" />
          <PropRow name="width" type="number" def="480" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="160" description="SVG height in pixels" />
          <PropRow name="axes" type="boolean" def="false" description="Show x-axis labels" />
          <PropRow name="xLabels" type="string[]" description="Labels evenly distributed along x-axis" />
          <PropRow name="marker" type="{ x, label? }" description="Amber vertical marker at a position in range units" />
          <PropRow name="aria-label" type="string" description="Accessible label for the SVG chart" />
          <PropRow name="tone" type="'light' | 'dark'" def="'light'" description="Canvas tone" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview (landing page)
// ─────────────────────────────────────────────────────────────────────────────

export function ChartsOverviewShowcase() {
  return (
    <div>
      <PageHeader
        name="Charts"
        description="8 chart types across 4 tiers — sparkline → micro → standard → feature. A chart earns annotations as it gets more prominent; it can never have an annotation from a higher tier. Canonical series palette: cyan → emerald → amber → indigo → violet → rose. Light + dark canvas."
      />

      {/* Tier ladder */}
      <ShowcaseSection label="01 · Tier ladder — same data, four tiers" description="The same line series scaled across all four containers. Each tier adds one layer of information.">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <TierLabel tier="sparkline" caption="88 × 28 · shape only" />
            <Sparkline data={LINE} color="#22D3EE" />
          </div>
          <div>
            <TierLabel tier="micro" caption="200 × 72 · + range" />
            <ChartFrame pad={8}>
              <LineChart series={[LINE]} colors={['#10B981']} area
                width={200} height={72} padding={{ top: 6, right: 6, bottom: 6, left: 6 }} />
            </ChartFrame>
          </div>
          <div>
            <TierLabel tier="standard" caption="480 × 220 · + axes + grid" />
            <ChartFrame>
              <LineChart series={[LINE]} colors={['#F59E0B']} area
                width={480} height={220} axes grid ticks={4}
                xLabels={X_LABELS_20} threshold={{ value: 40, label: 'target' }} />
            </ChartFrame>
          </div>
          <div>
            <TierLabel tier="feature" caption="720 × 320 · + multi-series + tooltip + markers" />
            <ChartFrame>
              <LineChart series={[LINE, LINE2]} colors={['#22D3EE','#818CF8']} area
                width={720} height={320} axes grid ticks={5}
                xLabels={X_LABELS_20}
                threshold={{ value: 40, label: 'target' }}
                markers={[{ x: 8, label: 'release 1.4' }]}
                tooltip />
            </ChartFrame>
          </div>
        </div>
      </ShowcaseSection>

      {/* Eight chart types */}
      <ShowcaseSection label="02 · Eight chart types" description="Standard-tier examples. Each type has its own showcase page with all tiers, dark canvas, and prop reference.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--canvas-fg-3))', marginBottom: 8 }}>Line / Area</div>
            <ChartFrame>
              <LineChart series={[LINE]} colors={['#F59E0B']} area
                width={360} height={160} axes grid ticks={3} xLabels={['W1','W8','W16']} />
            </ChartFrame>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--canvas-fg-3))', marginBottom: 8 }}>Bar (vertical)</div>
            <ChartFrame>
              <BarV values={BAR} xLabels={BAR_MONTHS} color="#10B981"
                width={360} height={160} axes grid ticks={3}
                threshold={{ value: 80, label: 'sla' }} />
            </ChartFrame>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--canvas-fg-3))', marginBottom: 8 }}>Bar (horizontal)</div>
            <ChartFrame>
              <BarH items={BAR_H_ITEMS} width={320} height={140} />
            </ChartFrame>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--canvas-fg-3))', marginBottom: 8 }}>Stacked bar</div>
            <ChartFrame>
              <StackedBar stacks={STACKS} width={320} height={140} axes grid ticks={3} />
            </ChartFrame>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--canvas-fg-3))', marginBottom: 8 }}>Donut / ring</div>
            <ChartFrame>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
                  centerValue="267" centerLabel="ind." />
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {DONUT_LEGEND.map(({ color, label, value }) => (
                    <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10.5, color: 'rgb(var(--canvas-fg-2))' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10.5, color: 'rgb(var(--canvas-fg-3))', marginLeft: 'auto', paddingLeft: 12 }}>{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ChartFrame>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--canvas-fg-3))', marginBottom: 8 }}>Heatmap</div>
            <ChartFrame>
              <Heatmap data={HEATMAP} width={320} height={110}
                baseColor="#10B981" axes
                yLabels={['M','T','W','T','F','S','S']}
                xLabels={X_HOURS} />
            </ChartFrame>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgb(var(--canvas-fg-3))', marginBottom: 8 }}>Status timeline</div>
            <ChartFrame>
              <StatusTimeline tracks={TIMELINE} width={720} height={165} range={[0,100]} axes
                xLabels={['-24h','-20','-16','-12','-8','-4','now']}
                marker={{ x: 64, label: 'incident #142' }} />
            </ChartFrame>
          </div>
        </div>
      </ShowcaseSection>

      {/* Series palette */}
      <ShowcaseSection label="03 · Series color" description="Single-series charts inherit the domain color of their host. Multi-series cycles this palette in fixed order — never reshuffle.">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {SERIES_COLORS.map(({ hex, name }, i) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: hex, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 500, color: 'rgb(var(--canvas-fg-2))' }}>
                {String(i+1).padStart(2,'0')} {name}
              </span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'rgb(var(--canvas-fg-3))' }}>{hex.toLowerCase()}</span>
            </div>
          ))}
        </div>
        <ChartFrame>
          <StackedBar stacks={STACKS} width={460} height={160} axes grid ticks={4} />
        </ChartFrame>
      </ShowcaseSection>

      {/* Dark canvas preview */}
      <ShowcaseSection label="04 · Dark canvas" description="Series colors are identical between canvases. Grid lines, axis labels, and inset backgrounds remap to the dark canvas token set.">
        <DarkFrame>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <LineChart series={[LINE, LINE2]} colors={['#22D3EE','#818CF8']} area
              width={440} height={180} axes grid ticks={4}
              xLabels={['W1','W6','W12','W18']}
              threshold={{ value: 40, label: 'target' }}
              tone="dark" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Donut slices={DONUT_SLICES} width={140} height={140} thickness={14}
                centerValue="267" centerLabel="ind." tone="dark" />
              <BarH items={BAR_H_ITEMS} width={260} height={110} tone="dark" />
            </div>
          </div>
        </DarkFrame>
      </ShowcaseSection>

      {/* Sparklines row */}
      <ShowcaseSection label="05 · Sparkline palette">
        <DemoGrid cols={6} gap={12}>
          {SERIES_COLORS.map(({ hex, name }) => (
            <DemoCard key={name} label={name}>
              <Sparkline data={LINE} color={hex} />
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy / utility components
// ─────────────────────────────────────────────────────────────────────────────

export function BarChartShowcase() {
  return (
    <div>
      <PageHeader name="BarChart" description="Grouped multi-series vertical bar chart (legacy v1 API). For new work use BarV (single-series) or StackedBar (stacked)." />
      <ShowcaseSection label="Multi-series with legend">
        <DemoCard>
          <ChartFrame>
            <BarChart
              series={[
                { name: 'Requests', data: [120, 145, 130, 170, 200], color: 'amber' as const },
                { name: 'Errors',   data: [8, 12, 10, 14, 6],       color: 'rose' as const },
              ]}
              xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May']}
              yMin={0} yMax={220} yTickCount={6} legend
              width={480} height={250}
              ariaLabel="Requests and errors per month" />
          </ChartFrame>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Single series, no legend">
        <DemoCard>
          <ChartFrame>
            <BarChart
              series={[{ name: 'Deployments', data: [4, 7, 3, 9, 5, 6], color: 'cyan' as const }]}
              xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
              yMin={0} yTickCount={4}
              width={360} height={180}
              ariaLabel="Deployments per month" />
          </ChartFrame>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Three series, custom y-range">
        <DemoCard>
          <ChartFrame>
            <BarChart
              series={[
                { name: 'CPU',    data: [65, 72, 80, 68, 75], color: 'amber' as const },
                { name: 'Memory', data: [45, 50, 55, 48, 52], color: 'emerald' as const },
                { name: 'Disk',   data: [20, 22, 21, 25, 23], color: 'violet' as const },
              ]}
              xLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
              yMin={0} yMax={100} yTickCount={5} legend
              width={480} height={220}
              ariaLabel="CPU, memory, and disk usage by day" />
          </ChartFrame>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="series" type="BarChartSeries[]" required description="Array of data series. Each series has name, data (number[]), and optional color (StatusColor)." />
          <PropRow name="xLabels" type="string[]" def="[]" description="Labels rendered along the x-axis beneath each group." />
          <PropRow name="yMin" type="number" def="auto" description="Minimum y-axis value. Defaults to the floor of the data minimum." />
          <PropRow name="yMax" type="number" def="auto" description="Maximum y-axis value. Defaults to the ceil of the data maximum." />
          <PropRow name="yTickCount" type="number" def="5" description="Number of y-axis tick marks and grid lines." />
          <PropRow name="legend" type="boolean" def="false" description="Render a color-keyed legend below the chart." />
          <PropRow name="width" type="number" def="400" description="Width of the SVG in pixels." />
          <PropRow name="height" type="number" def="200" description="Height of the SVG in pixels." />
          <PropRow name="ariaLabel" type="string" def="series names" description="Accessible label for the chart SVG. Defaults to a comma-joined list of series names." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ProgressBarShowcase() {
  return (
    <div>
      <PageHeader name="ProgressBar" description="Horizontal fill bar. Clamps to 0–100; handles NaN gracefully." />
      <ShowcaseSection label="Color variants">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
          {([
            [0,   'emerald', '0 %'],
            [25,  'cyan',    '25 %'],
            [50,  'amber',   '50 %'],
            [75,  'rose',    '75 %'],
            [88,  'violet',  '88 %'],
            [100, 'neutral', '100 %'],
          ] as [number, 'emerald' | 'cyan' | 'amber' | 'rose' | 'violet' | 'neutral', string][]).map(([p, c, label]) => (
            <div key={c}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'rgb(var(--canvas-fg-3))', marginBottom: 4 }}>{label} · {c}</div>
              <ProgressBar percent={p} color={c} label={`${c} progress`} />
            </div>
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Height variants">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
          {([2, 4, 6, 10, 16] as number[]).map((h) => (
            <div key={h}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'rgb(var(--canvas-fg-3))', marginBottom: 4 }}>height={h}</div>
              <ProgressBar percent={60} color="emerald" height={h} label={`height ${h} progress`} />
            </div>
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="percent" type="number" required description="Fill level from 0 to 100. NaN is treated as 0." />
          <PropRow name="color" type="ProgressBarColor" def="'emerald'" description="StatusColor name: emerald, amber, rose, cyan, violet, or neutral." />
          <PropRow name="height" type="number" def="6" description="Track height in pixels." />
          <PropRow name="label" type="string" description="aria-label text for screen readers." />
          <PropRow name="className" type="string" description="Additional CSS class names appended to the track element." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function MetricRowShowcase() {
  return (
    <div>
      <PageHeader name="MetricRow" description="Composite row combining label, progress bar, sparkline trend, and value. Used for live resource metrics." />
      <ShowcaseSection label="Resource metrics">
        <ChartFrame>
          <div style={{ width: 520 }}>
            <MetricRow label="CPU Usage"   value={72}   unit="%" percent={72} sparklineData={[45,52,48,65,72,68,75,70,72,68]} color="amber" />
            <MetricRow label="Memory"      value={1084} unit="MB" percent={45} sparklineData={[890,920,950,1000,1050,1080,1084,1075,1070,1065]} color="emerald" />
            <MetricRow label="Network I/O" value={234}  unit="Mbps" percent={85} sparklineData={[150,180,200,220,210,230,234,225,220,215]} color="cyan" />
            <MetricRow label="Error Rate"  value={5}    unit="%" percent={5} sparklineData={[2,3,2,4,5,4,3,5,4,2]} color="rose" />
          </div>
        </ChartFrame>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="label" type="string" required description="Row label rendered in the first column." />
          <PropRow name="value" type="number | string" required description="Primary metric value displayed on the right." />
          <PropRow name="percent" type="number" required description="Progress bar fill level from 0 to 100." />
          <PropRow name="unit" type="string" description="Unit suffix shown after the value (e.g. %, MB, Mbps)." />
          <PropRow name="sparklineData" type="number[]" def="[]" description="Data points for the sparkline trend line." />
          <PropRow name="color" type="SparklineColor" def="'emerald'" description="Color applied to both the progress bar and sparkline. One of: emerald, amber, rose, cyan, violet, neutral." />
          <PropRow name="progressLabel" type="string" description="Accessible label for the progress bar. Defaults to the row label." />
          <PropRow name="aria-label" type="string" description="Accessible label for the row element. Defaults to the row label." />
          <PropRow name="className" type="string" description="Additional CSS class names appended to the root element." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ChartWrapper — accessibility infrastructure
// ─────────────────────────────────────────────────────────────────────────────

export function ChartWrapperShowcase() {
  return (
    <div>
      <PageHeader
        name="ChartWrapper"
        description="Accessible SVG container for chart components. Renders an &lt;svg&gt; with role=&quot;img&quot; and aria-label already set, so new chart components never need to remember to add these attributes manually."
      />

      <ShowcaseSection
        label="Basic usage"
        description="Wrap SVG content in ChartWrapper and supply a label. The role and aria-label are handled automatically."
      >
        <ChartFrame>
          <ChartWrapper label="Monthly active users" width={320} height={120} viewBox="0 0 320 120">
            {/* A simple custom SVG chart drawn inside the accessible container */}
            <line x1="0" y1="115" x2="320" y2="115" stroke="rgb(var(--canvas-border, 229 233 238))" strokeWidth="1" />
            {[12, 34, 28, 55, 44, 68, 61, 82, 75, 90, 85, 100].map((v, i, arr) => {
              const x = (i / (arr.length - 1)) * 310 + 5
              const y = 110 - (v / 100) * 100
              return <circle key={i} cx={x} cy={y} r={3.5} fill="#F59E0B" />
            })}
          </ChartWrapper>
        </ChartFrame>
      </ShowcaseSection>

      <ShowcaseSection
        label="Before / after comparison"
        description="Without ChartWrapper, each chart component must manually set role and aria-label on its &lt;svg&gt; root. With ChartWrapper, this is done once in the wrapper."
      >
        <DemoGrid cols={2} gap={16}>
          <DemoCard label="Without ChartWrapper — manual attrs required">
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, lineHeight: 1.7, color: 'rgb(var(--canvas-fg-2, 71 85 105))', background: 'rgb(var(--canvas-bg-2, 247 249 251))', padding: '10px 14px', borderRadius: 6, border: '1px solid rgb(var(--canvas-border, 229 233 238))' }}>
              <span style={{ color: 'rgb(var(--canvas-fg-3))' }}>{'// must remember every time'}</span><br />
              {'<svg'}<br />
              {'  '}<span style={{ color: '#F59E0B' }}>role</span>{'="img"'}<br />
              {'  '}<span style={{ color: '#F59E0B' }}>aria-label</span>{'="Revenue trend"'}<br />
              {'  width={480} height={200}'}<br />
              {'>'}<br />
              {'  {/* chart content */}'}<br />
              {'</svg>'}
            </div>
          </DemoCard>
          <DemoCard label="With ChartWrapper — attrs enforced by the component">
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, lineHeight: 1.7, color: 'rgb(var(--canvas-fg-2, 71 85 105))', background: 'rgb(var(--canvas-bg-2, 247 249 251))', padding: '10px 14px', borderRadius: 6, border: '1px solid rgb(var(--canvas-border, 229 233 238))' }}>
              <span style={{ color: 'rgb(var(--canvas-fg-3))' }}>{'// label is the only ARIA concern'}</span><br />
              {'<ChartWrapper'}<br />
              {'  '}<span style={{ color: '#F59E0B' }}>label</span>{'="Revenue trend"'}<br />
              {'  width={480} height={200}'}<br />
              {'  viewBox="0 0 480 200"'}<br />
              {'>'}<br />
              {'  {/* chart content */}'}<br />
              {'</ChartWrapper>'}
            </div>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="label" type="string" required description="Accessible label — maps directly to aria-label on the rendered SVG. Required; no default." />
          <PropRow name="width" type="number | string" description="SVG width attribute. Accepts pixel numbers or CSS strings (e.g. '100%')." />
          <PropRow name="height" type="number | string" description="SVG height attribute." />
          <PropRow name="viewBox" type="string" description="SVG viewBox attribute (e.g. '0 0 480 200'). Needed when width/height differ from the internal coordinate system." />
          <PropRow name="className" type="string" description="Additional CSS class names applied to the SVG element." />
          <PropRow name="children" type="React.ReactNode" required description="SVG content — paths, groups, text, defs, etc." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
