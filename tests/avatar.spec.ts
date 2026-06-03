import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('Avatar Component', () => {
  test('light canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=avatar')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('avatar-light-canvas.png')
  })

  test('dark canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=avatar')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('avatar-dark-canvas.png')
  })
})
