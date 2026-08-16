import { Page, expect } from '@playwright/test'

export async function loadSelfHostedFonts(page: Page): Promise<void> {
  // Reference fonts through the dev server's same-origin /fonts/ URL (Vite serves
  // public/ at the site root) rather than an absolute file:// path. file:// URLs are
  // both fragile to compute (see git history of this line) and blocked outright by
  // Chromium when referenced from an http(s) page ("Not allowed to load local resource").
  const fontsCss = `
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
  // Checking for @font-face *rule declarations* only proves loadSelfHostedFonts()
  // injected CSS text - it says nothing about whether the browser actually
  // fetched and decoded the font files. Check document.fonts entries directly
  // so a broken font URL (e.g. a bad path) fails loudly instead of silently
  // falling back to a system font.
  const loadedFamilies = await page.evaluate(async () => {
    await document.fonts.ready
    const loaded = new Set<string>()
    for (const face of document.fonts) {
      if (face.status === 'loaded') {
        loaded.add(face.family.replace(/['"]/g, ''))
      }
    }
    return Array.from(loaded)
  })

  expect(loadedFamilies).toContain('Inter')
  expect(loadedFamilies).toContain('JetBrains Mono')
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
  expect(shellBg.trim()).toBe('15 23 41')
}

export async function assertAmberAccent(page: Page): Promise<void> {
  const accentPrimary = await getCSSVariableValue(page, '--accent-primary')

  expect(accentPrimary.trim()).toBe('251 191 36')
}
