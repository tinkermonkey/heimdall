---
name: heimdall-design
description: Build and style components that conform to the heimdall design system. Use this skill when the user asks to create, add, or modify UI components, pages, views, or styles within this repo.
---

This skill governs all component authoring for the heimdall design system. The examples in this repo are the visual and behavioral specification — every new component must match their aesthetic and structure exactly.

## Environment

Components are written as React 18 + Babel standalone (no build step, no npm). Use React globals directly — never write import statements:

```jsx
const { useState, useEffect, useRef, useCallback } = React;
```

CSS ships as plain files loaded in this order:
1. `styles/tokens.css` — base color, type, spacing, radius, shadow variables
2. `styles/studio.css` — shell chrome, canvas surface, all shared components
3. Page-specific CSS — `homelab.css`, `views.css`, etc.

## Two-Surface System

Every screen is built from exactly two surfaces. This rule is structural — never deviate.

| Surface | Variable | Light value | Dark canvas value |
|---|---|---|---|
| Shell bg | `--shell-bg` | `#0B0F14` | same (shell is always dark) |
| Canvas bg | `--canvas-bg` | `#FFFFFF` | `#14191F` |
| Canvas card | `--canvas-card` | `#FFFFFF` | `#1B222A` |

Dark canvas mode is toggled by adding `body.dark-canvas`. Every dark-mode color has an explicit CSS override — **never use `filter()`, `invert()`, or JS-computed colors** for dark mode.

Shell tokens: `--shell-bg`, `--shell-bg-2`, `--shell-surface`, `--shell-surface-2`, `--shell-border`, `--shell-border-2`, `--shell-fg-1` through `--shell-fg-4`

Canvas tokens: `--canvas-bg`, `--canvas-bg-2`, `--canvas-card`, `--canvas-bd`, `--canvas-bd-2`, `--canvas-fg-1` through `--canvas-fg-4`

## Color — Accents and Status

Cyan is the only brand color. Use the others only for their semantic role:

```css
--accent-cyan:      #22D3EE   /* brand bright, active states, live indicators */
--accent-cyan-2:    #06B6D4   /* hover */
--accent-cyan-deep: #0E7EA3   /* CTA buttons on light canvas */
--accent-emerald:   #10B981   /* ok / running / success */
--accent-amber:     #F59E0B   /* warn / degraded */
--accent-rose:      #F43F5E   /* error / failed */
--accent-violet:    #A78BFA   /* updating / pull / secondary accent */
```

Status semantic mapping: emerald=ok/running, amber=warn/degraded, rose=error/failed, cyan=updating/pulling, neutral=stopped/idle.

## Typography

Two fonts only:

- **Inter** — all UI, body, headings. `var(--font-sans)`
- **JetBrains Mono** — identifiers, eyebrow labels, table headers, keyboard shortcuts, status bar, tabular numbers. `var(--mono)`

Rules:
- Body default: 14px (`font-size: 14px` on `body`)
- Page H1: 24px — IDE density, not marketing scale
- Eyebrow labels (section headings, table headers, stat labels): 10–11px monospace, `letter-spacing: 0.06–0.12em`, uppercase, `--canvas-fg-3` color
- Identifiers always mono, lowercase snake_case: `life.organism`, `cls_4f3a`
- Sentence case for headings; UPPER mono for eyebrow labels

## Radius

4–6px for chips, buttons, inputs. 8px for cards and panels. 10–12px for modals only. No pill shapes except for environment badges and status dots (use `border-radius: 999px`).

## Shadows

Almost never. Cards use border only (`border: 1px solid var(--canvas-bd)`). Modal only: `box-shadow: 0 24px 64px -16px rgba(0,0,0,0.55)`.

Focus ring on all interactive elements: `box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.13)`.

## Icon System

All icons live in `icons.jsx` as a single `ICONS` map of SVG path strings. Always render via `<Icon name="…" size={16} />`. Never paste raw SVG inline.

Icon spec: Lucide-style outline, 24×24 viewBox, `stroke-width: 1.75`, `currentColor`, `stroke-linecap: round`, `stroke-linejoin: round`. To add an icon, add a key + path string to the `ICONS` map in `icons.jsx`.

## Interaction and Animation

- Hover: background lifts one neutral step — never a color tint
- Active nav: 2px cyan left border + `--shell-surface` background — never a tint fill
- Transition timing: 80–180ms ease for hovers and modals
- No bouncy easing, no transforms on press, no ripple effects
- Status pulse (live indicator): `1.6s ease-out infinite`, scale `0.6→1.4` + opacity `0.5→0` on an absolutely-positioned glow circle behind a solid dot

## Core Components

### Buttons (`.btn`)

```html
<button class="btn btn-primary">Label</button>
<button class="btn btn-accent">Label</button>
<button class="btn btn-ghost">Label</button>
<button class="btn btn-ghost btn-sm">Small</button>
<button class="btn btn-ghost btn-icon"><svg …/></button>
```

- `.btn`: height 34px, padding `0 12px`, radius 6px, font-size 13px, font-weight 500
- `.btn-primary`: `--canvas-fg-1` bg, white text (dark canvas: cyan bg, dark text)
- `.btn-accent`: `--accent-cyan-deep` bg, white text
- `.btn-ghost`: transparent bg, `--canvas-bd` border, `--canvas-fg-2` text
- `.btn-sm`: height 28px, font-size 12px
- `.btn-icon`: width 34px, no padding

