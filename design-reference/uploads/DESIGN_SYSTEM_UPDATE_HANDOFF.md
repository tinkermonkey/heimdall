# Design System Update — Heimdall · Context Studio Kit

**For:** Claude, working in the **Heimdall Design System** project (`claude-design` workspace)
**From:** Context Studio UX prototype (`Context Studio.html`)
**Goal:** Extend the in-project design system (the one that produces preview cards under `preview/` and the UI kit under `ui_kits/context-studio/`) so it includes the patterns the new prototype uses. After this update, future prototypes should be buildable from the kit alone with no extra primitives invented.

This is the companion to `HEIMDALL_HANDOFF.md` (for the production `@tinkermonkey/heimdall-ui` package). The two should stay in sync — anything added here should be implementable from this spec, and anything implemented in Heimdall should be reflected here.

---

## What to do, in order

1. Read the **Inventory** section below — it's the canonical list of preview cards + UI-kit components that should exist after this update.
2. For each gap marked **NEW**, add a preview card under `preview/<group>-<name>.html` following the conventions in `preview/_shared.css`.
3. For each gap marked **EXTEND**, modify the existing preview card and the corresponding section in `ui_kits/context-studio/styles.css`.
4. Update `ui_kits/context-studio/Pages.jsx`, `Shell.jsx`, and `Overlays.jsx` so the kit consumes the new primitives.
5. Re-register the new preview cards in the design-system manifest with `register_assets`, grouping each under one of: `Components`, `Type`, `Colors`, `Spacing`, `Brand`.
6. Update `SKILL.md` to mention the new primitives.

The values referenced below (sizes, colors, paddings) are **canonical** — they come from the working prototype and `tokens.css`. Do not modify tokens; reuse them via CSS variables.

---

## Inventory — what should exist after this update

A ✅ means the preview card already exists. A ⬜ NEW means it needs adding. **EXTEND** means an existing card needs reworking.

### Type · Colors · Spacing · Brand (no changes)

| Card                                      | Status        |
| ----------------------------------------- | ------------- |
| `type-display.html`, `type-body.html`, …  | ✅ keep        |
| `color-*.html`                            | ✅ keep        |
| `spacing-*.html`                          | ✅ keep        |
| `brand-mark.html`                         | ✅ keep        |

### Components

| Preview card                                  | Status        | Notes                                                  |
| --------------------------------------------- | ------------- | ------------------------------------------------------ |
| `component-buttons.html`                      | ✅ keep        |                                                        |
| `component-chips.html`                        | ✅ keep        |                                                        |
| `component-id-tag.html`                       | ✅ keep        |                                                        |
| `component-input-field.html`                  | ✅ keep        |                                                        |
| `component-nav-item.html`                     | ✅ keep        |                                                        |
| `component-panel.html`                        | ✅ keep        |                                                        |
| `component-pulse-dots.html`                   | ✅ keep        |                                                        |
| `component-table-row.html`                    | ✅ keep        |                                                        |
| `component-toast.html`                        | ✅ keep        |                                                        |
| `component-command-palette.html`              | ✅ EXTEND      | Add grouped-results section (Recent / Class / Action) |
| `component-pipeline-card.html`                | ✅ EXTEND      | Add the 5-column foot row (last run / ingested / …)  |
| `component-stat-tile.html`                    | ✅ EXTEND      | Add the sparkline variant + icon-prefixed label      |
| `component-tabs.html`                         | ⬜ NEW         | Mono count chips, amber underline on active           |
| `component-segmented-control.html`            | ⬜ NEW         | 2–4 short options                                     |
| `component-filter-dropdown.html`              | ⬜ NEW         | The graph-view dropdowns                              |
| `component-inspector-panel.html`              | ⬜ NEW         | Inline detail pane with KV grid                       |
| `component-kv-grid.html`                      | ⬜ NEW         | 130px mono caps keys → value rows                     |
| `component-version-pill.html`                 | ⬜ NEW         | Amber mono v3 pill                                    |
| `component-hierarchy-row.html`                | ⬜ NEW         | Two-column tree row with description                  |
| `component-activity-item.html`                | ⬜ NEW         | Intent dot + kind-tag + headline + mono meta          |
| `component-quick-access-tile.html`            | ⬜ NEW         | Icon + body + chev                                    |
| `component-config-tile.html`                  | ⬜ NEW         | Icon + body + kv-mini summary                         |
| `component-statusbar.html`                    | ⬜ NEW         | Grouped items + 12×1px dividers + pulse              |
| `component-workspace-switcher.html`           | ⬜ NEW         | 3-tile action row + recent list                       |
| `component-graph-canvas.html`                 | ⬜ NEW         | Dot-grid + toolbar + minimap + legend                 |
| `component-modal.html`                        | ⬜ NEW         | Generic content modal (palette is separate)           |

