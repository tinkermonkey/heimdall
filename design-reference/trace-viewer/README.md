# OTel Trace Viewer — design prototype

A hi-fi, interactive design reference for Heimdall's OpenTelemetry **trace viewer**:
a three-column waterfall for visualizing distributed traces of arbitrary span depth.
Drawn in the Heimdall design language (shell + canvas surfaces, amber accent, mono
identifiers). This is a **design reference / working prototype**, not production source —
treat it the way the rest of `design-reference/` is treated: lift the structure, states,
and tokens; rebuild against the real component library.

## Placement

This folder is a drop-in under the repo's existing design reference:

```
design-reference/
  colors_and_type.css        ← already in repo; this prototype references it via ../
  trace-viewer/              ← THIS folder
    OTel Trace Viewer.html   ← entry — open directly in a browser, no build step
    app.jsx                  ← shell + layout + selection/expand state + light/dark
    lane.jsx                 ← the waterfall: time axis, span bars, parent→child bus
    detail.jsx               ← fly-out right panel (minimap, identity, timing, attrs, status)
    lib.jsx                  ← small shared presentational helpers (pills, KV grid, bars)
    icons.jsx                ← icon set used by this prototype
    data.js                  ← sample trace (homelab request, ~28 spans, 6 levels deep)
    README.md
```

Open `OTel Trace Viewer.html` directly — React + Babel load from CDN and JSX is
transpiled in-browser, same convention as the other `design-reference/` prototypes.

## What it demonstrates

- **Left — span tree.** Hierarchy ordered top→bottom, each node expand/collapse to
  show/hide its subtree. Service pill, span name snippet, self-vs-total duration.
- **Center — waterfall.** Every span is a horizontal bar placed by start-offset and
  sized by duration on one shared time axis, aligned row-for-row with the tree. A
  parent→child connector bus makes the call hierarchy legible at a glance. Bars are
  **colored by service**; errored spans carry a **rose marker/overlay**.
- **Right — fly-out detail panel.** Appears only when a span is selected and can be
  closed. It is a *fly-out that reflows the layout* — it never overlays the chart.
  Contents: a **minimap** of where the span sits in the whole trace, **identity**
  (name, span_id, parent_id, trace_id, service, kind), **timing breakdown** (start
  offset, duration, self-time, % of trace), an **attributes/tags KV grid**, and a
  **status/error block**.
- **Header summary strip** — total duration, span/service/error counts, root service,
  and a per-service time mini-bar.
- **Light + dark canvas**, toggleable in the topbar (persisted to `localStorage`).

### Working interactions
- Expand / collapse any tree node (show/hide child spans).
- Click a span — in the tree row **or** its waterfall bar — to open/repopulate the panel.
- Close the detail panel.

## ⚠️ Required token addition (read before porting)

This prototype uses 6 alpha/overlay tokens that are **not yet defined** in
`design-reference/colors_and_type.css`. They are shimmed at the top of
`OTel Trace Viewer.html` (`:root { … }`) so the file renders standalone. During
implementation, **fold these into `colors_and_type.css`** (they belong to the
alpha/overlay families that flow code → design in the parity loop) and delete the
shim block:

```css
--accent-primary-bg-alpha-xs:  rgba(251, 191, 36, 0.05);
--accent-primary-bg-alpha-sm:  rgba(251, 191, 36, 0.10);
--status-amber-bg-alpha:       rgba(245, 158, 11, 0.08);
--status-rose-bg-alpha:        rgba(244, 63, 94, 0.08);
--semantic-env-bg-alpha:       rgba(245, 158, 11, 0.12);
--semantic-env-border-alpha:   rgba(245, 158, 11, 0.28);
```

Every other color comes from the existing token sheet.

## Notes for production

- **Keep:** the three-column split, the tree↔waterfall row alignment, service-coloring +
  rose error marker, the fly-out (reflow, not overlay) panel anatomy, the time-axis math.
- **Change:** replace the inline `data.js` mock with real OTLP spans (map
  `span_id`/`parent_span_id`/`start_time_unix_nano`/`end_time_unix_nano`/`attributes`/
  `status`/`kind`); lift the inline prototype styles into a sibling `.css` keyed to BEM
  classes with real tokens; replace the in-component state with props/store; add
  virtualization for the row list (traces can run to thousands of spans); add
  keyboard/a11y (roving tabindex on the tree, focus management when the panel opens).
- Span color is keyed off a service→domain-color map — wire that to the real service
  registry rather than the hardcoded list in `data.js`.
