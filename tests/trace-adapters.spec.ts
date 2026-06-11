import { test, expect } from '@playwright/test'
import { fromOTLP } from '../src/utils/otlpTrace'
import { fromXRay, type XRaySegment } from '../src/utils/xrayTrace'
import { sampleOtlpTrace } from '../src/test-pages/fixtures/sampleOtlpTrace'
import { sampleXRaySegment } from '../src/test-pages/fixtures/sampleXRayTrace'
import type { TraceSpan } from '../src/components/traceViewerModel'

const byName = (spans: TraceSpan[], name: string) => spans.find((s) => s.name === name)

test.describe('fromOTLP', () => {
  const trace = fromOTLP(sampleOtlpTrace)
  const root = trace.spans.find((s) => s.parentId === null)!

  test('flattens every span across resourceSpans', () => {
    expect(trace.spans.length).toBe(28)
  })

  test('resolves the root span and service.name from resource attributes', () => {
    expect(root).toBeTruthy()
    expect(root.name).toBe('POST /api/feedback/submit')
    expect(root.service).toBe('edge-gateway') // service.name on the resource, not the span
    expect(root.kind).toBe('SERVER')
    expect(root.start).toBe(0)
    expect(Math.round(root.duration)).toBe(688)
  })

  test('inherits service.name per resource for non-root spans', () => {
    const pg = byName(trace.spans, 'db.query SELECT user')!
    expect(pg.service).toBe('postgres')
    expect(pg.kind).toBe('CLIENT')
  })

  test('links parent ids as lowercase hex (16 chars)', () => {
    const mw = byName(trace.spans, 'middleware.auth')!
    expect(mw.parentId).toBe(root.id)
    expect(root.id).toMatch(/^[0-9a-f]{16}$/)
  })

  test('extracts statusCode from http.response.status_code (intValue string)', () => {
    expect(root.statusCode).toBe(201)
    expect(typeof root.statusCode).toBe('number')
  })

  test('coerces intValue/boolValue attributes to JS primitives', () => {
    expect(root.attributes?.['http.request.body.size']).toBe(512)
    const redis = byName(trace.spans, 'cache.get session:tok')!
    expect(redis.attributes?.['cache.hit']).toBe(true)
  })

  test('maps status code ERROR -> error and extracts the exception event', () => {
    const smtp = byName(trace.spans, 'smtp.send email')!
    expect(smtp.status).toBe('error')
    expect(smtp.exception?.type).toBe('ECONNREFUSED')
    expect(smtp.exception?.stacktrace).toContain('TCPConnectWrap')
  })

  test('UNSET status maps to ok (OTLP has no warn)', () => {
    const insert = byName(trace.spans, 'db.insert feedback')!
    expect(insert.status).toBe('ok')
  })

  test('computes ms offsets/durations from nanosecond strings via BigInt', () => {
    const handler = byName(trace.spans, 'route.handler')!
    expect(Math.round(handler.start)).toBe(136)
    expect(Math.round(handler.duration)).toBe(540)
  })

  test('normalizes hex AND base64 ids to the same lowercase hex', () => {
    const spanIdHex = 'eee19b7ec3c1b174'
    const traceIdHex = '5b8efff798038103d269b633813fc60c'
    const make = (sid: string, tid: string) => ({
      resourceSpans: [
        {
          resource: { attributes: [{ key: 'service.name', value: { stringValue: 'svc' } }] },
          scopeSpans: [
            {
              spans: [
                {
                  traceId: tid,
                  spanId: sid,
                  name: 'x',
                  kind: 2,
                  startTimeUnixNano: '1544712660000000000',
                  endTimeUnixNano: '1544712661000000000',
                },
              ],
            },
          ],
        },
      ],
    })
    const hexTrace = fromOTLP(make(spanIdHex, traceIdHex))
    const b64Trace = fromOTLP(
      make(Buffer.from(spanIdHex, 'hex').toString('base64'), Buffer.from(traceIdHex, 'hex').toString('base64'))
    )
    expect(hexTrace.spans[0].id).toBe(spanIdHex)
    expect(b64Trace.spans[0].id).toBe(spanIdHex)
    expect(hexTrace.meta?.traceId).toBe(traceIdHex)
    expect(b64Trace.meta?.traceId).toBe(traceIdHex)
    expect(Math.round(hexTrace.spans[0].duration)).toBe(1000) // 1s span
  })

  test('accepts SPAN_KIND_* / STATUS_CODE_* name strings', () => {
    const t = fromOTLP({
      resourceSpans: [
        {
          resource: { attributes: [{ key: 'service.name', value: { stringValue: 'svc' } }] },
          scopeSpans: [
            {
              spans: [
                {
                  traceId: 'aa'.repeat(16),
                  spanId: 'bb'.repeat(8),
                  name: 'named-enums',
                  kind: 'SPAN_KIND_CLIENT',
                  startTimeUnixNano: '1000000000',
                  endTimeUnixNano: '1002000000',
                  status: { code: 'STATUS_CODE_ERROR' },
                },
              ],
            },
          ],
        },
      ],
    })
    expect(t.spans[0].kind).toBe('CLIENT')
    expect(t.spans[0].status).toBe('error')
  })

  test('classifies a stringified status code ("2") as error', () => {
    const t = fromOTLP({
      resourceSpans: [
        {
          resource: { attributes: [{ key: 'service.name', value: { stringValue: 'svc' } }] },
          scopeSpans: [
            {
              spans: [
                {
                  traceId: 'cc'.repeat(16),
                  spanId: 'dd'.repeat(8),
                  name: 'stringy-status',
                  kind: 3,
                  startTimeUnixNano: '1000000000',
                  endTimeUnixNano: '1001000000',
                  // some collectors stringify the enum
                  status: { code: '2' as unknown as number },
                },
              ],
            },
          ],
        },
      ],
    })
    expect(t.spans[0].status).toBe('error')
  })

  test('maps a numeric-string SpanKind ("3") to CLIENT', () => {
    const t = fromOTLP({
      resourceSpans: [
        {
          resource: { attributes: [{ key: 'service.name', value: { stringValue: 'svc' } }] },
          scopeSpans: [
            {
              spans: [
                { traceId: 'bb'.repeat(16), spanId: 'cc'.repeat(8), name: 'numeric-kind', kind: '3' as unknown as number, startTimeUnixNano: '1000000000', endTimeUnixNano: '1002000000' },
              ],
            },
          ],
        },
      ],
    })
    expect(t.spans[0].kind).toBe('CLIENT')
  })

  test('tolerates a malformed *UnixNano without throwing or corrupting traceStart', () => {
    const payload = {
      resourceSpans: [
        {
          resource: { attributes: [{ key: 'service.name', value: { stringValue: 'svc' } }] },
          scopeSpans: [
            {
              spans: [
                { traceId: 'aa'.repeat(16), spanId: '01'.repeat(8), name: 'good', kind: 2, startTimeUnixNano: '1000000000', endTimeUnixNano: '1000600000' },
                { traceId: 'aa'.repeat(16), spanId: '02'.repeat(8), name: 'bad', kind: 1, startTimeUnixNano: 'not-a-number', endTimeUnixNano: '' },
              ],
            },
          ],
        },
      ],
    }
    const t = fromOTLP(payload)
    expect(t.spans.length).toBe(2)
    const good = t.spans.find((s) => s.name === 'good')!
    const bad = t.spans.find((s) => s.name === 'bad')!
    expect(good.start).toBe(0) // bad span's garbage start did not become traceStart
    expect(Number.isFinite(bad.start)).toBe(true)
    expect(Number.isFinite(bad.duration)).toBe(true)
  })
})

