// AdjacencyMatrix cell building: symmetric node cells and the layer heat map (tinkermonkey/heimdall#336).
import { describe, it, expect } from 'vitest'
import { buildLayeredIndex, DEFAULT_LINK_FILTERS, isLinkVisible, orderAcrossLayers } from '../layered'
import { layerMatrixCells, matrixCells } from '../layered/matrix'
import { drLayers, drCategoryOrder, drSpecNodes, drSpecEdges } from '../../test-pages/fixtures/layeredGraphFixtures'

const layering = { layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }
const spec = () => buildLayeredIndex(drSpecNodes, drSpecEdges, layering)

const tiny = () =>
  buildLayeredIndex(
    [
      { id: 'a', label: 'A', attributes: { layer: 'x' } },
      { id: 'b', label: 'B', attributes: { layer: 'x' } },
      { id: 'c', label: 'C', attributes: { layer: 'y' } },
    ],
    [
      { id: 'ab', sourceId: 'a', targetId: 'b', attributes: { category: 'k' } },
      { id: 'ba', sourceId: 'b', targetId: 'a', attributes: { category: 'k' } },
      { id: 'ca', sourceId: 'c', targetId: 'a', attributes: { category: 'k' } },
    ],
    { layerBy: 'layer', linkCategoryBy: 'category' },
  )

describe('matrixCells', () => {
  it('directed: one cell per link at (source, target)', () => {
    const ix = tiny()
    const at = new Map(['a', 'b', 'c'].map((id, i) => [id, i]))
    const cells = matrixCells(ix.links, at, false)
    expect(cells).toHaveLength(ix.links.length)
    for (const { r, c, links } of cells) {
      expect(links).toHaveLength(1)
      expect([r, c]).toEqual([at.get(links[0].sourceId), at.get(links[0].targetId)])
    }
  })

  it('symmetric: both directions share one cell above the diagonal, row → column first', () => {
    const ix = tiny()
    const at = new Map(['a', 'b', 'c'].map((id, i) => [id, i]))
    const cells = matrixCells(ix.links, at, true)
    const pos = cells.map(({ r, c, links }) => [r, c, links.map((l) => l.sourceId + l.targetId).join(',')])
    expect(pos).toEqual(expect.arrayContaining([
      [0, 1, 'ab,ba'],
      [0, 2, 'ca'],
    ]))
    expect(cells).toHaveLength(2)
    expect(cells.every(({ r, c }) => r <= c)).toBe(true)
  })

  it('symmetric: keeps row → column first whichever direction comes first', () => {
    const ix = tiny()
    const at = new Map(['a', 'b', 'c'].map((id, i) => [id, i]))
    const cell = matrixCells([...ix.links].reverse(), at, true).find((x) => x.r === 0 && x.c === 1)!
    expect(cell.links.map((l) => l.sourceId)).toEqual(['a', 'b'])
  })

  it('skips links whose ends are not in the order', () => {
    const ix = tiny()
    expect(matrixCells(ix.links, new Map([['a', 0], ['b', 1]]), true)).toHaveLength(1)
  })

  it('symmetric on the spec fixture: every cell sits on or above the diagonal and every link is kept', () => {
    const ix = spec()
    const ids = orderAcrossLayers(ix, null, 'degree')
    const at = new Map(ids.map((id, i) => [id, i]))
    const cells = matrixCells(ix.links, at, true)
    expect(cells.every(({ r, c }) => r <= c)).toBe(true)
    expect(cells.reduce((n, cell) => n + cell.links.length, 0)).toBe(ix.links.length)
    expect(cells.length).toBeLessThan(ix.links.length)
  })
})

describe('layerMatrixCells', () => {
  it('counts links per (source layer, target layer)', () => {
    const ix = tiny()
    const { cells, max } = layerMatrixCells(ix, ['x', 'y'], ix.links, false)
    expect(cells.map((c) => [c.rowLayerId, c.colLayerId, c.linkCount, c.pairKey])).toEqual([
      ['x', 'x', 2, null],
      ['y', 'x', 1, ix.links.find((l) => l.cross)!.pairKey],
    ])
    expect(max).toBe(2)
  })

  it('symmetric: both directions add into the upper triangle', () => {
    const ix = tiny()
    const { cells } = layerMatrixCells(ix, ['x', 'y'], ix.links, true)
    expect(cells.map((c) => [c.r, c.c, c.linkCount])).toEqual([[0, 0, 2], [0, 1, 1]])
  })

  it('leaves out hidden layers and adds up to the visible link count', () => {
    const ix = spec()
    const filters = { ...DEFAULT_LINK_FILTERS, hiddenLayers: ['technology'] }
    const visible = ix.links.filter((l) => isLinkVisible(l, ix, filters))
    const { cells } = layerMatrixCells(ix, ['business', 'application'], visible, false)
    expect(cells.every((c) => c.rowLayerId !== 'technology' && c.colLayerId !== 'technology')).toBe(true)
    expect(cells.reduce((n, c) => n + c.linkCount, 0)).toBe(visible.length)
  })
})
