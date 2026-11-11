import React, { useContext, useMemo, useState } from 'react'
import type { GraphEdge, GraphNodeData } from './GraphCanvas'
import { LayeredGraphContext, useLayeredGraph, type LayeredGraphState, type UseLayeredGraphOptions } from '../hooks/useLayeredGraph'
import { orderAcrossLayers, type NodeOrder } from '../utils/layered/layout'
import { linkPredicateLabel } from '../utils/layered/labels'
import { isLinkVisible } from '../utils/layered/filters'
import { layerMatrixCells, matrixCells, type LayerMatrixCell } from '../utils/layered/matrix'
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
  /**
   * Merge `A→B` and `B→A` into one cell above the diagonal, for an undirected reading. With
   * `aggregate="layer"`, both directions add into the upper triangle. Default false.
   */
  symmetric?: boolean
  /** `layer`: a layers-by-layers heat map of link counts, the overview for many layers. Default `none`. */
  aggregate?: 'none' | 'layer'
  /**
   * Called when a heat-map cell is clicked (`aggregate="layer"`). Unset: a cross-layer cell toggles
   * the layer-pair filter and a diagonal cell toggles the layer focus.
   */
  onLayerCellSelect?: (cell: LayerMatrixCell) => void
}

export type { LayerMatrixCell }

const EMPTY_NODES: GraphNodeData[] = []
const EMPTY_EDGES: GraphEdge[] = []
const EMPTY_LAYERING: BuildLayeredIndexOptions = { layerBy: '' }

const MIN_HEADER_HEIGHT = 60
const PAD = 40
// JetBrains Mono advance width, in em.
const MONO_CHAR_EM = 0.6

const CAPTION_PX = 10.5

/** Header height and SVG size for `n` rows and columns of `cs` px, with rotated column labels and a caption below. */
function frame(maxChars: number, fs: number, labelWidth: number, n: number, cs: number, caption: string) {
  // Rotated column labels (-60°) reach up by ~0.87 and right by ~0.5 of their length.
  const maxLabelPx = maxChars * fs * MONO_CHAR_EM
  const TH = Math.max(MIN_HEADER_HEIGHT, Math.ceil(maxLabelPx * 0.87) + 24)
  const width = Math.max(
    labelWidth + n * cs + Math.max(PAD, Math.ceil(maxLabelPx * 0.5) + 16),
    labelWidth + Math.ceil(caption.length * CAPTION_PX * MONO_CHAR_EM) + 8,
  )
  return { TH, width, height: TH + n * cs + PAD }
}

const activateOnKey = (e: React.KeyboardEvent, run: () => void) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    run()
  }
}

