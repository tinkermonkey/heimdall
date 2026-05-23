// Heimdall — primitive · HierarchyRow + HierarchyTree
// Two-column tree row with description. Depth padding +20px per level.
// Anatomy spec: preview/component-hierarchy-row.html

function HierarchyRow({ depth = 0, domain, variant, label, count, countLabel, desc, selected, onClick }) {
  // Render the dashed connectors for each parent depth (1..depth)
  const connectors = [];
  for (let d = 1; d <= depth; d++) {
    connectors.push(<span key={d} className="conn" style={{ left: (d * 20) + 4 }} />);
  }
  return (
    <div
      className={"hier-row" + (selected ? " selected" : "")}
      data-depth={depth}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {connectors}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <KGNodePill domain={domain} variant={variant}>{label}</KGNodePill>
        {count != null && (
          <span className="badge-tiny">
            {count}{countLabel ? " " + countLabel : ""}
          </span>
        )}
      </div>
      {desc && <div className="desc">{desc}</div>}
    </div>
  );
}

function HierarchyTree({ rows }) {
  // rows: [{ depth, domain, variant, label, count, countLabel, desc, id, selected, onClick }]
  return (
    <div>
      {rows.map((r, i) => <HierarchyRow key={r.id || i} {...r} />)}
    </div>
  );
}

Object.assign(window, { HierarchyRow, HierarchyTree });
