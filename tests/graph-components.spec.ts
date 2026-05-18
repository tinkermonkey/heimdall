import { test, expect } from '@playwright/test'

test.describe('Graph Canvas Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=graph')
    await page.waitForLoadState('networkidle')
  })

  test('GraphCanvas renders with nodes', async ({ page }) => {
    const canvas = page.locator('.graph-canvas')
    await expect(canvas).toBeVisible()

    const nodes = page.locator('[data-testid^="graph-node-"]')
    const nodeCount = await nodes.count()
    expect(nodeCount).toBeGreaterThan(0)
  })

  test('GraphNode selection applies selected state', async ({ page }) => {
    const firstNode = page.locator('[data-testid="graph-node-cls_cell"]')
    await expect(firstNode).toBeVisible()

    await firstNode.click()
    await expect(firstNode).toHaveClass(/selected/)

    const inspectorTitle = page.locator('[data-testid="inspector-title"]')
    await expect(inspectorTitle).toContainText('Cell')
  })

  test('GraphCanvas panning works on mouse drag', async ({ page }) => {
    const canvas = page.locator('.graph-canvas')
    const stage = page.locator('.graph-stage')

    const initialTransform = await stage.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.transform
    })

    // Get canvas bounding box and calculate positions
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not visible')

    const startX = box.x + 100
    const startY = box.y + 100
    const endX = startX + 100
    const endY = startY + 100

    // Simulate pan by moving mouse
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(endX, endY, { steps: 10 })
    await page.mouse.up()

    await page.waitForTimeout(100)

    const newTransform = await stage.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.transform
    })

    expect(initialTransform).not.toBe(newTransform)
  })

  test('GraphCanvas zoom works with scroll', async ({ page }) => {
    const canvas = page.locator('.graph-canvas')
    const stage = page.locator('.graph-stage')

    const initialTransform = await stage.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.transform
    })

    await canvas.evaluate((el) => {
      const wheelEvent = new WheelEvent('wheel', {
        bubbles: true,
        ctrlKey: true,
        deltaY: 100,
      })
      el.dispatchEvent(wheelEvent)
    })

    await page.waitForTimeout(200)

    const newTransform = await stage.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.transform
    })

    expect(initialTransform).not.toBe(newTransform)
  })

  test('GraphInspector displays empty state when no node selected', async ({ page }) => {
    const emptyState = page.locator('[data-testid="inspector-empty"]')

    // Verify empty state is visible on initial load
    await expect(emptyState).toBeVisible()

    // Click a node to dismiss the empty state
    const allNodes = page.locator('[data-testid^="graph-node-"]')
    const firstNode = allNodes.first()

    await expect(firstNode).toBeVisible()
    await firstNode.click()

    await expect(emptyState).not.toBeVisible()
  })

  test('GraphInspector shows node metadata', async ({ page }) => {
    const cellNode = page.locator('[data-testid="graph-node-cls_cell"]')
    await cellNode.click()

    const title = page.locator('[data-testid="inspector-title"]')
    const id = page.locator('[data-testid="inspector-id"]')

    await expect(title).toContainText('Cell')
    await expect(id).toContainText('cls_cell')
  })

  test('GraphInspector shows relationships', async ({ page }) => {
    const nodeWithRels = page.locator('[data-testid="graph-node-cls_cell"]')
    await nodeWithRels.click()

    const outgoing = page.locator('[data-testid="inspector-outgoing"]')
    await expect(outgoing).toBeVisible()

    const relLinks = outgoing.locator('[data-testid^="inspector-rel-"]')
    const relCount = await relLinks.count()
    expect(relCount).toBeGreaterThan(0)
  })

  test('GraphEdge renders with correct path', async ({ page }) => {
    const edges = page.locator('[data-testid^="graph-edge-"]')
    const edgeCount = await edges.count()
    expect(edgeCount).toBeGreaterThan(0)

    const firstEdgeLine = page.locator('[data-testid^="graph-edge-line-"]').first()
    await expect(firstEdgeLine).toBeVisible()

    const pathData = await firstEdgeLine.getAttribute('d')
    expect(pathData).toBeTruthy()
    expect(pathData).toContain('M ')
  })

  test('GraphNode domainColor is applied correctly', async ({ page }) => {
    const lifeNode = page.locator('[data-testid="graph-node-cls_cell"]')
    const lifeNodeDomain = await lifeNode.getAttribute('data-domain')
    expect(lifeNodeDomain).toBe('life')

    const climateNode = page.locator('[data-testid="graph-node-cls_co2"]')
    const climateNodeDomain = await climateNode.getAttribute('data-domain')
    expect(climateNodeDomain).toBe('climate')
  })

  test('TopologyNode renders in topology view', async ({ page }) => {
    const topologyBtn = page.locator('button:has-text("Topology View")')
    await topologyBtn.click()

    const topologyNodes = page.locator('[data-testid^="topology-node-"]')
    const nodeCount = await topologyNodes.count()
    expect(nodeCount).toBeGreaterThan(0)
  })

  test('TopologyNode displays status dot', async ({ page }) => {
    const topologyBtn = page.locator('button:has-text("Topology View")')
    await topologyBtn.click()

    const statusDots = page.locator('[data-testid^="topology-status-"]')
    const dotCount = await statusDots.count()
    expect(dotCount).toBeGreaterThan(0)
  })

  test('SplitPane composition works with GraphCanvas and GraphInspector', async ({ page }) => {
    const splitPane = page.locator('.split-pane')
    await expect(splitPane).toBeVisible()

    const canvas = page.locator('.graph-canvas')
    const inspector = page.locator('.graph-inspector')

    await expect(canvas).toBeVisible()
    await expect(inspector).toBeVisible()
  })

  test('Node selection persists across canvas interactions', async ({ page }) => {
    const node1 = page.locator('[data-testid="graph-node-cls_cell"]')
    await node1.click()

    await expect(node1).toHaveClass(/selected/)
    let inspectorTitle = page.locator('[data-testid="inspector-title"]')
    await expect(inspectorTitle).toContainText('Cell')

    const node2 = page.locator('[data-testid="graph-node-cls_nucleus"]')
    await node2.click()

    await expect(node2).toHaveClass(/selected/)
    inspectorTitle = page.locator('[data-testid="inspector-title"]')
    await expect(inspectorTitle).toContainText('Nucleus')

    const node1Selected = await node1.evaluate((el) => {
      return el.classList.contains('selected')
    })
    expect(node1Selected).toBe(false)
  })

  test('Graph nodes are positioned correctly', async ({ page }) => {
    const node = page.locator('[data-testid="graph-node-cls_cell"]')
    const box = await node.boundingBox()

    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  })

  test('Canvas background grid is visible', async ({ page }) => {
    const grid = page.locator('.graph-grid')
    await expect(grid).toBeVisible()

    const gridProps = await grid.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        hasPosition: styles.position === 'absolute',
        hasBackground: !!styles.backgroundColor || !!styles.backgroundImage,
        isVisible: rect.width > 0 && rect.height > 0,
        width: rect.width,
        height: rect.height,
      }
    })

    expect(gridProps.isVisible).toBe(true)
    expect(gridProps.hasPosition).toBe(true)
    expect(gridProps.width).toBeGreaterThan(0)
    expect(gridProps.height).toBeGreaterThan(0)
  })
})
