# Context Studio — Slate + Amber color reference

This document is a faithful reference of every color shown in **`Context Studio.html`** under its default settings (`shellTone: 'slate'`, `accent: 'amber'`). It is intended for replicating the design in production code — every value here matches what is rendered in the prototype right now.

The shell ramp and canvas ramp are both on a single navy/slate palette. The chrome (sidebar, topbar, etc.) is the deeper end; the canvas in dark mode tucks slightly below the deepest chrome tone, and cards on the canvas rise up to chrome elevation tiers.

---

## 1. Default tweak values (`app.jsx`)

```js
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "amber",
  "shellTone": "slate",
  "darkCanvas": false,
  "windowChrome": true,
  "showStatusBar": true,
  "monoIds": true
}/*EDITMODE-END*/;
```

`useTweaks(TWEAK_DEFAULTS)` resolves these on mount and writes the runtime overrides described in sections 3–4. If you are reimplementing without `tweaks-panel.jsx`, just hard-code the resolved values directly on `:root` (see section 8).

---

## 2. Token → Component map

Every CSS custom property in the prototype, what it paints, and the exact color it resolves to in the live render. Variable names come from `styles/studio.css` (`:root` block) and are overridden at runtime by `app.jsx` for shell/accent and at CSS-class level by `body.dark-canvas` for canvas.

### Shell (chrome) — paints the same in light and dark mode

The shell does not change when `darkCanvas` is toggled. The slate runtime branch in `app.jsx` overrides all six shell tone vars so the chrome ramp is monotonic on a single navy hue.

| Variable | Used by | Resolves to | Source |
|---|---|---|---|
| `--shell-bg` | `body` background, `.app-shell` background, `.workspace` (light mode), `.desktop-frame`, command-palette `.palette-kind` chip, `ws-row-mark`, landing-page hero | `#0F1729` `rgb(15, 23, 41)` | `app.jsx` slate branch |
| `--shell-bg-2` | **Sidebar** (`.shell-rail`), **topbar** (`.topbar`), statusbar (`.statusbar`), command-palette dialog (`.palette`), workspace-switcher dialog (`.ws-dialog`), `.workspace` (dark mode) | `#13203A` `rgb(19, 32, 58)` | `app.jsx` slate branch |
| `--shell-surface` | Sidebar collapse button, nav-item hover/active, rail-user hover, topbar icon hover, ws-chip, command-palette item hover, ws-row hover/current, feature cards on landing | `#1B2949` `rgb(27, 41, 73)` | `app.jsx` slate branch |
| `--shell-surface-2` | Rail-collapse hover, ws-chip hover, ws-dialog action hover | `#243763` `rgb(36, 55, 99)` | `app.jsx` slate branch |
| `--shell-border` | Sidebar right border, topbar bottom border, dividers, nav-section divider, palette borders, statusbar top border | `#1E2A44` `rgb(30, 42, 68)` | `app.jsx` slate branch |
| `--shell-border-2` | Topbar search input border, kbd border, palette outer border, ws-dialog outer border, ws-row.current border | `#2A3A5C` `rgb(42, 58, 92)` | `app.jsx` slate branch |
| `--shell-fg-1` | Primary chrome text — brand name, active nav item, breadcrumb (last), topbar input text, rail-user name | `#E6EDF3` `rgb(230, 237, 243)` | `:root` |
| `--shell-fg-2` | Nav-item label, breadcrumb (non-last), statusbar item | `#A6B1BD` `rgb(166, 177, 189)` | `:root` |
| `--shell-fg-3` | Nav count, rail-user email, topbar icon (default), section labels, kbd shortcut | `#6E7A87` `rgb(110, 122, 135)` | `:root` |
| `--shell-fg-4` | Disabled chrome text, breadcrumb separator, very muted icons | `#4A5563` `rgb(74, 85, 99)` | `:root` |

### Canvas (work surface) — flips with `darkCanvas`

Canvas variables are declared in `:root` (light mode) and redeclared inside `body.dark-canvas { … }` (dark mode). Same names; different values.

