import React from 'react'
import { BaseGraphNodeComponentProps } from './GraphCanvas'
import './GraphNode.css'

export interface GraphNodeProps extends BaseGraphNodeComponentProps {
  kind?: string
  domainColor?: string
  width?: number
  height?: number
}

export const NODE_WIDTH = 138
export const NODE_HEIGHT = 30

export const GraphNode = React.forwardRef<HTMLDivElement, GraphNodeProps>(
  (
    {
      id,
      x,
      y,
      label,
      kind,
      domainColor = 'default',
      selected = false,
      width = NODE_WIDTH,
      height = NODE_HEIGHT,
      onSelect,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const classNames = [
      'graph-node',
      selected && 'selected',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      onSelect?.(id)
    }

    return (
      <div
        ref={ref}
        className={classNames}
        style={{
          left: `${x - width / 2}px`,
          top: `${y - height / 2}px`,
          width: `${width}px`,
          height: `${height}px`,
          ...style,
        }}
        data-testid={`graph-node-${id}`}
        data-domain={domainColor}
        data-kind={kind}
        onClick={handleClick}
        {...props}
      >
        <span className="graph-node__swatch"></span>
        <span className="graph-node__label">{label}</span>
        {kind && <span className="graph-node__kind">{kind}</span>}
      </div>
    )
  }
)

GraphNode.displayName = 'GraphNode'

export default GraphNode
