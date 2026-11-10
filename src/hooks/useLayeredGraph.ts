import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useControllable } from './useControllable'
import { buildLayeredIndex } from '../utils/layered/buildLayeredIndex'
import { linkEmphasis as computeLinkEmphasis, nodeEmphasis as computeNodeEmphasis, type EmphasisContext, type LinkCategoryStyle, type LinkEmphasis, type NodeEmphasis } from '../utils/layered/emphasis'
import { DEFAULT_LINK_FILTERS, layerPairNodeIds } from '../utils/layered/filters'
import { layoutLayers, layoutLayersAsync, type LayerLayoutOptions, type LayerLayoutResult } from '../utils/layered/layout'
import { computeReach } from '../utils/layered/reach'
import { sanitizeLayeredGraphSnapshot } from '../utils/layered/snapshot'
import type { GraphEdge, GraphNodeData } from '../components/GraphCanvas'
import type {
  BuildLayeredIndexOptions,
  IndexedLink,
  IndexedNode,
  LayeredGraphSnapshot,
  LayeredIndex,
  LinkFilterState,
  PlaneLayoutMode,
  PredicateLabelMode,
  ReachResult,
} from '../utils/layered/types'

// A stable default: a fresh `{}` per render would re-run the layout every render.
const DEFAULT_LAYOUT_OPTIONS: LayerLayoutOptions = {}
/** Node count from which the layout runs asynchronously by default (about 100 ms of solves). */
export const ASYNC_LAYOUT_MIN_NODES = 200

type AsyncLayoutRun = { index: LayeredIndex; options: LayerLayoutOptions } & ({ result: LayerLayoutResult } | { error: unknown })

export interface UseLayeredGraphOptions {
  /** The same node and edge data GraphCanvas takes. */
  nodes: readonly GraphNodeData[]
  edges: readonly GraphEdge[]
  /** Layering attribute (`layerBy`), multi- and missing-value policies, layer display, categories. Memoize it: a new object rebuilds the index. */
  layering: BuildLayeredIndexOptions
  /** In-layer layout options, or `false` to skip layout (views that don't need positions). Memoize it. */
  layout?: LayerLayoutOptions | false
  /**
   * Node count from which the layout runs asynchronously (`layoutLayersAsync`): `layout` is null
   * and `layoutPending` true until it lands, and the views draw without positions meanwhile.
   * Default `ASYNC_LAYOUT_MIN_NODES` (200); `0` always, `false` never.
   */
  asyncLayoutMinNodes?: number | false

  /**
   * The selected node instance (controlled). The simple, single-select path: controlling only
   * `selectedId` keeps the selection to one node. With several selected, it is the primary (the
   * first of `selectedIds`).
   */
  selectedId?: string | null
  defaultSelectedId?: string | null
  /**
   * Called with the primary selection on every `select` and `restore`. The other selection and
   * filter actions (`setSelectedIds`, `toggleSelected`, `toggleLayer`, `setFilters`, …) call it
   * when they change the visible primary. A parent changing a controlled `filters` or
   * `selectedIds` prop is not reported back.
   */
  onSelect?: (id: string | null) => void
  /**
   * Multi-select (controlled): every selected node instance, primary first. Takes precedence over
   * `selectedId`. Reach is the union of each node's reach. The views select one node on click; a
   * multi-selection comes from `setSelectedIds` / `toggleSelected` (or this prop) for now.
   */
  selectedIds?: readonly string[]
  defaultSelectedIds?: readonly string[]
  onSelectedIdsChange?: (ids: string[]) => void

  /** Followed hops past the direct links (see `computeReach`). Default 1. */
  follow?: number
  defaultFollow?: number
  onFollowChange?: (follow: number) => void
  followCategories?: readonly string[] | null

  filters?: LinkFilterState
  defaultFilters?: LinkFilterState
  onFiltersChange?: (filters: LinkFilterState) => void

  predicateLabels?: PredicateLabelMode
  defaultPredicateLabels?: PredicateLabelMode
  onPredicateLabelsChange?: (mode: PredicateLabelMode) => void

  focusedLayerId?: string | null
  defaultFocusedLayerId?: string | null
  onFocusLayer?: (layerId: string | null) => void

  planeLayout?: PlaneLayoutMode
  defaultPlaneLayout?: PlaneLayoutMode
  onPlaneLayoutChange?: (mode: PlaneLayoutMode) => void

