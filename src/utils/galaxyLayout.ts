import { separationPass, type LayoutNode } from './graphLayout'
import { buildStructuralForest } from './graphHierarchy'

export interface GalaxyLayoutNode {
  id: string
  width: number
  height: number
  /** Explicit position pins the node in place — same convention as forceLayout. */
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
}

/**
 * Positions nodes as a radial hierarchy of orbits — a "galaxy": each node's children are spread
 * evenly around a full circle centered on it (not fanned away from it, the way a typical radial
 * tree layout works), offset by the parent's own angle so descendants read as a loose spiral
 * rather than straight spokes. Only `structural` edges shape that hierarchy; other edges are
 * layout-irrelevant (callers still render them — see GraphCanvas's isStructuralEdge prop).
 *
 * A node with no structural parent (including one connected only by non-structural edges, or
 * not connected at all) becomes its own root and gets an orbit of its own around the shared
 * center, same as any other root.
 *
 * The radial position is a "home" the node settles near, not a fixed slot: after the initial
 * placement, nodes alternate capped collision separation (shared with forceLayout) with a
 * gentle pull back toward home, so dense orbits spread just enough to avoid overlap without
 * drifting off their ring.
 */
export function galaxyLayout(
  nodes: readonly GalaxyLayoutNode[],
  edges: readonly GalaxyLayoutEdge[],
  options: GalaxyLayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    nodeSpread = 3.2,
    startAngle = -Math.PI / 2,
    settleCycles = 24,
    homeStrength = 0.18,
  } = options

  if (nodes.length === 0) return new Map()

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const radiusOf = (n: GalaxyLayoutNode) => Math.hypot(n.width, n.height) / 2

  const { childrenOf, roots } = buildStructuralForest(nodes.map(n => n.id), edges)

  // Recursively compute each node's orbital home position. Children spread evenly around a
  // full circle centered on their parent (not a half-arc fanned away from it — that full-circle
  // spread plus the parent-angle offset below is what gives the layout its "galaxy arm" look
  // instead of reading as a plain radial org chart).
  const home = new Map<string, { x: number; y: number }>()
  const place = (id: string, cx: number, cy: number, angle: number, depth: number): void => {
    home.set(id, { x: cx, y: cy })
    const kids = childrenOf.get(id) ?? []
    const n = kids.length
    if (n === 0) return
    const r = radiusOf(nodeMap.get(id)!)
    kids.forEach((childId, i) => {
      const childR = radiusOf(nodeMap.get(childId)!)
      const distance = r + childR * nodeSpread
      // Even sibling counts below the root ring get a half-slot rotation so a child never lands
      // directly opposite its own parent-facing edge into the grandparent.
      const parity = n % 2 === 0 && depth > 0 ? Math.PI / n : 0
      const childAngle = angle + (2 * Math.PI * i) / n + parity
      place(childId, cx + distance * Math.cos(childAngle), cy + distance * Math.sin(childAngle), childAngle, depth + 1)
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

  // Settle: start every unpinned node at its home position, then alternate capped collision
  // separation (shared with forceLayout) with a gentle pull back toward home so orbits spread
  // just enough to clear overlap without drifting off their ring.
  const pos = new Map<string, { x: number; y: number }>(
    nodes.map(n => [n.id, n.pinned && n.x !== undefined && n.y !== undefined ? { x: n.x, y: n.y } : home.get(n.id)!])
  )
  // separationPass only reads id/width/height/pinned off each node — x/y live in `pos`.
  const separationNodes: LayoutNode[] = nodes.map(n => ({ id: n.id, width: n.width, height: n.height, pinned: n.pinned, x: 0, y: 0 }))

  for (let cycle = 0; cycle < settleCycles; cycle++) {
    separationPass(separationNodes, pos)
    for (const node of nodes) {
      if (node.pinned) continue
      const p = pos.get(node.id)!
      const h = home.get(node.id)!
      pos.set(node.id, { x: p.x + (h.x - p.x) * homeStrength, y: p.y + (h.y - p.y) * homeStrength })
    }
  }
  for (let pass = 0; pass < 50; pass++) {
    if (!separationPass(separationNodes, pos)) break
  }

  return pos
}
