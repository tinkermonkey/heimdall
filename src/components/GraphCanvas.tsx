import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo, useId } from 'react'
import { computeEdgePath, computeFitViewport, edgeLabelSize, findClearLabelPosition, type BoundingBox, type EdgeAnchor } from '../utils/graph'
import { forceLayout, clusteredForceLayout, boundingCirclesByGroup } from '../utils/graphLayout'
import { galaxyLayout } from '../utils/galaxyLayout'
import { buildStructuralForest, structuralDescendants } from '../utils/graphHierarchy'
import { usePanZoom } from '../hooks/usePanZoom'
import { GraphCanvasContext, useGraphCanvas } from './GraphCanvasContext'
import GraphNode from './GraphNode'
import { GraphEdgeShape } from './GraphEdgeShape'
import { GraphToolbar, type GraphToolbarPosition } from './GraphToolbar'
import './GraphCanvas.css'
import './GraphEdge.css'

export type { GraphCanvasContextValue } from './GraphCanvasContext'
export { useGraphCanvas } from './GraphCanvasContext'

// ─── Public data types ────────────────────────────────────────────────────────

export interface GraphNodeData {
  id: string
  label: string
  kind?: string
  domainColor?: string
  /** Explicit position. When omitted with layout="force", the engine places the node. */
  x?: number
  y?: number
}

export interface GraphEdge {
  id: string
  sourceId: string
  targetId: string
  label?: string
  variant?: 'default' | 'hot' | 'irrelevant'
  /** 0-100. Maps to a 1-8px stroke width via a square-root curve. Unset renders the current variant default. */
  weight?: number
  /** 0-1. Applied to the line and arrow marker independently of the label background. Default 1. */
  opacity?: number
  /** A single number (equal dash/gap) or a [dash, gap] tuple. Overrides variant-based dashing. */
  strokeDash?: number | [number, number]
  /** Pins the source endpoint to a side of the node instead of facing the target's center. Default 'auto'. */
  sourceAnchor?: EdgeAnchor
  /** Pins the target endpoint to a side of the node instead of facing the source's center. Default 'auto'. */
  targetAnchor?: EdgeAnchor
  /** Overrides the default curve strength (0.22, used for both auto/auto and anchored endpoints). */
  curvature?: number
}

/** Props that a custom node component receives from renderNode. */
export interface BaseGraphNodeComponentProps {
  id: string
  label: string
  selected?: boolean
  onSelect?: (id: string) => void
}

/**
 * Hierarchy info passed as renderNode's third argument, derived from structural edges (see
 * GraphCanvas's isStructuralEdge). Lets a custom node renderer show a collapse/expand affordance
 * without recomputing the hierarchy itself. Only meaningful when the caller also passes
 * onToggleCollapse — without it there's nothing to toggle, so onToggleCollapse is undefined.
 */
export interface GraphNodeHierarchyMeta {
  /** Whether this node has at least one structural child. */
  hasChildren: boolean
  /** Whether this node is currently in collapsedNodeIds. */
  collapsed: boolean
  /** Total structural descendants currently hidden because this node is collapsed. 0 when expanded. */
  hiddenDescendantCount: number
  /** Toggles this node's collapsed state. Undefined if the caller didn't pass onToggleCollapse. */
  onToggleCollapse?: () => void
}

// ─── Internal edge component ──────────────────────────────────────────────────

const DEFAULT_NODE_W = 138
const DEFAULT_NODE_H = 30
// Wide by default — a caller with a graph that spans thousands of px should be able to zoom out
// far enough to see it all in frame. Narrower limits are still useful (e.g. a small fixed-size
// diagram where zooming out past the content is pointless), so both are also exposed as props.
const DEFAULT_MIN_ZOOM = 0.05
const DEFAULT_MAX_ZOOM = 8
// Screen-space pixels of pointer movement before a node pointerdown is treated as a drag rather
// than a click — below this, it's just an imprecise click and should still fire onSelect.
const DRAG_THRESHOLD = 3

type InternalEdgeProps = GraphEdge & {
  selected?: boolean
  onSelect?: (id: string) => void
}

// Margin (px, in graph space) kept clear around an edge label when steering it away from nodes.
const EDGE_LABEL_MARGIN = 6

