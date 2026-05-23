// Heimdall — primitive · ActivityItem
// Grid: 16px dot · 1fr content · auto when. kind ∈ create/update/run/delete.
// Anatomy spec: preview/component-activity-item.html

function ActivityItem({ kind = "update", tag, headline, subject, meta, when, children }) {
  return (
    <div className="activity-row" data-kind={kind}>
      <span className="dot"></span>
      <div>
        <div className="headline">
          {tag && <span className="kind-tag">{tag}</span>}
          {children || (
            <>
              <b>{headline}</b>
              {subject && <><span>—</span><span style={{ fontFamily: "var(--font-mono)" }}>{subject}</span></>}
            </>
          )}
        </div>
        {meta && <div className="meta">{meta}</div>}
      </div>
      {when && <div className="when">{when}</div>}
    </div>
  );
}

function ActivityList({ items }) {
  return (
    <div>
      {items.map((it, i) => <ActivityItem key={it.id || i} {...it} />)}
    </div>
  );
}

Object.assign(window, { ActivityItem, ActivityList });
