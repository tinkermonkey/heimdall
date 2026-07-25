import { test, expect } from '@playwright/test'
import { rectEdgePoint, bezierPath, computeFitViewport, type Point } from '../src/utils/graph'

test.describe('Graph Utilities', () => {
  test.describe('rectEdgePoint', () => {
    test('returns center point when source and target are the same', () => {
      const result = rectEdgePoint(100, 100, 50, 30, 100, 100)
      expect(result.x).toBe(100)
      expect(result.y).toBe(100)
    })

    test('returns right edge point when target is to the right', () => {
      const result = rectEdgePoint(100, 100, 50, 30, 200, 100)
      expect(result.x).toBe(125) // center + half width
      expect(result.y).toBe(100) // center y (no vertical offset)
    })

    test('returns left edge point when target is to the left', () => {
      const result = rectEdgePoint(100, 100, 50, 30, 0, 100)
      expect(result.x).toBe(75) // center - half width
      expect(result.y).toBe(100)
    })

    test('returns bottom edge point when target is below', () => {
      const result = rectEdgePoint(100, 100, 50, 30, 100, 200)
      expect(result.x).toBe(100)
      expect(result.y).toBe(115) // center + half height
    })

    test('returns top edge point when target is above', () => {
      const result = rectEdgePoint(100, 100, 50, 30, 100, 0)
      expect(result.x).toBe(100)
      expect(result.y).toBe(85) // center - half height
    })

    test('returns corner-adjacent point for diagonal target', () => {
      const result = rectEdgePoint(100, 100, 100, 60, 200, 200)
      // Should be on the right or bottom edge
      expect(result.x).toBeGreaterThanOrEqual(100)
      expect(result.y).toBeGreaterThanOrEqual(100)
    })

    test('handles zero dimensions gracefully', () => {
      const result = rectEdgePoint(100, 100, 0, 0, 200, 200)
      expect(result.x).toBe(100)
      expect(result.y).toBe(100)
    })

    test('handles dx=0 (vertical alignment)', () => {
      const result = rectEdgePoint(100, 100, 50, 30, 100, 150)
      expect(result.x).toBe(100) // no horizontal offset
      expect(result.y).toBe(115) // bottom edge
    })

    test('handles dy=0 (horizontal alignment)', () => {
      const result = rectEdgePoint(100, 100, 50, 30, 150, 100)
      expect(result.x).toBe(125) // right edge
      expect(result.y).toBe(100) // no vertical offset
    })

    test('maintains correct aspect ratio for non-square targets', () => {
      const result = rectEdgePoint(0, 0, 200, 100, 150, 150)
      // The result should be somewhere on the rectangle edge
      expect(Math.abs(result.x)).toBeLessThanOrEqual(100)
      expect(Math.abs(result.y)).toBeLessThanOrEqual(50)
    })
  })

  test.describe('bezierPath', () => {
    test('creates a valid path string', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 100, y: 100 }
      const result = bezierPath(p1, p2)

      expect(result.d).toMatch(/^M \d+\.?\d* \d+\.?\d* Q [\d\-]+\.?\d* [\d\-]+\.?\d* \d+\.?\d* \d+\.?\d*$/)
      expect(result.d).toContain('M 0 0')
      expect(result.d).toContain('100 100')
    })

    test('calculates midpoint for straight horizontal line', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 100, y: 0 }
      const result = bezierPath(p1, p2)

      // Midpoint should be approximately halfway along the path
      expect(result.mid.x).toBeGreaterThan(p1.x)
      expect(result.mid.x).toBeLessThan(p2.x)
      expect(result.mid.y).toBeDefined()
    })

    test('calculates midpoint for straight vertical line', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 0, y: 100 }
      const result = bezierPath(p1, p2)

      expect(result.mid.x).toBeDefined()
      expect(result.mid.y).toBeGreaterThan(p1.y)
      expect(result.mid.y).toBeLessThan(p2.y)
    })

    test('calculates angle for line going right and down', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 100, y: 100 }
      const result = bezierPath(p1, p2)

      // Angle is from control point to endpoint, which is affected by the curve offset
      expect(result.angle).toBeDefined()
      expect(typeof result.angle).toBe('number')
      expect(isFinite(result.angle)).toBe(true)
    })

    test('handles zero-length path', () => {
      const p1: Point = { x: 100, y: 100 }
      const p2: Point = { x: 100, y: 100 }
      const result = bezierPath(p1, p2)

      expect(result.d).toBeDefined()
      expect(result.mid).toBeDefined()
      expect(result.angle).toBeDefined()
    })

    test('respects curvature parameter', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 100, y: 100 }

      const lowCurve = bezierPath(p1, p2, 0.1)
      const highCurve = bezierPath(p1, p2, 0.5)

      // Different curvature should produce different paths
      expect(lowCurve.d).not.toBe(highCurve.d)
    })

    test('uses default curvature when not provided', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 100, y: 100 }

      const withDefault = bezierPath(p1, p2)
      const withExplicit = bezierPath(p1, p2, 0.28)

      expect(withDefault.d).toBe(withExplicit.d)
    })

    test('produces symmetric paths for symmetric inputs', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 100, y: 0 }

      const forward = bezierPath(p1, p2)
      const backward = bezierPath(p2, p1)

      // The x-coordinates should be mirrored
      expect(forward.mid.x).toBeCloseTo(backward.mid.x, 1)
    })

    test('handles negative coordinates', () => {
      const p1: Point = { x: -50, y: -50 }
      const p2: Point = { x: 50, y: 50 }
      const result = bezierPath(p1, p2)

      expect(result.d).toBeDefined()
      expect(result.mid).toBeDefined()
      expect(result.angle).toBeDefined()
    })

    test('path d attribute has correct format', () => {
      const p1: Point = { x: 10, y: 20 }
      const p2: Point = { x: 110, y: 120 }
      const result = bezierPath(p1, p2)

      // Should be a quadratic Bezier curve: M x1 y1 Q cx cy x2 y2
      const parts = result.d.split(' ')
      expect(parts[0]).toBe('M')
      expect(parts[3]).toBe('Q')
    })
  })

  test.describe('computeFitViewport', () => {
    test('fits a bounding box narrower than the container by centering at zoom 1 bound', () => {
      const bbox = { minX: 0, maxX: 100, minY: 0, maxY: 50 }
      const result = computeFitViewport(bbox, 1000, 800, 40, 0.4, 2.5)

      // width-constrained: (1000 - 80) / 100 = 9.2, height-constrained: (800 - 80) / 50 = 14.4
      // smaller of the two wins, then clamped to maxZoom
      expect(result.zoom).toBe(2.5)
    })

    test('zooms out so a bounding box larger than the container fits with padding', () => {
      const bbox = { minX: 0, maxX: 2000, minY: 0, maxY: 1000 }
      const result = computeFitViewport(bbox, 800, 600, 40, 0.1, 2.5)

      // width-constrained: (800 - 80) / 2000 = 0.36, height-constrained: (600 - 80) / 1000 = 0.52
      expect(result.zoom).toBeCloseTo(0.36, 5)
    })

    test('centers pan on the bounding box centroid at the computed zoom', () => {
      const bbox = { minX: 0, maxX: 200, minY: 0, maxY: 100 }
      const result = computeFitViewport(bbox, 800, 600, 0, 0.1, 2.5)

      const centroidX = 100
      const centroidY = 50
      expect(result.panX).toBeCloseTo(800 / 2 - centroidX * result.zoom, 5)
      expect(result.panY).toBeCloseTo(600 / 2 - centroidY * result.zoom, 5)
    })

    test('clamps the computed zoom to minZoom when the bounding box is much larger than the container', () => {
      const bbox = { minX: 0, maxX: 20000, minY: 0, maxY: 20000 }
      const result = computeFitViewport(bbox, 800, 600, 40, 0.4, 2.5)

      expect(result.zoom).toBe(0.4)
    })

    test('clamps the computed zoom to maxZoom when the bounding box is much smaller than the container', () => {
      const bbox = { minX: 0, maxX: 10, minY: 0, maxY: 10 }
      const result = computeFitViewport(bbox, 800, 600, 40, 0.4, 2.5)

      expect(result.zoom).toBe(2.5)
    })

    test('respects a larger padding by leaving more room around the bounding box', () => {
      const bbox = { minX: 0, maxX: 2000, minY: 0, maxY: 1000 }
      const smallPadding = computeFitViewport(bbox, 800, 600, 20, 0.1, 2.5)
      const largePadding = computeFitViewport(bbox, 800, 600, 100, 0.1, 2.5)

      expect(largePadding.zoom).toBeLessThan(smallPadding.zoom)
    })

    test('handles a zero-area bounding box without producing NaN or Infinity', () => {
      const bbox = { minX: 100, maxX: 100, minY: 50, maxY: 50 }
      const result = computeFitViewport(bbox, 800, 600, 40, 0.4, 2.5)

      expect(Number.isFinite(result.zoom)).toBe(true)
      expect(Number.isFinite(result.panX)).toBe(true)
      expect(Number.isFinite(result.panY)).toBe(true)
    })
  })

  test.describe('integration: rectEdgePoint + bezierPath', () => {
    test('creates valid paths between two rectangles', () => {
      // Simulate two nodes
      const node1 = { x: 100, y: 100, width: 100, height: 60 }
      const node2 = { x: 300, y: 200, width: 100, height: 60 }

      const p1 = rectEdgePoint(
        node1.x,
        node1.y,
        node1.width,
        node1.height,
        node2.x,
        node2.y
      )

      const p2 = rectEdgePoint(
        node2.x,
        node2.y,
        node2.width,
        node2.height,
        node1.x,
        node1.y
      )

      const path = bezierPath(p1, p2)

      expect(path.d).toBeDefined()
      expect(path.mid).toBeDefined()
      expect(path.angle).toBeDefined()
    })

    test('edge points are on the rectangle boundaries', () => {
      const cx = 100,
        cy = 100,
        w = 100,
        h = 60
      const point = rectEdgePoint(cx, cy, w, h, 300, 200)

      // Point should be within the rectangle bounds
      expect(Math.abs(point.x - cx)).toBeLessThanOrEqual(w / 2)
      expect(Math.abs(point.y - cy)).toBeLessThanOrEqual(h / 2)
    })
  })
})
