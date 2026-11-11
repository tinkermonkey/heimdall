import { describe, it, expect } from 'vitest'
import { buildLayeredIndex, layoutLayers } from '../layered'
import { curveEndBoxes, laneLinkCurve, laneTagRoom, polylineCurve, routeLaneGutters, laneTagSize, layoutLanes, placeLaneTags, retraceLabels, type LaneTagCandidate } from '../laneLayout'
import { placeEdgeLabels } from '../layered/edgeLabels'
import { drLayers, drCategoryOrder, drSpecNodes, drSpecEdges } from '../../test-pages/fixtures/layeredGraphFixtures'

const index = buildLayeredIndex(drSpecNodes, drSpecEdges, { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' })
const layout = layoutLayers(index, { layoutCategories: ['structural'] })
const sizeOf = (id: string) => ({ width: Math.round(index.nodeById.get(id)!.displayLabel.length * 6.6 + 24), height: 24 })

type Box = { x: number; y: number; width: number; height: number }
const boxOf = (pos: Map<string, { x: number; y: number }>, id: string): Box => ({ ...pos.get(id)!, ...sizeOf(id) })
const overlap = (a: Box, b: Box) => Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2

describe('layoutLanes', () => {
  it('places every node inside its own band, one band per layer in rank order', () => {
    const res = layoutLanes(index, layout, { sizeOf })
    expect(res.bands.map((b) => b.layerId)).toEqual(['business', 'application', 'technology'])
    expect(res.positions.size).toBe(index.nodes.length)
    for (const n of index.nodes) {
      const band = res.bands.find((b) => b.layerId === n.layerId)!
      const box = boxOf(res.positions, n.id)
      expect(box.x - box.width / 2).toBeGreaterThanOrEqual(band.x)
      expect(box.x + box.width / 2).toBeLessThanOrEqual(band.x + band.width)
      expect(box.y - box.height / 2).toBeGreaterThanOrEqual(band.y)
      expect(box.y + box.height / 2).toBeLessThanOrEqual(band.y + band.height)
    }
    expect(res.bands.map((b) => b.count)).toEqual(index.layers.map((l) => l.nodeIds.length))
  })

  it('stacks bands without overlap and no two nodes overlap', () => {
    const res = layoutLanes(index, layout, { sizeOf })
    for (let i = 1; i < res.bands.length; i++) expect(res.bands[i].y).toBeGreaterThan(res.bands[i - 1].y + res.bands[i - 1].height)
    const ids = [...res.positions.keys()]
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) expect(overlap(boxOf(res.positions, ids[i]), boxOf(res.positions, ids[j]))).toBe(false)
  })

  it('wraps rows at maxRowWidth and orders each row by coupled x', () => {
    const narrow = layoutLanes(index, layout, { sizeOf, maxRowWidth: 400 })
    const wide = layoutLanes(index, layout, { sizeOf })
    expect(narrow.bands[0].height).toBeGreaterThan(wide.bands[0].height)
    // the first row of the business lane runs in coupled-x order
    const biz = index.layers[0].nodeIds.map((id) => ({ id, p: wide.positions.get(id)! }))
    const firstRowY = Math.min(...biz.map((b) => b.p.y))
    const row = biz.filter((b) => b.p.y === firstRowY).sort((a, b) => a.p.x - b.p.x).map((b) => layout.coupled.get(b.id)!.x)
    expect(row).toEqual([...row].sort((a, b) => a - b))
  })

  it('leaves hidden layers out', () => {
    const res = layoutLanes(index, layout, { sizeOf, hiddenLayers: ['application'] })
    expect(res.bands.map((b) => b.layerId)).toEqual(['business', 'technology'])
    expect([...res.positions.keys()].every((id) => index.nodeById.get(id)!.layerId !== 'application')).toBe(true)
  })

  it('is deterministic', () => {
    const a = layoutLanes(index, layout, { sizeOf })
    const b = layoutLanes(index, layout, { sizeOf })
    expect([...a.positions]).toEqual([...b.positions])
  })

  it('vertical: one column band per layer side by side, all the same height', () => {
    const res = layoutLanes(index, layout, { sizeOf, orientation: 'vertical' })
    expect(res.orientation).toBe('vertical')
    for (let i = 1; i < res.bands.length; i++) {
      expect(res.bands[i].x).toBeGreaterThan(res.bands[i - 1].x + res.bands[i - 1].width)
      expect(res.bands[i].height).toBe(res.bands[0].height)
    }
    const ids = [...res.positions.keys()]
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) expect(overlap(boxOf(res.positions, ids[i]), boxOf(res.positions, ids[j]))).toBe(false)
  })

  it('vertical chips: sideRoomOf keeps room for each node\'s tag inside its band', () => {
    const chipOf = () => ({ width: 24, height: 24 })
    const label = (id: string) => index.nodeById.get(id)!.displayLabel
    const res = layoutLanes(index, layout, { sizeOf: chipOf, orientation: 'vertical', sideRoomOf: (id) => laneTagRoom(label(id)) })
    for (const n of index.nodes) {
      const band = res.bands.find((b) => b.layerId === n.layerId)!
      const p = res.positions.get(n.id)!
      expect(p.x + 12 + laneTagRoom(label(n.id))).toBeLessThanOrEqual(band.x + band.width)
    }
  })
})

