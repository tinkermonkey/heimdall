import React, { useContext, useMemo, useState } from 'react'
import type { GraphEdge, GraphNodeData } from './GraphCanvas'
import { LayeredGraphContext, useLayeredGraph, type LayeredGraphState, type UseLayeredGraphOptions } from '../hooks/useLayeredGraph'
import { orderAcrossLayers, type NodeOrder } from '../utils/layered/layout'
import { linkPredicateLabel } from '../utils/layered/labels'
import type { BuildLayeredIndexOptions, IndexedLink, IndexedNode } from '../utils/layered/types'
import './AdjacencyMatrix.css'

export interface AdjacencyMatrixProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`, else the matrix builds its own from `nodes`, `edges` and `layering`. */
  graph?: LayeredGraphState
  /** Standalone data (ignored when `graph` or a context is present). */
  nodes?: readonly GraphNodeData[]
  edges?: readonly GraphEdge[]
  /** Standalone layering (ignored when `graph` or a context is present). Memoize it. */
  layering?: BuildLayeredIndexOptions
  /** Standalone options passed to `useLayeredGraph` (selection, follow, filters, label mode). */
  graphOptions?: Omit<UseLayeredGraphOptions, 'nodes' | 'edges' | 'layering'>
  /**
   * Node order within each layer, for rows and columns alike. Default `coupled-x` (nodes linked
   * across layers sit at similar positions in every block); `degree` when the graph has no layout.
   */
  order?: NodeOrder
  /** Cell size in px, or `auto` (fits about 820px of cells, clamped to 10–18). Default `auto`. */
  cellSize?: number | 'auto'
  /** Width of the row-label column in px. Default 210. */
  labelWidth?: number
  /** Link count in the corner of each cross-layer block. Default true. */
  showBlockCounts?: boolean
  /** Legend of the predicate codes shown in cells. Default true. */
  showCodeLegend?: boolean
  /** Called when a cell is clicked. Unset: a click selects the link's source node. */
  onLinkSelect?: (link: IndexedLink) => void
}

const EMPTY_NODES: GraphNodeData[] = []
const EMPTY_EDGES: GraphEdge[] = []
const EMPTY_LAYERING: BuildLayeredIndexOptions = { layerBy: '' }

const MIN_HEADER_HEIGHT = 60
const PAD = 40
// JetBrains Mono advance width, in em.
const MONO_CHAR_EM = 0.6

/**
 * Directed block adjacency matrix of a layered graph: one row and one column per node, grouped by
 * layer, one cell per link (row = source, column = target). Diagonal blocks hold links within a
 * layer, off-diagonal blocks the links between two layers. Every link is visible with no
 * crossings, so it stays legible on dense graphs where node-link drawings tangle. Cells take the
 * link's category style, or the amber reach ramp around the selection, and show predicate codes
 * per `predicateLabels`.
 */
export const AdjacencyMatrix = React.forwardRef<HTMLDivElement, AdjacencyMatrixProps>(
  (
    {
      graph,
      nodes,
      edges,
      layering,
      graphOptions,
      order,
      cellSize = 'auto',
      labelWidth = 210,
      showBlockCounts = true,
      showCodeLegend = true,
      onLinkSelect,
      className = '',
      ...props
    },
    ref,
  ) => {
    const ctx = useContext(LayeredGraphContext)
    const external = graph ?? ctx
    const own = useLayeredGraph(
      external
        ? { nodes: EMPTY_NODES, edges: EMPTY_EDGES, layering: EMPTY_LAYERING, layout: false }
        : { ...graphOptions, nodes: nodes ?? EMPTY_NODES, edges: edges ?? EMPTY_EDGES, layering: layering ?? EMPTY_LAYERING },
    )
    const g = external ?? own
    const { index, filters, reach, layout, selectedId, linkEmphasis } = g
    const [hover, setHover] = useState<{ row: string; col: string } | null>(null)

    const effectiveOrder = order ?? (layout ? 'coupled-x' : 'degree')
    const ids = useMemo(
      () => orderAcrossLayers(index, layout, effectiveOrder).filter((id) => !filters.hiddenLayers.includes(index.nodeById.get(id)!.layerId)),
      [index, layout, effectiveOrder, filters.hiddenLayers],
    )
    const at = useMemo(() => new Map(ids.map((id, i) => [id, i])), [ids])
    const n = ids.length
    const cs = cellSize === 'auto' ? Math.max(10, Math.min(18, Math.floor(820 / Math.max(1, n)))) : cellSize
    const fs = Math.min(11, Math.round(cs * 0.66 * 10) / 10)
    // Rotated column labels (-60°) reach up by ~0.87 and right by ~0.5 of their length.
    const maxLabelPx = ids.reduce((m, id) => Math.max(m, index.nodeById.get(id)!.displayLabel.length), 0) * fs * MONO_CHAR_EM
    const LW = labelWidth
    const TH = Math.max(MIN_HEADER_HEIGHT, Math.ceil(maxLabelPx * 0.87) + 24)
    const width = LW + n * cs + Math.max(PAD, Math.ceil(maxLabelPx * 0.5) + 16)
    const height = TH + n * cs + PAD

    // layer spans along the axis
    const spans = useMemo(() => {
      const out: { layerId: string; start: number; end: number }[] = []
      ids.forEach((id, i) => {
        const layerId = index.nodeById.get(id)!.layerId
        const last = out[out.length - 1]
        if (last && last.layerId === layerId) last.end = i + 1
        else out.push({ layerId, start: i, end: i + 1 })
      })
      return out
    }, [ids, index])

    const blockCounts = useMemo(() => {
      const counts = new Map<string, number>()
      for (const l of index.links) {
        if (!linkEmphasis(l).visible) continue
        const key = index.nodeById.get(l.sourceId)!.layerId + '\u0000' + index.nodeById.get(l.targetId)!.layerId
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      return counts
    }, [index, linkEmphasis])

    const cells = useMemo(() => {
      const hasSelection = !!reach.originId
      return index.links.flatMap((l) => {
        const r = at.get(l.sourceId)
        const c = at.get(l.targetId)
        if (r === undefined || c === undefined) return []
        const em = linkEmphasis(l)
        if (!em.visible) return []
        const opacity = em.highlighted ? 1 : hasSelection ? 0.25 : l.cross ? 0.95 : 0.7
        const code = em.label && l.predicates.length > 0
          ? (index.predicateCodes.get(l.predicates[0]) ?? '') + (l.predicates.length > 1 ? '+' : '')
          : ''
        return [{ link: l, r, c, em, opacity, code }]
      })
    }, [index, at, linkEmphasis, reach.originId])

    const usedCodes = useMemo(() => {
      const seen = new Map<string, string>()
      for (const cell of cells) {
        if (!cell.code) continue
        for (const p of cell.link.predicates) if (!seen.has(p)) seen.set(p, index.predicateCodes.get(p) ?? '')
      }
      return [...seen].sort((a, b) => a[0].localeCompare(b[0]))
    }, [cells, index])

    const nodeLabelClass = (node: IndexedNode) => {
      const em = g.nodeEmphasis(node)
      if (em.selected) return 'adjacency-matrix__label--selected'
      if (em.hop !== null) return em.followed ? 'adjacency-matrix__label--followed' : 'adjacency-matrix__label--reached'
      return reach.originId ? 'adjacency-matrix__label--dim' : ''
    }
    const onHeaderKey = (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        g.select(selectedId === id ? null : id)
      }
    }
    const selIndex = selectedId != null ? at.get(selectedId) : undefined
    // The hovered cell's row and column, if both are still drawn (a filter may have hidden them since).
    const hoverRow = hover ? at.get(hover.row) : undefined
    const hoverCol = hover ? at.get(hover.col) : undefined

    return (
      <div ref={ref} className={['adjacency-matrix', className].filter(Boolean).join(' ')} {...props}>
        <div className="adjacency-matrix__scroll">
          <svg
            className="adjacency-matrix__svg"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label={`Adjacency matrix, ${n} by ${n}: rows are link sources, columns link targets`}
            onMouseLeave={() => setHover(null)}
          >
            {/* blocks */}
            {spans.map((rs) =>
              spans.map((csn) => {
                const diag = rs.layerId === csn.layerId
                const layer = index.layerById.get(rs.layerId)!
                const count = blockCounts.get(rs.layerId + '\u0000' + csn.layerId) ?? 0
                return (
                  <g key={rs.layerId + '|' + csn.layerId}>
                    <rect
                      className="adjacency-matrix__block"
                      x={LW + csn.start * cs}
                      y={TH + rs.start * cs}
                      width={(csn.end - csn.start) * cs}
                      height={(rs.end - rs.start) * cs}
                      style={{ fill: diag ? layer.color : 'rgb(var(--accent-primary))', fillOpacity: diag ? 0.08 : 0.03 }}
                    />
                    {showBlockCounts && !diag && (
                      <text className="adjacency-matrix__block-count" x={LW + csn.end * cs - 4} y={TH + rs.end * cs - 5} textAnchor="end">
                        {count}
                      </text>
                    )}
                  </g>
                )
              }),
            )}

            {/* selection and hover bands */}
            {selIndex !== undefined && (
              <g className="adjacency-matrix__band adjacency-matrix__band--selected">
                <rect x={LW} y={TH + selIndex * cs} width={n * cs} height={cs} />
                <rect x={LW + selIndex * cs} y={TH} width={cs} height={n * cs} />
              </g>
            )}
            {hoverRow !== undefined && hoverCol !== undefined && (
              <g className="adjacency-matrix__band adjacency-matrix__band--hover">
                <rect x={LW} y={TH + hoverRow * cs} width={n * cs} height={cs} />
                <rect x={LW + hoverCol * cs} y={TH} width={cs} height={n * cs} />
              </g>
            )}

            {/* headers: row labels on the left, column labels rotated above */}
            {ids.map((id, i) => {
              const node = index.nodeById.get(id)!
              const layer = index.layerById.get(node.layerId)!
              const cls = ['adjacency-matrix__label', nodeLabelClass(node)].filter(Boolean).join(' ')
              const select = () => g.select(selectedId === id ? null : id)
              return (
                <g key={id}>
                  <rect x={LW - 6} y={TH + i * cs + 1} width={3} height={cs - 2} style={{ fill: layer.color }} />
                  <rect x={LW + i * cs + 1} y={TH - 6} width={cs - 2} height={3} style={{ fill: layer.color }} />
                  <g
                    className="adjacency-matrix__header"
                    role="button"
                    tabIndex={0}
                    aria-label={`${node.label}, ${layer.label} layer${selectedId === id ? ', selected' : ''}`}
                    onClick={select}
                    onKeyDown={(e) => onHeaderKey(e, id)}
                  >
                    <title>{node.label}</title>
                    {/* hit area and focus ring for the whole label cell */}
                    <rect className="adjacency-matrix__header-box" x={2} y={TH + i * cs} width={LW - 10} height={cs} rx={4} />
                    <text className={cls} x={LW - 10} y={TH + i * cs + cs / 2} textAnchor="end" dominantBaseline="central" style={{ fontSize: fs }}>
                      {node.displayLabel}
                    </text>
                  </g>
                  <g className="adjacency-matrix__header" aria-hidden="true" onClick={select}>
                    <text
                      className={cls}
                      transform={`translate(${LW + i * cs + cs * 0.65} ${TH - 10}) rotate(-60)`}
                      dominantBaseline="central"
                      style={{ fontSize: fs }}
                    >
                      {node.displayLabel}
                    </text>
                  </g>
                </g>
              )
            })}

            {/* cells */}
            {cells.map(({ link, r, c, em, opacity, code }) => {
              const s = index.nodeById.get(link.sourceId)!
              const t = index.nodeById.get(link.targetId)!
              const predicate = link.predicates.length ? linkPredicateLabel(link, index.catalog) : link.primaryCategory
              return (
                <g
                  key={link.id}
                  className="adjacency-matrix__cell"
                  data-link-id={link.id}
                  onClick={() => (onLinkSelect ? onLinkSelect(link) : g.select(link.sourceId))}
                  onMouseEnter={() => setHover({ row: link.sourceId, col: link.targetId })}
                >
                  <title>{`${s.label} ${predicate} ${t.label}`}</title>
                  <rect
                    x={LW + c * cs + 1}
                    y={TH + r * cs + 1}
                    width={cs - 2}
                    height={cs - 2}
                    rx={2}
                    style={{ fill: em.color, fillOpacity: opacity, stroke: em.highlighted ? em.color : 'none', strokeWidth: 1.5 }}
                  />
                  {code && (
                    <text
                      className="adjacency-matrix__code"
                      x={LW + c * cs + cs / 2}
                      y={TH + r * cs + cs / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ fontSize: Math.min(8.5, cs * 0.48) }}
                    >
                      {code}
                    </text>
                  )}
                </g>
              )
            })}

            <text className="adjacency-matrix__caption" x={LW} y={TH + n * cs + 20}>
              {`row = source · column = target · ${n} × ${n}`}
            </text>
          </svg>
        </div>
        {showCodeLegend && usedCodes.length > 0 && (
          <div className="adjacency-matrix__legend">
            <span className="adjacency-matrix__legend-title">Cell codes</span>
            {usedCodes.map(([p, code]) => (
              <span key={p} className="adjacency-matrix__legend-item">
                <b>{code}</b> {index.catalog[p]?.label ?? p}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  },
)

AdjacencyMatrix.displayName = 'AdjacencyMatrix'
