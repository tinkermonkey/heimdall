import React, { useMemo } from 'react'
import { useGraphCanvas } from './GraphCanvas'
import { bezierPath, rectEdgePoint } from '../utils/graph'
import './GraphEdge.css'

export interface GraphEdgeProps extends React.SVGAttributes<SVGGElement> {
  id: string
  sourceId: string
  targetId: string
  label?: string
  variant?: 'default' | 'hot' | 'irrelevant'
}

const NODE_WIDTH = 138
const NODE_HEIGHT = 30

function getNodeWidth(label?: string): number {
  if (!label) return NODE_WIDTH
  const len = label.length
  if (len <= 8) return 110
  if (len <= 14) return NODE_WIDTH
  return 168
}

function getActualNodeDimensions(node: any): { width: number; height: number } {
  return {
    width: node.width ?? getNodeWidth(node.label),
    height: node.height ?? NODE_HEIGHT,
  }
}

export const GraphEdge = React.forwardRef<SVGGElement, GraphEdgeProps>(
  (
    { id, sourceId, targetId, label, variant = 'default', className = '', ...props },
    ref
  ) => {
    const { nodes } = useGraphCanvas()

    const path = useMemo(() => {
      const sourceNode = nodes.find((n) => n.id === sourceId)
      const targetNode = nodes.find((n) => n.id === targetId)

      if (!sourceNode || !targetNode) return null

      const sourceDims = getActualNodeDimensions(sourceNode)
      const targetDims = getActualNodeDimensions(targetNode)

      const sourcePoint = rectEdgePoint(
        sourceNode.x,
        sourceNode.y,
        sourceDims.width,
        sourceDims.height,
        targetNode.x,
        targetNode.y
      )

      const targetPoint = rectEdgePoint(
        targetNode.x,
        targetNode.y,
        targetDims.width,
        targetDims.height,
        sourceNode.x,
        sourceNode.y
      )

      return bezierPath(sourcePoint, targetPoint, 0.22)
    }, [nodes, sourceId, targetId])

    if (!path) return null

    const classNames = [
      'graph-edge',
      variant !== 'default' && `graph-edge--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const arrowMarkerId = `arrow-${id}`
    const arrowRoseMarkerId = `arrow-rose-${id}`
    const arrowCyanMarkerId = `arrow-cyan-${id}`

    const markerUrl =
      variant === 'hot' ? `url(#${arrowCyanMarkerId})` : variant === 'irrelevant' ? `url(#${arrowRoseMarkerId})` : `url(#${arrowMarkerId})`

    return (
      <g ref={ref} className={classNames} data-testid={`graph-edge-${id}`} {...props}>
        <defs>
          <marker
            id={arrowMarkerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-edge-strong, #94a3b8)" />
          </marker>
          <marker
            id={arrowRoseMarkerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(var(--status-rose))" />
          </marker>
          <marker
            id={arrowCyanMarkerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(var(--accent-primary))" />
          </marker>
        </defs>

        <path className="graph-edge__hit" d={path.d} data-testid={`graph-edge-hit-${id}`} />
        <path
          className="graph-edge__line"
          d={path.d}
          markerEnd={markerUrl}
          data-testid={`graph-edge-line-${id}`}
        />

        {label && (
          <g className="graph-edge__label" transform={`translate(${path.mid.x - (label.length * 3.3 + 7)}, ${path.mid.y - 9})`}>
            <rect
              width={label.length * 6.6 + 14}
              height="18"
              rx="3"
              className="graph-edge__label-bg"
              data-testid={`graph-edge-label-bg-${id}`}
            />
            <text
              x={label.length * 3.3 + 7}
              y="12"
              className="graph-edge__label-text"
              data-testid={`graph-edge-label-text-${id}`}
            >
              {label}
            </text>
          </g>
        )}
      </g>
    )
  }
)

GraphEdge.displayName = 'GraphEdge'

export default GraphEdge
