import React from 'react'
import {
  DEFAULT_EDGE_MARKER_SIZE,
  DEFAULT_EDGE_STROKE_WIDTH,
  markerSizeForStrokeWidth,
  strokeDashToDasharray,
  weightToStrokeWidth,
  type GraphEdgeVariant,
} from '../utils/graphEdgeStyle'

export interface GraphEdgeShapeProps {
  id: string
  d: string
  mid: { x: number; y: number }
  label?: string
  variant: GraphEdgeVariant
  /** 0-100. Maps to a 1-8px stroke width via a square-root curve. */
  weight?: number
  /** 0-1. Applied to the line and arrow marker independently of the label background. */
  opacity?: number
  /** A single number (equal dash/gap) or a [dash, gap] tuple. Overrides variant-based dashing. */
  strokeDash?: number | [number, number]
  /** Standalone GraphEdge exposes finer-grained test ids than the canvas-internal renderer. */
  detailedTestIds?: boolean
}

// Shared by GraphEdgeInternal and standalone GraphEdge to prevent drift.
export function GraphEdgeShape({
  id,
  d,
  mid,
  label,
  variant,
  weight,
  opacity,
  strokeDash,
  detailedTestIds = false,
}: GraphEdgeShapeProps) {
  const markerId = `arrow-${id}`
  const markerRoseId = `arrow-rose-${id}`
  const markerCyanId = `arrow-cyan-${id}`
  const markerUrl =
    variant === 'hot' ? `url(#${markerCyanId})` : variant === 'irrelevant' ? `url(#${markerRoseId})` : `url(#${markerId})`

  const strokeWidth = weight !== undefined ? weightToStrokeWidth(weight) : undefined
  const baseStrokeWidth = DEFAULT_EDGE_STROKE_WIDTH[variant]

  const markerSize = (base: number) => (strokeWidth !== undefined ? markerSizeForStrokeWidth(base, baseStrokeWidth, strokeWidth) : base)
  const markerUnits = strokeWidth !== undefined ? 'userSpaceOnUse' : undefined

  const lineStyle: React.CSSProperties = {}
  if (strokeWidth !== undefined) lineStyle.strokeWidth = strokeWidth
  if (opacity !== undefined) lineStyle.opacity = opacity
  if (strokeDash !== undefined) lineStyle.strokeDasharray = strokeDashToDasharray(strokeDash)

  const defaultMarkerSize = markerSize(DEFAULT_EDGE_MARKER_SIZE.default)
  const roseMarkerSize = markerSize(DEFAULT_EDGE_MARKER_SIZE.irrelevant)
  const cyanMarkerSize = markerSize(DEFAULT_EDGE_MARKER_SIZE.hot)

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={defaultMarkerSize}
          markerHeight={defaultMarkerSize}
          markerUnits={markerUnits}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-edge-strong, #94a3b8)" />
        </marker>
        <marker
          id={markerRoseId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={roseMarkerSize}
          markerHeight={roseMarkerSize}
          markerUnits={markerUnits}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(var(--status-rose))" />
        </marker>
        <marker
          id={markerCyanId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth={cyanMarkerSize}
          markerHeight={cyanMarkerSize}
          markerUnits={markerUnits}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(var(--accent-primary))" />
        </marker>
      </defs>

      <path className="graph-edge__hit" d={d} data-testid={detailedTestIds ? `graph-edge-hit-${id}` : undefined} />
      <path
        className="graph-edge__line"
        d={d}
        markerEnd={markerUrl}
        style={Object.keys(lineStyle).length ? lineStyle : undefined}
        data-testid={detailedTestIds ? `graph-edge-line-${id}` : undefined}
      />

      {label && (
        <g
          className="graph-edge__label"
          transform={`translate(${mid.x - (label.length * 3.3 + 7)}, ${mid.y - 9})`}
        >
          <rect
            width={label.length * 6.6 + 14}
            height="18"
            rx="3"
            className="graph-edge__label-bg"
            data-testid={detailedTestIds ? `graph-edge-label-bg-${id}` : undefined}
          />
          <text
            x={label.length * 3.3 + 7}
            y="12"
            className="graph-edge__label-text"
            data-testid={detailedTestIds ? `graph-edge-label-text-${id}` : undefined}
          >
            {label}
          </text>
        </g>
      )}
    </>
  )
}

GraphEdgeShape.displayName = 'GraphEdgeShape'
