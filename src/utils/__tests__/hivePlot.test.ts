import { describe, expect, it } from 'vitest'
import {
  HIVE_MIN_LOOP_BULGE,
  clampSplitAngle,
  hiveAxisAngles,
  hiveAxisGroups,
  hiveLabelSide,
  hiveLayout,
  hiveLinkGeometry,
  hivePoint,
  sameHiveAxisGroups,
} from '../layered/hive'
import { buildLayeredIndex } from '../layered/buildLayeredIndex'
import { rankWithinLayers } from '../layered/layout'

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

  it('keeps a loop between near neighbours wide enough for its arrowhead', () => {
    const h = hiveLayout(layers3, rank, { splitAxes: false })
    // Neighbours 12 apart on the vertical axis: the apex clears the axis by half the minimum bulge.
    const short = hiveLinkGeometry(h, { layerId: 'a', radius: 100 }, { layerId: 'a', radius: 112 })!
    close(short.c.x, HIVE_MIN_LOOP_BULGE)
    // The end tangent (control to target) arrives steeper than the span-proportional bulge gave (about 70.8°).
    const along = Math.abs(short.b.y - short.c.y)
    const across = Math.abs(short.b.x - short.c.x)
    expect((Math.atan2(across, along) * 180) / Math.PI).toBeGreaterThan(78)
    // Long loops keep their span-proportional bulge.
    const long = hiveLinkGeometry(h, { layerId: 'a', radius: 100 }, { layerId: 'a', radius: 200 })!
    close(long.c.x, 100 * 0.6 + 10)
  })

  it('keeps angles stable when a layer is hidden', () => {
    const all = hiveLayout(layers3, rank)
    const h = hiveLayout(layers3, rank, { hiddenLayers: ['b'] })
    expect(h.axes.map((a) => a.layerId)).toEqual(['a', 'c'])
    expect(h.axes.map((a) => a.angle)).toEqual([-90, 150])
    expect(h.axes.map((a) => a.position)).toEqual([0, 2])
    expect(h.slots).toEqual(all.slots)
    expect(h.split).toBe(all.split)
    expect(h.axisOf.has('b')).toBe(false)
    expect(h.radiusOf.has('b1')).toBe(false)
    expect(h.radiusOf.get('c1')).toBe(all.radiusOf.get('c1'))
    expect(hiveLinkGeometry(h, { layerId: 'a', radius: 100 }, { layerId: 'b', radius: 100 })).toBeNull()
    const g = hiveLinkGeometry(h, { layerId: 'a', radius: 100 }, { layerId: 'c', radius: 100 })!
    expect(g).toEqual(hiveLinkGeometry(all, { layerId: 'a', radius: 100 }, { layerId: 'c', radius: 100 }))
  })

  it('keeps angles stable when the first layer, or all but one, is hidden', () => {
    const all = hiveLayout(layers3, rank)
    const first = hiveLayout(layers3, rank, { hiddenLayers: ['a'] })
    expect(first.axes.map((a) => a.position)).toEqual([1, 2])
    expect(first.axes.map((a) => a.angle)).toEqual([30, 150])
    expect(first.radiusOf.has('a1')).toBe(false)
    const one = hiveLayout(layers3, rank, { hiddenLayers: ['a', 'c'] })
    expect(one.axes.map((a) => [a.layerId, a.angle])).toEqual([['b', 30]])
    expect(one.slots).toEqual(all.slots)
    expect(one.split).toBe(all.split)
    expect([...one.radiusOf.keys()]).toEqual(['b1'])
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

describe('hive axis groups', () => {
  // Two layers; `kind` cuts across them.
  const index = buildLayeredIndex(
    [
      { id: 'p1', label: 'p1', kind: 'svc', attributes: { tier: 'top' } },
      { id: 'p2', label: 'p2', kind: 'data', attributes: { tier: 'top' } },
      { id: 'q1', label: 'q1', kind: 'svc', attributes: { tier: 'bottom' } },
      { id: 'q2', label: 'q2', kind: 'actor', attributes: { tier: 'bottom' } },
      { id: 'q3', label: 'q3', attributes: { tier: 'bottom' } },
    ],
    [
      { id: 'e1', sourceId: 'p1', targetId: 'q1' },
      { id: 'e2', sourceId: 'q1', targetId: 'q2' },
      { id: 'e3', sourceId: 'p1', targetId: 'q2' },
    ],
    { layerBy: 'tier', layers: [{ id: 'top' }, { id: 'bottom' }] },
  )
  const byKind = (n: { kind?: string }) => n.kind

  it("defaults to one axis per layer, in layer order", () => {
    const g = hiveAxisGroups(index)
    expect(g.axes).toEqual([{ id: 'top', nodeIds: ['p1', 'p2'] }, { id: 'bottom', nodeIds: ['q1', 'q2', 'q3'] }])
    expect(g.axisOf.get('q3')).toBe('bottom')
    expect(g.unassigned).toEqual([])
  })

  it('groups by any value, sorted by code point, and leaves null or undefined unassigned', () => {
    const g = hiveAxisGroups(index, byKind)
    expect(g.axes).toEqual([
      { id: 'actor', nodeIds: ['q2'] },
      { id: 'data', nodeIds: ['p2'] },
      { id: 'svc', nodeIds: ['p1', 'q1'] },
    ])
    expect(g.axisOf.get('q1')).toBe('svc')
    expect(g.unassigned).toEqual(['q3'])
    expect(g.axisOf.has('q3')).toBe(false)
    // '' is unassigned too; numeric ids sort as code points.
    expect(hiveAxisGroups(index, (n) => (n.id === 'p2' ? '' : n.kind ?? null)).unassigned).toEqual(['p2', 'q3'])
    expect(hiveAxisGroups(index, (n) => (n.id.startsWith('p') ? '10' : '9')).axes.map((a) => a.id)).toEqual(['10', '9'])
  })

  it('tells structurally equal groupings apart from changed ones', () => {
    const a = hiveAxisGroups(index, byKind)
    expect(sameHiveAxisGroups(a, hiveAxisGroups(index, (n) => n.kind))).toBe(true)
    expect(sameHiveAxisGroups(a, hiveAxisGroups(index, byKind, ['svc']))).toBe(false)
    expect(sameHiveAxisGroups(a, hiveAxisGroups(index, (n) => n.kind ?? 'none'))).toBe(false)
  })

  it('orders axes by a list (the rest follow) or a comparator', () => {
    expect(hiveAxisGroups(index, byKind, ['svc', 'missing', 'svc']).axes.map((a) => a.id)).toEqual(['svc', 'actor', 'data'])
    expect(hiveAxisGroups(index, byKind, (a, b) => b.localeCompare(a)).axes.map((a) => a.id)).toEqual(['svc', 'data', 'actor'])
    expect(hiveAxisGroups(index, 'layer', ['bottom']).axes.map((a) => a.id)).toEqual(['bottom', 'top'])
  })

  it('ranks within the axis groups', () => {
    const g = hiveAxisGroups(index, byKind)
    const r = rankWithinLayers(index, 'degree', g.axes)
    // svc: p1 (degree 2) and q1 (degree 2) tie, then by label; actor and data alone sit mid-axis.
    expect([r.get('p1'), r.get('q1')].sort()).toEqual([0.25, 0.75])
    expect(r.get('q2')).toBe(0.5)
    expect(r.get('p2')).toBe(0.5)
    expect(r.has('q3')).toBe(false)
  })

  it('lays the groups out like layers, with stable slots', () => {
    const g = hiveAxisGroups(index, byKind)
    const h = hiveLayout(g.axes, rankWithinLayers(index, 'degree', g.axes), { hiddenLayers: ['data'] })
    expect(h.axes.map((a) => [a.layerId, a.angle])).toEqual([['actor', -90], ['svc', 150]])
    expect(hiveLinkGeometry(h, { layerId: 'svc', radius: 100 }, { layerId: 'svc', radius: 200 })).not.toBeNull()
  })
})

