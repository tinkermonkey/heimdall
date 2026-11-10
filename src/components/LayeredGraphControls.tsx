import React, { useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { SegmentedControl, type ChromeSurface } from './SegmentedControl'
import { LayeredGraphContext, type LayeredGraphState } from '../hooks/useLayeredGraph'
import { linkCategoryStyle } from '../utils/layered/emphasis'
import type { PlaneLayoutMode, PredicateLabelMode } from '../utils/layered/types'
import '../styles/utilities.css'
import './LayeredGraphControls.css'

/*
 * Chrome for the layered graph views: segmented controls for follow depth, predicate labels and
 * plane layout, the link-category bar, and the layer, layer-pair and bridge-node lists. Every
 * control reads and writes one `useLayeredGraph` state: the `graph` prop, else the enclosing
 * `LayeredGraphContext`.
 */

/**
 * The `graph` prop, else the enclosing `LayeredGraphContext`. Throws, naming `component`, when
 * there is neither. For chrome built on the layered graph framework.
 */
export function useLayeredGraphProp(graph: LayeredGraphState | undefined, component: string): LayeredGraphState {
  const ctx = useContext(LayeredGraphContext)
  const g = graph ?? ctx
  if (!g) throw new Error(`${component} needs a \`graph\` prop or an enclosing <LayeredGraphContext.Provider>`)
  return g
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}

/** `structural` → `Structural`, `data_flow` → `Data flow`. */
export function categoryDisplayLabel(category: string): string {
  const s = category.replace(/[_-]+/g, ' ').trim()
  return s ? s[0].toUpperCase() + s.slice(1) : 'Uncategorized'
}

// ---------------------------------------------------------------------------
// Segmented controls
// ---------------------------------------------------------------------------

interface SegmentedChromeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`. */
  graph?: LayeredGraphState
  /** Mono eyebrow before the control; `null` hides it (the control keeps its `aria-label`). */
  label?: React.ReactNode
  disabled?: boolean
  /** The surface the control sits on: `shell` for a dark chrome bar in either canvas theme. Default `canvas`. */
  surface?: ChromeSurface
}

interface SegmentedChromeInnerProps extends Omit<SegmentedChromeProps, 'graph'> {
  ariaLabel: string
  value: string | number
  options: { value: string | number; label: React.ReactNode }[]
  onChange: (v: string | number) => void
}

const SegmentedChrome = React.forwardRef<HTMLDivElement, SegmentedChromeInnerProps>(
  ({ label, ariaLabel, value, options, onChange, disabled, surface = 'canvas', className, ...props }, ref) => (
    <div ref={ref} className={cx('layered-control', surface === 'shell' && 'layered-control--shell', className)} {...props}>
      {label != null && (
        <span className="layered-control__eyebrow" aria-hidden="true">
          {label}
        </span>
      )}
      <SegmentedControl
        aria-label={ariaLabel}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        surface={surface}
      />
    </div>
  ),
)
SegmentedChrome.displayName = 'SegmentedChrome'

export interface FollowControlProps extends SegmentedChromeProps {
  /** Follow depths offered (hops past the direct links). Default `[0, 1, 2]`. */
  options?: readonly number[]
  /** Segment text per depth. Default `Direct`, `+1 layer`, `+2 layers`, … */
  formatOption?: (follow: number) => React.ReactNode
}

/** `0` → `Direct`, `1` → `+1 layer`, `n` → `+n layers`. */
export function followOptionLabel(follow: number): string {
  return follow <= 0 ? 'Direct' : `+${follow} layer${follow > 1 ? 's' : ''}`
}

const DEFAULT_FOLLOW_OPTIONS = [0, 1, 2] as const

/** How far the selection's reach follows cross-layer links: Direct / +1 layer / +2 layers. Sets `follow`. */
export const FollowControl = React.forwardRef<HTMLDivElement, FollowControlProps>(
  ({ graph, options = DEFAULT_FOLLOW_OPTIONS, formatOption = followOptionLabel, label = 'Follow', ...props }, ref) => {
    const g = useLayeredGraphProp(graph, 'FollowControl')
    return (
      <SegmentedChrome
        ref={ref}
        {...props}
        label={label}
        ariaLabel="Follow links from the selection"
        value={g.follow}
        options={options.map((n) => ({ value: n, label: formatOption(n) }))}
        onChange={(v) => g.setFollow(Number(v))}
      />
    )
  },
)
FollowControl.displayName = 'FollowControl'

export interface PredicateLabelControlProps extends SegmentedChromeProps {
  /** Modes offered, in order. Default `['off', 'highlighted', 'all']`. */
  options?: readonly PredicateLabelMode[]
  /** Segment text per mode. Default `Off`, `Highlighted`, `All`. */
  optionLabels?: Partial<Record<PredicateLabelMode, React.ReactNode>>
}

const PREDICATE_MODE_LABELS: Record<PredicateLabelMode, string> = { off: 'Off', highlighted: 'Highlighted', all: 'All' }
const DEFAULT_PREDICATE_OPTIONS: readonly PredicateLabelMode[] = ['off', 'highlighted', 'all']

/** Which links show predicate labels: Off / Highlighted (reached links and the active layer pair) / All. Sets `predicateLabels`. */
export const PredicateLabelControl = React.forwardRef<HTMLDivElement, PredicateLabelControlProps>(
  ({ graph, options = DEFAULT_PREDICATE_OPTIONS, optionLabels, label = 'Predicates', ...props }, ref) => {
    const g = useLayeredGraphProp(graph, 'PredicateLabelControl')
    return (
      <SegmentedChrome
        ref={ref}
        {...props}
        label={label}
        ariaLabel="Predicate labels"
        value={g.predicateLabels}
        options={options.map((m) => ({ value: m, label: optionLabels?.[m] ?? PREDICATE_MODE_LABELS[m] }))}
        onChange={(v) => g.setPredicateLabels(v as PredicateLabelMode)}
      />
    )
  },
)
PredicateLabelControl.displayName = 'PredicateLabelControl'

export interface PlaneLayoutControlProps extends SegmentedChromeProps {
  /** Segment text per mode. Default `Independent`, `Coupled`. */
  optionLabels?: Partial<Record<PlaneLayoutMode, React.ReactNode>>
}

const PLANE_LAYOUT_LABELS: Record<PlaneLayoutMode, string> = { independent: 'Independent', coupled: 'Coupled' }

/**
 * Independent (each layer laid out on its own) or Coupled (cross-layer neighbours aligned). Sets
 * `planeLayout`; views that position nodes per layer read it.
 */
export const PlaneLayoutControl = React.forwardRef<HTMLDivElement, PlaneLayoutControlProps>(
  ({ graph, optionLabels, label = 'Plane layout', ...props }, ref) => {
    const g = useLayeredGraphProp(graph, 'PlaneLayoutControl')
    return (
      <SegmentedChrome
        ref={ref}
        {...props}
        label={label}
        ariaLabel="Plane layout"
        value={g.planeLayout}
        options={(['independent', 'coupled'] as const).map((m) => ({ value: m, label: optionLabels?.[m] ?? PLANE_LAYOUT_LABELS[m] }))}
        onChange={(v) => g.setPlaneLayout(v as PlaneLayoutMode)}
      />
    )
  },
)
PlaneLayoutControl.displayName = 'PlaneLayoutControl'

// ---------------------------------------------------------------------------
// Link category bar
// ---------------------------------------------------------------------------

export interface LinkCategoryFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`. */
  graph?: LayeredGraphState
  /** Categories to offer, in order. Default: every category in the index (`LayeredIndex.categories`). */
  categories?: readonly string[]
  /** Display text per category. Unset: the category in sentence case. */
  categoryLabels?: Readonly<Record<string, React.ReactNode>>
  /** Link count per category (bundled links by primary category). Default true. */
  showCounts?: boolean
  /** Mono eyebrow before the toggles; `null` hides it. Default `Links`. */
  label?: React.ReactNode
  /** Toggle for intra-layer links (`filters.showIntra`). Default true. */
  showIntraToggle?: boolean
  intraLabel?: React.ReactNode
  /** Toggle for node labels. Default: shown when `onNodeLabelsChange` is set. */
  showLabelToggle?: boolean
  /** Node labels on or off (controlled). Unset: the graph's `nodeLabels` state, which the toggle then writes. */
  nodeLabels?: boolean
  /** Called by the toggle, with the graph state or a controlled `nodeLabels`. */
  onNodeLabelsChange?: (on: boolean) => void
  labelToggleLabel?: React.ReactNode
  /** The surface the bar sits on: `shell` for a dark chrome bar in either canvas theme. Default `canvas`. */
  surface?: ChromeSurface
  /**
   * Rendered after a divider at the end of the bar, e.g. a `PredicateLabelControl` (pass it the
   * same `surface`). Each divider is glued to the start of what follows it and hidden when that
   * starts a wrapped line, so no line of the bar starts or ends with a divider.
   */
  children?: React.ReactNode
}

