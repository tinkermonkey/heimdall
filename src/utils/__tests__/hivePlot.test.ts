import { describe, expect, it } from 'vitest'
import { clampSplitAngle, hiveAxisAngles, hiveLabelSide, hiveLayout, hiveLinkGeometry, hivePoint } from '../layered/hive'

const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-6)
const angleOf = (p: { x: number; y: number }) => (Math.atan2(p.y, p.x) * 180) / Math.PI

const layers3 = [
  { id: 'a', nodeIds: ['a1', 'a2'] },
  { id: 'b', nodeIds: ['b1'] },
  { id: 'c', nodeIds: ['c1'] },
]
const rank = new Map([['a1', 0.25], ['a2', 0.75], ['b1', 0.5], ['c1', 0.5]])

describe('hive geometry', () => {
  it('divides axis angles evenly from the start angle', () => {
    expect(hiveAxisAngles(3)).toEqual([-90, 30, 150])
    expect(hiveAxisAngles(4, 0)).toEqual([0, 90, 180, 270])
    expect(hiveAxisAngles(0)).toEqual([])
  })

  it('clamps the split so copies of neighbouring axes do not meet', () => {
    expect(clampSplitAngle(13, 3)).toBe(13)
    expect(clampSplitAngle(40, 6)).toBe(24)
    expect(clampSplitAngle(-5, 3)).toBe(0)
  })

  it('places nodes outward by rank', () => {
    const h = hiveLayout(layers3, rank, { innerRadius: 50, axisLength: 200 })
    expect(h.radiusOf.get('a1')).toBe(100)
    expect(h.radiusOf.get('a2')).toBe(200)
    expect(h.axes.map((a) => a.offsets)).toEqual([[-13, 13], [-13, 13], [-13, 13]])
    expect(hiveLayout(layers3, rank, { splitAxes: false }).axes[0].offsets).toEqual([0])
  })

  it('runs intra-layer links between the two copies of the axis', () => {
    const h = hiveLayout(layers3, rank, { innerRadius: 50, axisLength: 200 })
    const g = hiveLinkGeometry(h, { layerId: 'a', radius: 100 }, { layerId: 'a', radius: 200 })!
    close(angleOf(g.a), -77)
    close(angleOf(g.b), -103)
    close(angleOf(g.c), -90)
    close(Math.hypot(g.c.x, g.c.y), 153)
  })

  it('runs cross-layer links between the facing copies', () => {
    const h = hiveLayout(layers3, rank)
    const g = hiveLinkGeometry(h, { layerId: 'a', radius: 100 }, { layerId: 'b', radius: 100 })!
    close(angleOf(g.a), -77) // the copy of `a` toward `b`
    close(angleOf(g.b), 17) // the copy of `b` toward `a`
    close(angleOf(g.c), -30)
    const back = hiveLinkGeometry(h, { layerId: 'c', radius: 100 }, { layerId: 'a', radius: 100 })!
    close(angleOf(back.a), 163) // `a` is 120° clockwise of `c`
    close(angleOf(back.b), -103)
  })

  it('sends links between opposite axes to either side by direction', () => {
    const h = hiveLayout([{ id: 'a', nodeIds: [] }, { id: 'b', nodeIds: [] }], new Map())
    const down = hiveLinkGeometry(h, { layerId: 'a', radius: 100 }, { layerId: 'b', radius: 100 })!
    const up = hiveLinkGeometry(h, { layerId: 'b', radius: 100 }, { layerId: 'a', radius: 100 })!
    expect(down.c.x).toBeGreaterThan(0)
    expect(up.c.x).toBeLessThan(0)
  })

  it('draws unsplit intra-layer links as arcs whose side encodes direction', () => {
    const h = hiveLayout(layers3, rank, { splitAxes: false })
    const out = hiveLinkGeometry(h, { layerId: 'a', radius: 100 }, { layerId: 'a', radius: 200 })!
    const inn = hiveLinkGeometry(h, { layerId: 'a', radius: 200 }, { layerId: 'a', radius: 100 })!
    close(out.a.x, 0)
    expect(out.c.x).toBeGreaterThan(0)
    expect(inn.c.x).toBeLessThan(0)
  })

  it('returns null for a layer without an axis', () => {
    const h = hiveLayout(layers3, rank)
    expect(hiveLinkGeometry(h, { layerId: 'a', radius: 1 }, { layerId: 'zz', radius: 1 })).toBeNull()
  })

  it('labels the copy whose text reads clear of the gap', () => {
    const h = hiveLayout(layers3, rank)
    // top axis: right copy, text to the right; lower-right axis: upper copy; lower-left: upper copy, text to the left
    expect(h.axes.map((a) => a.offsets[a.labelCopy])).toEqual([13, -13, 13])
    expect(h.axes.map((a) => hiveLabelSide(a))).toEqual([1, 1, -1])
  })

  it('hivePoint measures clockwise from +x', () => {
    const p = hivePoint(90, 10)
    close(p.x, 0)
    close(p.y, 10)
  })
})
