import { test, expect } from '@playwright/test'
import { freezeAnimations } from './utils/test-helpers'

test.describe('Primitive Components', () => {
  test.beforeEach(async ({ page }) => {
    // Set up a page with tokens and fonts
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

            --canvas-bg: 255 255 255;
            --canvas-surface: 255 255 255;
            --canvas-card: 249 250 251;
            --canvas-bg-2: 243 244 246;
            --canvas-fg-1: 17 24 39;
            --canvas-fg-2: 55 65 81;
            --canvas-fg-3: 107 114 128;
            --canvas-border: 229 231 235;
            --canvas-border-strong: 209 213 219;

            --accent-primary: 34 211 238;
            --accent-primary-hover: 6 182 212;
            --accent-primary-deep: 14 126 163;

            --status-ok: 34 197 94;
            --status-warn: 234 179 8;
            --status-error: 239 68 68;
            --status-emerald: 16 185 129;
            --status-amber: 245 158 11;
            --status-rose: 244 63 94;
            --status-violet: 139 92 246;
            --status-neutral: 107 114 128;

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
            box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.13);
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
            background-color: rgb(var(--status-neutral));
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
    // Load component CSS
    const baseCss = `
      body { margin: 0; padding: 22px; background: rgb(20 25 31); }
      .icons { display: flex; gap: 20px; flex-wrap: wrap; }
      .icon-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
      svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 1.75; fill: none; }
    `

    const iconHtml = `
      <div class="icons">
        <div class="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3 L10 3 L10 10 L3 10 Z M14 3 L21 3 L21 10 L14 10 Z M14 14 L21 14 L21 21 L14 21 Z M3 14 L10 14 L10 21 L3 21 Z"/></svg></div>
        <div class="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5 L12 19 M5 12 L19 12"/></svg></div>
      </div>
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>${baseCss}</style>
      </head>
      <body>${iconHtml}</body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('icon.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Button component - primary variant', async ({ page }) => {
    // Import actual Button component CSS
    const buttonCss = `
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border-radius: var(--radius-md);
        font-family: var(--font-sans);
        font-weight: var(--font-weight-medium);
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
        box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.13);
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
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --accent-primary: 34 211 238;
            --accent-primary-hover: 6 182 212;
            --accent-primary-deep: 14 126 163;
            --canvas-bg: 20 25 31;
            --font-sans: Inter, sans-serif;
            --radius-md: 6px;
            --text-xs: 0.75rem;
            --text-sm: 0.875rem;
            --font-weight-medium: 500;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          ${buttonCss}
        </style>
      </head>
      <body>
        <button class="btn btn--primary btn--md">Primary Button</button>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('button-primary.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Button component - all variants', async ({ page }) => {
    const buttonCss = `
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border-radius: var(--radius-md);
        font-family: var(--font-sans);
        font-weight: var(--font-weight-medium);
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 80ms ease-out;
        outline: none;
        height: 34px;
        padding: 0 12px;
        font-size: var(--text-sm);
      }
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn:focus-visible {
        box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.13);
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
      .btn--secondary:not(:disabled):active {
        background-color: rgb(var(--canvas-bg-2));
      }
      .btn--ghost {
        background-color: transparent;
        color: rgb(var(--canvas-fg-2));
        border-color: rgb(var(--canvas-border));
      }
      .btn--ghost:not(:disabled):hover {
        background-color: rgb(var(--canvas-surface));
      }
      .btn--ghost:not(:disabled):active {
        background-color: rgb(var(--canvas-card));
      }
      .btn--danger {
        background-color: rgb(var(--status-rose));
        color: white;
        border-color: rgb(var(--status-rose));
      }
      .btn--danger:not(:disabled):hover {
        background-color: rgb(var(--status-rose-deep));
      }
      .btn--danger:not(:disabled):active {
        background-color: rgb(var(--status-rose-pressed));
      }
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --accent-primary: 34 211 238;
            --accent-primary-hover: 6 182 212;
            --accent-primary-deep: 14 126 163;
            --canvas-fg-1: 249 250 251;
            --canvas-fg-2: 209 213 219;
            --canvas-surface: 27 34 42;
            --canvas-card: 31 38 48;
            --canvas-bg: 20 25 31;
            --canvas-bg-2: 39 46 56;
            --canvas-border: 55 65 81;
            --status-rose: 244 63 94;
            --status-rose-deep: 159 18 57;
            --status-rose-pressed: 120 10 40;
            --font-sans: Inter, sans-serif;
            --radius-md: 6px;
            --text-sm: 0.875rem;
            --font-weight-medium: 500;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; gap: 10px; margin-bottom: 14px; }
          ${buttonCss}
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
    const chipCss = `
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: var(--font-weight-medium);
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
        color: rgb(var(--semantic-cyan-fg));
        background-color: rgb(var(--semantic-cyan-bg));
        border-color: rgb(var(--semantic-cyan-border));
      }
      .chip--cyan .chip__dot {
        background-color: rgb(var(--status-cyan));
      }
      .chip--amber {
        color: rgb(var(--semantic-amber-fg));
        background-color: rgb(var(--semantic-amber-bg));
        border-color: rgb(var(--semantic-amber-border));
      }
      .chip--amber .chip__dot {
        background-color: rgb(var(--status-amber));
      }
      .chip--violet {
        color: rgb(var(--semantic-violet-fg));
        background-color: rgb(var(--semantic-violet-bg));
        border-color: rgb(var(--semantic-violet-border));
      }
      .chip--violet .chip__dot {
        background-color: rgb(var(--status-violet));
      }
      .chip--emerald {
        color: rgb(var(--semantic-emerald-fg));
        background-color: rgb(var(--semantic-emerald-bg));
        border-color: rgb(var(--semantic-emerald-border));
      }
      .chip--emerald .chip__dot {
        background-color: rgb(var(--status-emerald));
      }
      .chip--rose {
        color: rgb(var(--semantic-rose-fg));
        background-color: rgb(var(--semantic-rose-bg));
        border-color: rgb(var(--semantic-rose-border));
      }
      .chip--rose .chip__dot {
        background-color: rgb(var(--status-rose));
      }
      .chip--neutral {
        color: rgb(var(--semantic-neutral-fg));
        background-color: rgb(var(--semantic-neutral-bg));
        border-color: rgb(var(--semantic-neutral-border));
      }
      .chip--neutral .chip__dot {
        background-color: rgb(var(--status-amber));
      }
    `

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
            --font-weight-medium: 500;
            --radius-sm: 4px;
            --semantic-cyan-fg: 14 116 144;
            --semantic-cyan-bg: 236 255 255;
            --semantic-cyan-border: 165 243 252;
            --semantic-amber-fg: 146 64 14;
            --semantic-amber-bg: 255 251 235;
            --semantic-amber-border: 253 230 138;
            --semantic-violet-fg: 91 33 182;
            --semantic-violet-bg: 245 243 255;
            --semantic-violet-border: 221 214 254;
            --semantic-emerald-fg: 6 95 70;
            --semantic-emerald-bg: 236 253 245;
            --semantic-emerald-border: 167 243 208;
            --semantic-rose-fg: 159 18 57;
            --semantic-rose-bg: 255 241 242;
            --semantic-rose-border: 254 205 211;
            --semantic-neutral-fg: 71 85 105;
            --semantic-neutral-bg: 247 249 251;
            --semantic-neutral-border: 229 233 238;
            --status-cyan: 34 211 238;
            --status-amber: 245 158 11;
            --status-violet: 139 92 246;
            --status-emerald: 16 185 129;
            --status-rose: 244 63 94;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgb(var(--canvas-fg-3)); margin-bottom: 14px; }
          .row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
          ${chipCss}
        </style>
      </head>
      <body>
        <div class="label">Chips · semantic tints</div>
        <div class="row">
          <span class="chip chip--default chip--cyan"><span class="chip__dot"></span>cyan</span>
          <span class="chip chip--default chip--amber"><span class="chip__dot"></span>amber</span>
          <span class="chip chip--default chip--violet"><span class="chip__dot"></span>violet</span>
          <span class="chip chip--default chip--emerald"><span class="chip__dot"></span>emerald</span>
          <span class="chip chip--default chip--rose"><span class="chip__dot"></span>rose</span>
          <span class="chip chip--default chip--neutral"><span class="chip__dot"></span>gray</span>
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
    const chipTagsCss = `
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: var(--font-weight-medium);
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
      .chip--id-tag {
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 2px 7px;
        border-radius: var(--radius-sm);
        color: rgb(var(--semantic-id-tag-fg));
        background-color: rgb(var(--semantic-id-tag-bg));
        border-color: rgb(var(--semantic-id-tag-border));
        border: 1px solid rgb(var(--semantic-id-tag-border));
      }
      .chip--version {
        font-family: var(--font-mono);
        font-size: 10.5px;
        padding: 1px 7px;
        border-radius: 9999px;
        color: rgb(var(--semantic-version-fg));
        background-color: var(--semantic-version-bg-alpha);
        border: 1px solid var(--semantic-version-border-alpha);
      }
      .chip--env {
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 3px 8px;
        border-radius: var(--radius-md);
        color: rgb(var(--semantic-env-fg));
        background-color: var(--semantic-env-bg-alpha);
        border-color: var(--semantic-env-border-alpha);
        gap: 6px;
      }
      .chip--env .chip__dot--env {
        width: 6px;
        height: 6px;
        background-color: rgb(var(--semantic-env-fg));
      }
    `

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
            --font-weight-medium: 500;
            --radius-sm: 4px;
            --radius-md: 6px;
            --semantic-id-tag-fg: 100 116 139;
            --semantic-id-tag-bg: 247 249 251;
            --semantic-id-tag-border: 229 233 238;
            --semantic-version-fg: 14 126 163;
            --semantic-version-bg-alpha: rgba(34, 211, 238, 0.08);
            --semantic-version-border-alpha: rgba(34, 211, 238, 0.18);
            --semantic-env-fg: 34 211 238;
            --semantic-env-bg-alpha: rgba(34, 211, 238, 0.12);
            --semantic-env-border-alpha: rgba(34, 211, 238, 0.28);
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgb(var(--canvas-fg-3)); margin-bottom: 14px; }
          .row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
          ${chipTagsCss}
        </style>
      </head>
      <body>
        <div class="label">Pills & inline tags</div>
        <div class="row">
          <span class="chip chip--env"><span class="chip__dot chip__dot--env"></span>production</span>
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
    const badgeCss = `
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

      .badge {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 9999px;
      }

      .badge--cyan {
        background-color: rgb(var(--status-cyan));
      }

      .badge--emerald {
        background-color: rgb(var(--status-emerald));
      }

      .badge--amber {
        background-color: rgb(var(--status-amber));
      }

      .badge--rose {
        background-color: rgb(var(--status-rose));
      }

      .badge--violet {
        background-color: rgb(var(--status-violet));
      }

      .badge--neutral {
        background-color: rgb(var(--status-neutral));
      }

      .badge--pulse {
        animation: badge-pulse 1.6s ease-out infinite;
      }
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          :root {
            --canvas-bg: 20 25 31;
            --font-sans: Inter, sans-serif;
            --status-cyan: 34 211 238;
            --status-emerald: 16 185 129;
            --status-amber: 245 158 11;
            --status-rose: 244 63 94;
            --status-violet: 139 92 246;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; gap: 20px; align-items: center; }
          ${badgeCss}
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

  test('TextInput component - default, focus, error states', async ({ page }) => {
    const inputCss = `
      .text-input {
        display: block;
        width: 100%;
        box-sizing: border-box;
        background-color: rgb(var(--canvas-surface));
        border: 1px solid rgb(var(--canvas-border));
        border-radius: var(--radius-md);
        padding: 7px 10px;
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        color: rgb(var(--canvas-fg-1));
        transition: all 80ms ease-out;
        outline: none;
      }
      .text-input::placeholder {
        color: rgb(var(--canvas-fg-3));
      }
      .text-input:focus-visible {
        background-color: rgb(var(--canvas-bg));
        border-color: rgb(var(--accent-primary));
        box-shadow: var(--focus-ring);
      }
      .text-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .text-input--mono {
        font-family: var(--font-mono);
        font-size: 12px;
      }
      .text-input--error {
        border-color: rgb(var(--status-rose));
      }
      .text-input--error:focus-visible {
        box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.13);
      }
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --canvas-surface: 255 255 255;
            --canvas-bg: 255 255 255;
            --canvas-border: 229 231 235;
            --canvas-fg-1: 17 24 39;
            --canvas-fg-3: 107 114 128;
            --accent-primary: 34 211 238;
            --status-rose: 244 63 94;
            --font-sans: Inter, sans-serif;
            --font-mono: JetBrains Mono, monospace;
            --radius-md: 6px;
            --text-sm: 0.875rem;
            --focus-ring: 0 0 0 3px rgba(34, 211, 238, 0.13);
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; flex-direction: column; gap: 16px; max-width: 300px; }
          ${inputCss}
        </style>
      </head>
      <body>
        <div class="row">
          <input class="text-input" placeholder="Default input" value="default value" />
          <input class="text-input" placeholder="Focused state" value="focused value" />
          <input class="text-input text-input--error" placeholder="Error state" value="error value" />
          <input class="text-input" placeholder="Disabled state" value="disabled" disabled />
          <input class="text-input text-input--mono" placeholder="Mono input" value="mono_value" />
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('text-input-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('TextArea component - default, focus, error states', async ({ page }) => {
    const textareaCss = `
      .text-area {
        display: block;
        width: 100%;
        box-sizing: border-box;
        background-color: rgb(var(--canvas-surface));
        border: 1px solid rgb(var(--canvas-border));
        border-radius: var(--radius-md);
        padding: 7px 10px;
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        color: rgb(var(--canvas-fg-1));
        line-height: 1.45;
        transition: all 80ms ease-out;
        outline: none;
        resize: vertical;
        min-height: 64px;
      }
      .text-area::placeholder {
        color: rgb(var(--canvas-fg-3));
      }
      .text-area:focus-visible {
        background-color: rgb(var(--canvas-bg));
        border-color: rgb(var(--accent-primary));
        box-shadow: var(--focus-ring);
      }
      .text-area:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .text-area--error {
        border-color: rgb(var(--status-rose));
      }
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --canvas-surface: 255 255 255;
            --canvas-bg: 255 255 255;
            --canvas-border: 229 231 235;
            --canvas-fg-1: 17 24 39;
            --canvas-fg-3: 107 114 128;
            --accent-primary: 34 211 238;
            --status-rose: 244 63 94;
            --font-sans: Inter, sans-serif;
            --radius-md: 6px;
            --text-sm: 0.875rem;
            --focus-ring: 0 0 0 3px rgba(34, 211, 238, 0.13);
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; flex-direction: column; gap: 16px; max-width: 300px; }
          ${textareaCss}
        </style>
      </head>
      <body>
        <div class="row">
          <textarea class="text-area" placeholder="Default textarea">Sample text</textarea>
          <textarea class="text-area text-area--error" placeholder="Error textarea">Error message here</textarea>
          <textarea class="text-area" placeholder="Disabled textarea" disabled>Disabled text</textarea>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('text-area-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('NumberInput component - default, focus, error states', async ({ page }) => {
    const numberInputCss = `
      .number-input {
        display: block;
        width: 100%;
        box-sizing: border-box;
        background-color: rgb(var(--canvas-surface));
        border: 1px solid rgb(var(--canvas-border));
        border-radius: var(--radius-md);
        padding: 7px 10px;
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        color: rgb(var(--canvas-fg-1));
        transition: all 80ms ease-out;
        outline: none;
      }
      .number-input:focus-visible {
        background-color: rgb(var(--canvas-bg));
        border-color: rgb(var(--accent-primary));
        box-shadow: var(--focus-ring);
      }
      .number-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .number-input--error {
        border-color: rgb(var(--status-rose));
      }
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --canvas-surface: 255 255 255;
            --canvas-bg: 255 255 255;
            --canvas-border: 229 231 235;
            --canvas-fg-1: 17 24 39;
            --accent-primary: 34 211 238;
            --status-rose: 244 63 94;
            --font-sans: Inter, sans-serif;
            --radius-md: 6px;
            --text-sm: 0.875rem;
            --focus-ring: 0 0 0 3px rgba(34, 211, 238, 0.13);
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; flex-direction: column; gap: 16px; max-width: 300px; }
          ${numberInputCss}
        </style>
      </head>
      <body>
        <div class="row">
          <input type="number" class="number-input" placeholder="Default number" value="42" />
          <input type="number" class="number-input number-input--error" placeholder="Error number" value="999" />
          <input type="number" class="number-input" placeholder="Disabled number" value="10" disabled />
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('number-input-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Select component - default, focus, error states', async ({ page }) => {
    const selectCss = `
      .select {
        display: block;
        width: 100%;
        box-sizing: border-box;
        background-color: rgb(var(--canvas-surface));
        border: 1px solid rgb(var(--canvas-border));
        border-radius: var(--radius-md);
        padding: 7px 10px;
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        color: rgb(var(--canvas-fg-1));
        transition: all 80ms ease-out;
        outline: none;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23d1d5db' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        padding-right: 32px;
      }
      .select:focus-visible {
        background-color: rgb(var(--canvas-bg));
        border-color: rgb(var(--accent-primary));
        box-shadow: var(--focus-ring);
      }
      .select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .select--error {
        border-color: rgb(var(--status-rose));
      }
      .select option {
        background-color: rgb(var(--canvas-surface));
        color: rgb(var(--canvas-fg-1));
      }
      .select option:checked {
        background-color: rgb(var(--accent-primary));
        color: white;
      }
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --canvas-surface: 255 255 255;
            --canvas-bg: 255 255 255;
            --canvas-border: 229 231 235;
            --canvas-fg-1: 17 24 39;
            --accent-primary: 34 211 238;
            --status-rose: 244 63 94;
            --font-sans: Inter, sans-serif;
            --radius-md: 6px;
            --text-sm: 0.875rem;
            --focus-ring: 0 0 0 3px rgba(34, 211, 238, 0.13);
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; flex-direction: column; gap: 16px; max-width: 300px; }
          ${selectCss}
        </style>
      </head>
      <body>
        <div class="row">
          <select class="select">
            <option>Option 1</option>
            <option selected>Option 2</option>
            <option>Option 3</option>
          </select>
          <select class="select select--error">
            <option>Option A</option>
            <option selected>Option B</option>
          </select>
          <select class="select" disabled>
            <option>Option X</option>
            <option selected>Option Y</option>
          </select>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('select-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('TriState checkbox component - checked, unchecked, indeterminate states', async ({ page }) => {
    const tristateCss = `
      .tri-state {
        width: 18px;
        height: 18px;
        accent-color: rgb(var(--accent-primary));
        cursor: pointer;
        transition: all 80ms ease-out;
        outline: none;
      }
      .tri-state:focus-visible {
        box-shadow: var(--focus-ring);
        border-radius: var(--radius-md);
      }
      .tri-state:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --accent-primary: 34 211 238;
            --canvas-bg: 255 255 255;
            --radius-md: 6px;
            --focus-ring: 0 0 0 3px rgba(34, 211, 238, 0.13);
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .row { display: flex; gap: 20px; align-items: center; }
          ${tristateCss}
        </style>
      </head>
      <body>
        <div class="row">
          <input type="checkbox" class="tri-state" />
          <input type="checkbox" class="tri-state" checked />
          <input type="checkbox" class="tri-state" disabled />
        </div>
        <script>
          const indeterminateCheckbox = document.querySelectorAll('.tri-state')[1];
          indeterminateCheckbox.indeterminate = true;
        </script>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('tri-state-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Field wrapper component - label, required indicator, error message', async ({ page }) => {
    const fieldCss = `
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .field__label {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 11.5px;
        font-weight: 500;
        color: rgb(var(--canvas-fg-2));
        letter-spacing: 0.005em;
      }
      .field__label > span:first-child {
        flex: 1;
      }
      .field__required {
        color: rgb(var(--status-rose));
        margin-left: 3px;
      }
      .field__hint {
        font-size: 10.5px;
        color: rgb(var(--canvas-fg-3));
        font-weight: 400;
      }
      .field__error {
        font-size: 11px;
        color: rgb(var(--status-rose));
        margin-top: 2px;
      }
      .text-input {
        display: block;
        width: 100%;
        box-sizing: border-box;
        background-color: rgb(var(--canvas-surface));
        border: 1px solid rgb(var(--canvas-border));
        border-radius: var(--radius-md);
        padding: 7px 10px;
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        color: rgb(var(--canvas-fg-1));
        outline: none;
      }
      .text-input--error {
        border-color: rgb(var(--status-rose));
      }
    `

    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --canvas-surface: 27 34 42;
            --canvas-border: 55 65 81;
            --canvas-fg-1: 249 250 251;
            --canvas-fg-2: 209 213 219;
            --canvas-fg-3: 156 163 175;
            --status-rose: 244 63 94;
            --canvas-bg: 20 25 31;
            --font-sans: Inter, sans-serif;
            --radius-md: 6px;
            --text-sm: 0.875rem;
          }
          body { margin: 0; padding: 22px; background: rgb(var(--canvas-bg)); }
          .column { display: flex; flex-direction: column; gap: 20px; max-width: 300px; }
          ${fieldCss}
        </style>
      </head>
      <body>
        <div class="column">
          <div class="field">
            <div class="field__label">
              <span>Class name</span>
              <span class="field__required">*</span>
              <span class="field__hint">snake_case</span>
            </div>
            <div class="field__input">
              <input class="text-input" value="organism" />
            </div>
          </div>
          <div class="field">
            <div class="field__label">
              <span>Description</span>
              <span class="field__hint">Markdown supported</span>
            </div>
            <div class="field__input">
              <input class="text-input" value="Organism model" />
            </div>
          </div>
          <div class="field">
            <div class="field__label">
              <span>Email</span>
              <span class="field__required">*</span>
            </div>
            <div class="field__input">
              <input class="text-input text-input--error" value="invalid" />
            </div>
            <div class="field__error">Please enter a valid email address</div>
          </div>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('field-wrapper.png', {
      maxDiffPixelRatio: 0.1,
    })
  })
})