/** A pressed / unpressed toggle button in the house chrome style. */
function ChromeToggle({ pressed, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cx('layered-toggle', pressed && 'layered-toggle--on', className)}
      {...props}
    />
  )
}

/**
 * Hides the divider of each `.layered-link-filter__section` (a divider glued to what follows it)
 * that starts a line of the wrapped bar, so no line starts or ends with a divider.
 *
 * Hiding must not move the section back up a line (it fit there only without its divider), so a
 * section that sits on one line keeps the divider's room and is shifted left over it
 * (`data-line-start="shift"`: position only, layout unchanged). A section wider than the bar
 * wraps inside itself and cannot move up, so its divider is removed (`"drop"`). Sections are
 * measured in order, each after the decisions before it. Checked after each render and a frame
 * after any resize of the bar or its items (fonts loading, labels changing); re-measured only
 * when the bar's or an item's width changed.
 */
function useLineStartDividers(bar: React.RefObject<HTMLDivElement | null>) {
  // The bar's width and its items' widths when last measured (after the decisions applied).
  // Unchanged means unchanged wrapping, so a re-render of the bar (the graph context changes on
  // every hover) costs one layout read and no writes.
  const lastLayout = useRef('')

  const measure = useCallback(() => {
    const el = bar.current
    if (!el) return
    const layoutKey = () =>
      [el.clientWidth, ...Array.from(el.children, (c) => Math.round(c.getBoundingClientRect().width * 10))].join(',')
    if (layoutKey() === lastLayout.current) return
    const sections = Array.from(el.children).filter((c): c is HTMLElement => c.classList.contains('layered-link-filter__section'))
    for (const s of sections) {
      s.removeAttribute('data-line-start')
      s.style.removeProperty('--layered-divider-shift')
    }
    if (sections.length > 0) {
      const cs = getComputedStyle(el)
      const contentWidth = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      for (const s of sections) {
        const prev = s.previousElementSibling
        const r = s.getBoundingClientRect()
        if (prev && r.left >= prev.getBoundingClientRect().right) continue
        if (r.width >= contentWidth - 0.5) {
          s.setAttribute('data-line-start', 'drop')
          continue
        }
        const content = s.children[1]
        const shift = content ? content.getBoundingClientRect().left - r.left : 0
        s.setAttribute('data-line-start', 'shift')
        s.style.setProperty('--layered-divider-shift', `${-shift}px`)
      }
    }
    lastLayout.current = layoutKey()
  }, [bar])

  // After every render: content (labels, counts, children) can change the items' widths.
  useIsomorphicLayoutEffect(measure)

  // One observer for the bar's lifetime: a resize of the bar or any item re-measures a frame later
  // (inside the callback, measuring would be a ResizeObserver loop). Items added or removed are
  // observed as they come and go.
  useIsomorphicLayoutEffect(() => {
    const el = bar.current
    if (!el || typeof ResizeObserver === 'undefined') return
    let frame = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    })
    const observeAll = () => {
      ro.disconnect()
      ro.observe(el)
      for (const c of Array.from(el.children)) ro.observe(c)
    }
    observeAll()
    const mo = typeof MutationObserver === 'undefined' ? null : new MutationObserver(observeAll)
    mo?.observe(el, { childList: true })
    return () => {
      cancelAnimationFrame(frame)
      mo?.disconnect()
      ro.disconnect()
    }
  }, [bar, measure])
}

