import { test, expect, type Page } from '@playwright/test'

// GraphCanvas layout="layer-lanes" on the layered-graph fixtures (src/test-pages/LayerLanesTestPage.tsx).
// Lane geometry is unit-tested in src/utils/__tests__/laneLayout.test.ts and reach in
// src/utils/__tests__/layered.test.ts; this checks the rendering, the shared-state selection
// wiring and both themes.

const BASE = 'http://localhost:5173/?example=layer-lanes'
const ORIGIN = 'application.applicationcomponent'

async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto(BASE + query)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('layer-lanes')).toBeVisible()
  await expect(page.locator('.graph-lane')).not.toHaveCount(0)
  return errors
}

const status = (page: Page) => page.getByTestId('layer-lanes-selection')

test.describe('GraphCanvas layer-lanes', () => {
  test('draws one lane per layer, every node and every link', async ({ page }) => {
    const errors = await open(page)
    await expect(page.getByTestId('layer-lanes-caption')).toContainText('36 nodes · 162 links · 22 cross-layer')
    await expect(page.locator('.graph-lane')).toHaveCount(3)
    await expect(page.locator('.graph-lane__title')).toHaveText(['BUSINESS14', 'APPLICATION9', 'TECHNOLOGY13'])
    await expect(page.locator('.graph-lane-node')).toHaveCount(36 * 2) // drawn + measurement pass
    await expect(page.locator('.graph-nodes .graph-lane-node')).toHaveCount(36)
    await expect(page.locator('.graph-lane-link')).toHaveCount(162)
    await expect(page.locator('.graph-lane-pill')).toHaveCount(0) // nothing highlighted
    expect(errors).toEqual([])
  })

  test('intraLinks none draws only the cross-layer links', async ({ page }) => {
    await open(page, '&intra=none')
    await expect(page.locator('.graph-lane-link')).toHaveCount(22)
  })

  test('selection follows cross-layer links per the Follow setting, with pills and arrows', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    await expect(status(page)).toHaveText(`selected ${ORIGIN} · reach 13`)
    await expect(page.locator('.graph-lane-link[data-hop]')).not.toHaveCount(0)
    await expect(page.locator('.graph-lane-pill').first()).toBeVisible()
    await expect(page.locator('.graph-lane-link__arrow').first()).toBeVisible()
    await page.getByRole('radio', { name: 'Direct' }).or(page.getByRole('button', { name: 'Direct' })).first().click()
    await expect(status(page)).toHaveText(`selected ${ORIGIN} · reach 10`)
    await expect(page.locator('.graph-lane-link[data-hop="2"]')).toHaveCount(0)
    await page.getByRole('radio', { name: '+2 layers' }).or(page.getByRole('button', { name: '+2 layers' })).first().click()
    await expect(status(page)).toHaveText(`selected ${ORIGIN} · reach 14`)
  })

  test('node click selects through the layered state; again, Escape or the background clears', async ({ page }) => {
    await open(page)
    const node = page.locator('.graph-nodes').getByRole('button', { name: 'BusinessProcess, Business layer' })
    await node.click()
    await expect(status(page)).toContainText('selected business.businessprocess')
    await page.locator('.graph-nodes').getByRole('button', { name: 'BusinessProcess, Business layer, selected' }).click()
    await expect(status(page)).toHaveText('no selection')

    await node.click()
    await expect(status(page)).toContainText('selected business.businessprocess')
    await page.keyboard.press('Escape')
    await expect(status(page)).toHaveText('no selection')

    await node.click()
    const box = (await page.getByTestId('layer-lanes').boundingBox())!
    await page.mouse.click(box.x + 8, box.y + 8)
    await expect(status(page)).toHaveText('no selection')
  })

  test('keyboard: Enter on a focused node selects it', async ({ page }) => {
    await open(page)
    await page.locator('.graph-nodes').getByRole('button', { name: 'DataObject, Application layer' }).focus()
    await page.keyboard.press('Enter')
    await expect(status(page)).toContainText('selected application.dataobject')
  })

  test('nodes and edges are optional when a LayeredGraphContext supplies the graph', async ({ page }) => {
    const errors = await open(page, '&nodata=1')
    await expect(page.locator('.graph-nodes .graph-lane-node')).toHaveCount(36)
    await expect(page.locator('.graph-lane-link')).toHaveCount(162)
    await page.locator('.graph-nodes').getByRole('button', { name: 'BusinessProcess, Business layer' }).click()
    await expect(status(page)).toContainText('selected business.businessprocess')
    expect(errors).toEqual([])
  })

  test('node labels follow the layered label toggle: reached chips name the selection, reach, hover and focus', async ({ page }) => {
    const errors = await open(page, '&nodeLabels=off')
    const chips = page.locator('.graph-nodes .graph-lane-node--compact')
    const tags = page.locator('.graph-lane-tag')
    await expect(chips).toHaveCount(36)
    await expect(page.locator('.graph-nodes .graph-lane-node__label')).toHaveCount(0)
    await expect(tags).toHaveCount(0)
    const box = (await chips.first().boundingBox())!
    expect(Math.round(box.width)).toBe(Math.round(box.height))

    // Hover and keyboard focus name a chip.
    await page.locator('.graph-nodes').getByRole('button', { name: 'DataObject, Application layer' }).hover()
    await expect(page.locator('.graph-lane-tag[data-tag-for="application.dataobject"]')).toHaveText('DataObject')
    await page.mouse.move(2, 2)
    await page.locator('.graph-nodes').getByRole('button', { name: 'Node, Technology layer' }).focus()
    await expect(page.locator('.graph-lane-tag[data-tag-for="technology.node"]')).toHaveText('Node')

    // A selection names itself and as much of its reach as fits.
    await page.locator('.graph-nodes').getByRole('button', { name: 'ApplicationComponent, Application layer' }).click()
    await expect(status(page)).toContainText(`selected ${ORIGIN} · reach 13`)
    await expect(page.locator(`.graph-lane-tag--selected[data-tag-for="${ORIGIN}"]`)).toHaveText('ApplicationComponent')
    expect(await tags.count()).toBeGreaterThan(4)

    // Dragging the selection carries its tag along at the same offset.
    const tag = page.locator(`.graph-lane-tag[data-tag-for="${ORIGIN}"]`)
    const chip = page.locator(`[data-node-id="${ORIGIN}"]`)
    const [c0, g0] = [(await chip.boundingBox())!, (await tag.boundingBox())!]
    await page.mouse.move(c0.x + c0.width / 2, c0.y + c0.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 5; i++) await page.mouse.move(c0.x + c0.width / 2 + i * 12, c0.y + c0.height / 2 + i * 6)
    const [c1, g1] = [(await chip.boundingBox())!, (await tag.boundingBox())!]
    expect(c1.x - c0.x).toBeGreaterThan(20)
    expect(Math.abs(g1.x - g0.x - (c1.x - c0.x))).toBeLessThan(1)
    expect(Math.abs(g1.y - g0.y - (c1.y - c0.y))).toBeLessThan(1)
    await page.mouse.up()

    await page.getByRole('button', { name: 'Node labels' }).click()
    await expect(chips).toHaveCount(0)
    await expect(tags).toHaveCount(0)
    await expect(page.locator('.graph-nodes .graph-lane-node__label')).toHaveCount(36)
    expect(errors).toEqual([])
  })

  test('dragging a node holds the pill placement and moves pills along their links', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    const pills = page.locator('.graph-lane-pill')
    await expect(pills.first()).toBeVisible()
    const ids = async () => (await pills.evaluateAll((els) => els.map((e) => e.getAttribute('data-link-id')))).sort()
    const before = await ids()
    const transforms = async () => Object.fromEntries(await pills.evaluateAll((els) => els.map((e) => [e.getAttribute('data-link-id'), e.getAttribute('transform')])))
    const t0 = await transforms()
    const node = (await page.locator(`[data-node-id="${ORIGIN}"]`).boundingBox())!
    await page.mouse.move(node.x + node.width / 2, node.y + node.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 6; i++) await page.mouse.move(node.x + node.width / 2 + i * 20, node.y + node.height / 2 + i * 8)
    // Mid-drag: the same pills, and those on the dragged node's links have moved with it.
    expect(await ids()).toEqual(before)
    const t1 = await transforms()
    expect(Object.keys(t1).some((id) => t1[id] !== t0[id])).toBe(true)
    await page.mouse.up()
    await expect(pills.first()).toBeVisible()
  })

  test('visual: reached chips with a selection, light canvas', async ({ page }) => {
    await open(page, `&nodeLabels=off&select=${ORIGIN}`)
    await expect(page.getByTestId('layer-lanes')).toHaveScreenshot('layer-lanes-reached-light.png')
  })

  test('visual: vertical reached chips with a selection, dark canvas', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 1000 })
    await open(page, `&orientation=vertical&nodeLabels=off&select=${ORIGIN}&dark=1`)
    await expect(page.getByTestId('layer-lanes')).toHaveScreenshot('layer-lanes-reached-vertical-dark.png')
  })

  test('visual: dark canvas with a followed selection', async ({ page }) => {
    await open(page, `&select=${ORIGIN}&dark=1`)
    await expect(page.getByTestId('layer-lanes')).toHaveScreenshot('layer-lanes-selection-dark.png')
  })

  test('visual: light canvas, heimdall-ux model with every predicate', async ({ page }) => {
    await open(page, '&data=ux&labels=all')
    await expect(page.getByTestId('layer-lanes')).toHaveScreenshot('layer-lanes-ux-all-light.png')
  })

  test('visual: vertical lanes, light canvas with a selection', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 1000 })
    await open(page, `&orientation=vertical&select=${ORIGIN}`)
    await expect(page.getByTestId('layer-lanes')).toHaveScreenshot('layer-lanes-vertical-light.png')
  })
})
