/* Heimdall · OTel Trace Viewer — header summary + tree/waterfall lane */

const ROW_H = 30;
const TREE_W = 336;
const BASE_INDENT = 14;
const STEP = 16;

function niceTicks(total) {
  const raw = total / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = mag * (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10);
  const ticks = [];
  for (let t = 0; t <= total + 0.001; t += step) ticks.push(+t.toFixed(3));
  return { ticks, step };
}

/* ---------- Header summary strip ---------- */
function HeaderSummary({ model, services }) {
  const { ordered, total } = model;
  const svcSet = new Set(ordered.map(s => s.service));
  const errors = ordered.filter(s => s.status === 'error').length;
  const warns = ordered.filter(s => s.status === 'warn').length;

  // time per service (sum of self-time so segments sum ~ critical path, not double-count nesting)
  const perSvc = {};
  ordered.forEach(s => { perSvc[s.service] = (perSvc[s.service] || 0) + selfTime(s); });
  const svcEntries = Object.entries(perSvc).sort((a, b) => b[1] - a[1]);
  const svcTotal = svcEntries.reduce((a, [, v]) => a + v, 0) || 1;

  const Stat = ({ label, value, color, mono }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 12, borderLeft: '2px solid ' + (color || 'var(--canvas-border-strong)') }}>
      <span className="eyebrow" style={{ fontSize: 10 }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: color || 'var(--canvas-fg-1)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 26, padding: '14px 24px 16px' }}>
      <Stat label="DURATION" value={fmtMs(total)} mono color="var(--accent-primary-deep)" />
      <Stat label="SPANS" value={ordered.length} mono />
      <Stat label="SERVICES" value={svcSet.size} mono />
      <Stat label="ERRORS" value={errors} mono color={errors ? 'var(--status-error)' : undefined} />
      <Stat label="WARNINGS" value={warns} mono color={warns ? 'var(--status-warn-fg)' : undefined} />

      {/* service-breakdown mini bar */}
      <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 7, justifyContent: 'center', maxWidth: 520 }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>TIME PER SERVICE · SELF</span>
        <div style={{ display: 'flex', height: 12, borderRadius: 3, overflow: 'hidden', border: '1px solid var(--canvas-border)' }}>
          {svcEntries.map(([svc, v]) => (
            <div key={svc} title={services[svc].label + ' · ' + fmtMs(v)}
              style={{ width: (v / svcTotal * 100) + '%', background: services[svc].color, opacity: 0.85 }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
          {svcEntries.map(([svc, v]) => (
            <span key={svc} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--canvas-fg-3)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: services[svc].color }} />
              {services[svc].label}<span style={{ color: 'var(--canvas-fg-2)' }}>{fmtMs(v)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Tree row (left column) ---------- */
function TreeRow({ s, services, selected, hovered, onSelect, onHover, onToggle, collapsed }) {
  const svc = services[s.service];
  const isSel = selected === s.id;
  const isHov = hovered === s.id;
  const indent = BASE_INDENT + s.depth * STEP;
  const guides = [];
  for (let i = 0; i < s.depth; i++) guides.push(BASE_INDENT + i * STEP + 7);
  const errColor = s.status === 'error' ? 'var(--status-error)' : s.status === 'warn' ? 'var(--status-warn-fg)' : 'var(--canvas-fg-3)';

  return (
    <div
      onClick={() => onSelect(s.id)}
      onMouseEnter={() => onHover(s.id)} onMouseLeave={() => onHover(null)}
      style={{
        position: 'relative', height: ROW_H, display: 'flex', alignItems: 'center', gap: 7,
        paddingLeft: indent, paddingRight: 10, cursor: 'pointer',
        borderBottom: '1px solid var(--canvas-border)',
        background: isSel ? 'var(--accent-primary-bg-alpha-sm)' : isHov ? 'var(--canvas-surface-2)' : 'transparent',
        boxShadow: isSel ? 'inset 2px 0 0 var(--accent-primary)' : 'none',
      }}>
      {guides.map((gx, i) => (
        <span key={i} style={{ position: 'absolute', left: gx, top: 0, bottom: 0, borderLeft: '1px dashed var(--canvas-border-2)' }} />
      ))}
      {s.hasChildren ? (
        <button onClick={(e) => { e.stopPropagation(); onToggle(s.id); }}
          style={{ flex: '0 0 auto', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--canvas-fg-3)', padding: 0, transform: collapsed ? 'none' : 'rotate(90deg)', transition: 'transform 120ms ease' }}>
          <Icon name="chevRight" size={13} />
        </button>
      ) : <span style={{ flex: '0 0 auto', width: 16, display: 'inline-flex', justifyContent: 'center', color: 'var(--canvas-fg-4)' }}><span style={{ width: 3, height: 3, borderRadius: 999, background: 'currentColor' }} /></span>}
      <Swatch color={svc.color} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: isSel ? 600 : 500, color: 'var(--canvas-fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{s.name}</span>
      {collapsed && s.hasChildren && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--canvas-fg-3)', background: 'var(--canvas-bg-2)', border: '1px solid var(--canvas-border)', borderRadius: 3, padding: '0 4px', flex: '0 0 auto' }}>{descCount(s)}</span>
      )}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: errColor, flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' }}>{fmtMs(s.dur)}</span>
    </div>
  );
}
function descCount(s) { let n = 0; (function w(x) { x.children.forEach(c => { n++; w(c); }); })(s); return '+' + n; }

/* ---------- Waterfall row (center column) ---------- */
function WfRow({ s, services, total, selected, hovered, onSelect, onHover }) {
  const svc = services[s.service];
  const isSel = selected === s.id;
  const isHov = hovered === s.id;
  const left = xOf(s.start, total);
  const w = wOf(s.dur, total);
  const labelAfter = left + w < 68;
  const isErr = s.status === 'error';
  const isWarn = s.status === 'warn';

  const label = (
    <span style={{
      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
      [labelAfter ? 'left' : 'right']: labelAfter ? `calc(${left + w}% + 7px)` : `calc(${100 - left}% + 7px)`,
      whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: 10.5,
      color: isSel ? 'var(--canvas-fg-1)' : 'var(--canvas-fg-3)', pointerEvents: 'none',
    }}>
      <span style={{ color: isErr ? 'var(--status-error)' : isWarn ? 'var(--status-warn-fg)' : 'var(--canvas-fg-2)', fontWeight: 500 }}>{fmtMs(s.dur)}</span>
      <span style={{ opacity: 0.7 }}>{'  ' + s.name}</span>
    </span>
  );

  return (
    <div
      onClick={() => onSelect(s.id)}
      onMouseEnter={() => onHover(s.id)} onMouseLeave={() => onHover(null)}
      style={{
        position: 'relative', height: ROW_H, borderBottom: '1px solid var(--canvas-border)', cursor: 'pointer',
        background: isSel ? 'var(--accent-primary-bg-alpha-xs)' : isHov ? 'var(--canvas-surface-2)' : 'transparent',
      }}>
      <div style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: left + '%', width: w + '%', height: 14, borderRadius: 3,
        background: svc.color, opacity: isErr ? 0.92 : 0.86,
        boxShadow: isSel ? '0 0 0 1.5px var(--accent-primary)' : isErr ? 'inset 0 0 0 1.5px var(--status-error)' : 'none',
        outline: isErr ? '1px solid var(--status-error)' : 'none', outlineOffset: isErr ? 0 : 0,
      }}>
        {isWarn && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--status-warn)', borderRadius: '3px 0 0 3px' }} />}
      </div>
      {isErr && (
        <span style={{ position: 'absolute', top: '50%', left: `calc(${left}% - 4px)`, transform: 'translate(-100%,-50%)', color: 'var(--status-error)', display: 'inline-flex' }}>
          <Icon name="alert" size={12} />
        </span>
      )}
      {label}
    </div>
  );
}

/* ---------- The combined lane (head + tree + waterfall + connectors) ---------- */
function TraceLane({ model, services, collapsed, selected, hovered, onSelect, onHover, onToggle }) {
  const { total } = model;
  const rows = visibleRows(model.ordered, collapsed);
  const idx = {}; rows.forEach((s, i) => { idx[s.id] = i; });
  const { ticks } = niceTicks(total);
  const H = rows.length * ROW_H;

  // ancestor path of selected (for connector highlight)
  const path = new Set();
  if (selected && model.byId[selected]) {
    let cur = model.byId[selected];
    while (cur) { path.add(cur.id); cur = cur.parentId ? model.byId[cur.parentId] : null; }
  }

  return (
    <div style={{ flex: 1, minWidth: TREE_W + 420, display: 'flex', flexDirection: 'column' }}>
      {/* lane head */}
      <div style={{ display: 'flex', height: 32, borderBottom: '1px solid var(--canvas-border)', background: 'var(--canvas-bg-2)', flex: '0 0 auto' }}>
        <div style={{ width: TREE_W, flex: '0 0 ' + TREE_W + 'px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 0 14px', borderRight: '1px solid var(--canvas-border)' }}>
          <span className="eyebrow" style={{ fontSize: 10 }}>SPAN · {rows.length}/{model.ordered.length}</span>
          <span className="eyebrow" style={{ fontSize: 10 }}>DURATION</span>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          {ticks.map((t, i) => (
            <div key={i} style={{ position: 'absolute', left: xOf(t, total) + '%', top: 0, bottom: 0, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--canvas-fg-3)', fontVariantNumeric: 'tabular-nums' }}>{t === 0 ? '0' : fmtMs(t)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* scroll body */}
      <div id="laneScroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', minHeight: '100%' }}>
          {/* tree column */}
          <div style={{ width: TREE_W, flex: '0 0 ' + TREE_W + 'px', borderRight: '1px solid var(--canvas-border)' }}>
            {rows.map(s => (
              <TreeRow key={s.id} s={s} services={services} selected={selected} hovered={hovered}
                onSelect={onSelect} onHover={onHover} onToggle={onToggle} collapsed={collapsed.has(s.id)} />
            ))}
          </div>
          {/* waterfall column */}
          <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
            {/* gridlines */}
            {ticks.map((t, i) => (
              <div key={i} style={{ position: 'absolute', left: xOf(t, total) + '%', top: 0, height: H, width: 1, background: 'var(--canvas-border)', opacity: 0.6 }} />
            ))}
            {/* parent→child connector bus */}
            <svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}>
              {rows.map(s => {
                if (!s.parentId || idx[s.parentId] === undefined) return null;
                const p = model.byId[s.parentId];
                const xP = xOf(p.start, total), xC = xOf(s.start, total);
                const yP = idx[s.parentId] * ROW_H + ROW_H / 2 + 5;
                const yC = idx[s.id] * ROW_H + ROW_H / 2;
                const on = path.has(s.id) && path.has(s.parentId);
                return (
                  <path key={s.id} d={`M ${xP} ${yP} L ${xP} ${yC} L ${xC} ${yC}`}
                    fill="none" stroke={on ? 'var(--accent-primary)' : 'var(--canvas-border-strong)'}
                    strokeWidth={on ? 1.5 : 1} strokeOpacity={on ? 0.9 : 0.7}
                    vectorEffect="non-scaling-stroke" />
                );
              })}
            </svg>
            {/* bars */}
            <div style={{ position: 'relative' }}>
              {rows.map(s => (
                <WfRow key={s.id} s={s} services={services} total={total} selected={selected} hovered={hovered}
                  onSelect={onSelect} onHover={onHover} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ROW_H, TREE_W, HeaderSummary, TraceLane, niceTicks });
