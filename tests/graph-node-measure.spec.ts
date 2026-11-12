import { test, expect } from '@playwright/test'

// Regression for tinkermonkey/heimdall#331: GraphCanvas sizes each node's <foreignObject> (and
// lays out and clips edges) from a hidden measurement pass. On a host with line-height 1.5 at
// 16px, the measured height used to include the line-height strut (20px node -> 24px box), and
// offsetWidth rounded fractional widths down, so labels ellipsized. Geometry assertions only (no
// screenshot baselines), so the spec is platform-independent.
const URL = '/?example=graph-node-measure'
const CANVAS = '[data-testid="node-measure-canvas"]'

const EDGES: Array<[string, string, string]> = [
  ['e1', 'a', 'b'],
  ['e2', 'c', 'a'],
  ['e3', 'd', 'a'],
  ['e4', 'e', 'b'],
  ['e5', 'f', 'c'],
  ['e6', 'd', 'f'],
]

test.describe('GraphCanvas node measurement (#331)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL)
    await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'idle')
    await expect(page.locator(`${CANVAS} g.graph-canvas-node`)).toHaveCount(6)
    await expect(page.locator('[data-testid="node-measure-margin-canvas"] g.graph-canvas-node')).toHaveCount(6)
    await page.evaluate(() => document.fonts.ready)
  })

  test('each foreignObject matches its rendered node, in world units', async ({ page }) => {
    const sizes = await page.locator(`${CANVAS} g.graph-canvas-node`).evaluateAll((gs) =>
      gs.map((g) => {
        const fo = g.querySelector('foreignObject')!
        const node = fo.querySelector('.graph-node') as HTMLElement
        const scale = (g as SVGGraphicsElement).getScreenCTM()!.a
        const r = node.getBoundingClientRect()
        return {
          id: g.getAttribute('data-node-id'),
          foW: Number(fo.getAttribute('width')),
          foH: Number(fo.getAttribute('height')),
          nodeW: r.width / scale,
          nodeH: r.height / scale,
        }
      }),
    )
    for (const s of sizes) {
      expect(Math.abs(s.foH - s.nodeH), `node ${s.id} height: fo ${s.foH} vs node ${s.nodeH}`).toBeLessThanOrEqual(0.5)
      // The box is the node's width rounded up, never down.
      expect(s.foW - s.nodeW, `node ${s.id} width: fo ${s.foW} vs node ${s.nodeW}`).toBeGreaterThanOrEqual(-0.01)
      expect(s.foW - s.nodeW, `node ${s.id} width: fo ${s.foW} vs node ${s.nodeW}`).toBeLessThan(1)
    }
  })

  test("a custom node's margins stay inside its foreignObject", async ({ page }) => {
    const MARGIN_CANVAS = '[data-testid="node-measure-margin-canvas"]'
    const CARD_MARGIN = 6 // GraphNodeMeasureTestPage's CARD_MARGIN
    await expect(page.locator(MARGIN_CANVAS)).toHaveAttribute('data-layout-state', 'idle')
    const boxes = await page.locator(`${MARGIN_CANVAS} g.graph-canvas-node`).evaluateAll((gs) =>
      gs.map((g) => {
        const fo = g.querySelector('foreignObject')!
        const card = fo.querySelector('.measure-margin-card') as HTMLElement
        const scale = (g as SVGGraphicsElement).getScreenCTM()!.a
        const f = fo.getBoundingClientRect()
        const c = card.getBoundingClientRect()
        return {
          id: g.getAttribute('data-node-id'),
          foW: Number(fo.getAttribute('width')),
          foH: Number(fo.getAttribute('height')),
          cardW: c.width / scale,
          cardH: c.height / scale,
          // How far the card's border box reaches past the foreignObject on the right and bottom.
          overRight: (c.right - f.right) / scale,
          overBottom: (c.bottom - f.bottom) / scale,
        }
      }),
    )
    expect(boxes).toHaveLength(6)
    for (const b of boxes) {
      expect(Math.abs(b.foH - (b.cardH + 2 * CARD_MARGIN)), `node ${b.id} height`).toBeLessThanOrEqual(0.5)
      expect(b.foW - (b.cardW + 2 * CARD_MARGIN), `node ${b.id} width`).toBeGreaterThanOrEqual(-0.01)
      expect(b.foW - (b.cardW + 2 * CARD_MARGIN), `node ${b.id} width`).toBeLessThan(1)
      expect(b.overRight, `node ${b.id} card clipped on the right`).toBeLessThanOrEqual(-CARD_MARGIN + 1)
      expect(b.overBottom, `node ${b.id} card clipped at the bottom`).toBeLessThanOrEqual(-CARD_MARGIN + 0.5)
    }
  })

  test('no node label is ellipsized, as rendered or held to its measured box', async ({ page }) => {
    const nodes = page.locator(`${CANVAS} g.graph-canvas-node`)
    const readLabels = () =>
      nodes.evaluateAll((gs) =>
        gs.map((g) => {
          const el = g.querySelector('.graph-node__label') as HTMLElement
          // scrollWidth/clientWidth round to integers and hide a fractional overflow, so compare
          // the text's own (unrounded) extent with the label box's.
          const range = document.createRange()
          range.selectNodeContents(el)
          return {
            text: el.textContent,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            textWidth: range.getBoundingClientRect().width,
            boxWidth: el.getBoundingClientRect().width,
          }
        }),
      )
    const check = (labels: Awaited<ReturnType<typeof readLabels>>, when: string) => {
      expect(labels).toHaveLength(6)
      for (const l of labels) {
        expect(l.scrollWidth, `label "${l.text}" is truncated ${when}`).toBeLessThanOrEqual(l.clientWidth)
        expect(l.textWidth, `label "${l.text}" overflows its box ${when}`).toBeLessThanOrEqual(l.boxWidth + 0.01)
      }
    }
    check(await readLabels(), 'as rendered')
    // Host CSS that makes the node fill its foreignObject (e.g. display:flex, as in the #331 report)
    // holds it to the measured width; a width rounded down then ellipsizes the label.
    await nodes.evaluateAll((gs) => {
      for (const g of gs) {
        const node = g.querySelector('.graph-node') as HTMLElement
        node.style.boxSizing = 'border-box'
        node.style.width = `${g.querySelector('foreignObject')!.getAttribute('width')}px`
      }
    })
    check(await readLabels(), 'at its measured width')
  })

  test('edge endpoints land on the node outline', async ({ page }) => {
    const results = await page.evaluate(
      ({ canvas, edges }) => {
        const root = document.querySelector(canvas)!
        const rectOf = (id: string) =>
          root.querySelector(`[data-testid="graph-node-${id}"] .graph-node`)!.getBoundingClientRect()
        // Unsigned distance from a point to a rectangle's outline (inside or outside).
        const toOutline = (p: DOMPoint, r: DOMRect) => {
          const dx = Math.max(r.left - p.x, 0, p.x - r.right)
          const dy = Math.max(r.top - p.y, 0, p.y - r.bottom)
          if (dx > 0 || dy > 0) return Math.hypot(dx, dy)
          return Math.min(p.x - r.left, r.right - p.x, p.y - r.top, r.bottom - p.y)
        }
        return edges.map(([id, source, target]) => {
          const path = root.querySelector(`[data-testid="graph-edge-${id}"] .graph-edge__line`) as SVGPathElement
          const ctm = path.getScreenCTM()!
          const len = path.getTotalLength()
          const start = path.getPointAtLength(0).matrixTransform(ctm)
          const end = path.getPointAtLength(len).matrixTransform(ctm)
          return {
            id,
            start: toOutline(start, rectOf(source)) / ctm.a,
            end: toOutline(end, rectOf(target)) / ctm.a,
          }
        })
      },
      { canvas: CANVAS, edges: EDGES },
    )
    for (const r of results) {
      expect(r.start, `edge ${r.id} start is ${r.start.toFixed(2)}px off the source outline`).toBeLessThanOrEqual(1)
      expect(r.end, `edge ${r.id} end is ${r.end.toFixed(2)}px off the target outline`).toBeLessThanOrEqual(1)
    }
  })
})