/**
 * Directed block adjacency matrix of a layered graph: one row and one column per node, grouped by
 * layer, one cell per link (row = source, column = target). Diagonal blocks hold links within a
 * layer, off-diagonal blocks the links between two layers. Every link is visible with no
 * crossings, so it stays legible on dense graphs where node-link drawings tangle. Cells take the
 * link's category style, or the amber reach ramp around the selection, and show predicate codes
 * per `predicateLabels`. `symmetric` folds both directions into the upper triangle; `aggregate="layer"`
 * collapses the matrix to a layers-by-layers heat map.
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
      symmetric = false,
      aggregate = 'none',
      onLayerCellSelect,
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
    const maxChars = ids.reduce((m, id) => Math.max(m, index.nodeById.get(id)!.displayLabel.length), 0)
    const LW = labelWidth
    const caption = symmetric ? `undirected · each pair above the diagonal · ${n} × ${n}` : `row = source · column = target · ${n} × ${n}`
    const { TH, width, height } = frame(maxChars, fs, LW, n, cs, caption)
    const isAggregate = aggregate === 'layer'

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
      if (isAggregate) return []
      const hasSelection = !!reach.originId
      const visible = index.links.filter((l) => linkEmphasis(l).visible)
      return matrixCells(visible, at, symmetric).map(({ r, c, links }) => {
        // A merged cell draws the reached direction, else row → column.
        const link = links.find((l) => linkEmphasis(l).highlighted) ?? links[0]
        const em = linkEmphasis(link)
        const opacity = em.highlighted ? 1 : hasSelection ? 0.25 : link.cross ? 0.95 : 0.7
        const more = link.predicates.length > 1 || links.some((l) => l !== link && l.predicates.length > 0)
        const code = em.label && link.predicates.length > 0 ? (index.predicateCodes.get(link.predicates[0]) ?? '') + (more ? '+' : '') : ''
        return { link, links, r, c, em, opacity, code }
      })
    }, [index, at, linkEmphasis, reach.originId, symmetric, isAggregate])

    const usedCodes = useMemo(() => {
      const seen = new Map<string, string>()
      for (const cell of cells) {
        if (!cell.code) continue
        for (const l of cell.links) for (const p of l.predicates) if (!seen.has(p)) seen.set(p, index.predicateCodes.get(p) ?? '')
      }
      return [...seen].sort((a, b) => a[0].localeCompare(b[0]))
    }, [cells, index])

    const nodeLabelClass = (node: IndexedNode) => {
      const em = g.nodeEmphasis(node)
      if (em.selected) return 'adjacency-matrix__label--selected'
      if (em.hop !== null) return em.followed ? 'adjacency-matrix__label--followed' : 'adjacency-matrix__label--reached'
      return reach.originId ? 'adjacency-matrix__label--dim' : ''
    }
    const selIndex = selectedId != null ? at.get(selectedId) : undefined
    // The hovered cell's row and column, if both are still drawn (a filter may have hidden them since).
    const hoverRow = hover ? at.get(hover.row) : undefined
    const hoverCol = hover ? at.get(hover.col) : undefined

    if (isAggregate) {
      return (
        <div ref={ref} className={['adjacency-matrix', className].filter(Boolean).join(' ')} {...props}>
          <LayerHeatMap g={g} cellSize={cellSize} labelWidth={labelWidth} symmetric={symmetric} onLayerCellSelect={onLayerCellSelect} />
        </div>
      )
    }

    return (
      <div ref={ref} className={['adjacency-matrix', className].filter(Boolean).join(' ')} {...props}>
        <div className="adjacency-matrix__scroll">
          <svg
            className="adjacency-matrix__svg"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label={
              symmetric
                ? `Adjacency matrix, ${n} by ${n}, undirected: each linked pair is one cell above the diagonal`
                : `Adjacency matrix, ${n} by ${n}: rows are link sources, columns link targets`
            }
            onMouseLeave={() => setHover(null)}
          >
            {/* blocks */}
            {spans.map((rs) =>
              spans.map((csn) => {
                const diag = rs.layerId === csn.layerId
                // Symmetric: the blocks below the diagonal are empty, so they are left out.
                if (symmetric && rs.start > csn.start) return null
                const layer = index.layerById.get(rs.layerId)!
                const count =
                  (blockCounts.get(rs.layerId + '\u0000' + csn.layerId) ?? 0) +
                  (symmetric && !diag ? (blockCounts.get(csn.layerId + '\u0000' + rs.layerId) ?? 0) : 0)
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
                    onKeyDown={(e) => activateOnKey(e, select)}
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
            {cells.map(({ link, links, r, c, em, opacity, code }) => {
              const title = links
                .map((l) => {
                  const predicate = l.predicates.length ? linkPredicateLabel(l, index.catalog) : l.primaryCategory
                  return `${index.nodeById.get(l.sourceId)!.label} ${predicate} ${index.nodeById.get(l.targetId)!.label}`
                })
                .join('\n')
              const both = links.length > 1
              return (
                <g
                  key={link.id}
                  className={both ? 'adjacency-matrix__cell adjacency-matrix__cell--both' : 'adjacency-matrix__cell'}
                  data-link-id={link.id}
                  data-row={r}
                  data-col={c}
                  onClick={() => (onLinkSelect ? onLinkSelect(link) : g.select(link.sourceId))}
                  onMouseEnter={() => setHover({ row: ids[r], col: ids[c] })}
                >
                  <title>{title}</title>
                  <rect
                    x={LW + c * cs + 1}
                    y={TH + r * cs + 1}
                    width={cs - 2}
                    height={cs - 2}
                    rx={2}
                    style={{ fill: em.color, fillOpacity: opacity, stroke: em.highlighted ? em.color : 'none', strokeWidth: 1.5 }}
                  />
                  {/* both directions: a notch in the lower-left corner */}
                  {both && (
                    <path
                      className="adjacency-matrix__both"
                      d={`M${LW + c * cs + 1} ${TH + (r + 1) * cs - 1}v${-cs * 0.4}l${cs * 0.4} ${cs * 0.4}z`}
                    />
                  )}
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
              {caption}
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

interface LayerHeatMapProps {
  g: LayeredGraphState
  cellSize: number | 'auto'
  labelWidth: number
  symmetric: boolean
  onLayerCellSelect?: (cell: LayerMatrixCell) => void
}

/**
 * `aggregate="layer"`: one row and column per visible layer, each cell the count of visible links
 * between the two layers, shaded by count. Counts ignore the layer-pair filter, so the overview
 * stays whole while the active pair is outlined.
 */
function LayerHeatMap({ g, cellSize, labelWidth, symmetric, onLayerCellSelect }: LayerHeatMapProps) {
  const { index, filters, focusedLayerId } = g
  const [hover, setHover] = useState<{ row: string; col: string } | null>(null)
  const layerIds = useMemo(
    () => index.layers.filter((l) => !filters.hiddenLayers.includes(l.id)).map((l) => l.id),
    [index, filters.hiddenLayers],
  )
  const { cells, max } = useMemo(() => {
    const shown = { ...filters, layerPair: null }
    return layerMatrixCells(index, layerIds, index.links.filter((l) => isLinkVisible(l, index, shown)), symmetric)
  }, [index, filters, layerIds, symmetric])

  const n = layerIds.length
  const cs = cellSize === 'auto' ? Math.max(40, Math.min(72, Math.floor(560 / Math.max(1, n)))) : Math.max(24, cellSize)
  const fs = 11
  const LW = labelWidth
  const maxChars = layerIds.reduce((m, id) => Math.max(m, index.layerById.get(id)!.label.length), 0)
  const total = cells.reduce((sum, c) => sum + c.linkCount, 0)
  const caption = `${symmetric ? 'undirected · each pair above the diagonal' : 'row = source layer · column = target layer'} · ${n} × ${n} layers · ${total} links`
  const { TH, width, height } = frame(maxChars, fs, LW, n, cs, caption)
  const label = (id: string) => index.layerById.get(id)!.label

  const hoverRow = hover ? layerIds.indexOf(hover.row) : -1
  const hoverCol = hover ? layerIds.indexOf(hover.col) : -1
  const focus = (id: string) => g.focusLayer(focusedLayerId === id ? null : id)
  const pick = (cell: LayerMatrixCell) => {
    if (onLayerCellSelect) onLayerCellSelect({ rowLayerId: cell.rowLayerId, colLayerId: cell.colLayerId, linkCount: cell.linkCount, pairKey: cell.pairKey })
    else if (cell.pairKey) g.setLayerPair(cell.pairKey)
    else focus(cell.rowLayerId)
  }
  const cellName = (cell: LayerMatrixCell) => {
    const row = label(cell.rowLayerId)
    const where = !cell.pairKey ? `Within ${row}` : symmetric ? `Between ${row} and ${label(cell.colLayerId)}` : `${row} to ${label(cell.colLayerId)}`
    return `${where}: ${cell.linkCount} link${cell.linkCount === 1 ? '' : 's'}`
  }

  return (
    <div className="adjacency-matrix__scroll">
      <svg
        className="adjacency-matrix__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={
          symmetric
            ? `Layer heat map, ${n} by ${n} layers, undirected: link counts per layer pair above the diagonal`
            : `Layer heat map, ${n} by ${n} layers: rows are source layers, columns target layers`
        }
        onMouseLeave={() => setHover(null)}
      >
        {/* empty grid */}
        {layerIds.map((_, r) =>
          layerIds.map((__, c) =>
            symmetric && r > c ? null : (
              <rect key={r + ':' + c} className="adjacency-matrix__heat-empty" x={LW + c * cs + 1} y={TH + r * cs + 1} width={cs - 2} height={cs - 2} rx={3} />
            ),
          ),
        )}

        {/* No focus band: amber over the grey ramp reads as a different count. The header and the diagonal cell show the focus. */}
        {hoverRow >= 0 && hoverCol >= 0 && (
          <g className="adjacency-matrix__band adjacency-matrix__band--hover">
            <rect x={LW} y={TH + hoverRow * cs} width={n * cs} height={cs} />
            <rect x={LW + hoverCol * cs} y={TH} width={cs} height={n * cs} />
          </g>
        )}

        {/* headers: one per layer; a click toggles the layer focus */}
        {layerIds.map((id, i) => {
          const layer = index.layerById.get(id)!
          const focused = focusedLayerId === id
          const cls = ['adjacency-matrix__label', focused ? 'adjacency-matrix__label--selected' : ''].filter(Boolean).join(' ')
          return (
            <g key={id}>
              <rect x={LW - 6} y={TH + i * cs + 1} width={3} height={cs - 2} style={{ fill: layer.color }} />
              <rect x={LW + i * cs + 1} y={TH - 6} width={cs - 2} height={3} style={{ fill: layer.color }} />
              <g
                className="adjacency-matrix__header"
                role="button"
                tabIndex={0}
                aria-label={`${layer.label} layer, ${layer.nodeIds.length} nodes${focused ? ', focused' : ''}`}
                onClick={() => focus(id)}
                onKeyDown={(e) => activateOnKey(e, () => focus(id))}
              >
                <rect className="adjacency-matrix__header-box" x={2} y={TH + i * cs} width={LW - 10} height={cs} rx={4} />
                <text className={cls} x={LW - 10} y={TH + i * cs + cs / 2} textAnchor="end" dominantBaseline="central" style={{ fontSize: fs }}>
                  {layer.label}
                </text>
              </g>
              <g className="adjacency-matrix__header" aria-hidden="true" onClick={() => focus(id)}>
                <text
                  className={cls}
                  transform={`translate(${LW + i * cs + cs / 2} ${TH - 10}) rotate(-60)`}
                  dominantBaseline="central"
                  style={{ fontSize: fs }}
                >
                  {layer.label}
                </text>
              </g>
            </g>
          )
        })}

        {/* cells, shaded by count (square root, so small counts still show) */}
        {cells.map((cell) => {
          const { r, c } = cell
          const level = 0.08 + 0.72 * Math.sqrt(cell.linkCount / max)
          const active = cell.pairKey ? cell.pairKey === filters.layerPair : cell.rowLayerId === focusedLayerId
          return (
            <g
              key={r + ':' + c}
              className={['adjacency-matrix__heat-cell', active ? 'adjacency-matrix__heat-cell--active' : ''].filter(Boolean).join(' ')}
              data-row-layer={cell.rowLayerId}
              data-col-layer={cell.colLayerId}
              role="button"
              tabIndex={0}
              aria-label={cellName(cell)}
              aria-pressed={active}
              onClick={() => pick(cell)}
              onKeyDown={(e) => activateOnKey(e, () => pick(cell))}
              onMouseEnter={() => setHover({ row: cell.rowLayerId, col: cell.colLayerId })}
            >
              <title>{cellName(cell)}</title>
              <rect className="adjacency-matrix__header-box" x={LW + c * cs} y={TH + r * cs} width={cs} height={cs} rx={4} />
              <rect className="adjacency-matrix__heat" x={LW + c * cs + 1} y={TH + r * cs + 1} width={cs - 2} height={cs - 2} rx={3} style={{ fillOpacity: level }} />
              <text
                className={level > 0.5 ? 'adjacency-matrix__heat-count adjacency-matrix__heat-count--inverse' : 'adjacency-matrix__heat-count'}
                x={LW + c * cs + cs / 2}
                y={TH + r * cs + cs / 2}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: Math.min(13, cs * 0.3) }}
              >
                {cell.linkCount}
              </text>
            </g>
          )
        })}

        <text className="adjacency-matrix__caption" x={LW} y={TH + n * cs + 20}>
          {caption}
        </text>
      </svg>
    </div>
  )
}
