import { describe, it, expect } from 'vitest'
import {
  extendBoundingBoxByCircles,
  edgeLabelSize,
  edgePathSampler,
  findClearLabelPosition,
  placeEdgeLabelsJointly,
  edgeLabelRequest,
  EDGE_LABEL_TS,
  EDGE_LABEL_REPAIR_TS,
  type EdgeLabelRequest,
  type Point,
} from './graph'

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

describe('placeEdgeLabelsJointly', () => {
  const request = (id: string, label: string, points: Point[], isPolyline = false): EdgeLabelRequest => {
    const at = edgePathSampler(points, isPolyline)
    return { id, size: edgeLabelSize(label), candidates: EDGE_LABEL_TS.map(at), fallback: at(0.5), alternatives: EDGE_LABEL_REPAIR_TS.map(at) }
  }
  const boxesOverlap = (a: Point, sa: { width: number; height: number }, b: Point, sb: { width: number; height: number }) =>
    Math.abs(a.x - b.x) < (sa.width + sb.width) / 2 && Math.abs(a.y - b.y) < (sa.height + sb.height) / 2

  it('puts a label that collides with nothing where findClearLabelPosition would', () => {
    const nodes = [
      { x: 0, y: 0, width: 138, height: 30 },
      { x: 400, y: 0, width: 138, height: 30 },
      { x: 200, y: 10, width: 60, height: 30 },
    ]
    const pts = [{ x: 69, y: 0 }, { x: 200, y: -60 }, { x: 331, y: 0 }]
    const placed = placeEdgeLabelsJointly([request('a', 'depends-on', pts)], nodes)
    expect(placed.get('a')).toEqual(findClearLabelPosition(pts, edgeLabelSize('depends-on'), nodes, 6))
  })

  it('staggers the labels of two parallel edges instead of stacking them', () => {
    // Two vertical polylines 16 px apart between two rows of cards, 84 px long: alone, each label
    // takes its midpoint, and the two print over each other.
    const nodes = [
      { x: 8, y: -52, width: 90, height: 20 },
      { x: 8, y: 52, width: 90, height: 20 },
    ]
    const a = [{ x: 0, y: -42 }, { x: 0, y: 42 }]
    const b = [{ x: 16, y: 42 }, { x: 16, y: -42 }]
    const ra = request('a', 'aggregates', a, true)
    const rb = request('b', 'associated-with', b, true)
    expect(boxesOverlap(ra.fallback, ra.size, rb.fallback, rb.size)).toBe(true)
    const placed = placeEdgeLabelsJointly([ra, rb], nodes)
    expect(boxesOverlap(placed.get('a')!, ra.size, placed.get('b')!, rb.size)).toBe(false)
    expect(placed.get('a')!.x).toBe(0)
    expect(placed.get('b')!.x).toBe(16)
  })

  it('takes the least-covered spot when no spot clears the nodes, not the midpoint', () => {
    const pts = [{ x: 0, y: 0 }, { x: 150, y: 0 }, { x: 300, y: 0 }]
    // A card right on the midpoint and a smaller one near the other samples.
    const nodes = [{ x: 150, y: 0, width: 120, height: 30 }, { x: 60, y: 0, width: 40, height: 20 }, { x: 240, y: 0, width: 40, height: 20 }]
    const r = request('a', 'realizes', pts)
    const placed = placeEdgeLabelsJointly([r], nodes).get('a')!
    const covered = (p: Point) => nodes.some((n) => boxesOverlap(p, r.size, n, n))
    expect(covered(r.fallback)).toBe(true)
    expect(placed).not.toEqual(r.fallback)
    expect(Math.abs(placed.x - 150)).toBeGreaterThan(60)
  })

  it('never trades two stacked labels for a label over a card', () => {
    // Two labels stacked at the middle of a 160 px edge between two cards, and a third card beside
    // the edge's middle: the only spots clear of the other label are over that card or the ends.
    const nodes = [
      { x: 0, y: 0, width: 138, height: 30 },
      { x: 300, y: 0, width: 138, height: 30 },
      { x: 150, y: 40, width: 138, height: 30 },
    ]
    const pts = [{ x: 69, y: 0 }, { x: 150, y: 0 }, { x: 231, y: 0 }]
    const r1 = request('a', 'realizes', pts)
    const r2 = request('b', 'satisfies', [...pts].reverse())
    const placed = placeEdgeLabelsJointly([r1, r2], nodes)
    const overCard = (p: Point, size: { width: number; height: number }) => nodes.some((n) => boxesOverlap(p, size, n, n))
    expect(overCard(placed.get('a')!, r1.size)).toBe(false)
    expect(overCard(placed.get('b')!, r2.size)).toBe(false)
  })

  it('bounds the repair work on a hub with hundreds of labelled spokes', () => {
    const spokes = 500
    const reqs = Array.from({ length: spokes }, (_, i) => {
      const a = (2 * Math.PI * i) / spokes
      return request(`s${i}`, 'associated-with', [{ x: 0, y: 0 }, { x: 60 * Math.cos(a), y: 60 * Math.sin(a) }, { x: 120 * Math.cos(a), y: 120 * Math.sin(a) }])
    })
    const t = performance.now()
    const placed = placeEdgeLabelsJointly(reqs, [{ x: 0, y: 0, width: 138, height: 30 }])
    expect(placed.size).toBe(spokes)
    expect(performance.now() - t).toBeLessThan(500)
  })

  it('offsets the labels of parallel labelled tracks to the outside of their own lines', () => {
    // The staggering case above, with each edge's line given: the staggered pills each lie across
    // both tracks, so it is unclear which label names which line. Each pill moves beside its own
    // line, on the side away from the other track.
    const nodes = [
      { x: 8, y: -52, width: 90, height: 20 },
      { x: 8, y: 52, width: 90, height: 20 },
    ]
    const a = [{ x: 0, y: -42 }, { x: 0, y: 42 }]
    const b = [{ x: 16, y: 42 }, { x: 16, y: -42 }]
    const ra = { ...request('a', 'aggregates', a, true), path: a }
    const rb = { ...request('b', 'associated-with', b, true), path: b }
    const placed = placeEdgeLabelsJointly([ra, rb], nodes)
    const pa = placed.get('a')!, pb = placed.get('b')!
    // a's pill is left of its line (x = 0), b's right of its line (x = 16), each clear of both lines.
    expect(pa.x + ra.size.width / 2).toBeLessThan(0)
    expect(pb.x - rb.size.width / 2).toBeGreaterThan(16)
    expect(pa.offset).toBe(true)
    expect(pb.offset).toBe(true)
    expect(boxesOverlap(pa, ra.size, pb, rb.size)).toBe(false)
    for (const n of nodes) {
      expect(boxesOverlap(pa, ra.size, n, n)).toBe(false)
      expect(boxesOverlap(pb, rb.size, n, n)).toBe(false)
    }
  })

  it('keeps a label on its line when the parallel track is not labelled, or the tracks are apart', () => {
    const a = [{ x: 0, y: -100 }, { x: 0, y: 100 }]
    const b = [{ x: 16, y: 100 }, { x: 16, y: -100 }]
    const far = [{ x: 200, y: 100 }, { x: 200, y: -100 }]
    const ra = { ...request('a', 'aggregates', a, true), path: a }
    // Alone next to an unlabelled line: nothing to tell apart.
    expect(placeEdgeLabelsJointly([ra], []).get('a')).toEqual({ x: 0, y: 0 })
    // Next to a labelled line far enough away that the pills don't reach it.
    const rf = { ...request('f', 'associated-with', far, true), path: far }
    const placed = placeEdgeLabelsJointly([ra, rf], [])
    expect(placed.get('a')).toEqual({ x: 0, y: 0 })
    expect(placed.get('f')).toEqual({ x: 200, y: 0 })
    // Sandwiched between two labelled tracks: no outside to go to, so no offset.
    const c = [{ x: -16, y: 100 }, { x: -16, y: -100 }]
    const three = placeEdgeLabelsJointly(
      [ra, { ...request('b', 'associated-with', b, true), path: b }, { ...request('c', 'realizes', c, true), path: c }],
      [],
    )
    expect(three.get('a')!.offset).toBeUndefined()
    expect(three.get('a')!.x).toBe(0)
  })

  it('builds requests with a line only for polyline routes, so bezier labels never leave their curve', () => {
    // Owner decision 2026-11-18: outside offsets are for straight-segment (polyline) tracks only, not
    // the converging curves of an organic hub.
    const poly = edgeLabelRequest('p', 'aggregates', { points: [{ x: 0, y: -42 }, { x: 0, y: 42 }], isPolyline: true })
    expect(poly.path).toEqual([{ x: 0, y: -42 }, { x: 0, y: 42 }])
    const curve = edgeLabelRequest('c', 'aggregates', { points: [{ x: 0, y: -42 }, { x: 4, y: 0 }, { x: 0, y: 42 }] })
    expect(curve.path).toBeUndefined()
    expect(curve.candidates).toHaveLength(EDGE_LABEL_TS.length)
    // Anchors come first, as findClearLabelPosition's caller tried them.
    const anchored = edgeLabelRequest('a', 'x', { points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], isPolyline: true, labelAnchors: [{ x: 30, y: 0 }] })
    expect(anchored.candidates[0]).toEqual({ x: 30, y: 0 })

    // Two near-parallel curves 16 px apart between two rows of cards: their labels lie across both
    // lines, but as beziers they are not parallel tracks, so each stays on its own curve.
    const nodes = [
      { x: 8, y: -52, width: 90, height: 20 },
      { x: 8, y: 52, width: 90, height: 20 },
    ]
    const ca = edgeLabelRequest('a', 'aggregates', { points: [{ x: 0, y: -42 }, { x: 0, y: 0 }, { x: 0, y: 42 }] })
    const cb = edgeLabelRequest('b', 'associated-with', { points: [{ x: 16, y: 42 }, { x: 16, y: 0 }, { x: 16, y: -42 }] })
    const curved = placeEdgeLabelsJointly([ca, cb], nodes)
    expect(curved.get('a')!.offset).toBeUndefined()
    expect(curved.get('b')!.offset).toBeUndefined()
    expect(curved.get('a')!.x).toBeCloseTo(0)
    expect(curved.get('b')!.x).toBeCloseTo(16)
    // The same lines as polylines are parallel tracks: each pill goes beside its own line.
    const pa = edgeLabelRequest('a', 'aggregates', { points: [{ x: 0, y: -42 }, { x: 0, y: 42 }], isPolyline: true })
    const pb = edgeLabelRequest('b', 'associated-with', { points: [{ x: 16, y: 42 }, { x: 16, y: -42 }], isPolyline: true })
    const straight = placeEdgeLabelsJointly([pa, pb], nodes)
    expect(straight.get('a')!.offset).toBe(true)
    expect(straight.get('b')!.offset).toBe(true)
  })

  it('marks a label with no clear spot as noRoom, only when asked', () => {
    // A 10 px edge between two cards: no spot on it clears them.
    const nodes = [
      { x: 0, y: -20, width: 138, height: 30 },
      { x: 0, y: 20, width: 138, height: 30 },
      { x: 400, y: 0, width: 138, height: 30 },
    ]
    const short = request('short', 'fulfills-requirements', [{ x: 0, y: -5 }, { x: 0, y: 0 }, { x: 0, y: 5 }])
    const clear = request('clear', 'realizes', [{ x: 69, y: 0 }, { x: 200, y: 0 }, { x: 331, y: 0 }])
    expect(placeEdgeLabelsJointly([short, clear], nodes).get('short')!.noRoom).toBeUndefined()
    const placed = placeEdgeLabelsJointly([short, clear], nodes, { markNoRoom: true })
    expect(placed.get('short')!.noRoom).toBe(true)
    expect(placed.get('clear')!.noRoom).toBeUndefined()
  })

  it('of two labels that cannot clear each other, marks the later one noRoom and keeps the earlier', () => {
    // One 40 px edge between two cards, carrying two labels: only one fits.
    const nodes = [
      { x: -89, y: 0, width: 138, height: 30 },
      { x: 89, y: 0, width: 138, height: 30 },
    ]
    const pts = [{ x: -20, y: 0 }, { x: 0, y: 0 }, { x: 20, y: 0 }]
    const r1 = request('first', 'x', pts)
    const r2 = request('second', 'y', [...pts].reverse())
    const placed = placeEdgeLabelsJointly([r1, r2], nodes, { markNoRoom: true })
    expect(placed.get('first')!.noRoom).toBeUndefined()
    expect(placed.get('second')!.noRoom).toBe(true)
  })

  it('places revealed labels against fixed resting labels without moving or returning them', () => {
    // A resting label sits at the middle of a horizontal edge; a label revealed on hover on a
    // crossing edge avoids it where it can, and is allowed to overlap it where it cannot.
    const resting = { x: 0, y: 0, ...edgeLabelSize('realizes') }
    const crossing = request('focus', 'depends-on', [{ x: 0, y: -100 }, { x: 0, y: 0 }, { x: 0, y: 100 }])
    const placed = placeEdgeLabelsJointly([crossing], [], { fixedLabels: [resting] })
    expect([...placed.keys()]).toEqual(['focus'])
    expect(boxesOverlap(placed.get('focus')!, crossing.size, resting, resting)).toBe(false)
    // Nowhere else to go: the revealed label overlaps the resting one, and nothing is marked.
    const stuck = request('stuck', 'depends-on', [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }])
    const s = placeEdgeLabelsJointly([stuck], [], { fixedLabels: [resting] }).get('stuck')!
    expect(s).toEqual({ x: 0, y: 0 })
  })

  it('is deterministic and leaves unplaceable input alone', () => {
    const r1 = request('a', 'x', [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }])
    const r2 = request('b', 'y', [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }])
    const first = placeEdgeLabelsJointly([r1, r2], [])
    expect(placeEdgeLabelsJointly([r1, r2], [])).toEqual(first)
    expect(placeEdgeLabelsJointly([], []).size).toBe(0)
    const nan = { ...r1, id: 'n', candidates: [{ x: NaN, y: NaN }], fallback: { x: NaN, y: NaN }, alternatives: [] }
    expect(Number.isNaN(placeEdgeLabelsJointly([nan], []).get('n')!.x)).toBe(true)
  })
})
