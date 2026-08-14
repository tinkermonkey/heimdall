export interface LayoutNode {
  id: string
  x: number
  y: number
  width: number
  height: number
  pinned?: boolean
}

export interface LayoutEdge {
  source: string
  target: string
}

export interface ForceLayoutOptions {
  iterations?: number
  springLength?: number
  springStrength?: number
  repulsion?: number
  damping?: number
  centerStrength?: number
  collisionStrength?: number
}

export function forceLayout(
  nodes: readonly LayoutNode[],
  edges: readonly LayoutEdge[],
  options: ForceLayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    iterations = 300,
    springLength = 160,
    springStrength = 0.04,
    repulsion = 8000,
    damping = 0.85,
    centerStrength = 0.005,
    collisionStrength = 0.3,
  } = options

  if (nodes.length === 0) return new Map()

  // Rest length actually used for a given edge — never shorter than what the two connected
  // boxes' own footprints need to clear each other. springLength alone is a flat constant with
  // no awareness of node size: fine for default-ish chip-sized nodes (where it's already larger
  // than two half-diagonals combined, so this is a no-op), but for substantially larger nodes
  // (e.g. card-style renderNode content) a 160px rest length can be shorter than the boxes
  // themselves — the spring then permanently pulls connected large nodes into overlap, and the
  // capped separation-pass post-process below can only partially fight that every cycle, never
  // fully winning for bushier graphs with several large nodes competing around one hub.
  const restLength = (a: LayoutNode, b: LayoutNode): number =>
    Math.max(springLength, (Math.hypot(a.width, a.height) + Math.hypot(b.width, b.height)) / 2 * 1.1)

  const vx = new Map<string, number>(nodes.map(n => [n.id, 0]))
  const vy = new Map<string, number>(nodes.map(n => [n.id, 0]))
  const pos = new Map<string, { x: number; y: number }>(
    nodes.map(n => [n.id, { x: n.x, y: n.y }])
  )
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        if (a.pinned && b.pinned) continue
        const pa = pos.get(a.id)!
        const pb = pos.get(b.id)!
        const dx = pb.x - pa.x || 0.1
        const dy = pb.y - pa.y || 0.1
        const dist = Math.max(Math.hypot(dx, dy), 1)
        const force = repulsion / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        if (!a.pinned) { vx.set(a.id, vx.get(a.id)! - fx); vy.set(a.id, vy.get(a.id)! - fy) }
        if (!b.pinned) { vx.set(b.id, vx.get(b.id)! + fx); vy.set(b.id, vy.get(b.id)! + fy) }

        // Collision: an extra corrective push for any pair whose boxes currently overlap,
        // proportional to overlap depth — same idea as the separationPass post-process below,
        // but applied continuously as a soft force during the simulation instead of only in a
        // fixed-budget pass at the end. Generic inverse-square repulsion above has no notion of
        // node size, so for large nodes (e.g. card-style renderNode content) — especially several
        // of them fanned out as siblings around one hub, which aren't spring-connected to each
        // other at all — it alone settles into an equilibrium with real box overlap that
        // repulsion never resolves on its own.
        const overlapX = (a.width + b.width) / 2 - Math.abs(dx)
        const overlapY = (a.height + b.height) / 2 - Math.abs(dy)
        if (overlapX > 0 && overlapY > 0) {
          const depth = Math.min(overlapX, overlapY) * collisionStrength
          const cfx = (dx / dist) * depth
          const cfy = (dy / dist) * depth
          if (!a.pinned) { vx.set(a.id, vx.get(a.id)! - cfx); vy.set(a.id, vy.get(a.id)! - cfy) }
          if (!b.pinned) { vx.set(b.id, vx.get(b.id)! + cfx); vy.set(b.id, vy.get(b.id)! + cfy) }
        }
      }
    }

    // Spring forces along edges
    for (const edge of edges) {
      const src = nodeMap.get(edge.source)
      const tgt = nodeMap.get(edge.target)
      if (!src || !tgt || (src.pinned && tgt.pinned)) continue
      const ps = pos.get(src.id)!
      const pt = pos.get(tgt.id)!
      const dx = pt.x - ps.x || 0.1
      const dy = pt.y - ps.y || 0.1
      const dist = Math.max(Math.hypot(dx, dy), 1)
      const force = springStrength * (dist - restLength(src, tgt))
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      if (!src.pinned) { vx.set(src.id, vx.get(src.id)! + fx); vy.set(src.id, vy.get(src.id)! + fy) }
      if (!tgt.pinned) { vx.set(tgt.id, vx.get(tgt.id)! - fx); vy.set(tgt.id, vy.get(tgt.id)! - fy) }
    }

    // Center gravity + damping + position update
    for (const node of nodes) {
      if (node.pinned) continue
      const p = pos.get(node.id)!
      const nvx = (vx.get(node.id)! - p.x * centerStrength) * damping
      const nvy = (vy.get(node.id)! - p.y * centerStrength) * damping
      vx.set(node.id, nvx)
      vy.set(node.id, nvy)
      pos.set(node.id, { x: p.x + nvx, y: p.y + nvy })
    }
  }

  resolveOverlaps(nodes, edges, pos, vx, vy, nodeMap, { restLength, springStrength, damping })

  return pos
}

