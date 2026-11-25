import { test, expect, type Page } from '@playwright/test'

// BranchMap on House data (src/test-pages/branchMap/BranchMapTestPage.tsx): the House adapter
// (houseBranchMapAdapter.ts) feeding the library view. The mapping is unit-tested in
// houseBranchMapAdapter.test.ts and the layout in src/utils/__tests__/branchMap.test.ts; this
// checks selection, the keyboard, expanding bundles, and both canvases.
//
// Accessible names follow BranchMap's: a station is "<label>, <kind>, <status>, …", a line
// "<label>, line, <status>, …", a bundle "<label>, <n> lines, <group>; Enter expands", a group's
// toggle "Expand <group>: …" / "Collapse <group>: …".

const BASE = '/?example=branch-map'
const THREE = '&projects=heimdall,dr_viewer,context_studio'
const DR = '&projects=documentation_robotics'

async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto(BASE + query)
  await page.waitForLoadState('networkidle')
  await expect(map(page)).toBeVisible()
  await expect(map(page).getByRole('button').first()).toBeVisible()
  return errors
}

const map = (page: Page) => page.getByTestId('branch-map')
const selection = (page: Page) => page.getByTestId('branch-map-selection')
const expandedIds = (page: Page) => page.getByTestId('branch-map-expanded')
const station = (page: Page, label: string) => map(page).getByRole('button', { name: new RegExp(`^${label}, (stop|decision),`) })
const line = (page: Page, label: string) => map(page).getByRole('button', { name: new RegExp(`^${label}, line,`) })
const bundles = (page: Page) => map(page).getByRole('button', { name: /, \d+ lines, .*; Enter expands$/ })

test.describe('BranchMap on House data', () => {
  test('draws the three projects from now with no console errors', async ({ page }) => {
    const errors = await open(page, THREE)
    await expect(page.getByTestId('branch-map-caption')).toContainText('3 projects')
    await expect(station(page, 'DR model gaps closed')).toBeVisible()
    await expect(line(page, 'Close the DR model gaps')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('click selects a station and a line, again clears; the inspector shows the House record', async ({ page }) => {
    await open(page, THREE)
    await station(page, 'DR model gaps closed').click()
    await expect(selection(page)).toHaveText('selected 2:01a21304-8568-7764-8fd8-9e59109b856b')
    const inspector = page.getByRole('complementary', { name: 'Inspector' })
    await expect(inspector.getByRole('heading', { name: 'DR model gaps closed' })).toBeVisible()
    await expect(inspector).toContainText('MILESTONE')

    await line(page, 'Close the DR model gaps').click()
    await expect(inspector).toContainText('WORKSTREAM')
    await expect(inspector.getByRole('heading', { name: 'Close the DR model gaps' })).toBeVisible()

    await line(page, 'Close the DR model gaps').click()
    await expect(selection(page)).toHaveText('selected none')
  })

  test('keyboard: Tab reaches the map items, Enter selects, Escape clears', async ({ page }) => {
    await open(page, THREE)
    const target = station(page, 'DR model gaps closed')
    await target.focus()
    await expect(target).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(selection(page)).toHaveText('selected 2:01a21304-8568-7764-8fd8-9e59109b856b')
    await expect(target).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(selection(page)).toHaveText('selected none')
  })

  test('Documentation Robotics bundles past the lane budget; a bundle and the group expand', async ({ page }) => {
    await open(page, DR)
    await expect(page.getByTestId('branch-map-caption')).toContainText('20 lines')
    await expect(page.getByTestId('branch-map-caption')).not.toContainText(' 0 bundled')
    const before = await bundles(page).count()
    expect(before).toBeGreaterThan(0)

    // Activating a bundle draws its lines.
    await bundles(page).first().focus()
    await page.keyboard.press('Enter')
    await expect(expandedIds(page)).not.toHaveText('expanded none')
    await expect(bundles(page)).toHaveCount(before - 1)

    // The group toggle draws every line, and collapses again.
    await map(page).getByRole('button', { name: /^Expand Documentation Robotics:/ }).click()
    await expect(expandedIds(page)).toContainText('documentation_robotics')
    await expect(bundles(page)).toHaveCount(0)
    await expect(page.getByTestId('branch-map-caption')).toContainText(' 0 bundled')
    await map(page).getByRole('button', { name: /^Collapse Documentation Robotics:/ }).click()
    await expect(expandedIds(page)).not.toContainText('documentation_robotics')
  })

  test('the inspector links to what a station waits on, in another project', async ({ page }) => {
    await open(page, '&projects=dr_viewer,documentation_robotics&select=2:01a2126b-9188-7166-993a-57a161430ba2')
    const inspector = page.getByRole('complementary', { name: 'Inspector' })
    await expect(inspector.getByRole('heading', { name: 'C4 rules read from the DR spec' })).toBeVisible()
    await expect(map(page).locator('[data-link-id="dep:2:01a2126b-8f64-7118-bd9a-b2ab16732148->2:01a2126b-9188-7166-993a-57a161430ba2"]')).toHaveCount(1)
    await inspector.getByRole('button', { name: 'C4 mapping in the DR spec' }).click()
    await expect(selection(page)).toHaveText('selected 2:01a2126b-8f64-7118-bd9a-b2ab16732148')
  })
})

test.describe('BranchMap on House data: visual', () => {
  for (const dark of [false, true]) {
    test(`three projects from now, ${dark ? 'dark' : 'light'} canvas`, async ({ page }) => {
      await open(page, THREE + (dark ? '&dark=1' : ''))
      await expect(map(page)).toHaveScreenshot(`branch-map-three-projects-${dark ? 'dark' : 'light'}.png`)
    })
  }

  test('Documentation Robotics, bundled', async ({ page }) => {
    await open(page, DR)
    await expect(map(page)).toHaveScreenshot('branch-map-dr-bundled.png')
  })

  test('Documentation Robotics, expanded', async ({ page }) => {
    await open(page, `${DR}&expand=documentation_robotics`)
    await expect(map(page)).toHaveScreenshot('branch-map-dr-expanded.png')
  })
})