  /** Node labels on (default) or off, for the views that can hide them (the 3D stack and hive) and the label toggle in `LinkCategoryFilter`. */
  nodeLabels?: boolean
  defaultNodeLabels?: boolean
  onNodeLabelsChange?: (on: boolean) => void

  /** Per-category color and dash overrides for `linkEmphasis`; others use the `--graph-link-*` ramp. Memoize it: a new object recomputes every link's emphasis. */
  linkStyles?: Readonly<Record<string, LinkCategoryStyle>>
}

export interface LayeredGraphState {
  index: LayeredIndex
  /** null when `layout: false`, and while an asynchronous layout runs. */
  layout: LayerLayoutResult | null
  /** True while an asynchronous layout runs (see `asyncLayoutMinNodes`). */
  layoutPending: boolean
  /** The selection's reach at the current `follow`. */
  reach: ReachResult
  /** The hovered node's direct links only (follow 0), for cheap hover previews. */
  hoverReach: ReachResult
  pairNodeIds: ReadonlySet<string>

  /** The primary selection: the first of `selectedIds`, or null. */
  selectedId: string | null
  /** Every selected node instance, primary first; nodes missing from the graph or on a hidden layer are left out. */
  selectedIds: readonly string[]
  hoveredId: string | null
  follow: number
  filters: LinkFilterState
  predicateLabels: PredicateLabelMode
  focusedLayerId: string | null
  planeLayout: PlaneLayoutMode
  nodeLabels: boolean

  /** Selects one node (null clears), replacing any multi-selection. */
  select: (id: string | null) => void
  /** Replaces the selection with these nodes, primary first (duplicates dropped). */
  setSelectedIds: (ids: readonly string[]) => void
  /** Adds a node to the selection (at the end), or removes it if it is selected. */
  toggleSelected: (id: string) => void
  hover: (id: string | null) => void
  setFollow: (follow: number) => void
  setFilters: (filters: LinkFilterState) => void
  toggleCategory: (category: string) => void
  togglePredicate: (predicate: string) => void
  toggleLayer: (layerId: string) => void
  setShowIntra: (show: boolean) => void
  /** Pass the current pair to clear it (toggle), or null. */
  setLayerPair: (pairKey: string | null) => void
  setPredicateLabels: (mode: PredicateLabelMode) => void
  focusLayer: (layerId: string | null) => void
  setPlaneLayout: (mode: PlaneLayoutMode) => void
  setNodeLabels: (on: boolean) => void

  emphasisContext: EmphasisContext
  linkEmphasis: (link: IndexedLink) => LinkEmphasis
  nodeEmphasis: (node: IndexedNode) => NodeEmphasis

  snapshot: LayeredGraphSnapshot
  /**
   * Applies the snapshot fields given; the rest stay. Fields are not checked: pass untrusted input
   * (a URL, storage, a message) through `sanitizeLayeredGraphSnapshot` first.
   */
  restore: (snapshot: Partial<LayeredGraphSnapshot>) => void
}

/**
 * State and derived data for the layered views, shared by every view and chrome control that
 * reads it: the index, in-layer layouts, the selection's reach, filters, predicate-label mode,
 * layer focus, plane layout and node labels. Each piece of state is controlled when its prop is
 * set and otherwise kept here. Share one instance between views (or chrome) with
 * `LayeredGraphContext`.
 */
