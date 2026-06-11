/**
 * Sample OTLP trace fixture — a homelab request
 *   POST /api/feedback/submit  →  gateway → auth → feedback → postgres/redis/notify
 *   with a failed external SMTP send.
 *
 * Emitted as a genuine OTLP/JSON `ExportTraceServiceRequest` (grouped into one
 * `resourceSpans` per service, ids as hex, times as nanosecond strings, enums
 * as ints) so it doubles as a copy-paste example AND exercises `fromOTLP`.
 *
 * OTLP has no "warn" status; warn spans here carry `heimdall.severity: "warn"`
 * and are surfaced via the exported `deriveSeverity` heuristic (see TraceViewer
 * `deriveStatus` prop).
 */

import type { OtlpTracesData } from '../../utils/otlpTrace'
import type { SpanStatus, TraceSpan } from '../../components/traceViewerModel'

const KIND = { INTERNAL: 1, SERVER: 2, CLIENT: 3, PRODUCER: 4, CONSUMER: 5 } as const
type KindName = keyof typeof KIND

// 2026-06-10T14:22:07.412Z as epoch nanoseconds.
const BASE_NANO = 1781446927412000000n
const nano = (ms: number) => (BASE_NANO + BigInt(Math.round(ms * 1e6))).toString()

const TRACE_ID = '4f3ae9c1d2b87a05e6c1f0a9d4b22e17'

/** Stable 16-hex span id from a seed (FNV-ish). */
function hex16(seed: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  let out = ''
  for (let i = 0; i < 16; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x01000193) >>> 0
    out += (h & 0xf).toString(16)
  }
  return out
}

interface Svc { name: string; host: string }
const SERVICES: Record<string, Svc> = {
  gateway: { name: 'edge-gateway', host: 'heimdall.lab.local' },
  auth: { name: 'auth-svc', host: 'nyx.lab.local' },
  feedback: { name: 'feedback-svc', host: 'vega.lab.local' },
  postgres: { name: 'postgres', host: 'aether.lab.local' },
  redis: { name: 'redis-cache', host: 'nyx.lab.local' },
  notify: { name: 'notify-svc', host: 'vega.lab.local' },
}

type AttrVal = string | number | boolean
interface RawSpan {
  id: string
  parentId: string | null
  svc: keyof typeof SERVICES
  name: string
  kind: KindName
  start: number
  dur: number
  status: 'ok' | 'warn' | 'error'
  code?: number
  attrs: Record<string, AttrVal>
  exception?: { type: string; message: string; stack?: string }
}

