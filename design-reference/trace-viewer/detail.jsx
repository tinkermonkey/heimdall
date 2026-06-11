/* Heimdall · OTel Trace Viewer — fly-out detail panel + mini-map */

function MiniMap({ model, services, selected }) {
  const { ordered, total } = model;
  const n = ordered.length;
  const W = 100, lh = 2, gap = 1, top = 3;
  const H = top * 2 + n * (lh + gap);
  const idx = {}; ordered.forEach((s, i) => { idx[s.id] = i; });
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {selected && idx[selected] !== undefined && (
        <rect x="0" y={top + idx[selected] * (lh + gap) - 1} width={W} height={lh + 2} fill="var(--accent-primary)" fillOpacity="0.14" />
      )}
      {ordered.map((s, i) => {
        const y = top + i * (lh + gap);
        const x = xOf(s.start, total), w = wOf(s.dur, total);
        const sel = s.id === selected;
        const color = s.status === 'error' ? 'var(--status-error)' : services[s.service].color;
        return <rect key={s.id} x={x} y={y} width={w} height={lh} rx="0.6"
          fill={color} fillOpacity={sel ? 1 : 0.5} />;
      })}
    </svg>
  );
}

function KV({ rows }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '116px 1fr', columnGap: 12, rowGap: 8 }}>
      {rows.map(([k, v], i) => (
        <React.Fragment key={i}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--canvas-fg-3)', paddingTop: 2 }}>{k}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--canvas-fg-1)', wordBreak: 'break-word', minWidth: 0 }}>{v}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

function Section({ title, right, children, pad = true }) {
  return (
    <div style={{ borderBottom: '1px solid var(--canvas-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>{title}</span>
        {right}
      </div>
      <div style={{ padding: pad ? '0 16px 14px' : 0 }}>{children}</div>
    </div>
  );
}

function DetailPanel({ span, model, services, onClose, onSelect }) {
  if (!span) return null;
  const svc = services[span.service];
  const total = model.total;
  const self = selfTime(span);
  const pct = (span.dur / total) * 100;
  const selfPct = (self / span.dur) * 100;
  const parent = span.parentId ? model.byId[span.parentId] : null;
  const idShort = (s) => s.length > 16 ? s.slice(0, 16) + '…' : s;

  const TimingRow = ({ label, value, sub }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '2px 0' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--canvas-fg-3)', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--canvas-fg-1)', fontVariantNumeric: 'tabular-nums' }}>{value}{sub && <span style={{ color: 'var(--canvas-fg-3)', fontWeight: 400, fontSize: 10.5 }}>{' ' + sub}</span>}</span>
    </div>
  );

  return (
    <div style={{ width: 360, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--canvas-bg)' }}>
      {/* head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--canvas-border)', flex: '0 0 auto' }}>
        <span style={{ width: 3, height: 38, background: svc.color, borderRadius: 1, marginTop: 2, flex: '0 0 auto' }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="eyebrow" style={{ fontSize: 10 }}>{svc.label.toUpperCase()} · {span.kind}</div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--canvas-fg-1)', lineHeight: 1.3, fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>{span.name}</div>
          <div style={{ marginTop: 2 }}><StatusPill status={span.status} code={span.statusCode} /></div>
        </div>
        <button onClick={onClose} title="Close panel"
          style={{ flex: '0 0 auto', width: 26, height: 26, border: '1px solid var(--canvas-border)', background: 'var(--canvas-bg)', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--canvas-fg-3)' }}>
          <Icon name="x" size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {/* mini-map */}
        <Section title="TRACE MAP">
          <div style={{ border: '1px solid var(--canvas-border)', borderRadius: 4, padding: '5px 6px', background: 'var(--canvas-bg-2)' }}>
            <MiniMap model={model} services={services} selected={span.id} />
          </div>
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--canvas-fg-3)' }}>
            row {model.ordered.findIndex(s => s.id === span.id) + 1} of {model.ordered.length}
          </div>
        </Section>

        {/* timing breakdown */}
        <Section title="TIMING">
          <TimingRow label="start offset" value={fmtMs(span.start)} />
          <TimingRow label="duration" value={fmtMs(span.dur)} />
          <TimingRow label="self time" value={fmtMs(self)} sub={'· ' + selfPct.toFixed(0) + '%'} />
          <TimingRow label="% of trace" value={pct.toFixed(1) + '%'} />
          <div style={{ marginTop: 8, height: 8, borderRadius: 2, overflow: 'hidden', display: 'flex', border: '1px solid var(--canvas-border)' }}>
            <div title="self" style={{ width: selfPct + '%', background: svc.color }} />
            <div title="in children" style={{ flex: 1, background: 'var(--canvas-surface-2)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--canvas-fg-3)' }}>
            <span>SELF {fmtMs(self)}</span><span>IN CHILDREN {fmtMs(span.dur - self)}</span>
          </div>
        </Section>

        {/* identity */}
        <Section title="IDENTITY">
          <KV rows={[
            ['span_id', hex16(span.id) + ' '],
            ['parent', parent
              ? <span onClick={() => onSelect(parent.id)} style={{ color: 'var(--accent-primary-deep)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}>{parent.name}</span>
              : <span style={{ color: 'var(--canvas-fg-3)', fontStyle: 'italic' }}>— root —</span>],
            ['service', <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: svc.color }} />{svc.label}</span>],
            ['host', svc.host],
            ['kind', <KindBadge kind={span.kind} />],
            ['trace_id', model.meta.traceId.slice(0, 18) + '…'],
          ]} />
        </Section>

        {/* attributes */}
        {span.attrs && Object.keys(span.attrs).length > 0 && (
          <Section title="ATTRIBUTES" right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--canvas-fg-3)', background: 'var(--canvas-bg-2)', border: '1px solid var(--canvas-border)', borderRadius: 3, padding: '0 5px' }}>{Object.keys(span.attrs).length}</span>}>
            <KV rows={Object.entries(span.attrs).map(([k, v]) => [k, v])} />
          </Section>
        )}

        {/* status / error */}
        <Section title="STATUS">
          {span.status === 'error' && span.exception ? (
            <div style={{ border: '1px solid var(--status-error-bg)', background: 'var(--status-rose-bg-alpha)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderBottom: '1px solid var(--status-error-bg)', color: 'var(--status-error-fg)' }}>
                <Icon name="alert" size={14} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{span.exception.type}</span>
              </div>
              <div style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--status-error-fg)' }}>{span.exception.message}</div>
              {span.exception.stack && (
                <pre style={{ margin: 0, padding: '8px 10px', borderTop: '1px solid var(--status-error-bg)', fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: 1.55, color: 'var(--canvas-fg-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--canvas-bg)' }}>{span.exception.stack}</pre>
              )}
            </div>
          ) : span.status === 'warn' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 6, background: 'var(--status-amber-bg-alpha)', border: '1px solid var(--semantic-amber-border)', color: 'var(--status-warn-fg)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
              <Icon name="alert" size={13} /> degraded — {span.attrs && span.attrs.note ? span.attrs.note : 'elevated latency on this span'}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--status-ok-fg)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--status-ok)' }} /> OK{span.statusCode ? ' · ' + span.statusCode : ''}
            </div>
          )}
        </Section>
        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}

Object.assign(window, { MiniMap, DetailPanel, KV, Section });
