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

test.describe('AdjacencyMatrix symmetric', () => {
  test('merges both directions into one cell above the diagonal', async ({ page }) => {
    const errors = await open(page, '&symmetric=1')
    // 162 links over 130 node pairs, 32 of them linked both ways
    await expect(page.locator('.adjacency-matrix__cell')).toHaveCount(130)
    await expect(page.locator('.adjacency-matrix__cell--both')).toHaveCount(32)
    const below = await page.locator('.adjacency-matrix__cell').evaluateAll((els) =>
      els.filter((el) => Number(el.getAttribute('data-row')) > Number(el.getAttribute('data-col'))).length,
    )
    expect(below).toBe(0)
    await expect(page.locator('.adjacency-matrix__cell--both title').first()).toContainText('\n')
    expect(errors).toEqual([])
  })

  test('clicking a cell holding both directions selects its drawn link source', async ({ page }) => {
    await open(page, `&symmetric=1&select=${ORIGIN}`)
    const cell = page.locator('.adjacency-matrix__cell--both').first()
    const source = await cell.getAttribute('data-source-id')
    expect(source).toBeTruthy()
    await cell.click()
    await expect(page.getByTestId('adjacency-matrix-selection')).toContainText(`selected ${source} `)
  })

  test('onLinkSelect receives the drawn link and both links of a merged cell', async ({ page }) => {
    await open(page, '&symmetric=1&report=1')
    const cell = page.locator('.adjacency-matrix__cell--both').first()
    const source = await cell.getAttribute('data-source-id')
    await cell.click()
    await expect(page.getByTestId('adjacency-matrix-report')).toHaveText(new RegExp(`^link ${source!.replace(/\./g, '\\.')} -> \\S+ · 2 in cell$`))
    // a report handler replaces the default selection
    await expect(page.getByTestId('adjacency-matrix-selection')).toHaveText('no selection')
  })

  test('visual: light canvas, symmetric with a selection', async ({ page }) => {
    await open(page, `&symmetric=1&select=${ORIGIN}`)
    await expect(page.getByTestId('adjacency-matrix')).toHaveScreenshot('adjacency-matrix-symmetric-light.png')
  })
})

test.describe('AdjacencyMatrix aggregate="layer"', () => {
  const PAIR = '["business","application"]'

  test('draws one heat cell per non-empty layer pair', async ({ page }) => {
    const errors = await open(page, '&aggregate=layer')
    await expect(page.locator('.adjacency-matrix__heat-cell')).toHaveCount(7)
    await expect(page.locator('.adjacency-matrix__cell')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Application to Business: 7 links' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Within Technology: 72 links' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Business layer, 14 nodes' })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('symmetric adds both directions into the upper triangle', async ({ page }) => {
    await open(page, '&aggregate=layer&symmetric=1')
    await expect(page.locator('.adjacency-matrix__heat-cell')).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Between Business and Application: 8 links' })).toBeVisible()
  })

  test('a cross-layer cell toggles the layer-pair filter; a diagonal cell or header toggles the focus', async ({ page }) => {
    await open(page, '&aggregate=layer')
    const state = page.getByTestId('adjacency-matrix-layer-state')
    const cross = page.getByRole('button', { name: /^Business to Application/ })
    await cross.click()
    await expect(state).toHaveText(`pair ${PAIR} · focus none`)
    await expect(cross).toHaveAttribute('aria-pressed', 'true')
    // the reverse direction is the same pair
    await expect(page.getByRole('button', { name: /^Application to Business/ })).toHaveAttribute('aria-pressed', 'true')
    // counts ignore the pair filter: every cell stays
    await expect(page.locator('.adjacency-matrix__heat-cell')).toHaveCount(7)
    await cross.click()
    await expect(state).toHaveText('pair none · focus none')

    await page.getByRole('button', { name: /^Within Application/ }).click()
    await expect(state).toHaveText('pair none · focus application')
    await page.getByRole('button', { name: 'Application layer, 9 nodes, focused' }).focus()
    await page.keyboard.press('Enter')
    await expect(state).toHaveText('pair none · focus none')
    await page.getByRole('button', { name: /^Technology to Business/ }).focus()
    await page.keyboard.press(' ')
    await expect(state).toHaveText('pair ["business","technology"] · focus none')
  })

  test('onLayerCellSelect replaces the default filter and focus toggles', async ({ page }) => {
    await open(page, '&aggregate=layer&report=1')
    const cross = page.getByRole('button', { name: 'Application to Business: 7 links' })
    await expect(cross).not.toHaveAttribute('aria-pressed')
    await cross.click()
    await expect(page.getByTestId('adjacency-matrix-report')).toHaveText(`layers application -> business · 7 · pair ${PAIR}`)
    await page.getByRole('button', { name: 'Within Business: 37 links' }).click()
    await expect(page.getByTestId('adjacency-matrix-report')).toHaveText('layers business -> business · 37 · pair none')
    await expect(page.getByTestId('adjacency-matrix-layer-state')).toHaveText('pair none · focus none')
  })

  test('visual: dark canvas heat map with an active pair', async ({ page }) => {
    await open(page, '&aggregate=layer&dark=1')
    await page.getByRole('button', { name: /^Business to Application/ }).click()
    await page.mouse.move(0, 0)
    await expect(page.getByTestId('adjacency-matrix')).toHaveScreenshot('adjacency-matrix-aggregate-dark.png')
  })

  test('visual: light canvas symmetric heat map with a focused layer', async ({ page }) => {
    await open(page, '&aggregate=layer&symmetric=1')
    await page.getByRole('button', { name: 'Application layer, 9 nodes' }).click()
    await page.mouse.move(0, 0)
    await expect(page.getByTestId('adjacency-matrix')).toHaveScreenshot('adjacency-matrix-aggregate-symmetric-light.png')
  })
})
