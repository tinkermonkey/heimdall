// Heimdall — primitive · StatTile
// Standard tile with 2px colored left bar. Optional sparkline + icon-prefixed label.
// Anatomy spec: preview/component-stat-tile.html

function StatTile({ label, value, color, meta, icon, spark, sparkColor }) {
  const hasSpark = !!(spark && spark.length);
  return (
    <div className={"stat" + (hasSpark ? " has-spark" : "")} data-color={color}>
      <div className="label">
        {icon && <span style={{ marginRight: 6, display: "inline-flex" }}><Icon name={icon} size={11} /></span>}
        {label}
      </div>
      <div className="num">{value}</div>
      {meta && <div className="meta">{meta}</div>}
      {hasSpark && <Sparkline points={spark} color={sparkColor || sparkColorFor(color)} />}
    </div>
  );
}

function sparkColorFor(color) {
  return {
    cyan: "#22D3EE",
    emerald: "#10B981",
    amber: "#F59E0B",
    violet: "#8B5CF6",
    rose: "#F43F5E",
  }[color] || "#64748B";
}

// 88×28 sparkline pinned bottom-right of a tile. points = [n0,n1,...]
function Sparkline({ points, color = "#22D3EE", width = 88, height = 28 }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [i * step, height - 2 - ((p - min) / range) * (height - 4)]);
  const line = coords.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = "sg-" + Math.random().toString(36).slice(2, 8);
  return (
    <svg className="stat-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Object.assign(window, { StatTile, Sparkline });
