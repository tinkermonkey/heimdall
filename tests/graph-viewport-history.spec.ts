import { test, expect, type Page } from '@playwright/test'

// tinkermonkey/heimdall#309: viewport events and restore for app-level history. Behaviour only,
// no screenshots. GraphViewportHistoryTestPage records every onViewportDwell /
// onViewportNavigate call on window.__viewportEvents and exposes the viewportRef handle as
// window.__viewportHandle.

type Snapshot = {
  center: { x: number; y: number }
  zoom: number
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}
type Cause = { kind: string; reason?: string; nodeId?: string }
type ViewportEvent = { type: 'dwell' | 'navigate'; t: number; viewport: Snapshot; cause?: Cause }

const URL = 'http://localhost:5173/?example=graph-viewport-history'
const CANVAS_W = 800
const CANVAS_H = 500

async function open(page: Page, query = '') {
  await page.goto(URL + query)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-testid="history-canvas"]')).toBeVisible()
  // Let the mount framing land.
  await page.waitForTimeout(200)
}

function events(page: Page): Promise<ViewportEvent[]> {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__viewportEvents ?? [])))
}

function clearEvents(page: Page) {
  return page.evaluate(() => {
    window.__viewportEvents!.length = 0
  })
}

// The world-coordinate snapshot implied by the rendered transform.
async function renderedSnapshot(page: Page): Promise<Snapshot> {
  const transform = await page.locator('[data-testid="graph-viewport"]').getAttribute('transform')
  const [zoom, , , , x, y] = transform!.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number)
  const minX = -x / zoom
  const minY = -y / zoom
  const maxX = (CANVAS_W - x) / zoom
  const maxY = (CANVAS_H - y) / zoom
  return { center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, zoom, bounds: { minX, minY, maxX, maxY } }
}

function expectSnapshotClose(actual: Snapshot, expected: Snapshot, tolerance = 0.01) {
  expect(actual.zoom).toBeCloseTo(expected.zoom, 4)
  expect(Math.abs(actual.center.x - expected.center.x)).toBeLessThan(tolerance)
  expect(Math.abs(actual.center.y - expected.center.y)).toBeLessThan(tolerance)
  for (const key of ['minX', 'minY', 'maxX', 'maxY'] as const) {
    expect(Math.abs(actual.bounds[key] - expected.bounds[key])).toBeLessThan(tolerance)
  }
}

