import { test, expect, type Page } from '@playwright/test'

// Regression for tinkermonkey/heimdall#304: accessible names for graph edges and popover dialogs
// must use node labels, not node/edge ids (UUIDs in real consumers). See GraphA11yNamesTestPage.
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

const ALERT_ID = '758a1c95-870f-4667-b49d-6d6a1724fcd0'
const LABELLED_EDGE_ID = 'b1e4f0a2-6c3d-4f9e-8a7b-2d5c1e0f9a83'
const UNLABELLED_EDGE_ID = 'c7a9d3e5-1f2b-4c6a-9e8d-3b4a5f6c7d02'

const LABELLED_EDGE_NAME = 'monitors: WebSocket Disconnect Alert to Connection State Gauge'
const UNLABELLED_EDGE_NAME = 'Socket Client to Connection State Gauge'

// Keyboard activation, the path a screen reader user takes. With the default edge renderer and
// onEdgeSelect set, a pointer click on the line is handled by GraphEdgeShape (select only) and
// doesn't reach the popover handler on the edge's <g>.
async function openEdgePopover(page: Page, edgeId: string) {
  await page.getByTestId(`graph-edge-${edgeId}`).focus()
  await page.keyboard.press('Enter')
}

test.describe('GraphCanvas accessible names (#304)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=graph-a11y-names')
    await expect(page.getByTestId(`graph-edge-${LABELLED_EDGE_ID}`)).toBeVisible()
  })

  test('interactive edges are named by node labels, not ids', async ({ page }) => {
    const labelled = page.getByTestId(`graph-edge-${LABELLED_EDGE_ID}`)
    const unlabelled = page.getByTestId(`graph-edge-${UNLABELLED_EDGE_ID}`)

    await expect(labelled).toHaveAttribute('aria-label', LABELLED_EDGE_NAME)
    await expect(unlabelled).toHaveAttribute('aria-label', UNLABELLED_EDGE_NAME)
    expect(await labelled.getAttribute('aria-label')).not.toMatch(UUID)
    expect(await unlabelled.getAttribute('aria-label')).not.toMatch(UUID)

    // The computed accessible name, as a screen reader would get it.
    await expect(page.getByRole('button', { name: LABELLED_EDGE_NAME, exact: true })).toHaveCount(1)
    await expect(page.getByRole('button', { name: UNLABELLED_EDGE_NAME, exact: true })).toHaveCount(1)
  })

  test('node popover dialog is named by the node label', async ({ page }) => {
    await page.getByTestId(`graph-node-${ALERT_ID}`).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAccessibleName('Details for WebSocket Disconnect Alert')
    expect(await dialog.getAttribute('aria-label')).not.toMatch(UUID)
  })

  test('edge popover dialog is named by edge and node labels', async ({ page }) => {
    await openEdgePopover(page, LABELLED_EDGE_ID)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAccessibleName(`Details for ${LABELLED_EDGE_NAME}`)
    expect(await dialog.getAttribute('aria-label')).not.toMatch(UUID)
  })

  test('popover dialog for an unlabelled edge is named by node labels', async ({ page }) => {
    await openEdgePopover(page, UNLABELLED_EDGE_ID)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAccessibleName(`Details for ${UNLABELLED_EDGE_NAME}`)
    expect(await dialog.getAttribute('aria-label')).not.toMatch(UUID)
  })
})
