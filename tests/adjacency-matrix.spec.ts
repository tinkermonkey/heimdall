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

test.describe('AdjacencyMatrix onCellSelect and order', () => {
  test('onCellSelect gets the drawn link and every link in the cell; the deprecated onLinkSelect still works', async ({ page }) => {
    for (const report of ['1', 'legacy']) {
      await open(page, `&symmetric=1&report=${report}`)
      const cell = page.locator('.adjacency-matrix__cell--both').first()
      const source = await cell.getAttribute('data-source-id')
      await cell.click()
      await expect(page.getByTestId('adjacency-matrix-report')).toContainText(`link ${source} -> `)
      await expect(page.getByTestId('adjacency-matrix-report')).toContainText('· 2 in cell')
      await expect(page.getByTestId('adjacency-matrix-selection')).toHaveText('no selection')
    }
  })

  test('order="cluster" puts each community on adjacent rows, the same on every load', async ({ page }) => {
    const rows = async () =>
      page.locator('.adjacency-matrix__header[data-node-id]').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')!.split(',')[0]))
    // Louvain communities within each layer of the spec fixture
    const communities = [
      ['BusinessService', 'Contract', 'Product'],
      ['BusinessObject', 'Representation'],
      ['BusinessActor', 'BusinessInterface', 'BusinessRole'],
      ['BusinessCapability', 'BusinessEvent', 'BusinessFunction', 'BusinessProcess'],
      ['ApplicationCollaboration', 'ApplicationComponent', 'ApplicationInteraction', 'ApplicationInterface', 'ApplicationService'],
      ['ApplicationEvent', 'ApplicationFunction', 'ApplicationProcess', 'DataObject'],
      ['Device', 'Node'],
    ]
    const adjacent = (order: string[], group: string[]) => {
      const at = group.map((g) => order.indexOf(g))
      return Math.max(...at) - Math.min(...at) === group.length - 1
    }
    await open(page, '&order=cluster')
    const first = await rows()
    expect(first).toHaveLength(36)
    for (const group of communities) expect(adjacent(first, group), group.join(', ')).toBe(true)
    await open(page, '&order=cluster')
    expect(await rows()).toEqual(first)
    // the default order splits at least one of them
    await open(page)
    const plain = await rows()
    expect(communities.some((group) => !adjacent(plain, group))).toBe(true)
  })

  test('visual: light canvas, cluster order', async ({ page }) => {
    await open(page, '&order=cluster')
    await expect(page.getByTestId('adjacency-matrix')).toHaveScreenshot('adjacency-matrix-cluster-light.png')
  })
})

test.describe('LayeredGraphExplorer matrix link inspector', () => {
  const EXPLORER = 'http://localhost:5173/?example=layered-graph-explorer&view=matrix'
  const panel = (page: Page) => page.getByTestId('matrix-link-inspector')
  const selectedHeaders = (page: Page) => page.locator('.adjacency-matrix__header[aria-label$=", selected"]')
  async function openExplorer(page: Page, query = '') {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto(EXPLORER + query)
    await page.waitForLoadState('networkidle')
    return errors
  }

  test('a cell click shows the link; a merged cell steps through both directions', async ({ page }) => {
    const errors = await openExplorer(page, '&matrix=symmetric')
    await expect(panel(page)).toHaveCount(0)

    await page.locator('.adjacency-matrix__cell--both').first().click()
    await expect(panel(page)).toBeVisible()
    await expect(page.getByRole('region', { name: 'Link details, 1 of 2' })).toBeVisible()
    await expect(page.getByTestId('adjacency-matrix-selected-cell')).toHaveCount(1)
    // the click shows the link and no longer selects the source
    await expect(selectedHeaders(page)).toHaveCount(0)
    await expect(page.getByTestId('explorer-state')).toContainText('no selection')
    const firstSource = await panel(page).getByTestId('edge-inspector-source').innerText()
    const firstTarget = await panel(page).getByTestId('edge-inspector-target').innerText()

    // the other direction swaps the endpoints
    await panel(page).getByRole('button', { name: `${firstTarget} → ${firstSource}` }).click()
    await expect(panel(page)).toContainText('2 of 2')
    await expect(panel(page).getByTestId('edge-inspector-source')).toHaveText(firstTarget)
    await expect(panel(page).getByTestId('edge-inspector-target')).toHaveText(firstSource)

    // an endpoint selects its node; the panel stays
    await panel(page).getByTestId('edge-inspector-source').click()
    await expect(selectedHeaders(page)).toHaveCount(1)
    await expect(selectedHeaders(page)).toHaveAttribute('aria-label', new RegExp(`^${firstTarget}, .* layer, selected$`))
    await expect(panel(page)).toBeVisible()

    await panel(page).getByRole('button', { name: 'Close link details' }).click()
    await expect(panel(page)).toHaveCount(0)
    await expect(page.getByTestId('adjacency-matrix-selected-cell')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('Escape closes the panel and returns focus to the source row header', async ({ page }) => {
    await openExplorer(page)
    const cell = page.locator('.adjacency-matrix__cell').first()
    const source = await cell.getAttribute('data-source-id')
    await cell.click()
    await panel(page).getByRole('button', { name: 'Close link details' }).focus()
    await page.keyboard.press('Escape')
    await expect(panel(page)).toHaveCount(0)
    await expect(page.locator(`.adjacency-matrix__header[data-node-id="${source}"]`)).toBeFocused()
  })

  test('hiding the link’s category drops the panel and the outline', async ({ page }) => {
    await openExplorer(page)
    await page.locator('.adjacency-matrix__cell').first().click()
    const category = await panel(page).locator('dt:text-is("category") + dd').innerText()
    await page.locator(`.layered-link-filter [data-category="${category}"]`).click()
    await expect(panel(page)).toHaveCount(0)
    await expect(page.getByTestId('adjacency-matrix-selected-cell')).toHaveCount(0)
  })

  test('without the inspector, or with a consumer handler, a cell click keeps its old behaviour', async ({ page }) => {
    await openExplorer(page, '&hide=inspector')
    const cell = page.locator('.adjacency-matrix__cell').first()
    const source = await cell.getAttribute('data-source-id')
    await cell.click()
    await expect(page.getByTestId('explorer-state')).toContainText(`selected ${source}`)
    await expect(panel(page)).toHaveCount(0)
    await expect(page.getByTestId('adjacency-matrix-selected-cell')).toHaveCount(0)

    await openExplorer(page, '&matrix=report')
    const reported = page.locator('.adjacency-matrix__cell').first()
    const id = await reported.getAttribute('data-link-id')
    await reported.click()
    await expect(page.getByTestId('cell-report')).toHaveText(`cell ${id}`)
    await expect(panel(page)).toHaveCount(0)
    await expect(page.getByTestId('explorer-state')).toContainText('no selection')
  })

  test('visual: link inspector panel', async ({ page }) => {
    await openExplorer(page, '&matrix=symmetric')
    await page.locator('.adjacency-matrix__cell--both').first().click()
    await page.mouse.move(0, 0)
    await expect(panel(page)).toHaveScreenshot('adjacency-matrix-explorer-link-inspector.png')
  })
})
