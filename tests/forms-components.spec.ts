import { test, expect } from '@playwright/test'
import { freezeAnimations, loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('Forms Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=forms')
    await page.waitForLoadState('networkidle')
    await loadSelfHostedFonts(page)
    await assertFontsLoaded(page)
    await freezeAnimations(page)
  })

  test.describe('EntityPicker', () => {
    test('renders input field with placeholder', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await expect(input).toHaveAttribute('placeholder', 'Search entities...')
    })

    test('opens dropdown on input with results', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('user')
      await page.waitForSelector('[data-testid="entity-picker-dropdown"]')
      const dropdown = page.locator('[data-testid="entity-picker-dropdown"]').first()
      await expect(dropdown).toBeVisible()
    })

    test('filters results on input change', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('user')
      const results = page.locator('[data-testid^="entity-picker-result-"]')
      const count = await results.count()
      expect(count).toBeGreaterThan(0)
    })

    test('closes dropdown on result selection', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('user')
      const result = page.locator('[data-testid^="entity-picker-result-"]').first()
      await result.click()
      const dropdown = page.locator('[data-testid="entity-picker-dropdown"]')
      await expect(dropdown).not.toBeVisible()
    })

    test('shows domain badges in results', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('user')
      const badge = page.locator('.entity-picker__badge').first()
      await expect(badge).toBeVisible()
    })

    test('keyboard navigation - arrow down', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('user')
      await page.waitForSelector('[data-testid="entity-picker-dropdown"]')
      await input.press('ArrowDown')
      const selectedResult = page.locator('.entity-picker__result--selected')
      await expect(selectedResult).toBeVisible()
    })

    test('keyboard navigation - arrow up cycles', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('user')
      await page.waitForSelector('[data-testid="entity-picker-dropdown"]')
      await input.press('ArrowDown')
      await input.press('ArrowDown')
      await input.press('ArrowUp')
      const selected = page.locator('.entity-picker__result--selected')
      await expect(selected).toBeVisible()
    })

    test('keyboard navigation - Enter selects', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('user')
      await page.waitForSelector('[data-testid="entity-picker-dropdown"]')
      await input.press('ArrowDown')
      await input.press('Enter')
      const dropdown = page.locator('[data-testid="entity-picker-dropdown"]')
      await expect(dropdown).not.toBeVisible()
    })

    test('keyboard navigation - Escape closes', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('user')
      await page.waitForSelector('[data-testid="entity-picker-dropdown"]')
      await input.press('Escape')
      const dropdown = page.locator('[data-testid="entity-picker-dropdown"]')
      await expect(dropdown).not.toBeVisible()
    })

    test('shows clear button when input has text', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('test')
      const clearBtn = page.locator('[data-testid="entity-picker-clear"]').first()
      await expect(clearBtn).toBeVisible()
    })

    test('clear button empties input', async ({ page }) => {
      const input = page.locator('[data-testid="entity-picker-input"]').first()
      await input.fill('test')
      const clearBtn = page.locator('[data-testid="entity-picker-clear"]').first()
      await clearBtn.click()
      await expect(input).toHaveValue('')
    })
  })

  test.describe('KeyValueEditor', () => {
    test('renders with initial rows', async ({ page }) => {
      const editor = page.locator('[data-testid="key-value-editor"]').first()
      await expect(editor).toBeVisible()
      const rows = page.locator('[data-testid^="key-value-row-"]')
      const count = await rows.count()
      expect(count).toBeGreaterThan(0)
    })

    test('renders key and value inputs per row', async ({ page }) => {
      const keyInputs = page.locator('[data-testid^="key-input-"]')
      const valueInputs = page.locator('[data-testid^="value-input-"]')
      const keyCount = await keyInputs.count()
      const valueCount = await valueInputs.count()
      expect(keyCount).toBe(valueCount)
      expect(keyCount).toBeGreaterThan(0)
    })

    test('edits key value', async ({ page }) => {
      const keyInput = page.locator('[data-testid^="key-input-"]').first()
      await keyInput.fill('new_key')
      const newValue = await keyInput.inputValue()
      expect(newValue).toBe('new_key')
    })

    test('renders datatype selector column when enabled', async ({ page }) => {
      const datatypeSelects = page.locator('[data-testid^="datatype-select-"]')
      const count = await datatypeSelects.count()
      expect(count).toBeGreaterThan(0)
    })

    test('renders remove button per row', async ({ page }) => {
      const removeButtons = page.locator('[data-testid^="remove-row-"]')
      const count = await removeButtons.count()
      expect(count).toBeGreaterThan(0)
    })

    test('add row button is visible', async ({ page }) => {
      const addBtn = page.locator('[data-testid="add-row-btn"]').first()
      await expect(addBtn).toBeVisible()
    })
  })

  test.describe('OrderedList', () => {
    test('renders items with rank numbers', async ({ page }) => {
      const orderedList = page.locator('[data-testid="ordered-list"]').first()
      await expect(orderedList).toBeVisible()
      const items = page.locator('[data-testid^="ordered-item-"]')
      const count = await items.count()
      expect(count).toBeGreaterThan(0)
    })

    test('shows primary item indicator', async ({ page }) => {
      const primaryBadge = page.locator('.ordered-list__primary-badge').first()
      await expect(primaryBadge).toBeVisible()
    })

    test('move-up button is disabled on first item', async ({ page }) => {
      const firstMoveUp = page.locator('[data-testid^="move-up-"]').first()
      const isDisabled = await firstMoveUp.isDisabled()
      expect(isDisabled).toBe(true)
    })

    test('move-down button is disabled on last item', async ({ page }) => {
      const moveDownButtons = page.locator('[data-testid^="move-down-"]')
      const count = await moveDownButtons.count()
      const lastMoveDown = moveDownButtons.nth(count - 1)
      const isDisabled = await lastMoveDown.isDisabled()
      expect(isDisabled).toBe(true)
    })

    test('move-up reorders items correctly', async ({ page }) => {
      const moveUpButtons = page.locator('[data-testid^="move-up-"]')
      const secondMoveUp = moveUpButtons.nth(1)

      // Click move-up on the second item
      await secondMoveUp.click()

      // Verify that move-up button is now disabled on the first item (which moved up)
      const firstMoveUp = page.locator('[data-testid^="move-up-"]').first()
      const isDisabled = await firstMoveUp.isDisabled()
      expect(isDisabled).toBe(true)
    })

    test('move-down reorders items correctly', async ({ page }) => {
      const moveDownButtons = page.locator('[data-testid^="move-down-"]')
      const firstMoveDown = moveDownButtons.first()
      const firstItem = page.locator('[data-testid^="ordered-item-"]').first()
      const initialLabel = await firstItem.locator('.ordered-list__label').textContent()

      await firstMoveDown.click()

      const secondItem = page.locator('[data-testid^="ordered-item-"]').nth(1)
      const newLabel = await secondItem.locator('.ordered-list__label').textContent()
      expect(newLabel).toBe(initialLabel)
    })
  })

  test.describe('RelationshipBuilder', () => {
    test('renders three-column layout', async ({ page }) => {
      const builder = page.locator('[data-testid="relationship-builder"]').first()
      await expect(builder).toBeVisible()
    })

    test('renders source, predicate, and target columns', async ({ page }) => {
      const sourceInput = page.locator('[data-testid="entity-picker-input"]').nth(0)
      const predicateSelect = page.locator('[data-testid="predicate-select"]').first()
      const targetInput = page.locator('[data-testid="entity-picker-input"]').nth(1)

      await expect(sourceInput).toBeVisible()
      await expect(predicateSelect).toBeVisible()
      await expect(targetInput).toBeVisible()
    })

    test('displays selected source entity', async ({ page }) => {
      const sourceInput = page.locator('[data-testid="entity-picker-input"]').nth(0)
      await sourceInput.fill('user')
      // Wait for dropdown to appear with a timeout
      const dropdown = page.locator('[data-testid="entity-picker-dropdown"]').first()
      await dropdown.waitFor({ timeout: 5000 })

      const firstResult = page.locator('[data-testid^="entity-picker-result-"]').first()
      await firstResult.click()

      // The input should be cleared after selection
      const inputValue = await sourceInput.inputValue()
      expect(inputValue).toBe('')
    })

    test('displays selected target entity', async ({ page }) => {
      const targetInputs = page.locator('[data-testid="entity-picker-input"]')
      const targetInput = targetInputs.nth(1)
      await targetInput.fill('account')
      // Wait for dropdown to appear
      const dropdown = page.locator('[data-testid="entity-picker-dropdown"]').last()
      await dropdown.waitFor({ timeout: 5000 })

      const firstResult = page.locator('[data-testid^="entity-picker-result-"]').first()
      await firstResult.click()

      // The input should be cleared after selection
      const inputValue = await targetInput.inputValue()
      expect(inputValue).toBe('')
    })
  })

  test.describe('RowMenu', () => {
    test('renders trigger button', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await expect(trigger).toBeVisible()
    })

    test('opens dropdown on trigger click', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await trigger.click()
      const dropdown = page.locator('[data-testid="row-menu-dropdown"]').first()
      await expect(dropdown).toBeVisible()
    })

    test('renders action items', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await trigger.click()
      const actions = page.locator('[data-testid^="row-menu-action-"]')
      const count = await actions.count()
      expect(count).toBeGreaterThan(0)
    })

    test('closes dropdown on action selection', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await trigger.click()
      const firstAction = page.locator('[data-testid^="row-menu-action-"]').first()
      await firstAction.click()
      const dropdown = page.locator('[data-testid="row-menu-dropdown"]')
      await expect(dropdown).not.toBeVisible()
    })

    test('closes dropdown on Escape key', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await trigger.click()
      const dropdown = page.locator('[data-testid="row-menu-dropdown"]').first()
      await expect(dropdown).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dropdown).not.toBeVisible()
    })

    test('closes dropdown on outside click', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await trigger.click()
      const dropdown = page.locator('[data-testid="row-menu-dropdown"]').first()
      await expect(dropdown).toBeVisible()
      await page.click('body', { position: { x: 0, y: 0 } })
      await expect(dropdown).not.toBeVisible()
    })

    test('renders danger items in rose text', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await trigger.click()
      const dangerAction = page.locator('.row-menu__action--danger').first()
      await expect(dangerAction).toBeVisible()
    })
  })

  test.describe('PipelineCard', () => {
    test('renders pipeline card', async ({ page }) => {
      const card = page.locator('[data-testid="pipeline-card"]').first()
      await expect(card).toBeVisible()
    })

    test('renders card title', async ({ page }) => {
      const title = page.locator('.pipeline-card__title').first()
      await expect(title).toContainText('Ingest organisms')
    })

    test('renders all pipeline stages', async ({ page }) => {
      const stages = page.locator('[data-testid^="pipeline-stage-"]')
      const count = await stages.count()
      expect(count).toBeGreaterThan(0)
    })

    test('renders stage connectors', async ({ page }) => {
      const connectors = page.locator('.pipeline-card__connector')
      const count = await connectors.count()
      expect(count).toBeGreaterThan(0)
    })

    test('renders status badge', async ({ page }) => {
      const statusBadge = page.locator('.pipeline-card__status').first()
      await expect(statusBadge).toBeVisible()
    })

    test('renders statistics footer', async ({ page }) => {
      const stats = page.locator('.pipeline-card__stat')
      const count = await stats.count()
      expect(count).toBeGreaterThan(0)
    })

    test('renders stage names and labels', async ({ page }) => {
      const stageNames = page.locator('.pipeline-card__stage-name')
      const stageLabels = page.locator('.pipeline-card__stage-label')
      const nameCount = await stageNames.count()
      const labelCount = await stageLabels.count()
      expect(nameCount).toBe(labelCount)
      expect(nameCount).toBeGreaterThan(0)
    })

    test('renders different status colors', async ({ page }) => {
      const iconContainers = page.locator('.pipeline-card__icon-container')
      const count = await iconContainers.count()
      expect(count).toBeGreaterThan(0)
    })

    test('renders success status variant correctly', async ({ page }) => {
      const cards = page.locator('[data-testid="pipeline-card"]')
      const successCard = cards.nth(0)
      const stages = successCard.locator('[data-testid^="pipeline-stage-"]')
      const count = await stages.count()
      expect(count).toBe(4)
      await expect(successCard).toHaveScreenshot('pipeline-card-success-variant.png')
    })

    test('renders pending status variant correctly', async ({ page }) => {
      const cards = page.locator('[data-testid="pipeline-card"]')
      const pendingCard = cards.nth(1)
      const stages = pendingCard.locator('[data-testid^="pipeline-stage-"]')
      const count = await stages.count()
      expect(count).toBe(4)
      await expect(pendingCard).toHaveScreenshot('pipeline-card-pending-variant.png')
    })

    test('renders running status variant correctly', async ({ page }) => {
      const cards = page.locator('[data-testid="pipeline-card"]')
      const runningCard = cards.nth(2)
      const stages = runningCard.locator('[data-testid^="pipeline-stage-"]')
      const count = await stages.count()
      expect(count).toBe(4)
      await expect(runningCard).toHaveScreenshot('pipeline-card-running-variant.png')
    })

    test('renders failed status variant correctly', async ({ page }) => {
      const cards = page.locator('[data-testid="pipeline-card"]')
      const failedCard = cards.nth(3)
      const stages = failedCard.locator('[data-testid^="pipeline-stage-"]')
      const count = await stages.count()
      expect(count).toBe(4)
      await expect(failedCard).toHaveScreenshot('pipeline-card-failed-variant.png')
    })
  })

  test.describe('FormCallout', () => {
    test('renders callout with icon', async ({ page }) => {
      const callouts = page.locator('[data-testid="form-callout"]')
      const count = await callouts.count()
      expect(count).toBeGreaterThan(0)
    })

    test('renders icon element', async ({ page }) => {
      const icon = page.locator('.form-callout__icon').first()
      await expect(icon).toBeVisible()
    })

    test('renders body text', async ({ page }) => {
      const body = page.locator('.form-callout__body').first()
      await expect(body).toBeVisible()
    })

    test('renders backtick segments as code', async ({ page }) => {
      const code = page.locator('.form-callout__code').first()
      await expect(code).toBeVisible()
    })

    test('code elements use monospace font', async ({ page }) => {
      const code = page.locator('.form-callout__code').first()
      const fontFamily = await code.evaluate((el) => window.getComputedStyle(el).fontFamily)
      expect(fontFamily).toContain('mono')
    })

    test('renders callout without icon gap when no icon', async ({ page }) => {
      const callouts = page.locator('[data-testid="form-callout"]')
      const count = await callouts.count()
      const lastCallout = callouts.nth(count - 1)
      const iconDiv = lastCallout.locator('.form-callout__icon')
      const iconCount = await iconDiv.count()
      expect(iconCount).toBe(0)
    })
  })

  test.describe('Visual Regression - Light Canvas', () => {
    test('EntityPicker visual snapshot', async ({ page }) => {
      const picker = page.locator('[data-testid="entity-picker-input"]').first().locator('..')
      await expect(picker).toHaveScreenshot('entity-picker-light.png')
    })

    test('KeyValueEditor visual snapshot', async ({ page }) => {
      const editor = page.locator('[data-testid="key-value-editor"]').first()
      await expect(editor).toHaveScreenshot('key-value-editor-light.png')
    })

    test('OrderedList visual snapshot', async ({ page }) => {
      const list = page.locator('[data-testid="ordered-list"]').first()
      await expect(list).toHaveScreenshot('ordered-list-light.png')
    })

    test('PipelineCard visual snapshot', async ({ page }) => {
      const card = page.locator('[data-testid="pipeline-card"]').first()
      await expect(card).toHaveScreenshot('pipeline-card-light.png')
    })

    test('FormCallout visual snapshot', async ({ page }) => {
      const callout = page.locator('[data-testid="form-callout"]').first()
      await expect(callout).toHaveScreenshot('form-callout-light.png')
    })

    test('RowMenu opened visual snapshot', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await trigger.click()
      const dropdown = page.locator('[data-testid="row-menu-dropdown"]').first()
      await expect(dropdown).toHaveScreenshot('row-menu-opened-light.png')
    })
  })

  test.describe('Dark Canvas Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        document.body.classList.add('dark-canvas')
      })
    })

    test('EntityPicker renders in dark mode', async ({ page }) => {
      const picker = page.locator('[data-testid="entity-picker-input"]').first()
      await expect(picker).toBeVisible()
    })

    test('KeyValueEditor renders in dark mode', async ({ page }) => {
      const editor = page.locator('[data-testid="key-value-editor"]').first()
      await expect(editor).toBeVisible()
    })

    test('OrderedList renders in dark mode', async ({ page }) => {
      const list = page.locator('[data-testid="ordered-list"]').first()
      await expect(list).toBeVisible()
    })

    test('RowMenu renders in dark mode', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await expect(trigger).toBeVisible()
    })

    test('PipelineCard renders in dark mode', async ({ page }) => {
      const card = page.locator('[data-testid="pipeline-card"]').first()
      await expect(card).toBeVisible()
    })

    test('FormCallout renders in dark mode', async ({ page }) => {
      const callout = page.locator('[data-testid="form-callout"]').first()
      await expect(callout).toBeVisible()
    })

    test('EntityPicker visual snapshot in dark mode', async ({ page }) => {
      const picker = page.locator('[data-testid="entity-picker-input"]').first().locator('..')
      await expect(picker).toHaveScreenshot('entity-picker-dark.png')
    })

    test('KeyValueEditor visual snapshot in dark mode', async ({ page }) => {
      const editor = page.locator('[data-testid="key-value-editor"]').first()
      await expect(editor).toHaveScreenshot('key-value-editor-dark.png')
    })

    test('OrderedList visual snapshot in dark mode', async ({ page }) => {
      const list = page.locator('[data-testid="ordered-list"]').first()
      await expect(list).toHaveScreenshot('ordered-list-dark.png')
    })

    test('RowMenu opened visual snapshot in dark mode', async ({ page }) => {
      const trigger = page.locator('[data-testid="row-menu-trigger"]').first()
      await trigger.click()
      const dropdown = page.locator('[data-testid="row-menu-dropdown"]').first()
      await expect(dropdown).toHaveScreenshot('row-menu-opened-dark.png')
    })

    test('PipelineCard visual snapshot in dark mode', async ({ page }) => {
      const card = page.locator('[data-testid="pipeline-card"]').first()
      await expect(card).toHaveScreenshot('pipeline-card-dark.png')
    })

    test('FormCallout visual snapshot in dark mode', async ({ page }) => {
      const callout = page.locator('[data-testid="form-callout"]').first()
      await expect(callout).toHaveScreenshot('form-callout-dark.png')
    })
  })
})
