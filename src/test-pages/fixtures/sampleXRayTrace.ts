/**
 * Sample AWS X-Ray segment document — a checkout request through an API
 * gateway that calls auth (remote), DynamoDB (aws), and a notifier whose
 * downstream SMTP call faults.
 *
 * A genuine X-Ray segment doc (trace_id `1-{epoch}-{rand}`, epoch-seconds
 * times, nested `subsegments`, `namespace`, `fault`, `cause.exceptions`,
 * `http`/`sql`/`annotations`/`metadata`) so it doubles as a copy-paste example
 * AND exercises `fromXRay`.
 */

import type { XRaySegment } from '../../utils/xrayTrace'
import type { SpanStatus, TraceSpan } from '../../components/traceViewerModel'

const T0 = 1581596090.0 // epoch seconds

export const sampleXRaySegment: XRaySegment = {
  id: '70de5b6f19ff9a0a',
  name: 'checkout-gateway',
  trace_id: '1-581cf771-a006649127e371903a2de979',
  start_time: T0,
  end_time: T0 + 0.742,
  origin: 'AWS::ECS::Container',
  http: {
    request: { method: 'POST', url: 'https://shop.example.com/api/checkout', client_ip: '10.0.1.4', user_agent: 'Mozilla/5.0' },
    response: { status: 200 },
  },
  aws: { account_id: '123456789012', region: 'us-east-1' },
  annotations: { order_id: 'ord_77c1', tier: 'gold' },
  metadata: { build: { commit: 'a1b2c3d', env: 'prod' } },
  subsegments: [
    {
      id: 'b1a2c3d4e5f60718',
      name: 'auth-service',
      namespace: 'remote',
      start_time: T0 + 0.008,
      end_time: T0 + 0.122,
      http: { request: { method: 'GET', url: 'https://auth.internal/verify' }, response: { status: 200 } },
      subsegments: [
        { id: 'c2b3d4e5f6071829', name: 'jwt.decode', start_time: T0 + 0.01, end_time: T0 + 0.02 },
      ],
    },
    {
      id: 'd3c4e5f607182930', name: 'DynamoDB', namespace: 'aws',
      start_time: T0 + 0.05, end_time: T0 + 0.118,
      aws: { operation: 'GetItem', table_name: 'users', request_id: 'RQ123', region: 'us-east-1' },
      http: { response: { status: 200 } },
    },
    {
      id: 'e4d5f60718293041', name: 'orders-db', namespace: 'remote',
      start_time: T0 + 0.182, end_time: T0 + 0.358, error: true,
      sql: { database_type: 'postgresql', sanitized_query: 'INSERT INTO orders (id, user_id, total) VALUES (?, ?, ?)', url: 'orders.internal:5432', user: 'orders_rw' },
      annotations: { rows_affected: 1 },
    },
    {
      id: 'f5e6071829304152', name: 'notify-worker',
      start_time: T0 + 0.384, end_time: T0 + 0.69,
      subsegments: [
        {
          id: '0617283940516273', name: 'smtp.send', namespace: 'remote',
          start_time: T0 + 0.432, end_time: T0 + 0.628, fault: true,
          http: { request: { url: 'smtp://smtp.maileroo.net:587' } },
          cause: {
            working_directory: '/srv/notify',
            exceptions: [
              {
                id: '0a1b2c3d4e5f6071',
                type: 'ECONNREFUSED',
                message: 'connect ECONNREFUSED 10.0.3.9:587 — all 3 attempts refused',
                remote: true,
                stack: [
                  { label: 'TCPConnectWrap.afterConnect', path: 'node:net', line: 1495 },
                  { label: 'SMTPConnection._onError', path: 'smtp-connection.js', line: 768 },
                ],
              },
            ],
          },
        },
        { id: '1728394051627384', name: 'enqueue_dlq', start_time: T0 + 0.632, end_time: T0 + 0.648, annotations: { reason: 'smtp_unreachable' } },
      ],
    },
  ],
}

/** Raw X-Ray JSON text — handy for the docs "paste your own" loader. */
export const sampleXRayJson = JSON.stringify(sampleXRaySegment, null, 2)

/**
 * Demo warn heuristic for X-Ray: X-Ray `error` (4xx) is downgraded to "warn",
 * `fault` (5xx) stays "error". The adapter itself maps both to "error".
 */
export function deriveXRaySeverity(span: TraceSpan): SpanStatus {
  // A 4xx client error without an exception reads as a soft "warn".
  const code = Number(span.statusCode)
  if (span.status === 'error' && !span.exception && code >= 400 && code < 500) return 'warn'
  if (span.attributes?.['db.statement'] && span.status === 'error') return 'warn'
  return span.status
}
