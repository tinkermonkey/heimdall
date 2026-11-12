// LayerStack draws links off the selection's reach as one path per style (tinkermonkey/heimdall#379).
import { describe, it, expect } from 'vitest'
import { batchLinks, batchWidth, pointsToPath, type BatchItem } from '../layered/linkBatches'

const item = (over: Partial<BatchItem> = {}): BatchItem => ({
  d: 'M0,0 L1,1',
  color: 'rgb(var(--graph-link-1))',
  opacity: 0.3,
  dash: '',
  width: 1,
  z: 0,
  depth: 0,
  ...over,
})

describe('batchLinks', () => {
  it('puts links of one style into one path, segments concatenated in order', () => {
    const out = batchLinks([item({ d: 'M0,0 L1,1' }), item({ d: 'M2,2 L3,3' }), item({ d: 'M4,4 L5,5' })])
    expect(out).toHaveLength(1)
    expect(out[0].d).toBe('M0,0 L1,1M2,2 L3,3M4,4 L5,5')
    expect(out[0].count).toBe(3)
  })

  it('splits by colour, opacity, dash, z and width step', () => {
    const out = batchLinks([
      item(),
      item({ color: 'rgb(var(--graph-link-2))' }),
      item({ opacity: 0.75 }),
      item({ dash: '6 4' }),
      item({ z: 1 }),
      item({ width: 1.3 }),
    ])
    expect(out).toHaveLength(6)
    expect(out.reduce((s, b) => s + b.count, 0)).toBe(6)
  })

  it('widths within one step share a path, drawn at the step', () => {
    const out = batchLinks([item({ width: 1.02 }), item({ width: 0.98 }), item({ width: 1.04 })])
    expect(out).toHaveLength(1)
    expect(out[0].width).toBeCloseTo(1)
    expect(batchWidth(0.01)).toBeCloseTo(0.1)
  })

  it("paints lower z first, then farther batches first, and is stable", () => {
    const out = batchLinks([
      item({ z: 1, depth: 0, color: 'a' }),
      item({ z: 0, depth: -50, color: 'near' }),
      item({ z: 0, depth: 80, color: 'far' }),
      item({ z: 0, depth: 60, color: 'far' }),
    ])
    expect(out.map((b) => b.color)).toEqual(['far', 'near', 'a'])
    expect(batchLinks([item({ color: 'x' }), item({ color: 'y' })]).map((b) => b.key)).toEqual(
      batchLinks([item({ color: 'y' }), item({ color: 'x' })]).map((b) => b.key),
    )
  })

  it('keys a style the same from frame to frame, so its path is reused', () => {
    const a = batchLinks([item({ d: 'M0,0 L1,1', depth: 3 })])
    const b = batchLinks([item({ d: 'M9,9 L8,8', depth: -7 })])
    expect(a[0].key).toBe(b[0].key)
  })

  it('arrowheads (width 0) batch by colour and opacity only', () => {
    const out = batchLinks([item({ width: 0, opacity: 0.8 }), item({ width: 0, opacity: 0.8, depth: 40 })])
    expect(out).toHaveLength(1)
    expect(out[0].width).toBe(0)
  })

  it('returns nothing for no links', () => {
    expect(batchLinks([])).toEqual([])
  })
})

describe('pointsToPath', () => {
  it('closes an arrowhead polygon as path data', () => {
    expect(pointsToPath('1,2 3,4 5,6')).toBe('M1,2L3,4L5,6Z')
  })
})