---

## New cards — anatomy specs

Each spec describes the structural anatomy and the token bindings. Render the preview against the dark canvas, matching the prototype.

### `component-tabs.html`  — NEW

```
General [6]   Pipelines [4]   Storage [3]   Members [3]
─────────                                                      ← 1px canvas-border baseline
█████████                                                      ← 2px accent-primary under active
```

- Tabs are 13px / 500 weight, color `--canvas-fg-3` resting, `--canvas-fg-1` active.
- 10px vertical padding, 18px gap between tabs.
- 1px bottom border on the whole bar (`--canvas-border`).
- Active tab has a 2px amber underline pinned to `bottom: -1px`.
- Count chip uses the mono `id-tag` style: 10.5px JetBrains Mono, 1px 6px, `--canvas-bg-2` fill, 3px radius, `--canvas-border` border.
- Hover: text only → `--canvas-fg-1`, no underline change.

**Token bindings.** `--accent-primary` (underline), `--canvas-fg-1` / `--canvas-fg-3`, `--canvas-border`, `--canvas-bg-2`.

---

### `component-segmented-control.html` — NEW

```
┌──────┬────────┬───────┐
│ Any  │ Single │ Multi │
└──────┴────────┴───────┘
```

- Outer pill: 2px padding, 1px `--canvas-border`, `--canvas-bg-2` fill, 6px radius.
- Inner buttons: 4px / 10px padding, 12px / 500 weight, transparent fill, `--canvas-fg-3` color.
- Active button: `--canvas-card` fill, 1px inset shadow of `--canvas-border-strong`, `--canvas-fg-1` color, 4px radius.
- Hover (inactive): `--canvas-fg-1` text only.

**Use cases.** Pipelines status filter, Individuals parent-count filter. Up to 4 options; longer than 4 → use `FilterDropdown`.

---

### `component-filter-dropdown.html` — NEW

Two cards in one preview:

**A. Trigger (closed).**

```
┌──────────────────────────────┐
│ DOMAIN   all 3        ⌃      │
└──────────────────────────────┘
```

- 7px / 12px padding, 6px radius.
- Background `--canvas-bg-2`, border `--canvas-border`.
- **Eyebrow** label: mono 10.5px, uppercase, 0.08em tracking, `--canvas-fg-3`.
- **Summary** value: 12.5px / 500, `--canvas-fg-1`.
- Chevron: 11px, `--canvas-fg-3` resting → `--accent-primary` when panel open.
- Open state border + amber focus ring (`--focus-ring`).

**B. Open with panel.**

```
┌──────────────────────────────┐
│ DOMAIN   all 3        ⌄      │
└──────────────────────────────┘
┌──────────────────────────────┐
│ DOMAINS                      │  ← mono section header
│ ☑  ▎life          11         │
│ ☑  ▎climate        7         │
│ ☑  ▎software       4         │
└──────────────────────────────┘
```

- Panel: floats 4px below trigger, anchored left.
- Min-width 220px, 4px padding, `--canvas-card` fill, 1px `--canvas-border-strong`, 6px radius, `--shadow-md`.
- **Section header** (optional): mono 9.5px, uppercase, 0.10em tracking, `--canvas-fg-3`, 8px / 10px padding.
- **Row.** 7px / 10px padding, 4px radius, `--canvas-fg-1` text.
  - Hover: `--canvas-surface` background.
- **Checkbox.** 14×14px square; off = `--canvas-bg` fill + `--canvas-border-strong` border; on = `--accent-primary` fill + check icon at 10px.
- **Radio.** Same outline; on = inner 8×8px amber dot.
- Trailing meta (e.g. `11`): mono 11px, `--canvas-fg-3`, `margin-left: auto`.

Render both states in the preview side-by-side.

---

### `component-inspector-panel.html` — NEW

A full panel; show with placeholder data.

