import { test, expect } from '@playwright/test'
import {
  rectEdgePoint,
  bezierPath,
  computeFitViewport,
  anchoredEdgePoint,
  cubicBezierPath,
  computeEdgePath,
  type Point,
} from '../src/utils/graph'

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

      expect(result.d).toMatch(/^M \d+\.?\d* \d+\.?\d* Q [\d-]+\.?\d* [\d-]+\.?\d* \d+\.?\d* \d+\.?\d*$/)
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
      const withExplicit = bezierPath(p1, p2, 0.22)

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

  test.describe('anchoredEdgePoint', () => {
    test('returns left side midpoint', () => {
      const result = anchoredEdgePoint(100, 100, 50, 30, 'left', 500, 500)
      expect(result).toEqual({ x: 75, y: 100 })
    })

    test('returns right side midpoint', () => {
      const result = anchoredEdgePoint(100, 100, 50, 30, 'right', -500, -500)
      expect(result).toEqual({ x: 125, y: 100 })
    })

    test('returns top side midpoint', () => {
      const result = anchoredEdgePoint(100, 100, 50, 30, 'top', -500, -500)
      expect(result).toEqual({ x: 100, y: 85 })
    })

    test('returns bottom side midpoint', () => {
      const result = anchoredEdgePoint(100, 100, 50, 30, 'bottom', -500, -500)
      expect(result).toEqual({ x: 100, y: 115 })
    })

    test('fixed anchors ignore the other point entirely', () => {
      const towardOrigin = anchoredEdgePoint(100, 100, 50, 30, 'right', 0, 0)
      const towardFarAway = anchoredEdgePoint(100, 100, 50, 30, 'right', 9000, -9000)
      expect(towardOrigin).toEqual(towardFarAway)
    })

    test('falls through to rectEdgePoint for auto', () => {
      const anchored = anchoredEdgePoint(100, 100, 50, 30, 'auto', 200, 100)
      const perimeter = rectEdgePoint(100, 100, 50, 30, 200, 100)
      expect(anchored).toEqual(perimeter)
    })
  })

  test.describe('cubicBezierPath', () => {
    test('produces a cubic bezier path string', () => {
      const p1: Point = { x: 0, y: 100 }
      const p2: Point = { x: 200, y: 100 }
      const result = cubicBezierPath(p1, p2, 'right', 'left')

      expect(result.d).toMatch(/^M 0 100 C .+ 200 100$/)
    })

    test('right/left anchors project control points outward on the x axis', () => {
      const p1: Point = { x: 0, y: 100 }
      const p2: Point = { x: 200, y: 50 }
      const result = cubicBezierPath(p1, p2, 'right', 'left', 0.5)

      const match = result.d.match(/^M ([\d.-]+) ([\d.-]+) C ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)$/)
      expect(match).toBeTruthy()
      const [, , , c1x, c1y, c2x, c2y] = match!.map(Number)

      // Control point 1 projects rightward (+x) from p1 at the same y (right anchor direction is (1, 0)).
      expect(c1x).toBeGreaterThan(p1.x)
      expect(c1y).toBeCloseTo(p1.y, 5)
      // Control point 2 projects leftward (-x) from p2 at the same y (left anchor direction is (-1, 0)).
      expect(c2x).toBeLessThan(p2.x)
      expect(c2y).toBeCloseTo(p2.y, 5)
    })

    test('top/bottom anchors project control points outward on the y axis', () => {
      const p1: Point = { x: 50, y: 0 }
      const p2: Point = { x: 50, y: 200 }
      const result = cubicBezierPath(p1, p2, 'bottom', 'top', 0.5)

      const match = result.d.match(/^M ([\d.-]+) ([\d.-]+) C ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)$/)
      const [, , , c1x, c1y, c2x, c2y] = match!.map(Number)

      expect(c1x).toBeCloseTo(p1.x, 5)
      expect(c1y).toBeGreaterThan(p1.y) // bottom anchor direction is (0, 1)
      expect(c2x).toBeCloseTo(p2.x, 5)
      expect(c2y).toBeLessThan(p2.y) // top anchor direction is (0, -1)
    })

    test('computes the true midpoint via De Casteljau subdivision at t=0.5', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 200, y: 100 }
      const curvature = 0.5
      const result = cubicBezierPath(p1, p2, 'right', 'bottom', curvature)

      const dist = Math.hypot(200, 100)
      const offset = Math.min(120, dist * curvature)
      const c1 = { x: p1.x + offset, y: p1.y } // 'right' direction (1, 0)
      const c2 = { x: p2.x, y: p2.y + offset } // 'bottom' direction (0, 1)

      // De Casteljau at t=0.5, computed independently from the function under test.
      const q0 = { x: (p1.x + c1.x) / 2, y: (p1.y + c1.y) / 2 }
      const q1 = { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 }
      const q2 = { x: (c2.x + p2.x) / 2, y: (c2.y + p2.y) / 2 }
      const r0 = { x: (q0.x + q1.x) / 2, y: (q0.y + q1.y) / 2 }
      const r1 = { x: (q1.x + q2.x) / 2, y: (q1.y + q2.y) / 2 }
      const expectedMid = { x: (r0.x + r1.x) / 2, y: (r0.y + r1.y) / 2 }

      expect(result.mid.x).toBeCloseTo(expectedMid.x, 5)
      expect(result.mid.y).toBeCloseTo(expectedMid.y, 5)
    })

    test('mixed anchor: the auto endpoint uses the perpendicular offset, not line-of-sight', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 200, y: 0 }
      const result = cubicBezierPath(p1, p2, 'right', 'auto', 0.5)

      const match = result.d.match(/^M ([\d.-]+) ([\d.-]+) C ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)$/)
      const [, , , , , c2x, c2y] = match!.map(Number)

      // p2's auto direction is perpendicular to p1->p2 (i.e. +y), same as bezierPath's normal offset.
      expect(c2x).toBeCloseTo(p2.x, 5)
      expect(c2y).toBeGreaterThan(p2.y)
    })

    test('two edges between the same points with different curvature render distinct paths', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 200, y: 0 }
      const low = cubicBezierPath(p1, p2, 'right', 'left', 0.15)
      const high = cubicBezierPath(p1, p2, 'right', 'left', 0.6)

      expect(low.d).not.toBe(high.d)
    })

    test('defaults to auto/auto with the default curvature when anchors are omitted', () => {
      const p1: Point = { x: 0, y: 0 }
      const p2: Point = { x: 200, y: 0 }
      const withDefaults = cubicBezierPath(p1, p2)
      const explicit = cubicBezierPath(p1, p2, 'auto', 'auto', 0.22)

      expect(withDefaults.d).toBe(explicit.d)
    })
  })

  test.describe('computeEdgePath', () => {
    test('auto/auto with no curvature override matches todays quadratic bezier at 0.22', () => {
      const source = { x: 100, y: 100, width: 50, height: 30 }
      const target = { x: 300, y: 100, width: 50, height: 30 }

      const sp = rectEdgePoint(source.x, source.y, source.width, source.height, target.x, target.y)
      const tp = rectEdgePoint(target.x, target.y, target.width, target.height, source.x, source.y)
      const expected = bezierPath(sp, tp, 0.22)

      const result = computeEdgePath(source, target)
      expect(result.d).toBe(expected.d)
    })

    test('either anchor being fixed selects the cubic bezier renderer', () => {
      const source = { x: 100, y: 100, width: 50, height: 30 }
      const target = { x: 300, y: 100, width: 50, height: 30 }

      const result = computeEdgePath(source, target, { sourceAnchor: 'right' })
      expect(result.d).toContain(' C ')
    })

    test('both anchors fixed pin endpoints regardless of vertical offset', () => {
      const source = { x: 100, y: 100, width: 50, height: 30 }
      const targetBelow = { x: 300, y: 400, width: 50, height: 30 }
      const targetAbove = { x: 300, y: -400, width: 50, height: 30 }

      const resultBelow = computeEdgePath(source, targetBelow, { sourceAnchor: 'right', targetAnchor: 'left' })
      const resultAbove = computeEdgePath(source, targetAbove, { sourceAnchor: 'right', targetAnchor: 'left' })

      // The source endpoint (right-middle of the source rect) is identical regardless of target position.
      expect(resultBelow.d.split(' ').slice(0, 3)).toEqual(['M', '125', '100'])
      expect(resultAbove.d.split(' ').slice(0, 3)).toEqual(['M', '125', '100'])
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