test.describe('fromXRay', () => {
  const trace = fromXRay(sampleXRaySegment)
  const root = trace.spans.find((s) => s.parentId === null)!

  test('walks the subsegment tree into a flat span list', () => {
    expect(trace.spans.length).toBe(8)
  })

  test('reformats the X-Ray trace id to 32-hex', () => {
    expect(trace.meta?.traceId).toBe('581cf771a006649127e371903a2de979')
  })

  test('root segment becomes a SERVER span; name = service', () => {
    expect(root.name).toBe('checkout-gateway')
    expect(root.service).toBe('checkout-gateway')
    expect(root.kind).toBe('SERVER')
    expect(root.parentId).toBeNull()
    expect(root.statusCode).toBe(200)
    expect(root.start).toBe(0)
    expect(Math.round(root.duration)).toBe(742)
  })

  test('maps namespace remote/aws -> CLIENT, plain subsegment -> INTERNAL', () => {
    expect(byName(trace.spans, 'auth-service')!.kind).toBe('CLIENT')
    expect(byName(trace.spans, 'DynamoDB')!.kind).toBe('CLIENT')
    expect(byName(trace.spans, 'jwt.decode')!.kind).toBe('INTERNAL')
  })

  test('converts epoch-seconds to ms offsets/durations', () => {
    const auth = byName(trace.spans, 'auth-service')!
    expect(Math.round(auth.start)).toBe(8)
    expect(Math.round(auth.duration)).toBe(114)
  })

  test('nests parentId by subsegment containment', () => {
    const auth = byName(trace.spans, 'auth-service')!
    const jwt = byName(trace.spans, 'jwt.decode')!
    const worker = byName(trace.spans, 'notify-worker')!
    const smtp = byName(trace.spans, 'smtp.send')!
    expect(jwt.parentId).toBe(auth.id)
    expect(smtp.parentId).toBe(worker.id)
  })

  test('fault -> error status with cause.exceptions -> exception', () => {
    const smtp = byName(trace.spans, 'smtp.send')!
    expect(smtp.status).toBe('error')
    expect(smtp.exception?.type).toBe('ECONNREFUSED')
    expect(smtp.exception?.stacktrace).toContain('TCPConnectWrap.afterConnect')
  })

  test('maps sql.* to db.* attributes', () => {
    const db = byName(trace.spans, 'orders-db')!
    expect(db.attributes?.['db.system']).toBe('postgresql')
    expect(String(db.attributes?.['db.statement'])).toContain('INSERT INTO orders')
  })

  test('handles in_progress spans (no end_time) by clamping to trace end', () => {
    const seg: XRaySegment = {
      id: 'aaaaaaaaaaaaaaaa',
      name: 'svc',
      trace_id: '1-581cf771-a006649127e371903a2de979',
      start_time: 100,
      end_time: 100.5,
      subsegments: [
        { id: 'bbbbbbbbbbbbbbbb', name: 'open', start_time: 100.1, in_progress: true },
      ],
    }
    const t = fromXRay(seg)
    const open = t.spans.find((s) => s.name === 'open')!
    expect(open.duration).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(open.duration)).toBe(true)
  })

  test('a subsegment missing start_time does not poison the trace with NaN', () => {
    const seg: XRaySegment = {
      id: 'cccccccccccccccc',
      name: 'svc',
      trace_id: '1-581cf771-a006649127e371903a2de979',
      start_time: 200,
      end_time: 201,
      subsegments: [
        // malformed: no start_time
        { id: 'dddddddddddddddd', name: 'broken' } as unknown as import('../src/utils/xrayTrace').XRaySubsegment,
      ],
    }
    const t = fromXRay(seg)
    const broken = t.spans.find((s) => s.name === 'broken')!
    expect(Number.isFinite(broken.start)).toBe(true)
    expect(Number.isFinite(broken.duration)).toBe(true)
    // root timing remains intact
    const root = t.spans.find((s) => s.parentId === null)!
    expect(Math.round(root.duration)).toBe(1000)
  })

  test('coerces numeric id/parent_id and tolerates a missing id', () => {
    const seg = {
      id: 12345,
      name: 'svc',
      trace_id: '1-581cf771-a006649127e371903a2de979',
      start_time: 100,
      end_time: 101,
      subsegments: [
        { id: 999, name: 'child', start_time: 100.1, end_time: 100.5 },
        { name: 'idless', start_time: 100.2, end_time: 100.3 },
      ],
    } as unknown as XRaySegment
    expect(() => fromXRay(seg)).not.toThrow()
    const t = fromXRay(seg)
    expect(t.spans.find((s) => s.name === 'svc')!.id).toBe('12345')
    const child = t.spans.find((s) => s.name === 'child')!
    expect(child.id).toBe('999')
    expect(child.parentId).toBe('12345')
    expect(t.spans.find((s) => s.name === 'idless')).toBeTruthy()
  })

  test('surfaces a string cause (bare exception id) as an exception', () => {
    const seg = {
      id: 'aaaaaaaaaaaaaaaa',
      name: 'svc',
      trace_id: '1-581cf771-a006649127e371903a2de979',
      start_time: 100,
      end_time: 101,
      fault: true,
      cause: '1a2b3c4d5e6f7081',
    } as XRaySegment
    const t = fromXRay(seg)
    const root = t.spans[0]
    expect(root.status).toBe('error')
    expect(root.exception).toBeTruthy()
    expect(String(root.exception?.message)).toContain('1a2b3c4d5e6f7081')
  })
})

test.describe('OTLP and X-Ray normalize to the same shape', () => {
  test('both yield spans with the required model fields', () => {
    for (const trace of [fromOTLP(sampleOtlpTrace), fromXRay(sampleXRaySegment)]) {
      expect(trace.spans.length).toBeGreaterThan(0)
      const root = trace.spans.find((s) => s.parentId === null)!
      expect(root).toBeTruthy()
      for (const s of trace.spans) {
        expect(typeof s.id).toBe('string')
        expect(typeof s.name).toBe('string')
        expect(typeof s.service).toBe('string')
        expect(typeof s.start).toBe('number')
        expect(typeof s.duration).toBe('number')
        expect(['ok', 'warn', 'error']).toContain(s.status)
      }
    }
  })
})
