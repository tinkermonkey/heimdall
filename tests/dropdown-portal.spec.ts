import { test, expect, type Locator, type Page } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode } from './utils/test-helpers'

// #328: dropdown panels render in a portal on document.body (position: fixed)
// so scrolling / overflow-hidden ancestors can't clip them. portal={false}
// keeps the old in-place rendering.

async function box(locator: Locator) {
  const b = await locator.boundingBox()
  if (!b) throw new Error('element has no bounding box')
  return b
}

/** True when the topmost element at (x, y) is inside the given panel. */
async function panelPaintsAt(page: Page, testId: string, x: number, y: number) {
  return page.evaluate(
    ({ testId, x, y }) => {
      const hit = document.elementFromPoint(x, y)
      return !!hit?.closest(`[data-testid="${testId}"]`)
    },
    { testId, x, y },
  )
}

test.describe('integration: dropdown portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?example=dropdown-portal')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)
  })

  test('RowMenu panel escapes an overflow:auto frame', async ({ page }) => {
    const frame = page.getByTestId('frame-portal')
    await page.getByTestId('row-menu-portal').getByTestId('row-menu-trigger').click()
    const panel = page.getByTestId('row-menu-dropdown')
    await expect(panel).toBeVisible()

    // Rendered on body, not inside the frame.
    expect(await panel.evaluate((el) => el.parentElement === document.body)).toBe(true)
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe('fixed')

    const f = await box(frame)
    const p = await box(panel)
    // The panel extends past the frame's right and bottom edges...
    expect(p.x + p.width).toBeGreaterThan(f.x + f.width + 40)
    expect(p.y + p.height).toBeGreaterThan(f.y + f.height)
    // ...and is actually painted there, not clipped.
    expect(await panelPaintsAt(page, 'row-menu-dropdown', p.x + p.width - 6, p.y + p.height - 6)).toBe(true)

    // The last item, which sits outside the frame, is clickable.
    await page.getByTestId('row-menu-action-delete').click()
    await expect(page.getByTestId('last-action')).toHaveText('delete')
    await expect(panel).toHaveCount(0)
  })

  test('RowMenu panel stays clipped with portal={false}', async ({ page }) => {
    const frame = page.getByTestId('frame-inline')
    await page.getByTestId('row-menu-inline').getByTestId('row-menu-trigger').click()
    const panel = page.getByTestId('row-menu-dropdown')
    await expect(panel).toBeAttached()

    // Still a DOM descendant of the RowMenu root, absolutely positioned.
    expect(await panel.evaluate((el) => el.parentElement?.classList.contains('row-menu'))).toBe(true)
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe('absolute')

    const f = await box(frame)
    const p = await box(panel)
    expect(p.x + p.width).toBeGreaterThan(f.x + f.width)
    // The part outside the frame is clipped away.
    expect(await panelPaintsAt(page, 'row-menu-dropdown', f.x + f.width + 20, p.y + 10)).toBe(false)
  })

  test('portal panel follows the trigger when the frame scrolls', async ({ page }) => {
    const frame = page.getByTestId('frame-portal')
    const trigger = page.getByTestId('row-menu-portal').getByTestId('row-menu-trigger')
    await trigger.click()
    const panel = page.getByTestId('row-menu-dropdown')
    await expect(panel).toBeVisible()

    await frame.evaluate((el) => {
      el.scrollTop = 30
    })
    // Repositioning happens on the next animation frame.
    await expect
      .poll(async () => {
        const t = await box(trigger)
        const p = await box(panel)
        return Math.round(p.y - (t.y + t.height))
      })
      .toBe(4)
  })

  test('flips up and left when there is no room below or to the right', async ({ page }) => {
    await page.getByTestId('row-menu-corner').getByTestId('row-menu-trigger').click()
    const panel = page.getByTestId('row-menu-dropdown')
    await expect(panel).toBeVisible()
    await expect(panel).toHaveAttribute('data-placement', 'top-end')

    const t = await box(page.getByTestId('row-menu-corner'))
    const p = await box(panel)
    const viewport = page.viewportSize()!
    expect(p.y + p.height).toBeLessThanOrEqual(t.y)
    expect(p.x + p.width).toBeLessThanOrEqual(viewport.width)
    expect(Math.round(p.x + p.width)).toBe(Math.round(t.x + t.width))
  })

  test('keyboard navigation, Escape and focus return work through the portal', async ({ page }) => {
    const trigger = page.getByTestId('row-menu-portal').getByTestId('row-menu-trigger')
    await trigger.click()
    await expect(page.getByTestId('row-menu-action-edit')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('row-menu-action-duplicate')).toBeFocused()
    await page.keyboard.press('End')
    await expect(page.getByTestId('row-menu-action-delete')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('row-menu-dropdown')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('outside click closes the portal panel', async ({ page }) => {
    await page.getByTestId('row-menu-portal').getByTestId('row-menu-trigger').click()
    await expect(page.getByTestId('row-menu-dropdown')).toBeVisible()
    await page.mouse.click(700, 500)
    await expect(page.getByTestId('row-menu-dropdown')).toHaveCount(0)
  })

  test('Select panel escapes an overflow:hidden frame and keeps the trigger width', async ({ page }) => {
    const root = page.getByTestId('select-portal')
    await root.locator('.select__trigger').click()
    const panel = page.locator('.select__panel:not([hidden])')
    await expect(panel).toBeVisible()
    const f = await box(page.getByTestId('frame-select'))
    const r = await box(root)
    const p = await box(panel)
    expect(p.y + p.height).toBeGreaterThan(f.y + f.height)
    expect(Math.round(p.width)).toBeGreaterThanOrEqual(Math.round(r.width))
    await panel.getByRole('option', { name: 'Individual' }).click()
    await expect(page.getByTestId('kind')).toHaveText('individual')
  })

  test('picking from a Select inside a Popover keeps the Popover open', async ({ page }) => {
    await page.getByTestId('popover-trigger').click()
    await expect(page.getByTestId('popover-content')).toBeVisible()
    await page.getByTestId('select-in-popover').locator('.select__trigger').click()
    await page.locator('.select__panel:not([hidden])').getByRole('option', { name: 'Property' }).click()
    await expect(page.getByTestId('kind')).toHaveText('property')
    await expect(page.getByTestId('popover-content')).toBeVisible()
  })

  test('portal panel picks up dark-canvas tokens', async ({ page }) => {
    await applyDarkCanvasMode(page)
    await page.getByTestId('row-menu-portal').getByTestId('row-menu-trigger').click()
    const panel = page.getByTestId('row-menu-dropdown')
    await expect(panel).toBeVisible()
    const [bg, card] = await panel.evaluate((el) => [
      getComputedStyle(el).backgroundColor,
      getComputedStyle(document.body).getPropertyValue('--canvas-card').trim(),
    ])
    expect(bg).toBe(`rgb(${card.split(/\s+/).join(', ')})`)
  })

  test('screenshot: portal panel over the frame', async ({ page }) => {
    await page.getByTestId('row-menu-portal').getByTestId('row-menu-trigger').click()
    await expect(page.getByTestId('row-menu-dropdown')).toBeVisible()
    await expect(page).toHaveScreenshot('dropdown-portal-row-menu.png', {
      clip: { x: 0, y: 0, width: 520, height: 260 },
    })
  })

  test('screenshot: portal={false} panel clipped by the frame', async ({ page }) => {
    await page.getByTestId('row-menu-inline').getByTestId('row-menu-trigger').click()
    await expect(page.getByTestId('row-menu-dropdown')).toBeAttached()
    await expect(page).toHaveScreenshot('dropdown-portal-row-menu-inline.png', {
      clip: { x: 220, y: 0, width: 400, height: 260 },
    })
  })
})
