# handoff: Slate shell + Amber accent

This document captures every change required for the implementation team to ship **Slate** as the default shell tone and **Amber** as the default accent, with the dark canvas treatment integrated cleanly. It consolidates the navy palette work, the dark-canvas topbar fix, and the inner-radius gutter fix into one set of edits.

Every change is keyed to a file in this repo so it can be applied without re-reading the chat.

---

## 1. Default values in `app.jsx`

The `TWEAK_DEFAULTS` block already sets `accent: "amber"` and `shellTone: "slate"`. Make sure these are not regressed in production. The `EDITMODE` markers can stay — they are inert at runtime.

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

If the production app does not load `tweaks-panel.jsx` (no user-facing knobs), drop the markers and the `useTweaks` call entirely — just hard-code the variable assignments in section 2 directly on `:root` in `tokens.css` or `studio.css`.

---

## 2. Slate shell tone — token values

The `shellTone === 'slate'` branch in `app.jsx` currently sets **three** variables. It needs to set **eight** so the entire chrome ramp moves together. Replace the slate branch with:

```js
if (tweaks.shellTone === 'slate') {
  root.style.setProperty('--shell-bg',        '#0F1729');
  root.style.setProperty('--shell-bg-2',      '#13203A');
  root.style.setProperty('--shell-surface',   '#1B2949');
  root.style.setProperty('--shell-surface-2', '#243763');
  root.style.setProperty('--shell-border',    '#1E2A44');
  root.style.setProperty('--shell-border-2',  '#2A3A5C');
}
```

If slate is the only shell tone shipping (no runtime switching), move these values to `:root` in `styles/studio.css` and delete the JS branch entirely.

| Variable | Value | Role |
|---|---|---|
| `--shell-bg` | `#0F1729` | deepest — outer frame, rail bg |
| `--shell-bg-2` | `#13203A` | topbar, sidebar inner, **workspace gutter behind canvas** |
| `--shell-surface` | `#1B2949` | cards, hover surfaces |
| `--shell-surface-2` | `#243763` | elevated hover, focused row |
| `--shell-border` | `#1E2A44` | card / divider border |
| `--shell-border-2` | `#2A3A5C` | input border, scrollbar thumb |

`--shell-fg-1..4` already work on slate — do not change them.

---

## 3. Amber accent — token values

The `accent === 'amber'` branch in `app.jsx` is correct. For reference:

```js
amber: { c1: '#FBBF24', c2: '#F59E0B', cd: '#B45309' },
```

Sets:
- `--accent-cyan`      → `#FBBF24` (the var name is historical; treat as "accent-primary")
- `--accent-cyan-2`    → `#F59E0B`
- `--accent-cyan-deep` → `#B45309`

If you want to rename the CSS custom properties to `--accent-1/--accent-2/--accent-deep` at the same time, do a global rename — there are ~40 references across `styles/`. Not required.

---

## 4. Dark-canvas palette — re-tone for slate

The current `body.dark-canvas` block in `studio.css` (around line 1357) uses **inkwell**-toned canvas colors (`#14191F`, `#1B222A`). They look fine over the inkwell shell but read as a green-gray island when sitting inside the slate shell. Replace the block's canvas tokens with slate-toned values so the canvas reads as part of the navy system:

```css
body.dark-canvas {
  --canvas-bg:    #14203A;   /* navy work surface — sits one notch above --shell-bg-2 */
  --canvas-bg-2:  #1B2949;   /* table-header / inset zones */
  --canvas-card:  #1B2949;   /* panels, stat tiles, drawer, pipeline-card */
  --canvas-bd:    #243763;
  --canvas-bd-2:  #2F4476;
  --canvas-fg-1:  #E2E8F0;   /* primary  (slate-200) */
  --canvas-fg-2:  #94A3B8;   /* body     (slate-400) */
  --canvas-fg-3:  #64748B;   /* muted    (slate-500) */
  --canvas-fg-4:  #475569;   /* disabled (slate-600) */
}
```

The fg ramp is Tailwind slate 200→600, which is what the earlier color table specified.

---

## 5. Dark-canvas topbar — do **not** override its background

Around line 1430 in `styles/studio.css` there used to be:

```css
body.dark-canvas .topbar { background: var(--shell-bg); }
```

**Delete that line if it ever returns.** In light mode the topbar uses `--shell-bg-2`; the dark-canvas mode must keep that tone for two reasons:

1. Visual continuity — the topbar should match the sidebar, not flatten to the outer frame.
2. The canvas's top-left inner radius (`border-top-left-radius: 8px` on `.canvas-area`) reveals the topbar color through the corner cut. If the topbar is forced to `--shell-bg`, the cut becomes invisible.

The remaining dark-canvas topbar rules are fine to keep:

```css
body.dark-canvas .topbar-search input { background: rgba(0, 0, 0, 0.25); }
body.dark-canvas .topbar-ico:hover    { background: var(--shell-surface); }
```

---

## 6. Dark-canvas workspace gutter — paint the canvas parent

The radius cut on `.canvas-area` reveals **the parent** (`.workspace`) background. In dark mode `.workspace` was inheriting from `.app-shell` (which paints `--shell-bg`, the darkest token), so the cut blended into the outer frame and was barely visible. Add this rule to `studio.css` so the gutter behind the canvas matches the sidebar/topbar chrome:

```css
/* Make the inner-radius gutter behind .canvas-area match the surrounding
   chrome (sidebar + topbar both use --shell-bg-2). Without this the radius
   cut reveals the darker --shell-bg behind it and reads as a near-invisible
   notch in dark mode. */
body.dark-canvas .workspace { background: var(--shell-bg-2); }
```

Place it in the dark-canvas section near the other `body.dark-canvas .topbar*` rules.

---

## 7. Optional: lock these as the only defaults

If the team wants to remove the runtime shell-tone / accent switcher entirely:

1. Delete the `accents` object and the `if (tweaks.shellTone === ...)` branches from `app.jsx`.
2. Move the slate values from section 2 and the amber values from section 3 directly into `:root` in `styles/tokens.css` (or `styles/studio.css`).
3. Delete the corresponding `TweakRadio` entries from the Tweaks panel.
4. Keep the `darkCanvas` toggle — it's the only switch end users should still see.

---

## Verification checklist

After applying:

- [ ] App loads with navy chrome and amber accent without any user interaction.
- [ ] Dark canvas toggle flips the work surface to navy without changing the chrome tone.
- [ ] Top-left inner radius of the canvas is clearly visible in both light and dark canvas modes.
- [ ] Topbar background matches sidebar background in both modes.
- [ ] No green/gray "island" effect on the canvas when dark mode is on — the canvas reads as a slightly-elevated navy surface inside the navy shell.

---

## Files touched

| File | What changes |
|---|---|
| `app.jsx` | `TWEAK_DEFAULTS` already correct; **expand** the slate branch to set 6 vars instead of 3 |
| `styles/studio.css` | Re-tone `body.dark-canvas { … }` canvas tokens to slate; remove any `body.dark-canvas .topbar { background: var(--shell-bg) }` rule; add `body.dark-canvas .workspace { background: var(--shell-bg-2) }` |
| `styles/tokens.css` | No required changes (only relevant if locking defaults at the CSS layer per section 7) |
