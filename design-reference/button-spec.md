# Button Spec — Context Studio

**Source of truth: `styles/studio.css`** (lines 384–402, 1095–1100, 1200–1215, 1357–1378) plus the **Accent tweak** in `app.jsx` lines 27–38. Every value below is copied verbatim from those files. Light mode = `<body>` default. Dark mode = `<body class="dark-canvas">` (rebinds `--canvas-*` tokens; the app shell/sidebar is always dark and is NOT affected by this class).

## ⚠️ Accent tweak — default is **Amber**

The Tweaks panel exposes an **Accent** radio (Cyan / Violet / Emerald / Amber). The selected value is written into three CSS custom properties at runtime by `app.jsx`. **The token names are historical — they read `--accent-cyan*` but they hold the current accent color**, whichever option is selected.

```js
// app.jsx:27–38  — runtime accent binding
const accents = {
  cyan:    { c1: '#22D3EE', c2: '#06B6D4', cd: '#0E7EA3' },
  violet:  { c1: '#A78BFA', c2: '#8B5CF6', cd: '#6D28D9' },
  emerald: { c1: '#34D399', c2: '#10B981', cd: '#047857' },
  amber:   { c1: '#FBBF24', c2: '#F59E0B', cd: '#B45309' },  // ← DEFAULT (app.jsx:4)
};
root.style.setProperty('--accent-cyan',      a.c1);
root.style.setProperty('--accent-cyan-2',    a.c2);
root.style.setProperty('--accent-cyan-deep', a.cd);
```

Default is `"accent": "amber"` (`app.jsx:4`, inside the `TWEAK_DEFAULTS` block).

**At-runtime accent values per option:**

| Option | `--accent-cyan` (c1) | `--accent-cyan-2` (c2) | `--accent-cyan-deep` (cd) |
|---|---|---|---|
| Cyan | `#22D3EE` | `#06B6D4` | `#0E7EA3` |
| Violet | `#A78BFA` | `#8B5CF6` | `#6D28D9` |
| Emerald | `#34D399` | `#10B981` | `#047857` |
| **Amber (default)** | **`#FBBF24`** | **`#F59E0B`** | **`#B45309`** |

Everywhere this spec references `--accent-cyan*`, **the actual rendered color is the amber value above** in the default build. Switching the Accent tweak retints every accent-using surface live.

---

## 0. Token reference

These are the only tokens the button system consumes. Defined in `styles/studio.css` `:root` (light) and `body.dark-canvas` (dark).

| Token | Light (`:root`) | Dark (`body.dark-canvas`) | Used by |
|---|---|---|---|
| `--canvas-fg-1` | `#0B1220` | `#E2E8F0` | `.btn-primary` bg (light); `.btn-ghost` hover text |
| `--canvas-fg-2` | `#475569` | `#94A3B8` | `.btn-ghost` text |
| `--canvas-bg-2` | `#F7F9FB` | `#13203A` | `.btn-ghost` hover bg |
| `--canvas-bd` | `#E5E9EE` | `#243763` | `.btn-ghost` border |
| `--canvas-bd-2` | `#D6DCE3` | `#354973` | `.btn-ghost` hover border |
| `--accent-cyan` | **`#FBBF24`** *(amber-400 by default; rebound by Accent tweak)* | *(unchanged)* | `.btn-primary` bg in dark; `.btn-hero` bg |
| `--accent-cyan-2` | **`#F59E0B`** *(amber-500 by default)* | *(unchanged)* | `.btn-accent` hover; `.btn-primary` hover in dark |
| `--accent-cyan-deep` | **`#B45309`** *(amber-700 by default)* | *(unchanged)* | `.btn-accent` bg |
| `--shell-surface` | `#131A23` | *(shell is always dark)* | `.ws-dialog-actions .btn` bg |
| `--shell-surface-2` | `#1A2230` | *(unchanged)* | `.ws-dialog-actions .btn:hover` bg |
| `--shell-border` | `#1E2733` | *(unchanged)* | `.ws-dialog-actions .btn` border |
| `--shell-border-2` | `#2A3645` | *(unchanged)* | `.ws-dialog-actions .btn:hover` border; `.btn-hero-alt` border |
| `--shell-fg-1` | `#E6EDF3` | *(unchanged)* | `.btn-hero-alt` color |
| `--shell-fg-3` | `#6E7A87` | *(unchanged)* | `.btn-hero-alt:hover` border |