describe('laneLinkCurve', () => {
  const a = { x: 100, y: 50, width: 80, height: 24 }
  const b = { x: 300, y: 250, width: 60, height: 24 }

  it('cross-layer: runs from the bottom of the upper box to the top of the lower one, arrow pointing down', () => {
    const c = laneLinkCurve(a, b, true)
    expect(c.pointAt(0)).toEqual({ x: 100, y: 62 })
    expect(c.pointAt(1)).toEqual({ x: 300, y: 238 })
    expect(c.tip).toEqual({ x: 300, y: 238 })
    expect(c.dir).toEqual({ x: 0, y: 1 })
    const up = laneLinkCurve(b, a, true)
    expect(up.tip).toEqual({ x: 100, y: 62 })
    expect(up.dir).toEqual({ x: 0, y: -1 })
  })

  it('intra-layer: an arc above the row between the top edges', () => {
    const c = laneLinkCurve(a, { ...b, y: 50 }, false)
    expect(c.pointAt(0)).toEqual({ x: 100, y: 38 })
    expect(c.pointAt(1)).toEqual({ x: 300, y: 38 })
    expect(c.pointAt(0.5).y).toBeLessThan(38)
    expect(c.dir.y).toBeGreaterThan(0)
    expect(c.d.startsWith('M100,38 Q')).toBe(true)
  })

  it('vertical: cross links leave the facing side, intra arcs bulge left', () => {
    const c = laneLinkCurve(a, b, true, 'vertical')
    expect(c.pointAt(0)).toEqual({ x: 140, y: 50 })
    expect(c.tip).toEqual({ x: 270, y: 250 })
    expect(c.dir).toEqual({ x: 1, y: 0 })
    const arc = laneLinkCurve(a, { ...a, y: 150 }, false, 'vertical')
    expect(arc.pointAt(0.5).x).toBeLessThan(60)
  })
})

describe('retraceLabels', () => {
  const a = { x: 100, y: 50, width: 80, height: 24 }
  const b = { x: 300, y: 250, width: 60, height: 24 }
  it('keeps each pill at its t on the live curve and drops pills whose link is gone', () => {
    const before = laneLinkCurve(a, b, true)
    const [pill] = placeEdgeLabels([{ id: 'l1', text: 'serves', pointAt: before.pointAt, priority: 0 }])
    const moved = laneLinkCurve({ ...a, x: 160 }, b, true)
    const out = retraceLabels([pill, { ...pill, id: 'gone' }], (id) => (id === 'l1' ? moved : undefined))
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ id: 'l1', t: pill.t, width: pill.width, height: pill.height, ...moved.pointAt(pill.t) })
  })
})

