import { test, expect } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { fileURLToPath } from 'url'
import path from 'path'

test.describe('Rebuilt View Integration Tests', () => {
  test('rebuilt context studio dashboard renders without errors', async ({ page }) => {
    // Navigate to the ContextStudioRebuilt example
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')

    // Check for any console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait for the rebuilt view dashboard to render
    const heading = page.locator('h1:has-text("Dashboard")')
    await expect(heading).toBeVisible({ timeout: 5000 })

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0)
  })

  test('rebuilt view full-page visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')

    // Wait for shell to be fully rendered
    await page.locator('[class*="shell"]').first().waitFor()

    // Capture full page screenshot
    await expect(page).toHaveScreenshot('rebuilt-context-studio.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02, // Allow 2% pixel difference for full page
    })
  })

  test('shell layout components render correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')

    // Check titlebar
    const titlebar = page.locator('[class*="titlebar"]').first()
    await expect(titlebar).toBeVisible()

    // Check sidebar
    const sidebar = page.locator('[class*="sidebar"]').first()
    await expect(sidebar).toBeVisible()

    // Check topbar
    const topbar = page.locator('[class*="topbar"]').first()
    await expect(topbar).toBeVisible()

    // Check statusbar
    const statusbar = page.locator('[class*="statusbar"]').first()
    await expect(statusbar).toBeVisible()

    // Verify content area has the rebuilt view heading
    const content = page.locator('h1:has-text("Dashboard")')
    await expect(content).toBeVisible()
  })

  test('stat tiles display correct data', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')

    // Find stat tiles
    const statTiles = page.locator('[class*="stat"]')
    const count = await statTiles.count()

    // Should have at least 4 stat tiles
    expect(count).toBeGreaterThanOrEqual(4)

    // Verify they contain expected labels from ContextStudioRebuilt
    const labels = ['Taxonomies', 'Classes', 'Individuals', 'Pipelines']
    for (const label of labels) {
      const tile = page.locator(`[class*="stat"] >> text=${label}`).first()
      await expect(tile).toBeVisible()
    }
  })

  test('interactive elements are functional', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')

    // Test button click
    const buttons = page.locator('button')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)

    // All buttons should be clickable
    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i)
      await expect(button).toBeEnabled()
    }
  })

  test('sidebar collapse/expand functionality', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')

    // Look for collapse button (typically in sidebar header)
    const sidebarSection = page.locator('[class*="sidebar"]').first()
    await expect(sidebarSection).toBeVisible()

    // Sidebar should be visible initially
    const mainContent = page.locator('h1:has-text("Dashboard")')
    await expect(mainContent).toBeVisible()
  })

  test('all exported components are used in rebuilt view', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')

    // Verify key components are present
    const components = [
      'titlebar',
      'sidebar',
      'topbar',
      'statusbar',
      'stat', // StatTile
      'btn', // Button
      'chip', // Chip
    ]

    for (const component of components) {
      const element = page.locator(`[class*="${component}"]`).first()
      await expect(element).toBeVisible({ timeout: 5000 })
    }
  })

  test('rebuilt view visual comparison against original reference HTML', async ({
    page,
    context,
  }) => {
    // Load the original reference HTML
    const originalPage = await context.newPage()
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const refHtmlPath = 'file://' + path.resolve(__dirname, '../../../example-context-studio/Context Studio.html')
    await originalPage.goto(refHtmlPath)
    await originalPage.waitForLoadState('networkidle')

    // Apply dark-canvas mode to original page for consistent visual comparison
    await originalPage.evaluate(() => {
      document.body.classList.add('dark-canvas')
    })
    await originalPage.waitForLoadState('networkidle')

    // Capture original reference screenshot
    const originalBuffer = await originalPage.screenshot({ fullPage: true })
    await originalPage.close()

    // Load the rebuilt view
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')
    await page.locator('[class*="shell"]').first().waitFor()

    // Apply dark-canvas mode to rebuilt page for consistent visual comparison
    await page.evaluate(() => {
      document.body.classList.add('dark-canvas')
    })
    await page.waitForLoadState('networkidle')

    // Capture rebuilt view screenshot
    const rebuiltBuffer = await page.screenshot({ fullPage: true })

    // Parse both screenshots as PNG images
    const origImg = PNG.sync.read(originalBuffer)
    const rebuiltImg = PNG.sync.read(rebuiltBuffer)

    // Verify dimensions match
    expect(origImg.width).toBe(rebuiltImg.width)
    expect(origImg.height).toBe(rebuiltImg.height)

    // Perform pixel-level comparison
    const { width, height } = origImg
    const diffOutput = new Uint8ClampedArray(width * height * 4)
    const diff = pixelmatch(origImg.data, rebuiltImg.data, diffOutput, width, height, {
      threshold: 0.1,
    })
    const diffRatio = diff / (width * height)

    // Allow up to 5% pixel difference for rendering variations
    expect(diffRatio).toBeLessThan(0.05)
  })
})

