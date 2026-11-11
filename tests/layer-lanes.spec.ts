import { test, expect, type Page } from '@playwright/test'

// GraphCanvas layout="layer-lanes" on the layered-graph fixtures (src/test-pages/LayerLanesTestPage.tsx).
// Lane geometry is unit-tested in src/utils/__tests__/laneLayout.test.ts and reach in
// src/utils/__tests__/layered.test.ts; this checks the rendering, the shared-state selection
// wiring and both themes.

const BASE = '/?example=layer-lanes'
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

    await page.getByRole('button', { name: 'Node labels' }).click()
    await expect(chips).toHaveCount(0)
    await expect(tags).toHaveCount(0)
    await expect(page.locator('.graph-nodes .graph-lane-node__label')).toHaveCount(36)
    // fitView fits again for the new lane sizes: the lanes sit centred in the canvas.
    const canvas = (await page.getByTestId('layer-lanes').boundingBox())!
    await expect.poll(async () => {
      const lanes = (await page.locator('.graph-lanes').boundingBox())!
      return Math.round(Math.abs(lanes.y + lanes.height / 2 - (canvas.y + canvas.height / 2)))
    }).toBeLessThan(4)
    expect(errors).toEqual([])
  })

  test('reached: dragging the selection carries its tag along', async ({ page }) => {
    await open(page, `&nodeLabels=off&select=${ORIGIN}`)
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
  })

  test('dragging a node holds the pill placement and moves pills along their links; release places again', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    const pills = page.locator('.graph-lane-pill')
    await expect(pills.first()).toBeVisible()
    const snap = async () =>
      Object.fromEntries(await pills.evaluateAll((els) => els.map((e) => [e.getAttribute('data-link-id'), { t: e.getAttribute('data-t'), at: e.getAttribute('transform') }])))
    const placement = () => page.locator('.graph-lane-pills').getAttribute('data-placement')
    const p0 = await placement()
    const s0 = await snap()
    const node = (await page.locator(`[data-node-id="${ORIGIN}"]`).boundingBox())!
    await page.mouse.move(node.x + node.width / 2, node.y + node.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 6; i++) await page.mouse.move(node.x + node.width / 2 + i * 20, node.y + node.height / 2 + i * 8)
    // Mid-drag: no new placement; the same pills at the same t, and some have moved with the node.
    expect(await placement()).toBe(p0)
    const s1 = await snap()
    expect(Object.keys(s1).sort()).toEqual(Object.keys(s0).sort())
    for (const id of Object.keys(s0)) expect(s1[id].t).toBe(s0[id].t)
    expect(Object.keys(s1).some((id) => s1[id].at !== s0[id].at)).toBe(true)
    await page.mouse.up()
    await expect.poll(placement).not.toBe(p0)
    await expect(pills.first()).toBeVisible()
  })

  test('a cancelled drag releases the pill hold', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    const placement = () => page.locator('.graph-lane-pills').getAttribute('data-placement')
    const g = page.locator(`[data-node-id="${ORIGIN}"]`)
    const node = (await g.boundingBox())!
    await page.mouse.move(node.x + node.width / 2, node.y + node.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 4; i++) await page.mouse.move(node.x + node.width / 2 + i * 15, node.y + node.height / 2)
    const held = await placement()
    await g.dispatchEvent('pointercancel', { pointerId: 1, bubbles: true })
    await expect.poll(placement).not.toBe(held)
    await page.mouse.up()
  })

  test('hover, pan and zoom do not re-run the pill placement', async ({ page }) => {
    await open(page, `&nodeLabels=off&select=${ORIGIN}`)
    const placement = () => page.locator('.graph-lane-pills').getAttribute('data-placement')
    const p0 = await placement()
    await page.locator('.graph-nodes').getByRole('button', { name: 'Node, Technology layer' }).hover()
    await expect(page.locator('.graph-lane-tag[data-tag-for="technology.node"]')).toBeVisible()
    await page.locator('.graph-nodes').getByRole('button', { name: 'DataObject, Application layer' }).hover()
    const box = (await page.getByTestId('layer-lanes').boundingBox())!
    await page.mouse.move(box.x + 12, box.y + box.height - 12)
    await page.mouse.down()
    await page.mouse.move(box.x + 80, box.y + box.height - 40, { steps: 5 })
    await page.mouse.up()
    await page.mouse.wheel(0, -200)
    await page.waitForTimeout(200)
    expect(await placement()).toBe(p0)
  })

  test('a custom renderNode is untouched by nodeLabels reached', async ({ page }) => {
    const errors = await open(page, `&nodeLabels=off&render=1&select=${ORIGIN}`)
    await expect(page.locator('.graph-nodes .custom-lane-node')).toHaveCount(36)
    await expect(page.locator('.graph-lane-node--compact')).toHaveCount(0)
    await expect(page.locator('.graph-lane-tag')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  // Links whose drawn path runs past the ends of the lanes (left/right, or top/bottom when
  // vertical): gutter routes. Intra-layer arcs bulge the other way, so they never count.
  const outsideLanes = (page: Page, vertical = false) =>
    page.evaluate((vertical) => {
      const lanes = (document.querySelector('.graph-lanes') as SVGGraphicsElement).getBBox()
      return [...document.querySelectorAll<SVGPathElement>('.graph-lane-link__line')]
        .filter((p) => {
          const b = p.getBBox()
          return vertical ? b.y < lanes.y - 1 || b.y + b.height > lanes.y + lanes.height + 1 : b.x < lanes.x - 1 || b.x + b.width > lanes.x + lanes.width + 1
        })
        .map((p) => p.closest('[data-link-id]')!.getAttribute('data-link-id')!)
        .sort()
    }, vertical)
  const SKIP_ORIGIN = 'technology.technologyservice'

  test('skipLayerRouting gutter routes the links that skip a lane outside the lanes, with pills and arrows', async ({ page }) => {
    const errors = await open(page, `&select=${SKIP_ORIGIN}`)
    expect(await outsideLanes(page)).toEqual([])
    await open(page, `&gutter=1&select=${SKIP_ORIGIN}`)
    const routed = await outsideLanes(page)
    expect(routed).toHaveLength(7)
    await expect(page.locator('.graph-lane-link')).toHaveCount(162)
    // The selection's routed links carry arrowheads, and pills sit on some of them.
    const reached = routed.filter((id) => id.startsWith(SKIP_ORIGIN))
    expect(reached.length).toBeGreaterThan(0)
    for (const id of reached) await expect(page.locator(`.graph-lane-link[data-link-id="${id}"] .graph-lane-link__arrow`)).toHaveCount(1)
    const pills = await page.locator('.graph-lane-pill').evaluateAll((els) => els.map((e) => e.getAttribute('data-link-id')))
    expect(pills.some((id) => reached.includes(id!))).toBe(true)
    // Vertical lanes route them too.
    await open(page, `&orientation=vertical&select=${SKIP_ORIGIN}`)
    expect(await outsideLanes(page, true)).toEqual([])
    await open(page, `&gutter=1&orientation=vertical&select=${SKIP_ORIGIN}`)
    expect(await outsideLanes(page, true)).toHaveLength(7)
    expect(errors).toEqual([])
  })

  test('gutter mode: a category filter leaves the lanes where they are', async ({ page }) => {
    await open(page, `&gutter=1&categoryToggle=1&select=${SKIP_ORIGIN}`)
    const bands = () => page.locator('.graph-lane__band').evaluateAll((els) => els.map((e) => ['x', 'y', 'width', 'height'].map((k) => e.getAttribute(k)).join(',')))
    const before = await bands()
    const links = await page.locator('.graph-lane-link').count()
    await page.getByRole('button', { name: 'Structural links' }).click()
    await expect(page.locator('.graph-lane-link')).not.toHaveCount(links)
    expect(await bands()).toEqual(before)
    await page.getByRole('button', { name: 'Structural links' }).click()
    await expect(page.locator('.graph-lane-link')).toHaveCount(links)
    expect(await bands()).toEqual(before)
  })

  test('gutter routes follow a dragged node, with the pill placement held', async ({ page }) => {
    await open(page, `&gutter=1&select=${SKIP_ORIGIN}`)
    const placement = () => page.locator('.graph-lane-pills').getAttribute('data-placement')
    const all = await outsideLanes(page)
    const routed = all.filter((id) => id.startsWith(SKIP_ORIGIN))
    const other = all.find((id) => !id.includes(SKIP_ORIGIN))!
    const line = page.locator(`.graph-lane-link[data-link-id="${routed[0]}"] .graph-lane-link__line`)
    const otherLine = page.locator(`.graph-lane-link[data-link-id="${other}"] .graph-lane-link__line`)
    const d0 = await line.getAttribute('d')
    const o0 = await otherLine.getAttribute('d')
    const p0 = await placement()
    const node = (await page.locator(`[data-node-id="${SKIP_ORIGIN}"]`).boundingBox())!
    await page.mouse.move(node.x + node.width / 2, node.y + node.height / 2)
    await page.mouse.down()
    for (let i = 1; i <= 5; i++) await page.mouse.move(node.x + node.width / 2 + i * 15, node.y + node.height / 2 + i * 2)
    // The dragged node's routes follow it; every other route keeps its tracks.
    expect(await line.getAttribute('d')).not.toBe(d0)
    expect(await otherLine.getAttribute('d')).toBe(o0)
    expect(await placement()).toBe(p0)
    await page.mouse.up()
    await expect.poll(placement).not.toBe(p0)
  })

  test('visual: gutter routes with a selection, light canvas', async ({ page }) => {
    await open(page, `&gutter=1&select=${SKIP_ORIGIN}`)
    await expect(page.getByTestId('layer-lanes')).toHaveScreenshot('layer-lanes-gutter-light.png')
  })

  test('visual: vertical gutter routes with reached chips, dark canvas', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 1000 })
    await open(page, `&gutter=1&orientation=vertical&nodeLabels=off&select=${SKIP_ORIGIN}&dark=1`)
    await expect(page.getByTestId('layer-lanes')).toHaveScreenshot('layer-lanes-gutter-vertical-dark.png')
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

  // Keyboard: the focused lane node, and the nodes of a layer in row order (as drawn).
  const focused = (page: Page) => page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    return el?.classList.contains('graph-lane-node') ? el.closest('[data-node-id]')!.getAttribute('data-node-id') : null
  })
  const laneOrder = (page: Page, layer: string, vertical = false) =>
    page.locator('.graph-nodes [data-node-id]').evaluateAll((els, [layer, vertical]) => {
      const rows = els
        .filter((g) => g.getAttribute('data-node-id')!.startsWith(`${layer}.`))
        .map((g) => {
          const r = g.querySelector('.graph-lane-node')!.getBoundingClientRect()
          return { id: g.getAttribute('data-node-id')!, x: r.x + r.width / 2, y: r.y + r.height / 2 }
        })
      return rows
        .sort((a, b) => (vertical ? Math.round(a.x) - Math.round(b.x) || a.y - b.y : Math.round(a.y) - Math.round(b.y) || a.x - b.x))
        .map((r) => r.id)
    }, [layer, vertical] as const)
  const linkedTo = (page: Page, a: string, b: string) =>
    page.locator('.graph-lane-link').evaluateAll((els, [a, b]) => els.some((g) => {
      const id = g.getAttribute('data-link-id')!
      return id.includes(a) && id.includes(b)
    }), [a, b] as const)
  const focusNode = (page: Page, id: string) => page.locator(`.graph-nodes [data-node-id="${id}"] .graph-lane-node`).focus()

  test('keyboard: one Tab stop for the lane nodes, entering at the first node or the selection', async ({ page }) => {
    await open(page)
    const order = await laneOrder(page, 'business')
    await expect(page.locator('.graph-nodes .graph-lane-node[tabindex="0"]')).toHaveCount(1)
    await page.getByTestId('layer-lanes').focus()
    await page.keyboard.press('Tab')
    expect(await focused(page)).toBe(order[0])
    await page.keyboard.press('ArrowRight')
    expect(await focused(page)).toBe(order[1])
    await expect(page.locator('.graph-nodes .graph-lane-node[tabindex="0"]')).toHaveCount(1)
    await page.keyboard.press('Tab')
    expect(await focused(page)).toBeNull() // left the lane nodes in one step
    await page.keyboard.press('Shift+Tab')
    expect(await focused(page)).toBe(order[1]) // back to where it left
    // With a selection, Tab enters at it.
    await open(page, `&select=${ORIGIN}`)
    await page.getByTestId('layer-lanes').focus()
    await page.keyboard.press('Tab')
    expect(await focused(page)).toBe(ORIGIN)
    // The hint describes the keys.
    const hint = await page.locator(`.graph-nodes [data-node-id="${ORIGIN}"] .graph-lane-node`).getAttribute('aria-describedby')
    await expect(page.locator(`[id="${hint!.split(' ').pop()}"]`)).toContainText('Up and Down arrows move to the linked node in the next lane')
  })

  test('keyboard: Left/Right along a lane, Home/End to its ends, Up/Down to a linked node in the next lane', async ({ page }) => {
    await open(page)
    const app = await laneOrder(page, 'application')
    const at = app.indexOf(ORIGIN)
    await focusNode(page, ORIGIN)
    await page.keyboard.press('ArrowRight')
    expect(await focused(page)).toBe(app[at + 1])
    await page.keyboard.press('ArrowLeft')
    expect(await focused(page)).toBe(ORIGIN)
    await page.keyboard.press('End')
    expect(await focused(page)).toBe(app[app.length - 1])
    await page.keyboard.press('Home')
    expect(await focused(page)).toBe(app[0])
    await focusNode(page, ORIGIN)
    await page.keyboard.press('ArrowDown')
    const down = (await focused(page))!
    expect(down.startsWith('technology.')).toBe(true)
    expect(await linkedTo(page, ORIGIN, down)).toBe(true)
    await page.keyboard.press('ArrowUp')
    const up = (await focused(page))!
    expect(up.startsWith('application.')).toBe(true)
    expect(await linkedTo(page, down, up)).toBe(true)
    await page.keyboard.press('ArrowUp')
    expect((await focused(page))!.startsWith('business.')).toBe(true)
    // At the top lane, Up stays put (and doesn't pan the canvas).
    const top = await focused(page)
    const before = await page.locator('.graph-svg > g').first().getAttribute('transform')
    await page.keyboard.press('ArrowUp')
    expect(await focused(page)).toBe(top)
    expect(await page.locator('.graph-svg > g').first().getAttribute('transform')).toBe(before)
    // Enter selects.
    await page.keyboard.press('Enter')
    await expect(status(page)).toContainText(`selected ${top}`)
  })

  test('keyboard: vertical lanes swap the axes (Left/Right between lanes, Up/Down along one)', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 1000 })
    await open(page, '&orientation=vertical')
    const app = await laneOrder(page, 'application', true)
    await focusNode(page, ORIGIN)
    await page.keyboard.press('ArrowDown')
    expect(await focused(page)).toBe(app[app.indexOf(ORIGIN) + 1])
    await page.keyboard.press('ArrowUp')
    expect(await focused(page)).toBe(ORIGIN)
    await page.keyboard.press('ArrowRight')
    const right = (await focused(page))!
    expect(right.startsWith('technology.')).toBe(true)
    expect(await linkedTo(page, ORIGIN, right)).toBe(true)
    await page.keyboard.press('ArrowLeft')
    expect((await focused(page))!.startsWith('application.')).toBe(true)
    await expect(page.locator('[id$="-lane-keys"]')).toContainText('Left and Right arrows move to the linked node in the next lane')
  })

  test("keyboard: hiding the focused node's layer moves focus to a neighbour", async ({ page }) => {
    await open(page, '&layerToggle=1')
    await focusNode(page, 'technology.node')
    expect(await focused(page)).toBe('technology.node')
    await page.getByRole('button', { name: 'Toggle technology' }).click()
    await expect(page.locator('.graph-lane')).toHaveCount(2)
    await expect.poll(() => focused(page)).toMatch(/^application\./)
  })

  test('keyboard: works with reached chips (focus tag follows) and gutter routing', async ({ page }) => {
    await open(page, '&nodeLabels=off&gutter=1')
    const app = await laneOrder(page, 'application')
    await focusNode(page, app[0])
    await page.keyboard.press('ArrowRight')
    expect(await focused(page)).toBe(app[1])
    await expect(page.locator(`.graph-lane-tag[data-tag-for="${app[1]}"]`)).toBeVisible()
    await page.keyboard.press('ArrowDown')
    expect((await focused(page))!.startsWith('technology.')).toBe(true)
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
