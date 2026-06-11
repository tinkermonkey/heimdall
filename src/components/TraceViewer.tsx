import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './TraceViewer.css'
import { Icon } from './Icon'
import { useVirtualList } from '../hooks/useVirtualList'
import { fromOTLP, type OtlpTracesData } from '../utils/otlpTrace'
import { fromXRay, type XRaySegment } from '../utils/xrayTrace'
import { TraceDetailPanel } from './TraceDetailPanel'
import {
  buildTraceModel,
  createTimeScale,
  descendantCount,
  fmtMs,
  niceTicks,
  resolveServiceColor,
  resolveServiceLabel,
  selfTime,
  visibleRows,
  type ServiceInfo,
  type SpanStatus,
  type Trace,
  type TraceModel,
  type TraceModelNode,
  type TraceSpan,
} from './traceViewerModel'

const BASE_INDENT = 14
const STEP = 16

export interface TraceViewerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Normalized trace. Provide exactly one of `trace` / `otlp` / `xray`. */
  trace?: Trace
  /** Raw OTLP/JSON trace data — adapted natively via `fromOTLP`. */
  otlp?: OtlpTracesData
  /** Raw AWS X-Ray segment document(s) — adapted natively via `fromXRay`. */
  xray?: XRaySegment | XRaySegment[] | unknown

  /** Controlled selected span id (`null` closes the panel). */
  selectedSpanId?: string | null
  defaultSelectedSpanId?: string | null
  onSelectSpan?: (id: string | null) => void

  /** Controlled collapsed span ids. */
  collapsedSpanIds?: string[]
  defaultCollapsedSpanIds?: string[]
  onToggleSpan?: (id: string, collapsed: boolean) => void

  showSummary?: boolean
  showToolbar?: boolean
  showDetailPanel?: boolean
  treeWidth?: number
  detailPanelWidth?: number
  rowHeight?: number

  /** Override / extend the service registry (label, color, host). */
  services?: Record<string, ServiceInfo>
  /** Override service -> color resolution. */
  serviceColor?: (service: string) => string | undefined
  /** Refine status (e.g. derive 'warn' from attributes — OTLP/X-Ray have none). */
  deriveStatus?: (span: TraceSpan) => SpanStatus
  /** Custom attributes renderer for the detail panel. */
  renderAttributes?: (span: TraceSpan) => React.ReactNode

  /** Enable brush-to-zoom on the time axis (default true). */
  enableZoom?: boolean
  /** Virtualize the row list at/above this many visible rows (default 80). */
  virtualizeThreshold?: number
}

/* ----------------------------------------------------------------- atoms -- */

function TreeRow({
  node,
  rowHeight,
  treeWidth,
  selected,
  hovered,
  collapsed,
  color,
  onSelect,
  onHover,
  onToggle,
  registerRef,
}: {
  node: TraceModelNode
  rowHeight: number
  treeWidth: number
  selected: boolean
  hovered: boolean
  collapsed: boolean
  color: string
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onToggle: (id: string) => void
  registerRef: (id: string, el: HTMLDivElement | null) => void
}) {
  const indent = BASE_INDENT + node.depth * STEP
  const guides = []
  for (let i = 0; i < node.depth; i++) guides.push(BASE_INDENT + i * STEP + 7)
  const cls = [
    'trace-viewer__tree-row',
    selected && 'is-selected',
    hovered && 'is-hovered',
    node.status === 'error' && 'is-error',
    node.status === 'warn' && 'is-warn',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={(el) => registerRef(node.id, el)}
      className={cls}
      role="treeitem"
      aria-level={node.depth + 1}
      aria-selected={selected}
      aria-expanded={node.hasChildren ? !collapsed : undefined}
      tabIndex={selected ? 0 : -1}
      style={{ height: rowHeight, paddingLeft: indent, width: treeWidth }}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {guides.map((gx, i) => (
        <span key={i} className="trace-viewer__guide" style={{ left: gx }} />
      ))}
      {node.hasChildren ? (
        <button
          type="button"
          className={'trace-viewer__twisty' + (collapsed ? '' : ' is-open')}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(node.id)
          }}
          tabIndex={-1}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          <Icon name="chevronRight" size={13} />
        </button>
      ) : (
        <span className="trace-viewer__twisty trace-viewer__twisty--leaf">
          <span className="trace-viewer__leaf-dot" />
        </span>
      )}
      <span className="trace-viewer__swatch" style={{ background: color }} />
      <span className="trace-viewer__tree-name">{node.name}</span>
      {collapsed && node.hasChildren && <span className="trace-viewer__desc-count">+{descendantCount(node)}</span>}
      <span className="trace-viewer__tree-dur">{fmtMs(node.duration)}</span>
    </div>
  )
}

