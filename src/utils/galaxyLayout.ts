import { separationPass, FINAL_CLEANUP_MAX_PASSES, boundingCirclesByGroup, type LayoutNode } from './graphLayout'
import { buildStructuralForest, structuralDescendants, galaxyGroupHeads } from './graphHierarchy'

export interface GalaxyLayoutNode {
  id: string
  width: number
  height: number
  /** Explicit position pins the node in place — same convention as forceLayout. When the pinned
   *  node has structural children, its own position also anchors where THEIR home positions are
   *  computed relative to (see galaxySimulationStep) — dragging/pinning a "sun" cascades to its
   *  whole subtree, not just to that one node. */
  x?: number
  y?: number
  pinned?: boolean
}

export interface GalaxyLayoutEdge {
  source: string
  target: string
  /** Structural edges define the orbital hierarchy (source = parent, target = child).
   *  Non-structural edges are ignored by the layout entirely. */
  structural: boolean
}

export interface GalaxyLayoutOptions {
  /** Multiplies a child's own radius to size its orbital distance from its parent. Default 3.2 —
   *  wide enough that an edge's label (rendered at the midpoint) clears both endpoint nodes,
   *  and that independent orbits (siblings, other roots) don't crowd each other. */
  nodeSpread?: number
  /** Radians. Where the outermost ring of root orbits starts. Default -PI/2 (12 o'clock). */
  startAngle?: number
  /** How many settle cycles alternate collision separation with a pull back toward the
   *  orbital home position. Default 24. */
  settleCycles?: number
  /** 0-1. Fraction of the remaining distance to home closed per settle cycle. Default 0.18. */
  homeStrength?: number
  /**
   * Extra breathing room kept clear around each node during the settle cycles, on top of what's
   * needed to just avoid overlap — same idea as forceLayout's nodeMargin, and for the same
   * reason: settleCycles' separation passes (see separationPass) only resolve literal overlap, so
   * without this, a handful of sibling/cross-orbit pairs can converge to touching or a few px of
   * gap even though most of the layout is well spread — verified on a 56-node/4-level hierarchy
   * with real-world size variance (galaxyBudgetData in the repo's test pages), where the tightest
   * pairs landed under 1px apart. Defaults to 0 (unpadded, today's existing behavior) rather than
   * forceLayout's own width default — galaxyLayout's nodeSpread-based initial placement already
   * gives most of the layout generous spacing, so defaulting this on would shift node positions
   * (and every committed galaxy-layout snapshot) for a cosmetic fix to a narrow edge case; opt in
   * with a modest value instead. The final cleanup pass (FINAL_CLEANUP_MAX_PASSES) always runs
   * unpadded regardless of this value — it exists purely to guarantee zero literal overlap, and
   * padding it too would fight homeStrength forever on a dense orbit instead of converging.
   */
  nodeMargin?: number
  /**
   * Keeps top-level group boundary circles (see boundingCirclesByGroup, galaxyGroupHeads) from
   * overlapping each other — the same sizing logic showClusterBoundaries renders with, computed
   * and separated here regardless of whether boundaries are actually shown anywhere. Individual
   * NODE overlap is already prevented unconditionally by separationPass; this is specifically
   * about whole GROUP regions (a category's full subtree, say) crowding into a neighboring
   * group's territory even when no two individual nodes technically overlap. Default true — a
   * correctness fix, not a style choice, so it ships on by default unlike nodeMargin above.
   *
   * Also read by galaxySimulationStep, which group-separates its own per-tick home positions (not
   * just galaxyLayout's final settled ones) — without that, a live tick's homeStrength nudge would
   * keep pulling every unpinned node straight back toward its raw, un-separated home, undoing this
   * option's whole effect within the first few animation frames of live mode regardless of what it
   * accomplished in the one-shot layout that seeded it.
   */
  separateGroups?: boolean
}

