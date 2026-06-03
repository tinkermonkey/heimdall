import React from 'react'
import './LineageRail.css'
import { Icon, type IconName } from './Icon'

export interface LineageNode {
  icon?: IconName
  label: string
  onClick?: () => void
}

export interface LineageRailProps extends React.HTMLAttributes<HTMLDivElement> {
  nodes: LineageNode[]
  wrap?: boolean
  'aria-label'?: string
}

export const LineageRail = React.forwardRef<HTMLDivElement, LineageRailProps>(
  ({ nodes, wrap = false, className = '', 'aria-label': ariaLabel, ...props }, ref) => {
    if (nodes.length === 0) return null

    const containerClass = [
      'lineage-rail',
      wrap && 'lineage-rail--wrap',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const label = ariaLabel || `Lineage: ${nodes.map((n) => n.label).join(' → ')}`

    return (
      <div ref={ref} className={containerClass} role="list" aria-label={label} {...props}>
        {nodes.map((node, index) => {
          const isHead = index === 0

          return (
            <React.Fragment key={`${node.label}-${index}`}>
              {index > 0 && (
                <span className="lineage-rail__arrow" aria-hidden="true">
                  →
                </span>
              )}
              <LineageNodeElement node={node} isHead={isHead} />
            </React.Fragment>
          )
        })}
      </div>
    )
  }
)

LineageRail.displayName = 'LineageRail'

interface LineageNodeElementProps {
  node: LineageNode
  isHead: boolean
}

const LineageNodeElement: React.FC<LineageNodeElementProps> = ({ node, isHead }) => {
  const baseClass = isHead ? 'lineage-rail__node lineage-rail__node--head' : 'lineage-rail__node'

  if (!node.onClick) {
    return (
      <span className={baseClass} role="listitem">
        {node.icon && <Icon name={node.icon} size={14} />}
        <span className="lineage-rail__label">{node.label}</span>
      </span>
    )
  }

  return (
    <button
      type="button"
      className={`${baseClass} lineage-rail__node--interactive`}
      onClick={node.onClick}
      role="listitem"
      aria-current={isHead ? 'step' : undefined}
    >
      {node.icon && <Icon name={node.icon} size={14} />}
      <span className="lineage-rail__label">{node.label}</span>
    </button>
  )
}

export default LineageRail
