import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { loadSelfHostedFonts, freezeAnimations } from './utils/test-helpers'

test.describe('Reference Preview Cards', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const contextStudioPreviewDir = path.join(__dirname, '../../../example-context-studio/preview')
  const homelabPreviewDir = path.join(__dirname, '../../../example-homelab-dashboard/preview')

  const getPreviewFiles = (dir: string) => {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== '_base.css')
    return files.sort()
  }

  const contextStudioFiles = getPreviewFiles(contextStudioPreviewDir)
  const homelabFiles = getPreviewFiles(homelabPreviewDir)

  test.describe('Context Studio Previews', () => {
    contextStudioFiles.forEach((file) => {
      const testName = file.replace('.html', '')

      test(`${testName} visual snapshot`, async ({ page }) => {
        const filePath = path.join(contextStudioPreviewDir, file)
        await page.goto(`file://${filePath}`)

        await page.waitForLoadState('networkidle')
        await loadSelfHostedFonts(page)
        await freezeAnimations(page)

        await expect(page).toHaveScreenshot(`${testName}.png`, {
          maxDiffPixelRatio: 0.01,
        })
      })
    })
  })

  test.describe('Homelab Dashboard Previews', () => {
    homelabFiles.forEach((file) => {
      const testName = file.replace('.html', '')

      test(`${testName} visual snapshot`, async ({ page }) => {
        const filePath = path.join(homelabPreviewDir, file)
        await page.goto(`file://${filePath}`)

        // Wait for content to load
        await page.waitForLoadState('networkidle')

        // Load self-hosted fonts (required by ADR-005 for offline CI and consistency)
        await loadSelfHostedFonts(page)

        // Freeze animations for consistent snapshots
        await freezeAnimations(page)

        // Capture snapshot with 1% tolerance (perfectly matching requirement)
        await expect(page).toHaveScreenshot(`homelab/${testName}.png`, {
          maxDiffPixelRatio: 0.01,
        })
      })
    })
  })

  test('preview file count validation', () => {
    expect(contextStudioFiles.length).toBeGreaterThanOrEqual(23)
    expect(homelabFiles.length).toBeGreaterThanOrEqual(4)
  })
})