/**
 * Computes one settle iteration for a galaxy layout: recomputes every node's orbital "home"
 * position (see below), seeds/continues from `prevPositions` (or home/pinned positions if this
 * is the first call), runs one collision-separation pass, then nudges every unpinned node one
 * `homeStrength` fraction of the way toward its home. Exported so it can be driven either as a
 * bounded, synchronous batch (see galaxyLayout, which calls this `settleCycles` times) or as a
 * live, continuous simulation — e.g. GraphCanvas's opt-in live-simulation mode, which calls this
 * once per animation frame, feeding back its own previous frame's output as `prevPositions` and a
 * currently-dragged node's live pointer position as a `pinned` override — so dragging any node
 * (a "sun" or otherwise) elastically repositions its descendants in real time.
 *
 * Home positions are computed by a recursive walk that spreads each node's children evenly
 * around a full circle centered on it (not a half-arc fanned away from it — that full-circle
 * spread plus a parent-angle offset is what gives the layout its "galaxy arm" look instead of
 * reading as a plain radial org chart), seeded from a virtual hub at the origin so independent
 * root trees spread around a shared center. A pinned node's own actual position — not the
 * position the recursive walk would have otherwise assigned it — is used both as that node's own
 * home AND as the anchor its own children's home positions are computed relative to, so pinning
 * (or live-dragging) an ancestor cascades correctly to its whole subtree.
 */
export function galaxySimulationStep(
  nodes: readonly GalaxyLayoutNode[],
  edges: readonly GalaxyLayoutEdge[],
  prevPositions: Map<string, { x: number; y: number }> | undefined,
  options: GalaxyLayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeSpread = 3.2,
    startAngle = -Math.PI / 2,
    homeStrength = 0.18,
    nodeMargin,
    separateGroups = true,
  } = options

  if (nodes.length === 0) return new Map()

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const radiusOf = (n: GalaxyLayoutNode) => Math.hypot(n.width, n.height) / 2

  const { childrenOf, roots } = buildStructuralForest(nodes.map(n => n.id), edges)

  const home = new Map<string, { x: number; y: number }>()
  const place = (id: string, cx: number, cy: number, angle: number, depth: number): void => {
    const node = nodeMap.get(id)!
    // A pinned node's actual position overrides the (cx, cy) it was handed — both as its own
    // home, and as the center its children are placed around, so the whole subtree follows.
    const anchored = node.pinned && node.x !== undefined && node.y !== undefined
    const ax = anchored ? node.x! : cx
    const ay = anchored ? node.y! : cy
    home.set(id, { x: ax, y: ay })
    const kids = childrenOf.get(id) ?? []
    const n = kids.length
    if (n === 0) return
    const r = radiusOf(node)
    kids.forEach((childId, i) => {
      const childR = radiusOf(nodeMap.get(childId)!)
      const distance = r + childR * nodeSpread
      // Even sibling counts below the root ring get a half-slot rotation so a child never lands
      // directly opposite its own parent-facing edge into the grandparent.
      const parity = n % 2 === 0 && depth > 0 ? Math.PI / n : 0
      const childAngle = angle + (2 * Math.PI * i) / n + parity
      place(childId, ax + distance * Math.cos(childAngle), ay + distance * Math.sin(childAngle), childAngle, depth + 1)
    })
  }

  // A virtual radius-0 hub at the origin seeds the root ring: every real root — including
  // orphans, which are just one-node trees — becomes one of its "children", so independent
  // trees spread around a shared center instead of all stacking at (0, 0).
  {
    const n = roots.length
    roots.forEach((rootId, i) => {
      const rootR = radiusOf(nodeMap.get(rootId)!)
      const distance = rootR * nodeSpread
      const angle = startAngle + (2 * Math.PI * i) / n
      place(rootId, distance * Math.cos(angle), distance * Math.sin(angle), angle, 0)
    })
  }

  // Group-separate the home positions themselves, not just a settled/pinned pos snapshot —
  // otherwise every tick's homeStrength nudge pulls unpinned nodes straight back toward their
  // raw, un-separated home, eroding a one-time position-level correction within a handful of
  // frames regardless of how carefully it was computed. Cheap: same macro pass galaxyLayout's own
  // final pass runs, minus its individual-node safety-net cleanup (unnecessary here — the
  // separationPass call a few lines down, plus every subsequent tick's own pass, already keeps
  // actual `pos` clear of individual overlap; this only needs the group-level shift).
  const effectiveHome = separateGroups ? shiftGroupsApart(nodeMap, childrenOf, roots, home) : home

  // Seed from prevPositions for continuity (a live tick nudges from wherever things currently
  // are, never restarts from raw home) — falling back to home for any node not seen before (the
  // very first call, or a node newly added mid-simulation). A pinned node always uses its own
  // current x/y regardless of prevPositions, so a live drag's latest position immediately wins.
  const pos = new Map<string, { x: number; y: number }>()
  for (const node of nodes) {
    if (node.pinned && node.x !== undefined && node.y !== undefined) {
      pos.set(node.id, { x: node.x, y: node.y })
    } else {
      pos.set(node.id, prevPositions?.get(node.id) ?? effectiveHome.get(node.id)!)
    }
  }

  // separationPass only reads id/width/height/pinned off each node — x/y live in `pos`.
  const separationNodes: LayoutNode[] = nodes.map(n => ({ id: n.id, width: n.width, height: n.height, pinned: n.pinned, x: 0, y: 0 }))
  // See GalaxyLayoutOptions.nodeMargin — unlike forceLayout's marginFor, undefined means 0
  // (unpadded) here, not each node's own width.
  const margin = nodeMargin ?? 0
  const paddedSeparationNodes: LayoutNode[] = margin === 0
    ? separationNodes
    : nodes.map(n => ({ id: n.id, width: n.width + margin, height: n.height + margin, pinned: n.pinned, x: 0, y: 0 }))

  separationPass(paddedSeparationNodes, pos)
  for (const node of nodes) {
    if (node.pinned) continue
    const p = pos.get(node.id)!
    const h = effectiveHome.get(node.id)!
    pos.set(node.id, { x: p.x + (h.x - p.x) * homeStrength, y: p.y + (h.y - p.y) * homeStrength })
  }

  return pos
}

