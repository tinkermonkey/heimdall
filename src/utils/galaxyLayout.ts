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
  /**
   * Container width/height (px), i.e. containerWidth / containerHeight. When provided, warps every
   * orbital ring from a circle into an ellipse so the layout's overall shape leans toward the
   * container's own proportions, instead of always producing a footprint that a wide-short or
   * tall-narrow container then has to letterbox. Omitted (or exactly 1) reproduces today's exact
   * un-warped placement bit-for-bit — every `distance` still comes from the same nodeSpread-based
   * radius math; only the polar-to-cartesian conversion changes, so nodeMargin, separationPass, and
   * shiftGroupsApart all keep working unmodified against the resulting elliptically-placed
   * positions (they only ever read real x/y + width/height, with no notion of how a position was
   * derived).
   *
   * The correction is computed *relative to this tree's own natural (unwarped) shape*, not
   * relative to a hypothetical circle — see galaxySimulationStep's own docs for why a naive
   * "warp a circle toward the target ratio" formula badly misjudges how much correction is
   * actually needed: a tree with a long single-child chain, in particular, can be dramatically
   * non-circular on its own, in either direction, before this option is even involved, and
   * measuring the wrong starting point can make a mismatch *worse* instead of better. Both the
   * target ratio and the resulting correction factor are clamped to [1/8, 8] (guards a transient
   * 0-height container measurement from producing Infinity/NaN, and keeps an extreme correction
   * — a naturally very tall tree targeting a very wide container, say — from spiraling), then
   * damped via a fourth root (`clampedCorrection ** 0.25`) before being applied as the x-axis
   * scale (and its reciprocal as the y-axis scale). The damping isn't optional polish — applying
   * the raw correction directly was tried and measured to *inflate the layout's total rendered
   * area 3-13x* for realistic trees, for barely any further ratio benefit past the first quarter
   * of the curve. The reason scaleX * scaleY === 1 doesn't actually keep the *displayed* area
   * constant the way it looks like it should: `separationPass`'s collision floor pushes back
   * against *compression* (a squeezed axis gets fought back up toward its natural size) but does
   * nothing to resist *expansion* (a stretched axis applies in full) — so an undamped correction
   * on a tree whose natural shape is already far from the target doesn't trade width for height,
   * it just adds width. The fourth root keeps that growth within roughly 1.0-1.2x of natural
   * across the whole clamped range while still moving the drawn ratio meaningfully in the right
   * direction. Even a large (damped) correction still has a practical ceiling regardless of this
   * option's own math: `separationPass` refuses to compress adjacent nodes past their own
   * rendered size, so a long chain that genuinely needs N node-heights of room in one direction
   * can't be squeezed below that no matter how aggressively this option asks it to. Not applied to
   * shiftGroupsApart's own group-vs-group macro pass — that still treats group boundary circles as
   * literally circular when pushing them apart from each other, a known, deliberately out-of-scope
   * limitation (multi-group top-level arrangement won't lean into the aspect ratio quite as
   * strongly as a single tree's internal orbits do).
   */
  aspectRatio?: number
  /**
   * Pre-resolved output of `resolveAspectRatioScale` — when provided, `aspectRatio` is ignored and
   * this exact {x, y} elliptical scale is used directly, skipping the natural-shape measurement
   * and binary search that resolving it from scratch requires. `galaxyLayout` always resolves it
   * itself, once, before its settle loop (rather than paying that cost on every one of its 24
   * cycles). A live-simulation caller driving `galaxySimulationStep` directly once per animation
   * frame should do the same — resolve it once (e.g. in a `useMemo` keyed on the graph's
   * structure and the target ratio, deliberately NOT on live drag positions — see
   * resolveAspectRatioScale's own docs for why re-resolving on every frame is both too slow and
   * not actually desirable) and pass the resolved value in here every tick instead of a raw
   * `aspectRatio`, which — unresolved — would otherwise re-run that search on every single frame.
   */
  resolvedAspectScale?: { x: number; y: number }
}

/**
 * Builds a `computeHome(ellipseX, ellipseY)` closure for a fixed tree shape (nodeMap, childrenOf,
 * roots) and settle-independent options (radiusOf, nodeSpread, startAngle) — the recursive "spread
 * children around a full circle, seeded from a virtual hub" placement described in
 * galaxySimulationStep's own docs, with the elliptical scale left as a parameter so both
 * `galaxySimulationStep` (a single call at the resolved scale) and `resolveAspectRatioScale` (many
 * calls at different trial scales during its search) can reuse the same tree/subtreeReach setup
 * instead of rebuilding it per call.
 */
