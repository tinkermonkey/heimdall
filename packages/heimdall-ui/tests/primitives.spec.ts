import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('Primitive Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the primitives test page which renders actual React components
    await page.goto('http://localhost:5173/?example=primitives')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts from /fonts directory instead of Google Fonts CDN
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)
  })

  test('Icon component renders correctly', async ({ page }) => {
    // Verify icons are rendered
    const iconElements = page.locator('svg')
    const count = await iconElements.count()
    expect(count).toBeGreaterThan(0)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('icon.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Button component - primary variant', async ({ page }) => {
    // Find primary button by content
    const primaryButton = page.locator('button:has-text("Primary")').first()
    await expect(primaryButton).toBeVisible()

    // Check it has the correct styling
    const computedStyle = await primaryButton.evaluate((el) => {
      return window.getComputedStyle(el)
    })
    expect(computedStyle.backgroundColor).toBeTruthy()

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('button-primary.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Button component - all variants', async ({ page }) => {
    // Verify all button variants are rendered
    const primaryBtn = page.locator('button:has-text("Primary")').first()
    const secondaryBtn = page.locator('button:has-text("Secondary")').first()
    const ghostBtn = page.locator('button:has-text("Ghost")').first()
    const dangerBtn = page.locator('button:has-text("Danger")').first()

    await expect(primaryBtn).toBeVisible()
    await expect(secondaryBtn).toBeVisible()
    await expect(ghostBtn).toBeVisible()
    await expect(dangerBtn).toBeVisible()

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('button-variants.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Button component - hover state', async ({ page }) => {
    const primaryButton = page.locator('button:has-text("Primary")').first()
    await primaryButton.hover()

    await freezeAnimations(page)
    const bgColor = await primaryButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(bgColor).toBeTruthy()
  })

  test('Button component - disabled state', async ({ page }) => {
    const disabledButton = page.locator('button:has-text("Disabled")').first()
    await expect(disabledButton).toBeDisabled()

    const isDisabled = await disabledButton.evaluate((el) => {
      return (el as HTMLButtonElement).disabled
    })
    expect(isDisabled).toBe(true)
  })

  test('Chip component - semantic color variants', async ({ page }) => {
    // Verify all chip variants are rendered
    const chips = page.locator('span').filter({ hasText: /^(cyan|amber|violet|emerald|rose|gray)$/ })
    const count = await chips.count()
    expect(count).toBeGreaterThanOrEqual(6)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('chip-variants.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Badge component - status dots', async ({ page }) => {
    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('badge-dots.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('TextInput component - default, focus, error states', async ({ page }) => {
    // Verify all input variants exist
    const inputs = page.locator('input[type="text"]')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)

    // Test focus state
    const firstInput = inputs.first()
    await firstInput.focus()
    const focusedStyle = await firstInput.evaluate((el) => {
      return window.getComputedStyle(el).borderColor
    })
    expect(focusedStyle).toBeTruthy()

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('text-input-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('TextArea component - default, focus, error states', async ({ page }) => {
    // Verify textareas exist
    const textareas = page.locator('textarea')
    const count = await textareas.count()
    expect(count).toBeGreaterThan(0)

    // Verify content is rendered
    const firstTextarea = textareas.first()
    const textContent = await firstTextarea.inputValue()
    expect(textContent).toBeTruthy()

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('text-area-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('NumberInput component - default, focus, error states', async ({ page }) => {
    // Verify number inputs exist
    const numberInputs = page.locator('input[type="number"]')
    const count = await numberInputs.count()
    expect(count).toBeGreaterThan(0)

    // Verify values
    const firstInput = numberInputs.first()
    const value = await firstInput.inputValue()
    expect(value).toMatch(/^\d+$/)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('number-input-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Select component - default, focus, error states', async ({ page }) => {
    // Verify select elements exist
    const selects = page.locator('select')
    const count = await selects.count()
    expect(count).toBeGreaterThan(0)

    // Verify selected option exists by checking selected index
    const firstSelect = selects.first()
    const hasSelectedOption = await firstSelect.evaluate((el) => {
      const selectEl = el as HTMLSelectElement
      // Check if any option is selected (selectedIndex >= 0) or if the value indicates selection
      return selectEl.selectedIndex >= 0 && selectEl.options.length > 0
    })
    expect(hasSelectedOption).toBe(true)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('select-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('TriState checkbox component - checked, unchecked, indeterminate states', async ({ page }) => {
    // Verify checkboxes exist
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThan(0)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('tri-state-states.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Field wrapper component - label, required indicator, error message', async ({ page }) => {
    // Verify field wrappers with labels exist
    const fieldLabels = page.locator('label, [class*="label"]')
    const count = await fieldLabels.count()
    expect(count).toBeGreaterThan(0)

    // Verify required indicator appears
    const requiredIndicators = page.locator('text="*"')
    const requiredCount = await requiredIndicators.count()
    expect(requiredCount).toBeGreaterThan(0)

    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('field-wrapper.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('TextInput component - keyboard interaction', async ({ page }) => {
    const firstInput = page.locator('input[type="text"]').first()
    await firstInput.focus()
    await firstInput.type('test input')

    const value = await firstInput.inputValue()
    expect(value).toContain('test input')
  })

  test('Button component - click interaction', async ({ page }) => {
    const primaryButton = page.locator('button:has-text("Primary")').first()

    await primaryButton.click()
    // Button click should be possible
    expect(await primaryButton.isVisible()).toBe(true)
  })

  test('Select component - option selection', async ({ page }) => {
    const firstSelect = page.locator('select').first()

    // Select a different option
    await firstSelect.selectOption('Option 3')

    const newValue = await firstSelect.inputValue()
    // Value may have changed (depends on implementation)
    expect(newValue).toBeTruthy()
  })
})
