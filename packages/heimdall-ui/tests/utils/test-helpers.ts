import { Page, expect } from '@playwright/test'

/**
 * Inject CSS to freeze animations during testing
 * Ensures consistent screenshots by disabling animation-play-state
 */
export async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      * {
        animation-play-state: paused !important;
        transition-duration: 0s !important;
      }
    `,
  })
}

/**
 * Assert that fonts are loaded and available
 * Checks that @font-face declarations are present in the page
 */
export async function assertFontsLoaded(page: Page): Promise<void> {
  const fontFaces = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets)
    const fontFaceRules: string[] = []

    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || [])
        for (const rule of rules) {
          if (rule instanceof CSSFontFaceRule) {
            fontFaceRules.push((rule as any).family)
          }
        }
      } catch {
        // Cross-origin stylesheets may throw on access
      }
    }

    return fontFaceRules
  })

  // Verify that both Inter and JetBrains Mono font families are declared
  expect(fontFaces.join(',')).toContain('Inter')
  expect(fontFaces.join(',')).toContain('JetBrains Mono')
}

/**
 * Apply dark-canvas mode to the page
 * Adds the 'dark-canvas' class to the body element
 */
export async function applyDarkCanvasMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.body.classList.add('dark-canvas')
  })
}

/**
 * Remove dark-canvas mode from the page
 * Removes the 'dark-canvas' class from the body element
 */
export async function removeDarkCanvasMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.body.classList.remove('dark-canvas')
  })
}

/**
 * Get computed CSS variable value
 * Useful for asserting that tokens are correctly applied
 */
export async function getCSSVariableValue(
  page: Page,
  variableName: string,
  selector: string = ':root'
): Promise<string> {
  return await page.evaluate(
    ([varName, sel]) => {
      const element =
        sel === ':root'
          ? document.documentElement
          : document.querySelector(sel)
      if (!element) return ''
      return getComputedStyle(element).getPropertyValue(varName).trim()
    },
    [variableName, selector]
  )
}

/**
 * Assert that dark canvas tokens are correctly applied by default
 */
export async function assertDarkCanvasTokens(page: Page): Promise<void> {
  const canvasBg = await getCSSVariableValue(page, '--canvas-bg')
  const shellBg = await getCSSVariableValue(page, '--shell-bg')

  expect(canvasBg).toBe('#14191f')
  expect(shellBg).toBe('#0b0f14')
}

/**
 * Assert that accent color is orange (not cyan)
 */
export async function assertOrangeAccent(page: Page): Promise<void> {
  const accentPrimary = await getCSSVariableValue(page, '--accent-primary')

  // Should be orange, not cyan
  expect(accentPrimary).not.toContain('22d3ee') // cyan
  expect(accentPrimary).toContain('f97316') // orange-500
}
