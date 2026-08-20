import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('integration: DiffViewer Components', () => {
  test('light canvas full page snapshot (covers empty, small, overflow states and glyph rendering)', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('diff-viewer-light-canvas.png', { fullPage: true })
  })

  test('dark canvas full page snapshot (covers empty, small, overflow states and glyph rendering)', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('diff-viewer-dark-canvas.png', { fullPage: true })
  })

  test('HashSetDiff collapse/expand interaction', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
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
})
