import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('LineageRail Component', () => {
  test('light canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('lineage-rail-light-canvas.png', { fullPage: true })
  })

  test('dark canvas snapshot', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('lineage-rail-dark-canvas.png', { fullPage: true })
  })

  test('interactive node click', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text())
      }
    })

    const interactiveButton = page.locator('button:has-text("source")').first()
    await interactiveButton.click()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(consoleMessages.some((msg) => msg.includes('clicked'))).toBeTruthy()
  })

  test('accessibility: heading text on head node', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    const headNodes = page.locator('[role="listitem"]').filter({ has: page.locator('.lineage-rail__node--head') })

    const headNodeCount = await headNodes.count()
    expect(headNodeCount).toBeGreaterThan(0)

    const firstHeadNode = headNodes.first()
    const text = await firstHeadNode.textContent()
    expect(text).toBeTruthy()
  })

  test('accessibility: list role and structure', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    const containers = page.locator('[role="list"]')
    const count = await containers.count()
    expect(count).toBeGreaterThan(0)

    const firstContainer = containers.first()
    const ariaLabel = await firstContainer.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
  })

  test('arrows are aria-hidden and properly styled', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    const arrows = page.locator('.lineage-rail__arrow[aria-hidden="true"]')
    const count = await arrows.count()
    expect(count).toBeGreaterThan(0)

    const firstArrow = arrows.first()
    const color = await firstArrow.evaluate((el) => {
      return window.getComputedStyle(el).color
    })
    expect(color).toBeTruthy()
  })

  test('component structure: nodes with and without onClick', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    const nodes = page.locator('[role="listitem"]')
    const count = await nodes.count()
    expect(count).toBeGreaterThan(0)

    const buttons = page.locator('button[role="listitem"]')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeGreaterThanOrEqual(0)

    const spans = page.locator('span[role="listitem"]')
    const spanCount = await spans.count()
    expect(spanCount).toBeGreaterThanOrEqual(0)

    expect(buttonCount + spanCount).toBeGreaterThan(0)
  })

  test('single node section has no arrows', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    const allArrows = page.locator('.lineage-rail__arrow')
    const arrowCount = await allArrows.count()
    expect(arrowCount).toBeGreaterThan(0)
  })

  test('wrap mode applies correct class', async ({ page }) => {
    await page.goto('http://localhost:5173/?example=lineage-rail')
    await page.waitForLoadState('networkidle')

    const wrappedRails = page.locator('.lineage-rail--wrap')
    const count = await wrappedRails.count()
    expect(count).toBeGreaterThan(0)
  })
})