/**
 * Positions nodes as a radial hierarchy of orbits — a "galaxy": each node's children are spread
 * evenly around a full circle centered on it, offset by the parent's own angle so descendants
 * read as a loose spiral rather than straight spokes (see galaxySimulationStep for the exact
 * placement rule). Only `structural` edges shape that hierarchy; other edges are layout-irrelevant
 * (callers still render them — see GraphCanvas's isStructuralEdge prop).
 *
 * A node with no structural parent (including one connected only by non-structural edges, or
 * not connected at all) becomes its own root and gets an orbit of its own around the shared
 * center, same as any other root.
 *
 * The radial position is a "home" the node settles near, not a fixed slot: this runs
 * galaxySimulationStep `settleCycles` times in a row (each cycle alternates capped collision
 * separation with a gentle pull back toward home), then a final unpadded cleanup pass, then — by
 * default — a group-separation pass (see GalaxyLayoutOptions.separateGroups) so top-level group
 * regions don't crowd into each other either.
 */
export function galaxyLayout(
  nodes: readonly GalaxyLayoutNode[],
  edges: readonly GalaxyLayoutEdge[],
  options: GalaxyLayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const { settleCycles = 24, separateGroups = true } = options

  if (nodes.length === 0) return new Map()

  let pos: Map<string, { x: number; y: number }> | undefined
  for (let cycle = 0; cycle < settleCycles; cycle++) {
    pos = galaxySimulationStep(nodes, edges, pos, options)
  }
  // settleCycles: 0 is an unusual but legal input (skips the settle loop above) — still run one
  // step so `pos` is always defined, rather than falling back to raw unseparated home positions.
  if (!pos) pos = galaxySimulationStep(nodes, edges, undefined, options)

  // Shares forceLayout's cleanup-pass budget (see FINAL_CLEANUP_MAX_PASSES) rather than its own
  // independent constant — a dense orbit of large/card-sized nodes can hit the same non-convergence
  // case forceLayout needed a larger budget for.
  const separationNodes: LayoutNode[] = nodes.map(n => ({ id: n.id, width: n.width, height: n.height, pinned: n.pinned, x: 0, y: 0 }))
  for (let pass = 0; pass < FINAL_CLEANUP_MAX_PASSES; pass++) {
    if (!separationPass(separationNodes, pos)) break
  }

  if (separateGroups) {
    pos = applyGroupSeparation(nodes, edges, pos)
  }

  return pos
}

