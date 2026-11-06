import { test, expect, type Page } from '@playwright/test'

// LayeredGraphExplorer on the layered-graph fixtures (src/test-pages/LayeredGraphExplorerTestPage.tsx).
// The views and chrome have their own specs; this checks the composition: shared state across view
// switches, the remembered 3D camera, the `controls` prop, camera controls, narrow stacking and the
// look of every view. Turntable off, fixed camera.

const BASE = 'http://localhost:5173/?example=layered-graph-explorer'
const ORIGIN = 'application.applicationcomponent'

test.use({ viewport: { width: 1440, height: 1000 } })

async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto(BASE + query)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('explorer')).toBeVisible()
  return errors
}

const explorer = (page: Page) => page.getByTestId('explorer')
const state = (page: Page) => page.getByTestId('explorer-state')
const status = (page: Page) => page.locator('.layered-graph-explorer__status')
const viewSwitcher = (page: Page) => page.getByRole('radiogroup', { name: 'View' })
const pickView = (page: Page, name: string) => viewSwitcher(page).getByRole('radio', { name, exact: true }).click()
const inspectorTitle = (page: Page) => page.locator('.reach-inspector__title')

test.describe('LayeredGraphExplorer', () => {
  test('renders the header, stack, link bar, inspector and status line', async ({ page }) => {
    const errors = await open(page, `&select=${ORIGIN}`)
    await expect(explorer(page)).toHaveAttribute('data-view', 'stack')
    await expect(viewSwitcher(page).getByRole('radio')).toHaveText(['3D stack', 'Lanes', 'Matrix', 'Hive'])
    await expect(page.getByRole('radiogroup', { name: 'Follow links from the selection' })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Camera preset' })).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Plane layout' })).toBeVisible()
    await expect(page.locator('.layer-stack')).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Predicate labels' })).toBeVisible()
    await expect(inspectorTitle(page)).toHaveText('ApplicationComponent')
    await expect(status(page)).toContainText('documentation robotics spec 0.10.0')
    await expect(status(page)).toContainText('36 nodes · 162 links · 22 cross-layer · 3 layers')
    await expect(status(page)).toContainText('3d stack · follow +1 layer')
    await expect(status(page)).toContainText('stack · yaw -36° pitch 29° zoom 1.00 · gap 170')
    expect(errors).toEqual([])
  })

  test('switching views keeps the selection and follow', async ({ page }) => {
    const errors = await open(page, `&select=${ORIGIN}`)
    await page.getByRole('radiogroup', { name: 'Follow links from the selection' }).getByRole('radio', { name: '+2 layers' }).click()
    await expect(state(page)).toHaveText(`view stack · selected ${ORIGIN} · follow 2`)

    for (const [label, view, selector] of [
      ['Lanes', 'lanes', '.graph-canvas'],
      ['Matrix', 'matrix', '.adjacency-matrix'],
      ['Hive', 'hive', '.hive-plot'],
      ['3D stack', 'stack', '.layer-stack'],
    ] as const) {
      await pickView(page, label)
      await expect(explorer(page)).toHaveAttribute('data-view', view)
      await expect(page.locator(selector).first()).toBeVisible()
      await expect(state(page)).toHaveText(`view ${view} · selected ${ORIGIN} · follow 2`)
      await expect(inspectorTitle(page)).toHaveText('ApplicationComponent')
      await expect(status(page)).toContainText('follow +2 layers')
    }

    // A selection made in one view carries to the next.
    await pickView(page, 'Hive')
    await page.locator('.reach-inspector').getByRole('button', { name: /^TechnologyService/ }).first().click()
    await expect(state(page)).toContainText('selected technology.technologyservice')
    await pickView(page, 'Matrix')
    await expect(inspectorTitle(page)).toHaveText('TechnologyService')
    expect(errors).toEqual([])
  })

  test('camera controls move the stack, and the camera is remembered across view switches', async ({ page }) => {
    await open(page)
    const presets = page.getByRole('radiogroup', { name: 'Camera preset' })
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect(status(page)).toContainText('yaw -36° pitch 29° zoom 1.20')
    await expect(presets.getByRole('radio', { checked: true })).toHaveCount(0)
    await expect(status(page)).not.toContainText('stack · yaw')

    await presets.getByRole('radio', { name: 'Top' }).click()
    await expect(status(page)).toContainText('top · yaw 0° pitch 86° zoom 1.05 · gap 170')
    await expect(page.locator('.layer-stack__title--rail')).toHaveCount(3)

    await page.getByRole('button', { name: 'Zoom out' }).click()
    await expect(status(page)).toContainText('yaw 0° pitch 86° zoom 0.88')

    const turntable = page.getByRole('button', { name: 'Turntable' })
    await turntable.click()
    await expect(turntable).toHaveAttribute('aria-pressed', 'true')
    await page.waitForTimeout(400)
    await turntable.click()
    await expect(turntable).toHaveAttribute('aria-pressed', 'false')
    await expect(status(page)).not.toContainText('yaw 0° pitch 86°')

    await presets.getByRole('radio', { name: 'Top' }).click()
    await expect(status(page)).toContainText('top · yaw 0° pitch 86° zoom 1.05')
    await pickView(page, 'Matrix')
    await expect(page.getByRole('radiogroup', { name: 'Camera preset' })).toHaveCount(0)
    await pickView(page, '3D stack')
    await expect(presets.getByRole('radio', { name: 'Top' })).toHaveAttribute('aria-checked', 'true')
    await expect(status(page)).toContainText('top · yaw 0° pitch 86° zoom 1.05')
    await expect(page.locator('.layer-stack__title--rail')).toHaveCount(3)
  })

  test('the node-label toggle drives the stack labels and only shows for stack and hive', async ({ page }) => {
    await open(page)
    const labels = page.getByRole('button', { name: 'Labels', exact: true })
    await expect(labels).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.layer-stack__label--hidden')).toHaveCount(0)
    await labels.click()
    await expect(labels).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('.layer-stack__label--hidden')).toHaveCount(36)
    await pickView(page, 'Matrix')
    await expect(page.getByRole('button', { name: 'Labels', exact: true })).toHaveCount(0)
    await pickView(page, 'Hive')
    await expect(page.getByRole('button', { name: 'Labels', exact: true })).toHaveAttribute('aria-pressed', 'false')
  })

  test('the controls prop hides chrome; a single view hides the switcher', async ({ page }) => {
    await open(page, '&hide=follow,camera,planeLayout,linkFilter,predicateLabels,inspector,layers,layerPairs,bridgeNodes,status')
    await expect(viewSwitcher(page)).toBeVisible()
    await expect(page.getByRole('radiogroup', { name: 'Follow links from the selection' })).toHaveCount(0)
    await expect(page.getByRole('radiogroup', { name: 'Camera preset' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Zoom in' })).toHaveCount(0)
    await expect(page.getByRole('radiogroup', { name: 'Plane layout' })).toHaveCount(0)
    await expect(page.locator('.layered-link-filter')).toHaveCount(0)
    await expect(page.getByRole('radiogroup', { name: 'Predicate labels' })).toHaveCount(0)
    await expect(page.locator('.layered-graph-explorer__aside')).toHaveCount(0)
    await expect(status(page)).toHaveCount(0)
    await expect(page.locator('.layer-stack')).toBeVisible()

    await open(page, '&views=matrix&hide=inspector')
    await expect(viewSwitcher(page)).toHaveCount(0)
    await expect(explorer(page)).toHaveAttribute('data-view', 'matrix')
    // Without the inspector the panel keeps the lists.
    await expect(page.locator('.reach-inspector')).toHaveCount(0)
    await expect(page.locator('.layered-graph-explorer__aside')).toContainText('Bridge nodes')
  })

  test('with external state, the graph prop drives every view', async ({ page }) => {
    const errors = await open(page, '&mode=external&view=hive')
    await expect(inspectorTitle(page)).toHaveCount(0)
    await page.getByRole('button', { name: /^BusinessProcess, Business layer, 6 cross-layer links/ }).click()
    await expect(state(page)).toContainText('selected business.businessprocess')
    await expect(inspectorTitle(page)).toHaveText('BusinessProcess')
    await pickView(page, 'Lanes')
    await expect(state(page)).toContainText('selected business.businessprocess')
    await expect(page.locator('.graph-canvas').getByRole('button', { name: 'BusinessProcess, Business layer, selected' })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('below the stacking width the inspector moves under the scene', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 1000 })
    await open(page, `&select=${ORIGIN}`)
    await expect(explorer(page)).toHaveClass(/layered-graph-explorer--narrow/)
    const main = await page.locator('.layered-graph-explorer__main').boundingBox()
    const aside = await page.locator('.layered-graph-explorer__aside').boundingBox()
    expect(main && aside).toBeTruthy()
    expect(aside!.y).toBeGreaterThanOrEqual(main!.y + main!.height - 1)
    expect(Math.abs(aside!.width - main!.width)).toBeLessThan(2)
  })

  test.describe('screenshots', () => {
    for (const view of ['stack', 'lanes', 'matrix', 'hive'] as const) {
      test(`${view} with a selection, dark`, async ({ page }) => {
        await open(page, `&view=${view}&select=${ORIGIN}&dark=1`)
        await page.waitForTimeout(600)
        await expect(explorer(page)).toHaveScreenshot(`layered-graph-explorer-${view}-dark.png`)
      })
    }

    test('stack with a selection, light', async ({ page }) => {
      await open(page, `&view=stack&select=${ORIGIN}`)
      await page.waitForTimeout(600)
      await expect(explorer(page)).toHaveScreenshot('layered-graph-explorer-stack-light.png')
    })

    test('narrow width stacks the inspector, light', async ({ page }) => {
      await page.setViewportSize({ width: 760, height: 1000 })
      await open(page, `&view=hive&select=${ORIGIN}`)
      await page.waitForTimeout(600)
      await expect(explorer(page)).toHaveScreenshot('layered-graph-explorer-narrow-light.png')
    })
  })
})
