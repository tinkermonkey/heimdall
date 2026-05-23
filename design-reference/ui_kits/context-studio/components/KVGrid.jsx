// Heimdall — primitive · KVGrid
// 2-col grid: 130px mono caps key → 1fr value. Sub-rows stack inside .v.
// Anatomy spec: preview/component-kv-grid.html

function KVGrid({ rows }) {
  return (
    <div className="kv-grid">
      {rows.map((r, i) => (
        <React.Fragment key={r.key || i}>
          <div className="k">{r.key}</div>
          <div className="v">
            {r.value == null || r.value === ""
              ? <em className="empty">— none —</em>
              : r.value}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// KGNodePill — used inside KVGrid values, in HierarchyRow, and in graph nodes.
function KGNodePill({ children, domain, variant }) {
  const cls = "kg-node-pill" + (variant ? " " + variant : "");
  return (
    <span className={cls} data-domain={domain || "default"}>
      <span className="swatch"></span>
      {children}
    </span>
  );
}

Object.assign(window, { KVGrid, KGNodePill });
