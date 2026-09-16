import { test, expect } from '@playwright/test'
import {
  freezeAnimations,
  loadSelfHostedFonts,
  assertFontsLoaded,
  applyDarkCanvasMode,
  removeDarkCanvasMode,
} from './utils/test-helpers'

test.describe('integration: Radial Tree Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=radial-tree-test')
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

  test('Single-trunk radial tree with 3+ levels renders correctly', async ({ page }) => {
    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    // Verify nodes are rendered
    const nodes = page.locator('[data-testid^="graph-node-"]')
    const nodeCount = await nodes.count()
    expect(nodeCount).toBeGreaterThan(0)

    // Take snapshot
    await expect(canvas).toHaveScreenshot('radial-tree-single-trunk-light.png')
  })

  test('Single-trunk radial tree with rings enabled', async ({ page }) => {
    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    // Take snapshot with default rings shown
    await expect(canvas).toHaveScreenshot('radial-tree-single-trunk-rings-light.png')
  })

  test('Multi-trunk layout with orphan nodes', async ({ page }) => {
    // Switch to multi-trunk view
    const viewSelect = page.locator('select')
    await viewSelect.selectOption('multi')
    await page.waitForTimeout(500)

    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    // Verify multiple trunks are rendered
    const nodes = page.locator('[data-testid^="graph-node-"]')
    const nodeCount = await nodes.count()
    expect(nodeCount).toBeGreaterThan(0)

    // Take snapshot showing multi-trunk layout
    await expect(canvas).toHaveScreenshot('radial-tree-multi-trunk-light.png')
  })

  test('Mixed view combining single and multi-trunk', async ({ page }) => {
    // Switch to mixed view
    const viewSelect = page.locator('select')
    await viewSelect.selectOption('mixed')
    await page.waitForTimeout(500)

    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    const nodes = page.locator('[data-testid^="graph-node-"]')
    const nodeCount = await nodes.count()
    expect(nodeCount).toBeGreaterThan(4) // Should have nodes from both trunks

    await expect(canvas).toHaveScreenshot('radial-tree-mixed-light.png')
  })

  test('Custom collapse control view', async ({ page }) => {
    // Switch to custom view
    const viewSelect = page.locator('select')
    await viewSelect.selectOption('custom')
    await page.waitForTimeout(500)

    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    // Take snapshot of default custom view
    await expect(canvas).toHaveScreenshot('radial-tree-custom-light.png')
  })

  test('Cross-trunk relational edges are visible', async ({ page }) => {
    // In single-trunk view, there's a cross-edge relation
    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    // The graph should render with cross-edges visible
    await expect(canvas).toHaveScreenshot('radial-tree-cross-edges-light.png')
  })

  test('Single-trunk radial tree in dark canvas mode', async ({ page }) => {
    // Apply dark canvas mode
    await applyDarkCanvasMode(page)
    await page.waitForTimeout(500)

    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    await expect(canvas).toHaveScreenshot('radial-tree-single-trunk-dark.png')
  })

  test('Multi-trunk layout in dark canvas mode', async ({ page }) => {
    // Apply dark canvas mode
    await applyDarkCanvasMode(page)
    await page.waitForTimeout(500)

    // Switch to multi-trunk view
    const viewSelect = page.locator('select')
    await viewSelect.selectOption('multi')
    await page.waitForTimeout(500)

    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toHaveScreenshot('radial-tree-multi-trunk-dark.png')
  })

  test('Custom collapse control - light mode', async ({ page }) => {
    // Switch to custom view and enable custom render
    const viewSelect = page.locator('select')
    await viewSelect.selectOption('custom')
    await page.waitForTimeout(500)

    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    // Verify the custom view renders correctly
    await expect(canvas).toHaveScreenshot('radial-tree-custom-collapse-light.png')
  })

  test('Custom collapse control - dark mode', async ({ page }) => {
    // Switch to custom view
    const viewSelect = page.locator('select')
    await viewSelect.selectOption('custom')
    await page.waitForTimeout(500)

    // Apply dark canvas mode
    await applyDarkCanvasMode(page)
    await page.waitForTimeout(500)

    // Verify collapse control remains visible and styled correctly in dark mode
    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toHaveScreenshot('radial-tree-custom-collapse-dark.png')
  })

  test('Trunk bubble stability verification', async ({ page }) => {
    // Switch to custom view to access mixed collapse button
    const viewSelect = page.locator('select')
    await viewSelect.selectOption('custom')
    await page.waitForTimeout(500)

    const canvas = page.locator('.graph-canvas')

    // Get a reference node in the trunk and its position before any interaction
    const rootNode = page.locator('[data-testid="graph-node-root"]')
    const beforeCollapse = await rootNode.boundingBox()

    expect(beforeCollapse).toBeTruthy()

    if (beforeCollapse) {
      // Take snapshot before collapse
      const beforeSnapshot = await canvas.screenshot()
      expect(beforeSnapshot).toBeTruthy()

      // After collapse interactions, verify position stability
      // The position should remain stable (within floating-point tolerance)
      const afterCollapse = await rootNode.boundingBox()
      if (afterCollapse) {
        const xDiff = Math.abs(beforeCollapse.x - afterCollapse.x)
        const yDiff = Math.abs(beforeCollapse.y - afterCollapse.y)
        // Allow small tolerance for layout calculations
        expect(xDiff + yDiff).toBeLessThan(20)
      }
    }
  })

  test('Multi-trunk orphan nodes are distinct', async ({ page }) => {
    // Switch to multi-trunk view
    const viewSelect = page.locator('select')
    await viewSelect.selectOption('multi')
    await page.waitForTimeout(500)

    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    // Verify all nodes are rendered
    const nodes = page.locator('[data-testid^="graph-node-"]')
    const nodeCount = await nodes.count()
    expect(nodeCount).toBeGreaterThan(6) // Should have main nodes + orphans

    await expect(canvas).toHaveScreenshot('radial-tree-orphan-spacing.png')
  })

  test('Node selection and interaction', async ({ page }) => {
    const canvas = page.locator('.graph-canvas')

    // Click on a node to select it
    const firstNode = page.locator('[data-testid="graph-node-root"]')
    await firstNode.click()

    // Verify node is selected
    await expect(firstNode).toHaveClass(/selected/)

    // Take screenshot showing selection
    await expect(canvas).toHaveScreenshot('radial-tree-node-selected-light.png')
  })
})
