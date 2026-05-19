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

  test.afterEach(async ({ page }) => {
    // Ensure we exit dark canvas mode after each test
    await removeDarkCanvasMode(page)
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

    test('renders all color variant sparklines', async ({ page }) => {
      const colors = ['emerald', 'amber', 'rose', 'cyan', 'neutral']
      for (const color of colors) {
        const sparkline = page.locator(`svg[data-testid="sparkline-${color}"]`)
        await expect(sparkline).toBeVisible()
      }
    })

    test('renders edge case sparklines', async ({ page }) => {
      const singlePoint = page.locator('[data-testid="sparkline-single-point"]')
      const threePoints = page.locator('[data-testid="sparkline-three-points"]')
      const customSize = page.locator('[data-testid="sparkline-custom-size"]')

      await expect(singlePoint).toBeVisible()
      await expect(threePoints).toBeVisible()
      await expect(customSize).toBeVisible()
    })
  })

  test.describe('BarChart Component', () => {
    test('renders bar chart with rectangles', async ({ page }) => {
      const barChart = page.locator('[data-testid="bar-chart"]')
      await expect(barChart).toBeVisible()

      const bars = barChart.locator('svg rect')
      const barCount = await bars.count()

      // Bar chart should have data bars (not counting axis lines)
      expect(barCount).toBeGreaterThan(0)
    })

    test('renders bar chart with grid lines', async ({ page }) => {
      const barChart = page.locator('[data-testid="bar-chart"]')
      const gridLines = barChart.locator('svg line')
      const gridLineCount = await gridLines.count()

      // Bar chart should have grid lines
      expect(gridLineCount).toBeGreaterThan(0)
    })

    test('renders bar chart with legend', async ({ page }) => {
      const barChart = page.locator('[data-testid="bar-chart"]')
      const legend = barChart.locator('div').filter({ hasText: 'Series' })
      await expect(legend.first()).toBeVisible()
    })

    test('renders bar chart with x-axis labels', async ({ page }) => {
      const barChart = page.locator('[data-testid="bar-chart"]')
      const xLabels = barChart.locator('svg text')
      const xLabelCount = await xLabels.count()

      // Should have x-axis labels
      expect(xLabelCount).toBeGreaterThan(0)
    })

    test('bar chart handles empty data gracefully', async ({ page }) => {
      const emptyChart = page.locator('[data-testid="bar-chart-empty"]')
      // Empty chart should return null (no element in DOM)
      expect(await emptyChart.count()).toBe(0)
    })

    test('bar chart handles single data point', async ({ page }) => {
      const singleChart = page.locator('[data-testid="bar-chart-single"]')
      const bars = singleChart.locator('svg rect')
      const barCount = await bars.count()

      // Should render the single bar
      expect(barCount).toBeGreaterThan(0)

      // Bar should have reasonable width (not infinity or too wide)
      const bar = bars.first()
      const width = await bar.getAttribute('width')
      const widthNum = parseFloat(width || '0')
      expect(widthNum).toBeGreaterThan(0)
      expect(widthNum).toBeLessThan(100) // Should fit in viewBox
    })

    test('bar chart handles equal values without zero-height bars', async ({ page }) => {
      const equalChart = page.locator('[data-testid="bar-chart-equal"]')
      const bars = equalChart.locator('svg rect')
      const barCount = await bars.count()

      // Should render bars even with equal values
      expect(barCount).toBeGreaterThan(0)

      // All bars should have non-zero height
      for (let i = 0; i < barCount; i++) {
        const bar = bars.nth(i)
        const height = await bar.getAttribute('height')
        const heightNum = parseFloat(height || '0')
        expect(heightNum).toBeGreaterThan(0)
      }
    })
  })

  test.describe('PieChart Component', () => {
    test('renders pie chart with path segments', async ({ page }) => {
      const pieChart = page.locator('[data-testid="pie-chart"]')
      await expect(pieChart).toBeVisible()

      const paths = pieChart.locator('svg path')
      const pathCount = await paths.count()

      // Pie chart should have path segments for each slice
      expect(pathCount).toBeGreaterThan(0)
    })

    test('renders pie chart with legend', async ({ page }) => {
      const pieChart = page.locator('[data-testid="pie-chart"]')
      const legend = pieChart.locator('div').filter({ hasText: 'Component' })
      await expect(legend.first()).toBeVisible()
    })

    test('pie chart segments have correct attributes', async ({ page }) => {
      const pieChart = page.locator('[data-testid="pie-chart"]')
      const paths = pieChart.locator('svg path')

      // Each path should have a fill color
      const pathCount = await paths.count()
      for (let i = 0; i < pathCount; i++) {
        const path = paths.nth(i)
        const fill = await path.getAttribute('fill')
        expect(fill).toBeTruthy()
      }
    })

    test('pie chart handles empty segments gracefully', async ({ page }) => {
      const emptyChart = page.locator('[data-testid="pie-chart-empty"]')
      // Empty chart should return null (no element in DOM)
      expect(await emptyChart.count()).toBe(0)
    })

    test('pie chart handles zero and negative values correctly', async ({ page }) => {
      const zeroChart = page.locator('[data-testid="pie-chart-zero-negative"]')
      // Chart with all zero/negative should return null (no element in DOM)
      expect(await zeroChart.count()).toBe(0)
    })

    test('pie chart handles numeric values safely without NaN', async ({ page }) => {
      const numericChart = page.locator('[data-testid="pie-chart-numeric-safe"]')
      const paths = numericChart.locator('svg path')
      const pathCount = await paths.count()

      // Should render segments without NaN issues
      expect(pathCount).toBeGreaterThan(0)

      // All paths should have valid d attributes (not NaN)
      for (let i = 0; i < pathCount; i++) {
        const path = paths.nth(i)
        const d = await path.getAttribute('d')
        expect(d).toBeTruthy()
        // Path should not contain NaN
        expect(d).not.toContain('NaN')
      }
    })
  })

  test.describe('LineChart Component', () => {
    test('renders line chart with lines', async ({ page }) => {
      const lineChart = page.locator('[data-testid="line-chart"]')
      await expect(lineChart).toBeVisible()

      const lines = lineChart.locator('svg line')
      const lineCount = await lines.count()

      // Line chart should have grid lines
      expect(lineCount).toBeGreaterThan(0)
    })

    test('renders chart data points', async ({ page }) => {
      const lineChart = page.locator('[data-testid="line-chart"]')
      const circles = lineChart.locator('svg circle')
      const circleCount = await circles.count()

      // Line chart should have data points
      expect(circleCount).toBeGreaterThan(0)
    })

    test('renders line chart with legend', async ({ page }) => {
      const lineChart = page.locator('[data-testid="line-chart"]')
      const legend = lineChart.locator('div').filter({ hasText: 'Series' })
      await expect(legend.first()).toBeVisible()
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

    test('renders progress bars with correct percent values', async ({ page }) => {
      const progress0 = page.locator('[data-testid="progress-0"]')
      const progress50 = page.locator('[data-testid="progress-50"]')
      const progress100 = page.locator('[data-testid="progress-100"]')

      await expect(progress0).toBeVisible()
      await expect(progress50).toBeVisible()
      await expect(progress100).toBeVisible()

      // Verify 0% bar is empty
      const fill0 = progress0.locator('.progress-bar__fill')
      const width0 = await fill0.evaluate((el: HTMLElement) => el.style.width)
      expect(parseFloat(width0)).toBe(0)

      // Verify 100% bar is full
      const fill100 = progress100.locator('.progress-bar__fill')
      const width100 = await fill100.evaluate((el: HTMLElement) => el.style.width)
      expect(parseFloat(width100)).toBe(100)
    })

    test('has WAI-ARIA progressbar attributes', async ({ page }) => {
      const progress50 = page.locator('[data-testid="progress-50"]')

      // Verify role="progressbar" attribute exists
      await expect(progress50).toHaveAttribute('role', 'progressbar')

      // Verify aria-valuenow is set to percent value
      await expect(progress50).toHaveAttribute('aria-valuenow', '50')

      // Verify aria-valuemin is set to 0
      await expect(progress50).toHaveAttribute('aria-valuemin', '0')

      // Verify aria-valuemax is set to 100
      await expect(progress50).toHaveAttribute('aria-valuemax', '100')
    })

    test('handles NaN percent value gracefully', async ({ page }) => {
      const progressNaN = page.locator('[data-testid="progress-nan"]')

      await expect(progressNaN).toBeVisible()

      // Verify the fill width is 0% (NaN defaults to 0)
      const fill = progressNaN.locator('.progress-bar__fill')
      const width = await fill.evaluate((el: HTMLElement) => el.style.width)
      expect(parseFloat(width)).toBe(0)

      // Verify aria-valuenow is 0 when percent is NaN
      await expect(progressNaN).toHaveAttribute('aria-valuenow', '0')
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
      expect(labelText).toMatch(/CPU|Memory|Network|Error|Uptime/)

      // Check that value text exists
      const valueText = await firstRow.locator('.metric-row__value').textContent()
      expect(valueText).toBeTruthy()
    })

    test('renders all metric row variants with data-testid', async ({ page }) => {
      const cpuRow = page.locator('[data-testid="metric-row-cpu"]')
      const memoryRow = page.locator('[data-testid="metric-row-memory"]')
      const networkRow = page.locator('[data-testid="metric-row-network"]')
      const errorRow = page.locator('[data-testid="metric-row-error"]')

      await expect(cpuRow).toBeVisible()
      await expect(memoryRow).toBeVisible()
      await expect(networkRow).toBeVisible()
      await expect(errorRow).toBeVisible()
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
    test('sparklines render all color variants with correct styling', async ({ page }) => {
      const colors = ['emerald', 'amber', 'rose', 'cyan', 'neutral']
      for (const color of colors) {
        const svg = page.locator(`svg[data-testid="sparkline-${color}"]`)
        const polylines = svg.locator('polyline')

        // Each sparkline should have area and line polylines
        const count = await polylines.count()
        expect(count).toBe(2)
      }
    })

    test('progress bars apply correct color classes and render', async ({ page }) => {
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

      // Should have at least 5 different colors (all variants)
      expect(colors.size).toBe(5)
    })

    test('all sparkline color variants render without errors', async ({ page }) => {
      const colors = ['emerald', 'amber', 'rose', 'cyan', 'neutral']
      for (const color of colors) {
        const svg = page.locator(`svg[data-testid="sparkline-${color}"]`)

        // Verify SVG is visible (color is rendered)
        await expect(svg).toBeVisible()

        // Check that polylines have proper fill attributes
        const fills = svg.locator('polyline[fill]')
        const count = await fills.count()
        expect(count).toBeGreaterThan(0)
      }
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

  test.describe('Visual Regression - Light Canvas', () => {
    test('Sparkline component visual snapshot', async ({ page }) => {
      const sparkline = page.locator('svg[data-testid="sparkline-emerald"]')
      await expect(sparkline).toHaveScreenshot('sparkline-light.png')
    })

    test('BarChart component visual snapshot', async ({ page }) => {
      const barChart = page.locator('[data-testid="bar-chart"]')
      await expect(barChart).toHaveScreenshot('bar-chart-light.png')
    })

    test('PieChart component visual snapshot', async ({ page }) => {
      const pieChart = page.locator('[data-testid="pie-chart"]')
      await expect(pieChart).toHaveScreenshot('pie-chart-light.png')
    })

    test('LineChart component visual snapshot', async ({ page }) => {
      const lineChart = page.locator('[data-testid="line-chart"]')
      await expect(lineChart).toHaveScreenshot('line-chart-light.png')
    })

    test('ProgressBar component visual snapshot', async ({ page }) => {
      const progressBars = page.locator('.progress-bar').first()
      await expect(progressBars).toHaveScreenshot('progress-bar-light.png')
    })

    test('MetricRow component visual snapshot', async ({ page }) => {
      const metricRow = page.locator('.metric-row').first()
      await expect(metricRow).toHaveScreenshot('metric-row-light.png')
    })
  })

  test.describe('Visual Regression - Dark Canvas', () => {
    test.beforeEach(async ({ page }) => {
      await applyDarkCanvasMode(page)
    })

    test('Sparkline component visual snapshot in dark mode', async ({ page }) => {
      const sparkline = page.locator('svg[data-testid="sparkline-emerald"]')
      await expect(sparkline).toHaveScreenshot('sparkline-dark.png')
    })

    test('BarChart component visual snapshot in dark mode', async ({ page }) => {
      const barChart = page.locator('[data-testid="bar-chart"]')
      await expect(barChart).toHaveScreenshot('bar-chart-dark.png')
    })

    test('PieChart component visual snapshot in dark mode', async ({ page }) => {
      const pieChart = page.locator('[data-testid="pie-chart"]')
      await expect(pieChart).toHaveScreenshot('pie-chart-dark.png')
    })

    test('LineChart component visual snapshot in dark mode', async ({ page }) => {
      const lineChart = page.locator('[data-testid="line-chart"]')
      await expect(lineChart).toHaveScreenshot('line-chart-dark.png')
    })

    test('ProgressBar component visual snapshot in dark mode', async ({ page }) => {
      const progressBars = page.locator('.progress-bar').first()
      await expect(progressBars).toHaveScreenshot('progress-bar-dark.png')
    })

    test('MetricRow component visual snapshot in dark mode', async ({ page }) => {
      const metricRow = page.locator('.metric-row').first()
      await expect(metricRow).toHaveScreenshot('metric-row-dark.png')
    })
  })
})
