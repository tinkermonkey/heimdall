import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('Shell Components Responsive Behavior', () => {
  test.describe('Mobile viewport at 768px', () => {
    test.beforeEach(async ({ page }) => {
      // Set viewport to 768px (breakpoint width)
      await page.setViewportSize({ width: 768, height: 1024 })

      // Navigate to the shell test page
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
      expect(await centerSlot.count()).toBeGreaterThan(0)

      const overflow = await centerSlot.evaluate((el) => {
        return window.getComputedStyle(el).overflow
      })
      expect(overflow).toBe('hidden')
    })

    test('Statusbar items should have text truncation', async ({ page }) => {
      const statusbarItems = page.locator('.statusbar__item')
      expect(await statusbarItems.count()).toBeGreaterThan(0)

      const firstItem = statusbarItems.first()
      const statusbarLabel = firstItem.locator('.statusbar__label')
      expect(await statusbarLabel.count()).toBeGreaterThan(0)

      const computed = await statusbarLabel.evaluate((el) => {
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
    })
  })

  test.describe('Mobile viewport at 414px', () => {
    test.beforeEach(async ({ page }) => {
      // Set viewport to 414px (mobile phone width)
      await page.setViewportSize({ width: 414, height: 896 })

      // Navigate to the shell test page
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

      // Navigate to the shell test page
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

  test.describe('Mobile sidebar overlay behavior at 768px', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('http://localhost:5173/?example=shell-framework')
      await page.waitForLoadState('networkidle')
      await loadSelfHostedFonts(page)
      await assertFontsLoaded(page)
    })

    test('Hamburger toggle should be visible at 768px', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      await expect(toggle).toBeVisible()
    })

    test('Hamburger toggle should have menu icon', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      const icon = toggle.locator('svg')
      await expect(icon).toBeVisible()
    })

    test('Sidebar column should not be visible at 768px', async ({ page }) => {
      const sidebarCol = page.locator('.shell-layout__sidebar-col')
      // Sidebar column should not exist in DOM or be hidden
      const isVisible = await sidebarCol.isVisible().catch(() => false)
      expect(isVisible).toBe(false)
    })

    test('Clicking hamburger toggle opens sidebar drawer', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      const drawer = page.locator('.drawer')

      // Drawer should not be open initially
      await expect(drawer).toHaveAttribute('data-open', 'false')

      // Click toggle
      await toggle.click()

      // Drawer should now be open
      await expect(drawer).toHaveAttribute('data-open', 'true')
    })

    test('Drawer sidebar should be visible when toggle is clicked', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      const drawer = page.locator('.drawer')
      const sidebarInDrawer = drawer.locator('.sidebar')

      // Open drawer
      await toggle.click()
      await expect(drawer).toHaveAttribute('data-open', 'true')

      // Sidebar should be visible in drawer
      await expect(sidebarInDrawer).toBeVisible()
    })

    test('Clicking drawer backdrop closes the drawer', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      const drawer = page.locator('.drawer')
      const backdrop = drawer.locator('.drawer__backdrop')

      // Open drawer
      await toggle.click()
      await expect(drawer).toHaveAttribute('data-open', 'true')

      // Click backdrop
      await backdrop.click()

      // Drawer should be closed
      await expect(drawer).toHaveAttribute('data-open', 'false')
    })

    test('Pressing Escape key closes the drawer', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      const drawer = page.locator('.drawer')

      // Open drawer
      await toggle.click()
      await expect(drawer).toHaveAttribute('data-open', 'true')

      // Press Escape
      await page.keyboard.press('Escape')

      // Drawer should be closed
      await expect(drawer).toHaveAttribute('data-open', 'false')
    })

    test('Selecting a leaf nav item closes the drawer', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      const drawer = page.locator('.drawer')

      // Open drawer
      await toggle.click()
      await expect(drawer).toHaveAttribute('data-open', 'true')

      // Find and click a leaf nav item (one without children)
      const navItems = drawer.locator('.sidebar__item')
      const firstLeafItem = navItems.first()

      // Click the first item
      await firstLeafItem.click()

      // Drawer should close after selecting leaf item
      await expect(drawer).toHaveAttribute('data-open', 'false')
    })

    test('Selecting a parent nav item does not close the drawer', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      const drawer = page.locator('.drawer')

      // Open drawer
      await toggle.click()
      await expect(drawer).toHaveAttribute('data-open', 'true')

      // Find a parent nav item (one with children indicator)
      const navItems = drawer.locator('.sidebar__item')

      // Click the first expandable item
      await navItems.first().click()

      // Drawer should still be open (not closed by parent selection)
      await expect(drawer).toHaveAttribute('data-open', 'true')
    })
  })

  test.describe('Hamburger toggle hidden at desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      await page.goto('http://localhost:5173/?example=shell-framework')
      await page.waitForLoadState('networkidle')
      await loadSelfHostedFonts(page)
      await assertFontsLoaded(page)
    })

    test('Hamburger toggle should not be visible at 1200px', async ({ page }) => {
      const toggle = page.locator('.shell-layout__mobile-menu-toggle')
      const isVisible = await toggle.isVisible().catch(() => false)
      expect(isVisible).toBe(false)
    })

    test('Sidebar column should be visible at 1200px', async ({ page }) => {
      const sidebarCol = page.locator('.shell-layout__sidebar-col')
      await expect(sidebarCol).toBeVisible()
    })
  })
})
