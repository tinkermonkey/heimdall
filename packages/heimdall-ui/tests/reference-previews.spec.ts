import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

test.describe('Reference Preview Cards', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const contextStudioPreviewDir = path.join(__dirname, '../../../example-context-studio/preview')
  const homelabPreviewDir = path.join(__dirname, '../../../example-homelab-dashboard/preview')

  // Get all preview HTML files from both reference designs
  const getPreviewFiles = (dir: string) => {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== '_base.css')
    return files.sort()
  }

  const contextStudioFiles = getPreviewFiles(contextStudioPreviewDir)
  const homelabFiles = getPreviewFiles(homelabPreviewDir)

  // Context Studio preview tests
  test.describe('Context Studio Previews', () => {
    contextStudioFiles.forEach((file) => {
      const testName = file.replace('.html', '')

      test(`${testName} visual snapshot`, async ({ page }) => {
        const filePath = path.join(contextStudioPreviewDir, file)
        await page.goto(`file://${filePath}`)

        // Wait for content to load
        await page.waitForLoadState('networkidle')

        // Capture snapshot with reasonable tolerance
        await expect(page).toHaveScreenshot(`context-studio/${testName}.png`, {
          maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
        })
      })
    })
  })

  // Homelab Dashboard preview tests
  test.describe('Homelab Dashboard Previews', () => {
    homelabFiles.forEach((file) => {
      const testName = file.replace('.html', '')

      test(`${testName} visual snapshot`, async ({ page }) => {
        const filePath = path.join(homelabPreviewDir, file)
        await page.goto(`file://${filePath}`)

        // Wait for content to load
        await page.waitForLoadState('networkidle')

        // Capture snapshot with reasonable tolerance
        await expect(page).toHaveScreenshot(`homelab/${testName}.png`, {
          maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
        })
      })
    })
  })

  test('preview file count validation', () => {
    // Should have at least 23 context studio preview cards and 4 homelab preview cards
    expect(contextStudioFiles.length).toBeGreaterThanOrEqual(23)
    expect(homelabFiles.length).toBeGreaterThanOrEqual(4)
  })
})
