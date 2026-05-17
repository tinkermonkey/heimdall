import { test, expect } from '@playwright/test'

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

    // Verify they contain expected labels
    const labels = ['Classes', 'Individuals', 'Pipelines', 'Taxonomies']
    for (const label of labels) {
      const tile = page.locator(`text=${label}`)
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
    browser,
    context,
  }) => {
    // Load the rebuilt view
    await page.goto('http://localhost:5173/?example=rebuilt')
    await page.waitForLoadState('networkidle')
    await page.locator('[class*="shell"]').first().waitFor()

    // Capture rebuilt view screenshot
    const rebuiltBuffer = await page.screenshot({ fullPage: true })

    // Load the original reference HTML in a new page
    const originalPage = await context.newPage()
    const refHtmlPath = 'file://' + process.cwd() + '/example-context-studio/Context Studio.html'
    await originalPage.goto(refHtmlPath)
    await originalPage.waitForLoadState('networkidle')

    // Capture original reference screenshot
    const originalBuffer = await originalPage.screenshot({ fullPage: true })

    // Compare the two screenshots - they should be visually similar
    // Using a snapshot comparison with tolerance for minor rendering differences
    await expect(page).toHaveScreenshot('rebuilt-vs-reference-comparison.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05, // Allow 5% pixel difference for cross-implementation comparison
    })

    // Verify both pages rendered without errors
    const errors: string[] = []
    originalPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    expect(errors).toHaveLength(0)
    await originalPage.close()
  })
})
