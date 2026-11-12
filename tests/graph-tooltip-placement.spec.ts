import { test, expect, type Page } from '@playwright/test'

// Regression for tinkermonkey/heimdall#323: GraphCanvas's hover edgeTooltip was pinned above the
// edge path midpoint, which is where the edge label is drawn, so the card covered the label it
// explains; it never picked another side, and its 200ms show delay was hard-coded. Geometry
// assertions only (no screenshot baselines), so the spec is platform-independent.
const URL = '/?example=graph-tooltip-placement'
const CANVAS = '[data-testid="tooltip-placement-canvas"]'
const DELAY_MS = 600 // GraphTooltipPlacementTestPage's tooltipDelay
const GAP = 6 // GraphCanvas's tooltip offset

type Box = { x: number; y: number; width: number; height: number }

const intersects = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

// Playwright's boundingBox of the SVG label rect includes half its stroke, so the visible gap is a
// little under the 6px GraphCanvas leaves from the rect's geometry.
const expectGap = (gap: number) => {
  expect(gap).toBeGreaterThanOrEqual(GAP - 1.5)
  expect(gap).toBeLessThanOrEqual(GAP + 1)
}

const hoverEdge =(page: Page, id: string) =>
  page.locator(`${CANVAS} [data-testid="graph-edge-${id}"]`).dispatchEvent('pointerover')

async function shownTooltip(page: Page) {
  const tooltip = page.locator(`${CANVAS} [role="tooltip"]`)
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toHaveAttribute('data-placement', /.+/)
  return tooltip
}

const box = async (page: Page, selector: string): Promise<Box> => {
  const b = await page.locator(selector).boundingBox()
  expect(b, selector).not.toBeNull()
  return b!
}

test.describe('GraphCanvas hover tooltip placement (#323)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL)
    await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'idle')
    await expect(page.locator(`${CANVAS} g.graph-canvas-node`)).toHaveCount(4)
    await page.evaluate(() => document.fonts.ready)
  })

  test('edge tooltip waits for tooltipDelay before showing', async ({ page }) => {
    const tooltip = page.locator(`${CANVAS} [role="tooltip"]`)
    const start = Date.now()
    await hoverEdge(page, 'bottom')
    await page.waitForTimeout(DELAY_MS / 2)
    await expect(tooltip).toHaveCount(0)
    await expect(tooltip).toBeVisible({ timeout: DELAY_MS * 4 })
    expect(Date.now() - start).toBeGreaterThanOrEqual(DELAY_MS)
  })

  test('node tooltip uses the same tooltipDelay', async ({ page }) => {
    const tooltip = page.locator(`${CANVAS} [role="tooltip"]`)
    await page.locator(`${CANVAS} [data-testid="graph-node-c"]`).dispatchEvent('pointerover')
    await page.waitForTimeout(DELAY_MS / 2)
    await expect(tooltip).toHaveCount(0)
    await expect(tooltip).toBeVisible({ timeout: DELAY_MS * 4 })
  })

  test('labelled edge: tooltip sits above the label without covering it', async ({ page }) => {
    await hoverEdge(page, 'bottom')
    const tooltip = await shownTooltip(page)
    await expect(tooltip).toHaveAttribute('data-placement', 'top')
    const card = (await tooltip.boundingBox())!
    const label = await box(page, `${CANVAS} [data-testid="graph-edge-bottom"] .graph-edge__label-bg`)
    expect(intersects(card, label)).toBe(false)
    expectGap(label.y - (card.y + card.height))
    // Centred on the label.
    expect(card.x + card.width / 2).toBeCloseTo(label.x + label.width / 2, 0)
  })

  test('labelled edge near the canvas top: tooltip flips below the label', async ({ page }) => {
    await hoverEdge(page, 'top')
    const tooltip = await shownTooltip(page)
    await expect(tooltip).toHaveAttribute('data-placement', 'bottom')
    const card = (await tooltip.boundingBox())!
    const label = await box(page, `${CANVAS} [data-testid="graph-edge-top"] .graph-edge__label-bg`)
    const canvas = await box(page, CANVAS)
    expect(intersects(card, label)).toBe(false)
    expectGap(card.y - (label.y + label.height))
    expect(card.y).toBeGreaterThanOrEqual(canvas.y)
    expect(card.y + card.height).toBeLessThanOrEqual(canvas.y + canvas.height)
  })

  test('labelled vertical edge: tooltip clears the label and stays inside the canvas', async ({ page }) => {
    await hoverEdge(page, 'left')
    const tooltip = await shownTooltip(page)
    const card = (await tooltip.boundingBox())!
    const label = await box(page, `${CANVAS} [data-testid="graph-edge-left"] .graph-edge__label-bg`)
    const canvas = await box(page, CANVAS)
    expect(intersects(card, label)).toBe(false)
    expect(card.x).toBeGreaterThanOrEqual(canvas.x)
    expect(card.x + card.width).toBeLessThanOrEqual(canvas.x + canvas.width)
  })

  test('unlabelled edge: tooltip anchors at the path midpoint', async ({ page }) => {
    const mid = await page.locator(`${CANVAS} [data-testid="graph-edge-unlabelled"] .graph-edge__line`).evaluate((el) => {
      const path = el as SVGPathElement
      const p = path.getPointAtLength(path.getTotalLength() / 2)
      const m = path.getScreenCTM()!
      return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f }
    })
    await hoverEdge(page, 'unlabelled')
    const tooltip = await shownTooltip(page)
    const placement = await tooltip.getAttribute('data-placement')
    const card = (await tooltip.boundingBox())!
    if (placement === 'top' || placement === 'bottom') {
      const edgeY = placement === 'top' ? card.y + card.height : card.y
      expect(Math.abs(edgeY - mid.y)).toBeLessThanOrEqual(GAP + 2)
      expect(card.x).toBeLessThanOrEqual(mid.x)
      expect(card.x + card.width).toBeGreaterThanOrEqual(mid.x)
    } else {
      const edgeX = placement === 'left' ? card.x + card.width : card.x
      expect(Math.abs(edgeX - mid.x)).toBeLessThanOrEqual(GAP + 2)
      expect(card.y).toBeLessThanOrEqual(mid.y)
      expect(card.y + card.height).toBeGreaterThanOrEqual(mid.y)
    }
  })

  test('tooltip stays clear of the label while the canvas zooms', async ({ page }) => {
    await hoverEdge(page, 'bottom')
    const tooltip = await shownTooltip(page)
    const before = (await tooltip.boundingBox())!
    // Zoom in around a point left of the label, so the label stays in view but moves.
    const start = await box(page, `${CANVAS} [data-testid="graph-edge-bottom"] .graph-edge__label-bg`)
    await page.locator(CANVAS).evaluate((el, at) => {
      el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, ctrlKey: true, deltaY: -100, clientX: at.x, clientY: at.y }))
    }, { x: start.x - 100, y: start.y })
    await expect
      .poll(async () => {
        const after = await tooltip.boundingBox()
        return after ? Math.hypot(after.x - before.x, after.y - before.y) > 1 : false
      })
      .toBe(true)
    const card = (await tooltip.boundingBox())!
    const label = await box(page, `${CANVAS} [data-testid="graph-edge-bottom"] .graph-edge__label-bg`)
    expect(intersects(card, label)).toBe(false)
  })
})

