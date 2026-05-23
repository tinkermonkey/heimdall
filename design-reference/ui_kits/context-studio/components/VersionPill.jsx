// Heimdall — primitive · VersionPill
// Mono amber marker that sits next to an identifier. Never floats alone.
// Anatomy spec: preview/component-version-pill.html

function VersionPill({ children, deep = false, prefix = "v" }) {
  const text = typeof children === "number" ? `${prefix}${children}` : String(children);
  return (
    <span className={"version-pill" + (deep ? " deep" : "")}>{text}</span>
  );
}

Object.assign(window, { VersionPill });
