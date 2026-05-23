import { Page } from '@playwright/test'
import path from 'path'
import { loadSelfHostedFonts, assertFontsLoaded, freezeAnimations, applyDarkCanvasMode } from './test-helpers'

const HARNESS_BASE = 'http://localhost:5173'

// Resolve design-reference/preview/ relative to this file's location (tests/utils/)
const DESIGN_REF_DIR = path.resolve(new URL('.', import.meta.url).pathname, '../../design-reference/preview')

/**
 * Navigate to the React component test harness for a given example.
 *
 * Injects self-hosted fonts, verifies they loaded, and freezes animations.
 * Used by both regression tests and design-comparison tests.
 */
export async function setupHarness(
  page: Page,
  exampleId: string,
  options: { darkCanvas?: boolean } = {}
): Promise<void> {
  await page.goto(`${HARNESS_BASE}/?example=${exampleId}`)
  await page.waitForLoadState('networkidle')
  await loadSelfHostedFonts(page)
  await assertFontsLoaded(page)
  if (options.darkCanvas) {
    await applyDarkCanvasMode(page)
  }
  await freezeAnimations(page)
}

/**
 * Navigate to a design-reference HTML preview file.
 *
 * Fonts are loaded via the file's own @font-face declarations in
 * design-reference/colors_and_type.css — no injection needed.
 */
export async function setupDesignRef(page: Page, filename: string): Promise<void> {
  const filePath = `file://${path.join(DESIGN_REF_DIR, filename)}`
  await page.goto(filePath)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await freezeAnimations(page)
}