```
┌───────────────────────────────────────┐
│ CLASS · LIFE                  [v9] ⋯  │
│ Gene                                   │
│ cls_gene                               │
├───────────────────────────────────────┤
│ DESCRIPTION  DNA sequence …           │
│ DOMAIN       ▎life                    │
│ SCHEME       ▎Genomics & Proteomics   │
│ PARENT       — root —                 │
├───────────────────────────────────────┤
│ Property definitions    [4]    [+Add] │
│ has_part   Has Part           used 7  │
│ encodes    Encodes            used 38 │
└───────────────────────────────────────┘
```

- Outer: `--canvas-card` fill, 1px `--canvas-border`, 8px radius.
- Head: 14px / 16px padding, 1px bottom border. Layout: `[main 1fr] [actions]`.
  - **Eyebrow.** Mono 10.5px, uppercase, 0.08em tracking, `--canvas-fg-3`.
  - **Title.** 15px / 600, `--canvas-fg-1`.
  - **Mono id.** 11.5px, `--canvas-fg-3`.
  - **Actions.** Version pill + icon buttons (edit, more).
- Body sections separated by 1px `--canvas-border` (no gap).
- Each section: 14px / 16px padding. Section title is 13px / 600 with optional count chip and right-aligned action button.

---

### `component-kv-grid.html` — NEW

```
DESCRIPTION  DNA sequence encoding a product
DOMAIN       ▎life
SCHEME       ▎Genomics & Proteomics  sch_genomics
PARENT       — root —
CHILDREN     ▎Variant
```

- 2-col grid: `130px 1fr` columns, 8px / 14px gap.
- 14px / 16px padding.
- **Key.** Mono 10.5px, uppercase, 0.08em tracking, `--canvas-fg-3`, padding-top 2px (so it aligns with the first line of value text).
- **Value.** 12.5px, `--canvas-fg-1`, flex column. Sub-rows stack vertically with 2px gap.

Render with at least one of: a KG-node pill, a multi-row stack of two values, a missing/empty placeholder (`<em class="muted">— none —</em>`).

---

### `component-version-pill.html` — NEW

Show variants inline:

```
[v1]   [v3]   [v12]   [0.99]
```

- 22×18px, inline-flex.
- Mono 10.5px / 600.
- 2px / 7px padding, 3px radius.
- `rgba(251,191,36,0.10)` fill, 1px `rgba(251,191,36,0.22)` border, `--accent-primary` color.
- Letter-spacing 0.02em (so `v12` reads as a unit).

Document the rule: **version pills sit next to identifiers**, never floating alone. Use for `version`, `confidence`, and other compact numeric markers that should *read* as a marker.

---

### `component-hierarchy-row.html` — NEW

Render the row at all three depths:

```
┌─[ 220px – 1fr ]──────────────────[ 2.2fr ]──────────────────┐
│ ┃ Life Sciences  [3 cls]    Biological and biomedical …    │   depth 0
│   ┊ ┃ Cellular Biology [6]   Cells, organelles, tissues   │   depth 1
│   ┊   ┊ ┃ Cell  [8 ind]      Basic structural and func…   │   depth 2
└──────────────────────────────────────────────────────────────┘
```

- Outer row: 2-col grid `minmax(220px, 1fr) 2.2fr`, 18px gap, 1px bottom border (`--canvas-border`).
- Left cell padding: `7px 0 7px 14px`. Each depth adds 20px to the left.
- Connector: 1px dashed `--canvas-border-strong`, anchored at depth-1 × 20px + 4px.
- **KG-node.** 1px border, 4px radius, 4px / 9px padding. Mono 12px, `--canvas-fg-1`.
  - Variants: `.taxonomy` (font-weight 600), `.scheme` (italic), `.class` (regular).
  - Swatch: 3px wide × 14px tall vertical bar, domain color, on the left.
- **Badge tiny.** After the label, a mono 10px count pill with 1px `--canvas-border`, `--canvas-bg-2` fill.
- Right cell (description): 12.5px, `--canvas-fg-3`, line-height 1.55, vertically centered.
- Selected state: amber 1px outline + amber inset 1px shadow.

---

### `component-activity-item.html` — NEW

```
●  CREATE   Created class — cls_variant            2m
            sch_genomics · life · by pipeline · pubmed

●  UPDATE   Updated relationship — rel_e811        8m
            BRCA1 → related_to → p53 · by maya@studio
```

