import { describe, expect, it } from 'vitest'
import {
  galaxyBodyRadii,
  galaxyEffectiveWeights,
  galaxyLastSeparationWork,
  galaxyLayout,
  galaxySimulationSettling,
  galaxySimulationStep,
  GALAXY_LIVE_SEPARATION_BUDGET,
  GALAXY_UNWEIGHTED_MIN_RADIUS,
  type GalaxyLayoutEdge,
  type GalaxyLayoutNode,
} from '../galaxyLayout'
import { FINAL_CLEANUP_MAX_PASSES, SeparationJob, separateUntilClear, separationPass, type LayoutNode } from '../graphLayout'
import flare from './fixtures/flare.json'

type Point = { x: number; y: number }

/** Deterministic PRNG (mulberry32), so the random box sets are the same on every run. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function plainLoop(nodes: readonly LayoutNode[], pos: Map<string, Point>, maxPasses: number): number {
  let pass = 0
  while (pass < maxPasses) {
    pass++
    if (!separationPass(nodes, pos)) break
  }
  return pass
}

/** Same values, compared with Object.is so -0/+0 and NaN count too. */
function expectBitIdentical(a: Map<string, Point>, b: Map<string, Point>): void {
  expect(a.size).toBe(b.size)
  for (const [id, p] of a) {
    const q = b.get(id)!
    expect(Object.is(p.x, q.x) && Object.is(p.y, q.y), `${id}: ${p.x},${p.y} vs ${q.x},${q.y}`).toBe(true)
  }
}

/** Galaxy nodes sized the way GraphCanvas sizes round galaxy bodies. */
function graph(ids: string[], pairs: [string, string][], weights?: Map<string, number>): { nodes: GalaxyLayoutNode[]; edges: GalaxyLayoutEdge[]; childrenOf: Map<string, string[]> } {
  const childrenOf = new Map<string, string[]>()
  for (const [s, t] of pairs) {
    if (!childrenOf.has(s)) childrenOf.set(s, [])
    childrenOf.get(s)!.push(t)
  }
  const weightOf = galaxyEffectiveWeights(ids, childrenOf, id => weights?.get(id))
  const radii = galaxyBodyRadii(weightOf, weights?.size ? {} : { minRadius: GALAXY_UNWEIGHTED_MIN_RADIUS })
  const nodes = ids.map(id => ({ id, width: 2 * radii.get(id)!, height: 2 * radii.get(id)!, radius: radii.get(id)!, weight: weightOf.get(id) }))
  return { nodes, edges: pairs.map(([source, target]) => ({ source, target, structural: true })), childrenOf }
}

function flareGraph() {
  const nodes = flare.nodes as [string, number][]
  return graph(nodes.map(n => n[0]), flare.edges as [string, string][], new Map(nodes))
}

function descendants(id: string, childrenOf: Map<string, string[]>): string[] {
  const out: string[] = []
  const stack = [...(childrenOf.get(id) ?? [])]
  while (stack.length) {
    const k = stack.pop()!
    out.push(k)
    stack.push(...(childrenOf.get(k) ?? []))
  }
  return out
}

/** Bodies (circles) overlapping by more than half a pixel. */
function bodyOverlaps(nodes: readonly GalaxyLayoutNode[], pos: Map<string, Point>): string[] {
  const out: string[] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const p = pos.get(nodes[i].id)!
      const q = pos.get(nodes[j].id)!
      if (Math.hypot(p.x - q.x, p.y - q.y) < nodes[i].radius! + nodes[j].radius! - 0.5) out.push(`${nodes[i].id} / ${nodes[j].id}`)
    }
  }
  return out
}

/** Live-drags `id` by `delta` over `frames` ticks (one pin move per tick), the way GraphCanvas
 *  feeds galaxySimulationStep, then holds the pin until the simulation settles. */
