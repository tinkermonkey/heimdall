import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

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
  /** Whether wheel-zoom, drag-to-pan, and the keyboard zoom/pan shortcuts are frozen. Doesn't
   *  affect setZoom/setPan/zoomToFit — those are deliberate calls, not the accidental scroll/drag
   *  input locking is meant to guard against. Read/set by GraphToolbar's lock button. */
  locked: boolean
  setLocked: Dispatch<SetStateAction<boolean>>
}

export const GraphCanvasContext = createContext<GraphCanvasContextValue | null>(null)

export function useGraphCanvas(): GraphCanvasContextValue {
  const ctx = useContext(GraphCanvasContext)
  if (!ctx) throw new Error('useGraphCanvas must be used within a GraphCanvas')
  return ctx
}