| Variable | Used by | Light mode | Dark mode |
|---|---|---|---|
| `--canvas-bg` | `.canvas-area` (the page background users actually read); pipeline-flow gradient top stop in dark mode | `#FFFFFF` `rgb(255, 255, 255)` | `#0B1426` `rgb(11, 20, 38)` |
| `--canvas-bg-2` | Table headers, table row hover, ID tags, filter-bar, hover-elevated insets, qa-icon/config-tile icon backplate, pipeline-card-foot, flow-node icon backplate | `#F7F9FB` `rgb(247, 249, 251)` | `#13203A` `rgb(19, 32, 58)` |
| `--canvas-card` | All cards — `.panel`, `.stat`, `.kg-node`, `.qa`, `.config-tile`, `.drawer`, `.pipeline-card`, `.flow-node`, `.input`, pager button; pipeline-flow gradient bottom stop in dark mode | `#FFFFFF` `rgb(255, 255, 255)` | `#1B2949` `rgb(27, 41, 73)` |
| `--canvas-bd` | Card border, table cell border, filter-bar border, pipeline-card-foot top border, drawer border, panel border | `#E5E9EE` `rgb(229, 233, 238)` | `#243763` `rgb(36, 55, 99)` |
| `--canvas-bd-2` | Input border, hover-elevated card border, flow-arrow, scrollbar thumb | `#D6DCE3` `rgb(214, 220, 227)` | `#354973` `rgb(53, 73, 115)` |
| `--canvas-fg-1` | Page titles (h1), panel titles, table cell text, primary-button background (light), pager active background | `#0B1220` `rgb(11, 18, 32)` | `#E2E8F0` `rgb(226, 232, 240)` |
| `--canvas-fg-2` | Body text — subtitles, descriptions, qa-icon color, chip text, kv `<dd>` | `#475569` `rgb(71, 85, 105)` | `#94A3B8` `rgb(148, 163, 184)` |
| `--canvas-fg-3` | Muted text — table-header label, ID-tag text, .stat eyebrow, kv `<dt>`, .chip .dot, drawer captions | `#64748B` `rgb(100, 116, 139)` | `#64748B` `rgb(100, 116, 139)` |
| `--canvas-fg-4` | Disabled / caret — kg-node caret, .activity-item .dot baseline | `#94A3B8` `rgb(148, 163, 184)` | `#475569` `rgb(71, 85, 105)` |

### Accent — paints in both modes; values from amber

The amber runtime branch in `app.jsx` writes these three properties. The variable names are historical (originally "cyan"); treat them as "accent-primary / accent-2 / accent-deep".

| Variable | Used by | Resolves to |
|---|---|---|
| `--accent-cyan` *(primary)* | Active nav indicator bar, dark-canvas primary-button bg, dark-canvas tab active underline, dark-canvas row-link, focus rings | `#FBBF24` `rgb(251, 191, 36)` |
| `--accent-cyan-2` | Accent button hover (`.btn-accent:hover`), activity-item update dot, chip.cyan dot | `#F59E0B` `rgb(245, 158, 11)` |
| `--accent-cyan-deep` | Primary accent button (`.btn-accent`), row-link (light mode), kg-node selected outline, ws-chip-dot | `#B45309` `rgb(180, 83, 9)` |

---

## 3. Slate shell tone — live `app.jsx` branch

The slate branch sets all six shell tone properties on a single navy ramp.

```js
// In the useEffect inside <App>, when tweaks.shellTone === 'slate':
root.style.setProperty('--shell-bg',        '#0F1729');
root.style.setProperty('--shell-bg-2',      '#13203A');
root.style.setProperty('--shell-surface',   '#1B2949');
root.style.setProperty('--shell-surface-2', '#243763');
root.style.setProperty('--shell-border',    '#1E2A44');
root.style.setProperty('--shell-border-2',  '#2A3A5C');
```

The text tokens (`--shell-fg-1` through `--shell-fg-4`) are not overridden — they keep their `:root` defaults, which read correctly on slate.

