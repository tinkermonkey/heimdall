import { Page, expect } from '@playwright/test'

/**
 * Load self-hosted fonts (WOFF2) for tests
 * Instead of relying on Google Fonts CDN, this loads fonts from /fonts directory
 * Required by ADR-005 for offline CI environments and consistency
 */
export async function loadSelfHostedFonts(page: Page): Promise<void> {
  const fontsCss = `
    /* Inter — 300, 400, 500, 600, 700, 800, 900 */
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter/Inter-Light.woff2') format('woff2');
      font-weight: 300;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter/Inter-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter/Inter-Medium.woff2') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter/Inter-SemiBold.woff2') format('woff2');
      font-weight: 600;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter/Inter-Bold.woff2') format('woff2');
      font-weight: 700;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter/Inter-ExtraBold.woff2') format('woff2');
      font-weight: 800;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter/Inter-Black.woff2') format('woff2');
      font-weight: 900;
      font-style: normal;
      font-display: block;
    }

    /* JetBrains Mono — 400, 500, 600 */
    @font-face {
      font-family: 'JetBrains Mono';
      src: url('/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'JetBrains Mono';
      src: url('/fonts/jetbrains-mono/JetBrainsMono-Medium.woff2') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'JetBrains Mono';
      src: url('/fonts/jetbrains-mono/JetBrainsMono-SemiBold.woff2') format('woff2');
      font-weight: 600;
      font-style: normal;
      font-display: block;
    }
  `

  await page.addStyleTag({ content: fontsCss })
}

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
            const fontFamily = rule.style.fontFamily
            if (fontFamily) {
              fontFaceRules.push(fontFamily.replace(/['"]/g, ''))
            }
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
 * Assert that light canvas tokens are correctly applied by default
 */
export async function assertLightCanvasTokens(page: Page): Promise<void> {
  const canvasBg = await getCSSVariableValue(page, '--canvas-bg')
  const shellBg = await getCSSVariableValue(page, '--shell-bg')

  // Token system uses RGB channel format
  expect(canvasBg.trim()).toBe('255 255 255')
  expect(shellBg.trim()).toBe('11 15 20')
}

/**
 * Assert that accent color is cyan (not orange)
 */
export async function assertCyanAccent(page: Page): Promise<void> {
  const accentPrimary = await getCSSVariableValue(page, '--accent-primary')

  // Should be cyan, not orange (RGB channel format)
  expect(accentPrimary.trim()).toBe('34 211 238')
}
