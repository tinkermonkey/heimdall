import { test, expect } from '@playwright/test'
import {
  freezeAnimations,
  loadSelfHostedFonts,
  assertFontsLoaded,
  applyDarkCanvasMode,
  removeDarkCanvasMode,
} from './utils/test-helpers'

test.describe('integration: Galaxy Layout Collapse/Expand', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=graph')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)

    // Freeze animations for consistent snapshots
    await freezeAnimations(page)

    // Switch to Galaxy View
    await page.locator('[data-testid="galaxy-view-button"]').click()
    await page.waitForTimeout(200)
  })

  test.afterEach(async ({ page }) => {
    // Ensure we exit dark canvas mode after each test
    await removeDarkCanvasMode(page)
  })

  // Helper function to check for overlapping node bounding boxes
  // Returns { count: total nodes, overlaps: number of overlapping pairs }
  async function nodeOverlaps(page: import('@playwright/test').Page) {
    const nodes = page.locator('[data-testid^="graph-node-"]')
    const count = await nodes.count()
    const boxes = []
    for (let i = 0; i < count; i++) {
      const box = await nodes.nth(i).boundingBox()
      if (box) boxes.push(box)
    }
    let overlaps = 0
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j]
        const overlapX =
          Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
        const overlapY =
          Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
        if (overlapX > 0 && overlapY > 0) overlaps++
      }
    }
    return { count, overlaps }
  }

  test('renders every node with no overlapping bounding boxes', async ({
    page,
  }) => {
    const { count, overlaps } = await nodeOverlaps(page)
    expect(count).toBe(28) // GALAXY_DEMO_NODES length, including the two orphans
    expect(overlaps).toBe(0)
  })

  test('collapsing a node hides its structural descendants and shows a hidden-count badge', async ({
    page,
  }) => {
    // organism -> eukaryote, prokaryote -> ... -> 10 structural descendants total
    const { count: before } = await nodeOverlaps(page)

    // The toggle button is inside the SVG foreignObject within the graph node
    // Use the direct selector from the GraphNode component
    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await page.waitForTimeout(300)

    await expect(
      page.locator('[data-testid="graph-node-eukaryote"]'),
    ).not.toBeAttached()
    await expect(
      page.locator('[data-testid="graph-node-chromosome"]'),
    ).not.toBeAttached()
    // organism itself stays visible, collapsed — only its subtree disappears
    await expect(
      page.locator('[data-testid="graph-node-organism"]'),
    ).toBeVisible()

    const { count: after } = await nodeOverlaps(page)
    expect(before - after).toBe(10)

    // Edges into the hidden subtree disappear too (no dangling endpoints)
    await expect(
      page.locator('[data-testid="graph-edge-e_organism_eukaryote"]'),
    ).not.toBeAttached()
  })

  test('expanding a collapsed node restores its structural descendants', async ({
    page,
  }) => {
    const { count: before } = await nodeOverlaps(page)

    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await toggle.click()
    await page.waitForTimeout(300)
    await expect(
      page.locator('[data-testid="graph-node-eukaryote"]'),
    ).not.toBeAttached()

    await toggle.click()
    await page.waitForTimeout(300)
    await expect(
      page.locator('[data-testid="graph-node-eukaryote"]'),
    ).toBeVisible()

    const { count: after, overlaps } = await nodeOverlaps(page)
    expect(after).toBe(before)
    expect(overlaps).toBe(0)
  })

  test('Cards mode renders without overlaps after collapse', async ({
    page,
  }) => {
    await page.locator('[data-testid="galaxy-card-size-button"]').click()

    // Scoped under the node's own unique outer testid — TopologyNode's inner testid, like
    // any content resolveNodeContent returns, is duplicated into the off-screen measurement copy.
    const card = page.locator(
      '[data-testid="graph-node-organism"] [data-testid="topology-node-organism"]',
    )
    await expect(card).toBeVisible()
    const box = await card.boundingBox()
    expect(box).toBeTruthy()

    // fitView zooms the whole graph to fit the panel, so the on-screen box is scaled down from
    // its true CSS size — divide out the current zoom to compare against TopologyNode's actual
    // min-width (much larger than GraphNode's ~138px default).
    const transform = await page
      .locator('[data-testid="graph-viewport"]')
      .getAttribute('transform')
    const zoom = parseFloat(transform!.match(/matrix\(([^,]+)/)![1])
    // A tiny tolerance against float division rounding (box.width / zoom can land a fraction of
    // a px under the true 180 depending on the exact zoom value) — asserting the exact integer
    // boundary made this fail on legitimate sub-pixel jitter unrelated to the card's real size.
    expect(box!.width / zoom).toBeGreaterThanOrEqual(179.5)

    const { overlaps } = await nodeOverlaps(page)
    expect(overlaps).toBe(0)
  })

  test('collapse toggle is visible and functional for parent nodes', async ({
    page,
  }) => {
    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await expect(toggle).toBeVisible()

    // Verify it's interactive
    await toggle.click()
    await page.waitForTimeout(300)
    await expect(
      page.locator('[data-testid="graph-node-eukaryote"]'),
    ).not.toBeAttached()

    // Expand again
    await toggle.click()
    await page.waitForTimeout(300)
    await expect(
      page.locator('[data-testid="graph-node-eukaryote"]'),
    ).toBeVisible()
  })

  test('nodes without structural children render no collapse toggle', async ({
    page,
  }) => {
    // brca1 is a leaf — reachable only via instanceOf from chromosome, no children of its own
    await expect(
      page.locator('[data-testid="graph-node-brca1"] .graph-node__collapse-toggle'),
    ).not.toBeAttached()
  })

  test('collapse maintains zero-overlap guarantee for galaxy layout', async ({
    page,
  }) => {
    const { overlaps: beforeCollapse } = await nodeOverlaps(page)
    expect(beforeCollapse).toBe(0)

    // Collapse organism
    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await toggle.click()
    await page.waitForTimeout(300)

    const { overlaps: afterCollapse } = await nodeOverlaps(page)
    expect(afterCollapse).toBe(0)
  })

  test('expand after collapse maintains zero-overlap guarantee', async ({
    page,
  }) => {
    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')

    // Collapse
    await toggle.click()
    await page.waitForTimeout(300)

    // Expand
    await toggle.click()
    await page.waitForTimeout(300)

    const { overlaps } = await nodeOverlaps(page)
    expect(overlaps).toBe(0)
  })

  test('hidden badge shows correct descendant count', async ({ page }) => {
    const organism = page.locator('[data-testid="graph-node-organism"]')

    // Collapse the node
    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await toggle.click()
    await page.waitForTimeout(300)

    // Hover to show the collapse control with badge
    await organism.hover()
    await page.waitForTimeout(100)

    // Badge should be visible in the GraphCollapseControl when collapsed
    const badge = page.locator('[data-testid="graph-collapse-control-organism"] .graph-collapse-control__badge')
    await expect(badge).toHaveText('10')

    // Expand and badge should disappear
    const toggle2 = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await toggle2.click()
    await page.waitForTimeout(300)

    // Hover again to see the control (should have no badge now)
    await organism.hover()
    await page.waitForTimeout(100)
    await expect(badge).not.toBeAttached()
  })

  test('galaxy layout collapse works in dark mode', async ({ page }) => {
    await applyDarkCanvasMode(page)
    await page.waitForTimeout(200)

    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await page.waitForTimeout(300)

    await expect(
      page.locator('[data-testid="graph-node-eukaryote"]'),
    ).not.toBeAttached()

    const { overlaps } = await nodeOverlaps(page)
    expect(overlaps).toBe(0)
  })

  test('edges connected to collapsed subtree are not rendered', async ({
    page,
  }) => {
    // Before collapse, edge should exist
    await expect(
      page.locator('[data-testid="graph-edge-e_organism_eukaryote"]'),
    ).toBeAttached()

    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await toggle.click()
    await page.waitForTimeout(300)

    // After collapse, edge should be gone
    await expect(
      page.locator('[data-testid="graph-edge-e_organism_eukaryote"]'),
    ).not.toBeAttached()

    // After expand, edge should be back
    await toggle.click()
    await page.waitForTimeout(300)
    await expect(
      page.locator('[data-testid="graph-edge-e_organism_eukaryote"]'),
    ).toBeAttached()
  })

  test('multiple collapses maintain zero-overlap guarantee', async ({ page }) => {
    const { count: initial } = await nodeOverlaps(page)

    // Collapse organism (10 descendants hidden)
    const toggleOrganism = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await toggleOrganism.click()
    await page.waitForTimeout(300)

    const { count: afterFirst, overlaps: overlapsAfterFirst } = await nodeOverlaps(page)
    expect(initial - afterFirst).toBe(10)
    expect(overlapsAfterFirst).toBe(0)

    // Collapse another node with children (find a cell or other parent)
    // First, try to find which nodes are parents by looking for toggle buttons
    const allNodes = page.locator('[data-testid^="graph-node-"]')
    const nodeCount = await allNodes.count()

    let collapsedAnother = false
    for (let i = 0; i < nodeCount; i++) {
      const node = allNodes.nth(i)
      const nodeId = await node.getAttribute('data-testid')
      if (nodeId && nodeId !== 'graph-node-organism') {
        const toggleBtn = node.locator('.graph-node__collapse-toggle')
        if (await toggleBtn.isVisible()) {
          await toggleBtn.click()
          await page.waitForTimeout(300)
          collapsedAnother = true
          break
        }
      }
    }

    if (collapsedAnother) {
      const { count: afterSecond, overlaps: overlapsAfterSecond } = await nodeOverlaps(page)
      expect(afterSecond).toBeLessThan(afterFirst)
      expect(overlapsAfterSecond).toBe(0)
    }
  })

  test.skip('galaxy layout collapse visual snapshot', async ({ page }) => {
    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    await toggle.click()
    await page.waitForTimeout(300)

    const canvas = page.locator('[data-testid="galaxy-canvas"]')
    await expect(canvas).toHaveScreenshot(
      'galaxy-layout-collapsed-light.png',
    )
  })

  test.skip('galaxy layout expand visual snapshot', async ({ page }) => {
    const toggle = page.locator('[data-testid="graph-node-organism"] .graph-node__collapse-toggle')
    // Collapse then expand for a clear visual of restored state
    await toggle.click()
    await page.waitForTimeout(300)
    await toggle.click()
    await page.waitForTimeout(300)

    const canvas = page.locator('[data-testid="galaxy-canvas"]')
    await expect(canvas).toHaveScreenshot(
      'galaxy-layout-expanded-light.png',
    )
  })
})
