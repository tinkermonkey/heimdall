// Heimdall — primitive · GraphCanvas
// Dot-grid background + toolbar (top-left) + legend (top-right) + minimap (bottom-right).
// Nodes are 220×36 with a 3px domain swatch; selected gets amber outline + amber title.
// Anatomy spec: preview/component-graph-canvas.html

function GraphCanvas({ children, toolbar, legend, minimap, style }) {
  return (
    <div className="graph-canvas" style={style}>
      {toolbar && <div className="graph-toolbar">{toolbar}</div>}
      {legend  && <div className="graph-legend">{legend}</div>}
      {children}
      {minimap && <div className="graph-minimap">{minimap}</div>}
    </div>
  );
}

function GraphNode({ x, y, label, monoId, domain, selected, onClick }) {
  const swatchColor = ({
    life: "var(--dom-life)",
    climate: "var(--dom-climate)",
    software: "var(--dom-software)",
  })[domain] || "var(--dom-default)";
  return (
    <div
      className={"graph-node" + (selected ? " selected" : "")}
      style={{ top: y, left: x }}
      onClick={onClick}
    >
      <span className="swatch" style={{ background: swatchColor }}></span>
      <span style={{ flex: 1 }}>{label}</span>
      {monoId && (
        <span style={{ fontSize: 10, color: "var(--canvas-fg-3)" }}>{monoId}</span>
      )}
    </div>
  );
}

Object.assign(window, { GraphCanvas, GraphNode });
