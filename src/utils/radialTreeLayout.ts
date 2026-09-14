import { hierarchy, tree as d3tree, packSiblings, type HierarchyNode } from 'd3-hierarchy'
import { buildStructuralForest, type HierarchyEdge, type StructuralForest } from './graphHierarchy'
import { separationPass, type LayoutNode } from './graphLayout'

export interface RadialTreeLayoutOptions {
  /** Ring spacing multiplier — controls radial distance per depth level. Default 80. */
  ringSpacing?: number
  /** Gap between sibling nodes at the same depth. Default 4. */
  nodeSeparationGap?: number
  /** Padding around trunk bubbles during packing. Default 6. */
  trunkPadding?: number
}

export interface RingGeometry {
  trunkId: string
  cx: number
  cy: number
  r: number
  depth: number
}

export interface RadialTreeLayoutResult {
  positions: Map<string, { x: number; y: number }>
  trunkBoundaries: Map<string, { x: number; y: number; r: number }>
  ringGeometry: RingGeometry[]
}

/**
 * Radial tree layout engine for hierarchical graph visualization.
 *
 * For each trunk (root + descendants):
 * 1. Sizing pass: compute bubble radius from fully expanded tree structure (using forest)
 * 2. Placement pass: compute positions for visible nodes with polar-to-Cartesian conversion
 * 3. Pack all trunk bubbles without overlap
 * 4. Apply separation pass as final overlap resolution
 *
 * @param visibleNodes - Only currently visible (non-collapsed) nodes for placement
 * @param edges - All edges (both structural and relational)
 * @param dims - Measured dimensions for each node
 * @param fullForest - Structural forest from ALL nodes (used for sizing pass)
 * @param options - Layout configuration
 */
