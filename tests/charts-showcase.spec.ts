import { test, expect } from '@playwright/test'
import {
  freezeAnimations,
  loadSelfHostedFonts,
  assertFontsLoaded,
  applyDarkCanvasMode,
  removeDarkCanvasMode,
} from './utils/test-helpers'

test.describe('Chart Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=charts')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)
  })

  test.afterEach(async ({ page }) => {
    await removeDarkCanvasMode(page)
  })

  // ── Smoke ──────────────────────────────────────────────────────────────────
  test('page loads with chart SVGs', async ({ page }) => {
    const svgs = page.locator('svg')
    expect(await svgs.count()).toBeGreaterThan(10)
  })

  // ── Sparkline ──────────────────────────────────────────────────────────────
  test.describe('Sparkline', () => {
    test('renders all canonical hex-color variants', async ({ page }) => {
      for (let i = 0; i < 6; i++) {
        const el = page.locator(`svg[data-testid="sparkline-${i}"]`)
        await expect(el).toBeVisible()
      }
    })

    test('renders StatusColor backward-compat variants', async ({ page }) => {
      for (const c of ['emerald', 'amber', 'rose', 'cyan', 'neutral']) {
        await expect(page.locator(`svg[data-testid="sparkline-${c}"]`)).toBeVisible()
      }
    })

    test('uses path elements (not polylines)', async ({ page }) => {
      const sparkline = page.locator('svg[data-testid="sparkline-0"]')
      const paths = sparkline.locator('path')
      // area fill path + line path = 2
      expect(await paths.count()).toBe(2)
      expect(await sparkline.locator('polyline').count()).toBe(0)
    })

    test('no-area variant has one path', async ({ page }) => {
      const sparkline = page.locator('svg[data-testid="sparkline-no-area"]')
      expect(await sparkline.locator('path').count()).toBe(1)
    })

    test('area fill uses linearGradient', async ({ page }) => {
      const sparkline = page.locator('svg[data-testid="sparkline-0"]')
      await expect(sparkline.locator('linearGradient')).toHaveCount(1)
    })

    test('default dimensions are 88×28', async ({ page }) => {
      const sparkline = page.locator('svg[data-testid="sparkline-0"]')
      await expect(sparkline).toHaveAttribute('width', '88')
      await expect(sparkline).toHaveAttribute('height', '28')
    })
  })

  // ── LineChart ──────────────────────────────────────────────────────────────
  test.describe('LineChart', () => {
    test('micro renders without axes', async ({ page }) => {
      const el = page.locator('svg[data-testid="linechart-micro"]')
      await expect(el).toBeVisible()
      // no axis lines (no `line` elements)
      expect(await el.locator('line').count()).toBe(0)
    })

    test('standard renders with axes, grid and threshold', async ({ page }) => {
      const el = page.locator('svg[data-testid="linechart-standard"]')
      await expect(el).toBeVisible()
      // grid + axes lines
      expect(await el.locator('line').count()).toBeGreaterThan(0)
      // threshold dashed line exists
      const dashed = el.locator('line[stroke-dasharray]')
      expect(await dashed.count()).toBeGreaterThan(0)
    })

    test('standard uses path not polyline for series', async ({ page }) => {
      const el = page.locator('svg[data-testid="linechart-standard"]')
      expect(await el.locator('path[stroke]').count()).toBeGreaterThan(0)
      expect(await el.locator('polyline').count()).toBe(0)
    })

    test('feature renders multi-series with markers', async ({ page }) => {
      const el = page.locator('svg[data-testid="linechart-feature"]')
      await expect(el).toBeVisible()
      // amber marker dot
      const dots = el.locator('circle[fill="#F59E0B"]')
      expect(await dots.count()).toBeGreaterThan(0)
    })

    test('area fill uses linearGradient', async ({ page }) => {
      const el = page.locator('svg[data-testid="linechart-standard"]')
      expect(await el.locator('linearGradient').count()).toBeGreaterThan(0)
    })

    test('dark canvas variant is visible', async ({ page }) => {
      await expect(page.locator('svg[data-testid="linechart-dark"]')).toBeVisible()
    })
  })

  // ── BarV ───────────────────────────────────────────────────────────────────
  test.describe('BarV', () => {
    test('micro renders rect bars', async ({ page }) => {
      const el = page.locator('svg[data-testid="barv-micro"]')
      await expect(el).toBeVisible()
      expect(await el.locator('rect').count()).toBeGreaterThan(0)
    })

    test('standard renders axes + threshold line', async ({ page }) => {
      const el = page.locator('svg[data-testid="barv-standard"]')
      await expect(el).toBeVisible()
      const dashed = el.locator('line[stroke-dasharray]')
      expect(await dashed.count()).toBeGreaterThan(0)
    })

    test('bar rects have non-zero height', async ({ page }) => {
      const el = page.locator('svg[data-testid="barv-micro"]')
      const bars = el.locator('rect')
      for (let i = 0; i < await bars.count(); i++) {
        const h = parseFloat(await bars.nth(i).getAttribute('height') ?? '0')
        expect(h).toBeGreaterThan(0)
      }
    })
  })

  // ── BarH ───────────────────────────────────────────────────────────────────
  test.describe('BarH', () => {
    test('standard renders with bars and labels', async ({ page }) => {
      const el = page.locator('svg[data-testid="barh-standard"]')
      await expect(el).toBeVisible()
      expect(await el.locator('rect').count()).toBeGreaterThan(0)
      expect(await el.locator('text').count()).toBeGreaterThan(0)
    })

    test('feature renders wider than standard', async ({ page }) => {
      const std  = page.locator('svg[data-testid="barh-standard"]')
      const feat = page.locator('svg[data-testid="barh-feature"]')
      const wStd  = parseInt(await std.getAttribute('width')  ?? '0')
      const wFeat = parseInt(await feat.getAttribute('width') ?? '0')
      expect(wFeat).toBeGreaterThan(wStd)
    })
  })

  // ── StackedBar ─────────────────────────────────────────────────────────────
  test.describe('StackedBar', () => {
    test('standard renders multi-color rect stacks', async ({ page }) => {
      const el = page.locator('svg[data-testid="stackedbar-standard"]')
      await expect(el).toBeVisible()
      expect(await el.locator('rect').count()).toBeGreaterThan(7)
    })

    test('normalized variant has percentage y-labels', async ({ page }) => {
      const el = page.locator('svg[data-testid="stackedbar-normalized"]')
      await expect(el).toBeVisible()
      const texts = el.locator('text')
      let hasPercent = false
      for (let i = 0; i < await texts.count(); i++) {
        const t = await texts.nth(i).textContent()
        if (t?.includes('%')) { hasPercent = true; break }
      }
      expect(hasPercent).toBe(true)
    })
  })

  // ── Donut ──────────────────────────────────────────────────────────────────
  test.describe('Donut', () => {
    test('micro renders arc paths', async ({ page }) => {
      const el = page.locator('svg[data-testid="donut-micro"]')
      await expect(el).toBeVisible()
      expect(await el.locator('path').count()).toBeGreaterThan(0)
    })

    test('standard shows center value text', async ({ page }) => {
      const el = page.locator('svg[data-testid="donut-standard"]')
      const texts = el.locator('text')
      let hasValue = false
      for (let i = 0; i < await texts.count(); i++) {
        const t = await texts.nth(i).textContent()
        if (t?.includes('267')) { hasValue = true; break }
      }
      expect(hasValue).toBe(true)
    })

    test('paths have valid d attributes (no NaN)', async ({ page }) => {
      const el = page.locator('svg[data-testid="donut-standard"]')
      const paths = el.locator('path')
      for (let i = 0; i < await paths.count(); i++) {
        const d = await paths.nth(i).getAttribute('d') ?? ''
        expect(d).not.toContain('NaN')
        expect(d.length).toBeGreaterThan(0)
      }
    })

    test('single full-circle slice renders visible path', async ({ page }) => {
      const el = page.locator('svg[data-testid="donut-single"]')
      await expect(el).toBeVisible()
      const paths = el.locator('path')
      expect(await paths.count()).toBeGreaterThan(0)
      const d = await paths.first().getAttribute('d') ?? ''
      expect(d).not.toContain('NaN')
      expect(d.length).toBeGreaterThan(10)
    })
  })

  // ── Heatmap ────────────────────────────────────────────────────────────────
  test.describe('Heatmap', () => {
    test('standard renders 7×24 = 168 cells', async ({ page }) => {
      const el = page.locator('svg[data-testid="heatmap-standard"]')
      await expect(el).toBeVisible()
      // 7 rows × 24 cols
      expect(await el.locator('rect').count()).toBe(168)
    })

    test('feature renders with axis labels', async ({ page }) => {
      const el = page.locator('svg[data-testid="heatmap-feature"]')
      await expect(el).toBeVisible()
      expect(await el.locator('text').count()).toBeGreaterThan(0)
    })

    test('cell fills are non-empty hex colors', async ({ page }) => {
      const el = page.locator('svg[data-testid="heatmap-standard"]')
      const cells = el.locator('rect')
      const fill = await cells.first().getAttribute('fill') ?? ''
      expect(fill).toMatch(/^#[0-9a-fA-F]{8}$/)
    })
  })

  // ── StatusTimeline ─────────────────────────────────────────────────────────
  test.describe('StatusTimeline', () => {
    test('standard renders 4 track labels', async ({ page }) => {
      const el = page.locator('svg[data-testid="timeline-standard"]')
      await expect(el).toBeVisible()
      const texts = el.locator('text')
      const labels = ['graph daemon', 'pubmed_genes', 'nyx.lab', 'vega.lab']
      for (const lab of labels) {
        let found = false
        for (let i = 0; i < await texts.count(); i++) {
          if ((await texts.nth(i).textContent())?.includes(lab)) { found = true; break }
        }
        expect(found).toBe(true)
      }
    })

    test('feature renders amber event marker', async ({ page }) => {
      const el = page.locator('svg[data-testid="timeline-feature"]')
      await expect(el).toBeVisible()
      const markerDot = el.locator('circle[fill="#F59E0B"]')
      expect(await markerDot.count()).toBeGreaterThan(0)
    })

    test('segment rects use semantic status colors', async ({ page }) => {
      const el = page.locator('svg[data-testid="timeline-standard"]')
      const rects = el.locator('rect')
      const fills = new Set<string>()
      for (let i = 0; i < await rects.count(); i++) {
        const f = await rects.nth(i).getAttribute('fill') ?? ''
        if (f) fills.add(f)
      }
      // Should include ok (#10B981), warn (#F59E0B), error (#F43F5E)
      expect([...fills].some(f => f === '#10B981')).toBe(true)
      expect([...fills].some(f => f === '#F59E0B')).toBe(true)
      expect([...fills].some(f => f === '#F43F5E')).toBe(true)
    })
  })

  // ── ProgressBar ────────────────────────────────────────────────────────────
  test.describe('ProgressBar', () => {
    test('renders all percent variants', async ({ page }) => {
      for (const id of ['progress-0','progress-25','progress-50','progress-75','progress-100']) {
        await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible()
      }
    })

    test('0% bar has empty fill', async ({ page }) => {
      const fill = page.locator('[data-testid="progress-0"] .progress-bar__fill')
      const w = await fill.evaluate((el: HTMLElement) => el.style.width)
      expect(parseFloat(w)).toBe(0)
    })

    test('100% bar has full fill', async ({ page }) => {
      const fill = page.locator('[data-testid="progress-100"] .progress-bar__fill')
      const w = await fill.evaluate((el: HTMLElement) => el.style.width)
      expect(parseFloat(w)).toBe(100)
    })

    test('NaN defaults to 0', async ({ page }) => {
      const fill = page.locator('[data-testid="progress-nan"] .progress-bar__fill')
      const w = await fill.evaluate((el: HTMLElement) => el.style.width)
      expect(parseFloat(w)).toBe(0)
    })

    test('has WAI-ARIA progressbar attributes', async ({ page }) => {
      const el = page.locator('[data-testid="progress-50"]')
      await expect(el).toHaveAttribute('role', 'progressbar')
      await expect(el).toHaveAttribute('aria-valuenow', '50')
      await expect(el).toHaveAttribute('aria-valuemin', '0')
      await expect(el).toHaveAttribute('aria-valuemax', '100')
    })
  })

  // ── MetricRow ──────────────────────────────────────────────────────────────
  test.describe('MetricRow', () => {
    test('renders all four rows', async ({ page }) => {
      for (const id of ['metric-row-cpu','metric-row-memory','metric-row-network','metric-row-error']) {
        await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible()
      }
    })

    test('each row has a sparkline SVG', async ({ page }) => {
      const rows = page.locator('.metric-row')
      for (let i = 0; i < await rows.count(); i++) {
        expect(await rows.nth(i).locator('svg').count()).toBeGreaterThan(0)
      }
    })
  })

  // ── Visual Regression — Light Canvas ──────────────────────────────────────
  test.describe('Visual Regression — Light Canvas', () => {
    test('Sparkline snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="sparkline-emerald"]')).toHaveScreenshot('sparkline-light.png')
    })

    test('LineChart standard snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="linechart-standard"]')).toHaveScreenshot('linechart-standard-light.png')
    })

    test('LineChart feature snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="linechart-feature"]')).toHaveScreenshot('linechart-feature-light.png')
    })

    test('BarV standard snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="barv-standard"]')).toHaveScreenshot('barv-standard-light.png')
    })

    test('BarH standard snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="barh-standard"]')).toHaveScreenshot('barh-standard-light.png')
    })

    test('StackedBar standard snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="stackedbar-standard"]')).toHaveScreenshot('stackedbar-standard-light.png')
    })

    test('Donut standard snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="donut-standard"]')).toHaveScreenshot('donut-standard-light.png')
    })

    test('Heatmap standard snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="heatmap-standard"]')).toHaveScreenshot('heatmap-standard-light.png')
    })

    test('StatusTimeline standard snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="timeline-standard"]')).toHaveScreenshot('timeline-standard-light.png')
    })

    test('MetricRow snapshot', async ({ page }) => {
      await expect(page.locator('.metric-row').first()).toHaveScreenshot('metric-row-light.png')
    })
  })

  // ── Visual Regression — Dark Canvas ───────────────────────────────────────
  test.describe('Visual Regression — Dark Canvas', () => {
    test.beforeEach(async ({ page }) => {
      await applyDarkCanvasMode(page)
    })

    test('Sparkline dark snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="sparkline-emerald"]')).toHaveScreenshot('sparkline-dark.png')
    })

    test('LineChart dark snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="linechart-dark"]')).toHaveScreenshot('linechart-dark.png')
    })

    test('BarV dark snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="barv-standard"]')).toHaveScreenshot('barv-standard-dark.png')
    })

    test('BarH dark snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="barh-standard"]')).toHaveScreenshot('barh-standard-dark.png')
    })

    test('StackedBar dark snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="stackedbar-standard"]')).toHaveScreenshot('stackedbar-standard-dark.png')
    })

    test('Donut dark snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="donut-standard"]')).toHaveScreenshot('donut-standard-dark.png')
    })

    test('Heatmap dark snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="heatmap-standard"]')).toHaveScreenshot('heatmap-standard-dark.png')
    })

    test('StatusTimeline dark snapshot', async ({ page }) => {
      await expect(page.locator('svg[data-testid="timeline-standard"]')).toHaveScreenshot('timeline-standard-dark.png')
    })

    test('MetricRow dark snapshot', async ({ page }) => {
      await expect(page.locator('.metric-row').first()).toHaveScreenshot('metric-row-dark.png')
    })
  })
})
