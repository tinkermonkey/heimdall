---
name: heimdall-design
description: Use this skill to generate well-branded interfaces and assets for Heimdall (graph-native knowledge studio + homelab control surface, by tinkermonkey), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and a Context Studio UI kit for prototyping.
user-invocable: true
---

# Heimdall Design Skill

Read `README.md` in this skill first — it is the canonical reference for voice, colors, type, shape, spacing, animation, hover/focus, layout primitives, and iconography. Then browse the other available files:

- `colors_and_type.css` — drop-in CSS variable layer (shell + canvas + amber + semantic + spacing + radius + shadow + type) plus base `h1/p/code/kbd` styles. **Always import this first** in any prototype.
- `fonts/inter/` and `fonts/jetbrains-mono/` — self-hosted `.woff2`. Referenced by `colors_and_type.css`.
- `assets/icons.jsx` — `<Icon name="…" size={…} />` component + Lucide-style outline `ICONS` map. Drop into any React/Babel prototype with `<script type="text/babel" src="…/icons.jsx">`. Add new icons by adding a key to `ICONS`.
- `assets/brand-mark.svg`, `assets/wordmark.svg` — brand assets.
- `preview/` — ~43 standalone HTML cards that show every token / component in isolation. Open one to remember what a piece looks like. The component set covers: `buttons`, `chips`, `id-tag`, `input-field`, `nav-item`, `panel`, `pulse-dots`, `table-row`, `toast`, `tabs`, `segmented-control`, `filter-dropdown`, `version-pill`, `inspector-panel`, `kv-grid`, `hierarchy-row`, `activity-item`, `quick-access-tile`, `config-tile`, `statusbar`, `workspace-switcher`, `graph-canvas`, `modal`, `command-palette`, `pipeline-card`, `stat-tile`.
- `ui_kits/context-studio/` — a working high-fidelity recreation of the Context Studio shell + dashboard + classes table + pipelines + settings + ⌘K command palette + modal + toast. Best starting point when designing a new screen — copy components from there.

## How to use

If you are **creating visual artifacts** (slides, mocks, throwaway prototypes, design explorations), copy assets out and create static HTML files for the user to view:

1. Start the file with `<link rel="stylesheet" href="…/colors_and_type.css">` so you get the token layer and base type.
2. Place a 1-line link to `ui_kits/context-studio/styles.css` if you want the full shell + component styling, or write your own using the CSS variables from `colors_and_type.css`.
3. Reuse component HTML/JSX from `ui_kits/context-studio/` (`Shell.jsx`, `Pages.jsx`, `Overlays.jsx`) — paste, don't reinvent.
4. Use `<Icon>` from `assets/icons.jsx` — never paste raw SVG, never use emoji.

If you are working on **production code**, you can copy assets and read the rules here to become an expert in designing with this brand. The production component library is `@tinkermonkey/heimdall-ui` (see `README.md` for repo URL).

## When the user invokes this skill without other guidance

Ask them what they want to build or design, ask some questions (audience, surface, fidelity, variations), then act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Hard rules

- **No emoji.** Ever. Use icons from `assets/icons.jsx`.
- **No unicode glyphs as icons.** Use the icon set.
- **No gradient backgrounds on app surfaces.** Only on the brand mark.
- **No shadows on cards.** Border-only. Reserve `--shadow-modal` and `--shadow-toast` for those overlays.
- **No bouncy animation.** 80–180ms ease for hovers and modals. The status pulse (1.6s ease-out scale + fade) is the only continuous animation.
- **Identifiers in mono.** Always JetBrains Mono, lowercase snake_case. Class ids, paths, ports, hostnames, commit hashes.
- **Sentence case headings.** UPPER + mono only for eyebrows above values.
- **Voice: terse, technical, impersonal.** No "we", no exclamation, no hand-holding. Like a CLI man page.
- **Two-surface rule.** Shell stays dark slate navy. Canvas defaults light (or dark for monitoring contexts) with a single 8px `border-top-left-radius` notch.
- **Amber for accent.** Never reintroduce cyan as the primary brand color — it's a historical alias.
