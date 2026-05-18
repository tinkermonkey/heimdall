import { Sparkline } from '../components/Sparkline'
import { LineChart } from '../components/LineChart'
import { ProgressBar } from '../components/ProgressBar'
import { MetricRow } from '../components/MetricRow'

export default function ChartsTestPage() {
  const sparklineDataExample = [12, 19, 8, 5, 22, 18, 15, 25, 16, 20]
  const sparklineDataFlat = [10]
  const sparklineDataSmall = [5, 8, 3]

  const lineChartData = [
    {
      name: 'Series A',
      data: [10, 15, 13, 17, 20, 22, 18, 25, 28, 24],
      color: 'rgb(245, 158, 11)',
      filled: true,
    },
    {
      name: 'Series B',
      data: [8, 12, 10, 14, 16, 18, 15, 20, 22, 19],
      color: 'rgb(16, 185, 129)',
    },
  ]

  const xLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']

  return (
    <div style={{ padding: '22px 28px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      {/* Sparkline Section */}
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Sparkline Component · All Color Variants
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>Emerald</span>
            <Sparkline data={sparklineDataExample} color="emerald" data-testid="sparkline-emerald" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>Amber</span>
            <Sparkline data={sparklineDataExample} color="amber" data-testid="sparkline-amber" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>Rose</span>
            <Sparkline data={sparklineDataExample} color="rose" data-testid="sparkline-rose" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>Cyan</span>
            <Sparkline data={sparklineDataExample} color="cyan" data-testid="sparkline-cyan" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>Neutral</span>
            <Sparkline data={sparklineDataExample} color="neutral" data-testid="sparkline-neutral" />
          </div>
        </div>
      </section>

      {/* Sparkline Edge Cases */}
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Sparkline · Edge Cases
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>Single Point</span>
            <Sparkline data={sparklineDataFlat} color="amber" data-testid="sparkline-single-point" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>Three Points</span>
            <Sparkline data={sparklineDataSmall} color="cyan" data-testid="sparkline-three-points" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>Custom Size (120x30)</span>
            <Sparkline data={sparklineDataExample} color="emerald" width={120} height={30} data-testid="sparkline-custom-size" />
          </div>
        </div>
      </section>

      {/* LineChart Section */}
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          LineChart Component
        </div>
        <div style={{ backgroundColor: 'rgb(var(--shell-surface))', padding: '16px', borderRadius: '6px' }}>
          <LineChart
            series={lineChartData}
            xLabels={xLabels}
            yMin={5}
            yMax={30}
            yTickCount={6}
            legend={true}
            width={500}
            height={250}
            data-testid="line-chart"
          />
        </div>
      </section>

      {/* ProgressBar Section */}
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          ProgressBar Component · All Variants
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>0% (Emerald)</span>
            <ProgressBar percent={0} color="emerald" data-testid="progress-0" />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>25% (Cyan)</span>
            <ProgressBar percent={25} color="cyan" data-testid="progress-25" />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>50% (Amber)</span>
            <ProgressBar percent={50} color="amber" data-testid="progress-50" />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>75% (Rose)</span>
            <ProgressBar percent={75} color="rose" data-testid="progress-75" />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>100% (Neutral)</span>
            <ProgressBar percent={100} color="neutral" data-testid="progress-100" />
          </div>
        </div>
      </section>

      {/* MetricRow Section */}
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          MetricRow Component
        </div>
        <div
          style={{
            backgroundColor: 'rgb(var(--shell-surface))',
            padding: '16px',
            borderRadius: '6px',
            maxWidth: '600px',
          }}
        >
          <MetricRow
            label="CPU Usage"
            value={72}
            unit="%"
            percent={72}
            sparklineData={[45, 52, 48, 65, 72, 68, 75, 70, 72, 68]}
            color="amber"
            data-testid="metric-row-cpu"
          />
          <MetricRow
            label="Memory"
            value={1084}
            unit="MB"
            percent={45}
            sparklineData={[890, 920, 950, 1000, 1050, 1080, 1084, 1075, 1070, 1065]}
            color="emerald"
            data-testid="metric-row-memory"
          />
          <MetricRow
            label="Network I/O"
            value={234}
            unit="Mbps"
            percent={85}
            sparklineData={[150, 180, 200, 220, 210, 230, 234, 225, 220, 215]}
            color="cyan"
            data-testid="metric-row-network"
          />
          <MetricRow
            label="Error Rate"
            value={5}
            unit="%"
            percent={5}
            sparklineData={[2, 3, 2, 4, 5, 4, 3, 5, 4, 2]}
            color="rose"
            data-testid="metric-row-error"
          />
        </div>
      </section>
    </div>
  )
}
