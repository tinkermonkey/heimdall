import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('WorkspaceSwitcherDialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)

    // Freeze animations for consistent snapshots
    await freezeAnimations(page)
  })

  test('should render when isOpen is true', async ({ page }) => {
    // Click the button to open the dialog
    await page.click('button:has-text("Open Workspace Switcher")')

    // Check that the modal is visible
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
  })

  test('should display title', async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.click('button:has-text("Open Workspace Switcher")')

    // Check for the dialog title
    const title = page.locator('.modal__title:has-text("Switch Workspace")')
    await expect(title).toBeVisible()
  })

  test('should display three action tiles', async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.click('button:has-text("Open Workspace Switcher")')

    // Check for the three action tiles
    const openTile = page.locator('.quick-access-tile:has-text("Open")')
    const newTile = page.locator('.quick-access-tile:has-text("New")')
    const cloneTile = page.locator('.quick-access-tile:has-text("Clone")')

    await expect(openTile).toBeVisible()
    await expect(newTile).toBeVisible()
    await expect(cloneTile).toBeVisible()
  })

  test('should display recent workspaces list', async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.click('button:has-text("Open Workspace Switcher")')

    // Check for recent workspaces section
    const recentHeader = page.locator('.workspace-switcher-dialog__recent-header:has-text("Recent Workspaces")')
    await expect(recentHeader).toBeVisible()

    // Check for recent workspace items
    const projectAlpha = page.locator('.workspace-switcher-dialog__recent-name:has-text("Project Alpha")')
    await expect(projectAlpha).toBeVisible()
  })

  test('should close when Open tile is clicked', async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.click('button:has-text("Open Workspace Switcher")')

    // Click the Open tile
    await page.click('.quick-access-tile:has-text("Open")')

    // Dialog should be closed
    const modal = page.locator('[role="dialog"]')
    await expect(modal).not.toBeVisible()
  })

  test('should call onPickRecent when recent workspace is clicked', async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.click('button:has-text("Open Workspace Switcher")')

    // Click a recent workspace item
    await page.click('.workspace-switcher-dialog__recent-item:first-child')

    // Dialog should be closed
    const modal = page.locator('[role="dialog"]')
    await expect(modal).not.toBeVisible()
  })

  test('should close when X button is clicked', async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.click('button:has-text("Open Workspace Switcher")')

    // Find and click the close button
    const closeButton = page.locator('.modal__close')
    await expect(closeButton).toBeVisible()
    await closeButton.click()

    // Dialog should be closed
    const modal = page.locator('[role="dialog"]')
    await expect(modal).not.toBeVisible()
  })

  test('should close when backdrop is clicked', async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.click('button:has-text("Open Workspace Switcher")')

    // Verify dialog is open
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible()

    // Click the backdrop at a position that's definitely outside the modal
    const backdrop = page.locator('.modal-backdrop').first()
    await backdrop.click({ position: { x: 10, y: 10 } })

    // Dialog should be closed
    await expect(modal).not.toBeVisible()
  })

  test('should not be visible when isOpen is false', async ({ page }) => {
    // Dialog should not be visible initially
    const modal = page.locator('[role="dialog"]')
    await expect(modal).not.toBeVisible()
  })

  // Visual Regression Tests
  test('visual snapshot of workspace switcher dialog', async ({ page }) => {
    // Click the button to open the dialog
    await page.click('button:has-text("Open Workspace Switcher")')

    // Verify modal is visible
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toBeVisible()

    // Take snapshot of the entire dialog
    await expect(modal).toHaveScreenshot('workspace-switcher-dialog-open.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('visual snapshot of workspace switcher dialog with action tiles', async ({ page }) => {
    // Click the button to open the dialog
    await page.click('button:has-text("Open Workspace Switcher")')

    // Verify action tiles are visible
    const openTile = page.locator('.quick-access-tile:has-text("Open")')
    const newTile = page.locator('.quick-access-tile:has-text("New")')
    const cloneTile = page.locator('.quick-access-tile:has-text("Clone")')

    await expect(openTile).toBeVisible()
    await expect(newTile).toBeVisible()
    await expect(cloneTile).toBeVisible()

    // Take snapshot of dialog showing action tiles section
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toHaveScreenshot('workspace-switcher-dialog-with-tiles.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('visual snapshot of workspace switcher dialog with recent workspaces', async ({ page }) => {
    // Click the button to open the dialog
    await page.click('button:has-text("Open Workspace Switcher")')

    // Verify recent workspaces section is visible
    const recentHeader = page.locator('.workspace-switcher-dialog__recent-header:has-text("Recent Workspaces")')
    const projectAlpha = page.locator('.workspace-switcher-dialog__recent-name:has-text("Project Alpha")')

    await expect(recentHeader).toBeVisible()
    await expect(projectAlpha).toBeVisible()

    // Take snapshot including recent workspaces
    const modal = page.locator('[role="dialog"]').first()
    await expect(modal).toHaveScreenshot('workspace-switcher-dialog-with-recent.png', {
      maxDiffPixelRatio: 0.01,
    })
  })
})
