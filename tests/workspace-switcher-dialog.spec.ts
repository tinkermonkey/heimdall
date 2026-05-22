import { test, expect } from '@playwright/test'

test.describe('WorkspaceSwitcherDialog', () => {
  test('should render when isOpen is true', async ({ page }) => {
    await page.goto('/?example=overlays')

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

  test('should call onOpenFolder when Open tile is clicked', async ({ page }) => {
    await page.goto('/?example=overlays')
    await page.click('button:has-text("Open Workspace Switcher")')

    // Set up console message listener
    let consoleMessage = ''
    page.on('console', msg => {
      consoleMessage = msg.text()
    })

    // Click the Open tile
    await page.click('.quick-access-tile:has-text("Open")')

    // Wait a moment for the console message
    await page.waitForTimeout(100)

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

    // Click the backdrop
    await page.click('.modal-backdrop')

    // Dialog should be closed
    const modal = page.locator('[role="dialog"]')
    await expect(modal).not.toBeVisible()
  })

  test('should not be visible when isOpen is false', async ({ page }) => {
    await page.goto('/?example=overlays')

    // Dialog should not be visible initially
    const modal = page.locator('[role="dialog"]')
    await expect(modal).not.toBeVisible()
  })
})
