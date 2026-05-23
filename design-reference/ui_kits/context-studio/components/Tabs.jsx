// Heimdall — primitive · Tabs
// Mono count chip on each tab. Active tab gets a 2px amber underline pinned to bottom -1px.
// Anatomy spec: preview/component-tabs.html

function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => {
        const id = typeof it === "string" ? it : it.id;
        const label = typeof it === "string" ? it : it.label;
        const count = typeof it === "object" ? it.count : undefined;
        const isActive = active === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            className={"tab" + (isActive ? " active" : "")}
            onClick={() => onChange && onChange(id)}
          >
            {label}
            {count != null && <span className="count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { Tabs });
