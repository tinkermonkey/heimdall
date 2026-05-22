# Heimdall — Component Gap Handoff

**For:** Heimdall implementation team
**From:** Context Studio UX prototype (`Context Studio.html`)
**Goal:** Close the component gaps between the Context Studio prototype and the `@tinkermonkey/heimdall-ui` package so the production app can be rebuilt from real components.

This is the **gap list** — what the prototype uses that the package doesn't yet ship (or ships in a different shape). It is paired with `DESIGN_SYSTEM_UPDATE_HANDOFF.md` (for the Claude-design project that hosts the visual system).

---

## How to read this document

Each gap names the prototype's source location, the Heimdall component (if any) that's adjacent, the proposed name + API, and the production behaviour the studio depends on.

The prototype's visual reference is hardcoded JSX + CSS. Production must reach **API parity** with the prototype's behaviour, not its file layout.

---

## 1. New primitives to add

These have no equivalent in `@tinkermonkey/heimdall-ui` today.

### 1.1 `FilterDropdown` — labeled dropdown with checkbox / radio panel

The graph-view filter bar (Domain / Show / Layout) uses this. It is **not** the same as `Select` (native single-value) or `FilterBar` (search + chip removal).

**Prototype source.** `components/page-rest.jsx` → `CheckboxDropdown` and `.dd-*` rules in `styles/app.css`.

**Anatomy.**

```
┌──────────────────────────────┐
│ DOMAIN   all 3        ⌃      │   ← trigger
└──────────────────────────────┘
┌──────────────────────────────┐
│ DOMAINS                      │   ← optional section header
│ ☑  ▎life          11         │   ← checkbox + KG-node pill + count
│ ☑  ▎climate        7         │
│ ☑  ▎software       4         │
└──────────────────────────────┘
```

- **Trigger.** Pill-shaped button. Left: mono uppercase eyebrow label (`DOMAIN`). Middle: human-readable summary of selection (`all 3`, `2 of 4`, `force-directed`). Right: chev down (chev up when open). Opens an amber focus ring while open.
- **Panel.** 4–8px below trigger, anchored left. Min-width 220px. Floats above content with shadow-md and 1px border. Each row is selectable; clicking a checkbox/radio toggles it; clicking outside closes the panel.
- **Sections.** Optional mono section headers inside the panel (e.g. `NODES`, `EDGES`) — same style as the palette section headers.
- **Single-select.** Same chrome with `.dd-radio` instead of `.dd-check` — radio dots animate to amber when selected.

**Proposed API.**

```ts
<FilterDropdown
  label="Domain"
  summary="all 3"
>
  <FilterDropdown.Section>Domains</FilterDropdown.Section>
  <FilterDropdown.Checkbox checked onChange={…}>
    <span className="kg-node sm" data-domain="life">…life</span>
    <span slot="meta">11</span>
  </FilterDropdown.Checkbox>
  …
</FilterDropdown>
```

A `FilterDropdown.Radio` slot exists for single-select. The trigger and panel chrome are identical between modes.

**Behaviour.**

- Click trigger → toggle open.
- Click outside the panel → close.
- ESC → close, focus returns to trigger.
- Tab inside the panel cycles through rows; Enter activates; ↑/↓ moves selection.
- The trigger keeps showing the panel's current value as the user toggles; **no apply button**. The panel autonomously commits each toggle.
- A11y: `aria-haspopup="listbox"`, `aria-expanded`, panel as `role="listbox"` for checkbox mode, `role="radiogroup"` for radio mode.

**Where it's used in the studio.**

- Graph view → Domain, Show, Layout
- (Recommended) Pipelines page → currently uses a `.seg` segmented control; either is acceptable
- (Recommended) Schema / Individuals filter bars — replace the bare `<select>` we ship today

---

### 1.2 `SegmentedControl` — 2–4 short option pill group

Used as a compact toggle between mutually-exclusive views.

**Prototype source.** `.seg` / `.seg-btn` in `styles/app.css`. Used on Pipelines status filter and Individuals parent-count filter.

**Anatomy.** A pill with 2–4 inline buttons. Active button has a slightly elevated background and 1px border; inactive is bare. Text-only labels, ~12px.

**Proposed API.**

```ts
<SegmentedControl
  value="any"
  onChange={setValue}
  options={[
    { value: 'any', label: 'Any parents' },
    { value: 'one', label: 'Single' },
    { value: 'many', label: 'Multi' },
  ]}
/>
```

**When to use vs. FilterDropdown.** Segmented = ≤4 short options that fit on one line. Otherwise FilterDropdown.

---

### 1.3 `Sparkline` — 12–24 point trend

A tiny line/area chart used inside `StatTile`.

