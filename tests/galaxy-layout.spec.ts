import { test, expect } from '@playwright/test'
import { galaxyLayout, galaxySimulationStep, type GalaxyLayoutNode, type GalaxyLayoutEdge } from '../src/utils/galaxyLayout'
import { boundingCirclesByGroup } from '../src/utils/graphLayout'
import { buildStructuralForest, structuralDescendants, galaxyGroupHeads } from '../src/utils/graphHierarchy'

function node(id: string, extra: Partial<GalaxyLayoutNode> = {}): GalaxyLayoutNode {
  return { id, width: 100, height: 40, ...extra }
}

function structuralEdge(source: string, target: string): GalaxyLayoutEdge {
  return { source, target, structural: true }
}

// Every top-level group's boundary circle, keyed by group head id — same computation
// GraphCanvas's showClusterBoundaries rendering uses, reused here to verify Part 1 directly
// rather than just trusting the algorithm did the right thing.
function groupBoundaries(nodes: readonly GalaxyLayoutNode[], edges: readonly GalaxyLayoutEdge[], positions: Map<string, { x: number; y: number }>) {
  const { childrenOf, roots } = buildStructuralForest(nodes.map(n => n.id), edges)
  const groupHeads = galaxyGroupHeads(roots, childrenOf)
  const leafToGroup = new Map<string, string>()
  for (const headId of groupHeads) {
    leafToGroup.set(headId, headId)
    for (const descendantId of structuralDescendants(headId, childrenOf)) leafToGroup.set(descendantId, headId)
  }
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const radiusOf = (id: string) => {
    const n = nodeMap.get(id)
    return n ? Math.hypot(n.width, n.height) / 2 : 20
  }
  const layoutNodes = nodes.map(n => ({ id: n.id, width: n.width, height: n.height, x: 0, y: 0 }))
  return boundingCirclesByGroup(layoutNodes, positions, leafToGroup, radiusOf)
}

function worstGroupOverlap(boundaries: Map<string, { x: number; y: number; r: number }>): number {
  const circles = [...boundaries.values()]
  let worst = 0
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const a = circles[i], b = circles[j]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const overlap = a.r + b.r - dist
      if (overlap > worst) worst = overlap
    }
  }
  return worst
}

// Four independent roots, each fanning out into 6 children — root placement spaces the ROOTS
// themselves apart based only on their own (tiny) radius, with no awareness of how far each
// root's own children will fan out, so adjacent roots' subtrees reliably crowd into each other
// without Part 1's group-separation pass. This is the exact shape of bug the multi-root demo
// dataset (GALAXY_DEMO_NODES) hit in practice.
function busyMultiRootNodes(): { nodes: GalaxyLayoutNode[]; edges: GalaxyLayoutEdge[] } {
  const nodes: GalaxyLayoutNode[] = []
  const edges: GalaxyLayoutEdge[] = []
  for (let r = 0; r < 4; r++) {
    const rootId = `root${r}`
    nodes.push(node(rootId))
    for (let c = 0; c < 6; c++) {
      const childId = `root${r}_child${c}`
      nodes.push(node(childId))
      edges.push(structuralEdge(rootId, childId))
    }
  }
  return { nodes, edges }
}