/**
 * The link bar: one toggle per link category with its dash sample and count, plus optional
 * intra-layer and node-label toggles. Category and intra toggles write `filters`.
 */
export const LinkCategoryFilter = React.forwardRef<HTMLDivElement, LinkCategoryFilterProps>(
  (
    {
      graph,
      categories,
      categoryLabels,
      showCounts = true,
      label = 'Links',
      showIntraToggle = true,
      intraLabel = 'Intra-layer links',
      showLabelToggle,
      nodeLabels: nodeLabelsProp,
      onNodeLabelsChange,
      labelToggleLabel = 'Labels',
      surface = 'canvas',
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const barRef = useRef<HTMLDivElement | null>(null)
    const setBarRef = useCallback(
      (el: HTMLDivElement | null) => {
        barRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
      },
      [ref],
    )
    useLineStartDividers(barRef)
    const g = useLayeredGraphProp(graph, 'LinkCategoryFilter')
    const { index, filters, emphasisContext } = g
    const cats = categories ?? index.categories
    const labelToggle = showLabelToggle ?? onNodeLabelsChange !== undefined
    const nodeLabels = nodeLabelsProp ?? (g.nodeLabels !== false)
    const toggleNodeLabels = () => {
      if (nodeLabelsProp === undefined) g.setNodeLabels(!nodeLabels)
      onNodeLabelsChange?.(!nodeLabels)
    }
    const id = useId()
    return (
      <div
        ref={setBarRef}
        role="group"
        aria-labelledby={label != null ? id : undefined}
        aria-label={label == null ? 'Links' : undefined}
        className={cx('layered-link-filter', surface === 'shell' && 'layered-link-filter--shell', className)}
        {...props}
      >
        {label != null && (
          <span className="layered-control__eyebrow" id={id}>
            {label}
          </span>
        )}
        {cats.map((c) => {
          const on = filters.categories[c] !== false
          const style = linkCategoryStyle(c, emphasisContext)
          const count = index.categoryCounts[c] ?? 0
          const text = categoryLabels?.[c] ?? categoryDisplayLabel(c)
          return (
            <ChromeToggle key={c} pressed={on} onClick={() => g.toggleCategory(c)} data-category={c}>
              <svg className="layered-toggle__sample" width="22" height="8" aria-hidden="true">
                <line x1="1" y1="4" x2="21" y2="4" stroke={style.color} strokeWidth="2" strokeDasharray={style.dash || undefined} strokeLinecap="round" />
              </svg>
              {text}
              {showCounts && <span className="layered-toggle__count">{count}</span>}
            </ChromeToggle>
          )
        })}
        {(showIntraToggle || labelToggle) && (
          <span className="layered-link-filter__section">
            <span className="layered-link-filter__divider" aria-hidden="true" />
            {showIntraToggle && (
              <ChromeToggle pressed={filters.showIntra} onClick={() => g.setShowIntra(!filters.showIntra)}>
                {intraLabel}
              </ChromeToggle>
            )}
            {labelToggle && (
              <ChromeToggle pressed={nodeLabels} onClick={toggleNodeLabels}>
                {labelToggleLabel}
              </ChromeToggle>
            )}
          </span>
        )}
        {React.Children.toArray(children).length > 0 && (
          <span className="layered-link-filter__section">
            <span className="layered-link-filter__divider" aria-hidden="true" />
            {children}
          </span>
        )}
      </div>
    )
  },
)
LinkCategoryFilter.displayName = 'LinkCategoryFilter'

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

const ListSection = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { label: React.ReactNode }>(
  ({ label, className, children, ...props }, ref) => {
    const id = useId()
    return (
      <div ref={ref} className={cx('layered-list', className)} {...props}>
        {label != null && (
          <span className="layered-control__eyebrow" id={id}>
            {label}
          </span>
        )}
        <ul className="layered-list__items" aria-labelledby={label != null ? id : undefined}>
          {children}
        </ul>
      </div>
    )
  },
)
ListSection.displayName = 'ListSection'

function Dot({ color }: { color: string }) {
  return <span className="layered-dot" style={{ background: color }} aria-hidden="true" />
}

export interface LayerListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`. */
  graph?: LayeredGraphState
  /** Eyebrow; `null` hides it. Default `Layers`. */
  label?: React.ReactNode
  /** Rows are buttons that focus the layer (again to clear). Default true; false renders plain rows. */
  focusable?: boolean
  /** An eye button per row that hides or shows the layer. Default true. */
  hideable?: boolean
  /** Node and intra-layer link counts per row (`nodes · links`). Default true. */
  showCounts?: boolean
}

/** One row per layer: colour swatch, name, node and intra-layer link counts; the row focuses the layer, the eye button hides it. */
export const LayerList = React.forwardRef<HTMLDivElement, LayerListProps>(
  ({ graph, label = 'Layers', focusable = true, hideable = true, showCounts = true, className, ...props }, ref) => {
    const g = useLayeredGraphProp(graph, 'LayerList')
    const { index, filters, focusedLayerId } = g
    return (
      <ListSection ref={ref} label={label} className={cx('layer-list', className)} {...props}>
        {index.layers.map((layer) => {
          const hidden = filters.hiddenLayers.includes(layer.id)
          const focused = focusedLayerId === layer.id
          const counts = `${layer.nodeIds.length} nodes, ${layer.intraLinkCount} links within`
          const content = (
            <>
              <span className="layer-list__swatch" style={{ background: layer.color }} aria-hidden="true" />
              <span className="layer-list__name">{layer.label}</span>
              {showCounts && (
                <span className="layered-row__meta" title={counts} aria-hidden="true">
                  {layer.nodeIds.length} · {layer.intraLinkCount}
                </span>
              )}
            </>
          )
          return (
            <li key={layer.id} className={cx('layer-list__item', hidden && 'layer-list__item--hidden')} data-layer={layer.id}>
              {focusable ? (
                <button
                  type="button"
                  className={cx('layered-row', focused && 'layered-row--on')}
                  aria-pressed={focused}
                  aria-label={`${layer.label} layer, ${counts}${hidden ? ', hidden' : ''}`}
                  disabled={hidden}
                  onClick={() => g.focusLayer(focused ? null : layer.id)}
                >
                  {content}
                </button>
              ) : (
                <div className="layered-row layered-row--static">
                  {content}
                  <span className="heimdall-visually-hidden">{`, ${counts}${hidden ? ', hidden' : ''}`}</span>
                </div>
              )}
              {hideable && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon
                  className="layer-list__eye"
                  aria-label={`${hidden ? 'Show' : 'Hide'} ${layer.label}`}
                  aria-pressed={hidden}
                  onClick={() => g.toggleLayer(layer.id)}
                >
                  <Icon name={hidden ? 'eyeOff' : 'eye'} size={14} aria-hidden="true" />
                </Button>
              )}
            </li>
          )
        })}
      </ListSection>
    )
  },
)
LayerList.displayName = 'LayerList'

export interface LayerPairListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`. */
  graph?: LayeredGraphState
  /** Eyebrow; `null` hides it. Default `Cross-layer links`. */
  label?: React.ReactNode
  /** List pairs with no cross-layer links. Default false. */
  showEmptyPairs?: boolean
  /** Row order: layer rank (default) or link count, most first. */
  sort?: 'rank' | 'count'
  /** At most this many rows. Unset: all. */
  limit?: number
  /** Picking a pair clears the selection, so the pair's links read on their own. Default true. */
  clearSelection?: boolean
  emptyText?: React.ReactNode
}

