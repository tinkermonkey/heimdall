import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode } from './utils/test-helpers'

test.describe('TraceViewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=trace-viewer')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
  })

  test('OTLP trace renders with the error span selected (light)', async ({ page }) => {
    const viewer = page.locator('[data-testid="trace-otlp"]')
    await expect(viewer).toBeVisible()
    // detail panel open + connector bus present
    await expect(viewer.locator('.trace-detail')).toBeVisible()
    await expect(viewer.locator('.trace-viewer__connectors')).toBeVisible()
    await freezeAnimations(page)
    await expect(viewer).toHaveScreenshot('trace-viewer-otlp.png', { maxDiffPixelRatio: 0.01 })
  })

  test('OTLP trace renders in dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const viewer = page.locator('[data-testid="trace-otlp"]')
    await expect(viewer).toBeVisible()
    await freezeAnimations(page)
    await expect(viewer).toHaveScreenshot('trace-viewer-otlp-dark.png', { maxDiffPixelRatio: 0.01 })
  })

  test('collapsed subtree renders without a selection', async ({ page }) => {
    const viewer = page.locator('[data-testid="trace-collapsed"]')
    await expect(viewer).toBeVisible()
    await freezeAnimations(page)
    await expect(viewer).toHaveScreenshot('trace-viewer-collapsed.png', { maxDiffPixelRatio: 0.01 })
  })

  test('AWS X-Ray trace renders with the fault span selected (light)', async ({ page }) => {
    const viewer = page.locator('[data-testid="trace-xray"]')
    await expect(viewer).toBeVisible()
    await expect(viewer.locator('.trace-detail__error')).toBeVisible()
    await freezeAnimations(page)
    await expect(viewer).toHaveScreenshot('trace-viewer-xray.png', { maxDiffPixelRatio: 0.01 })
  })

  test('AWS X-Ray trace renders in dark canvas', async ({ page }) => {
    await applyDarkCanvasMode(page)
    const viewer = page.locator('[data-testid="trace-xray"]')
    await expect(viewer).toBeVisible()
    await freezeAnimations(page)
    await expect(viewer).toHaveScreenshot('trace-viewer-xray-dark.png', { maxDiffPixelRatio: 0.01 })
  })

  test.describe('interactions', () => {
    test('clicking a tree row opens / repopulates the detail panel', async ({ page }) => {
      const viewer = page.locator('[data-testid="trace-collapsed"]')
      const firstRow = viewer.locator('.trace-viewer__tree-row').first()
      await firstRow.click()
      await expect(viewer.locator('.trace-detail')).toBeVisible()
      await expect(viewer.locator('.trace-detail__title')).toHaveText('POST /api/feedback/submit')
    })

    test('Escape closes the detail panel and the close button also works', async ({ page }) => {
      const viewer = page.locator('[data-testid="trace-otlp"]')
      await expect(viewer.locator('.trace-detail')).toBeVisible()
      // close button
      await viewer.locator('.trace-detail__close').click()
      await expect(viewer.locator('.trace-detail')).toHaveCount(0)
      // re-open by clicking a row, then close via Escape from the tree
      await viewer.locator('.trace-viewer__tree-row').first().click()
      await expect(viewer.locator('.trace-detail')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(viewer.locator('.trace-detail')).toHaveCount(0)
    })

    test('expanding a collapsed node reveals its children', async ({ page }) => {
      const viewer = page.locator('[data-testid="trace-collapsed"]')
      const before = await viewer.locator('.trace-viewer__tree-row').count()
      // the collapsed "feedback.create" node shows a +N badge; expand all via toolbar
      await viewer.locator('.trace-viewer__tool-btn').first().click()
      const after = await viewer.locator('.trace-viewer__tree-row').count()
      expect(after).toBeGreaterThan(before)
    })

    test('keyboard ArrowDown moves the selection', async ({ page }) => {
      const viewer = page.locator('[data-testid="trace-collapsed"]')
      await viewer.locator('.trace-viewer__tree-row').first().click()
      await page.keyboard.press('ArrowDown')
      await expect(viewer.locator('.trace-viewer__tree-row.is-selected')).toHaveCount(1)
      // selection is no longer the root
      await expect(viewer.locator('.trace-detail__title')).not.toHaveText('POST /api/feedback/submit')
    })

    test('long attribute keys/values truncate (no overlap) with a hover title', async ({ page }) => {
      const viewer = page.locator('[data-testid="trace-otlp"]')
      // span with a long SQL value + long attribute keys
      await viewer.locator('.trace-viewer__tree-row', { hasText: 'db.insert feedback' }).click()

      const valCell = viewer.locator('.trace-detail__kv-val', { hasText: 'INSERT INTO feedback' }).first()
      await expect(valCell).toBeVisible()
      // full value preserved for hover even though it is visually truncated
      await expect(valCell).toHaveAttribute('title', /INSERT INTO feedback/)
      await expect(valCell).toHaveCSS('white-space', 'nowrap')
      await expect(valCell).toHaveCSS('text-overflow', 'ellipsis')

      // no key cell may overlap its value cell in the ATTRIBUTES grid
      const overlaps = await viewer.evaluate((root) => {
        const sec = [...root.querySelectorAll('.trace-detail__section')].find(
          (s) => s.querySelector('.trace-detail__eyebrow')?.textContent === 'ATTRIBUTES'
        )
        if (!sec) return true
        const keys = [...sec.querySelectorAll('.trace-detail__kv-key')]
        const vals = [...sec.querySelectorAll('.trace-detail__kv-val')]
        return keys.some((k, i) => vals[i] && k.getBoundingClientRect().right > vals[i].getBoundingClientRect().left + 0.5)
      })
      expect(overlaps).toBe(false)
    })
  })
})
