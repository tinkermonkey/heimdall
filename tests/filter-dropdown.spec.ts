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

  // Keyboard Navigation Tests - Checkbox Mode
  test('keyboard: Arrow Down navigates to next item in checkbox mode', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Get first row
    const rows = page.locator('.filter-dropdown__row')
    const firstRow = rows.nth(0)
    await firstRow.focus()
    await expect(firstRow).toBeFocused()

    // Press Arrow Down
    await page.keyboard.press('ArrowDown')

    // Get second row and verify it's focused
    const secondRow = rows.nth(1)
    await expect(secondRow).toBeFocused()
  })

  test('keyboard: Tab navigates forward through items in checkbox mode', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Get panel and first row
    const panel = page.locator('.filter-dropdown__panel').first()
    const rows = panel.locator('.filter-dropdown__row')
    const firstRow = rows.nth(0)
    await firstRow.focus()
    await expect(firstRow).toBeFocused()

    // Press Tab
    await page.keyboard.press('Tab')

    // Verify second item is focused
    const secondRow = rows.nth(1)
    await expect(secondRow).toBeFocused()
  })

  test('keyboard: Enter toggles checkbox selection', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Focus on first checkbox item
    const rows = page.locator('.filter-dropdown__row')
    const firstRow = rows.nth(0)
    const firstCheckbox = firstRow.locator('input[type="checkbox"]')
    await firstRow.focus()

    // Get initial checked state
    const isCheckedBefore = await firstCheckbox.isChecked()

    // Press Enter
    await page.keyboard.press('Enter')

    // Verify checkbox state toggled
    const isCheckedAfter = await firstCheckbox.isChecked()
    expect(isCheckedAfter).toBe(!isCheckedBefore)
  })

  test('keyboard: Space toggles checkbox selection', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Focus on first checkbox item
    const rows = page.locator('.filter-dropdown__row')
    const firstRow = rows.nth(0)
    const firstCheckbox = firstRow.locator('input[type="checkbox"]')
    await firstRow.focus()

    // Get initial checked state
    const isCheckedBefore = await firstCheckbox.isChecked()

    // Press Space
    await page.keyboard.press(' ')

    // Verify checkbox state toggled
    const isCheckedAfter = await firstCheckbox.isChecked()
    expect(isCheckedAfter).toBe(!isCheckedBefore)
  })

  test('keyboard: Escape closes panel and returns focus to trigger', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Panel should be visible
    let panel = page.locator('.filter-dropdown__panel').first()
    await expect(panel).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Panel should be hidden
    panel = page.locator('.filter-dropdown__panel').first()
    await expect(panel).not.toBeVisible()

    // Focus should return to trigger
    await expect(trigger).toBeFocused()
  })

  // Selection State Tests - Checkbox Mode
  test('checkbox mode: multiple selections allowed', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Get first two checkboxes
    const checkbox1 = page.locator('.filter-dropdown__checkbox').first()
    const checkbox2 = page.locator('.filter-dropdown__checkbox').nth(1)

    // Click first checkbox
    await checkbox1.click()
    await expect(checkbox1).toBeChecked()

    // Click second checkbox
    await checkbox2.click()
    await expect(checkbox2).toBeChecked()

    // Both should be checked
    await expect(checkbox1).toBeChecked()
    await expect(checkbox2).toBeChecked()
  })

  test('checkbox mode: unselecting works correctly', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    await trigger.click()

    // Get first checkbox
    const checkbox1 = page.locator('.filter-dropdown__checkbox').first()

    // Click to select
    await checkbox1.click()
    await expect(checkbox1).toBeChecked()

    // Click to deselect
    await checkbox1.click()
    await expect(checkbox1).not.toBeChecked()
  })

  test('checkbox mode: display updates selected count in trigger summary', async ({ page }) => {
    const trigger = page.locator('.filter-dropdown__trigger').first()
    const summary = trigger.locator('.filter-dropdown__summary')

    // Initially should show "None"
    let summaryText = await summary.textContent()
    expect(summaryText?.trim()).toBe('None')

    // Click trigger to open
    await trigger.click()

    // Select first checkbox
    const checkbox1 = page.locator('.filter-dropdown__checkbox').first()
    await checkbox1.click()

    // Click trigger to close
    await trigger.click()

    // Summary should now show "life" (first item)
    summaryText = await summary.textContent()
    expect(summaryText).toContain('life')
  })

  // Keyboard Navigation Tests - Radio Mode
  test('keyboard: Arrow Down navigates to next item in radio mode', async ({ page }) => {
    // Find the second FilterDropdown (radio mode example)
    const triggers = page.locator('.filter-dropdown__trigger')
    const secondTrigger = triggers.nth(1)
    await secondTrigger.click()

    // Get the radio panel
    const panels = page.locator('.filter-dropdown__panel')
    const radioPanel = panels.nth(1)

    // Get first row within radio panel
    const firstRow = radioPanel.locator('.filter-dropdown__row').nth(0)
    await firstRow.focus()
    await expect(firstRow).toBeFocused()

    // Press Arrow Down
    await page.keyboard.press('ArrowDown')

    // Get second row and verify it's focused
    const secondRow = radioPanel.locator('.filter-dropdown__row').nth(1)
    await expect(secondRow).toBeFocused()
  })

  test('keyboard: Tab navigates forward through items in radio mode', async ({ page }) => {
    // Find the second FilterDropdown (radio mode example)
    const triggers = page.locator('.filter-dropdown__trigger')
    const secondTrigger = triggers.nth(1)
    await secondTrigger.click()

    // Get the radio panel
    const panels = page.locator('.filter-dropdown__panel')
    const radioPanel = panels.nth(1)

    // Get first row and focus it
    const firstRow = radioPanel.locator('.filter-dropdown__row').nth(0)
    await firstRow.focus()
    await expect(firstRow).toBeFocused()

    // Press Tab
    await page.keyboard.press('Tab')

    // Verify second row is focused
    const secondRow = radioPanel.locator('.filter-dropdown__row').nth(1)
    await expect(secondRow).toBeFocused()
  })

  test('keyboard: Enter selects radio option and closes panel', async ({ page }) => {
    // Find the second FilterDropdown (radio mode example)
    const triggers = page.locator('.filter-dropdown__trigger')
    const secondTrigger = triggers.nth(1)
    await secondTrigger.click()

    // Panel should be visible
    const panels = page.locator('.filter-dropdown__panel')
    const radioPanel = panels.nth(1)
    await expect(radioPanel).toBeVisible()

    // Get second row and focus it
    const secondRow = radioPanel.locator('.filter-dropdown__row').nth(1)
    await secondRow.focus()

    // Press Enter
    await page.keyboard.press('Enter')

    // Panel should be closed (radio mode auto-closes on selection)
    await expect(radioPanel).not.toBeVisible()
  })

  test('keyboard: Space selects radio option and closes panel', async ({ page }) => {
    // Find the second FilterDropdown (radio mode example)
    const triggers = page.locator('.filter-dropdown__trigger')
    const secondTrigger = triggers.nth(1)
    await secondTrigger.click()

    // Panel should be visible
    const panels = page.locator('.filter-dropdown__panel')
    const radioPanel = panels.nth(1)
    await expect(radioPanel).toBeVisible()

    // Get second row and focus it
    const secondRow = radioPanel.locator('.filter-dropdown__row').nth(1)
    await secondRow.focus()

    // Press Space
    await page.keyboard.press(' ')

    // Panel should be closed (radio mode auto-closes on selection)
    await expect(radioPanel).not.toBeVisible()
  })

  // Selection State Tests - Radio Mode
  test('radio mode: only one selection allowed', async ({ page }) => {
    // Find the second FilterDropdown (radio mode example)
    const triggers = page.locator('.filter-dropdown__trigger')
    const secondTrigger = triggers.nth(1)

    // Open the dialog
    await secondTrigger.click()
    const panels = page.locator('.filter-dropdown__panel')
    const radioPanel = panels.nth(1)
    await expect(radioPanel).toBeVisible()

    // Get the rows within this panel
    const rows = radioPanel.locator('.filter-dropdown__row')

    // Get the aria-checked attribute from first row - should have default selection
    let firstRowChecked = await rows.nth(0).getAttribute('aria-checked')

    // Close the panel by selecting an item (radio mode auto-closes)
    await rows.nth(0).click()

    // Verify the panel is closed (auto-closes in radio mode)
    await expect(radioPanel).not.toBeVisible()

    // Re-open and select a different option
    await secondTrigger.click()
    const updatedPanel = page.locator('.filter-dropdown__panel').nth(1)
    const updatedRows = updatedPanel.locator('.filter-dropdown__row')

    // Click on second option to select it
    await updatedRows.nth(1).click()

    // Re-open to verify only second is selected
    await secondTrigger.click()
    const finalPanel = page.locator('.filter-dropdown__panel').nth(1)
    const finalRows = finalPanel.locator('.filter-dropdown__row')

    // Get aria-checked values
    const newFirstRowChecked = await finalRows.nth(0).getAttribute('aria-checked')
    const newSecondRowChecked = await finalRows.nth(1).getAttribute('aria-checked')

    // Verify that only one is selected (the second one)
    expect(newFirstRowChecked).toBe('false')
    expect(newSecondRowChecked).toBe('true')
  })

  test('radio mode: selection changes update trigger summary', async ({ page }) => {
    // Find the second FilterDropdown (radio mode example)
    const triggers = page.locator('.filter-dropdown__trigger')
    const secondTrigger = triggers.nth(1)
    const summary = secondTrigger.locator('.filter-dropdown__summary')

    // Initially should show "graph" (default selection)
    let summaryText = await summary.textContent()
    expect(summaryText?.trim()).toBe('graph')

    // Click trigger to open
    await secondTrigger.click()

    // Get the radio panel and click on second radio option (entity)
    const panels = page.locator('.filter-dropdown__panel')
    const radioPanel = panels.nth(1)
    const secondRow = radioPanel.locator('.filter-dropdown__row').nth(1)
    await secondRow.click()

    // Panel auto-closes in radio mode, so we reopen to verify
    await secondTrigger.click()

    // Summary should now show "entity"
    summaryText = await summary.textContent()
    expect(summaryText?.trim()).toBe('entity')
  })

})
