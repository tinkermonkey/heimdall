import React, { useState, useRef, useCallback, useContext, createContext, useEffect } from 'react'
import './GraphCanvas.css'

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
