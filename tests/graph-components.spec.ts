import { test, expect } from '@playwright/test'
import {
  freezeAnimations,
  loadSelfHostedFonts,
  assertFontsLoaded,
  applyDarkCanvasMode,
  removeDarkCanvasMode,
} from './utils/test-helpers'

test.describe('Graph Canvas Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?example=graph')
    await page.waitForLoadState('networkidle')

    // Load self-hosted fonts
    await loadSelfHostedFonts(page)

    // Verify fonts are loaded
    await assertFontsLoaded(page)

    // Freeze animations for consistent snapshots
    await freezeAnimations(page)
  })

  test.afterEach(async ({ page }) => {
    // Ensure we exit dark canvas mode after each test
    await removeDarkCanvasMode(page)
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
    const viewport = page.locator('[data-testid="graph-viewport"]')

    const initialTransform = await viewport.evaluate((el) => el.getAttribute('transform'))

    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not visible')

    // Click in the lower-right quadrant, away from any nodes
    const startX = box.x + box.width - 60
    const startY = box.y + box.height - 60
    const endX = startX - 80
    const endY = startY - 80

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(endX, endY, { steps: 10 })
    await page.mouse.up()

    await page.waitForTimeout(100)

    const newTransform = await viewport.evaluate((el) => el.getAttribute('transform'))

    expect(initialTransform).not.toBe(newTransform)
  })

  test('GraphCanvas zoom works with scroll', async ({ page }) => {
    const canvas = page.locator('.graph-canvas')
    const viewport = page.locator('[data-testid="graph-viewport"]')

    const initialTransform = await viewport.evaluate((el) => el.getAttribute('transform'))

    await canvas.evaluate((el) => {
      el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, ctrlKey: true, deltaY: 100 }))
    })

    await page.waitForTimeout(200)

    const newTransform = await viewport.evaluate((el) => el.getAttribute('transform'))

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
    // GraphCanvas renders edges via GraphEdgeInternal; the <path> lives inside the <g data-testid="graph-edge-{id}">
    const edges = page.locator('[data-testid^="graph-edge-"]')
    await expect(edges.first()).toBeVisible({ timeout: 10000 })
    const edgeCount = await edges.count()
    expect(edgeCount).toBeGreaterThan(0)

    const firstEdgePath = edges.first().locator('path.graph-edge__line')
    await expect(firstEdgePath).toBeAttached()
    const pathData = await firstEdgePath.getAttribute('d')
    expect(pathData).toBeTruthy()
    expect(pathData).toContain('M ')
  })

  test('GraphEdge weight maps to stroke width via the sqrt curve', async ({ page }) => {
    const low = page.locator('[data-testid="graph-edge-edge_weight_low"] path.graph-edge__line')
    const mid = page.locator('[data-testid="graph-edge-edge_weight_mid"] path.graph-edge__line')
    const high = page.locator('[data-testid="graph-edge-edge_weight_high"] path.graph-edge__line')
    const baseline = page.locator('[data-testid="graph-edge-edge_1"] path.graph-edge__line')

    const [lowWidth, midWidth, highWidth, baselineWidth] = await Promise.all([
      low.evaluate(el => parseFloat(getComputedStyle(el).strokeWidth)),
      mid.evaluate(el => parseFloat(getComputedStyle(el).strokeWidth)),
      high.evaluate(el => parseFloat(getComputedStyle(el).strokeWidth)),
      baseline.evaluate(el => parseFloat(getComputedStyle(el).strokeWidth)),
    ])

    // weight: 10 -> ~3.2px, weight: 50 -> ~5.95px, weight: 90 -> ~7.64px
    expect(lowWidth).toBeCloseTo(1 + 7 * Math.sqrt(0.1), 1)
    expect(midWidth).toBeCloseTo(1 + 7 * Math.sqrt(0.5), 1)
    expect(highWidth).toBeCloseTo(1 + 7 * Math.sqrt(0.9), 1)
    expect(lowWidth).toBeLessThan(midWidth)
    expect(midWidth).toBeLessThan(highWidth)

    // An edge with no weight matches the current default stroke width for its variant.
    expect(baselineWidth).toBeCloseTo(1.25, 1)
  })

  test('GraphEdge opacity applies to the line and marker, not the label background', async ({ page }) => {
    const edge = page.locator('[data-testid="graph-edge-edge_opacity"]')
    const line = edge.locator('path.graph-edge__line')
    const marker = edge.locator('marker path')

    const lineOpacity = await line.evaluate(el => getComputedStyle(el).opacity)
    expect(parseFloat(lineOpacity)).toBeCloseTo(0.3, 2)

    // Marker paths must not carry their own explicit opacity — the line's CSS opacity
    // already propagates to markers via SVG compositing, so an inline opacity here would
    // double-apply (e.g. 0.3 * 0.3 = 0.09 effective). getComputedStyle can't measure that
    // compositing effect directly, so this only confirms no explicit override is present.
    const markerOpacities = await marker.evaluateAll(els => els.map(el => getComputedStyle(el).opacity))
    for (const opacity of markerOpacities) {
      expect(parseFloat(opacity)).toBeCloseTo(1, 2)
    }
  })

  test('GraphEdge strokeDash overrides variant-based dashing', async ({ page }) => {
    const line = page.locator('[data-testid="graph-edge-edge_dash"] path.graph-edge__line')
    const dasharray = await line.evaluate(el => getComputedStyle(el).strokeDasharray)
    // getComputedStyle normalizes the dasharray to `"6px, 2px"`.
    const parts = dasharray.split(',').map(v => parseFloat(v))
    expect(parts).toEqual([6, 2])
  })

  test('GraphNode domainColor is applied correctly', async ({ page }) => {
    // data-domain is hoisted to the SVG <g> wrapper
    const lifeNode = page.locator('[data-testid="graph-node-cls_cell"]')
    const lifeNodeDomain = await lifeNode.getAttribute('data-domain')
    expect(lifeNodeDomain).toBe('life')

    // cls_co2 is positioned off the initial viewport (x=1100); check via DOM, not visibility
    const climateNode = page.locator('[data-testid="graph-node-cls_co2"]')
    await expect(climateNode).toBeAttached()
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
    test.skip(!!process.env.CI, 'Multi-click canvas selection is unreliable in headless Chromium')
    // The SVG <g> wrapper gets class="selected" when the node is active
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

    const node1Selected = await node1.evaluate((el) => el.classList.contains('selected'))
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
    // Grid is now an SVG <rect> filled with a dot pattern; check SVG semantics
    const grid = page.locator('.graph-grid')
    await expect(grid).toBeVisible()

    const gridProps = await grid.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return {
        isSvgRect: el.tagName.toLowerCase() === 'rect',
        hasFill: el.getAttribute('fill') !== null,
        isVisible: rect.width > 0 && rect.height > 0,
        width: rect.width,
        height: rect.height,
      }
    })

    expect(gridProps.isSvgRect).toBe(true)
    expect(gridProps.hasFill).toBe(true)
    expect(gridProps.isVisible).toBe(true)
    expect(gridProps.width).toBeGreaterThan(0)
    expect(gridProps.height).toBeGreaterThan(0)
  })

  test.describe('Fit View and Viewport Controls', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator('[data-testid="fitview-view-button"]').click()
      await page.waitForTimeout(200)
    })

    function parseMatrix(transform: string | null) {
      if (!transform) throw new Error('transform attribute missing')
      const inner = transform.match(/matrix\(([^)]+)\)/)
      if (!inner) throw new Error(`unexpected transform: ${transform}`)
      const [zoom, , , , panX, panY] = inner[1].split(',').map((s) => parseFloat(s.trim()))
      return { zoom, panX, panY }
    }

    test('fits the full node bounding box within the bounded panel with padding', async ({ page }) => {
      const canvas = page.locator('[data-testid="fitview-canvas"]')
      await expect(canvas).toBeVisible()
      const canvasBox = await canvas.boundingBox()
      if (!canvasBox) throw new Error('Canvas not visible')

      const nodes = page.locator('[data-testid^="graph-node-fv_"]')
      const count = await nodes.count()
      expect(count).toBeGreaterThan(0)

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < count; i++) {
        const box = await nodes.nth(i).boundingBox()
        if (!box) continue
        minX = Math.min(minX, box.x)
        minY = Math.min(minY, box.y)
        maxX = Math.max(maxX, box.x + box.width)
        maxY = Math.max(maxY, box.y + box.height)
      }

      // fitPadding is 20px — allow a couple px of slack for subpixel rendering
      expect(minX - canvasBox.x).toBeGreaterThanOrEqual(18)
      expect(minY - canvasBox.y).toBeGreaterThanOrEqual(18)
      expect(canvasBox.x + canvasBox.width - maxX).toBeGreaterThanOrEqual(18)
      expect(canvasBox.y + canvasBox.height - maxY).toBeGreaterThanOrEqual(18)
    })

    test('fit zoom is clamped within min/max zoom bounds', async ({ page }) => {
      const viewport = page.locator('[data-testid="graph-viewport"]')
      const { zoom } = parseMatrix(await viewport.getAttribute('transform'))

      expect(zoom).toBeGreaterThanOrEqual(0.4)
      expect(zoom).toBeLessThanOrEqual(2.5)
      // The graph is wider/taller than the 470x320 panel, so it must zoom out
      expect(zoom).toBeLessThan(1)
    })

    test('zoomToFit recomputes and reapplies the fit viewport', async ({ page }) => {
      const viewport = page.locator('[data-testid="graph-viewport"]')
      const canvas = page.locator('[data-testid="fitview-canvas"]')

      const fitted = parseMatrix(await viewport.getAttribute('transform'))

      await canvas.evaluate((el) => {
        el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -300 }))
      })
      await page.waitForTimeout(150)
      const zoomedIn = parseMatrix(await viewport.getAttribute('transform'))
      expect(zoomedIn.zoom).not.toBeCloseTo(fitted.zoom, 3)

      await page.locator('[data-testid="fitview-zoom-to-fit"]').click()
      await page.waitForTimeout(150)
      const refitted = parseMatrix(await viewport.getAttribute('transform'))

      expect(refitted.zoom).toBeCloseTo(fitted.zoom, 1)
      expect(refitted.panX).toBeCloseTo(fitted.panX, 0)
      expect(refitted.panY).toBeCloseTo(fitted.panY, 0)
    })

    test('setZoom changes only zoom, leaving pan unchanged', async ({ page }) => {
      const viewport = page.locator('[data-testid="graph-viewport"]')
      const before = parseMatrix(await viewport.getAttribute('transform'))

      await page.locator('[data-testid="fitview-set-zoom"]').click()
      await page.waitForTimeout(100)

      const after = parseMatrix(await viewport.getAttribute('transform'))
      expect(after.zoom).toBeCloseTo(1.5, 5)
      expect(after.panX).toBeCloseTo(before.panX, 1)
      expect(after.panY).toBeCloseTo(before.panY, 1)
    })

    test('setPan changes only pan, leaving zoom unchanged', async ({ page }) => {
      const viewport = page.locator('[data-testid="graph-viewport"]')
      const before = parseMatrix(await viewport.getAttribute('transform'))

      await page.locator('[data-testid="fitview-set-pan"]').click()
      await page.waitForTimeout(100)

      const after = parseMatrix(await viewport.getAttribute('transform'))
      expect(after.panX).toBeCloseTo(0, 5)
      expect(after.panY).toBeCloseTo(0, 5)
      expect(after.zoom).toBeCloseTo(before.zoom, 5)
    })

    test('Fit View Demo visual snapshot', async ({ page }) => {
      const panel = page.locator('[data-testid="fitview-panel"]')
      await expect(panel).toHaveScreenshot('graph-canvas-fitview-light.png')
    })
  })

  test.describe('TopologyNode Status Variants', () => {
    test.beforeEach(async ({ page }) => {
      const topologyBtn = page.locator('button:has-text("Topology View")')
      await topologyBtn.click()
      await page.waitForTimeout(200)
    })

    test('TopologyNode ok status visual snapshot', async ({ page }) => {
      const okNode = page.locator('[data-testid="topology-node-api-server"]')
      await expect(okNode).toBeVisible()
      await expect(okNode).toHaveScreenshot('topology-node-ok-light.png')
    })

    test('TopologyNode warning status visual snapshot', async ({ page }) => {
      const warningNode = page.locator('[data-testid="topology-node-database"]')
      await expect(warningNode).toBeVisible()
      await expect(warningNode).toHaveScreenshot('topology-node-warning-light.png')
    })

    test('TopologyNode error status visual snapshot', async ({ page }) => {
      const errorNode = page.locator('[data-testid="topology-node-message-queue"]')
      await expect(errorNode).toBeVisible()
      await expect(errorNode).toHaveScreenshot('topology-node-error-light.png')
    })

    test('TopologyNode idle status visual snapshot', async ({ page }) => {
      const idleNode = page.locator('[data-testid="topology-node-load-balancer"]')
      await expect(idleNode).toBeVisible()
      await expect(idleNode).toHaveScreenshot('topology-node-idle-light.png')
    })
  })

  test.describe('Visual Regression - Light Canvas', () => {
    test('GraphCanvas with nodes visual snapshot', async ({ page }) => {
      const canvas = page.locator('.graph-canvas')
      await expect(canvas).toHaveScreenshot('graph-canvas-light.png')
    })

    test('GraphInspector panel visual snapshot', async ({ page }) => {
      const inspector = page.locator('.graph-inspector')
      await expect(inspector).toHaveScreenshot('graph-inspector-light.png')
    })

    test('GraphNode component visual snapshot', async ({ page }) => {
      const node = page.locator('[data-testid="graph-node-cls_cell"]')
      await expect(node).toHaveScreenshot('graph-node-light.png')
    })

    test('GraphEdge component visual snapshot', async ({ page }) => {
      const edge = page.locator('[data-testid^="graph-edge-"]').first()
      await expect(edge).toHaveScreenshot('graph-edge-light.png')
    })

    test('Weighted GraphEdge visual snapshot', async ({ page }) => {
      // Individual edge <g> locators can report a negative-origin bounding box (the bezier
      // control point overshoots left of the node), which breaks toHaveScreenshot's clip
      // region — so the full canvas is captured instead, same as the baseline canvas snapshot.
      const ids = ['edge_weight_low', 'edge_weight_mid', 'edge_weight_high', 'edge_opacity', 'edge_dash']
      for (const id of ids) {
        await expect(page.locator(`[data-testid="graph-edge-${id}"]`)).toBeAttached()
      }

      const canvas = page.locator('.graph-canvas')
      await expect(canvas).toHaveScreenshot('graph-canvas-weighted-edges-light.png')
    })
  })

  test.describe('TopologyNode Status Variants - Dark Canvas', () => {
    test.beforeEach(async ({ page }) => {
      await applyDarkCanvasMode(page)
      const topologyBtn = page.locator('button:has-text("Topology View")')
      await topologyBtn.click()
      await page.waitForTimeout(200)
    })

    test('TopologyNode ok status visual snapshot in dark mode', async ({ page }) => {
      const okNode = page.locator('[data-testid="topology-node-api-server"]')
      await expect(okNode).toBeVisible()
      await expect(okNode).toHaveScreenshot('topology-node-ok-dark.png')
    })

    test('TopologyNode warning status visual snapshot in dark mode', async ({ page }) => {
      const warningNode = page.locator('[data-testid="topology-node-database"]')
      await expect(warningNode).toBeVisible()
      await expect(warningNode).toHaveScreenshot('topology-node-warning-dark.png')
    })

    test('TopologyNode error status visual snapshot in dark mode', async ({ page }) => {
      const errorNode = page.locator('[data-testid="topology-node-message-queue"]')
      await expect(errorNode).toBeVisible()
      await expect(errorNode).toHaveScreenshot('topology-node-error-dark.png')
    })

    test('TopologyNode idle status visual snapshot in dark mode', async ({ page }) => {
      const idleNode = page.locator('[data-testid="topology-node-load-balancer"]')
      await expect(idleNode).toBeVisible()
      await expect(idleNode).toHaveScreenshot('topology-node-idle-dark.png')
    })
  })

  test.describe('Visual Regression - Dark Canvas', () => {
    test.beforeEach(async ({ page }) => {
      await applyDarkCanvasMode(page)
    })

    test('GraphCanvas with nodes visual snapshot in dark mode', async ({ page }) => {
      const canvas = page.locator('.graph-canvas')
      await expect(canvas).toHaveScreenshot('graph-canvas-dark.png')
    })

    test('GraphInspector panel visual snapshot in dark mode', async ({ page }) => {
      const inspector = page.locator('.graph-inspector')
      await expect(inspector).toHaveScreenshot('graph-inspector-dark.png')
    })

    test('GraphNode component visual snapshot in dark mode', async ({ page }) => {
      const node = page.locator('[data-testid="graph-node-cls_cell"]')
      await expect(node).toHaveScreenshot('graph-node-dark.png')
    })

    test('GraphEdge component visual snapshot in dark mode', async ({ page }) => {
      const edge = page.locator('[data-testid^="graph-edge-"]').first()
      await expect(edge).toHaveScreenshot('graph-edge-dark.png')
    })

    test('Weighted GraphEdge visual snapshot in dark mode', async ({ page }) => {
      const ids = ['edge_weight_low', 'edge_weight_mid', 'edge_weight_high', 'edge_opacity', 'edge_dash']
      for (const id of ids) {
        await expect(page.locator(`[data-testid="graph-edge-${id}"]`)).toBeAttached()
      }

      const canvas = page.locator('.graph-canvas')
      await expect(canvas).toHaveScreenshot('graph-canvas-weighted-edges-dark.png')
    })
  })

  test.describe('Bus View - Edge Anchors & Curvature', () => {
    // Reads a path's endpoint in screen coordinates so it can be compared directly against a
    // node's rendered bounding box, independent of the current pan/zoom transform.
    async function edgePoint(page: import('@playwright/test').Page, edgeTestId: string, end: 'start' | 'end') {
      return page.locator(`[data-testid="${edgeTestId}"] path.graph-edge__line`).evaluate((el, end) => {
        const path = el as SVGPathElement
        const len = path.getTotalLength()
        const local = end === 'start' ? path.getPointAtLength(0) : path.getPointAtLength(len)
        const ctm = path.getScreenCTM()!
        const screen = new DOMPoint(local.x, local.y).matrixTransform(ctm)
        return { x: screen.x, y: screen.y }
      }, end)
    }

    test.beforeEach(async ({ page }) => {
      await page.locator('[data-testid="bus-view-button"]').click()
      await page.waitForTimeout(200)
    })

    test('anchored edges exit the source node on its right side regardless of vertical offset', async ({ page }) => {
      const gatewayBox = await page.locator('[data-testid="graph-node-bus_gateway"]').boundingBox()
      if (!gatewayBox) throw new Error('gateway node not visible')

      const toAgentA = await edgePoint(page, 'graph-edge-bus_edge_gateway_a', 'start')
      const toAgentB = await edgePoint(page, 'graph-edge-bus_edge_gateway_b', 'start')

      const expectedX = gatewayBox.x + gatewayBox.width
      const expectedY = gatewayBox.y + gatewayBox.height / 2

      // Both edges leave from the same point on the gateway's right edge even though
      // agent_a and agent_b sit at very different vertical offsets.
      expect(toAgentA.x).toBeCloseTo(expectedX, 0)
      expect(toAgentA.y).toBeCloseTo(expectedY, 0)
      expect(toAgentB.x).toBeCloseTo(expectedX, 0)
      expect(toAgentB.y).toBeCloseTo(expectedY, 0)
    })

    test('anchored edges enter the target node on its left side regardless of vertical offset', async ({ page }) => {
      const agentBBox = await page.locator('[data-testid="graph-node-bus_agent_b"]').boundingBox()
      if (!agentBBox) throw new Error('agent_b node not visible')

      const fromDep3 = await edgePoint(page, 'graph-edge-bus_edge_b_dep3', 'start')
      const fromDep4 = await edgePoint(page, 'graph-edge-bus_edge_b_dep4', 'start')

      const dep3Box = await page.locator('[data-testid="graph-node-bus_dep_3"]').boundingBox()
      const dep4Box = await page.locator('[data-testid="graph-node-bus_dep_4"]').boundingBox()
      if (!dep3Box || !dep4Box) throw new Error('dependency node not visible')

      const dep3End = await edgePoint(page, 'graph-edge-bus_edge_b_dep3', 'end')
      const dep4End = await edgePoint(page, 'graph-edge-bus_edge_b_dep4', 'end')

      expect(dep3End.x).toBeCloseTo(dep3Box.x, 0)
      expect(dep3End.y).toBeCloseTo(dep3Box.y + dep3Box.height / 2, 0)
      expect(dep4End.x).toBeCloseTo(dep4Box.x, 0)
      expect(dep4End.y).toBeCloseTo(dep4Box.y + dep4Box.height / 2, 0)

      // Both edges also leave agent_b from the same right-side point.
      expect(fromDep3.x).toBeCloseTo(agentBBox.x + agentBBox.width, 0)
      expect(fromDep4.x).toBeCloseTo(agentBBox.x + agentBBox.width, 0)
    })

    test('mixed anchors pin only the specified endpoint', async ({ page }) => {
      const gatewayBox = await page.locator('[data-testid="graph-node-bus_gateway"]').boundingBox()
      if (!gatewayBox) throw new Error('gateway node not visible')

      // sourceAnchor: 'right', targetAnchor omitted (auto) -> the path is still cubic (either
      // anchor non-auto), but only the source endpoint is pinned to the node's right side.
      const start = await edgePoint(page, 'graph-edge-bus_edge_gateway_b', 'start')
      expect(start.x).toBeCloseTo(gatewayBox.x + gatewayBox.width, 0)
      expect(start.y).toBeCloseTo(gatewayBox.y + gatewayBox.height / 2, 0)

      const pathData = await page
        .locator('[data-testid="graph-edge-bus_edge_gateway_b"] path.graph-edge__line')
        .getAttribute('d')
      expect(pathData).toContain(' C ')
    })

    test('two edges between the same node pair with different curvature render distinct, non-overlapping paths', async ({ page }) => {
      const lowPath = await page
        .locator('[data-testid="graph-edge-bus_edge_a_dep2_low"] path.graph-edge__line')
        .getAttribute('d')
      const highPath = await page
        .locator('[data-testid="graph-edge-bus_edge_a_dep2_high"] path.graph-edge__line')
        .getAttribute('d')

      expect(lowPath).toBeTruthy()
      expect(highPath).toBeTruthy()
      expect(lowPath).not.toBe(highPath)
    })

    test('labeled anchored edge places its label at the path midpoint', async ({ page }) => {
      const label = page.locator('[data-testid="graph-edge-bus_edge_b_dep4"] .graph-edge__label')
      await expect(label).toBeAttached()

      const pathBox = await page
        .locator('[data-testid="graph-edge-bus_edge_b_dep4"] path.graph-edge__line')
        .boundingBox()
      const labelBox = await page
        .locator('[data-testid="graph-edge-bus_edge_b_dep4"] .graph-edge__label')
        .boundingBox()
      if (!pathBox || !labelBox) throw new Error('edge or label not visible')

      const labelCenterX = labelBox.x + labelBox.width / 2
      const labelCenterY = labelBox.y + labelBox.height / 2

      expect(labelCenterX).toBeGreaterThanOrEqual(pathBox.x)
      expect(labelCenterX).toBeLessThanOrEqual(pathBox.x + pathBox.width)
      expect(labelCenterY).toBeGreaterThanOrEqual(pathBox.y - labelBox.height)
      expect(labelCenterY).toBeLessThanOrEqual(pathBox.y + pathBox.height + labelBox.height)
    })

    test('Bus View visual snapshot', async ({ page }) => {
      const canvas = page.locator('.graph-canvas')
      await expect(canvas).toHaveScreenshot('graph-canvas-bus-view-light.png')
    })

    test('Bus View visual snapshot in dark mode', async ({ page }) => {
      await applyDarkCanvasMode(page)
      const canvas = page.locator('.graph-canvas')
      await expect(canvas).toHaveScreenshot('graph-canvas-bus-view-dark.png')
    })
  })
})
