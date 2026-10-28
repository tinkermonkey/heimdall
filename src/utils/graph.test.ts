import { describe, it, expect } from 'vitest'
import { extendBoundingBoxByCircles } from './graph'

describe('extendBoundingBoxByCircles', () => {
  const bbox = { minX: 0, maxX: 100, minY: 0, maxY: 50 }

  it('returns the same box when there are no circles', () => {
    expect(extendBoundingBoxByCircles(bbox, [])).toBe(bbox)
  })

  it('grows each side to cover a circle reaching past it', () => {
    expect(extendBoundingBoxByCircles(bbox, [{ x: 90, y: 10, r: 30 }])).toEqual({
      minX: 0,
      maxX: 120,
      minY: -20,
      maxY: 50,
    })
  })

  it('leaves the box alone for circles already inside it', () => {
    expect(extendBoundingBoxByCircles(bbox, [{ x: 50, y: 25, r: 10 }])).toEqual(bbox)
  })

  it('covers several circles at once and skips non-finite ones', () => {
    expect(
      extendBoundingBoxByCircles(bbox, [
        { x: -10, y: 25, r: 5 },
        { x: 50, y: 80, r: 10 },
        { x: NaN, y: 0, r: 1000 },
      ]),
    ).toEqual({ minX: -15, maxX: 100, minY: 0, maxY: 90 })
  })
})
