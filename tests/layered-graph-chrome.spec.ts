import { test, expect, type Page } from '@playwright/test'

// Layered-graph chrome (FollowControl, PredicateLabelControl, PlaneLayoutControl,
// LinkCategoryFilter, LayerList, LayerPairList, BridgeNodeList, ReachInspector) around an
// AdjacencyMatrix, all on one useLayeredGraph (src/test-pages/LayeredGraphChromeTestPage.tsx).
// Each control must change the shared state, and the matrix must reflect it.

const BASE = 'http://localhost:5173/?example=layered-graph-chrome'
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

const state = (page: Page) => page.getByTestId('chrome-state')
const cells = (page: Page) => page.locator('.adjacency-matrix__cell')
const inspector = (page: Page) => page.getByTestId('reach-inspector')

test.describe('Layered graph chrome', () => {
  test('renders every control and an empty inspector', async ({ page }) => {
    const errors = await open(page)
    await expect(inspector(page)).toHaveText('No node selected.')
    await expect(page.getByTestId('layer-list').locator('li')).toHaveCount(3)
    await expect(page.getByTestId('layer-pair-list').locator('li')).toHaveCount(3)
    await expect(page.getByTestId('bridge-node-list').locator('li')).toHaveCount(6)
    await expect(page.getByTestId('link-bar').locator('[data-category]')).toHaveCount(6)
    await expect(cells(page)).toHaveCount(162)
    expect(errors).toEqual([])
  })

  test('FollowControl sets follow; the reach and the inspector follow it', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    await expect(state(page)).toContainText(`selected ${ORIGIN} · reach 13 · follow 1`)
    await expect(inspector(page)).toContainText('Followed across layers · 3')
    await expect(inspector(page)).toContainText('reach 13 nodes across 3 layers · follow +1 layer')

    await page.getByRole('radio', { name: 'Direct' }).click()
    await expect(state(page)).toContainText('reach 10 · follow 0')
    await expect(inspector(page)).not.toContainText('Followed across layers')
    await expect(inspector(page)).toContainText('follow direct only')

    // keyboard: arrows move along the radio group
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(state(page)).toContainText('reach 14 · follow 2')
    await expect(inspector(page)).toContainText('Followed across layers · 4')
  })

  test('PredicateLabelControl sets the label mode; the matrix codes follow it', async ({ page }) => {
    await open(page)
    await expect(page.locator('.adjacency-matrix__legend')).toHaveCount(0)
    await page.getByRole('radio', { name: 'All' }).click()
    await expect(state(page)).toContainText('labels all')
    await expect(page.locator('.adjacency-matrix__legend')).toBeVisible()
    await page.getByRole('radio', { name: 'Off' }).click()
    await expect(state(page)).toContainText('labels off')
    await expect(page.locator('.adjacency-matrix__legend')).toHaveCount(0)
  })

  test('PlaneLayoutControl sets the plane layout', async ({ page }) => {
    await open(page)
    await page.getByRole('radio', { name: 'Coupled' }).click()
    await expect(state(page)).toContainText('plane coupled')
    await expect(page.getByRole('radio', { name: 'Coupled' })).toHaveAttribute('aria-checked', 'true')
  })

  test('LinkCategoryFilter toggles categories, intra-layer links and node labels', async ({ page }) => {
    await open(page)
    const bar = page.getByTestId('link-bar')
    const structural = bar.locator('[data-category="structural"]')
    await expect(structural).toHaveAttribute('aria-pressed', 'true')
    await structural.click()
    await expect(structural).toHaveAttribute('aria-pressed', 'false')
    await expect(state(page)).toContainText('off structural')
    expect(await cells(page).count()).toBeLessThan(162)
    await structural.click()
    await expect(cells(page)).toHaveCount(162)

    await bar.getByRole('button', { name: 'Intra-layer links' }).click()
    await expect(state(page)).toContainText('intra off')
    await expect(cells(page)).toHaveCount(22)

    // The label toggle writes the graph's shared nodeLabels state (no props on the bar).
    const labels = bar.getByRole('button', { name: 'Labels' })
    await expect(labels).toHaveAttribute('aria-pressed', 'true')
    await labels.click()
    await expect(state(page)).toContainText('node-labels off')
    await expect(labels).toHaveAttribute('aria-pressed', 'false')
  })

  test('a multi-selection reaches the union, and the inspector shows the primary', async ({ page }) => {
    const errors = await open(page, `&select=business.businessprocess,${ORIGIN}`)
    // reach 19 = the union of BusinessProcess's and ApplicationComponent's reach at follow 1, both origins excluded
    await expect(state(page)).toContainText(`selected business.businessprocess,${ORIGIN} · reach 19 · follow 1`)
    await expect(page.locator('.reach-inspector__title')).toHaveText('BusinessProcess')
    // Hiding the business layer drops the primary; the other node becomes the primary (its reach, less the hidden layer).
    await page.getByTestId('layer-list').getByRole('button', { name: /^Hide Business/ }).click()
    await expect(state(page)).toContainText(`selected ${ORIGIN} · reach 10 · follow 1`)
    await expect(page.locator('.reach-inspector__title')).toHaveText('ApplicationComponent')
    expect(errors).toEqual([])
  })

  test('LayerList focuses and hides layers', async ({ page }) => {
    await open(page)
    const list = page.getByTestId('layer-list')
    const business = list.getByRole('button', { name: /^Business layer/ })
    await business.click()
    await expect(state(page)).toContainText('focus business')
    await expect(business).toHaveAttribute('aria-pressed', 'true')
    await business.click()
    await expect(state(page)).toContainText('focus none')

    await list.getByRole('button', { name: 'Hide Business' }).click()
    await expect(state(page)).toContainText('hidden business')
    await expect(page.locator('.adjacency-matrix__header[role="button"]')).toHaveCount(22)
    await expect(page.getByTestId('layer-pair-list').locator('li')).toHaveCount(1)
    await list.getByRole('button', { name: 'Show Business' }).click()
    await expect(page.locator('.adjacency-matrix__header[role="button"]')).toHaveCount(36)
  })

  test('LayerPairList toggles layer-pair focus', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    const pair = page.getByTestId('layer-pair-list').getByRole('button', { name: 'Business and Application, 8 cross-layer links' })
    await pair.click()
    await expect(state(page)).toContainText('no selection')
    await expect(state(page)).toContainText('pair ["business","application"]')
    await expect(cells(page)).toHaveCount(8)
    await pair.click()
    await expect(state(page)).toContainText('pair none')
    await expect(cells(page)).toHaveCount(162)
  })

  test('BridgeNodeList selects; inspector rows navigate and clear', async ({ page }) => {
    await open(page)
    await page.getByTestId('bridge-node-list').getByRole('button', { name: /^BusinessProcess,/ }).click()
    await expect(state(page)).toContainText('selected business.businessprocess')
    await expect(inspector(page).getByRole('heading', { level: 2 })).toHaveText('BusinessProcess')
    await expect(inspector(page)).toContainText('Business layer')

    // keyboard: Enter on an inspector row selects its node
    await inspector(page).getByRole('button', { name: /^ApplicationService, (incoming|outgoing)/ }).first().focus()
    await page.keyboard.press('Enter')
    await expect(state(page)).toContainText('selected application.applicationservice')

    await inspector(page).getByRole('button', { name: 'Clear selection' }).click()
    await expect(state(page)).toContainText('no selection')
    await expect(inspector(page)).toHaveText('No node selected.')
  })

  test('shell surface: the controls read the shell tokens and still drive the graph', async ({ page }) => {
    await page.goto(BASE + '&shell=1')
    await page.waitForLoadState('networkidle')
    const strip = page.getByTestId('chrome-shell')
    await expect(strip.locator('.segmented-control--shell')).toHaveCount(3)
    await expect(strip.locator('.layered-link-filter--shell')).toHaveCount(1)
    await strip.getByRole('radio', { name: 'All' }).click()
    await expect(strip.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true')
    await expect(strip.getByRole('radio', { name: 'Coupled' })).toBeDisabled()
  })

  // At every bar width, no line of the wrapped link bar starts or ends with a divider.
  test('LinkCategoryFilter: a wrapped line never starts or ends with a divider', async ({ page }) => {
    await page.goto(BASE + '&shell=1')
    await page.waitForLoadState('networkidle')
    const bar = page.getByTestId('chrome-shell-bar')
    await expect(bar.locator('.layered-link-filter__divider')).toHaveCount(2)

    /** The bar's visible items (sections flattened), grouped into lines by vertical overlap. */
    const lines = () =>
      bar.evaluate((el) => {
        const items: { divider: boolean; top: number; bottom: number; left: number }[] = []
        for (const child of Array.from(el.children) as HTMLElement[]) {
          const parts = child.classList.contains('layered-link-filter__section') ? (Array.from(child.children) as HTMLElement[]) : [child]
          for (const p of parts) {
            const r = p.getBoundingClientRect()
            if ((r.width === 0 && r.height === 0) || getComputedStyle(p).visibility === 'hidden') continue
            items.push({ divider: p.classList.contains('layered-link-filter__divider'), top: r.top, bottom: r.bottom, left: r.left })
          }
        }
        const out: { divider: boolean; left: number }[][] = []
        let line: typeof items = []
        for (const it of items) {
          const prev = line[line.length - 1]
          if (prev && (it.top >= prev.bottom || it.left < prev.left)) {
            out.push(line)
            line = []
          }
          line.push(it)
        }
        if (line.length) out.push(line)
        // Every line starts flush with the bar's content box: a hidden divider leaves no indent.
        const contentLeft = el.getBoundingClientRect().left + el.clientLeft + parseFloat(getComputedStyle(el).paddingLeft)
        return out.map((l) => (Math.abs(l[0].left - contentLeft) > 1 ? 'indent:' : '') + l.map((it) => (it.divider ? '|' : 'x')).join(''))
      })

    let wrapped = 0
    let hidden = 0
    for (let width = 1100; width >= 300; width -= 20) {
      await bar.evaluate((el, w) => { el.style.width = `${w}px` }, width)
      // The bar re-measures a frame after it resizes.
      await expect
        .poll(async () => (await lines()).filter((l) => l.startsWith('indent:') || l.startsWith('|') || l.endsWith('|')), { message: `width ${width}` })
        .toEqual([])
      const ls = await lines()
      if (ls.length > 1) wrapped++
      hidden += 2 - ls.join('').split('|').length + 1
    }
    expect(wrapped).toBeGreaterThan(0)
    // Some widths start a line with a section, whose divider is then hidden.
    expect(hidden).toBeGreaterThan(0)
  })

  // Re-renders that leave every width alone (here: follow changes) do not re-measure the bar.
  test('LinkCategoryFilter: a re-render with unchanged widths leaves the dividers alone', async ({ page }) => {
    await page.goto(BASE + '&shell=1')
    await page.waitForLoadState('networkidle')
    const bar = page.getByTestId('chrome-shell-bar')
    await expect(bar.locator('.layered-link-filter__section[data-line-start]')).toHaveCount(1)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    await bar.evaluate((el) => {
      const w = window as unknown as { __barWrites: number }
      w.__barWrites = 0
      new MutationObserver((records) => { w.__barWrites += records.length }).observe(el, { attributes: true, subtree: true, attributeFilter: ['data-line-start', 'style'] })
    })
    const strip = page.getByTestId('chrome-shell')
    for (const name of ['Direct', '+2 layers', '+1 layer', 'Direct']) {
      await strip.getByRole('radio', { name }).click()
      await expect(strip.getByRole('radio', { name })).toHaveAttribute('aria-checked', 'true')
    }
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    expect(await page.evaluate(() => (window as unknown as { __barWrites: number }).__barWrites)).toBe(0)
    await expect(bar.locator('.layered-link-filter__section[data-line-start]')).toHaveCount(1)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`visual: shell surface controls, ${theme} canvas`, async ({ page }) => {
      await page.goto(BASE + `&shell=1&select=${ORIGIN}${theme === 'dark' ? '&dark=1' : ''}`)
      await page.waitForLoadState('networkidle')
      await page.setViewportSize({ width: 900, height: 600 })
      // One unpressed category, to show both toggle states.
      await page.getByTestId('chrome-shell-bar').locator('[data-category="security"]').click()
      await page.mouse.move(0, 0)
      await page.locator('body').evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
      await expect(page.getByTestId('chrome-shell')).toHaveScreenshot(`layered-graph-chrome-shell-${theme}.png`)
    })
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`visual: controls and inspector with a selection, ${theme}`, async ({ page }) => {
      await open(page, `&select=${ORIGIN}${theme === 'dark' ? '&dark=1' : ''}`)
      await expect(page.getByTestId('chrome-header')).toHaveScreenshot(`layered-graph-chrome-header-${theme}.png`)
      await expect(page.getByTestId('link-bar')).toHaveScreenshot(`layered-graph-chrome-link-bar-${theme}.png`)
      await expect(page.getByTestId('chrome-aside')).toHaveScreenshot(`layered-graph-chrome-aside-${theme}.png`)
    })
  }
})