// The main loop above treats nodes as points, so a pair can settle at force
// equilibrium while their rendered bounding boxes still overlap. This
// post-process resolves that without undoing the converged layout:
//
//   - each separation PASS nudges every currently-overlapping pair apart
//     along whichever axis needs the least movement to clear (split evenly
//     between the two nodes), capped to a small per-node distance so no
//     single correction is large enough to swing a node across a
//     neighboring edge — an earlier, uncapped version did exactly that,
//     trading one overlap for one extra edge crossing;
//   - separation passes are interleaved with spring-only RELAXATION steps
//     (spring force + damping, no repulsion/gravity) so edge lengths pull
//     back toward springLength between corrections, instead of drifting
//     across many consecutive separation-only passes;
//   - a final cleanup phase repeats capped separation passes (no more
//     relaxation mixed in) until either no overlap remains or a generous
//     pass budget is exhausted, rather than ending on one uncapped pass
//     that could itself overshoot into a new overlap or crossing.
//
// FINAL_CLEANUP_MAX_PASSES is generous (well beyond what small/default-sized nodes ever need)
// because with substantially larger nodes (e.g. card-style renderNode content) a bushy topology
// can leave several nodes mutually overlapping at once — resolving one pair can nudge a third
// node into a new marginal overlap, so full convergence takes noticeably more passes than a
// single pair would. It's still bounded and each pass is O(n²) but cheap; the loop exits as soon
// as a pass finds nothing to fix, so this only costs extra time in that dense-overlap case, never
// in the common one. In rare, extreme cases (verified: 18 large cards in one dense hub-and-spoke
// topology) a single sub-pixel-to-few-pixel sliver of overlap can still survive even this budget —
// increasing it further empirically stopped helping past this point, suggesting a genuine
// two-pair oscillation rather than a budget shortfall; harmless in practice but worth knowing.
const OVERLAP_RESOLUTION_CYCLES = 40
const RELAXATION_STEPS_PER_CYCLE = 3
const FINAL_CLEANUP_MAX_PASSES = 400
const SEPARATION_STEP_CAP = 6

function resolveOverlaps(
  nodes: readonly LayoutNode[],
  edges: readonly LayoutEdge[],
  pos: Map<string, { x: number; y: number }>,
  vx: Map<string, number>,
  vy: Map<string, number>,
  nodeMap: Map<string, LayoutNode>,
  options: { restLength: (a: LayoutNode, b: LayoutNode) => number; springStrength: number; damping: number }
): void {
  for (let cycle = 0; cycle < OVERLAP_RESOLUTION_CYCLES; cycle++) {
    separationPass(nodes, pos)
    for (let r = 0; r < RELAXATION_STEPS_PER_CYCLE; r++) {
      relaxationStep(nodes, edges, pos, vx, vy, nodeMap, options)
    }
  }
  for (let pass = 0; pass < FINAL_CLEANUP_MAX_PASSES; pass++) {
    if (!separationPass(nodes, pos)) break
  }
}

