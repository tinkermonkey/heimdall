// AdjacencyMatrix cell building: symmetric node cells, the layer heat map, the cluster order and
// link inspector metadata (tinkermonkey/heimdall#336).
import { describe, it, expect } from 'vitest'
import { buildLayeredIndex, DEFAULT_LINK_FILTERS, isLinkVisible, orderAcrossLayers } from '../layered'
import { clusterOrder, layerMatrixCells, linkEdgeMetadata, matrixCellStep, matrixCells, matrixWindow } from '../layered/matrix'
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

describe('clusterOrder', () => {
  // Two cliques in one layer whose labels interleave, so label and degree orders mix them.
  const cliques = (reverse = false) => {
    const nodes = ['a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'z'].map((id) => ({ id, label: id, attributes: { layer: id === 'z' ? 'y' : 'x' } }))
    const pairs = [['a1', 'a2'], ['a2', 'a3'], ['a1', 'a3'], ['b1', 'b2'], ['b2', 'b3'], ['b1', 'b3'], ['a1', 'z']]
    const edges = pairs.map(([s, t]) => ({ id: s + t, sourceId: s, targetId: t, attributes: { category: 'k' } }))
    return buildLayeredIndex(reverse ? [...nodes].reverse() : nodes, reverse ? [...edges].reverse() : edges, {
      layerBy: 'layer',
      linkCategoryBy: 'category',
      layers: [{ id: 'x' }, { id: 'y' }],
    })
  }

  it('keeps each community together within its layer, layers in rank order', () => {
    const ids = clusterOrder(cliques())
    expect(ids).toHaveLength(7)
    expect(ids[6]).toBe('z')
    const x = ids.slice(0, 6)
    const groupOf = (id: string) => id[0]
    // one change of group across the layer: a-block then b-block (or the reverse)
    const changes = x.slice(1).filter((id, i) => groupOf(id) !== groupOf(x[i])).length
    expect(changes).toBe(1)
  })

  it('is deterministic: same result on every run and for any input order', () => {
    const first = clusterOrder(cliques())
    expect(clusterOrder(cliques())).toEqual(first)
    expect(clusterOrder(cliques(true))).toEqual(first)
    const a = clusterOrder(spec())
    const shuffled = buildLayeredIndex([...drSpecNodes].reverse(), [...drSpecEdges].reverse(), layering)
    expect(clusterOrder(shuffled)).toEqual(a)
    expect(clusterOrder(spec())).toEqual(a)
  })

  it('breaks degree and label ties by id, not input order', () => {
    // two triangles whose nodes all share one label and one degree
    const dup = (reverse: boolean) => {
      const nodes = ['p', 'a', 'b', 'q', 'c', 'd'].map((id) => ({ id, label: 'Dup', attributes: { layer: 'x' } }))
      const pairs = [['p', 'a'], ['a', 'b'], ['b', 'p'], ['q', 'c'], ['c', 'd'], ['d', 'q']]
      const edges = pairs.map(([s, t]) => ({ id: s + t, sourceId: s, targetId: t, attributes: { category: 'k' } }))
      return buildLayeredIndex(reverse ? [...nodes].reverse() : nodes, reverse ? [...edges].reverse() : edges, { layerBy: 'layer', linkCategoryBy: 'category' })
    }
    const forward = clusterOrder(dup(false))
    expect(clusterOrder(dup(true))).toEqual(forward)
    expect(forward).toEqual(['a', 'b', 'p', 'c', 'd', 'q'])
  })

  it('is a permutation of every node, grouped by layer', () => {
    const ix = spec()
    const ids = clusterOrder(ix)
    expect([...ids].sort()).toEqual(ix.nodes.map((n) => n.id).sort())
    const ranks = ids.map((id) => ix.nodeById.get(id)!.layerRank)
    expect(ranks).toEqual([...ranks].sort((p, q) => p - q))
  })
})

describe('linkEdgeMetadata', () => {
  it('maps a link to GraphEdgeInspector metadata', () => {
    const ix = tiny()
    const ca = ix.links.find((l) => l.sourceId === 'c')!
    expect(linkEdgeMetadata(ix, ca)).toMatchObject({
      id: ca.id,
      sourceId: 'c',
      sourceTitle: 'C',
      targetId: 'a',
      targetTitle: 'A',
      metadata: { layers: 'y → x', category: 'k', edges: 1 },
    })
  })
})

describe('matrixWindow', () => {
  it('covers the rows and columns in view plus overscan, clear of the sticky labels', () => {
    // 600 cells of 10px; labels 200px wide and 60px tall; a 1000 × 560 view scrolled to (3000, 2000)
    expect(matrixWindow({ left: 3000, top: 2000, width: 1000, height: 560 }, 600, 10, 200, 60, 8)).toEqual({ r0: 192, r1: 258, c0: 292, c1: 388 })
  })

  it('clamps to the matrix', () => {
    expect(matrixWindow({ left: 0, top: 0, width: 1000, height: 560 }, 50, 10, 200, 60, 8)).toEqual({ r0: 0, r1: 50, c0: 0, c1: 50 })
    expect(matrixWindow({ left: 99999, top: 99999, width: 1000, height: 560 }, 600, 10, 200, 60).r0).toBe(600)
  })
})

describe('matrixCellStep', () => {
  const cells = [
    { r: 0, c: 1 }, { r: 0, c: 5 },
    { r: 2, c: 0 }, { r: 2, c: 4 }, { r: 2, c: 9 },
    { r: 5, c: 6 },
  ]
  it('Left and Right walk every cell in reading order', () => {
    expect(matrixCellStep(cells, cells[1], 'ArrowRight')).toBe(cells[2])
    expect(matrixCellStep(cells, cells[2], 'ArrowLeft')).toBe(cells[1])
    expect(matrixCellStep(cells, cells[5], 'ArrowRight')).toBeNull()
  })

  it('Up and Down skip empty rows and keep the closest column, the left one on a tie', () => {
    expect(matrixCellStep(cells, cells[1], 'ArrowDown')).toBe(cells[3]) // c 5 -> 4
    expect(matrixCellStep(cells, cells[3], 'ArrowDown')).toBe(cells[5])
    expect(matrixCellStep(cells, cells[5], 'ArrowUp')).toBe(cells[3]) // from c 6: c 4 is 2 away, c 9 is 3
    expect(matrixCellStep([{ r: 0, c: 4 }, { r: 1, c: 2 }, { r: 1, c: 6 }], { r: 0, c: 4 }, 'ArrowDown')).toBeNull() // not in list
    const tie = [{ r: 0, c: 4 }, { r: 1, c: 2 }, { r: 1, c: 6 }]
    expect(matrixCellStep(tie, tie[0], 'ArrowDown')).toBe(tie[1])
    expect(matrixCellStep(cells, cells[0], 'ArrowUp')).toBeNull()
  })

  it('Home and End go to the ends of the row; other keys do nothing', () => {
    expect(matrixCellStep(cells, cells[3], 'Home')).toBe(cells[2])
    expect(matrixCellStep(cells, cells[3], 'End')).toBe(cells[4])
    expect(matrixCellStep(cells, cells[3], 'a')).toBeNull()
  })
})