/** One row per layer pair: both swatches, the names and the cross-layer link count; a row toggles layer-pair focus. */
export const LayerPairList = React.forwardRef<HTMLDivElement, LayerPairListProps>(
  (
    { graph, label = 'Cross-layer links', showEmptyPairs = false, sort = 'rank', limit, clearSelection = true, emptyText = 'No cross-layer links.', className, ...props },
    ref,
  ) => {
    const g = useLayeredGraphProp(graph, 'LayerPairList')
    const { index, filters } = g
    const pairs = useMemo(() => {
      let ps = index.layerPairs.filter(
        (p) => (showEmptyPairs || p.linkCount > 0) && !p.layerIds.some((id) => filters.hiddenLayers.includes(id)),
      )
      if (sort === 'count') ps = [...ps].sort((a, b) => b.linkCount - a.linkCount)
      return limit != null ? ps.slice(0, limit) : ps
    }, [index, filters.hiddenLayers, showEmptyPairs, sort, limit])
    return (
      <ListSection ref={ref} label={label} className={cx('layer-pair-list', className)} {...props}>
        {pairs.length === 0 && <li className="layered-list__empty">{emptyText}</li>}
        {pairs.map((p) => {
          const [a, b] = p.layerIds.map((id) => index.layerById.get(id)!)
          const on = filters.layerPair === p.key
          return (
            <li key={p.key}>
              <button
                type="button"
                className={cx('layered-row', on && 'layered-row--on')}
                aria-pressed={on}
                aria-label={`${a.label} and ${b.label}, ${p.linkCount} cross-layer links`}
                onClick={() => {
                  if (clearSelection && !on) g.select(null)
                  g.setLayerPair(p.key)
                }}
              >
                <span className="layer-pair-list__dots" aria-hidden="true">
                  <Dot color={a.color} />
                  <Dot color={b.color} />
                </span>
                <span className="layered-row__name">
                  {a.label} / {b.label}
                </span>
                <span className="layered-row__count" aria-hidden="true">{p.linkCount}</span>
              </button>
            </li>
          )
        })}
      </ListSection>
    )
  },
)
LayerPairList.displayName = 'LayerPairList'

