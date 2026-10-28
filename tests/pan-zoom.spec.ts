import { test, expect, type Locator, type Page } from '@playwright/test'

// Behaviour tests for the shared usePanZoom hook, through the two components that use it.
// No screenshots: every assertion reads the viewport transform or the MapCanvas status line.

type Viewport = { zoom: number; x: number; y: number }

function parseMatrix(transform: string | null): Viewport {
  if (!transform) throw new Error('transform attribute missing')
  const inner = transform.match(/matrix\(([^)]+)\)/)
  if (!inner) throw new Error(`unexpected transform: ${transform}`)
  const [zoom, , , , x, y] = inner[1].split(',').map((s) => parseFloat(s.trim()))
  return { zoom, x, y }
}

// How far the world point under container-local point (px, py) moved between two viewports,
// in screen px at the first viewport's zoom. 0 means the point stayed under the cursor.
function anchorDrift(px: number, py: number, a: Viewport, b: Viewport): number {
  const dx = (px - a.x) / a.zoom - (px - b.x) / b.zoom
  const dy = (py - a.y) / a.zoom - (py - b.y) / b.zoom
  return Math.hypot(dx, dy) * a.zoom
}

test.describe('integration: usePanZoom', () => {
  test.describe('GraphCanvas', () => {
    let canvas: Locator
    let viewport: Locator

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:5173/?example=graph')
      await page.waitForLoadState('networkidle')
      await page.locator('[data-testid="fitview-view-button"]').click()
      canvas = page.locator('[data-testid="fitview-canvas"]')
      viewport = canvas.locator('[data-testid="graph-viewport"]')
      await expect(canvas).toBeVisible()
      // Wait for the initial fit to land.
      await expect.poll(async () => parseMatrix(await viewport.getAttribute('transform')).zoom).toBeLessThan(1)
    })

    // tinkermonkey/heimdall#306: the inertia glide started on pointer-up kept writing its own pan
    // every frame, overwriting the cursor-anchored pan the wheel had just set for the new zoom.
    test('wheel zoom during pan inertia keeps the point under the cursor fixed', async () => {
      const result = await canvas.evaluate(async (el) => {
        const vp = el.querySelector('[data-testid="graph-viewport"]')!
        const read = () => {
          const m = vp.getAttribute('transform')!.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number)
          return { zoom: m[0], x: m[4], y: m[5] }
        }
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
        const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))
        const rect = el.getBoundingClientRect()

        // A slow drag with ~16ms between moves, so the release velocity (and the glide) is
        // predictable: a few px per frame.
        let x = rect.left + 40
        let y = rect.top + 40
        const pointer = (type: string) =>
          new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0 })
        el.dispatchEvent(pointer('pointerdown'))
        for (let i = 0; i < 6; i++) {
          await wait(16)
          x += 4
          y += 2
          document.dispatchEvent(pointer('pointermove'))
        }
        document.dispatchEvent(pointer('pointerup'))

        // Let the glide slow down, and check it is still running.
        await wait(250)
        const gliding = read()
        for (let i = 0; i < 3; i++) await frame()
        const moving = read().x !== gliding.x || read().y !== gliding.y

        // Zoom in at the canvas centre while the glide runs: one wheel tick per frame.
        const cx = rect.width / 2
        const cy = rect.height / 2
        const wheel = () =>
          el.dispatchEvent(
            new WheelEvent('wheel', {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + cx,
              clientY: rect.top + cy,
              deltaY: -100,
            })
          )
        const before = read()
        wheel()
        for (let i = 0; i < 4; i++) {
          await frame()
          wheel()
        }
        // Give the old glide plenty of frames to overwrite the anchored pan.
        await wait(200)
        return { moving, before, after: read(), cx, cy }
      })

      expect(result.moving).toBe(true)
      expect(result.after.zoom).toBeGreaterThan(result.before.zoom * 1.5)
      // Before the fix this was hundreds of px. A few px of slack covers one glide frame landing
      // between reading `before` and the first wheel event.
      expect(anchorDrift(result.cx, result.cy, result.before, result.after)).toBeLessThan(5)
    })

    // tinkermonkey/heimdall#306 (secondary): wheel events that arrive within one frame all read
    // zoom/pan from refs synced after commit, so all but the last were dropped.
    test('wheel events within one frame compound', async () => {
      const result = await canvas.evaluate(async (el) => {
        const vp = el.querySelector('[data-testid="graph-viewport"]')!
        const read = () => {
          const m = vp.getAttribute('transform')!.match(/matrix\(([^)]+)\)/)![1].split(',').map(Number)
          return { zoom: m[0], x: m[4], y: m[5] }
        }
        const rect = el.getBoundingClientRect()
        const cx = rect.width / 2
        const cy = rect.height / 2
        const before = read()
        for (let i = 0; i < 5; i++) {
          el.dispatchEvent(
            new WheelEvent('wheel', {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + cx,
              clientY: rect.top + cy,
              deltaY: -100,
            })
          )
        }
        await new Promise((r) => setTimeout(r, 200))
        return { before, after: read(), cx, cy }
      })

      // Each pixel-mode tick of deltaY -100 is a factor of 2^0.2, so five compound to 2x.
      expect(result.after.zoom / result.before.zoom).toBeCloseTo(2, 3)
      expect(anchorDrift(result.cx, result.cy, result.before, result.after)).toBeLessThan(0.5)
    })

    // tinkermonkey/heimdall#302: keyboard zoom scaled about the top-left corner of the canvas.
    test('+ and - zoom about the view centre by a fixed factor', async ({ page }) => {
      // fv_controls sits at the centroid of the other nodes, so the fit puts it at the view centre.
      const node = canvas.locator('[data-testid="graph-node-fv_controls"]')
      const nodeCentre = async () => {
        const b = await node.boundingBox()
        if (!b) throw new Error('fv_controls not visible')
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
      }
      const size = await canvas.evaluate((el) => ({ w: el.clientWidth, h: el.clientHeight }))
      const before = parseMatrix(await viewport.getAttribute('transform'))
      const node0 = await nodeCentre()

      await canvas.focus()
      await page.keyboard.press('+')
      await expect.poll(async () => parseMatrix(await viewport.getAttribute('transform')).zoom).toBeGreaterThan(before.zoom)
      const zoomedIn = parseMatrix(await viewport.getAttribute('transform'))

      expect(anchorDrift(size.w / 2, size.h / 2, before, zoomedIn)).toBeLessThan(0.5)
      await expect.poll(async () => Math.hypot((await nodeCentre()).x - node0.x, (await nodeCentre()).y - node0.y)).toBeLessThan(2)
      expect(zoomedIn.zoom / before.zoom).toBeCloseTo(1.2, 3)

      await page.keyboard.press('-')
      await expect.poll(async () => parseMatrix(await viewport.getAttribute('transform')).zoom).toBeLessThan(zoomedIn.zoom)
      const zoomedOut = parseMatrix(await viewport.getAttribute('transform'))
      expect(anchorDrift(size.w / 2, size.h / 2, before, zoomedOut)).toBeLessThan(0.5)
      expect(zoomedOut.zoom).toBeCloseTo(before.zoom, 3)
    })
  })

  test.describe('MapCanvas', () => {
    async function readStatus(page: Page) {
      const text = (await page.locator(':text("Center:")').textContent()) ?? ''
      const m = text.match(/Center: ([-\d.]+), ([-\d.]+) \| Zoom: ([\d.]+)/)
      if (!m) throw new Error(`unexpected status: ${text}`)
      return { lat: Number(m[1]), lng: Number(m[2]), zoom: Number(m[3]) }
    }

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:5173/?example=map-canvas')
      await page.waitForLoadState('networkidle')
    })

    // tinkermonkey/heimdall#302: pressing + moved the reported centre north-east.
    test('+ and - keep the reported centre fixed', async ({ page }) => {
      const before = await readStatus(page)
      expect(before.zoom).toBe(1)

      await page.locator('.map-canvas').focus()
      await page.keyboard.press('+')
      await expect.poll(async () => (await readStatus(page)).zoom).toBeGreaterThan(1)

      const zoomedIn = await readStatus(page)
      expect(Math.abs(zoomedIn.lat - before.lat)).toBeLessThan(0.001)
      expect(Math.abs(zoomedIn.lng - before.lng)).toBeLessThan(0.001)
      expect(zoomedIn.zoom).toBe(1.2)

      await page.keyboard.press('-')
      await expect.poll(async () => (await readStatus(page)).zoom).toBe(1)
      const zoomedOut = await readStatus(page)
      expect(Math.abs(zoomedOut.lat - before.lat)).toBeLessThan(0.001)
      expect(Math.abs(zoomedOut.lng - before.lng)).toBeLessThan(0.001)
    })
  })
})
