# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A design system repository with two layers:

1. **Reference prototypes** — high-fidelity static HTML examples (React 18 + Babel standalone, no build step) that serve as the visual and behavioral spec.
2. **Production component library** — `packages/heimdall-ui/`, a TypeScript + React 18 + Tailwind CSS 3 package (`@heimdall/ui`) built with Vite.

**Reference examples** (in `design-reference/`):
- `design-reference/example-context-studio/` — graph-native knowledge studio (dark IDE chrome + light canvas)
- `design-reference/example-context-studio-design-system/` — design system variant of the studio
- `design-reference/example-homelab-dashboard/` — homelab monitoring dashboard (same shell, dark canvas default)

## Running Things

```bash
# Open reference examples directly in a browser (no server needed)
open design-reference/example-context-studio/Context\ Studio.html
open design-reference/example-homelab-dashboard/index.html

# Production package — dev server
cd packages/heimdall-ui && npm run dev

# Production package — build
cd packages/heimdall-ui && npm run build

# Visual regression tests (Playwright)
cd packages/heimdall-ui && npm test
```

## Repository Structure

```
packages/heimdall-ui/          # Production component library (@heimdall/ui)
  src/
    components/                # All components (each has .tsx + .css)
    tokens/tokens.css          # CSS custom properties (design tokens)
    index.css                  # Global base styles + font imports
    index.ts                   # Public API barrel export
    hooks/                     # useBodyOverflow, useFocusTrap
    examples/                  # ContextStudioRebuilt, HomelabDashboardRebuilt
    test-pages/                # Per-category test pages for Playwright
  tailwind.config.ts           # Tailwind theme wired to CSS custom properties
  tests/                       # Playwright visual regression tests

design-reference/              # Static HTML reference prototypes (Babel standalone, no build)
  example-context-studio/      # Graph-native knowledge studio
  example-context-studio-design-system/  # Design system variant
  example-homelab-dashboard/   # Homelab monitoring dashboard

docs/                          # Vite + React docs app (showcase pages)
```

## Production Component Library (`packages/heimdall-ui`)

### Component Inventory

**Primitives:** `Icon`, `Button`, `Chip`, `Badge` / `StatusBadge`

**Inputs:** `TextInput`, `TextArea`, `NumberInput`, `Select`, `TriState`, `Field` (label/error wrapper)

**Data display:** `StatTile`, `StatGrid`, `Table`

**Navigation:** `NavItem`, `Sidebar`, `Topbar`, `TabBar`

**Shell / layout:** `Titlebar`, `Statusbar`, `ShellLayout`, `SplitPane`, `Drawer`, `Panel`

**Overlays:** `Modal`, `ConfirmDialog`, `Toast`, `CommandPalette`

All components are exported from `src/index.ts` with their TypeScript prop types.

### Tech Stack

- React 18 + TypeScript
- Tailwind CSS 3 — theme is fully wired to CSS custom properties (see `tailwind.config.ts`)
- Vite build + `vite-plugin-dts` for type declarations
- Playwright for visual regression tests
- Fonts bundled locally in `public/fonts/` (Inter + JetBrains Mono)

### CSS Architecture

Tokens live in `src/tokens/tokens.css` as CSS custom properties. Tailwind's theme maps every color, radius, shadow, font, spacing, and font-size token to those properties, so Tailwind utility classes automatically respect the two-surface system.

Dark canvas is toggled by adding `dark-canvas` class to `<body>` — the token file overrides all `--canvas-*` variables under `.dark-canvas`. Never use `filter()` or `invert()`.

### React Pattern

Components are standard functional React with TypeScript. State management is props + React context only — no external state libraries.

```tsx
import { Button, Icon, StatTile } from '@heimdall/ui'
import '@heimdall/ui/css'  // import tokens + base styles once at app entry
```

## Design System Architecture

### Two-Surface System

Every screen is built from exactly two surfaces — shell and canvas:

| Surface | Light canvas | Dark canvas |
|---|---|---|
| Shell bg | `#0B0F14` | `#0B0F14` (always dark) |
| Canvas bg | `#FFFFFF` | `#14191F` |

Dark canvas mode: add `dark-canvas` to `<body>`. Every color has an explicit override — no `filter()`/`invert()`.

### Icon System

Icons live in `Icon.tsx` as a `ICONS` map of SVG path strings. Always render via `<Icon name="…" size={16} />`. Never paste raw SVG inline. Adding an icon = adding a key + path string to the `ICONS` map.