**Prototype source.** `Sparkline` in `components/overlays.jsx`. ~88×28 px.

**Anatomy.** Inline SVG. A filled area at 20% opacity beneath a 1.5px stroke. Color follows the parent tile's accent color. No axes, no labels — purely indicative.

**Proposed API.**

```ts
<Sparkline data={[…]} color="#FBBF24" width={88} height={28} />
```

**Integration with StatTile.** Extend `StatTileProps` with an optional `sparkData?: number[]`. When present, render the sparkline in the bottom-right of the tile; the existing `meta` row sits below the value as today.

---

### 1.4 `InspectorPanel` + `KVGrid` — inline detail pane

Heimdall's `Drawer` opens as an overlay. The studio's pattern is a **persistent, inline right-pane** alongside a master list — never an overlay. This needs a distinct component.

**Prototype source.** `.drawer`, `.drawer-head`, `.drawer-body`, `.kv` in `styles/app.css`. Used in Schema/Classes, Data/Individuals, Graph view.

**Anatomy.**

```
┌───────────────────────────────────────┐
│ CLASS · LIFE                  [v9] ⋯  │   drawer-head: eyebrow + actions
│ Gene                                   │   title
│ cls_gene                               │   mono id
├───────────────────────────────────────┤
│ DESCRIPTION  DNA sequence encoding…   │   ┐
│ DOMAIN       ▎life                    │   │ KVGrid: 130px keys
│ SCHEME       ▎Genomics & Proteomics   │   │ (mono uppercase) →
│ PARENT       — root —                 │   │ value column
│ CHILDREN     ▎Variant                 │   ┘
├───────────────────────────────────────┤
│ Property definitions          [+ Add] │   nested section header
│ has_part   Has Part         used 7    │
│ encodes    Encodes          used 38   │
├───────────────────────────────────────┤
│ Sample individuals  47 total          │
│ …                                     │
└───────────────────────────────────────┘
```

**Proposed API.**

```ts
<InspectorPanel
  eyebrow="class · life"
  title="Gene"
  id="cls_gene"
  version={9}
  actions={<>…</>}
>
  <KVGrid
    rows={[
      { key: 'description', value: 'DNA sequence encoding…' },
      { key: 'domain', value: <KGNode domain="life">life</KGNode> },
      …
    ]}
  />
  <InspectorPanel.Section title="Property definitions" count={4} actions={<Button size="xs">Add</Button>}>
    <Table compact …/>
  </InspectorPanel.Section>
  …
</InspectorPanel>
```

**Behaviour.**

- Always rendered, never overlaid (use `Drawer` for overlay flows).
- Inherits the canvas surface.
- Scrolls independently of the master list.
- Sections divided by 1px borders, no gap.
- The KVGrid key column is **130px fixed**, mono caps, 10.5px, 0.08em tracking, `--canvas-fg-3`.

---

### 1.5 `VersionPill` — mono amber version marker

The small `v3` chip that appears next to identifiers all over the studio.

**Prototype source.** `.version-pill` in `styles/app.css`.

**Anatomy.** ~22×18px. Mono 10.5px / 600 weight. Tinted amber background (`rgba(251,191,36,0.10)`), 1px amber border at 22% alpha, amber-400 fill.

**Proposed API.**

```ts
<VersionPill>v{version}</VersionPill>
```

This *could* be a `Chip` variant, but it appears so frequently and so adjacent to identifiers that a dedicated primitive simplifies usage in tables, drawers, and list rows.

---

### 1.6 `PipelineCard` — already specced in the design system, not yet packaged

The dense pipeline card with status + flow strip + foot stats has a preview card (`preview/component-pipeline-card.html`) but no exported component from `@tinkermonkey/heimdall-ui`.

**Prototype source.** `components/pipeline-card.jsx` + `.pipeline-card-*`, `.flow-node`, `.flow-arrow` in `styles/app.css`.

**Anatomy.** See the prototype. Three regions:

1. **Head.** Name (mono) + identifier (mono muted) + description; status chip + target chip + tags; Run / Cancel button + kebab.
2. **Flow strip.** `source → extract → resolve → write` colored nodes (cyan/violet/amber/emerald) connected by 26px right-angle arrow lines. Each node is a small card with a 22px icon tile + name + sub.
3. **Foot.** 5-column grid: `last run`, `ingested`, `created`, `updated`, `errors`. Mono caps labels + mono 13px tabular values. The errors column highlights rose if non-zero.

**Proposed API.**

