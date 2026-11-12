import { test, expect, type Locator, type Page } from '@playwright/test'

// Link variants (`href`) of Sidebar, NavItem and QuickAccessTile, and a server render of
// ShellLayout + ActivityTimeline + MiniCalendar hydrated in place (0.13.0, for static sites).
// Page: src/test-pages/StaticLinksTestPage.tsx (?example=static-links). The page also loads a
// typical site stylesheet (`a { text-decoration: underline }`) the link variants must ignore.

async function boxAndStyle(locator: Locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      width: Math.round(r.width * 10) / 10,
      height: Math.round(r.height * 10) / 10,
      color: cs.color,
      background: cs.backgroundColor,
      fontSize: cs.fontSize,
      textDecoration: cs.textDecorationLine,
      padding: cs.padding,
    }
  })
}

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => window.__staticLinks?.hydrated === true)
}

test.describe('static sites: link variants', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?example=static-links')
  })

  test('Sidebar items with href render links with the same box as the buttons', async ({ page }) => {
    const buttons = page.getByTestId('sidebar-buttons')
    const links = page.getByTestId('sidebar-links')

    const home = links.locator('a.sidebar__item', { hasText: 'Home' })
    await expect(home).toHaveAttribute('href', '#home')
    await expect(home).toHaveAttribute('aria-current', 'page')
    await expect(links.locator('a.sidebar__item', { hasText: 'About' })).not.toHaveAttribute('aria-current', /.*/)
    await expect(links.locator('a.sidebar__item--child', { hasText: 'Graphs' })).toHaveAttribute('href', '#topic-graphs')
    // A parent with children stays the button that expands them.
    const topics = links.locator('.sidebar__item', { hasText: 'Topics' })
    await expect(topics).toHaveJSProperty('tagName', 'BUTTON')
    await expect(topics).toHaveAttribute('aria-expanded', 'true')

    for (const label of ['Home', 'Graphs', 'Layout', 'About']) {
      const button = await boxAndStyle(buttons.locator('button.sidebar__item', { hasText: label }))
      const link = await boxAndStyle(links.locator('a.sidebar__item', { hasText: label }))
      expect(link, label).toEqual({ ...button, textDecoration: 'none' })
    }
  })

  test('clicking a Sidebar link calls onSelectItem and follows the link', async ({ page }) => {
    const links = page.getByTestId('sidebar-links')
    await links.locator('a.sidebar__item', { hasText: 'About' }).hover()
    await expect(links.locator('a.sidebar__item', { hasText: 'About' })).toHaveCSS('text-decoration-line', 'none')
    await links.locator('a.sidebar__item', { hasText: 'About' }).click()
    await expect(page.getByTestId('selected-item')).toHaveText('about')
    await expect(page).toHaveURL(/#about$/)

    await links.locator('a.sidebar__item--child', { hasText: 'Layout' }).click()
    await expect(page.getByTestId('selected-item')).toHaveText('topic-layout')
    await expect(page).toHaveURL(/#topic-layout$/)
  })

  test('NavItem with href renders a link matching the button', async ({ page }) => {
    const link = page.getByTestId('nav-link')
    await expect(link).toHaveJSProperty('tagName', 'A')
    await expect(link).toHaveAttribute('href', '#dashboard')
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(link).not.toHaveAttribute('type', /.*/)
    await expect(page.getByTestId('nav-button')).toHaveAttribute('type', 'button')

    expect(await boxAndStyle(link)).toEqual({
      ...(await boxAndStyle(page.getByTestId('nav-button'))),
      textDecoration: 'none',
    })
    expect(await boxAndStyle(page.getByTestId('nav-link-idle'))).toEqual({
      ...(await boxAndStyle(page.getByTestId('nav-button-idle'))),
      textDecoration: 'none',
    })
  })

  test('QuickAccessTile with href renders a link matching the button', async ({ page }) => {
    const link = page.getByTestId('tile-link')
    await expect(link).toHaveJSProperty('tagName', 'A')
    await expect(link).toHaveAttribute('href', '#schema')
    expect(await boxAndStyle(link)).toEqual({
      ...(await boxAndStyle(page.getByTestId('tile-button'))),
      textDecoration: 'none',
    })
    await link.click()
    await expect(page.getByTestId('tile-clicks')).toHaveText('1')
    await expect(page).toHaveURL(/#schema$/)
  })
})

test.describe('static sites: server render + hydration', () => {
  test('desktop: hydrates without mismatches, with fixed relative times', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?example=static-links')
    await waitForHydration(page)

    const host = page.getByTestId('hydration-host')
    await expect(host).toHaveAttribute('data-server-mobile', 'unset')
    expect(await page.evaluate(() => window.__staticLinks?.hydrationErrors)).toEqual([])
    await expect(host.locator('.shell-layout')).toHaveAttribute('data-mobile', 'false')
    await expect(host.locator('.shell-layout__sidebar-col')).toBeVisible()
    await expect(host.locator('[data-testid="activity-timestamp"]')).toHaveText(['5m ago', '3h ago'])
    await expect(host.locator('.mini-calendar__date--today')).toHaveText('12')
  })

  test('mobile: hydrates without mismatches, then switches to the drawer layout', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /hydrat|did not match/i.test(msg.text())) errors.push(msg.text())
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/?example=static-links')
    await waitForHydration(page)

    const host = page.getByTestId('hydration-host')
    expect(await page.evaluate(() => window.__staticLinks?.hydrationErrors)).toEqual([])
    expect(errors).toEqual([])
    const shell = host.locator('.shell-layout')
    await expect(shell).toHaveAttribute('data-mobile', 'true')
    await expect(host.locator('.shell-layout__sidebar-col')).toHaveCount(0)
    await expect(host.locator('.topbar__search-wrap')).toHaveCount(0)

    // A link in the mobile drawer closes it.
    await host.getByRole('button', { name: 'Open sidebar menu' }).click()
    const drawer = host.locator('.drawer[data-open="true"]')
    await expect(drawer).toBeVisible()
    await drawer.locator('a.sidebar__item', { hasText: 'About' }).click()
    await expect(page.getByTestId('hydrated-selected')).toHaveText('about')
    await expect(host.locator('.drawer[data-open="true"]')).toHaveCount(0)

    await host.getByRole('button', { name: 'Open sidebar menu' }).click()
    await expect(host.locator('.drawer[data-open="true"]')).toBeVisible()
    await host.locator('.drawer[data-open="true"]').getByTestId('hydrated-footer-link').click()
    await expect(host.locator('.drawer[data-open="true"]')).toHaveCount(0)
    await expect(page).toHaveURL(/#footer-link$/)
  })

  test('mobile: before hydration, CSS alone hides the desktop sidebar column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/?example=static-links')
    await waitForHydration(page)
    // Re-inject the server HTML without hydrating it: what a phone shows before the island loads.
    const display = await page.evaluate(() => {
      const box = document.createElement('div')
      box.innerHTML = window.__staticLinks!.serverHtml
      document.body.appendChild(box)
      const col = box.querySelector('.shell-layout__sidebar-col')
      const search = box.querySelector('.topbar__search-wrap')
      const result = {
        dataMobile: box.querySelector('.shell-layout')?.getAttribute('data-mobile') ?? 'unset',
        sidebarCol: col ? getComputedStyle(col).display : 'missing',
        search: search ? getComputedStyle(search).display : 'missing',
      }
      box.remove()
      return result
    })
    expect(display).toEqual({ dataMobile: 'unset', sidebarCol: 'none', search: 'none' })
  })
})
