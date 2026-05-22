import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('Data Display Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the data-display test page which renders actual React components
    await page.goto('http://localhost:5173/?example=data-display')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts from /fonts directory instead of Google Fonts CDN
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded from the app's CSS pipeline
    await assertFontsLoaded(page)
  })


  test('Table component renders with data', async ({ page }) => {
    // Verify table exists
    const table = page.locator('table')
    await expect(table).toBeVisible()

    // Verify header is rendered
    const headers = page.locator('th')
    const headerCount = await headers.count()
    expect(headerCount).toBeGreaterThan(0)

    // Verify body rows exist
    const bodyRows = page.locator('tbody tr')
    const rowCount = await bodyRows.count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('Table interactive behavior - row selection', async ({ page }) => {
    // Get select-all checkbox
    const selectAllCheckbox = page.locator('thead input[type="checkbox"]').first()
    await expect(selectAllCheckbox).toBeVisible()

    // Click select-all
    await selectAllCheckbox.click()

    // Verify individual row checkboxes are now checked
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]')
    const firstRowCheckbox = rowCheckboxes.first()
    const isChecked = await firstRowCheckbox.isChecked()
    expect(isChecked).toBe(true)

    // Click to deselect
    await selectAllCheckbox.click()

    // Verify rows are unchecked
    const isStillChecked = await firstRowCheckbox.isChecked()
    expect(isStillChecked).toBe(false)
  })

  test('Table interactive behavior - individual row selection', async ({ page }) => {
    // Get first row checkbox
    const firstRowCheckbox = page.locator('tbody input[type="checkbox"]').first()
    await expect(firstRowCheckbox).toBeVisible()

    // Click to select
    await firstRowCheckbox.click()
    const isChecked = await firstRowCheckbox.isChecked()
    expect(isChecked).toBe(true)

    // Verify selection status is displayed
    const selectedText = page.locator('text=/Selected rows:/')
    await expect(selectedText).toBeVisible()

    // Click again to deselect
    await firstRowCheckbox.click()
    const isStillChecked = await firstRowCheckbox.isChecked()
    expect(isStillChecked).toBe(false)
  })

  test('Table interactive behavior - sort cycling (asc → desc → clear)', async ({ page }) => {
    // Get sortable column header
    const sortableHeaders = page.locator('th.table__header--sortable')
    const firstSortableHeader = sortableHeaders.first()

    await expect(firstSortableHeader).toBeVisible()

    // Click to sort ascending
    await firstSortableHeader.click()

    // Verify ascending sort indicator appears
    const sortIcon = firstSortableHeader.locator('svg')
    await expect(sortIcon).toBeVisible()

    // Click again to sort descending
    await firstSortableHeader.click()

    // Verify sort icon is still visible (descending)
    await expect(sortIcon).toBeVisible()

    // Click third time to clear the sort
    await firstSortableHeader.click()

    // Verify sort icon is no longer visible (sort cleared)
    await expect(sortIcon).not.toBeVisible()
  })

  test('Table interactive behavior - row key resolution', async ({ page }) => {
    // Verify rows can be identified by their data-row-key attribute
    const firstRow = page.locator('tbody tr').first()
    const rowKey = await firstRow.getAttribute('data-row-key')

    // Row key should be present (from the data)
    expect(rowKey).toBeTruthy()

    // Select the row
    const checkbox = firstRow.locator('input[type="checkbox"]')
    await checkbox.click()

    // Verify selection is tracked
    const isChecked = await checkbox.isChecked()
    expect(isChecked).toBe(true)
  })

  test('Table static snapshot', async ({ page }) => {
    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('table-full.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('Table column headers are properly labeled', async ({ page }) => {
    // Verify expected column labels
    const headerTexts = await page.locator('th').allTextContents()
    expect(headerTexts).toContain('ID')
    expect(headerTexts).toContain('Name')
    expect(headerTexts).toContain('Class')
    expect(headerTexts).toContain('Status')
    expect(headerTexts).toContain('Updated')
  })

  test('Table data rows contain expected content', async ({ page }) => {
    // Verify first row contains data (skip checkbox column)
    const firstDataCell = page.locator('tbody td:not(.table__cell--checkbox)').first()
    const cellContent = await firstDataCell.textContent()

    expect(cellContent).toBeTruthy()
    expect(cellContent).not.toBe('')
  })

  test('StatGrid component renders multiple tiles', async ({ page }) => {
    // Verify StatGrid container exists
    const statGrid = page.locator('[class*="stat-grid"]')
    await expect(statGrid).toBeVisible()

    // Verify StatTile components exist
    const statTiles = page.locator('[class*="stat-tile"]')
    const tileCount = await statTiles.count()
    expect(tileCount).toBeGreaterThanOrEqual(4)
  })

  test('StatTile component displays label and value', async ({ page }) => {
    // Find StatTile elements
    const statTiles = page.locator('[class*="stat-tile"]')
    const firstTile = statTiles.first()

    // Verify content is rendered
    const tileText = await firstTile.textContent()
    expect(tileText).toBeTruthy()

    // Should contain label and value
    expect(tileText).toMatch(/[A-Za-z]+/)
  })

  test('StatTile component - all variants', async ({ page }) => {
    // Verify different status variants exist - check only main stat-tile containers
    const tiles = page.locator('.stat-tile')

    // Get all tiles
    const allTiles = await tiles.all()
    expect(allTiles.length).toBeGreaterThan(0)

    // Each tile should have content
    for (const tile of allTiles) {
      const content = await tile.textContent()
      expect(content).toBeTruthy()
    }
  })

  test('StatTile visual regression', async ({ page }) => {
    await freezeAnimations(page)
    await expect(page).toHaveScreenshot('stat-tiles.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('Table with no selection', async ({ page }) => {
    // Verify initial state - no rows selected
    const selectedText = page.locator('text=/Selected rows: none/')
    await expect(selectedText).toBeVisible()

    const rowCheckboxes = page.locator('tbody input[type="checkbox"]')
    const firstCheckbox = rowCheckboxes.first()
    const isChecked = await firstCheckbox.isChecked()
    expect(isChecked).toBe(false)
  })

  test('Table accessibility - checkbox labels', async ({ page }) => {
    // Verify checkboxes are accessible
    const selectAllCheckbox = page.locator('thead input[type="checkbox"]').first()
    const isVisible = await selectAllCheckbox.isVisible()
    expect(isVisible).toBe(true)

    // Should be keyboard focusable
    await selectAllCheckbox.focus()
    const isFocused = await selectAllCheckbox.evaluate((el) => {
      return el === document.activeElement
    })
    expect(isFocused).toBe(true)
  })

  test('Table response to keyboard interaction', async ({ page }) => {
    // Get first checkbox
    const firstCheckbox = page.locator('tbody input[type="checkbox"]').first()

    // Focus and press Space
    await firstCheckbox.focus()
    await firstCheckbox.press('Space')

    // Should be checked
    const isChecked = await firstCheckbox.isChecked()
    expect(isChecked).toBe(true)

    // Press Space again
    await firstCheckbox.press('Space')

    // Should be unchecked
    const isStillChecked = await firstCheckbox.isChecked()
    expect(isStillChecked).toBe(false)
  })

})
