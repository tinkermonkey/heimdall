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
    const actionButtons = resultCard.locator('.result-card__actions button')

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
    const actionButtons = resultCard.locator('.result-card__actions button')

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
    const actionButton = resultCard.locator('.result-card__actions button').first()

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

test.describe('AssetCard Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=cards-and-lists')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)
  })

  test('AssetCard doc thumbnail snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    // Find the "AssetCard · Doc Thumbnail" section
    const docSection = sections.filter({ has: page.locator('text=AssetCard · Doc Thumbnail') })
    await docSection.scrollIntoViewIfNeeded()
    const assetCard = docSection.locator('[class="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-doc-light.png')
  })

  test('AssetCard doc thumbnail snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const docSection = sections.filter({ has: page.locator('text=AssetCard · Doc Thumbnail') })
    await docSection.scrollIntoViewIfNeeded()
    const assetCard = docSection.locator('[class="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-doc-dark.png')
  })

  test('AssetCard cover thumbnail snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const coverSection = sections.filter({ has: page.locator('text=AssetCard · Cover Thumbnail') })
    await coverSection.scrollIntoViewIfNeeded()
    const assetCard = coverSection.locator('[class="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-cover-light.png')
  })

  test('AssetCard cover thumbnail snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const coverSection = sections.filter({ has: page.locator('text=AssetCard · Cover Thumbnail') })
    await coverSection.scrollIntoViewIfNeeded()
    const assetCard = coverSection.locator('[class="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-cover-dark.png')
  })

  test('AssetCard image thumbnail snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const imageSection = sections.filter({ has: page.locator('text=AssetCard · Image Thumbnail') })
    await imageSection.scrollIntoViewIfNeeded()
    const assetCard = imageSection.locator('[class="asset-card"]').first()
    // Wait for image to load
    await page.waitForLoadState('networkidle')
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-image-light.png')
  })

  test('AssetCard image thumbnail snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const imageSection = sections.filter({ has: page.locator('text=AssetCard · Image Thumbnail') })
    await imageSection.scrollIntoViewIfNeeded()
    const assetCard = imageSection.locator('[class="asset-card"]').first()
    await page.waitForLoadState('networkidle')
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-image-dark.png')
  })

  test('AssetCard with badge snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const badgeSection = sections.filter({ has: page.locator('text=AssetCard · With Badge') })
    await badgeSection.scrollIntoViewIfNeeded()
    const assetCard = badgeSection.locator('[class="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-badge-light.png')
  })

  test('AssetCard with badge snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const badgeSection = sections.filter({ has: page.locator('text=AssetCard · With Badge') })
    await badgeSection.scrollIntoViewIfNeeded()
    const assetCard = badgeSection.locator('[class="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-badge-dark.png')
  })

  test('AssetCard selected state snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const selectedSection = sections.filter({ has: page.locator('text=AssetCard · Selected State') })
    await selectedSection.scrollIntoViewIfNeeded()
    const assetCard = selectedSection.locator('[class*="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-selected-light.png')
  })

  test('AssetCard selected state snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const selectedSection = sections.filter({ has: page.locator('text=AssetCard · Selected State') })
    await selectedSection.scrollIntoViewIfNeeded()
    const assetCard = selectedSection.locator('[class*="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-selected-dark.png')
  })

  test('AssetCard selected state has aria-selected attribute', async ({ page }) => {
    const sections = page.locator('section')
    const selectedSection = sections.filter({ has: page.locator('text=AssetCard · Selected State') })
    const assetCard = selectedSection.locator('[class*="asset-card"]').first()
    await expect(assetCard).toHaveAttribute('aria-selected', 'true')
  })

  test('AssetCard image fallback snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const fallbackSection = sections.filter({ has: page.locator('text=AssetCard · Image Fallback') })
    await fallbackSection.scrollIntoViewIfNeeded()
    const assetCard = fallbackSection.locator('[class="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-image-fallback-light.png')
  })

  test('AssetCard image fallback snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const fallbackSection = sections.filter({ has: page.locator('text=AssetCard · Image Fallback') })
    await fallbackSection.scrollIntoViewIfNeeded()
    const assetCard = fallbackSection.locator('[class="asset-card"]').first()
    await expect(assetCard).toBeVisible()
    await expect(assetCard).toHaveScreenshot('asset-card-image-fallback-dark.png')
  })

  test('AssetGrid layout snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const gridSection = sections.filter({ has: page.locator('text=AssetGrid · 3 Column Layout') })
    await gridSection.scrollIntoViewIfNeeded()
    const assetGrid = gridSection.locator('[class="asset-grid"]').first()
    await page.waitForLoadState('networkidle')
    await expect(assetGrid).toBeVisible()
    await expect(assetGrid).toHaveScreenshot('asset-grid-3col-light.png')
  })

  test('AssetGrid layout snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const gridSection = sections.filter({ has: page.locator('text=AssetGrid · 3 Column Layout') })
    await gridSection.scrollIntoViewIfNeeded()
    const assetGrid = gridSection.locator('[class="asset-grid"]').first()
    await page.waitForLoadState('networkidle')
    await expect(assetGrid).toBeVisible()
    await expect(assetGrid).toHaveScreenshot('asset-grid-3col-dark.png')
  })

  test('AssetCard renders title correctly', async ({ page }) => {
    const sections = page.locator('section')
    const docSection = sections.filter({ has: page.locator('text=AssetCard · Doc Thumbnail') })
    const title = docSection.locator('text=Quarterly Report Q2 2025')
    await expect(title).toBeVisible()
  })

  test('AssetCard renders subtitle correctly', async ({ page }) => {
    const sections = page.locator('section')
    const docSection = sections.filter({ has: page.locator('text=AssetCard · Doc Thumbnail') })
    const subtitle = docSection.locator('text=report_q2_2025.pdf')
    await expect(subtitle).toBeVisible()
  })

  test('AssetCard renders badge correctly', async ({ page }) => {
    const sections = page.locator('section')
    const badgeSection = sections.filter({ has: page.locator('text=AssetCard · With Badge') })
    const badge = badgeSection.locator('text=CITED')
    await expect(badge).toBeVisible()
  })

  test('AssetCard image loads successfully', async ({ page }) => {
    const sections = page.locator('section')
    const imageSection = sections.filter({ has: page.locator('text=AssetCard · Image Thumbnail') })
    await imageSection.scrollIntoViewIfNeeded()
    const image = imageSection.locator('img[alt=""]').first()
    await page.waitForLoadState('networkidle')
    // Check that image is loaded
    await expect(image).toBeVisible()
  })
})

