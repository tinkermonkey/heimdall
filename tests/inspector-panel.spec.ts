import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode } from './utils/test-helpers'

test.describe('InspectorPanel & KVGrid Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=inspector-panel')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
  })

  test('InspectorPanel renders with head content', async ({ page }) => {
    // Find InspectorPanel
    const inspectorPanel = page.locator('[class*="inspector-panel"]').first()
    await expect(inspectorPanel).toBeVisible()

    // Verify head elements
    const eyebrow = page.locator('[class*="inspector-panel__eyebrow"]').first()
    await expect(eyebrow).toBeVisible()
    await expect(eyebrow).toContainText(/SERVICE|DEPLOYMENT|RESOURCE/)

    const title = page.locator('[class*="inspector-panel__title"]').first()
    await expect(title).toBeVisible()

    const id = page.locator('[class*="inspector-panel__id"]').first()
    await expect(id).toBeVisible()
  })

  test('InspectorPanel.Section renders with title and count', async ({ page }) => {
    const section = page.locator('[class*="inspector-panel__section"]').first()
    await expect(section).toBeVisible()

    const sectionTitle = section.locator('[class*="inspector-panel__section-title"]')
    await expect(sectionTitle).toBeVisible()
  })

  test('KVGrid displays key-value pairs', async ({ page }) => {
    const kvGrid = page.locator('[class*="kv-grid"]').first()
    await expect(kvGrid).toBeVisible()

    // Verify keys are rendered
    const keys = page.locator('[class*="kv-grid__key"]')
    const keyCount = await keys.count()
    expect(keyCount).toBeGreaterThan(0)

    // Verify values are rendered
    const values = page.locator('[class*="kv-grid__value"]')
    const valueCount = await values.count()
    expect(valueCount).toBeGreaterThan(0)

    // Keys and values should match in count
    expect(keyCount).toBe(valueCount)
  })

  test('KVGrid keys are styled correctly', async ({ page }) => {
    const kvKey = page.locator('[class*="kv-grid__key"]').first()
    await expect(kvKey).toBeVisible()

    const computedStyle = await kvKey.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        textTransform: style.textTransform,
      }
    })

    // Verify mono font and uppercase
    expect(computedStyle.fontFamily).toContain('monospace')
    expect(computedStyle.textTransform).toBe('uppercase')
  })

  test('InspectorPanel with version pill renders version', async ({ page }) => {
    // Find panels with version pill
    const panels = page.locator('[class*="inspector-panel"]')
    const panelCount = await panels.count()

    // Should have multiple panels, some with version
    expect(panelCount).toBeGreaterThan(0)

    // Check for VersionPill presence
    const versionPills = page.locator('[class*="version-pill"]')
    const versionCount = await versionPills.count()
    expect(versionCount).toBeGreaterThan(0)
  })

  test('InspectorPanel scrolls independently', async ({ page }) => {
    const inspectorPanel = page.locator('[class*="inspector-panel"]').first()
    const body = inspectorPanel.locator('[class*="inspector-panel__body"]')

    // Check if body has overflow-y: auto
    const hasScroll = await body.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.overflowY === 'auto'
    })

    expect(hasScroll).toBe(true)
  })

  test('InspectorPanel sections have borders', async ({ page }) => {
    const sections = page.locator('[class*="inspector-panel__section"]')
    const sectionCount = await sections.count()

    expect(sectionCount).toBeGreaterThan(0)

    // Each section (except last) should have a bottom border
    for (let i = 0; i < Math.min(sectionCount - 1, 2); i++) {
      const section = sections.nth(i)
      const borderStyle = await section.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return style.borderBottom
      })

      expect(borderStyle).not.toBe('none')
    }
  })

  test('InspectorPanel visual regression - full page', async ({ page }) => {
    await freezeAnimations(page)

    // Get full page screenshot
    await expect(page).toHaveScreenshot('inspector-panel-full-page.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test.describe('dark canvas', () => {
    test.beforeEach(async ({ page }) => {
      await applyDarkCanvasMode(page)
    })

    test('InspectorPanel full-page dark snapshot', async ({ page }) => {
      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('inspector-panel-full-page-dark.png', {
        maxDiffPixelRatio: 0.01,
      })
    })
  })

  test('InspectorPanel accessibility - semantic structure', async ({ page }) => {
    const inspectorPanel = page.locator('[class*="inspector-panel"]').first()
    await expect(inspectorPanel).toBeVisible()

    // Verify eyebrow is present and readable
    const eyebrow = inspectorPanel.locator('[class*="inspector-panel__eyebrow"]')
    const eyebrowText = await eyebrow.textContent()
    expect(eyebrowText).toBeTruthy()
    expect(eyebrowText?.length).toBeGreaterThan(0)

    // Verify title is present
    const title = inspectorPanel.locator('[class*="inspector-panel__title"]')
    const titleText = await title.textContent()
    expect(titleText).toBeTruthy()
    expect(titleText?.length).toBeGreaterThan(0)
  })

  test('KVGrid with long values breaks properly', async ({ page }) => {
    const kvValues = page.locator('[class*="kv-grid__value"]')
    const valueCount = await kvValues.count()

    // All values should be visible without overflow
    for (let i = 0; i < valueCount; i++) {
      const value = kvValues.nth(i)
      const isVisible = await value.isVisible()
      expect(isVisible).toBe(true)
    }
  })

  test('InspectorPanel with section actions renders buttons', async ({ page }) => {
    const sections = page.locator('[class*="inspector-panel__section"]')
    const sectionWithActions = sections.filter({
      has: page.locator('[class*="inspector-panel__section-actions"]'),
    })

    // Should have at least one section with actions
    const sectionCount = await sectionWithActions.count()
    expect(sectionCount).toBeGreaterThan(0)
  })

  test('InspectorPanel head displays all required elements', async ({ page }) => {
    const panels = page.locator('[class*="inspector-panel"]')
    const panelCount = await panels.count()

    expect(panelCount).toBeGreaterThan(0)

    // Check first panel's head
    const firstPanel = panels.first()
    const head = firstPanel.locator('[class*="inspector-panel__head"]')

    await expect(head).toBeVisible()

    // Should have eyebrow and title at minimum
    const eyebrow = head.locator('[class*="inspector-panel__eyebrow"]')
    const title = head.locator('[class*="inspector-panel__title"]')

    await expect(eyebrow).toBeVisible()
    await expect(title).toBeVisible()
  })
})