```ts
<PipelineCard
  pipeline={{
    id: 'pl_pubmed_genes',
    name: 'pubmed_genes',
    description: '…',
    status: 'running' | 'success' | 'idle' | 'failed',
    target: 'Schema' | 'Data' | 'Schema + Data',
    flow: [{ kind: 'source', name: 'PubMed', sub: 'pubmed_e_utils', icon: 'reference' }, …],
    recent: { ingested, created, updated, errors },
    tags: ['scheduled', 'weekly'],
    lastRun: 'now',
  }}
  onRun={() => …}
  onCancel={() => …}
  compact={false}
/>
```

**Why this matters.** The Context Studio app dropped the flow strip during integration — it now shows pipelines as bare list rows. Reintroducing the flow strip is the single highest-impact change to restore the original visual richness.

---

### 1.7 `HierarchyRow` (also: `KGRow`) — two-column tree row with description

The dashboard's Knowledge Graph Structure panel. Indents reflect tree depth; the right column carries the description so the user can read the tree as a glossary.

**Prototype source.** `components/hierarchy.jsx` + `.kg-row`, `.kg-cell-l`, `.kg-node`, `.kg-desc` in `styles/app.css`.

**Anatomy.**

```
┌─[ 220px – 1fr ]──────────────────[ 2.2fr ]──────────────────┐
│ ┃ Life Sciences  [3 cls]    Biological and biomedical …    │   depth 0 (taxonomy)
│   └─┃ Cellular Biology [6]   Cells, organelles, tissues   │   depth 1 (scheme)
│       └─┃ Cell  [8 ind]      Basic structural and func…   │   depth 2 (class)
│           └─┃ Nucleus [5]    Membrane-bound organelle …   │   depth 3 (class)
└──────────────────────────────────────────────────────────────┘
```

- Each row is a 2-col grid. Depth bumps the left padding by 20px and adds a dashed connector.
- The left column is a `kg-node` pill — outlined by a 3px swatch coloring the domain.
- The right column is the entity's `description` in 12.5px muted.
- Selected rows get an amber outline ring.

**Proposed API.**

```ts
<HierarchyTree>
  {rows.map((r) => (
    <HierarchyRow
      key={r.id}
      depth={r.depth}
      domain={r.domain}
      kind="taxonomy" | "scheme" | "class"
      label={r.title}
      meta={`${r.classes} cls`}        // optional badge after the label
      description={r.description}
      selected={selectedId === r.id}
      onSelect={…}
    />
  ))}
</HierarchyTree>
```

---

### 1.8 `QuickAccessTile`

A flat link-card used on the dashboard. Icon + title + description + chev. Pure presentation; nothing dynamic.

**Prototype source.** `.qa`, `.qa-icon`, `.qa-body` in `styles/app.css`.

**Proposed API.**

```ts
<QuickAccessTile
  icon="schema"
  title="Classes"
  description="Define the structure of your knowledge"
  onClick={() => …}
/>
```

---

### 1.9 `ConfigTile`

Used on the Configuration page. Icon + title + description + inline kv summary + optional action.

**Prototype source.** `.config-tile`, `.kv-mini` in `styles/app.css`.

**Anatomy.** Same outline as `QuickAccessTile` but with a `kv-mini` strip below the description (mono 11px, `b` for labels).

**Proposed API.**

```ts
<ConfigTile
  icon="shield"
  title="Backups"
  description="Automatic snapshots are stored alongside the workspace."
  summary={[
    { label: 'last', value: '4h ago' },
    { label: 'retain', value: '7d' },
  ]}
  onClick={() => …}
/>
```

---

### 1.10 `WorkspaceSwitcherDialog`

Composite. Three action tiles (Open / New / Clone) + Recent list. Uses `Modal` chrome but a different body anatomy than a generic dialog.

**Prototype source.** `components/overlays.jsx` → `WorkspaceSwitcher`. CSS at `.ws-dialog-*`, `.ws-row`, `.ws-action`.

This should ship as a self-contained component, since every workspace-mode app in the Heimdall family will use it.

**Proposed API.**

```ts
<WorkspaceSwitcherDialog
  isOpen={…}
  onClose={…}
  current={workspace}
  recent={recentWorkspaces}
  onOpenFolder={…}
  onNewWorkspace={…}
  onCloneFromGit={…}
  onPickRecent={(workspace) => …}
/>
```

---

## 2. Extensions to existing components

### 2.1 `StatTile` — sparkline + icon slot

Today's `StatTile` accepts `label`, `value`, `delta?`, `color?`. Extend with:

| Prop          | Type                | Notes                                                        |
| ------------- | ------------------- | ------------------------------------------------------------ |
| `icon`        | `IconName`          | Optional inline icon next to the mono label                  |
| `sparkData`   | `number[]`          | 12–24 points; renders a `Sparkline` in the bottom-right     |
| `meta`        | `ReactNode`         | Free-form meta line; replaces `delta` for non-numeric metas |
| `metaIcon`    | `'pulse-amber'` etc | Convenience for the common "1 running" row                  |