Icon spec: Lucide-style outline, 24×24 viewBox, `strokeWidth={1.75}`, `currentColor`, round caps/joins.

## Key Design Tokens

**Shell surface tokens (always dark navy):**
```css
--shell-bg:        #0b0f14   /* outermost shell */
--shell-bg-2:      #0f141b   /* secondary shell layer */
--shell-surface:   #131a23   /* surfaces/panels */
--shell-surface-2: #1a2230   /* elevated surfaces */
--shell-border:    #1e2734   /* shell dividers */
```

**Accent — amber is the primary brand/highlight color:**
```css
--accent-primary:       #f59e0b   /* amber-500, active states */
--accent-primary-hover: #d97706   /* amber-600, hover */
--accent-primary-deep:  #b45309   /* amber-700, CTA in light canvas */
```

**Semantic status colors:** emerald=ok/running, rose=error/failed, cyan=updating/pulling, violet=secondary, neutral=stopped/idle.

**Typography:**
- Sans: Inter — UI, body, headings
- Mono: JetBrains Mono — all identifiers, eyebrow labels (`SCHEMA`, `UPTIME`), table headers, keyboard shortcuts, status bar, tabular numbers
- Body default: 14px (`text-sm`); page H1: 24px (IDE density, not typical web)
- Mono eyebrows: 10–11px, `letter-spacing: 0.06–0.12em`, uppercase, `canvas-fg-3` color

**Radius:** 4–6px chips/buttons/inputs (`rounded-sm`), 8px cards/panels (`rounded-md`), 10–12px modals only (`rounded-lg`). No pills except env badges and dots.

**Shadows:** almost never. Modal: `shadow-modal` (`0 24px 64px -16px rgba(0,0,0,0.55)`). Cards use border only.

## Content & Voice Rules

- Sentence case for headings; UPPER + monospace for section eyebrow labels
- Identifiers always monospace lowercase snake_case: `life.organism`, `cls_4f3a`
- Terse, impersonal. No "we", no exclamation marks, no emoji — ever
- Empty states: _"No individuals match these filters."_ not _"Looks like nothing here yet!"_
- Confirmations state the consequence: _"Delete `cls_organism`? 47 individuals will be unlinked."_

## Component Conventions

- **Active nav:** 2px amber left border + `shell-surface` background (never a tint fill)
- **Focus ring:** `0 0 0 3px rgba(245, 158, 11, 0.18)` on inputs and buttons
- **Hover:** background lifts one neutral step, never a color tint
- **Status pulse (live indicator):** `1.6s ease-out infinite` scale 0.6→1.4 + opacity 0.5→0 on an absolutely-positioned glow circle behind a solid colored dot
- **Animations:** 80–180ms ease for hovers and modals. No bouncy easing, no transforms on press, no ripples.

## Layout Primitives

- **`SplitPane`:** configurable two- or three-pane split (default: main content + 380px right pane)
- **`Sidebar`:** 256px expanded, 64px collapsed (icons only)
- **`StatGrid`:** 4-column grid, 14px gap; each `StatTile` has a 2px colored left bar
- **`ShellLayout`:** composes `Sidebar` + `Topbar` + `Statusbar` into the full IDE chrome
- Canvas inner padding: `22px 26px 32px`, `min-width: 1100px` (horizontally scrolls below that)

## Visual Regression Tests

Tests live in `packages/heimdall-ui/tests/`. Each spec captures screenshots of test pages and compares against snapshots in `tests/*.spec.ts-snapshots/`. Run `npm test` to check; run the update script to regenerate baselines after intentional changes.

Test suites:
- `primitives.spec.ts` — Button, Chip, Badge, inputs, Icon, Field
- `data-display.spec.ts` — Table, StatTile, StatGrid, Sidebar nav
- `shell-framework.spec.ts` — ShellLayout, Topbar, Titlebar, Statusbar, TabBar
- `overlay-components.spec.ts` — Modal, ConfirmDialog, Toast
- `overlay-advanced.spec.ts` — CommandPalette, Drawer, SplitPane
- `reference-previews.spec.ts` — cross-checks static HTML preview cards
- `rebuilt-view-integration.spec.ts` — full rebuilt ContextStudio and HomelabDashboard views

## Reference Examples

The `design-reference/` directories are the canonical visual spec. When a production component's appearance diverges from the reference, the reference wins.

`design-reference/example-context-studio/preview/` and `design-reference/example-homelab-dashboard/preview/` contain standalone HTML cards for each component. Open these to inspect components in isolation.
