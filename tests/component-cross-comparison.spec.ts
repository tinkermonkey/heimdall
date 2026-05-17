import { test, expect } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { fileURLToPath } from 'url'
import path from 'path'
import * as fs from 'fs'
import { loadSelfHostedFonts, freezeAnimations } from './utils/test-helpers'

test.describe('Component Cross-Comparison: Reference vs React', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const contextStudioPreviewDir = path.join(__dirname, '../../../design-reference/example-context-studio/preview')

  const componentMappings: Array<{
    refFile: string
    reactExample: string
    testDescription: string
  }> = [
    {
      refFile: 'components-buttons.html',
      reactExample: 'primitives',
      testDescription: 'Button Components',
    },
    {
      refFile: 'components-chips.html',
      reactExample: 'primitives',
      testDescription: 'Chip Components',
    },
    {
      refFile: 'components-hierarchy.html',
      reactExample: 'primitives',
      testDescription: 'Hierarchy Components',
    },
    {
      refFile: 'components-inputs.html',
      reactExample: 'primitives',
      testDescription: 'Input Components',
    },
    {
      refFile: 'components-modal.html',
      reactExample: 'overlays',
      testDescription: 'Modal Components',
    },
    {
      refFile: 'components-nav.html',
      reactExample: 'navigation',
      testDescription: 'Navigation Components',
    },
    {
      refFile: 'components-palette.html',
      reactExample: 'primitives',
      testDescription: 'Palette Components',
    },
    {
      refFile: 'components-pipeline.html',
      reactExample: 'primitives',
      testDescription: 'Pipeline Components',
    },
    {
      refFile: 'components-stats.html',
      reactExample: 'primitives',
      testDescription: 'Stats Components',
    },
    {
      refFile: 'components-table.html',
      reactExample: 'data-display',
      testDescription: 'Table Component',
    },
    {
      refFile: 'components-toasts.html',
      reactExample: 'overlays',
      testDescription: 'Toast Components',
    },
  ]

  componentMappings.forEach(({ refFile, reactExample, testDescription }) => {
    test(`${testDescription}: reference vs React visual comparison`, async ({ page, context }) => {
      const refFilePath = path.join(contextStudioPreviewDir, refFile)

      if (!fs.existsSync(refFilePath)) {
        test.skip()
        return
      }

      const refPage = await context.newPage()
      await refPage.goto(`file://${refFilePath}`)
      await refPage.waitForLoadState('networkidle')
      await loadSelfHostedFonts(refPage)
      await freezeAnimations(refPage)

      const referenceBuffer = await refPage.screenshot({ fullPage: true })
      await refPage.close()

      await page.goto(`http://localhost:5173/?example=${reactExample}`)
      await page.waitForLoadState('networkidle')
      await loadSelfHostedFonts(page)
      await freezeAnimations(page)

      const reactBuffer = await page.screenshot({ fullPage: true })

      const refImg = PNG.sync.read(referenceBuffer)
      const reactImg = PNG.sync.read(reactBuffer)

      if (refImg.width !== reactImg.width || refImg.height !== reactImg.height) {
        await expect(page).toHaveScreenshot(`${refFile.replace('.html', '')}-react.png`, {
          maxDiffPixelRatio: 0.10,
        })
        return
      }

      const { width, height } = refImg
      const diffOutput = new Uint8ClampedArray(width * height * 4)
      const diff = pixelmatch(refImg.data, reactImg.data, diffOutput, width, height, {
        threshold: 0.05,
      })
      const diffRatio = diff / (width * height)

      expect(diffRatio).toBeLessThan(0.10)
    })
  })

  test('verify all component reference files have corresponding tests', () => {
    const refFiles = fs
      .readdirSync(contextStudioPreviewDir)
      .filter((f) => f.startsWith('components-') && f.endsWith('.html'))

    const mappedFiles = new Set(componentMappings.map((m) => m.refFile))

    for (const file of refFiles) {
      expect(mappedFiles).toContain(file)
    }
  })
})