const RAW: RawSpan[] = [
  { id: 's01', parentId: null, svc: 'gateway', name: 'POST /api/feedback/submit', kind: 'SERVER', start: 0, dur: 688, status: 'ok', code: 201,
    attrs: { 'http.request.method': 'POST', 'http.route': '/api/feedback/submit', 'server.address': 'heimdall.lab.local', 'client.address': '10.0.1.4', 'http.request.body.size': 512 } },
  { id: 's02', parentId: 's01', svc: 'gateway', name: 'middleware.auth', kind: 'INTERNAL', start: 4, dur: 128, status: 'ok',
    attrs: { middleware: 'auth', 'auth.scheme': 'bearer' } },
  { id: 's03', parentId: 's02', svc: 'auth', name: 'auth.verify_token', kind: 'SERVER', start: 10, dur: 116, status: 'ok', code: 200,
    attrs: { 'auth.method': 'jwt', 'enduser.id': 'usr_8821', 'rpc.system': 'grpc', 'server.address': 'nyx.lab.local:8081' } },
  { id: 's04', parentId: 's03', svc: 'auth', name: 'jwt.decode', kind: 'INTERNAL', start: 12, dur: 10, status: 'ok',
    attrs: { 'jwt.alg': 'RS256', 'jwt.exp_in_s': 1840 } },
  { id: 's05', parentId: 's03', svc: 'redis', name: 'cache.get session:tok', kind: 'CLIENT', start: 26, dur: 18, status: 'ok',
    attrs: { 'db.system': 'redis', 'db.operation': 'GET', 'db.redis.key': 'session:tok_9f3a', 'cache.hit': true, 'server.address': 'nyx.lab.local:6379' } },
  { id: 's06', parentId: 's03', svc: 'postgres', name: 'db.query SELECT user', kind: 'CLIENT', start: 48, dur: 70, status: 'ok',
    attrs: { 'db.system': 'postgresql', 'db.name': 'identity', 'db.statement': 'SELECT id, email, roles FROM users WHERE id = $1', 'db.rows_affected': 1, 'server.address': 'aether.lab.local:5432' } },
  { id: 's07', parentId: 's06', svc: 'postgres', name: 'pg.acquire_conn', kind: 'INTERNAL', start: 50, dur: 12, status: 'ok',
    attrs: { 'db.pool.name': 'identity-ro', 'db.pool.idle': 7 } },
  { id: 's08', parentId: 's06', svc: 'postgres', name: 'pg.execute', kind: 'INTERNAL', start: 64, dur: 46, status: 'ok',
    attrs: { 'db.plan': 'Index Scan using users_pkey' } },
  { id: 's09', parentId: 's08', svc: 'postgres', name: 'pg.fetch_rows', kind: 'INTERNAL', start: 96, dur: 12, status: 'ok',
    attrs: { 'db.rows': 1 } },
  { id: 's10', parentId: 's01', svc: 'gateway', name: 'route.handler', kind: 'INTERNAL', start: 136, dur: 540, status: 'ok',
    attrs: { handler: 'feedbackController.submit' } },
  { id: 's11', parentId: 's10', svc: 'feedback', name: 'feedback.create', kind: 'SERVER', start: 140, dur: 520, status: 'ok', code: 200,
    attrs: { 'rpc.system': 'grpc', 'rpc.method': 'CreateFeedback', 'server.address': 'vega.lab.local:8090', 'feedback.id': 'fb_9f3c01' } },
  { id: 's12', parentId: 's11', svc: 'feedback', name: 'validate.payload', kind: 'INTERNAL', start: 144, dur: 12, status: 'ok',
    attrs: { validator: 'zod', fields: 6 } },
  { id: 's13', parentId: 's11', svc: 'feedback', name: 'enrich.metadata', kind: 'INTERNAL', start: 158, dur: 20, status: 'ok',
    attrs: { geoip: true, 'ua.parsed': true } },
  { id: 's14', parentId: 's11', svc: 'postgres', name: 'db.insert feedback', kind: 'CLIENT', start: 182, dur: 176, status: 'warn',
    attrs: { 'db.system': 'postgresql', 'db.name': 'feedback', 'db.statement': 'INSERT INTO feedback (id, user_id, body, meta) VALUES ($1,$2,$3,$4)', 'db.rows_affected': 1, 'server.address': 'aether.lab.local:5432', 'heimdall.severity': 'warn', note: 'slow insert (>150ms)' } },
  { id: 's15', parentId: 's14', svc: 'postgres', name: 'pg.acquire_conn', kind: 'INTERNAL', start: 184, dur: 10, status: 'ok',
    attrs: { 'db.pool.name': 'feedback-rw', 'db.pool.wait_ms': 0 } },
  { id: 's16', parentId: 's14', svc: 'postgres', name: 'pg.execute INSERT', kind: 'INTERNAL', start: 196, dur: 150, status: 'warn',
    attrs: { 'db.lock.wait_ms': 88, 'heimdall.severity': 'warn', note: 'row lock contention on feedback_pkey' } },
  { id: 's17', parentId: 's16', svc: 'postgres', name: 'index.update', kind: 'INTERNAL', start: 300, dur: 40, status: 'ok',
    attrs: { index: 'feedback_user_idx' } },
  { id: 's18', parentId: 's16', svc: 'postgres', name: 'trigger.audit_log', kind: 'INTERNAL', start: 342, dur: 4, status: 'ok',
    attrs: { trigger: 'tg_audit_feedback' } },
  { id: 's19', parentId: 's11', svc: 'redis', name: 'cache.set feedback:9f3c', kind: 'CLIENT', start: 366, dur: 14, status: 'ok',
    attrs: { 'db.system': 'redis', 'db.operation': 'SETEX', 'db.redis.key': 'feedback:9f3c01', 'ttl_s': 3600, 'server.address': 'nyx.lab.local:6379' } },
  { id: 's20', parentId: 's11', svc: 'notify', name: 'notify.enqueue', kind: 'PRODUCER', start: 384, dur: 268, status: 'warn',
    attrs: { 'messaging.system': 'rabbitmq', 'messaging.destination.name': 'notifications.email', 'messaging.message.id': 'msg_4471', 'heimdall.severity': 'warn' } },
  { id: 's21', parentId: 's20', svc: 'notify', name: 'queue.publish', kind: 'INTERNAL', start: 386, dur: 8, status: 'ok',
    attrs: { 'messaging.operation': 'publish', 'messaging.message.body.size': 1126 } },
  { id: 's22', parentId: 's20', svc: 'notify', name: 'notify.process', kind: 'CONSUMER', start: 398, dur: 250, status: 'warn',
    attrs: { 'messaging.operation': 'process', 'messaging.consumer.group.name': 'mailer-workers', 'heimdall.severity': 'warn' } },
  { id: 's23', parentId: 's22', svc: 'notify', name: 'render.template', kind: 'INTERNAL', start: 400, dur: 28, status: 'ok',
    attrs: { template: 'feedback_ack.mjml', 'render.engine': 'mjml' } },
  { id: 's24', parentId: 's22', svc: 'notify', name: 'smtp.send email', kind: 'CLIENT', start: 432, dur: 196, status: 'error', code: 0,
    attrs: { 'server.address': 'smtp.maileroo.net', 'server.port': 587, 'email.to': 'usr_8821@…', 'retry.count': 3 },
    exception: { type: 'ECONNREFUSED', message: 'connect ECONNREFUSED 10.0.3.9:587',
      stack: 'Error: connect ECONNREFUSED 10.0.3.9:587\n    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1495:16)\n    at SMTPConnection._onError (smtp-connection.js:768:21)\n    at Socket.<anonymous> (smtp-connection.js:213:14)' } },
  { id: 's25', parentId: 's24', svc: 'notify', name: 'smtp.connect', kind: 'INTERNAL', start: 434, dur: 180, status: 'error',
    attrs: { 'network.transport': 'tcp', 'network.peer.address': '10.0.3.9', 'connect.timeout_ms': 180, attempts: 3 },
    exception: { type: 'ECONNREFUSED', message: 'connect ECONNREFUSED 10.0.3.9:587 — all 3 attempts refused' } },
  { id: 's26', parentId: 's22', svc: 'notify', name: 'notify.fallback enqueue_dlq', kind: 'INTERNAL', start: 632, dur: 16, status: 'ok',
    attrs: { 'messaging.destination.name': 'notifications.dlq', reason: 'smtp_unreachable' } },
  { id: 's27', parentId: 's01', svc: 'gateway', name: 'metrics.emit', kind: 'INTERNAL', start: 660, dur: 10, status: 'ok',
    attrs: { 'metrics.exporter': 'otlp' } },
  { id: 's28', parentId: 's01', svc: 'gateway', name: 'response.serialize', kind: 'INTERNAL', start: 672, dur: 12, status: 'ok',
    attrs: { 'http.response.header.content_type': 'application/json', 'http.response.body.size': 286 } },
]

