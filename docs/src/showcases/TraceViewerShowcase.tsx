import React, { useMemo, useRef, useState } from 'react'
import { TraceViewer, fromOTLP, fromXRay, SegmentedControl, type SpanStatus, type TraceSpan } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'
import { sampleOtlpTrace, sampleOtlpJson, deriveSeverity } from '@/test-pages/fixtures/sampleOtlpTrace'
import { sampleXRaySegment, sampleXRayJson, deriveXRaySeverity } from '@/test-pages/fixtures/sampleXRayTrace'

const mono = 'var(--font-mono, monospace)'
const border = 'rgb(var(--canvas-border))'

function Frame({ height = 520, children }: { height?: number; children: React.ReactNode }) {
  return (
    <div style={{ height, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>{children}</div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: '12px 14px',
        background: 'rgb(var(--canvas-bg-2))',
        border: `1px solid ${border}`,
        borderRadius: 8,
        fontFamily: mono,
        fontSize: 12,
        lineHeight: 1.6,
        color: 'rgb(var(--canvas-fg-1))',
        overflowX: 'auto',
      }}
    >
      {children}
    </pre>
  )
}

type Parsed =
  | { trace: ReturnType<typeof fromOTLP>; derive: (s: TraceSpan) => SpanStatus; kind: string; error?: undefined }
  | { error: string; trace?: undefined }

