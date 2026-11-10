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
/** Screen distance between the centers of the first two planes, px. */
async function planeSpacing(page: Page) {
  const fills = page.locator('.layer-stack__plane-fill')
  const [a, b] = [await fills.nth(0).boundingBox(), await fills.nth(1).boundingBox()]
  return Math.abs(a!.y + a!.height / 2 - (b!.y + b!.height / 2))
}
/** The plane spacing once the camera has stopped moving (two reads 150 ms apart agree). */
async function settledSpacing(page: Page) {
  let prev = await planeSpacing(page)
  for (;;) {
    await page.waitForTimeout(150)
    const cur = await planeSpacing(page)
    if (Math.abs(cur - prev) < 0.01) return cur
    prev = cur
  }
}

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

  test('the snapshot round-trips the whole explorer through the URL', async ({ page }) => {
    const errors = await open(page, '&sync=1')
    // No onSnapshotChange on mount.
    await page.waitForTimeout(300)
    expect(new URL(page.url()).searchParams.get('state')).toBeNull()
    // Change the selection, follow, a filter, node labels, predicate labels, plane layout, the camera and the view.
    await page.getByRole('button', { name: /^BusinessProcess, Business layer, 6 cross-layer links/ }).click()
    await page.getByRole('radiogroup', { name: 'Follow links from the selection' }).getByRole('radio', { name: '+2 layers' }).click()
    await page.locator('.layered-link-filter [data-category="structural"]').click()
    await page.getByRole('button', { name: 'Labels', exact: true }).click()
    await page.getByRole('radiogroup', { name: 'Predicate labels' }).getByRole('radio', { name: 'All' }).click()
    await page.getByRole('radiogroup', { name: 'Plane layout' }).getByRole('radio', { name: 'Coupled' }).click()
    await page.getByRole('radiogroup', { name: 'Camera preset' }).getByRole('radio', { name: 'Exploded' }).click()
    // A preset reports its destination at once: the first URL write already has its camera and gap.
    await expect.poll(() => new URL(page.url()).searchParams.get('state')).toContain('"preset":"exploded"')
    expect(JSON.parse(new URL(page.url()).searchParams.get('state')!).stack).toMatchObject({ layerGap: 300, camera: { zoom: 0.86 } })
    await expect(status(page)).toContainText('exploded · yaw -29° pitch 19° zoom 0.86 · gap 300')
    await pickView(page, 'Matrix')
    await expect.poll(() => new URL(page.url()).searchParams.get('state')).toContain('"view":"matrix"')
    const snapshot = JSON.parse(new URL(page.url()).searchParams.get('state')!)
    expect(snapshot).toMatchObject({
      view: 'matrix',
      selectedId: 'business.businessprocess',
      follow: 2,
      nodeLabels: false,
      predicateLabels: 'all',
      planeLayout: 'coupled',
      filters: { categories: { structural: false } },
      stack: { preset: 'exploded', layerGap: 300 },
    })

    // A fresh load from that URL comes back in the same state.
    await page.goto(page.url())
    await page.waitForLoadState('networkidle')
    await expect(explorer(page)).toHaveAttribute('data-view', 'matrix')
    // The explorer's own state, not the test page's.
    await expect(status(page)).toContainText('matrix · follow +2 layers')
    await expect(inspectorTitle(page)).toHaveText('BusinessProcess')
    await expect(page.locator('.layered-link-filter [data-category="structural"]')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('radiogroup', { name: 'Predicate labels' }).getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true')
    await pickView(page, '3D stack')
    await expect(page.getByRole('radiogroup', { name: 'Plane layout' }).getByRole('radio', { name: 'Coupled' })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('radiogroup', { name: 'Camera preset' }).getByRole('radio', { name: 'Exploded' })).toHaveAttribute('aria-checked', 'true')
    await expect(status(page)).toContainText('exploded · yaw -29° pitch 19° zoom 0.86 · gap 300')
    await expect(page.getByRole('button', { name: 'Labels', exact: true })).toHaveAttribute('aria-pressed', 'false')
    expect(errors).toEqual([])
  })

  test('layer focus round-trips through the URL', async ({ page }) => {
    const errors = await open(page, '&sync=1&view=matrix')
    const business = page.locator('.layered-graph-explorer__aside').getByRole('button', { name: /^Business layer/ })
    await business.click()
    await expect(business).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => new URL(page.url()).searchParams.get('state')).toContain('"focusedLayerId":"business"')
    await page.goto(page.url())
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.layered-graph-explorer__aside').getByRole('button', { name: /^Business layer/ })).toHaveAttribute('aria-pressed', 'true')
    expect(errors).toEqual([])
  })

  test('a malformed snapshot in the URL loads with sane defaults', async ({ page }) => {
    const bad = {
      view: 'bogus',
      follow: 'two',
      nodeLabels: 'yes',
      filters: { categories: { structural: false } },
      predicateLabels: 'loud',
      selectedId: 42,
      stack: { preset: 'bogus', camera: { zoom: null, yaw: 'x', pitch: 99 }, layerGap: -1 },
    }
    const errors = await open(page, `&sync=1&state=${encodeURIComponent(JSON.stringify(bad))}`)
    await expect(explorer(page)).toHaveAttribute('data-view', 'stack')
    await expect(status(page)).toContainText('3d stack · follow +1 layer')
    // The partial filters are completed: structural off, everything else as default.
    await expect(page.locator('.layered-link-filter [data-category="structural"]')).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('button', { name: 'Intra-layer links' })).toHaveAttribute('aria-pressed', 'true')
    // The bogus preset and non-finite fields are dropped; the hand-set pitch is clamped as the
    // stack draws it, and clears the preset; the bad gap falls back to the default.
    await expect(status(page)).toContainText('yaw -36° pitch 87° zoom 1.00 · gap 170')
    await expect(status(page)).not.toContainText('stack · yaw')
    await expect(page.getByRole('radiogroup', { name: 'Camera preset' }).getByRole('radio', { checked: true })).toHaveCount(0)
    await expect(page.locator('.layer-stack')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('restore keeps the stack when the camera is unchanged, and wins over a running turntable', async ({ page }) => {
    const errors = await open(page, '&sync=1')
    const presets = page.getByRole('radiogroup', { name: 'Camera preset' })
    await presets.getByRole('radio', { name: 'Top' }).click()
    await expect(status(page)).toContainText('top · yaw 0° pitch 86° zoom 1.05 · gap 170')
    await page.getByRole('button', { name: 'Save snapshot' }).click()
    await expect(page.getByTestId('saved-snapshot')).toHaveText('stack · top · gap 170')

    // Same camera: the stack element survives the restore (no remount).
    await page.evaluate(() => { (document.querySelector('.layer-stack') as HTMLElement & { __mark?: number }).__mark = 1 })
    await page.getByRole('button', { name: 'Restore snapshot' }).click()
    expect(await page.evaluate(() => (document.querySelector('.layer-stack') as HTMLElement & { __mark?: number }).__mark)).toBe(1)

    // With the turntable running, the restored camera holds and the turntable stops.
    const turntable = page.getByRole('button', { name: 'Turntable' })
    await turntable.click()
    await expect(turntable).toHaveAttribute('aria-pressed', 'true')
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: 'Restore snapshot' }).click()
    await expect(turntable).toHaveAttribute('aria-pressed', 'false')
    await expect(presets.getByRole('radio', { name: 'Top' })).toHaveAttribute('aria-checked', 'true')
    await page.waitForTimeout(300)
    await expect(status(page)).toContainText('top · yaw 0° pitch 86° zoom 1.05 · gap 170')
    expect(errors).toEqual([])
  })

  test('each preset click reports exactly one snapshot, already settled', async ({ page }) => {
    const errors = await open(page, '&sync=1')
    const count = page.getByTestId('snapshot-count')
    const presets = page.getByRole('radiogroup', { name: 'Camera preset' })
    await expect(count).toHaveText('snapshots 0')
    for (const [name, n] of [['Exploded', 1], ['Top', 2], ['Profile', 3]] as const) {
      await presets.getByRole('radio', { name }).click()
      await expect(count).toHaveText(`snapshots ${n}`)
      await page.waitForTimeout(1000) // past the tween: its end reports nothing new
      await expect(count).toHaveText(`snapshots ${n}`)
    }
    expect(JSON.parse(new URL(page.url()).searchParams.get('state')!).stack).toMatchObject({ preset: 'profile', layerGap: 210 })
    // Restoring the URL's own snapshot right after a click (the router pattern) keeps the stack.
    await presets.getByRole('radio', { name: 'Exploded' }).click()
    await page.evaluate(() => { (document.querySelector('.layer-stack') as HTMLElement & { __mark?: number }).__mark = 1 })
    await page.getByRole('button', { name: 'Save snapshot' }).click()
    await page.getByRole('button', { name: 'Restore snapshot' }).click()
    expect(await page.evaluate(() => (document.querySelector('.layer-stack') as HTMLElement & { __mark?: number }).__mark)).toBe(1)
    await expect(status(page)).toContainText('exploded · yaw -29° pitch 19° zoom 0.86 · gap 300')
    expect(errors).toEqual([])
  })

  test('a stackProps gap override is what the snapshot reports, and round-trips', async ({ page }) => {
    const errors = await open(page, '&sync=1&gap=240')
    // The stack draws gap 240, so no preset is active.
    await expect(status(page)).toContainText('yaw -36° pitch 29° zoom 1.00 · gap 240')
    await expect(page.getByRole('radiogroup', { name: 'Camera preset' }).getByRole('radio', { checked: true })).toHaveCount(0)
    await pickView(page, 'Matrix')
    await expect.poll(() => new URL(page.url()).searchParams.get('state')).toContain('"view":"matrix"')
    expect(JSON.parse(new URL(page.url()).searchParams.get('state')!).stack).toMatchObject({ preset: null, layerGap: 240 })
    // Reload without the override: the URL alone brings gap 240 back.
    const url = new URL(page.url())
    url.searchParams.delete('gap')
    await page.goto(url.toString())
    await page.waitForLoadState('networkidle')
    await pickView(page, '3D stack')
    await expect(status(page)).toContainText('gap 240')
    expect(errors).toEqual([])
  })

  test('a preset with other camera fields restores the camera and drops the preset', async ({ page }) => {
    const state = { stack: { preset: 'exploded', camera: { yaw: 1 } } }
    const errors = await open(page, `&sync=1&state=${encodeURIComponent(JSON.stringify(state))}`)
    await expect(status(page)).toContainText('yaw 57° pitch 19° zoom 0.86 · gap 300')
    await expect(status(page)).not.toContainText('exploded ·')
    await expect(page.getByRole('radiogroup', { name: 'Camera preset' }).getByRole('radio', { checked: true })).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('the handle saves a snapshot, with the live camera and gap, and restores it', async ({ page }) => {
    const errors = await open(page, '&sync=1')
    const presets = page.getByRole('radiogroup', { name: 'Camera preset' })
    await presets.getByRole('radio', { name: 'Exploded' }).click()
    await expect(status(page)).toContainText('exploded · yaw -29° pitch 19° zoom 0.86 · gap 300')
    const explodedSpacing = await settledSpacing(page)
    await page.getByRole('button', { name: 'Save snapshot' }).click()
    await expect(page.getByTestId('saved-snapshot')).toHaveText('stack · exploded · gap 300')

    await presets.getByRole('radio', { name: 'Top' }).click()
    await expect(status(page)).toContainText('top · yaw 0° pitch 86° zoom 1.05 · gap 170')
    expect(Math.abs((await settledSpacing(page)) - explodedSpacing)).toBeGreaterThan(5)
    await page.getByRole('button', { name: /^BusinessProcess, Business layer, 6 cross-layer links/ }).click()
    await pickView(page, 'Hive')
    await expect(state(page)).toHaveText('view hive · selected business.businessprocess · follow 1')

    await page.getByRole('button', { name: 'Restore snapshot' }).click()
    await expect(explorer(page)).toHaveAttribute('data-view', 'stack')
    await expect(state(page)).toHaveText('view stack · no selection · follow 1')
    await expect(presets.getByRole('radio', { name: 'Exploded' })).toHaveAttribute('aria-checked', 'true')
    await expect(status(page)).toContainText('exploded · yaw -29° pitch 19° zoom 0.86 · gap 300')
    // The stack draws the restored camera and gap: the planes sit where they did when saved.
    await expect.poll(() => planeSpacing(page)).toBeCloseTo(explodedSpacing, 0)
    await expect(page.locator('.layer-stack__title--rail')).toHaveCount(0)
    expect(errors).toEqual([])
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
