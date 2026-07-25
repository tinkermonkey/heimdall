import { test, expect } from '@playwright/test'
import {
  DEFAULT_EDGE_MARKER_SIZE,
  DEFAULT_EDGE_STROKE_WIDTH,
  MAX_EDGE_MARKER_SIZE,
  markerSizeForStrokeWidth,
  strokeDashToDasharray,
  weightToStrokeWidth,
} from '../src/utils/graphEdgeStyle'

test.describe('Graph Edge Style Utilities', () => {
  test.describe('weightToStrokeWidth', () => {
    test('maps weight 0 to the 1px minimum', () => {
      expect(weightToStrokeWidth(0)).toBe(1)
    })

    test('maps weight 100 to the 8px maximum', () => {
      expect(weightToStrokeWidth(100)).toBe(8)
    })

    test('maps weight 25 via the sqrt curve', () => {
      expect(weightToStrokeWidth(25)).toBeCloseTo(1 + 7 * Math.sqrt(0.25), 5)
    })

    test('maps weight 50 via the sqrt curve', () => {
      expect(weightToStrokeWidth(50)).toBeCloseTo(1 + 7 * Math.sqrt(0.5), 5)
    })

    test('maps weight 75 via the sqrt curve', () => {
      expect(weightToStrokeWidth(75)).toBeCloseTo(1 + 7 * Math.sqrt(0.75), 5)
    })

    test('keeps low-end weight differences visually distinguishable', () => {
      const w10 = weightToStrokeWidth(10)
      const w30 = weightToStrokeWidth(30)
      expect(w30).toBeGreaterThan(w10)
      expect(w30 - w10).toBeGreaterThan(0.5)
    })

    test('clamps out-of-range weights', () => {
      expect(weightToStrokeWidth(-20)).toBe(1)
      expect(weightToStrokeWidth(150)).toBe(8)
    })
  })

  test.describe('markerSizeForStrokeWidth', () => {
    test('scales proportionally with stroke width', () => {
      const base = DEFAULT_EDGE_MARKER_SIZE.default
      const baseStroke = DEFAULT_EDGE_STROKE_WIDTH.default
      const size = markerSizeForStrokeWidth(base, baseStroke, baseStroke * 2)
      expect(size).toBeCloseTo(base * 2, 5)
    })

    test('caps scaled size at the sane maximum', () => {
      const base = DEFAULT_EDGE_MARKER_SIZE.default
      const baseStroke = DEFAULT_EDGE_STROKE_WIDTH.default
      const size = markerSizeForStrokeWidth(base, baseStroke, 8)
      expect(size).toBeLessThanOrEqual(MAX_EDGE_MARKER_SIZE)
      expect(size).toBe(MAX_EDGE_MARKER_SIZE)
    })
  })

  test.describe('strokeDashToDasharray', () => {
    test('produces an equal dash/gap pattern from a single number', () => {
      expect(strokeDashToDasharray(4)).toBe('4 4')
    })

    test('produces an asymmetric pattern from a [dash, gap] tuple', () => {
      expect(strokeDashToDasharray([6, 2])).toBe('6 2')
    })
  })
})
