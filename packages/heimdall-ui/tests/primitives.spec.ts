import { test, expect } from '@playwright/test'
import { freezeAnimations } from './utils/test-helpers'

test.describe('Primitive Components', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a page with all the necessary styles
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

          :root {
            --shell-bg: 11 15 20;
            --shell-surface: 26 31 38;
            --shell-fg-1: 255 255 255;
            --shell-fg-2: 209 213 219;
            --shell-fg-3: 156 163 175;

            --canvas-bg: 20 25 31;
            --canvas-surface: 27 34 42;
            --canvas-card: 31 38 48;
            --canvas-bg-2: 39 46 56;
            --canvas-fg-1: 249 250 251;
            --canvas-fg-2: 209 213 219;
            --canvas-fg-3: 156 163 175;
            --canvas-border: 55 65 81;
            --canvas-border-strong: 75 85 99;

            --accent-primary: 249 115 22;
            --accent-primary-hover: 234 88 12;
            --accent-primary-deep: 194 65 12;

            --status-ok: 34 197 94;
            --status-warn: 234 179 8;
            --status-error: 239 68 68;
            --status-emerald: 16 185 129;
            --status-amber: 245 158 11;
            --status-rose: 244 63 94;
            --status-violet: 139 92 246;

            --radius-sm: 4px;
            --radius-md: 6px;
            --radius-lg: 8px;
            --radius-xl: 12px;
            --radius-full: 9999px;

            --font-sans: 'Inter', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;

            --text-xs: 0.75rem;
            --text-sm: 0.875rem;
            --text-base: 1rem;
            --text-lg: 1.125rem;
            --text-xl: 1.25rem;

            --space-0_5: 0.125rem;
            --space-1: 0.25rem;
            --space-1_5: 0.375rem;
            --space-2: 0.5rem;
            --space-2_5: 0.625rem;
            --space-3: 0.75rem;
            --space-4: 1rem;
            --space-5: 1.25rem;
            --space-6: 1.5rem;
            --space-8: 2rem;
          }

          html {
            font-family: var(--font-sans);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          body {
            margin: 0;
            padding: 22px 28px;
            background-color: rgb(var(--canvas-bg));
            color: rgb(var(--canvas-fg-1));
            font-size: 1rem;
          }

          .label {
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgb(var(--canvas-fg-3));
            margin-bottom: 14px;
          }

          .meta {
            font-family: var(--font-mono);
            font-size: 10.5px;
            color: rgb(var(--canvas-fg-3));
            margin-bottom: 6px;
          }

          .row {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 14px;
          }

          @keyframes badge-pulse {
            0% {
              transform: scale(0.6);
              opacity: 0.5;
            }
            100% {
              transform: scale(1.4);
              opacity: 0;
            }
          }

          /* Button styles */
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: var(--radius-md);
            font-family: var(--font-sans);
            font-weight: 500;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 80ms ease-out;
            outline: none;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn:focus-visible {
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.13);
          }

          .btn--sm {
            height: 28px;
            padding: 0 10px;
            font-size: var(--text-xs);
          }

          .btn--md {
            height: 34px;
            padding: 0 12px;
            font-size: var(--text-sm);
          }

          .btn--primary {
            background-color: rgb(var(--accent-primary));
            color: white;
          }

          .btn--primary:not(:disabled):hover {
            background-color: rgb(var(--accent-primary-hover));
          }

          .btn--primary:not(:disabled):active {
            background-color: rgb(var(--accent-primary-deep));
          }

          .btn--secondary {
            background-color: rgb(var(--canvas-surface));
            color: rgb(var(--canvas-fg-1));
            border-color: rgb(var(--canvas-border));
          }

          .btn--secondary:not(:disabled):hover {
            background-color: rgb(var(--canvas-card));
          }

          .btn--ghost {
            background-color: transparent;
            color: rgb(var(--canvas-fg-2));
            border-color: rgb(var(--canvas-border));
          }

          .btn--ghost:not(:disabled):hover {
            background-color: rgb(var(--canvas-surface));
          }

          .btn--danger {
            background-color: rgb(var(--status-rose));
            color: white;
          }

          /* Chip styles */
          .chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
            border: 1px solid;
            border-radius: var(--radius-sm);
            padding: 2px 7px;
          }

          .chip__dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 9999px;
          }

          .chip--cyan {
            color: #0e7490;
            background-color: #ecfeff;
            border-color: #a5f3fc;
          }

          .chip--cyan .chip__dot {
            background-color: #06b6d4;
          }

          .chip--amber {
            color: #92400e;
            background-color: #fffbeb;
            border-color: #fde68a;
          }

          .chip--amber .chip__dot {
            background-color: #f59e0b;
          }

          .chip--violet {
            color: #5b21b6;
            background-color: #f5f3ff;
            border-color: #ddd6fe;
          }

          .chip--violet .chip__dot {
            background-color: #a78bfa;
          }

          .chip--emerald {
            color: #065f46;
            background-color: #ecfdf5;
            border-color: #a7f3d0;
          }

          .chip--emerald .chip__dot {
            background-color: #10b981;
          }

          .chip--rose {
            color: #9f1239;
            background-color: #fff1f2;
            border-color: #fecdd3;
          }

          .chip--rose .chip__dot {
            background-color: #f43f5e;
          }

          .chip--neutral {
            color: #475569;
            background-color: #f7f9fb;
            border-color: #e5e9ee;
          }

          .chip--neutral .chip__dot {
            background-color: #94a3b8;
          }

          .chip--id-tag {
            color: #64748b;
            background-color: #f7f9fb;
            border-color: #e5e9ee;
          }

          .chip--version {
            font-size: 10.5px;
            color: #0e7ea3;
            background-color: rgba(34, 211, 238, 0.08);
            border-color: rgba(34, 211, 238, 0.18);
            padding: 1px 7px;
            border-radius: 9999px;
          }

          .chip--env {
            color: #22d3ee;
            background-color: rgba(34, 211, 238, 0.12);
            border-color: rgba(34, 211, 238, 0.28);
            padding: 3px 8px;
            border-radius: var(--radius-md);
            gap: 6px;
          }

          .chip--env .chip__dot {
            background-color: #22d3ee;
          }

          /* Icon styles */
          svg {
            display: inline-block;
            vertical-align: -0.125em;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
      </body>
      </html>
    `)
  })

  test('Icon component renders correctly', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 22px; background: rgb(20 25 31); }
          .icons { display: flex; gap: 20px; flex-wrap: wrap; }
          .icon-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
          svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 1.75; }
        </style>
      </head>
      <body>
        <div class="icons">
          <div class="icon-wrap">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div class="icon-wrap">
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('icon.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Button component - primary variant', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --accent-primary: 249 115 22;
            --accent-primary-hover: 234 88 12;
            --accent-primary-deep: 194 65 12;
            --canvas-bg: 20 25 31;
            --font-sans: Inter, sans-serif;
            --radius-md: 6px;
            --text-sm: 0.875rem;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            height: 34px;
            padding: 0 12px;
            border-radius: var(--radius-md);
            font-family: var(--font-sans);
            font-weight: 500;
            font-size: var(--text-sm);
            border: 1px solid transparent;
            cursor: pointer;
            background-color: rgb(var(--accent-primary));
            color: white;
          }
          .btn:hover {
            background-color: rgb(var(--accent-primary-hover));
          }
        </style>
      </head>
      <body>
        <button class="btn">Primary Button</button>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('button-primary.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Button component - all variants', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --accent-primary: 249 115 22;
            --canvas-fg-1: 249 250 251;
            --canvas-fg-2: 209 213 219;
            --canvas-surface: 27 34 42;
            --canvas-card: 31 38 48;
            --canvas-bg: 20 25 31;
            --canvas-border: 55 65 81;
            --status-rose: 244 63 94;
            --font-sans: Inter, sans-serif;
            --radius-md: 6px;
            --text-sm: 0.875rem;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; gap: 10px; margin-bottom: 14px; }
          .btn {
            display: inline-flex;
            align-items: center;
            height: 34px;
            padding: 0 12px;
            border-radius: var(--radius-md);
            font-family: var(--font-sans);
            font-weight: 500;
            font-size: var(--text-sm);
            border: 1px solid transparent;
            cursor: pointer;
          }
          .btn--primary { background-color: rgb(var(--accent-primary)); color: white; }
          .btn--secondary { background-color: rgb(var(--canvas-surface)); color: rgb(var(--canvas-fg-1)); border-color: rgb(var(--canvas-border)); }
          .btn--ghost { background-color: transparent; color: rgb(var(--canvas-fg-2)); border-color: rgb(var(--canvas-border)); }
          .btn--danger { background-color: rgb(var(--status-rose)); color: white; }
        </style>
      </head>
      <body>
        <div class="row">
          <button class="btn btn--primary">Primary</button>
          <button class="btn btn--secondary">Secondary</button>
          <button class="btn btn--ghost">Ghost</button>
          <button class="btn btn--danger">Danger</button>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('button-variants.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Chip component - semantic color variants', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --canvas-bg: 20 25 31;
            --canvas-fg-3: 156 163 175;
            --font-mono: 'JetBrains Mono', monospace;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgb(var(--canvas-fg-3)); margin-bottom: 14px; }
          .row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
          .chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 500;
            border: 1px solid;
            border-radius: 4px;
            padding: 2px 7px;
          }
          .chip__dot { width: 6px; height: 6px; border-radius: 999px; display: inline-block; }
          .chip--cyan { color: #0e7490; background-color: #ecfeff; border-color: #a5f3fc; }
          .chip--cyan .chip__dot { background-color: #06b6d4; }
          .chip--amber { color: #92400e; background-color: #fffbeb; border-color: #fde68a; }
          .chip--amber .chip__dot { background-color: #f59e0b; }
          .chip--violet { color: #5b21b6; background-color: #f5f3ff; border-color: #ddd6fe; }
          .chip--violet .chip__dot { background-color: #a78bfa; }
          .chip--emerald { color: #065f46; background-color: #ecfdf5; border-color: #a7f3d0; }
          .chip--emerald .chip__dot { background-color: #10b981; }
          .chip--rose { color: #9f1239; background-color: #fff1f2; border-color: #fecdd3; }
          .chip--rose .chip__dot { background-color: #f43f5e; }
          .chip--neutral { color: #475569; background-color: #f7f9fb; border-color: #e5e9ee; }
          .chip--neutral .chip__dot { background-color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="label">Chips · semantic tints</div>
        <div class="row">
          <span class="chip chip--cyan"><span class="chip__dot"></span>cyan</span>
          <span class="chip chip--amber"><span class="chip__dot"></span>amber</span>
          <span class="chip chip--violet"><span class="chip__dot"></span>violet</span>
          <span class="chip chip--emerald"><span class="chip__dot"></span>emerald</span>
          <span class="chip chip--rose"><span class="chip__dot"></span>rose</span>
          <span class="chip chip--neutral"><span class="chip__dot"></span>gray</span>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('chip-variants.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Chip component - tag forms', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --canvas-bg: 20 25 31;
            --canvas-fg-3: 156 163 175;
            --font-mono: 'JetBrains Mono', monospace;
            --radius-md: 6px;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgb(var(--canvas-fg-3)); margin-bottom: 14px; }
          .row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
          .chip {
            display: inline-flex;
            align-items: center;
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 500;
            border: 1px solid;
            border-radius: 4px;
            padding: 2px 7px;
          }
          .chip__dot { width: 6px; height: 6px; border-radius: 999px; display: inline-block; margin-right: 6px; }
          .chip--id-tag { color: #64748b; background-color: #f7f9fb; border-color: #e5e9ee; }
          .chip--version { font-size: 10.5px; color: #0e7ea3; background-color: rgba(34, 211, 238, 0.08); border-color: rgba(34, 211, 238, 0.18); padding: 1px 7px; border-radius: 9999px; }
          .chip--env { color: #22d3ee; background-color: rgba(34, 211, 238, 0.12); border-color: rgba(34, 211, 238, 0.28); padding: 3px 8px; border-radius: var(--radius-md); gap: 6px; }
          .chip--env .chip__dot { background-color: #22d3ee; }
        </style>
      </head>
      <body>
        <div class="label">Pills & inline tags</div>
        <div class="row">
          <span class="chip chip--env"><span class="chip__dot"></span>production</span>
          <span class="chip chip--version">v1.4.2</span>
          <span class="chip chip--id-tag">cls_4f3a7e</span>
          <span class="chip chip--id-tag">pipeline_run_812</span>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('chip-tags.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Badge component - status dots', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          :root {
            --canvas-bg: 20 25 31;
            --font-sans: Inter, sans-serif;
          }
          @keyframes badge-pulse {
            0% { transform: scale(0.6); opacity: 0.5; }
            100% { transform: scale(1.4); opacity: 0; }
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; gap: 20px; align-items: center; }
          .badge { display: inline-block; width: 8px; height: 8px; border-radius: 9999px; }
          .badge--cyan { background-color: #22d3ee; }
          .badge--emerald { background-color: #10b981; }
          .badge--amber { background-color: #f59e0b; }
          .badge--rose { background-color: #f43f5e; }
          .badge--violet { background-color: #a78bfa; }
          .badge--pulse { animation: badge-pulse 1.6s ease-out infinite; }
        </style>
      </head>
      <body>
        <div class="row">
          <div class="badge badge--cyan"></div>
          <div class="badge badge--emerald"></div>
          <div class="badge badge--amber"></div>
          <div class="badge badge--rose"></div>
          <div class="badge badge--violet"></div>
          <div class="badge badge--cyan badge--pulse"></div>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('badge-dots.png', {
      maxDiffPixelRatio: 0.1,
    })
  })
})
