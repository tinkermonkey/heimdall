import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('Avatar Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=avatar')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)
  })

  test('Avatar component renders', async ({ page }) => {
    const avatars = page.locator('.avatar')
    const count = await avatars.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Initials are rendered', async ({ page }) => {
    const initials = page.locator('.avatar__initials')
    const count = await initials.count()
    expect(count).toBeGreaterThan(0)

    const firstText = await initials.first().textContent()
    expect(firstText).toBeTruthy()
    expect(firstText).toMatch(/^[A-Z]+$/)
  })

  test('Avatar sizes render correctly', async ({ page }) => {
    const sizes = ['avatar--xs', 'avatar--sm', 'avatar--md', 'avatar--lg']
    for (const size of sizes) {
      const element = page.locator(`.${size}`)
      await expect(element).toBeVisible()
    }
  })

  test('Avatar shapes render correctly', async ({ page }) => {
    const circle = page.locator('.avatar--circle')
    const rounded = page.locator('.avatar--rounded')

    await expect(circle).toBeVisible()
    await expect(rounded).toBeVisible()
  })

  test('Status indicators render', async ({ page }) => {
    const statusDots = page.locator('.avatar__status')
    const count = await statusDots.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Avatar with image renders', async ({ page }) => {
    const images = page.locator('.avatar__image')
    const count = await images.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Aria labels are present', async ({ page }) => {
    const withAriaLabel = page.locator('[aria-label]')
    const count = await withAriaLabel.count()
    expect(count).toBeGreaterThan(0)
  })

  test('light canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=avatar')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('avatar-light-canvas.png')
  })

  test('dark canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=avatar')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('avatar-dark-canvas.png')
  })
})
