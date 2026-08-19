import { test, expect } from '@playwright/test'

/** Screen-space center of a node's rendered box (the inner `.graph-node` div, not the
 *  outer `<g data-testid="graph-node-...">` wrapper, which has no box of its own — see
 *  CenterOnSelectTestPage's own comment on why the click target differs from the testid). */
async function nodeCenter(page: import('@playwright/test').Page, id: string) {
  const box = await page.locator(`[data-testid="graph-node-${id}"] .graph-node`).boundingBox()
  if (!box) throw new Error(`node ${id} has no bounding box (not rendered/visible?)`)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function containerCenter(page: import('@playwright/test').Page) {
  const box = await page.locator('.graph-canvas').boundingBox()
  if (!box) throw new Error('.graph-canvas has no bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function viewportZoom(page: import('@playwright/test').Page): Promise<number> {
  const transform = await page.locator('[data-testid="graph-viewport"]').getAttribute('transform')
  const match = transform!.match(/matrix\(([^,]+),/)
  return parseFloat(match![1])
}

test.describe('integration: GraphCanvas centerOnSelect', () => {
  test('is off by default — selecting an off-screen node does not pan the viewport', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=center-on-select')
    await page.waitForLoadState('networkidle')

    const before = await nodeCenter(page, 'far')
    await page.getByTestId('select-far').click()
    await page.waitForTimeout(150)
    const after = await nodeCenter(page, 'far')

    // Same promise the CHANGELOG makes: "off by default so existing consumers see no
    // behavior change." Assert it directly rather than only testing the opt-in path.
    expect(Math.abs(after.x - before.x)).toBeLessThan(2)
    expect(Math.abs(after.y - before.y)).toBeLessThan(2)
  })

  test('fitView + a selection already set at mount centers using the post-fit zoom, not a stale pre-fit one', async ({
    page,
  }) => {
    // Seeds selectedNodeId, centerOnSelect, and fitView all true from the very first
    // render (rather than a click after mount) — the specific case where the mount
    // center/fit effect and the centerOnSelect effect can co-fire in the same commit,
    // with viewport.zoom in the centerOnSelect effect's own closure still the pre-fit
    // value. Reproduces a real caller shape too: a nav-tree deep link that restores an
    // already-selected node into a fitView'd galaxy/clustered layout.
    await page.goto('http://localhost:5173/?example=center-on-select&centerOnSelect=1&fitView=1&initialSelected=far')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(150)

    const target = await containerCenter(page)
    const far = await nodeCenter(page, 'far')
    expect(Math.abs(far.x - target.x)).toBeLessThan(5)
    expect(Math.abs(far.y - target.y)).toBeLessThan(5)
  })

  test.describe('with centerOnSelect enabled', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:5173/?example=center-on-select')
      await page.waitForLoadState('networkidle')
      await page.getByTestId('toggle-center-on-select').click()
    })

    test('pans to center a node selected externally (off-screen at the initial view)', async ({ page }) => {
      // Sanity: at the initial centered view, the far corner (900px/700px away from the
      // centered origin node) is NOT anywhere near the container center yet.
      const before = await nodeCenter(page, 'far')
      const target = await containerCenter(page)
      expect(Math.hypot(before.x - target.x, before.y - target.y)).toBeGreaterThan(100)

      // Selecting it via the EXTERNAL selector (not a canvas click — see the test page's own
      // comment on why that distinction matters) pans it to center.
      await page.getByTestId('select-far').click()
      await page.waitForTimeout(150)

      const after = await nodeCenter(page, 'far')
      expect(Math.abs(after.x - target.x)).toBeLessThan(5)
      expect(Math.abs(after.y - target.y)).toBeLessThan(5)
    })

    test('re-centers again when a different node is selected next', async ({ page }) => {
      await page.getByTestId('select-east').click()
      await page.waitForTimeout(150)
      await page.getByTestId('select-south').click()
      await page.waitForTimeout(150)

      const target = await containerCenter(page)
      const south = await nodeCenter(page, 'south')
      expect(Math.abs(south.x - target.x)).toBeLessThan(5)
      expect(Math.abs(south.y - target.y)).toBeLessThan(5)
    })

    test('pans only — zoom level is unchanged', async ({ page }) => {
      const before = await viewportZoom(page)
      await page.getByTestId('select-far').click()
      await page.waitForTimeout(150)
      const after = await viewportZoom(page)
      expect(after).toBeCloseTo(before, 5)
    })

    test('does not pan while pan/zoom is locked', async ({ page }) => {
      await page.getByLabel('Lock pan and zoom').click()

      const before = await nodeCenter(page, 'far')
      await page.getByTestId('select-far').click()
      await page.waitForTimeout(150)
      const after = await nodeCenter(page, 'far')

      expect(Math.abs(after.x - before.x)).toBeLessThan(2)
      expect(Math.abs(after.y - before.y)).toBeLessThan(2)
    })

    test('selecting an id with no matching node is a safe no-op, and normal selection still works after', async ({
      page,
    }) => {
      await page.getByTestId('select-east').click()
      await page.waitForTimeout(150)
      const before = await nodeCenter(page, 'east')

      await page.getByTestId('select-ghost').click()
      await page.waitForTimeout(150)
      const afterGhost = await nodeCenter(page, 'east')
      expect(Math.abs(afterGhost.x - before.x)).toBeLessThan(2)
      expect(Math.abs(afterGhost.y - before.y)).toBeLessThan(2)

      // The ghost selection must not have gotten "stuck" marked as handled in a way that
      // blocks a subsequent real selection.
      await page.getByTestId('select-south').click()
      await page.waitForTimeout(150)
      const target = await containerCenter(page)
      const south = await nodeCenter(page, 'south')
      expect(Math.abs(south.x - target.x)).toBeLessThan(5)
      expect(Math.abs(south.y - target.y)).toBeLessThan(5)
    })

    test('selecting an off-screen node via keyboard (Enter) also centers it', async ({ page }) => {
      // A real, reachable user interaction on a node with no on-screen coordinates —
      // clicking isn't reachable there, but focus + Enter is (GraphNode's own keydown
      // handler), so this proves the centered path fires for keyboard selection too.
      await page.locator('[data-testid="graph-node-east"] .graph-node').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(150)

      const target = await containerCenter(page)
      const east = await nodeCenter(page, 'east')
      expect(Math.abs(east.x - target.x)).toBeLessThan(5)
      expect(Math.abs(east.y - target.y)).toBeLessThan(5)
    })

    test('clicking an already-centered node on the canvas is a harmless no-op (no viewport jump)', async ({
      page,
    }) => {
      await page.getByTestId('select-east').click()
      await page.waitForTimeout(150)
      const before = await nodeCenter(page, 'east')

      await page.locator('[data-testid="graph-node-east"] .graph-node').click()
      await page.waitForTimeout(150)
      const after = await nodeCenter(page, 'east')

      expect(Math.abs(after.x - before.x)).toBeLessThan(2)
      expect(Math.abs(after.y - before.y)).toBeLessThan(2)
    })
  })
})