export interface BridgeNodeListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`. */
  graph?: LayeredGraphState
  /** Eyebrow; `null` hides it. Default `Bridge nodes · most cross-layer links`. */
  label?: React.ReactNode
  /** Number of nodes listed. Default 6. */
  limit?: number
  emptyText?: React.ReactNode
}

/** The nodes with the most cross-layer links (ties by total degree); a row selects the node. Skips hidden layers. */
export const BridgeNodeList = React.forwardRef<HTMLDivElement, BridgeNodeListProps>(
  ({ graph, label = 'Bridge nodes · most cross-layer links', limit = 6, emptyText = 'No cross-layer links.', className, ...props }, ref) => {
    const g = useLayeredGraphProp(graph, 'BridgeNodeList')
    const { index, filters, selectedId } = g
    const bridges = useMemo(
      () =>
        index.nodes
          .filter((n) => n.crossDegree > 0 && !filters.hiddenLayers.includes(n.layerId))
          .sort((a, b) => b.crossDegree - a.crossDegree || b.degree - a.degree)
          .slice(0, Math.max(0, limit)),
      [index, filters.hiddenLayers, limit],
    )
    return (
      <ListSection ref={ref} label={label} className={cx('bridge-node-list', className)} {...props}>
        {bridges.length === 0 && <li className="layered-list__empty">{emptyText}</li>}
        {bridges.map((n) => {
          const layer = index.layerById.get(n.layerId)!
          const on = selectedId === n.id
          return (
            <li key={n.id}>
              <button
                type="button"
                className={cx('layered-row', on && 'layered-row--on')}
                aria-pressed={on}
                aria-label={`${n.label}, ${layer.label} layer, ${n.crossDegree} cross-layer links`}
                onClick={() => g.select(n.id)}
              >
                <Dot color={layer.color} />
                <span className="layered-row__name">{n.displayLabel}</span>
                <span className="layered-row__count" aria-hidden="true">{n.crossDegree}</span>
              </button>
            </li>
          )
        })}
      </ListSection>
    )
  },
)
BridgeNodeList.displayName = 'BridgeNodeList'
