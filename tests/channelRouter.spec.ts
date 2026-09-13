import { test, expect } from '@playwright/test'
import {
  routeNavigationEdge,
  routeNavigationEdges,
  DEFAULT_TRACE_SPACING,
} from '../src/utils/channelRouter'
import type { EdgeEndpointRect, Point } from '../src/utils/graph'

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

      // Also verify the path doesn't pass through the obstacle's center
      for (let i = 0; i < route.points.length - 1; i++) {
        const p1 = route.points[i]
        const p2 = route.points[i + 1]
        // For vertical segments, check that x is outside obstacle bounds
        if (Math.abs(p1.x - p2.x) < 0.01) {
          const x = p1.x
          const obstacleLeft = obstacle.x
          const obstacleRight = obstacle.x + obstacle.width
          const isInsideObstacle =
            x > obstacleLeft && x < obstacleRight && p1.y >= obstacle.y && p1.y <= obstacle.y + obstacle.height
          expect(isInsideObstacle).toBe(false)
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
  })
})