test.describe('galaxyLayout', () => {
  test('positions every node', () => {
    const nodes = [node('a'), node('b'), node('c')]
    const edges = [structuralEdge('a', 'b'), structuralEdge('b', 'c')]

    const positions = galaxyLayout(nodes, edges)

    expect(positions.size).toBe(3)
    for (const n of nodes) {
      const p = positions.get(n.id)
      expect(p).toBeTruthy()
      expect(Number.isFinite(p!.x)).toBe(true)
      expect(Number.isFinite(p!.y)).toBe(true)
    }
  })

  test('respects pinned nodes — their position never changes', () => {
    const nodes: GalaxyLayoutNode[] = [
      node('pinned', { x: 500, y: 500, pinned: true }),
      node('free'),
    ]
    const edges = [structuralEdge('pinned', 'free')]

    const positions = galaxyLayout(nodes, edges)

    expect(positions.get('pinned')).toEqual({ x: 500, y: 500 })
  })

  test('pinning a non-leaf node repositions its children relative to the pin, not the original root-ring placement', () => {
    const nodes: GalaxyLayoutNode[] = [node('A', { pinned: true, x: 1000, y: 1000 }), node('B')]
    const edges = [structuralEdge('A', 'B')]

    const positions = galaxyLayout(nodes, edges)
    const posA = positions.get('A')!
    const posB = positions.get('B')!

    // A itself must be exactly where it was pinned.
    expect(posA).toEqual({ x: 1000, y: 1000 })

    // B must land near its expected orbital distance from A's ACTUAL (pinned) position — not
    // near the origin, which is where the pre-fix place() would have put it (computing A's own
    // children's home from the unpinned root-ring position instead of the pin).
    const distFromA = Math.hypot(posB.x - posA.x, posB.y - posA.y)
    const distFromOrigin = Math.hypot(posB.x, posB.y)
    expect(distFromA).toBeLessThan(400)
    expect(distFromOrigin).toBeGreaterThan(600)
  })

  test('separateGroups (default true) keeps top-level group boundary circles from overlapping each other', () => {
    const { nodes, edges } = busyMultiRootNodes()

    const withoutSeparation = galaxyLayout(nodes, edges, { separateGroups: false })
    const withSeparation = galaxyLayout(nodes, edges)

    // Sanity-check the fixture actually reproduces the bug being fixed — if this ever stops
    // being true (e.g. after an unrelated tuning change), the dataset needs to get busier rather
    // than the assertion below silently passing for the wrong reason.
    expect(worstGroupOverlap(groupBoundaries(nodes, edges, withoutSeparation))).toBeGreaterThan(0)

    expect(worstGroupOverlap(groupBoundaries(nodes, edges, withSeparation))).toBeLessThanOrEqual(0)
  })

  test('separateGroups: false reproduces the un-separated positions exactly', () => {
    const { nodes, edges } = busyMultiRootNodes()

    const a = galaxyLayout(nodes, edges, { separateGroups: false })
    const b = galaxyLayout(nodes, edges, { separateGroups: false })

    for (const n of nodes) {
      expect(a.get(n.id)).toEqual(b.get(n.id))
    }
  })

  test('a single-root tree has nothing to separate — separateGroups is a no-op', () => {
    const nodes = [node('root'), node('child1'), node('child2')]
    const edges = [structuralEdge('root', 'child1'), structuralEdge('root', 'child2')]

    const withSeparation = galaxyLayout(nodes, edges)
    const withoutSeparation = galaxyLayout(nodes, edges, { separateGroups: false })

    for (const n of nodes) {
      expect(withSeparation.get(n.id)).toEqual(withoutSeparation.get(n.id))
    }
  })
})

test.describe('galaxySimulationStep', () => {
  test('one step nudges toward home without fully arriving (unless already there)', () => {
    const nodes = [node('a'), node('b')]
    const edges = [structuralEdge('a', 'b')]

    // Seed far from home — a single step should move partway, not snap all the way there.
    const prev = new Map([
      ['a', { x: 2000, y: 2000 }],
      ['b', { x: 2000, y: 2000 }],
    ])
    const afterOneStep = galaxySimulationStep(nodes, edges, prev)
    const settled = galaxyLayout(nodes, edges)

    const distAfterOneStep = Math.hypot(
      afterOneStep.get('a')!.x - settled.get('a')!.x,
      afterOneStep.get('a')!.y - settled.get('a')!.y
    )
    const distBefore = Math.hypot(2000 - settled.get('a')!.x, 2000 - settled.get('a')!.y)
    expect(distAfterOneStep).toBeGreaterThan(0)
    expect(distAfterOneStep).toBeLessThan(distBefore)
  })

  test('repeated calls converge toward the same result galaxyLayout produces', () => {
    const nodes = [node('a'), node('b'), node('c')]
    const edges = [structuralEdge('a', 'b'), structuralEdge('b', 'c')]

    let pos: Map<string, { x: number; y: number }> | undefined
    for (let i = 0; i < 60; i++) pos = galaxySimulationStep(nodes, edges, pos)
    const settled = galaxyLayout(nodes, edges, { settleCycles: 60 })

    for (const n of nodes) {
      const stepped = pos!.get(n.id)!
      const oneShot = settled.get(n.id)!
      expect(Math.hypot(stepped.x - oneShot.x, stepped.y - oneShot.y)).toBeLessThan(1)
    }
  })
})
