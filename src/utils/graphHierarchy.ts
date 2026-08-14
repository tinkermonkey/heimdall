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

/** BFS descendant closure of a node's structural children, not including the node itself. */
export function structuralDescendants(id: string, childrenOf: ReadonlyMap<string, string[]>): Set<string> {
  const result = new Set<string>()
  const queue = [...(childrenOf.get(id) ?? [])]
  while (queue.length > 0) {
    const next = queue.shift()!
    if (result.has(next)) continue
    result.add(next)
    queue.push(...(childrenOf.get(next) ?? []))
  }
  return result
}
