import React from 'react'
import { type BaseGraphNodeComponentProps } from './GraphCanvas'
import './GraphNode.css'

export interface GraphNodeProps extends BaseGraphNodeComponentProps {
  kind?: string
  domainColor?: string
  className?: string
  style?: React.CSSProperties
}

export const GraphNode = React.forwardRef<HTMLDivElement, GraphNodeProps>(
  (
    {
      id,
      label,
      kind,
      domainColor = 'default',
      selected = false,
      onSelect,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const classNames = ['graph-node', selected && 'selected', className]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={ref}
        className={classNames}
        data-domain={domainColor}
        data-kind={kind}
        onClick={(e) => { e.stopPropagation(); onSelect?.(id) }}
        style={style}
        {...props}
      >
        <span className="graph-node__swatch" />
        <span className="graph-node__label">{label}</span>
        {kind && <span className="graph-node__kind">{kind}</span>}
      </div>
    )
  }
)

GraphNode.displayName = 'GraphNode'

export default GraphNode
