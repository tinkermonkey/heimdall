import { describe, it, expect } from 'vitest'
import { routeNavigationEdge, routeNavigationEdges } from './channelRouter'
import type { EdgeEndpointRect } from './graph'

describe('channelRouter', () => {
  describe('routeNavigationEdge', () => {
    it('creates orthogonal paths with no obstacles', () => {
      const source: EdgeEndpointRect = { x: 0, y: 0, width: 50, height: 50 }
      const target: EdgeEndpointRect = { x: 200, y: 150, width: 50, height: 50 }

      const result = routeNavigationEdge(source, target)

      expect(result.isPolyline).toBe(true)
      expect(result.points.length).toBeGreaterThanOrEqual(3)

      // Verify all segments are orthogonal (not diagonal)
      for (let i = 0; i < result.points.length - 1; i++) {
        const p1 = result.points[i]
        const p2 = result.points[i + 1]
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })

    it('avoids obstacles with orthogonal paths', () => {
      const source: EdgeEndpointRect = { x: 0, y: 0, width: 50, height: 50 }
      const target: EdgeEndpointRect = { x: 200, y: 0, width: 50, height: 50 }
      const obstacle: EdgeEndpointRect = { x: 100, y: 0, width: 50, height: 50 }

      const result = routeNavigationEdge(source, target, [obstacle])

      // Path should avoid the obstacle, not go straight through
      expect(result.points.length).toBeGreaterThan(3)

      // Verify orthogonality maintained despite obstacles
      for (let i = 0; i < result.points.length - 1; i++) {
        const p1 = result.points[i]
        const p2 = result.points[i + 1]
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })

    it('maintains orthogonality without obstacles', () => {
      const source: EdgeEndpointRect = { x: 0, y: 0, width: 50, height: 50 }
      const target: EdgeEndpointRect = { x: 200, y: 150, width: 50, height: 50 }

      const result = routeNavigationEdge(source, target)

      // Path must be orthogonal
      for (let i = 0; i < result.points.length - 1; i++) {
        const p1 = result.points[i]
        const p2 = result.points[i + 1]
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })
  })

  describe('routeNavigationEdges', () => {
    it('routes multiple edges without breaking polylines', () => {
      const edges = [
        {
          id: 'edge1',
          source: { x: 0, y: 0, width: 50, height: 50 },
          target: { x: 200, y: 100, width: 50, height: 50 },
        },
        {
          id: 'edge2',
          source: { x: 0, y: 200, width: 50, height: 50 },
          target: { x: 200, y: 300, width: 50, height: 50 },
        },
      ]

      const result = routeNavigationEdges(edges)

      expect(result.size).toBe(2)

      // Check both routes maintain orthogonality
      for (const route of result.values()) {
        expect(route.isPolyline).toBe(true)
        for (let i = 0; i < route.points.length - 1; i++) {
          const p1 = route.points[i]
          const p2 = route.points[i + 1]
          const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
          const isVertical = Math.abs(p1.x - p2.x) < 0.01
          expect(isHorizontal || isVertical).toBe(true)
        }
      }
    })

    it('routes single edge with specified trace spacing', () => {
      const edges = [
        {
          id: 'edge1',
          source: { x: 0, y: 0, width: 50, height: 50 },
          target: { x: 300, y: 300, width: 50, height: 50 },
        },
      ]

      const result = routeNavigationEdges(edges, [], 16)

      expect(result.size).toBe(1)
      const route = result.get('edge1')!
      expect(route).toBeDefined()

      // Verify path is orthogonal
      for (let i = 0; i < route.points.length - 1; i++) {
        const p1 = route.points[i]
        const p2 = route.points[i + 1]
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })

    it('nudges overlapping segments while maintaining orthogonality', () => {
      const edges = [
        {
          id: 'edge1',
          source: { x: 0, y: 0, width: 50, height: 50 },
          target: { x: 300, y: 0, width: 50, height: 50 },
        },
        {
          id: 'edge2',
          source: { x: 0, y: 10, width: 50, height: 50 },
          target: { x: 300, y: 10, width: 50, height: 50 },
        },
      ]

      const result = routeNavigationEdges(edges, [], 16)

      expect(result.size).toBe(2)

      // Both routes should remain orthogonal after nudging
      for (const route of result.values()) {
        for (let i = 0; i < route.points.length - 1; i++) {
          const p1 = route.points[i]
          const p2 = route.points[i + 1]
          const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
          const isVertical = Math.abs(p1.x - p2.x) < 0.01
          expect(isHorizontal || isVertical).toBe(true)
        }
      }
    })

    it('generates valid SVG path strings', () => {
      const edges = [
        {
          id: 'edge1',
          source: { x: 0, y: 0, width: 50, height: 50 },
          target: { x: 200, y: 100, width: 50, height: 50 },
        },
      ]

      const result = routeNavigationEdges(edges)
      const route = result.get('edge1')!

      // Path should start with M and contain L commands
      expect(route.d).toMatch(/^M \d+ \d+/)
      expect(route.d).toContain('L')

      // Path should be parseable (basic validation)
      const parts = route.d.split(' ')
      expect(parts[0]).toBe('M')
      expect(parts.length).toBeGreaterThanOrEqual(5) // At least M x y L x y
    })
  })
})