export function radialTreeLayout(
  visibleNodes: readonly LayoutNode[],
  edges: readonly HierarchyEdge[],
  dims: ReadonlyMap<string, { width: number; height: number }>,
  fullForest: StructuralForest,
  options: RadialTreeLayoutOptions = {},
): RadialTreeLayoutResult {
  const {
    ringSpacing = 80,
    nodeSeparationGap = 4,
    trunkPadding = 6,
  } = options

  const result: RadialTreeLayoutResult = {
    positions: new Map(),
    trunkBoundaries: new Map(),
    ringGeometry: [],
  }

  if (visibleNodes.length === 0) return result

  const forest = fullForest
  const visibleNodeMap = new Map(visibleNodes.map(n => [n.id, n]))
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id))

  // Helper: get dimensions for a node
  const getDims = (id: string): { width: number; height: number } =>
    dims.get(id) ?? { width: 40, height: 40 }

  // Helper: collect all descendants of a node (including the node itself)
  const getAllDescendants = (id: string): Set<string> => {
    const result = new Set<string>([id])
    const queue = [id]
    let head = 0
    while (head < queue.length) {
      const current = queue[head++]
      const children = forest.childrenOf.get(current) ?? []
      for (const child of children) {
        if (!result.has(child)) {
          result.add(child)
          queue.push(child)
        }
      }
    }
    return result
  }

  // Helper: custom separation function that accounts for node sizes
  const createSeparationFunction = () => {
    return (a: HierarchyNode<any>, b: HierarchyNode<any>): number => {
      if (a.depth !== b.depth) return 1
      if (a.parent !== b.parent) return 1

      const aW = getDims(a.data.id).width
      const bW = getDims(b.data.id).width

      const depth = a.depth
      const radius = Math.max(40, depth * ringSpacing)
      const circumference = 2 * Math.PI * Math.max(radius, 1)

      // Angular space needed for the two nodes plus gap
      const nodeArcA = aW / circumference
      const nodeArcB = bW / circumference
      const gapArc = nodeSeparationGap / circumference

      // Total angular separation needed
      const totalNeeded = nodeArcA + nodeArcB + gapArc
      const treeSize = 2 * Math.PI
      const siblingCount = Math.max(a.parent?.children?.length ?? 1, 1)

      // Return separation multiplier
      return Math.max(1, totalNeeded / (treeSize / siblingCount))
    }
  }

  // Helper: layout a single trunk with d3.tree()
  interface LayoutPassResult {
    positions: Map<string, { x: number; y: number }>
    maxRadius: number
    ringRadii: Map<number, number>
  }

  const layoutTrunk = (rootId: string, useVisibleOnly: boolean): LayoutPassResult => {
    const result: LayoutPassResult = {
      positions: new Map(),
      maxRadius: 0,
      ringRadii: new Map(),
    }

    // Build d3 hierarchy for this trunk
    const buildHierarchy = (id: string): any => {
      const children = forest.childrenOf.get(id) ?? []
      const filteredChildren = useVisibleOnly
        ? children.filter(childId => visibleNodeIds.has(childId))
        : children

      return {
        id,
        children: filteredChildren.length > 0 ? filteredChildren.map(buildHierarchy) : undefined,
      }
    }

    const treeData = buildHierarchy(rootId)
    const root = hierarchy(treeData)

    // Compute max radius based on tree size
    // For sizing pass, estimate from all descendants; for placement pass, use visible count
    let nodeCount = 0
    root.each(() => { nodeCount++ })
    const maxRadius = Math.max(nodeCount * ringSpacing, 300)

    // Create tree layout with polar coordinates
    const treeLayout = d3tree<any>()
      .size([2 * Math.PI, maxRadius])
      .separation(createSeparationFunction())

    treeLayout(root)

    // Extract positions with polar-to-Cartesian conversion
    const depthLevels = new Map<number, number[]>()

    root.each((node: HierarchyNode<any>) => {
      const id = node.data.id
      const angle = node.x // 0 to 2π
      const radius = Math.max(0, node.y) // 0 to maxRadius

      // Track occupied depths
      if (!depthLevels.has(node.depth)) {
        depthLevels.set(node.depth, [])
      }
      depthLevels.get(node.depth)!.push(radius)

      result.maxRadius = Math.max(result.maxRadius, radius)

      // Convert polar to Cartesian
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)
      result.positions.set(id, { x, y })
    })

    // Compute ring radii
    for (const [depth, radii] of depthLevels) {
      result.ringRadii.set(depth, Math.max(...radii))
    }

    return result
  }

  // Phase 1: Sizing pass — compute bubble radius for each trunk
  interface TrunkBubble {
    rootId: string
    radius: number
  }

  const trunks = forest.roots
  const trunkBubbles: TrunkBubble[] = trunks.map(rootId => {
    const layoutResult = layoutTrunk(rootId, false)

    let radius = layoutResult.maxRadius
    if (layoutResult.maxRadius === 0) {
      const nodeDims = getDims(rootId)
      radius = Math.hypot(nodeDims.width, nodeDims.height) / 2 + 10
    }

    return { rootId, radius }
  })

  // Phase 2: Pack trunk bubbles without overlap
  const packedTrunks = packSiblings(
    trunkBubbles.map(b => ({ r: b.radius })),
  )

  const trunkOffsets = new Map<string, { x: number; y: number }>()
  for (let i = 0; i < trunks.length; i++) {
    trunkOffsets.set(trunks[i], {
      x: packedTrunks[i].x,
      y: packedTrunks[i].y,
    })
  }

  // Phase 3: Placement pass — position visible nodes
  const allPositions = new Map<string, { x: number; y: number }>()

  for (let i = 0; i < trunks.length; i++) {
    const rootId = trunks[i]
    const layoutResult = layoutTrunk(rootId, true)
    const offset = trunkOffsets.get(rootId)!

    // Offset positions by trunk's packed center
    for (const [id, pos] of layoutResult.positions) {
      allPositions.set(id, {
        x: pos.x + offset.x,
        y: pos.y + offset.y,
      })
    }

    // Record ring geometry
    const bubble = trunkBubbles[i]
    for (const [depth, radius] of layoutResult.ringRadii) {
      result.ringGeometry.push({
        trunkId: rootId,
        cx: offset.x,
        cy: offset.y,
        r: radius,
        depth,
      })
    }

    // Record trunk boundary
    result.trunkBoundaries.set(rootId, {
      x: offset.x,
      y: offset.y,
      r: bubble.radius,
    })
  }

  // Phase 4: Final separation pass
  const layoutNodesForSeparation = visibleNodes.filter(n => allPositions.has(n.id))
  separationPass(layoutNodesForSeparation, allPositions)

  result.positions = allPositions

  return result
}
