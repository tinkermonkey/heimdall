import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('integration: LineageRail Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
  })

  test.describe('Rendering and Layout', () => {
    test('should render nodes with labels', async ({ page }) => {
      const nodes = page.locator('.lineage-rail__node')
      const nodeCount = await nodes.count()
      expect(nodeCount).toBeGreaterThan(0)

      // Check that first simple lineage section has 3 nodes
      const firstRailComponent = page.locator('[aria-label*="Simple lineage chain"]')
      const firstSectionNodes = firstRailComponent.locator('.lineage-rail__node')
      await expect(firstSectionNodes).toHaveCount(3)
    })

    test('should display labels inside nodes', async ({ page }) => {
      const firstLabel = page.locator('.lineage-rail__label').first()
      await expect(firstLabel).toBeVisible()
      const labelText = await firstLabel.textContent()
      expect(labelText).toBeTruthy()
      expect(labelText?.trim()).toMatch(/source_table|raw_data|source/)
    })

    test('should render arrows between nodes', async ({ page }) => {
      const arrows = page.locator('.lineage-rail__arrow')
      const arrowCount = await arrows.count()
      expect(arrowCount).toBeGreaterThan(0)

      // First simple lineage has 3 nodes, should have 2 arrows
      const firstRailComponent = page.locator('[aria-label*="Simple lineage chain"]')
      const firstSectionArrows = firstRailComponent.locator('.lineage-rail__arrow')
      await expect(firstSectionArrows).toHaveCount(2)
    })

    test('should not render arrows for single node', async ({ page }) => {
      // Find the single node lineage using aria-label
      const singleNodeRail = page.locator('[aria-label*="only_stage"]')
      const arrows = singleNodeRail.locator('.lineage-rail__arrow')
      await expect(arrows).toHaveCount(0)
    })

    test('should render icons when provided', async ({ page }) => {
      // Find the "With Icons" lineage using aria-label
      const iconsRail = page.locator('[aria-label*="Lineage with icons"]')
      const icons = iconsRail.locator('svg')
      const iconCount = await icons.count()
      expect(iconCount).toBeGreaterThanOrEqual(3)
    })

    test('should have proper structure with role=list', async ({ page }) => {
      const container = page.locator('.lineage-rail').first()
      await expect(container).toHaveAttribute('role', 'list')
    })

    test('should have nodes with role=listitem', async ({ page }) => {
      const nodes = page.locator('.lineage-rail__node')
      const firstNode = nodes.first()
      await expect(firstNode).toHaveAttribute('role', 'listitem')
    })

    test('should handle empty nodes array', async ({ page }) => {
      // Find the "Empty Nodes" section by checking for the text fallback
      const fallbackText = page.locator('text=No lineage to display')
      await expect(fallbackText).toBeVisible()

      // Verify no lineage rail components render for empty array
      // Count lineage components - there should be 6 visible ones (all except empty)
      const railComponents = page.locator('.lineage-rail')
      const railCount = await railComponents.count()
      expect(railCount).toBe(6)
    })

    test('should have aria-label on container', async ({ page }) => {
      const container = page.locator('.lineage-rail').first()
      await expect(container).toHaveAttribute('aria-label')
    })
  })

  test.describe('Interactive Nodes', () => {
    test('should apply interactive class to clickable nodes', async ({ page }) => {
      // Find the "Interactive Nodes" lineage using aria-label
      const interactiveRail = page.locator('[aria-label*="Interactive lineage"]')
      const interactiveNodes = interactiveRail.locator('.lineage-rail__node--interactive')
      const count = await interactiveNodes.count()
      expect(count).toBe(3)
    })

    test('should set tabIndex on interactive nodes', async ({ page }) => {
      // Find the "Interactive Nodes" lineage using aria-label
      const interactiveRail = page.locator('[aria-label*="Interactive lineage"]')
      const interactiveNode = interactiveRail.locator('.lineage-rail__node--interactive').first()
      await expect(interactiveNode).toHaveAttribute('tabindex', '0')
    })

    test('should not set tabIndex on non-interactive nodes', async ({ page }) => {
      // Find the "Simple 3-Node Chain" lineage (non-interactive)
      const simpleRail = page.locator('[aria-label*="Simple lineage chain"]')
      const simpleNode = simpleRail.locator('.lineage-rail__node').first()
      const tabIndex = await simpleNode.getAttribute('tabindex')
      expect(tabIndex).toBeNull()
    })

    test('should support click on interactive node without errors', async ({ page }) => {
      // Find the "Interactive Nodes" lineage
      const interactiveRail = page.locator('[aria-label*="Interactive lineage"]')
      const firstNode = interactiveRail.locator('.lineage-rail__node').first()

      // Click should not throw an error
      await firstNode.click()
      // Node should still be visible after click
      await expect(firstNode).toBeVisible()
    })

    test('should be focusable and keyboard-accessible on interactive node', async ({ page }) => {
      // Find the "Interactive Nodes" lineage
      const interactiveRail = page.locator('[aria-label*="Interactive lineage"]')
      const secondNode = interactiveRail.locator('.lineage-rail__node').nth(1)

      // Focus the node
      await secondNode.focus()
      await expect(secondNode).toBeFocused()

      // Press Enter should not throw an error
      await page.keyboard.press('Enter')
      await expect(secondNode).toBeVisible()
    })

    test('should support Space key on interactive node', async ({ page }) => {
      // Find the "Interactive Nodes" lineage
      const interactiveRail = page.locator('[aria-label*="Interactive lineage"]')
      const thirdNode = interactiveRail.locator('.lineage-rail__node').nth(2)

      // Focus the node
      await thirdNode.focus()
      await expect(thirdNode).toBeFocused()

      // Press Space should not throw an error
      await page.keyboard.press(' ')
      await expect(thirdNode).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have aria-current="step" on head node', async ({ page }) => {
      // Find the "Interactive Nodes" lineage where the first node is the head
      const interactiveRail = page.locator('[aria-label*="Interactive lineage"]')
      const firstNode = interactiveRail.locator('.lineage-rail__node').first()
      await expect(firstNode).toHaveAttribute('aria-current', 'step')
    })

    test('should not have aria-current on non-head nodes', async ({ page }) => {
      // Find the "Interactive Nodes" lineage
      const interactiveRail = page.locator('[aria-label*="Interactive lineage"]')
      const secondNode = interactiveRail.locator('.lineage-rail__node').nth(1)
      const ariaCurrent = await secondNode.getAttribute('aria-current')
      expect(ariaCurrent).toBeNull()
    })

    test('should have aria-current="step" on head node in multi-node lineage', async ({ page }) => {
      const simpleRail = page.locator('[aria-label*="Simple lineage chain"]')
      const firstNode = simpleRail.locator('.lineage-rail__node').first()
      await expect(firstNode).toHaveAttribute('aria-current', 'step')

      const secondNode = simpleRail.locator('.lineage-rail__node').nth(1)
      const secondAriaCurrent = await secondNode.getAttribute('aria-current')
      expect(secondAriaCurrent).toBeNull()
    })

    test('should be focusable for interactive nodes via keyboard', async ({ page }) => {
      const interactiveRail = page.locator('[aria-label*="Interactive lineage"]')
      const firstNode = interactiveRail.locator('.lineage-rail__node').first()

      await firstNode.focus()
      await expect(firstNode).toBeFocused()
    })

    test('should not be focusable for non-interactive nodes', async ({ page }) => {
      const simpleRail = page.locator('[aria-label*="Simple lineage chain"]')
      const firstNode = simpleRail.locator('.lineage-rail__node').first()

      // Try to focus, but since it doesn't have tabindex, it should not be in tab order
      const tabIndex = await firstNode.getAttribute('tabindex')
      expect(tabIndex).toBeNull()
    })
  })

  test.describe('Head Node Styling', () => {
    test('should apply head class to first node', async ({ page }) => {
      const simpleRail = page.locator('[aria-label*="Simple lineage chain"]')
      const firstNode = simpleRail.locator('.lineage-rail__node').first()
      await expect(firstNode).toHaveClass(/lineage-rail__node--head/)
    })

    test('should not apply head class to non-first nodes', async ({ page }) => {
      const simpleRail = page.locator('[aria-label*="Simple lineage chain"]')
      const secondNode = simpleRail.locator('.lineage-rail__node').nth(1)
      const headClass = await secondNode.getAttribute('class')
      expect(headClass).not.toMatch(/lineage-rail__node--head/)
    })
  })

  test.describe('Wrapping Behavior', () => {
    test('should have wrap class when wrap prop is true', async ({ page }) => {
      // Find the wrapped lineage using aria-label
      const wrapRail = page.locator('[aria-label*="wrapping"]')
      await expect(wrapRail).toHaveClass(/lineage-rail--wrap/)
    })

    test('should not have wrap class when wrap prop is false', async ({ page }) => {
      // Find the simple lineage (no wrapping)
      const simpleRail = page.locator('[aria-label*="Simple lineage chain"]')
      const wrapClass = await simpleRail.getAttribute('class')
      expect(wrapClass).not.toMatch(/lineage-rail--wrap/)
    })
  })

  test.describe('Visual Regression - Light Canvas', () => {
    test('light canvas snapshot', async ({ page }) => {
      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('lineage-rail-light-canvas.png', { fullPage: true })
    })
  })

  test.describe('Visual Regression - Dark Canvas', () => {
    test('dark canvas snapshot', async ({ page }) => {
      await applyDarkCanvasMode(page)
      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('lineage-rail-dark-canvas.png', { fullPage: true })
    })
  })
})
