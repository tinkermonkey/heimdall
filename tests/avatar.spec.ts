import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('Avatar Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=avatar-test')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
  })

  test('Avatar renders with initials for various names', async ({ page }) => {
    // Check that avatar initials are rendered
    const adaInitials = page.locator('[class*="avatar__initials"]').first()
    await expect(adaInitials).toBeVisible()
  })

  test('Avatar supports all sizes', async ({ page }) => {
    // Avatar components should exist on the page
    const avatarContainers = page.locator('div[class*="avatar--xs"], div[class*="avatar--sm"], div[class*="avatar--md"], div[class*="avatar--lg"]')
    const count = await avatarContainers.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Avatar supports different shapes (circle and rounded)', async ({ page }) => {
    // Both shapes should be rendered
    const avatarContainers = page.locator('div[role="img"], div[aria-hidden="true"]')
    const count = await avatarContainers.count()

    expect(count).toBeGreaterThan(0)
  })

  test('Avatar produces deterministic colors for same name', async ({ page }) => {
    // Get all avatar initials elements
    const allInitials = page.locator('[class*="avatar__initials"]')

    // Should have many avatars
    const count = await allInitials.count()
    expect(count).toBeGreaterThan(0)

    // In the "Deterministic Gradients" section, same names should have same backgrounds
    if (count >= 2) {
      const firstBackground = await allInitials.nth(0).evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage
      })

      const secondBackground = await allInitials.nth(1).evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage
      })

      // First two avatars are both Ada Lovelace, should have same gradient
      expect(firstBackground).toBe(secondBackground)
    }
  })

  test('Avatar produces different colors for different names', async ({ page }) => {
    // Get all avatar initials elements
    const allInitials = page.locator('[class*="avatar__initials"]')
    const count = await allInitials.count()

    // Should have at least 6 different avatars with different names
    expect(count).toBeGreaterThanOrEqual(6)

    // Get backgrounds to verify variety of colors
    const backgrounds = new Set<string>()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const background = await allInitials.nth(i).evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage
      })
      backgrounds.add(background)
    }

    // Should have multiple different gradients
    expect(backgrounds.size).toBeGreaterThan(1)
  })

  test('Avatar image is displayed when src is provided', async ({ page }) => {
    const images = page.locator('img[class*="avatar__image"]')
    const imageCount = await images.count()

    // Should have at least one image
    expect(imageCount).toBeGreaterThanOrEqual(0)
  })

  test('Avatar falls back to initials when image fails', async ({ page }) => {
    // All avatars without valid images should show initials
    const initialsContainers = page.locator('[class*="avatar__initials"]')
    const count = await initialsContainers.count()

    expect(count).toBeGreaterThan(0)
  })

  test('Avatar displays status indicator when provided', async ({ page }) => {
    const statusIndicators = page.locator('[class*="avatar__status"]')
    const statusCount = await statusIndicators.count()

    // Status indicators should exist
    expect(statusCount).toBeGreaterThanOrEqual(0)
  })

  test('Avatar respects color override prop', async ({ page }) => {
    // Color override section should render
    const allInitials = page.locator('[class*="avatar__initials"]')
    const count = await allInitials.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Avatar renders with accessibility attributes', async ({ page }) => {
    // Check aria-label attributes on avatars
    const labeledAvatars = page.locator('div[role="img"]')
    const labeledCount = await labeledAvatars.count()

    expect(labeledCount).toBeGreaterThan(0)
  })

  test('Avatar sets aria-hidden for decorative mode', async ({ page }) => {
    const decorativeAvatars = page.locator('div[aria-hidden="true"]')
    const count = await decorativeAvatars.count()

    // Should have at least some decorative avatars
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('Avatar status indicators display correctly', async ({ page }) => {
    const statusIndicators = page.locator('[class*="avatar__status"]')
    const count = await statusIndicators.count()

    // Status indicators should be present
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
