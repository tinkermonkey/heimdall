import { test, expect } from '@playwright/test'

test.describe('GraphCanvas fullscreenContainerRef', () => {
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

    // Both siblings are still real, visible descendants of the fullscreen element.
    expect(await controlStrip.evaluate((el, w) => w.contains(el), await wrapper.elementHandle())).toBe(true)
    await expect(controlStrip).toBeVisible()
    expect(await detailDrawer.evaluate((el, w) => w.contains(el), await wrapper.elementHandle())).toBe(true)
    await expect(detailDrawer).toBeVisible()

    // Exiting via document.exitFullscreen() (what Esc does under the hood) rather than our own
    // button — confirms isFullscreen tracks the platform's actual state against the ref target,
    // not just the click handler's own optimistic assumption.
    await page.evaluate(() => document.exitFullscreen())
    await expect(enterBtn).toBeVisible()
    expect(await wrapper.evaluate(() => document.fullscreenElement)).toBeNull()
  })
})
