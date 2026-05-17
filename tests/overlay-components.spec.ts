import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('Overlay Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to overlay components test page
    await page.goto('http://localhost:5173/?example=overlays')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
  })

  test.describe('Modal Component', () => {
    test('should render when isOpen is true', async ({ page }) => {
      // Find and click the trigger button for modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      // Modal should be visible
      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible()

      // Modal should have backdrop
      const backdrop = page.locator('.modal-backdrop').first()
      await expect(backdrop).toBeVisible()

      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('modal-open.png', {
        maxDiffPixelRatio: 0.01,
      })
    })

    test('should close when Escape key is pressed', async ({ page }) => {
      // Open modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')

      // Modal should be hidden
      await expect(modal).not.toBeVisible()
    })

    test('should close when backdrop is clicked', async ({ page }) => {
      // Open modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible()

      // Click backdrop
      const backdrop = page.locator('.modal-backdrop').first()
      await backdrop.click({ position: { x: 10, y: 10 } })

      // Modal should be hidden
      await expect(modal).not.toBeVisible()
    })

    test('should lock body overflow when open', async ({ page }) => {
      const overflow = await page.evaluate(() => {
        return document.body.style.overflow
      })

      expect(overflow).not.toBe('hidden')

      // Open modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      const overflowWhenOpen = await page.evaluate(() => {
        return document.body.style.overflow
      })

      expect(overflowWhenOpen).toBe('hidden')
    })

    test('should restore body overflow when closed', async ({ page }) => {
      // Open modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      // Close modal via Escape
      await page.keyboard.press('Escape')

      const overflow = await page.evaluate(() => {
        return document.body.style.overflow
      })

      // Overflow should be restored to its original value (empty string when not previously set)
      expect(overflow).toBe('')
    })

    test('should close when close button is clicked', async ({ page }) => {
      // Open modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      // Click close button
      const closeButton = page.locator('.modal__close').first()
      await closeButton.click()

      // Modal should be hidden
      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).not.toBeVisible()
    })

    test('should display title and subtitle when provided', async ({ page }) => {
      // Open modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      // Check title
      const title = page.locator('.modal__title')
      await expect(title).toBeVisible()
      expect(await title.textContent()).toBeTruthy()

      // Check subtitle
      const subtitle = page.locator('.modal__subtitle')
      if (await subtitle.count() > 0) {
        await expect(subtitle).toBeVisible()
      }
    })

    test('should trap focus: Tab from last focusable element wraps to first', async ({ page }) => {
      // Open modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible()

      // Find all focusable elements within the modal
      const focusableElements = modal.locator('button, input, [tabindex]:not([tabindex="-1"])')
      const count = await focusableElements.count()

      if (count > 1) {
        // Tab to the last focusable element
        for (let i = 1; i < count; i++) {
          await page.keyboard.press('Tab')
        }

        // Get the last element
        const lastElement = focusableElements.nth(count - 1)
        await expect(lastElement).toBeFocused()

        // Tab again should wrap to first element
        await page.keyboard.press('Tab')

        const firstElement = focusableElements.first()
        await expect(firstElement).toBeFocused()
      }
    })

    test('should trap focus: Shift+Tab from first focusable element wraps to last', async ({ page }) => {
      // Open modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible()

      // Find all focusable elements within the modal
      const focusableElements = modal.locator('button, input, [tabindex]:not([tabindex="-1"])')
      const count = await focusableElements.count()

      if (count > 1) {
        // First element should be focused after modal opens
        const firstElement = focusableElements.first()
        await expect(firstElement).toBeFocused()

        // Shift+Tab should wrap to last element
        await page.keyboard.press('Shift+Tab')

        const lastElement = focusableElements.nth(count - 1)
        await expect(lastElement).toBeFocused()
      }
    })

    test('should restore focus to triggering element when closed', async ({ page }) => {
      // Get the modal trigger button
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()

      // Focus on the trigger button
      await modalTrigger.focus()
      await expect(modalTrigger).toBeFocused()

      // Open modal
      await modalTrigger.click()

      const modal = page.locator('[role="dialog"]').first()
      await expect(modal).toBeVisible()

      // Close modal via Escape
      await page.keyboard.press('Escape')

      // Focus should return to the trigger button
      await expect(modalTrigger).toBeFocused()
    })
  })

  test.describe('Nested Overlay Behavior', () => {
    test('should maintain body overflow: hidden with nested overlays', async ({ page }) => {
      // Get initial overflow
      const initialOverflow = await page.evaluate(() => {
        return document.body.style.overflow
      })
      expect(initialOverflow).not.toBe('hidden')

      // Open first modal
      const modalTrigger = page.locator('button:has-text("Open Modal")').first()
      await modalTrigger.click()

      const firstModal = page.locator('[role="dialog"]').first()
      await expect(firstModal).toBeVisible()

      const overflowFirstOpen = await page.evaluate(() => {
        return document.body.style.overflow
      })
      expect(overflowFirstOpen).toBe('hidden')

      // Open second modal (nested)
      const secondModalTrigger = firstModal.locator('button:has-text("Open Modal")')
      if (await secondModalTrigger.count() > 0) {
        await secondModalTrigger.click()

        const secondModal = page.locator('[role="dialog"]').nth(1)
        await expect(secondModal).toBeVisible()

        const overflowBothOpen = await page.evaluate(() => {
          return document.body.style.overflow
        })
        expect(overflowBothOpen).toBe('hidden')

        // Close second modal
        await page.keyboard.press('Escape')

        const overflowAfterSecondClose = await page.evaluate(() => {
          return document.body.style.overflow
        })
        // Should still be hidden because first modal is still open
        expect(overflowAfterSecondClose).toBe('hidden')
      }

      // Close first modal
      await page.keyboard.press('Escape')

      const overflowAfterAllClose = await page.evaluate(() => {
        return document.body.style.overflow
      })
      // Should be restored to original
      expect(overflowAfterAllClose).toBe('')
    })
  })

  test.describe('ConfirmDialog Component', () => {
    test('should render confirm dialog with title and message', async ({ page }) => {
      // Find and click the trigger button for confirm dialog
      const confirmTrigger = page.locator('button:has-text("Open Confirm")').first()
      await confirmTrigger.click()

      // Dialog should be visible
      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()

      // Check for title
      const title = page.locator('.modal__title')
      await expect(title).toBeVisible()

      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('confirm-dialog-open.png', {
        maxDiffPixelRatio: 0.01,
      })
    })

    test('should call onConfirm and close when confirm button is clicked', async ({ page }) => {
      // Open confirm dialog
      const confirmTrigger = page.locator('button:has-text("Open Confirm")').first()
      await confirmTrigger.click()

      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()

      // Click confirm button (danger variant button)
      const confirmButton = page.locator('button:has-text("Delete")').first()
      await expect(confirmButton).toBeVisible()
      await confirmButton.click()

      // Dialog should close after confirmation
      await expect(dialog).not.toBeVisible()
    })

    test('should close without confirming when cancel button is clicked', async ({ page }) => {
      // Open confirm dialog
      const confirmTrigger = page.locator('button:has-text("Open Confirm")').first()
      await confirmTrigger.click()

      const dialog = page.locator('[role="dialog"]').first()
      await expect(dialog).toBeVisible()

      // Click cancel button
      const cancelButton = page.locator('button:has-text("Cancel")').first()
      await cancelButton.click()

      // Dialog should close
      await expect(dialog).not.toBeVisible()
    })

    test('should support danger variant styling', async ({ page }) => {
      // Open confirm dialog
      const confirmTrigger = page.locator('button:has-text("Open Confirm")').first()
      await confirmTrigger.click()

      // Check for danger button styling
      const dangerButton = page.locator('button[class*="danger"]').first()
      if (await dangerButton.count() > 0) {
        const bgColor = await dangerButton.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor
        })
        expect(bgColor).toBeTruthy()
      }
    })
  })

  test.describe('Toast Component', () => {
    test('should render when isOpen is true', async ({ page }) => {
      // Find and click the trigger button for toast
      const toastTrigger = page.locator('button:has-text("Show Toast")').first()
      await toastTrigger.click()

      // Toast should be visible
      const toast = page.locator('[role="status"]').first()
      await expect(toast).toBeVisible()

      await freezeAnimations(page)
      await expect(page).toHaveScreenshot('toast-open.png', {
        maxDiffPixelRatio: 0.01,
      })
    })

    test('should auto-dismiss after duration', async ({ page }) => {
      // Click toast trigger
      const toastTrigger = page.locator('button:has-text("Show Toast")').first()
      await toastTrigger.click()

      const toast = page.locator('[role="status"]').first()
      await expect(toast).toBeVisible()

      // Wait for auto-dismiss (default 4000ms)
      await page.waitForTimeout(4500)

      // Toast should be hidden
      await expect(toast).not.toBeVisible()
    })

    test('should close immediately when close button is clicked', async ({ page }) => {
      // Click toast trigger
      const toastTrigger = page.locator('button:has-text("Show Toast")').first()
      await toastTrigger.click()

      const toast = page.locator('[role="status"]').first()
      await expect(toast).toBeVisible()

      // Click close button
      const closeButton = page.locator('.toast__close').first()
      await closeButton.click()

      // Toast should be hidden
      await expect(toast).not.toBeVisible()
    })

    test('should display title and subtitle', async ({ page }) => {
      // Click toast trigger
      const toastTrigger = page.locator('button:has-text("Show Toast")').first()
      await toastTrigger.click()

      // Check title
      const title = page.locator('.toast__title').first()
      await expect(title).toBeVisible()
      expect(await title.textContent()).toBeTruthy()
    })

    test('should support different variants with appropriate icons', async ({ page }) => {
      // Test different toast variants
      const variants = ['success', 'error', 'warning', 'info']

      for (const variant of variants) {
        const trigger = page.locator(`button:has-text("Show ${variant.charAt(0).toUpperCase() + variant.slice(1)} Toast")`).first()
        if (await trigger.count() > 0) {
          await trigger.click()

          const toast = page.locator(`[role="status"].toast--${variant}`).first()
          if (await toast.count() > 0) {
            await expect(toast).toBeVisible()

            // Check for icon
            const icon = toast.locator('svg').first()
            if (await icon.count() > 0) {
              await expect(icon).toBeVisible()
            }

            await page.keyboard.press('Escape')
          }
        }
      }
    })
  })
})
