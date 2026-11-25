import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { usePanZoom } from '../hooks/usePanZoom'
import { useControllable } from '../hooks/useControllable'
import { layerPaletteColor } from '../utils/layered/buildLayeredIndex'
import { branchMapScene } from '../utils/branchMap'
import type {
  BranchMapData,
  BranchMapGroupLayout,
  BranchMapLabelBox,
  BranchMapLabelRole,
  BranchMapLooseStations,
  BranchMapMeasureText,
  BranchMapRoutedLine,
  BranchMapRoutedLink,
  BranchMapStationLayout,
  BranchMapWidthMode,
} from '../utils/branchMap'
import type { Point } from '../utils/graph'
import './BranchMap.css'

/** Something drawn on the map, as passed to `onSelect`, `onHoverChange` and `renderTooltip`. */
export type BranchMapItem =
  | { kind: 'station'; id: string; station: BranchMapStationLayout }
  | { kind: 'line'; id: string; line: BranchMapRoutedLine }
  | { kind: 'link'; id: string; link: BranchMapRoutedLink }
  | { kind: 'group'; id: string; group: BranchMapGroupLayout }

export interface BranchMapProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Groups, stations, lines and links. Memoize it: a new object re-runs the layout. */
  data: BranchMapData
  /** The selected station, line, link or group id (controlled). An input line drawn inside a bundle selects the bundle. Unset: the map keeps its own. */
  selectedId?: string | null
  /** Click, Enter or Space on an item selects it (again clears); Escape and a click on empty canvas clear. */
  onSelect?: (id: string | null, item: BranchMapItem | null) => void
  /** The hovered or keyboard-focused item (controlled). Unset: the map keeps its own. */
  hoveredId?: string | null
  onHoverChange?: (id: string | null, item: BranchMapItem | null) => void
  /** Group and bundle ids drawn whole (controlled). Clicking a bundle or "N more" line adds it; the group toggle adds or removes a group. */
  expanded?: readonly string[]
  /** Initial `expanded` when uncontrolled. */
  defaultExpanded?: readonly string[]
  onExpandedChange?: (expanded: string[]) => void
  /** Hover detail, drawn in a floating box beside the item. Unset: native tooltips from each item's `<title>`. */
  renderTooltip?: (item: BranchMapItem) => React.ReactNode
  /** Text beside each group's start marker (for example `NOW`). Unset: the marker alone. */
  startLabel?: string
  /** Layout: between the sub-rows of one rank band. */
  rowGap?: number
  /** Layout: between rank bands. */
  rankGap?: number
  /** Layout: between lanes. */
  laneGap?: number
  /** Layout: between groups. */
  groupGap?: number
  /** Layout: ranks a line spans at least. */
  minBranchRanks?: number
  /** Layout: branch lanes per group before lines bundle. */
  maxLanes?: number
  /** Layout: `'weight'` widens lines and the trunk by weight. */
  width?: BranchMapWidthMode
  /** Layout: labels wrap to two lines at this width, then end with an ellipsis. */
  maxLabelWidth?: number
  /** Layout: label text width in px. Unset: measured with a canvas in the map's fonts (an estimate without a DOM). */
  measureText?: BranchMapMeasureText
  /** Layout: where stations no line leads to go. */
  looseStations?: BranchMapLooseStations
}

const EMPTY: readonly string[] = []
const PAD = 24
const DRAG_PX = 4
const REVEAL_MARGIN = 40
const EYEBROW_FS = 9.5
// JetBrains Mono advance (0.6em) plus the eyebrow's 0.06em letter spacing.
const EYEBROW_CHAR = EYEBROW_FS * 0.66
const NAME_FS = 13

// The fonts the labels are drawn in (BranchMap.css), for measuring them.
const LABEL_FONT: Record<BranchMapLabelRole, (sans: string, mono: string) => string> = {
  station: (sans) => `400 12px ${sans}`,
  line: (_sans, mono) => `400 10px ${mono}`,
  group: (sans) => `600 ${NAME_FS}px ${sans}`,
}

const r1 = (v: number) => Math.round(v * 10) / 10

// Bundlers replace `process.env.NODE_ENV` but often leave `process` undefined, so read it guarded.
const isDevBuild = () => {
  try {
    return process.env.NODE_ENV !== 'production'
  } catch {
    return false
  }
}

/**
 * Label widths from a 2D canvas in the map's own fonts, re-made once web fonts finish loading so
 * a measure taken with a fallback font is replaced. Undefined without a DOM or a canvas context:
 * the layout then estimates.
 */
