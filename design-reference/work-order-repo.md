# Work order — Heimdall repo (`tinkermonkey/heimdall`)

**Direction:** design-canonical — change CODE so it matches the refined design space.
Generated 2026-05-30 from `parity-manifest.json` (repo @ `6b256f0bce06`).
Snapshot paths under `sync/code-snapshot/` mirror the real `src/` paths to edit.

> **Keystone first.** Do `--focus-ring` + the cross-cutting hardcoded-ring swap before
> anything else — it lands the amber-500→400 refinement across ~15 components in one pass.
> That swap ALSO covers Sidebar, SplitPane, PipelineCard and ChatSuggestions (voted
> code-canonical on their other aspects, but their focus-ring literal still becomes the token).

## Tokens & base layer
- **--type-h1-* / --type-stat-* / --type-eyebrow-* / --type-mono-id-*** — Decide: promote the semantic type tokens into tokens.css (single source) OR accept that components encode them. Today a value lives in two places and can drift (see StatTile value size).
  ↳ code `(scattered in component .css)` · design `colors_and_type.css`
- **base <h1> element** — Decide the base heading contract. Either align base <h1> to the 24px page-H1 (design intent) or keep generic HTML scale and document that app headings MUST use <PageHeader>/explicit classes. Today a raw <h1> in a Heimdall app renders 48px.
  ↳ code `src/tokens/tokens.css` · design `colors_and_type.css`
- **base <body> font-size / line-height** — Same call as base <h1>: the design declares 14px IDE-density body default; code keeps 16px web default.
  ↳ code `src/tokens/tokens.css` · design `colors_and_type.css`
- **base <a> link color** — Change base <a> in tokens.css to use --accent-primary-deep on light canvas. Amber-400 text on #FFFFFF is ~1.6:1 — fails WCAG.
  ↳ code `src/tokens/tokens.css` · design `colors_and_type.css`
- **--shadow-toast** — Add --shadow-toast (0.50 alpha) to tokens.css and reference it from Toast.css (currently a lighter, untokenised 0.30).
  ↳ code `sync/code-snapshot/components/Toast.css` · design `colors_and_type.css`
- **--focus-ring** — Update --focus-ring in tokens.css to amber-400 alpha (251,191,36) so the ring matches --accent-primary. Currently the focus ring is the OLD amber-500 the accent moved away from.
  ↳ code `src/tokens/tokens.css` · design `colors_and_type.css`
- **Hardcoded focus rings (cross-cutting)** — Replace every hardcoded rgba(245,158,11,0.18) with var(--focus-ring). Then fixing the token (above) propagates the amber-400 refinement everywhere in one move. ~13 components currently bypass the token; ~6 (Modal, Drawer, InspectorPanel, ConfigTile, QuickAccessTile, HierarchyRow, WorkspaceSwitcher action-tile) already use it correctly.
  ↳ code `Button, NavItem, Sidebar, SegmentedControl, TabBar, Table, Topbar, Toast, ActivityTimeline, AlertStrip, FilterDropdown, PipelineCard, WorkspaceSwitcher(recent)` · design `colors_and_type.css`

## Components
- **Button** — Swap hardcoded ring → var(--focus-ring). (see focus-ring-hardcoded)
  ↳ code `sync/code-snapshot/components/Button.css` · design `preview/component-buttons.html`
- **TriState (checkbox)** — Reconcile checkbox treatment: the design’s filter checkboxes are 14×14 custom-drawn; the standalone TriState is an 18px native checkbox tinted via accent-color. Decide if they should converge.
  ↳ code `sync/code-snapshot/components/TriState.css` · design `preview/component-filter-dropdown.html`
- **SegmentedControl** — Swap hardcoded ring → var(--focus-ring).
  ↳ code `sync/code-snapshot/components/SegmentedControl.css` · design `preview/component-segmented-control.html`
- **Table** — Swap hardcoded inset ring → var(--focus-ring).
  ↳ code `sync/code-snapshot/components/Table.css` · design `preview/component-table-row.html`
- **NavItem** — Swap hardcoded ring → var(--focus-ring).
  ↳ code `sync/code-snapshot/components/NavItem.css` · design `preview/component-nav-item.html`
- **Topbar** — Swap hardcoded ring → var(--focus-ring).
  ↳ code `sync/code-snapshot/components/Topbar.css` · design `ui_kits/context-studio`
- **TabBar** — Swap hardcoded ring → var(--focus-ring).
  ↳ code `sync/code-snapshot/components/TabBar.css` · design `preview/component-tabs.html`
