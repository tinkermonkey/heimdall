// Heimdall — Context Studio · Overlays
// CommandPalette (⌘K) with grouped results, plus NewClassModal built on the Modal primitive.

function CommandPalette({ onClose, onNav }) {
  const [q, setQ] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Build groups in their canonical display order
  const groups = useMemo(() => {
    const navItems = [];
    NAV_TREE.forEach((n) => {
      if (n.children) n.children.forEach((c) => navItems.push({ kind: "Go", label: c.label, hint: n.label, route: c.id, icon: n.icon }));
      else navItems.push({ kind: "Go", label: n.label, hint: "", route: n.id, icon: n.icon });
    });
    const recent = [
      { kind: "Recent", label: "BRCA1 — individual",   hint: "opened 4m ago",  route: "schema/classes", icon: "schema"   },
      { kind: "Recent", label: "pubmed_genes — pipeline", hint: "opened 12m ago", route: "pipelines/all",  icon: "pipeline" },
    ];
    const classes = [
      { kind: "Class",  label: "Gene",    hint: "cls_gene",    icon: "schema" },
      { kind: "Class",  label: "Protein", hint: "cls_protein", icon: "schema" },
    ];
    const actions = [
      { kind: "Action", label: "New pipeline run…",           hint: "Pipelines", icon: "pipeline" },
      { kind: "Action", label: "Reindex workspace",            hint: "System",   icon: "refresh"  },
      { kind: "Action", label: "Import individuals from CSV…", hint: "Data",     icon: "data"     },
    ];
    return [
      { id: "recent",  label: "RECENT",  items: recent },
      { id: "class",   label: "CLASS",   items: classes },
      { id: "go",      label: "JUMP TO", items: navItems },
      { id: "action",  label: "ACTION",  items: actions },
    ];
  }, []);

  const filteredGroups = useMemo(() => {
    if (!q) return groups;
    const Q = q.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((x) => x.label.toLowerCase().includes(Q) || (x.hint && x.hint.toLowerCase().includes(Q))),
      }))
      .filter((g) => g.items.length > 0);
  }, [q, groups]);

  // Flatten for keyboard nav
  const flat = filteredGroups.flatMap((g) => g.items);

  useEffect(() => setActiveIndex(0), [flat.length]);

  const onPick = (item) => { if (item.route) onNav(item.route); else onClose(); };
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => (i + 1) % flat.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => i === 0 ? Math.max(0, flat.length - 1) : i - 1); }
    else if (e.key === "Enter" && flat[activeIndex]) { e.preventDefault(); onPick(flat[activeIndex]); }
  };

  // Map kind → color class for the inline kind label
  const KIND_COLOR = {
    Recent:     { color: "var(--accent-primary)" },
    Class:      { color: "var(--status-cyan)" },
    Individual: { color: "var(--status-cyan)" },
    Pipeline:   { color: "var(--status-cyan)" },
    Go:         { color: "var(--status-cyan)" },
    Action:     { color: "var(--status-emerald)" },
  };

  let runningIndex = -1;
  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <div className="palette-input-row">
          <Icon name="search" size={14}/>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search, jump to a route, or run a command…"
          />
          <span className="palette-esc">esc</span>
        </div>
        <div className="palette-results">
          {flat.length === 0 && <div style={{padding:"22px 14px", color:"var(--shell-fg-3)", fontSize: 12.5}}>No matches</div>}
          {filteredGroups.map((g) => (
            <div key={g.id}>
              <div style={{padding:"8px 14px 4px", fontFamily:"var(--font-mono)", fontSize:9.5, letterSpacing:"0.10em", textTransform:"uppercase", color:"var(--shell-fg-3)"}}>{g.label}</div>
              {g.items.map((it) => {
                runningIndex += 1;
                const i = runningIndex;
                const isActive = i === activeIndex;
                return (
                  <button
                    key={i}
                    className={"palette-item" + (isActive ? " active" : "")}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => onPick(it)}
                  >
                    <span className="palette-kind" style={KIND_COLOR[it.kind]}>{it.kind}</span>
                    <Icon name={it.icon} size={13}/>
                    <span className="palette-label">{it.label}</span>
                    {it.hint && <span className="palette-hint">{it.hint}</span>}
                    <Icon name="arrow" size={11} className="palette-arrow"/>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span><span className="kbd-mini">↵</span> open</span>
          <span><span className="kbd-mini">↑↓</span> navigate</span>
          <span><span className="kbd-mini">⌘K</span> close</span>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// NewClassModal — composed from the generic <Modal> primitive.
function NewClassModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [tax, setTax]   = useState("life");
  const [desc, setDesc] = useState("");
  const valid = /^[a-z][a-z0-9_]*$/.test(name);
  return (
    <Modal onClose={onClose} ariaLabel="New class">
      <ModalHead
        title="New class"
        subtitle="Add a new class to a taxonomy. Names must be lowercase snake_case."
      />
      <ModalBody>
        <div className="field">
          <div className="lab">
            <span style={{fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--canvas-fg-3)"}}>IDENTIFIER</span>
            <span className="muted" style={{marginLeft:8, fontSize:11.5}}>snake_case · required</span>
          </div>
          <input
            className="input mono"
            placeholder="organism"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="hint">
            Renders as <span className="mono" style={{color:"var(--canvas-fg-1)"}}>{tax}.{name || "<name>"}</span>
          </div>
        </div>
        <div className="field">
          <div className="lab">Taxonomy</div>
          <select className="input" value={tax} onChange={(e) => setTax(e.target.value)} style={{appearance:"none"}}>
            {D.taxonomies.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="field">
          <div className="lab">Description</div>
          <input className="input" placeholder="Short, sentence-case description" value={desc} onChange={(e) => setDesc(e.target.value)}/>
        </div>
      </ModalBody>
      <ModalFoot hint="POST /classes">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!valid} onClick={() => { onCreate({name, tax, desc}); onClose(); }}>
          Create class
        </button>
      </ModalFoot>
    </Modal>
  );
}

Object.assign(window, { CommandPalette, NewClassModal });
