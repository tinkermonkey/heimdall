// Heimdall — primitive · SegmentedControl
// 2–4 short options. Outer pill + inner buttons. Active = white card + 1px inset border.
// Anatomy spec: preview/component-segmented-control.html

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const isActive = value === v;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={isActive}
            className={isActive ? "active" : ""}
            onClick={() => onChange && onChange(v)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { SegmentedControl });