function useCanvasMeasure(enabled: boolean): BranchMapMeasureText | undefined {
  const [fontsReady, setFontsReady] = useState(0)
  useEffect(() => {
    if (!enabled || typeof document === 'undefined' || !document.fonts) return
    let live = true
    const bump = () => live && setFontsReady((n) => n + 1)
    document.fonts.ready.then(bump, () => {})
    document.fonts.addEventListener?.('loadingdone', bump)
    return () => {
      live = false
      document.fonts.removeEventListener?.('loadingdone', bump)
    }
  }, [enabled])
  return useMemo(() => {
    if (!enabled || typeof document === 'undefined' || typeof navigator === 'undefined' || /jsdom/i.test(navigator.userAgent)) return undefined
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return undefined
    const cs = getComputedStyle(document.documentElement)
    const sans = cs.getPropertyValue('--font-sans').trim() || 'sans-serif'
    const mono = cs.getPropertyValue('--font-mono').trim() || 'monospace'
    const fonts = { station: LABEL_FONT.station(sans, mono), line: LABEL_FONT.line(sans, mono), group: LABEL_FONT.group(sans, mono) }
    return (text: string, role: BranchMapLabelRole) => {
      ctx.font = fonts[role]
      return ctx.measureText(text).width
    }
    // fontsReady re-creates the measure (and so re-runs the layout) once fonts load.
  }, [enabled, fontsReady])
}

interface Header {
  group: BranchMapGroupLayout
  x: number
  /** Eyebrow (counts) baseline. */
  metaY: number
  /** Name: the layout's box when it placed one, else a baseline above the group. */
  nameBox: BranchMapLabelBox | null
  nameY: number
  meta: string
  /** Expanded ids that belong to the group, for the toggle. */
  expandedIds: string[]
  toggle: 'expand' | 'collapse' | null
  toggleX: number
}

interface NavItem {
  id: string
  x: number
  y: number
}

/**
 * A vertical branch map (Metro bands): per group a trunk from its start marker, lines that fork
 * and rejoin at 45° along their own lanes, stations in dependency-rank bands, labels beside them,
 * and links between groups. A scene component without chrome: it runs `branchMapScene`, draws it,
 * and handles direct manipulation (pan and zoom, selection, hover, keyboard focus, expanding
 * bundles). Every colour is a token: groups take `--graph-layer-<n>`.
 */