- Grid: `16px 1fr auto`, 10px gap, 11px / 16px padding, 1px bottom border.
- **Dot.** 7px circle, padding-top 5px so it aligns with the first text line.
  - `create` → emerald, `update` → cyan, `run` → amber, `delete` → rose.
- **Headline.** 12.5px, line-height 1.5. Flex-wrap with 6px gaps between segments.
  - Prefix: `kind-tag` — mono 9.5px, uppercase, 0.10em tracking, 1px 5px, 3px radius, `--canvas-bg-2` + `--canvas-border`.
  - Verb-phrase bold (`<b>`). Subject mono.
- **Meta.** 11.5px, `--canvas-fg-3`, mono, margin-top 2px.
- **When.** Mono 10.5px, `--canvas-fg-3`, top-aligned, no-wrap.

---

### `component-quick-access-tile.html` — NEW

```
┌─────────────────────────────────────────┐
│ [▦]   Classes                       →   │
│       Define the structure of …         │
└─────────────────────────────────────────┘
```

- Outer: `--canvas-card`, 1px `--canvas-border`, 8px radius. 13px / 14px padding.
- Hover: `--canvas-surface` fill, `--canvas-border-strong` border, **chev → amber**.
- **Icon tile.** 36×36px, 6px radius, amber-tinted background (`rgba(251,191,36,0.10)`), 1px amber border (`rgba(251,191,36,0.20)`), amber icon at 16px.
- **Body.** Name 13px / 600 `--canvas-fg-1`; description 11.5px `--canvas-fg-3` line-height 1.45.
- **Chev.** 13px, `--canvas-fg-4` resting → `--accent-primary` on hover.

---

### `component-config-tile.html` — NEW

```
┌──────────────────────────────────────────────┐
│ [▮]   Backups                                │
│       Automatic snapshots are stored …       │
│       last 4h ago   retain 7d                │
└──────────────────────────────────────────────┘
```

- Outer: identical to `quick-access-tile` but 16px padding (slightly denser content).
- **Icon tile.** 40×40px (vs 36), otherwise identical.
- **KV-mini strip.** Below the description, flex row with 14px gap. Each item: mono 11px, `--canvas-fg-3`. The label is `<b>` weight-500, `--canvas-fg-1`.
- Right-edge optional `chev` or `Manage` button.

---

### `component-statusbar.html` — NEW

```
●graph daemon  :7474 ┃ ▦ 20 cls · 267 ind · 9 rel ┃ ●pubmed_genes · 38%       cpu 14% ┃ mem 423 MB ┃ ✓ synced 2m ago
```

- 26px tall, `--shell-bg-2` fill, 1px top border `--shell-border`.
- 16px horizontal padding. Two groups separated by `flex: 1; justify-content: space-between`.
- Each **item.** Inline-flex, 6px gap, 11.5px text.
  - Icon (optional): 11px, `--shell-fg-3`.
  - Label: 11.5px, `--shell-fg-3`.
  - Mono value: 11.5px, `--shell-fg-2`.
- **Divider.** 1×12px, `--shell-border-2`, 14px outer gap on each side.
- **Pulse.** 8px (or 6px sm) circle, default `--status-ok` background. Has a `::before` that animates `scale(0.6 → 1.8)` + opacity 0.55 → 0 over 1.6s. Variants: `.amber`, `.cyan`, `.rose`.

Render the full statusbar with both groups populated. Document the rule: **each group is at most 4 items**; overflow goes into a popover.

---

### `component-workspace-switcher.html` — NEW

```
┌────────────────────────────────────────────────────────────┐
│ Open workspace                                             │
│ A workspace is a local folder containing your schema, …   │
├────────────────────────────────────────────────────────────┤
│ [▣]                  [+]                 [⟜]              │
│ Open folder…        New workspace…       Clone from git…   │
│ Point Context Stu…  Initialize a fresh   Pull a workspac… │
├────────────────────────────────────────────────────────────┤
│ RECENT                                                     │
│ [▣] molgraph-research      [open]   20 cls   267 ind  now │
│ [▣] climate-policy-graph             14 cls 1208 ind 2d   │
│ [▣] platform-eng-kb                  31 cls  542 ind  1w  │
└────────────────────────────────────────────────────────────┘
```

