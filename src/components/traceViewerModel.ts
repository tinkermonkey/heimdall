/**
 * TraceViewer data model + helpers.
 *
 * The normalized `Trace`/`TraceSpan` shape is the contract every input feeds
 * into — whether supplied directly, or produced by the `fromOTLP` / `fromXRay`
 * adapters (see src/utils/otlpTrace.ts, src/utils/xrayTrace.ts).
 *
 * Times are milliseconds. `start` is an offset from the trace's first span.
 */

export type SpanStatus = 'ok' | 'warn' | 'error'

export type SpanKind = 'INTERNAL' | 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER' | 'UNSPECIFIED'

export interface SpanEvent {
  /** ms offset from trace start */
  time: number
  name: string
  attributes?: Record<string, string | number | boolean>
}

export interface TraceSpan {
  /** Stable span id (hex for OTLP/X-Ray). */
  id: string
  /** Parent span id, or null for a root span. */
  parentId: string | null
  name: string
  /** Service key — resolves to a `ServiceInfo` (label/color/host). */
  service: string
  kind: SpanKind
  /** ms offset from trace start. */
  start: number
  /** ms duration. */
  duration: number
  status: SpanStatus
  /** HTTP/gRPC status code surfaced in the detail panel. */
  statusCode?: number | string
  attributes?: Record<string, string | number | boolean>
  exception?: { type?: string; message?: string; stacktrace?: string }
  events?: SpanEvent[]
}

export interface ServiceInfo {
  label?: string
  /** CSS color (hex/rgb). When omitted a deterministic palette color is used. */
  color?: string
  host?: string
  kind?: string
}

export interface TraceMeta {
  traceId: string
  name?: string
  rootService?: string
  startedAt?: string
  sampler?: string
  collector?: string
}

export interface Trace {
  spans: TraceSpan[]
  /** Optional service registry (label/color/host per service key). */
  services?: Record<string, ServiceInfo>
  meta?: TraceMeta
}

/* ------------------------------------------------------------------ model -- */

export interface TraceModelNode extends TraceSpan {
  /** start + duration (ms). */
  end: number
  depth: number
  children: TraceModelNode[]
  hasChildren: boolean
}

export interface TraceModel {
  byId: Record<string, TraceModelNode>
  /** Preorder (depth-first) list of all spans. */
  ordered: TraceModelNode[]
  roots: TraceModelNode[]
  /** Trace end (ms) = max span end. */
  total: number
  maxDepth: number
}

/**
 * Build the render model from a flat span list: links parents, sorts each
 * sibling group by start, walks preorder assigning depth, and computes totals.
 * Spans whose `parentId` references a missing span are promoted to roots.
 */
export function buildTraceModel(spans: TraceSpan[]): TraceModel {
  const byId: Record<string, TraceModelNode> = {}
  spans.forEach((s) => {
    byId[s.id] = { ...s, end: s.start + s.duration, depth: 0, children: [], hasChildren: false }
  })

  const roots: TraceModelNode[] = []
  spans.forEach((s) => {
    const node = byId[s.id]
    if (s.parentId && byId[s.parentId] && s.parentId !== s.id) {
      byId[s.parentId].children.push(node)
    } else {
      roots.push(node)
    }
  })

  const byStart = (a: TraceModelNode, b: TraceModelNode) => a.start - b.start || a.end - b.end
  roots.sort(byStart)

  const ordered: TraceModelNode[] = []
  let maxDepth = 0
  const walk = (node: TraceModelNode, depth: number) => {
    node.depth = depth
    node.hasChildren = node.children.length > 0
    if (depth > maxDepth) maxDepth = depth
    ordered.push(node)
    node.children.sort(byStart)
    node.children.forEach((c) => walk(c, depth + 1))
  }
  roots.forEach((r) => walk(r, 0))

  // reduce (not Math.max(...spread)) — avoids a RangeError on very large traces
  const total = ordered.reduce((m, s) => (s.end > m ? s.end : m), 0)
  return { byId, ordered, roots, total, maxDepth }
}

/**
 * Self time = own duration minus the union of direct-children intervals
 * (clamped to the parent's window). Approximates time spent in this span
 * rather than waiting on children.
 */
