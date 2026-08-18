import { test, expect } from '@playwright/test'
import { galaxyLayout, galaxySimulationStep, resolveAspectRatioScale, type GalaxyLayoutNode, type GalaxyLayoutEdge } from '../src/utils/galaxyLayout'
import { boundingCirclesByGroup } from '../src/utils/graphLayout'
import { buildStructuralForest, galaxyGroupMap, galaxyGroupHeads } from '../src/utils/graphHierarchy'

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
  const { leafToGroup } = galaxyGroupMap(roots, childrenOf)
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

// Eight independent roots, each fanning out into 6 children, sharing one ring — root-ring
// seeding accounts for each root's own subtree reach (see galaxyLayout.ts's subtreeReach), but
// only radially: it doesn't widen a root's own angular slice to match how far its subtree fans
// out sideways, so packing enough same-shaped roots onto one ring still reliably crowds adjacent
// roots' subtrees into each other without Part 1's group-separation pass. This is the exact shape
// of bug the multi-root demo dataset (GALAXY_DEMO_NODES) hit in practice.
function busyMultiRootNodes(): { nodes: GalaxyLayoutNode[]; edges: GalaxyLayoutEdge[] } {
  const nodes: GalaxyLayoutNode[] = []
  const edges: GalaxyLayoutEdge[] = []
  for (let r = 0; r < 8; r++) {
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

  test('galaxyLayout (the batch entry point) respects a pinned node even when separateGroups has real work to do', () => {
    // Needs >1 groups — shiftGroupsApart short-circuits entirely at groupHeads.length <= 1 (see
    // its own guard), so a single-root fixture like the test above can't catch a missing
    // pinnedGroups carve-out: applyGroupSeparation (galaxyLayout's final settle pass) used to call
    // shiftGroupsApart without one at all, unlike galaxySimulationStep's per-tick reactive
    // push-away, which passes pinnedGroups correctly — so the *one-shot batch* galaxyLayout() call
    // rigidly translated every group, pinned members included, silently ignoring the pin.
    // 'pinned' has exactly one child, so it stays its own group head (no dependency on the
    // separate multi-child-delegation fix above) — isolates this test to just the pinnedGroups
    // carve-out this test is actually guarding.
    const nodes: GalaxyLayoutNode[] = [
      node('pinned', { x: 500, y: 500, pinned: true }), node('p1'),
      node('other'), node('o1'), node('o2'), node('o3'),
    ]
    const edges: GalaxyLayoutEdge[] = [
      structuralEdge('pinned', 'p1'),
      structuralEdge('other', 'o1'), structuralEdge('other', 'o2'), structuralEdge('other', 'o3'),
    ]

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

  // Regression: root-ring seeding sized a root's distance from the shared hub off only its own
  // (tiny) radius — a lone orphan and the root of a deep, many-node chain started at essentially
  // the same distance, since nothing about the ring seed accounted for how far the root's own
  // subtree would go on to spread. In practice this read as the root of a large subtree (e.g. the
  // GALAXY_DEMO_NODES dataset's "organism", parent of an entire 9-node biology tree) landing
  // right in the shared hub's crowded middle — visually disconnected from its own descendants,
  // which fan out far beyond it, and prone to sitting inside an unrelated neighboring root's
  // territory since nothing pushed it clear of that shared center to begin with.
  test('a root with a deep subtree seeds much farther from the shared hub than a childless root', () => {
    const nodes: GalaxyLayoutNode[] = [node('lonelyRoot')]
    const edges: GalaxyLayoutEdge[] = []
    // A 4-level chain under its own root — same shape as organism -> eukaryote -> cell -> nucleus.
    const chain = ['deepRoot', 'a', 'b', 'c', 'd']
    for (const id of chain) nodes.push(node(id))
    for (let i = 0; i < chain.length - 1; i++) edges.push(structuralEdge(chain[i], chain[i + 1]))

    const positions = galaxyLayout(nodes, edges)
    const lonelyDist = Math.hypot(positions.get('lonelyRoot')!.x, positions.get('lonelyRoot')!.y)
    const deepDist = Math.hypot(positions.get('deepRoot')!.x, positions.get('deepRoot')!.y)

    expect(deepDist).toBeGreaterThan(lonelyDist * 3)
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

  test('a root with exactly one child stays in that child\'s group — delegating headship to a single child would orphan the root from every group', () => {
    // galaxyGroupHeads() itself first: a root with >1 children delegates headship to each of
    // them, but one with 0 or exactly 1 child does not — the single-child case has to be treated
    // like the childless one, not like the multi-child one (see galaxyGroupHeads' own docs).
    const oneChild = buildStructuralForest(['root', 'child'], [structuralEdge('root', 'child')])
    expect(galaxyGroupHeads(oneChild.roots, oneChild.childrenOf)).toEqual(['root'])

    const twoChildren = buildStructuralForest(['root', 'a', 'b'], [structuralEdge('root', 'a'), structuralEdge('root', 'b')])
    expect(galaxyGroupHeads(twoChildren.roots, twoChildren.childrenOf).sort()).toEqual(['a', 'b'])

    const noChildren = buildStructuralForest(['root'], [])
    expect(galaxyGroupHeads(noChildren.roots, noChildren.childrenOf)).toEqual(['root'])

    // Then the actual regression this guards: two independent single-child chains, busy enough
    // that separateGroups has real work to do. Before the fix, delegating root1's headship to its
    // only child excluded root1 from every group's leafToGroup entry entirely (it's nobody's
    // descendant, and no longer its own group's head either) — the group-level rigid shift then
    // moved child1's whole subtree to resolve overlap with the other group, while root1 itself,
    // belonging to no group, never moved — visibly severing a direct structural edge that should
    // stay a normal, short orbital hop.
    const nodes: GalaxyLayoutNode[] = [
      node('root1'), node('child1'), node('a1'), node('a2'), node('a3'),
      node('root2'), node('child2'), node('b1'), node('b2'), node('b3'),
    ]
    const edges: GalaxyLayoutEdge[] = [
      structuralEdge('root1', 'child1'),
      structuralEdge('child1', 'a1'), structuralEdge('child1', 'a2'), structuralEdge('child1', 'a3'),
      structuralEdge('root2', 'child2'),
      structuralEdge('child2', 'b1'), structuralEdge('child2', 'b2'), structuralEdge('child2', 'b3'),
    ]

    const positions = galaxyLayout(nodes, edges)
    const root1 = positions.get('root1')!
    const child1 = positions.get('child1')!
    const dist = Math.hypot(child1.x - root1.x, child1.y - root1.y)

    // Expected orbital distance is just root1's own radius + child1's radius * nodeSpread — the
    // same formula every parent/child pair in this layout uses. The orphaning bug blew this out
    // by well over an order of magnitude, not just some jitter.
    const r = Math.hypot(nodes[0].width, nodes[0].height) / 2
    const expectedDistance = r + r * 3.2 // default nodeSpread
    expect(dist).toBeLessThan(expectedDistance * 1.5)
  })

  test('a root with more than one child (a genuinely delegating root) still travels with its own subtree', () => {
    // galaxyGroupMap() itself: a delegating multi-child root is excluded from groupHeads (that's
    // the whole point — it splits into one group per branch), but it must still land in
    // leafToGroup somewhere, or it's the one node no group's rigid translation ever carries along.
    const twoChildren = buildStructuralForest(['root', 'a', 'b'], [structuralEdge('root', 'a'), structuralEdge('root', 'b')])
    const { leafToGroup } = galaxyGroupMap(twoChildren.roots, twoChildren.childrenOf)
    expect(leafToGroup.get('root')).toBe('a') // first child wins, same tie-break buildStructuralForest itself uses
    expect(leafToGroup.get('a')).toBe('a')
    expect(leafToGroup.get('b')).toBe('b')

    // The actual regression: two independent two-child roots, each branch busy enough that
    // separateGroups has real work to do. Before the fix, a multi-child root was excluded from
    // every group's leafToGroup entry (it delegates headship away, but is nobody's structural
    // descendant either) — group-level rigid shifts then moved every child subtree while the root
    // itself, belonging to no group, stayed frozen at its original computeHome position, ending up
    // stranded arbitrarily far from all of its own children.
    const nodes: GalaxyLayoutNode[] = [
      node('root1'), node('a1'), node('a1_1'), node('a1_2'), node('a1_3'), node('b1'), node('b1_1'), node('b1_2'), node('b1_3'),
      node('root2'), node('a2'), node('a2_1'), node('a2_2'), node('a2_3'), node('b2'), node('b2_1'), node('b2_2'), node('b2_3'),
    ]
    const edges: GalaxyLayoutEdge[] = [
      structuralEdge('root1', 'a1'), structuralEdge('root1', 'b1'),
      structuralEdge('a1', 'a1_1'), structuralEdge('a1', 'a1_2'), structuralEdge('a1', 'a1_3'),
      structuralEdge('b1', 'b1_1'), structuralEdge('b1', 'b1_2'), structuralEdge('b1', 'b1_3'),
      structuralEdge('root2', 'a2'), structuralEdge('root2', 'b2'),
      structuralEdge('a2', 'a2_1'), structuralEdge('a2', 'a2_2'), structuralEdge('a2', 'a2_3'),
      structuralEdge('b2', 'b2_1'), structuralEdge('b2', 'b2_2'), structuralEdge('b2', 'b2_3'),
    ]

    const positions = galaxyLayout(nodes, edges)
    const root1 = positions.get('root1')!
    const a1 = positions.get('a1')!
    const dist = Math.hypot(a1.x - root1.x, a1.y - root1.y)

    // root1's first child is 'a1' — same tie-break as above. Expected orbital distance is just
    // root1's own radius + a1's radius * nodeSpread; the orphaning bug blew this out by well over
    // an order of magnitude (the root stays put while its whole subtree, a1 included, moves to
    // resolve overlap with the other root's group).
    const r = Math.hypot(nodes[0].width, nodes[0].height) / 2
    const expectedDistance = r + r * 3.2 // default nodeSpread
    expect(dist).toBeLessThan(expectedDistance * 1.5)
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

  // Regression: galaxySimulationStep's home computation didn't account for group separation at
  // all — only galaxyLayout's own one-shot final pass applied it, as a single rigid shift on top
  // of already-settled positions. Live mode (GraphCanvas's opt-in continuous simulation) drives
  // this function every animation frame, and every tick's homeStrength nudge pulls each unpinned
  // node back toward its raw, un-separated home — so group separation eroded within a handful of
  // frames of live mode simply running with no user interaction at all, even though the one-shot
  // layout it started from was correctly separated a moment earlier.
  test('running many ticks with no user interaction does not erode group separation over time', () => {
    const { nodes, edges } = busyMultiRootNodes()

    // Seed from the correctly-separated one-shot layout — the exact "live mode just turned on"
    // scenario (GraphCanvas seeds useGalaxySimulation from its last static galaxyLayout() result).
    let pos: Map<string, { x: number; y: number }> | undefined = galaxyLayout(nodes, edges)
    expect(worstGroupOverlap(groupBoundaries(nodes, edges, pos))).toBeLessThanOrEqual(0)

    // Many ticks' worth of an idle live session — nothing pinned, nothing dragging.
    for (let i = 0; i < 120; i++) pos = galaxySimulationStep(nodes, edges, pos)

    expect(worstGroupOverlap(groupBoundaries(nodes, edges, pos!))).toBeLessThanOrEqual(0)
  })

  test('separateGroups: false opts the per-tick home out of group separation too', () => {
    const { nodes, edges } = busyMultiRootNodes()

    let pos: Map<string, { x: number; y: number }> | undefined
    for (let i = 0; i < 60; i++) pos = galaxySimulationStep(nodes, edges, pos, { separateGroups: false })

    // Reproduces galaxyLayout's own un-separated result closely (busyMultiRootNodes' 4 roots x 6
    // children need a bit more settling than the simpler 3-node chain the sibling convergence
    // test above uses, hence the looser tolerance) — proving the option genuinely reaches the
    // per-tick home computation, not just galaxyLayout's separate final-pass call.
    const unseparated = galaxyLayout(nodes, edges, { separateGroups: false, settleCycles: 60 })
    for (const n of nodes) {
      const stepped = pos!.get(n.id)!
      const oneShot = unseparated.get(n.id)!
      expect(Math.hypot(stepped.x - oneShot.x, stepped.y - oneShot.y)).toBeLessThan(5)
    }
  })

  // Regression: home-level separation (the fix above) keeps the algorithmic TARGET layout
  // non-overlapping, but says nothing about a group's real, currently-dragged footprint growing
  // into a neighbor's real territory — before this fix, dragging a "sun" close enough to another
  // group left the OTHER group's nodes sitting exactly where they were while the dragged group's
  // honestly-reaching boundary circle simply ballooned out to enclose them, reading as "I dragged
  // a node into another group" even though membership never changed. The correct reaction is
  // collision avoidance, same as individual nodes already get: the other group's real nodes move
  // out of the way.
  test('dragging one group into another\'s territory pushes the other group away, not just its boundary circle', () => {
    const nodes: GalaxyLayoutNode[] = [
      // rootA/rootB each need a SECOND child (dummyA/dummyB) so galaxyGroupHeads actually
      // delegates their headship down to sunA/sunB — a root with only one child (just sunA/sunB
      // alone) now stays its own group head instead (see galaxyGroupHeads' own docs), which would
      // make rootA/rootB the group anchor instead of sunA/sunB and defeat the point of this
      // fixture. dummyA/dummyB otherwise play no role in the assertions below.
      node('rootA'), node('dummyA'), node('sunA'), node('a1'), node('a2'), node('a3'),
      node('rootB'), node('dummyB'), node('sunB'), node('b1'), node('b2'), node('b3'),
    ]
    const edges: GalaxyLayoutEdge[] = [
      structuralEdge('rootA', 'dummyA'), structuralEdge('rootA', 'sunA'),
      structuralEdge('sunA', 'a1'), structuralEdge('sunA', 'a2'), structuralEdge('sunA', 'a3'),
      structuralEdge('rootB', 'dummyB'), structuralEdge('rootB', 'sunB'),
      structuralEdge('sunB', 'b1'), structuralEdge('sunB', 'b2'), structuralEdge('sunB', 'b3'),
    ]

    const settled = galaxyLayout(nodes, edges)
    const sunB = settled.get('sunB')!
    const bBefore = ['b1', 'b2', 'b3'].map(id => settled.get(id)!)

    // Live-drag sunA (with its own subtree cascading along, per place()'s pin-cascade) right on
    // top of sunB's group.
    const draggedNodes = nodes.map(n => (n.id === 'sunA' ? { ...n, pinned: true, x: sunB.x, y: sunB.y } : n))
    let pos: Map<string, { x: number; y: number }> | undefined = new Map(settled)
    for (let i = 0; i < 60; i++) pos = galaxySimulationStep(draggedNodes, edges, pos)

    const boundaries = groupBoundaries(draggedNodes, edges, pos!)
    expect(worstGroupOverlap(boundaries)).toBeLessThanOrEqual(0)

    // sunB's group was never touched directly — the only way its members end up somewhere new is
    // if the reactive push-away actually moved them.
    const bAfter = ['b1', 'b2', 'b3'].map(id => pos!.get(id)!)
    for (let i = 0; i < 3; i++) {
      expect(Math.hypot(bAfter[i].x - bBefore[i].x, bAfter[i].y - bBefore[i].y)).toBeGreaterThan(10)
    }
  })
})

// width/height of the smallest axis-aligned box enclosing every position — used to check the
// elliptical warp actually reshapes the aggregate layout, not just individual offsets.
function boundingBoxSize(positions: Map<string, { x: number; y: number }>): { width: number; height: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of positions.values()) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
  }
  return { width: maxX - minX, height: maxY - minY }
}

test.describe('aspectRatio (elliptical warp)', () => {
  // A moderately branchy tree so the aggregate bounding box is meaningfully sized in both
  // dimensions — a single straight chain would make a width/height ratio comparison degenerate.
  function branchyTree(): { nodes: GalaxyLayoutNode[]; edges: GalaxyLayoutEdge[] } {
    const nodes: GalaxyLayoutNode[] = [node('root')]
    const edges: GalaxyLayoutEdge[] = []
    for (let b = 0; b < 5; b++) {
      const branchId = `branch${b}`
      nodes.push(node(branchId))
      edges.push(structuralEdge('root', branchId))
      for (let c = 0; c < 4; c++) {
        const childId = `branch${b}_child${c}`
        nodes.push(node(childId))
        edges.push(structuralEdge(branchId, childId))
      }
    }
    return { nodes, edges }
  }

  test('omitted and 1 produce identical positions — backward compatible with the un-warped layout', () => {
    const { nodes, edges } = branchyTree()

    const omitted = galaxyLayout(nodes, edges)
    const explicitOne = galaxyLayout(nodes, edges, { aspectRatio: 1 })

    for (const n of nodes) {
      expect(explicitOne.get(n.id)).toEqual(omitted.get(n.id))
    }
  })

  test('a wide aspectRatio produces a measurably wider-than-tall bounding box', () => {
    const { nodes, edges } = branchyTree()

    const circular = boundingBoxSize(galaxyLayout(nodes, edges))
    const wide = boundingBoxSize(galaxyLayout(nodes, edges, { aspectRatio: 4 }))

    // Circular layout's own width/height ratio (whatever it naturally is) should shift measurably
    // toward wide once aspectRatio biases it, not just wobble from unrelated settle-cycle noise —
    // the AREA_GROWTH_CAP search (see GalaxyLayoutOptions.aspectRatio's own docs) deliberately
    // stops short of the full theoretical scaleX/scaleY shift, so this only asserts a clear,
    // meaningful move in the right direction, not the full magnitude.
    expect(wide.width / wide.height).toBeGreaterThan((circular.width / circular.height) * 1.3)
  })

  test('the ratio is clamped to [1/8, 8] — extreme values beyond the clamp are indistinguishable from the boundary', () => {
    const { nodes, edges } = branchyTree()

    const atCeiling = galaxyLayout(nodes, edges, { aspectRatio: 8 })
    const wayAboveCeiling = galaxyLayout(nodes, edges, { aspectRatio: 100 })
    for (const n of nodes) {
      expect(wayAboveCeiling.get(n.id)).toEqual(atCeiling.get(n.id))
    }

    const atFloor = galaxyLayout(nodes, edges, { aspectRatio: 1 / 8 })
    const wayBelowFloor = galaxyLayout(nodes, edges, { aspectRatio: 0.001 })
    for (const n of nodes) {
      expect(wayBelowFloor.get(n.id)).toEqual(atFloor.get(n.id))
    }
  })

  test('a NaN aspectRatio (e.g. from an unmeasured 0/0 container) is treated as omitted, not propagated', () => {
    const { nodes, edges } = branchyTree()

    const nat = galaxyLayout(nodes, edges)
    const nan = galaxyLayout(nodes, edges, { aspectRatio: NaN })
    for (const n of nodes) {
      expect(nan.get(n.id)).toEqual(nat.get(n.id))
    }

    const scale = resolveAspectRatioScale(nodes, edges, { aspectRatio: NaN })
    expect(scale).toEqual({ x: 1, y: 1 })
  })

  test('formula: warped x-offset equals the natural x-offset scaled by resolveAspectRatioScale\'s own result', () => {
    // startAngle: 0 isolates cos(0)=1, sin(0)=0 for the root-ring seed itself (a single root, so
    // its own placement IS the root-ring seed with i=0, n=1 -> angle = startAngle exactly), which
    // in turn keeps the single child's own angle at 0 too (n=1 kids, no parity offset at depth 0).
    // So this whole fixture only ever moves along x — an easy way to isolate one axis of the
    // two-pass correction (see GalaxyLayoutOptions.aspectRatio) without reproducing its full
    // recursive placement (or the search's own bisection) by hand here — just cross-check that
    // galaxyLayout actually applies the exact scale resolveAspectRatioScale independently returns
    // for these same inputs.
    const nodes = [node('root'), node('child')]
    const edges = [structuralEdge('root', 'child')]
    const ratio = 4
    const layoutOptions = { aspectRatio: ratio, startAngle: 0, settleCycles: 0 }

    const natural = galaxyLayout(nodes, edges, { startAngle: 0, settleCycles: 0 })
    const naturalXOffset = natural.get('child')!.x - natural.get('root')!.x

    const scale = resolveAspectRatioScale(nodes, edges, layoutOptions)

    const warped = galaxyLayout(nodes, edges, layoutOptions)
    const root = warped.get('root')!
    const child = warped.get('child')!

    expect(root.y).toBeCloseTo(0, 5)
    expect(child.x - root.x).toBeCloseTo(naturalXOffset * scale.x, 5)
    expect(child.y - root.y).toBeCloseTo(0, 5)
  })

  test('pinned coordinates are unaffected by aspectRatio', () => {
    const nodes: GalaxyLayoutNode[] = [
      node('pinned', { x: 500, y: 500, pinned: true }),
      node('free'),
    ]
    const edges = [structuralEdge('pinned', 'free')]

    const positions = galaxyLayout(nodes, edges, { aspectRatio: 3 })
    expect(positions.get('pinned')).toEqual({ x: 500, y: 500 })
  })

  test('composes with subtreeReach — a deep subtree still seeds farther from the hub than a childless root', () => {
    const nodes: GalaxyLayoutNode[] = [node('lonelyRoot')]
    const edges: GalaxyLayoutEdge[] = []
    const chain = ['deepRoot', 'a', 'b', 'c', 'd']
    for (const id of chain) nodes.push(node(id))
    for (let i = 0; i < chain.length - 1; i++) edges.push(structuralEdge(chain[i], chain[i + 1]))

    // startAngle: 0 puts both 2-root-ring roots on the x-axis (angles 0 and π), so an elliptical
    // warp scales both root positions by the same x-axis factor — isolating the property under
    // test (subtreeReach still composes with aspectRatio) from the unrelated fact that an
    // elliptical warp scales differently-angled points by different amounts. separateGroups: false
    // isolates it further from shiftGroupsApart's own group-vs-group macro pass, which treats
    // group boundary circles as literally circular regardless of aspectRatio (a known, documented,
    // separately-tested limitation — see "composes with separateGroups" below — not something this
    // test is trying to verify).
    const positions = galaxyLayout(nodes, edges, { aspectRatio: 3, startAngle: 0, separateGroups: false })
    const lonelyDist = Math.hypot(positions.get('lonelyRoot')!.x, positions.get('lonelyRoot')!.y)
    const deepDist = Math.hypot(positions.get('deepRoot')!.x, positions.get('deepRoot')!.y)

    expect(deepDist).toBeGreaterThan(lonelyDist * 3)
  })

  test('composes with separateGroups — group boundaries stay non-overlapping under an elliptical warp', () => {
    const { nodes, edges } = busyMultiRootNodes()

    const positions = galaxyLayout(nodes, edges, { aspectRatio: 3 })

    // toBeLessThan, not <=0 exactly — the elliptical transform's cos/sin math introduces
    // floating-point noise on the order of 1e-14 even where the true geometric overlap is zero.
    expect(worstGroupOverlap(groupBoundaries(nodes, edges, positions))).toBeLessThan(1e-6)
  })
})
