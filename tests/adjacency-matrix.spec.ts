import { test, expect, type Page } from '@playwright/test'

// AdjacencyMatrix on the layered-graph fixtures (src/test-pages/AdjacencyMatrixTestPage.tsx).
// The reach and index rules are unit-tested in src/utils/__tests__/layered.test.ts; this checks
// the rendering, selection wiring and the two themes.

const BASE = 'http://localhost:5173/?example=adjacency-matrix'
const ORIGIN = 'application.applicationcomponent'

async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto(BASE + query)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('adjacency-matrix')).toBeVisible()
  return errors
}

test.describe('AdjacencyMatrix', () => {
  test('draws one cell per link and one header button per node', async ({ page }) => {
    const errors = await open(page)
    await expect(page.getByTestId('adjacency-matrix-caption')).toContainText('36 nodes · 162 links · 22 cross-layer')
    await expect(page.locator('.adjacency-matrix__cell')).toHaveCount(162)
    await expect(page.locator('.adjacency-matrix [role="button"]')).toHaveCount(36)
    await expect(page.locator('.adjacency-matrix__legend')).toHaveCount(0) // nothing highlighted, no codes
    expect(errors).toEqual([])
  })

  test('selection follows cross-layer links per the Follow setting', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    const status = page.getByTestId('adjacency-matrix-selection')
    await expect(status).toHaveText(`selected ${ORIGIN} · reach 13`)
    await page.getByRole('radio', { name: 'Direct' }).or(page.getByRole('button', { name: 'Direct' })).first().click()
    await expect(status).toHaveText(`selected ${ORIGIN} · reach 10`)
    await page.getByRole('radio', { name: '+2 layers' }).or(page.getByRole('button', { name: '+2 layers' })).first().click()
    await expect(status).toHaveText(`selected ${ORIGIN} · reach 14`)
    await expect(page.locator('.adjacency-matrix__legend')).toBeVisible()
  })

  test('header click and keyboard select a node; clicking again clears it', async ({ page }) => {
    await open(page)
    const header = page.getByRole('button', { name: 'BusinessProcess, Business layer' })
    await header.click()
    await expect(page.getByTestId('adjacency-matrix-selection')).toContainText('selected business.businessprocess')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('adjacency-matrix-selection')).toContainText('selected business.businessinteraction')
    await page.getByRole('button', { name: 'BusinessInteraction, Business layer, selected' }).click()
    await expect(page.getByTestId('adjacency-matrix-selection')).toHaveText('no selection')
  })

  test('cell click selects the link source', async ({ page }) => {
    await open(page)
    await page.locator('.adjacency-matrix__cell').first().click()
    await expect(page.getByTestId('adjacency-matrix-selection')).toContainText('selected ')
  })

  test('visual: dark canvas with a followed selection', async ({ page }) => {
    await open(page, `&select=${ORIGIN}&dark=1`)
    await expect(page.getByTestId('adjacency-matrix')).toHaveScreenshot('adjacency-matrix-selection-dark.png')
  })

  test('visual: light canvas with every predicate code', async ({ page }) => {
    await open(page, '&labels=all')
    await expect(page.getByTestId('adjacency-matrix')).toHaveScreenshot('adjacency-matrix-all-codes-light.png')
  })
})
