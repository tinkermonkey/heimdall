import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BRANCH_MAP_DEFAULTS,
  branchMapScene,
  layoutBranchMap,
  routeBranchMap,
  type BranchMapData,
  type BranchMapLayout,
  type BranchMapOptions,
} from '../branchMap'
import { BRANCH_MAP_MARK, bundleIdOf, moreIdOf, wrapBranchMapLabel, estimateBranchMapText } from '../branchMap/layout'
import { assignBranchLanes } from '../branchMap/lanes'
import { BRANCH_MAP_SAMPLE_GROUPS as G, branchMapSample } from '../../test-pages/fixtures/branchMapSample'

type Box = { x: number; y: number; width: number; height: number }
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
const markOf = (p: { x: number; y: number }, r: number): Box => ({ x: p.x - r, y: p.y - r, width: 2 * r, height: 2 * r })
const inside = (box: Box, g: { x: number; width: number }) => box.x >= g.x - 1e-6 && box.x + box.width <= g.x + g.width + 1e-6

/** Deterministic shuffle (a small LCG), so the test itself is reproducible. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const out = [...items]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const OPTION_SETS: [string, BranchMapOptions][] = [
  ['defaults', {}],
  ['expanded', { expanded: [G.twentyLines, G.seventeenLines] }],
  ['weight', { width: 'weight' }],
  ['narrow labels', { maxLabelWidth: 110 }],
  ['tight lanes', { maxLanes: 4, laneGap: 18 }],
]

function expectNoOverlaps(layout: BranchMapLayout) {
  const groupOf = new Map(layout.groups.map((g) => [g.id, g]))
  const marks: { id: string; group: string; box: Box }[] = [
    ...layout.stations.map((s) => ({ id: s.id, group: s.group, box: markOf(s, BRANCH_MAP_MARK.station) })),
    ...layout.groups.map((g) => ({ id: `start:${g.id}`, group: g.id, box: markOf(g.start, BRANCH_MAP_MARK.start) })),
  ]
  for (let i = 0; i < marks.length; i++) {
    expect(inside(marks[i].box, groupOf.get(marks[i].group)!), `${marks[i].id} inside its group`).toBe(true)
    for (let j = i + 1; j < marks.length; j++) expect(overlaps(marks[i].box, marks[j].box), `${marks[i].id} / ${marks[j].id}`).toBe(false)
  }
  const labels = layout.labels
  for (let i = 0; i < labels.length; i++) {
    const a = labels[i]
    expect(inside(a, groupOf.get(a.group)!), `${a.target} label inside its group`).toBe(true)
    for (let j = i + 1; j < labels.length; j++) expect(overlaps(a, labels[j]), `${a.target} / ${labels[j].target}`).toBe(false)
    for (const m of marks) expect(overlaps(a, m.box), `${a.target} label / ${m.id} mark`).toBe(false)
  }
  for (let i = 1; i < layout.groups.length; i++) {
    const prev = layout.groups[i - 1]
    expect(layout.groups[i].x).toBeGreaterThanOrEqual(prev.x + prev.width)
  }
}

describe('layoutBranchMap', () => {
  it('lays the sample out with no issues', () => {
    const layout = layoutBranchMap(branchMapSample)
    expect(layout.issues).toEqual([])
    expect(layout.options).toEqual(BRANCH_MAP_DEFAULTS)
    expect(layout.groups.map((g) => g.id)).toEqual(['atlas', 'borealis', 'cirrus', 'deneb'])
    expect(layout.stations).toHaveLength(branchMapSample.stations.length)
    expect(layout.groups.map((g) => g.color)).toEqual([0, 1, 2, 5])
  })

  for (const [name, options] of OPTION_SETS) {
    it(`never overlaps station marks, label boxes or groups (${name})`, () => {
      const layout = layoutBranchMap(branchMapSample, options)
      expectNoOverlaps(layout)
    })
  }

  it('places every label of the sample, each station label on its own row', () => {
    for (const [, options] of OPTION_SETS.slice(0, 3)) {
      const layout = layoutBranchMap(branchMapSample, options)
      expect(layout.unplacedLabels).toEqual([])
      for (const s of layout.stations) {
        const label = layout.labels.find((b) => b.role === 'station' && b.target === s.id)!
        expect(label.y + label.height / 2).toBeCloseTo(s.y, 6)
      }
      for (const l of layout.lines) expect(layout.labels.some((b) => b.role === 'line' && b.target === l.id)).toBe(true)
      for (const g of layout.groups) expect(layout.labels.some((b) => b.role === 'group' && b.target === g.id)).toBe(true)
    }
  })

  it('wraps labels to two lines at maxLabelWidth, then ends them with an ellipsis', () => {
    const layout = layoutBranchMap(branchMapSample, { maxLabelWidth: 90 })
    for (const b of layout.labels) {
      expect(b.lines.length).toBeLessThanOrEqual(2)
      expect(b.width).toBeLessThanOrEqual(90)
      if (b.truncated) expect(b.lines[b.lines.length - 1].endsWith('…')).toBe(true)
    }
    expect(layout.labels.some((b) => b.lines.length === 2)).toBe(true)
    expect(layout.labels.some((b) => b.truncated)).toBe(true)
    const w = wrapBranchMapLabel('Package the plugin for the marketplace', 'line', 120, estimateBranchMapText)
    expect(w.lines).toEqual(['Package the plugin', 'for the marketplace'])
    expect(w.truncated).toBe(false)
  })

  it('takes text widths from measureText when given', () => {
    const wide = layoutBranchMap(branchMapSample, { measureText: (t) => t.length * 9 })
    const est = layoutBranchMap(branchMapSample)
    const width = (l: BranchMapLayout) => l.labels.find((b) => b.target === 'a-s3')!.width
    expect(width(wide)).toBeGreaterThan(width(est))
    expectNoOverlaps(wide)
  })

  it('gives the same layout and scene for the same input, and for shuffled input', () => {
    const a = branchMapScene(branchMapSample)
    expect(branchMapScene(branchMapSample)).toEqual(a)
    for (const seed of [1, 7, 42]) {
      const data: BranchMapData = {
        groups: branchMapSample.groups,
        stations: shuffled(branchMapSample.stations, seed),
        lines: shuffled(branchMapSample.lines, seed + 1),
        links: shuffled(branchMapSample.links ?? [], seed + 2),
      }
      expect(branchMapScene(data)).toEqual(a)
      expect(branchMapScene(data, { expanded: [G.twentyLines] })).toEqual(branchMapScene(branchMapSample, { expanded: [G.twentyLines] }))
    }
  })

  describe('ranks and bands', () => {
    const layout = layoutBranchMap(branchMapSample)
    const at = (id: string) => layout.stations.find((s) => s.id === id)!
    const start = layout.groups[0].start

    it('places dated done stations above the start, in date order', () => {
      expect(at('a-s0').rank).toBe(-2)
      expect(at('a-s1').rank).toBe(-1)
      expect(at('a-s0').y).toBeLessThan(at('a-s1').y)
      expect(at('a-s1').y).toBeLessThan(start.y)
    })

    it('orders open stations by longest path over after, lines and dependency links', () => {
      expect(at('a-d1').rank).toBe(2) // a line from the start spans two ranks
      expect(at('a-s2').rank).toBe(4) // after a-d1 and two ranks below a-l2's fork
      expect(at('a-s3').rank).toBe(5)
      expect(at('d-s1').rank).toBe(6) // waits on a-s3 across groups
      expect(at('b-s9').rank).toBe(1)
      for (const s of layout.stations) if (s.rank > 0) expect(s.y).toBeGreaterThan(start.y)
    })

    it('gives every station of a group its own row, and a rank one band across groups', () => {
      for (const g of layout.groups) {
        const ys = layout.stations.filter((s) => s.group === g.id).map((s) => s.y)
        expect(new Set(ys).size).toBe(ys.length)
      }
      expect(new Set(layout.groups.map((g) => g.start.y)).size).toBe(1)
      const firstRow = (group: string, rank: number) => Math.min(...layout.stations.filter((s) => s.group === group && s.rank === rank).map((s) => s.y))
      expect(firstRow('atlas', 2)).toBe(firstRow('borealis', 2))
      expect(firstRow('borealis', 2)).toBe(firstRow('cirrus', 2))
      expect(firstRow('atlas', 4)).toBe(firstRow('borealis', 4))
    })
  })

  describe('trunk', () => {
    it('a stated trunk names waypoints: the trunk passes through every one, and stays derived around them', () => {
      const layout = layoutBranchMap(branchMapSample)
      const atlas = layout.groups.find((g) => g.id === G.small)!
      expect(atlas.trunk).toEqual(['a-s0', 'a-s1', 'a-s2', 'a-s3'])
      const onTrunk = layout.stations.filter((s) => s.group === G.small && s.onTrunk).map((s) => s.id)
      expect(onTrunk.sort()).toEqual(['a-s0', 'a-s1', 'a-s2', 'a-s3'])
      for (const s of layout.stations) expect(s.lane === 0).toBe(s.onTrunk)

      const stated: BranchMapData = {
        ...branchMapSample,
        groups: branchMapSample.groups.map((g) => (g.id === G.twentyLines ? { ...g, trunk: ['b-s4', 'b-s8'] } : g)),
      }
      const restated = layoutBranchMap(stated)
      const trunk = restated.groups.find((g) => g.id === G.twentyLines)!.trunk
      expect(trunk).toContain('b-s4') // both waypoints, in order
      expect(trunk).toContain('b-s8')
      expect(trunk.indexOf('b-s4')).toBeLessThan(trunk.indexOf('b-s8'))
      expect(trunk.length).toBeGreaterThan(2) // and the heaviest stops around them
      const ranks = new Map(restated.stations.map((s) => [s.id, s.rank]))
      for (let i = 1; i < trunk.length; i++) expect(ranks.get(trunk[i])!).toBeGreaterThanOrEqual(ranks.get(trunk[i - 1])!)
      expect(restated.issues).toEqual([])
      expectNoOverlaps(restated)
    })

    it('without one, takes the heaviest chain of stops', () => {
      const layout = layoutBranchMap(branchMapSample)
      expect(layout.groups.find((g) => g.id === G.twentyLines)!.trunk).toEqual(['b-s1', 'b-s2', 'b-s3'])
      expect(layout.groups.find((g) => g.id === G.seventeenLines)!.trunk).toEqual(['c-s1'])
      expect(layout.groups.find((g) => g.id === G.receiving)!.trunk).toEqual(['d-s1', 'd-s2'])
    })

    it('reports a stated trunk naming stations outside the group, and keeps the rest', () => {
      const data: BranchMapData = { ...branchMapSample, groups: branchMapSample.groups.map((g) => (g.id === G.small ? { ...g, trunk: ['a-s2', 'nope', 'b-s1', 'a-s3'] } : g)) }
      const layout = layoutBranchMap(data)
      expect(layout.issues.map((i) => i.kind)).toEqual(['invalid-trunk'])
      expect(layout.groups[0].trunk).toEqual(['a-s0', 'a-s1', 'a-s2', 'a-s3']) // dated stations join the trunk too
    })

    it('keeps the given order among stated stations of one rank, and reports only a real inversion', () => {
      const tie = (trunk: string[]): BranchMapData => ({
        groups: [{ id: 'g', label: 'G', trunk }],
        stations: [
          { id: 's-b', group: 'g', label: 'B', kind: 'stop', status: 'planned' },
          { id: 's-a', group: 'g', label: 'A', kind: 'stop', status: 'planned' },
          { id: 's-c', group: 'g', label: 'C', kind: 'stop', status: 'planned', after: ['s-a', 's-b'] },
        ],
        lines: [],
      })
      const tied = layoutBranchMap(tie(['s-b', 's-a', 's-c'])) // s-a and s-b share a rank
      expect(tied.issues).toEqual([])
      expect(tied.groups[0].trunk.slice(0, 2).sort()).toEqual(['s-a', 's-b']) // drawn in their band's row order
      expect(tied.groups[0].trunk[2]).toBe('s-c')
      const inverted = layoutBranchMap(tie(['s-c', 's-a', 's-b']))
      expect(inverted.issues.map((i) => i.kind)).toEqual(['invalid-trunk'])
      expect(inverted.groups[0].trunk).toEqual(['s-a', 's-b', 's-c'])
    })
  })

  describe('lane budget', () => {
    const lanesOf = (layout: BranchMapLayout, group: string) => layout.groups.find((g) => g.id === group)!.lanes

    it('fits the 20-line and 17-line groups in 8 lanes, bundling by destination, then "N more"', () => {
      const layout = layoutBranchMap(branchMapSample)
      for (const group of [G.twentyLines, G.seventeenLines]) {
        expect(lanesOf(layout, group)).toBeLessThanOrEqual(8)
        const drawn = layout.lines.filter((l) => l.group === group)
        expect(new Set(drawn.map((l) => l.lane)).size).toBeLessThanOrEqual(8)
        expect(Math.max(...drawn.map((l) => l.lane))).toBeLessThanOrEqual(8)
        // Every input line is drawn exactly once, alone or inside a bundle or "N more".
        const members = drawn.flatMap((l) => l.members).sort()
        expect(members).toEqual(branchMapSample.lines.filter((l) => l.group === group).map((l) => l.id).sort())
        const g = layout.groups.find((x) => x.id === group)!
        expect(g.counts.bundled).toBe(drawn.filter((l) => l.kind === 'bundle' || l.kind === 'more').reduce((a, l) => a + l.members.length, 0))
      }
      const borealis = layout.lines.filter((l) => l.group === G.twentyLines)
      expect(borealis.filter((l) => l.kind === 'bundle').map((l) => l.id).sort()).toEqual(
        [bundleIdOf('borealis', null, 'b-s1'), bundleIdOf('borealis', null, 'b-s2'), bundleIdOf('borealis', null, 'b-s3')].sort(),
      )
      const bundle = borealis.find((l) => l.id === bundleIdOf('borealis', null, 'b-s1'))!
      expect(bundle.members).toEqual(['b-l1', 'b-l2', 'b-l3', 'b-l4', 'b-l5'])
      expect(bundle.weight).toBe(1 + 2 + 3 + 1 + 2)
      expect(bundle.label).toBe('5 lines')
      // Cirrus has 15 destinations: bundling cannot get it under 8, so the lightest go to "N more".
      const more = layout.lines.find((l) => l.id === moreIdOf('cirrus'))!
      expect(more.kind).toBe('more')
      expect(more.label).toBe(`${more.members.length} more`)
      expect(more.stops.length).toBe(more.members.length)
      for (const id of more.stops) expect(layout.stations.find((s) => s.id === id)!.lane).toBe(more.lane)
    })

    it('draws every line of an expanded group, and of an expanded bundle', () => {
      const layout = layoutBranchMap(branchMapSample, { expanded: [G.twentyLines, G.seventeenLines] })
      for (const [group, n] of [[G.twentyLines, 20], [G.seventeenLines, 17]] as const) {
        const drawn = layout.lines.filter((l) => l.group === group && l.kind !== 'spur')
        expect(drawn).toHaveLength(n)
        expect(drawn.every((l) => l.kind === 'line' && l.members.length === 1 && l.line?.id === l.id)).toBe(true)
        expect(lanesOf(layout, group)).toBeGreaterThan(8)
        expect(layout.groups.find((g) => g.id === group)!.counts.bundled).toBe(0)
      }
      const one = layoutBranchMap(branchMapSample, { expanded: [bundleIdOf('borealis', null, 'b-s1')] })
      const kinds = one.lines.filter((l) => ['b-l1', 'b-l2', 'b-l3', 'b-l4', 'b-l5'].includes(l.id)).map((l) => l.kind)
      expect(kinds).toEqual(['line', 'line', 'line', 'line', 'line'])
    })

    it('draws what "N more" held when it is expanded, past the budget', () => {
      const held = layoutBranchMap(branchMapSample).lines.find((l) => l.id === moreIdOf('cirrus'))!.members
      expect(held.length).toBeGreaterThan(1)
      const layout = layoutBranchMap(branchMapSample, { expanded: [moreIdOf('cirrus')] })
      expect(layout.lines.find((l) => l.id === moreIdOf('cirrus'))).toBeUndefined()
      const drawn = layout.lines.filter((l) => l.group === 'cirrus' && l.kind !== 'spur').flatMap((l) => l.members)
      for (const id of held) expect(drawn).toContain(id)
      expect(lanesOf(layout, 'cirrus')).toBeGreaterThan(8)
      expectNoOverlaps(layout)
    })

    it('honours a smaller budget', () => {
      const layout = layoutBranchMap(branchMapSample, { maxLanes: 4 })
      for (const g of layout.groups) expect(g.lanes).toBeLessThanOrEqual(4)
    })

    it('puts stations no line leads to on one dotted spur per group, in rank order', () => {
      const layout = layoutBranchMap(branchMapSample)
      const spur = layout.lines.find((l) => l.id === 'spur:borealis')!
      expect(spur.kind).toBe('spur')
      expect(spur.style).toBe('dotted')
      expect(spur.stops).toEqual(['b-s9', 'b-s10'])
      for (const id of spur.stops) expect(layout.stations.find((s) => s.id === id)!.lane).toBe(spur.lane)
    })
  })

  describe('lanes', () => {
    it('reuses a lane once it is free and continues a line straight on from its station', () => {
      const { lane, count } = assignBranchLanes([
        { id: 'a', start: 0, end: 50, from: null, endsAt: 'x', joins: false },
        { id: 'b', start: 0, end: 30, from: null, endsAt: null, joins: true },
        { id: 'c', start: 50, end: 90, from: 'x', endsAt: null, joins: true },
        { id: 'd', start: 40, end: 80, from: null, endsAt: null, joins: true },
      ])
      expect(lane.get('b')).toBe(1) // the join goes innermost
      expect(lane.get('a')).toBe(2)
      expect(lane.get('d')).toBe(1) // b has ended
      expect(lane.get('c')).toBe(2) // straight on from x
      expect(count).toBe(2)
    })
  })

  describe('validation', () => {
    it('reports duplicates, dangling references and cycles without throwing', () => {
      const data: BranchMapData = {
        groups: [{ id: 'g', label: 'G' }],
        stations: [
          { id: 's1', group: 'g', label: 'One', kind: 'stop', status: 'planned', after: ['s2', 'ghost'] },
          { id: 's2', group: 'g', label: 'Two', kind: 'stop', status: 'planned', after: ['s1'] },
          { id: 's2', group: 'g', label: 'Again', kind: 'stop', status: 'planned' },
          { id: 's3', group: 'nowhere', label: 'Lost', kind: 'stop', status: 'planned' },
        ],
        lines: [
          { id: 'l1', group: 'g', label: 'To one', from: null, to: 's1', status: 'active' },
          { id: 'l2', group: 'g', label: 'To ghost', from: 'ghost', to: 'gone', status: 'active' },
          { id: 'l3', group: 'g', label: 'Loop', from: 's1', to: 's1', status: 'active' },
        ],
        links: [{ id: 'k1', kind: 'dependency', from: 's1', to: 'missing' }],
      }
      let layout: BranchMapLayout | undefined
      expect(() => (layout = layoutBranchMap(data))).not.toThrow()
      const kinds = layout!.issues.map((i) => i.kind)
      expect(kinds).toContain('duplicate-id')
      expect(kinds).toContain('dangling-reference')
      expect(kinds).toContain('cycle')
      expect(layout!.issues.find((i) => i.kind === 'cycle' && i.ids.includes('s2'))!.ids).toEqual(['s1', 's2'])
      expect(layout!.stations.map((s) => s.id).sort()).toEqual(['s1', 's2'])
      expect(layout!.links).toEqual([])
      expect(() => routeBranchMap(layout!)).not.toThrow()
      expectNoOverlaps(layout!)
    })

    it('lays out an empty map', () => {
      const layout = layoutBranchMap({ groups: [], stations: [], lines: [] })
      expect(layout.groups).toEqual([])
      expect(routeBranchMap(layout).trunks).toEqual([])
    })
  })
})

describe('routeBranchMap', () => {
  const scene = branchMapScene(branchMapSample)
  const station = new Map(scene.stations.map((s) => [s.id, s]))
  const groupOf = new Map(scene.groups.map((g) => [g.id, g]))

  it('reads only the placement: a JSON round-tripped layout routes the same', () => {
    for (const options of [{}, { width: 'weight' as const }, { expanded: [G.twentyLines] }]) {
      const layout = layoutBranchMap(branchMapSample, options)
      expect(routeBranchMap(JSON.parse(JSON.stringify(layout)))).toEqual(branchMapScene(branchMapSample, options))
    }
  })

  it('runs every line from its fork to its station along 45-degree, horizontal and vertical pieces', () => {
    for (const l of scene.lines) {
      const g = groupOf.get(l.group)!
      const first = l.points[0]
      const fork = l.from ? station.get(l.from)! : { x: g.trunkX, y: l.y1 }
      expect(first).toEqual({ x: fork.x, y: fork.y })
      const last = l.points[l.points.length - 1]
      if (l.end === 'join' || l.end === 'station') {
        const to = station.get(l.to!)!
        expect(last).toEqual({ x: to.x, y: to.y })
      }
      if (l.end === 'station') expect(station.get(l.to!)!.lane).toBe(l.lane)
      if (l.end === 'join') expect(station.get(l.to!)!.x).not.toBe(g.trunkX + l.lane * scene.options.laneGap)
      for (let i = 1; i < l.points.length; i++) {
        const dx = Math.abs(l.points[i].x - l.points[i - 1].x)
        const dy = Math.abs(l.points[i].y - l.points[i - 1].y)
        expect(dx === 0 || dy === 0 || Math.abs(dx - dy) < 1e-6, `${l.id} segment ${i}`).toBe(true)
        expect(l.points[i].y).toBeGreaterThanOrEqual(l.points[i - 1].y) // always downward
      }
      expect(l.path.startsWith('M')).toBe(true)
      if (l.points.length > 2) expect(l.path).toContain('Q') // rounded corners
      expect(l.run).not.toBeNull()
      expect(l.run!.x).toBe(g.trunkX + l.lane * scene.options.laneGap)
    }
    expect(scene.lines.find((l) => l.id === 'a-l5')!.end).toBe('dead')
    expect(scene.lines.find((l) => l.id === 'a-l2')!.end).toBe('join')
    expect(scene.lines.find((l) => l.id === 'a-l1')!.end).toBe('station')
  })

  it('draws one width for every line and one trunk segment with width off', () => {
    for (const l of scene.lines) expect(l.width).toBe(l.kind === 'spur' ? 1.5 : 2.5)
    for (const t of scene.trunks) {
      expect(t.segments).toHaveLength(1)
      expect(t.segments[0].width).toBe(4)
    }
  })

  it('with width by weight, a fork takes weight off the trunk, a join gives it back and a dead end never does', () => {
    const data: BranchMapData = {
      groups: [{ id: 'g', label: 'G', trunk: ['s1', 's2'] }],
      stations: [
        { id: 's1', group: 'g', label: 'One', kind: 'stop', status: 'planned' },
        { id: 's2', group: 'g', label: 'Two', kind: 'stop', status: 'planned', after: ['s1'] },
      ],
      lines: [
        { id: 'joins', group: 'g', label: 'Joins', from: null, to: 's1', status: 'active', weight: 4 },
        { id: 'dies', group: 'g', label: 'Dies', from: null, to: 's2', status: 'dropped', weight: 9 },
      ],
    }
    const s = branchMapScene(data, { width: 'weight' })
    const t = s.trunks[0]
    const first = t.segments[0]
    const last = t.segments[t.segments.length - 1]
    expect(first.weight).toBe(1 + 4 + 9)
    expect(last.weight).toBe(1 + 4) // the dropped line's 9 never comes back
    expect(Math.min(...t.segments.map((x) => x.weight))).toBe(1)
    expect(first.width).toBeGreaterThan(last.width)
    expect(s.lines.find((l) => l.id === 'dies')!.end).toBe('dead')
    expect(s.lines.find((l) => l.id === 'dies')!.width).toBeGreaterThan(s.lines.find((l) => l.id === 'joins')!.width)
  })

  it('routes dependency arrows down to the waiting station and provides arches to a group start', () => {
    const dep = scene.links.find((k) => k.id === 'k-dep-1')!
    const from = station.get('a-s3')!
    const to = station.get('d-s1')!
    expect(dep.points[0]).toEqual({ x: from.x, y: from.y + BRANCH_MAP_MARK.station })
    expect(dep.points[3].x).toBe(to.x)
    expect(dep.points[3].y).toBeLessThan(to.y)
    expect(dep.path.startsWith('M')).toBe(true)
    const arch = scene.links.find((k) => k.id === 'k-prov-1')!
    const start = groupOf.get('borealis')!.start
    expect(arch.points[3]).toEqual({ x: start.x, y: start.y - BRANCH_MAP_MARK.start })
    // Both control points lift above both ends: an arch over the top.
    expect(Math.max(arch.points[1].y, arch.points[2].y)).toBeLessThan(Math.min(arch.points[0].y, arch.points[3].y))
  })
})

describe('branch map stays headless', () => {
  it('touches no DOM in src/utils/branchMap', () => {
    const dir = join(__dirname, '..', 'branchMap')
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const code = readFileSync(join(dir, file), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      expect(code, file).not.toMatch(/\b(document|window|getComputedStyle|getBBox|getBoundingClientRect|HTMLElement|SVGElement)\b/)
      expect(code, file).not.toMatch(/from ['"]react/)
    }
  })
})