function liveDrag(
  nodes: GalaxyLayoutNode[],
  edges: GalaxyLayoutEdge[],
  id: string,
  delta: Point,
  frames: number
): { pos: Map<string, Point>; pin: Point; dragFrameChecks: number[]; settleTicks: number; settleChecks: number[] } {
  let pos = galaxySimulationStep(nodes, edges, galaxyLayout(nodes, edges))
  const start = pos.get(id)!
  const pinnedAt = (at: Point) => nodes.map(n => (n.id === id ? { ...n, x: at.x, y: at.y, pinned: true } : n))
  const dragFrameChecks: number[] = []
  let pin = start
  for (let f = 1; f <= frames; f++) {
    pin = { x: start.x + (delta.x * f) / frames, y: start.y + (delta.y * f) / frames }
    pos = galaxySimulationStep(pinnedAt(pin), edges, pos)
    dragFrameChecks.push(galaxyLastSeparationWork().pairChecks)
  }
  const held = pinnedAt(pin)
  const settleChecks: number[] = []
  let settleTicks = 0
  for (; settleTicks < 2000; settleTicks++) {
    const next = galaxySimulationStep(held, edges, pos)
    settleChecks.push(galaxyLastSeparationWork().pairChecks)
    const moved = Math.max(...[...next].map(([k, p]) => Math.hypot(p.x - pos.get(k)!.x, p.y - pos.get(k)!.y)))
    pos = next
    if (moved < 1e-3 && !galaxySimulationSettling()) break
  }
  return { pos, pin, dragFrameChecks, settleTicks, settleChecks }
}

describe('SeparationJob', () => {
  // Card-sized and mixed boxes, packed densely enough that many overlap and keep pushing each
  // other around for the whole pass budget, with a few pinned.
  const scenarios = [
    { label: 'dense cards', n: 120, spread: 400, w: () => 138, h: () => 30, pinned: 0.05 },
    { label: 'mixed sizes', n: 200, spread: 700, w: (r: () => number) => 10 + r() * 120, h: (r: () => number) => 10 + r() * 120, pinned: 0.1 },
    { label: 'sparse', n: 150, spread: 3000, w: () => 40, h: () => 40, pinned: 0 },
    { label: 'all on one point', n: 30, spread: 0, w: () => 20, h: () => 20, pinned: 0.2 },
  ]
  for (const s of scenarios) {
    it(`matches the plain separationPass loop bit for bit: ${s.label}`, () => {
      const r = rng(s.n)
      const nodes: LayoutNode[] = Array.from({ length: s.n }, (_, i) => ({ id: `n${i}`, x: 0, y: 0, width: s.w(r), height: s.h(r), pinned: r() < s.pinned }))
      const start = new Map(nodes.map(n => [n.id, { x: (r() - 0.5) * s.spread, y: (r() - 0.5) * s.spread }]))

      const expected = new Map(start)
      const plainPasses = plainLoop(nodes, expected, FINAL_CLEANUP_MAX_PASSES)

      const fast = new Map(start)
      const stats = separateUntilClear(nodes, fast, FINAL_CLEANUP_MAX_PASSES)
      expectBitIdentical(fast, expected)
      expect(stats.passes).toBeLessThanOrEqual(plainPasses)

      // Resumed in small slices: the same end state.
      const sliced = new Map(start)
      const job = new SeparationJob(nodes, sliced, FINAL_CLEANUP_MAX_PASSES)
      let calls = 0
      while (!job.run(500)) calls++
      expectBitIdentical(sliced, expected)
      if (stats.pairChecks > 1000) expect(calls).toBeGreaterThan(0)
    })
  }

  it('falls back to separationPass for positions the grid cannot hold', () => {
    const nodes: LayoutNode[] = [0, 1, 2].map(i => ({ id: `n${i}`, x: 0, y: 0, width: 50, height: 50 }))
    const start = new Map([['n0', { x: 0, y: 0 }], ['n1', { x: 10, y: 0 }], ['n2', { x: Number.NaN, y: 0 }]])
    const expected = new Map(start)
    plainLoop(nodes, expected, 20)
    const fast = new Map(start)
    separateUntilClear(nodes, fast, 20)
    expectBitIdentical(fast, expected)
  })
})

