import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo, useId } from 'react'
import { bezierPath, computeFitViewport, rectEdgePoint, type BoundingBox } from '../utils/graph'
import { forceLayout } from '../utils/graphLayout'
import { usePanZoom } from '../hooks/usePanZoom'
import { GraphCanvasContext, useGraphCanvas } from './GraphCanvasContext'
import GraphNode from './GraphNode'
import { GraphEdgeShape } from './GraphEdgeShape'
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
}

/** Props that a custom node component receives from renderNode. */
export interface BaseGraphNodeComponentProps {
  id: string
  label: string
  selected?: boolean
  onSelect?: (id: string) => void
}

// ─── Internal edge component ──────────────────────────────────────────────────

const DEFAULT_NODE_W = 138
const DEFAULT_NODE_H = 30
const MIN_ZOOM = 0.4
const MAX_ZOOM = 2.5

interface InternalEdgeProps {
  id: string
  sourceId: string
  targetId: string
  label?: string
  variant?: 'default' | 'hot' | 'irrelevant'
  weight?: number
  opacity?: number
  strokeDash?: number | [number, number]
}

function GraphEdgeInternal({ id, sourceId, targetId, label, variant = 'default', weight, opacity, strokeDash }: InternalEdgeProps) {
  const { getNodeRect } = useGraphCanvas()

  const result = useMemo(() => {
    const src = getNodeRect(sourceId)
    const tgt = getNodeRect(targetId)
    if (!src || !tgt) return null
    const sp = rectEdgePoint(src.x, src.y, src.width, src.height, tgt.x, tgt.y)
    const tp = rectEdgePoint(tgt.x, tgt.y, tgt.width, tgt.height, src.x, src.y)
    return bezierPath(sp, tp, 0.22)
  }, [getNodeRect, sourceId, targetId])

  if (!result) return null

  const classNames = ['graph-edge', variant !== 'default' && `graph-edge--${variant}`].filter(Boolean).join(' ')
  return (
    <g className={classNames} role="presentation" aria-hidden="true" data-testid={`graph-edge-${id}`}>
      <GraphEdgeShape
        id={id}
        d={result.d}
        mid={result.mid}
        label={label}
        variant={variant}
        weight={weight}
        opacity={opacity}
        strokeDash={strokeDash}
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
   *
   * Tip: memoize with useCallback to avoid unnecessary re-measurements.
   */
  renderNode?: (node: GraphNodeData, selected: boolean) => React.ReactNode
  /** 'manual' relies on explicit x/y per node. 'force' runs a spring layout for nodes
   *  without explicit coordinates; nodes with x and y are pinned. */
  layout?: 'manual' | 'force'
  /** Zoom out/in on first layout so the full node bounding box fits within the container. Default false. */
  fitView?: boolean
  /** Padding in px around the fitted bounding box when fitView is enabled. Default 40. */
  fitPadding?: number
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
      fitView = false,
      fitPadding = 40,
      className = '',
      ...props
    },
    ref
  ) => {
    const [dims, setDims] = useState<NodeDims>(new Map())
    const [computedPositions, setComputedPositions] = useState<NodePositions>(new Map())

    const containerRef = useRef<HTMLDivElement>(null)
    const measureRefs = useRef<Record<string, HTMLDivElement | null>>({})
    // Tracks whether we've applied the initial canvas-center offset
    const didCenterRef = useRef(false)
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)

    const { transform, viewport, bind, panTo, zoomTo } = usePanZoom({
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
    })

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target instanceof Element && e.target.closest('.graph-node, [data-no-drag]')) return
      bind.onPointerDown(e)
    }, [bind])

    const rawId = useId()
    const gridPatternId = `grid${rawId.replace(/:/g, '')}`

    // Measure each node's natural HTML dimensions from the hidden off-screen div.
    // Re-runs whenever the node list changes. renderNode is intentionally excluded:
    // callers should memoize it with useCallback.
    useLayoutEffect(() => {
      const next: NodeDims = new Map()
      for (const node of nodes) {
        const el = measureRefs.current[node.id]
        next.set(node.id, {
          width: el?.offsetWidth || DEFAULT_NODE_W,
          height: el?.offsetHeight || DEFAULT_NODE_H,
        })
      }
      setDims(next)
    }, [nodes])

    // Run force layout when dims are ready (only when layout='force')
    useEffect(() => {
      if (layout !== 'force' || dims.size === 0) return

      const layoutNodes = nodes.map((n, i) => ({
        id: n.id,
        // Nodes without explicit coords start on a circle so the layout converges cleanly
        x: n.x ?? Math.cos((2 * Math.PI * i) / nodes.length) * 120,
        y: n.y ?? Math.sin((2 * Math.PI * i) / nodes.length) * 120,
        width: dims.get(n.id)?.width ?? DEFAULT_NODE_W,
        height: dims.get(n.id)?.height ?? DEFAULT_NODE_H,
        pinned: n.x !== undefined && n.y !== undefined,
      }))
      const layoutEdges = (edges ?? []).map(e => ({ source: e.sourceId, target: e.targetId }))
      setComputedPositions(forceLayout(layoutNodes, layoutEdges))
    }, [nodes, edges, dims, layout])


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

    // Computes the current node bounding box in graph space (world coordinates).
    // Shared by the initial fit/center effect and the imperative zoomToFit().
    const computeBoundingBox = useCallback((): BoundingBox | null => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const node of nodes) {
        const pos = node.x !== undefined && node.y !== undefined
          ? { x: node.x, y: node.y }
          : computedPositions.get(node.id)
        if (!pos) continue
        const d = dims.get(node.id) ?? { width: DEFAULT_NODE_W, height: DEFAULT_NODE_H }
        minX = Math.min(minX, pos.x - d.width / 2)
        maxX = Math.max(maxX, pos.x + d.width / 2)
        minY = Math.min(minY, pos.y - d.height / 2)
        maxY = Math.max(maxY, pos.y + d.height / 2)
      }
      if (!Number.isFinite(minX)) return null
      return { minX, maxX, minY, maxY }
    }, [nodes, dims, computedPositions])

    // Auto-center (or fit) the node bounding box once positions and dims are ready.
    // Runs once — re-centering on later prop changes would fight user pan/zoom.
    useEffect(() => {
      if (didCenterRef.current) return
      if (!containerSize || dims.size === 0 || nodes.length === 0) return
      if (layout === 'force' && computedPositions.size === 0) return

      const bbox = computeBoundingBox()
      if (!bbox) return

      didCenterRef.current = true

      if (fitView) {
        const fit = computeFitViewport(bbox, containerSize.width, containerSize.height, fitPadding, MIN_ZOOM, MAX_ZOOM)
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
    }, [containerSize, dims, computedPositions, nodes, layout, viewport.zoom, panTo, zoomTo, fitView, fitPadding, computeBoundingBox])

    // Imperative viewport controls, exposed via useGraphCanvas().
    const zoomToFit = useCallback((padding?: number) => {
      const bbox = computeBoundingBox()
      if (!bbox || !containerSize) return
      const fit = computeFitViewport(bbox, containerSize.width, containerSize.height, padding ?? fitPadding, MIN_ZOOM, MAX_ZOOM)
      zoomTo(fit.zoom)
      panTo(fit.panX, fit.panY)
    }, [computeBoundingBox, containerSize, fitPadding, zoomTo, panTo])


    const getNodePosition = useCallback((node: GraphNodeData): { x: number; y: number } => {
      if (node.x !== undefined && node.y !== undefined) return { x: node.x, y: node.y }
      return computedPositions.get(node.id) ?? { x: 0, y: 0 }
    }, [computedPositions])

    const getNodeRect = useCallback((id: string) => {
      const node = nodes.find(n => n.id === id)
      if (!node) return null
      const pos = getNodePosition(node)
      const d = dims.get(id) ?? { width: DEFAULT_NODE_W, height: DEFAULT_NODE_H }
      return { x: pos.x, y: pos.y, width: d.width, height: d.height }
    }, [nodes, dims, getNodePosition])

    const resolveNodeContent = useCallback((node: GraphNodeData, selected: boolean): React.ReactNode => {
      if (renderNode) return renderNode(node, selected)
      return (
        <GraphNode
          id={node.id}
          label={node.label}
          kind={node.kind}
          domainColor={node.domainColor}
          selected={selected}
          onSelect={onNodeSelect}
        />
      )
    }, [renderNode, onNodeSelect])

    const contextValue = useMemo(() => ({
      getNodeRect,
      zoom: viewport.zoom,
      pan: { x: viewport.x, y: viewport.y },
      selectedNodeId,
      zoomToFit,
      setZoom: zoomTo,
      setPan: panTo,
    }), [getNodeRect, viewport, selectedNodeId, zoomToFit, zoomTo, panTo])

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
        onWheel={bind.onWheel}
        onKeyDown={bind.onKeyDown}
        tabIndex={bind.tabIndex}
        role={bind.role}
        {...props}
      >
        {/* Hidden off-screen div — renders node HTML at natural size for measurement */}
        <div className="graph-measure" aria-hidden="true">
          {nodes.map(node => (
            <div
              key={node.id}
              ref={el => { measureRefs.current[node.id] = el }}
              style={{ display: 'inline-block' }}
            >
              {resolveNodeContent(node, false)}
            </div>
          ))}
        </div>

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

          <GraphCanvasContext.Provider value={contextValue}>
            {/* Single viewport transform — edges and nodes share this coordinate space */}
            <g
              className="graph-viewport"
              data-testid="graph-viewport"
              transform={transform}
            >
              <g className="graph-edges">
                {edges?.map(edge => (
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
                  />
                ))}
              </g>

              <g className="graph-nodes">
                {nodes.map(node => {
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
                      className={selected ? 'selected' : undefined}
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
          </GraphCanvasContext.Provider>
        </svg>
      </div>
    )
  }
)

GraphCanvas.displayName = 'GraphCanvas'

export default GraphCanvas
