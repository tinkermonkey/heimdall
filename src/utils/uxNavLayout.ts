import { hierarchy, tree } from 'd3-hierarchy'
import { buildStructuralForest, type HierarchyEdge } from './graphHierarchy'
import type { LayoutNode } from './graphLayout'

export interface UxNavLayoutOptions {
  rowSpacing?: number       // vertical gap between tree depth levels (default: ~80)
  columnSpacing?: number    // horizontal gap between sibling subtrees (default: ~60)
  viewFanGap?: number       // gap between page node and first view (default: ~40)
  viewSpacing?: number      // gap between adjacent views in a fan (default: ~20)
  trunkSpacing?: number     // gap between independent page trees (default: ~120)
}

/**
 * Tree layout engine for ux-navigation layout mode. Positions page nodes as independent
 * top-down trees and view nodes as horizontal fans attached to their parent pages.
 *
 * Algorithm:
 * Pass 1 — Page forest partitioning: Use buildStructuralForest to build hierarchy, filter to
 *          page nodes only (via isPageNode predicate)
 * Pass 2 — Page tree layout: For each independent page tree, use d3.tree() with nodeSize()
 *          configured for uniform spacing. Custom separation() accounts for view fan width.
 * Pass 3 — View fan placement: For each page, position its child views horizontally to the right
 */
