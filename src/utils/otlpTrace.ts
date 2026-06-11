/**
 * fromOTLP — convert OTLP trace data into the normalized `Trace` model.
 *
 * Accepts the OTLP/JSON `ExportTraceServiceRequest` shape emitted by an
 * otel-collector / SigNoz / OTLP-HTTP, OR a bare `resourceSpans[]` array.
 *
 * Handles the two encodings seen in the wild:
 *  - ids as case-insensitive hex (OTLP/JSON spec) OR base64 (canonical ProtoJSON)
 *  - `*UnixNano` as decimal strings parsed with BigInt (values exceed 2^53)
 *  - enums as integers OR `SPAN_KIND_*` / `STATUS_CODE_*` name strings
 */

import type {
  Trace,
  TraceSpan,
  SpanEvent,
  SpanKind,
  SpanStatus,
  ServiceInfo,
} from '../components/traceViewerModel'

/* ----------------------------------------------------------------- types -- */

export interface OtlpAnyValue {
  stringValue?: string
  boolValue?: boolean
  intValue?: string | number
  doubleValue?: number
  bytesValue?: string
  arrayValue?: { values?: OtlpAnyValue[] }
  kvlistValue?: { values?: OtlpKeyValue[] }
}
export interface OtlpKeyValue {
  key: string
  value?: OtlpAnyValue
}
export interface OtlpEvent {
  timeUnixNano?: string | number
  name?: string
  attributes?: OtlpKeyValue[]
}
export interface OtlpSpan {
  traceId?: string
  spanId?: string
  parentSpanId?: string
  name?: string
  kind?: number | string
  startTimeUnixNano?: string | number
  endTimeUnixNano?: string | number
  attributes?: OtlpKeyValue[]
  status?: { code?: number | string; message?: string }
  events?: OtlpEvent[]
}
export interface OtlpResourceSpans {
  resource?: { attributes?: OtlpKeyValue[] }
  scopeSpans?: { scope?: unknown; spans?: OtlpSpan[] }[]
  /** legacy field name (pre-0.9 collector) */
  instrumentationLibrarySpans?: { spans?: OtlpSpan[] }[]
}
export interface OtlpTracesData {
  resourceSpans?: OtlpResourceSpans[]
}

export interface FromOtlpOptions {
  /** resource attribute key carrying the service name (default "service.name"). */
  serviceNameKey?: string
  /** optional status refinement, e.g. to derive 'warn' from a 4xx code. */
  deriveStatus?: (span: TraceSpan) => SpanStatus
}

/* ------------------------------------------------------------- primitives -- */

const HEX_RE = /^[0-9a-fA-F]+$/

function b64ToHex(b64: string): string {
  // Browser (atob) with a Node Buffer fallback for the test runner.
  let binary: string
  if (typeof atob === 'function') {
    binary = atob(b64)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    binary = (globalThis as any).Buffer.from(b64, 'base64').toString('binary')
  }
  let hex = ''
  for (let i = 0; i < binary.length; i++) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, '0')
  }
  return hex
}

/** Normalize an OTLP id (hex or base64) to lowercase hex of `hexLen` chars. */
function normalizeId(raw: string | undefined, hexLen: number): string {
  if (!raw) return ''
  if (HEX_RE.test(raw) && raw.length === hexLen) return raw.toLowerCase()
  // base64 (or any non-hex string) -> decode to hex
  try {
    return b64ToHex(raw).toLowerCase()
  } catch {
    return raw.toLowerCase()
  }
}

/** Treat empty / all-zero ids as absent. */
function idOrNull(hex: string): string | null {
  if (!hex || /^0+$/.test(hex)) return null
  return hex
}

const KIND_NAMES: SpanKind[] = ['UNSPECIFIED', 'INTERNAL', 'SERVER', 'CLIENT', 'PRODUCER', 'CONSUMER']

function mapKind(k: number | string | undefined): SpanKind {
  if (typeof k === 'number') return KIND_NAMES[k] ?? 'UNSPECIFIED'
  if (typeof k === 'string') {
    const up = k.replace(/^SPAN_KIND_/, '').toUpperCase()
    return (KIND_NAMES as string[]).includes(up) ? (up as SpanKind) : 'UNSPECIFIED'
  }
  return 'UNSPECIFIED'
}

function mapStatus(code: number | string | undefined): SpanStatus {
  // collectors may stringify the enum ("2") alongside the *UnixNano decimals
  const c = typeof code === 'string' && /^\d+$/.test(code) ? Number(code) : code
  if (c === 2 || c === 'STATUS_CODE_ERROR') return 'error'
  return 'ok'
}

type Primitive = string | number | boolean

