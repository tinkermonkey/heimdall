/* Heimdall · OTel Trace Viewer — shared helpers + atoms */

const WF_PAD = 2; // % inset on each side of the time lane

function fmtMs(ms) {
  if (ms == null) return '—';
  if (ms >= 1000) return (ms / 1000).toFixed(2) + ' s';
  if (ms >= 100)  return ms.toFixed(0) + ' ms';
  if (ms >= 10)   return ms.toFixed(0) + ' ms';
  return ms.toFixed(1) + ' ms';
}
function xOf(t, total) { return WF_PAD + (t / total) * (100 - 2 * WF_PAD); }
function wOf(d, total) { return Math.max(0.5, (d / total) * (100 - 2 * WF_PAD)); }

// build {byId, ordered (preorder), roots, total, depthOf, childrenOf}
function buildModel(spans) {
  const byId = {};
  spans.forEach(s => { byId[s.id] = { ...s, end: s.start + s.dur, children: [] }; });
  const roots = [];
  spans.forEach(s => {
    if (s.parentId && byId[s.parentId]) byId[s.parentId].children.push(byId[s.id]);
    else roots.push(byId[s.id]);
  });
  const ordered = [];
  function walk(node, depth) {
    node.depth = depth;
    node.hasChildren = node.children.length > 0;
    ordered.push(node);
    node.children.forEach(c => walk(c, depth + 1));
  }
  roots.forEach(r => walk(r, 0));
  const total = Math.max(...ordered.map(s => s.end));
  const maxDepth = Math.max(...ordered.map(s => s.depth));
  return { byId, ordered, roots, total, maxDepth };
}

// self time = own duration minus union of direct-children intervals (clamped)
function selfTime(span) {
  if (!span.children.length) return span.dur;
  const iv = span.children
    .map(c => [Math.max(c.start, span.start), Math.min(c.end, span.end)])
    .filter(([a, b]) => b > a)
    .sort((p, q) => p[0] - q[0]);
  let covered = 0, curS = null, curE = null;
  iv.forEach(([a, b]) => {
    if (curS === null) { curS = a; curE = b; }
    else if (a <= curE) { curE = Math.max(curE, b); }
    else { covered += curE - curS; curS = a; curE = b; }
  });
  if (curS !== null) covered += curE - curS;
  return Math.max(0, span.dur - covered);
}

// visible (respecting collapsed set) preorder list
function visibleRows(ordered, collapsed) {
  const out = [];
  const hidden = new Set();
  ordered.forEach(s => {
    if (s.parentId && hidden.has(s.parentId)) { hidden.add(s.id); return; }
    out.push(s);
    if (collapsed.has(s.id)) hidden.add(s.id);
  });
  return out;
}

// deterministic 16-hex pseudo span id from a seed string
function hex16(seed) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  let out = '';
  for (let i = 0; i < 16; i++) { h = Math.imul(h ^ (h >>> 13), 0x01000193) >>> 0; out += (h & 0xf).toString(16); }
  return out;
}

const STATUS = {
  ok:    { dot: 'var(--status-ok)',    fg: 'var(--status-ok-fg)',    label: 'OK' },
  warn:  { dot: 'var(--status-warn)',  fg: 'var(--status-warn-fg)',  label: 'WARN' },
  error: { dot: 'var(--status-error)', fg: 'var(--status-error-fg)', label: 'ERROR' },
};
const KIND_COLOR = {
  SERVER:   '#22D3EE', CLIENT: '#8B5CF6', INTERNAL: '#64748B',
  PRODUCER: '#F59E0B', CONSUMER: '#10B981',
};

// 3px vertical service swatch
function Swatch({ color, h = 13 }) {
  return <span style={{ width: 3, height: h, background: color, borderRadius: 1, flex: '0 0 auto' }} />;
}

function KindBadge({ kind }) {
  const c = KIND_COLOR[kind] || '#64748B';
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em',
      color: c, border: '1px solid ' + c + '44', background: c + '14',
      padding: '1px 5px', borderRadius: 3, lineHeight: 1.4, whiteSpace: 'nowrap',
    }}>{kind}</span>
  );
}

function StatusPill({ status, code }) {
  const s = STATUS[status] || STATUS.ok;
  const tint = { ok: 'var(--status-ok-bg)', warn: 'var(--status-warn-bg)', error: 'var(--status-error-bg)' }[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 4,
      background: tint, color: s.fg, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.02em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {s.label}{code != null && code !== 0 ? ' · ' + code : ''}
    </span>
  );
}

Object.assign(window, {
  WF_PAD, fmtMs, xOf, wOf, buildModel, selfTime, visibleRows, STATUS, KIND_COLOR, hex16,
  Swatch, KindBadge, StatusPill,
});