export function useLayeredGraph(options: UseLayeredGraphOptions): LayeredGraphState {
  const { nodes, edges, layering, layout: layoutOptions = DEFAULT_LAYOUT_OPTIONS, followCategories, linkStyles } = options

  const index = useMemo(() => buildLayeredIndex(nodes, edges, layering), [nodes, edges, layering])
  const asyncMin = options.asyncLayoutMinNodes ?? ASYNC_LAYOUT_MIN_NODES
  const runAsync = layoutOptions !== false && asyncMin !== false && index.nodes.length >= asyncMin
  const syncLayout = useMemo(
    () => (layoutOptions === false || runAsync ? null : layoutLayers(index, layoutOptions)),
    [index, layoutOptions, runAsync],
  )
  const [asyncRun, setAsyncRun] = useState<AsyncLayoutRun | null>(null)
  useEffect(() => {
    if (!runAsync) return
    const ctrl = new AbortController()
    layoutLayersAsync(index, layoutOptions, { signal: ctrl.signal }).then(
      (result) => setAsyncRun({ index, options: layoutOptions, result }),
      (error: unknown) => {
        if (!ctrl.signal.aborted) setAsyncRun({ index, options: layoutOptions, error })
      },
    )
    return () => ctrl.abort()
  }, [index, layoutOptions, runAsync])
  const run = runAsync && asyncRun?.index === index && asyncRun.options === layoutOptions ? asyncRun : null
  // A failed asynchronous layout throws here, as a synchronous one would, for an error boundary.
  if (run && 'error' in run) throw run.error
  const layout = runAsync ? (run?.result ?? null) : syncLayout
  const layoutPending = runAsync && !run

  // ── selection: one ordered list of ids, the primary first ───────────────
  // Controlled by `selectedIds`, else by `selectedId` (a list of at most one), else held here.
  const [innerIds, setInnerIds] = useState<readonly string[]>(
    () => options.defaultSelectedIds ?? (options.defaultSelectedId != null ? [options.defaultSelectedId] : []),
  )
  const selectionMode = options.selectedIds !== undefined ? 'ids' : options.selectedId !== undefined ? 'id' : 'inner'
  const rawIds: readonly string[] =
    selectionMode === 'ids'
      ? options.selectedIds!
      : selectionMode === 'id'
        ? options.selectedId != null ? [options.selectedId] : []
        : innerIds
  // Actions build on the latest ids, including ones written earlier in the same tick.
  const rawIdsRef = useRef(rawIds)
  rawIdsRef.current = rawIds
  const onSelectRef = useRef(options.onSelect)
  onSelectRef.current = options.onSelect
  const onSelectedIdsChangeRef = useRef(options.onSelectedIdsChange)
  onSelectedIdsChangeRef.current = options.onSelectedIdsChange
  // The visible primary: the first id in the graph and not on a hidden layer (what `selectedId` reads).
  const indexRef = useRef(index)
  indexRef.current = index
  const primaryOf = useCallback((ids: readonly string[], hiddenLayers: readonly string[]): string | null => {
    for (const id of ids) {
      const n = indexRef.current.nodeById.get(id)
      if (n && !hiddenLayers.includes(n.layerId)) return id
    }
    return null
  }, [])
  /**
   * Writes the ids and reports to `onSelect`:
   * - `raw`: always, with `ids[0]` as given (what `select` has always done);
   * - `visible`: always, with the visible primary (`restore`);
   * - `changed`: the visible primary, only when it changes.
   */
  const writeSelection = useCallback(
    (ids: string[], report: 'raw' | 'visible' | 'changed') => {
      const hidden = filtersRef.current.hiddenLayers
      const prev = primaryOf(rawIdsRef.current, hidden)
      rawIdsRef.current = ids
      if (selectionMode === 'inner') setInnerIds(ids)
      onSelectedIdsChangeRef.current?.(ids)
      if (report === 'raw') onSelectRef.current?.(ids[0] ?? null)
      else {
        const next = primaryOf(ids, hidden)
        if (report === 'visible' || next !== prev) onSelectRef.current?.(next)
      }
    },
    [selectionMode, primaryOf],
  )
  const select = useCallback((id: string | null) => writeSelection(id != null ? [id] : [], 'raw'), [writeSelection])
  const setSelectedIds = useCallback((ids: readonly string[]) => writeSelection([...new Set(ids)], 'changed'), [writeSelection])
  const toggleSelected = useCallback(
    (id: string) => {
      const cur = rawIdsRef.current
      writeSelection(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id], 'changed')
    },
    [writeSelection],
  )

  const [follow, setFollowRaw] = useControllable(options.follow, options.defaultFollow ?? 1, options.onFollowChange)
  const [filters, setFilters] = useControllable(options.filters, options.defaultFilters ?? DEFAULT_LINK_FILTERS, options.onFiltersChange)
  const [predicateLabels, setPredicateLabels] = useControllable(options.predicateLabels, options.defaultPredicateLabels ?? 'highlighted', options.onPredicateLabelsChange)
  // Filter and selection actions build on the latest filters, including ones emitted earlier in
  // the same tick, so several actions in one handler compose instead of overwriting each other.
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const [focusedLayerId, focusLayer] = useControllable(options.focusedLayerId, options.defaultFocusedLayerId ?? null, options.onFocusLayer)
  const [planeLayout, setPlaneLayout] = useControllable(options.planeLayout, options.defaultPlaneLayout ?? 'independent', options.onPlaneLayoutChange)
  const [nodeLabels, setNodeLabels] = useControllable(options.nodeLabels, options.defaultNodeLabels ?? true, options.onNodeLabelsChange)
  const [hoveredId, hover] = useState<string | null>(null)

  // A selected node that isn't in the graph, or sits on a hidden layer, reads as not selected.
  // Keyed on the ids rather than the array, which a controlled `selectedId` rebuilds every render.
  const idsKey = rawIds.join('\n')
  const selectedIds = useMemo(
    () =>
      [...new Set(rawIds)].filter((id) => {
        const n = index.nodeById.get(id)
        return n !== undefined && !filters.hiddenLayers.includes(n.layerId)
      }),
    [idsKey, index, filters.hiddenLayers],
  )
  const selectedId = selectedIds[0] ?? null
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const selectedIdsRef = useRef<readonly string[]>(selectedIds)
  selectedIdsRef.current = selectedIds

  const reach = useMemo(
    () => computeReach(index, selectedIds.length > 1 ? selectedIds : selectedId, { follow, followCategories, filters }),
    [index, selectedIds, selectedId, follow, followCategories, filters],
  )
  const hoverReach = useMemo(() => computeReach(index, hoveredId, { follow: 0, filters }), [index, hoveredId, filters])
  const pairNodeIds = useMemo(() => layerPairNodeIds(index, filters.layerPair), [index, filters.layerPair])

  const setFollow = useCallback((n: number) => setFollowRaw(Math.max(0, Math.floor(n))), [setFollowRaw])

  // Every filter change goes through here (the public `setFilters` too), so actions in one handler
  // compose, and a change of hidden layers that changes the visible primary reports it to `onSelect`.
  const updateFilters = useCallback(
    (fn: (f: LinkFilterState) => LinkFilterState) => {
      const prev = filtersRef.current
      const next = fn(prev)
      filtersRef.current = next
      setFilters(next)
      if (next.hiddenLayers !== prev.hiddenLayers) {
        const before = primaryOf(rawIdsRef.current, prev.hiddenLayers)
        const after = primaryOf(rawIdsRef.current, next.hiddenLayers)
        if (after !== before) onSelectRef.current?.(after)
      }
    },
    [setFilters, primaryOf],
  )
  const setFiltersAction = useCallback((f: LinkFilterState) => updateFilters(() => f), [updateFilters])
  const toggleCategory = useCallback(
    (c: string) => updateFilters((f) => ({ ...f, categories: { ...f.categories, [c]: f.categories[c] === false } })),
    [updateFilters],
  )
  const togglePredicate = useCallback(
    (p: string) =>
      updateFilters((f) => ({
        ...f,
        hiddenPredicates: f.hiddenPredicates.includes(p) ? f.hiddenPredicates.filter((x) => x !== p) : [...f.hiddenPredicates, p],
      })),
    [updateFilters],
  )
  const toggleLayer = useCallback(
    (id: string) => {
      const hiding = !filtersRef.current.hiddenLayers.includes(id)
      updateFilters((f) => ({ ...f, hiddenLayers: hiding ? [...f.hiddenLayers, id] : f.hiddenLayers.filter((x) => x !== id) }))
      if (hiding && focusedLayerId === id) focusLayer(null)
      if (hiding) {
        const cur = rawIdsRef.current
        const kept = cur.filter((x) => index.nodeById.get(x)?.layerId !== id)
        // updateFilters has reported the primary change; this only drops the hidden ids.
        if (kept.length < cur.length) writeSelection(kept, 'changed')
      }
    },
    [updateFilters, focusedLayerId, focusLayer, index, writeSelection],
  )
  const setShowIntra = useCallback((show: boolean) => updateFilters((f) => ({ ...f, showIntra: show })), [updateFilters])
  const setLayerPair = useCallback(
    (key: string | null) => updateFilters((f) => ({ ...f, layerPair: key === f.layerPair ? null : key })),
    [updateFilters],
  )

  const emphasisContext = useMemo<EmphasisContext>(
    () => ({ index, filters, reach, focusedLayerId, pairNodeIds, predicateLabels, styles: linkStyles }),
    [index, filters, reach, focusedLayerId, pairNodeIds, predicateLabels, linkStyles],
  )
  const linkEmphasis = useCallback((l: IndexedLink) => computeLinkEmphasis(l, emphasisContext), [emphasisContext])
  const nodeEmphasis = useCallback((n: IndexedNode) => computeNodeEmphasis(n, emphasisContext), [emphasisContext])

  const snapshot = useMemo<LayeredGraphSnapshot>(
    () => ({ selectedId, selectedIds: [...selectedIds], follow, filters, predicateLabels, focusedLayerId, planeLayout, nodeLabels }),
    [selectedId, selectedIds, follow, filters, predicateLabels, focusedLayerId, planeLayout, nodeLabels],
  )
  const restore = useCallback(
    (s: Partial<LayeredGraphSnapshot>) => {
      // Filters first, so the selection is reported against the restored layers.
      if (s.filters !== undefined) {
        const f = s.filters
        updateFilters(() => f)
      }
      // Whichever of `selectedId` / `selectedIds` the caller changed (against the current state)
      // applies, so `{ ...snapshot, selectedId }` and `{ ...snapshot, selectedIds }` both work.
      // Both changed and disagreeing: `selectedId` wins (0.10.0). Either way `onSelect` is called,
      // as `restore` always has: with the given id, or the visible primary of the given ids.
      const ids = s.selectedIds
      const idChanged = s.selectedId !== undefined && s.selectedId !== selectedIdRef.current
      const idsChanged = ids !== undefined && !sameIds(ids, selectedIdsRef.current)
      const useIds =
        ids !== undefined &&
        (s.selectedId === undefined || (ids[0] ?? null) === s.selectedId || (idsChanged && !idChanged))
      if (useIds) writeSelection([...new Set(ids)], 'visible')
      else if (s.selectedId !== undefined) select(s.selectedId)
      if (s.follow !== undefined) setFollow(s.follow)
      if (s.predicateLabels !== undefined) setPredicateLabels(s.predicateLabels)
      if (s.focusedLayerId !== undefined) focusLayer(s.focusedLayerId)
      if (s.planeLayout !== undefined) setPlaneLayout(s.planeLayout)
      if (s.nodeLabels !== undefined) setNodeLabels(s.nodeLabels)
    },
    [select, writeSelection, updateFilters, setFollow, setPredicateLabels, focusLayer, setPlaneLayout, setNodeLabels],
  )

  return {
    index, layout, layoutPending, reach, hoverReach, pairNodeIds,
    selectedId, selectedIds, hoveredId, follow, filters, predicateLabels, focusedLayerId, planeLayout, nodeLabels,
    select, setSelectedIds, toggleSelected, hover, setFollow, setFilters: setFiltersAction, toggleCategory, togglePredicate, toggleLayer,
    setShowIntra, setLayerPair, setPredicateLabels, focusLayer, setPlaneLayout, setNodeLabels,
    emphasisContext, linkEmphasis, nodeEmphasis, snapshot, restore,
  }
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

