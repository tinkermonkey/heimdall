import { describe, it, expect } from 'vitest'
import { polylineToRoutedEdge, routeNavigationEdge, routeNavigationEdges } from './channelRouter'
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

describe('polylineToRoutedEdge', () => {
  it('anchors the label on the longest straight segment, never on a bend corner', () => {
    // An L: a short 20 px stub, then a 200 px run.
    const r = polylineToRoutedEdge([{ x: 0, y: 0 }, { x: 0, y: 20 }, { x: 200, y: 20 }])!
    expect(r.labelAnchors![0]).toEqual({ x: 100, y: 20 })
    expect(r.mid).toEqual({ x: 100, y: 20 })
    expect(r.labelAnchors!.slice(1, 3)).toEqual([{ x: 60, y: 20 }, { x: 140, y: 20 }])
    expect(r.labelAnchors).toHaveLength(6)
    expect(r.d.startsWith('M')).toBe(true)
    expect(polylineToRoutedEdge([{ x: 0, y: 0 }])).toBeNull()
  })

  describe('blocked routes', () => {
    // Four full rows of 100x30 boxes 10 px apart (too narrow for a route); the two middle rows
    // each have one wide gap, on opposite sides. No shape with three bends or fewer is clear, so
    // the route must search: down through the row gaps, sideways at each gap (2026-11-05).
    it('steps through staggered row gaps instead of crossing a box', () => {
      const box = (x: number, y: number): EdgeEndpointRect => ({ x, y, width: 100, height: 30 })
      const rects: EdgeEndpointRect[] = []
      for (let k = -10; k <= 10; k++) {
        rects.push(box(k * 110, 0), box(k * 110, 300))
        if (k !== 3) rects.push(box(k * 110, 100))
        if (k !== -3) rects.push(box(k * 110, 200))
      }
      const source = rects.find(r => r.x === 0 && r.y === 0)!
      const target = rects.find(r => r.x === 0 && r.y === 300)!
      const route = routeNavigationEdges([{ id: 'e', source, target }], rects).get('e')!
      const hits = (a: { x: number; y: number }, b: { x: number; y: number }, r: EdgeEndpointRect) =>
        Math.min(a.x, b.x) < r.x + r.width / 2 && Math.max(a.x, b.x) > r.x - r.width / 2 &&
        Math.min(a.y, b.y) < r.y + r.height / 2 && Math.max(a.y, b.y) > r.y - r.height / 2
      for (let i = 0; i < route.points.length - 1; i++) {
        for (const r of rects) {
          if (r === source || r === target) continue
          expect(hits(route.points[i], route.points[i + 1], r)).toBe(false)
        }
      }
      // Through the two gaps (330 px out and back, twice), not round the 2,300 px wide rows.
      let length = 0
      for (let i = 0; i < route.points.length - 1; i++) length += Math.abs(route.points[i + 1].x - route.points[i].x) + Math.abs(route.points[i + 1].y - route.points[i].y)
      expect(length).toBeLessThan(2000)
    })
  })
})