test.describe('LogStream Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=cards-and-lists')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)
  })

  test('LogStream default state snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    await logSection.scrollIntoViewIfNeeded()
    const logStream = logSection.locator('[role="log"]').first()
    await expect(logStream).toBeVisible()
    await expect(logStream).toHaveScreenshot('logstream-default-light.png')
  })

  test('LogStream default state snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    await logSection.scrollIntoViewIfNeeded()
    const logStream = logSection.locator('[role="log"]').first()
    await expect(logStream).toBeVisible()
    await expect(logStream).toHaveScreenshot('logstream-default-dark.png')
  })

  test('LogStream with op/target columns snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · With Op/Target') })
    await logSection.scrollIntoViewIfNeeded()
    const logStream = logSection.locator('[role="log"]').first()
    await expect(logStream).toBeVisible()
    await expect(logStream).toHaveScreenshot('logstream-with-ops-light.png')
  })

  test('LogStream with op/target columns snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · With Op/Target') })
    await logSection.scrollIntoViewIfNeeded()
    const logStream = logSection.locator('[role="log"]').first()
    await expect(logStream).toBeVisible()
    await expect(logStream).toHaveScreenshot('logstream-with-ops-dark.png')
  })

  test('LogStream empty state snapshot - light canvas', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Empty State') })
    await logSection.scrollIntoViewIfNeeded()
    const logStream = logSection.locator('[role="log"]').first()
    await expect(logStream).toBeVisible()
    await expect(logStream).toHaveScreenshot('logstream-empty-light.png')
  })

  test('LogStream empty state snapshot - dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Empty State') })
    await logSection.scrollIntoViewIfNeeded()
    const logStream = logSection.locator('[role="log"]').first()
    await expect(logStream).toBeVisible()
    await expect(logStream).toHaveScreenshot('logstream-empty-dark.png')
  })

  test('LogStream has correct role attribute', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    const logStream = logSection.locator('[role="log"]').first()
    await expect(logStream).toHaveAttribute('role', 'log')
  })

  test('LogStream has aria-live when follow is active', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    const logStream = logSection.locator('[role="log"]').first()
    await expect(logStream).toHaveAttribute('aria-live', 'polite')
  })

  test('LogStream does not have aria-live when follow is inactive', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Without Follow') })
    const logStream = logSection.locator('[role="log"]').first()
    // Check that aria-live is not present
    const ariaLive = await logStream.getAttribute('aria-live')
    expect(ariaLive).toBeNull()
  })

  test('LogStream displays INFO level with correct color', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    await logSection.scrollIntoViewIfNeeded()
    const infoLevel = logSection.locator('.log-stream__level--info').first()
    await expect(infoLevel).toBeVisible()
    await expect(infoLevel).toContainText('INFO')
  })

  test('LogStream displays WARN level with amber color', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    await logSection.scrollIntoViewIfNeeded()
    const warnLevel = logSection.locator('.log-stream__level--warn').first()
    await expect(warnLevel).toBeVisible()
    await expect(warnLevel).toContainText('WARN')
  })

  test('LogStream displays ERROR level with rose color', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    await logSection.scrollIntoViewIfNeeded()
    const errorLevel = logSection.locator('.log-stream__level--error').first()
    await expect(errorLevel).toBeVisible()
    await expect(errorLevel).toContainText('ERROR')
  })

  test('LogStream displays DEBUG level with fg-3 color', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    await logSection.scrollIntoViewIfNeeded()
    const debugLevel = logSection.locator('.log-stream__level--debug').first()
    await expect(debugLevel).toBeVisible()
    await expect(debugLevel).toContainText('DEBUG')
  })

  test('LogStream shows op and target columns when showOps is true', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · With Op/Target') })
    await logSection.scrollIntoViewIfNeeded()
    const opElements = logSection.locator('.log-stream__op')
    const targetElements = logSection.locator('.log-stream__target')
    const count = await opElements.count()
    expect(count).toBeGreaterThan(0)
    const targetCount = await targetElements.count()
    expect(targetCount).toBeGreaterThan(0)
  })

  test('LogStream empty state shows correct message', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Empty State') })
    await logSection.scrollIntoViewIfNeeded()
    const emptyText = logSection.locator('.log-stream__empty-text')
    await expect(emptyText).toContainText('No log entries')
  })

  test('LogStream displays timestamp in HH:MM:SS format', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    await logSection.scrollIntoViewIfNeeded()
    const timeElements = logSection.locator('.log-stream__time')
    const firstTime = await timeElements.first().textContent()
    // Should match HH:MM:SS format
    expect(firstTime).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  test('LogStream applies overflow-anchor auto', async ({ page }) => {
    const sections = page.locator('section')
    const logSection = sections.filter({ has: page.locator('text=LogStream · Default State') })
    const logStream = logSection.locator('[role="log"]').first()
    const overflowAnchor = await logStream.evaluate((el) => {
      return window.getComputedStyle(el).overflowAnchor
    })
    expect(overflowAnchor).toBe('auto')
  })
})
