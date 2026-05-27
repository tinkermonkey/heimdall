# Heimdall Design System — Component Feedback

**From:** Context Studio design team
**Context:** Rebuilding the Context Studio prototype against real `@tinkermonkey/heimdall-ui` components surfaced gaps where the canonical primitives can't express patterns the legacy prototype had. These are the items the **Heimdall design system team owns**. Project-side workarounds exist for some, but each one represents a real shortfall in the public component API that will keep biting consumers until it's fixed upstream.

Each finding includes:
- **What the consumer needs to express** (the design intent)
- **Why the current API can't express it** (specific code / structure)
- **Recommended fix** (concrete API + CSS suggestion, with a directional note for the future)
- **Severity** (how much of the pattern we lose if it's not fixed)

We've sorted by impact, not by ease.

---

## 1. `PipelineCard` — flow strip loses semantic stage information

**Severity: High.** This is the single biggest visual regression between the v1 HTML prototype and the v2 Heimdall rebuild.

### What the consumer needs to express

A Graph-RAG pipeline has four semantically distinct stages — `source`, `extract`, `resolve`, `write`. In the legacy design, each node in the flow strip:
- Fills an equal share of the strip's width (a 4-node pipeline reads as four evenly-balanced beats, not a left-clumped cluster).
- Carries a stage-specific accent color, applied to both an outer node tile and the icon background (cyan for source, violet for extract, amber for resolve, emerald for write).
- Sits inside its own bordered container so the eye groups `[icon + name + sublabel]` as one unit.

This makes the pipeline scannable at a glance: a curator can tell which stage is producing errors, which step is missing, or where a custom extractor was inserted, just from the colors.

### Why the current API can't express it

`FlowNode` exposes only `id`, `name`, `label`, `icon`. The component does the rest internally:

```tsx
// PipelineCard.tsx
<div className="pipeline-card__node">
  <div className="pipeline-card__icon-tile">
    {/* always tinted with --accent-primary (amber), no per-node override */}
  </div>
  <div className="pipeline-card__node-content">
    <div className="pipeline-card__node-name">{node.name}</div>
    {node.label && <div className="pipeline-card__node-label">{node.label}</div>}
  </div>
</div>
```

And in CSS:
```css
.pipeline-card__node     { flex-shrink: 0; }          /* nodes don't grow */
.pipeline-card__icon-tile{ background: rgb(var(--accent-primary) / 0.15);
                           color: rgb(var(--accent-primary)); }
/* No border / padding / container styling on .pipeline-card__node */
```

There's no way for a consumer to:
- Mark a node as a specific stage and have its tint follow that.
- Force nodes to distribute evenly.
- Add a tile around each node.

A consumer could pass `icon={<CustomTile tone="cyan" />}` to control the icon background, but the surrounding node tile and the `flex-shrink: 0` are baked in.

### Recommended fix

**API additions to `FlowNode`:**

```ts
export interface FlowNode {
  id: string
  name: string
  label?: string
  icon: IconName | React.ReactElement
  /** Stage tone — drives icon tile + node border color. Falls back to neutral. */
  tone?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'rose' | 'neutral'
}
```

**API addition to `PipelineCardProps`:**

```ts
export interface PipelineCardProps {
  // ...existing...
  /** How nodes distribute across the flow strip. Default 'fill'.
   *  'fill' = each node gets equal flex; the strip reads as a balanced pipeline.
   *  'auto' = nodes are auto-width and clump left (current behavior; for free-form workflows). */
  flowLayout?: 'fill' | 'auto'
}
```

**CSS changes:**

```css
/* Outer node — bordered tile around the whole [icon + content] unit */
.pipeline-card__node {
  padding: 8px 10px;
  border: 1px solid rgb(var(--canvas-border));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* fill layout (default for graph-rag pipelines) */
.pipeline-card__flow[data-layout="fill"] .pipeline-card__node {
  flex: 1;
  min-width: 0;
}

/* Per-tone node + icon tile colors. Use the existing --status-* tokens
   so dark/light theme support is free. */
.pipeline-card__node[data-tone="cyan"]    { border-color: rgb(var(--status-cyan) / 0.30); }
.pipeline-card__node[data-tone="cyan"] .pipeline-card__icon-tile {
  background: rgb(var(--status-cyan) / 0.10);
  color: rgb(var(--status-cyan));
}
/* …repeat for violet, amber, emerald, rose, neutral… */

/* Arrows: bump from 20px → 26px so the rhythm matches the more visually
   present nodes. The chevron head also reads cleaner at the larger size. */
.pipeline-card__arrow { width: 26px; }
```

**Directional guidance for the future:** When a primitive renders a series of "stage" items, **never** assume the stages are interchangeable or share a single accent. Always provide a per-item `tone` or `intent` prop so consumers can express the semantic difference between stages. The amber-default-everywhere pattern is a smell — it suggests the component was built for one workflow and never generalized.

---

## 2. `PageHeader` — actions misalign with the subtitle

**Severity: Medium.** A small thing that consistently makes every page header feel slightly less polished.

### What the consumer needs to express

A page header is a **block of text** (eyebrow + title + subtitle) with **a set of actions on the right**. The actions should baseline-align with the *bottom* of the text block — they belong to the whole heading, not the title line specifically. With actions floating at the title's vertical center, they appear to belong to the title and orphan the subtitle.

### Why the current API can't express it

`PageHeader` puts the title + actions in one row, then renders the subtitle as a separate full-width block below:

```tsx
<div className="page-header">
  {eyebrow && <div className="page-header__eyebrow">…</div>}
  <div className="page-header__title-row">    {/* ← actions live here */}
    <h1>{title}{idChip}</h1>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
  {subtitle && <div className="page-header__subtitle">…</div>}
</div>
```

This is a structural decision in the JSX, not a styling one. No prop changes the result.

### Recommended fix

Restructure as a two-column flex with `align-items: flex-end`:

```tsx
<div className="page-header">
  <div className="page-header__text">
    {eyebrow && <div className="page-header__eyebrow">…</div>}
    <h1 className="page-header__title">{title}{idChip}</h1>
    {subtitle && <div className="page-header__subtitle">…</div>}
  </div>
  {actions && <div className="page-header__actions">{actions}</div>}
</div>
```

```css
.page-header {
  display: flex;
  align-items: flex-end;       /* ← actions align to bottom of text block */
  justify-content: space-between;
  gap: 24px;
}
.page-header__text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;                /* let the title wrap if needed */
}
.page-header__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;              /* never compress the actions */
}
```

This is a fully internal change — no prop shape changes, no consumer rewrites.

**Directional guidance for the future:** When a primitive has multiple stacked text elements plus a peer actions slot, the actions belong to the **block**, not the first text line. Use `align-items: flex-end` (or `align-items: stretch` + explicit positioning on actions) so they hold the bottom edge of the heading, parallel to the deepest line of text.

---

## 3. `PageHeader.eyebrow` — too narrow a type

**Severity: Medium.** This blocks the workspace chip + sync timestamp + health indicator pattern that the legacy dashboard used to set context.

### What the consumer needs to express

The eyebrow is real estate above the page title for **status context** — what workspace, what env, when the data last synced, what's the live health, etc. In the legacy design:

```jsx
<div className="page-head-meta">
  <Chip variant="amber">workspace · default</Chip>
  <span className="muted mono">last sync 8m ago</span>
  <span className="muted mono">·</span>
  <span className="muted mono">graph daemon healthy</span>
</div>
```

Three or four signals can sit there without competing with the title.

### Why the current API can't express it

```ts
interface PageHeaderProps {
  eyebrow?: string   // ← only a plain string
  // ...
}
```

Rendered as:
```tsx
{eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
```

This forces consumers to choose: either use the eyebrow for a single mono-uppercase label (its current intent), or skip it entirely and render their own row above `<PageHeader>` — which means no shared styling, and every consumer has to re-invent the same layout.

### Recommended fix

Widen the type and slightly relax the styling:

```ts
interface PageHeaderProps {
  eyebrow?: React.ReactNode    // ← was `string`
  // ...
}
```

```css
.page-header__eyebrow {
  /* Existing styles ONLY apply if the eyebrow is plain text. Wrap them in :where
     so a consumer's child Chip/span doesn't inherit text-transform: uppercase. */
}
.page-header__eyebrow {
  /* Become a layout container, not a text node. */
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: rgb(var(--canvas-fg-3));
}
/* Apply the text-transform only to direct text nodes, not to children. */
.page-header__eyebrow > :where(:not(*)):empty,
.page-header__eyebrow {
  /* ...keep the uppercase styling for the bare-string case but not on children */
}
```

A simpler version: drop `text-transform: uppercase` from the rule, and ask consumers to pass already-cased content. Most consumers passing a `ReactNode` will be rendering chips or formatted spans that shouldn't be uppercased anyway.

**Directional guidance for the future:** When a prop is named after its role (`eyebrow`, `header`, `footer`, `aside`) rather than after a primitive type (`title`, `description`), type it as `React.ReactNode` from day one. The role describes the slot, not the data — and slots should accept arbitrary content.

---

## 4. `ActivityTimeline` — timestamp is stacked, not right-aligned

**Severity: Medium.** Costs ~30% of vertical density and makes the timeline scan slower.

### What the consumer needs to express

For a log of events with timestamps, the natural reading pattern is:

```
[•]  ┌─────────── action description ───────────┐  3m ago
     └ subline / meta info                     ┘
[•]  ┌─────────── action description ───────────┐  17m ago
     └ subline / meta info                     ┘
```

Timestamp on the right means the eye can scan all event subjects in one column without zigzagging.

### Why the current API can't express it

Inside each event, the structure is:

```tsx
<div className="activity-timeline__event">   {/* flex row */}
  <div className="activity-timeline__dot-container">…</div>
  <div className="activity-timeline__content">      {/* second column */}
    <div className="activity-timeline__header">…</div>
    <div className="activity-timeline__meta">…</div>
    <div className="activity-timeline__timestamp">…</div>   {/* stacked third */}
  </div>
</div>
```

Timestamp is the third stacked element inside the content column — not its own column. No prop changes the layout.

### Recommended fix

Make timestamp its own grid column:

```tsx
<div className="activity-timeline__event">
  <div className="activity-timeline__dot-container">…</div>
  <div className="activity-timeline__content">
    <div className="activity-timeline__header">…</div>
    {meta && <div className="activity-timeline__meta">…</div>}
  </div>
  <div className="activity-timeline__timestamp">{formatted}</div>
</div>
```

```css
.activity-timeline__event {
  display: grid;
  grid-template-columns: auto 1fr auto;   /* dot · content · timestamp */
  gap: 12px;
  align-items: baseline;
}
.activity-timeline__timestamp {
  /* drop the margin-top — now it's an inline column, not a stacked line */
  margin-top: 0;
  align-self: start;
  padding-top: 2px;
  white-space: nowrap;
  text-align: right;
}
```

**Directional guidance for the future:** Timestamps, statuses, counts, and other right-meta belong in their own column, not stacked under the subject. When a row has a `[subject + meta]` left block and a single right-meta item, prefer a 3-column grid over a 2-column flex.

---

## 5. `Sidebar` — expansion state isn't controllable

**Severity: Medium.** Already filed as finding #1 in `HEIMDALL_REBUILD.md`; restating here for completeness so the whole list lives in one document.

When the route is `schema/classes`, the `Schema` parent in the sidebar should auto-expand to show its active child. Today, `Sidebar` manages expansion in private `useState` with no controlled or default-expanded prop. Add `defaultExpandedIds?: string[]` and `expandedIds?: string[]` + `onExpandedChange?: (ids: string[]) => void` so consumers can sync expansion with the route.

---

## 6. `Sidebar` — built-in collapse toggle isn't suppressible

**Severity: Low.** The `.sidebar__toggle` button renders at the top of the nav list with no way to hide it. Several consumers will want the toggle in the brand header (`<AppTitle>`) instead. Add `showCollapseToggle?: boolean` (default `true`) to `<Sidebar>`, and an `action?` slot to `<AppTitle>` so the toggle can live in the brand row.

---

## 7. `Icon` set — missing `folder` and `tag`

**Severity: Low.** Both are core navigation/metadata glyphs used widely. The Context Studio rebuild has to substitute `hardDrive` and `component` respectively, which read as wrong.

---

## 8. `CommandPalette` — flat command list, no grouping

**Severity: Low — nice-to-have.** Add an optional `group?: string` field to `Command`, and render groups as section headers in the palette (RECENT / NAVIGATE / ACTIONS, etc.). Without grouping, longer palettes become hard to scan.

---

## Cross-cutting directional guidance

A few patterns underlie multiple findings above. Worth holding as principles for future Heimdall components:

1. **Slots take `ReactNode`, not `string`.** Any prop whose name describes a *role* (eyebrow, header, footer, action, aside, badge, etc.) should accept arbitrary content. If you want default styling for the bare-string case, render with `:where()` so consumer children aren't punished by inheritance.

2. **Per-item tone/intent is part of every series.** Lists, flows, timelines, tab bars, and any other component that renders a series of items should accept a `tone` / `intent` / `status` field on each item — even if the default is "all neutral". Adding it later is a breaking dance with consumers; including it on day one is free.

3. **Layout assumptions are part of the API.** When a component lays out its children in one of N reasonable ways (stack vs. row, fill vs. auto, left vs. right meta), expose the choice as a prop (`layout`, `dense`, `meta-position`). Consumers will need both modes eventually, and a CSS override from outside the library is a sign the API is under-shaped.

4. **Actions belong to the block, not the first line.** Whenever a primitive has multi-line text plus a peer actions slot, baseline-align the actions to the bottom of the text block. Vertically centering them against the title alone makes the subtitle feel orphaned.

5. **Right-meta gets its own column.** Right-side metadata (timestamps, statuses, version pills, counts) should sit in its own grid column, not stack under the left content. This holds the eye's scan line.

