import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('integration: DiffViewer Components', () => {
  test('light canvas full page snapshot (covers empty, small, overflow states and glyph rendering)', async ({ page }) => {
    await page.goto('/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('diff-viewer-light-canvas.png', { fullPage: true })
  })

  test('dark canvas full page snapshot (covers empty, small, overflow states and glyph rendering)', async ({ page }) => {
    await page.goto('/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('diff-viewer-dark-canvas.png', { fullPage: true })
  })

  test('HashSetDiff collapse/expand interaction', async ({ page }) => {
    await page.goto('/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    const expandButton = page.locator('.hash-set-diff__expand-button').first()
    await expect(expandButton).toBeVisible()
    await expandButton.click()
    await page.waitForTimeout(200)
    const rowsAfterExpand = await page.locator('.hash-set-diff__row').count()
    expect(rowsAfterExpand).toBeGreaterThan(10)
  })

  // The gutter's "added" / "removed" text is for screen readers only (#340). The test app's
  // Tailwind build has no rule by this name, so this exercises the library stylesheet itself
  // (`npm run check:package` also checks dist/style.css ships the rule).
  test('SideBySideDiff gutter labels are visually hidden', async ({ page }) => {
    await page.goto('/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    const label = page.locator('.side-by-side-diff__gutter--added .heimdall-visually-hidden').first()
    await expect(label).toHaveText('added')
    const box = await label.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { width: r.width, height: r.height, position: getComputedStyle(el).position }
    })
    expect(box).toEqual({ width: 1, height: 1, position: 'absolute' })
  })
})