export const BranchMap = React.forwardRef<HTMLDivElement, BranchMapProps>(
  (
    {
      data,
      selectedId: selectedIdProp,
      onSelect,
      hoveredId: hoveredIdProp,
      onHoverChange,
      expanded: expandedProp,
      defaultExpanded,
      onExpandedChange,
      renderTooltip,
      startLabel,
      rowGap,
      rankGap,
      laneGap,
      groupGap,
      minBranchRanks,
      maxLanes,
      width,
      maxLabelWidth,
      measureText,
      looseStations,
      className = '',
      onKeyDown,
      onPointerDown,
      onClick,
      ...props
    },
    ref,
  ) => {
    const uid = useId().replace(/:/g, '')
    const arrowId = `branch-map-arrow-${uid}`
    const containerRef = useRef<HTMLDivElement | null>(null)
    const setRefs = useCallback(
      (el: HTMLDivElement | null) => {
        containerRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      },
      [ref],
    )

    const [expanded, setExpanded] = useControllable<readonly string[]>(expandedProp, defaultExpanded ?? EMPTY, onExpandedChange as ((v: readonly string[]) => void) | undefined)
    const expandedKey = expanded.join('\u0000')
    const canvasMeasure = useCanvasMeasure(!measureText)
    const measure = measureText ?? canvasMeasure

    const scene = useMemo(
      () =>
        branchMapScene(data, {
          rowGap,
          rankGap,
          laneGap,
          groupGap,
          minBranchRanks,
          maxLanes,
          width,
          maxLabelWidth,
          measureText: measure,
          looseStations,
          expanded: expandedKey ? expandedKey.split('\u0000') : [],
        }),
      [data, rowGap, rankGap, laneGap, groupGap, minBranchRanks, maxLanes, width, maxLabelWidth, measure, looseStations, expandedKey],
    )

    const warnedIssues = useRef<unknown>(null)
    useEffect(() => {
      if (!scene.issues.length || !isDevBuild() || warnedIssues.current === scene.issues) return
      warnedIssues.current = scene.issues
      console.warn(`BranchMap: ${scene.issues.length} input issue(s) the layout worked around.`, scene.issues)
    }, [scene.issues])

    // ---- Lookups ------------------------------------------------------------------------------

    const index = useMemo(() => {
      const items = new Map<string, BranchMapItem>()
      for (const g of scene.groups) items.set(g.id, { kind: 'group', id: g.id, group: g })
      for (const s of scene.stations) items.set(s.id, { kind: 'station', id: s.id, station: s })
      for (const l of scene.lines) items.set(l.id, { kind: 'line', id: l.id, line: l })
      for (const k of scene.links) items.set(k.id, { kind: 'link', id: k.id, link: k })
      // Input lines drawn inside a bundle or "N more" line resolve to it.
      const drawnAs = new Map<string, string>()
      for (const l of scene.lines) if (l.kind === 'bundle' || l.kind === 'more') for (const m of l.members) drawnAs.set(m, l.id)
      const groupLabel = new Map(scene.groups.map((g) => [g.id, g.label]))
      return { items, drawnAs, groupLabel }
    }, [scene])
    const resolve = useCallback((id: string | null | undefined) => (id == null ? null : index.items.has(id) ? id : (index.drawnAs.get(id) ?? null)), [index])
    const itemOf = useCallback((id: string | null) => (id ? (index.items.get(id) ?? null) : null), [index])

    const [rawSelected, setSelected] = useControllable<string | null>(selectedIdProp, null, (id) => onSelect?.(id, itemOf(resolve(id))))
    const [rawHovered, setHovered] = useControllable<string | null>(hoveredIdProp, null, (id) => onHoverChange?.(id, itemOf(resolve(id))))
    const selected = resolve(rawSelected)
    const hovered = resolve(rawHovered)

    // Which group a bundle the user expanded belonged to, so the group toggle can collapse it.
    const bundleGroup = useRef(new Map<string, string>())
    useEffect(() => {
      for (const l of scene.lines) if (l.kind === 'bundle' || l.kind === 'more') bundleGroup.current.set(l.id, l.group)
    }, [scene])

    // ---- Selection context: everything not in it is dimmed -----------------------------------

    const related = useMemo(() => {
      if (!selected) return null
      const item = index.items.get(selected)
      const out = new Set<string>([selected])
      if (!item) return out
      if (item.kind === 'group') {
        for (const s of scene.stations) if (s.group === selected) out.add(s.id)
        for (const l of scene.lines) if (l.group === selected) out.add(l.id)
        const inGroup = (id: string) => {
          const end = index.items.get(id)
          return id === selected || (end?.kind === 'station' && end.station.group === selected)
        }
        for (const k of scene.links) if (inGroup(k.from) || inGroup(k.to)) out.add(k.id)
      } else if (item.kind === 'line') {
        const l = item.line
        if (l.from) out.add(l.from)
        if (l.to) out.add(l.to)
        for (const s of l.stops) out.add(s)
      } else if (item.kind === 'link') {
        out.add(item.link.from)
        out.add(item.link.to)
      } else {
        const st = item.station.station
        for (const a of st.after ?? []) out.add(a)
        for (const s of scene.stations) if (s.station.after?.includes(selected)) out.add(s.id)
        for (const l of scene.lines) if (l.from === selected || l.to === selected || l.stops.includes(selected)) out.add(l.id)
        for (const k of scene.links)
          if (k.from === selected || k.to === selected) {
            out.add(k.id)
            out.add(k.from)
            out.add(k.to)
          }
      }
      return out
    }, [selected, index, scene])
    const dim = (id: string) => (related && !related.has(id) ? ' branch-map__dim' : '')

    // ---- Frame and headers --------------------------------------------------------------------

    const { headers, frame } = useMemo(() => {
      let minX = scene.bounds.x
      let minY = scene.bounds.y
      let maxX = scene.bounds.x + scene.bounds.width
      let maxY = scene.bounds.y + scene.bounds.height
      const add = (x: number, y: number, hw = 0, hh = 0) => {
        minX = Math.min(minX, x - hw)
        maxX = Math.max(maxX, x + hw)
        minY = Math.min(minY, y - hh)
        maxY = Math.max(maxY, y + hh)
      }
      for (const s of scene.stations) add(s.x, s.y, 10, 10)
      for (const b of scene.labels) {
        add(b.x, b.y)
        add(b.x + b.width, b.y + b.height)
      }
      for (const l of scene.lines) for (const p of l.points) add(p.x, p.y, 8, 16)
      for (const k of scene.links) for (const p of k.points) add(p.x, p.y)
      for (const t of scene.trunks) {
        add(t.x, t.y1)
        add(t.x, t.y2)
      }

      const hs: Header[] = scene.groups.map((g) => {
        let top = g.start.y - 8
        for (const s of scene.stations) if (s.group === g.id) top = Math.min(top, s.y - 10)
        for (const b of scene.labels) if (b.group === g.id && b.role !== 'group') top = Math.min(top, b.y)
        const nameBox = scene.labels.find((b) => b.role === 'group' && b.target === g.id) ?? null
        const nameY = nameBox ? nameBox.y + nameBox.height : top - 10
        const metaY = (nameBox ? nameBox.y : nameY - NAME_FS) - 6
        const c = g.counts
        const meta = [
          `${c.lines} ${c.lines === 1 ? 'LINE' : 'LINES'}`,
          `${c.stops} ${c.stops === 1 ? 'STOP' : 'STOPS'}`,
          ...(c.decisions ? [`${c.decisions} ${c.decisions === 1 ? 'DECISION' : 'DECISIONS'}`] : []),
          ...(c.blocked ? [`${c.blocked} BLOCKED`] : []),
          ...(c.bundled ? [`${c.bundled} BUNDLED`] : []),
        ].join(' · ')
        const expandedIds = expanded.filter((e) => e === g.id || bundleGroup.current.get(e) === g.id)
        const toggle = expandedIds.length ? 'collapse' : c.bundled > 0 ? 'expand' : null
        const toggleX = g.x + meta.length * EYEBROW_CHAR + 10
        const nameW = nameBox ? nameBox.width : (measure?.(g.label, 'group') ?? g.label.length * NAME_FS * 0.55)
        add(g.x, metaY - EYEBROW_FS)
        add(Math.max(g.x + nameW, toggleX + (toggle ? 9 * EYEBROW_CHAR : 0)), nameY)
        return { group: g, x: g.x, metaY, nameBox, nameY, meta, expandedIds, toggle, toggleX }
      })
      if (!Number.isFinite(minX)) return { headers: hs, frame: { x: 0, y: 0, w: 0, h: 0 } }
      return { headers: hs, frame: { x: minX - PAD, y: minY - PAD, w: maxX - minX + 2 * PAD, h: maxY - minY + 2 * PAD } }
    }, [scene, expanded, measure])

    // ---- Pan and zoom -------------------------------------------------------------------------

    const { transform, viewport, bind, panTo, getViewport } = usePanZoom({ containerRef })
    const toScreen = (p: Point) => {
      const v = viewport
      return { x: (p.x - frame.x) * v.zoom + v.x, y: (p.y - frame.y) * v.zoom + v.y }
    }

    // ---- Keyboard order: per group, items top to bottom ---------------------------------------

    const anchorOf = useCallback(
      (id: string): Point | null => {
        const item = index.items.get(id)
        if (!item) return null
        if (item.kind === 'station') return { x: item.station.x, y: item.station.y }
        if (item.kind === 'line') {
          const r = item.line.run
          return r ? { x: r.x, y: (r.y1 + r.y2) / 2 } : (item.line.points[0] ?? null)
        }
        if (item.kind === 'link') return item.link.mid
        return item.group.start
      },
      [index],
    )

    const nav = useMemo(() => {
      const cols: NavItem[][] = scene.groups.map((g) => {
        const out: NavItem[] = []
        for (const s of scene.stations) if (s.group === g.id) out.push({ id: s.id, x: s.x, y: s.y })
        for (const l of scene.lines) {
          if (l.group !== g.id) continue
          const r = l.run
          out.push({ id: l.id, x: r ? r.x : (l.points[0]?.x ?? g.trunkX), y: r ? r.y1 : l.y1 })
        }
        return out.sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))
      })
      const where = new Map<string, [number, number]>()
      cols.forEach((col, gi) => col.forEach((n, i) => where.set(n.id, [gi, i])))
      return { cols, where }
    }, [scene])

    const [focusId, setFocusId] = useState<string | null>(null)
    const itemEls = useRef(new Map<string, SVGGElement>())
    const elRef = (id: string) => (el: SVGGElement | null) => {
      if (el) itemEls.current.set(id, el)
      else itemEls.current.delete(id)
    }
    const tabStop =
      (focusId && nav.where.has(focusId) && focusId) || (selected && nav.where.has(selected) && selected) || nav.cols.find((c) => c.length)?.[0]?.id || null

    // Pans so an item focused from the keyboard is on screen.
    const reveal = (id: string) => {
      const p = anchorOf(id)
      const el = containerRef.current
      if (!p || !el) return
      const v = getViewport()
      const sx = (p.x - frame.x) * v.zoom + v.x
      const sy = (p.y - frame.y) * v.zoom + v.y
      const m = REVEAL_MARGIN
      if (sx >= m && sx <= el.clientWidth - m && sy >= m && sy <= el.clientHeight - m) return
      panTo(el.clientWidth / 2 - (p.x - frame.x) * v.zoom, el.clientHeight / 2 - (p.y - frame.y) * v.zoom)
    }
    const moveFocus = (id: string | undefined) => {
      if (!id) return
      setFocusId(id)
      itemEls.current.get(id)?.focus({ preventScroll: true })
      reveal(id)
    }

    // ---- Actions ------------------------------------------------------------------------------

    const down = useRef<{ x: number; y: number } | null>(null)
    const dragged = (e: React.MouseEvent) => !!down.current && Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > DRAG_PX

    const expand = (id: string, group: string) => {
      bundleGroup.current.set(id, group)
      if (!expanded.includes(id)) setExpanded([...expanded, id])
    }
    const toggleGroup = (h: Header) => {
      if (h.toggle === 'collapse') setExpanded(expanded.filter((e) => !h.expandedIds.includes(e)))
      else if (h.toggle === 'expand') setExpanded([...expanded, h.group.id])
    }
    const activate = (id: string) => {
      const item = index.items.get(id)
      if (item?.kind === 'line' && (item.line.kind === 'bundle' || item.line.kind === 'more')) {
        expand(id, item.line.group)
        return
      }
      setSelected(selected === id ? null : id)
    }
    const pick = (id: string) => (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!dragged(e)) activate(id)
    }
    const hoverProps = (id: string) => ({
      onPointerEnter: () => setHovered(id),
      onPointerLeave: () => setHovered(null),
    })

    const onItemKey = (e: React.KeyboardEvent, id: string) => {
      const at = nav.where.get(id)
      if (!at) return
      const [gi, i] = at
      const col = nav.cols[gi]
      let next: string | undefined
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault()
          e.stopPropagation()
          activate(id)
          return
        case 'ArrowDown':
          next = col[Math.min(col.length - 1, i + 1)]?.id
          break
        case 'ArrowUp':
          next = col[Math.max(0, i - 1)]?.id
          break
        case 'Home':
          next = col[0]?.id
          break
        case 'End':
          next = col[col.length - 1]?.id
          break
        case 'ArrowLeft':
        case 'ArrowRight': {
          const step = e.key === 'ArrowRight' ? 1 : -1
          const y = col[i].y
          for (let g = gi + step; g >= 0 && g < nav.cols.length; g += step) {
            if (!nav.cols[g].length) continue
            next = nav.cols[g].reduce((best, n) => (Math.abs(n.y - y) < Math.abs(best.y - y) ? n : best)).id
            break
          }
          break
        }
        default:
          return
      }
      // Arrow keys move between items here; they pan only from the map itself.
      e.preventDefault()
      e.stopPropagation()
      moveFocus(next)
    }

    const onRootKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      if (e.key === 'Escape' && selected) {
        e.preventDefault()
        setSelected(null)
        return
      }
      bind.onKeyDown(e)
    }
    const onRootPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e)
      down.current = { x: e.clientX, y: e.clientY }
      if (e.button === 0 && !e.defaultPrevented) bind.onPointerDown(e)
    }
    const onRootClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented && !dragged(e) && selected) setSelected(null)
    }

    // ---- Accessible names and titles ----------------------------------------------------------

    const nameOf = (item: BranchMapItem): string => {
      if (item.kind === 'group') return `${item.group.label}, group`
      if (item.kind === 'station') {
        const s = item.station.station
        const progress = s.progress ? `, ${s.progress[0]} of ${s.progress[1]}` : ''
        return `${s.label}, ${s.kind}, ${s.status}${s.blocked ? ', blocked' : ''}${progress}, ${index.groupLabel.get(s.group) ?? s.group}`
      }
      if (item.kind === 'line') {
        const l = item.line
        if (l.kind === 'bundle' || l.kind === 'more') return `${l.label}, ${l.members.length} lines, ${index.groupLabel.get(l.group) ?? l.group}; Enter expands`
        const marks = l.marks ? `, ${l.marks.emphasized ?? 0} of ${l.marks.total} marked` : ''
        return `${l.label}, ${l.kind === 'spur' ? 'planned stations' : 'line'}, ${l.status}${l.end === 'dead' ? ', dead end' : ''}${marks}, ${index.groupLabel.get(l.group) ?? l.group}`
      }
      const k = item.link
      const end = (id: string) => (index.items.get(id)?.kind === 'group' ? `${index.groupLabel.get(id) ?? id} start` : labelOf(id))
      return `${k.kind === 'dependency' ? 'Dependency' : 'Provides'}: ${end(k.from)} to ${end(k.to)}${k.label ? `, ${k.label}` : ''}`
    }
    function labelOf(id: string): string {
      const item = index.items.get(id)
      if (!item) return id
      if (item.kind === 'station') return item.station.station.label
      if (item.kind === 'line') return item.line.label
      if (item.kind === 'group') return item.group.label
      return item.link.label ?? id
    }
    const title = (item: BranchMapItem) => (renderTooltip ? null : <title>{nameOf(item)}</title>)

    // ---- Render -------------------------------------------------------------------------------

    const colorOf = new Map(scene.groups.map((g) => [g.id, layerPaletteColor(g.color)]))
    const hoveredItem = itemOf(hovered)
    const hoverAnchor = hovered ? anchorOf(hovered) : null
    const tooltip = renderTooltip && hoveredItem && hoverAnchor ? renderTooltip(hoveredItem) : null
    const tipAt = hoverAnchor ? toScreen(hoverAnchor) : null

    const stationCount = scene.stations.length
    return (
      <div
        ref={setRefs}
        className={['branch-map', className].filter(Boolean).join(' ')}
        tabIndex={bind.tabIndex}
        role={bind.role}
        aria-label={`Branch map, ${scene.groups.length} groups, ${stationCount} stations; Tab to the map items, arrow keys move between them, plus and minus zoom`}
        {...props}
        onKeyDown={onRootKeyDown}
        onPointerDown={onRootPointerDown}
        onClick={onRootClick}
      >
        {scene.groups.length === 0 ? (
          <div className="branch-map__empty">No groups to show.</div>
        ) : (
          <svg className="branch-map__svg" width="100%" height="100%">
            <defs>
              <marker id={arrowId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L8,4 L0,8 z" className="branch-map__arrow" />
              </marker>
            </defs>
            <g transform={transform}>
              <g transform={`translate(${r1(-frame.x)} ${r1(-frame.y)})`}>
                {/* group headers */}
                {headers.map((h) => (
                  <g key={h.group.id} className="branch-map__header" data-group-id={h.group.id}>
                    <text className="branch-map__group-meta" x={r1(h.x)} y={r1(h.metaY)}>
                      {h.meta}
                    </text>
                    {h.toggle && (
                      <text
                        className="branch-map__toggle"
                        x={r1(h.toggleX)}
                        y={r1(h.metaY)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={h.toggle === 'collapse'}
                        aria-label={h.toggle === 'expand' ? `Expand ${h.group.label}: draw all ${h.group.counts.lines} lines` : `Collapse ${h.group.label}: bundle its lines again`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!dragged(e)) toggleGroup(h)
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return
                          e.preventDefault()
                          e.stopPropagation()
                          toggleGroup(h)
                        }}
                      >
                        {h.toggle === 'expand' ? 'EXPAND' : 'COLLAPSE'}
                      </text>
                    )}
                    <text
                      className={`branch-map__group-name${selected === h.group.id ? ' branch-map__group-name--selected' : ''}`}
                      x={r1(h.x)}
                      y={r1(h.nameY)}
                      onClick={pick(h.group.id)}
                      {...hoverProps(h.group.id)}
                    >
                      {h.nameBox && h.nameBox.lines.length > 1
                        ? h.nameBox.lines.map((t, i) => (
                            <tspan key={i} x={r1(h.x)} dy={i ? NAME_FS * 1.25 : -(h.nameBox!.lines.length - 1) * NAME_FS * 1.25}>
                              {t}
                            </tspan>
                          ))
                        : (h.nameBox?.lines[0] ?? h.group.label)}
                      {title(index.items.get(h.group.id)!)}
                    </text>
                  </g>
                ))}

                {/* links */}
                {scene.links.map((k) => (
                  <g
                    key={k.id}
                    className={`branch-map__link branch-map__link--${k.kind}${dim(k.id)}`}
                    data-link-id={k.id}
                    onClick={pick(k.id)}
                    {...hoverProps(k.id)}
                  >
                    {title(index.items.get(k.id)!)}
                    <path className="branch-map__link-hit" d={k.path} />
                    <path className="branch-map__link-path" d={k.path} markerEnd={k.kind === 'dependency' ? `url(#${arrowId})` : undefined} />
                    {k.label && (
                      <text className="branch-map__link-label" x={r1(k.mid.x + 4)} y={r1(k.mid.y - 4)}>
                        {k.label}
                      </text>
                    )}
                    {selected === k.id && <path className="branch-map__link-selection" d={k.path} />}
                  </g>
                ))}

                {/* trunks and start markers */}
                {scene.trunks.map((t) => (
                  <g key={t.group} className={`branch-map__trunk${dim(t.group)}`} style={{ color: colorOf.get(t.group) }} data-group-id={t.group}>
                    {t.segments.map((s, i) => (
                      <line key={i} x1={r1(s.from.x)} y1={r1(s.from.y)} x2={r1(s.to.x)} y2={r1(s.to.y)} strokeWidth={s.width} />
                    ))}
                  </g>
                ))}
                {scene.groups.map((g) => (
                  <g key={g.id} className={`branch-map__start${dim(g.id)}`} aria-hidden="true">
                    <rect x={r1(g.start.x - 8)} y={r1(g.start.y - 2)} width={16} height={4} rx={1} />
                    {startLabel && (
                      <text className="branch-map__start-label" x={r1(g.start.x + 11)} y={r1(g.start.y + 3)}>
                        {startLabel}
                      </text>
                    )}
                  </g>
                ))}

                {/* lines */}
                {scene.lines.map((l) => {
                  const item = index.items.get(l.id)!
                  const bundled = l.kind === 'bundle' || l.kind === 'more'
                  const mods = [
                    `branch-map__line--${l.kind}`,
                    `branch-map__line--${l.style}`,
                    `branch-map__line--${l.status}`,
                    selected === l.id ? 'branch-map__line--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  const run = l.run
                  const span = run ? run.y2 - run.y1 : 0
                  const ticks = l.marks && run ? Math.max(0, Math.min(l.marks.total, Math.floor((span - 10) / 7))) : 0
                  const tickY = (i: number) => (ticks === 1 ? (run!.y1 + run!.y2) / 2 : run!.y1 + 8 + (i * (span - 16)) / (ticks - 1))
                  const badge = bundled && run ? String(l.members.length) : null
                  const badgeW = badge ? badge.length * 6 + 8 : 0
                  return (
                    <g
                      key={l.id}
                      ref={elRef(l.id)}
                      className={`branch-map__line ${mods}${dim(l.id)}`}
                      style={{ color: colorOf.get(l.group) }}
                      data-line-id={l.id}
                      data-kind={l.kind}
                      role="button"
                      tabIndex={tabStop === l.id ? 0 : -1}
                      aria-label={nameOf(item)}
                      aria-pressed={bundled ? undefined : selected === l.id}
                      aria-expanded={bundled ? false : undefined}
                      onClick={pick(l.id)}
                      onFocus={() => {
                        setFocusId(l.id)
                        setHovered(l.id)
                      }}
                      onBlur={() => setHovered(null)}
                      onKeyDown={(e) => onItemKey(e, l.id)}
                      {...hoverProps(l.id)}
                    >
                      {title(item)}
                      {selected === l.id && <path className="branch-map__line-selection" d={l.path} strokeWidth={l.width + 8} />}
                      {hovered === l.id && <path className="branch-map__line-hover" d={l.path} strokeWidth={l.width + 8} />}
                      <path className="branch-map__line-halo" d={l.path} strokeWidth={l.width + 4} />
                      <path className="branch-map__line-stroke" d={l.path} strokeWidth={l.width} />
                      <path className="branch-map__line-hit" d={l.path} />
                      {l.end === 'dead' && run && <line className="branch-map__cap" x1={r1(run.x - 5)} x2={r1(run.x + 5)} y1={r1(run.y2)} y2={r1(run.y2)} />}
                      {l.end === 'open' && run && <line className="branch-map__open-end" x1={r1(run.x)} x2={r1(run.x)} y1={r1(run.y2)} y2={r1(run.y2 + 14)} />}
                      {Array.from({ length: ticks }, (_, i) => (
                        <circle
                          key={i}
                          className={i < (l.marks?.emphasized ?? 0) ? 'branch-map__tick branch-map__tick--emphasized' : 'branch-map__tick'}
                          cx={r1(run!.x)}
                          cy={r1(tickY(i))}
                          r={2.3}
                        />
                      ))}
                      {badge && run && (
                        <g className="branch-map__badge">
                          <rect x={r1(run.x - badgeW / 2)} y={r1((run.y1 + run.y2) / 2 - 6.5)} width={badgeW} height={13} rx={3} />
                          <text x={r1(run.x)} y={r1((run.y1 + run.y2) / 2)}>
                            {badge}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}

                {/* stations */}
                {scene.stations.map((s) => {
                  const item = index.items.get(s.id)!
                  const st = s.station
                  const r = s.onTrunk ? 6 : 5
                  const isSelected = selected === s.id
                  const mods = [
                    `branch-map__station--${st.kind}`,
                    `branch-map__station--${st.status}`,
                    s.onTrunk ? 'branch-map__station--trunk' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                  return (
                    <g
                      key={s.id}
                      ref={elRef(s.id)}
                      className={`branch-map__station ${mods}${dim(s.id)}`}
                      style={{ color: colorOf.get(s.group) }}
                      data-station-id={s.id}
                      role="button"
                      tabIndex={tabStop === s.id ? 0 : -1}
                      aria-label={nameOf(item)}
                      aria-pressed={isSelected}
                      onClick={pick(s.id)}
                      onFocus={() => {
                        setFocusId(s.id)
                        setHovered(s.id)
                      }}
                      onBlur={() => setHovered(null)}
                      onKeyDown={(e) => onItemKey(e, s.id)}
                      {...hoverProps(s.id)}
                    >
                      {title(item)}
                      <circle className="branch-map__station-hit" cx={r1(s.x)} cy={r1(s.y)} r={11} />
                      <circle className="branch-map__focus" cx={r1(s.x)} cy={r1(s.y)} r={r + 6} />
                      {hovered === s.id && <circle className="branch-map__station-hover" cx={r1(s.x)} cy={r1(s.y)} r={r + 6} />}
                      {isSelected && <circle className="branch-map__ring" cx={r1(s.x)} cy={r1(s.y)} r={r + 5} />}
                      {st.kind === 'decision' ? (
                        <path className="branch-map__shape" d={`M${r1(s.x)},${r1(s.y - r - 1)} L${r1(s.x + r + 1)},${r1(s.y)} L${r1(s.x)},${r1(s.y + r + 1)} L${r1(s.x - r - 1)},${r1(s.y)} Z`} />
                      ) : (
                        <circle className="branch-map__shape" cx={r1(s.x)} cy={r1(s.y)} r={r} />
                      )}
                      {st.blocked && <circle className="branch-map__blocked" cx={r1(s.x + r)} cy={r1(s.y - r)} r={2.6} />}
                    </g>
                  )
                })}

                {/* placed labels */}
                {scene.labels
                  .filter((b) => b.role !== 'group')
                  .map((b) => {
                    const lh = b.height / Math.max(1, b.lines.length)
                    const x = b.anchor === 'end' ? b.x + b.width : b.x
                    const target = index.items.get(b.target)
                    const done = target?.kind === 'station' && target.station.station.status === 'done'
                    return (
                      <text
                        key={`${b.role}:${b.target}`}
                        className={`branch-map__label branch-map__label--${b.role}${done ? ' branch-map__label--done' : ''}${selected === b.target ? ' branch-map__label--selected' : ''}${dim(b.target)}`}
                        textAnchor={b.anchor}
                        onClick={target ? pick(b.target) : undefined}
                        {...(target ? hoverProps(b.target) : {})}
                      >
                        {b.lines.map((t, i) => (
                          <tspan key={i} x={r1(x)} y={r1(b.y + lh * (i + 0.5))} dominantBaseline="central">
                            {t}
                          </tspan>
                        ))}
                      </text>
                    )
                  })}
              </g>
            </g>
          </svg>
        )}
        {tooltip != null && tipAt && (
          <div className="branch-map__tooltip" role="tooltip" style={{ left: r1(tipAt.x + 14), top: r1(tipAt.y + 10) }}>
            {tooltip}
          </div>
        )}
      </div>
    )
  },
)

BranchMap.displayName = 'BranchMap'
