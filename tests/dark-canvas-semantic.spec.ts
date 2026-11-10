import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

// Issue #329: --semantic-* and --status-{ok,warn,error}-{bg,fg} need explicit
// body.dark-canvas values, or consumers render light pastels on the dark canvas.
const URL = 'http://localhost:5173/?example=semantic-tokens'

test.describe('semantic tokens: Chip, FormCallout, ActivityTimeline, VersionPill', () => {
  test('light canvas snapshot', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('semantic-tokens-light-canvas.png', { fullPage: true })
  })

  test('dark canvas snapshot', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await applyDarkCanvasMode(page)
    await freezeAnimations(page)

    await expect(page).toHaveScreenshot('semantic-tokens-dark-canvas.png', { fullPage: true })
  })

  test('dark canvas: every semantic and status token has a dark value', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')

    const read = () =>
      page.evaluate(() => {
        const names = [
          ...['cyan', 'amber', 'violet', 'emerald', 'rose', 'neutral', 'id-tag'].flatMap((h) =>
            ['fg', 'bg', 'border'].map((s) => `--semantic-${h}-${s}`),
          ),
          '--semantic-version-fg',
          ...['ok', 'warn', 'error'].flatMap((h) => [`--status-${h}-bg`, `--status-${h}-fg`]),
        ]
        const cs = getComputedStyle(document.body)
        return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]))
      })

    const light = await read()
    await applyDarkCanvasMode(page)
    const dark = await read()

    for (const name of Object.keys(light)) {
      expect(dark[name], `${name} has no body.dark-canvas override`).not.toBe(light[name])
    }
  })

  test('dark canvas: kind label and neutral tokens are not light pastels', async ({ page }) => {
    await page.goto(URL)
    await page.waitForLoadState('networkidle')
    await applyDarkCanvasMode(page)

    const bg = await page
      .locator('.activity-timeline__kind-label')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    const [r, g, b] = bg.match(/\d+/g)!.map(Number)
    // Relative luminance proxy: a dark-canvas tint stays well below mid-grey.
    expect((r + g + b) / 3).toBeLessThan(80)
  })
})