> The `--accent-cyan*` tokens are tweak-bound at runtime. Bold values show the **amber default**; see §0 for the cyan/violet/emerald alternatives.

---

## 1. Base — `.btn`

Inherited by every variant. Exact values from `styles/studio.css:384–393`.

| Property | Value |
|---|---|
| `display` | `inline-flex` |
| `align-items` / `justify-content` | `center` / `center` |
| `gap` | `6px` |
| `height` | `34px` |
| `padding` | `0 12px` |
| `border-radius` | `6px` |
| `font-size` | `13px` |
| `font-weight` | `500` |
| `border` | `1px solid transparent` |
| `white-space` | `nowrap` |
| `cursor` | `pointer` *(inherited from global `button` rule, `studio.css:60`)* |
| `transition` | `background 0.08s, border-color 0.08s, color 0.08s` |

**Icon child** (`.btn svg`, `studio.css:394`):
- `width: 14px; height: 14px`
- `stroke: currentColor; stroke-width: 2; fill: none`
- `stroke-linecap: round; stroke-linejoin: round`

**No focus-ring rule is defined in the source.** Buttons inherit the global focus-outline default. If a ring is wanted, add it as a new rule — it does not exist today.

---

## 2. Size & shape modifiers

| Class | Override | Source |
|---|---|---|
| `.btn-sm` | `height: 28px; padding: 0 10px; font-size: 12px` | `studio.css:402` |
| `.btn-icon` | `width: 34px; padding: 0` (square; pair with `.btn-sm` for a 28px square) | `studio.css:401` |

There is no `xs`/`lg`/`xl`. Just default (34px) and `sm` (28px). Don't introduce more sizes without explicit direction.

---

## 3. Variants — LIGHT mode (`<body>` default)

### 3.1 `.btn-primary` *(`studio.css:395–396`)*
The default page-action button. **Near-black slate** bg, not cyan.

| State | Value |
|---|---|
| bg | `var(--canvas-fg-1)` → `#0B1220` |
| color | `#FFFFFF` |
| border | `transparent` (inherited from `.btn`) |
| hover bg | `#1E293B` *(hardcoded — not a token)* |
| hover color | `#FFFFFF` (unchanged) |
| icon | `currentColor` → white |

### 3.2 `.btn-accent` *(`studio.css:397–398`)*
Brand-accent button — reserved for save/run/confirm and other "this is the brand action" moments. Used much less than `.btn-primary`. Color follows the **Accent tweak** (default Amber).

| State | Token | Resolved value (Amber default) |
|---|---|---|
| bg | `var(--accent-cyan-deep)` | `#B45309` (amber-700) |
| color | — | `#FFFFFF` |
| hover bg | `var(--accent-cyan-2)` | `#F59E0B` (amber-500) |
| hover color | — | `#FFFFFF` (unchanged) |

> Same rule applies under Cyan/Violet/Emerald tweak — the bg/hover values become each option's `cd`/`c2`. White text holds across all four (the `deep` step is dark enough in every option).

### 3.3 `.btn-ghost` *(`studio.css:399–400`)*
Toolbar / row-action button — transparent at rest, hairline border, hover lifts to a single neutral step (per the README convention: *"Buttons: darken by ~10–15% (light bg) or move toward the brighter cyan (dark bg)"* — ghost is the "lift" case).

| State | Value |
|---|---|
| bg | `transparent` |
| color | `var(--canvas-fg-2)` → `#475569` |
| border | `1px solid var(--canvas-bd)` → `#E5E9EE` |
| hover bg | `var(--canvas-bg-2)` → `#F7F9FB` |
| hover color | `var(--canvas-fg-1)` → `#0B1220` |
| hover border | `var(--canvas-bd-2)` → `#D6DCE3` |

---

## 4. Variants — DARK mode (`body.dark-canvas`)