// One separation pass: for every currently-overlapping pair, push both
// nodes apart along whichever axis (x or y) needs the least movement to
// clear the overlap, split evenly, capped at SEPARATION_STEP_CAP per node.
// Returns whether any overlap was found (used for the final cleanup's
// early exit). All pairs are evaluated against the pass's STARTING
// positions and moves are applied afterward, so resolving one pair in a
// pass never skews another pair's overlap check within that same pass.
//
// Exported so other layout engines (e.g. galaxyLayout) can reuse the same
// box-overlap resolution instead of duplicating it.
export function separationPass(nodes: readonly LayoutNode[], pos: Map<string, { x: number; y: number }>): boolean {
  let anyOverlap = false
  const moves = new Map<string, { x: number; y: number }>(nodes.map(n => [n.id, { x: 0, y: 0 }]))

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      if (a.pinned && b.pinned) continue
      const pa = pos.get(a.id)!
      const pb = pos.get(b.id)!
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const overlapX = (a.width + b.width) / 2 - Math.abs(dx)
      const overlapY = (a.height + b.height) / 2 - Math.abs(dy)
      if (overlapX <= 0 || overlapY <= 0) continue

      anyOverlap = true
      let pushX = 0
      let pushY = 0
      if (overlapX < overlapY) {
        pushX = (dx >= 0 ? 1 : -1) * overlapX
      } else {
        pushY = (dy >= 0 ? 1 : -1) * overlapY
      }
      let halfX = pushX / 2
      let halfY = pushY / 2
      const mag = Math.hypot(halfX, halfY)
      if (mag > SEPARATION_STEP_CAP) {
        const scale = SEPARATION_STEP_CAP / mag
        halfX *= scale
        halfY *= scale
      }

      if (a.pinned) {
        moves.get(b.id)!.x += halfX * 2
        moves.get(b.id)!.y += halfY * 2
      } else if (b.pinned) {
        moves.get(a.id)!.x -= halfX * 2
        moves.get(a.id)!.y -= halfY * 2
      } else {
        moves.get(a.id)!.x -= halfX
        moves.get(a.id)!.y -= halfY
        moves.get(b.id)!.x += halfX
        moves.get(b.id)!.y += halfY
      }
    }
  }

  for (const node of nodes) {
    if (node.pinned) continue
    const move = moves.get(node.id)!
    if (move.x === 0 && move.y === 0) continue
    const p = pos.get(node.id)!
    pos.set(node.id, { x: p.x + move.x, y: p.y + move.y })
  }
  return anyOverlap
}

// One spring-only relaxation step: spring force + damping, no repulsion or
// center gravity — lets edge lengths pull back toward springLength between
// separation passes without reintroducing the repulsion that created the
// overlaps' original equilibrium.
function relaxationStep(
  nodes: readonly LayoutNode[],
  edges: readonly LayoutEdge[],
  pos: Map<string, { x: number; y: number }>,
  vx: Map<string, number>,
  vy: Map<string, number>,
  nodeMap: Map<string, LayoutNode>,
  { restLength, springStrength, damping }: { restLength: (a: LayoutNode, b: LayoutNode) => number; springStrength: number; damping: number }
): void {
  for (const edge of edges) {
    const src = nodeMap.get(edge.source)
    const tgt = nodeMap.get(edge.target)
    if (!src || !tgt || (src.pinned && tgt.pinned)) continue
    const ps = pos.get(src.id)!
    const pt = pos.get(tgt.id)!
    const dx = pt.x - ps.x || 0.1
    const dy = pt.y - ps.y || 0.1
    const dist = Math.max(Math.hypot(dx, dy), 1)
    const force = springStrength * (dist - restLength(src, tgt))
    const fx = (dx / dist) * force
    const fy = (dy / dist) * force
    if (!src.pinned) { vx.set(src.id, vx.get(src.id)! + fx); vy.set(src.id, vy.get(src.id)! + fy) }
    if (!tgt.pinned) { vx.set(tgt.id, vx.get(tgt.id)! - fx); vy.set(tgt.id, vy.get(tgt.id)! - fy) }
  }
  for (const node of nodes) {
    if (node.pinned) continue
    const p = pos.get(node.id)!
    const nvx = vx.get(node.id)! * damping
    const nvy = vy.get(node.id)! * damping
    vx.set(node.id, nvx)
    vy.set(node.id, nvy)
    pos.set(node.id, { x: p.x + nvx, y: p.y + nvy })
  }
}
