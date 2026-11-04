import { test, expect } from '@playwright/test'
import {
  routeNavigationEdge,
  routeNavigationEdges,
  DEFAULT_TRACE_SPACING,
} from '../src/utils/channelRouter'
import type { EdgeEndpointRect } from '../src/utils/graph'

test.describe('channelRouter', () => {
  const createRect = (x: number, y: number, width: number = 100, height: number = 60): EdgeEndpointRect => ({
    x,
    y,
    width,
    height,
  })

  test.describe('routeNavigationEdge', () => {
    test('creates path from source to target without obstacles', () => {
      const source = createRect(0, 0)
      const target = createRect(200, 100)

      const route = routeNavigationEdge(source, target)

      expect(route.isPolyline).toBe(true)
      expect(route.d).toBeTruthy()
      expect(route.points.length).toBeGreaterThan(0)
      expect(route.points[0]).toEqual({ x: expect.any(Number), y: expect.any(Number) })
      expect(route.points[route.points.length - 1]).toEqual({ x: expect.any(Number), y: expect.any(Number) })
    })

    test('route starts at source exit point and ends at target entry point', () => {
      const source = createRect(0, 0, 80, 40)
      const target = createRect(300, 100, 80, 40)

      const route = routeNavigationEdge(source, target)
      const start = route.points[0]
      const end = route.points[route.points.length - 1]

      // Start should be on or near source center
      expect(start.x).toBeLessThanOrEqual(source.x + source.width / 2 + 10)
      expect(start.x).toBeGreaterThanOrEqual(source.x - source.width / 2 - 10)

      // End should be on or near target center
      expect(end.x).toBeLessThanOrEqual(target.x + target.width / 2 + 10)
      expect(end.x).toBeGreaterThanOrEqual(target.x - target.width / 2 - 10)
    })

    test('path is orthogonal (only horizontal and vertical segments)', () => {
      const source = createRect(0, 0)
      const target = createRect(200, 100)

      const route = routeNavigationEdge(source, target)

      for (let i = 0; i < route.points.length - 1; i++) {
        const p1 = route.points[i]
        const p2 = route.points[i + 1]

        // Each segment is either horizontal or vertical (but not diagonal)
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })

    test('computes midpoint and angle for label placement', () => {
      const source = createRect(0, 0)
      const target = createRect(200, 100)

      const route = routeNavigationEdge(source, target)

      expect(route.mid).toBeTruthy()
      expect(typeof route.mid.x).toBe('number')
      expect(typeof route.mid.y).toBe('number')
      expect(typeof route.angle).toBe('number')
    })

    test('avoids obstacles by routing around them', () => {
      const source = createRect(0, 0)
      const target = createRect(300, 0)
      const obstacle = createRect(150, 0, 60, 60)

      const route = routeNavigationEdge(source, target, [obstacle])

      // Source and target are both at y=0, so a valid detour must have a waypoint
      // that deviates in y (above or below the obstacle) to avoid it
      const hasVerticalDetour = route.points.some((point) => Math.abs(point.y) > 0.1)
      expect(hasVerticalDetour).toBe(true)

      // Also verify the path doesn't pass through the obstacle
      const obstacleLeft = obstacle.x
      const obstacleRight = obstacle.x + obstacle.width
      const obstacleTop = obstacle.y
      const obstacleBottom = obstacle.y + obstacle.height

      for (let i = 0; i < route.points.length - 1; i++) {
        const p1 = route.points[i]
        const p2 = route.points[i + 1]

        // Check vertical segments
        if (Math.abs(p1.x - p2.x) < 0.01) {
          const x = p1.x
          const segMinY = Math.min(p1.y, p2.y)
          const segMaxY = Math.max(p1.y, p2.y)
          const intersectsObstacle =
            x > obstacleLeft && x < obstacleRight &&
            segMinY < obstacleBottom && segMaxY > obstacleTop
          expect(intersectsObstacle).toBe(false)
        }
        // Check horizontal segments
        else if (Math.abs(p1.y - p2.y) < 0.01) {
          const y = p1.y
          const segMinX = Math.min(p1.x, p2.x)
          const segMaxX = Math.max(p1.x, p2.x)
          const intersectsObstacle =
            y > obstacleTop && y < obstacleBottom &&
            segMinX < obstacleRight && segMaxX > obstacleLeft
          expect(intersectsObstacle).toBe(false)
        }
      }
    })

    test('handles target to the left of source', () => {
      const source = createRect(300, 0)
      const target = createRect(0, 100)

      const route = routeNavigationEdge(source, target)

      expect(route.points.length).toBeGreaterThan(0)
      expect(route.d).toBeTruthy()
    })

    test('handles target directly above source', () => {
      const source = createRect(0, 100)
      const target = createRect(0, 0)

      const route = routeNavigationEdge(source, target)

      expect(route.points.length).toBeGreaterThan(0)
    })

    test('handles target directly below source', () => {
      const source = createRect(0, 0)
      const target = createRect(0, 100)

      const route = routeNavigationEdge(source, target)

      expect(route.points.length).toBeGreaterThan(0)
    })
  })

  test.describe('routeNavigationEdges', () => {
    test('routes multiple edges without obstacles', () => {
      const edges = [
        { id: 'edge1', source: createRect(0, 0), target: createRect(200, 100) },
        { id: 'edge2', source: createRect(0, 50), target: createRect(200, 150) },
      ]

      const routes = routeNavigationEdges(edges)

      expect(routes.size).toBe(2)
      expect(routes.has('edge1')).toBe(true)
      expect(routes.has('edge2')).toBe(true)
    })

    test('each routed edge has valid path data', () => {
      const edges = [
        { id: 'edge1', source: createRect(0, 0), target: createRect(200, 100) },
        { id: 'edge2', source: createRect(0, 50), target: createRect(200, 150) },
      ]

      const routes = routeNavigationEdges(edges)

      for (const route of routes.values()) {
        expect(route.d).toBeTruthy()
        expect(route.points.length).toBeGreaterThan(0)
        expect(route.isPolyline).toBe(true)
        expect(route.mid).toBeTruthy()
        expect(typeof route.angle).toBe('number')
      }
    })

    test('applies nudge pass to spread overlapping segments', () => {
      // Create two edges that would overlap significantly
      const edges = [
        { id: 'edge1', source: createRect(0, 0, 50, 40), target: createRect(300, 0, 50, 40) },
        { id: 'edge2', source: createRect(0, 10, 50, 40), target: createRect(300, 10, 50, 40) },
      ]

      const routes = routeNavigationEdges(edges, [], DEFAULT_TRACE_SPACING)

      // Both edges should be routed
      expect(routes.has('edge1')).toBe(true)
      expect(routes.has('edge2')).toBe(true)

      // Paths should be different (nudged apart)
      const path1 = routes.get('edge1')!.d
      const path2 = routes.get('edge2')!.d
      expect(path1).not.toEqual(path2)
    })

    test('respects custom trace spacing', () => {
      const edges = [
        { id: 'edge1', source: createRect(0, 0), target: createRect(200, 100) },
      ]

      const routesSmall = routeNavigationEdges(edges, [], 8)
      const routesLarge = routeNavigationEdges(edges, [], 32)

      // Both should produce valid routes
      expect(routesSmall.has('edge1')).toBe(true)
      expect(routesLarge.has('edge1')).toBe(true)
    })

    test('considers allObstacles when routing', () => {
      const obstacle = createRect(150, 50, 80, 60)
      const edges = [
        { id: 'edge1', source: createRect(0, 0), target: createRect(300, 0) },
      ]

      const routeWithObstacle = routeNavigationEdges(edges, [obstacle])
      const route = routeWithObstacle.get('edge1')!

      // Route should have waypoints to avoid the obstacle
      expect(route.points.length).toBeGreaterThanOrEqual(2)
    })

    test('handles empty edge list', () => {
      const routes = routeNavigationEdges([])

      expect(routes.size).toBe(0)
    })

    test('handles single edge', () => {
      const edges = [
        { id: 'solo', source: createRect(0, 0), target: createRect(200, 200) },
      ]

      const routes = routeNavigationEdges(edges)

      expect(routes.size).toBe(1)
      expect(routes.get('solo')).toBeTruthy()
    })
  })

  test.describe('path string format', () => {
    test('SVG path string starts with M and uses L commands', () => {
      const source = createRect(0, 0)
      const target = createRect(200, 100)

      const route = routeNavigationEdge(source, target)

      expect(route.d).toMatch(/^M\s+\d+/)
      expect(route.d).toContain('L')
    })

    test('path coordinates are integers', () => {
      const source = createRect(0, 0)
      const target = createRect(200, 100)

      const route = routeNavigationEdge(source, target)

      // Should not have decimals in the SVG path
      expect(route.d).not.toMatch(/\.\d/)
    })
  })

  test.describe('edge cases', () => {
    test('source and target at same location', () => {
      const rect = createRect(100, 100)

      const route = routeNavigationEdge(rect, rect)

      expect(route.points.length).toBeGreaterThan(0)
    })

    test('very large offset between source and target', () => {
      const source = createRect(0, 0)
      const target = createRect(5000, 5000)

      const route = routeNavigationEdge(source, target)

      expect(route.points.length).toBeGreaterThan(0)
      expect(route.d).toBeTruthy()
    })

    test('small rectangles', () => {
      const source = createRect(0, 0, 10, 10)
      const target = createRect(50, 50, 10, 10)

      const route = routeNavigationEdge(source, target)

      expect(route.points.length).toBeGreaterThan(0)
    })

    test('large rectangles', () => {
      const source = createRect(0, 0, 500, 300)
      const target = createRect(1000, 600, 500, 300)

      const route = routeNavigationEdge(source, target)

      expect(route.points.length).toBeGreaterThan(0)
    })

    test('zero-size boxes still get an orthogonal route', () => {
      // No candidate fits a zero-size box's ports; the fallback must not be a diagonal.
      for (const target of [createRect(200, 100, 0, 0), createRect(0, 100, 0, 0), createRect(200, 0, 0, 0)]) {
        const pts = routeNavigationEdge(createRect(0, 0, 0, 0), target).points
        expect(pts.length).toBeGreaterThanOrEqual(2)
        for (let i = 1; i < pts.length; i++) expect(pts[i].x === pts[i - 1].x || pts[i].y === pts[i - 1].y, JSON.stringify(pts)).toBe(true)
      }
    })
  })

  test.describe('batch cost', () => {
    // GraphCanvas reroutes on every re-measure or drag, so a batch must stay near-linear. Before
    // the bounds in routeNavigationEdges (tinkermonkey/heimdall#324 review) this batch took 3.6 s;
    // it takes ~130 ms now (scripts/bench-router.mjs). The bound is loose for slow CI runners.
    test('400 boxes and 400 routes route in well under a second and a half', () => {
      const n = 400
      const cols = Math.ceil(Math.sqrt(n))
      const boxes = Array.from({ length: n }, (_, i) => createRect((i % cols) * 150, Math.floor(i / cols) * 120, 100, 23))
      let seed = 1
      const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647)
      const edges = Array.from({ length: n }, (_, i) => ({ id: `e${i}`, source: boxes[Math.floor(rnd() * n)], target: boxes[Math.floor(rnd() * n)] }))
        .filter(e => e.source !== e.target)
      routeNavigationEdges(edges.slice(0, 20), boxes) // warm up
      const t = performance.now()
      const routes = routeNavigationEdges(edges, boxes)
      expect(performance.now() - t).toBeLessThan(1500)
      expect(routes.size).toBe(edges.length)
    })
  })

  test.describe('heimdall test page, rendered boxes (2026-11-04)', () => {
    // The router's input on the test page's data in the layout-loop harness (GraphCanvas node
    // boxes in layout px: offsetWidth sizes, centres), and its 8
    // navigation routes in page order. Before 2026-11-04 Dashboard -> Settings, directly below,
    // ran out past every box to the left edge and back (the first clear candidate won and lanes
    // existed only at the extremes).
    const box: Record<string, EdgeEndpointRect> = {
      page1: createRect(265.5, 11.5, 113, 23),
      page1_child1: createRect(51.5, 191.5, 103, 23),
      page1_child2: createRect(479.5, 191.5, 95, 23),
      view1_1: createRect(408.5, 11.5, 93, 23),
      view1_2: createRect(519.5, 11.5, 89, 23),
      view1_3: createRect(628, 11.5, 88, 23),
      view2_1: createRect(188, 191.5, 90, 23),
      view2_2: createRect(312.5, 191.5, 119, 23),
      view3_1: createRect(604, 191.5, 74, 23),
      view3_2: createRect(698.5, 191.5, 75, 23),
      page2: createRect(237.5, 334.5, 98, 23),
      page2_child1: createRect(44, 514.5, 88, 23),
      page2_child2: createRect(431, 514.5, 98, 23),
      view4_1: createRect(375.5, 334.5, 98, 23),
      view4_2: createRect(504, 334.5, 119, 23),
      view5_1: createRect(164.5, 514.5, 73, 23),
      view5_2: createRect(271.5, 514.5, 101, 23),
      sharedView: createRect(761, 11.5, 138, 23),
    }
    const pairs: Array<[string, string]> = [
      ['page1', 'page2'], ['view1_1', 'page2'], ['view1_2', 'page2_child1'], ['page1_child1', 'page2_child2'],
      ['view2_1', 'page2'], ['page1_child2', 'page2_child1'], ['page2', 'page1'], ['view4_1', 'page1_child1'],
    ]
    const route = () =>
      routeNavigationEdges(pairs.map(([s, t], i) => ({ id: `r${i}`, source: box[s], target: box[t] })), Object.values(box))
    const legs = (pts: Array<{ x: number; y: number }>) =>
      pts.slice(1).map((p, i) => Math.abs(p.x - pts[i].x) + Math.abs(p.y - pts[i].y))

    test('Dashboard -> Settings stays inside the drawing instead of looping round its left edge', () => {
      const pts = route().get('r0')!.points
      const left = Math.min(...Object.values(box).map(b => b.x - b.width / 2))
      expect(Math.min(...pts.map(p => p.x))).toBeGreaterThan(left)
      const manhattan = Math.abs(pts[pts.length - 1].x - pts[0].x) + Math.abs(pts[pts.length - 1].y - pts[0].y)
      expect(legs(pts).reduce((a, b) => a + b, 0) / manhattan).toBeLessThan(1.6)
    })

    test('every route arrives perpendicular to its target side, after a leg of at least 10 px', () => {
      const routes = route()
      pairs.forEach(([, t], i) => {
        const pts = routes.get(`r${i}`)!.points
        const l = legs(pts)
        const end = pts[pts.length - 1]
        const prev = pts[pts.length - 2]
        const b = box[t]
        // A vertical last leg lands on the top or bottom side, a horizontal one on the left or right.
        if (prev.x === end.x) expect([b.y - b.height / 2, b.y + b.height / 2], `r${i}`).toContain(end.y)
        else expect([b.x - b.width / 2, b.x + b.width / 2], `r${i}`).toContain(end.x)
        if (l.length > 1) {
          expect(l[0], `r${i}`).toBeGreaterThanOrEqual(10)
          expect(l[l.length - 1], `r${i}`).toBeGreaterThanOrEqual(10)
        }
      })
    })
  })
})