function GraphEdgeInternal({
  id,
  sourceId,
  targetId,
  label,
  variant = 'default',
  weight,
  opacity,
  strokeDash,
  sourceAnchor,
  targetAnchor,
  curvature,
  selected,
  onSelect,
}: InternalEdgeProps) {
  const { getNodeRect, nodeRects } = useGraphCanvas()

  const result = useMemo(() => {
    const src = getNodeRect(sourceId)
    const tgt = getNodeRect(targetId)
    if (!src || !tgt) return null
    const path = computeEdgePath(src, tgt, { sourceAnchor, targetAnchor, curvature })
    const labelPos = label
      ? findClearLabelPosition(path.points, edgeLabelSize(label), nodeRects, EDGE_LABEL_MARGIN)
      : path.mid
    return { ...path, labelPos }
  }, [getNodeRect, sourceId, targetId, sourceAnchor, targetAnchor, curvature, label, nodeRects])

  if (!result) return null

  const classNames = ['graph-edge', variant !== 'default' && `graph-edge--${variant}`, selected && 'selected']
    .filter(Boolean)
    .join(' ')
  const interactive = !!onSelect
  return (
    <g
      className={classNames}
      role={interactive ? 'button' : 'presentation'}
      aria-hidden={interactive ? undefined : true}
      aria-pressed={interactive ? !!selected : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect!(id) } } : undefined}
      data-testid={`graph-edge-${id}`}
    >
      <GraphEdgeShape
        id={id}
        d={result.d}
        mid={result.labelPos}
        label={label}
        variant={variant}
        weight={weight}
        opacity={opacity}
        strokeDash={strokeDash}
        onSelect={onSelect}
      />
    </g>
  )
}

// ─── GraphCanvas ──────────────────────────────────────────────────────────────

export interface GraphCanvasProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  nodes: GraphNodeData[]
  edges?: GraphEdge[]
  selectedNodeId?: string
  onNodeSelect?: (nodeId: string) => void
  /**
   * Render the HTML content for each node. GraphCanvas wraps it in a foreignObject
   * and positions it via an SVG <g> transform. If omitted, the default GraphNode is used.
   * The third argument carries structural-hierarchy info (see GraphNodeHierarchyMeta) — read it
   * to render your own collapse/expand affordance; ignore it if you don't need one.
   *
   * Tip: memoize with useCallback to avoid unnecessary re-measurements.
   */
  renderNode?: (node: GraphNodeData, selected: boolean, hierarchy?: GraphNodeHierarchyMeta) => React.ReactNode
  /** 'manual' relies on explicit x/y per node. 'force' runs a spring layout for nodes without
   *  explicit coordinates. 'galaxy' arranges nodes as a radial hierarchy of orbits, built from
   *  structural edges (see isStructuralEdge). 'force-clustered' additionally groups nodes into
   *  nested bubbles by graph structure (see clusteredForceLayout in utils/graphLayout) before
   *  running the same spring simulation within each bubble — larger canvas, less-even
   *  distribution, by design. Nodes with x and y are pinned under any of these layouts.
   *  'galaxy' and 'force-clustered' both draw a boundary circle per top-level group (see
   *  showClusterBoundaries) — one per root subtree for 'galaxy', one per top-level Louvain
   *  cluster for 'force-clustered'. */
  layout?: 'manual' | 'force' | 'galaxy' | 'force-clustered'
  /**
   * layout="force" | "galaxy". Extra breathing room kept clear around each node's own footprint,
   * on top of what's needed to just avoid overlap — this is what leaves room for an edge to be
   * visible between two connected nodes instead of their boxes settling nearly flush, which with
   * substantial cards (renderNode content) could otherwise read as if edges were missing
   * entirely. Defaults differ by engine: "force" defaults to each node's own rendered width
   * (scales sensibly for both compact chips and larger cards with no configuration — see
   * ForceLayoutOptions.nodeMargin); "galaxy" defaults to 0 (unpadded) since its nodeSpread-based
   * placement already spaces most of the layout generously, and defaulting this on would shift
   * every existing galaxy layout's node positions for a fix to a narrow edge case — see
   * GalaxyLayoutOptions.nodeMargin. Pass a fixed number for either engine to use the same margin
   * for every node.
   */
  nodeMargin?: number
  /**
   * layout="galaxy" | "force-clustered" only, no effect otherwise. Shows a `.graph-cluster-boundary`
   * circle around each top-level group the engine produced — galaxy's independent root subtrees,
   * or force-clustered's top-level Louvain clusters — same visual language either way, so a
   * caller can switch between the two engines without the "what groups with what" affordance
   * disappearing. Default true (matches force-clustered's behavior before this prop existed).
   */
  showClusterBoundaries?: boolean
  /**
   * Classifies an edge as structural (defines the galaxy layout's parent/child hierarchy,
   * source = parent) vs. relational (rendered but layout-irrelevant). Only meaningful with
   * layout="galaxy". When omitted, every edge is treated as structural — the same as before
   * this prop existed.
   *
   * Also controls edge visibility: with this prop set, a non-structural edge (line, marker, and
   * label alike) doesn't render at all unless it touches the hovered or selected node, or
   * showAllRelations is set — it's not just dimmed, so it also isn't clickable while hidden. This
   * works under any layout, not just "galaxy".
   */
  isStructuralEdge?: (edge: GraphEdge) => boolean
  /** When isStructuralEdge is set, renders every non-structural edge instead of hiding it (see
   *  isStructuralEdge). Default false. No effect without isStructuralEdge. */
  showAllRelations?: boolean
  /**
   * IDs of nodes whose structural descendants (per isStructuralEdge; every edge counts as
   * structural if it's omitted) should be hidden — progressive disclosure for dense hierarchies.
   * The collapsed node itself still renders; only its subtree (nodes and any edge touching one)
   * disappears. Controlled: GraphCanvas doesn't track this itself, so pair it with
   * onToggleCollapse or nothing will change when a node's toggle is clicked.
   */
  collapsedNodeIds?: ReadonlySet<string>
  /** Called with a node's ID when its collapse/expand affordance is activated (default GraphNode's
   *  toggle, or read from renderNode's GraphNodeHierarchyMeta for a custom one). Toggling is the
   *  caller's responsibility — update collapsedNodeIds in response. */
  onToggleCollapse?: (nodeId: string) => void
  /** Zoom out/in on first layout so the full node bounding box fits within the container. Default false. */
  fitView?: boolean
  /** Padding in px around the fitted bounding box when fitView is enabled. Default 40. */
  fitPadding?: number
  /** Lower zoom bound. Default 0.05 — deliberately permissive so a large graph can always be
   *  zoomed out far enough to fit in frame. Narrow it for a small fixed-size diagram instead. */
  minZoom?: number
  /** Upper zoom bound. Default 8. */
  maxZoom?: number
  /** IDs of selected edges — draws each in the accent color. Pair with onEdgeSelect. */
  selectedEdgeId?: string
  /** Called with an edge's ID when its line or label is clicked. Wires up hit targets on both;
   *  without it, edges render but aren't interactive. */
  onEdgeSelect?: (edgeId: string) => void
  /** Called when the canvas background — not a node, not an edge — is clicked: the typical
   *  "click empty space to deselect" gesture. Pair with clearing selectedNodeId/selectedEdgeId
   *  (and closing a detail panel driven by them) yourself; GraphCanvas doesn't do either on its
   *  own since both are controlled props. A genuine pan drag never fires this — only a press and
   *  release within a few px of each other counts as a click. */
  onBackgroundClick?: () => void
  /** Lets a node be repositioned by dragging it. Default true. The dropped position persists
   *  locally (overriding explicit x/y or the computed layout position) until the node list
   *  changes; it isn't written back to the nodes prop. Pair with onNodeDragEnd to persist it
   *  yourself. Set false to disable — e.g. a read-only view, or a layout='force'/'galaxy' canvas
   *  where manual repositioning would just be undone the next time the layout recomputes. */
  draggable?: boolean
  /** Called once a drag ends, with the node's new position — only fires for an actual drag (past
   *  a small movement threshold), not a plain click. No effect without draggable. */
  onNodeDragEnd?: (nodeId: string, position: { x: number; y: number }) => void
  /** Shows the built-in zoom in/out/fit and pan-and-zoom-lock toolbar. Default true. Set false
   *  to omit it entirely — e.g. to build a custom control set with the separately-exported
   *  GraphToolbar (or your own), or a read-only view with no viewport controls at all. */
  showToolbar?: boolean
  /** Where the built-in toolbar sits — any of the 4 corners or 4 edge-centers. Default
   *  'bottom-right'. No effect when showToolbar is false. */
  toolbarPosition?: GraphToolbarPosition
}

