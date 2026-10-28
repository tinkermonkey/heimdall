import { test, expect, type Page } from '@playwright/test'

// GraphCanvas layout busy state (tinkermonkey/heimdall#307): data-layout-state, onLayoutStateChange,
// the "Laying out…" indicator, and the frame yielded before a layout runs. DOM and timing
// assertions only (no screenshot baselines), so the spec is platform-independent.
//
// The test page's "slow" layout blocks the main thread for SLOW_LAYOUT_MS, so nothing can be
// sampled while it runs. A recorder installed before the page loads logs every DOM mutation and
// every animation frame instead, and the assertions read that log afterwards.
const URL = 'http://localhost:5173/?example=graph-layout-busy'
const SLOW_LAYOUT_MS = 600
const INDICATOR_DELAY_MS = 150
const CANVAS = '[data-testid="busy-canvas"]'

interface Sample {
  t: number
  kind: 'frame' | 'mutation'
  state: string | null
  chip: boolean
  chipOpacity: number
  nodeTransform: string | null
  nodeVisibility: string | null
}

async function installRecorder(page: Page) {
  await page.addInitScript(() => {
    const samples: unknown[] = []
    const w = window as unknown as { __rec: { samples: unknown[]; reset: () => void } }
    w.__rec = { samples, reset: () => { samples.length = 0 } }
    const sample = (kind: 'frame' | 'mutation') => {
      const root = document.querySelector('[data-testid="busy-canvas"]')
      if (!root) return
      const chip = root.querySelector('[data-testid="graph-layout-indicator"]')
      const node = root.querySelector('[data-testid="graph-node-n7"]')
      samples.push({
        t: performance.now(),
        kind,
        state: root.getAttribute('data-layout-state'),
        chip: !!chip,
        chipOpacity: chip ? Number(getComputedStyle(chip).opacity) : 0,
        nodeTransform: node?.getAttribute('transform') ?? null,
        nodeVisibility: node ? getComputedStyle(node).visibility : null,
      })
    }
    const frame = () => { sample('frame'); requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
    const observe = () => {
      if (!document.body) { requestAnimationFrame(observe); return }
      new MutationObserver(() => sample('mutation')).observe(document.body, {
        subtree: true, childList: true, attributes: true, attributeFilter: ['data-layout-state'],
      })
    }
    observe()
  })
}

const samples = (page: Page) => page.evaluate(() => (window as unknown as { __rec: { samples: Sample[] } }).__rec.samples)
const resetRecorder = (page: Page) => page.evaluate(() => (window as unknown as { __rec: { reset: () => void } }).__rec.reset())

/** Consecutive distinct values of data-layout-state across the recording. */
const stateSequence = (s: Sample[]) => s.map(x => x.state).filter((v, i, a) => i === 0 || v !== a[i - 1])

/** [first sample with the chip, first sample without it after that], in ms. */
function chipLifetime(s: Sample[]) {
  const shown = s.findIndex(x => x.chip)
  if (shown < 0) return null
  const hidden = s.findIndex((x, i) => i > shown && !x.chip)
  return { shown: s[shown].t, hidden: hidden < 0 ? Infinity : s[hidden].t, index: shown, hiddenIndex: hidden }
}

async function gotoIdle(page: Page, query: string) {
  await page.goto(`${URL}${query}`)
  await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'idle', { timeout: 15000 })
}