function WaterfallRow({
  node,
  rowHeight,
  scaleX,
  scaleW,
  selected,
  hovered,
  color,
  onSelect,
  onHover,
}: {
  node: TraceModelNode
  rowHeight: number
  scaleX: (t: number) => number
  scaleW: (d: number) => number
  selected: boolean
  hovered: boolean
  color: string
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  const left = scaleX(node.start)
  const w = scaleW(node.duration)
  const labelAfter = left + w < 68
  const isErr = node.status === 'error'
  const isWarn = node.status === 'warn'

  const cls = ['trace-viewer__wf-row', selected && 'is-selected', hovered && 'is-hovered'].filter(Boolean).join(' ')

  return (
    <div
      className={cls}
      style={{ height: rowHeight }}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={'trace-viewer__bar' + (isErr ? ' is-error' : '') + (isWarn ? ' is-warn' : '') + (selected ? ' is-selected' : '')}
        style={{ left: `${left}%`, width: `${w}%`, background: color }}
      >
        {isWarn && <span className="trace-viewer__bar-warn" />}
      </div>
      {isErr && (
        <span className="trace-viewer__bar-alert" style={{ left: `calc(${left}% - 4px)` }}>
          <Icon name="alert" size={12} />
        </span>
      )}
      <span
        className={'trace-viewer__bar-label' + (labelAfter ? ' is-after' : ' is-before')}
        style={labelAfter ? { left: `calc(${left + w}% + 7px)` } : { right: `calc(${100 - left}% + 7px)` }}
      >
        <span className={'trace-viewer__bar-dur' + (isErr ? ' is-error' : isWarn ? ' is-warn' : '')}>{fmtMs(node.duration)}</span>
        <span className="trace-viewer__bar-name">{node.name}</span>
      </span>
    </div>
  )
}

/* --------------------------------------------------------------- summary -- */

function TraceSummary({
  model,
  resolveColor,
  resolveLabel,
}: {
  model: TraceModel
  resolveColor: (s: string) => string
  resolveLabel: (s: string) => string
}) {
  const { ordered, total } = model
  const serviceSet = new Set(ordered.map((s) => s.service))
  const errors = ordered.filter((s) => s.status === 'error').length
  const warns = ordered.filter((s) => s.status === 'warn').length

  const perSvc: Record<string, number> = {}
  ordered.forEach((s) => {
    perSvc[s.service] = (perSvc[s.service] || 0) + selfTime(s)
  })
  const svcEntries = Object.entries(perSvc).sort((a, b) => b[1] - a[1])
  const svcTotal = svcEntries.reduce((a, [, v]) => a + v, 0) || 1

  const Stat = ({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) => (
    <div className={'trace-viewer__stat' + (tone ? ` trace-viewer__stat--${tone}` : '')}>
      <span className="trace-viewer__eyebrow">{label}</span>
      <span className="trace-viewer__stat-value">{value}</span>
    </div>
  )

  return (
    <div className="trace-viewer__summary">
      <Stat label="DURATION" value={fmtMs(total)} tone="accent" />
      <Stat label="SPANS" value={ordered.length} />
      <Stat label="SERVICES" value={serviceSet.size} />
      <Stat label="ERRORS" value={errors} tone={errors ? 'error' : undefined} />
      <Stat label="WARNINGS" value={warns} tone={warns ? 'warn' : undefined} />
      <div className="trace-viewer__svcbar-wrap">
        <span className="trace-viewer__eyebrow">TIME PER SERVICE · SELF</span>
        <div className="trace-viewer__svcbar">
          {svcEntries.map(([svc, v]) => (
            <div key={svc} className="trace-viewer__svcbar-seg" title={`${resolveLabel(svc)} · ${fmtMs(v)}`} style={{ width: `${(v / svcTotal) * 100}%`, background: resolveColor(svc) }} />
          ))}
        </div>
        <div className="trace-viewer__svc-legend">
          {svcEntries.map(([svc, v]) => (
            <span key={svc} className="trace-viewer__svc-legend-item">
              <span className="trace-viewer__svc-legend-dot" style={{ background: resolveColor(svc) }} />
              {resolveLabel(svc)}
              <span className="trace-viewer__svc-legend-val">{fmtMs(v)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- viewer -- */

export const TraceViewer = React.forwardRef<HTMLDivElement, TraceViewerProps>(function TraceViewer(
  {
    trace: traceProp,
    otlp,
    xray,
    selectedSpanId,
    defaultSelectedSpanId = null,
    onSelectSpan,
    collapsedSpanIds,
    defaultCollapsedSpanIds,
    onToggleSpan,
    showSummary = true,
    showToolbar = true,
    showDetailPanel = true,
    treeWidth = 336,
    detailPanelWidth = 360,
    rowHeight = 30,
    services: servicesProp,
    serviceColor,
    deriveStatus,
    renderAttributes,
    enableZoom = true,
    virtualizeThreshold = 80,
    className = '',
    ...rest
  },
  ref
) {
  /* resolve input -> normalized trace */
  const trace = useMemo<Trace>(() => {
    let t: Trace
    if (otlp) t = fromOTLP(otlp)
    else if (xray) t = fromXRay(xray)
    else t = traceProp ?? { spans: [] }
    if (deriveStatus) t = { ...t, spans: t.spans.map((s) => ({ ...s, status: deriveStatus(s) })) }
    return t
  }, [otlp, xray, traceProp, deriveStatus])

  const model = useMemo(() => buildTraceModel(trace.spans), [trace])
  const { ordered, byId, total } = model

  const services = useMemo<Record<string, ServiceInfo>>(
    () => ({ ...(trace.services ?? {}), ...(servicesProp ?? {}) }),
    [trace.services, servicesProp]
  )
  const resolveColor = useCallback((svc: string) => resolveServiceColor(svc, services, serviceColor), [services, serviceColor])
  const resolveLabel = useCallback((svc: string) => resolveServiceLabel(svc, services), [services])

  /* selection (controlled / uncontrolled) */
  const [selInternal, setSelInternal] = useState<string | null>(defaultSelectedSpanId)
  const selectedRaw = selectedSpanId !== undefined ? selectedSpanId : selInternal
  const selected = selectedRaw && byId[selectedRaw] ? selectedRaw : null
  const selectSpan = useCallback(
    (id: string | null) => {
      if (selectedSpanId === undefined) setSelInternal(id)
      onSelectSpan?.(id)
    },
    [selectedSpanId, onSelectSpan]
  )

  /* collapse (controlled / uncontrolled) */
  const [collapsedInternal, setCollapsedInternal] = useState<Set<string>>(() => new Set(defaultCollapsedSpanIds ?? []))
  const collapsed = useMemo(
    () => (collapsedSpanIds ? new Set(collapsedSpanIds) : collapsedInternal),
    [collapsedSpanIds, collapsedInternal]
  )
  const toggleSpan = useCallback(
    (id: string) => {
      const willCollapse = !collapsed.has(id)
      if (collapsedSpanIds === undefined) {
        setCollapsedInternal((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }
      onToggleSpan?.(id, willCollapse)
    },
    [collapsed, collapsedSpanIds, onToggleSpan]
  )
  const expandAncestors = useCallback(
    (id: string) => {
      if (collapsedSpanIds !== undefined) return
      const toOpen: string[] = []
      let cur = byId[id]?.parentId ? byId[byId[id].parentId as string] : null
      while (cur) {
        toOpen.push(cur.id)
        cur = cur.parentId ? byId[cur.parentId] : null
      }
      if (toOpen.length) setCollapsedInternal((prev) => {
        const next = new Set(prev)
        toOpen.forEach((x) => next.delete(x))
        return next
      })
    },
    [byId, collapsedSpanIds]
  )

  const [hovered, setHovered] = useState<string | null>(null)

  /* zoom window */
  const [zoom, setZoom] = useState<[number, number] | null>(null)
  const domain: [number, number] = zoom ?? [0, total || 1]
  const scale = useMemo(() => createTimeScale(domain[0], domain[1]), [domain[0], domain[1]])
  const ticks = useMemo(() => niceTicks(domain[0], domain[1]).ticks, [domain[0], domain[1]])

  /* visible rows + index */
  const rows = useMemo(() => visibleRows(ordered, collapsed), [ordered, collapsed])
  const rowIndexById = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((s, i) => m.set(s.id, i))
    return m
  }, [rows])
  const totalH = rows.length * rowHeight

  /* virtualization */
  const [viewportH, setViewportH] = useState(600)
  const virtualize = rows.length >= virtualizeThreshold
  const { visibleRange, containerRef, sentinelRef } = useVirtualList({
    itemCount: rows.length,
    itemHeight: rowHeight,
    containerHeight: viewportH,
    overscan: 16,
  })
  const visStart = virtualize ? Math.max(0, visibleRange[0]) : 0
  const visEnd = virtualize ? Math.min(rows.length, visibleRange[1]) : rows.length
  const rendered = rows.slice(visStart, visEnd)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight || 600))
    ro.observe(el)
    setViewportH(el.clientHeight || 600)
    return () => ro.disconnect()
  }, [containerRef])

  /* ancestor path of the selected span (connector highlight) */
  const path = useMemo(() => {
    const set = new Set<string>()
    let cur = selected ? byId[selected] : null
    while (cur) {
      set.add(cur.id)
      cur = cur.parentId ? byId[cur.parentId] : null
    }
    return set
  }, [selected, byId])

  /* row refs + reveal/focus */
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el)
    else rowRefs.current.delete(id)
  }, [])
  const pendingFocus = useRef<string | null>(null)

  const revealRow = useCallback(
    (id: string) => {
      const i = rowIndexById.get(id)
      const el = containerRef.current
      if (i == null || !el) return
      const top = i * rowHeight
      const bottom = top + rowHeight
      if (top < el.scrollTop) el.scrollTop = Math.max(0, top - rowHeight)
      else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight + rowHeight
    },
    [rowIndexById, rowHeight, containerRef]
  )

  useEffect(() => {
    if (!selected) return
    revealRow(selected)
    if (pendingFocus.current === selected) {
      requestAnimationFrame(() => {
        rowRefs.current.get(selected)?.focus()
        pendingFocus.current = null
      })
    }
  }, [selected, revealRow])

  const selectAndReveal = useCallback(
    (id: string, focus = true) => {
      expandAncestors(id)
      if (focus) pendingFocus.current = id
      selectSpan(id)
    },
    [expandAncestors, selectSpan]
  )

  /* keyboard navigation over the visible tree */
  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const cur = selected ?? rows[0]?.id
      if (!cur) return
      const i = rowIndexById.get(cur)
      if (i == null) return
      const node = byId[cur]
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          if (rows[i + 1]) selectAndReveal(rows[i + 1].id)
          break
        case 'ArrowUp':
          e.preventDefault()
          if (rows[i - 1]) selectAndReveal(rows[i - 1].id)
          break
        case 'ArrowRight':
          e.preventDefault()
          if (node.hasChildren && collapsed.has(cur)) toggleSpan(cur)
          else if (rows[i + 1] && rows[i + 1].parentId === cur) selectAndReveal(rows[i + 1].id)
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (node.hasChildren && !collapsed.has(cur)) toggleSpan(cur)
          else if (node.parentId) selectAndReveal(node.parentId)
          break
        case 'Home':
          e.preventDefault()
          if (rows[0]) selectAndReveal(rows[0].id)
          break
        case 'End':
          e.preventDefault()
          if (rows[rows.length - 1]) selectAndReveal(rows[rows.length - 1].id)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          selectAndReveal(cur)
          break
        case 'Escape':
          if (selected) {
            e.preventDefault()
            selectSpan(null)
          }
          break
      }
    },
    [selected, rows, rowIndexById, byId, collapsed, toggleSpan, selectAndReveal, selectSpan]
  )

  /* error navigation */
  const orderIndexById = useMemo(() => {
    const m = new Map<string, number>()
    ordered.forEach((s, i) => m.set(s.id, i))
    return m
  }, [ordered])
  const errorIds = useMemo(() => ordered.filter((s) => s.status === 'error').map((s) => s.id), [ordered])
  const jumpError = useCallback(
    (dir: 1 | -1) => {
      if (!errorIds.length) return
      const orderIndex = (id: string) => orderIndexById.get(id) ?? -1
      const curOrder = selected ? orderIndex(selected) : -1
      const sorted = errorIds.map(orderIndex).sort((a, b) => a - b)
      let target: number | undefined
      if (dir === 1) target = sorted.find((o) => o > curOrder) ?? sorted[0]
      else target = [...sorted].reverse().find((o) => o < curOrder) ?? sorted[sorted.length - 1]
      if (target != null) selectAndReveal(ordered[target].id)
    },
    [errorIds, ordered, selected, selectAndReveal]
  )

  /* expand / collapse all */
  const collapseAll = useCallback(() => {
    if (collapsedSpanIds !== undefined) return
    setCollapsedInternal(new Set(ordered.filter((s) => s.hasChildren).map((s) => s.id)))
  }, [collapsedSpanIds, ordered])
  const expandAll = useCallback(() => {
    if (collapsedSpanIds !== undefined) return
    setCollapsedInternal(new Set())
  }, [collapsedSpanIds])

  /* brush-to-zoom on the axis */
  const axisRef = useRef<HTMLDivElement>(null)
  const [brush, setBrush] = useState<{ a: number; b: number } | null>(null)
  const brushStart = useRef<number | null>(null)

  const pctFromEvent = useCallback((clientX: number) => {
    const el = axisRef.current
    if (!el) return 0
    const r = el.getBoundingClientRect()
    return Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))
  }, [])
  const timeFromPct = useCallback(
    (p: number) => {
      const usable = 100 - 2 * 2 // WF_PAD = 2
      const frac = (p - 2) / usable
      return domain[0] + frac * (domain[1] - domain[0])
    },
    [domain]
  )

  const onAxisPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!enableZoom || total <= 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      const p = pctFromEvent(e.clientX)
      brushStart.current = p
      setBrush({ a: p, b: p })
    },
    [enableZoom, total, pctFromEvent]
  )
  const onAxisPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (brushStart.current == null) return
      setBrush({ a: brushStart.current, b: pctFromEvent(e.clientX) })
    },
    [pctFromEvent]
  )
  const onAxisPointerUp = useCallback(() => {
    if (brushStart.current == null) return
    const b = brush
    brushStart.current = null
    setBrush(null)
    if (!b || Math.abs(b.b - b.a) < 1.5) return
    const t0 = timeFromPct(Math.min(b.a, b.b))
    const t1 = timeFromPct(Math.max(b.a, b.b))
    const lo = Math.max(0, Math.min(t0, t1))
    const hi = Math.min(total, Math.max(t0, t1))
    if (hi - lo > total * 0.005) setZoom([lo, hi])
  }, [brush, timeFromPct, total])

  const isZoomed = zoom != null

  /* clamp selection if the input changed under us */
  useEffect(() => {
    if (selectedSpanId === undefined && selInternal && !byId[selInternal]) setSelInternal(null)
  }, [byId, selInternal, selectedSpanId])

  const selectedNode = selected ? byId[selected] : null
  const panelOpen = showDetailPanel && !!selectedNode
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  /* close the panel and return focus to the originating row */
  const closePanel = useCallback(() => {
    const prev = selected
    selectSpan(null)
    if (prev) requestAnimationFrame(() => rowRefs.current.get(prev)?.focus())
  }, [selected, selectSpan])
  const errors = errorIds.length

  const rootClass = ['trace-viewer', className].filter(Boolean).join(' ')

  if (!ordered.length) {
    return (
      <div ref={ref} className={rootClass} {...rest}>
        <div className="trace-viewer__empty">No spans in this trace.</div>
      </div>
    )
  }

  return (
    <div ref={ref} className={rootClass} {...rest}>
      {showSummary && <TraceSummary model={model} resolveColor={resolveColor} resolveLabel={resolveLabel} />}

      {showToolbar && (
        <div className="trace-viewer__toolbar">
          <div className="trace-viewer__toolbar-group">
            <button type="button" className="trace-viewer__tool-btn" onClick={expandAll} title="Expand all" aria-label="Expand all">
              <Icon name="chevronDown" size={14} />
            </button>
            <button type="button" className="trace-viewer__tool-btn" onClick={collapseAll} title="Collapse all" aria-label="Collapse all">
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
          <div className="trace-viewer__toolbar-group">
            <button type="button" className="trace-viewer__tool-btn" onClick={() => jumpError(-1)} disabled={!errors} title="Previous error" aria-label="Previous error">
              <Icon name="arrowUp" size={14} />
            </button>
            <span className={'trace-viewer__error-count' + (errors ? ' is-active' : '')}>
              {errors} error{errors !== 1 ? 's' : ''}
            </span>
            <button type="button" className="trace-viewer__tool-btn" onClick={() => jumpError(1)} disabled={!errors} title="Next error" aria-label="Next error">
              <Icon name="arrowDown" size={14} />
            </button>
          </div>
          {enableZoom && (
            <div className="trace-viewer__toolbar-group">
              <button type="button" className="trace-viewer__tool-btn" onClick={() => setZoom(null)} disabled={!isZoomed} title="Reset zoom" aria-label="Reset zoom">
                <Icon name="reload" size={14} />
              </button>
              <span className="trace-viewer__zoom-hint">{isZoomed ? `${fmtMs(domain[0])} – ${fmtMs(domain[1])}` : 'drag axis to zoom'}</span>
            </div>
          )}
        </div>
      )}

      <div className="trace-viewer__body">
        <div className="trace-viewer__lane">
          {/* lane head */}
          <div className="trace-viewer__lane-head" style={{ height: 32 }}>
            <div className="trace-viewer__tree-head" style={{ width: treeWidth }}>
              <span className="trace-viewer__eyebrow">
                SPAN · {rows.length}/{ordered.length}
              </span>
              <span className="trace-viewer__eyebrow">DURATION</span>
            </div>
            <div
              className={'trace-viewer__axis' + (enableZoom ? ' is-zoomable' : '')}
              ref={axisRef}
              onPointerDown={onAxisPointerDown}
              onPointerMove={onAxisPointerMove}
              onPointerUp={onAxisPointerUp}
              onDoubleClick={() => setZoom(null)}
            >
              {ticks.map((t, i) => (
                <div key={i} className="trace-viewer__tick-label" style={{ left: `${scale.x(t)}%` }}>
                  {t === 0 ? '0' : fmtMs(t)}
                </div>
              ))}
              {brush && (
                <div className="trace-viewer__brush" style={{ left: `${Math.min(brush.a, brush.b)}%`, width: `${Math.abs(brush.b - brush.a)}%` }} />
              )}
            </div>
          </div>

          {/* scroll body */}
          <div className="trace-viewer__scroll" ref={containerRef}>
            <div className="trace-viewer__rows" style={{ height: totalH }}>
              <div ref={sentinelRef} className="trace-viewer__sentinel" />

              {/* tree column */}
              <div
                className="trace-viewer__tree"
                role="tree"
                aria-label="Span tree"
                tabIndex={0}
                onKeyDown={handleTreeKeyDown}
                style={{ width: treeWidth, height: totalH }}
              >
                {rendered.map((node, li) => {
                  const i = visStart + li
                  return (
                    <div key={node.id} className="trace-viewer__row-abs" style={{ top: i * rowHeight }}>
                      <TreeRow
                        node={node}
                        rowHeight={rowHeight}
                        treeWidth={treeWidth}
                        selected={selected === node.id}
                        hovered={hovered === node.id}
                        collapsed={collapsed.has(node.id)}
                        color={resolveColor(node.service)}
                        onSelect={(id) => selectAndReveal(id, false)}
                        onHover={setHovered}
                        onToggle={toggleSpan}
                        registerRef={registerRef}
                      />
                    </div>
                  )
                })}
              </div>

              {/* waterfall column */}
              <div className="trace-viewer__wf" style={{ height: totalH }}>
                {/* gridlines */}
                {ticks.map((t, i) => (
                  <div key={i} className="trace-viewer__gridline" style={{ left: `${scale.x(t)}%` }} />
                ))}
                {/* connector bus */}
                <svg
                  className="trace-viewer__connectors"
                  width="100%"
                  height={totalH}
                  viewBox={`0 0 100 ${totalH}`}
                  preserveAspectRatio="none"
                >
                  {rows.map((s) => {
                    if (!s.parentId) return null
                    const cIdx = rowIndexById.get(s.id)
                    const pIdx = rowIndexById.get(s.parentId)
                    if (cIdx == null || pIdx == null) return null
                    const lo = Math.min(cIdx, pIdx)
                    const hi = Math.max(cIdx, pIdx)
                    if (hi < visStart - 24 || lo > visEnd + 24) return null
                    const parent = byId[s.parentId]
                    const xP = scale.x(parent.start)
                    const xC = scale.x(s.start)
                    const yP = pIdx * rowHeight + rowHeight / 2 + 5
                    const yC = cIdx * rowHeight + rowHeight / 2
                    const on = path.has(s.id) && path.has(s.parentId)
                    return (
                      <path
                        key={s.id}
                        d={`M ${xP} ${yP} L ${xP} ${yC} L ${xC} ${yC}`}
                        className={'trace-viewer__connector' + (on ? ' is-active' : '')}
                        vectorEffect="non-scaling-stroke"
                      />
                    )
                  })}
                </svg>
                {/* bars */}
                {rendered.map((node, li) => {
                  const i = visStart + li
                  return (
                    <div key={node.id} className="trace-viewer__row-abs" style={{ top: i * rowHeight }}>
                      <WaterfallRow
                        node={node}
                        rowHeight={rowHeight}
                        scaleX={scale.x}
                        scaleW={scale.w}
                        selected={selected === node.id}
                        hovered={hovered === node.id}
                        color={resolveColor(node.service)}
                        onSelect={(id) => selectAndReveal(id, false)}
                        onHover={setHovered}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {showDetailPanel && (
          <div className={'trace-viewer__panel' + (panelOpen ? ' is-open' : '')} style={{ width: panelOpen ? detailPanelWidth : 0 }}>
            {selectedNode && (
              <TraceDetailPanel
                span={selectedNode}
                model={model}
                traceId={trace.meta?.traceId}
                resolveColor={resolveColor}
                serviceLabel={resolveLabel(selectedNode.service)}
                serviceHost={services[selectedNode.service]?.host}
                onClose={closePanel}
                onSelect={(id) => selectAndReveal(id, false)}
                renderAttributes={renderAttributes}
                closeButtonRef={closeButtonRef}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
})

TraceViewer.displayName = 'TraceViewer'

export default TraceViewer
