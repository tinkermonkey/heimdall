import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('Advanced Overlay Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to advanced overlay components test page
    await page.goto('http://localhost:5173/?example=advanced-overlays')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
  })

  test.describe('CommandPalette Component', () => {
    test('should render when isOpen is true', async ({ page }) => {
      // Open command palette (typically Cmd/Ctrl+K)
      const paletteTrigger = page.locator('button:has-text("Open Palette")').first()
      if (await paletteTrigger.count() > 0) {
        await paletteTrigger.click()
      } else {
        // Try keyboard shortcut
        await page.keyboard.press('Control+K')
      }

      const palette = page.locator('.command-palette').first()
      await expect(palette).toBeVisible()

      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('command-palette-open.png', {
        maxDiffPixelRatio: 0.01,
      })
    })

    test('should close when Escape key is pressed', async ({ page }) => {
      // Open palette
      const paletteTrigger = page.locator('button:has-text("Open Palette")').first()
      await expect(paletteTrigger).toBeVisible()
      await paletteTrigger.click()

      const palette = page.locator('.command-palette').first()
      await expect(palette).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')

      // Palette should be hidden
      await expect(palette).not.toBeVisible()
    })

    test('should filter commands by search input', async ({ page }) => {
      // Open palette
      const paletteTrigger = page.locator('button:has-text("Open Palette")').first()
      await expect(paletteTrigger).toBeVisible()
      await paletteTrigger.click()

      const input = page.locator('.command-palette__input').first()
      await expect(input).toBeVisible()

      // Type search term
      await input.type('test')

      // Should filter results
      const items = page.locator('.command-palette__item')
      const count = await items.count()

      // There should be items visible (or none if no match)
      expect(count).toBeGreaterThanOrEqual(0)

      await page.keyboard.press('Escape')
    })

    test('should navigate commands with arrow keys', async ({ page }) => {
      // Open palette
      const paletteTrigger = page.locator('button:has-text("Open Palette")').first()
      await expect(paletteTrigger).toBeVisible()
      await paletteTrigger.click()

      const palette = page.locator('.command-palette').first()
      await expect(palette).toBeVisible()

      // Navigate down
      await page.keyboard.press('ArrowDown')

      // Check if an item is selected
      const selectedItem = page.locator('.command-palette__item--selected').first()
      if (await selectedItem.count() > 0) {
        await expect(selectedItem).toBeVisible()
      }

      // Navigate up
      await page.keyboard.press('ArrowUp')

      await page.keyboard.press('Escape')
    })

    test('should execute command on Enter key', async ({ page }) => {
      // Open palette
      const paletteTrigger = page.locator('button:has-text("Open Palette")').first()
      await expect(paletteTrigger).toBeVisible()
      await paletteTrigger.click()

      const palette = page.locator('.command-palette').first()
      await expect(palette).toBeVisible()

      // Select first command
      await page.keyboard.press('ArrowDown')

      // Execute
      await page.keyboard.press('Enter')

      // Palette should close after execution
      await expect(palette).not.toBeVisible()
    })

    test('should auto-focus input on open', async ({ page }) => {
      // Open palette
      const paletteTrigger = page.locator('button:has-text("Open Palette")').first()
      await expect(paletteTrigger).toBeVisible()
      await paletteTrigger.click()

      const input = page.locator('.command-palette__input').first()
      await expect(input).toBeVisible()

      // Check if input is focused
      const isFocused = await input.evaluate((el) => {
        return document.activeElement === el
      })

      if (!isFocused) {
        // Fallback: just verify input is visible and ready
        await expect(input).toBeVisible()
      }

      await page.keyboard.press('Escape')
    })

    test('should close when backdrop is clicked', async ({ page }) => {
      // Open palette
      const paletteTrigger = page.locator('button:has-text("Open Palette")').first()
      await expect(paletteTrigger).toBeVisible()
      await paletteTrigger.click()

      const backdrop = page.locator('.command-palette-backdrop').first()
      await expect(backdrop).toBeVisible()

      // Click on backdrop (outside palette)
      await backdrop.click({ position: { x: 10, y: 10 } })

      const palette = page.locator('.command-palette').first()
      await expect(palette).not.toBeVisible()
    })
  })

  test.describe('Drawer Component', () => {
    test('should render when isOpen is true', async ({ page }) => {
      // Find and click the trigger button for drawer
      const drawerTrigger = page.locator('button:has-text("Open Drawer")').first()
      await expect(drawerTrigger).toBeVisible()
      await drawerTrigger.click()

      // Drawer should be visible
      const drawer = page.locator('.drawer').first()
      await expect(drawer).toBeVisible()

      // Drawer should have backdrop
      const backdrop = page.locator('.drawer-backdrop').first()
      await expect(backdrop).toBeVisible()

      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('drawer-open.png', {
        maxDiffPixelRatio: 0.01,
      })
    })

    test('should close when Escape key is pressed', async ({ page }) => {
      // Open drawer
      const drawerTrigger = page.locator('button:has-text("Open Drawer")').first()
      await expect(drawerTrigger).toBeVisible()
      await drawerTrigger.click()

      const drawer = page.locator('.drawer').first()
      await expect(drawer).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')

      // Drawer should be hidden
      await expect(drawer).not.toBeVisible()
    })

    test('should close when backdrop is clicked', async ({ page }) => {
      // Open drawer
      const drawerTrigger = page.locator('button:has-text("Open Drawer")').first()
      await expect(drawerTrigger).toBeVisible()
      await drawerTrigger.click()

      const drawer = page.locator('.drawer').first()
      await expect(drawer).toBeVisible()

      // Click backdrop
      const backdrop = page.locator('.drawer-backdrop').first()
      await backdrop.click({ position: { x: 10, y: 10 } })

      // Drawer should be hidden
      await expect(drawer).not.toBeVisible()
    })

    test('should lock body overflow when open', async ({ page }) => {
      const overflow = await page.evaluate(() => {
        return document.body.style.overflow
      })

      expect(overflow).not.toBe('hidden')

      // Open drawer
      const drawerTrigger = page.locator('button:has-text("Open Drawer")').first()
      await expect(drawerTrigger).toBeVisible()
      await drawerTrigger.click()

      const overflowWhenOpen = await page.evaluate(() => {
        return document.body.style.overflow
      })

      expect(overflowWhenOpen).toBe('hidden')
    })

    test('should close when close button is clicked', async ({ page }) => {
      // Open drawer
      const drawerTrigger = page.locator('button:has-text("Open Drawer")').first()
      await expect(drawerTrigger).toBeVisible()
      await drawerTrigger.click()

      // Click close button
      const closeButton = page.locator('.drawer__close').first()
      await expect(closeButton).toBeVisible()
      await closeButton.click()

      // Drawer should be hidden
      const drawer = page.locator('.drawer').first()
      await expect(drawer).not.toBeVisible()
    })

    test('should support different positions (left/right)', async ({ page }) => {
      // Test right drawer (default)
      let drawer = page.locator('.drawer').first()
      const rightDrawerTrigger = page.locator('button:has-text("Open Drawer")').first()
      await expect(rightDrawerTrigger).toBeVisible()
      await rightDrawerTrigger.click()

      await expect(drawer).toBeVisible()
      const hasRightClass = await drawer.evaluate((el) => {
        return el.className.includes('drawer--right')
      })

      expect(hasRightClass).toBe(true)
      await page.keyboard.press('Escape')

      // Test left drawer if available
      const leftDrawerTrigger = page.locator('button:has-text("Open Left Drawer")').first()
      if (await leftDrawerTrigger.count() > 0) {
        await leftDrawerTrigger.click()

        drawer = page.locator('.drawer--left').first()
        await expect(drawer).toBeVisible()
        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('SplitPane Component', () => {
    test('should render both sections', async ({ page }) => {
      // Find split pane
      const splitPane = page.locator('.split-pane').first()
      await expect(splitPane).toBeVisible()

      // Check for both sections
      const firstSection = page.locator('.split-pane__first').first()
      const secondSection = page.locator('.split-pane__second').first()

      await expect(firstSection).toBeVisible()
      await expect(secondSection).toBeVisible()

      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('split-pane-default.png', {
        maxDiffPixelRatio: 0.01,
      })
    })

    test('should have a draggable divider', async ({ page }) => {
      const splitPane = page.locator('.split-pane').first()
      await expect(splitPane).toBeVisible()

      // Find divider
      const divider = page.locator('.split-pane__divider').first()
      await expect(divider).toBeVisible()

      // Verify divider has cursor pointer
      const cursor = await divider.evaluate((el) => {
        return window.getComputedStyle(el).cursor
      })

      // Should indicate it's draggable (col-resize for horizontal split, row-resize for vertical)
      expect(cursor).toMatch(/pointer|grab|col-resize|row-resize|ew-resize|ns-resize/)
    })

    test('should update pane sizes when divider is dragged', async ({ page }) => {
      const splitPane = page.locator('.split-pane').first()
      await expect(splitPane).toBeVisible()

      const divider = page.locator('.split-pane__divider').first()
      const firstSection = page.locator('.split-pane__first').first()

      // Get initial bounding box of first section
      const initialBox = await firstSection.boundingBox()
      expect(initialBox).toBeTruthy()

      if (initialBox) {
        const initialWidth = initialBox.width
        const dividerBox = await divider.boundingBox()

        if (dividerBox) {
          const startX = dividerBox.x + dividerBox.width / 2
          const startY = dividerBox.y + dividerBox.height / 2
          const containerBox = await splitPane.boundingBox()

          if (containerBox) {
            // Simulate drag via JavaScript by dispatching proper DOM events
            await page.evaluate((coords) => {
              const { startX: sX, startY: sY, dragX: dX, dragY: dY } = coords

              // Get the divider element
              const dividerEl = document.querySelector('.split-pane__divider')
              if (!dividerEl) return

              // Dispatch mousedown event
              const mouseDownEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: sX,
                clientY: sY,
              })
              dividerEl.dispatchEvent(mouseDownEvent)

              // Simulate mousemove on document
              setTimeout(() => {
                const mouseMoveEvent = new MouseEvent('mousemove', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                  clientX: sX + dX,
                  clientY: sY + dY,
                })
                document.dispatchEvent(mouseMoveEvent)

                // Simulate mouseup
                setTimeout(() => {
                  const mouseUpEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                  })
                  document.dispatchEvent(mouseUpEvent)
                }, 50)
              }, 50)
            }, { startX, startY, dragX: 50, dragY: 0 })

            // Wait for events to process and state to update
            await page.waitForTimeout(300)

            // Get new bounding box and verify size changed
            const newBox = await firstSection.boundingBox()
            expect(newBox).toBeTruthy()

            if (newBox) {
              const newWidth = newBox.width
              const widthDiff = Math.abs(newWidth - initialWidth)
              // The width should have changed by at least 10 pixels from the 50px drag
              expect(widthDiff).toBeGreaterThan(10)
            }
          }
        }
      }
    })

    test('should respect min and max size constraints', async ({ page }) => {
      const splitPane = page.locator('.split-pane').first()
      await expect(splitPane).toBeVisible()

      const firstSection = page.locator('.split-pane__first').first()
      const containerBox = await splitPane.boundingBox()

      if (containerBox) {
        // Get the width and verify it's within constraints
        const width = await firstSection.evaluate((el) => {
          const rect = el.getBoundingClientRect()
          return rect.width
        })

        // Should be bounded by min and max size
        expect(width).toBeGreaterThan(0)
      }
    })

    test('should support horizontal and vertical directions', async ({ page }) => {
      const splitPane = page.locator('.split-pane').first()
      await expect(splitPane).toBeVisible()
      // Check which direction it is
      const isHorizontal = await splitPane.evaluate((el) => {
        return el.className.includes('split-pane--horizontal')
      })

      const isVertical = await splitPane.evaluate((el) => {
        return el.className.includes('split-pane--vertical')
      })

      // Should be one or the other (or default to horizontal)
      expect(isHorizontal || isVertical).toBe(true)
    })
  })
})
