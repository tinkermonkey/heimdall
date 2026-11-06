import React, { useMemo } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { StatTile } from './StatTile'
import type { RelationshipLink } from './GraphInspector'
import { followOptionLabel, useLayeredGraphProp } from './LayeredGraphControls'
import type { LayeredGraphState } from '../hooks/useLayeredGraph'
import { isLinkTraversable, visiblePredicates } from '../utils/layered/filters'
import { linkPredicateLabel } from '../utils/layered/labels'
import type { IndexedLayer, IndexedNode } from '../utils/layered/types'
import './LayeredGraphControls.css'
import './ReachInspector.css'

/** The selection's relationships, split the way `ReachInspector` lists them. */
export interface ReachRelationships {
  node: IndexedNode
  layer: IndexedLayer
  /** Direct links to other layers (`hop: 1`, `layer` set). */
  cross: RelationshipLink[]
  /** Direct links within the node's layer. */
  intra: RelationshipLink[]
  /** Nodes reached at hop 2 or deeper, with `hop`, `via` and `layer`; by hop, then layer rank, then name. */
  followed: RelationshipLink[]
  /** Reached nodes, the selection excluded. */
  reachCount: number
  /** Layers the reach touches, the selection's included. */
  reachLayerCount: number
}

/**
 * The selected node's relationships as `RelationshipLink`s (with the layered `hop`, `via` and
 * `layer` fields), for `ReachInspector` or a `GraphInspector`. Lists only links the filters leave
 * traversable, labelled with their visible predicates. null without a selection.
 */
export function reachRelationships(graph: Pick<LayeredGraphState, 'index' | 'filters' | 'reach' | 'selectedId'>): ReachRelationships | null {
  const { index, filters, reach, selectedId } = graph
  const node = selectedId ? index.nodeById.get(selectedId) : undefined
  if (!node) return null
  const layer = index.layerById.get(node.layerId)!
  const layerRef = (l: IndexedLayer) => ({ id: l.id, label: l.label, color: l.color })
  const predicate = (linkId: string) => {
    const link = index.linkById.get(linkId)!
    return linkPredicateLabel(link, index.catalog, visiblePredicates(link, filters))
  }

  const cross: RelationshipLink[] = []
  const intra: RelationshipLink[] = []
  for (const a of node.adjacency) {
    const link = index.linkById.get(a.linkId)
    const other = index.nodeById.get(a.otherId)
    if (!link || !other || !isLinkTraversable(link, index, filters)) continue
    const rel: RelationshipLink = {
      id: `${link.id}:${a.direction}`,
      target: other.id,
      targetTitle: other.label,
      predicate: predicate(link.id),
      direction: a.direction,
      hop: 1,
      layer: layerRef(index.layerById.get(other.layerId)!),
    }
    ;(link.cross ? cross : intra).push(rel)
  }

  const followed: RelationshipLink[] = []
  if (reach.originId === node.id) {
    const deep = [...reach.hopOf.entries()]
      .filter(([, h]) => h >= 2)
      .map(([id, h]) => ({ n: index.nodeById.get(id)!, h }))
      .sort((x, y) => x.h - y.h || x.n.layerRank - y.n.layerRank || x.n.label.localeCompare(y.n.label))
    for (const { n, h } of deep) {
      const v = reach.via.get(n.id)
      const from = v ? index.nodeById.get(v.fromId) : undefined
      const link = v ? index.linkById.get(v.linkId) : undefined
      followed.push({
        id: `followed:${n.id}`,
        target: n.id,
        targetTitle: n.label,
        predicate: link ? predicate(link.id) : '',
        direction: link && link.sourceId === v!.fromId ? 'out' : 'in',
        hop: h,
        via: from && link ? { id: from.id, title: from.label, predicate: predicate(link.id) } : undefined,
        layer: layerRef(index.layerById.get(n.layerId)!),
      })
    }
  }

  const reachLayers = new Set<string>()
  for (const id of reach.hopOf.keys()) {
    const n = index.nodeById.get(id)
    if (n) reachLayers.add(n.layerId)
  }
  return {
    node,
    layer,
    cross,
    intra,
    followed,
    reachCount: Math.max(0, reach.hopOf.size - 1),
    reachLayerCount: reachLayers.size,
  }
}

/** `reach 13 nodes across 3 layers · follow +1 layer`. */
export function reachSummaryText(rels: Pick<ReachRelationships, 'reachCount' | 'reachLayerCount'>, follow: number): string {
  const nodes = `${rels.reachCount} node${rels.reachCount === 1 ? '' : 's'}`
  const layers = `${rels.reachLayerCount} layer${rels.reachLayerCount === 1 ? '' : 's'}`
  return `reach ${nodes} across ${layers} · follow ${follow > 0 ? followOptionLabel(follow) : 'direct only'}`
}

