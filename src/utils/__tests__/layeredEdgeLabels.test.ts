import { describe, expect, it } from 'vitest'
import { cubicCurve, edgeLabelPriority, lineCurve, placeEdgeLabels, quadCurve } from '../layered'

describe('edge curves', () => {
  it('hit their endpoints and report unit tangents', () => {
    const a = { x: 0, y: 0 }
    const b = { x: 100, y: 50 }
    for (const c of [lineCurve(a, b), quadCurve(a, { x: 50, y: -40 }, b), cubicCurve(a, { x: 0, y: 40 }, { x: 100, y: 10 }, b)]) {
      expect(c.pointAt(0)).toEqual(a)
      expect(c.pointAt(1).x).toBeCloseTo(100)
      expect(c.pointAt(1).y).toBeCloseTo(50)
      const u = c.tangentAt(0.5)
      expect(Math.hypot(u.x, u.y)).toBeCloseTo(1)
    }
    expect(lineCurve(a, b).d).toBe('M0,0 L100,50')
  })
})

describe('placeEdgeLabels', () => {
  const horiz = (y: number) => lineCurve({ x: 0, y }, { x: 400, y }).pointAt

  it('places in priority order and slides along the edge to avoid overlap', () => {
    const placed = placeEdgeLabels([
      { id: 'b', text: 'serves', pointAt: horiz(0), priority: 2 },
      { id: 'a', text: 'realizes', pointAt: horiz(0), priority: 0 },
    ])
    expect(placed.map((p) => p.id)).toEqual(['a', 'b'])
    expect(placed[0].t).toBe(0.5)
    expect(placed[1].t).not.toBe(0.5)
  })

  it('drops a pill with no clear position', () => {
    const placed = placeEdgeLabels(
      [{ id: 'a', text: 'x', pointAt: horiz(0), priority: 0 }],
      { obstacles: [{ x: 100, y: 0, width: 400, height: 40 }] },
    )
    expect(placed).toEqual([])
  })

  it('keeps input order on equal priority', () => {
    const placed = placeEdgeLabels([
      { id: 'one', text: 'p', pointAt: horiz(0), priority: 1 },
      { id: 'two', text: 'p', pointAt: horiz(300), priority: 1 },
    ])
    expect(placed.map((p) => p.id)).toEqual(['one', 'two'])
  })

  it('ranks direct cross-layer links first', () => {
    const direct = edgeLabelPriority({ cross: true }, { highlighted: true, hop: 1 })
    const directIntra = edgeLabelPriority({ cross: false }, { highlighted: true, hop: 1 })
    const followed = edgeLabelPriority({ cross: true }, { highlighted: true, hop: 2 })
    const unreached = edgeLabelPriority({ cross: true }, { highlighted: false, hop: 0 })
    expect(direct).toBeLessThan(directIntra)
    expect(directIntra).toBeLessThan(followed)
    expect(followed).toBeLessThan(unreached)
  })
})