---

## 4. Amber accent — live `app.jsx` branch

```js
// In the useEffect inside <App>, when tweaks.accent === 'amber':
const a = { c1: '#FBBF24', c2: '#F59E0B', cd: '#B45309' };
root.style.setProperty('--accent-cyan',      a.c1);
root.style.setProperty('--accent-cyan-2',    a.c2);
root.style.setProperty('--accent-cyan-deep', a.cd);
```

---

## 5. Dark-canvas palette — live `studio.css` block

This block is in `styles/studio.css` around line 1357. All canvas tokens are on the same navy ramp as the chrome — the canvas tucks one step below the deepest chrome tone, and cards on the canvas rise to the chrome's hover-tier elevation.

```css
body.dark-canvas {
  --canvas-bg:    #0B1426;   /* canvas surface — darker than --shell-bg; sunken work area */
  --canvas-bg-2:  #13203A;   /* table headers / inset zones — matches --shell-bg-2 */
  --canvas-card:  #1B2949;   /* panels, stat tiles, drawer, pipeline-card — matches --shell-surface */
  --canvas-bd:    #243763;   /* card border (matches --shell-surface-2) */
  --canvas-bd-2:  #354973;   /* input border — one notch lighter than --shell-border-2 */
  --canvas-fg-1:  #E2E8F0;   /* primary  (slate-200) */
  --canvas-fg-2:  #94A3B8;   /* body     (slate-400) */
  --canvas-fg-3:  #64748B;   /* muted    (slate-500) */
  --canvas-fg-4:  #475569;   /* disabled (slate-600) */
}
```

The 6-step navy hierarchy from deepest to highest:

| Layer | Color | Used by |
|---|---|---|
| 1. Canvas page | `#0B1426` | `.canvas-area` |
| 2. Shell base | `#0F1729` | `.app-shell`, outer frame, `body` |
| 3. Chrome / canvas insets | `#13203A` | sidebar, topbar, statusbar, workspace gutter, table headers |
| 4. Chrome hover / canvas cards | `#1B2949` | nav hover, ws-chip, all canvas cards |
| 5. Elevated surfaces | `#243763` | rail-collapse hover, card border |
| 6. Input border | `#354973` | input affordances |

---

## 6. Dark-canvas topbar — no background override

The live `body.dark-canvas` block does **not** override `.topbar`'s background. The topbar uses `--shell-bg-2` (`#13203A`) in both light and dark mode — same as the sidebar. There used to be an override forcing the topbar to `--shell-bg`; it was removed because (a) it broke the visual continuity between sidebar and topbar, and (b) the canvas's top-left inner radius (`border-top-left-radius: 8px` on `.canvas-area`) reveals the topbar color through the corner cut, and the override made that cut invisible.

The only dark-canvas rules currently applied to the topbar are:

```css
body.dark-canvas .topbar-search input { background: rgba(0, 0, 0, 0.25); }
body.dark-canvas .topbar-ico:hover    { background: var(--shell-surface); }
```

When replicating, ensure no rule paints `.topbar { background }` under a dark-mode selector.

---

## 7. Dark-canvas workspace gutter

The radius cut on `.canvas-area` reveals the parent `.workspace`'s background. By default `.workspace` paints `--shell-bg` (the darkest token), which would make the cut blend into the outer frame. The live app overrides it in dark mode so the gutter matches the sidebar/topbar chrome:

```css
body.dark-canvas .workspace { background: var(--shell-bg-2); }
```

Without this rule the inner-radius notch disappears in dark mode. With it, sidebar + topbar + gutter all read as one continuous chrome surface, with the canvas tucked inside.

---

## 8. Replication recipe

If you are recreating this design in a new project without the `useTweaks` machinery, the simplest approach is to hard-code the resolved values on `:root` and `body.dark-canvas` directly in CSS. The complete declaration:

