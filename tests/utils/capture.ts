import { Page, Locator } from '@playwright/test'
import path from 'path'
import fs from 'fs'

export interface CaptureOptions {
  /**
   * CSS selector to clip the screenshot to (first match).
   * If omitted, captures the full page.
   */
  selector?: string
}

/**
 * Capture a screenshot of a specific element or the full page.
 *
 * Returns a Buffer for programmatic use (diff metrics, debug saves, custom
 * comparison). For snapshot assertion, prefer locator.toHaveScreenshot()
 * directly — this utility is for cases where you need the raw bytes.
 */
export async function captureRegion(page: Page, options: CaptureOptions = {}): Promise<Buffer> {
  if (options.selector) {
    const el: Locator = page.locator(options.selector).first()
    await el.waitFor({ state: 'visible' })
    return el.screenshot() as Promise<Buffer>
  }
  return page.screenshot({ fullPage: true }) as Promise<Buffer>
}

/**
 * Save a buffer to .scratch/ for debug inspection.
 * The .scratch/ directory is gitignored.
 */
export async function saveDebugScreenshot(buffer: Buffer, filename: string): Promise<void> {
  const scratchDir = path.resolve(new URL('.', import.meta.url).pathname, '../../.scratch')
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true })
  fs.writeFileSync(path.join(scratchDir, filename), buffer)
}