- Outer dialog: 720px, `--shell-bg-2`, 1px `--shell-border-2`, 12px radius, `--shadow-modal`.
- Head: 18px / 20px padding, 1px bottom border.
- **Action row.** 3-col grid, 8px gap, 14px / 20px padding.
  - Each action: 14px padding, `--shell-surface` fill, 1px `--shell-border-2`, 6px radius. Icon (32px, 4px radius, amber-tinted), title (13px / 600), description (11px, `--shell-fg-3`, line-height 1.45).
  - Hover: `--shell-surface-2` + amber border.
- **Recent section header.** Mono 10px uppercase, 0.10em tracking, `--shell-fg-3`, 12px / 20px padding.
- **Recent row.** Grid `32px 1fr auto auto`, 14px gap, 11px / 12px padding.
  - Open row gets `rgba(251,191,36,0.05)` background; mark icon amber-tinted; `open` badge (mono 10px, amber chip).
  - Stats: mono 10.5px, `--shell-fg-3`.

This component composes on top of `Modal` chrome but with a richer body.

---

### `component-graph-canvas.html` — NEW

The graph view canvas + UI overlay.

```
┌──────────────────────────────────────────────────────┐
│ [▦] [+] [-] [⊡]                       LIFE  CLIMATE  │
│ ┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊┊  │
│ ┊  ┃ Cell                                            │
│ ┊                                                    │
│ ┊                                          ┌──────┐ │
│ ┊                                          │ life │ │
│ ┊                                          │climate││
│ ┊                                          │softwr ││
│ ┊                                          └──────┘ │
│                                            ┌──────┐ │
│                                            │ mini │ │
│                                            └──────┘ │
└──────────────────────────────────────────────────────┘
```

- Background: `--canvas-card` with a 40×40px dot grid (1px `--canvas-border`, 30% opacity) + a radial amber tint at top-left (5% opacity).
- **Toolbar.** Top-left, 4px padding, `rgba(11,20,38,0.65)` fill, 1px `--canvas-border`, 6px radius, backdrop blur 6px. 26×26px buttons.
  - Active button: amber-tinted background + amber color.
- **Legend.** Top-right, mono 10.5px swatches.
- **Minimap.** Bottom-right, 180×110px, `rgba(11,20,38,0.75)` fill, backdrop blur.
- **Node.** 220×36px, 6px radius, 3px domain-colored swatch on the left. Mono 12px / 500 title.
  - Selected: amber outline + amber-tinted background + amber title.
- **Edge.** 1.2px stroke `#475569`, 70% opacity. `manual` = solid; `inferred` = `stroke-dasharray="3 3"`. Arrowhead marker at end.

---

### `component-modal.html` — NEW

A generic content modal (the command palette has its own card).

```
┌─────────────────────────────────────────────┐
│ New class                                   │   modal-head: title + subtitle
│ Classes belong to a concept scheme and …    │
├─────────────────────────────────────────────┤
│ IDENTIFIER  snake_case · required           │   modal-body: stack of Fields
│ ┌─────────────────────────────────────────┐ │
│ │ cls_neuron_motor                        │ │
│ └─────────────────────────────────────────┘ │
│ Must match /^cls_[a-z][a-z0-9_]*$/          │
├─────────────────────────────────────────────┤
│ POST /classes      [Cancel]  [Create class] │   modal-foot: mono hint + actions
└─────────────────────────────────────────────┘
```

- Outer: 560px, `--canvas-card`, 1px `--canvas-border`, 12px radius, `--shadow-modal`.
- Head: 18px / 20px padding, 1px bottom border. Title 16px / 600 / -0.015em. Subtitle 12.5px `--canvas-fg-3`.
- Body: 16px / 20px padding, vertical flex with 14px gap.
- Foot: 12px / 20px padding, 1px top border, `--canvas-bg-2` fill. Layout: `[hint flex-1] [actions]`.
  - **Hint.** Mono 11px, `--canvas-fg-3` — typically the API verb + endpoint (e.g. `POST /classes`).

---

## Extensions to existing cards

### `component-command-palette.html` — EXTEND

Add a section showing **grouped results**:

