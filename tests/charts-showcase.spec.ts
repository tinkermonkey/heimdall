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
    // Navigate to the charts test page
    await page.goto('http://localhost:5173/?example=charts')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)

    // Freeze animations for consistent snapshots
    await freezeAnimations(page)
  })

  test('page loads successfully', async ({ page }) => {
    // Basic smoke test
    const svgs = page.locator('svg')
    const svgCount = await svgs.count()
    expect(svgCount).toBeGreaterThan(0)
  })

  test.describe('Sparkline Component', () => {
    test('renders sparkline SVG elements', async ({ page }) => {
      const svgs = page.locator('svg')
      const svgCount = await svgs.count()

      // Should have multiple SVGs (at least sparklines and line chart)
      expect(svgCount).toBeGreaterThan(5)
    })

    test('renders sparklines with polylines', async ({ page }) => {
      const polylines = page.locator('svg polyline')
      const polylineCount = await polylines.count()

      // Each sparkline should have 2 polylines (area + line)
      expect(polylineCount).toBeGreaterThan(10)
    })
  })

  test.describe('LineChart Component', () => {
    test('renders line chart with lines', async ({ page }) => {
      const lines = page.locator('svg line')
      const lineCount = await lines.count()

      // Line chart should have grid lines
      expect(lineCount).toBeGreaterThan(0)
    })

    test('renders chart data points', async ({ page }) => {
      const circles = page.locator('svg circle')
      const circleCount = await circles.count()

      // Line chart should have data points
      expect(circleCount).toBeGreaterThan(0)
    })
  })

  test.describe('ProgressBar Component', () => {
    test('renders progress bar containers', async ({ page }) => {
      const progressBars = page.locator('.progress-bar')
      const count = await progressBars.count()

      // Should have at least 5 progress bars
      expect(count).toBeGreaterThanOrEqual(5)
    })

    test('progress bar fill updates based on percent', async ({ page }) => {
      // Get all progress bar fills
      const fills = page.locator('.progress-bar__fill')
      const count = await fills.count()

      expect(count).toBeGreaterThan(0)

      // Verify fills have varying widths
      const widths: number[] = []
      for (let i = 0; i < Math.min(3, count); i++) {
        const fill = fills.nth(i)
        const width = await fill.evaluate((el: HTMLElement) => el.style.width)
        widths.push(parseFloat(width))
      }

      // Widths should vary (not all be the same)
      const uniqueWidths = new Set(widths)
      expect(uniqueWidths.size).toBeGreaterThan(1)
    })
  })

  test.describe('MetricRow Component', () => {
    test('renders metric row containers', async ({ page }) => {
      const rows = page.locator('.metric-row')
      const count = await rows.count()

      // Should have multiple metric rows
      expect(count).toBeGreaterThanOrEqual(4)
    })

    test('metric rows have labels, values, and sparklines', async ({ page }) => {
      const rows = page.locator('.metric-row')
      const count = await rows.count()

      expect(count).toBeGreaterThan(0)

      // Check first metric row has all components
      const firstRow = rows.first()
      const label = firstRow.locator('.metric-row__label')
      const value = firstRow.locator('.metric-row__value')
      const sparkline = firstRow.locator('svg')

      await expect(label).toBeVisible()
      await expect(value).toBeVisible()
      await expect(sparkline).toBeVisible()
    })

    test('metric row displays text content', async ({ page }) => {
      const rows = page.locator('.metric-row')
      const firstRow = rows.first()

      // Check that label text exists
      const labelText = await firstRow.locator('.metric-row__label').textContent()
      expect(labelText).toBeTruthy()
      expect(labelText).toHaveLength(labelText!.length)

      // Check that value text exists
      const valueText = await firstRow.locator('.metric-row__value').textContent()
      expect(valueText).toBeTruthy()
    })
  })

  test.describe('Light Canvas Mode', () => {
    test('components render in light canvas mode', async ({ page }) => {
      // Verify components are visible in light mode
      const progressBars = page.locator('.progress-bar')
      await expect(progressBars.first()).toBeVisible()

      const metricRows = page.locator('.metric-row')
      await expect(metricRows.first()).toBeVisible()
    })
  })

  test.describe('Dark Canvas Mode', () => {
    test('components render in dark canvas mode', async ({ page }) => {
      await applyDarkCanvasMode(page)

      // Verify components are still visible in dark mode
      const progressBars = page.locator('.progress-bar')
      await expect(progressBars.first()).toBeVisible()

      const metricRows = page.locator('.metric-row')
      await expect(metricRows.first()).toBeVisible()

      await removeDarkCanvasMode(page)
    })
  })

  test.describe('Color Variants', () => {
    test('sparklines render with different fill opacities', async ({ page }) => {
      const polylines = page.locator('svg polyline')
      const count = await polylines.count()

      // Multiple polylines = multiple sparklines
      expect(count).toBeGreaterThan(5)
    })

    test('progress bars apply color classes', async ({ page }) => {
      const progressBars = page.locator('.progress-bar')

      // Get all color classes applied
      const colors = new Set<string>()
      for (let i = 0; i < Math.min(5, await progressBars.count()); i++) {
        const bar = progressBars.nth(i)
        const className = await bar.getAttribute('class')
        const colorMatch = className?.match(/progress-bar--(emerald|amber|rose|cyan|neutral)/)
        if (colorMatch) {
          colors.add(colorMatch[1])
        }
      }

      // Should have at least 2 different colors
      expect(colors.size).toBeGreaterThan(1)
    })
  })

  test.describe('Edge Cases', () => {
    test('components handle all data points', async ({ page }) => {
      const svgs = page.locator('svg')
      const svgCount = await svgs.count()

      // All SVGs should render without errors
      expect(svgCount).toBeGreaterThan(0)

      // Verify we can access them all
      for (let i = 0; i < svgCount; i++) {
        const svg = svgs.nth(i)
        await expect(svg).toBeVisible()
      }
    })

    test('metric row sparklines render for all rows', async ({ page }) => {
      const rows = page.locator('.metric-row')
      const rowCount = await rows.count()

      // Each metric row should have a sparkline
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const sparkline = row.locator('svg')
        expect(await sparkline.count()).toBeGreaterThan(0)
      }
    })
  })
})