export interface ReachInspectorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`. */
  graph?: LayeredGraphState
  /** Shown with no selection. Default `No node selected.` */
  emptyText?: React.ReactNode
  /** Replaces the empty text with no selection, e.g. a `LayerList` and `BridgeNodeList`. */
  empty?: React.ReactNode
  /** Clear-selection button beside the layer eyebrow. Default true. */
  showClear?: boolean
  /** The node's `attributes.description`. Default true. */
  showDescription?: boolean
  /** Across-layers and within-layer stat tiles. Default true. */
  showStats?: boolean
  /** The "Followed across layers" list (hop 2 and deeper). Default true. */
  showFollowed?: boolean
  /** The mono reach line under the cross-layer rows. Default true. */
  showReachSummary?: boolean
  /** Called when a row is picked. Unset: the row's node becomes the selection. */
  onNodeSelect?: (nodeId: string) => void
}

function RelRow({ rel, showLayer, onPick }: { rel: RelationshipLink; showLayer: boolean; onPick: (id: string) => void }) {
  const dir = rel.direction === 'out' ? 'outgoing' : 'incoming'
  return (
    <li>
      <button
        type="button"
        className="layered-row reach-inspector__rel"
        aria-label={`${rel.targetTitle}, ${dir}${rel.predicate ? ` ${rel.predicate}` : ''}${showLayer && rel.layer ? `, ${rel.layer.label} layer` : ''}`}
        onClick={() => onPick(rel.target)}
      >
        <Icon className="reach-inspector__dir" name={rel.direction === 'out' ? 'arrowRight' : 'arrowLeft'} size={13} aria-hidden="true" />
        <span className="layered-row__name">{rel.targetTitle}</span>
        {rel.predicate && <span className="reach-inspector__pred" aria-hidden="true">{rel.predicate}</span>}
        {showLayer && rel.layer && <span className="layered-dot" style={{ background: rel.layer.color }} aria-hidden="true" />}
      </button>
    </li>
  )
}

/**
 * Inspector for the layered views' selection: layer eyebrow, name, identifier and description;
 * across-layer and within-layer link counts; the direct relationships split by layer, each with a
 * direction icon, predicate and layer dot; the nodes followed across layers with the node and
 * predicate they were reached through and a hop badge; and a reach summary line. Rows select
 * their node.
 */
export const ReachInspector = React.forwardRef<HTMLDivElement, ReachInspectorProps>(
  (
    {
      graph,
      emptyText = 'No node selected.',
      empty,
      showClear = true,
      showDescription = true,
      showStats = true,
      showFollowed = true,
      showReachSummary = true,
      onNodeSelect,
      className = '',
      style,
      ...props
    },
    ref,
  ) => {
    const g = useLayeredGraphProp(graph, 'ReachInspector')
    const { index, filters, reach, selectedId, follow } = g
    const rels = useMemo(() => reachRelationships({ index, filters, reach, selectedId }), [index, filters, reach, selectedId])
    const pick = onNodeSelect ?? g.select
    const classNames = ['reach-inspector', className].filter(Boolean).join(' ')

    if (!rels) {
      return (
        <div ref={ref} className={classNames} style={style} {...props}>
          {empty ?? <p className="reach-inspector__empty">{emptyText}</p>}
        </div>
      )
    }

    const { node, layer, cross, intra, followed } = rels
    const layerStyle = { '--reach-inspector-layer': layer.color } as React.CSSProperties
    return (
      <div ref={ref} className={classNames} style={{ ...layerStyle, ...style }} {...props}>
        <section className="reach-inspector__head" aria-label={`${node.label}, ${layer.label} layer`}>
          <div className="reach-inspector__eyebrow-row">
            <span className="layered-control__eyebrow reach-inspector__layer">{layer.label} layer</span>
            {showClear && (
              <Button variant="ghost" size="sm" icon aria-label="Clear selection" onClick={() => g.select(null)}>
                <Icon name="x" size={14} aria-hidden="true" />
              </Button>
            )}
          </div>
          <h2 className="reach-inspector__title">{node.label}</h2>
          <span className="reach-inspector__id">{node.nodeId}</span>
          {showDescription && node.description && <p className="reach-inspector__description">{node.description}</p>}
          {showStats && (
            <div className="reach-inspector__stats">
              <StatTile className="reach-inspector__stat" color="amber" label="Across layers" value={cross.length} />
              <StatTile className="reach-inspector__stat reach-inspector__stat--layer" color="neutral" label="Within layer" value={intra.length} />
            </div>
          )}
        </section>

        <section className="reach-inspector__section">
          <span className="layered-control__eyebrow">Across layers</span>
          {cross.length > 0 ? (
            <ul className="layered-list__items">
              {cross.map((r) => <RelRow key={r.id} rel={r} showLayer onPick={pick} />)}
            </ul>
          ) : (
            <p className="reach-inspector__empty-mini">No cross-layer links on this node.</p>
          )}
          {showReachSummary && <span className="reach-inspector__summary">{reachSummaryText(rels, follow)}</span>}
        </section>

        {showFollowed && followed.length > 0 && (
          <section className="reach-inspector__section">
            <span className="layered-control__eyebrow reach-inspector__followed-title">Followed across layers · {followed.length}</span>
            <ul className="layered-list__items">
              {followed.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="layered-row reach-inspector__rel reach-inspector__rel--followed"
                    aria-label={`${r.targetTitle}, ${r.layer?.label} layer, ${r.hop! - 1} past direct${r.via ? `, via ${r.via.title} ${r.via.predicate}` : ''}`}
                    onClick={() => pick(r.target)}
                  >
                    <span className="layered-dot" style={{ background: r.layer?.color }} aria-hidden="true" />
                    <span className="reach-inspector__followed-text" aria-hidden="true">
                      <span className="layered-row__name">{r.targetTitle}</span>
                      {r.via && (
                        <span className="reach-inspector__via">
                          via {r.via.title}
                          {r.via.predicate ? ` · ${r.via.predicate}` : ''}
                        </span>
                      )}
                    </span>
                    <span className="reach-inspector__hop" aria-hidden="true">+{r.hop! - 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="reach-inspector__section">
          <span className="layered-control__eyebrow">Within {layer.label}</span>
          {intra.length > 0 ? (
            <ul className="layered-list__items">
              {intra.map((r) => <RelRow key={r.id} rel={r} showLayer={false} onPick={pick} />)}
            </ul>
          ) : (
            <p className="reach-inspector__empty-mini">No links within this layer.</p>
          )}
        </section>
      </div>
    )
  },
)

ReachInspector.displayName = 'ReachInspector'

export default ReachInspector
