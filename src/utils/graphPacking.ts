// Thin wrapper around d3-hierarchy's circle-packing layout, turning a
// graphClustering.ts dendrogram into concrete x/y/r for every node — both
// leaves (real graph nodes) and internal ids (cluster boundary circles).
//
// Uses pack().radius() with an explicit per-leaf radius rather than the
// more common pack().size()+.sum(value) form: an explicit radius accessor
// packs leaves at their true rendered size and lets the layout's own
// bounding circles grow to fit (see d3-hierarchy docs: "the radius
// accessor has priority over the value accessor", and size() only matters
// when radius() is unset). That's what actually gives clustering its
// "increase overall size" property for free — d3.pack adds exactly the
// space nesting + padding needs, no manual canvas-size tuning required.
import { hierarchy, pack as d3pack } from 'd3-hierarchy'
import type { ClusterTreeNode } from './graphClustering.ts'

export interface PackedCircle {
  x: number
  y: number
  r: number
}

export interface PackOptions {
  /** Radius for a leaf node, by its original graph node id. */
  radiusOf: (leafId: string) => number
  /**
   * Gap between sibling circles at any depth. A plain number, or a
   * function of hierarchy depth (root = 0) for e.g. tighter padding deep
   * in the tree. Default 6 — comparable to graphLayout.ts's own
   * SEPARATION_STEP_CAP, small relative to typical node size.
   */
  padding?: number | ((depth: number) => number)
}

const DEFAULT_PADDING = 6

/**
 * Packs `tree` (root + nested clusters + leaves, as produced by
 * louvainCluster) into non-overlapping nested circles. Returns every
 * node's circle — leaves keyed by their original graph node id, internal
 * clusters keyed by their synthetic cluster id (including the root) — so
 * callers can use leaf entries as node target positions and internal
 * entries to draw bubble boundaries.
 */
export function packClusters(tree: ClusterTreeNode, options: PackOptions): Map<string, PackedCircle> {
  const { radiusOf, padding = DEFAULT_PADDING } = options

  const layout = d3pack<ClusterTreeNode>().radius(node => (node.children ? 0 : radiusOf(node.data.id)))
  if (typeof padding === 'function') {
    layout.padding(node => padding(node.depth))
  } else {
    layout.padding(padding)
  }
  const packedRoot = layout(hierarchy(tree))

  const circles = new Map<string, PackedCircle>()
  packedRoot.each(node => {
    circles.set(node.data.id, { x: node.x, y: node.y, r: node.r })
  })
  return circles
}
