import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from '../tests/utils/test-helpers'

test.describe('Shell Components Responsive Behavior', () => {
  test.describe('Mobile viewport at 768px', () => {
    test.beforeEach(async ({ page }) => {
      // Set viewport to 768px (breakpoint width)
      await page.setViewportSize({ width: 768, height: 1024 })

      // Navigate to the shell-framework test page
      await page.goto('http://localhost:5173/?example=shell-framework')
      await page.waitForLoadState('networkidle')

      // Load self-hosted fonts
      await loadSelfHostedFonts(page)
      await assertFontsLoaded(page)
    })

    test('Topbar search input should be hidden at 768px', async ({ page }) => {
      const searchWrap = page.locator('.topbar__search-wrap')
      await expect(searchWrap).not.toBeVisible()
    })

    test('Breadcrumbs should be visible and truncate', async ({ page }) => {
      const breadcrumbs = page.locator('nav.breadcrumbs').first()
      await expect(breadcrumbs).toBeVisible()

      // Check if breadcrumbs has overflow handling
      const breadcrumbsDiv = page.locator('.topbar__breadcrumbs').first()
      const computed = await breadcrumbsDiv.evaluate((el) => {
        const styles = window.getComputedStyle(el.querySelector('.breadcrumbs') || el)
        return {
          overflow: styles.overflow,
          textOverflow: styles.textOverflow,
          whiteSpace: styles.whiteSpace,
        }
      })

      expect(computed.overflow).toBe('hidden')
      expect(computed.textOverflow).toBe('ellipsis')
      expect(computed.whiteSpace).toBe('nowrap')
    })

    test('Topbar gap should be reduced to 8px', async ({ page }) => {
      const topbar = page.locator('.topbar').first()
      const gap = await topbar.evaluate((el) => {
        return window.getComputedStyle(el).gap
      })

      // The gap should be 8px at mobile
      expect(gap).toBe('8px')
    })

    test('Statusbar items should handle overflow', async ({ page }) => {
      const statusbar = page.locator('.statusbar').first()

      // Verify statusbar is visible
      await expect(statusbar).toBeVisible()

      // Check if center slot exists and has overflow handling
      const centerSlot = statusbar.locator('.statusbar__slot--center')
      const centerExists = await centerSlot.count() > 0

      if (centerExists) {
        const overflow = await centerSlot.evaluate((el) => {
          return window.getComputedStyle(el).overflow
        })
        expect(overflow).toBe('hidden')
      }
    })

    test('Statusbar items should have text truncation', async ({ page }) => {
      const statusbarItems = page.locator('.statusbar__item')
      if (await statusbarItems.count() > 0) {
        const firstItem = statusbarItems.first()
        const computed = await firstItem.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          return {
            whiteSpace: styles.whiteSpace,
            textOverflow: styles.textOverflow,
            overflow: styles.overflow,
          }
        })

        expect(computed.whiteSpace).toBe('nowrap')
        expect(computed.textOverflow).toBe('ellipsis')
        expect(computed.overflow).toBe('hidden')
      }
    })
  })

  test.describe('Mobile viewport at 414px', () => {
    test.beforeEach(async ({ page }) => {
      // Set viewport to 414px (mobile phone width)
      await page.setViewportSize({ width: 414, height: 896 })

      // Navigate to the shell-framework test page
      await page.goto('http://localhost:5173/?example=shell-framework')
      await page.waitForLoadState('networkidle')

      // Load self-hosted fonts
      await loadSelfHostedFonts(page)
      await assertFontsLoaded(page)
    })

    test('Topbar should not cause horizontal overflow', async ({ page }) => {
      const topbar = page.locator('.topbar').first()

      // Check if topbar fits within viewport
      const bbox = await topbar.boundingBox()
      expect(bbox?.width).toBeLessThanOrEqual(414)
    })

    test('Statusbar should not cause horizontal overflow', async ({ page }) => {
      const statusbar = page.locator('.statusbar').first()

      // Check if statusbar fits within viewport
      const bbox = await statusbar.boundingBox()
      expect(bbox?.width).toBeLessThanOrEqual(414)
    })
  })

  test.describe('Desktop viewport at 1200px', () => {
    test.beforeEach(async ({ page }) => {
      // Set viewport to desktop size
      await page.setViewportSize({ width: 1200, height: 800 })

      // Navigate to the shell-framework test page
      await page.goto('http://localhost:5173/?example=shell-framework')
      await page.waitForLoadState('networkidle')

      // Load self-hosted fonts
      await loadSelfHostedFonts(page)
      await assertFontsLoaded(page)
    })

    test('Topbar search input should be visible at desktop', async ({ page }) => {
      const searchWrap = page.locator('.topbar__search-wrap')
      await expect(searchWrap).toBeVisible()
    })

    test('Topbar gap should be 16px at desktop', async ({ page }) => {
      const topbar = page.locator('.topbar').first()
      const gap = await topbar.evaluate((el) => {
        return window.getComputedStyle(el).gap
      })

      // The gap should be 16px at desktop
      expect(gap).toBe('16px')
    })
  })
})
