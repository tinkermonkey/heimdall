// Heimdall — primitive · FilterDropdown
// Eyebrow trigger + floating panel with checkbox/radio rows.
// Anatomy spec: preview/component-filter-dropdown.html

function FilterDropdown({ eyebrow, value, options, multi = true, onChange, sectionLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey  = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  const summary = (() => {
    if (multi) {
      const selected = Array.isArray(value) ? value : [];
      if (selected.length === 0) return "none";
      if (selected.length === options.length) return "all " + options.length;
      return selected.length + " of " + options.length;
    }
    const found = options.find((o) => (o.value ?? o) === value);
    return found ? (found.label ?? found.value ?? found) : "—";
  })();

  const toggle = (v) => {
    if (!onChange) return;
    if (multi) {
      const cur = Array.isArray(value) ? value : [];
      onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    } else {
      onChange(v); setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={"fd-trigger" + (open ? " open" : "")}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="fd-eyebrow">{eyebrow}</span>
        <span className="fd-value">{summary}</span>
        <span className="fd-chev"><Icon name={open ? "chevUp" : "chevDown"} size={11} /></span>
      </button>
      {open && (
        <div className="fd-panel" style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 30 }}>
          {sectionLabel && <div className="fd-section">{sectionLabel}</div>}
          {options.map((o) => {
            const v     = typeof o === "string" ? o : o.value;
            const label = typeof o === "string" ? o : o.label ?? o.value;
            const meta  = typeof o === "object" ? o.meta : undefined;
            const swatch = typeof o === "object" ? o.swatch : undefined;
            const on = multi
              ? Array.isArray(value) && value.includes(v)
              : value === v;
            return (
              <div className="fd-row" key={v} onClick={() => toggle(v)}>
                {multi ? (
                  <span className={"fd-checkbox" + (on ? " on" : "")}>
                    {on && <Icon name="check" size={10} />}
                  </span>
                ) : (
                  <span className={"fd-radio" + (on ? " on" : "")}></span>
                )}
                {swatch && <span style={{ width: 3, height: 14, background: swatch, borderRadius: 1 }} />}
                <span style={{ flex: 1 }}>{label}</span>
                {meta != null && <span className="fd-meta">{meta}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FilterDropdown });
