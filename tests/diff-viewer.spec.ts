import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('DiffViewer Components', () => {
  test('light canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('diff-viewer-light-canvas.png', { fullPage: true })
  })

  test('dark canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('diff-viewer-dark-canvas.png', { fullPage: true })
  })
})
