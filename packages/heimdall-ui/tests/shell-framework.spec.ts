import { test, expect } from '@playwright/test'
import { freezeAnimations } from './utils/test-helpers'

test.describe('Shell Framework Components', () => {
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
      padding: 0;
      background-color: rgb(var(--canvas-bg));
      color: rgb(var(--canvas-fg-1));
      font-size: 1rem;
    }

    body.dark-canvas {
      --canvas-bg: 20 25 31;
      --canvas-surface: 27 34 42;
      --canvas-card: 27 34 42;
      --canvas-bg-2: 27 34 42;
      --canvas-fg-1: 230 237 243;
      --canvas-fg-2: 176 186 197;
      --canvas-fg-3: 126 138 152;
      --canvas-border: 42 50 60;
      --canvas-border-strong: 58 68 82;
    }
  `

  const titlebarCss = `
    .titlebar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      height: 36px;
      padding: 0 16px;
      background: rgb(var(--shell-bg));
      border-bottom: 1px solid rgb(55 65 81 / 1);
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .titlebar__slot {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .titlebar__slot--left {
      flex: 0 0 auto;
    }

    .titlebar__slot--center {
      flex: 1;
      justify-content: center;
      min-width: 0;
    }

    .titlebar__slot--right {
      flex: 0 0 auto;
    }
  `

  const statusbarCss = `
    .statusbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      height: 26px;
      padding: 0 16px;
      background: rgb(var(--shell-bg));
      border-top: 1px solid rgb(55 65 81 / 1);
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .statusbar__slot {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: rgb(var(--shell-fg-3));
    }

    .statusbar__slot--left {
      flex: 0 0 auto;
    }

    .statusbar__slot--center {
      flex: 1;
      justify-content: center;
      min-width: 0;
    }

    .statusbar__slot--right {
      flex: 0 0 auto;
    }
  `

  const topbarCss = `
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      height: 48px;
      padding: 0 16px;
      background: rgb(var(--shell-bg));
      border-bottom: 1px solid rgb(55 65 81 / 1);
      flex-shrink: 0;
    }

    .topbar__breadcrumbs {
      flex: 1;
      min-width: 0;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: rgb(var(--shell-fg-2));
    }

    .breadcrumbs__separator {
      color: rgb(var(--shell-fg-3));
    }

    .breadcrumbs__link {
      color: rgb(var(--shell-fg-2));
      text-decoration: none;
      cursor: pointer;
      transition: color 80ms ease-out;
      padding: 4px 2px;
      border-radius: 2px;
    }

    .breadcrumbs__link:hover {
      color: rgb(var(--shell-fg-1));
    }

    .topbar__actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .topbar__search {
      background: rgb(var(--shell-surface));
      border: 1px solid rgb(var(--canvas-border));
      border-radius: var(--radius-md);
      padding: 6px 10px;
      font-family: var(--font-sans);
      font-size: 13px;
      color: rgb(var(--shell-fg-1));
      width: 200px;
      transition: all 80ms ease-out;
    }

    .topbar__search::placeholder {
      color: rgb(var(--shell-fg-3));
    }

    .topbar__search:focus {
      outline: none;
      border-color: rgb(var(--accent-primary));
      box-shadow: 0 0 0 3px rgb(var(--accent-primary) / 0.1);
    }
  `

  const sidebarCss = `
    .sidebar {
      background: rgb(var(--shell-bg));
      border-right: 1px solid rgb(55 65 81 / 1);
      width: 256px;
      transition: width 200ms ease-out;
      display: flex;
      flex-direction: column;
      padding: 12px 8px;
    }

    .sidebar--collapsed {
      width: 64px;
    }

    .sidebar__toggle {
      display: none;
    }

    .sidebar__nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
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

    .sidebar--collapsed .sidebar__section-title {
      display: none;
    }

    .sidebar__items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sidebar__item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-md);
      color: rgb(var(--shell-fg-2));
      font-size: 13.5px;
      position: relative;
      cursor: pointer;
      background: transparent;
      border: none;
      text-align: left;
      font-family: var(--font-sans);
      transition: all 80ms ease-out;
    }

    .sidebar__item:hover {
      background: rgb(var(--shell-surface));
      color: rgb(var(--shell-fg-1));
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

    .sidebar__item-icon {
      flex-shrink: 0;
      color: rgb(var(--shell-fg-2));
    }

    .sidebar__item--active .sidebar__item-icon {
      color: rgb(var(--accent-primary));
    }

    .sidebar__item-label {
      flex: 1;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .sidebar--collapsed .sidebar__item-label {
      display: none;
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

    .sidebar--collapsed .sidebar__item-count {
      display: none;
    }

    .sidebar--collapsed .sidebar__item {
      justify-content: center;
      padding: 8px;
    }
  `

  const shellLayoutCss = `
    .shell-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: rgb(var(--shell-bg));
    }

    .shell-layout__main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .shell-layout__content {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }

    .shell-layout__canvas {
      flex: 1;
      overflow: auto;
      background: rgb(var(--canvas-bg));
      min-width: 1100px;
      padding: 22px 26px 32px;
    }

    .shell-layout__canvas::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .shell-layout__canvas::-webkit-scrollbar-track {
      background: rgb(var(--canvas-bg));
    }

    .shell-layout__canvas::-webkit-scrollbar-thumb {
      background: rgb(var(--canvas-border));
      border-radius: 4px;
    }

    .shell-layout__canvas::-webkit-scrollbar-thumb:hover {
      background: rgb(var(--canvas-border-strong));
    }
  `

  const canvasContentCss = `
    .canvas-content {
      color: rgb(var(--canvas-fg-1));
    }

    .canvas-content__title {
      font-size: 24px;
      font-weight: 800;
      margin-bottom: 8px;
      color: rgb(var(--canvas-fg-1));
    }

    .canvas-content__subtitle {
      font-size: 14px;
      color: rgb(var(--canvas-fg-2));
      margin-bottom: 24px;
    }

    .canvas-content__section {
      margin-bottom: 24px;
    }

    .canvas-content__stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 16px;
    }

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
      background: rgb(var(--status-cyan));
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
    }
  `

  test('titlebar with slots', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          ${setupTokensAndFonts}
          ${titlebarCss}
        </style>
      </head>
      <body style="margin: 0; padding: 0;" class="dark-canvas">
        <div class="titlebar">
          <div class="titlebar__slot titlebar__slot--left">
            <span style="color: rgb(var(--shell-fg-1)); font-size: 14px; font-weight: 500;">Logo</span>
          </div>
          <div class="titlebar__slot titlebar__slot--center">
            <span style="color: rgb(var(--shell-fg-2)); font-size: 14px;">Heimdall Design System</span>
          </div>
          <div class="titlebar__slot titlebar__slot--right">
            <button style="background: rgb(var(--shell-surface)); border: 1px solid rgb(55 65 81 / 1); color: rgb(var(--shell-fg-1)); padding: 6px 12px; border-radius: var(--radius-md); cursor: pointer; font-family: var(--font-sans); font-size: 13px;">Settings</button>
          </div>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('titlebar-slots.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('statusbar with slots', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          ${setupTokensAndFonts}
          ${statusbarCss}
        </style>
      </head>
      <body style="margin: 0; padding: 0; display: flex; justify-content: flex-end; height: 100vh;" class="dark-canvas">
        <div class="statusbar" style="width: 100%; position: absolute; bottom: 0;">
          <div class="statusbar__slot statusbar__slot--left">
            <span>Ready</span>
          </div>
          <div class="statusbar__slot statusbar__slot--center">
            <span>Project: heimdall-ui</span>
          </div>
          <div class="statusbar__slot statusbar__slot--right">
            <span>Node v18.16.0</span>
          </div>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('statusbar-slots.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('full ShellLayout composition', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          ${setupTokensAndFonts}
          ${titlebarCss}
          ${statusbarCss}
          ${topbarCss}
          ${sidebarCss}
          ${shellLayoutCss}
          ${canvasContentCss}
        </style>
      </head>
      <body style="margin: 0; padding: 0;" class="dark-canvas">
        <div class="shell-layout">
          <div class="titlebar">
            <div class="titlebar__slot titlebar__slot--left">
              <span style="color: rgb(var(--shell-fg-1)); font-size: 14px; font-weight: 500;">Heimdall</span>
            </div>
            <div class="titlebar__slot titlebar__slot--center">
              <span style="color: rgb(var(--shell-fg-2)); font-size: 14px;">Design System</span>
            </div>
            <div class="titlebar__slot titlebar__slot--right"></div>
          </div>

          <div class="shell-layout__main">
            <div class="sidebar">
              <nav class="sidebar__nav">
                <div class="sidebar__section">
                  <div class="sidebar__section-title">Workspace</div>
                  <div class="sidebar__items">
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
                  </div>
                </div>
              </nav>
            </div>

            <div class="shell-layout__content">
              <div class="topbar">
                <div class="topbar__breadcrumbs">
                  <nav class="breadcrumbs">
                    <button class="breadcrumbs__link" style="background: none; border: none; cursor: pointer;">Dashboard</button>
                    <span class="breadcrumbs__separator">/</span>
                    <button class="breadcrumbs__link" style="background: none; border: none; cursor: pointer;">Schema</button>
                  </nav>
                </div>
                <div class="topbar__actions"></div>
              </div>

              <div class="shell-layout__canvas">
                <div class="canvas-content">
                  <div class="canvas-content__title">Schema Management</div>
                  <div class="canvas-content__subtitle">View and manage your data schemas</div>

                  <div class="canvas-content__section">
                    <div class="canvas-content__stat-grid">
                      <div class="stat-tile">
                        <div class="stat-tile__label">Total Classes</div>
                        <div class="stat-tile__value">128</div>
                      </div>
                      <div class="stat-tile">
                        <div class="stat-tile__label">Active Schemas</div>
                        <div class="stat-tile__value">42</div>
                      </div>
                      <div class="stat-tile">
                        <div class="stat-tile__label">Last Updated</div>
                        <div class="stat-tile__value">2m ago</div>
                      </div>
                      <div class="stat-tile">
                        <div class="stat-tile__label">Health</div>
                        <div class="stat-tile__value">100%</div>
                      </div>
                    </div>
                  </div>

                  <div style="color: rgb(var(--canvas-fg-2)); font-size: 14px;">
                    This demonstrates the two-surface architecture: dark shell chrome (#0B0F14) with light/dark canvas surface (#14191F).
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="statusbar">
            <div class="statusbar__slot statusbar__slot--left">
              <span>Ready</span>
            </div>
            <div class="statusbar__slot statusbar__slot--center"></div>
            <div class="statusbar__slot statusbar__slot--right">
              <span>UI · Phase 6 · Shell Framework</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('shell-layout-full-composition.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('titlebar renders at exactly 36px', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${setupTokensAndFonts}
          ${titlebarCss}
        </style>
      </head>
      <body style="margin: 0;">
        <div class="titlebar">
          <div class="titlebar__slot titlebar__slot--center">Test</div>
        </div>
      </body>
      </html>
    `)

    const titlebar = page.locator('.titlebar')
    const boundingBox = await titlebar.boundingBox()
    expect(boundingBox?.height).toBe(36)
  })

  test('statusbar renders at exactly 26px', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${setupTokensAndFonts}
          ${statusbarCss}
        </style>
      </head>
      <body style="margin: 0;">
        <div class="statusbar">
          <div class="statusbar__slot statusbar__slot--center">Test</div>
        </div>
      </body>
      </html>
    `)

    const statusbar = page.locator('.statusbar')
    const boundingBox = await statusbar.boundingBox()
    expect(boundingBox?.height).toBe(26)
  })

  test('canvas background is #14191F', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${setupTokensAndFonts}
          ${shellLayoutCss}
        </style>
      </head>
      <body style="margin: 0; padding: 0;" class="dark-canvas">
        <div class="shell-layout">
          <div class="shell-layout__main">
            <div class="shell-layout__content">
              <div class="shell-layout__canvas"></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)

    const canvas = page.locator('.shell-layout__canvas')
    const backgroundColor = await canvas.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(backgroundColor).toBe('rgb(20, 25, 31)')
  })

  test('shell components do not change with dark-canvas', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${setupTokensAndFonts}
          ${titlebarCss}
          ${statusbarCss}
          ${sidebarCss}

          body.dark-canvas {
            --canvas-bg: 20 25 31;
            --canvas-surface: 27 34 42;
          }
        </style>
      </head>
      <body>
        <div class="titlebar">
          <div class="titlebar__slot titlebar__slot--center">Test</div>
        </div>
        <div class="sidebar">
          <nav class="sidebar__nav"></nav>
        </div>
        <div class="statusbar">
          <div class="statusbar__slot statusbar__slot--center">Test</div>
        </div>
      </body>
      </html>
    `)

    const titlebar = page.locator('.titlebar')
    const sidebar = page.locator('.sidebar')
    const statusbar = page.locator('.statusbar')

    const getTitlebarBg = () => titlebar.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    const getSidebarBg = () => sidebar.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    const getStatusbarBg = () => statusbar.evaluate((el) => window.getComputedStyle(el).backgroundColor)

    const beforeTitlebar = await getTitlebarBg()
    const beforeSidebar = await getSidebarBg()
    const beforeStatusbar = await getStatusbarBg()

    await page.evaluate(() => document.body.classList.add('dark-canvas'))

    const afterTitlebar = await getTitlebarBg()
    const afterSidebar = await getSidebarBg()
    const afterStatusbar = await getStatusbarBg()

    expect(beforeTitlebar).toBe(afterTitlebar)
    expect(beforeSidebar).toBe(afterSidebar)
    expect(beforeStatusbar).toBe(afterStatusbar)
  })
})
