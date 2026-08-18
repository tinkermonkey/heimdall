import React from 'react'
import { Icon } from './Icon'
import './GraphEdgeInspector.css'

export interface GraphEdgeMetadata {
  id: string
  /** The relation/predicate label — rendered as this panel's title, same slot GraphInspector
   *  uses for a node's title. */
  predicate: string
  sourceId: string
  sourceTitle: string
  sourceDomain?: string
  targetId: string
  targetTitle: string
  targetDomain?: string
  variant?: 'default' | 'hot' | 'irrelevant'
  /** 0-100, shown as a raw number — same weight value GraphEdge/GraphCanvas map to stroke width. */
  weight?: number
  metadata?: Record<string, string | number | boolean | null | undefined>
}

export interface GraphEdgeInspectorProps extends React.HTMLAttributes<HTMLDivElement> {
  edge?: GraphEdgeMetadata | null
  /** Navigate to the source or target node — e.g. re-select it so a node inspector panel
   *  elsewhere on the page updates. Omit to render the endpoints as plain (non-interactive) text. */
  onNodeSelect?: (nodeId: string) => void
  emptyStateText?: string
}

/**
 * Detail panel for a selected edge — same head/body visual language as GraphInspector so the two
 * read as one family when stacked (typically source node → this → target node). Deliberately
 * lighter than GraphInspector: an edge has no description or open-ended relationship list, just
 * the predicate, its two endpoints, and whatever scalar metadata the caller attaches.
 */
export const GraphEdgeInspector = React.forwardRef<HTMLDivElement, GraphEdgeInspectorProps>(
  (
    {
      edge,
      onNodeSelect,
      emptyStateText = 'Select an edge to inspect.',
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = ['graph-edge-inspector', className].filter(Boolean).join(' ')

    if (!edge) {
      return (
        <div ref={ref} className={classNames} {...props}>
          <div className="graph-edge-inspector__empty" data-testid="edge-inspector-empty">
            {emptyStateText}
          </div>
        </div>
      )
    }

    const metadataEntries = edge.metadata ? Object.entries(edge.metadata) : []

    const renderEndpoint = (nodeId: string, title: string, domain: string | undefined, testId: string) => {
      const swatch = <span className="graph-edge-inspector__endpoint-swatch" />
      if (!onNodeSelect) {
        return (
          <span className="graph-edge-inspector__endpoint" data-domain={domain} data-testid={testId}>
            {swatch}
            <span>{title}</span>
          </span>
        )
      }
      return (
        <button
          type="button"
          className="graph-edge-inspector__endpoint graph-edge-inspector__endpoint--button"
          data-domain={domain}
          onClick={() => onNodeSelect(nodeId)}
          aria-label={`Inspect ${title}`}
          data-testid={testId}
        >
          {swatch}
          <span>{title}</span>
        </button>
      )
    }

    return (
      <div ref={ref} className={classNames} {...props}>
        <div className="graph-edge-inspector__head">
          <div className="graph-edge-inspector__head-eyebrow">
            {edge.variant && edge.variant !== 'default' && (
              <span className={`graph-edge-inspector__badge graph-edge-inspector__badge--${edge.variant}`}>
                {edge.variant}
              </span>
            )}
          </div>
          <div className="graph-edge-inspector__title" data-testid="edge-inspector-title">
            {edge.predicate}
          </div>
          <div className="graph-edge-inspector__id" data-testid="edge-inspector-id">
            {edge.id}
          </div>
        </div>

        <div className="graph-edge-inspector__body">
          <div className="graph-edge-inspector__endpoints" data-testid="edge-inspector-endpoints">
            {renderEndpoint(edge.sourceId, edge.sourceTitle, edge.sourceDomain, 'edge-inspector-source')}
            <Icon name="arrowRight" size={14} className="graph-edge-inspector__arrow" />
            {renderEndpoint(edge.targetId, edge.targetTitle, edge.targetDomain, 'edge-inspector-target')}
          </div>

          {(edge.weight !== undefined || metadataEntries.length > 0) && (
            <dl className="graph-edge-inspector__kv" data-testid="edge-inspector-metadata">
              {edge.weight !== undefined && (
                <React.Fragment>
                  <dt>weight</dt>
                  <dd>{edge.weight}</dd>
                </React.Fragment>
              )}
              {metadataEntries.map(([key, value]) => (
                <React.Fragment key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </React.Fragment>
              ))}
            </dl>
          )}
        </div>
      </div>
    )
  }
)

GraphEdgeInspector.displayName = 'GraphEdgeInspector'

export default GraphEdgeInspector
