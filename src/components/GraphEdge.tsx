import React, { useMemo } from 'react'
import { useGraphCanvas } from './GraphCanvasContext'
import { bezierPath, rectEdgePoint } from '../utils/graph'
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
}

export const GraphEdge = React.forwardRef<SVGGElement, GraphEdgeProps>(
  ({ id, sourceId, targetId, label, variant = 'default', weight, opacity, strokeDash, className = '', ...props }, ref) => {
    const { getNodeRect } = useGraphCanvas()

    const path = useMemo(() => {
      const src = getNodeRect(sourceId)
      const tgt = getNodeRect(targetId)
      if (!src) { console.warn(`GraphEdge: source node "${sourceId}" not found`); return null }
      if (!tgt) { console.warn(`GraphEdge: target node "${targetId}" not found`); return null }
      const sp = rectEdgePoint(src.x, src.y, src.width, src.height, tgt.x, tgt.y)
      const tp = rectEdgePoint(tgt.x, tgt.y, tgt.width, tgt.height, src.x, src.y)
      return bezierPath(sp, tp, 0.22)
    }, [getNodeRect, sourceId, targetId])

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