function toAnyValue(v: AttrVal) {
  if (typeof v === 'boolean') return { boolValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v }
  return { stringValue: v }
}

function buildSpan(r: RawSpan) {
  const attributes = Object.entries(r.attrs).map(([key, value]) => ({ key, value: toAnyValue(value) }))
  if (r.code != null) attributes.push({ key: 'http.response.status_code', value: { intValue: String(r.code) } })

  const events = r.exception
    ? [
        {
          timeUnixNano: nano(r.start + Math.min(2, r.dur)),
          name: 'exception',
          attributes: [
            { key: 'exception.type', value: { stringValue: r.exception.type } },
            { key: 'exception.message', value: { stringValue: r.exception.message } },
            ...(r.exception.stack ? [{ key: 'exception.stacktrace', value: { stringValue: r.exception.stack } }] : []),
          ],
        },
      ]
    : undefined

  return {
    traceId: TRACE_ID,
    spanId: hex16(r.id),
    parentSpanId: r.parentId ? hex16(r.parentId) : '',
    name: r.name,
    kind: KIND[r.kind],
    startTimeUnixNano: nano(r.start),
    endTimeUnixNano: nano(r.start + r.dur),
    attributes,
    status: { code: r.status === 'error' ? 2 : 0 },
    ...(events ? { events } : {}),
  }
}

// Group spans into one resourceSpans entry per service (collector shape).
const byService = new Map<keyof typeof SERVICES, RawSpan[]>()
RAW.forEach((r) => {
  const list = byService.get(r.svc) ?? []
  list.push(r)
  byService.set(r.svc, list)
})

export const sampleOtlpTrace: OtlpTracesData = {
  resourceSpans: [...byService.entries()].map(([svc, spans]) => ({
    resource: {
      attributes: [
        { key: 'service.name', value: { stringValue: SERVICES[svc].name } },
        { key: 'host.name', value: { stringValue: SERVICES[svc].host } },
        { key: 'telemetry.sdk.language', value: { stringValue: 'nodejs' } },
      ],
    },
    scopeSpans: [
      {
        scope: { name: '@heimdall/otel', version: '1.0.0' },
        spans: spans.map(buildSpan),
      },
    ],
  })),
}

/** Raw OTLP JSON text — handy for the docs "paste your own" loader. */
export const sampleOtlpJson = JSON.stringify(sampleOtlpTrace, null, 2)

/**
 * Demo warn heuristic: OTLP carries no "warn", so derive it from an explicit
 * `heimdall.severity` attribute (keeps the adapter standards-faithful).
 */
export function deriveSeverity(span: TraceSpan): SpanStatus {
  if (span.status === 'error') return 'error'
  if (span.attributes?.['heimdall.severity'] === 'warn') return 'warn'
  return span.status
}
