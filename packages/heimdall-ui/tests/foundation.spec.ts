import { test, expect } from '@playwright/test'
import {
  freezeAnimations,
  applyDarkCanvasMode,
  assertLightCanvasTokens,
  assertCyanAccent,
  getCSSVariableValue,
} from './utils/test-helpers'

/**
 * Foundation tests verify the token system and build infrastructure
 * These tests confirm that:
 * - CSS custom properties are correctly defined
 * - Light canvas is the default mode
 * - Cyan accent tokens are in place (not orange)
 * - Animation freezing works for consistent screenshots
 * - Vite build pipeline works correctly
 *
 * Token format: All color tokens are in RGB channels format (e.g. '255 255 255' for white).
 * Numeric tokens (radius) are in their declared units (e.g. '4px').
 */

test.beforeEach(async ({ page }) => {
  // Navigate to a test page that loads the actual tokens.css
  // This ensures tests verify the real token system, not hardcoded values
  await page.goto('http://localhost:5173/?test=foundation')
  await page.waitForLoadState('networkidle')
})

test('should have light canvas as default background color', async ({ page }) => {
  const bgColor = await getCSSVariableValue(page, '--canvas-bg')
  expect(bgColor.trim()).toBe('255 255 255')
})

test('should have shell background always dark', async ({ page }) => {
  const shellBg = await getCSSVariableValue(page, '--shell-bg')
  expect(shellBg.trim()).toBe('11 15 20')
})

test('should use cyan accent color, not orange', async ({ page }) => {
  const accentPrimary = await getCSSVariableValue(page, '--accent-primary')
  expect(accentPrimary.trim()).toBe('34 211 238')
})

test('should have cyan accent hover state', async ({ page }) => {
  const accentHover = await getCSSVariableValue(page, '--accent-primary-hover')
  expect(accentHover.trim()).toBe('6 182 212')
})

test('should have cyan accent deep state', async ({ page }) => {
  const accentDeep = await getCSSVariableValue(page, '--accent-primary-deep')
  expect(accentDeep.trim()).toBe('14 126 163')
})

test('should support semantic status colors', async ({ page }) => {
  const statusOk = await getCSSVariableValue(page, '--status-ok')
  const statusWarn = await getCSSVariableValue(page, '--status-warn')
  const statusError = await getCSSVariableValue(page, '--status-error')

  expect(statusOk.trim()).toBe('34 197 94')
  expect(statusWarn.trim()).toBe('234 179 8')
  expect(statusError.trim()).toBe('239 68 68')
})

test('should have radius tokens', async ({ page }) => {
  const radiusSm = await getCSSVariableValue(page, '--radius-sm')
  const radiusMd = await getCSSVariableValue(page, '--radius-md')
  const radiusLg = await getCSSVariableValue(page, '--radius-lg')

  expect(radiusSm.trim()).toBe('4px')
  expect(radiusMd.trim()).toBe('6px')
  expect(radiusLg.trim()).toBe('8px')
})

test('should support dark-canvas class toggle', async ({ page }) => {
  await applyDarkCanvasMode(page)

  // Dark canvas should already be default, so this just verifies the class can be applied
  const hasDarkCanvasClass = await page.evaluate(() =>
    document.body.classList.contains('dark-canvas')
  )

  expect(hasDarkCanvasClass).toBe(true)
})

test('should allow animation freezing', async ({ page }) => {
  await freezeAnimations(page)

  // Verify that animation-play-state: paused is applied
  const animationState = await page.evaluate(() => {
    return getComputedStyle(document.body).animationPlayState
  })

  expect(animationState).toBe('paused')
})

test('should apply light canvas tokens by default', async ({ page }) => {
  await assertLightCanvasTokens(page)
})

test('should have cyan accent as primary color', async ({ page }) => {
  await assertCyanAccent(page)
})
