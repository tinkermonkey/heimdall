/* ============================================================================
   Heimdall · OTel Trace Viewer — sample trace
   A homelab request: POST /api/feedback/submit fanning across gateway → auth →
   feedback → postgres / redis / notify, with a failed external SMTP send.
   Times are milliseconds, offset from trace start (t0).
   ========================================================================== */

// --- services (domain palette; rose reserved for error markers) -------------
const SERVICES = {
  gateway:  { label: 'edge-gateway', color: '#22D3EE', host: 'heimdall.lab.local', kind: 'ingress' },
  auth:     { label: 'auth-svc',     color: '#818CF8', host: 'nyx.lab.local',      kind: 'service' },
  feedback: { label: 'feedback-svc', color: '#10B981', host: 'vega.lab.local',     kind: 'service' },
  postgres: { label: 'postgres',     color: '#8B5CF6', host: 'aether.lab.local',   kind: 'datastore' },
  redis:    { label: 'redis-cache',  color: '#14B8A6', host: 'nyx.lab.local',      kind: 'datastore' },
  notify:   { label: 'notify-svc',   color: '#F59E0B', host: 'vega.lab.local',     kind: 'worker' },
};

// --- trace meta -------------------------------------------------------------
const TRACE_META = {
  traceId: '4f3ae9c1d2b87a05e6c1f0a9d4b22e17',
  shortId: '4f3ae9c1',
  name: 'POST /api/feedback/submit',
  rootService: 'gateway',
  startedAt: '2026-06-10 14:22:07.412 UTC',
  collector: 'otel-collector :4317',
  sampler: 'parentbased_traceidratio 0.25',
};

