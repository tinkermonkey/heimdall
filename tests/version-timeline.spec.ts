import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('VersionTimeline Component', () => {
  test('light canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('version-timeline-light-canvas.png', { fullPage: true })
  })

  test('dark canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('version-timeline-dark-canvas.png', { fullPage: true })
  })

  test('click selection updates onSelect callback', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const selectedText = page.locator('text=Selected: v1').first()
    await expect(selectedText).toBeVisible()

    const v2Entry = page.locator('[data-testid="version-entry-v2"]').first()
    await v2Entry.click()

    const updatedText = page.locator('text=Selected: v2').first()
    await expect(updatedText).toBeVisible()
  })

  test('arrow down key navigates to next version', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const timeline = page.locator('[data-testid="version-timeline"]').first()
    await timeline.focus()

    const selectedTextBefore = page.locator('text=Selected: v1').first()
    await expect(selectedTextBefore).toBeVisible()

    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)

    const selectedTextAfter = page.locator('text=Selected: v2').first()
    await expect(selectedTextAfter).toBeVisible()
  })

  test('arrow up key navigates to previous version', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const timeline = page.locator('[data-testid="version-timeline"]').first()
    await timeline.focus()

    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)

    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(100)

    const selectedText = page.locator('text=Selected: v1').first()
    await expect(selectedText).toBeVisible()
  })

  test('arrow down at last entry does not navigate', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const timeline = page.locator('[data-testid="version-timeline"]').nth(1)
    await timeline.focus()

    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)

    const selectedEntry = timeline.locator('[aria-selected="true"]').first()
    const selectedVersionBefore = await selectedEntry.getAttribute('data-version-id')

    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)

    const selectedEntryAfter = timeline.locator('[aria-selected="true"]').first()
    const selectedVersionAfter = await selectedEntryAfter.getAttribute('data-version-id')

    expect(selectedVersionAfter).toBe(selectedVersionBefore)
  })

  test('arrow up at first entry does not navigate', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const timeline = page.locator('[data-testid="version-timeline"]').first()
    await timeline.focus()

    const selectedEntryBefore = timeline.locator('[aria-selected="true"]').first()
    const selectedVersionBefore = await selectedEntryBefore.getAttribute('data-version-id')

    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(100)

    const selectedEntryAfter = timeline.locator('[aria-selected="true"]').first()
    const selectedVersionAfter = await selectedEntryAfter.getAttribute('data-version-id')

    expect(selectedVersionAfter).toBe(selectedVersionBefore)
  })


  test('oldest-first order reverses entry order', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const newestFirstTimeline = page.locator('[data-testid="version-timeline"]').first()
    const oldestFirstTimeline = page.locator('[data-testid="version-timeline"]').nth(1)

    const firstNewest = newestFirstTimeline.locator('[role="option"]').first()
    await expect(firstNewest).toHaveAttribute('data-version-id', 'v1')

    const firstOldest = oldestFirstTimeline.locator('[role="option"]').first()
    await expect(firstOldest).toHaveAttribute('data-version-id', 'v5')
  })

  test('empty state renders when no entries provided', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const emptyStateText = page.locator('text=No version history available')
    await expect(emptyStateText).toBeVisible()
  })

  test('read-only mode (no onSelect) is not interactive', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const readOnlyTimeline = page.locator('[data-testid="version-timeline"]').nth(4)

    const v2Entry = readOnlyTimeline.locator('[data-version-id="v2"]')
    await v2Entry.click()

    const v2EntryAfterClick = readOnlyTimeline.locator('[data-version-id="v2"]')
    await expect(v2EntryAfterClick).toHaveAttribute('aria-selected', 'false')
  })

  test('single entry does not show connector rail', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const singleEntryTimeline = page.locator('[data-testid="version-timeline"]').nth(2)
    const connectors = await singleEntryTimeline.locator('.version-timeline__connector').count()

    expect(connectors).toBe(0)
  })

  test('multiple entries show connector rail', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const timeline = page.locator('[data-testid="version-timeline"]').nth(0)
    const connectors = await timeline.locator('.version-timeline__connector').count()

    expect(connectors).toBeGreaterThan(0)
  })

  test('head badge renders for entries with head flag', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const headBadges = page.locator('[data-testid="version-head-v1"]')
    const count = await headBadges.count()
    expect(count).toBeGreaterThan(0)
    const firstBadge = headBadges.first()
    await expect(firstBadge).toContainText('head')
  })

  test('transition indicator renders for entries with transition', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const transitions = page.locator('[data-testid="version-transition-v4"]')
    const count = await transitions.count()
    expect(count).toBeGreaterThan(0)
    const firstTransition = transitions.first()
    await expect(firstTransition).toContainText('beta')
    await expect(firstTransition).toContainText('stable')
  })

  test('diff stats render for entries with stats', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const statsList = page.locator('[data-testid="version-stats-v2"]')
    const count = await statsList.count()
    expect(count).toBeGreaterThan(0)
    const firstStats = statsList.first()
    await expect(firstStats).toContainText('added')
    await expect(firstStats).toContainText('removed')
    await expect(firstStats).toContainText('kept')
  })

  test('aria listbox semantics are applied', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const listbox = page.locator('[role="listbox"]').first()
    await expect(listbox).toHaveAttribute('tabindex', '0')

    const options = listbox.locator('[role="option"]')
    const count = await options.count()
    expect(count).toBeGreaterThan(0)

    const selectedOption = listbox.locator('[aria-selected="true"]')
    await expect(selectedOption).toBeVisible()
  })

  test('selected entry has aria-selected attribute', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const timeline = page.locator('[data-testid="version-timeline"]').first()
    const selectedEntry = timeline.locator('[data-version-id="v1"]')

    await expect(selectedEntry).toHaveAttribute('aria-selected', 'true')

    const unselectedEntry = timeline.locator('[data-version-id="v2"]')
    await expect(unselectedEntry).toHaveAttribute('aria-selected', 'false')
  })

  test('visual selection state changes on click', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const timeline = page.locator('[data-testid="version-timeline"]').first()

    const v1Entry = timeline.locator('[data-version-id="v1"]')
    const v2Entry = timeline.locator('[data-version-id="v2"]')

    await expect(v1Entry).toHaveClass(/version-timeline__entry--selected/)

    await v2Entry.click()
    await page.waitForTimeout(100)

    await expect(v1Entry).not.toHaveClass(/version-timeline__entry--selected/)
    await expect(v2Entry).toHaveClass(/version-timeline__entry--selected/)
  })

  test('selected entry has head dot indicator when marked as head', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=version-timeline')
    await page.waitForLoadState('networkidle')

    const timeline = page.locator('[data-testid="version-timeline"]').first()

    const v1Dot = timeline.locator('[data-testid="version-dot-v1"]')
    await expect(v1Dot).toHaveClass(/version-timeline__dot--head/)

    const v2Dot = timeline.locator('[data-testid="version-dot-v2"]')
    await expect(v2Dot).toHaveClass(/version-timeline__dot--hollow/)
  })
})