export function uxNavLayout(
  nodes: readonly LayoutNode[],
  edges: readonly HierarchyEdge[],
  dims: ReadonlyMap<string, { width: number; height: number }>,
  isPageNode: (node: LayoutNode) => boolean,
  options: UxNavLayoutOptions = {},
): Map<string, { x: number; y: number }> {
  const {
    rowSpacing = 80,
    columnSpacing = 60,
    viewFanGap = 40,
    viewSpacing = 20,
    trunkSpacing = 120,
  } = options

  const result = new Map<string, { x: number; y: number }>()

  if (nodes.length === 0) return result

  // Pass 1: Build structural forest and filter to page nodes only
  const forest = buildStructuralForest(
    nodes.map(n => n.id),
    edges,
  )

  // Identify which nodes are pages vs views
  const pageIds = new Set(nodes.filter(n => isPageNode(n)).map(n => n.id))
  const viewIds = new Set(nodes.filter(n => !isPageNode(n)).map(n => n.id))

  // Filter the forest to page nodes only
  const pageRoots = forest.roots.filter(id => pageIds.has(id))
  const pageChildrenOf = new Map<string, string[]>()
  for (const [parentId, children] of forest.childrenOf) {
    if (!pageIds.has(parentId)) continue
    const pageChildren = children.filter(id => pageIds.has(id))
    if (pageChildren.length > 0) {
      pageChildrenOf.set(parentId, pageChildren)
    }
  }

  // Helper to get node dimensions
  const getNodeDim = (id: string): { width: number; height: number } => ({
    width: dims.get(id)?.width ?? 138,
    height: dims.get(id)?.height ?? 30,
  })

  // Helper to calculate view fan width for a page
  const getViewFanWidth = (pageId: string): number => {
    let width = 0
    const children = forest.childrenOf.get(pageId) ?? []
    const viewChildren = children.filter(id => viewIds.has(id))
    if (viewChildren.length === 0) return 0

    width += viewFanGap
    for (let i = 0; i < viewChildren.length; i++) {
      if (i > 0) width += viewSpacing
      width += getNodeDim(viewChildren[i]).width
    }
    return width
  }

  // Pass 2: Layout each root page tree using d3.tree()
  const pagePositions = new Map<string, { x: number; y: number }>()
  const treeBounds: Array<{ minX: number; maxX: number; minY: number; maxY: number }> = []

  for (const rootId of pageRoots) {
    // Build d3 hierarchy for page nodes (caller provides only visible nodes)
    const buildHierarchy = (id: string): any => {
      const children = pageChildrenOf.get(id) ?? []
      return {
        id,
        children: children.map(buildHierarchy),
      }
    }

    const treeData = buildHierarchy(rootId)
    const root = hierarchy(treeData)

    // Calculate spacing accounting for view fan width
    // d3.tree() with nodeSize([width, height]) sets the spacing between nodes
    // Use explicit separation function to account for view fans
    const nodeHeight = 100 + rowSpacing
    const nodeWidth = 200 + columnSpacing

    const treeLayout = tree<any>()
      .nodeSize([nodeWidth, nodeHeight])
      .separation((a, b) => {
        // Base separation: nodes at same depth should be spaced apart
        // Wider view fans need more horizontal clearance
        const aFanWidth = getViewFanWidth(a.data.id)
        const bFanWidth = getViewFanWidth(b.data.id)
        const aWidth = getNodeDim(a.data.id).width + aFanWidth
        const bWidth = getNodeDim(b.data.id).width + bFanWidth

        return (aWidth + bWidth) / nodeWidth + 0.5
      })

    treeLayout(root)

    // Extract positions from d3 hierarchy
    // d3.tree() provides x (horizontal spread within depth) and y (depth level)
    // For top-down layout: rendered_x = d3_x (horizontal spread), rendered_y = d3_y (depth)
    const treePositions = new Map<string, { x: number; y: number }>()
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

    root.each((node: any) => {
      const id = node.data.id
      // No swap: use d3 coordinates directly for top-down tree
      const x = node.x
      const y = node.y
      treePositions.set(id, { x, y })

      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    })

    treeBounds.push({ minX, maxX, minY, maxY })

    // Store positions temporarily for this tree
    for (const [id, pos] of treePositions) {
      pagePositions.set(id, pos)
    }
  }

  // Pass 2b: Arrange multiple independent trees top-aligned by bounding box
  let currentXOffset = 0

  for (let i = 0; i < pageRoots.length; i++) {
    const rootId = pageRoots[i]
    const bounds = treeBounds[i]

    if (!bounds) continue

    // Collect all nodes in this tree (before translation) to compute extent in d3 space
    const treeNodeIds = new Set<string>()
    const collectTreeNodes = (id: string) => {
      treeNodeIds.add(id)
      for (const childId of pageChildrenOf.get(id) ?? []) {
        collectTreeNodes(childId)
      }
    }
    collectTreeNodes(rootId)

    // Compute tree extent in d3 coordinate space (before translation)
    // Include view fan widths so adjacent trees don't overlap
    let maxTreeExtent = bounds.maxX
    for (const pageId of treeNodeIds) {
      const pos = pagePositions.get(pageId)
      if (pos) {
        const pageDim = getNodeDim(pageId)
        const fanWidth = getViewFanWidth(pageId)
        const rightExtent = pos.x + pageDim.width / 2 + fanWidth
        maxTreeExtent = Math.max(maxTreeExtent, rightExtent)
      }
    }

    const treeWidth = maxTreeExtent - bounds.minX

    // Translate this tree's positions
    const treeTranslateX = currentXOffset - bounds.minX
    const treeTranslateY = -bounds.minY // top-align all trees at y=0

    // Apply translation to all page nodes in this tree
    const updateTreePositions = (id: string) => {
      if (pagePositions.has(id)) {
        const pos = pagePositions.get(id)!
        pagePositions.set(id, {
          x: pos.x + treeTranslateX,
          y: pos.y + treeTranslateY,
        })
      }
      for (const childId of pageChildrenOf.get(id) ?? []) {
        updateTreePositions(childId)
      }
    }

    updateTreePositions(rootId)

    // Update offset for next tree
    currentXOffset += treeWidth + trunkSpacing
  }

  // Pass 3: View fan placement
  // Position view nodes horizontally to the right of their parent pages
  // For each page, place its view children as a horizontal fan
  for (const [pageId, viewChildren] of forest.childrenOf) {
    if (!pageIds.has(pageId)) continue

    const pagePos = pagePositions.get(pageId)
    if (!pagePos) continue

    const pageDim = getNodeDim(pageId)

    // Position each view child
    for (let i = 0; i < viewChildren.length; i++) {
      const viewId = viewChildren[i]
      if (!viewIds.has(viewId)) continue

      // Calculate horizontal position within the fan (starting from right edge of parent)
      let fanX = pagePos.x + pageDim.width / 2 + viewFanGap

      // Add widths of previous views
      for (let j = 0; j < i; j++) {
        const prevViewId = viewChildren[j]
        if (!viewIds.has(prevViewId)) continue
        const prevViewWidth = getNodeDim(prevViewId).width
        fanX += prevViewWidth + viewSpacing
      }

      // Views align vertically with their parent page
      result.set(viewId, { x: fanX, y: pagePos.y })
    }
  }

  // Add all page positions to result
  for (const [id, pos] of pagePositions) {
    result.set(id, pos)
  }

  return result
}
