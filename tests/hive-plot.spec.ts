import { test, expect, type Page } from '@playwright/test'

// HivePlot on the layered-graph fixtures (src/test-pages/HivePlotTestPage.tsx). The geometry is
// unit-tested in src/utils/__tests__/hivePlot.test.ts and reach in layered.test.ts; this checks the
// rendering, selection and keyboard wiring, and the two themes.

const BASE = 'http://localhost:5173/?example=hive-plot'
const ORIGIN = 'application.applicationcomponent'

async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.setViewportSize({ width: 1180, height: 960 })
  await page.goto(BASE + query)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('hive-plot')).toBeVisible()
  return errors
}

const status = (page: Page) => page.getByTestId('hive-plot-selection')

test.describe('HivePlot', () => {
  test('draws doubled axes, every link and one focusable button per node', async ({ page }) => {
    const errors = await open(page)
    await expect(page.getByTestId('hive-plot-caption')).toContainText('36 nodes · 162 links · 22 cross-layer')
    await expect(page.locator('.hive-plot__axis')).toHaveCount(3)
    await expect(page.locator('.hive-plot__axis line')).toHaveCount(6)
    await expect(page.locator('.hive-plot__link')).toHaveCount(162)
    await expect(page.locator('.hive-plot [role="button"]')).toHaveCount(36)
    await expect(page.locator('.hive-plot [role="button"][tabindex="0"]')).toHaveCount(1)
    await expect(page.locator('.hive-plot__label')).toHaveCount(3) // top node per axis
    expect(errors).toEqual([])
  })

  test('split=0 draws one line per axis', async ({ page }) => {
    await open(page, '&split=0')
    await expect(page.locator('.hive-plot__axis line')).toHaveCount(3)
    await expect(page.locator('.hive-plot__node')).toHaveCount(36)
  })

  for (const split of ['', '&split=0']) {
    test(`hiding a layer leaves a gap: the other axes and the frame stay put${split ? ' (unsplit)' : ''}`, async ({ page }) => {
      await open(page, split)
      const axisLines = (id: string) =>
        page.locator(`.hive-plot__axis[data-layer-id="${id}"] line`).evaluateAll((ls) => ls.map((l) => ['x1', 'y1', 'x2', 'y2'].map((a) => l.getAttribute(a)).join(',')))
      const viewBox = () => page.locator('.hive-plot__svg').getAttribute('viewBox')
      const before = { business: await axisLines('business'), technology: await axisLines('technology'), viewBox: await viewBox() }
      await page.getByTestId('hive-plot-toggle-application').click()
      await expect(page.locator('.hive-plot__axis')).toHaveCount(2)
      await expect(page.locator('.hive-plot__axis[data-layer-id="application"]')).toHaveCount(0)
      expect(await axisLines('business')).toEqual(before.business)
      expect(await axisLines('technology')).toEqual(before.technology)
      expect(await viewBox()).toBe(before.viewBox)
      await page.getByTestId('hive-plot-toggle-application').click()
      await expect(page.locator('.hive-plot__axis')).toHaveCount(3)
      await page.getByTestId('hive-plot-toggle-business').click()
      await expect(page.locator('.hive-plot__axis')).toHaveCount(2)
      expect(await axisLines('technology')).toEqual(before.technology)
      expect(await viewBox()).toBe(before.viewBox)
    })
  }

  test('unsplit: hovering a node never moves or drops another label', async ({ page }) => {
    await open(page, `&split=0&select=${ORIGIN}`)
    const labels = () =>
      page.locator('.hive-plot__label').evaluateAll((ts) => Object.fromEntries(ts.map((t) => [t.textContent ?? '', t.getAttribute('text-anchor') ?? ''])))
    const before = await labels()
    for (const [id, label] of [['technology.systemsoftware', 'SystemSoftware'], ['business.businessprocess', 'BusinessProcess']]) {
      await page.locator(`.hive-plot__node[data-node-id="${id}"]`).hover()
      await expect(page.locator('.hive-plot__label', { hasText: new RegExp(`^${label}$`) })).toHaveCount(1)
      const during = await labels()
      for (const [text, anchor] of Object.entries(before)) expect(during[text], text).toBe(anchor)
      expect(Object.keys(during).filter((t) => !(t in before))).toEqual(label in before ? [] : [label])
      await page.mouse.move(0, 0)
      await expect.poll(labels).toEqual(before)
    }
  })

  test('click selects, clicking again and Escape clear', async ({ page }) => {
    await open(page)
    const node = page.getByRole('button', { name: 'BusinessProcess, Business layer' })
    await node.click()
    await expect(status(page)).toContainText('selected business.businessprocess')
    await expect(page.locator('.hive-plot__pill').first()).toBeVisible()
    await page.getByRole('button', { name: 'BusinessProcess, Business layer, selected' }).click()
    await expect(status(page)).toHaveText('no selection')
    await node.click()
    await page.keyboard.press('Escape')
    await expect(status(page)).toHaveText('no selection')
  })

  test('keyboard: one tab stop, arrows move along and across axes, Enter selects', async ({ page }) => {
    await open(page)
    await page.locator('.hive-plot [role="button"][tabindex="0"]').focus()
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await expect(status(page)).toContainText('selected business.businessprocess')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Space')
    await expect(status(page)).toContainText('selected application.')
    await page.keyboard.press('Escape')
    await expect(status(page)).toHaveText('no selection')
  })

  test('follow changes the reach', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    await expect(status(page)).toHaveText(`selected ${ORIGIN} · reach 13`)
    await page.getByRole('radio', { name: 'Direct' }).or(page.getByRole('button', { name: 'Direct' })).first().click()
    await expect(status(page)).toHaveText(`selected ${ORIGIN} · reach 10`)
    await page.getByRole('radio', { name: '+2 layers' }).or(page.getByRole('button', { name: '+2 layers' })).first().click()
    await expect(status(page)).toHaveText(`selected ${ORIGIN} · reach 14`)
  })

  test('link click selects its source', async ({ page }) => {
    await open(page)
    await page.locator('.hive-plot__link').first().dispatchEvent('click')
    await expect(status(page)).toContainText('selected ')
  })

  const axisIds = (page: Page) => page.locator('.hive-plot__axis').evaluateAll((gs) => gs.map((g) => g.getAttribute('data-axis-id')))

  test('axes by any attribute: one axis per value, sorted, titled by id', async ({ page }) => {
    const errors = await open(page, '&axes=aspect')
    expect(await axisIds(page)).toEqual(['active', 'behavior', 'passive', 'service'])
    await expect(page.locator('.hive-plot__axis-title')).toHaveText(['ACTIVE', 'BEHAVIOR', 'PASSIVE', 'SERVICE'])
    await expect(page.locator('.hive-plot__axis[data-layer-id]')).toHaveCount(0)
    await expect(page.locator('.hive-plot [role="button"]')).toHaveCount(36)
    await expect(page.getByRole('button', { name: 'BusinessProcess, Business layer, behavior axis' })).toHaveCount(1)
    // Selection and reach work across axes as across layers.
    await page.getByRole('button', { name: 'ApplicationComponent, Application layer, active axis' }).click()
    await expect(status(page)).toContainText('selected application.applicationcomponent · reach 13')
    expect(errors).toEqual([])
  })

  test('axisOrder puts the listed axes first', async ({ page }) => {
    await open(page, '&axes=aspect&axisOrder=service,behavior')
    expect(await axisIds(page)).toEqual(['service', 'behavior', 'active', 'passive'])
  })

  test('nodes without an axis are not drawn, with a dev warning', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'warning') warnings.push(msg.text()) })
    await open(page, '&axes=partial')
    expect(await axisIds(page)).toEqual(['active', 'behavior', 'service'])
    await expect(page.locator('.hive-plot [role="button"]')).toHaveCount(30)
    expect(warnings.some((w) => w.includes('HivePlot: 6 node(s) have no axis'))).toBe(true)
  })

  test('axes by attribute: hiding a layer hides its nodes, and every axis stays put', async ({ page }) => {
    await open(page, '&axes=aspect')
    const lines = () => page.locator('.hive-plot__axis line').evaluateAll((ls) => ls.map((l) => ['x1', 'y1', 'x2', 'y2'].map((a) => l.getAttribute(a)).join(',')))
    const before = await lines()
    await page.getByTestId('hive-plot-toggle-technology').click()
    await expect(page.locator('.hive-plot [role="button"]')).toHaveCount(23)
    expect(await lines()).toEqual(before)
  })

  for (const dark of [false, true]) {
    const theme = dark ? 'dark' : 'light'
    test(`visual: ${theme} canvas, axes by attribute with a selection`, async ({ page }) => {
      await open(page, `&axes=aspect&select=${ORIGIN}${dark ? '&dark=1' : ''}`)
      await expect(page.getByTestId('hive-plot')).toHaveScreenshot(`hive-plot-axes-attribute-${theme}.png`)
    })
  }

  // Unsplit loops between neighbours on one axis, each with an arrowhead, and a hidden layer's gap.
  test('visual: unsplit loops with a hidden layer', async ({ page }) => {
    await open(page, '&split=0&labels=off&hide=technology&select=business.businessservice')
    await expect(page.getByTestId('hive-plot')).toHaveScreenshot('hive-plot-unsplit-hidden-light.png')
  })

  for (const dark of [false, true]) {
    const theme = dark ? 'dark' : 'light'
    test(`visual: ${theme} canvas, selection at follow 1`, async ({ page }) => {
      await open(page, `&select=${ORIGIN}&follow=1${dark ? '&dark=1' : ''}`)
      await expect(page.getByTestId('hive-plot')).toHaveScreenshot(`hive-plot-selection-${theme}.png`)
    })
    test(`visual: ${theme} canvas, no selection`, async ({ page }) => {
      await open(page, dark ? '&dark=1' : '')
      await expect(page.getByTestId('hive-plot')).toHaveScreenshot(`hive-plot-unselected-${theme}.png`)
    })
  }
})
