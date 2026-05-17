import { test, expect } from '@playwright/test'
import { freezeAnimations, assertFontsLoaded } from './utils/test-helpers'

test.describe('Shell Framework Components', () => {
  test.describe('Topbar and TabBar Components - Visual Regression', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to the shell-framework test page which renders actual React components
      await page.goto('http://localhost:5173/?example=shell-framework')
      await page.waitForLoadState('networkidle')

      // Verify fonts are loaded from the app's CSS pipeline
      await assertFontsLoaded(page)
    })

    test('Topbar component renders with breadcrumbs and search', async ({ page }) => {
      // Verify topbar exists
      const topbar = page.locator('[class*="topbar"]').first()
      await expect(topbar).toBeVisible()

      // Verify breadcrumbs are rendered
      const breadcrumbs = page.locator('[class*="breadcrumbs"]')
      await expect(breadcrumbs).toBeVisible()

      // Verify search input exists
      const searchInput = page.locator('input[placeholder*="Search"]')
      await expect(searchInput).toBeVisible()
    })

    test('Topbar breadcrumb navigation is interactive', async ({ page }) => {
      // Find breadcrumb links
      const breadcrumbLinks = page.locator('[class*="breadcrumbs"] button, [class*="breadcrumbs"] a')
      const linkCount = await breadcrumbLinks.count()
      expect(linkCount).toBeGreaterThan(0)

      // Verify first breadcrumb is clickable
      const firstLink = breadcrumbLinks.first()
      await expect(firstLink).toBeVisible()
    })

    test('Topbar search input is functional', async ({ page }) => {
      // Find search input
      const searchInput = page.locator('input[placeholder*="Search"]')

      // Type in the search input
      await searchInput.click()
      await searchInput.type('test query')

      // Verify text was entered
      const value = await searchInput.inputValue()
      expect(value).toBe('test query')
    })

    test('TabBar component renders tabs with active state', async ({ page }) => {
      // Verify tab bar exists
      const tabBar = page.locator('[class*="tab-bar"]').first()
      await expect(tabBar).toBeVisible()

      // Verify tabs are rendered
      const tabs = page.locator('button[class*="tab-bar__tab"]')
      const tabCount = await tabs.count()
      expect(tabCount).toBeGreaterThan(0)
    })

    test('TabBar tab selection changes active tab', async ({ page }) => {
      // Get all tabs
      const tabs = page.locator('button[class*="tab-bar__tab"]')

      // Click the second tab
      const secondTab = tabs.nth(1)
      await secondTab.click()

      // Verify it's now marked as active
      const activeClass = await secondTab.getAttribute('class')
      expect(activeClass).toContain('active')
    })

    test('TabBar displays tab counts when provided', async ({ page }) => {
      // Find tabs with counts
      const countEls = page.locator('[class*="tab-bar__tab-count"]')
      const countCount = await countEls.count()
      expect(countCount).toBeGreaterThan(0)
    })

    test('Topbar and TabBar visual snapshot', async ({ page }) => {
      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('topbar-tabbar-full.png', {
        maxDiffPixelRatio: 0.1,
      })
    })

    test('Topbar with breadcrumbs visual snapshot', async ({ page }) => {
      const topbar = page.locator('[class*="topbar"]').first()
      await freezeAnimations(page)
      await expect(topbar).toHaveScreenshot('topbar-breadcrumbs.png', {
        maxDiffPixelRatio: 0.1,
      })
    })

    test('TabBar with all variants visual snapshot', async ({ page }) => {
      const tabBar = page.locator('[class*="tab-bar"]').first()
      await freezeAnimations(page)
      await expect(tabBar).toHaveScreenshot('tabbar-variants.png', {
        maxDiffPixelRatio: 0.1,
      })
    })
  })
})