// --- spans (preorder; parentId links the tree) ------------------------------
// status: 'ok' | 'warn' | 'error'.  kind: SERVER|CLIENT|INTERNAL|PRODUCER|CONSUMER
const SPANS = [
  { id: 's01', parentId: null,  service: 'gateway',  name: 'POST /api/feedback/submit', kind: 'SERVER',
    start: 0, dur: 688, status: 'ok', statusCode: 201,
    attrs: { 'http.method': 'POST', 'http.route': '/api/feedback/submit', 'http.status_code': '201',
             'http.host': 'heimdall.lab.local', 'client.address': '10.0.1.4', 'http.request.body.size': '512 B' } },

  { id: 's02', parentId: 's01', service: 'gateway',  name: 'middleware.auth', kind: 'INTERNAL',
    start: 4, dur: 128, status: 'ok',
    attrs: { 'middleware': 'auth', 'auth.scheme': 'bearer' } },

  { id: 's03', parentId: 's02', service: 'auth',     name: 'auth.verify_token', kind: 'SERVER',
    start: 10, dur: 116, status: 'ok', statusCode: 200,
    attrs: { 'auth.method': 'jwt', 'auth.user': 'usr_8821', 'rpc.system': 'grpc', 'server.address': 'nyx.lab.local:8081' } },
  { id: 's04', parentId: 's03', service: 'auth',     name: 'jwt.decode', kind: 'INTERNAL',
    start: 12, dur: 10, status: 'ok', attrs: { 'jwt.alg': 'RS256', 'jwt.exp_in': '1840 s' } },
  { id: 's05', parentId: 's03', service: 'redis',    name: 'cache.get session:tok', kind: 'CLIENT',
    start: 26, dur: 18, status: 'ok',
    attrs: { 'db.system': 'redis', 'db.operation': 'GET', 'db.redis.key': 'session:tok_9f3a', 'cache.hit': 'true', 'server.address': 'nyx.lab.local:6379' } },
  { id: 's06', parentId: 's03', service: 'postgres', name: 'db.query SELECT user', kind: 'CLIENT',
    start: 48, dur: 70, status: 'ok',
    attrs: { 'db.system': 'postgresql', 'db.name': 'identity', 'db.statement': 'SELECT id, email, roles FROM users WHERE id = $1', 'db.rows_affected': '1', 'server.address': 'aether.lab.local:5432' } },
  { id: 's07', parentId: 's06', service: 'postgres', name: 'pg.acquire_conn', kind: 'INTERNAL',
    start: 50, dur: 12, status: 'ok', attrs: { 'db.pool.name': 'identity-ro', 'db.pool.idle': '7' } },
  { id: 's08', parentId: 's06', service: 'postgres', name: 'pg.execute', kind: 'INTERNAL',
    start: 64, dur: 46, status: 'ok', attrs: { 'db.plan': 'Index Scan using users_pkey' } },
  { id: 's09', parentId: 's08', service: 'postgres', name: 'pg.fetch_rows', kind: 'INTERNAL',
    start: 96, dur: 12, status: 'ok', attrs: { 'db.rows': '1' } },

  { id: 's10', parentId: 's01', service: 'gateway',  name: 'route.handler', kind: 'INTERNAL',
    start: 136, dur: 540, status: 'ok', attrs: { 'handler': 'feedbackController.submit' } },
  { id: 's11', parentId: 's10', service: 'feedback', name: 'feedback.create', kind: 'SERVER',
    start: 140, dur: 520, status: 'ok', statusCode: 200,
    attrs: { 'rpc.system': 'grpc', 'rpc.method': 'CreateFeedback', 'server.address': 'vega.lab.local:8090', 'feedback.id': 'fb_9f3c01' } },
  { id: 's12', parentId: 's11', service: 'feedback', name: 'validate.payload', kind: 'INTERNAL',
    start: 144, dur: 12, status: 'ok', attrs: { 'validator': 'zod', 'fields': '6' } },
  { id: 's13', parentId: 's11', service: 'feedback', name: 'enrich.metadata', kind: 'INTERNAL',
    start: 158, dur: 20, status: 'ok', attrs: { 'geoip': 'true', 'ua.parsed': 'true' } },

  { id: 's14', parentId: 's11', service: 'postgres', name: 'db.insert feedback', kind: 'CLIENT',
    start: 182, dur: 176, status: 'warn',
    attrs: { 'db.system': 'postgresql', 'db.name': 'feedback', 'db.statement': 'INSERT INTO feedback (id, user_id, body, meta) VALUES ($1,$2,$3,$4)', 'db.rows_affected': '1', 'db.duration_warn_ms': '150', 'server.address': 'aether.lab.local:5432' } },
  { id: 's15', parentId: 's14', service: 'postgres', name: 'pg.acquire_conn', kind: 'INTERNAL',
    start: 184, dur: 10, status: 'ok', attrs: { 'db.pool.name': 'feedback-rw', 'db.pool.wait_ms': '0' } },
  { id: 's16', parentId: 's14', service: 'postgres', name: 'pg.execute INSERT', kind: 'INTERNAL',
    start: 196, dur: 150, status: 'warn', attrs: { 'db.lock.wait_ms': '88', 'note': 'row lock contention on feedback_pkey' } },
  { id: 's17', parentId: 's16', service: 'postgres', name: 'index.update', kind: 'INTERNAL',
    start: 300, dur: 40, status: 'ok', attrs: { 'index': 'feedback_user_idx' } },
  { id: 's18', parentId: 's16', service: 'postgres', name: 'trigger.audit_log', kind: 'INTERNAL',
    start: 342, dur: 4, status: 'ok', attrs: { 'trigger': 'tg_audit_feedback' } },

  { id: 's19', parentId: 's11', service: 'redis',    name: 'cache.set feedback:9f3c', kind: 'CLIENT',
    start: 366, dur: 14, status: 'ok',
    attrs: { 'db.system': 'redis', 'db.operation': 'SETEX', 'db.redis.key': 'feedback:9f3c01', 'ttl': '3600 s', 'server.address': 'nyx.lab.local:6379' } },

  { id: 's20', parentId: 's11', service: 'notify',   name: 'notify.enqueue', kind: 'PRODUCER',
    start: 384, dur: 268, status: 'warn',
    attrs: { 'messaging.system': 'rabbitmq', 'messaging.destination': 'notifications.email', 'messaging.message.id': 'msg_4471' } },
  { id: 's21', parentId: 's20', service: 'notify',   name: 'queue.publish', kind: 'INTERNAL',
    start: 386, dur: 8, status: 'ok', attrs: { 'messaging.operation': 'publish', 'messaging.payload.size': '1.1 KB' } },
  { id: 's22', parentId: 's20', service: 'notify',   name: 'notify.process', kind: 'CONSUMER',
    start: 398, dur: 250, status: 'warn',
    attrs: { 'messaging.operation': 'process', 'messaging.consumer.group': 'mailer-workers' } },
  { id: 's23', parentId: 's22', service: 'notify',   name: 'render.template', kind: 'INTERNAL',
    start: 400, dur: 28, status: 'ok', attrs: { 'template': 'feedback_ack.mjml', 'render.engine': 'mjml' } },
  { id: 's24', parentId: 's22', service: 'notify',   name: 'smtp.send email', kind: 'CLIENT',
    start: 432, dur: 196, status: 'error', statusCode: 0,
    attrs: { 'net.peer.name': 'smtp.maileroo.net', 'net.peer.port': '587', 'email.to': 'usr_8821@…', 'retry.count': '3' },
    exception: { type: 'ECONNREFUSED', message: 'connect ECONNREFUSED 10.0.3.9:587',
      stack: 'Error: connect ECONNREFUSED 10.0.3.9:587\n    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1495:16)\n    at SMTPConnection._onError (smtp-connection.js:768:21)\n    at Socket.<anonymous> (smtp-connection.js:213:14)' } },
  { id: 's25', parentId: 's24', service: 'notify',   name: 'smtp.connect', kind: 'INTERNAL',
    start: 434, dur: 180, status: 'error',
    attrs: { 'net.transport': 'tcp', 'net.peer.ip': '10.0.3.9', 'connect.timeout_ms': '180', 'attempts': '3' },
    exception: { type: 'ECONNREFUSED', message: 'connect ECONNREFUSED 10.0.3.9:587 — all 3 attempts refused' } },
  { id: 's26', parentId: 's22', service: 'notify',   name: 'notify.fallback enqueue_dlq', kind: 'INTERNAL',
    start: 632, dur: 16, status: 'ok', attrs: { 'messaging.destination': 'notifications.dlq', 'reason': 'smtp_unreachable' } },

  { id: 's27', parentId: 's01', service: 'gateway',  name: 'metrics.emit', kind: 'INTERNAL',
    start: 660, dur: 10, status: 'ok', attrs: { 'metrics.exporter': 'otlp' } },
  { id: 's28', parentId: 's01', service: 'gateway',  name: 'response.serialize', kind: 'INTERNAL',
    start: 672, dur: 12, status: 'ok', attrs: { 'content.type': 'application/json', 'response.size': '286 B' } },
];

window.TRACE = { meta: TRACE_META, services: SERVICES, spans: SPANS };