type NodeDims = Map<string, { width: number; height: number }>
type NodePositions = Map<string, { x: number; y: number }>

export const GraphCanvas = React.forwardRef<HTMLDivElement, GraphCanvasProps>(
  (
    {
      nodes = [],
      edges = [],
      selectedNodeId,
      onNodeSelect,
      renderNode,
      layout = 'manual',
      nodeMargin,
      showClusterBoundaries = true,
      isStructuralEdge,
      showAllRelations = false,
      collapsedNodeIds,
      onToggleCollapse,
      fitView = false,
      fitPadding = 40,
      minZoom = DEFAULT_MIN_ZOOM,
      maxZoom = DEFAULT_MAX_ZOOM,
      selectedEdgeId,
      onEdgeSelect,
      onBackgroundClick,
      draggable = true,
      onNodeDragEnd,
      showToolbar = true,
      toolbarPosition = 'bottom-right',
      className = '',
      ...props
    },
    ref
  ) => {
    const [dims, setDims] = useState<NodeDims>(new Map())
    const [computedPositions, setComputedPositions] = useState<NodePositions>(new Map())
    const [hoveredNodeId, setHoveredNodeId] = useState<string | undefined>()
    // Manual drag overrides, keyed by node id — takes precedence over explicit x/y or the
    // computed layout position (see getNodePosition). Local/uncontrolled: not written back to
    // the nodes prop, so a caller that wants to persist a dropped position needs onNodeDragEnd.
    const [dragPositions, setDragPositions] = useState<NodePositions>(new Map())
    const dragStateRef = useRef<{
      id: string
      pointerId: number
      startClientX: number
      startClientY: number
      startX: number
      startY: number
      dragging: boolean
      // The <g> pointer capture was (or would be) taken on — kept so a drag can be finalized
      // from outside its own pointer handlers (see the draggable-toggled-off effect below),
      // not just from the pointerup/pointercancel that started it.
      target: SVGGElement
    } | null>(null)

    // draggable's own JSDoc promises a drag override persists "until the node list changes" —
    // without this, a stale override for a since-removed (or filtered-out-and-back) node id would
    // silently keep applying forever, since dragPositions is otherwise never cleared on its own.
    const nodeIdsKey = useMemo(() => nodes.map(n => n.id).sort().join(' '), [nodes])
    const didMountDragClearRef = useRef(false)
    useEffect(() => {
      if (!didMountDragClearRef.current) { didMountDragClearRef.current = true; return }
      setDragPositions(new Map())
      dragStateRef.current = null
    }, [nodeIdsKey])

    // Freezes wheel-zoom, drag-to-pan, and keyboard zoom/pan (see usePanZoom's locked option) —
    // toggled by GraphToolbar's lock button. Internal/uncontrolled, like hoveredNodeId/dragPositions.
    const [locked, setLocked] = useState(false)

    // Structural hierarchy over the FULL node/edge list — independent of what's currently
    // hidden, so a collapsed node's affordance (hasChildren, hiddenDescendantCount) stays
    // correct even while its subtree isn't rendered.
    const forest = useMemo(() => {
      const hierarchyEdges = edges.map(e => ({
        source: e.sourceId,
        target: e.targetId,
        structural: isStructuralEdge ? isStructuralEdge(e) : true,
      }))
      return buildStructuralForest(nodes.map(n => n.id), hierarchyEdges)
    }, [nodes, edges, isStructuralEdge])

    // Every structural descendant of a collapsed node is hidden — not just its direct children.
    const hiddenIds = useMemo(() => {
      if (!collapsedNodeIds || collapsedNodeIds.size === 0) return new Set<string>()
      const hidden = new Set<string>()
      for (const id of collapsedNodeIds) {
        for (const descendant of structuralDescendants(id, forest.childrenOf)) hidden.add(descendant)
      }
      return hidden
    }, [collapsedNodeIds, forest])

    // The node list actually measured, laid out, and rendered. Edges touching a hidden node
    // simply don't resolve a rect (see getNodeRect below) and render nothing — no separate
    // edge filtering needed.
    const visibleNodes = useMemo(
      () => (hiddenIds.size === 0 ? nodes : nodes.filter(n => !hiddenIds.has(n.id))),
      [nodes, hiddenIds]
    )

    // Only populated when layout='force-clustered' — top-level cluster
    // bounding circles, for the optional bubble-boundary render layer.
    const [clusterBoundaries, setClusterBoundaries] = useState<Map<string, { x: number; y: number; r: number }>>(
      new Map()
    )

    const containerRef = useRef<HTMLDivElement>(null)
    const measureRefs = useRef<Record<string, HTMLDivElement | null>>({})
    // Tracks whether we've applied the initial canvas-center offset
    const didCenterRef = useRef(false)
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)

    const { transform, viewport, bind, panTo, zoomTo } = usePanZoom({
      minZoom,
      maxZoom,
      containerRef,
      locked,
    })

    // Start of a potential background click — recorded whenever the gesture begins on genuine
    // background (not a node, not an edge, not something opting out via data-no-drag, e.g. the
    // toolbar), regardless of whether pan/zoom is locked: clicking to deselect is unrelated to
    // the viewport lock, so it shouldn't be gated by it the way the pan drag itself is.
    const backgroundClickStartRef = useRef<{ x: number; y: number } | null>(null)

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target instanceof Element && e.target.closest('.graph-node, .graph-edge, [data-no-drag]')) {
        backgroundClickStartRef.current = null
        return
      }
      backgroundClickStartRef.current = { x: e.clientX, y: e.clientY }
      bind.onPointerDown(e)
    }, [bind])

    // A genuine pan drag never fires onBackgroundClick — only a press and release within
    // DRAG_THRESHOLD px of each other does, the same "was this actually a drag" bar node
    // dragging uses. Independent of usePanZoom's own drag machinery (which document-level
    // pointermove/up listeners only run while a pan is in progress, and not at all while
    // locked) so this keeps working even when pan/zoom is locked.
    const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      const start = backgroundClickStartRef.current
      backgroundClickStartRef.current = null
      if (!start || !onBackgroundClick) return
      const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y)
      if (distance < DRAG_THRESHOLD) onBackgroundClick()
    }, [onBackgroundClick])

    const rawId = useId()
    const gridPatternId = `grid${rawId.replace(/:/g, '')}`

    // Measure each node's natural HTML dimensions from the hidden off-screen div. Re-runs
    // whenever the node list changes, or renderNode itself changes (e.g. a caller swaps in a
    // bigger custom card) — a *memoized* renderNode (see the prop's JSDoc) keeps a stable
    // identity across re-renders that don't change its output, so this doesn't cause the
    // thrashing an unmemoized inline function would.
    useLayoutEffect(() => {
      const next: NodeDims = new Map()
      for (const node of visibleNodes) {
        const el = measureRefs.current[node.id]
        next.set(node.id, {
          width: el?.offsetWidth || DEFAULT_NODE_W,
          height: el?.offsetHeight || DEFAULT_NODE_H,
        })
      }
      setDims(next)
    }, [visibleNodes, renderNode])

    // Run the engine layout when dims are ready (only for layout='force' | 'galaxy' | 'force-clustered')
    useEffect(() => {
      if ((layout !== 'force' && layout !== 'galaxy' && layout !== 'force-clustered') || dims.size === 0) return

      const layoutNodes = visibleNodes.map((n, i) => ({
        id: n.id,
        // Nodes without explicit coords start on a circle so 'force'/'force-clustered' converge
        // cleanly. 'galaxy' ignores this seed — its home position is computed from the hierarchy.
        x: n.x ?? Math.cos((2 * Math.PI * i) / visibleNodes.length) * 120,
        y: n.y ?? Math.sin((2 * Math.PI * i) / visibleNodes.length) * 120,
        width: dims.get(n.id)?.width ?? DEFAULT_NODE_W,
        height: dims.get(n.id)?.height ?? DEFAULT_NODE_H,
        pinned: n.x !== undefined && n.y !== undefined,
      }))
      if (layout === 'force') {
        const layoutEdges = (edges ?? []).map(e => ({ source: e.sourceId, target: e.targetId }))
        setComputedPositions(forceLayout(layoutNodes, layoutEdges, { nodeMargin }))
        setClusterBoundaries(new Map())
      } else if (layout === 'force-clustered') {
        const layoutEdges = (edges ?? []).map(e => ({ source: e.sourceId, target: e.targetId }))
        const { positions, clusterBoundaries: boundaries } = clusteredForceLayout(layoutNodes, layoutEdges, { nodeMargin })
        setComputedPositions(positions)
        setClusterBoundaries(boundaries)
      } else {
        const layoutEdges = (edges ?? []).map(e => ({
          source: e.sourceId,
          target: e.targetId,
          structural: isStructuralEdge ? isStructuralEdge(e) : true,
        }))
        const positions = galaxyLayout(layoutNodes, layoutEdges, { nodeMargin })
        setComputedPositions(positions)
        // galaxyLayout has no "cluster" concept of its own to return boundaries from (unlike
        // clusteredForceLayout), so build one here from `forest`. One boundary per root would be
        // correct but not very useful on a single-root tree (e.g. one org chart under one CEO) —
        // it'd just be one circle around everything. Instead, a root with children delegates its
        // group-headship down to each of ITS OWN children (a multi-root forest's roots still get
        // one boundary each, same as before, since a childless root has nothing to delegate to);
        // each group head's full recursive subtree is then one boundary, same as a Louvain
        // cluster's members are for force-clustered.
        const groupHeads = forest.roots.flatMap(rootId => forest.childrenOf.get(rootId) ?? [rootId])
        const leafToGroup = new Map<string, string>()
        for (const headId of groupHeads) {
          leafToGroup.set(headId, headId)
          for (const descendantId of structuralDescendants(headId, forest.childrenOf)) leafToGroup.set(descendantId, headId)
        }
        const radiusOf = (id: string): number => {
          const d = dims.get(id)
          return d ? Math.hypot(d.width, d.height) / 2 : 20
        }
        setClusterBoundaries(boundingCirclesByGroup(layoutNodes, positions, leafToGroup, radiusOf))
      }
    }, [visibleNodes, edges, dims, layout, nodeMargin, isStructuralEdge, forest])


    // Track the rendered container size so the auto-center effect can react to it.
    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      const ro = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect
        if (width > 0 && height > 0) setContainerSize({ width, height })
      })
      ro.observe(container)
      return () => ro.disconnect()
    }, [])

    const getNodePosition = useCallback((node: GraphNodeData): { x: number; y: number } => {
      const dragged = dragPositions.get(node.id)
      if (dragged) return dragged
      if (node.x !== undefined && node.y !== undefined) return { x: node.x, y: node.y }
      return computedPositions.get(node.id) ?? { x: 0, y: 0 }
    }, [dragPositions, computedPositions])

    // Computes the current node bounding box in graph space (world coordinates).
    // Shared by the initial fit/center effect and the imperative zoomToFit().
    const computeBoundingBox = useCallback((): BoundingBox | null => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const node of visibleNodes) {
        // Includes any drag override (see getNodePosition) so zoomToFit() after manually
        // repositioning a node reframes to where it actually is, not where the layout put it.
        const pos = getNodePosition(node)
        const d = dims.get(node.id) ?? { width: DEFAULT_NODE_W, height: DEFAULT_NODE_H }
        minX = Math.min(minX, pos.x - d.width / 2)
        maxX = Math.max(maxX, pos.x + d.width / 2)
        minY = Math.min(minY, pos.y - d.height / 2)
        maxY = Math.max(maxY, pos.y + d.height / 2)
      }
      if (!Number.isFinite(minX)) return null
      return { minX, maxX, minY, maxY }
    }, [visibleNodes, dims, getNodePosition])

    // Auto-center (or fit) the node bounding box once positions and dims are ready.
    // Runs once — re-centering on later prop changes would fight user pan/zoom.
    useEffect(() => {
      if (didCenterRef.current) return
      if (!containerSize || dims.size === 0 || visibleNodes.length === 0) return
      // 'manual' has no engine layout to wait on. 'force'/'galaxy'/'force-clustered' all compute
      // positions asynchronously (see the engine-layout effect above) — without waiting for them
      // here too, this could run with computedPositions still empty, every node falling back to
      // {x:0,y:0}, and fit/center on that degenerate single-point box instead of the real layout.
      if ((layout === 'force' || layout === 'galaxy' || layout === 'force-clustered') && computedPositions.size === 0) return

      const bbox = computeBoundingBox()
      if (!bbox) return

      didCenterRef.current = true

      if (fitView) {
        const fit = computeFitViewport(bbox, containerSize.width, containerSize.height, fitPadding, minZoom, maxZoom)
        zoomTo(fit.zoom)
        panTo(fit.panX, fit.panY)
      } else {
        const centroidX = (bbox.minX + bbox.maxX) / 2
        const centroidY = (bbox.minY + bbox.maxY) / 2
        panTo(
          containerSize.width / 2 - centroidX * viewport.zoom,
          containerSize.height / 2 - centroidY * viewport.zoom
        )
      }
    }, [containerSize, dims, computedPositions, visibleNodes, layout, viewport.zoom, panTo, zoomTo, fitView, fitPadding, computeBoundingBox])

    // Imperative viewport controls, exposed via useGraphCanvas().
    const zoomToFit = useCallback((padding?: number) => {
      const bbox = computeBoundingBox()
      if (!bbox || !containerSize) return
      const fit = computeFitViewport(bbox, containerSize.width, containerSize.height, padding ?? fitPadding, minZoom, maxZoom)
      zoomTo(fit.zoom)
      panTo(fit.panX, fit.panY)
    }, [computeBoundingBox, containerSize, fitPadding, minZoom, maxZoom, zoomTo, panTo])


    const getNodeRect = useCallback((id: string) => {
      // Only visible nodes resolve — an edge touching a hidden (collapsed-away) node just
      // won't find one here and renders nothing (see GraphEdgeInternal's null guard).
      const node = visibleNodes.find(n => n.id === id)
      if (!node) return null
      const pos = getNodePosition(node)
      const d = dims.get(id) ?? { width: DEFAULT_NODE_W, height: DEFAULT_NODE_H }
      return { x: pos.x, y: pos.y, width: d.width, height: d.height }
    }, [visibleNodes, dims, getNodePosition])

    // Node dragging. Pointer capture is deliberately NOT taken on pointerdown — capturing
    // retargets every subsequent event for that pointer to the capturing element, including the
    // click the browser synthesizes right after pointerup, which would then never reach (and so
    // never bubble past) the node content's own onClick a few levels down, breaking plain
    // click-to-select for every node. Capture is instead taken only once a move has actually
    // crossed DRAG_THRESHOLD — a plain click never captures at all, so it's unaffected — which
    // also keeps later move/up events targeted at this <g> even once the cursor leaves it.
    const handleNodePointerDown = useCallback((e: React.PointerEvent<SVGGElement>, node: GraphNodeData) => {
      if (!draggable) return
      // Stop this from also being treated as the start of a canvas pan — same guard GraphCanvas's
      // own pointerdown handler already applies for HTML .graph-node content, needed again here
      // because dragging starts from the SVG <g> wrapping it, which that closest() check doesn't
      // otherwise see (the event both starts and is handled here, so it never bubbles that far).
      e.stopPropagation()
      const pos = getNodePosition(node)
      dragStateRef.current = {
        id: node.id,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: pos.x,
        startY: pos.y,
        dragging: false,
        target: e.currentTarget,
      }
    }, [draggable, getNodePosition])

    const handleNodePointerMove = useCallback((e: React.PointerEvent<SVGGElement>) => {
      const state = dragStateRef.current
      if (!state || state.pointerId !== e.pointerId) return
      const dx = (e.clientX - state.startClientX) / viewport.zoom
      const dy = (e.clientY - state.startClientY) / viewport.zoom
      if (!state.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      if (!state.dragging) e.currentTarget.setPointerCapture(e.pointerId)
      state.dragging = true
      const next = { x: state.startX + dx, y: state.startY + dy }
      setDragPositions(prev => {
        const updated = new Map(prev)
        updated.set(state.id, next)
        return updated
      })
    }, [viewport.zoom])

    // Shared by a real pointerup/pointercancel and by the draggable-toggled-off effect below —
    // either way, a drag that was actually in progress needs the same finalization: fire
    // onNodeDragEnd once with wherever it ended up, then clear drag state so nothing's left
    // stranded. suppressUpcomingClick is only true for a genuine pointerup: that's the only case
    // the browser follows with a synthetic click (pointercancel — e.g. a touch/gesture takeover —
    // never gets one), so registering the one-time suppressor for pointercancel would just leak an
    // event listener that never fires, silently swallowing that node's next real click forever.
    const finalizeDrag = useCallback((suppressUpcomingClick: boolean) => {
      const state = dragStateRef.current
      if (!state) return
      if (state.dragging) {
        if (suppressUpcomingClick) {
          const target = state.target
          const suppressClick = (ev: MouseEvent) => { ev.stopPropagation(); ev.preventDefault() }
          target.addEventListener('click', suppressClick, { capture: true, once: true })
        }
        const finalPos = dragPositions.get(state.id) ?? { x: state.startX, y: state.startY }
        onNodeDragEnd?.(state.id, finalPos)
      }
      dragStateRef.current = null
    }, [dragPositions, onNodeDragEnd])

    const handleNodePointerUp = useCallback((e: React.PointerEvent<SVGGElement>) => {
      const state = dragStateRef.current
      if (!state || state.pointerId !== e.pointerId) return
      finalizeDrag(e.type === 'pointerup')
    }, [finalizeDrag])

    // draggable can flip to false mid-gesture (this library's own docs demo exposes exactly this
    // toggle) — onPointerMove/Up/Cancel below are only bound while draggable is true, so React
    // unbinds them immediately and the trailing pointerup/cancel that would otherwise finalize the
    // drag never reaches this component. Without this, that leaves pointer capture unreleased and
    // dragStateRef permanently set — the node reads as stuck mid-drag and onNodeDragEnd never
    // fires despite a real drag having happened. Finalizes exactly like a normal pointerup would,
    // just triggered by the prop change instead of the pointer event.
    useEffect(() => {
      if (draggable) return
      const state = dragStateRef.current
      if (!state) return
      if (state.dragging) {
        try { state.target.releasePointerCapture(state.pointerId) } catch { /* already released */ }
      }
      finalizeDrag(false)
    }, [draggable, finalizeDrag])

    // Every visible node's rect, for edges to steer their label clear of (see
    // findClearLabelPosition). Recomputes on the same cadence as getNodeRect itself — layout and
    // measurement changes, not pan/zoom/hover — so this doesn't add extra churn beyond that.
    const nodeRects = useMemo(
      () => visibleNodes.map(n => getNodeRect(n.id)).filter((r): r is NonNullable<typeof r> => r !== null),
      [visibleNodes, getNodeRect]
    )

    const hierarchyMetaFor = useCallback((id: string): GraphNodeHierarchyMeta => {
      const hasChildren = (forest.childrenOf.get(id)?.length ?? 0) > 0
      const collapsed = collapsedNodeIds?.has(id) ?? false
      const hiddenDescendantCount = collapsed ? structuralDescendants(id, forest.childrenOf).size : 0
      return {
        hasChildren,
        collapsed,
        hiddenDescendantCount,
        onToggleCollapse: onToggleCollapse ? () => onToggleCollapse(id) : undefined,
      }
    }, [forest, collapsedNodeIds, onToggleCollapse])

    const resolveNodeContent = useCallback((node: GraphNodeData, selected: boolean): React.ReactNode => {
      const hierarchy = hierarchyMetaFor(node.id)
      if (renderNode) return renderNode(node, selected, hierarchy)
      return (
        <GraphNode
          id={node.id}
          label={node.label}
          kind={node.kind}
          domainColor={node.domainColor}
          selected={selected}
          onSelect={onNodeSelect}
          hasChildren={hierarchy.hasChildren}
          collapsed={hierarchy.collapsed}
          hiddenDescendantCount={hierarchy.hiddenDescendantCount}
          onToggleCollapse={hierarchy.onToggleCollapse}
        />
      )
    }, [renderNode, onNodeSelect, hierarchyMetaFor])

    const contextValue = useMemo(() => ({
      getNodeRect,
      nodeRects,
      zoom: viewport.zoom,
      pan: { x: viewport.x, y: viewport.y },
      selectedNodeId,
      zoomToFit,
      setZoom: zoomTo,
      setPan: panTo,
      locked,
      setLocked,
    }), [getNodeRect, nodeRects, viewport, selectedNodeId, zoomToFit, zoomTo, panTo, locked])

    const handleRef = (el: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
      ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    }

    // Grid dots track pan/zoom via the SVG pattern transform
    const tileSize = 18 * viewport.zoom
    const patternX = ((viewport.x % tileSize) + tileSize) % tileSize
    const patternY = ((viewport.y % tileSize) + tileSize) % tileSize

    return (
      <div
        ref={handleRef}
        aria-label="Graph canvas"
        className={['graph-canvas', className].filter(Boolean).join(' ')}
        onPointerDown={handlePointerDown}
        onPointerUp={handleCanvasPointerUp}
        onKeyDown={bind.onKeyDown}
        tabIndex={bind.tabIndex}
        role={bind.role}
        {...props}
      >
        {/* Hidden off-screen div — renders node HTML at natural size for measurement. Deliberately
            OUTSIDE the context provider below: useGraphCanvas() being unavailable here is how a
            custom renderNode (e.g. one embedding viewport controls) can tell this measurement
            pass apart from the real one and opt out of rendering anything for it. */}
        <div className="graph-measure" aria-hidden="true">
          {visibleNodes.map(node => (
            <div
              key={node.id}
              ref={el => { measureRefs.current[node.id] = el }}
              style={{ display: 'inline-block' }}
            >
              {resolveNodeContent(node, false)}
            </div>
          ))}
        </div>

        <GraphCanvasContext.Provider value={contextValue}>
          <svg
            className="graph-svg"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            <defs>
              <pattern
                id={gridPatternId}
                x={patternX}
                y={patternY}
                width={tileSize}
                height={tileSize}
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="0"
                  cy="0"
                  r={Math.min(1, 0.5 * viewport.zoom)}
                  className="graph-grid-dot"
                />
              </pattern>
            </defs>

            {/* Grid fills the full SVG surface */}
            <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} className="graph-grid" />

            {/* Single viewport transform — edges and nodes share this coordinate space */}
            <g
              className="graph-viewport"
              data-testid="graph-viewport"
              transform={transform}
            >
              {showClusterBoundaries && clusterBoundaries.size > 0 && (
                <g className="graph-clusters" aria-hidden="true">
                  {[...clusterBoundaries.entries()].map(([id, c]) => (
                    <circle key={id} className="graph-cluster-boundary" cx={c.x} cy={c.y} r={c.r} />
                  ))}
                </g>
              )}

              <g className="graph-edges">
                {edges?.map(edge => {
                  // Only isStructuralEdge callers opt into hiding — without it every edge
                  // is treated as structural, so this never changes existing behavior.
                  const structural = isStructuralEdge ? isStructuralEdge(edge) : true
                  const touchesFocus =
                    edge.sourceId === hoveredNodeId || edge.targetId === hoveredNodeId ||
                    edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId ||
                    edge.id === selectedEdgeId
                  const hidden = !structural && !showAllRelations && !touchesFocus
                  // Not rendered at all rather than dimmed to a low opacity — line, marker, and
                  // label alike disappear, and it isn't clickable while hidden either.
                  if (hidden) return null
                  return (
                    <GraphEdgeInternal
                      key={edge.id}
                      id={edge.id}
                      sourceId={edge.sourceId}
                      targetId={edge.targetId}
                      label={edge.label}
                      variant={edge.variant}
                      weight={edge.weight}
                      opacity={edge.opacity}
                      strokeDash={edge.strokeDash}
                      sourceAnchor={edge.sourceAnchor}
                      targetAnchor={edge.targetAnchor}
                      curvature={edge.curvature}
                      selected={edge.id === selectedEdgeId}
                      onSelect={onEdgeSelect}
                    />
                  )
                })}
              </g>

              <g className="graph-nodes">
                {visibleNodes.map(node => {
                  const pos = getNodePosition(node)
                  const d = dims.get(node.id) ?? { width: DEFAULT_NODE_W, height: DEFAULT_NODE_H }
                  const selected = node.id === selectedNodeId
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x} ${pos.y})`}
                      data-node-id={node.id}
                      data-testid={`graph-node-${node.id}`}
                      data-domain={node.domainColor}
                      className={['graph-canvas-node', draggable && 'draggable', selected && 'selected'].filter(Boolean).join(' ')}
                      onPointerEnter={() => setHoveredNodeId(node.id)}
                      onPointerLeave={() => setHoveredNodeId(current => (current === node.id ? undefined : current))}
                      onPointerDown={draggable ? (e) => handleNodePointerDown(e, node) : undefined}
                      onPointerMove={draggable ? handleNodePointerMove : undefined}
                      onPointerUp={draggable ? handleNodePointerUp : undefined}
                      onPointerCancel={draggable ? handleNodePointerUp : undefined}
                    >
                      <foreignObject
                        x={-d.width / 2}
                        y={-d.height / 2}
                        width={d.width}
                        height={d.height}
                        overflow="visible"
                      >
                        {resolveNodeContent(node, selected)}
                      </foreignObject>
                    </g>
                  )
                })}
              </g>
            </g>
          </svg>

          {showToolbar && <GraphToolbar position={toolbarPosition} />}
        </GraphCanvasContext.Provider>
      </div>
    )
  }
)

GraphCanvas.displayName = 'GraphCanvas'

export default GraphCanvas
