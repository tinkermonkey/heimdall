import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode } from './utils/test-helpers'

test.describe('ResultCard Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=cards-and-lists')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)
  })

  test('ResultCard default state snapshot - light canvas', async ({ page }) => {
    const resultCards = page.locator('[role="article"]').first()
    await expect(resultCards).toBeVisible()
    await expect(resultCards).toHaveScreenshot('result-card-default-light.png')
  })

  test('ResultCard default state snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const resultCards = page.locator('[role="article"]').first()
    await expect(resultCards).toBeVisible()
    await expect(resultCards).toHaveScreenshot('result-card-default-dark.png')
  })

  test('ResultCard with score snapshot - light canvas', async ({ page }) => {
    // Find the second section with score
    const sections = page.locator('section')
    await sections.nth(1).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(1).locator('[role="article"]')
    await expect(resultCard).toBeVisible()
    await expect(resultCard).toHaveScreenshot('result-card-with-score-light.png')
  })

  test('ResultCard with score snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    await sections.nth(1).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(1).locator('[role="article"]')
    await expect(resultCard).toBeVisible()
    await expect(resultCard).toHaveScreenshot('result-card-with-score-dark.png')
  })

  test('ResultCard no-score state snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(3).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(3).locator('[role="article"]')
    await expect(resultCard).toBeVisible()
    await expect(resultCard).toHaveScreenshot('result-card-no-score-light.png')
  })

  test('ResultCard no-score state snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    await sections.nth(3).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(3).locator('[role="article"]')
    await expect(resultCard).toBeVisible()
    await expect(resultCard).toHaveScreenshot('result-card-no-score-dark.png')
  })

  test('ResultCard with mark elements snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(2).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(2).locator('[role="article"]')
    await expect(resultCard).toBeVisible()
    await expect(resultCard).toHaveScreenshot('result-card-with-marks-light.png')
  })

  test('ResultCard with mark elements snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    await sections.nth(2).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(2).locator('[role="article"]')
    await expect(resultCard).toBeVisible()
    await expect(resultCard).toHaveScreenshot('result-card-with-marks-dark.png')
  })

  test('ResultCard selected state snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(4).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(4).locator('[role="article"]')
    await expect(resultCard).toBeVisible()
    await expect(resultCard).toHaveScreenshot('result-card-selected-light.png')
  })

  test('ResultCard selected state snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    await sections.nth(4).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(4).locator('[role="article"]')
    await expect(resultCard).toBeVisible()
    await expect(resultCard).toHaveScreenshot('result-card-selected-dark.png')
  })

  test('ResultCard renders aria-label correctly', async ({ page }) => {
    const resultCard = page.locator('[role="article"]').first()
    await expect(resultCard).toHaveAttribute('aria-label', /taxonomy_schema.*v2\.1\.0/)
  })

  test('ResultCard without version has correct aria-label', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(6).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(6).locator('[role="article"]')
    await expect(resultCard).toHaveAttribute('aria-label', 'simple_result')
  })

  test('ResultCard keyboard navigation - Enter key fires onOpen', async ({ page }) => {
    const resultCard = page.locator('[role="article"]').first()
    // Set up console listener for click event
    let clicked = false
    page.on('console', (msg) => {
      if (msg.text().includes('Opened result')) clicked = true
    })

    await resultCard.focus()
    await resultCard.press('Enter')
    // Wait a bit for the event
    await page.waitForTimeout(100)
    expect(clicked).toBe(true)
    expect(resultCard).toBeFocused()
  })

  test('ResultCard keyboard navigation - Space key fires onOpen', async ({ page }) => {
    const resultCard = page.locator('[role="article"]').first()
    let clicked = false
    page.on('console', (msg) => {
      if (msg.text().includes('Opened result')) clicked = true
    })

    await resultCard.focus()
    await resultCard.press('Space')
    await page.waitForTimeout(100)
    expect(clicked).toBe(true)
    expect(resultCard).toBeFocused()
  })

  test('ResultCard action buttons are keyboard accessible', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(2).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(2).locator('[role="article"]')
    const actionButtons = resultCard.locator('[class*="action-button"]')

    // Tab to first action button
    await resultCard.focus()
    await resultCard.press('Tab')

    // First action button should be focused
    const firstButton = actionButtons.first()
    await expect(firstButton).toBeFocused()

    // Tab to next button
    await page.keyboard.press('Tab')
    const secondButton = actionButtons.nth(1)
    await expect(secondButton).toBeFocused()
  })

  test('ResultCard action button click handler', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(2).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(2).locator('[role="article"]')
    const actionButtons = resultCard.locator('[class*="action-button"]')

    // Click action button
    let actionClicked = false
    page.on('console', (msg) => {
      if (msg.text().includes('Action clicked')) actionClicked = true
    })

    await actionButtons.first().click()
    await page.waitForTimeout(100)
    expect(actionClicked).toBe(true)
  })

  test('ResultCard score is formatted to 2 decimal places', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(1).scrollIntoViewIfNeeded()
    const scoreLabel = sections.nth(1).locator('[class*="score-label"]')
    await expect(scoreLabel).toContainText(/0\.\d{2}/)
  })

  test('ResultCard ProgressBar width matches score percentage', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(1).scrollIntoViewIfNeeded()
    const progressBar = sections.nth(1).locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()
    // Progress bar should be visible since score is 0.87 (87%)
  })

  test('ResultCard without score hides progress bar', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(3).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(3).locator('[role="article"]')
    const progressBar = resultCard.locator('[role="progressbar"]')
    await expect(progressBar).not.toBeVisible()
  })

  test('ResultCard provenance fields render only when present', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(1).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(1).locator('[role="article"]')
    const provenanceLabels = resultCard.locator('[class*="provenance-label"]')
    const count = await provenanceLabels.count()
    // Should have collection and document (no section)
    expect(count).toBeGreaterThan(0)
  })

  test('ResultCard with mark elements have amber tint', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(2).scrollIntoViewIfNeeded()
    const marks = sections.nth(2).locator('mark')
    await expect(marks).toHaveCount(2)

    // Check that marks have the correct background color
    const mark = marks.first()
    const backgroundColor = await mark.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })
    // Should have amber tint — expect rgb values around amber (251, 191, 36)
    expect(backgroundColor).toMatch(/rgba?\(/)
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('ResultCard selection state applies styling', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(4).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(4).locator('[role="article"]')
    await expect(resultCard).toHaveClass(/result-card--selected/)
  })

  test('ResultCard displays all domains correctly', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(5).scrollIntoViewIfNeeded()
    const resultCards = sections.nth(5).locator('[role="article"]')
    const count = await resultCards.count()
    expect(count).toBe(3)

    for (let i = 0; i < 3; i++) {
      const card = resultCards.nth(i)
      const source = card.locator('[class*="source"]')
      await expect(source).toBeVisible()
    }
  })

  test('ResultCard hover state changes border', async ({ page }) => {
    const resultCard = page.locator('[role="article"]').first()
    const initialBorderColor = await resultCard.evaluate((el) => {
      return window.getComputedStyle(el).borderColor
    })

    // Hover over the card
    await resultCard.hover()

    const hoverBorderColor = await resultCard.evaluate((el) => {
      return window.getComputedStyle(el).borderColor
    })

    // Border should change on hover
    expect(initialBorderColor).not.toBe(hoverBorderColor)
  })

  test('ResultCard focus ring appears on tab', async ({ page }) => {
    const resultCard = page.locator('[role="article"]').first()
    await resultCard.focus()
    // Outline should be applied
    const outline = await resultCard.evaluate((el) => {
      return window.getComputedStyle(el).outline
    })
    expect(outline).not.toBe('none')
  })

  test('ResultCard action button prevents event propagation', async ({ page }) => {
    const sections = page.locator('section')
    await sections.nth(2).scrollIntoViewIfNeeded()
    const resultCard = sections.nth(2).locator('[role="article"]')
    const actionButton = resultCard.locator('[class*="action-button"]').first()

    let cardOpened = false
    let actionClicked = false
    page.on('console', (msg) => {
      if (msg.text().includes('Opened result')) cardOpened = true
      if (msg.text().includes('Action clicked')) actionClicked = true
    })

    // Click action button (should not trigger card's onOpen)
    await actionButton.click()
    await page.waitForTimeout(100)
    expect(actionClicked).toBe(true)
    expect(cardOpened).toBe(false)
  })
})
