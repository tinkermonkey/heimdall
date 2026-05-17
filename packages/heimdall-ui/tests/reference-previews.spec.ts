import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test.describe('Reference Preview Cards', () => {
  const previewDir = path.join(__dirname, '../../../example-context-studio/preview')

  // Get all preview HTML files
  const getPreviewFiles = () => {
    const files = fs.readdirSync(previewDir).filter((f) => f.endsWith('.html') && f !== '_base.css')
    return files.sort()
  }

  const previewFiles = getPreviewFiles()

  previewFiles.forEach((file) => {
    const testName = file.replace('.html', '')

    test(`${testName} visual snapshot`, async ({ page }) => {
      const filePath = path.join(previewDir, file)
      await page.goto(`file://${filePath}`)

      // Wait for content to load
      await page.waitForLoadState('networkidle')

      // Capture snapshot with reasonable tolerance
      await expect(page).toHaveScreenshot(`${testName}.png`, {
        maxDiffPixelRatio: 0.01, // Allow 1% pixel difference
      })
    })
  })

  test('preview file count validation', () => {
    // Should have at least 23 preview cards (excluding _base.css)
    expect(previewFiles.length).toBeGreaterThanOrEqual(23)
  })
})