test.describe('integration: GraphCanvas layout busy state', () => {
  test('initial slow layout reports computing then idle, hides unplaced nodes, and the fit frames every node', async ({ page }) => {
    await installRecorder(page)
    await gotoIdle(page, '&initial=slow')

    const s = await samples(page)
    expect(stateSequence(s.filter(x => x.state !== null))).toEqual(['computing', 'idle'])
    // onLayoutStateChange saw the same sequence, once each, with an inline callback.
    await expect(page.getByTestId('layout-state-log')).toHaveText('computing idle')
    // Before the first layout lands, nodes are hidden rather than drawn stacked at the origin.
    const computingFrames = s.filter(x => x.kind === 'frame' && x.state === 'computing' && x.nodeVisibility !== null)
    expect(computingFrames.length).toBeGreaterThan(0)
    for (const f of computingFrames) expect(f.nodeVisibility).toBe('hidden')

    // fitView still frames the laid-out graph (the mount fit waits for the deferred result).
    const canvas = (await page.locator(CANVAS).boundingBox())!
    const nodes = page.locator(`${CANVAS} [data-testid^="graph-node-"]`)
    await expect(nodes).toHaveCount(20)
    for (let i = 0; i < 20; i++) {
      const b = (await nodes.nth(i).boundingBox())!
      expect(b.x).toBeGreaterThanOrEqual(canvas.x - 1)
      expect(b.y).toBeGreaterThanOrEqual(canvas.y - 1)
      expect(b.x + b.width).toBeLessThanOrEqual(canvas.x + canvas.width + 1)
      expect(b.y + b.height).toBeLessThanOrEqual(canvas.y + canvas.height + 1)
    }
  })

  test('switching to a slow layout paints the busy state first, keeps the old positions, then goes idle', async ({ page }) => {
    await installRecorder(page)
    await gotoIdle(page, '&initial=fast')
    const before = await page.locator(`${CANVAS} [data-testid="graph-node-n7"]`).getAttribute('transform')
    await page.getByTestId('clear-log').click()
    await resetRecorder(page)

    await page.getByTestId('mode-slow').click()
    await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'idle', { timeout: 15000 })
    await expect(page.getByTestId('layout-state-log')).toHaveText('computing idle')

    const s = await samples(page)
    expect(stateSequence(s)).toEqual(['idle', 'computing', 'idle'])

    const life = chipLifetime(s)!
    expect(life).not.toBeNull()
    // The chip committed and at least one animation frame ran with it before the layout blocked,
    // so it was painted and its delayed fade-in started on the compositor...
    const framesWithChip = s.filter((x, i) => x.kind === 'frame' && i >= life.index && i < life.hiddenIndex)
    expect(framesWithChip.length).toBeGreaterThan(0)
    // ...and it stayed up past the indicator delay, so that fade-in completed.
    expect(life.hidden - life.shown).toBeGreaterThan(INDICATOR_DELAY_MS + 100)
    expect(life.hidden - life.shown).toBeGreaterThanOrEqual(SLOW_LAYOUT_MS)

    // No flash: while computing, the node stays visible where the previous layout put it.
    for (const f of s.filter(x => x.kind === 'frame' && x.state === 'computing')) {
      expect(f.nodeVisibility).toBe('visible')
      expect(f.nodeTransform).toBe(before)
    }
    // The new layout did land.
    expect(await page.locator(`${CANVAS} [data-testid="graph-node-n7"]`).getAttribute('transform')).not.toBe(before)
    await expect(page.getByTestId('graph-layout-indicator')).toHaveCount(0)
  })

  test('a fast layout never shows the chip', async ({ page }) => {
    await installRecorder(page)
    await gotoIdle(page, '&initial=slow')
    await page.getByTestId('clear-log').click()
    await resetRecorder(page)

    await page.getByTestId('mode-fast').click()
    await expect(page.getByTestId('layout-state-log')).toHaveText('computing idle')
    await page.waitForTimeout(300)

    const s = await samples(page)
    expect(stateSequence(s)).toEqual(['idle', 'computing', 'idle'])
    const life = chipLifetime(s)
    if (life) expect(life.hidden - life.shown).toBeLessThan(INDICATOR_DELAY_MS)
    for (const x of s) expect(x.chipOpacity).toBe(0)
  })

  test('the indicator is a polite status region that waits out the delay', async ({ page }) => {
    await gotoIdle(page, '&initial=galaxy')
    const region = page.locator(`${CANVAS} .graph-layout-indicator`)
    await expect(region).toHaveAttribute('role', 'status')
    await expect(region).toHaveAttribute('aria-live', 'polite')
    await expect(region).toBeEmpty()

    // Live simulation keeps the main thread free, so the chip can be inspected while it shows.
    await page.getByRole('button', { name: 'Enable live simulation' }).click()
    await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'simulating')
    const chip = page.getByRole('status').getByTestId('graph-layout-indicator')
    await expect(chip).toHaveText('Laying out…')
    expect(await chip.evaluate(el => getComputedStyle(el).animationDelay)).toBe(`${INDICATOR_DELAY_MS / 1000}s`)
  })

  test('galaxy live simulation reports simulating, and again while a dragged node re-settles', async ({ page }) => {
    await installRecorder(page)
    await gotoIdle(page, '&initial=galaxy')
    await page.getByTestId('clear-log').click()
    await resetRecorder(page)

    await page.getByRole('button', { name: 'Enable live simulation' }).click()
    await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'simulating')
    await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'idle', { timeout: 10000 })
    // The chip faded in while simulating (the main thread is free, so this samples real opacity).
    expect(Math.max(...(await samples(page)).map(x => x.chipOpacity))).toBeGreaterThan(0.5)

    const node = page.locator(`${CANVAS} [data-testid="graph-node-n4"]`)
    const box = (await node.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 40, { steps: 8 })
    await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'simulating')
    await page.mouse.up()
    await expect(page.locator(CANVAS)).toHaveAttribute('data-layout-state', 'idle', { timeout: 10000 })
    await expect(page.getByTestId('layout-state-log')).toHaveText('simulating idle simulating idle')
  })

  for (const position of ['top-left', 'top-center', 'top-right', 'right-center', 'bottom-right', 'bottom-center', 'bottom-left', 'left-center']) {
    test(`the chip clears a ${position} toolbar`, async ({ page }) => {
      await page.setViewportSize({ width: 420, height: 560 })
      await gotoIdle(page, `&initial=galaxy&toolbar=${position}`)
      await page.getByRole('button', { name: 'Enable live simulation' }).click()
      const chip = page.getByTestId('graph-layout-indicator')
      await expect(chip).toBeVisible()
      const a = (await chip.boundingBox())!
      const b = (await page.locator(`${CANVAS} .graph-toolbar`).boundingBox())!
      const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
      const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
      expect(overlapX <= 0 || overlapY <= 0).toBe(true)
    })
  }
})
