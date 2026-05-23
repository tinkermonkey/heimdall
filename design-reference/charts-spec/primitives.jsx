// Heimdall · chart primitives for the design-spec page.
// Static SVG renderers, low-config, no dependencies. Series colors cycle in the
// canonical Heimdall order: cyan → emerald → amber → indigo → violet → rose.

const SERIES = ['#22D3EE', '#10B981', '#F59E0B', '#818CF8', '#8B5CF6', '#F43F5E'];

// surface-aware muted/border tokens so charts work on light + dark canvas
const TONE = {
  light: { fg1: '#0B1220', fg2: '#475569', fg3: '#64748B', fg4: '#94A3B8', grid: '#EEF1F4', border: '#E5E9EE', card: '#FFFFFF', inset: '#F7F9FB' },
  dark:  { fg1: '#E2E8F0', fg2: '#94A3B8', fg3: '#64748B', fg4: '#475569', grid: '#1B2949', border: '#243763', card: '#1B2949', inset: '#13203A' },
};

// ---------- math helpers ---------------------------------------------------
function scale(v, [a, b], [c, d]) { return c + ((v - a) / (b - a || 1)) * (d - c); }
function linePath(pts) { return pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)).join(' '); }
function smoothPath(pts) { return linePath(pts); }
function fmt(n) { return Math.abs(n) >= 1000 ? (n / 1000).toFixed(1) + 'k' : (Number.isInteger(n) ? n : n.toFixed(1)); }

// ---------- Sparkline (canonical 88×28) ------------------------------------
function Sparkline({ values, width = 88, height = 28, color = SERIES[0], area = true }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - 2 - ((v - min) / (max - min || 1)) * (height - 4)]);
  const line = linePath(pts);
  const fill = `${line} L${width},${height} L0,${height} Z`;
  const id = 'sg-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {area && <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.20"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>}
      {area && <path d={fill} fill={`url(#${id})`}/>}
      <path d={line} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ---------- LineChart ------------------------------------------------------