- **Statusbar** — BUG: fix the three pulse classes in Statusbar.css to use the real tokens (--status-cyan, --status-violet, --status-neutral). Today those pulses render with no fill colour.
  ↳ code `sync/code-snapshot/components/Statusbar.css` · design `preview/component-statusbar.html`
- **Modal** — Modal radius should be radius-xl (12px) per "modals 10–12px only". Also reference var(--shadow-modal) rather than the inline literal.
  ↳ code `sync/code-snapshot/components/Modal.css` · design `preview/component-modal.html`
- **WorkspaceSwitcherDialog** — One file, two focus-ring styles — unify on var(--focus-ring).
  ↳ code `sync/code-snapshot/components/WorkspaceSwitcherDialog.css` · design `preview/component-workspace-switcher.html`
- **FilterDropdown** — Swap hardcoded ring → var(--focus-ring).
  ↳ code `sync/code-snapshot/components/FilterDropdown.css` · design `preview/component-filter-dropdown.html`
- **Toast** — Snap radius to a scale step (6 or 8), reference --shadow-toast (0.50), swap ring → token.
  ↳ code `sync/code-snapshot/components/Toast.css` · design `preview/component-toast.html`
- **PageHeader** — Set .page-header__title weight to 700. 800 is reserved for the landing hero per the type rules.
  ↳ code `sync/code-snapshot/components/PageHeader.css` · design `ui_kits/context-studio`
- **ActivityTimeline** — Reconcile the kind tag style (code uses a solid neutral fill; design uses a bordered subtle chip) and swap the ring → token.
  ↳ code `sync/code-snapshot/components/ActivityTimeline.css` · design `preview/component-activity-item.html`
- **AlertStrip** — Swap hardcoded ring → var(--focus-ring).
  ↳ code `sync/code-snapshot/components/AlertStrip.css` · design `preview/component-toast.html`
- **ConfigTile** — Decide resting icon treatment — design wants amber tint at rest; code rests neutral.
  ↳ code `sync/code-snapshot/components/ConfigTile.css` · design `preview/component-config-tile.html`

## Charts
- **LineChart** — Decide the tooltip surface. Design uses a deliberate dark "shell popover" floating over the canvas (navy card, light text) in both tones; code made it canvas-toned (white on light). Geometry, axes, threshold "3 3", amber markers, 0.22 area — all identical.
  ↳ code `sync/code-snapshot/components/LineChart.tsx` · design `charts-spec/primitives.jsx`
- **BarH** — Reconcile default bar colouring: design paints all bars one hue (cyan) with a uniform `color` override; code cycles the series palette per row and dropped `color`. These render very differently. Code also adds `valueFormat` + `maxValue` (worth backporting to the design spec).
  ↳ code `sync/code-snapshot/components/BarH.tsx` · design `charts-spec/primitives.jsx`
- **StatusTimeline** — Two small colour choices differ: the idle segment fill (design border vs code inset) and the marker label colour (design amber-deep vs code muted fg-2). ok/warn/error/info colours match.
  ↳ code `sync/code-snapshot/components/StatusTimeline.tsx` · design `charts-spec/primitives.jsx`
- **BarChart (grouped multi-series)** — Two issues: (1) design has no grouped-bar spec — add one or confirm BarChart is canonical. (2) BarChart renders in a 100×100 unit viewBox with 3px fonts scaled up, unlike every sibling chart which works in real pixel space — this inconsistency makes its type/stroke read differently. Align it to the pixel-space convention.
  ↳ code `sync/code-snapshot/components/BarChart.tsx` · design `— (design has BarV + StackedBar only)`
- **PieChart** — Confirm whether a full PieChart belongs in the system (the design language favours the Donut ring). If kept, align it to the pixel-space rendering convention used by the other charts.
  ↳ code `sync/code-snapshot/components/PieChart.tsx` · design `— (design has Donut only)`

---

## Still undecided (no work-order line yet)
- **QuickAccessTile** — `rgba(var(--accent-primary), 0.10)` is invalid (space-separated channels in legacy rgba); the icon tint silently fails. This is a **code bug fix** → belongs here in the repo. Decide it in the dashboard.
- **Repo CLAUDE.md token docs** — prose still says accent `#f59e0b` + dark canvas `#14203A`; update to amber-400 / `#0B1426`. A repo docs edit.

## Deferred to next cycle
GraphCanvas · GraphNode · GraphEdge (graph node size 138×30 vs 220×36, edge variant taxonomy) ·
Component-count claim (28 → ~70) · Feedback.md supersession · embedded design-reference/ snapshot.