export function selfTime(span: TraceModelNode): number {
  if (!span.children.length) return span.duration
  const intervals = span.children
    .map((c) => [Math.max(c.start, span.start), Math.min(c.end, span.end)] as [number, number])
    .filter(([a, b]) => b > a)
    .sort((p, q) => p[0] - q[0])

  let covered = 0
  let curStart: number | null = null
  let curEnd = 0
  intervals.forEach(([a, b]) => {
    if (curStart === null) {
      curStart = a
      curEnd = b
    } else if (a <= curEnd) {
      curEnd = Math.max(curEnd, b)
    } else {
      covered += curEnd - curStart
      curStart = a
      curEnd = b
    }
  })
  if (curStart !== null) covered += curEnd - curStart
  return Math.max(0, span.duration - covered)
}

/** Visible preorder rows, honoring the collapsed set (hides collapsed subtrees). */
export function visibleRows(ordered: TraceModelNode[], collapsed: Set<string>): TraceModelNode[] {
  const out: TraceModelNode[] = []
  const hidden = new Set<string>()
  ordered.forEach((s) => {
    if (s.parentId && hidden.has(s.parentId)) {
      hidden.add(s.id)
      return
    }
    out.push(s)
    if (collapsed.has(s.id)) hidden.add(s.id)
  })
  return out
}

/** Count of all descendants under a node (for the "+N" collapsed badge). */
export function descendantCount(node: TraceModelNode): number {
  let n = 0
  const walk = (x: TraceModelNode) => {
    x.children.forEach((c) => {
      n++
      walk(c)
    })
  }
  walk(node)
  return n
}

/* ------------------------------------------------------------- time scale -- */

/** % inset on each side of the time lane. */
export const WF_PAD = 2

export interface TimeScale {
  /** time (ms) -> left % within the lane */
  x: (t: number) => number
  /** duration (ms) -> width % within the lane */
  w: (d: number) => number
}

/** Build a linear time->percent scale for the window [t0, t1] with edge padding. */
export function createTimeScale(t0: number, t1: number, pad = WF_PAD): TimeScale {
  const span = Math.max(1e-6, t1 - t0)
  const usable = 100 - 2 * pad
  return {
    x: (t: number) => pad + ((t - t0) / span) * usable,
    w: (d: number) => Math.max(0.5, (d / span) * usable),
  }
}

/** "Nice" axis ticks across [t0, t1] (~8 divisions, rounded to 1/2/5·10ⁿ). */
export function niceTicks(t0: number, t1: number): { ticks: number[]; step: number } {
  const range = Math.max(1e-6, t1 - t0)
  const raw = range / 8
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = mag * (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10)
  const ticks: number[] = []
  const first = Math.ceil(t0 / step - 1e-9) * step
  for (let t = first; t <= t1 + 1e-6; t += step) ticks.push(+t.toFixed(3))
  return { ticks, step }
}

/** Human-friendly millisecond formatter (s / ms / sub-ms). */
export function fmtMs(ms: number | null | undefined): string {
  if (ms == null) return '—'
  if (ms >= 1000) return (ms / 1000).toFixed(2) + ' s'
  if (ms >= 10) return ms.toFixed(0) + ' ms'
  if (ms >= 1) return ms.toFixed(1) + ' ms'
  return ms.toFixed(2) + ' ms'
}

/* --------------------------------------------------------- service colors -- */

/**
 * Default service color palette — distinct hues from the Heimdall semantic
 * range. Rose is intentionally excluded (reserved for error markers).
 */
export const DEFAULT_SERVICE_PALETTE = [
  '#22D3EE', // cyan
  '#818CF8', // indigo
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#14B8A6', // teal
  '#F59E0B', // amber
  '#38BDF8', // sky
  '#A3E635', // lime
  '#E879F9', // fuchsia
  '#2DD4BF', // teal-300
] as const

function hashString(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Deterministic color for a service key from the palette. */
export function paletteColor(service: string, palette: readonly string[] = DEFAULT_SERVICE_PALETTE): string {
  return palette[hashString(service) % palette.length]
}

/**
 * Resolve a service's display color, preferring (1) an explicit `serviceColor`
 * callback, (2) `services[key].color`, then (3) the deterministic palette.
 */
export function resolveServiceColor(
  service: string,
  services?: Record<string, ServiceInfo>,
  serviceColor?: (service: string) => string | undefined,
  palette: readonly string[] = DEFAULT_SERVICE_PALETTE
): string {
  return serviceColor?.(service) || services?.[service]?.color || paletteColor(service, palette)
}

/** Resolve a service's display label (falls back to the raw key). */
export function resolveServiceLabel(service: string, services?: Record<string, ServiceInfo>): string {
  return services?.[service]?.label || service
}