The dark-canvas class rebinds `--canvas-*` to the navy scale (`studio.css:1357–1366`). Two of the three variants pick up the new values automatically; only `.btn-primary` has an explicit override.

### 4.1 `.dark-canvas .btn-primary` — **EXPLICIT OVERRIDE** *(`studio.css:1376–1378`)*
Slate-black bg would disappear into the dark canvas, so primary flips to **bright accent with dark text**. Color follows the **Accent tweak** (default Amber).

| State | Token | Resolved value (Amber default) |
|---|---|---|
| bg | `var(--accent-cyan)` | `#FBBF24` (amber-400) |
| color | — | `#0B0F14` |
| icon | explicit `svg { color: #0B0F14 }` | `#0B0F14` |
| hover bg | `var(--accent-cyan-2)` | `#F59E0B` (amber-500) |
| hover color | — | `#0B0F14` (unchanged) |

> Dark text on bright amber is the correct contrast pattern here. With Cyan tweak: bg `#22D3EE` / hover `#06B6D4`. With Violet: `#A78BFA` / `#8B5CF6`. With Emerald: `#34D399` / `#10B981`. Text stays `#0B0F14` across all four — every `c1` step is bright enough to demand dark text.

### 4.2 `.dark-canvas .btn-accent` — *no override; token-resolved*
Same `--accent-cyan-deep` bg as in light — `#B45309` (amber-700) by default. The `deep` step is dark enough in every accent option that white text still reads against the dark canvas. No CSS change needed.

### 4.3 `.dark-canvas .btn-ghost` — *no override; token-resolved*
Picks up rebound `--canvas-*` automatically:

| State | Value (in dark) |
|---|---|
| bg | `transparent` |
| color | `var(--canvas-fg-2)` → `#94A3B8` |
| border | `var(--canvas-bd)` → `#243763` |
| hover bg | `var(--canvas-bg-2)` → `#13203A` |
| hover color | `var(--canvas-fg-1)` → `#E2E8F0` |
| hover border | `var(--canvas-bd-2)` → `#354973` |

---

## 5. Special-context override — `.ws-dialog-actions .btn` *(`studio.css:1095–1100`)*

Action buttons inside the workspace-switcher dialog sit on the **shell** surface, not the canvas, so they restyle to read against `--shell-*`. Applies to any `.btn` variant placed inside `.ws-dialog-actions`.

| State | Value |
|---|---|
| bg | `var(--shell-surface)` → `#131A23` |
| color | `var(--shell-fg-1)` → `#E6EDF3` |
| border | `1px solid var(--shell-border)` → `#1E2733` |
| hover bg | `var(--shell-surface-2)` → `#1A2230` |
| hover border | `var(--shell-border-2)` → `#2A3645` |

---

## 6. Hero/marketing buttons *(separate from the main `.btn` system — `studio.css:1200–1215`)*

These only appear in the marketing/landing hero section. They are NOT `.btn` extensions; they're their own classes with their own sizes. Use only inside `.hero .ctas`.

### 6.1 `.btn-hero`
Marketing-only — follows the **Accent tweak** (default Amber).

| Property | Token | Resolved value (Amber default) |
|---|---|---|
| height | — | `44px` |
| padding | — | `0 20px` |
| bg | `var(--accent-cyan)` | `#FBBF24` (amber-400) |
| color | — | `#0B0F14` |
| border-radius | — | `6px` |
| font | — | `14px / 600` |
| gap | — | `8px` |
| hover bg | hardcoded | `#67E8F9` *(⚠️ hardcoded **cyan-300** — does not follow accent tweak; will mismatch under Amber/Violet/Emerald. Flag for the implementation team to either token-bind or accept the cross-color hover.)* |

### 6.2 `.btn-hero-alt`
| Property | Value |
|---|---|
| height | `44px` |
| padding | `0 20px` |
| bg | `transparent` |
| color | `var(--shell-fg-1)` → `#E6EDF3` |
| border | `1px solid var(--shell-border-2)` → `#2A3645` |
| border-radius | `6px` |
| font | `14px / 500` |
| gap | `8px` |
| hover bg | `var(--shell-surface)` → `#131A23` |
| hover border | `var(--shell-fg-3)` → `#6E7A87` |

---

