/**
 * fromXRay — convert AWS X-Ray segment documents into the normalized `Trace`.
 *
 * Mirrors the AWS Distro for OpenTelemetry (ADOT) X-Ray translators:
 *  - `trace_id` `1-{8hex}-{24hex}` -> 32-hex OTLP traceId
 *  - `start_time`/`end_time` epoch SECONDS (float) -> ms offsets
 *  - segment name = service.name; subsegment namespace aws/remote -> CLIENT
 *  - fault/error/throttle -> error status; `cause.exceptions` -> exception
 *  - `subsegments[]` walked recursively into the span tree
 *
 * Accepts one segment, an array of segments, or an X-Ray `BatchGetTraces`
 * response (`{ Traces: [{ Segments: [{ Document }] }] }`) whose Documents may
 * be JSON strings.
 */

import type {
  Trace,
  TraceSpan,
  SpanEvent,
  SpanKind,
  SpanStatus,
  ServiceInfo,
} from '../components/traceViewerModel'

type Primitive = string | number | boolean

/* ----------------------------------------------------------------- types -- */

export interface XRayHttp {
  request?: { method?: string; url?: string; user_agent?: string; client_ip?: string }
  response?: { status?: number; content_length?: number }
}
export interface XRayStackFrame {
  path?: string
  line?: number
  label?: string
}
export interface XRayException {
  id?: string
  message?: string
  type?: string
  remote?: boolean
  stack?: XRayStackFrame[]
}
export interface XRayCause {
  working_directory?: string
  paths?: string[]
  exceptions?: XRayException[]
}
export interface XRaySql {
  url?: string
  connection_string?: string
  sanitized_query?: string
  database_type?: string
  database_version?: string
  user?: string
}
export interface XRaySubsegment {
  id: string
  name: string
  trace_id?: string
  parent_id?: string
  start_time: number
  end_time?: number
  in_progress?: boolean
  type?: string
  namespace?: string
  fault?: boolean
  error?: boolean
  throttle?: boolean
  http?: XRayHttp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aws?: Record<string, any>
  sql?: XRaySql
  annotations?: Record<string, Primitive>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
  cause?: string | XRayCause
  inferred?: boolean
  subsegments?: XRaySubsegment[]
}
export interface XRaySegment extends XRaySubsegment {
  origin?: string
  service?: { version?: string }
  user?: string
}

export interface FromXRayOptions {
  /** optional status refinement, e.g. to map 4xx `error` to 'warn'. */
  deriveStatus?: (span: TraceSpan) => SpanStatus
}

/* ------------------------------------------------------------- primitives -- */

/** X-Ray `1-{8hex}-{24hex}` -> 32-hex; passthrough for already-hex ids. */
function xrayTraceIdToHex(tid: string | undefined): string {
  if (!tid) return ''
  const parts = tid.split('-')
  if (parts.length === 3) return (parts[1] + parts[2]).toLowerCase()
  return tid.replace(/-/g, '').toLowerCase()
}

function kindOf(node: XRaySubsegment, isRoot: boolean): SpanKind {
  if (isRoot) return 'SERVER'
  if (node.namespace === 'aws' || node.namespace === 'remote') return 'CLIENT'
  return 'INTERNAL'
}

function statusOf(node: XRaySubsegment): SpanStatus {
  if (node.fault || node.error || node.throttle) return 'error'
  return 'ok'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenInto(target: Record<string, Primitive>, prefix: string, obj: any): void {
  if (obj == null) return
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    target[prefix] = Array.isArray(obj) ? JSON.stringify(obj) : (obj as Primitive)
    return
  }
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null) return // drop null/undefined leaves (attributes are non-null primitives)
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && !Array.isArray(v)) {
      flattenInto(target, key, v)
    } else {
      target[key] = Array.isArray(v) ? JSON.stringify(v) : (v as Primitive)
    }
  })
}

function buildAttributes(node: XRaySubsegment): Record<string, Primitive> {
  const attrs: Record<string, Primitive> = {}
  const req = node.http?.request
  const res = node.http?.response
  if (req?.method != null) attrs['http.request.method'] = req.method
  if (req?.url != null) attrs['url.full'] = req.url
  if (req?.user_agent != null) attrs['user_agent.original'] = req.user_agent
  if (req?.client_ip != null) attrs['client.address'] = req.client_ip
  if (res?.status != null) attrs['http.response.status_code'] = res.status
  if (res?.content_length != null) attrs['http.response.body.size'] = res.content_length

  if (node.sql) {
    const sql = node.sql
    if (sql.database_type != null) attrs['db.system'] = sql.database_type
    if (sql.sanitized_query != null) attrs['db.statement'] = sql.sanitized_query
    if (sql.url != null) attrs['server.address'] = sql.url
    if (sql.user != null) attrs['db.user'] = sql.user
  }

  if (node.namespace) attrs['aws.xray.namespace'] = node.namespace
  if (node.throttle) attrs['aws.xray.throttle'] = true
  if ('origin' in node && (node as XRaySegment).origin) {
    attrs['cloud.platform'] = String((node as XRaySegment).origin)
  }

  if (node.aws) flattenInto(attrs, 'aws', node.aws)
  if (node.annotations) Object.entries(node.annotations).forEach(([k, v]) => { attrs[k] = v })
  if (node.metadata) flattenInto(attrs, 'metadata', node.metadata)
  return attrs
}

