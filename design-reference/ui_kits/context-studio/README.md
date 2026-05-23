# UI Kit · Context Studio

A high-fidelity recreation of **Heimdall · Context Studio** — a graph-native knowledge studio. Dark IDE chrome wraps a light canvas. Tabular layouts, mono identifiers, amber accent, no shadows except modal/toast.

## What's here

| File | Role |
| --- | --- |
| `index.html` | Entry — loads React + Babel + the scripts below. |
| `styles.css` | Token import + shell/canvas/component CSS. |
| `icons.jsx` | `<Icon name="…" size={…} />` + Lucide-style outline `ICONS` map. |
| `Shell.jsx` | `Titlebar`, `Sidebar`, `Topbar`, `Statusbar` + `NAV_TREE` data. |
| `Pages.jsx` | `DashboardPage`, `ClassesPage`, `PipelinesPage`, `SettingsPage`, `StubPage` + mock data `D`. |
| `Overlays.jsx` | `CommandPalette` (⌘K, grouped results) and `NewClassModal` (built on the `Modal` primitive). |
| `App.jsx` | Wires routes, palette, modal, toast. |
| `components/Tabs.jsx` | `<Tabs items active onChange>` — mono count chip + amber underline. |
| `components/SegmentedControl.jsx` | `<SegmentedControl options value onChange>` — 2–4 short options. |
| `components/FilterDropdown.jsx` | `<FilterDropdown eyebrow value options multi onChange>` — eyebrow trigger + checkbox/radio panel. |
| `components/VersionPill.jsx` | `<VersionPill>3</VersionPill>` — mono amber marker pinned to an identifier. |
| `components/KVGrid.jsx` | `<KVGrid rows>` (130px caps key → value) + `<KGNodePill domain variant>`. |
| `components/InspectorPanel.jsx` | `<InspectorPanel eyebrow title monoId actions>` + `<InspectorSection title count action>`. |
| `components/HierarchyTree.jsx` | `<HierarchyTree rows>` + `<HierarchyRow depth domain variant label count desc selected>`. |
| `components/ActivityItem.jsx` | `<ActivityItem kind tag headline subject meta when>` + `<ActivityList items>`. |
| `components/Tiles.jsx` | `<QuickAccessTile icon name description>` + `<ConfigTile icon name description summary action>`. |
| `components/StatTile.jsx` | `<StatTile label value color icon spark meta>` + standalone `<Sparkline points color>`. |
| `components/PipelineCard.jsx` | `<PipelineCard p>` with optional `p.foot` 5-col stats row (`<PipelineFoot>`). |
| `components/GraphCanvas.jsx` | `<GraphCanvas toolbar legend minimap>` + `<GraphNode x y label domain selected>`. |
| `components/Modal.jsx` | `<Modal onClose width>` + `<ModalHead title subtitle>` + `<ModalBody>` + `<ModalFoot hint>`. |
| `components/WorkspaceSwitcher.jsx` | `<WorkspaceSwitcher recent onPickAction onOpenRecent onClose>` — full dialog with action row + recent list. |

## Interactions

- **Click any sidebar item** — switches the canvas view. Routes wired: Dashboard, Schema/Classes, Pipelines/All, Configuration. Other nav items render a `StubPage` (intentional — this is a kit, not the full studio).
- **⌘K / Ctrl-K** — opens the **Command palette**. Type to filter; ↑/↓ to navigate; Enter to jump.
- **New class** (button on Classes page) — opens a modal with mono name validation, taxonomy select, and a live `tax.name` preview. Create dispatches a success toast.
- **Sidebar collapse** — chevron in the brand row toggles 256 ↔ 64px (icons-only). Nav sub-items hide when collapsed.
- **Hierarchy** — click a taxonomy to fold/unfold; click a class to select (amber outline). Live on the Dashboard.

## Components covered (and what's intentionally omitted)

**Covered.** Titlebar (macOS lights + workspace path button + ⌘K), Sidebar (nav tree with active 2px amber bar, hover-up-one-step, sub-nav, collapse, user row), Topbar (workspace chip + crumbs + palette button + bell/doc + env pill), Statusbar (pulse + mono indicators + 12×1 dividers), Stat grid (4-col with 2px colored left bar; sparkline + pulse-meta variants), Panel (border-only, head + body), Hierarchy tree + hierarchy-row (two-column with description, 3 depths, amber-tinted selected), Activity feed + activity-item (kind-tag + intent dot + mono meta), Quick access + config tiles (amber-tinted icon, kv-mini summary), Pipeline mini-card (flow strip + 5-col foot row: last run / ingested / created / updated / errors), Table (mono caps headers, dot swatches, row hover, chip in cell), Tabs (mono count chip + amber underline), Segmented control (2–4 options), FilterDropdown (eyebrow trigger + checkbox/radio panel), Inspector panel (head + KV grid + section panels), KV grid (130px mono caps key → 1fr value), Version pill (mono amber marker pinned to identifier), Inputs + Field (label, hint, mono identifier value, amber focus ring), Modal (head + body + mono-hint foot), Workspace switcher (3-tile action row + recent list), Graph canvas (dot-grid + toolbar + legend + minimap + selected amber node), Command palette (grouped RECENT/CLASS/GO/ACTION, amber left bar on active), Toast (3px semantic left bar, mono code, shadow-toast).

All new primitives live in `styles.css` under the *"NEW PRIMITIVES"* section. CSS class hooks: `.version-pill`, `.seg`, `.fd-trigger` + `.fd-panel` + `.fd-row` + `.fd-checkbox` + `.fd-radio`, `.kv-grid` (`.k`/`.v`), `.inspector` + `.inspector-head` + `.inspector-section`, `.kg-node-pill[data-domain]`, `.badge-tiny`, `.hier-row[data-depth]`, `.activity-row[data-kind]` + `.kind-tag`, `.qa-tile`, `.config-tile` + `.kv-mini`, `.stat.has-spark` + `.stat-spark`, `.pipe-foot`, `.graph-canvas` + `.graph-toolbar` + `.graph-legend` + `.graph-minimap` + `.graph-node.selected`, `.ws-switcher` + `.ws-actions` + `.ws-action` + `.ws-recent-row.open`, `.modal-foot-hint`.

**Omitted (see the upstream repo).** Graph view, drawer/right-pane inspectors, dark-canvas mode toggle in-app (palette is shell-tone so it always shows that surface), Homelab Dashboard, the `dashboard.jsx` charts (sparklines), Bot Console.

## Recreating, not redesigning

The kit copies the existing Heimdall design — it does **not** invent new patterns. Token values, layout dimensions, voice, casing, icon choices all come from the upstream repo (`src/tokens/tokens.css`, `design-reference/slate.md`, `design-reference/example-context-studio/`). When in doubt about a behaviour, defer to the repo.

## Local dev

Open `index.html` in a browser — no build step. Scripts load via `@babel/standalone` (in-browser Babel transformer). For production code, use the npm package `@tinkermonkey/heimdall-ui`.