The existing `delta` prop should remain, but the `meta` slot is what the dashboard uses for compound metas like `<delta-up>▲ 4</delta-up> this week`.

### 2.2 `TabBar` — visually consistent with `tab-bar__tab--active`

Already shipped; matches the prototype. **No code change.** But the design system preview should add the `count` chip example (the prototype uses `<Chip form="id-tag">`).

### 2.3 `FilterBar` — add a `slot` for FilterDropdowns

`FilterBar` currently exposes `searchPlaceholder` + chip removal. Extend to support inline children so consumers can mix a search input, FilterDropdowns, and a segmented control on the same row:

```tsx
<FilterBar searchPlaceholder="…" onSearchChange={…}>
  <FilterDropdown label="Domain" …/>
  <SegmentedControl …/>
</FilterBar>
```

`FilterBar` then becomes a layout primitive that handles wrapping behaviour and the "showing N of M" caption on the right.

### 2.4 `Drawer` — clarify naming vs. `InspectorPanel`

To avoid future confusion, propose:

- `Drawer` stays as the **overlay** drawer (slides over content, backdrop, focus trap).
- `InspectorPanel` is the new **inline** detail pane (no overlay, no backdrop).

Both can share visual chrome (head, body, kv grid) via composition.

### 2.5 `ActivityTimeline` — add the `kind-tag` chip and intent dots

The prototype's activity feed prefixes each row with an uppercase mono `kind-tag` (CREATE / UPDATE / RUN / DELETE) and a 7px intent dot. `ActivityTimeline` should support:

```tsx
<ActivityTimeline
  items={[
    { kind: 'CREATE', dotColor: 'emerald',
      headline: <>Created class — <Mono>cls_variant</Mono></>,
      meta: 'sch_genomics · life',
      when: '2m',
    },
    …
  ]}
/>
```

The current shape is closer to a chat timeline; align it with the studio's IDE-density feed.

### 2.6 `Statusbar` — accept structured groups

The prototype's statusbar shows two groups separated by 12×1px dividers. Each item is a tuple of: icon (optional) + label + mono value. Extend `Statusbar` with:

```tsx
<Statusbar
  left={[
    { kind: 'pulse', tone: 'ok', label: 'graph daemon', mono: ':7474' },
    { divider: true },
    { icon: 'schema', mono: '20 cls · 267 ind · 9 rel' },
    …
  ]}
  right={[…]}
/>
```

This avoids consumers re-implementing the divider layout each time.

---

## 3. Visual reconciliation (no API change)

These items match the design system in intent but the prototype uses slightly different values. Bring the production CSS in line with the prototype.

| Item                          | Prototype                                                                   | Today's Heimdall                  |
| ----------------------------- | --------------------------------------------------------------------------- | --------------------------------- |
| Sidebar active rail           | 2px amber bar, 5px inset top/bottom                                          | Match                             |
| Pipeline card foot            | 5-column grid with vertical dividers                                        | Less dense — extend to match      |
| Hierarchy row description     | 2-column grid (pill on left, description on right)                          | Vertical stack                    |
| Activity item                 | `kind-tag` chip + 7px intent dot + 4-color domain mapping                   | Generic timeline                  |
| Stat tile delta               | `▲ 4` with mono tabular-nums, 12px emerald/rose                              | Plain text                        |
| Topbar palette button         | `flex: 1`, fills the middle of the topbar                                   | Variable width                    |
| Modal hint footer             | `.modal-foot-hint` mono line — "POST /classes" etc.                          | Not exposed                       |

---

## 4. Production migration order

Recommend tackling in this order — earlier items unblock later screens.

1. **`Sparkline` + StatTile extension.** Touches dashboard immediately, small surface.
2. **`PipelineCard`** with flow strip. Closes the biggest visual regression from the original prototype.
3. **`InspectorPanel` + `KVGrid`.** Unblocks Schema/Classes, Data/Individuals, Graph view.
4. **`HierarchyTree` + `HierarchyRow`.** Dashboard hero.
5. **`FilterDropdown` + `SegmentedControl`.** Used by 4+ screens.
6. **`QuickAccessTile`, `ConfigTile`, `VersionPill`.** Small primitives, finish-strong items.
7. **`WorkspaceSwitcherDialog`.** First-run flow.
8. **`ActivityTimeline`, `Statusbar`** extensions. Refinement.

---

## 5. Reference

- Prototype: `Context Studio.html` (this project)
- Styles: `styles/app.css` (see commented section headers)
- Tokens: `styles/tokens.css` — already canonical, do not duplicate
- Original design notes: `tinkermonkey/context-studio` → `ux/design/handoff/README.md` + `UX.md`