/**
 * Pushes apart any top-level group boundary circles (see boundingCirclesByGroup,
 * galaxyGroupHeads) that overlap each other, then rigidly translates each group's members by the
 * same delta so each group's already-correct internal arrangement is preserved. Plain separation
 * between group pseudo-nodes, not a spring simulation — galaxy groups aren't meaningfully
 * "spring-connected" to each other, and pulling unrelated groups together would fight the radial
 * structure the algorithm is built around.
 *
 * No individual-node safety-net cleanup here — this is the shared core both galaxyLayout's final
 * pass and galaxySimulationStep's every-tick home computation call directly; the former runs its
 * own cleanup pass afterward on the actual settled positions (see applyGroupSeparation below),
 * the latter doesn't need one since `home` is a target to pull toward, not something that itself
 * needs to end up overlap-free — the real per-tick `pos` already gets its own separationPass call
 * regardless of this. Cheap enough for every animation frame either way: `positions` in, one O(n)
 * boundary computation, one bounded O(g²) macro-separation loop (g = number of top-level groups,
 * always small), one O(g·n) rigid translate.
 */
function shiftGroupsApart(
  nodeMap: ReadonlyMap<string, GalaxyLayoutNode>,
  childrenOf: ReadonlyMap<string, string[]>,
  roots: readonly string[],
  positions: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> {
  const groupHeads = galaxyGroupHeads(roots, childrenOf)
  if (groupHeads.length <= 1) return positions

  const leafToGroup = new Map<string, string>()
  for (const headId of groupHeads) {
    leafToGroup.set(headId, headId)
    for (const descendantId of structuralDescendants(headId, childrenOf)) leafToGroup.set(descendantId, headId)
  }

  const radiusOf = (id: string): number => {
    const n = nodeMap.get(id)
    return n ? Math.hypot(n.width, n.height) / 2 : 20
  }
  const layoutNodes: LayoutNode[] = [...nodeMap.values()].map(n => ({ id: n.id, width: n.width, height: n.height, x: 0, y: 0 }))
  // anchorToHead: true — must match GraphCanvas's own boundingCirclesByGroup call for rendering
  // (see its comment); otherwise this pass would separate the centroid-based circles while the
  // rendered head-anchored ones stayed exactly where they were, reintroducing visible overlap.
  const boundaries = boundingCirclesByGroup(layoutNodes, positions, leafToGroup, radiusOf, true)

  // macroNodes' own x/y are ignored by separationPass (it only reads pos, which macroPos below
  // seeds with the real circle centers) — set to 0 for clarity, same convention every other
  // separationPass call in this file already uses.
  const macroNodes: LayoutNode[] = [...boundaries.entries()].map(([id, c]) => ({
    id, x: 0, y: 0, width: c.r * 2, height: c.r * 2,
  }))
  const macroPos = new Map([...boundaries.entries()].map(([id, c]) => [id, { x: c.x, y: c.y }]))
  for (let pass = 0; pass < FINAL_CLEANUP_MAX_PASSES; pass++) {
    if (!separationPass(macroNodes, macroPos)) break
  }

  const next = new Map(positions)
  for (const [groupId, originalCircle] of boundaries) {
    const shifted = macroPos.get(groupId)!
    const dx = shifted.x - originalCircle.x
    const dy = shifted.y - originalCircle.y
    if (dx === 0 && dy === 0) continue
    for (const [nodeId, groupOf] of leafToGroup) {
      if (groupOf !== groupId) continue
      const p = next.get(nodeId)
      if (!p) continue
      next.set(nodeId, { x: p.x + dx, y: p.y + dy })
    }
  }

  return next
}

/**
 * galaxyLayout's own final post-process: shiftGroupsApart on the actually-settled positions, plus
 * an individual-node safety-net cleanup pass (the rigid group shift is sized to clear the
 * conservative bounding circles, so new individual-node overlap at a group boundary should be
 * rare, but cheap to guard against). Only called once per galaxyLayout() invocation, not from
 * every live-simulation tick — see shiftGroupsApart's own docs for where the per-tick equivalent
 * lives and why it skips this cleanup step.
 */
function applyGroupSeparation(
  nodes: readonly GalaxyLayoutNode[],
  edges: readonly GalaxyLayoutEdge[],
  pos: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> {
  const { childrenOf, roots } = buildStructuralForest(nodes.map(n => n.id), edges)
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const next = shiftGroupsApart(nodeMap, childrenOf, roots, pos)
  if (next === pos) return pos

  const cleanupNodes: LayoutNode[] = nodes.map(n => ({ id: n.id, width: n.width, height: n.height, pinned: n.pinned, x: 0, y: 0 }))
  for (let pass = 0; pass < FINAL_CLEANUP_MAX_PASSES; pass++) {
    if (!separationPass(cleanupNodes, next)) break
  }

  return next
}
