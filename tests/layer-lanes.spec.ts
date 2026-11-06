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
