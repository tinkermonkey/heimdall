import React, { useMemo } from 'react'
import { useGraphCanvas } from './GraphCanvasContext'
import { computeEdgePath, type EdgeAnchor } from '../utils/graph'
import { GraphEdgeShape } from './GraphEdgeShape'
import './GraphEdge.css'

export interface GraphEdgeProps extends React.SVGAttributes<SVGGElement> {
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

export const GraphEdge = React.forwardRef<SVGGElement, GraphEdgeProps>(
  (
    {
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
      className = '',
      ...props
    },
    ref
  ) => {
    const { getNodeRect } = useGraphCanvas()

    const path = useMemo(() => {
      const src = getNodeRect(sourceId)
      const tgt = getNodeRect(targetId)
      if (!src) { console.warn(`GraphEdge: source node "${sourceId}" not found`); return null }
      if (!tgt) { console.warn(`GraphEdge: target node "${targetId}" not found`); return null }
      return computeEdgePath(src, tgt, { sourceAnchor, targetAnchor, curvature })
    }, [getNodeRect, sourceId, targetId, sourceAnchor, targetAnchor, curvature])

    if (!path) return null

    const classNames = [
      'graph-edge',
      variant !== 'default' && `graph-edge--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <g ref={ref} className={classNames} role="presentation" aria-hidden="true" data-testid={`graph-edge-${id}`} {...props}>
        <GraphEdgeShape
          id={id}
          d={path.d}
          mid={path.mid}
          label={label}
          variant={variant}
          weight={weight}
          opacity={opacity}
          strokeDash={strokeDash}
          detailedTestIds
        />
      </g>
    )
  }
)

GraphEdge.displayName = 'GraphEdge'

export default GraphEdge