### Chips / Tags (`.chip`)

```html
<span class="chip">label</span>
<span class="chip cyan"><span class="dot"></span>running</span>
<span class="chip amber">warn</span>
<span class="chip emerald">ok</span>
<span class="chip rose">error</span>
<span class="chip violet">violet</span>
```

Mono font, 11px, `border-radius: 3px`. Light-canvas colors use pastel tints; dark canvas overrides use `rgba()` tints with matching text colors.

### Stat Tiles (`.stat`)

```html
<div class="stat-grid">
  <div class="stat" data-color="cyan">
    <div class="label">UPTIME</div>
    <div class="num">99.9%</div>
    <div class="meta"><span class="delta-up">↑ 0.1%</span> vs last week</div>
  </div>
</div>
```

- 4-column grid, 14px gap
- Each tile has a 2px colored left bar (default cyan; override via `data-color="violet|amber|emerald"`)
- Label: mono, 11px, uppercase, `--canvas-fg-3`
- Number: 28px, weight 700, tabular nums (`font-feature-settings: "tnum"`)

### Panels / Cards (`.panel`)

```html
<div class="panel">
  <div class="panel-head">
    <span class="panel-title">Title <span class="id">id_tag</span></span>
    <button class="btn btn-ghost btn-sm">Action</button>
  </div>
  <div class="panel-body">…</div>
</div>
```

Border `1px solid --canvas-bd`, radius 8px, no shadow.

### Tables (`table.t`)

```html
<div class="table-wrap">
  <table class="t">
    <thead><tr><th>NAME</th><th>STATUS</th></tr></thead>
    <tbody>
      <tr>
        <td><span class="mono">identifier</span></td>
        <td><span class="chip emerald">running</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

- `th`: mono, 10.5px, uppercase, `letter-spacing: 0.08em`, `--canvas-fg-3`, `--canvas-bg-2` bg
- `td`: 13px, `--canvas-fg-1`, row hover lifts to `--canvas-bg-2`
- No border on last row

### Inputs (`.input`)

```html
<input class="input" type="text" placeholder="Search…" />

<!-- With search icon -->
<div class="search-input">
  <input class="input" type="text" placeholder="Search…" />
  <svg …/>
</div>
```

Height 34px, radius 6px, `--canvas-bd-2` border. Focus: `--accent-cyan-deep` border + `0 0 0 3px rgba(14,126,163,0.12)` shadow.

### Tabs (`.tabs`)

```html
<div class="tabs">
  <button class="tab active">Overview <span class="count">12</span></button>
  <button class="tab">Details</button>
</div>
```

Active tab: `--canvas-fg-1` text, 2px bottom border (color: `--canvas-fg-1` in light; `--accent-cyan` in dark canvas).

### Drawer / Detail Pane (`.drawer`)

```html
<div class="drawer">
  <div class="drawer-head">
    <span class="title">Details</span>
    <button class="btn btn-ghost btn-icon">…</button>
  </div>
  <div class="drawer-body">
    <dl class="kv">
      <dt>TYPE</dt><dd>value</dd>
    </dl>
  </div>
</div>
```

DT: mono, 11px, uppercase, `--canvas-fg-3`. DD: 13px, `--canvas-fg-1`.

### Status Pulse

```html
<div class="status-line">
  <div class="pulse"></div>
  <span>Live</span>
</div>
```

Solid dot (8px, `border-radius: 999px`) + `::after` pseudo-element with `animation: pulse 1.6s ease-out infinite`.

### Nav Items (`.nav-item`)

```html
<div class="nav-item active">
  <Icon name="grid" size={16} />
  <span class="nav-label">Dashboard</span>
  <span class="nav-count">4</span>
</div>
```

Active: `--shell-surface` bg, `--shell-fg-1` text, 2px cyan left border via `::before` pseudo-element (positioned at `left: -8px`).

## Layout Primitives

```css
.split-2   /* 1fr 380px — main + right drawer */
.split-3   /* 220px 1fr 320px — left + middle + right */
.app-shell /* 256px 1fr (64px 1fr when .collapsed) */
```

Canvas inner padding: `22px 26px 32px`, `min-width: 1100px`. Topology views: `min-width: 1560px`.

Utility classes: `.row` (flex, align-center, gap 8px), `.between` (flex, space-between), `.col` (flex-col), `.grow` (flex 1), `.mono` (JetBrains Mono), `.muted` (`--canvas-fg-3`).

## Content and Voice

- Empty states: _"No items match these filters."_ — not _"Nothing here yet!"_
- Confirmations state the consequence: _"Delete `cls_organism`? 47 individuals will be unlinked."_
- No "we", no exclamation marks, no emoji — ever
- Terse, impersonal, informational

## Dark Canvas Mode

When adding a new CSS class that uses canvas variables, always add a `body.dark-canvas` override block. Pattern:

```css
/* Light canvas */
.my-component {
  background: var(--canvas-card);
  border-color: var(--canvas-bd);
  color: var(--canvas-fg-1);
}

/* Dark canvas override */
body.dark-canvas .my-component {
  /* canvas vars redefine automatically, but explicit overrides for
     any hardcoded colors or pastel tints that won't read on dark */
}
```

Components that use only `--canvas-*` variables often need no override — the variable values change automatically. Only hardcoded hex colors, pastel light-mode tints (`.chip.cyan`, `.chip.emerald`, etc.), and hover `box-shadow` values need explicit dark overrides.
