import React from 'react'
import { type BaseGraphNodeComponentProps } from './GraphCanvas'
import { Icon } from './Icon'
import './GraphNode.css'

export interface GraphNodeProps extends BaseGraphNodeComponentProps, Omit<React.HTMLAttributes<HTMLDivElement>, 'id' | 'onSelect'> {
  kind?: string
  domainColor?: string
  /** Whether this node has structural children — draws the collapse/expand toggle when true.
   *  Matches GraphCanvas's GraphNodeHierarchyMeta.hasChildren. */
  hasChildren?: boolean
  /** Whether the node's subtree is currently hidden. Flips the toggle's chevron direction. */
  collapsed?: boolean
  /** Shown as a "+N" badge next to the toggle while collapsed. 0 renders no badge. */
  hiddenDescendantCount?: number
  /** Activates the collapse/expand toggle. Omit to render hasChildren without an interactive toggle. */
  onToggleCollapse?: () => void
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
      hasChildren = false,
      collapsed = false,
      hiddenDescendantCount = 0,
      onToggleCollapse,
      className = '',
      style: _style,
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
        onKeyDown={(e) => {
          // A keydown from the collapse toggle button below bubbles up here too — bail out before
          // hijacking Enter/Space, or the toggle's own native button activation never fires
          // (preventDefault suppresses it) and the whole progressive-disclosure affordance becomes
          // keyboard-inoperable, selecting the node instead of collapsing/expanding it.
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect?.(id) }
        }}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        aria-pressed={onSelect ? selected : undefined}
        {...props}
      >
        <span className="graph-node__swatch" />
        <span className="graph-node__label">{label}</span>
        {kind && <span className="graph-node__kind">{kind}</span>}
        {/* Only rendered when the caller actually wired onToggleCollapse — hasChildren alone
            (true for any node with a structural child, which every edge is by default) would
            otherwise put this on nodes whose callers never opted into collapse/expand at all.
            No data-testid here deliberately: GraphCanvas renders this same content twice (once
            off-screen for measurement, once in the real SVG), so a testid on anything inside it
            — not just the outer node <g>, which GraphCanvas itself controls — would resolve to
            two elements. Locate it via .graph-node__collapse-toggle scoped under the node's own
            unique [data-testid="graph-node-{id}"] instead. */}
        {hasChildren && onToggleCollapse && (
          <button
            type="button"
            className="graph-node__collapse-toggle"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
            aria-expanded={!collapsed}
            onClick={(e) => { e.stopPropagation(); onToggleCollapse() }}
          >
            {collapsed && hiddenDescendantCount > 0 && (
              <span className="graph-node__hidden-badge">{hiddenDescendantCount}</span>
            )}
            <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} size={12} />
          </button>
        )}
      </div>
    )
  }
)

GraphNode.displayName = 'GraphNode'

export default GraphNode
