import { useMemo } from 'react'
import { TraceViewer, fromOTLP, fromXRay } from '../index'
import { sampleOtlpTrace, deriveSeverity } from './fixtures/sampleOtlpTrace'
import { sampleXRaySegment, deriveXRaySeverity } from './fixtures/sampleXRayTrace'

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(var(--canvas-fg-3))',
  margin: '0 0 10px',
}

function Frame({ label, height = 560, children }: { label: string; height?: number; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <p style={labelStyle}>{label}</p>
      <div style={{ height, border: '1px solid rgb(var(--canvas-border))', borderRadius: 8, overflow: 'hidden' }}>
        {children}
      </div>
    </section>
  )
}

export default function TraceViewerTestPage() {
  const otlp = useMemo(() => fromOTLP(sampleOtlpTrace), [])
  const xray = useMemo(() => fromXRay(sampleXRaySegment), [])

  const idByName = (spans: { id: string; name: string }[], name: string) => spans.find((s) => s.name === name)?.id

  const errorSpanId = idByName(otlp.spans, 'smtp.send email')
  const collapseId = idByName(otlp.spans, 'feedback.create')
  const xrayFaultId = idByName(xray.spans, 'smtp.send')

  return (
    <div style={{ padding: '22px 26px 40px', background: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <Frame label="OTLP trace · error span selected">
        <TraceViewer
          data-testid="trace-otlp"
          otlp={sampleOtlpTrace}
          deriveStatus={deriveSeverity}
          defaultSelectedSpanId={errorSpanId}
        />
      </Frame>

      <Frame label="OTLP trace · collapsed subtree · no selection">
        <TraceViewer
          data-testid="trace-collapsed"
          otlp={sampleOtlpTrace}
          deriveStatus={deriveSeverity}
          defaultCollapsedSpanIds={collapseId ? [collapseId] : []}
        />
      </Frame>

      <Frame label="AWS X-Ray segment document · fault span selected">
        <TraceViewer
          data-testid="trace-xray"
          xray={sampleXRaySegment}
          deriveStatus={deriveXRaySeverity}
          defaultSelectedSpanId={xrayFaultId}
        />
      </Frame>
    </div>
  )
}
