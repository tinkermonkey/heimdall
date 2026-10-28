import { test, expect, type Locator, type Page } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

// fitView / zoom-to-fit must frame the decoration circles GraphCanvas draws around the nodes
// (cluster/trunk boundaries, radial-tree hierarchy rings), not just the nodes. Radial-tree trunk
// boundaries reach well past the outermost nodes, so a node-only fit clips them (issue #305).

const RADIAL = 'http://localhost:5173/?example=radial-tree-test'

async function prepare(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await loadSelfHostedFonts(page)
  await assertFontsLoaded(page)
  await freezeAnimations(page)
}

/** Waits until the viewport transform has been applied and stops changing. */
async function waitForSettledViewport(canvas: Locator) {
  const viewport = canvas.locator('[data-testid="graph-viewport"]')
  let last: string | null = null
  await expect
    .poll(async () => {
      const current = await viewport.getAttribute('transform')
      const settled = current !== null && current === last
      last = current
      return settled
    }, { intervals: [250] })
    .toBe(true)
}

/**
 * How far (px) each circle matching `selector` reaches outside `canvas`'s on-screen box, worst
 * side first. Zero or less means the whole circle is in frame.
 */
async function circleOverflows(canvas: Locator, selector: string) {
  return canvas.evaluate((root, sel) => {
    const box = root.getBoundingClientRect()
    return [...root.querySelectorAll(sel)].map((el) => {
      const c = el.getBoundingClientRect()
      return Math.max(box.left - c.left, c.right - box.right, box.top - c.top, c.bottom - box.bottom)
    })
  }, selector)
}

async function expectCirclesInFrame(canvas: Locator, selector: string) {
  const overflows = await circleOverflows(canvas, selector)
  expect(overflows.length, `expected some ${selector} circles`).toBeGreaterThan(0)
  // Half a pixel of slack for subpixel rounding.
  expect(Math.max(...overflows), `worst ${selector} overflow (px)`).toBeLessThanOrEqual(0.5)
}

test.describe('integration: fit frames boundary circles (#305)', () => {
  test.describe('radial-tree mount fit', () => {
    for (const view of ['single', 'multi', 'mixed'] as const) {
      test(`trunk boundaries stay in frame (${view} view)`, async ({ page }) => {
        await prepare(page, `${RADIAL}&fitView=1&boundaries=1&rings=0&view=${view}`)
        const canvas = page.locator('.graph-canvas')
        await waitForSettledViewport(canvas)
        await expectCirclesInFrame(canvas, '.graph-cluster-boundary')
      })
    }

    test('hierarchy rings stay in frame (showHierarchyRings, boundaries off)', async ({ page }) => {
      await prepare(page, `${RADIAL}&fitView=1&rings=1&view=mixed`)
      const canvas = page.locator('.graph-canvas')
      await waitForSettledViewport(canvas)
      await expect(canvas.locator('.graph-cluster-boundary')).toHaveCount(0)
      await expectCirclesInFrame(canvas, '.graph-hierarchy-ring')
    })

    test('boundaries and rings together stay in frame', async ({ page }) => {
      await prepare(page, `${RADIAL}&fitView=1&boundaries=1&rings=1&view=mixed`)
      const canvas = page.locator('.graph-canvas')
      await waitForSettledViewport(canvas)
      await expectCirclesInFrame(canvas, '.graph-cluster-boundary')
      await expectCirclesInFrame(canvas, '.graph-hierarchy-ring')
    })

    test('with no circles shown, the fit still hugs the nodes', async ({ page }) => {
      // Guards "no change when boundaries aren't shown": the node box should touch the 40px
      // fitPadding on its tighter axis, exactly as before.
      await prepare(page, `${RADIAL}&fitView=1&rings=0&view=mixed`)
      const canvas = page.locator('.graph-canvas')
      await waitForSettledViewport(canvas)
      await expect(canvas.locator('.graph-cluster-boundary, .graph-hierarchy-ring')).toHaveCount(0)
      const gaps = await canvas.evaluate((root) => {
        const box = root.getBoundingClientRect()
        const nodes = [...root.querySelectorAll('.graph-viewport [data-testid^="graph-node-"]')].map((n) =>
          n.getBoundingClientRect(),
        )
        const left = Math.min(...nodes.map((n) => n.left)) - box.left
        const right = box.right - Math.max(...nodes.map((n) => n.right))
        const top = Math.min(...nodes.map((n) => n.top)) - box.top
        const bottom = box.bottom - Math.max(...nodes.map((n) => n.bottom))
        return { left, right, top, bottom }
      })
      const tighter = Math.min(Math.max(gaps.left, gaps.right), Math.max(gaps.top, gaps.bottom))
      expect(tighter).toBeGreaterThan(38)
      expect(tighter).toBeLessThan(42)
    })
  })

  test.describe('force-clustered mount fit', () => {
    test('cluster bubbles stay in frame', async ({ page }) => {
      await prepare(page, 'http://localhost:5173/?example=graph')
      await page.locator('[data-testid="clustered-view-button"]').click()
      const canvas = page.locator('[data-testid="clustered-canvas"]')
      await waitForSettledViewport(canvas)
      await expectCirclesInFrame(canvas, '.graph-cluster-boundary')
    })
  })

  test.describe('toolbar zoom-to-fit', () => {
    for (const view of ['multi', 'mixed'] as const) {
      test(`frames trunk boundaries and rings (${view} view, no fitView)`, async ({ page }) => {
        // No fitView: the mount only centres at zoom 1, so the toolbar button is the only fit.
        await prepare(page, `${RADIAL}&boundaries=1&rings=1&view=${view}`)
        const canvas = page.locator('.graph-canvas')
        await waitForSettledViewport(canvas)
        await canvas.getByRole('button', { name: 'Zoom to fit' }).click()
        await waitForSettledViewport(canvas)
        await expectCirclesInFrame(canvas, '.graph-cluster-boundary')
        await expectCirclesInFrame(canvas, '.graph-hierarchy-ring')
      })
    }

    test('gives the same viewport as the mount fit', async ({ page }) => {
      await prepare(page, `${RADIAL}&fitView=1&boundaries=1&rings=1&view=mixed`)
      const canvas = page.locator('.graph-canvas')
      const viewport = canvas.locator('[data-testid="graph-viewport"]')
      await waitForSettledViewport(canvas)
      const mounted = await viewport.getAttribute('transform')
      // Move away first so the button has something to undo.
      await canvas.getByRole('button', { name: 'Zoom in' }).click()
      await waitForSettledViewport(canvas)
      expect(await viewport.getAttribute('transform')).not.toBe(mounted)
      await canvas.getByRole('button', { name: 'Zoom to fit' }).click()
      await waitForSettledViewport(canvas)
      expect(await viewport.getAttribute('transform')).toBe(mounted)
    })

    test('frames force-clustered bubbles after zooming in', async ({ page }) => {
      await prepare(page, 'http://localhost:5173/?example=graph')
      await page.locator('[data-testid="clustered-view-button"]').click()
      const canvas = page.locator('[data-testid="clustered-canvas"]')
      await waitForSettledViewport(canvas)
      await canvas.getByRole('button', { name: 'Zoom in' }).click()
      await canvas.getByRole('button', { name: 'Zoom in' }).click()
      await waitForSettledViewport(canvas)
      await canvas.getByRole('button', { name: 'Zoom to fit' }).click()
      await waitForSettledViewport(canvas)
      await expectCirclesInFrame(canvas, '.graph-cluster-boundary')
    })
  })
})
