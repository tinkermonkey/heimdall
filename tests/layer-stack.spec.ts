import { test, expect, type Page } from '@playwright/test'

// LayerStack on the layered-graph fixtures (src/test-pages/LayerStackTestPage.tsx). Projection and
// tween math are unit-tested in src/utils/__tests__/layerStackProjection.test.ts; this checks the
// rendering, the interactions and the two themes. The turntable is off and the camera fixed.

const BASE = 'http://localhost:5173/?example=layer-stack'
const ORIGIN = 'application.applicationcomponent'

test.use({ viewport: { width: 1280, height: 1000 } })

async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto(BASE + query)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('layer-stack')).toBeVisible()
  return errors
}

const selection = (page: Page) => page.getByTestId('layer-stack-selection')
const cameraStatus = (page: Page) => page.getByTestId('layer-stack-camera')

test.describe('LayerStack', () => {
  test('draws a plane per layer, a disc and a label button per node', async ({ page }) => {
    const errors = await open(page)
    await expect(page.getByTestId('layer-stack-caption')).toContainText('36 nodes · 162 links · 22 cross-layer')
    await expect(page.locator('.layer-stack__plane')).toHaveCount(3)
    await expect(page.locator('.layer-stack__node')).toHaveCount(36)
    await expect(page.locator('button.layer-stack__label')).toHaveCount(36)
    await expect(page.locator('button.layer-stack__title')).toHaveCount(3)
    await expect(page.locator('.layer-stack__link')).toHaveCount(162)
    await expect(page.locator('.layer-stack__drill')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('clicking a node selects it, adds the drill-through column, and clicking again clears', async ({ page }) => {
    await open(page)
    await page.locator(`.layer-stack__node[data-node-id="${ORIGIN}"] .layer-stack__disc`).click({ force: true })
    await expect(selection(page)).toHaveText(`selected ${ORIGIN} · reach 13`)
    await expect(page.locator('.layer-stack__drill-ring')).toHaveCount(2)
    await expect(page.locator('.layer-stack__pill').first()).toBeVisible()
    await page.getByRole('button', { name: 'ApplicationComponent, Application layer, selected' }).click()
    await expect(selection(page)).toHaveText('no selection')
  })

  test('the plane title focuses its layer; clicking again exits', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: /^Focus Technology layer/ }).click()
    await expect(page.getByTestId('layer-stack-focus')).toHaveText('focus technology')
    await expect(page.getByTestId('layer-stack')).toHaveAttribute('data-focused-layer', 'technology')
    await expect(cameraStatus(page)).toContainText('focus · ')
    await page.getByRole('button', { name: /^Exit focus on Technology layer/ }).click()
    await expect(page.getByTestId('layer-stack-focus')).toHaveText('no focus')
  })

  test('a camera preset animates to it; ref methods move the camera', async ({ page }) => {
    await open(page)
    await page.getByRole('radio', { name: 'Top' }).or(page.getByRole('button', { name: 'Top', exact: true })).first().click()
    await expect(cameraStatus(page)).toHaveText('preset · yaw 0° pitch 86° zoom 1.05')
    await expect(page.getByTestId('layer-stack')).toHaveAttribute('data-preset', 'top')
    await expect(page.locator('.layer-stack__title--rail')).toHaveCount(3)
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect(cameraStatus(page)).toHaveText('zoom · yaw 0° pitch 86° zoom 1.26')
    await expect(page.getByTestId('layer-stack-preset')).toHaveText('preset none')
    await page.getByRole('button', { name: 'Fit', exact: true }).click()
    await expect(cameraStatus(page)).toContainText('fit · yaw 0° pitch 86°')
  })

  test('dragging orbits without selecting', async ({ page }) => {
    await open(page)
    const box = (await page.getByTestId('layer-stack').boundingBox())!
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.9)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.85, { steps: 8 })
    await page.mouse.up()
    await expect(cameraStatus(page)).toContainText('orbit · ')
    await expect(page.getByTestId('layer-stack-preset')).toHaveText('preset none')
    await expect(selection(page)).toHaveText('no selection')
  })

  test('keyboard: arrows move between nodes and layers, Enter selects, Escape clears', async ({ page }) => {
    await open(page)
    const first = page.locator('button.layer-stack__label[tabindex="0"]')
    await first.focus()
    const startId = await first.getAttribute('data-node-id')
    await page.keyboard.press('ArrowRight')
    const next = await page.evaluate(() => document.activeElement?.getAttribute('data-node-id'))
    expect(next).not.toBe(startId)
    expect(next?.split('.')[0]).toBe(startId?.split('.')[0])
    await page.keyboard.press('ArrowDown')
    const below = await page.evaluate(() => document.activeElement?.getAttribute('data-node-id'))
    expect(below?.startsWith('application.')).toBe(true)
    await page.keyboard.press('Enter')
    await expect(selection(page)).toContainText(`selected ${below}`)
    await page.keyboard.press('Escape')
    await expect(selection(page)).toHaveText('no selection')
  })

  test.describe('visual', () => {
    test.use({ reducedMotion: 'reduce' })
    for (const theme of ['dark', 'light'] as const) {
      const dark = theme === 'dark' ? '&dark=1' : ''
      test(`stack preset with a followed selection, ${theme}`, async ({ page }) => {
        await open(page, `&select=${ORIGIN}${dark}`)
        await expect(page.getByTestId('layer-stack')).toHaveScreenshot(`layer-stack-selection-${theme}.png`)
      })
      test(`top preset, ${theme}`, async ({ page }) => {
        await open(page, `&preset=top${dark}`)
        await expect(page.getByTestId('layer-stack')).toHaveScreenshot(`layer-stack-top-${theme}.png`)
      })
      test(`focused layer, ${theme}`, async ({ page }) => {
        await open(page, `&focus=application${dark}`)
        await expect(page.getByTestId('layer-stack')).toHaveScreenshot(`layer-stack-focus-${theme}.png`)
      })
    }
  })
})
