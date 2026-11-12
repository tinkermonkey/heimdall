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

/** A short mouse orbit from the lower right of the stage (clear of nodes and titles). */
async function orbit(page: Page) {
  const box = (await page.getByTestId('layer-stack').boundingBox())!
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.9)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.85, { steps: 8 })
  await page.mouse.up()
}

/**
 * Ratio of the screen gaps between the three plane centres, top pair over bottom pair: near 1 for
 * evenly spaced planes, far from it while a layer focus pushes the planes apart.
 */
async function planeSpacing(page: Page): Promise<number> {
  const ys = await page.evaluate(() =>
    ['business', 'application', 'technology'].map((id) => {
      const pts = document.querySelector(`.layer-stack__plane[data-layer-id="${id}"] polygon`)!.getAttribute('points')!
      const nums = pts.trim().split(/[\s,]+/).map(Number)
      let sum = 0
      for (let i = 1; i < nums.length; i += 2) sum += nums[i]
      return sum / (nums.length / 2)
    }),
  )
  return (ys[1] - ys[0]) / (ys[2] - ys[1])
}

/**
 * Links drawn: the batches (one path per style, `data-link-count` links each) and the per-link
 * paths of the selection's reach. Arrowheads likewise.
 */
async function drawnLinks(page: Page) {
  return page.evaluate(() => {
    const sum = (sel: string) => [...document.querySelectorAll(sel)].reduce((s, el) => s + Number(el.getAttribute('data-link-count')), 0)
    const count = (sel: string) => document.querySelectorAll(sel).length
    return {
      batches: count('.layer-stack__link-batch'),
      batched: sum('.layer-stack__link-batch'),
      perLink: count('.layer-stack__link'),
      arrowBatches: count('.layer-stack__arrow-batch'),
      batchedArrows: sum('.layer-stack__arrow-batch'),
      perArrow: count('.layer-stack__arrow'),
    }
  })
}

/** Every node disc's center, by node id. */
async function nodeCenters(page: Page): Promise<Record<string, [number, number]>> {
  return page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('.layer-stack__node')].map((el) => {
        const c = el.querySelector('.layer-stack__disc')!
        return [el.getAttribute('data-node-id') ?? '', [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))]]
      }),
    ),
  )
}

