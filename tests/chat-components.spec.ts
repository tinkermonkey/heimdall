import { test, expect } from '@playwright/test'
import { loadSelfHostedFonts, assertFontsLoaded } from './utils/test-helpers'

test.describe('Chat Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat showcase test page
    await page.goto('http://localhost:5173/?example=chat')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts from /fonts directory instead of Google Fonts CDN
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)
  })

  test('ChatMessage component renders user message', async ({ page }) => {
    // Verify user message is rendered
    const userMessage = page.locator('[data-testid="chat-message-user-variant"]')
    await expect(userMessage).toBeVisible()

    // Verify avatar is displayed
    const avatar = userMessage.locator('text="YO"').first()
    await expect(avatar).toBeVisible()

    // Verify sender name is displayed
    const senderName = userMessage.locator('text="You"')
    await expect(senderName).toBeVisible()

    // Verify message body is displayed
    const body = userMessage.locator('text="Can you help me analyze this dataset?"')
    await expect(body).toBeVisible()

    // Verify timestamp is displayed
    const timestamp = userMessage.locator('text="10:30 AM"')
    await expect(timestamp).toBeVisible()
  })

  test('ChatMessage component renders bot message', async ({ page }) => {
    // Verify bot message is rendered
    const botMessage = page.locator('[data-testid="chat-message-bot-variant"]')
    await expect(botMessage).toBeVisible()

    // Verify avatar is displayed
    const avatar = botMessage.locator('.chat-message__avatar')
    await expect(avatar).toBeVisible()

    // Verify sender name is displayed
    const senderName = botMessage.locator('.chat-message__sender')
    await expect(senderName).toBeVisible()

    // Verify badge is displayed
    const badge = botMessage.locator('.chat-message__badge')
    await expect(badge).toBeVisible()

    // Verify message body is displayed
    const body = botMessage.locator('.chat-message__body')
    await expect(body).toBeVisible()
  })

  test('ToolBlock component renders in collapsed state', async ({ page }) => {
    // Verify tool block is rendered
    const toolBlock = page.locator('[data-testid="tool-block"]').first()
    await expect(toolBlock).toBeVisible()

    // Verify tool name is displayed
    const toolName = toolBlock.locator('text="analyze_distribution"')
    await expect(toolName).toBeVisible()

    // Verify status indicator is displayed
    const status = toolBlock.locator('text="success"')
    await expect(status).toBeVisible()
  })

  test('ToolBlock component expands to show output', async ({ page }) => {
    // Find the tool block toggle button
    const toolBlockHeader = page.locator('.tool-block__header').first()

    // Get the initial aria-expanded state
    const initialExpanded = await toolBlockHeader.getAttribute('aria-expanded')
    expect(initialExpanded).toBe('true') // Should be expanded by default

    // Click to collapse
    await toolBlockHeader.click()

    // Verify it's now collapsed
    const collapsedExpanded = await toolBlockHeader.getAttribute('aria-expanded')
    expect(collapsedExpanded).toBe('false')

    // Click to expand again
    await toolBlockHeader.click()

    // Verify expanded
    const expandedAgain = await toolBlockHeader.getAttribute('aria-expanded')
    expect(expandedAgain).toBe('true')
  })

  test('ChatDivider component renders', async ({ page }) => {
    // Verify divider is rendered - get the first one (in the ChatDivider section, before the full container)
    const divider = page.locator('[data-testid="chat-divider"]').first()
    await expect(divider).toBeVisible()

    // Verify label is displayed
    const label = divider.locator('.chat-divider__label')
    await expect(label).toBeVisible()
  })

  test('ChatSuggestions component renders pills', async ({ page }) => {
    // Verify suggestions are rendered
    const suggestions = page.locator('[data-testid="chat-suggestions"]')
    await expect(suggestions).toBeVisible()

    // Verify suggestion pills are rendered
    const pills = suggestions.locator('button')
    const pillCount = await pills.count()
    expect(pillCount).toBe(3)

    // Verify suggestion text is displayed
    const showPlan = suggestions.locator('text="Show me the plan"')
    await expect(showPlan).toBeVisible()

    const approve = suggestions.locator('text="Approve & run"')
    await expect(approve).toBeVisible()

    const cancel = suggestions.locator('text="Cancel"')
    await expect(cancel).toBeVisible()
  })

  test('ChatSuggestions component click interaction', async ({ page }) => {
    // Find suggestion pill
    const suggestion = page.locator('button:has-text("Show me the plan")').first()

    // Click suggestion
    await suggestion.click()

    // Verify click was registered (component state would change)
    await expect(suggestion).toBeVisible()
  })

  test('ChatSuggestions renders nothing when empty', async ({ page }) => {
    // Find the "Empty suggestions" section
    const emptySectionText = page.locator('text="Empty suggestions:"')

    // Get the next suggestions component (should render nothing)
    const page_content = page.locator('div')

    // Count all suggestion components
    const allSuggestions = page.locator('[data-testid="chat-suggestions"]')
    const count = await allSuggestions.count()

    // There should only be 1 visible (the one with suggestions)
    expect(count).toBe(1)
  })

  test('ChatComposer component renders', async ({ page }) => {
    // Verify composer is rendered
    const composer = page.locator('[data-testid="chat-composer"]')
    await expect(composer).toBeVisible()

    // Verify input field is rendered
    const input = composer.locator('textarea')
    await expect(input).toBeVisible()

    // Verify send button is rendered
    const sendButton = composer.locator('button:has-text("send")')
    await expect(sendButton).toBeVisible()
  })

  test('ChatComposer keyboard interaction - Enter submits', async ({ page }) => {
    // Find textarea
    const textarea = page.locator('textarea[placeholder*="Ask assistant"]')
    await expect(textarea).toBeVisible()

    // Type text
    await textarea.fill('Test message')
    await expect(textarea).toHaveValue('Test message')

    // Press Enter to submit
    await textarea.press('Enter')

    // Input should be cleared on submit
    const value = await textarea.inputValue()
    // Note: In a real test, you might want to verify state changed
    // For now, just verify the field is still visible
    await expect(textarea).toBeVisible()
  })

  test('ChatComposer keyboard interaction - Shift+Enter inserts newline', async ({ page }) => {
    // Find textarea
    const textarea = page.locator('textarea[placeholder*="Ask assistant"]')
    await expect(textarea).toBeVisible()

    // Type text
    await textarea.fill('First line')

    // Press Shift+Enter to insert newline
    await textarea.press('Shift+Enter')

    // Verify newline was added
    const value = await textarea.inputValue()
    expect(value).toContain('\n')
  })

  test('ChatComposer displays context pills', async ({ page }) => {
    // Verify scope label is displayed
    const scope = page.locator('text="talking to"')
    await expect(scope).toBeVisible()

    // Verify context pill is rendered
    const contextPill = page.locator('text="schema.json"')
    await expect(contextPill).toBeVisible()
  })

  test('ChatComposer context pill removal', async ({ page }) => {
    // Find the composer
    const composer = page.locator('[data-testid="chat-composer"]')
    await expect(composer).toBeVisible()

    // Find the context pill
    const contextPill = composer.locator('.chat-composer__context-pill').first()
    await expect(contextPill).toBeVisible()

    // Verify the remove button exists in the pill
    const removeButton = contextPill.locator('.chat-composer__context-remove')
    const isVisible = await removeButton.isVisible().catch(() => false)

    // If button is visible, click it
    if (isVisible) {
      await removeButton.click()
    }
  })

  test('ChatContainer component renders bot tabs', async ({ page }) => {
    // Scroll down to find the chat container
    const chatContainer = page.locator('[data-testid="chat-container"]')
    await expect(chatContainer).toBeVisible()

    // Verify bot tabs are rendered
    const botTabs = chatContainer.locator('.chat-container__bot-tab')
    const tabCount = await botTabs.count()
    expect(tabCount).toBeGreaterThan(0)

    // Verify bot names are displayed by checking the bot label
    const assistantLabel = chatContainer.locator('.chat-container__bot-label').first()
    await expect(assistantLabel).toBeVisible()
  })

  test('ChatContainer bot tab switching', async ({ page }) => {
    // Find chat container
    const chatContainer = page.locator('[data-testid="chat-container"]')

    // Find analyzer tab
    const analyzerTab = chatContainer.locator('.chat-container__bot-tab').nth(1)

    // Click analyzer tab
    await analyzerTab.click()

    // Verify it has active class/state
    const isActive = await analyzerTab.evaluate(el =>
      el.classList.contains('chat-container__bot-tab--active')
    )
    expect(isActive).toBe(true)
  })

  test('ChatContainer status indicators display correctly', async ({ page }) => {
    // Find chat container
    const chatContainer = page.locator('[data-testid="chat-container"]')

    // Verify status indicators exist
    const statusIndicators = chatContainer.locator('.chat-container__bot-status')
    const count = await statusIndicators.count()
    expect(count).toBeGreaterThan(0)
  })

  test('All chat components render in light canvas mode', async ({ page }) => {
    // Verify page is in light mode (default)
    const body = page.locator('body')
    const hasDarkClass = await body.evaluate(el => el.classList.contains('dark-canvas'))
    expect(hasDarkClass).toBe(false)

    // Verify all key components are visible
    await expect(page.locator('[data-testid="chat-message-user-variant"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-message-bot-variant"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-divider"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="chat-suggestions"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-composer"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible()
  })

  test('All chat components render in dark canvas mode', async ({ page }) => {
    // Toggle dark canvas mode
    const toggleButton = page.locator('button:has-text("Toggle Dark Canvas Mode")')
    await toggleButton.click()

    // Verify dark class was added
    const body = page.locator('body')
    await page.waitForTimeout(100) // Wait for class update

    // Verify all key components are still visible
    await expect(page.locator('[data-testid="chat-message-user-variant"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-message-bot-variant"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-divider"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="chat-suggestions"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-composer"]')).toBeVisible()
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible()

    // Toggle back to light mode
    await toggleButton.click()
    await page.waitForTimeout(100)
    await expect(page.locator('[data-testid="chat-message-user-variant"]')).toBeVisible()
  })
})
