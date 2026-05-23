# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A design system repository:

**Production component library** — repo root (`src/`, `package.json`), published as `@tinkermonkey/heimdall-ui`, built with Vite + TypeScript + Tailwind CSS 3.

## Scratch Files

When capturing screenshots, saving debug images, or writing any temporary working files during a session, always write them to `.scratch/` at the repo root. This directory is gitignored. Never write temporary files to the repo root or any tracked directory.

## Running Things

```bash
# Production package — dev server (run from repo root)
npm run dev

# Production package — build
npm run build

# Visual regression tests (Playwright)
npm test
```

**Before starting any dev server**, check whether one is already running to avoid accumulating orphaned processes:

```bash
# Check for an existing Vite dev server
lsof -ti :5173 -ti :5174 -ti :5175 -ti :5176 2>/dev/null | head -1
# or
pgrep -fl "vite" 2>/dev/null
```

If a server is already running, use its existing port rather than starting a new instance. Only start a new server if none is found.

## Repository Structure

```
(repo root)                        # Production component library (@tinkermonkey/heimdall-ui)
  src/
    components/                # All components (each has .tsx + .css)
    tokens/tokens.css          # CSS custom properties (design tokens)
    index.css                  # Global base styles + font imports
    index.ts                   # Public API barrel export
    hooks/                     # useBodyOverflow, useFocusTrap
    test-pages/                # Per-category test pages for Playwright
  tailwind.config.ts           # Tailwind theme wired to CSS custom properties
  tests/                       # Playwright visual regression tests

design-reference/              # Design reference documentation
docs/                          # Vite + React docs app (showcase pages)
```

## Production Component Library

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
import { Button, Icon, StatTile } from '@tinkermonkey/heimdall-ui'
import '@tinkermonkey/heimdall-ui/css'  // import tokens + base styles once at app entry
```

## Design System Architecture

### Two-Surface System

Every screen is built from exactly two surfaces — shell and canvas:

| Surface | Light canvas | Dark canvas |
|---|---|---|
| Shell bg | `#0F1729` | `#0F1729` (always dark — slate navy) |
| Canvas bg | `#FFFFFF` | `#14203A` |

Dark canvas mode: add `dark-canvas` to `<body>`. Every color has an explicit override — no `filter()`/`invert()`.

### Icon System

Icons live in `Icon.tsx` as a `ICONS` map of SVG path strings. Always render via `<Icon name="…" size={16} />`. Never paste raw SVG inline. Adding an icon = adding a key + path string to the `ICONS` map.

Icon spec: Lucide-style outline, 24×24 viewBox, `strokeWidth={1.75}`, `currentColor`, round caps/joins.

## Key Design Tokens

**Shell surface tokens (always dark — slate navy):**
```css
--shell-bg:        #0f1729   /* outermost shell */
--shell-bg-2:      #13203a   /* secondary shell layer */
--shell-surface:   #1b2949   /* surfaces/panels */
--shell-surface-2: #243763   /* elevated surfaces */
--shell-border:    #1e2a44   /* shell dividers */
--shell-border-2:  #2a3a5c   /* input border, scrollbar thumb */
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

Tests live in `tests/`. Each spec captures screenshots of test pages and compares against snapshots in `tests/*.spec.ts-snapshots/`. Run `npm test` to check; run the update script to regenerate baselines after intentional changes.

Test suites:
- `primitives.spec.ts` — Button, Chip, Badge, inputs, Icon, Field
- `data-display.spec.ts` — Table, StatTile, StatGrid, Sidebar nav
- `shell-framework.spec.ts` — ShellLayout, Topbar, Titlebar, Statusbar, TabBar
- `overlay-components.spec.ts` — Modal, ConfirmDialog, Toast
- `overlay-advanced.spec.ts` — CommandPalette, Drawer, SplitPane