```css
:root {
  /* Shell — slate (from app.jsx slate branch + :root fg defaults) */
  --shell-bg:        #0F1729;
  --shell-bg-2:      #13203A;
  --shell-surface:   #1B2949;
  --shell-surface-2: #243763;
  --shell-border:    #1E2A44;
  --shell-border-2:  #2A3A5C;
  --shell-fg-1: #E6EDF3;
  --shell-fg-2: #A6B1BD;
  --shell-fg-3: #6E7A87;
  --shell-fg-4: #4A5563;

  /* Canvas — light */
  --canvas-bg:   #FFFFFF;
  --canvas-bg-2: #F7F9FB;
  --canvas-card: #FFFFFF;
  --canvas-bd:   #E5E9EE;
  --canvas-bd-2: #D6DCE3;
  --canvas-fg-1: #0B1220;
  --canvas-fg-2: #475569;
  --canvas-fg-3: #64748B;
  --canvas-fg-4: #94A3B8;

  /* Accent — amber */
  --accent-cyan:      #FBBF24;
  --accent-cyan-2:    #F59E0B;
  --accent-cyan-deep: #B45309;
}

body.dark-canvas {
  --canvas-bg:   #0B1426;
  --canvas-bg-2: #13203A;
  --canvas-card: #1B2949;
  --canvas-bd:   #243763;
  --canvas-bd-2: #354973;
  --canvas-fg-1: #E2E8F0;
  --canvas-fg-2: #94A3B8;
  --canvas-fg-3: #64748B;
  --canvas-fg-4: #475569;
}

body.dark-canvas .workspace { background: var(--shell-bg-2); }
body.dark-canvas .topbar-search input { background: rgba(0, 0, 0, 0.25); }
body.dark-canvas .topbar-ico:hover    { background: var(--shell-surface); }

/* Pipeline-flow visual fades from canvas surface up into card elevation. */
body.dark-canvas .pipeline-card-flow {
  background: linear-gradient(180deg,
    var(--canvas-bg) 0%,
    var(--canvas-card) 100%);
}
```

Doing this also lets you delete the `accents` and `shellTone` branches from `app.jsx` and remove their `TweakRadio` entries — the only switch users still need is `darkCanvas`.

---

## Verification

Open `Context Studio.html`, eye-drop the live render, and confirm:

- [ ] Sidebar / topbar background = `#13203A` (`--shell-bg-2`).
- [ ] Outer frame and `body` background = `#0F1729` (`--shell-bg`).
- [ ] Nav-item hover background = `#1B2949` (`--shell-surface`).
- [ ] In light canvas: page background = `#FFFFFF`, table-header strip = `#F7F9FB`.
- [ ] In dark canvas: page background = `#0B1426`, cards = `#1B2949`.
- [ ] In dark canvas: the inner-radius corner at the top-left of the canvas is visible — `.workspace` shows `#13203A` through it.
- [ ] In dark canvas: topbar background unchanged from light mode (still `#13203A`).
- [ ] Primary accent buttons render in amber: `#FBBF24` family.

If any of these eye-drop to a different value, the live app has drifted from this doc.

---

## Change history

Three refinements have been applied in the live render and are reflected in the values above:

1. **Slate shell ramp expanded** — the `shellTone === 'slate'` branch in `app.jsx` was extended from 3 properties to all 6 so `--shell-surface-2`, `--shell-border`, and `--shell-border-2` are navy-toned (`#243763`, `#1E2A44`, `#2A3A5C`) instead of falling through to the deep-tone defaults.
2. **Dark canvas re-toned to slate** — the `body.dark-canvas` block in `styles/studio.css` was replaced with a navy ramp that mirrors the chrome (canvas `#0B1426` darker than chrome; insets, cards, and borders align with `--shell-bg-2 / --shell-surface / --shell-surface-2`).
3. **Pipeline-flow gradient softened in dark mode** — the `.pipeline-card-flow` gradient previously used `color-mix(in oklab, var(--canvas-bg) 60%, #000)` as its top stop, which read as near-black against the new canvas. Replaced with `var(--canvas-bg)` so the flow visual fades from the canvas surface (`#0B1426`) up into card elevation (`#1B2949`) without an artificial dark peak.
