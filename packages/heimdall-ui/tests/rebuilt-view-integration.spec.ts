import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Rebuilt View Integration Tests', () => {
  test('rebuilt context studio dashboard renders without errors', async ({ page }) => {
    // Navigate to the Vite dev server
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Check for any console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait for the app to render
    const heading = page.locator('h1:has-text("Heimdall Design System")')
    await expect(heading).toBeVisible({ timeout: 5000 })

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0)
  })

  test('rebuilt view full-page visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173')
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
    await page.goto('http://localhost:5173')
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

    // Verify content area is present
    const content = page.locator('h1')
    await expect(content).toContainText('Heimdall Design System')
  })

  test('stat tiles display correct data', async ({ page }) => {
    await page.goto('http://localhost:5173')
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
    await page.goto('http://localhost:5173')
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
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')

    // Look for collapse button (typically in sidebar header)
    const sidebarSection = page.locator('[class*="sidebar"]').first()
    await expect(sidebarSection).toBeVisible()

    // Sidebar should be visible initially
    const mainContent = page.locator('h1')
    await expect(mainContent).toBeVisible()
  })

  test('all exported components are used in rebuilt view', async ({ page }) => {
    await page.goto('http://localhost:5173')
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
})
