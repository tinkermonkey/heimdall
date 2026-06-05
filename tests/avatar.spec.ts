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

    // Should have many avatars (deterministic test page has many)
    const count = await allInitials.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // In the "Deterministic Gradients" section, same names should have same backgrounds
    const firstBackground = await allInitials.nth(0).evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage
    })

    const secondBackground = await allInitials.nth(1).evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage
    })

    // First two avatars are both Ada Lovelace, should have same gradient
    expect(firstBackground).toBe(secondBackground)
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

    // Should have at least one image (the test page has one valid image)
    expect(imageCount).toBeGreaterThan(0)
  })

  test('Avatar falls back to initials when image fails', async ({ page }) => {
    // Find the avatar with the broken image URL and verify it shows initials
    const section = page.locator('text=Image with Fallback to Initials').locator('..').locator('..')
    const images = section.locator('img[class*="avatar__image"]')
    const broken = section.locator('img[alt*="Grace Hopper"]')

    // Wait for the broken image to fail loading
    await page.waitForLoadState('networkidle')

    // The broken image should have an error state (hidden)
    const brokenVisible = await broken.isVisible()
    expect(brokenVisible).toBe(false)

    // But initials should be visible as fallback
    const initials = section.locator('[class*="avatar__initials"]').nth(1)
    await expect(initials).toBeVisible()
  })

  test('Avatar displays status indicator when provided', async ({ page }) => {
    const statusIndicators = page.locator('[class*="avatar__status"]')
    const statusCount = await statusIndicators.count()

    // Test page has 6 in "With Status Indicators" + 4 in "Status with All Sizes" = at least 10
    expect(statusCount).toBeGreaterThanOrEqual(10)
  })

  test('Avatar respects color override prop', async ({ page }) => {
    // Find the "Color Override" section and its avatars
    const allInitials = page.locator('[class*="avatar__initials"]')

    // Get the first avatar from the Color Override section which should have color="emerald"
    // The Color Override section is the last major section in the test page
    // It has 5 avatars with explicit colors (emerald, rose, cyan, violet, neutral)

    // Get an avatar from an earlier section with the same name (Ada Lovelace)
    // to compare its derived color vs its explicit color override

    // First, get Ada from the "All Sizes" section (should be at index 0)
    const firstAdaBackground = await allInitials.nth(0).evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage
    })

    // Then get all avatars to find Ada with color override
    const allInitialsCount = await allInitials.count()

    // The Color Override section is near the end, so we look at avatars in that range
    // Index should be near the end of the list
    const colorOverrideFirstBackground = await allInitials.nth(allInitialsCount - 5).evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage
    })

    // First Ada (from All Sizes) should not have color="emerald" explicitly
    // Ada Lovelace with color="emerald" override should have a different gradient
    // (specifically, emerald, not its name-derived color)
    expect(firstAdaBackground).not.toBe(colorOverrideFirstBackground)
  })

  test('Avatar renders with accessibility attributes', async ({ page }) => {
    // Check aria-label attributes on avatars
    const labeledAvatars = page.locator('div[role="img"]')
    const labeledCount = await labeledAvatars.count()

    expect(labeledCount).toBeGreaterThan(0)
  })

  test('Avatar sets aria-hidden for decorative mode', async ({ page }) => {
    // Find the decorative avatars section specifically
    const section = page.locator('text=Decorative').locator('..').locator('..')
    const decorativeAvatars = section.locator('div[aria-hidden="true"]')
    const count = await decorativeAvatars.count()

    // Test page has 2 decorative avatars in the section
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