test.describe('integration: GraphCanvas viewport history', () => {
  test('dwell fires once after a drag, only after its inertia glide has stopped', async ({ page }) => {
    await open(page, '&dwellMs=300')
    await clearEvents(page)

    const timing = await page.locator('[data-testid="history-canvas"]').evaluate(async (el) => {
      const vp = el.querySelector('[data-testid="graph-viewport"]')!
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
      // Record when the rendered transform last changed.
      let lastTransform = vp.getAttribute('transform')
      let lastChange = performance.now()
      let watching = true
      const watch = () => {
        const now = vp.getAttribute('transform')
        if (now !== lastTransform) {
          lastTransform = now
          lastChange = performance.now()
        }
        if (watching) requestAnimationFrame(watch)
      }
      requestAnimationFrame(watch)

      const rect = el.getBoundingClientRect()
      let x = rect.left + 100
      let y = rect.top + 100
      const pointer = (type: string) =>
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0 })
      el.dispatchEvent(pointer('pointerdown'))
      for (let i = 0; i < 8; i++) {
        await wait(16)
        x += 8
        y += 4
        document.dispatchEvent(pointer('pointermove'))
      }
      document.dispatchEvent(pointer('pointerup'))
      const release = performance.now()

      // Wait for the dwell (inertia from this release runs a few seconds).
      const deadline = release + 8000
      while (!(window.__viewportEvents ?? []).some((e) => e.type === 'dwell') && performance.now() < deadline) {
        await wait(20)
      }
      // A little longer, to catch a second dwell if one were coming.
      await wait(500)
      watching = false
      return { release, lastChange }
    })

    const all = await events(page)
    const dwells = all.filter((e) => e.type === 'dwell')
    expect(dwells).toHaveLength(1)
    expect(all.filter((e) => e.type === 'navigate')).toHaveLength(0)
    // The release really did glide: the view kept moving well after the pointer was let go.
    expect(timing.lastChange - timing.release).toBeGreaterThan(300)
    // And the dwell waited out the glide, then the full dwellMs on top of it.
    expect(dwells[0].t - timing.lastChange).toBeGreaterThanOrEqual(300 - 20)
    // World-coordinate snapshot of where it settled.
    expectSnapshotClose(dwells[0].viewport, await renderedSnapshot(page))
  })

  // tinkermonkey/heimdall#320: the glide ran on at sub-pixel speed for ~1s after it visibly
  // stopped, so the dwell landed ~1s plus dwellMs after the view stopped moving.
  test('dwell follows the glide visibly stopping, not its sub-pixel tail', async ({ page }) => {
    await open(page, '&dwellMs=300')
    await clearEvents(page)

    const result = await page.locator('[data-testid="history-canvas"]').evaluate(async (el) => {
      const vp = el.querySelector('[data-testid="graph-viewport"]')!
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
      const read = () => {
        const m = vp.getAttribute('transform')!.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number)
        return { x: m[4], y: m[5] }
      }
      // Every rendered pan, with its time.
      const trace: { t: number; x: number; y: number }[] = []
      let watching = true
      const watch = () => {
        trace.push({ t: performance.now(), ...read() })
        if (watching) requestAnimationFrame(watch)
      }
      requestAnimationFrame(watch)

      // A quick flick: 8 moves of 16px, ~16ms apart (about 1000px/s).
      const rect = el.getBoundingClientRect()
      let x = rect.left + 100
      const y = rect.top + 200
      const pointer = (type: string) =>
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0 })
      el.dispatchEvent(pointer('pointerdown'))
      for (let i = 0; i < 8; i++) {
        await wait(16)
        x += 16
        document.dispatchEvent(pointer('pointermove'))
      }
      document.dispatchEvent(pointer('pointerup'))
      const release = performance.now()

      const deadline = release + 8000
      while (!(window.__viewportEvents ?? []).some((e) => e.type === 'dwell') && performance.now() < deadline) {
        await wait(20)
      }
      watching = false
      const dwell = (window.__viewportEvents ?? []).find((e) => e.type === 'dwell')
      // When the view visibly stopped: the first frame from which it never again strays half a
      // pixel from where it ends up.
      const final = trace[trace.length - 1]
      let settled = trace[trace.length - 1].t
      for (let i = trace.length - 1; i >= 0; i--) {
        if (Math.hypot(trace[i].x - final.x, trace[i].y - final.y) >= 0.5) break
        settled = trace[i].t
      }
      return { release, settled, dwellT: dwell?.t ?? null }
    })

    expect(result.dwellT).not.toBeNull()
    // The flick really glided.
    expect(result.settled - result.release).toBeGreaterThan(300)
    // The dwell came dwellMs after the view visibly stopped, give or take a few frames. Before
    // the fix this gap was ~1.3s.
    expect(result.dwellT! - result.settled).toBeGreaterThanOrEqual(300 - 20)
    expect(result.dwellT! - result.settled).toBeLessThan(300 + 250)
  })

  // tinkermonkey/heimdall#321: release velocity was the last pointermove's, however long ago it
  // was, so a drag held still and then released still flung.
  test('a drag held still before the release does not glide', async ({ page }) => {
    await open(page, '&dwellMs=300')
    await clearEvents(page)

    const result = await page.locator('[data-testid="history-canvas"]').evaluate(async (el) => {
      const vp = el.querySelector('[data-testid="graph-viewport"]')!
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
      const rect = el.getBoundingClientRect()
      let x = rect.left + 100
      const y = rect.top + 200
      const pointer = (type: string) =>
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0 })
      // The same quick drag as a flick, then 300ms held still with the button down.
      el.dispatchEvent(pointer('pointerdown'))
      for (let i = 0; i < 12; i++) {
        await wait(16)
        x += 16
        document.dispatchEvent(pointer('pointermove'))
      }
      await wait(300)
      const atRelease = vp.getAttribute('transform')
      document.dispatchEvent(pointer('pointerup'))
      const release = performance.now()
      await wait(800)
      const dwell = (window.__viewportEvents ?? []).find((e) => e.type === 'dwell')
      return { atRelease, after: vp.getAttribute('transform'), release, dwellT: dwell?.t ?? null }
    })

    expect(result.after).toBe(result.atRelease)
    // No glide to wait out, so the dwell lands dwellMs after the release.
    expect(result.dwellT).not.toBeNull()
    expect(result.dwellT! - result.release).toBeLessThan(300 + 150)
  })

  test('dwell does not fire during a continuous drag or wheel, only once after it ends', async ({ page }) => {
    await open(page, '&dwellMs=300')
    await clearEvents(page)

    const counts = await page.locator('[data-testid="history-canvas"]').evaluate(async (el) => {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
      const dwellCount = () => (window.__viewportEvents ?? []).filter((e) => e.type === 'dwell').length
      const rect = el.getBoundingClientRect()
      let x = rect.left + 100
      let y = rect.top + 100
      const pointer = (type: string) =>
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0 })

      // A slow drag held for well over dwellMs, including a pause longer than dwellMs with the
      // button still down.
      el.dispatchEvent(pointer('pointerdown'))
      for (let i = 0; i < 30; i++) {
        await wait(30)
        x += 2
        document.dispatchEvent(pointer('pointermove'))
      }
      await wait(500)
      const duringDrag = dwellCount()
      // Released after that hold, so there's no glide (#321).
      document.dispatchEvent(pointer('pointerup'))
      await wait(600)
      const afterDrag = dwellCount()

      // A wheel stream lasting well over dwellMs, one event every 50ms.
      const wheel = () =>
        el.dispatchEvent(
          new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            deltaY: -10,
            deltaMode: 0,
          })
        )
      for (let i = 0; i < 20; i++) {
        wheel()
        await wait(50)
      }
      const duringWheel = dwellCount()
      await wait(600)
      const afterWheel = dwellCount()
      return { duringDrag, afterDrag, duringWheel, afterWheel }
    })

    expect(counts).toEqual({ duringDrag: 0, afterDrag: 1, duringWheel: 1, afterWheel: 2 })
    const all = await events(page)
    expect(all.filter((e) => e.type === 'navigate')).toHaveLength(0)
    expectSnapshotClose(all[all.length - 1].viewport, await renderedSnapshot(page))
  })

  test('the toolbar zoom buttons count as user moves: a dwell, not a navigation', async ({ page }) => {
    await open(page, '&dwellMs=300')
    await clearEvents(page)
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await page.waitForTimeout(700)
    const all = await events(page)
    expect(all.map((e) => e.type)).toEqual(['dwell'])
    expect(all[0].viewport.zoom).toBeCloseTo(1.3 * 1.3, 4)
  })

  test('centerOnSelect reports a center-on-select navigation with the node id', async ({ page }) => {
    await open(page, '&centerOnSelect=1')
    await clearEvents(page)
    await page.getByTestId('select-far').click()
    await expect.poll(async () => (await events(page)).length).toBe(1)
    const [event] = await events(page)
    expect(event.type).toBe('navigate')
    expect(event.cause).toEqual({ kind: 'center-on-select', nodeId: 'far' })
    // Centred on the node's world position (manual layout: x 1200, y 900).
    expect(event.viewport.center.x).toBeCloseTo(1200, 3)
    expect(event.viewport.center.y).toBeCloseTo(900, 3)
    expectSnapshotClose(event.viewport, await renderedSnapshot(page))
  })

  test('the mount fit reports fit/mount, and the toolbar zoom-to-fit reports fit/toolbar', async ({ page }) => {
    await open(page, '&fitView=1')
    const mount = await events(page)
    expect(mount).toHaveLength(1)
    expect(mount[0].type).toBe('navigate')
    expect(mount[0].cause).toEqual({ kind: 'fit', reason: 'mount' })
    expectSnapshotClose(mount[0].viewport, await renderedSnapshot(page))

    // Move away first, so the fit is a real move.
    await page.evaluate(() => window.__viewportHandle!.setViewport({ center: { x: 0, y: 0 }, zoom: 2 }, { silent: true }))
    await clearEvents(page)
    await page.getByRole('button', { name: 'Zoom to fit' }).click()
    await expect.poll(async () => (await events(page)).length).toBe(1)
    const [fit] = await events(page)
    expect(fit.cause).toEqual({ kind: 'fit', reason: 'toolbar' })
    expectSnapshotClose(fit.viewport, mount[0].viewport)
  })

  test('the mount centre without fitView also reports fit/mount', async ({ page }) => {
    await open(page)
    const all = await events(page)
    expect(all.map((e) => e.cause)).toEqual([{ kind: 'fit', reason: 'mount' }])
  })

  test('setViewport moves the view; silent suppresses the navigation, otherwise it is imperative', async ({ page }) => {
    await open(page, '&fitView=1')
    await clearEvents(page)

    await page.evaluate(() => window.__viewportHandle!.setViewport({ center: { x: 900, y: 0 }, zoom: 1.5 }, { silent: true }))
    await page.waitForTimeout(300)
    const silent = await renderedSnapshot(page)
    expect(silent.zoom).toBeCloseTo(1.5, 4)
    expect(silent.center.x).toBeCloseTo(900, 3)
    expect(silent.center.y).toBeCloseTo(0, 3)
    expect(await events(page)).toEqual([])

    await page.evaluate(() => window.__viewportHandle!.setViewport({ center: { x: 0, y: 700 }, zoom: 0.5 }))
    await expect.poll(async () => (await events(page)).length).toBe(1)
    const [event] = await events(page)
    expect(event.cause).toEqual({ kind: 'imperative' })
    expect(event.viewport.center.x).toBeCloseTo(0, 3)
    expect(event.viewport.center.y).toBeCloseTo(700, 3)
    expect(event.viewport.zoom).toBeCloseTo(0.5, 4)
  })

  test('setViewport with animate eases to the target and reports once at the end', async ({ page }) => {
    await open(page)
    await clearEvents(page)
    await page.evaluate(() =>
      window.__viewportHandle!.setViewport({ center: { x: 1200, y: 900 }, zoom: 2 }, { animate: true })
    )
    await expect.poll(async () => (await events(page)).length).toBe(1)
    await page.waitForTimeout(300)
    const all = await events(page)
    expect(all).toHaveLength(1)
    expect(all[0].cause).toEqual({ kind: 'imperative' })
    const landed = await renderedSnapshot(page)
    expect(landed.zoom).toBeCloseTo(2, 4)
    expect(landed.center.x).toBeCloseTo(1200, 3)
    expect(landed.center.y).toBeCloseTo(900, 3)
  })

  test('initialViewport replaces the fitView fit at mount and reports nothing', async ({ page }) => {
    await open(page, '&fitView=1&initialViewport=900,0,2')
    const rendered = await renderedSnapshot(page)
    expect(rendered.zoom).toBeCloseTo(2, 4)
    expect(rendered.center.x).toBeCloseTo(900, 3)
    expect(rendered.center.y).toBeCloseTo(0, 3)
    expect(await events(page)).toEqual([])
    const handleView = await page.evaluate(() => window.__viewportHandle!.getViewport())
    expectSnapshotClose(handleView!, rendered)
  })

  test('a snapshot round-trips through setViewport', async ({ page }) => {
    await open(page, '&dwellMs=200')
    // Somewhere arbitrary, by user input (a wheel zoom anchored off-centre, so both the centre
    // and the zoom change), so the snapshot comes from a dwell.
    const canvas = page.locator('[data-testid="history-canvas"]')
    const box = (await canvas.boundingBox())!
    await clearEvents(page)
    await page.mouse.move(box.x + 230, box.y + 170)
    await page.mouse.wheel(0, -240)
    await expect.poll(async () => (await events(page)).filter((e) => e.type === 'dwell').length).toBe(1)
    const saved = (await events(page)).find((e) => e.type === 'dwell')!.viewport
    const savedTransform = await page.locator('[data-testid="graph-viewport"]').getAttribute('transform')
    expect(saved.zoom).not.toBeCloseTo(1, 2)

    // Go somewhere else, then restore.
    await page.evaluate(() => window.__viewportHandle!.setViewport({ center: { x: 1200, y: 900 }, zoom: 0.4 }, { silent: true }))
    await page.waitForTimeout(100)
    await page.evaluate(
      (vp) => window.__viewportHandle!.setViewport({ center: vp.center, zoom: vp.zoom }, { silent: true }),
      saved
    )
    await page.waitForTimeout(100)
    const restored = await page.evaluate(() => window.__viewportHandle!.getViewport())
    expectSnapshotClose(restored!, saved, 1e-6)
    const restoredTransform = await page.locator('[data-testid="graph-viewport"]').getAttribute('transform')
    const parse = (t: string | null) => t!.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number)
    parse(restoredTransform).forEach((v, i) => expect(v).toBeCloseTo(parse(savedTransform)[i], 6))
  })
})
