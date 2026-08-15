import React, { useMemo } from 'react'
import { useGraphCanvas } from './GraphCanvasContext'
import { computeEdgePath, edgeLabelSize, findClearLabelPosition, type EdgeAnchor } from '../utils/graph'
import { GraphEdgeShape } from './GraphEdgeShape'
import './GraphEdge.css'

export interface GraphEdgeProps extends Omit<React.SVGAttributes<SVGGElement>, 'onSelect'> {
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
  /** Draws the edge in the accent color. Pair with onSelect. */
  selected?: boolean
  /** Called with `id` when the line or label is clicked, or activated via Enter/Space while
   *  focused. Without it, the edge renders but isn't interactive. */
  onSelect?: (id: string) => void
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
      selected = false,
      onSelect,
      className = '',
      ...props
    },
    ref
  ) => {
    const { getNodeRect, nodeRects } = useGraphCanvas()

    const path = useMemo(() => {
      const src = getNodeRect(sourceId)
      const tgt = getNodeRect(targetId)
      if (!src) { console.warn(`GraphEdge: source node "${sourceId}" not found`); return null }
      if (!tgt) { console.warn(`GraphEdge: target node "${targetId}" not found`); return null }
      const computed = computeEdgePath(src, tgt, { sourceAnchor, targetAnchor, curvature })
      const labelPos = label
        ? findClearLabelPosition(computed.points, edgeLabelSize(label), nodeRects, 6)
        : computed.mid
      return { ...computed, labelPos }
    }, [getNodeRect, sourceId, targetId, sourceAnchor, targetAnchor, curvature, label, nodeRects])

    if (!path) return null

    const classNames = [
      'graph-edge',
      variant !== 'default' && `graph-edge--${variant}`,
      selected && 'selected',
      className,
    ]
      .filter(Boolean)
      .join(' ')
    const interactive = !!onSelect

    return (
      <g
        ref={ref}
        className={classNames}
        role={interactive ? 'button' : 'presentation'}
        aria-hidden={interactive ? undefined : true}
        aria-pressed={interactive ? selected : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect!(id) } } : undefined}
        data-testid={`graph-edge-${id}`}
        {...props}
      >
        <GraphEdgeShape
          id={id}
          d={path.d}
          mid={path.labelPos}
          label={label}
          variant={variant}
          weight={weight}
          opacity={opacity}
          strokeDash={strokeDash}
          onSelect={onSelect}
          detailedTestIds
        />
      </g>
    )
  }
)

GraphEdge.displayName = 'GraphEdge'

export default GraphEdge
