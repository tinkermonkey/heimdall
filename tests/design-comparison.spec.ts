/**
 * Design-comparison tests
 *
 * For each component, two paired snapshots are captured and stored:
 *
 *   {id}-design.png  — the HTML design-reference preview (source of truth)
 *   {id}-react.png   — the React implementation from the component test harness
 *
 * Both snapshots are tracked in version control. A test run fails when either
 * snapshot drifts from its stored baseline, signalling a change in the design
 * reference or the implementation that needs human review.
 *
 * To update baselines after an intentional change:
 *   npx playwright test design-comparison --update-snapshots
 *
 * Infrastructure shared with regression tests:
 *   tests/utils/page-setup.ts  — setupHarness() / setupDesignRef()
 *   tests/utils/capture.ts     — captureRegion() for programmatic buffer use
 */

import { test, expect } from '@playwright/test'
import { setupHarness, setupDesignRef } from './utils/page-setup'
import { FIXTURES } from './design-comparison/fixtures'

// Design reference HTML is 700px wide; use the same viewport for React captures
// so both screenshots have comparable element sizes.
const VIEWPORT = { width: 700, height: 900 }

// Looser tolerance than regression tests (1%) to account for minor rendering
// differences between the static design HTML and the live React components
// (e.g. token format differences, antialiasing variance at element edges).
const DESIGN_DIFF_RATIO = 0.03

for (const fixture of FIXTURES) {
  test.describe(fixture.label, () => {
    test(`${fixture.id} — design reference`, async ({ page }) => {
      await page.setViewportSize(VIEWPORT)
      await setupDesignRef(page, fixture.design.file)

      const selector = fixture.design.selector ?? '.card'
      const el = page.locator(selector).first()
      await el.waitFor({ state: 'visible' })

      await expect(el).toHaveScreenshot(`${fixture.id}-design.png`, {
        maxDiffPixelRatio: DESIGN_DIFF_RATIO,
      })
    })

    test(`${fixture.id} — react implementation`, async ({ page }) => {
      await page.setViewportSize(VIEWPORT)
      await setupHarness(page, fixture.react.exampleId, { darkCanvas: fixture.theme === 'dark' })

      if (fixture.react.setup) {
        await fixture.react.setup(page)
      }

      const el = page.locator(fixture.react.selector).first()
      await el.waitFor({ state: 'visible' })

      await expect(el).toHaveScreenshot(`${fixture.id}-react.png`, {
        maxDiffPixelRatio: DESIGN_DIFF_RATIO,
      })
    })
  })
}
