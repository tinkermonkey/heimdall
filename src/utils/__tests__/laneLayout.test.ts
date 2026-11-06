import { describe, it, expect } from 'vitest'
import { buildLayeredIndex, layoutLayers } from '../layered'
import { laneLinkCurve, layoutLanes } from '../laneLayout'
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
