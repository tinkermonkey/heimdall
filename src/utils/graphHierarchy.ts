export interface HierarchyEdge {
  source: string
  target: string
  /** Only structural edges (source = parent, target = child) shape the hierarchy. */
  structural: boolean
}

export interface StructuralForest {
  parentOf: Map<string, string>
  childrenOf: Map<string, string[]>
  roots: string[]
}

/**
 * Builds a parent/child forest from structural edges only (source = parent, target = child). A
 * target reachable via multiple structural edges keeps the first one seen — the edge list order
 * is the caller's tie-break. Structural cycles are broken by promoting one node per cycle to a
 * root, so every node ends up reachable from some root. Shared by galaxyLayout (to compute
 * orbital placement) and GraphCanvas (to compute collapse/expand affordances and hidden sets).
 */
export function buildStructuralForest(nodeIds: readonly string[], edges: readonly HierarchyEdge[]): StructuralForest {
  const idSet = new Set(nodeIds)
  const parentOf = new Map<string, string>()
  const childrenOf = new Map<string, string[]>()
  for (const edge of edges) {
    if (!edge.structural) continue
    if (edge.source === edge.target) continue
    if (!idSet.has(edge.source) || !idSet.has(edge.target)) continue
    if (parentOf.has(edge.target)) continue
    parentOf.set(edge.target, edge.source)
    const siblings = childrenOf.get(edge.source)
    if (siblings) siblings.push(edge.target)
    else childrenOf.set(edge.source, [edge.target])
  }

  const roots: string[] = nodeIds.filter(id => !parentOf.has(id))
  const visited = new Set<string>()
  const visit = (id: string): void => {
    if (visited.has(id)) return
    visited.add(id)
    for (const child of childrenOf.get(id) ?? []) visit(child)
  }
  roots.forEach(visit)

  // Every node has at most one parent, so a chain that never reaches a root must eventually
  // repeat — i.e. it's a structural cycle. Break each remaining cycle by promoting one of its
  // nodes to a root; the freed node's own subtree becomes reachable on the next visit() below.
  for (const id of nodeIds) {
    if (visited.has(id)) continue
    const parent = parentOf.get(id)
    if (parent !== undefined) {
      parentOf.delete(id)
      const siblings = childrenOf.get(parent)
      if (siblings) childrenOf.set(parent, siblings.filter(childId => childId !== id))
    }
    roots.push(id)
    visit(id)
  }

  return { parentOf, childrenOf, roots }
}

/**
 * Top-level "group head" ids for the galaxy layout's boundary-circle grouping: a root with
 * *more than one* child delegates its group-headship to each of its own children (so a bushy root
 * still reads as several groups instead of one all-encompassing circle around everything); a
 * childless root, OR a root with exactly one child, has nothing genuinely separate to delegate to
 * and stays its own group head. The single-child case matters, not just the childless one: a root
 * with exactly one child only has one branch anyway, so delegating to that lone child produces
 * exactly the same one-group outcome as not delegating — except the root itself, having no
 * structural PARENT, is never anyone's *descendant* either, so it would be the one node left out
 * of every group's `leafToGroup` entry entirely. Group-separation's macro pass only ever
 * translates nodes it can find a group for, so an excluded root stays frozen at its own computeHome
 * position while its now-independently-grouped child subtree gets rigidly shifted to resolve
 * overlap with other groups — visibly severing a root from the very child it's directly
 * structurally connected to, worse the more that subtree's group actually needs to move. Shared by
 * galaxyLayout (to keep group boundaries from overlapping each other) and GraphCanvas (to render
 * them via showClusterBoundaries) so both always agree on the same grouping.
 */
export function galaxyGroupHeads(roots: readonly string[], childrenOf: ReadonlyMap<string, string[]>): string[] {
  return roots.flatMap(rootId => {
    const kids = childrenOf.get(rootId)
    return kids && kids.length > 1 ? kids : [rootId]
  })
}

/** BFS descendant closure of a node's structural children, not including the node itself. */
export function structuralDescendants(id: string, childrenOf: ReadonlyMap<string, string[]>): Set<string> {
  const result = new Set<string>()
  const queue = [...(childrenOf.get(id) ?? [])]
  let head = 0
  while (head < queue.length) {
    const next = queue[head++]
    if (result.has(next)) continue
    result.add(next)
    queue.push(...(childrenOf.get(next) ?? []))
  }
  return result
}

/**
 * The full galaxy-layout group mapping: `galaxyGroupHeads`'s head ids, plus every node — including
 * a *delegating* multi-child root — mapped to its group. `galaxyGroupHeads` deliberately excludes a
 * bushy root from being its own group's head (splitting it into one group per child instead), but
 * that root is nobody's structural descendant either (it has no parent), so left unmapped it would
 * be the one node no group's rigid translation ever carries along — stranded at its own computeHome
 * position while every one of its children's subtrees moves out from under it during group
 * separation (the same failure `galaxyGroupHeads`'s own docs describe for the single-child case,
 * which delegating only when a root has *more than one* child already avoids — this covers the
 * remaining multi-child case). Assigned here to its first child's group — the same "first edge
 * wins" tie-break `buildStructuralForest` already uses for ambiguous structural ownership — so it
 * travels with one real group instead of belonging to none.
 *
 * Every caller that needs `leafToGroup` for galaxy layout should build it through this function
 * rather than re-deriving the head+descendants loop inline — that duplication (six call sites,
 * pre-fix) is exactly how the multi-child-root gap went unnoticed.
 */
export function galaxyGroupMap(
  roots: readonly string[],
  childrenOf: ReadonlyMap<string, string[]>
): { groupHeads: string[]; leafToGroup: Map<string, string> } {
  const groupHeads = galaxyGroupHeads(roots, childrenOf)
  const leafToGroup = new Map<string, string>()
  for (const headId of groupHeads) {
    leafToGroup.set(headId, headId)
    for (const descendantId of structuralDescendants(headId, childrenOf)) leafToGroup.set(descendantId, headId)
  }
  for (const rootId of roots) {
    if (leafToGroup.has(rootId)) continue
    const firstChild = childrenOf.get(rootId)?.[0]
    const group = firstChild !== undefined ? leafToGroup.get(firstChild) : undefined
    if (group !== undefined) leafToGroup.set(rootId, group)
  }
  return { groupHeads, leafToGroup }
}