function parseInput(text: string): Parsed {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (e) {
    return { error: 'Invalid JSON — ' + (e as Error).message }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = json as any
  const looksOtlp = j && typeof j === 'object' && Array.isArray(j.resourceSpans)
  const looksXray =
    j &&
    (j.trace_id ||
      j.Traces ||
      j.traces ||
      j.Segments ||
      j.segments ||
      (Array.isArray(j) && j[0]?.trace_id) ||
      j.subsegments ||
      j.start_time)
  try {
    if (looksOtlp) return { trace: fromOTLP(j), derive: deriveSeverity, kind: 'OTLP' }
    if (looksXray) return { trace: fromXRay(j), derive: deriveXRaySeverity, kind: 'AWS X-Ray' }
  } catch (e) {
    return { error: 'Adapter error — ' + (e as Error).message }
  }
  return { error: 'Unrecognized format. Expected OTLP (a `resourceSpans` array) or AWS X-Ray (a `trace_id` segment document).' }
}

function LiveLoader() {
  const [tab, setTab] = useState<string>('otlp')
  const [text, setText] = useState<string>(sampleOtlpJson)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onTab = (value: string | number) => {
    const v = String(value)
    setTab(v)
    if (v === 'otlp') setText(sampleOtlpJson)
    else if (v === 'xray') setText(sampleXRayJson)
  }

  const onText = (next: string) => {
    setText(next)
    setTab('paste')
  }

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => onText(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const parsed = useMemo(() => parseInput(text), [text])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <SegmentedControl
          value={tab}
          onChange={onTab}
          options={[
            { value: 'otlp', label: 'Sample OTLP' },
            { value: 'xray', label: 'Sample X-Ray' },
            { value: 'paste', label: 'Paste / drop JSON' },
          ]}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            padding: '6px 10px',
            borderRadius: 6,
            border: `1px solid rgb(var(--canvas-border-strong))`,
            background: 'rgb(var(--canvas-bg))',
            color: 'rgb(var(--canvas-fg-1))',
            cursor: 'pointer',
          }}
        >
          Choose .json file…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) readFile(f)
          }}
        />
        {parsed.trace ? (
          <span style={{ fontFamily: mono, fontSize: 11, color: 'rgb(var(--status-ok-fg))' }}>
            ✓ {parsed.kind} · {parsed.trace.spans.length} spans
          </span>
        ) : (
          <span style={{ fontFamily: mono, fontSize: 11, color: 'rgb(var(--status-error-fg))' }}>{parsed.error}</span>
        )}
      </div>

      <textarea
        value={text}
        spellCheck={false}
        onChange={(e) => onText(e.target.value)}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) readFile(f)
        }}
        style={{
          width: '100%',
          height: 130,
          resize: 'vertical',
          fontFamily: mono,
          fontSize: 11.5,
          lineHeight: 1.5,
          padding: 10,
          borderRadius: 8,
          border: `1px solid ${dragOver ? 'rgb(var(--accent-primary))' : border}`,
          boxShadow: dragOver ? 'var(--focus-ring)' : 'none',
          background: 'rgb(var(--canvas-bg-2))',
          color: 'rgb(var(--canvas-fg-1))',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      <Frame height={520}>
        {parsed.trace ? (
          <TraceViewer trace={parsed.trace} deriveStatus={parsed.derive} />
        ) : (
          <div style={{ padding: 40, fontFamily: mono, fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>{parsed.error}</div>
        )}
      </Frame>
    </div>
  )
}

export function TraceViewerShowcase() {
  return (
    <div>
      <PageHeader
        name="TraceViewer"
        description="A three-column distributed-trace waterfall — span tree, service-colored waterfall with a parent→child connector bus, and a fly-out detail panel. Ingests OpenTelemetry (OTLP) traces natively and ships an AWS X-Ray adapter; both normalize to the same span model. Keyboard-navigable, virtualized, light + dark canvas."
      />

      <ShowcaseSection label="OTLP trace" description="Raw OTLP/JSON passed via the `otlp` prop — adapted natively by `fromOTLP`. OTLP has no 'warn'; the demo derives it from a `heimdall.severity` attribute via `deriveStatus`.">
        <Frame>
          <TraceViewer otlp={sampleOtlpTrace} deriveStatus={deriveSeverity} />
        </Frame>
      </ShowcaseSection>

      <ShowcaseSection label="AWS X-Ray trace" description="An AWS X-Ray segment document passed via the `xray` prop — adapted natively by `fromXRay` (trace-id reformat, epoch-seconds timing, namespace→kind, fault→error, cause→exception, recursive subsegments).">
        <Frame>
          <TraceViewer xray={sampleXRaySegment} deriveStatus={deriveXRaySeverity} />
        </Frame>
      </ShowcaseSection>

      <ShowcaseSection label="Live loader" description="Pick a sample, paste, or drop a .json file. Format is auto-detected (OTLP `resourceSpans` vs X-Ray `trace_id`) and rendered live — the developer experience of pointing the viewer at a real trace export.">
        <LiveLoader />
      </ShowcaseSection>

      <ShowcaseSection label="Adapters" description="The adapters are pure functions exported alongside the component, so you can normalize once and feed `trace`, or let the component adapt inline via `otlp` / `xray`.">
        <Code>{`import { TraceViewer, fromOTLP, fromXRay } from '@tinkermonkey/heimdall-ui'

// 1 — native ingestion (component adapts internally)
<TraceViewer otlp={otlpExportRequest} />
<TraceViewer xray={xraySegmentDocument} />

// 2 — adapt programmatically, then pass the normalized trace
const trace = fromOTLP(otlpExportRequest)   // -> { spans, services, meta }
const trace = fromXRay(xraySegmentDocument)
<TraceViewer trace={trace} />

// OTLP/X-Ray carry no "warn" — derive your own from attributes/codes:
<TraceViewer otlp={data} deriveStatus={(s) =>
  Number(s.statusCode) >= 400 && Number(s.statusCode) < 500 ? 'warn' : s.status
} />`}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="trace" type="Trace" description="Normalized trace ({ spans, services?, meta? }). Provide one of trace / otlp / xray." />
          <PropRow name="otlp" type="OtlpTracesData" description="Raw OTLP/JSON ExportTraceServiceRequest — adapted via fromOTLP." />
          <PropRow name="xray" type="XRaySegment | XRaySegment[]" description="Raw AWS X-Ray segment document(s) — adapted via fromXRay." />
          <PropRow name="selectedSpanId" type="string | null" description="Controlled selected span (null closes the panel)." />
          <PropRow name="onSelectSpan" type="(id: string | null) => void" description="Selection change callback." />
          <PropRow name="defaultCollapsedSpanIds" type="string[]" description="Initially collapsed subtrees (uncontrolled)." />
          <PropRow name="services" type="Record<string, ServiceInfo>" description="Override/extend service label, color, host." />
          <PropRow name="serviceColor" type="(service) => string" description="Override service → color resolution." />
          <PropRow name="deriveStatus" type="(span) => SpanStatus" description="Refine status (e.g. derive 'warn')." />
          <PropRow name="enableZoom" type="boolean" def="true" description="Brush-to-zoom on the time axis." />
          <PropRow name="showSummary" type="boolean" def="true" description="Show the header summary strip." />
          <PropRow name="showToolbar" type="boolean" def="true" description="Show the expand/error/zoom toolbar." />
          <PropRow name="showDetailPanel" type="boolean" def="true" description="Show the fly-out detail panel." />
          <PropRow name="virtualizeThreshold" type="number" def="80" description="Virtualize the row list at/above this many rows." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