// series: [[v0, v1, ...], ...]
function LineChart({
  series, xLabels, width = 480, height = 200,
  colors, area = false,
  axes = false, grid = false, ticks = 4,
  threshold = null, markers = null,
  padding, tone = 'light', tooltip = false,
}) {
  const T = TONE[tone];
  const cs = colors || (series.length === 1 ? [SERIES[0]] : SERIES);
  const pad = padding || {
    top: 8,
    right: tooltip ? 12 : 8,
    bottom: axes ? 22 : 6,
    left: axes ? 30 : 6,
  };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const flat = series.flat();
  let lo = Math.min(...flat), hi = Math.max(...flat);
  const span = hi - lo || 1; lo -= span * 0.08; hi += span * 0.08;
  if (threshold) { lo = Math.min(lo, threshold.value); hi = Math.max(hi, threshold.value); }

  const n = series[0].length;
  const xAt = (i) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v) => pad.top + innerH - ((v - lo) / (hi - lo)) * innerH;

  const seriesPaths = series.map(s => s.map((v, i) => [xAt(i), yAt(v)]));
  const yTickVals = []; for (let i = 0; i <= ticks; i++) yTickVals.push(lo + (i / ticks) * (hi - lo));

  // hover state for the (optional) feature tooltip
  const [hover, setHover] = React.useState(null);
  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.max(0, Math.min(n - 1, Math.round((px - pad.left) / innerW * (n - 1))));
    setHover(idx);
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
         onMouseMove={tooltip ? onMove : null}
         onMouseLeave={tooltip ? () => setHover(null) : null}
         style={{ display: 'block', cursor: tooltip ? 'crosshair' : 'default' }}>
      {/* gridlines */}
      {grid && yTickVals.map((v, i) => (
        <line key={'g'+i} x1={pad.left} x2={width - pad.right} y1={yAt(v)} y2={yAt(v)}
              stroke={T.grid} strokeWidth="1"/>
      ))}
      {/* axes */}
      {axes && <>
        <line x1={pad.left} x2={pad.left} y1={pad.top} y2={pad.top + innerH} stroke={T.border} strokeWidth="1"/>
        <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke={T.border} strokeWidth="1"/>
        {yTickVals.map((v, i) => (
          <text key={'yt'+i} x={pad.left - 6} y={yAt(v) + 3} textAnchor="end"
                fontFamily="JetBrains Mono" fontSize="10" fill={T.fg3}>{fmt(v)}</text>
        ))}
        {xLabels && xLabels.map((lab, i) => (
          <text key={'xt'+i} x={xAt(i)} y={pad.top + innerH + 14} textAnchor="middle"
                fontFamily="JetBrains Mono" fontSize="10" fill={T.fg3}>{lab}</text>
        ))}
      </>}
      {/* threshold */}
      {threshold && <>
        <line x1={pad.left} x2={width - pad.right} y1={yAt(threshold.value)} y2={yAt(threshold.value)}
              stroke={T.fg3} strokeWidth="1" strokeDasharray="3 3"/>
        {threshold.label && <text x={width - pad.right - 4} y={yAt(threshold.value) - 4} textAnchor="end"
              fontFamily="JetBrains Mono" fontSize="9.5" fill={T.fg3}
              style={{textTransform:'uppercase',letterSpacing:'0.08em'}}>{threshold.label}</text>}
      </>}
      {/* event markers */}
      {markers && markers.map((m, i) => (
        <g key={'mk'+i}>
          <line x1={xAt(m.x)} x2={xAt(m.x)} y1={pad.top - 2} y2={pad.top + innerH}
                stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"/>
          <circle cx={xAt(m.x)} cy={pad.top + 4} r="3" fill="#F59E0B"/>
          {m.label && <text x={xAt(m.x) + 6} y={pad.top + 7}
                fontFamily="JetBrains Mono" fontSize="9.5" fill="#B45309"
                style={{textTransform:'uppercase',letterSpacing:'0.08em'}}>{m.label}</text>}
        </g>
      ))}
      {/* area + line */}
      {seriesPaths.map((pts, si) => {
        const c = cs[si % cs.length];
        const line = linePath(pts);
        const fill = `${line} L${pts[pts.length-1][0]},${pad.top + innerH} L${pts[0][0]},${pad.top + innerH} Z`;
        const id = 'lg' + si + '-' + Math.random().toString(36).slice(2,6);
        return (
          <g key={'s'+si}>
            {area && <>
              <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity="0.22"/>
                <stop offset="100%" stopColor={c} stopOpacity="0"/>
              </linearGradient></defs>
              <path d={fill} fill={`url(#${id})`}/>
            </>}
            <path d={line} stroke={c} strokeWidth={tooltip ? 1.75 : 1.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        );
      })}
      {/* tooltip */}
      {tooltip && hover !== null && (
        <g>
          <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.top} y2={pad.top + innerH}
                stroke={T.fg3} strokeWidth="1" strokeDasharray="2 3"/>
          {series.map((s, si) => (
            <circle key={'h'+si} cx={xAt(hover)} cy={yAt(s[hover])} r="3"
                    fill={tone === 'dark' ? '#1B2949' : '#FFFFFF'}
                    stroke={cs[si % cs.length]} strokeWidth="1.75"/>
          ))}
          {/* tooltip card */}
          {(() => {
            const tw = 132, th = 18 + series.length * 16;
            let tx = xAt(hover) + 10;
            if (tx + tw > width - 4) tx = xAt(hover) - tw - 10;
            const ty = pad.top + 4;
            return (
              <g>
                <rect x={tx} y={ty} width={tw} height={th} rx="6"
                      fill={tone === 'dark' ? '#0F1729' : '#0F1729'} fillOpacity="0.96"
                      stroke="#243763"/>
                <text x={tx + 9} y={ty + 13}
                      fontFamily="JetBrains Mono" fontSize="9.5" fill="#A6B1BD"
                      style={{textTransform:'uppercase',letterSpacing:'0.10em'}}>
                  {xLabels ? xLabels[hover] : 't' + hover}
                </text>
                {series.map((s, si) => (
                  <g key={'tt'+si}>
                    <rect x={tx + 9} y={ty + 22 + si * 16} width="6" height="6" rx="1" fill={cs[si % cs.length]}/>
                    <text x={tx + 20} y={ty + 28 + si * 16}
                          fontFamily="JetBrains Mono" fontSize="10.5" fill="#E6EDF3">
                      {fmt(s[hover])}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

// ---------- BarChart (vertical) -------------------------------------------
function BarV({
  values, xLabels, width = 480, height = 200,
  color = SERIES[2], axes = false, grid = false, ticks = 4,
  threshold = null, tone = 'light',
}) {
  const T = TONE[tone];
  const pad = { top: 8, right: 8, bottom: axes ? 22 : 6, left: axes ? 30 : 6 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const hi = Math.max(...values, threshold ? threshold.value : 0);
  const n = values.length;
  const gap = Math.max(2, innerW / n * 0.22);
  const bw = (innerW - gap * (n - 1)) / n;
  const yAt = v => pad.top + innerH - (v / hi) * innerH;
  const yTickVals = []; for (let i = 0; i <= ticks; i++) yTickVals.push((i / ticks) * hi);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:'block'}}>
      {grid && yTickVals.map((v, i) => (
        <line key={'g'+i} x1={pad.left} x2={width - pad.right} y1={yAt(v)} y2={yAt(v)} stroke={T.grid} strokeWidth="1"/>
      ))}
      {axes && <>
        <line x1={pad.left} x2={pad.left} y1={pad.top} y2={pad.top + innerH} stroke={T.border}/>
        <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke={T.border}/>
        {yTickVals.map((v, i) => (
          <text key={'yt'+i} x={pad.left - 6} y={yAt(v) + 3} textAnchor="end"
                fontFamily="JetBrains Mono" fontSize="10" fill={T.fg3}>{fmt(v)}</text>
        ))}
      </>}
      {values.map((v, i) => {
        const x = pad.left + i * (bw + gap);
        const y = yAt(v);
        return <rect key={i} x={x} y={y} width={bw} height={pad.top + innerH - y} fill={color} rx="1"/>;
      })}
      {axes && xLabels && xLabels.map((lab, i) => (
        <text key={'xt'+i} x={pad.left + i * (bw + gap) + bw/2} y={pad.top + innerH + 14} textAnchor="middle"
              fontFamily="JetBrains Mono" fontSize="10" fill={T.fg3}>{lab}</text>
      ))}
      {threshold && <>
        <line x1={pad.left} x2={width - pad.right} y1={yAt(threshold.value)} y2={yAt(threshold.value)}
              stroke={T.fg3} strokeWidth="1" strokeDasharray="3 3"/>
        {threshold.label && <text x={width - pad.right - 4} y={yAt(threshold.value) - 4} textAnchor="end"
              fontFamily="JetBrains Mono" fontSize="9.5" fill={T.fg3}
              style={{textTransform:'uppercase',letterSpacing:'0.08em'}}>{threshold.label}</text>}
      </>}
    </svg>
  );
}

// ---------- BarH (horizontal bar) -----------------------------------------
function BarH({ items, width = 320, height = 200, color, tone = 'light', showValues = true }) {
  const T = TONE[tone];
  const pad = { top: 4, right: 36, bottom: 4, left: 92 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const hi = Math.max(...items.map(it => it.value));
  const rowH = innerH / items.length;
  const barH = Math.min(rowH * 0.62, 14);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:'block'}}>
      {items.map((it, i) => {
        const y = pad.top + i * rowH + (rowH - barH) / 2;
        const w = (it.value / hi) * innerW;
        const c = it.color || color || SERIES[0];
        return (
          <g key={i}>
            <text x={pad.left - 10} y={y + barH * 0.78} textAnchor="end"
                  fontFamily="JetBrains Mono" fontSize="11" fill={T.fg2}>{it.label}</text>
            <rect x={pad.left} y={y} width={innerW} height={barH} fill={T.inset} rx="2"/>
            <rect x={pad.left} y={y} width={w} height={barH} fill={c} rx="2"/>
            {showValues && <text x={pad.left + w + 6} y={y + barH * 0.78}
                  fontFamily="JetBrains Mono" fontSize="11" fill={T.fg2} fontWeight="500">{fmt(it.value)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- StackedBar (vertical) -----------------------------------------
// stacks: [{label, parts: [v0, v1, ...]}]  with one global colors array
function StackedBar({
  stacks, colors, width = 480, height = 200, tone = 'light',
  axes = false, grid = false, ticks = 4, normalized = false,
}) {
  const T = TONE[tone];
  const cs = colors || SERIES;
  const pad = { top: 8, right: 8, bottom: axes ? 22 : 6, left: axes ? 30 : 6 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const totals = stacks.map(s => s.parts.reduce((a,b) => a + b, 0));
  const hi = normalized ? 1 : Math.max(...totals);
  const n = stacks.length;
  const gap = Math.max(2, innerW / n * 0.22);
  const bw = (innerW - gap * (n - 1)) / n;
  const yTickVals = []; for (let i = 0; i <= ticks; i++) yTickVals.push((i / ticks) * hi);
  const yAt = v => pad.top + innerH - (v / hi) * innerH;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:'block'}}>
      {grid && yTickVals.map((v, i) => (
        <line key={'g'+i} x1={pad.left} x2={width - pad.right} y1={yAt(v)} y2={yAt(v)} stroke={T.grid}/>
      ))}
      {axes && <>
        <line x1={pad.left} x2={pad.left} y1={pad.top} y2={pad.top + innerH} stroke={T.border}/>
        <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke={T.border}/>
        {yTickVals.map((v, i) => (
          <text key={'yt'+i} x={pad.left - 6} y={yAt(v) + 3} textAnchor="end"
                fontFamily="JetBrains Mono" fontSize="10" fill={T.fg3}>{normalized ? Math.round(v*100)+'%' : fmt(v)}</text>
        ))}
      </>}
      {stacks.map((s, i) => {
        const x = pad.left + i * (bw + gap);
        const total = totals[i] || 1;
        let acc = 0;
        return (
          <g key={i}>
            {s.parts.map((p, pi) => {
              const v = normalized ? p / total : p;
              const ph = (v / hi) * innerH;
              const y = pad.top + innerH - acc - ph;
              acc += ph;
              return <rect key={pi} x={x} y={y} width={bw} height={ph} fill={cs[pi % cs.length]}/>;
            })}
            {axes && <text x={x + bw/2} y={pad.top + innerH + 14} textAnchor="middle"
                  fontFamily="JetBrains Mono" fontSize="10" fill={T.fg3}>{s.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Donut ----------------------------------------------------------
function Donut({
  slices, colors, width = 160, height = 160, tone = 'light',
  thickness = 14, centerLabel, centerValue,
}) {
  const T = TONE[tone];
  const cs = colors || SERIES;
  const cx = width / 2, cy = height / 2;
  const r = Math.min(width, height) / 2 - 4;
  const ri = r - thickness;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let acc = -Math.PI / 2;
  function arc(a0, a1) {
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi0 = cx + ri * Math.cos(a0), yi0 = cy + ri * Math.sin(a0);
    const xi1 = cx + ri * Math.cos(a1), yi1 = cy + ri * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${ri} ${ri} 0 ${large} 0 ${xi0} ${yi0} Z`;
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:'block'}}>
      {slices.map((s, i) => {
        const a0 = acc;
        const a1 = acc + (s.value / total) * Math.PI * 2;
        acc = a1;
        return <path key={i} d={arc(a0, a1)} fill={s.color || cs[i % cs.length]}/>;
      })}
      {centerValue !== undefined && (
        <text x={cx} y={cy + 1} textAnchor="middle"
              fontFamily="Inter" fontSize={Math.min(width, height) * 0.22} fontWeight="700"
              fill={T.fg1} style={{letterSpacing:'-0.02em'}}
              fontVariantNumeric="tabular-nums">{centerValue}</text>
      )}
      {centerLabel && (
        <text x={cx} y={cy + Math.min(width, height) * 0.18} textAnchor="middle"
              fontFamily="JetBrains Mono" fontSize="10" fill={T.fg3}
              style={{textTransform:'uppercase',letterSpacing:'0.08em'}}>{centerLabel}</text>
      )}
    </svg>
  );
}

// ---------- Heatmap (calendar-style) --------------------------------------
// data: 2D array, e.g. [[v, v, ...], ...]; baseColor as the "hot" hue
function Heatmap({
  data, width = 480, height = 120, tone = 'light',
  baseColor = '#10B981', xLabels, yLabels, axes = false,
}) {
  const T = TONE[tone];
  const rows = data.length;
  const cols = data[0].length;
  const pad = { top: 4, right: 8, bottom: axes ? 18 : 4, left: axes ? 28 : 4 };
  const cw = (width - pad.left - pad.right) / cols;
  const ch = (height - pad.top - pad.bottom) / rows;
  const flat = data.flat();
  const lo = Math.min(...flat), hi = Math.max(...flat);
  function shade(v) {
    if (v == null) return tone === 'dark' ? '#13203A' : '#F7F9FB';
    const t = (v - lo) / (hi - lo || 1);
    // 0 → low-alpha base; 1 → solid base
    const alpha = 0.12 + t * 0.88;
    return baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:'block'}}>
      {data.map((row, r) => row.map((v, c) => (
        <rect key={r+'-'+c}
              x={pad.left + c * cw + 1}
              y={pad.top + r * ch + 1}
              width={cw - 2} height={ch - 2}
              fill={shade(v)} rx="2"/>
      )))}
      {axes && yLabels && yLabels.map((lab, i) => (
        <text key={'y'+i} x={pad.left - 6} y={pad.top + i * ch + ch/2 + 3} textAnchor="end"
              fontFamily="JetBrains Mono" fontSize="9.5" fill={T.fg3}>{lab}</text>
      ))}
      {axes && xLabels && xLabels.map((lab, i) => (
        <text key={'x'+i} x={pad.left + i * cw + cw/2} y={height - pad.bottom + 12} textAnchor="middle"
              fontFamily="JetBrains Mono" fontSize="9.5" fill={T.fg3}>{lab}</text>
      ))}
    </svg>
  );
}

// ---------- StatusTimeline (gantt-ish) ------------------------------------
// tracks: [{label, segments: [{start, end, kind: 'ok'|'warn'|'error'|'idle'}]}]
// range: [0, 100] units (treat as time)
function StatusTimeline({
  tracks, range = [0, 100], width = 480, height = 160, tone = 'light',
  axes = false, xLabels, marker = null,
}) {
  const T = TONE[tone];
  const KIND = {
    ok:    '#10B981',
    warn:  '#F59E0B',
    error: '#F43F5E',
    idle:  tone === 'dark' ? '#243763' : '#E5E9EE',
    info:  '#22D3EE',
  };
  const pad = { top: 6, right: 8, bottom: axes ? 22 : 6, left: 92 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const rowH = innerH / tracks.length;
  const barH = Math.min(rowH * 0.60, 14);
  const xAt = v => pad.left + ((v - range[0]) / (range[1] - range[0])) * innerW;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:'block'}}>
      {tracks.map((t, i) => {
        const y = pad.top + i * rowH + (rowH - barH) / 2;
        return (
          <g key={i}>
            <text x={pad.left - 10} y={y + barH * 0.78} textAnchor="end"
                  fontFamily="JetBrains Mono" fontSize="11" fill={T.fg2}>{t.label}</text>
            <rect x={pad.left} y={y} width={innerW} height={barH} fill={T.inset} rx="2"/>
            {t.segments.map((s, si) => (
              <rect key={si}
                    x={xAt(s.start)} y={y}
                    width={Math.max(2, xAt(s.end) - xAt(s.start))}
                    height={barH}
                    fill={KIND[s.kind] || s.kind}
                    rx="2"/>
            ))}
          </g>
        );
      })}
      {axes && xLabels && xLabels.map((lab, i) => (
        <text key={'x'+i} x={pad.left + (i / (xLabels.length - 1)) * innerW} y={pad.top + innerH + 14}
              textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill={T.fg3}>{lab}</text>
      ))}
      {marker && <>
        <line x1={xAt(marker.x)} x2={xAt(marker.x)} y1={pad.top - 2} y2={pad.top + innerH + 2}
              stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2"/>
        <circle cx={xAt(marker.x)} cy={pad.top - 2} r="3" fill="#F59E0B"/>
        {marker.label && <text x={xAt(marker.x) + 6} y={pad.top + 2}
              fontFamily="JetBrains Mono" fontSize="9.5" fill="#B45309"
              style={{textTransform:'uppercase',letterSpacing:'0.08em'}}>{marker.label}</text>}
      </>}
    </svg>
  );
}

Object.assign(window, { Sparkline, LineChart, BarV, BarH, StackedBar, Donut, Heatmap, StatusTimeline, SERIES, TONE });