function buildComputeHome(
  nodeMap: ReadonlyMap<string, GalaxyLayoutNode>,
  childrenOf: ReadonlyMap<string, string[]>,
  roots: readonly string[],
  radiusOf: (n: GalaxyLayoutNode) => number,
  nodeSpread: number,
  startAngle: number
): (ellipseX: number, ellipseY: number) => Map<string, { x: number; y: number }> {
  // How far a node's own subtree extends beyond the node's own position — 0 for a leaf (nothing
  // to account for), otherwise the largest child orbital distance plus that child's own reach.
  // Root-ring seeding (below) uses this so a root with a large subtree gets pushed proportionally
  // further from the shared hub, instead of every root — a lone orphan and the root of a 9-node,
  // 4-level chain alike — starting at essentially the same tiny distance (just its own radius).
  // Independent of ellipseX/ellipseY (a pure scalar distance), so computed once here and reused by
  // every call to the returned computeHome, regardless of what scale it's called at.
  const subtreeReach = (id: string): number => {
    const kids = childrenOf.get(id) ?? []
    if (kids.length === 0) return 0
    const r = radiusOf(nodeMap.get(id)!)
    let maxReach = 0
    for (const childId of kids) {
      const childR = radiusOf(nodeMap.get(childId)!)
      const distance = r + childR * nodeSpread
      maxReach = Math.max(maxReach, distance + subtreeReach(childId))
    }
    return maxReach
  }

  return (ellipseX: number, ellipseY: number): Map<string, { x: number; y: number }> => {
    const result = new Map<string, { x: number; y: number }>()
    const offset = (distance: number, angle: number): { x: number; y: number } => ({
      x: distance * ellipseX * Math.cos(angle),
      y: distance * ellipseY * Math.sin(angle),
    })
    const place = (id: string, cx: number, cy: number, angle: number, depth: number): void => {
      const node = nodeMap.get(id)!
      // A pinned node's actual position overrides the (cx, cy) it was handed — both as its own
      // home, and as the center its children are placed around, so the whole subtree follows.
      const anchored = node.pinned && node.x !== undefined && node.y !== undefined
      const ax = anchored ? node.x! : cx
      const ay = anchored ? node.y! : cy
      result.set(id, { x: ax, y: ay })
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
        const off = offset(distance, childAngle)
        place(childId, ax + off.x, ay + off.y, childAngle, depth + 1)
      })
    }

    // A virtual radius-0 hub at the origin seeds the root ring: every real root — including
    // orphans, which are just one-node trees — becomes one of its "children", so independent
    // trees spread around a shared center instead of all stacking at (0, 0).
    const n = roots.length
    roots.forEach((rootId, i) => {
      const rootR = radiusOf(nodeMap.get(rootId)!)
      // Own-radius term unchanged from before (so a childless root — an orphan, or any leaf-only
      // tree — seeds at exactly the same distance it always has); the added subtreeReach term is
      // what actually fixes a root WITH descendants landing right next to (or visually inside)
      // an unrelated neighbor's territory — see subtreeReach's own docs above.
      const distance = rootR * nodeSpread + subtreeReach(rootId)
      const angle = startAngle + (2 * Math.PI * i) / n
      const off = offset(distance, angle)
      place(rootId, off.x, off.y, angle, 0)
    })

    return result
  }
}

// Weighted bounding box of a settled position map — a plain center-point bbox undercounts by up
// to one node radius on every edge, so every caller that needs a real footprint measurement
// (resolveAspectRatioScale's search, most notably) uses this instead.
function weightedBboxOf(
  positions: ReadonlyMap<string, { x: number; y: number }>,
  nodeMap: ReadonlyMap<string, GalaxyLayoutNode>,
  radiusOf: (n: GalaxyLayoutNode) => number
): { width: number; height: number; ratio: number; area: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const [id, p] of positions) {
    const r = radiusOf(nodeMap.get(id)!)
    minX = Math.min(minX, p.x - r); maxX = Math.max(maxX, p.x + r)
    minY = Math.min(minY, p.y - r); maxY = Math.max(maxY, p.y + r)
  }
  const width = maxX - minX || 1
  const height = maxY - minY || 1
  return { width, height, ratio: width / height, area: width * height }
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
 * (or live-dragging) an ancestor cascades correctly to its whole subtree. When `options.aspectRatio`
 * is set, this walk runs twice — once unwarped to measure the tree's own natural shape, once more
 * with a corrective elliptical scale based on that measurement — see GalaxyLayoutOptions.aspectRatio
 * for why a single warp-a-circle pass isn't enough.
 */
