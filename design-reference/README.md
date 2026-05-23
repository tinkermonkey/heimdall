# Heimdall Design System

A design system for **Heimdall** — a graph-native knowledge studio and homelab control surface. Heimdall reads as a developer tool: dense, mono-accented, dark IDE chrome around a light "canvas" work surface. The system is deliberately calm and unflashy. Borders do most of the structural work; shadows are reserved for modals.

> Heimdall ships as `@tinkermonkey/heimdall-ui` — 28 React/TypeScript components built on a CSS-custom-property token layer, Tailwind CSS 3, and self-hosted Inter + JetBrains Mono.

## Sources

This system was distilled from the [tinkermonkey/heimdall](https://github.com/tinkermonkey/heimdall) repository on GitHub. Explore the repo directly for canonical token values, full component implementations, and visual regression baselines:

- **Repository:** https://github.com/tinkermonkey/heimdall
- **Canonical tokens:** `src/tokens/tokens.css`
- **Tailwind theme wiring:** `tailwind.config.ts`
- **Component implementations:** `src/components/` (28 components — `Button`, `Chip`, `Badge`, `StatTile`, `Sidebar`, `Topbar`, `Modal`, `CommandPalette`, etc.)
- **Reference prototypes:** `design-reference/example-context-studio/` and `design-reference/example-homelab-dashboard/` — these are the high-fidelity visual spec.
- **Detailed color spec:** `design-reference/slate.md` (slate + amber palette reference, painted-by-token map).

If you have access, browse the repo at the URL above. If you don't, this folder contains the curated tokens, fonts, icons, and a working UI kit — enough to design new artifacts that match the brand.

---

## Products

Heimdall is a small product family with two reference surfaces:

1. **Context Studio** — a graph-native knowledge studio for building taxonomies, classes, properties, and Graph-RAG pipelines. Dark IDE chrome around a **light canvas** by default. Densely tabular, mono-accented; reads like a CLI man page rendered in HTML.
2. **Homelab Dashboard** ("asgard") — a monitoring and control dashboard for a 4-host homelab cluster with a persistent bot console. Same shell, **dark canvas** by default (monitoring context). 10-route nav: Overview, Servers, Containers, Network, Applications, Storage, Bots, Topology, Logs, Configuration.

Both products share one shell (`Sidebar` + `Topbar` + `Statusbar` + optional `Titlebar` + optional right `Drawer`/bot console) and one token system. The canvas surface is the only thing that varies in tone.

---

## Content Fundamentals

**Voice.** Calm, technical, terse. Reads like a CLI man page, not marketing copy. Short labels, no exclamation, no hand-holding. The product trusts the user to know what a "schema", "individual", "pipeline", or "MCP sidecar" is.

**Casing.**

- **Sentence case** for headings — "Knowledge graph", not "Knowledge Graph" (proper-noun exceptions: REST, JSON, ID, MCP, GPU).
- **UPPER + monospace** for section eyebrow labels — `SCHEMA`, `LAST RUN`, `WORKSPACE`, `PORTS`, `MOUNTS`, `UPTIME`. Always used *above* a value as an eyebrow, never as a full sentence.
- **Identifiers are always monospace, lowercase, snake_case** — `life.organism`, `cls_4f3a`, `pipeline.run.completed`, `nyx.lab.local`. Render them in `JetBrains Mono`.

**Pronouns.** Mostly impersonal — _"Add a class"_, _"Run pipeline"_, _"No data yet"_. Occasionally "you" in empty states (_"You haven't created any schemas"_). Never _we_, _us_, or _our_.

**Numbers and counters.** Tabular numerals, monospace, right-aligned in tables. Stat-tile numbers are 28–30px / 700 / `-0.02em`. Counters look like `12 / 480` or `+3 today`.

**Tone examples — copy these patterns verbatim:**

- **Empty state:** _"No individuals match these filters."_ &nbsp;❌ _"Looks like there's nothing here yet — try adjusting your filters!"_
- **Error toast:** _"`pipeline.run` failed — connection refused at step 2"_ &nbsp;(mono code in backticks, no apology)
- **Success toast:** _"Saved"_ / _"Class created"_ &nbsp;(one or two words)
- **Confirmation:** _"Delete `cls_organism`? 47 individuals will be unlinked."_ &nbsp;(state the consequence, don't ask _"Are you sure?"_)
- **Status line:** _"graph daemon :7474 · 22 classes · 267 individuals indexed · 1 pipeline running pubmed_genes 38%"_
- **Subtitle under H1:** _"Resource state across hosts, gateway health, and deployed services. All systems polled every 15 s."_

**Emoji.** Never. Ever. The visual language is line-icon + monospace.

**Unicode glyphs as icons.** Never — with one historical exception (CSS pseudo-element `→` in the pipeline-flow arrow). Add an icon to `assets/icons.jsx` instead.

---

## Visual Foundations

### Two-surface architecture (the defining choice)

Every screen is built from exactly two surfaces:

- **Shell** — sidebar, topbar, statusbar, optional titlebar, optional right drawer. **Always dark slate navy.** Doesn't change between modes.
- **Canvas** — the main work surface inside the shell. **Light by default** (`#FFFFFF`). Toggles to dark navy (`#0B1426`) via `body.dark-canvas`.

The canvas attaches to the shell with a single **`border-top-left-radius: 8px`** — a small notch in the corner that lets a wedge of the workspace gutter show through. No other corner radii on the canvas. That seam is the visual signature of the system.

| Surface           | Light canvas | Dark canvas |
| ----------------- | ------------ | ----------- |
| Shell base        | `#0F1729`    | `#0F1729`   |
| Sidebar / topbar  | `#13203A`    | `#13203A`   |
| Nav hover / cards | `#1B2949`    | `#1B2949`   |
| Canvas page       | `#FFFFFF`    | `#0B1426`   |
| Canvas inset      | `#F7F9FB`    | `#13203A`   |
| Canvas card       | `#FFFFFF`    | `#1B2949`   |

### Color

- **Primary accent: AMBER.** `--accent-primary` `#FBBF24` (bright) → `--accent-primary-hover` `#F59E0B` (hover) → `--accent-primary-deep` `#B45309` (CTA on light canvas). Reserved for: active nav indicator (2px left bar), focus rings, primary CTAs, env pills, version badges, tab underlines, selected node outline. (The variable names `--accent-cyan*` in the older reference are historical aliases for the amber set; new code should use `--accent-primary*`.)
- **Domain palette** — used to color taxonomies / classes / role marks / topology cards: emerald `#10B981` (life / compute / storage), amber `#F59E0B` (climate / GPU / vega), indigo `#818CF8` (software / k8s / aether), cyan `#22D3EE` (default / nyx).
- **Semantic intents:** emerald=ok/running/healthy, amber=warn/degraded, rose=error/failed/unhealthy, cyan=updating/pulling, violet=info-secondary, neutral gray=stopped/idle.
- **Saturation discipline.** No bright pastels on dark canvas — chip backgrounds drop to ~10% alpha tints. No gradient backgrounds on app surfaces. The only places gradients appear: the brand mark (amber → deep-amber 135°) and bot avatars in the homelab dashboard.

### Type

- **Sans:** **Inter** — every UI label, heading, body, button.
- **Mono:** **JetBrains Mono** — every identifier, path, IP, hostname, port, keyboard shortcut, eyebrow label, table header, status bar text, stat number.
- **Scale (Tailwind):** 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48 / 60. Body default is **14px** (`text-sm`); page H1 is **24px** — much smaller than typical web, IDE density.
- **Weights:** 400 normal · 500 medium (most UI) · 600 semibold (headings, names) · 700 bold (page H1, stat numbers) · 800 extrabold (landing hero only).
- **Mono eyebrow labels** are **10–11px / 500 / `letter-spacing: 0.06–0.12em` / UPPERCASE**, color `var(--canvas-fg-3)`.
- **Heading letter-spacing:** tight — `-0.015em` to `-0.025em`.

### Shape

- **Radius — small.** 4–6px on most things (chips, buttons, inputs, kg-node). 8px on cards and panels. 10–12px on modals only. **No pill shapes** except the env pill and round dots.
- **Borders:** 1px hairline at low contrast (`var(--canvas-border)`, `var(--shell-border)`). Borders do most of the structural work.
- **Shadows:** almost never. Modal: `0 24px 64px -16px rgba(0,0,0,0.55)`. Toast: `0 14px 40px -16px rgba(0,0,0,0.5)`. Cards use **border only — no shadow**.

### Spacing

Tailwind 4px scale. Three density bands:

- **Compact** (table rows, nav items, metric rows): 8–10px vertical padding.
- **Standard** (panel headers, buttons, page padding): 12–14px.
- **Generous** (modal heads, page heads): 18–22px.

Canvas inner padding: `22px 26px 32px`. Stat-grid gap: 14px. Card internals: 16px. Min-width for `lab-canvas-inner` is 1100px — the canvas scrolls horizontally below that.

### Backgrounds & textures

- **No images, no gradients, no noise, no patterns on app surfaces.** Ever.
- **Hero (landing only):** two soft radial-gradient blooms (cyan top-left, violet bottom-right) at 12–18% alpha, behind a card.
- **Brand mark:** amber → deep-amber 135° linear gradient, with a stamped 3-dot pattern on the top half.

### Animation

Sparse and short. **80–180ms ease** for hovers and modals. The only continuous animation is the **status pulse** — `1.6s ease-out infinite scale 0.6→1.4 + opacity 0.5→0` on an absolutely-positioned glow circle behind a solid colored dot. Used exclusively to signal "live" / "connected". **No bouncy easing, no parallax, no scroll-driven motion, no transforms on press, no ripples.**

### Hover & press states

- **Nav items / table rows / chips:** background lifts **one neutral step** to `var(--shell-surface)` or `var(--canvas-bg-2)`. Never a color tint.
- **Buttons:** darken by ~10–15% (light bg) or move toward brighter amber (dark bg).
- **Active nav:** **2px amber bar at the left edge** + `shell-surface` background. Never a tint fill.
- **Press:** no transform, no scale-down, no ripple. Just background swap.

### Focus, selection

- **Focus ring:** `0 0 0 3px rgba(251, 191, 36, 0.18)` on inputs and buttons.
- **Text selection:** `rgba(251, 191, 36, 0.25)` (amber).
- **Row selection:** `rgba(251, 191, 36, 0.06)` bg + faint amber border.
- **Selected node** (kg-node, bot card in topology): 1px amber border + 1px amber outer ring.

### Layout primitives

- **Two-pane** (`SplitPane` / `.split-2`): main content + 380px right drawer.
- **Three-pane** (`.split-3`): 220px left + flex middle + 320px right.
- **Stat grid:** 4 columns × variable rows of stat tiles, each with a **2px colored left bar** keyed to the metric.
- **Sidebar:** 256px expanded, 64px collapsed (icons only).
- **Hierarchy tree:** mono node-pills with a 2.5–3px colored swatch on the left, dashed row dividers, indent steps of 18px.
- **Pipeline card:** flow strip with rounded nodes connected by 1px lines + 45°-rotated tip arrows.

### Transparency / blur

Rare. Only the focus ring uses an alpha background (`rgba(251, 191, 36, 0.18)`). Dark-canvas topbar search input uses `rgba(0,0,0,0.25)`. No backdrop-filter blurs anywhere — the modal backdrop is a flat `rgba(0,0,0,0.55)`.

### Imagery

Very little. The system is text + mono + line-icon. No photographic imagery on app surfaces. When a product needs an image (bot avatar, role mark), it's a **gradient tile with a 2-letter mono monogram** — never a photo.

---

## Iconography

**Single source: `assets/icons.jsx`** — a lookup `ICONS` map of SVG path strings, rendered through a tiny `<Icon name="…" size={16} />` component. The map is hand-rolled in the **Lucide outline style**: `24×24` viewBox, `strokeWidth="1.75"`, `stroke="currentColor"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"`.

**Filled exceptions** — only these four: `play`, `pause`, `zap`, `dot`. Everything else is outlined.

**Sizes:** 11–13px inside chips and palette items, 14–16px in nav and buttons, 18–22px in tile heads.

**Adding an icon = adding a key + path string to the `ICONS` map.** Never paste raw SVG into a component. Names are short and lowercase: `dashboard`, `schema`, `pipeline`, `graph`, `settings`, `search`, `bell`, `plus`, `chevDown`, `chevRight`, `play`, `pause`, `bot`, `brain`, `zap`, `globe`, `shield`, `cpu`, `layers`, `doc`, `folder`, `database`, `tag`, `table`, `flask`, `refresh`, `more`, `edit`, `check`, `x`, `expand`, `workflow`, `branch`, `history`, `sparkle`, `dot`.

**Emoji.** Never.
**Unicode glyphs as icons.** Never (one historical CSS-pseudo exception: pipeline-flow `→`).
**Icon libraries.** Lucide names match for ~90% of the set — if you swap to `lucide-react`, the rename is mostly mechanical.

The icon set ships in this folder as `assets/icons.jsx` (a JSX-ready React component plus the ICONS map) — copy it into your prototype's script tags directly, no install required.

---

## Index — what's in this folder

| Path                       | What it is                                                          |
| -------------------------- | ------------------------------------------------------------------- |
| `README.md`                | This document — the manifest, voice rules, and visual foundations.  |
| `SKILL.md`                 | Agent-skill manifest (cross-compatible with Claude Code).           |
| `colors_and_type.css`      | The full token layer (CSS vars + semantic `h1/p/code/eyebrow`).     |
| `fonts/inter/`             | Inter — `.woff2` weights 300–900.                                   |
| `fonts/jetbrains-mono/`    | JetBrains Mono — `.woff2` weights 400/500/600.                      |
| `assets/icons.jsx`         | `<Icon>` component + `ICONS` path map (Lucide-style outline).       |
| `assets/brand-mark.svg`    | Heimdall amber-gradient brand mark (32×32 square).                  |
| `assets/wordmark.svg`      | Heimdall mark + "Heimdall · DESIGN SYSTEM" wordmark.                |
| `preview/`                 | Design-system preview cards registered in the Design System tab.    |
| `ui_kits/context-studio/`  | Heimdall Context Studio UI kit (shell + components + index.html).   |

---

## Caveats and substitutions

- **No font substitutions.** The repo ships self-hosted Inter (300–900) and JetBrains Mono (400/500/600). They live under `fonts/`. Don't link Google Fonts at runtime in production — match the repo's `@font-face` declarations.
- **Two reference apps; one canonical token set.** The older `homelab-dashboard/README.md` reference still describes cyan accent + `#0B0F14` shell tones. The production `src/tokens/tokens.css` and `design-reference/slate.md` are the source of truth — **amber accent, slate navy shell** as documented here. Treat any `--accent-cyan*` references in legacy CSS as aliases for the amber `--accent-primary*` set.
- **One UI kit shipped here.** The Context Studio kit covers the canonical chrome (sidebar, topbar, titlebar, statusbar, command palette) plus the dashboard surface (stat grid, panels, hierarchy, pipeline card). The Homelab Dashboard surface is a permutation of the same shell — see the repo for the full second surface.
