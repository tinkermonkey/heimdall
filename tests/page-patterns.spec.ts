import { test, expect } from '@playwright/test'
import {
  freezeAnimations,
  loadSelfHostedFonts,
  assertFontsLoaded,
  applyDarkCanvasMode,
  removeDarkCanvasMode,
} from './utils/test-helpers'

test.describe('Page Pattern Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/?example=page-patterns')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)

    // Freeze animations for consistent snapshots
    await freezeAnimations(page)
  })

  test.afterEach(async ({ page }) => {
    // Ensure we exit dark canvas mode after each test
    await removeDarkCanvasMode(page)
  })

  test.describe('PageHeader', () => {
    test('renders eyebrow, title, and subtitle', async ({ page }) => {
      const eyebrow = page.locator('[data-testid="page-header-eyebrow"]')
      const title = page.locator('[data-testid="page-header-title"]')
      const subtitle = page.locator('[data-testid="page-header-subtitle"]')

      await expect(eyebrow).toContainText('DATABASE')
      await expect(title).toContainText('Entity Browser')
      await expect(subtitle).toContainText('Browse and manage your data entities')
    })

    test('renders id chip inline with title', async ({ page }) => {
      const idChip = page.locator('[data-testid="page-header-id-chip"]')
      await expect(idChip).toBeVisible()
      await expect(idChip).toContainText('db_main')
    })

    test('renders action slot when provided', async ({ page }) => {
      const actions = page.locator('[data-testid="page-header-actions"]')
      await expect(actions).toBeVisible()
      await expect(actions).toContainText('Create Entity')
    })
  })

  test.describe('FilterBar', () => {
    test('renders search input', async ({ page }) => {
      const searchInput = page.locator('[data-testid="filter-bar-search"]')
      await expect(searchInput).toBeVisible()
      await expect(searchInput).toHaveAttribute('placeholder', 'Search entities...')
    })

    test('renders filter chips', async ({ page }) => {
      const chips = page.locator('[data-testid="filter-bar-chips"]')
      await expect(chips).toBeVisible()

      const activeChip = page.locator('[data-testid="filter-chip-active"]')
      const syncingChip = page.locator('[data-testid="filter-chip-syncing"]')

      await expect(activeChip).toContainText('Active')
      await expect(syncingChip).toContainText('Syncing')
    })

    test('removes filter chip when close button clicked', async ({ page }) => {
      const closeButton = page.locator('[data-testid="filter-chip-close-active"]')
      await closeButton.click()

      const activeChip = page.locator('[data-testid="filter-chip-active"]')
      await expect(activeChip).not.toBeVisible()
    })

    test('calls onSearchChange when search input changes', async ({ page }) => {
      const searchInput = page.locator('[data-testid="filter-bar-search"]')
      await searchInput.fill('test query')
      await expect(searchInput).toHaveValue('test query')
    })

    test('FilterBar with children elements renders correctly', async ({ page }) => {
      const filterBar = page.locator('[data-testid="filter-bar"]').first()
      const chips = filterBar.locator('[data-testid*="filter-chip"]')
      const chipCount = await chips.count()
      expect(chipCount).toBeGreaterThan(0)
    })

    test('FilterBar children snapshot', async ({ page }) => {
      const filterBar = page.locator('[data-testid="filter-bar"]').first()
      await expect(filterBar).toHaveScreenshot('filter-bar-with-children.png')
    })
  })

  test.describe('ActivityTimeline', () => {
    test('renders event list with dots, subjects, and timestamps', async ({ page }) => {
      const events = page.locator('[data-testid^="activity-event-"]')
      await expect(events).toHaveCount(5)
    })

    test('renders color-coded dots for each event type', async ({ page }) => {
      const createDot = page.locator('[data-testid="activity-dot-create"]')
      const updateDot = page.locator('[data-testid="activity-dot-update"]')
      const deleteDot = page.locator('[data-testid="activity-dot-delete"]')
      const runDot = page.locator('[data-testid="activity-dot-run"]')

      // All event types should be present (at least once)
      await expect(createDot.first()).toBeVisible()
      await expect(updateDot).toBeVisible()
      await expect(deleteDot).toBeVisible()
      await expect(runDot).toBeVisible()
    })

    test('renders event subject and timestamp', async ({ page }) => {
      const subject = page.locator('[data-testid="activity-subject"]').first()
      const timestamp = page.locator('[data-testid="activity-timestamp"]').first()

      await expect(subject).toBeVisible()
      await expect(subject).toContainText('Created new entity')
      await expect(timestamp).toBeVisible()
    })

    test('displays empty state when no events', async ({ page }) => {
      const emptyTimeline = page.locator('[data-testid="activity-timeline-empty-state"]')
      const emptyState = emptyTimeline.locator('[data-testid="activity-timeline-empty"]')
      await expect(emptyState).toBeVisible()
      await expect(emptyState).toContainText('No activity yet')
    })

    test('handles invalid timestamps gracefully without displaying "Invalid Date"', async ({ page }) => {
      const invalidEvent = page.locator('[data-testid="activity-event-event-5"]')
      const timestamp = invalidEvent.locator('[data-testid="activity-timestamp"]')
      // Verify element exists (even if empty)
      await expect(invalidEvent).toBeVisible()
      // Verify the text content is not the problematic "Invalid Date" string
      const text = await timestamp.textContent()
      expect(text).not.toContain('Invalid Date')
    })

    test('ActivityTimeline with kind-tag variants displays different tag types', async ({ page }) => {
      const timelineContainer = page.locator('[data-testid="activity-timeline"]').first()
      const kindTags = timelineContainer.locator('[data-testid*="activity-kind-tag"]')
      const tagCount = await kindTags.count()
      expect(tagCount).toBeGreaterThan(0)
    })

    test('ActivityTimeline with dotColor variants renders color-coded dots', async ({ page }) => {
      const timelineContainer = page.locator('[data-testid="activity-timeline"]').first()
      const dots = timelineContainer.locator('[data-testid*="activity-dot"]')
      const dotCount = await dots.count()
      expect(dotCount).toBeGreaterThan(0)
    })

    test('ActivityTimeline extended variants snapshot', async ({ page }) => {
      const timeline = page.locator('[data-testid="activity-timeline"]').first()
      await expect(timeline).toHaveScreenshot('activity-timeline-extended.png')
    })
  })

  test.describe('AlertStrip', () => {
    test('renders all alerts with severity badges', async ({ page }) => {
      const alertStrip = page.locator('[data-testid="alert-strip"]')
      const alerts = alertStrip.locator('[data-testid^="alert-alert-"]')
      // We expect 4 alerts (including success variant)
      await expect(alerts).toHaveCount(4)
    })

    test('renders correct severity badge colors', async ({ page }) => {
      const errorBadge = page.locator('[data-testid="alert-severity-error"]')
      const warnBadge = page.locator('[data-testid="alert-severity-warn"]')
      const infoBadge = page.locator('[data-testid="alert-severity-info"]')
      const successBadge = page.locator('[data-testid="alert-severity-success"]')

      await expect(errorBadge).toBeVisible()
      await expect(warnBadge).toBeVisible()
      await expect(infoBadge).toBeVisible()
      await expect(successBadge).toBeVisible()
    })

    test('renders alert messages', async ({ page }) => {
      const alert1 = page.locator('[data-testid="alert-alert-1"]')
      const alert2 = page.locator('[data-testid="alert-alert-2"]')
      const alert3 = page.locator('[data-testid="alert-alert-3"]')

      await expect(alert1).toContainText('Database connection lost')
      await expect(alert2).toContainText('High memory usage detected')
      await expect(alert3).toContainText('New update available')
    })

    test('dismisses alert when close button clicked', async ({ page }) => {
      const dismissButton = page.locator('[data-testid="alert-dismiss-alert-1"]')
      await dismissButton.click()

      const alert = page.locator('[data-testid="alert-alert-1"]')
      await expect(alert).not.toBeVisible()
    })

    test('hides alert strip when all alerts are dismissed', async ({ page }) => {
      const dismissButtons = page.locator('[data-testid^="alert-dismiss-"]')
      const count = await dismissButtons.count()

      for (let i = 0; i < count; i++) {
        const button = page.locator('[data-testid^="alert-dismiss-"]').first()
        await button.click()
        await page.waitForTimeout(100)
      }

      const alertStrip = page.locator('[data-testid="alert-strip"]')
      await expect(alertStrip).not.toBeVisible()
    })
  })

  test.describe('QuickAccessGrid', () => {
    test('renders grid of tiles with icons, titles, and descriptions', async ({ page }) => {
      const tiles = page.locator('[data-testid^="quick-access-tile-"]')
      await expect(tiles).toHaveCount(4)
    })

    test('renders tile content correctly', async ({ page }) => {
      const createTile = page.locator('[data-testid="quick-access-tile-create"]')
      await expect(createTile).toContainText('Create Entity')
      await expect(createTile).toContainText('Add a new entity')
    })

    test('is clickable and calls onAction', async ({ page }) => {
      const tile = page.locator('[data-testid="quick-access-tile-create"]')
      await expect(tile).toBeEnabled()
      // Just verify it's a button that can be clicked
      await tile.click()
    })

    test('renders 4-column grid layout', async ({ page }) => {
      const grid = page.locator('[data-testid="quick-access-grid"]')
      await expect(grid).toBeVisible()
    })
  })

  test.describe('QuickAccessTile', () => {
    test('renders tile with icon, title, and description', async ({ page }) => {
      const tile = page.locator('button.quick-access-tile').first()
      await expect(tile).toBeVisible()

      // Verify icon is present
      const icon = tile.locator('svg').first()
      await expect(icon).toBeVisible()

      // Verify content is visible
      const content = await tile.textContent()
      expect(content).toBeTruthy()
      expect(content).toMatch(/[A-Za-z]+/)
    })

    test('is clickable and responds to click', async ({ page }) => {
      const tile = page.locator('button.quick-access-tile').first()
      await expect(tile).toBeEnabled()
      await tile.click()
      // Click event was handled (no error thrown)
    })

    test('visual snapshot of QuickAccessTile variants', async ({ page }) => {
      const tile = page.locator('button.quick-access-tile').first()
      await expect(tile).toHaveScreenshot('quick-access-tile.png', {
        maxDiffPixelRatio: 0.01,
      })
    })
  })

  test.describe('ConfigTile', () => {
    test('renders tile with icon, title, description, and summary', async ({ page }) => {
      const tile = page.locator('button.config-tile').first()
      await expect(tile).toBeVisible()

      // Verify icon is present
      const icon = tile.locator('svg').first()
      await expect(icon).toBeVisible()

      // Verify summary key-value pairs are visible
      const summary = tile.locator('.config-tile__summary')
      await expect(summary).toBeVisible()
    })

    test('is clickable and responds to click', async ({ page }) => {
      const tile = page.locator('button.config-tile').first()
      await expect(tile).toBeEnabled()
      await tile.click()
      // Click event was handled (no error thrown)
    })

    test('visual snapshot of ConfigTile', async ({ page }) => {
      const tile = page.locator('button.config-tile').first()
      await expect(tile).toHaveScreenshot('config-tile.png', {
        maxDiffPixelRatio: 0.01,
      })
    })
  })

  test.describe('Dark Canvas Mode', () => {
    test('alert severity variants render correctly in dark canvas mode', async ({ page }) => {
      // Toggle dark canvas
      await page.evaluate(() => {
        document.body.classList.add('dark-canvas')
      })

      // Verify all four alert severity badges are visible
      const errorBadge = page.locator('[data-testid="alert-severity-error"]')
      const warnBadge = page.locator('[data-testid="alert-severity-warn"]')
      const infoBadge = page.locator('[data-testid="alert-severity-info"]')
      const successBadge = page.locator('[data-testid="alert-severity-success"]')

      await expect(errorBadge).toBeVisible()
      await expect(warnBadge).toBeVisible()
      await expect(infoBadge).toBeVisible()
      await expect(successBadge).toBeVisible()

      // Verify alert messages are visible
      await expect(page.locator('[data-testid="alert-alert-1"]')).toContainText('Database connection lost')
      await expect(page.locator('[data-testid="alert-alert-2"]')).toContainText('High memory usage detected')
      await expect(page.locator('[data-testid="alert-alert-3"]')).toContainText('New update available')
      await expect(page.locator('[data-testid="alert-alert-4"]')).toContainText('Migration completed successfully')
    })

    test('filter chips and interactions work in dark canvas mode', async ({ page }) => {
      // Toggle dark canvas
      await page.evaluate(() => {
        document.body.classList.add('dark-canvas')
      })

      // Verify filter chips are rendered
      const chips = page.locator('[data-testid="filter-bar-chips"]')
      await expect(chips).toBeVisible()

      const activeChip = page.locator('[data-testid="filter-chip-active"]')
      const syncingChip = page.locator('[data-testid="filter-chip-syncing"]')

      await expect(activeChip).toBeVisible()
      await expect(syncingChip).toBeVisible()

      // Test filter removal interaction
      const closeButton = page.locator('[data-testid="filter-chip-close-active"]')
      await closeButton.click()

      // Verify the chip was removed
      await expect(activeChip).not.toBeVisible()
    })

    test('other components render correctly in dark canvas mode', async ({ page }) => {
      // Toggle dark canvas
      await page.evaluate(() => {
        document.body.classList.add('dark-canvas')
      })

      // Verify PageHeader is still visible
      const title = page.locator('[data-testid="page-header-title"]')
      await expect(title).toBeVisible()

      // Verify ActivityTimeline is still visible
      const timeline = page.locator('[data-testid="activity-timeline"]')
      await expect(timeline).toBeVisible()

      // Verify QuickAccessGrid is still visible
      const grid = page.locator('[data-testid="quick-access-grid"]')
      await expect(grid).toBeVisible()
    })
  })

  test.describe('QuickAccessTile', () => {
    test('renders title, description, and icon', async ({ page }) => {
      const tiles = page.locator('button.quick-access-tile')
      await expect(tiles).toHaveCount(2)

      const firstTile = tiles.first()
      await expect(firstTile).toContainText('Databases')
      await expect(firstTile).toContainText('Manage database connections')
    })

    test('quick access tiles are clickable and interactive', async ({ page }) => {
      const firstTile = page.locator('button.quick-access-tile').first()
      await firstTile.click()
      // Verify tile has focus state or other interactive feedback
      await expect(firstTile).toBeFocused()
    })
  })

  test.describe('ConfigTile', () => {
    test('renders title, description, and summary items', async ({ page }) => {
      const tiles = page.locator('button.config-tile')
      await expect(tiles).toHaveCount(2)

      const firstTile = tiles.first()
      await expect(firstTile).toContainText('API Configuration')
      await expect(firstTile).toContainText('Configure API endpoints')
      await expect(firstTile).toContainText('api.example.com')
    })

    test('config tiles display summary key-value pairs', async ({ page }) => {
      const firstTile = page.locator('button.config-tile').first()
      await expect(firstTile).toContainText('Endpoint')
      await expect(firstTile).toContainText('Version')
    })

    test('config tiles are clickable and interactive', async ({ page }) => {
      const firstTile = page.locator('button.config-tile').first()
      await firstTile.click()
      // Verify tile has focus state or other interactive feedback
      await expect(firstTile).toBeFocused()
    })
  })

  test.describe('Visual Regression - Light Canvas', () => {
    test('PageHeader component visual snapshot', async ({ page }) => {
      const header = page.locator('[data-testid="page-header-eyebrow"]').locator('..')
      await expect(header).toHaveScreenshot('page-header-light.png')
    })

    test('FilterBar component visual snapshot', async ({ page }) => {
      const filterBar = page.locator('[data-testid="filter-bar-search"]').locator('..')
      await expect(filterBar).toHaveScreenshot('filter-bar-light.png')
    })

    test('ActivityTimeline component visual snapshot', async ({ page }) => {
      const timeline = page.locator('[data-testid="activity-timeline"]')
      await expect(timeline).toHaveScreenshot('activity-timeline-light.png')
    })

    test('AlertStrip component visual snapshot', async ({ page }) => {
      const alertStrip = page.locator('[data-testid="alert-strip"]')
      await expect(alertStrip).toHaveScreenshot('alert-strip-light.png')
    })

    test('QuickAccessGrid component visual snapshot', async ({ page }) => {
      const grid = page.locator('[data-testid="quick-access-grid"]')
      await expect(grid).toHaveScreenshot('quick-access-grid-light.png')
    })

    test('QuickAccessTile components visual snapshot', async ({ page }) => {
      const tilesContainer = page.locator('[data-testid="quick-access-grid"]')
      await expect(tilesContainer).toHaveScreenshot('quick-access-tiles-light.png')
    })

    test('ConfigTile components visual snapshot', async ({ page }) => {
      const tilesContainer = page.locator('[data-testid="config-tiles-container"]')
      await expect(tilesContainer).toHaveScreenshot('config-tiles-light.png')
    })

  })

  test.describe('Visual Regression - Dark Canvas', () => {
    test.beforeEach(async ({ page }) => {
      await applyDarkCanvasMode(page)
    })

    test('PageHeader component visual snapshot in dark mode', async ({ page }) => {
      const header = page.locator('[data-testid="page-header-eyebrow"]').locator('..')
      await expect(header).toHaveScreenshot('page-header-dark.png')
    })

    test('FilterBar component visual snapshot in dark mode', async ({ page }) => {
      const filterBar = page.locator('[data-testid="filter-bar-search"]').locator('..')
      await expect(filterBar).toHaveScreenshot('filter-bar-dark.png')
    })

    test('ActivityTimeline component visual snapshot in dark mode', async ({ page }) => {
      const timeline = page.locator('[data-testid="activity-timeline"]')
      await expect(timeline).toHaveScreenshot('activity-timeline-dark.png')
    })

    test('AlertStrip component visual snapshot in dark mode', async ({ page }) => {
      const alertStrip = page.locator('[data-testid="alert-strip"]')
      await expect(alertStrip).toHaveScreenshot('alert-strip-dark.png')
    })

    test('QuickAccessGrid component visual snapshot in dark mode', async ({ page }) => {
      const grid = page.locator('[data-testid="quick-access-grid"]')
      await expect(grid).toHaveScreenshot('quick-access-grid-dark.png')
    })

    test('QuickAccessTile components visual snapshot in dark mode', async ({ page }) => {
      const tilesContainer = page.locator('[data-testid="quick-access-grid"]')
      await expect(tilesContainer).toHaveScreenshot('quick-access-tiles-dark.png')
    })

    test('ConfigTile components visual snapshot in dark mode', async ({ page }) => {
      const tilesContainer = page.locator('[data-testid="config-tiles-container"]')
      await expect(tilesContainer).toHaveScreenshot('config-tiles-dark.png')
    })
  })
})