function exceptionOf(node: XRaySubsegment): { exception?: TraceSpan['exception']; statusCode?: number } {
  let exception: TraceSpan['exception']
  if (node.cause && typeof node.cause === 'object' && node.cause.exceptions?.length) {
    const ex = node.cause.exceptions[0]
    const stacktrace = ex.stack?.length
      ? `${ex.type ?? 'Error'}: ${ex.message ?? ''}\n` +
        ex.stack.map((f) => `    at ${f.label ?? '<anonymous>'} (${f.path ?? '?'}:${f.line ?? 0})`).join('\n')
      : undefined
    exception = { type: ex.type, message: ex.message, stacktrace }
  } else if (typeof node.cause === 'string') {
    // cause as a bare exception id — surface that an error occurred
    exception = { type: 'Error', message: `exception ${node.cause}` }
  }
  return { exception, statusCode: node.http?.response?.status }
}

/* ------------------------------------------------------------- input prep -- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeInput(input: any): XRaySegment[] {
  if (input == null) return []
  if (Array.isArray(input)) return input.flatMap(normalizeInput)
  // BatchGetTraces response: { Traces: [{ Segments: [{ Document }] }] }
  if (input.Traces || input.traces) {
    const traces = (input.Traces ?? input.traces) as { Segments?: { Document?: string | object }[] }[]
    // fromXRay returns a single Trace; if the response carries multiple distinct
    // traces, use only the first rather than silently merging their timelines.
    let chosen = traces
    if (traces.length > 1) {
      // eslint-disable-next-line no-console
      console.warn(`fromXRay: response has ${traces.length} traces; using the first. Pass one trace at a time for the rest.`)
      chosen = traces.slice(0, 1)
    }
    return chosen.flatMap((t) =>
      (t.Segments ?? []).map((seg) =>
        typeof seg.Document === 'string' ? JSON.parse(seg.Document) : (seg.Document as XRaySegment)
      )
    )
  }
  if (input.Segments || input.segments) {
    const segs = input.Segments ?? input.segments
    return (segs as { Document?: string | object }[]).map((seg) =>
      typeof seg.Document === 'string' ? JSON.parse(seg.Document) : (seg.Document as XRaySegment)
    )
  }
  // a single segment document
  return [input as XRaySegment]
}

/* ---------------------------------------------------------------- adapter -- */

export function fromXRay(input: XRaySegment | XRaySegment[] | unknown, opts: FromXRayOptions = {}): Trace {
  const segments = normalizeInput(input)
  if (segments.length === 0) return { spans: [], services: {}, meta: { traceId: '' } }

  // Pass 1: flatten the (sub)segment tree, resolving effective parent + service.
  interface Flat {
    node: XRaySubsegment
    parentId: string | null
    service: string
    isRoot: boolean
  }
  const flat: Flat[] = []
  const services: Record<string, ServiceInfo> = {}

  const walk = (node: XRaySubsegment, parentId: string | null, service: string, isRoot: boolean) => {
    flat.push({ node, parentId, service, isRoot })
    ;(node.subsegments ?? []).forEach((child) => walk(child, node.id, service, false))
  }
  segments.forEach((seg) => {
    const isSubsegment = seg.type === 'subsegment'
    const service = seg.name
    if (!services[service]) {
      // X-Ray segments carry no hostname; `origin` is a resource type and is
      // surfaced as the cloud.platform attribute instead (see buildAttributes).
      services[service] = { label: service }
    }
    walk(seg, seg.parent_id ?? null, service, !isSubsegment)
  })

  // traceStart / traceEnd in epoch seconds across the whole flattened tree.
  let traceStartSec = Infinity
  let traceEndSec = -Infinity
  flat.forEach(({ node }) => {
    if (typeof node.start_time === 'number') traceStartSec = Math.min(traceStartSec, node.start_time)
    if (typeof node.end_time === 'number') traceEndSec = Math.max(traceEndSec, node.end_time)
  })
  if (!Number.isFinite(traceStartSec)) traceStartSec = 0
  if (!Number.isFinite(traceEndSec)) traceEndSec = traceStartSec

  // Pass 2: build normalized spans.
  const spans: TraceSpan[] = flat.map(({ node, parentId, service, isRoot }) => {
    const startSec = typeof node.start_time === 'number' ? node.start_time : traceStartSec
    const start = (startSec - traceStartSec) * 1000
    const endSec = typeof node.end_time === 'number' ? node.end_time : traceEndSec
    const duration = Math.max(0, (endSec - startSec) * 1000)

    const attributes = buildAttributes(node)
    const { exception, statusCode } = exceptionOf(node)

    const events: SpanEvent[] | undefined = exception
      ? [
          {
            time: start,
            name: 'exception',
            attributes: {
              'exception.type': exception.type ?? '',
              'exception.message': exception.message ?? '',
            },
          },
        ]
      : undefined

    const built: TraceSpan = {
      // coerce defensively: ids/name may be numeric or missing in malformed docs
      id: String(node.id ?? '').toLowerCase(),
      parentId: parentId != null ? String(parentId).toLowerCase() : null,
      name: String(node.name ?? '(unnamed)'),
      service,
      kind: kindOf(node, isRoot),
      start,
      duration,
      status: statusOf(node),
      statusCode,
      attributes,
      exception,
      events,
    }
    return opts.deriveStatus ? { ...built, status: opts.deriveStatus(built) } : built
  })

  const root = segments.find((s) => s.type !== 'subsegment') ?? segments[0]
  const meta = {
    traceId: xrayTraceIdToHex(root.trace_id),
    name: root.name,
    rootService: root.name,
  }

  return { spans, services, meta }
}