describe('galaxy live drag (#287)', () => {
  it('a flare drag frame resolves overlaps with grid-local work, not all pairs every pass', () => {
    const { nodes, edges, childrenOf } = flareGraph()
    const satellite = [...childrenOf.get('flare')!].sort((a, b) => nodes.find(n => n.id === b)!.weight! - nodes.find(n => n.id === a)!.weight!)[0]
    const { dragFrameChecks } = liveDrag(nodes, edges, satellite, { x: 150, y: 0 }, 3)
    // The plain loop hit its 400-pass cap on every frame: 400 x 252 x 251 / 2 = 12.6 M pair checks.
    // The grid-based job tests ~17k pairs, all within one frame's budget.
    for (const checks of dragFrameChecks) {
      expect(checks).toBeGreaterThan(0)
      expect(checks).toBeLessThan(Math.min(GALAXY_LIVE_SEPARATION_BUDGET, 40_000))
    }
  })

  it('settles with no overlapping bodies, the dropped node exactly on its pin, its subtree carried along', () => {
    const { nodes, edges, childrenOf } = flareGraph()
    const satellite = [...childrenOf.get('flare')!].sort((a, b) => nodes.find(n => n.id === b)!.weight! - nodes.find(n => n.id === a)!.weight!)[0]
    const before = galaxyLayout(nodes, edges)
    const delta = { x: -150, y: 40 }
    const { pos, pin } = liveDrag(nodes, edges, satellite, delta, 3)

    expect(Object.is(pos.get(satellite)!.x, pin.x) && Object.is(pos.get(satellite)!.y, pin.y)).toBe(true)
    expect(bodyOverlaps(nodes, pos)).toEqual([])

    // The subtree moved with its parent: on average by the drag itself, give or take the overlap
    // resolution's nudges.
    const subtree = descendants(satellite, childrenOf)
    expect(subtree.length).toBeGreaterThan(20)
    const mean = subtree.reduce((acc, id) => ({ x: acc.x + (pos.get(id)!.x - before.get(id)!.x) / subtree.length, y: acc.y + (pos.get(id)!.y - before.get(id)!.y) / subtree.length }), { x: 0, y: 0 })
    expect(Math.hypot(mean.x - delta.x, mean.y - delta.y)).toBeLessThan(15)
  })

  it('the settled live target is exactly galaxyLayout for the same pins, however the work was split', () => {
    const { nodes, edges, childrenOf } = flareGraph()
    const satellite = [...childrenOf.get('flare')!][1]
    const { pos, pin } = liveDrag(nodes, edges, satellite, { x: 90, y: 120 }, 3)
    const pinned = nodes.map(n => (n.id === satellite ? { ...n, x: pin.x, y: pin.y, pinned: true } : n))
    // Same edges array: galaxyLayout returns the live simulation's cached, finished target.
    const live = galaxyLayout(pinned, edges)
    // A fresh edges array misses every cache, so this one is computed from scratch in one go.
    const fresh = galaxyLayout(pinned, edges.map(e => ({ ...e })))
    expectBitIdentical(live, fresh)
    for (const n of nodes) expect(Math.hypot(pos.get(n.id)!.x - fresh.get(n.id)!.x, pos.get(n.id)!.y - fresh.get(n.id)!.y)).toBeLessThan(0.01)
  })

  it('caps a drag frame on a large graph and finishes the separation over the following ticks', () => {
    // 1 hub, 1200 weighted satellites in rings: their bounding boxes overlap at the diagonals, so
    // the box separation keeps working for its whole pass budget (the worst case found).
    const ids = ['hub', ...Array.from({ length: 1200 }, (_, i) => `s${i}`)]
    const weights = new Map(ids.slice(1).map((id, i) => [id, 1 + ((i * 37) % 1000)]))
    const { nodes, edges } = graph(ids, ids.slice(1).map(id => ['hub', id] as [string, string]), weights)
    const { pos, pin, dragFrameChecks, settleChecks } = liveDrag(nodes, edges, 's962', { x: -150, y: 0 }, 3)

    // A tick stops after the pass that reaches the budget; one pass here is a few thousand checks.
    const cap = GALAXY_LIVE_SEPARATION_BUDGET + 20_000
    for (const checks of [...dragFrameChecks, ...settleChecks]) expect(checks).toBeLessThanOrEqual(cap)
    expect(settleChecks.filter(c => c > 0).length).toBeGreaterThan(1)
    expect(pos.get('s962')).toEqual(pin)
    expect(bodyOverlaps(nodes, pos)).toEqual([])
  })

  it('reports settling only for the tick that left separation unfinished', () => {
    const ids = ['hub', ...Array.from({ length: 1200 }, (_, i) => `s${i}`)]
    const weights = new Map(ids.slice(1).map((id, i) => [id, 1 + ((i * 37) % 1000)]))
    const { nodes, edges } = graph(ids, ids.slice(1).map(id => ['hub', id] as [string, string]), weights)
    const start = galaxyLayout(nodes, edges)
    const at = start.get('s5')!
    galaxySimulationStep(nodes.map(n => (n.id === 's5' ? { ...n, x: at.x + 80, y: at.y, pinned: true } : n)), edges, start)
    expect(galaxySimulationSettling()).toBe(true)
    // The pin is gone (e.g. drag state reset) before that separation finished: nothing is pending
    // for this tick's target, so the loop may go idle.
    galaxySimulationStep(nodes, edges, start)
    expect(galaxySimulationSettling()).toBe(false)
  })
})
