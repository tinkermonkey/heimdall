import { test, expect } from '@playwright/test'

async function viewportZoom(page: import('@playwright/test').Page): Promise<number> {
  const transform = await page.locator('[data-testid="graph-viewport"]').getAttribute('transform')
  const match = transform!.match(/matrix\(([^,]+),/)
  return parseFloat(match![1])
}

test.describe('integration: GraphCanvas fullscreenContainerRef', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=fullscreen-container-ref')
    await page.waitForLoadState('networkidle')
  })

  test('fullscreens the passed ancestor, not GraphCanvas\'s own root, keeping its siblings in the fullscreen subtree', async ({ page }) => {
    const wrapper = page.getByTestId('fullscreen-wrapper')
    const canvas = page.locator('.graph-canvas')
    const controlStrip = page.getByTestId('control-strip')
    const detailDrawer = page.getByTestId('detail-drawer')
    const enterBtn = page.locator('[aria-label="Fullscreen"]')
    const exitBtn = page.locator('[aria-label="Exit fullscreen"]')

    // Siblings render normally before fullscreen (baseline — they're always in the DOM here).
    await expect(controlStrip).toBeVisible()
    await expect(detailDrawer).toBeVisible()
    expect(await wrapper.evaluate(el => el === document.fullscreenElement)).toBe(false)

    await enterBtn.click()
    await expect(exitBtn).toBeVisible()

    // The WRAPPER became the fullscreen element, not GraphCanvas's own .graph-canvas root — this
    // is the whole point of the prop: without it, document.fullscreenElement would be `canvas`
    // and both siblings would fall outside the fullscreened subtree (invisible, however styled).
    expect(await wrapper.evaluate(el => el === document.fullscreenElement)).toBe(true)
    expect(await canvas.evaluate(el => el === document.fullscreenElement)).toBe(false)

    // Both siblings are still real, visible descendants of the fullscreen element. Containment is
    // checked from a single evaluate() (rather than passing an elementHandle across two locators)
    // so it stays one argument of a known, non-nullable type.
    expect(
      await controlStrip.evaluate(el => !!document.querySelector('[data-testid="fullscreen-wrapper"]')?.contains(el))
    ).toBe(true)
    await expect(controlStrip).toBeVisible()
    expect(
      await detailDrawer.evaluate(el => !!document.querySelector('[data-testid="fullscreen-wrapper"]')?.contains(el))
    ).toBe(true)
    await expect(detailDrawer).toBeVisible()

    // Exiting via document.exitFullscreen() (what Esc does under the hood) rather than our own
    // button — confirms isFullscreen tracks the platform's actual state against the ref target,
    // not just the click handler's own optimistic assumption.
    await page.evaluate(() => document.exitFullscreen())
    await expect(enterBtn).toBeVisible()
    expect(await wrapper.evaluate(() => document.fullscreenElement)).toBeNull()
  })

  test('an unrelated resize well after a no-resize fullscreen entry does not trigger a surprise fit', async ({
    page,
  }) => {
    // The wrapper is already height:100vh, so entering fullscreen here plausibly doesn't change
    // its measured size at all — exactly the condition that leaves a naive "pending fit" flag
    // armed with nothing to consume it. Confirms it doesn't survive to fire against a later,
    // unrelated resize instead.
    const zoomAtStart = await viewportZoom(page)

    await page.locator('[aria-label="Fullscreen"]').click()
    await expect(page.locator('[aria-label="Exit fullscreen"]')).toBeVisible()

    // Comfortably past the pending-fit's own bound, so if a fit was still armed it would have
    // already fired (or been cleared) by now — the point of this wait is to land squarely in the
    // "later, unrelated resize" case, not the fullscreen transition's own.
    await page.waitForTimeout(800)

    // A genuinely later resize, still while fullscreen — must not retroactively trigger a fit.
    // Uses the test page's own "grow control strip" control rather than page.setViewportSize:
    // real browser-window resizing is blocked by Chromium while genuinely fullscreen ("restore it
    // to normal state first"), and even an inline style change directly on the fullscreen element
    // itself has no effect there (browsers pin its own box to the screen size) — but shrinking a
    // flex SIBLING still resizes GraphCanvas's own container in turn, which is all this bug cares
    // about.
    await page.getByTestId('grow-control-strip').click()
    await page.waitForTimeout(300)

    const zoomAfter = await viewportZoom(page)
    expect(zoomAfter).toBeCloseTo(zoomAtStart, 5)
  })

  test('omitting the prop falls back to fullscreening GraphCanvas\'s own root (previous default behavior)', async ({
    page,
  }) => {
    await page.goto('http://localhost:5173/?example=fullscreen-container-ref&omitRef=1')
    await page.waitForLoadState('networkidle')

    const wrapper = page.getByTestId('fullscreen-wrapper')
    const canvas = page.locator('.graph-canvas')

    await page.locator('[aria-label="Fullscreen"]').click()
    await expect(page.locator('[aria-label="Exit fullscreen"]')).toBeVisible()

    // .graph-canvas itself is now the fullscreen element, NOT the wrapper — the CHANGELOG's
    // "omitting the prop is identical to previous behavior" claim, verified directly rather than
    // only ever exercising the prop-supplied path.
    expect(await canvas.evaluate(el => el === document.fullscreenElement)).toBe(true)
    expect(await wrapper.evaluate(el => el === document.fullscreenElement)).toBe(false)

    await page.evaluate(() => document.exitFullscreen())
    await expect(page.locator('[aria-label="Fullscreen"]')).toBeVisible()
  })
})