/**
 * The `default…` options that seed `useLayeredGraph` from a (partial) snapshot, e.g. one parsed
 * from a URL: `useLayeredGraph({ nodes, edges, layering, ...layeredGraphSnapshotDefaults(saved) })`.
 * The snapshot goes through `sanitizeLayeredGraphSnapshot`: fields it leaves out, or that are
 * malformed, are left out.
 */
export function layeredGraphSnapshotDefaults(snapshot: Partial<LayeredGraphSnapshot> | null | undefined): Partial<UseLayeredGraphOptions> {
  // Untrusted input (a URL): malformed fields are dropped and filters completed.
  const fields = sanitizeLayeredGraphSnapshot(snapshot) as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) out[`default${key[0].toUpperCase()}${key.slice(1)}`] = value
  return out as Partial<UseLayeredGraphOptions>
}

/** Shares one `useLayeredGraph` result with views and chrome below it: `<LayeredGraphContext.Provider value={graph}>`. */
export const LayeredGraphContext = createContext<LayeredGraphState | null>(null)

/** The enclosing `LayeredGraphContext` value. Throws outside a provider. */
export function useLayeredGraphContext(): LayeredGraphState {
  const ctx = useContext(LayeredGraphContext)
  if (!ctx) throw new Error('useLayeredGraphContext must be used inside <LayeredGraphContext.Provider>')
  return ctx
}
