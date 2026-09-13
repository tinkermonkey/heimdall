import type { StructuralForest } from './graphHierarchy'
import type { GraphEdge } from '../components/GraphCanvas'

/**
 * Determines which navigation-route edges are visible based on hover and expansion state.
 *
 * Navigation routes (non-structural edges in ux-navigation layout) are hidden by default
 * and only become visible when hovering a page or view node. Different edge sets are shown
 * depending on whether the hovered node is:
 * - A collapsed page: shows routes from the page + its child views, not descendant sub-pages
 * - An expanded page: shows only routes directly attributed to the page
 * - A view: shows only routes directly attributed to that view
 *
 * @param edges - All edges in the graph
 * @param hoveredNodeId - Currently hovered node ID, or undefined for no hover
 * @param isPageNode - Predicate to identify page nodes (vs. view nodes)
 * @param isNavigationRoute - Predicate to identify navigation-route edges
 * @param forest - Structural hierarchy from buildStructuralForest
 * @param collapsedNodeIds - Set of currently collapsed node IDs
 * @returns Set of navigation-route edge IDs that should be visible
 */
export function visibleNavigationEdgeIds(
  edges: readonly GraphEdge[],
  hoveredNodeId: string | undefined,
  isPageNode: (nodeId: string) => boolean,
  isNavigationRoute: (edge: GraphEdge) => boolean,
  forest: StructuralForest,
  collapsedNodeIds?: ReadonlySet<string>,
): Set<string> {
  const visible = new Set<string>()

  // No hover → no navigation routes visible
  if (!hoveredNodeId) return visible

  // For each navigation route edge, determine if it should be visible based on:
  // - Which node it's attributed to
  // - Whether that node is in the "source set" (visible set of nodes for this hover)
  for (const edge of edges) {
    if (!isNavigationRoute(edge)) continue

    // Assume an edge is attributed to its source node (page/view that "owns" the route)
    const attributedNodeId = edge.sourceId
    if (!attributedNodeId) continue

    // Compute the "source set" for the hovered node
    const sourceSet = computeNavigationSourceSet(
      hoveredNodeId,
      isPageNode,
      forest,
      collapsedNodeIds,
    )

    if (sourceSet.has(attributedNodeId)) {
      visible.add(edge.id)
    }
  }

  return visible
}

/**
 * Computes the set of nodes whose navigation routes should be visible when hovering
 * a given node. The "source set" depends on whether the hovered node is a page or view,
 * and whether a page's view subtree is expanded or collapsed.
 *
 * Rules:
 * - Hovering a view: source set = {view}
 * - Hovering a collapsed page: source set = {page} ∪ child views (not descendant sub-pages)
 * - Hovering an expanded page: source set = {page}
 */
function computeNavigationSourceSet(
  hoveredNodeId: string,
  isPageNode: (nodeId: string) => boolean,
  forest: StructuralForest,
  collapsedNodeIds?: ReadonlySet<string>,
): Set<string> {
  const sourceSet = new Set<string>()
  sourceSet.add(hoveredNodeId)

  // Only pages can have child views to include; views don't
  if (!isPageNode(hoveredNodeId)) return sourceSet

  // Only include child views if the page is collapsed
  const isCollapsed = collapsedNodeIds?.has(hoveredNodeId) ?? false
  if (!isCollapsed) return sourceSet

  // Collapsed page: add child views (but not descendant sub-pages)
  const children = forest.childrenOf.get(hoveredNodeId) ?? []
  for (const childId of children) {
    if (!isPageNode(childId)) {
      // It's a view node, include it
      sourceSet.add(childId)
    }
  }

  return sourceSet
}