describe('placeLaneTags', () => {
  const chip = (id: string, x: number, y: number, priority = 1, forced = false): LaneTagCandidate => ({
    id, text: id, box: { x, y, width: 24, height: 24 }, priority, forced,
  })
  const apart = (p: { x: number; y: number; width: number; height: number }, q: typeof p) =>
    Math.abs(p.x - q.x) >= (p.width + q.width) / 2 || Math.abs(p.y - q.y) >= (p.height + q.height) / 2

  it('horizontal: puts a tag above its chip, clear of the chips', () => {
    const cands = [chip('alpha', 100, 100)]
    const [tag] = placeLaneTags(cands, cands.map((c) => c.box))
    expect(tag.x).toBe(100)
    expect(tag.y + tag.height / 2).toBeLessThan(100 - 12)
    expect(tag).toMatchObject(laneTagSize('alpha'))
  })

  it('vertical: puts a tag right of its chip', () => {
    const [tag] = placeLaneTags([chip('alpha', 100, 100)], [], 'vertical')
    expect(tag.y).toBe(100)
    expect(tag.x - tag.width / 2).toBeGreaterThan(100 + 12)
  })

  it('places tags clear of each other and the obstacles, dropping unforced ones with no room', () => {
    // A dense row under another row: tags only fit below, and 38px apart only some of them do.
    const cands = Array.from({ length: 8 }, (_, i) => chip(`node_${i}`, 100 + i * 38, 100, 1 + i))
    const obstacles = [...cands.map((c) => c.box), ...cands.map((c) => ({ ...c.box, y: 64 }))]
    const tags = placeLaneTags(cands, obstacles)
    expect(tags.length).toBeGreaterThan(1)
    expect(tags.length).toBeLessThan(cands.length)
    for (let i = 0; i < tags.length; i++) {
      for (const o of obstacles) expect(apart(tags[i], o)).toBe(true)
      for (let j = i + 1; j < tags.length; j++) expect(apart(tags[i], tags[j])).toBe(true)
    }
  })

  it('keeps an unforced tag inside its lane band', () => {
    const within = { x: 80, y: 60, width: 140, height: 400 }
    // Vertical: the right spot would leave the band, so the tag goes left; with no room either side it is dropped.
    const [tag] = placeLaneTags([{ ...chip('DataObject', 190, 100), within }], [], 'vertical')
    expect(tag.x + tag.width / 2).toBeLessThanOrEqual(within.x + within.width)
    expect(tag.x - tag.width / 2).toBeGreaterThanOrEqual(within.x)
    expect(placeLaneTags([{ ...chip('ApplicationCollaboration', 150, 100), within: { ...within, height: 40, y: 80 } }], [], 'vertical')).toEqual([])
  })

  it('places forced tags first, so the others keep clear of them and of each other', () => {
    // Two forced chips side by side: their tags must not overlap, and an unforced one placed
    // between them (higher priority) must not land on either.
    const tags = placeLaneTags([chip('earlier_node', 100, 100, 0), chip('hovered_one', 110, 100, 5, true), chip('focused_one', 160, 100, 5, true)], [])
    const forced = tags.filter((t) => t.id !== 'earlier_node')
    expect(forced).toHaveLength(2)
    for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) expect(apart(tags[i], tags[j])).toBe(true)
  })

  it('takes the side its link ends leave free', () => {
    const a = { x: 100, y: 100, width: 24, height: 24 }
    const up = laneLinkCurve(a, { x: 100, y: -100, width: 24, height: 24 }, true)
    const ends = curveEndBoxes(up, 0)
    expect(ends.length).toBeGreaterThan(2)
    for (const e of ends) expect(Math.hypot(e.x - up.pointAt(0).x, e.y - up.pointAt(0).y)).toBeLessThanOrEqual(18)
    const [tag] = placeLaneTags([chip('alpha', 100, 100)], ends)
    expect(tag.y).toBeGreaterThan(100) // below: the link leaves upward
  })

  it('vertical: a tag whose links leave on the right sits past their ends, inside the reserved room', () => {
    const a = { x: 100, y: 100, width: 24, height: 24 }
    const out = laneLinkCurve(a, { x: 400, y: 160, width: 24, height: 24 }, true, 'vertical')
    const ends = curveEndBoxes(out, 0)
    const within = { x: 80, y: 60, width: 32 + laneTagRoom('BusinessProcess') + 20, height: 400 }
    const [tag] = placeLaneTags([{ ...chip('BusinessProcess', 100, 100), within }], ends, 'vertical')
    expect(tag).toBeDefined()
    expect(tag.y).toBe(100)
    for (const e of ends) expect(apart(tag, e)).toBe(true)
    expect(tag.x + tag.width / 2).toBeLessThanOrEqual(112 + laneTagRoom('BusinessProcess'))
  })

  it('always places a forced tag, at its first spot when nothing is clear', () => {
    const blocked = chip('selected', 100, 100, 0, true)
    const wall = { x: 100, y: 100, width: 600, height: 200 }
    const tags = placeLaneTags([blocked, chip('other', 140, 100)], [wall])
    expect(tags.map((t) => t.id)).toEqual(['selected'])
    expect(tags[0]).toMatchObject({ x: 100, t: 0 })
  })
})

describe('polylineCurve', () => {
  it('walks the straight segments by length and rounds the corners in the path', () => {
    const c = polylineCurve([{ x: 0, y: 0 }, { x: 0, y: 30 }, { x: 40, y: 30 }])
    expect(c.pointAt(0)).toEqual({ x: 0, y: 0 })
    expect(c.pointAt(1)).toEqual({ x: 40, y: 30 })
    expect(c.pointAt(30 / 70)).toEqual({ x: 0, y: 30 })
    expect(c.tangentAt(0.1)).toEqual({ x: 0, y: 1 })
    expect(c.tangentAt(0.9)).toEqual({ x: 1, y: 0 })
    expect(c.tip).toEqual({ x: 40, y: 30 })
    expect(c.dir).toEqual({ x: 1, y: 0 })
    expect(c.d).toBe('M0,0 L0,22 Q0,30 8,30 L40,30')
  })
})

