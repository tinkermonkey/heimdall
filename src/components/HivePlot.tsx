import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { GraphEdge, GraphNodeData } from './GraphCanvas'
import { LayeredGraphContext, useLayeredGraph, type LayeredGraphState, type UseLayeredGraphOptions } from '../hooks/useLayeredGraph'
import { rankWithinLayers, type NodeOrder } from '../utils/layered/layout'
import { arrowHeadPoints, linkPredicateLabel } from '../utils/layered/labels'
import { edgeLabelPriority, placeEdgeLabels, quadCurve, type EdgeCurve, type LabelBox } from '../utils/layered/edgeLabels'
import { hiveAxisGroups, hiveLabelSide, hiveLayout, hiveLinkGeometry, hivePoint, type HiveAxis, type HiveAxisBy, type HiveAxisOrder } from '../utils/layered/hive'
import { layerPaletteColor } from '../utils/layered/buildLayeredIndex'
import type { LinkEmphasis } from '../utils/layered/emphasis'
import type { BuildLayeredIndexOptions, IndexedLink, IndexedNode } from '../utils/layered/types'
import './HivePlot.css'

export interface HivePlotInteractions {
  /** Click, Enter or Space on a node selects it (again clears); Escape clears. Default true. */
  select?: boolean
  /** Hovering a node lifts it, shows its label and sets the shared `hoveredId`. Default true. */
  hover?: boolean
}

