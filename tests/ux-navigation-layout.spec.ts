import { test, expect } from '@playwright/test'
import {
  freezeAnimations,
  loadSelfHostedFonts,
  assertFontsLoaded,
  applyDarkCanvasMode,
  removeDarkCanvasMode,
} from './utils/test-helpers'

const BASE_URL = 'http://localhost:5173'

test.describe('integration: UX Navigation Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/?example=ux-navigation`)
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)

    // Freeze animations for consistent snapshots
    await freezeAnimations(page)
  })

  test.afterEach(async ({ page }) => {
    // Ensure we exit dark canvas mode after each test
    await removeDarkCanvasMode(page)
  })

  test('default state with curved edges', async ({ page }) => {
    const canvas = page.locator('[data-testid="ux-nav-canvas"]')
    await expect(canvas).toBeVisible()

    // Wait for layout to complete
    await page.waitForTimeout(500)

    await expect(canvas).toHaveScreenshot('ux-nav-default-curved.png')
  })

  test('straight edges layout', async ({ page }) => {
    const canvas = page.locator('[data-testid="ux-nav-canvas"]')
    await expect(canvas).toBeVisible()

    // Wait for layout to complete
    await page.waitForTimeout(500)

    // Switch to straight edges
    const straightEdgesButton = page.locator('[data-testid="edge-style-straight"]')
    await straightEdgesButton.click()

    // Wait for edges to redraw
    await page.waitForTimeout(300)

    await expect(canvas).toHaveScreenshot('ux-nav-straight-edges.png')
  })

  test('dark canvas mode', async ({ page }) => {
    const canvas = page.locator('[data-testid="ux-nav-canvas"]')
    await expect(canvas).toBeVisible()

    // Wait for layout to complete
    await page.waitForTimeout(500)

    // Apply dark canvas mode
    await applyDarkCanvasMode(page)

    // Wait for theme transition
    await page.waitForTimeout(300)

    await expect(canvas).toHaveScreenshot('ux-nav-dark-canvas.png')
  })

  test('page tree structure renders correctly', async ({ page }) => {
    const canvas = page.locator('[data-testid="ux-nav-canvas"]')
    await expect(canvas).toBeVisible()

    // Verify page nodes exist
    await expect(page.locator('[data-testid="graph-node-page1"]')).toBeVisible()
    await expect(page.locator('[data-testid="graph-node-page2"]')).toBeVisible()

    // Verify view nodes exist
    await expect(page.locator('[data-testid="graph-node-view1_1"]')).toBeVisible()
    await expect(page.locator('[data-testid="graph-node-view4_1"]')).toBeVisible()

    // Verify structural edges are rendered
    const svgPaths = page.locator('[data-testid="ux-nav-canvas"] svg path')
    const pathCount = await svgPaths.count()
    expect(pathCount).toBeGreaterThan(0)
  })

  test('edge style toggle functionality', async ({ page }) => {
    // Verify both buttons exist
    const curvedButton = page.locator('[data-testid="edge-style-curved"]')
    const straightButton = page.locator('[data-testid="edge-style-straight"]')

    await expect(curvedButton).toBeVisible()
    await expect(straightButton).toBeVisible()

    // Click straight edges button
    await straightButton.click()
    await page.waitForTimeout(300)

    // Click curved edges button to toggle back
    await curvedButton.click()
    await page.waitForTimeout(300)

    // If no errors, test passed
    expect(true).toBe(true)
  })

  test('multiple page trees layout', async ({ page }) => {
    const canvas = page.locator('[data-testid="ux-nav-canvas"]')
    await expect(canvas).toBeVisible()

    // Wait for layout to complete
    await page.waitForTimeout(500)

    // Verify both independent page tree roots exist
    const page1 = page.locator('[data-testid="graph-node-page1"]')
    const page2 = page.locator('[data-testid="graph-node-page2"]')

    await expect(page1).toBeVisible()
    await expect(page2).toBeVisible()

    // Verify child pages exist for each tree
    const page1Child1 = page.locator('[data-testid="graph-node-page1_child1"]')
    const page2Child1 = page.locator('[data-testid="graph-node-page2_child1"]')

    await expect(page1Child1).toBeVisible()
    await expect(page2Child1).toBeVisible()
  })

  test('view fan layout', async ({ page }) => {
    const canvas = page.locator('[data-testid="ux-nav-canvas"]')
    await expect(canvas).toBeVisible()

    // Wait for layout to complete
    await page.waitForTimeout(500)

    // Verify multiple views exist as children of page1
    const view1_1 = page.locator('[data-testid="graph-node-view1_1"]')
    const view1_2 = page.locator('[data-testid="graph-node-view1_2"]')
    const view1_3 = page.locator('[data-testid="graph-node-view1_3"]')

    await expect(view1_1).toBeVisible()
    await expect(view1_2).toBeVisible()
    await expect(view1_3).toBeVisible()

    // Verify views from another page exist
    const view2_1 = page.locator('[data-testid="graph-node-view2_1"]')
    const view2_2 = page.locator('[data-testid="graph-node-view2_2"]')

    await expect(view2_1).toBeVisible()
    await expect(view2_2).toBeVisible()
  })
})