describe('routeLaneGutters', () => {
  const rank = new Map(index.layers.map((l, i) => [l.id, i]))
  const layerOf = (id: string) => index.nodeById.get(id)?.layerId
  const cross = index.links.filter((l) => l.cross)
  const skips = cross.filter((l) => Math.abs(rank.get(layerOf(l.sourceId)!)! - rank.get(layerOf(l.targetId)!)!) >= 2)
  const route = (orientation: 'horizontal' | 'vertical') => {
    const lanes = layoutLanes(index, layout, { sizeOf, orientation })
    const boxOf = (id: string) => ({ ...lanes.positions.get(id)!, ...sizeOf(id) })
    return { lanes, boxOf, res: routeLaneGutters(cross, boxOf, layerOf, lanes) }
  }
  // A route's corner points, from samples along it.
  const corners = (c: { pointAt: (t: number) => { x: number; y: number } }) => {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= 400; i++) {
      const p = c.pointAt(i / 400)
      const q = pts[pts.length - 1]
      if (!q || Math.hypot(p.x - q.x, p.y - q.y) > 1e-6) pts.push({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })
    }
    return pts
  }

  it('routes exactly the links that skip a lane', () => {
    expect(skips.length).toBe(7)
    const { res } = route('horizontal')
    expect([...res.curves.keys()].sort()).toEqual(skips.map((l) => l.id).sort())
  })

  it('horizontal: leaves the source toward the next lane, runs outside the bands, arrives at the target edge', () => {
    const { lanes, boxOf, res } = route('horizontal')
    const L = Math.min(...lanes.bands.map((b) => b.x))
    const R = Math.max(...lanes.bands.map((b) => b.x + b.width))
    for (const l of skips) {
      const c = res.curves.get(l.id)!
      const a = boxOf(l.sourceId)
      const b = boxOf(l.targetId)
      const up = a.y > b.y
      expect(c.pointAt(0)).toEqual({ x: a.x, y: up ? a.y - a.height / 2 : a.y + a.height / 2 })
      expect(c.tip).toEqual({ x: b.x, y: up ? b.y + b.height / 2 : b.y - b.height / 2 })
      expect(c.dir).toEqual({ x: 0, y: up ? -1 : 1 })
      const xs = corners(c).map((p) => p.x)
      expect(Math.min(...xs) < L || Math.max(...xs) > R).toBe(true)
    }
    expect(res.bounds!.minX < L || res.bounds!.maxX > R).toBe(true)
  })

  it('gives overlapping routes their own gutter and gap tracks, an outer route wrapping the inner', () => {
    const { lanes, res } = route('horizontal')
    const L = Math.min(...lanes.bands.map((b) => b.x))
    const R = Math.max(...lanes.bands.map((b) => b.x + b.width))
    const legs = skips.map((l) => {
      const p = corners(res.curves.get(l.id)!)
      const gx = p.find((q) => q.x < L || q.x > R)!.x
      const ys = p.filter((q) => q.x === gx).map((q) => q.y)
      return { gx, top: Math.min(...ys), bot: Math.max(...ys), right: gx > R }
    })
    for (let i = 0; i < legs.length; i++)
      for (let j = i + 1; j < legs.length; j++) {
        const [p, q] = [legs[i], legs[j]]
        // Gap runs at distinct heights at both ends.
        expect(p.top).not.toBe(q.top)
        expect(p.bot).not.toBe(q.bot)
        if (p.right !== q.right || !(p.top < q.bot && q.top < p.bot)) continue
        expect(p.gx).not.toBe(q.gx)
        const edge = p.right ? R : L
        const [outer, inner] = Math.abs(p.gx - edge) > Math.abs(q.gx - edge) ? [p, q] : [q, p]
        expect(outer.top).toBeLessThanOrEqual(inner.top)
      }
  })

  it('vertical: the gutter runs above or below the lanes', () => {
    const { lanes, boxOf, res } = route('vertical')
    const top = Math.min(...lanes.bands.map((b) => b.y))
    const bottom = Math.max(...lanes.bands.map((b) => b.y + b.height))
    expect(res.curves.size).toBe(7)
    for (const l of skips) {
      const c = res.curves.get(l.id)!
      const ys = corners(c).map((p) => p.y)
      expect(Math.min(...ys) < top || Math.max(...ys) > bottom).toBe(true)
      expect(c.tip.y).toBe(boxOf(l.targetId).y)
      expect(Math.abs(c.dir.x)).toBe(1)
    }
  })

  it('routes nothing with fewer than three lanes', () => {
    const lanes = layoutLanes(index, layout, { sizeOf, hiddenLayers: ['application'] })
    const boxOf = (id: string) => (lanes.positions.has(id) ? { ...lanes.positions.get(id)!, ...sizeOf(id) } : null)
    expect(routeLaneGutters(cross, boxOf, layerOf, lanes)).toEqual({ curves: new Map(), bounds: null })
  })
})
