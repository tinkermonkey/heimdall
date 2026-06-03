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

  test('empty HashSetDiff state in light canvas', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    const emptyHashDiff = page.locator('text=No changes between these versions').first()
    await expect(emptyHashDiff).toBeVisible()
    await expect(emptyHashDiff.locator('..')).toHaveScreenshot('empty-hash-diff-light.png')
  })

  test('empty SideBySideDiff state in light canvas', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    const emptySideDiff = page.locator('text=No changes between these versions').last()
    await expect(emptySideDiff).toBeVisible()
    await expect(emptySideDiff.locator('..')).toHaveScreenshot('empty-side-diff-light.png')
  })

  test('small dataset HashSetDiff in light canvas', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    const smallHashDiff = page.locator('.hash-set-diff').first()
    await expect(smallHashDiff).toBeVisible()
    await expect(smallHashDiff).toHaveScreenshot('small-hash-diff-light.png')
  })

  test('overflow HashSetDiff with collapse/expand in light canvas', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    const expandButton = page.locator('.hash-set-diff__expand-button').first()
    if (await expandButton.isVisible()) {
      await expect(expandButton).toHaveScreenshot('hash-diff-collapse-button-light.png')
      await expandButton.click()
      await expect(expandButton.locator('..')).toHaveScreenshot('hash-diff-expanded-light.png')
    }
  })

  test('empty states in dark canvas', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=diff-viewer')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)

    const emptyElements = page.locator('text=No changes between these versions')
    const count = await emptyElements.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const element = emptyElements.nth(i)
      await expect(element.locator('..')).toHaveScreenshot(`empty-diff-dark-${i}.png`)
    }
  })
})