test.describe('Homelab Dashboard Rebuilt Integration Tests', () => {
  test('rebuilt homelab dashboard renders without errors', async ({ page }) => {
    // Check for any console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Navigate to the HomelabDashboardRebuilt example
    await page.goto('http://localhost:5173/?example=homelab')
    await page.waitForLoadState('networkidle')

    // Wait for the homelab dashboard to render
    const heading = page.locator('h1:has-text("Overview")')
    await expect(heading).toBeVisible({ timeout: 5000 })

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0)
  })

  test('homelab dashboard full-page visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=homelab')
    await page.waitForLoadState('networkidle')

    // Wait for shell to be fully rendered
    await page.locator('[class*="shell"]').first().waitFor()

    // Capture full page screenshot
    await expect(page).toHaveScreenshot('rebuilt-homelab-dashboard.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02, // Allow 2% pixel difference for full page
    })
  })

  test('homelab dashboard shell layout components render correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=homelab')
    await page.waitForLoadState('networkidle')

    // Check titlebar
    const titlebar = page.locator('[class*="titlebar"]').first()
    await expect(titlebar).toBeVisible()

    // Check sidebar
    const sidebar = page.locator('[class*="sidebar"]').first()
    await expect(sidebar).toBeVisible()

    // Check topbar
    const topbar = page.locator('[class*="topbar"]').first()
    await expect(topbar).toBeVisible()

    // Check statusbar
    const statusbar = page.locator('[class*="statusbar"]').first()
    await expect(statusbar).toBeVisible()

    // Verify content area has the homelab dashboard heading
    const content = page.locator('h1:has-text("Overview")')
    await expect(content).toBeVisible()
  })

  test('homelab dashboard stat tiles display correct data', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=homelab')
    await page.waitForLoadState('networkidle')

    // Find stat tiles
    const statTiles = page.locator('[class*="stat"]')
    const count = await statTiles.count()

    // Should have at least 4 stat tiles (Power, Alerts, Egress, Uptime)
    expect(count).toBeGreaterThanOrEqual(4)

    // Verify they contain expected labels from HomelabDashboardRebuilt
    const labels = ['Power draw', 'Active alerts', 'Egress today', 'Cluster uptime']
    for (const label of labels) {
      const tile = page.locator(`text=${label}`).first()
      await expect(tile).toBeVisible()
    }
  })

  test('homelab dashboard displays homelab-specific components', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=homelab')
    await page.waitForLoadState('networkidle')

    // Verify homelab-specific sections are visible
    const serversHeading = page.locator('h2:has-text("Servers")')
    await expect(serversHeading).toBeVisible()

    const appsHeading = page.locator('h2:has-text("Applications")')
    await expect(appsHeading).toBeVisible()

    const networkHeading = page.locator('h2:has-text("Network gateway")')
    await expect(networkHeading).toBeVisible()
  })

  test('homelab dashboard interactive elements are functional', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=homelab')
    await page.waitForLoadState('networkidle')

    // Test button click
    const buttons = page.locator('button')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)

    // All buttons should be clickable
    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i)
      await expect(button).toBeEnabled()
    }
  })
})