// layout="layer-lanes": links are hovered by their lane link id, which is also the predicate
// pill's data-link-id, so a link with a pill anchors to the pill; with pills off, to the curve.
test.describe('GraphCanvas hover tooltip placement, layer-lanes (#323)', () => {
  const LANES = '[data-testid="layer-lanes"]'
  const open = async (page: Page, labels: 'all' | 'off') => {
    await page.goto(`/?example=layer-lanes&labels=${labels}&tooltip=1`)
    await expect(page.locator(LANES)).toHaveAttribute('data-layout-state', 'idle')
    await expect(page.locator(`${LANES} g.graph-lane-link`).first()).toBeAttached()
    await page.evaluate(() => document.fonts.ready)
  }
  const shown = async (page: Page) => {
    const tooltip = page.locator(`${LANES} [role="tooltip"]`)
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveAttribute('data-placement', /.+/)
    return tooltip
  }

  test('link with a predicate pill: tooltip sits beside the pill without covering it', async ({ page }) => {
    await open(page, 'all')
    const pills = page.locator(`${LANES} .graph-lane-pill`)
    expect(await pills.count()).toBeGreaterThan(0)
    // A pill well inside the canvas, so the card has room on its preferred side.
    const canvas = await box(page, LANES)
    const ids = await pills.evaluateAll(
      (els, c) =>
        els
          .map((el) => ({ id: el.getAttribute('data-link-id')!, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.top > c.y + 120 && r.bottom < c.y + c.height - 120 && r.left > c.x + 160 && r.right < c.x + c.width - 160)
          .map(({ id }) => id),
      canvas,
    )
    expect(ids.length).toBeGreaterThan(0)
    const id = ids[0]
    await page.locator(`${LANES} g.graph-lane-link[data-link-id="${id}"]`).dispatchEvent('pointerover')
    const tooltip = await shown(page)
    await expect(tooltip).toHaveAttribute('data-placement', 'top')
    const card = (await tooltip.boundingBox())!
    const pill = await box(page, `${LANES} .graph-lane-pill[data-link-id="${id}"] .graph-lane-pill__bg`)
    expect(intersects(card, pill)).toBe(false)
    expectGap(pill.y - (card.y + card.height))
  })

  test('link without a pill: tooltip anchors on the link curve', async ({ page }) => {
    await open(page, 'off')
    await expect(page.locator(`${LANES} .graph-lane-pill`)).toHaveCount(0)
    const canvas = await box(page, LANES)
    // A link whose curve is well inside the canvas.
    const id = await page.locator(`${LANES} g.graph-lane-link`).evaluateAll((els, c) => {
      const inner = els.find((el) => {
        const r = el.querySelector('.graph-lane-link__line')!.getBoundingClientRect()
        return r.top > c.y + 120 && r.bottom < c.y + c.height - 40 && r.left > c.x + 160 && r.right < c.x + c.width - 160
      })
      return inner?.getAttribute('data-link-id') ?? null
    }, canvas)
    expect(id).not.toBeNull()
    const link = page.locator(`${LANES} g.graph-lane-link[data-link-id="${id}"]`)
    await link.dispatchEvent('pointerover')
    const tooltip = await shown(page)
    await expect(tooltip).toHaveAttribute('data-placement', 'top')
    const card = (await tooltip.boundingBox())!
    // The anchor point: centred under the card, one gap below it. It must lie on the curve.
    const anchor = { x: card.x + card.width / 2, y: card.y + card.height + GAP }
    const distance = await link.locator('.graph-lane-link__line').evaluate((el, a) => {
      const path = el as SVGPathElement
      const m = path.getScreenCTM()!
      const total = path.getTotalLength()
      let best = Infinity
      for (let i = 0; i <= 400; i++) {
        const p = path.getPointAtLength((total * i) / 400)
        const x = m.a * p.x + m.c * p.y + m.e
        const y = m.b * p.x + m.d * p.y + m.f
        best = Math.min(best, Math.hypot(x - a.x, y - a.y))
      }
      return best
    }, anchor)
    expect(distance).toBeLessThanOrEqual(3)
  })
})