test.describe('LayerStack', () => {
  test('an asynchronous layout lands on the same positions as the synchronous one', async ({ page }) => {
    await open(page)
    const sync = await nodeCenters(page)
    const errors = await open(page, '&asyncLayout=1')
    await expect(page.getByTestId('layer-stack-caption')).toContainText('layout ready')
    await expect(page.locator('.layer-stack__node')).toHaveCount(36)
    await expect.poll(() => nodeCenters(page)).toEqual(sync)
    expect(errors).toEqual([])
  })

  test('draws a plane per layer, a disc and a label button per node', async ({ page }) => {
    const errors = await open(page)
    await expect(page.getByTestId('layer-stack-caption')).toContainText('36 nodes · 162 links · 22 cross-layer')
    await expect(page.locator('.layer-stack__plane')).toHaveCount(3)
    await expect(page.locator('.layer-stack__node')).toHaveCount(36)
    await expect(page.locator('button.layer-stack__label')).toHaveCount(36)
    await expect(page.locator('button.layer-stack__title')).toHaveCount(3)
    // With no selection every link is batched: one path per style.
    const links = await drawnLinks(page)
    expect(links.batched).toBe(162)
    expect(links.perLink).toBe(0)
    expect(links.batches).toBeLessThan(30)
    await expect(page.locator('.layer-stack__drill')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('the selection\'s reach keeps a path and arrowhead per link; the rest stay batched', async ({ page }) => {
    await open(page, `&select=${ORIGIN}`)
    const links = await drawnLinks(page)
    expect(links.perLink).toBeGreaterThan(0)
    expect(links.perLink + links.batched).toBe(162)
    expect(links.perArrow).toBe(links.perLink)
    expect(links.batchedArrows).toBe(0)
    const ids = await page.locator('.layer-stack__link').evaluateAll((els) => els.map((e) => e.getAttribute('data-link-id')))
    expect(ids.every((id) => !!id)).toBe(true)
    // Every pill belongs to a reach link.
    const pills = await page.locator('.layer-stack__pill').evaluateAll((els) => els.map((e) => e.getAttribute('data-link-id')))
    expect(pills.length).toBeGreaterThan(0)
    for (const id of pills) expect(ids).toContain(id)
  })

  test('with every predicate labelled, arrowheads off the reach are batched too', async ({ page }) => {
    await open(page, '&labels=all')
    const links = await drawnLinks(page)
    expect(links.perArrow).toBe(0)
    expect(links.arrowBatches).toBeGreaterThan(0)
    expect(links.arrowBatches).toBeLessThan(20)
    // Arrowheads too short for their link are left out, as before.
    expect(links.batchedArrows).toBeGreaterThan(150)
    expect(links.batchedArrows).toBeLessThanOrEqual(162)
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

  test('a drag right after exiting focus still lets the planes close', async ({ page }) => {
    await open(page)
    const rest = await planeSpacing(page)
    expect(rest).toBeGreaterThan(0.8)
    expect(rest).toBeLessThan(1.25)
    await page.getByRole('button', { name: /^Focus Technology layer/ }).click()
    await expect(cameraStatus(page)).toContainText('focus · ')
    expect(Math.abs((await planeSpacing(page)) - rest)).toBeGreaterThan(0.3)
    await page.getByRole('button', { name: /^Exit focus on Technology layer/ }).click()
    // Within the 750 ms exit tween: the orbit cancels the camera move, not the planes closing.
    await orbit(page)
    await expect(cameraStatus(page)).toContainText('orbit · ')
    await expect(page.getByTestId('layer-stack-focus')).toHaveText('no focus')
    await expect.poll(async () => Math.abs((await planeSpacing(page)) - rest), { timeout: 3000 }).toBeLessThan(0.12)
  })

  test('after an orbit, Enter on a node label still selects it', async ({ page }) => {
    await open(page)
    await orbit(page)
    await expect(cameraStatus(page)).toContainText('orbit · ')
    const first = page.locator('button.layer-stack__label[tabindex="0"]')
    await first.focus()
    const id = await first.getAttribute('data-node-id')
    await page.keyboard.press('Enter')
    await expect(selection(page)).toContainText(`selected ${id}`)
    await page.getByRole('button', { name: /^Focus Technology layer/ }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('layer-stack-focus')).toHaveText('focus technology')
  })

  test('switching focus straight to another layer eases the planes from where they are', async ({ page }) => {
    await open(page)
    const rest = await planeSpacing(page)
    await page.getByRole('button', { name: /^Focus Technology layer/ }).click()
    await expect(cameraStatus(page)).toContainText('focus · ')
    const technology = await planeSpacing(page)
    // Titles move every frame of the switch, so click and sample in the page.
    const samples = await page.evaluate(async () => {
      const spacing = () => {
        const ys = ['business', 'application', 'technology'].map((id) => {
          const nums = document.querySelector(`.layer-stack__plane[data-layer-id="${id}"] polygon`)!.getAttribute('points')!.trim().split(/[\s,]+/).map(Number)
          let sum = 0
          for (let i = 1; i < nums.length; i += 2) sum += nums[i]
          return sum / (nums.length / 2)
        })
        return (ys[1] - ys[0]) / (ys[2] - ys[1])
      }
      ;(document.querySelector('button.layer-stack__title[data-layer-id="business"]') as HTMLButtonElement).click()
      const out: number[] = []
      for (let i = 0; i < 3; i++) {
        await new Promise((r) => requestAnimationFrame(r))
        out.push(spacing())
      }
      return out
    })
    // Before the fix the planes snapped shut (back to rest) and then opened around the new layer.
    for (const s of samples) expect(Math.abs(s - technology)).toBeLessThan(Math.abs(s - rest))
    await expect(page.getByTestId('layer-stack-focus')).toHaveText('focus business')
    // Open around Business: the top gap is now the wide one.
    await expect.poll(() => planeSpacing(page), { timeout: 3000 }).toBeGreaterThan(rest + 0.3)
  })

  test('a layer focus right after a preset keeps the preset turning', async ({ page }) => {
    await open(page)
    await page.evaluate(async () => {
      const radio = [...document.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => r.textContent === 'Profile')!
      radio.click()
      await new Promise((r) => requestAnimationFrame(r))
      await new Promise((r) => requestAnimationFrame(r))
      ;(document.querySelector('button.layer-stack__title[data-layer-id="technology"]') as HTMLButtonElement).click()
    })
    await expect(page.getByTestId('layer-stack-focus')).toHaveText('focus technology')
    // Profile's yaw (0°) with the focus pitch and zoom.
    await expect(cameraStatus(page)).toHaveText('focus · yaw 0° pitch 54° zoom 1.12')
    await expect(page.getByTestId('layer-stack-preset')).toHaveText('preset none')
  })

  test('a controlled camera and gap are held: interactions only report', async ({ page }) => {
    await open(page, '&camera=held')
    const before = await nodeCenters(page)
    await orbit(page)
    await expect(cameraStatus(page)).toContainText('orbit · ')
    // The settle report is the gesture's last proposal, not the held camera.
    await expect(cameraStatus(page)).not.toContainText('yaw -36° pitch 29°')
    expect(await nodeCenters(page)).toEqual(before)
    await page.getByRole('radio', { name: 'Exploded' }).click()
    await expect(cameraStatus(page)).toHaveText('preset · yaw -29° pitch 19° zoom 0.86')
    expect(await nodeCenters(page)).toEqual(before)
    await expect(page.getByTestId('layer-stack-reports')).toContainText('gap 170')
  })

  test('a controlled camera and gap that take every report follow each frame', async ({ page }) => {
    await open(page, '&camera=controlled')
    const before = await nodeCenters(page)
    await orbit(page)
    await expect(cameraStatus(page)).toContainText('orbit · ')
    expect(await nodeCenters(page)).not.toEqual(before)
    await page.getByRole('radio', { name: 'Exploded' }).click()
    await expect(cameraStatus(page)).toHaveText('preset · yaw -29° pitch 19° zoom 0.86')
    await expect(page.getByTestId('layer-stack-reports')).toContainText('gap 300')
    // Reported per frame, not only on settle: orbit moves and preset frames add up to many.
    const reports = Number((await page.getByTestId('layer-stack-reports').textContent())!.match(/(\d+) reports/)![1])
    expect(reports).toBeGreaterThan(10)
  })

  test('a controlled parent that echoes reports late still lets a preset finish', async ({ page }) => {
    // The page passes each report back two frames late, as a slow device's React commit would.
    // Before the fix, the late echo read as an outside change and stopped the preset part-way.
    await open(page, '&camera=lagged')
    await orbit(page)
    await expect(cameraStatus(page)).toContainText('orbit · ')
    await page.getByRole('radio', { name: 'Exploded' }).click()
    await expect(cameraStatus(page)).toHaveText('preset · yaw -29° pitch 19° zoom 0.86')
    await expect(page.getByTestId('layer-stack-reports')).toContainText('gap 300 · yaw -29° pitch 19° zoom 0.86')
  })

  test('pinch zooms, clamped like the wheel', async ({ page }) => {
    await open(page)
    const pinch = (from: number, to: number) =>
      page.evaluate(
        ([from, to]) => {
          const el = document.querySelector('[data-testid="layer-stack"]')!
          const r = el.getBoundingClientRect()
          const x = r.left + r.width * 0.3
          const y = r.top + r.height * 0.9
          const fire = (type: string, pointerId: number, cx: number) =>
            el.dispatchEvent(new PointerEvent(type, { pointerId, pointerType: 'touch', isPrimary: pointerId === 1, clientX: cx, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true }))
          fire('pointerdown', 1, x)
          fire('pointerdown', 2, x + from)
          for (let i = 1; i <= 4; i++) fire('pointermove', 2, x + from + ((to - from) * i) / 4)
          fire('pointerup', 2, x + to)
          fire('pointerup', 1, x)
        },
        [from, to],
      )
    await pinch(100, 200)
    await expect(cameraStatus(page)).toHaveText('zoom · yaw -36° pitch 29° zoom 2.00')
    await expect(page.getByTestId('layer-stack-preset')).toHaveText('preset none')
    await expect(selection(page)).toHaveText('no selection')
    await pinch(100, 400)
    await expect(cameraStatus(page)).toHaveText('zoom · yaw -36° pitch 29° zoom 3.00')
    await pinch(300, 30)
    await expect(cameraStatus(page)).toHaveText('zoom · yaw -36° pitch 29° zoom 0.40')
  })

  test.describe('labels behind planes', () => {
    test.use({ reducedMotion: 'reduce' })

    /** Ids of the node labels with the occluded state, by layer. */
    const occluded = (page: Page) =>
      page.evaluate(() => {
        const out: Record<string, { occluded: string[]; clear: string[] }> = {}
        for (const el of document.querySelectorAll<HTMLElement>('button.layer-stack__label')) {
          const id = el.dataset.nodeId!
          const layer = id.split('.')[0]
          out[layer] ??= { occluded: [], clear: [] }
          out[layer][el.classList.contains('layer-stack__label--occluded') ? 'occluded' : 'clear'].push(id)
        }
        return out
      })

    test('stack preset: labels under a nearer plane fade, the top layer stays clear', async ({ page }) => {
      await open(page)
      const o = await occluded(page)
      expect(o.business.occluded).toEqual([])
      expect(o.application.occluded.length).toBeGreaterThan(0)
      expect(o.technology.occluded.length).toBeGreaterThan(0)
      // Faded, not hidden: still drawn, at under half its opacity.
      const label = page.locator(`button.layer-stack__label[data-node-id="${o.technology.occluded[0]}"]`)
      await expect(label).toBeVisible()
      expect(Number(await label.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.5)
    })

    test('top view is the x-ray: no label fades', async ({ page }) => {
      await open(page, '&preset=top')
      const o = await occluded(page)
      expect([...o.business.occluded, ...o.application.occluded, ...o.technology.occluded]).toEqual([])
    })

    test('the selection, its reach and the hovered node are never faded', async ({ page }) => {
      await open(page, `&select=${ORIGIN}`)
      const reach = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('button.layer-stack__label--selected, button.layer-stack__label--followed')].map((el) => el.dataset.nodeId!))
      expect(reach).toContain(ORIGIN)
      const o = await occluded(page)
      const faded = [...o.application.occluded, ...o.technology.occluded]
      for (const id of reach) expect(faded).not.toContain(id)
      // Others under the business plane are still faded.
      expect(faded.length).toBeGreaterThan(0)
      // Hovering its disc (React's pointer-enter listens for pointerover; the disc may sit under
      // another node, so the event goes straight to it).
      await page.locator(`.layer-stack__node[data-node-id="${faded[0]}"] .layer-stack__disc`).dispatchEvent('pointerover')
      await expect(page.locator(`button.layer-stack__label[data-node-id="${faded[0]}"]`)).not.toHaveClass(/layer-stack__label--occluded/)
    })

    test('a focused layer reads clearly: the planes dimmed around it fade no label', async ({ page }) => {
      await open(page, '&focus=application')
      const o = await occluded(page)
      expect(o.application.occluded).toEqual([])
    })

    test('profile view: almost side-on, nothing sits behind a plane', async ({ page }) => {
      await open(page, '&preset=profile')
      const o = await occluded(page)
      expect([...o.business.occluded, ...o.application.occluded, ...o.technology.occluded].length).toBeLessThan(3)
    })
  })

  test('an orbit fades and clears labels frame by frame without a React commit', async ({ page }) => {
    await open(page)
    const r = await page.evaluate(async () => {
      const w = window as unknown as { __layerStackCommits: number }
      const frame = () => new Promise((r) => requestAnimationFrame(r))
      const faded = () => [...document.querySelectorAll('button.layer-stack__label--occluded')].map((el) => (el as HTMLElement).dataset.nodeId).join(',')
      ;[...document.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === 'Turntable')!.click()
      for (let i = 0; i < 3; i++) await frame()
      const c0 = w.__layerStackCommits
      const seen = new Set<string>()
      for (const t0 = performance.now(); performance.now() - t0 < 1500; ) {
        await frame()
        seen.add(faded())
      }
      return { states: seen.size, commits: w.__layerStackCommits - c0 }
    })
    // The faded set changed as the stack turned, and no frame committed.
    expect(r.states).toBeGreaterThan(1)
    expect(r.commits).toBe(0)
  })

  test.describe('full DR spec', () => {
    test('draws every layer, node and link of the 13-layer spec', async ({ page }) => {
      const errors = await open(page, '&data=full')
      await expect(page.getByTestId('layer-stack-caption')).toContainText('full · 193 nodes · 897 links')
      await expect(page.locator('.layer-stack__plane')).toHaveCount(13)
      await expect(page.locator('.layer-stack__node')).toHaveCount(193)
      await expect(page.locator('button.layer-stack__label')).toHaveCount(193)
      const links = await drawnLinks(page)
      expect(links.batched).toBe(897)
      expect(links.batches).toBeLessThan(60)
      expect(errors).toEqual([])
    })

    /**
     * The link paths a turntable frame rewrites: every batch at most, plus the reach's own paths.
     * Counted with a MutationObserver on `d`, so it doesn't depend on machine speed.
     */
    for (const query of ['', `&select=${ORIGIN}`]) {
      test(`a turntable frame rewrites at most one path per batch plus the reach${query ? ', with a selection' : ''}`, async ({ page }) => {
        await open(page, `&data=full${query}`)
        const r = await page.evaluate(async () => {
          const frame = () => new Promise((res) => requestAnimationFrame(res))
          const svg = document.querySelector('[data-testid="layer-stack"] .layer-stack__svg')!
          let records: MutationRecord[] = []
          const obs = new MutationObserver((rs) => records.push(...rs))
          obs.observe(svg, { subtree: true, attributes: true, attributeFilter: ['d'] })
          ;[...document.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === 'Turntable')!.click()
          for (let i = 0; i < 3; i++) await frame()
          records = []
          let worst = 0
          let worstBound = 0
          let painted = 0
          for (const t0 = performance.now(); performance.now() - t0 < 1000; ) {
            await frame()
            const batch = [...records, ...obs.takeRecords()]
            records = []
            const touched = new Set(batch.map((m) => m.target as Element).filter((el) => el.matches('.layer-stack__link, .layer-stack__link-batch')))
            if (touched.size > 0) painted++
            // The reach: one arrowhead per reach link (predicate labels on reach links only, the default).
            const bound = document.querySelectorAll('.layer-stack__link-batch').length + document.querySelectorAll('.layer-stack__arrow').length
            if (touched.size > worst) [worst, worstBound] = [touched.size, bound]
          }
          obs.disconnect()
          const count = (sel: string) => document.querySelectorAll(sel).length
          return { worst, worstBound, painted, batches: count('.layer-stack__link-batch'), perLink: count('.layer-stack__link'), reach: count('.layer-stack__arrow') }
        })
        expect(r.painted).toBeGreaterThan(5)
        expect(r.worst).toBeLessThanOrEqual(r.worstBound)
        expect(r.batches).toBeLessThan(60)
        expect(r.perLink).toBe(r.reach)
        if (!query) expect(r.reach).toBe(0)
        else expect(r.reach).toBeGreaterThan(0)
      })
    }

    /**
     * Frames paint into the DOM without React: over a stretch of motion the scene changes every
     * frame while the LayerStack subtree does not commit. Counted with the test page's React
     * Profiler, so it does not depend on machine speed. The window ends after `ms`, or at the last
     * frame before the camera's settle report (a tween that ends early on a slow machine), so the
     * commits that settle the motion are never counted.
     */
    const motion = (page: Page, start: string, ms: number) =>
      page.evaluate(
        async ([start, ms]) => {
          const w = window as unknown as { __layerStackCommits: number }
          const frame = () => new Promise((r) => requestAnimationFrame(r))
          const plane = () => document.querySelector('.layer-stack__plane[data-layer-id="motivation"] polygon')!.getAttribute('points')
          const status = () => document.querySelector('[data-testid="layer-stack-camera"]')!.textContent
          ;[...document.querySelectorAll<HTMLElement>('button, [role="radio"]')].find((b) => b.textContent === start)!.click()
          // Past the commits that start the motion (the prop change, pills hidden).
          for (let i = 0; i < 3; i++) await frame()
          const s0 = status()
          const c0 = w.__layerStackCommits
          let commits = 0
          const seen = new Set<string | null>()
          for (const t0 = performance.now(); performance.now() - t0 < ms; ) {
            await frame()
            if (status() !== s0) break
            commits = w.__layerStackCommits - c0
            seen.add(plane())
          }
          return { painted: seen.size, commits }
        },
        [start, ms] as const,
      )

    test('turntable frames paint without re-rendering the React tree', async ({ page }) => {
      await open(page, '&data=full')
      const r = await motion(page, 'Turntable', 1000)
      expect(r.painted).toBeGreaterThan(5)
      expect(r.commits).toBe(0)
    })

    test('preset tween frames paint without re-rendering the React tree', async ({ page }) => {
      await open(page, '&data=full')
      const r = await motion(page, 'Exploded', 600)
      expect(r.painted).toBeGreaterThan(3)
      expect(r.commits).toBe(0)
      await expect(cameraStatus(page)).toContainText('preset · yaw -29° pitch 19° zoom ')
    })

    test('an orbit drag re-renders a fixed few times, not once per move', async ({ page }) => {
      await open(page, '&data=full')
      const before = await nodeCenters(page)
      const box = (await page.getByTestId('layer-stack').boundingBox())!
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.95)
      await page.mouse.down()
      const c0 = await page.evaluate(() => (window as unknown as { __layerStackCommits: number }).__layerStackCommits)
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.9, { steps: 30 })
      const during = await page.evaluate(() => (window as unknown as { __layerStackCommits: number }).__layerStackCommits)
      expect(await nodeCenters(page)).not.toEqual(before)
      await page.mouse.up()
      await expect(cameraStatus(page)).toContainText('orbit · ')
      // When the drag starts (pills hide) and a hover that ends under the pointer; none per move.
      expect(during - c0).toBeLessThanOrEqual(3)
    })
  })

  test.describe('13 layers frame', () => {
    test.use({ reducedMotion: 'reduce' })

    /** Plane corners outside the scene's viewBox. */
    const cornersOutside = (page: Page) =>
      page.evaluate(() => {
        const [x0, y0, w, h] = document.querySelector('.layer-stack__svg')!.getAttribute('viewBox')!.split(' ').map(Number)
        const pts = [...document.querySelectorAll('.layer-stack__plane polygon')].flatMap((p) => p.getAttribute('points')!.trim().split(/\s+/).map((xy) => xy.split(',').map(Number)))
        return pts.filter(([x, y]) => x < x0 || x > x0 + w || y < y0 || y > y0 + h).length
      })

    test('every preset, then Fit, keeps all 13 planes inside the scene', async ({ page }) => {
      await open(page, '&data=full')
      for (const name of ['Stack', 'Exploded', 'Top', 'Profile']) {
        await page.getByRole('radio', { name }).click()
        await page.getByRole('button', { name: 'Fit', exact: true }).click()
        await expect(cameraStatus(page)).toContainText('fit · ')
        expect(await cornersOutside(page), `${name}: plane corners outside the scene`).toBe(0)
      }
    })

    for (const preset of ['stack', 'exploded', 'top', 'profile']) {
      test(`at docs width (870px), every plane title of the 13 sits inside the scene at ${preset}`, async ({ page }) => {
        await open(page, `&data=full&preset=${preset}&width=870`)
        await expect(page.locator('.layer-stack__title')).toHaveCount(13)
        const out = await page.evaluate(() => {
          const stage = document.querySelector('[data-testid="layer-stack"]')!.getBoundingClientRect()
          return [...document.querySelectorAll<HTMLElement>('.layer-stack__title')]
            .filter((t) => {
              const r = t.getBoundingClientRect()
              return r.top < stage.top - 0.5 || r.bottom > stage.bottom + 0.5 || r.left < stage.left - 0.5 || r.right > stage.right + 0.5
            })
            .map((t) => t.dataset.layerId)
        })
        expect(out).toEqual([])
        expect(await cornersOutside(page)).toBe(0)
      })
    }

    test('a defaultCamera zoom over the preset is kept: no fit', async ({ page }) => {
      await open(page, '&data=full&zoom=1.6')
      await expect(page.locator('.layer-stack__plane')).toHaveCount(13)
      // At zoom 1.6 the 13 planes leave the scene, and no fit was reported.
      expect(await cornersOutside(page)).toBeGreaterThan(0)
      await expect(cameraStatus(page)).toHaveText('')
    })

    test('a controlled camera is never fitted', async ({ page }) => {
      await open(page, '&data=full&camera=controlled')
      await expect(page.locator('.layer-stack__plane')).toHaveCount(13)
      expect(await cornersOutside(page)).toBeGreaterThan(0)
      await expect(page.getByTestId('layer-stack-reports')).toContainText('0 reports')
    })

    test('picking a preset on 13 layers frames it', async ({ page }) => {
      await open(page, '&data=full')
      await page.getByRole('radio', { name: 'Exploded' }).click()
      await expect(cameraStatus(page)).toContainText('preset · yaw -29° pitch 19° zoom ')
      expect(await cornersOutside(page)).toBe(0)
    })

    test('data that loads after mount takes the preset gap and is fitted, with no Fit click', async ({ page }) => {
      await open(page, '&data=full&late=1')
      await expect(page.locator('.layer-stack__plane')).toHaveCount(0)
      await page.getByRole('button', { name: 'Load data' }).click()
      await expect(page.locator('.layer-stack__plane')).toHaveCount(13)
      await expect(cameraStatus(page)).toContainText('fit · ')
      expect(await cornersOutside(page)).toBe(0)
      // The preset stays: the fit is how it frames a tall stack.
      await expect(page.getByTestId('layer-stack-preset')).toHaveText('preset stack')
    })

    for (const preset of ['stack', 'exploded', 'top', 'profile']) {
      test(`mounting at ${preset} fits the 13-layer stack, and reports it`, async ({ page }) => {
        await open(page, `&data=full&preset=${preset}`)
        await expect(page.locator('.layer-stack__plane')).toHaveCount(13)
        expect(await cornersOutside(page)).toBe(0)
        await expect(cameraStatus(page)).toContainText('fit · ')
        await expect(page.getByTestId('layer-stack-preset')).toHaveText(`preset ${preset}`)
      })
    }
  })

  test.describe('pills follow the camera', () => {
    /** Largest distance (scene units) from a pill's centre to its link's line. */
    const worstPill = (page: Page) =>
      page.evaluate(() => {
        const stage = document.querySelector('[data-testid="layer-stack"]')!
        const [x0, y0, w, h] = stage.querySelector('.layer-stack__svg')!.getAttribute('viewBox')!.split(' ').map(Number)
        const pills = [...stage.querySelectorAll<HTMLElement>('.layer-stack__pill')]
        if (pills.length === 0) return null
        return Math.max(
          ...pills.map((pill) => {
            const px = x0 + (parseFloat(pill.style.left) / 100) * w
            const py = y0 + (parseFloat(pill.style.top) / 100) * h
            const d = stage.querySelector(`.layer-stack__link[data-link-id="${pill.dataset.linkId}"]`)!.getAttribute('d')!
            const [ax, ay, bx, by] = d.match(/-?[\d.]+/g)!.map(Number)
            const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1)))
            return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)))
          }),
        )
      })

    test('a wheel zoom places the pills again, with no parent re-render', async ({ page }) => {
      // quiet=1: no onCameraChange, so only the stack itself can re-render.
      await open(page, `&select=${ORIGIN}&quiet=1`)
      await page.locator('button.layer-stack__label[tabindex="0"]').focus()
      const box = (await page.getByTestId('layer-stack').boundingBox())!
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.9)
      // The first zoom clears the preset, which re-renders the page; the second is the test.
      await page.mouse.wheel(0, -120)
      await expect(page.getByTestId('layer-stack-preset')).toHaveText('preset none')
      await expect.poll(() => worstPill(page)).toBeLessThan(1.5)
      const before = await nodeCenters(page)
      await page.mouse.wheel(0, -240)
      await expect.poll(async () => JSON.stringify(await nodeCenters(page)) !== JSON.stringify(before)).toBe(true)
      await expect.poll(() => worstPill(page)).toBeLessThan(1.5)
    })

    test('an outside camera change during a zoom stops it and brings the pills back', async ({ page }) => {
      await open(page, `&select=${ORIGIN}&camera=controlled`)
      await expect.poll(() => worstPill(page)).toBeLessThan(1.5)
      // Mid-tween (pills hidden), the parent sets the zoom itself: the stack's move stops. The click
      // waits out the page's pending render of the last tween frame, so nothing else re-renders the
      // stack afterwards.
      await page.evaluate(async () => {
        const button = (name: string) => [...document.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === name)!
        const task = () => new Promise((r) => setTimeout(r, 0))
        button('Zoom in').click()
        await new Promise((r) => requestAnimationFrame(r))
        await new Promise((r) => requestAnimationFrame(r))
        await task()
        await task()
        button('Outside zoom').click()
      })
      await expect(page.getByTestId('layer-stack-reports')).toContainText('zoom 1.50')
      await expect.poll(() => worstPill(page)).toBeLessThan(1.5)
    })

    test.describe('reduced motion', () => {
      test.use({ reducedMotion: 'reduce' })

      test('a jump (zoomBy) places the pills again, with no parent re-render', async ({ page }) => {
        await open(page, `&select=${ORIGIN}&quiet=1`)
        // The first zoom clears the preset, which re-renders the page; the second is the test.
        await page.getByRole('button', { name: 'Zoom in' }).click()
        await expect(page.getByTestId('layer-stack-preset')).toHaveText('preset none')
        await expect.poll(() => worstPill(page)).toBeLessThan(1.5)
        const before = await nodeCenters(page)
        await page.getByRole('button', { name: 'Zoom in' }).click()
        await expect.poll(async () => JSON.stringify(await nodeCenters(page)) !== JSON.stringify(before)).toBe(true)
        await expect.poll(() => worstPill(page)).toBeLessThan(1.5)
      })
    })
  })

  test.describe('touch', () => {
    test.use({ hasTouch: true })

    test('a two-finger touch pinch zooms and is not taken as a page scroll', async ({ page }) => {
      await open(page)
      await page.evaluate(() => {
        const w = window as unknown as { pinchPrevented: boolean[] }
        w.pinchPrevented = []
        document.addEventListener('touchmove', (e) => w.pinchPrevented.push(e.defaultPrevented), { passive: true })
      })
      const box = (await page.getByTestId('layer-stack').boundingBox())!
      const x = box.x + box.width * 0.3
      const y = box.y + box.height * 0.9
      const cdp = await page.context().newCDPSession(page)
      const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) =>
        cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, id) => ({ ...p, id })) })
      await touch('touchStart', [{ x, y }, { x: x + 100, y }])
      for (let i = 1; i <= 4; i++) await touch('touchMove', [{ x, y }, { x: x + 100 + 25 * i, y }])
      await touch('touchEnd', [])
      await expect(cameraStatus(page)).toHaveText('zoom · yaw -36° pitch 29° zoom 2.00')
      const prevented = await page.evaluate(() => (window as unknown as { pinchPrevented: boolean[] }).pinchPrevented)
      expect(prevented.length).toBeGreaterThan(0)
      expect(prevented.every(Boolean)).toBe(true)
    })
  })

  test.describe('visual', () => {
    test.use({ reducedMotion: 'reduce' })
    for (const theme of ['dark', 'light'] as const) {
      const dark = theme === 'dark' ? '&dark=1' : ''
      test(`stack preset with a followed selection, ${theme}`, async ({ page }) => {
        await open(page, `&select=${ORIGIN}${dark}`)
        await expect(page.getByTestId('layer-stack')).toHaveScreenshot(`layer-stack-selection-${theme}.png`)
      })
      test(`stack preset, labels behind planes faded, ${theme}`, async ({ page }) => {
        await open(page, dark)
        await expect(page.getByTestId('layer-stack')).toHaveScreenshot(`layer-stack-occlusion-${theme}.png`)
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
