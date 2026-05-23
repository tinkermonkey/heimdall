// Heimdall — primitive · InspectorPanel
// Head (eyebrow + title + mono-id + actions) over a stack of bordered sections.
// Anatomy spec: preview/component-inspector-panel.html

function InspectorPanel({ eyebrow, title, monoId, actions, children }) {
  return (
    <div className="inspector">
      <div className="inspector-head">
        <div className="main">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {title && <div className="title">{title}</div>}
          {monoId && <div className="mono-id">{monoId}</div>}
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function InspectorSection({ title, count, action, children, padding = true }) {
  const hasHead = title || action;
  return (
    <div className="inspector-section">
      {hasHead && (
        <div className="inspector-section-head">
          <div className="inspector-section-title">
            {title}
            {count != null && <span className="badge-tiny">{count}</span>}
          </div>
          {action}
        </div>
      )}
      {padding ? children : <div style={{ margin: "-14px -16px" }}>{children}</div>}
    </div>
  );
}

Object.assign(window, { InspectorPanel, InspectorSection });