/**
 * Resolves `options.aspectRatio` (a raw container ratio) into the actual {x, y} elliptical scale
 * `galaxySimulationStep`'s home computation should use — the natural-shape measurement plus
 * binary search described in `GalaxyLayoutOptions.aspectRatio`'s own docs, pulled out into its own
 * function so it can be resolved *once* and reused, rather than re-run on every settle cycle or
 * every live-simulation animation frame (each resolution costs roughly 8 trial evaluations, each
 * of which runs a full group-separation pass — cheap once, but 24x (a settle loop) or 60x/sec (a
 * live tick) too expensive to repeat with the exact same answer every time).
 *
 * `galaxyLayout` always calls this once before its settle loop and threads the result through
 * `resolvedAspectScale`. A live-simulation caller driving `galaxySimulationStep` directly should
 * do the same — resolve it once (e.g. a `useMemo` keyed on the target ratio and the graph's own
 * structure) and pass `resolvedAspectScale` into every tick's options instead of a raw
 * `aspectRatio`. Deliberately key that memo on structure only, NOT on live drag/pin positions:
 * besides the performance reason above, a resolution that shifted mid-drag would read as the
 * whole layout's target shape subtly changing while the user is mid-gesture, which is worse UX
 * than the (already-accepted) tradeoff of the ellipse not tracking a temporarily-pinned node's
 * exact contribution to the natural-shape measurement.
 *
 * Returns {x: 1, y: 1} (no warp) when `aspectRatio` is omitted or exactly 1.
 */
