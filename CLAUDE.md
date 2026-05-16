# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A collection of high-fidelity design reference prototypes for a React + Tailwind design system. The examples run as static HTML files (React 18 + Babel standalone, no build step) and serve as the visual and behavioral spec for a production design system to be built here.

**Two reference examples:**
- `example-context-studio/` — graph-native knowledge studio (dark IDE chrome + light canvas)
- `example-homelab-dashboard/` — homelab monitoring dashboard (same shell, dark canvas default)

## Running the Examples

Open directly in a browser — no server or build step needed:
```
open example-context-studio/Context\ Studio.html
open example-homelab-dashboard/index.html
```

## Design System Architecture

### CSS Layer Order (must load in this sequence)
1. `styles/tokens.css` — Flowbite/Tailwind-derived color scales, type scale, spacing, radii, shadows. Imports Inter + JetBrains Mono from Google Fonts.
2. `styles/studio.css` — Shell chrome, canvas surface, layout primitives, shared components (`.btn`, `.panel`, `.stat`, `.kg-node`, `.chip`, etc.)
3. `styles/crud.css` — Modals, forms, toasts, entity pickers (context-studio only)
4. Page-specific CSS — `homelab.css`, `views.css`, `individuals.css`, etc.

### Two-Surface System
Every screen is built from exactly two surfaces — shell and canvas. This is the defining structural rule:

| Surface | Light | Dark |
|---|---|---|
| Shell bg | `#0B0F14` | `#0B0F14` (always dark) |
| Canvas bg | `#FFFFFF` | `#14191F` |

Dark canvas mode is toggled via `body.dark-canvas` overriding CSS variables — **do not use `filter()` or `invert()`**, every dark-mode color has an explicit override in `studio.css`/`homelab.css`.

### React Pattern
Components use React globals directly (no imports, Babel standalone environment):
```jsx
const { useState, useEffect, useRef } = React;
```
State is passed via props or a simple context store (`components/store.jsx`). No external state libraries.

### Icon System
All icons live in `icons.jsx` as a single `ICONS` map of SVG path strings. Always render via `<Icon name="…" size={16} />`. Never paste raw SVG inline. Adding an icon = adding a key + path string to the `ICONS` map.

Icon spec: Lucide-style outline, 24×24 viewBox, `stroke-width: 1.75`, `currentColor`, round caps/joins.

## Key Design Tokens

**Accent — cyan is the only brand color:**
```css
--accent-cyan:      #22D3EE   /* brand bright, active states */
--accent-cyan-2:    #06B6D4   /* hover */
--accent-cyan-deep: #0E7EA3   /* CTA in light canvas */
```

**Semantic status colors:** emerald=ok/running, amber=warn/degraded, rose=error/failed, cyan=updating/pulling, neutral=stopped/idle.

**Host/domain palette:** cyan=nyx/compute, emerald=helios/storage, violet=aether/k8s, amber=vega/gpu.

**Typography:**
- Sans: Inter — UI, body, headings
- Mono: JetBrains Mono — all identifiers, eyebrow labels (`SCHEMA`, `UPTIME`), table headers, keyboard shortcuts, status bar, tabular numbers
- Body default: 14px (`text-sm`); page H1: 24px (IDE density, not typical web)
- Mono eyebrows: 10–11px, `letter-spacing: 0.06–0.12em`, uppercase, `canvas-fg-3` color

**Radius:** 4–6px chips/buttons/inputs, 8px cards/panels, 10–12px modals only. No pills except env badges and dots.

**Shadows:** almost never. Modal: `0 24px 64px -16px rgba(0,0,0,0.55)`. Cards use border only.

## Content & Voice Rules

- Sentence case for headings; UPPER + monospace for section eyebrow labels
- Identifiers always monospace lowercase snake_case: `life.organism`, `cls_4f3a`
- Terse, impersonal. No "we", no exclamation marks, no emoji — ever
- Empty states: _"No individuals match these filters."_ not _"Looks like nothing here yet!"_
- Confirmations state the consequence: _"Delete `cls_organism`? 47 individuals will be unlinked."_

## Component Conventions

- **Active nav:** 2px cyan left border + `shell-surface` background (never a tint fill)
- **Focus ring:** `0 0 0 3px rgba(34, 211, 238, 0.13)` on inputs and buttons
- **Hover:** background lifts one neutral step, never a color tint
- **Status pulse (live indicator):** `1.6s ease-out infinite` scale 0.6→1.4 + opacity 0.5→0 on an absolutely-positioned glow circle behind a solid colored dot
- **Animations:** 80–180ms ease for hovers and modals. No bouncy easing, no transforms on press, no ripples.

## Layout Primitives

- **Two-pane** (`.split-2`): main content + 380px right drawer
- **Three-pane** (`.split-3`): 220px left + flex middle + 320px right
- **Sidebar:** 256px expanded, 64px collapsed (icons only)
- **Stat grid:** 4 columns, 14px gap, each tile has a 2px colored left bar
- Canvas inner padding: `22px 26px 32px`, `min-width: 1100px` (horizontally scrolls below that)
- Topology stage: `min-width: 1560px`

## Preview Pages

`example-context-studio/preview/` contains standalone HTML cards for each design system component (buttons, chips, inputs, nav, palette, etc.). Open these to inspect individual components in isolation.
