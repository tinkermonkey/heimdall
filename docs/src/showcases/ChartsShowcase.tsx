import { useState } from 'react'
import {
  Sparkline,
  LineChart,
  BarChart,
  PieChart,
  ProgressBar,
  MetricRow,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, DemoGrid, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'
const chartBg = 'rgb(var(--canvas-surface-2, 243 244 246))'

const SPARKLINE_DATA = [12, 19, 8, 5, 22, 18, 15, 25, 16, 20]
const X_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']

const LINE_SERIES = [
  { name: 'Series A', data: [10, 15, 13, 17, 20, 22, 18, 25, 28, 24], color: 'amber' as const, filled: true },
  { name: 'Series B', data: [8, 12, 10, 14, 16, 18, 15, 20, 22, 19], color: 'emerald' as const },
]

const BAR_SERIES = [
  { name: 'Requests', data: [120, 145, 130, 170, 200], color: 'amber' as const },
  { name: 'Errors', data: [8, 12, 10, 14, 6], color: 'rose' as const },
]

export function SparklineShowcase() {
  return (
    <div>
      <PageHeader name="Sparkline" description="Compact SVG area-and-line chart for inline metric trends. Five color variants mapped to semantic status colors." />
      <ShowcaseSection label="Color variants">
        <DemoGrid cols={5} gap={20}>
          {(['emerald', 'amber', 'rose', 'cyan', 'neutral'] as const).map(color => (
            <DemoCard key={color} label={color}>
              <Sparkline data={SPARKLINE_DATA} color={color} />
            </DemoCard>
          ))}
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Edge cases">
        <DemoGrid cols={3} gap={20}>
          <DemoCard label="Single point">
            <Sparkline data={[15]} color="amber" />
          </DemoCard>
          <DemoCard label="Three points">
            <Sparkline data={[5, 8, 3]} color="cyan" />
          </DemoCard>
          <DemoCard label="Custom size (120×30)">
            <Sparkline data={SPARKLINE_DATA} color="emerald" width={120} height={30} />
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="data" type="number[]" description="Array of numeric values to plot" />
          <PropRow name="color" type="'emerald' | 'amber' | 'rose' | 'cyan' | 'neutral'" def="'emerald'" description="Line and fill accent color" />
          <PropRow name="width" type="number" def="160" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="40" description="SVG height in pixels" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function LineChartShowcase() {
  return (
    <div>
      <PageHeader name="LineChart" description="Multi-series line chart with Y-axis labels, grid lines, X-axis labels, legend, and optional area fills." />
      <ShowcaseSection label="Multi-series with fill">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6 }}>
            <LineChart
              series={LINE_SERIES}
              xLabels={X_LABELS}
              yMin={5}
              yMax={30}
              yTickCount={6}
              legend
              width={600}
              height={250}
            />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Edge cases">
        <DemoGrid cols={3} gap={16}>
          <DemoCard label="Empty data">
            <div style={{ background: chartBg, padding: 12, borderRadius: 6 }}>
              <LineChart series={[{ name: 'A', data: [], color: 'amber' as const }]} width={240} height={120} />
            </div>
          </DemoCard>
          <DemoCard label="Single point">
            <div style={{ background: chartBg, padding: 12, borderRadius: 6 }}>
              <LineChart series={[{ name: 'A', data: [15], color: 'amber' as const }]} xLabels={['Jan']} width={240} height={120} />
            </div>
          </DemoCard>
          <DemoCard label="Negative values">
            <div style={{ background: chartBg, padding: 12, borderRadius: 6 }}>
              <LineChart series={[{ name: 'A', data: [-10, -5, 0, 5, 10, 3, -2], color: 'rose' as const }]} xLabels={['A', 'B', 'C', 'D', 'E', 'F', 'G']} width={240} height={120} />
            </div>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="series" type="LineChartSeries[]" description="Array of {name, data, color, filled?} series descriptors" />
          <PropRow name="xLabels" type="string[]" description="X-axis tick labels" />
          <PropRow name="yMin" type="number" description="Y-axis minimum (auto-computed if omitted)" />
          <PropRow name="yMax" type="number" description="Y-axis maximum (auto-computed if omitted)" />
          <PropRow name="yTickCount" type="number" def="5" description="Number of Y-axis grid lines" />
          <PropRow name="legend" type="boolean" def="false" description="Show series legend below chart" />
          <PropRow name="width" type="number" def="500" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="200" description="SVG height in pixels" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function BarChartShowcase() {
  return (
    <div>
      <PageHeader name="BarChart" description="Grouped bar chart with Y-axis labels, grid lines, X-axis labels, and legend." />
      <ShowcaseSection label="Grouped bars">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6 }}>
            <BarChart
              series={BAR_SERIES}
              xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May']}
              yMin={0}
              yMax={220}
              yTickCount={6}
              legend
              width={480}
              height={250}
            />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Edge cases">
        <DemoGrid cols={3} gap={16}>
          <DemoCard label="Empty data">
            <div style={{ background: chartBg, padding: 12, borderRadius: 6 }}>
              <BarChart series={[{ name: 'A', data: [], color: 'amber' as const }]} width={240} height={120} />
            </div>
          </DemoCard>
          <DemoCard label="Single bar">
            <div style={{ background: chartBg, padding: 12, borderRadius: 6 }}>
              <BarChart series={[{ name: 'A', data: [15], color: 'amber' as const }]} xLabels={['Jan']} width={240} height={120} />
            </div>
          </DemoCard>
          <DemoCard label="Equal values">
            <div style={{ background: chartBg, padding: 12, borderRadius: 6 }}>
              <BarChart series={[{ name: 'Flat', data: [10, 10, 10, 10, 10], color: 'rose' as const }]} xLabels={['A', 'B', 'C', 'D', 'E']} width={240} height={120} />
            </div>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="series" type="BarChartSeries[]" description="Array of {name, data, color} series descriptors" />
          <PropRow name="xLabels" type="string[]" description="X-axis tick labels" />
          <PropRow name="yMin" type="number" description="Y-axis minimum (auto-computed if omitted)" />
          <PropRow name="yMax" type="number" description="Y-axis maximum (auto-computed if omitted)" />
          <PropRow name="yTickCount" type="number" def="5" description="Number of Y-axis grid lines" />
          <PropRow name="legend" type="boolean" def="false" description="Show series legend below chart" />
          <PropRow name="width" type="number" def="400" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="200" description="SVG height in pixels" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function PieChartShowcase() {
  return (
    <div>
      <PageHeader name="PieChart" description="Donut-style pie chart with legend. Each segment specifies a name, value, and optional color string." />
      <ShowcaseSection label="Distribution">
        <DemoCard>
          <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
            <PieChart
              segments={[
                { name: 'CPU Bound', value: 35, color: 'rgb(245, 158, 11)' },
                { name: 'I/O Wait', value: 25, color: 'rgb(16, 185, 129)' },
                { name: 'Memory', value: 20, color: 'rgb(244, 63, 94)' },
                { name: 'Network', value: 20, color: 'rgb(34, 211, 238)' },
              ]}
              legend
              width={280}
              height={280}
            />
          </div>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Edge cases">
        <DemoGrid cols={2} gap={16}>
          <DemoCard label="Empty segments">
            <div style={{ background: chartBg, padding: 12, borderRadius: 6, display: 'inline-block' }}>
              <PieChart segments={[]} legend width={200} height={200} />
            </div>
          </DemoCard>
          <DemoCard label="Single segment">
            <div style={{ background: chartBg, padding: 12, borderRadius: 6, display: 'inline-block' }}>
              <PieChart segments={[{ name: 'All', value: 100, color: 'rgb(245, 158, 11)' }]} legend width={200} height={200} />
            </div>
          </DemoCard>
        </DemoGrid>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="segments" type="PieChartSegment[]" description="Array of {name, value, color?} segments" />
          <PropRow name="legend" type="boolean" def="false" description="Show segment legend" />
          <PropRow name="width" type="number" def="300" description="SVG width in pixels" />
          <PropRow name="height" type="number" def="300" description="SVG height in pixels" />
        </PropsTable>
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
            { label: '0% — emerald', percent: 0, color: 'emerald' as const },
            { label: '25% — cyan', percent: 25, color: 'cyan' as const },
            { label: '50% — amber', percent: 50, color: 'amber' as const },
            { label: '75% — rose', percent: 75, color: 'rose' as const },
            { label: '100% — neutral', percent: 100, color: 'neutral' as const },
          ].map(({ label, percent, color }) => (
            <div key={label}>
              <div style={{ fontSize: 12, color: fg2, marginBottom: 4 }}>{label}</div>
              <ProgressBar percent={percent} color={color} />
            </div>
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="percent" type="number" description="Fill percentage 0–100. NaN renders as 0." />
          <PropRow name="color" type="'emerald' | 'amber' | 'rose' | 'cyan' | 'neutral'" def="'emerald'" description="Fill bar color" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function MetricRowShowcase() {
  return (
    <div>
      <PageHeader name="MetricRow" description="Composite row combining label, progress bar, sparkline trend, and value in a single line. Used to display live resource metrics." />
      <ShowcaseSection label="Resource metrics">
        <div style={{ background: chartBg, padding: 16, borderRadius: 6, maxWidth: 560 }}>
          <MetricRow
            label="CPU Usage"
            value={72}
            unit="%"
            percent={72}
            sparklineData={[45, 52, 48, 65, 72, 68, 75, 70, 72, 68]}
            color="amber"
          />
          <MetricRow
            label="Memory"
            value={1084}
            unit="MB"
            percent={45}
            sparklineData={[890, 920, 950, 1000, 1050, 1080, 1084, 1075, 1070, 1065]}
            color="emerald"
          />
          <MetricRow
            label="Network I/O"
            value={234}
            unit="Mbps"
            percent={85}
            sparklineData={[150, 180, 200, 220, 210, 230, 234, 225, 220, 215]}
            color="cyan"
          />
          <MetricRow
            label="Error Rate"
            value={5}
            unit="%"
            percent={5}
            sparklineData={[2, 3, 2, 4, 5, 4, 3, 5, 4, 2]}
            color="rose"
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="label" type="string" description="Row label (left column)" />
          <PropRow name="value" type="number" description="Current metric value (right column)" />
          <PropRow name="unit" type="string" description="Unit suffix appended to value" />
          <PropRow name="percent" type="number" description="Progress bar fill percentage 0–100" />
          <PropRow name="sparklineData" type="number[]" description="Trend data for the inline sparkline" />
          <PropRow name="color" type="SparklineColor" def="'emerald'" description="Accent color applied to both progress bar and sparkline" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ChartsOverviewShowcase() {
  return (
    <div>
      <PageHeader
        name="Charts"
        description="SVG chart primitives: Sparkline, LineChart, BarChart, PieChart, ProgressBar, and MetricRow. All render via viewBox-relative SVG for responsive scaling."
      />
      <ShowcaseSection label="Sparklines — all colors">
        <DemoGrid cols={5} gap={16}>
          {(['emerald', 'amber', 'rose', 'cyan', 'neutral'] as const).map(c => (
            <DemoCard key={c} label={c}>
              <Sparkline data={SPARKLINE_DATA} color={c} />
            </DemoCard>
          ))}
        </DemoGrid>
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
      <ShowcaseSection label="Line chart">
        <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
          <LineChart series={LINE_SERIES} xLabels={X_LABELS} yMin={5} yMax={30} yTickCount={6} legend width={560} height={220} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Bar chart">
        <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
          <BarChart series={BAR_SERIES} xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May']} yMin={0} yMax={220} yTickCount={6} legend width={440} height={220} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Pie chart">
        <div style={{ background: chartBg, padding: 16, borderRadius: 6, display: 'inline-block' }}>
          <PieChart
            segments={[
              { name: 'CPU Bound', value: 35, color: 'rgb(245, 158, 11)' },
              { name: 'I/O Wait', value: 25, color: 'rgb(16, 185, 129)' },
              { name: 'Memory', value: 20, color: 'rgb(244, 63, 94)' },
              { name: 'Network', value: 20, color: 'rgb(34, 211, 238)' },
            ]}
            legend
            width={260}
            height={260}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Metric rows">
        <div style={{ background: chartBg, padding: 16, borderRadius: 6, maxWidth: 560 }}>
          <MetricRow label="CPU" value={72} unit="%" percent={72} sparklineData={[45, 52, 48, 65, 72]} color="amber" />
          <MetricRow label="Memory" value={62} unit="%" percent={62} sparklineData={[55, 58, 60, 62, 61]} color="emerald" />
          <MetricRow label="Network" value={85} unit="%" percent={85} sparklineData={[60, 70, 75, 80, 85]} color="cyan" />
        </div>
      </ShowcaseSection>
    </div>
  )
}
