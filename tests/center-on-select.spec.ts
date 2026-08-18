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

test.describe('GraphCanvas centerOnSelect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=center-on-select')
    await page.waitForLoadState('networkidle')
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

  test('clicking a node directly on the canvas also centers it (no special-casing by selection origin)', async ({
    page,
  }) => {
    // The origin node is already selected/centered by default; clicking "East" ON THE CANVAS
    // (not via the external selector) exercises onNodeSelect -> selectedNodeId, the same prop
    // change path an external selection takes. dispatchEvent (not .click()) because East starts
    // off-screen at the initial view (that's the point of the test) — Playwright's mouse-based
    // click refuses a target with no on-screen coordinates even with force: true.
    await page.locator('[data-testid="graph-node-east"] .graph-node').dispatchEvent('click')
    await page.waitForTimeout(150)

    const target = await containerCenter(page)
    const east = await nodeCenter(page, 'east')
    expect(Math.abs(east.x - target.x)).toBeLessThan(5)
    expect(Math.abs(east.y - target.y)).toBeLessThan(5)
  })
})