export interface HivePlotProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`, else the plot builds its own from `nodes`, `edges` and `layering`. */
  graph?: LayeredGraphState
  /** Standalone data (ignored when `graph` or a context is present). */
  nodes?: readonly GraphNodeData[]
  edges?: readonly GraphEdge[]
  /** Standalone layering (ignored when `graph` or a context is present). Memoize it. */
  layering?: BuildLayeredIndexOptions
  /** Standalone options passed to `useLayeredGraph` (selection, follow, filters, label mode). */
  graphOptions?: Omit<UseLayeredGraphOptions, 'nodes' | 'edges' | 'layering'>
  /**
   * How nodes are assigned to axes. `'layer'` (default): one axis per layer, in layer colour.
   * A function: one axis per distinct value it returns (any categorical attribute), coloured from
   * the `--graph-layer-<n>` palette by axis order. A node it returns null or undefined for is not
   * drawn. Memoize it.
   */
  axes?: HiveAxisBy
  /** Axis order around the plot from `startAngle`: ids listed first (the rest follow), or a comparator. Default: layer order, else axis ids sorted by code point. Memoize it. */
  axisOrder?: HiveAxisOrder
  /** Axis title. Default: the layer label, else the axis id. */
  axisLabel?: (axisId: string) => string
  /** How nodes are placed outward along their axis (`rankWithinLayers`). Default `degree`: the busiest node farthest out. */
  rank?: NodeOrder
  /** Double every axis so links within a layer span the gap between the two copies. Off draws them as arcs off the single axis. Default true. */
  splitAxes?: boolean
  /** Half the angle between an axis's two copies, degrees. Clamped to leave room between axes. Default 13. */
  splitAngle?: number
  /** Labeled nodes per axis with no selection: the k busiest (highest degree). The selection and its reach are always labeled. Default: 1 while the graph's `nodeLabels` is on, 0 when off. */
  axisLabels?: number
  /** Radius of the axes' inner end, in viewBox units. Default 64. */
  innerRadius?: number
  /** Axis length in viewBox units; the plot scales to fit its container's width. Default 300. */
  axisLength?: number
  /** Angle of the first layer's axis, degrees clockwise from the right (−90 = up). Default −90. */
  startAngle?: number
  /** Which pointer and keyboard interactions are on. Default both. */
  interactions?: HivePlotInteractions
  /** Called when a link is clicked. Unset: a click selects the link's source node (when `interactions.select` is on). */
  onLinkSelect?: (link: IndexedLink) => void
}

const EMPTY_NODES: GraphNodeData[] = []
const EMPTY_EDGES: GraphEdge[] = []
const EMPTY_LAYERING: BuildLayeredIndexOptions = { layerBy: '' }

const LABEL_FS = 10.5
const TITLE_FS = 11
// JetBrains Mono advance width, in em.
const MONO_CHAR_EM = 0.6
const PAD = 14
// arrowHeadPoints' default half-width.
const ARROW_HALF_W = 3.2
const MIN_HIT_PX = 12

interface PlacedLabel extends LabelBox {
  side: 1 | -1
  tx: number
  ty: number
}

const labelsOverlap = (q: LabelBox, b: LabelBox) =>
  Math.abs(q.x - b.x) <= (q.width + b.width) / 2 + 2 && Math.abs(q.y - b.y) <= (q.height + b.height) / 2

const r1 = (v: number) => Math.round(v * 10) / 10
const dotRadius = (n: IndexedNode) => 2.6 + Math.sqrt(n.degree) * 0.9

interface Dot {
  node: IndexedNode
  x: number
  y: number
  r: number
  copy: number
}

interface DrawnLink {
  link: IndexedLink
  em: LinkEmphasis
  curve: EdgeCurve
  arrow: string | null
}

/**
 * Hive plot of a layered graph: one radial axis per layer at evenly divided angles, nodes placed
 * outward along their axis by rank (degree by default), links as curves between axes. Each axis
 * is doubled so links within a layer span the gap between its two copies; cross-layer links run
 * between the facing copies of two axes. It compares how the layers connect rather than where
 * nodes sit. Links take their category style, or the amber reach ramp around the selection, with
 * arrowheads and predicate pills per `predicateLabels`.
 */
export const HivePlot = React.forwardRef<HTMLDivElement, HivePlotProps>(
  (
    {
      graph,
      nodes,
      edges,
      layering,
      graphOptions,
      axes = 'layer',
      axisOrder: axisOrderProp,
      axisLabel,
      rank = 'degree',
      splitAxes = true,
      splitAngle = 13,
      axisLabels: axisLabelsProp,
      innerRadius = 64,
      axisLength = 300,
      startAngle = -90,
      interactions,
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
        : { layout: false, ...graphOptions, nodes: nodes ?? EMPTY_NODES, edges: edges ?? EMPTY_EDGES, layering: layering ?? EMPTY_LAYERING },
    )
    const g = external ?? own
    const { index, filters, reach, selectedId, linkEmphasis, nodeEmphasis } = g
    const axisLabels = axisLabelsProp ?? (g.nodeLabels !== false ? 1 : 0)
    const canSelect = interactions?.select !== false
    const canHover = interactions?.hover !== false

    const [hoverId, setHoverId] = useState<string | null>(null)
    const [focusId, setFocusId] = useState<string | null>(null)
    const nodeRefs = useRef(new Map<string, SVGGElement>())
    const svgRef = useRef<SVGSVGElement>(null)
    const [pxWidth, setPxWidth] = useState(0)

    useEffect(() => {
      const el = svgRef.current
      if (!el || typeof ResizeObserver === 'undefined') return
      const ro = new ResizeObserver((entries) => setPxWidth(entries[0]?.contentRect.width ?? 0))
      ro.observe(el)
      return () => ro.disconnect()
    }, [])

    const byLayer = axes === 'layer'
    const groups = useMemo(() => hiveAxisGroups(index, axes, axisOrderProp), [index, axes, axisOrderProp])
    useEffect(() => {
      if (process.env.NODE_ENV !== 'production' && groups.unassigned.length > 0) {
        console.warn(`HivePlot: ${groups.unassigned.length} node(s) have no axis (axes returned null or undefined) and are not drawn, e.g. "${groups.unassigned[0]}".`)
      }
    }, [groups])
    const axisMeta = useMemo(
      () =>
        new Map(
          groups.axes.map((a, i) => {
            const layer = byLayer ? index.layerById.get(a.id) : undefined
            return [a.id, { title: axisLabel?.(a.id) ?? layer?.label ?? a.id, color: layer?.color ?? layerPaletteColor(i) }]
          }),
        ),
      [groups, byLayer, index, axisLabel],
    )
    const axisIdOf = (nodeId: string) => groups.axisOf.get(nodeId)
    // Nodes left visible by the layer filters, per axis. Axes keep their slot whatever is hidden.
    const visibleAxes = useMemo(
      () => groups.axes.map((a) => ({ id: a.id, nodeIds: a.nodeIds.filter((id) => !filters.hiddenLayers.includes(index.nodeById.get(id)!.layerId)) })),
      [groups, filters.hiddenLayers, index],
    )
    const ranks = useMemo(() => rankWithinLayers(index, rank, groups.axes), [index, rank, groups])
    // Angles are divided among every axis, so hiding a layer leaves a gap and the other axes stay
    // put: by layer, a hidden layer's axis; otherwise an axis with no visible nodes.
    const hive = useMemo(() => {
      const hiddenLayers = byLayer ? filters.hiddenLayers : visibleAxes.filter((a) => a.nodeIds.length === 0).map((a) => a.id)
      return hiveLayout(visibleAxes, ranks, { innerRadius, axisLength, splitAxes, splitAngle, startAngle, hiddenLayers })
    }, [byLayer, visibleAxes, ranks, innerRadius, axisLength, splitAxes, splitAngle, startAngle, filters.hiddenLayers])
    const nodesOnAxis = useMemo(() => new Map(visibleAxes.map((a) => [a.id, a.nodeIds])), [visibleAxes])

    // Nodes along each axis, inner to outer: the keyboard's arrow-key order.
    const axisOrder = useMemo(
      () => hive.axes.map((ax) => [...nodesOnAxis.get(ax.layerId)!].sort((a, b) => hive.radiusOf.get(a)! - hive.radiusOf.get(b)! || a.localeCompare(b))),
      [hive, nodesOnAxis],
    )

    const dots = useMemo(() => {
      const out: Dot[] = []
      for (const ax of hive.axes) {
        for (const id of nodesOnAxis.get(ax.layerId)!) {
          const node = index.nodeById.get(id)!
          const radius = hive.radiusOf.get(id)!
          ax.offsets.forEach((off, copy) => {
            const p = hivePoint(ax.angle + off, radius)
            out.push({ node, x: p.x, y: p.y, r: dotRadius(node), copy })
          })
        }
      }
      return out
    }, [hive, index, nodesOnAxis])

    const labelBox = (
      node: IndexedNode,
      ax: HiveAxis = hive.axisOf.get(axisIdOf(node.id)!)!,
      radius: number = hive.radiusOf.get(node.id)!,
      side: 1 | -1 = hiveLabelSide(ax),
    ): PlacedLabel => {
      const p = hivePoint(ax.angle + ax.offsets[ax.labelCopy], radius)
      const w = node.displayLabel.length * LABEL_FS * MONO_CHAR_EM
      const tx = p.x + side * (dotRadius(node) + 5)
      return { x: tx + (side * w) / 2, y: p.y, width: w, height: LABEL_FS * 1.2, side, tx, ty: p.y }
    }

    // A stable viewBox: every axis slot (hidden layers too), title and potential node label,
    // independent of the selection and of which layers are hidden.
    const viewBox = useMemo(() => {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      const add = (x: number, y: number, hw = 0, hh = 0) => {
        minX = Math.min(minX, x - hw)
        maxX = Math.max(maxX, x + hw)
        minY = Math.min(minY, y - hh)
        maxY = Math.max(maxY, y + hh)
      }
      add(0, 0, innerRadius, innerRadius)
      for (const ax of hive.slots) {
        for (const off of ax.offsets) {
          const p = hivePoint(ax.angle + off, innerRadius + axisLength + 8)
          add(p.x, p.y)
        }
        const t = hivePoint(ax.angle, innerRadius + axisLength + 30)
        add(t.x, t.y, (axisMeta.get(ax.layerId)!.title.length * TITLE_FS * 0.7) / 2, TITLE_FS)
        for (const id of groups.axes[ax.position].nodeIds) {
          const r = innerRadius + axisLength * (ranks.get(id) ?? 0.5)
          // Unsplit labels may flip sides to dodge loops (below), so fit both.
          for (const side of hive.split > 0 ? [hiveLabelSide(ax)] : ([1, -1] as const)) {
            const b = labelBox(index.nodeById.get(id)!, ax, r, side)
            add(b.x, b.y, b.width / 2, b.height / 2)
          }
        }
      }
      if (!Number.isFinite(minX)) return { x: -200, y: -200, w: 400, h: 400 }
      return { x: Math.floor(minX - PAD), y: Math.floor(minY - PAD), w: Math.ceil(maxX - minX + 2 * PAD), h: Math.ceil(maxY - minY + 2 * PAD) }
    }, [hive, index, ranks, innerRadius, axisLength, groups, axisMeta])

    // viewBox units per CSS px, so hit circles stay at least 24px across at any size.
    const unitsPerPx = pxWidth > 0 ? viewBox.w / pxWidth : 1
    const hitR = Math.min(20, MIN_HIT_PX * Math.max(1, unitsPerPx))

    const drawn = useMemo(() => {
      const out: DrawnLink[] = []
      for (const link of index.links) {
        const em = linkEmphasis(link)
        if (!em.visible) continue
        const s = index.nodeById.get(link.sourceId)!
        const t = index.nodeById.get(link.targetId)!
        const sa = axisIdOf(s.id)
        const ta = axisIdOf(t.id)
        if (!hive.radiusOf.has(s.id) || !hive.radiusOf.has(t.id) || sa === undefined || ta === undefined) continue
        const geo = hiveLinkGeometry(hive, { layerId: sa, radius: hive.radiusOf.get(s.id)! }, { layerId: ta, radius: hive.radiusOf.get(t.id)! })
        if (!geo) continue
        const curve = quadCurve(geo.a, geo.c, geo.b)
        let arrow: string | null = null
        if (em.arrow) {
          const u = curve.tangentAt(1)
          const back = dotRadius(t) + 2
          arrow = arrowHeadPoints({ x: geo.b.x - u.x * back, y: geo.b.y - u.y * back }, u.x, u.y)
        }
        out.push({ link, em, curve, arrow })
      }
      return out.sort((p, q) => p.em.z - q.em.z)
    }, [index, hive, linkEmphasis])

    // Default labels: the top-k busiest per axis with no selection; the selection and its reach; the hovered node.
    const labeled = useMemo(() => {
      const set = new Set<string>()
      if (reach.originId) {
        for (const id of reach.hopOf.keys()) set.add(id)
      } else if (axisLabels > 0) {
        for (const l of visibleAxes) {
          l.nodeIds
            .map((id) => index.nodeById.get(id)!)
            .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label))
            .slice(0, axisLabels)
            .forEach((n) => set.add(n.id))
        }
      }
      return set
    }, [reach, axisLabels, visibleAxes, index])

    // Unsplit, highlighted loops run beside the axis on both sides: sample them so labels can dodge them.
    const loopPts = useMemo(
      () =>
        hive.split > 0
          ? []
          : drawn
              .filter((d) => d.em.highlighted && axisIdOf(d.link.sourceId) === axisIdOf(d.link.targetId))
              .flatMap((d) => Array.from({ length: 25 }, (_, i) => d.curve.pointAt(i / 24))),
      [drawn, hive, index],
    )

    // A label's side: the one loops cross least (unsplit only). It is blocked when loop ends cover
    // its first 3 characters (where arrowheads land, padded by an arrowhead's half-width) or it
    // overlaps a label already placed.
    const bestLabel = (id: string, placed: readonly LabelBox[]) => {
      const node = index.nodeById.get(id)!
      const ax = hive.axisOf.get(axisIdOf(id)!)!
      const hits = (b: PlacedLabel, w: number, padY: number) => {
        const cx = b.tx + (b.side * w) / 2
        return loopPts.filter((p) => Math.abs(p.x - cx) <= w / 2 + 1 && Math.abs(p.y - b.ty) <= b.height / 2 + 1 + padY).length
      }
      const sides = hive.split > 0 ? [hiveLabelSide(ax)] : [hiveLabelSide(ax), -hiveLabelSide(ax) as 1 | -1]
      const options = sides.map((side) => {
        const b = labelBox(node, ax, hive.radiusOf.get(id)!, side)
        const start = hits(b, 3 * LABEL_FS * MONO_CHAR_EM, ARROW_HALF_W)
        return { b: { ...b, id }, blocked: start > 0 || placed.some((q) => labelsOverlap(q, b)), score: start * 100 + hits(b, b.width, 0) }
      })
      return options.reduce((m, o) => (Number(o.blocked) * 1e4 + o.score < Number(m.blocked) * 1e4 + m.score ? o : m))
    }

    // Labels that fit: the selection always; then reached nodes by hop, then the rest, busiest first,
    // each dropped if blocked. A dropped label is still the node's tooltip and accessible name.
    // Independent of hover, so hovering never moves or drops another label.
    const baseLabels = useMemo(() => {
      const ids = [...labeled].filter((id) => hive.radiusOf.has(id))
      const prio = (id: string) => (id === selectedId ? -2 : (reach.hopOf.get(id) ?? 99))
      ids.sort((a, b) => prio(a) - prio(b) || index.nodeById.get(b)!.degree - index.nodeById.get(a)!.degree || a.localeCompare(b))
      const placed: (PlacedLabel & { id: string })[] = []
      for (const id of ids) {
        const best = bestLabel(id, placed)
        if (best.blocked && prio(id) >= 0) continue
        placed.push(best.b)
      }
      return placed
    }, [labeled, hive, selectedId, reach, index, loopPts])

    // The hovered node, when not already labeled, goes on top on its clearer side.
    const labels = useMemo(() => {
      if (!hoverId || !hive.radiusOf.has(hoverId) || baseLabels.some((b) => b.id === hoverId)) return baseLabels
      return [...baseLabels, bestLabel(hoverId, baseLabels).b]
    }, [baseLabels, hoverId, hive, index, loopPts])

    const pills = useMemo(() => {
      const obstacles = labels.map((b) => ({ x: b.x, y: b.y, width: b.width, height: b.height }))
      const candidates = drawn
        .filter((d) => d.em.label && d.link.predicates.length > 0)
        .map((d) => ({ id: d.link.id, text: linkPredicateLabel(d.link, index.catalog), pointAt: d.curve.pointAt, priority: edgeLabelPriority(d.link, d.em) }))
      const byId = new Map(drawn.map((d) => [d.link.id, d]))
      return placeEdgeLabels(candidates, { obstacles }).map((p) => ({ ...p, em: byId.get(p.id)!.em }))
    }, [drawn, labels, index])

    const toggle = (id: string) => {
      if (canSelect) g.select(selectedId === id ? null : id)
    }
    const setHover = (id: string | null) => {
      if (!canHover) return
      setHoverId(id)
      g.hover(id)
    }
    const moveFocus = (id: string | undefined) => {
      if (!id) return
      setFocusId(id)
      nodeRefs.current.get(id)?.focus()
    }
    const onNodeKey = (e: React.KeyboardEvent, node: IndexedNode) => {
      const ai = hive.axes.findIndex((a) => a.layerId === axisIdOf(node.id))
      const list = axisOrder[ai] ?? []
      const i = list.indexOf(node.id)
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          toggle(node.id)
          return
        case 'ArrowUp':
          e.preventDefault()
          moveFocus(list[Math.min(list.length - 1, i + 1)])
          return
        case 'ArrowDown':
          e.preventDefault()
          moveFocus(list[Math.max(0, i - 1)])
          return
        case 'Home':
          e.preventDefault()
          moveFocus(list[0])
          return
        case 'End':
          e.preventDefault()
          moveFocus(list[list.length - 1])
          return
        case 'ArrowRight':
        case 'ArrowLeft': {
          e.preventDefault()
          if (hive.axes.length < 2) return
          const next = axisOrder[(ai + (e.key === 'ArrowRight' ? 1 : -1) + hive.axes.length) % hive.axes.length]
          const r = hive.radiusOf.get(node.id)!
          let best: string | undefined
          let bestD = Infinity
          for (const id of next) {
            const d = Math.abs(hive.radiusOf.get(id)! - r)
            if (d < bestD) {
              bestD = d
              best = id
            }
          }
          moveFocus(best)
          return
        }
      }
    }
    const onSvgKey = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && canSelect && selectedId) {
        e.preventDefault()
        g.select(null)
      }
    }

    // The roving tab stop: the last focused node, else the selection, else the first node.
    const tabStop =
      (focusId && hive.radiusOf.has(focusId) && focusId) || (selectedId && hive.radiusOf.has(selectedId) && selectedId) || axisOrder[0]?.[0] || null

    const R = innerRadius + axisLength
    return (
      <div ref={ref} className={['hive-plot', className].filter(Boolean).join(' ')} {...props}>
        <svg
          ref={svgRef}
          className="hive-plot__svg"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label={`Hive plot, ${hive.axes.length} ${byLayer ? 'layer ' : ''}axes, ${hive.radiusOf.size} nodes; arrow keys move between nodes`}
          onKeyDown={onSvgKey}
          onMouseLeave={() => setHover(null)}
        >
          {/* axes and titles */}
          {hive.axes.map((ax) => {
            const meta = axisMeta.get(ax.layerId)!
            const t = hivePoint(ax.angle, R + 30)
            return (
              <g key={ax.layerId} className="hive-plot__axis" data-axis-id={ax.layerId} data-layer-id={byLayer ? ax.layerId : undefined}>
                {ax.offsets.map((off) => {
                  const p0 = hivePoint(ax.angle + off, innerRadius * 0.8)
                  const p1 = hivePoint(ax.angle + off, R + 8)
                  return <line key={off} x1={r1(p0.x)} y1={r1(p0.y)} x2={r1(p1.x)} y2={r1(p1.y)} style={{ stroke: meta.color }} />
                })}
                <text className="hive-plot__axis-title" x={r1(t.x)} y={r1(t.y)} textAnchor="middle" dominantBaseline="central" style={{ fill: meta.color }}>
                  {meta.title.toUpperCase()}
                </text>
              </g>
            )
          })}

          {/* links, with a wide invisible stroke to click */}
          {drawn.map(({ link, em, curve }) => {
            const s = index.nodeById.get(link.sourceId)!
            const t = index.nodeById.get(link.targetId)!
            const predicate = link.predicates.length ? linkPredicateLabel(link, index.catalog) : link.primaryCategory
            const clickable = !!onLinkSelect || canSelect
            return (
              <g
                key={link.id}
                className={['hive-plot__link', clickable ? 'hive-plot__link--clickable' : ''].filter(Boolean).join(' ')}
                data-link-id={link.id}
                onClick={clickable ? () => (onLinkSelect ? onLinkSelect(link) : g.select(link.sourceId)) : undefined}
                {...(onLinkSelect
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': `${s.label} ${predicate} ${t.label}`,
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onLinkSelect(link)
                        }
                      },
                    }
                  : {})}
              >
                <title>{`${s.label} ${predicate} ${t.label}`}</title>
                <path className="hive-plot__link-hit" d={curve.d} />
                <path
                  className="hive-plot__link-line"
                  d={curve.d}
                  style={{ stroke: em.color, strokeWidth: em.width, strokeOpacity: em.opacity, strokeDasharray: em.dash || undefined }}
                />
              </g>
            )
          })}
          {drawn.map(({ link, em, arrow }) =>
            arrow ? <polygon key={link.id} className="hive-plot__arrow" points={arrow} style={{ fill: em.color, fillOpacity: em.highlighted ? 1 : 0.8 }} /> : null,
          )}

          {/* nodes: a dot per axis copy; the label-copy dot carries the hit target and focus */}
          {dots.map(({ node, x, y, r, copy }) => {
            const em = nodeEmphasis(node)
            const ax = hive.axisOf.get(axisIdOf(node.id)!)!
            const layer = index.layerById.get(node.layerId)!
            const meta = axisMeta.get(ax.layerId)!
            const primary = copy === ax.labelCopy
            const ringW = em.selected ? 2 : em.followed ? 1.2 : 0
            const hovered = hoverId === node.id
            const inner = (
              <>
                {hovered && <circle className="hive-plot__hover" cx={r1(x)} cy={r1(y)} r={r1(r + 6)} />}
                {ringW > 0 && (
                  <circle
                    className="hive-plot__ring"
                    cx={r1(x)}
                    cy={r1(y)}
                    r={r1(r + 3)}
                    style={{ stroke: em.selected ? 'rgb(var(--graph-hop-1))' : 'rgb(var(--graph-hop-2))', strokeWidth: ringW }}
                  />
                )}
                <circle className="hive-plot__dot" cx={r1(x)} cy={r1(y)} r={r1(r)} style={{ fill: meta.color }} />
              </>
            )
            if (!primary) {
              return (
                <g
                  key={node.id + ':' + copy}
                  className="hive-plot__node hive-plot__node--twin"
                  opacity={em.opacity}
                  onClick={() => toggle(node.id)}
                  onMouseEnter={() => setHover(node.id)}
                  onMouseLeave={() => setHover(null)}
                  aria-hidden="true"
                >
                  <circle className="hive-plot__hit" cx={r1(x)} cy={r1(y)} r={r1(hitR)} />
                  {inner}
                </g>
              )
            }
            return (
              <g
                key={node.id + ':' + copy}
                ref={(el) => {
                  if (el) nodeRefs.current.set(node.id, el)
                  else nodeRefs.current.delete(node.id)
                }}
                className="hive-plot__node"
                data-node-id={node.id}
                opacity={em.opacity}
                role="button"
                tabIndex={tabStop === node.id ? 0 : -1}
                aria-pressed={em.selected}
                aria-label={`${node.label}, ${layer.label} layer${byLayer ? '' : `, ${meta.title} axis`}${em.selected ? ', selected' : ''}`}
                onClick={() => toggle(node.id)}
                onFocus={() => setFocusId(node.id)}
                onKeyDown={(e) => onNodeKey(e, node)}
                onMouseEnter={() => setHover(node.id)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{node.label}</title>
                <circle className="hive-plot__hit" cx={r1(x)} cy={r1(y)} r={r1(hitR)} />
                <circle className="hive-plot__focus" cx={r1(x)} cy={r1(y)} r={r1(r + 6)} />
                {inner}
              </g>
            )
          })}

          {/* node labels */}
          {labels.map((b) => {
            const id = b.id
            const node = index.nodeById.get(id)!
            const em = nodeEmphasis(node)
            const tint = em.selected ? 'hive-plot__label--selected' : em.followed ? 'hive-plot__label--followed' : ''
            return (
              <text
                key={id}
                className={['hive-plot__label', tint].filter(Boolean).join(' ')}
                x={r1(b.tx)}
                y={r1(b.ty)}
                textAnchor={b.side === 1 ? 'start' : 'end'}
                dominantBaseline="central"
                opacity={Math.max(em.opacity, 0.35)}
              >
                {node.displayLabel}
              </text>
            )
          })}

          {/* predicate pills */}
          {pills.map((p) => (
            <g key={p.id} className="hive-plot__pill" opacity={p.em.highlighted ? 1 : 0.9}>
              <rect x={r1(p.x - p.width / 2)} y={r1(p.y - p.height / 2)} width={p.width} height={p.height} rx={3} style={{ stroke: p.em.color }} />
              <text x={r1(p.x)} y={r1(p.y)} textAnchor="middle" dominantBaseline="central" style={{ fill: p.em.color }}>
                {p.text}
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  },
)

HivePlot.displayName = 'HivePlot'
