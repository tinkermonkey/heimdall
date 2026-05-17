import { test, expect } from '@playwright/test'
import { freezeAnimations } from './utils/test-helpers'

test.describe('Data Display Components', () => {
  const setupTokensAndFonts = `
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
      --status-cyan: 34 211 238;
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

      --font-weight-normal: 400;
      --font-weight-medium: 500;
      --font-weight-semibold: 600;
      --font-weight-bold: 700;
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
  `

  const statTileCss = `
    .stat-tile {
      background: rgb(var(--canvas-card));
      border: 1px solid rgb(var(--canvas-border));
      border-radius: var(--radius-lg);
      padding: 16px;
      position: relative;
      overflow: hidden;
    }

    .stat-tile::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
    }

    .stat-tile--cyan::before {
      background: rgb(var(--status-cyan));
    }

    .stat-tile--violet::before {
      background: rgb(var(--status-violet));
    }

    .stat-tile--amber::before {
      background: rgb(var(--status-amber));
    }

    .stat-tile--emerald::before {
      background: rgb(var(--status-emerald));
    }

    .stat-tile__label {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgb(var(--canvas-fg-3));
      font-weight: var(--font-weight-medium);
    }

    .stat-tile__value {
      font-size: 28px;
      font-weight: var(--font-weight-bold);
      letter-spacing: -0.02em;
      color: rgb(var(--canvas-fg-1));
      line-height: 1.1;
      margin-top: 6px;
      font-feature-settings: 'tnum';
    }

    .stat-tile__meta {
      margin-top: 6px;
      font-size: 12px;
      color: rgb(var(--canvas-fg-2));
      display: flex;
      gap: 6px;
    }

    .stat-tile__delta {
      font-weight: var(--font-weight-medium);
    }

    .stat-tile__delta--up {
      color: rgb(var(--status-emerald));
    }

    .stat-tile__delta--down {
      color: rgb(var(--status-rose));
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
  `

  const tableCss = `
    .table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
      border: 1px solid rgb(var(--canvas-border));
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .table__head {
      background: rgb(var(--canvas-surface));
    }

    .table__header {
      text-align: left;
      font-family: var(--font-mono);
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgb(var(--canvas-fg-3));
      font-weight: var(--font-weight-medium);
      padding: 10px 14px;
      border-bottom: 1px solid rgb(var(--canvas-border));
      cursor: default;
    }

    .table__body {
      background: rgb(var(--canvas-card));
    }

    .table__row {
      border-bottom: 1px solid rgb(var(--canvas-border));
    }

    .table__row:last-child {
      border-bottom: 0;
    }

    .table__row--selected {
      background: rgba(34, 211, 238, 0.05);
    }

    .table__cell {
      padding: 11px 14px;
      color: rgb(var(--canvas-fg-1));
      vertical-align: middle;
    }

    .table__cell--checkbox {
      text-align: center;
      padding: 11px 10px;
    }

    .table__checkbox {
      width: 14px;
      height: 14px;
      cursor: pointer;
      accent-color: rgb(var(--accent-primary));
      border-radius: 2px;
    }

    .mono {
      font-family: var(--font-mono);
      font-size: 12px;
      color: rgb(var(--canvas-fg-2));
    }

    .row-link {
      color: rgb(var(--accent-primary));
      font-weight: var(--font-weight-medium);
      cursor: pointer;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 3px;
      border: 1px solid;
      font-weight: var(--font-weight-medium);
    }

    .chip .dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
    }
  `

  test('stat-tile variants', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          ${setupTokensAndFonts}
          ${statTileCss}
        </style>
      </head>
      <body>
        <div class="label">StatTile · 4 accent variants · 2px colored left bar</div>
        <div class="grid">
          <div class="stat-tile stat-tile--cyan">
            <div class="stat-tile__label">Classes</div>
            <div class="stat-tile__value">128</div>
            <div class="stat-tile__meta"><span class="stat-tile__delta stat-tile__delta--up">+4</span> · this week</div>
          </div>
          <div class="stat-tile stat-tile--violet">
            <div class="stat-tile__label">Individuals</div>
            <div class="stat-tile__value">12,480</div>
            <div class="stat-tile__meta"><span class="stat-tile__delta stat-tile__delta--up">+312</span> · today</div>
          </div>
          <div class="stat-tile stat-tile--amber">
            <div class="stat-tile__label">Pipelines</div>
            <div class="stat-tile__value">17</div>
            <div class="stat-tile__meta">3 running</div>
          </div>
          <div class="stat-tile stat-tile--emerald">
            <div class="stat-tile__label">Last run</div>
            <div class="stat-tile__value" style="font-size: 22px; font-family: var(--font-mono); font-weight: 600">2m ago</div>
            <div class="stat-tile__meta"><span class="stat-tile__delta stat-tile__delta--up">●</span> healthy</div>
          </div>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('stat-tile-variants.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('table with selection and sorting', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          ${setupTokensAndFonts}
          ${tableCss}
        </style>
      </head>
      <body>
        <div class="label">Table · mono ID column · row selection highlight</div>
        <table class="table">
          <thead class="table__head">
            <tr class="table__row">
              <th class="table__header" style="width: 30px"><input type="checkbox" class="table__checkbox" /></th>
              <th class="table__header">Name</th>
              <th class="table__header">Class</th>
              <th class="table__header">Status</th>
              <th class="table__header">Updated</th>
            </tr>
          </thead>
          <tbody class="table__body">
            <tr class="table__row">
              <td class="table__cell table__cell--checkbox"><input type="checkbox" class="table__checkbox" checked /></td>
              <td class="table__cell"><span class="mono">cls_4f3a</span> <span class="row-link">organism</span></td>
              <td class="table__cell">
                <span class="chip" style="color: #065f46; background: #ecfdf5; border-color: #a7f3d0">
                  <span class="dot" style="background: #10b981"></span>life
                </span>
              </td>
              <td class="table__cell">
                <span class="chip" style="color: #065f46; background: #ecfdf5; border-color: #a7f3d0">
                  <span class="dot" style="background: #10b981"></span>active
                </span>
              </td>
              <td class="table__cell mono">2m ago</td>
            </tr>
            <tr class="table__row table__row--selected">
              <td class="table__cell table__cell--checkbox"><input type="checkbox" class="table__checkbox" checked /></td>
              <td class="table__cell"><span class="mono">cls_8b21</span> <span class="row-link">station</span></td>
              <td class="table__cell">
                <span class="chip" style="color: #92400e; background: #fffbeb; border-color: #fde68a">
                  <span class="dot" style="background: #f59e0b"></span>climate
                </span>
              </td>
              <td class="table__cell">
                <span class="chip" style="color: #0e7490; background: #ecfeff; border-color: #a5f3fc">
                  <span class="dot" style="background: #06b6d4"></span>syncing
                </span>
              </td>
              <td class="table__cell mono">12m ago</td>
            </tr>
            <tr class="table__row">
              <td class="table__cell table__cell--checkbox"><input type="checkbox" class="table__checkbox" /></td>
              <td class="table__cell"><span class="mono">cls_e007</span> <span class="row-link">service</span></td>
              <td class="table__cell">
                <span class="chip" style="color: #5b21b6; background: #f5f3ff; border-color: #ddd6fe">
                  <span class="dot" style="background: #a78bfa"></span>software
                </span>
              </td>
              <td class="table__cell">
                <span class="chip" style="color: #9f1239; background: #fff1f2; border-color: #fecdd3">
                  <span class="dot" style="background: #f43f5e"></span>error
                </span>
              </td>
              <td class="table__cell mono">1h ago</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('table-selection.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('sidebar navigation', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          ${setupTokensAndFonts}

          body {
            margin: 0;
            padding: 0;
            background: rgb(var(--shell-bg));
            color: rgb(var(--shell-fg-1));
          }

          .label {
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.5);
            padding: 14px 14px 8px;
          }

          .sidebar {
            background: rgb(var(--shell-bg));
            border-right: 1px solid rgb(55 65 81 / 1);
            width: 320px;
            padding: 12px 8px;
          }

          .sidebar__section {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .sidebar__section-title {
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: rgb(var(--shell-fg-3));
            padding: 8px 8px 6px;
            font-weight: var(--font-weight-medium);
          }

          .sidebar__item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: var(--radius-md);
            color: rgb(var(--shell-fg-2));
            font-size: 13.5px;
            cursor: pointer;
            background: transparent;
            border: none;
            text-align: left;
            font-family: var(--font-sans);
            position: relative;
          }

          .sidebar__item--active {
            background: rgb(var(--shell-surface));
            color: rgb(var(--shell-fg-1));
          }

          .sidebar__item--active::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 6px;
            bottom: 6px;
            width: 2px;
            background: rgb(var(--accent-primary));
            border-radius: 0 2px 2px 0;
          }

          .sidebar__item-label {
            flex: 1;
          }

          .sidebar__item-count {
            margin-left: auto;
            font-family: var(--font-mono);
            font-size: 11px;
            color: rgb(var(--shell-fg-3));
            flex-shrink: 0;
          }

          .sidebar__item--active .sidebar__item-count {
            color: rgb(var(--accent-primary));
          }
        </style>
      </head>
      <body>
        <div class="label">Sidebar nav · active = surface bg + 2px accent bar</div>
        <div class="sidebar">
          <div class="sidebar__section">
            <div class="sidebar__section-title">Workspace</div>
            <button class="sidebar__item">
              <span class="sidebar__item-label">Dashboard</span>
            </button>
            <button class="sidebar__item sidebar__item--active">
              <span class="sidebar__item-label">Schema</span>
              <span class="sidebar__item-count">128</span>
            </button>
            <button class="sidebar__item">
              <span class="sidebar__item-label">Individuals</span>
              <span class="sidebar__item-count">12,480</span>
            </button>
            <button class="sidebar__item">
              <span class="sidebar__item-label">Pipelines</span>
              <span class="sidebar__item-count">17</span>
            </button>
          </div>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('sidebar-nav.png', {
      maxDiffPixelRatio: 0.1,
    })
  })
})
