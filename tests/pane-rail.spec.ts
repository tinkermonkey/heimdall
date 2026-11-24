import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded, applyDarkCanvasMode, freezeAnimations } from './utils/test-helpers'

test.describe('integration: PaneRail Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?example=pane-rail')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
  })

  test.describe('Rendering', () => {
    test('is a 40px rail as tall as its container', async ({ page }) => {
      const box = await page.getByTestId('pane-rail-source').boundingBox()
      expect(box?.width).toBe(40)
      expect(box?.height).toBe(358) // 360px frame minus its 1px borders
    })

    test('renders one mark per item, sorted top to bottom, toned', async ({ page }) => {
      const rail = page.getByTestId('pane-rail-source')
      const marks = rail.locator('.pane-rail__mark')
      await expect(marks).toHaveCount(11)
      await expect(marks.first()).toHaveClass(/pane-rail__mark--emerald/)
      await expect(rail.locator('.pane-rail__mark--rose')).toHaveCount(2)
      await expect(rail.locator('.pane-rail__mark--neutral')).toHaveCount(1)

      const tops = await marks.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
      expect([...tops].sort((a, b) => a - b)).toEqual(tops)
    })

    test('draws the notch at the selected position', async ({ page }) => {
      const rail = page.getByTestId('pane-rail-source')
      const map = await rail.locator('.pane-rail__map').boundingBox()
      const notch = await rail.locator('.pane-rail__notch').boundingBox()
      expect(map && notch).toBeTruthy()
      const centre = notch!.y + notch!.height / 2
      expect(Math.abs(centre - (map!.y + 0.42 * map!.height))).toBeLessThan(1.5)
    })

    test('shows the name, key hint and position label', async ({ page }) => {
      const list = page.getByTestId('pane-rail-list')
      await expect(list.locator('.pane-rail__name')).toHaveText('Operations')
      await expect(list.locator('.pane-rail__key')).toHaveText(']')
      await expect(list.locator('.pane-rail__position')).toHaveText('5 / 37')
      await expect(list.locator('.pane-rail__mark')).toHaveCount(37)
      await expect(page.getByTestId('pane-rail-source').locator('.pane-rail__position')).toHaveCount(0)
    })

    test('renders 400 marks', async ({ page }) => {
      await expect(page.getByTestId('pane-rail-dense').locator('.pane-rail__mark')).toHaveCount(400)
      await expect(page.getByTestId('pane-rail-dense')).toHaveClass(/pane-rail--right/)
    })

    test('renders no map toolbar and no notch without marks or selection', async ({ page }) => {
      const rail = page.getByTestId('pane-rail-empty')
      await expect(rail.getByRole('toolbar')).toHaveCount(0)
      await expect(rail.locator('.pane-rail__notch')).toHaveCount(0)
      await expect(rail.locator('.pane-rail__key')).toHaveCount(0)
    })
  })

  test.describe('Accessibility', () => {
    test('expand button is collapsed, named and carries the shortcut', async ({ page }) => {
      const button = page.getByTestId('pane-rail-source').getByRole('button', { name: 'Expand Source' })
      await expect(button).toHaveAttribute('aria-expanded', 'false')
      await expect(button).toHaveAttribute('aria-keyshortcuts', '[')

      const noKey = page.getByTestId('pane-rail-empty').getByRole('button', { name: 'Expand Source' })
      await expect(noKey).not.toHaveAttribute('aria-keyshortcuts')
    })

    test('marks are named buttons in a labelled vertical toolbar', async ({ page }) => {
      const toolbar = page.getByTestId('pane-rail-source').getByRole('toolbar', { name: 'Source map' })
      await expect(toolbar).toHaveAttribute('aria-orientation', 'vertical')
      await expect(toolbar.getByRole('button', { name: 'Rejected: Retry policy' })).toHaveCount(1)
      await expect(toolbar.getByRole('button')).toHaveCount(11)
    })

    test('the map is one tab stop, starting at the mark nearest the selection', async ({ page }) => {
      const rail = page.getByTestId('pane-rail-source')
      await expect(rail.locator('.pane-rail__mark[tabindex="0"]')).toHaveCount(1)
      await expect(rail.locator('.pane-rail__mark[tabindex="0"]')).toHaveAttribute('data-mark-id', 'h6')
    })

    test('arrow keys, Home and End move focus between marks', async ({ page }) => {
      const rail = page.getByTestId('pane-rail-source')
      await rail.locator('[data-mark-id="h6"]').focus()
      await page.keyboard.press('ArrowDown')
      await expect(rail.locator('[data-mark-id="h7"]')).toBeFocused()
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowUp')
      await expect(rail.locator('[data-mark-id="h5"]')).toBeFocused()
      await page.keyboard.press('End')
      await expect(rail.locator('[data-mark-id="h11"]')).toBeFocused()
      await page.keyboard.press('Home')
      await expect(rail.locator('[data-mark-id="h1"]')).toBeFocused()
      await expect(rail.locator('[data-mark-id="h1"]')).toHaveAttribute('tabindex', '0')
      await expect(rail.locator('[data-mark-id="h6"]')).toHaveAttribute('tabindex', '-1')
    })

    test('leaving the toolbar puts the tab stop back on the mark nearest the selection', async ({ page }) => {
      const rail = page.getByTestId('pane-rail-source')
      await rail.locator('[data-mark-id="h6"]').focus()
      await page.keyboard.press('End')
      await expect(rail.locator('[data-mark-id="h11"]')).toHaveAttribute('tabindex', '0')
      await page.keyboard.press('Tab')
      await expect(rail.locator('[data-mark-id="h11"]')).not.toBeFocused()
      await expect(rail.locator('.pane-rail__mark[tabindex="0"]')).toHaveAttribute('data-mark-id', 'h6')
      await page.keyboard.press('Shift+Tab')
      await expect(rail.locator('[data-mark-id="h6"]')).toBeFocused()
    })

    test('duplicate mark ids render every mark without a React key warning', async ({ page }) => {
      const warnings: string[] = []
      page.on('console', (msg) => {
        if (/same key/i.test(msg.text())) warnings.push(msg.text())
      })
      await page.reload()
      await page.waitForLoadState('networkidle')
      const dense = page.getByTestId('pane-rail-dense')
      await expect(dense.locator('[data-mark-id="d0"]')).toHaveCount(2)
      await expect(dense.locator('.pane-rail__mark')).toHaveCount(400)
      expect(warnings).toEqual([])
    })

    test('each mark has a 24px hit area around its bar', async ({ page }) => {
      const mark = page.getByTestId('pane-rail-source').locator('[data-mark-id="h9"]')
      const size = await mark.evaluate((el) => {
        const after = getComputedStyle(el, '::after')
        return [after.width, after.height]
      })
      expect(size).toEqual(['24px', '24px'])

      // 10px below the bar: outside the 7px button, inside its extension.
      const box = await mark.boundingBox()
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2 + 10)
      await expect(page.getByTestId('pane-rail-log')).toHaveText('click:h9')
    })

    test('a neighbour\'s hit area does not cover a visible mark', async ({ page }) => {
      // List marks are ~4px apart, so op22's 24px extension spans op20's whole bar. Across the bar
      // the pointer must find op20, or op21 where the two buttons overlap, never op22 or later.
      const probe = await page.getByTestId('pane-rail-list').evaluate((rail) => {
        const op20 = rail.querySelector('[data-mark-id="op20"]')!.getBoundingClientRect()
        const op22 = rail.querySelector('[data-mark-id="op22"]')!.getBoundingClientRect()
        const centre = op20.top + op20.height / 2
        const x = op20.left + op20.width / 2
        const hits = new Set<string | null | undefined>()
        for (let y = centre - 1.5; y <= centre + 1.5; y += 0.5) {
          hits.add(document.elementFromPoint(x, y)?.getAttribute('data-mark-id'))
        }
        return { op22CoversBar: op22.top + op22.height / 2 - 12 < centre - 1.5, hits: [...hits].sort() }
      })
      expect(probe.op22CoversBar).toBe(true)
      expect(probe.hits).toContain('op20')
      expect(probe.hits.every((id) => id === 'op20' || id === 'op21')).toBe(true)
    })

    test('marks, centre line and notch use system colours in forced-colors mode', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' })
      const colours = await page.getByTestId('pane-rail-source').evaluate((rail) => {
        const probe = (value: string) => {
          const el = document.createElement('div')
          el.style.forcedColorAdjust = 'none'
          el.style.backgroundColor = value
          document.body.appendChild(el)
          const colour = getComputedStyle(el).backgroundColor
          el.remove()
          return colour
        }
        const mark = rail.querySelector('.pane-rail__mark')!
        return {
          mark: getComputedStyle(mark, '::before').backgroundColor,
          line: getComputedStyle(rail.querySelector('.pane-rail__map')!, '::before').backgroundColor,
          notch: getComputedStyle(rail.querySelector('.pane-rail__notch')!).backgroundColor,
          canvasText: probe('CanvasText'),
          grayText: probe('GrayText'),
          highlight: probe('Highlight'),
          canvas: probe('Canvas'),
        }
      })
      expect(colours.mark).toBe(colours.canvasText)
      expect(colours.line).toBe(colours.grayText)
      expect(colours.notch).toBe(colours.highlight)
      expect(colours.mark).not.toBe(colours.canvas)
    })
  })

  test.describe('Callbacks', () => {
    test('expand button calls onExpand', async ({ page }) => {
      await page.getByTestId('pane-rail-source').getByRole('button', { name: 'Expand Source' }).click()
      await expect(page.getByTestId('pane-rail-log')).toHaveText('expand:Source')
    })

    test('the rail\'s empty area calls onExpand', async ({ page }) => {
      await page.getByTestId('pane-rail-source').locator('.pane-rail__name').click()
      await expect(page.getByTestId('pane-rail-log')).toHaveText('expand:Source')
    })

    test('a mark click calls onMarkClick, not onExpand', async ({ page }) => {
      await page.getByTestId('pane-rail-source').locator('[data-mark-id="h3"]').click()
      await expect(page.getByTestId('pane-rail-log')).toHaveText('click:h3')
    })

    test('without onMarkClick a mark click expands the pane', async ({ page }) => {
      await page.getByTestId('pane-rail-list').locator('[data-mark-id="op20"]').click({ position: { x: 10, y: 1 } })
      await expect(page.getByTestId('pane-rail-log')).toHaveText('expand:Operations')
    })

    test('hover and leave call onMarkHover with the anchor, then onMarkLeave', async ({ page }) => {
      const rail = page.getByTestId('pane-rail-source')
      await rail.locator('[data-mark-id="h7"]').hover()
      await expect(page.getByTestId('pane-rail-log')).toHaveText('hover:h7:button')
      await page.getByTestId('pane-rail-log').hover()
      await expect(page.getByTestId('pane-rail-log')).toHaveText('leave:h7')
    })

    test('focus and blur call onMarkHover and onMarkLeave', async ({ page }) => {
      const rail = page.getByTestId('pane-rail-source')
      await rail.locator('[data-mark-id="h2"]').focus()
      await expect(page.getByTestId('pane-rail-log')).toHaveText('hover:h2:button')
      await rail.locator('[data-mark-id="h2"]').blur()
      await expect(page.getByTestId('pane-rail-log')).toHaveText('leave:h2')
    })
  })

  test.describe('Visual Regression', () => {
    test('light canvas snapshot', async ({ page }) => {
      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('pane-rail-light-canvas.png', { fullPage: true })
    })

    test('dark canvas snapshot', async ({ page }) => {
      await applyDarkCanvasMode(page)
      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('pane-rail-dark-canvas.png', { fullPage: true })
    })
  })
})