function anyValueToJs(v: OtlpAnyValue | undefined): Primitive {
  if (!v) return ''
  if (v.stringValue !== undefined) return v.stringValue
  if (v.boolValue !== undefined) return v.boolValue
  if (v.intValue !== undefined) {
    const n = Number(v.intValue)
    return Number.isSafeInteger(n) ? n : String(v.intValue)
  }
  if (v.doubleValue !== undefined) return v.doubleValue
  if (v.bytesValue !== undefined) return v.bytesValue
  if (v.arrayValue) return JSON.stringify((v.arrayValue.values ?? []).map(anyValueToJs))
  if (v.kvlistValue) return JSON.stringify(flattenAttributes(v.kvlistValue.values))
  return ''
}

function flattenAttributes(kvs: OtlpKeyValue[] | undefined): Record<string, Primitive> {
  const out: Record<string, Primitive> = {}
  ;(kvs ?? []).forEach((kv) => {
    if (kv && kv.key) out[kv.key] = anyValueToJs(kv.value)
  })
  return out
}

function findAttr(attrs: OtlpKeyValue[] | undefined, key: string): Primitive | undefined {
  const kv = (attrs ?? []).find((a) => a.key === key)
  return kv ? anyValueToJs(kv.value) : undefined
}

const STATUS_CODE_KEYS = ['http.response.status_code', 'http.status_code', 'rpc.grpc.status_code']

/* ---------------------------------------------------------------- adapter -- */

export function fromOTLP(payload: OtlpTracesData | OtlpResourceSpans[], opts: FromOtlpOptions = {}): Trace {
  const serviceNameKey = opts.serviceNameKey ?? 'service.name'
  const resourceSpans: OtlpResourceSpans[] = Array.isArray(payload) ? payload : payload?.resourceSpans ?? []

  const services: Record<string, ServiceInfo> = {}
  // Collect (span, owningService) pairs first so traceStart spans all resources.
  const collected: { span: OtlpSpan; service: string }[] = []

  resourceSpans.forEach((rs) => {
    const resourceAttrs = rs.resource?.attributes
    const service = String(findAttr(resourceAttrs, serviceNameKey) ?? 'unknown_service')
    if (!services[service]) {
      const host = findAttr(resourceAttrs, 'host.name') ?? findAttr(resourceAttrs, 'service.instance.id')
      services[service] = { label: service, host: host != null ? String(host) : undefined }
    }
    const scopes = rs.scopeSpans ?? rs.instrumentationLibrarySpans ?? []
    scopes.forEach((sc) => {
      ;(sc.spans ?? []).forEach((span) => collected.push({ span, service }))
    })
  })

  if (collected.length === 0) return { spans: [], services, meta: { traceId: '' } }

  // traceStart across the whole trace (BigInt — nano values exceed 2^53).
  let traceStart: bigint | null = null
  collected.forEach(({ span }) => {
    if (span.startTimeUnixNano != null) {
      const s = BigInt(span.startTimeUnixNano)
      if (traceStart === null || s < traceStart) traceStart = s
    }
  })
  const base = traceStart ?? 0n

  const spans: TraceSpan[] = collected.map(({ span, service }) => {
    const startNano = span.startTimeUnixNano != null ? BigInt(span.startTimeUnixNano) : base
    const endNano = span.endTimeUnixNano != null ? BigInt(span.endTimeUnixNano) : startNano
    const start = Number(startNano - base) / 1e6
    const duration = Number(endNano - startNano) / 1e6

    const attributes = flattenAttributes(span.attributes)

    let exception: TraceSpan['exception']
    const events: SpanEvent[] = (span.events ?? []).map((ev) => {
      const evAttrs = flattenAttributes(ev.attributes)
      const evStart = ev.timeUnixNano != null ? Number(BigInt(ev.timeUnixNano) - base) / 1e6 : start
      if (ev.name === 'exception' && !exception) {
        exception = {
          type: evAttrs['exception.type'] != null ? String(evAttrs['exception.type']) : undefined,
          message: evAttrs['exception.message'] != null ? String(evAttrs['exception.message']) : undefined,
          stacktrace: evAttrs['exception.stacktrace'] != null ? String(evAttrs['exception.stacktrace']) : undefined,
        }
      }
      return { time: evStart, name: ev.name ?? 'event', attributes: evAttrs }
    })

    let statusCode: TraceSpan['statusCode']
    for (const key of STATUS_CODE_KEYS) {
      const v = attributes[key]
      if (v !== undefined) {
        statusCode = typeof v === 'boolean' ? String(v) : v
        break
      }
    }

    const base$: TraceSpan = {
      id: normalizeId(span.spanId, 16),
      parentId: idOrNull(normalizeId(span.parentSpanId, 16)),
      name: span.name ?? '(unnamed)',
      service,
      kind: mapKind(span.kind),
      start,
      duration,
      status: mapStatus(span.status?.code),
      statusCode,
      attributes,
      exception,
      events: events.length ? events : undefined,
    }
    return opts.deriveStatus ? { ...base$, status: opts.deriveStatus(base$) } : base$
  })

  const root = spans.find((s) => s.parentId === null) ?? spans[0]
  const traceId = normalizeId(collected[0].span.traceId, 32)
  const meta = {
    traceId,
    name: root?.name,
    rootService: root?.service,
  }

  return { spans, services, meta }
}
