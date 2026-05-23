// Heimdall — primitive · WorkspaceSwitcher
// Modal-style dialog with: head, 3-tile action row, "RECENT" header, recent rows.
// Sits on the dark shell tone (not the canvas tone).
// Anatomy spec: preview/component-workspace-switcher.html

function WorkspaceSwitcher({ recent = [], onPickAction, onOpenRecent, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ACTIONS = [
    { id: "open",  icon: "folder", title: "Open folder…",   desc: "Point Context Studio at an existing folder." },
    { id: "new",   icon: "plus",   title: "New workspace…", desc: "Initialize a fresh schema and run scaffold." },
    { id: "clone", icon: "branch", title: "Clone from git…", desc: "Pull a workspace from a remote repository." },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="ws-switcher" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Open workspace">
        <div className="ws-head">
          <div className="title">Open workspace</div>
          <div className="sub">A workspace is a local folder containing your schema, individuals, and pipeline runs.</div>
        </div>

        <div className="ws-actions">
          {ACTIONS.map((a) => (
            <div key={a.id} className="ws-action" onClick={() => onPickAction && onPickAction(a.id)}>
              <div className="icon"><Icon name={a.icon} size={14} /></div>
              <div className="n">{a.title}</div>
              <div className="d">{a.desc}</div>
            </div>
          ))}
        </div>

        <div className="ws-recent-head">RECENT</div>
        <div style={{ padding: "0 0 10px" }}>
          {recent.map((r, i) => {
            const isOpen = r.open || r.current;
            return (
              <div
                key={r.id || r.name || i}
                className={"ws-recent-row" + (isOpen ? " open" : "")}
                onClick={() => onOpenRecent && onOpenRecent(r)}
                style={{ cursor: "pointer" }}
              >
                <div className="mark"><Icon name="folder" size={12} /></div>
                <div className="name">{r.name}</div>
                {isOpen
                  ? <span className="version-pill" style={{ fontSize: 10 }}>open</span>
                  : <span style={{ width: 0 }}></span>}
                <span className="stats">{r.stats}</span>
                <span className="stats">{r.when}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WorkspaceSwitcher });
