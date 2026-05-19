import React, { useState, useRef, useCallback, useContext, createContext, useEffect, useMemo } from 'react'
import { bezierPath, rectEdgePoint } from '../utils/graph'
import './GraphCanvas.css'
import './GraphEdge.css'

export interface GraphNodeData {
  id: string
  x: number
  y: number
  label: string
  kind?: string
  domainColor?: string
  width?: number
  height?: number
}

export interface BaseGraphNodeComponentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  id: string
  x: number
  y: number
  label: string
  selected?: boolean
  onSelect?: (id: string) => void
}

export interface GraphEdge {
  id: string
  sourceId: string
  targetId: string
  label?: string
}

export interface GraphCanvasContextValue {
  nodes: GraphNodeData[]
  zoom: number
  pan: { x: number; y: number }
  selectedNodeId?: string
}

export const GraphCanvasContext = createContext<GraphCanvasContextValue | null>(null)

export function useGraphCanvas() {
  const context = useContext(GraphCanvasContext)
  if (!context) {
    throw new Error('useGraphCanvas must be used within a GraphCanvas')
  }
  return context
}

export interface GraphCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  nodes: GraphNodeData[]
  edges?: GraphEdge[]
  selectedNodeId?: string
  onNodeSelect?: (nodeId: string) => void
  children?: React.ReactNode
}

const DEFAULT_NODE_W = 138
const DEFAULT_NODE_H = 30

function GraphEdgeInternal({ id, sourceId, targetId, label }: { id: string; sourceId: string; targetId: string; label?: string }) {
  const { nodes } = useGraphCanvas()

  const result = useMemo(() => {
    const src = nodes.find(n => n.id === sourceId)
    const tgt = nodes.find(n => n.id === targetId)
    if (!src || !tgt) return null
    const sw = src.width ?? DEFAULT_NODE_W
    const sh = src.height ?? DEFAULT_NODE_H
    const tw = tgt.width ?? DEFAULT_NODE_W
    const th = tgt.height ?? DEFAULT_NODE_H
    const sp = rectEdgePoint(src.x, src.y, sw, sh, tgt.x, tgt.y)
    const tp = rectEdgePoint(tgt.x, tgt.y, tw, th, src.x, src.y)
    return bezierPath(sp, tp, 0.22)
  }, [nodes, sourceId, targetId])

  if (!result) return null

  const markerId = `arrow-${id}`
  return (
    <g className="graph-edge" data-testid={`graph-edge-${id}`}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-edge-strong, #94a3b8)" />
        </marker>
      </defs>
      <path className="graph-edge__line" d={result.d} markerEnd={`url(#${markerId})`} />
      {label && (
        <g transform={`translate(${result.mid.x}, ${result.mid.y})`} className="graph-edge__label">
          <rect x="-24" y="-8" width="48" height="14" className="graph-edge__label-bg" rx="2" />
          <text className="graph-edge__label-text" textAnchor="middle" dominantBaseline="middle">{label}</text>
        </g>
      )}
    </g>
  )
}

export const GraphCanvas = React.forwardRef<HTMLDivElement, GraphCanvasProps>(
  (
    {
      nodes = [],
      edges = [],
      selectedNodeId,
      onNodeSelect,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [size, setSize] = useState({ width: 0, height: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
    const zoomRef = useRef(1)
    const panRef = useRef({ x: 0, y: 0 })

    // Keep refs in sync with state
    useEffect(() => {
      zoomRef.current = zoom
    }, [zoom])

    useEffect(() => {
      panRef.current = pan
    }, [pan])

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()

        const rect = container.getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top

        if (!Number.isFinite(cursorX) || !Number.isFinite(cursorY)) return

        const delta = e.deltaY > 0 ? -0.1 : 0.1
        const prevZoom = zoomRef.current
        const newZoom = Math.min(2.5, Math.max(0.4, prevZoom + delta))
        const zoomChange = newZoom - prevZoom
        const newPan = {
          x: panRef.current.x - (cursorX / prevZoom) * zoomChange,
          y: panRef.current.y - (cursorY / prevZoom) * zoomChange,
        }

        zoomRef.current = newZoom
        panRef.current = newPan
        setZoom(newZoom)
        setPan(newPan)
      }

      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }, [])

    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      const ro = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect
        setSize({ width, height })
      })
      ro.observe(container)
      return () => ro.disconnect()
    }, [])

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        e.target instanceof Element &&
        e.target.closest('.graph-node, .graph-edge-hit, [data-no-drag]')
      ) {
        return
      }
      dragRef.current = { x: e.clientX, y: e.clientY, panX: panRef.current.x, panY: panRef.current.y }
    }

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      setPan({
        x: dragRef.current.panX + (e.clientX - dragRef.current.x),
        y: dragRef.current.panY + (e.clientY - dragRef.current.y),
      })
    }, [])

    const handleMouseUp = () => {
      dragRef.current = null
    }

    const classNames = ['graph-canvas', className].filter(Boolean).join(' ')

    const contextValue: GraphCanvasContextValue = {
      nodes,
      zoom,
      pan,
      selectedNodeId,
    }

    const handleRef = (el: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
      ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    }

    return (
      <div
        ref={handleRef}
        className={classNames}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        {...props}
      >
        <div className="graph-grid"></div>
        <GraphCanvasContext.Provider value={contextValue}>
          {edges && edges.length > 0 && size.width > 0 && (
            <svg
              className="graph-svg"
              width={size.width}
              height={size.height}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
            >
              <g style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                {edges.map(edge => (
                  <GraphEdgeInternal
                    key={edge.id}
                    id={edge.id}
                    sourceId={edge.sourceId}
                    targetId={edge.targetId}
                    label={edge.label}
                  />
                ))}
              </g>
            </svg>
          )}
          <div
            className="graph-stage"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            data-testid="graph-stage"
          >
            {children}
          </div>
        </GraphCanvasContext.Provider>
      </div>
    )
  }
)

GraphCanvas.displayName = 'GraphCanvas'

export default GraphCanvas
