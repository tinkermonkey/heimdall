import { Page, expect } from '@playwright/test'

export async function loadSelfHostedFonts(page: Page): Promise<void> {
  const fontsBaseDir = new URL('../../../../public/fonts', import.meta.url).pathname
  const fontsCss = `
    @font-face {
      font-family: 'Inter';
      src: url('file://${fontsBaseDir}/inter/Inter-Light.woff2') format('woff2');
      font-weight: 300;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('file://${fontsBaseDir}/inter/Inter-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('file://${fontsBaseDir}/inter/Inter-Medium.woff2') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('file://${fontsBaseDir}/inter/Inter-SemiBold.woff2') format('woff2');
      font-weight: 600;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('file://${fontsBaseDir}/inter/Inter-Bold.woff2') format('woff2');
      font-weight: 700;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('file://${fontsBaseDir}/inter/Inter-ExtraBold.woff2') format('woff2');
      font-weight: 800;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Inter';
      src: url('file://${fontsBaseDir}/inter/Inter-Black.woff2') format('woff2');
      font-weight: 900;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'JetBrains Mono';
      src: url('file://${fontsBaseDir}/jetbrains-mono/JetBrainsMono-Regular.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'JetBrains Mono';
      src: url('file://${fontsBaseDir}/jetbrains-mono/JetBrainsMono-Medium.woff2') format('woff2');
      font-weight: 500;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'JetBrains Mono';
      src: url('file://${fontsBaseDir}/jetbrains-mono/JetBrainsMono-SemiBold.woff2') format('woff2');
      font-weight: 600;
      font-style: normal;
      font-display: block;
    }
  `

  await page.addStyleTag({ content: fontsCss })

  // Wait for fonts to be loaded and rendered
  await page.evaluate(() => {
    return document.fonts.ready
  })
}

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

  expect(fontFaces.join(',')).toContain('Inter')
  expect(fontFaces.join(',')).toContain('JetBrains Mono')
}

export async function applyDarkCanvasMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.body.classList.add('dark-canvas')
  })
}

export async function removeDarkCanvasMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.body.classList.remove('dark-canvas')
  })
}

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

export async function assertLightCanvasTokens(page: Page): Promise<void> {
  const canvasBg = await getCSSVariableValue(page, '--canvas-bg')
  const shellBg = await getCSSVariableValue(page, '--shell-bg')

  expect(canvasBg.trim()).toBe('255 255 255')
  expect(shellBg.trim()).toBe('11 15 20')
}

export async function assertCyanAccent(page: Page): Promise<void> {
  const accentPrimary = await getCSSVariableValue(page, '--accent-primary')

  expect(accentPrimary.trim()).toBe('34 211 238')
}
