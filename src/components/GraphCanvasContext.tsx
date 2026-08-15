import { createContext, useContext } from 'react'

export interface GraphNodeRect {
  x: number
  y: number
  width: number
  height: number
}

export interface GraphCanvasContextValue {
  getNodeRect: (id: string) => GraphNodeRect | null
  /** Every currently-visible node's rect — used by edges to keep their label clear of nodes
   *  (see findClearLabelPosition in utils/graph). Not for hit-testing; use getNodeRect for that. */
  nodeRects: GraphNodeRect[]
  zoom: number
  pan: { x: number; y: number }
  selectedNodeId?: string
  /** Recomputes the current node bounding box and fits it within the container, optionally overriding fitPadding. */
  zoomToFit: (padding?: number) => void
  /** Sets zoom without altering pan. */
  setZoom: (zoom: number) => void
  /** Sets pan without altering zoom. */
  setPan: (x: number, y: number) => void
}

export const GraphCanvasContext = createContext<GraphCanvasContextValue | null>(null)

export function useGraphCanvas(): GraphCanvasContextValue {
  const ctx = useContext(GraphCanvasContext)
  if (!ctx) throw new Error('useGraphCanvas must be used within a GraphCanvas')
  return ctx
}