```
RECENT
[Recent] [▦] BRCA1 — individual          opened 4m ago   →
[Recent] [▣] pubmed_genes — pipeline     opened 12m ago  →

CLASS
[Class]  [▦] Gene                        cls_gene        →
[Class]  [▦] Protein                     cls_protein     →

JUMP TO
[Go]     [▦] Dashboard                                   →
[Go]     [▣] Classes                     Schema          →

ACTION
[Action] [▣] New pipeline run…           Pipelines       →
[Action] [▦] Reindex workspace           System          →
```

- Each group has a mono uppercase section header (`palette-section` style — already in tokens).
- Kind tag colors:
  - `RECENT` → `--accent-primary` (amber)
  - `CLASS`, `INDIVIDUAL`, `PIPELINE` → `--status-cyan`
  - `GO` → `--status-cyan`
  - `ACTION` → `--status-emerald`
- Active row gets the 2px amber left bar (already specced).

### `component-pipeline-card.html` — EXTEND

Add the **5-column foot row** below the flow strip:

```
┌─────────────────────────────────────────────────────────────┐
│ LAST RUN  │ INGESTED │ CREATED │ UPDATED │ ERRORS          │
│ now       │ 412      │ +38     │ ~17     │ 0               │
└─────────────────────────────────────────────────────────────┘
```

- 5-column grid, 12px / 16px padding, 1px top border, `--canvas-bg-2` fill.
- Each cell: column with `l` (mono 9.5px uppercase, `--canvas-fg-3`) and `v` (mono 13px / 600 `--canvas-fg-1`, tabular-nums).
- Vertical 1px `--canvas-border` divider between cells (not on the last).
- The `errors` cell switches to `--status-rose` if non-zero; `created` is `--status-emerald` when shown with a `+` prefix.

### `component-stat-tile.html` — EXTEND

Add:

1. **Sparkline variant.** Show a stat tile with a 12-point sparkline anchored bottom-right (88×28px, parent's accent color, 20% area opacity + 1.5px stroke).
2. **Icon-prefixed label.** Mono caps label with an 11px icon before it (`--canvas-fg-3`).
3. **Pulse meta row.** The "1 running" pattern: `<pulse sm amber> 1 running · 2 failed`.

---

## Token additions

No new tokens. **Reuse existing variables** for everything above. If you find yourself reaching for a hex, look in `tokens.css` first.

**One small allowance:** the FilterDropdown panel and the graph overlays use `backdrop-filter: blur(6px)`. This is already in use in the command palette backdrop and the graph toolbar — no new token needed, but worth surfacing in `spacing-shadows.html` as a documented technique.

---

## After the cards exist — update the UI kit

`ui_kits/context-studio/` is the **canonical realization** of the design system. After adding the previews, refactor the kit so that:

1. Each new primitive lives in a dedicated component (`Tabs.jsx`, `SegmentedControl.jsx`, `FilterDropdown.jsx`, `InspectorPanel.jsx`, `HierarchyTree.jsx`, etc.).
2. `Pages.jsx` consumes the new primitives instead of inlining their CSS.
3. `Overlays.jsx` exports `Modal`, `WorkspaceSwitcher`, and the extended `CommandPalette`.
4. The kit's `README.md` lists every primitive with its file location.

This refactor is what makes future Context-Studio prototypes drop-in compositions — no more reimplementing checkbox dropdowns or KV grids from scratch.

---

## Final checklist for the design-system update

- [ ] Add the 14 new preview cards listed in the Inventory table.
- [ ] Update 3 existing preview cards (command palette, pipeline card, stat tile).
- [ ] Refactor `ui_kits/context-studio/` to consume the new primitives as named modules.
- [ ] Update `ui_kits/context-studio/README.md` to list all primitives.
- [ ] Re-register the cards in the project manifest (`register_assets`, group: `Components`).
- [ ] Update `SKILL.md` so consumers know the new primitives exist.
- [ ] Visual QA: open each preview card against the dark canvas and confirm no inline hex values, no new tokens, all primitives compose cleanly.

When this is done, the design system + UI kit cover 100% of what `Context Studio.html` uses. Future prototypes — for Context Studio or any other Heimdall app — should be assemblable from these primitives.

---

## Reference

- Prototype: `Context Studio.html` (the working reference)
- Active styles: `styles/app.css` (mirrors the design system; do not duplicate)
- Tokens: `styles/tokens.css` (canonical, do not edit)
- Production target: `tinkermonkey/heimdall` repo. See `HEIMDALL_HANDOFF.md` for the production component story.