export function resolveAspectRatioScale(
  nodes: readonly GalaxyLayoutNode[],
  edges: readonly GalaxyLayoutEdge[],
  options: GalaxyLayoutOptions = {}
): { x: number; y: number } {
  const { aspectRatio } = options
  if (aspectRatio === undefined || aspectRatio === 1 || nodes.length === 0) return { x: 1, y: 1 }

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const radiusOf = (n: GalaxyLayoutNode) => Math.hypot(n.width, n.height) / 2

  // Natural (unwarped) shape, measured through one real settle step (home -> group separation ->
  // individual separationPass -> homeStrength nudge) — not just the raw elliptical home position.
  // This matters: a raw-home-only measurement (an earlier version of this function used
  // computeHome + shiftGroupsApart directly, skipping individual separationPass and the
  // homeStrength nudge) significantly OVERESTIMATES how much a given correction actually distorts
  // the real, settled layout for a tree with several small, tightly-packed sibling groups — the
  // group-level macro shift alone, unaided by individual-level separation, has to resolve overlap
  // by brute rigid translation, while the real pipeline's individual pass resolves most of it far
  // more cheaply. Measured concretely: a fixture with 5 sibling branches showed the raw-home
  // proxy predicting area growth past 2x from almost the very first, smallest trial correction,
  // while the actually-settled result stayed under 1.3x across the *entire* correction range —
  // the raw proxy was rejecting every correction as unsafe when none of them actually were.
  const naturalPos = galaxySimulationStep(nodes, edges, undefined, { ...options, resolvedAspectScale: { x: 1, y: 1 } })
  const naturalBbox = weightedBboxOf(naturalPos, nodeMap, radiusOf)
  const clampedTarget = Math.min(8, Math.max(1 / 8, aspectRatio))
  const rawCorrection = Math.min(8, Math.max(1 / 8, clampedTarget / naturalBbox.ratio))

  // Applying rawCorrection directly is not safe: `separationPass`/`shiftGroupsApart`'s collision
  // floors resist *compression* but not *expansion*, so an uncapped correction doesn't trade
  // width for height the way scaleX * scaleY === 1 suggests — it mostly just adds width, measured
  // to inflate total rendered area by as much as 9x on real trees for one dataset, while on
  // ANOTHER dataset the exact same fixed damping left the ratio barely improved at all (a badly
  // overcorrecting fourth-root: fine for a mildly-biased tree, far too weak for a severely
  // chain-dominated one — no single constant serves both). So instead of a fixed exponent, binary-
  // search the exponent itself: find the strongest correction whose *actual, settled* rendered
  // area stays within AREA_GROWTH_CAP of natural — one real settle step per trial (not the full
  // multi-cycle settle loop galaxyLayout itself runs; one step is enough to be representative —
  // see above — and each one measured well under 15ms even on a 50+-node stress dataset, six
  // trials total, done once per resolution rather than once per settle cycle or animation frame).
  const AREA_GROWTH_CAP = 2
  const areaGrowthAt = (t: number): number => {
    const trialCorrection = Math.pow(rawCorrection, t)
    const trialPos = galaxySimulationStep(nodes, edges, undefined, {
      ...options,
      resolvedAspectScale: { x: trialCorrection, y: 1 / trialCorrection },
    })
    return weightedBboxOf(trialPos, nodeMap, radiusOf).area / naturalBbox.area
  }
  let lo = 0, hi = 1
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2
    if (areaGrowthAt(mid) <= AREA_GROWTH_CAP) lo = mid
    else hi = mid
  }
  const finalCorrection = Math.pow(rawCorrection, lo)
  return { x: finalCorrection, y: 1 / finalCorrection }
}

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
    resolvedAspectScale,
  } = options

  if (nodes.length === 0) return new Map()

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const radiusOf = (n: GalaxyLayoutNode) => Math.hypot(n.width, n.height) / 2

  const { childrenOf, roots } = buildStructuralForest(nodes.map(n => n.id), edges)
  const computeHome = buildComputeHome(nodeMap, childrenOf, roots, radiusOf, nodeSpread, startAngle)

  // Grouping is purely structural (independent of ellipseX/ellipseY), so it's resolved once here
  // and reused by the real effectiveHome computation below.
  const groupHeads = separateGroups ? galaxyGroupHeads(roots, childrenOf) : []
  const leafToGroup = new Map<string, string>()
  if (separateGroups) {
    for (const headId of groupHeads) {
      leafToGroup.set(headId, headId)
      for (const descendantId of structuralDescendants(headId, childrenOf)) leafToGroup.set(descendantId, headId)
    }
  }

  // See GalaxyLayoutOptions.aspectRatio / resolveAspectRatioScale for the full reasoning — the
  // caller (galaxyLayout, or a live-simulation caller) is expected to have already resolved
  // `options.aspectRatio` into `resolvedAspectScale` once and reused it across repeated calls;
  // resolving it fresh here is only a fallback for a direct caller that didn't.
  const scale = resolvedAspectScale ?? resolveAspectRatioScale(nodes, edges, options)
  const home = computeHome(scale.x, scale.y)

  // Group-separate the home positions themselves, not just a settled/pinned pos snapshot —
  // otherwise every tick's homeStrength nudge pulls unpinned nodes straight back toward their
  // raw, un-separated home, eroding a one-time position-level correction within a handful of
  // frames regardless of how carefully it was computed. Cheap: same macro pass galaxyLayout's own
  // final pass runs, minus its individual-node safety-net cleanup (unnecessary here — the
  // separationPass call a few lines down, plus every subsequent tick's own pass, already keeps
  // actual `pos` clear of individual overlap; this only needs the group-level shift).
  const effectiveHome = separateGroups ? shiftGroupsApart(nodeMap, groupHeads, leafToGroup, home) : home

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

  // A dragged/dropped "sun" carries its own group's ACTUAL boundary circle wherever it goes —
  // home-level separation above keeps the algorithmic TARGET layout non-overlapping, but says
  // nothing about a group's real, currently-dragged footprint growing into a neighbor's real
  // territory. Without this, that neighbor's nodes just sit there while the dragged group's
  // (correctly rendered, honestly reaching) boundary circle balloons out to enclose them —
  // reading as "I dragged a node into another group," even though membership never changed.
  // React the same way collision avoidance already does for individual nodes: push the *other*
  // groups' real positions out of the way, leaving whichever group contains a currently-pinned
  // node exactly where the user put it. Only worth the extra pass when something's actually
  // pinned — absent that, `pos` already tracks `effectiveHome` closely enough (see the dedicated
  // regression test) that a second group-level correction here would just be wasted work.
  if (separateGroups && groupHeads.length > 1) {
    const pinnedGroups = new Set<string>()
    for (const node of nodes) {
      if (!node.pinned || node.x === undefined || node.y === undefined) continue
      const groupId = leafToGroup.get(node.id)
      if (groupId) pinnedGroups.add(groupId)
    }
    if (pinnedGroups.size > 0) {
      return shiftGroupsApart(nodeMap, groupHeads, leafToGroup, pos, pinnedGroups)
    }
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

  // Resolved once here rather than left for galaxySimulationStep to resolve itself on every one
  // of the settleCycles calls below — see resolveAspectRatioScale's own docs for why re-resolving
  // it that many times over would be far more expensive than the settle loop it's feeding.
  const resolvedAspectScale = resolveAspectRatioScale(nodes, edges, options)
  const stepOptions: GalaxyLayoutOptions = { ...options, resolvedAspectScale }

  let pos: Map<string, { x: number; y: number }> | undefined
  for (let cycle = 0; cycle < settleCycles; cycle++) {
    pos = galaxySimulationStep(nodes, edges, pos, stepOptions)
  }
  // settleCycles: 0 is an unusual but legal input (skips the settle loop above) — still run one
  // step so `pos` is always defined, rather than falling back to raw unseparated home positions.
  if (!pos) pos = galaxySimulationStep(nodes, edges, undefined, stepOptions)

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
 * structure the algorithm is built around. `pinnedGroups` (if any) keeps those groups' pseudo-
 * nodes fixed in the macro pass — used for a currently-dragged group's real footprint, which
 * should displace its neighbors rather than get displaced itself.
 *
 * No individual-node safety-net cleanup here — this is the shared core every caller (galaxyLayout's
 * final pass, and galaxySimulationStep's every-tick home computation AND its reactive real-position
 * push-away while something's pinned) calls directly; galaxyLayout's own final pass runs its own
 * cleanup afterward on the actual settled positions (see applyGroupSeparation below), the others
 * don't need one — `home` is a target to pull toward, not something that itself needs to end up
 * overlap-free, and the real per-tick `pos` already gets its own separationPass call regardless of
 * this. Cheap enough for every animation frame either way: `positions` in, one O(n) boundary
 * computation, one bounded O(g²) macro-separation loop (g = number of top-level groups, always
 * small), one O(g·n) rigid translate.
 *
 * `maxPasses` (default FINAL_CLEANUP_MAX_PASSES) caps the macro-separation loop below — lowered by
 * resolveAspectRatioScale's search, which calls this many times per resolution and only needs a
 * rough area estimate from each trial, not full convergence.
 */
function shiftGroupsApart(
  nodeMap: ReadonlyMap<string, GalaxyLayoutNode>,
  groupHeads: readonly string[],
  leafToGroup: Map<string, string>,
  positions: Map<string, { x: number; y: number }>,
  pinnedGroups?: ReadonlySet<string>,
  maxPasses: number = FINAL_CLEANUP_MAX_PASSES
): Map<string, { x: number; y: number }> {
  if (groupHeads.length <= 1) return positions

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
    id, x: 0, y: 0, width: c.r * 2, height: c.r * 2, pinned: pinnedGroups?.has(id),
  }))
  const macroPos = new Map([...boundaries.entries()].map(([id, c]) => [id, { x: c.x, y: c.y }]))
  for (let pass = 0; pass < maxPasses; pass++) {
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
  const groupHeads = galaxyGroupHeads(roots, childrenOf)
  const leafToGroup = new Map<string, string>()
  for (const headId of groupHeads) {
    leafToGroup.set(headId, headId)
    for (const descendantId of structuralDescendants(headId, childrenOf)) leafToGroup.set(descendantId, headId)
  }
  const next = shiftGroupsApart(nodeMap, groupHeads, leafToGroup, pos)
  if (next === pos) return pos

  const cleanupNodes: LayoutNode[] = nodes.map(n => ({ id: n.id, width: n.width, height: n.height, pinned: n.pinned, x: 0, y: 0 }))
  for (let pass = 0; pass < FINAL_CLEANUP_MAX_PASSES; pass++) {
    if (!separationPass(cleanupNodes, next)) break
  }

  return next
}