## 7. Verbatim source (drop-in reference)

```css
/* Global — studio.css:60 */
button { font-family: inherit; cursor: pointer; }

/* Buttons — studio.css:383–402 */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px;
  height: 34px; padding: 0 12px;
  border-radius: 6px;
  font-size: 13px; font-weight: 500;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: background 0.08s, border-color 0.08s, color 0.08s;
}
.btn svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.btn-primary { background: var(--canvas-fg-1); color: #fff; }
.btn-primary:hover { background: #1E293B; }
.btn-accent { background: var(--accent-cyan-deep); color: #fff; }
.btn-accent:hover { background: var(--accent-cyan-2); color: #fff; }
.btn-ghost { background: transparent; color: var(--canvas-fg-2); border-color: var(--canvas-bd); }
.btn-ghost:hover { background: var(--canvas-bg-2); color: var(--canvas-fg-1); border-color: var(--canvas-bd-2); }
.btn-icon { width: 34px; padding: 0; }
.btn-sm { height: 28px; padding: 0 10px; font-size: 12px; }

/* Workspace-dialog override — studio.css:1095–1100 */
.ws-dialog-actions .btn {
  background: var(--shell-surface);
  border: 1px solid var(--shell-border);
  color: var(--shell-fg-1);
}
.ws-dialog-actions .btn:hover { border-color: var(--shell-border-2); background: var(--shell-surface-2); }

/* Hero buttons — studio.css:1200–1215 */
.btn-hero {
  height: 44px; padding: 0 20px;
  background: var(--accent-cyan); color: #0B0F14;
  border-radius: 6px; font-weight: 600; font-size: 14px;
  display: inline-flex; align-items: center; gap: 8px;
}
.btn-hero:hover { background: #67E8F9; }
.btn-hero-alt {
  height: 44px; padding: 0 20px;
  background: transparent;
  color: var(--shell-fg-1);
  border: 1px solid var(--shell-border-2);
  border-radius: 6px; font-weight: 500; font-size: 14px;
  display: inline-flex; align-items: center; gap: 8px;
}
.btn-hero-alt:hover { background: var(--shell-surface); border-color: var(--shell-fg-3); }

/* Dark-canvas primary override — studio.css:1376–1378 */
body.dark-canvas .btn-primary { background: var(--accent-cyan); color: #0B0F14; }
body.dark-canvas .btn-primary:hover { background: var(--accent-cyan-2); color: #0B0F14; }
body.dark-canvas .btn-primary svg { color: #0B0F14; }
```

---

## 8. Usage rules

- **`.btn-primary` is the workhorse.** Slate-black in light, bright accent (Amber by default) in dark. Use it for the dominant action in any region.
- **`.btn-accent` is the brand-color CTA.** Reserve for explicitly branded moments (e.g. "Run pipeline", "Save & deploy") — the saturated `--accent-cyan-deep` (amber-700 by default) is a step *louder* than primary in light mode.
- **The Accent tweak retints all `--accent-cyan*`-driven surfaces live.** Default Amber renders amber buttons. Cyan/Violet/Emerald are also valid; spec values above hold structurally, only the resolved hex changes per the table in §0.
- **`.btn-ghost` for everything secondary** — toolbar items, row actions, dialog cancels. Combine with `.btn-sm` for compact rails and `.btn-icon` for icon-only. Ghost does NOT follow the accent tweak — it stays neutral.
- **No `failure` / `success` / `outline` / `alternative` / `light` / `dark` variants exist.** Destructive actions in the source use ad-hoc styling (e.g. `.cfg-pane-title.danger` for red text). Don't invent variants without explicit direction.
- **Dialog buttons inside `.ws-dialog-actions`** auto-restyle to shell-surface — no extra class needed. They do NOT follow the accent tweak.
- **Hero buttons stay in the hero.** `.btn-hero` / `.btn-hero-alt` are not part of the general button system. `.btn-hero` follows the accent tweak; its hover (`#67E8F9`) is currently hardcoded cyan and will mismatch under non-Cyan accents — see §6.1.
- **No transform/scale/bounce animations.** Only `background`, `border-color`, `color` transition at `0.08s`. Match this restraint when adding new states.
