import React from 'react'
import { edgeLabelSize } from '../utils/graph'
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
  /** Called with `id` when the line or label is clicked, or activated via keyboard on the
   *  owning <g> (see GraphEdge/GraphEdgeInternal). Without it, the edge isn't interactive —
   *  the hit-target stroke is still there, but nothing responds to it. The owning <g> is
   *  responsible for the `selected` visual state (see its own `.graph-edge.selected` class) —
   *  this component doesn't need to know selection state itself, just where to send clicks. */
  onSelect?: (id: string) => void
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
  onSelect,
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

  // SVG markers render in their own compositing context and do not inherit the
  // referencing element's opacity, so it must be applied to the marker path directly.
  const markerStyle: React.CSSProperties | undefined = opacity !== undefined ? { opacity } : undefined

  const defaultMarkerSize = markerSize(DEFAULT_EDGE_MARKER_SIZE.default)
  const roseMarkerSize = markerSize(DEFAULT_EDGE_MARKER_SIZE.irrelevant)
  const cyanMarkerSize = markerSize(DEFAULT_EDGE_MARKER_SIZE.hot)

  const handleClick = onSelect ? (e: React.MouseEvent) => { e.stopPropagation(); onSelect(id) } : undefined
  const labelSize = label ? edgeLabelSize(label) : null

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
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-edge-strong, #94a3b8)" style={markerStyle} />
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
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(var(--status-rose))" style={markerStyle} />
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
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(var(--accent-primary))" style={markerStyle} />
        </marker>
      </defs>

      <path
        className="graph-edge__hit"
        d={d}
        onClick={handleClick}
        data-testid={detailedTestIds ? `graph-edge-hit-${id}` : undefined}
      />
      <path
        className="graph-edge__line"
        d={d}
        markerEnd={markerUrl}
        style={Object.keys(lineStyle).length ? lineStyle : undefined}
        data-testid={detailedTestIds ? `graph-edge-line-${id}` : undefined}
      />

      {label && labelSize && (
        <g
          className={
            onSelect
              ? 'graph-edge__label graph-edge__label--clickable'
              : 'graph-edge__label'
          }
          transform={`translate(${mid.x - labelSize.width / 2}, ${mid.y - labelSize.height / 2})`}
          onClick={handleClick}
        >
          <rect
            width={labelSize.width}
            height={labelSize.height}
            rx="3"
            className="graph-edge__label-bg"
            data-testid={detailedTestIds ? `graph-edge-label-bg-${id}` : undefined}
          />
          <text
            x={labelSize.width / 2}
            y={labelSize.height / 2 + 3}
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
