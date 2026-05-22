import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('FilterDropdown Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=filter-dropdown')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)

    // Freeze animations for consistent snapshots
    await freezeAnimations(page)
  })

  test('renders trigger button', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await expect(trigger).toBeVisible()
    await expect(trigger).toContainText('Filter')
  })

  test('opens panel when trigger is clicked', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Panel should now be visible
    const panel = page.locator('.filter-dropdown__panel').first()
    await expect(panel).toBeVisible()
  })

  test('displays section with title', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    const sectionTitle = page.locator('.filter-dropdown__section-title')
    await expect(sectionTitle).toBeVisible()
    await expect(sectionTitle).toContainText(/DOMAINS|NODE TYPE/)
  })

  test('displays checkbox items', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    const checkboxes = page.locator('.filter-dropdown__checkbox')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThan(0)
  })

  test('closes panel when clicking outside', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Panel should be visible
    let panel = page.locator('.filter-dropdown__panel').first()
    await expect(panel).toBeVisible()

    // Click outside the dropdown
    await page.click('body', { position: { x: 0, y: 0 } })

    // Panel should no longer be visible
    panel = page.locator('.filter-dropdown__panel')
    const panelCount = await panel.count()
    // After closing, panel count should be 0 or the first one should not be visible
    if (panelCount > 0) {
      await expect(panel.first()).not.toBeVisible()
    }
  })

  test('visual snapshot of checkbox mode', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    const panel = page.locator('.filter-dropdown__panel').first()
    await expect(panel).toHaveScreenshot('filter-dropdown-checkbox.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('visual snapshot of radio mode', async ({ page }) => {
    // Find the second FilterDropdown (radio mode example)
    const triggers = page.locator('.filter-dropdown__trigger')
    const secondTrigger = triggers.nth(1)
    await secondTrigger.click()

    const panels = page.locator('.filter-dropdown__panel')
    const secondPanel = panels.nth(1)
    await expect(secondPanel).toHaveScreenshot('filter-dropdown-radio.png', {
      maxDiffPixelRatio: 0.01,
    })
  })
})
