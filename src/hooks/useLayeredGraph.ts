import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useControllable } from './useControllable'
import { buildLayeredIndex } from '../utils/layered/buildLayeredIndex'
import { linkEmphasis as computeLinkEmphasis, nodeEmphasis as computeNodeEmphasis, type EmphasisContext, type LinkCategoryStyle, type LinkEmphasis, type NodeEmphasis } from '../utils/layered/emphasis'
import { DEFAULT_LINK_FILTERS, layerPairNodeIds } from '../utils/layered/filters'
import { layoutLayers, type LayerLayoutOptions, type LayerLayoutResult } from '../utils/layered/layout'
import { computeReach } from '../utils/layered/reach'
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

export interface UseLayeredGraphOptions {
  /** The same node and edge data GraphCanvas takes. */
  nodes: readonly GraphNodeData[]
  edges: readonly GraphEdge[]
  /** Layering attribute (`layerBy`), multi- and missing-value policies, layer display, categories. Memoize it: a new object rebuilds the index. */
  layering: BuildLayeredIndexOptions
  /** In-layer layout options, or `false` to skip layout (views that don't need positions). Memoize it. */
  layout?: LayerLayoutOptions | false

  /**
   * The selected node instance (controlled). The simple, single-select path: controlling only
   * `selectedId` keeps the selection to one node. With several selected, it is the primary (the
   * first of `selectedIds`).
   */
  selectedId?: string | null
  defaultSelectedId?: string | null
  /** Called with the primary selection whenever `select` runs, and when another action changes the primary. */
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
  /** null when `layout: false`. */
  layout: LayerLayoutResult | null
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
  const layout = useMemo(() => (layoutOptions === false ? null : layoutLayers(index, layoutOptions)), [index, layoutOptions])

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
  /** `notifyPrimary`: call `onSelect` even when the primary is unchanged (as `select` always has). */
  const writeSelection = useCallback(
    (ids: string[], notifyPrimary: boolean) => {
      const prevPrimary = rawIdsRef.current[0] ?? null
      rawIdsRef.current = ids
      if (selectionMode === 'inner') setInnerIds(ids)
      onSelectedIdsChangeRef.current?.(ids)
      const primary = ids[0] ?? null
      if (notifyPrimary || primary !== prevPrimary) onSelectRef.current?.(primary)
    },
    [selectionMode],
  )
  const select = useCallback((id: string | null) => writeSelection(id != null ? [id] : [], true), [writeSelection])
  const setSelectedIds = useCallback((ids: readonly string[]) => writeSelection([...new Set(ids)], false), [writeSelection])
  const toggleSelected = useCallback(
    (id: string) => {
      const cur = rawIdsRef.current
      writeSelection(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id], false)
    },
    [writeSelection],
  )

  const [follow, setFollowRaw] = useControllable(options.follow, options.defaultFollow ?? 1, options.onFollowChange)
  const [filters, setFilters] = useControllable(options.filters, options.defaultFilters ?? DEFAULT_LINK_FILTERS, options.onFiltersChange)
  const [predicateLabels, setPredicateLabels] = useControllable(options.predicateLabels, options.defaultPredicateLabels ?? 'highlighted', options.onPredicateLabelsChange)
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

  const reach = useMemo(
    () => computeReach(index, selectedIds.length > 1 ? selectedIds : selectedId, { follow, followCategories, filters }),
    [index, selectedIds, selectedId, follow, followCategories, filters],
  )
  const hoverReach = useMemo(() => computeReach(index, hoveredId, { follow: 0, filters }), [index, hoveredId, filters])
  const pairNodeIds = useMemo(() => layerPairNodeIds(index, filters.layerPair), [index, filters.layerPair])

  const setFollow = useCallback((n: number) => setFollowRaw(Math.max(0, Math.floor(n))), [setFollowRaw])

  // Filter actions build on the latest filters, including ones emitted earlier in the same tick,
  // so several actions in one handler compose instead of overwriting each other.
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const updateFilters = useCallback(
    (fn: (f: LinkFilterState) => LinkFilterState) => {
      const next = fn(filtersRef.current)
      filtersRef.current = next
      setFilters(next)
    },
    [setFilters],
  )
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
        if (kept.length < cur.length) writeSelection(kept, kept.length === 0)
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
      if (s.selectedIds !== undefined) setSelectedIds(s.selectedIds)
      else if (s.selectedId !== undefined) select(s.selectedId)
      if (s.follow !== undefined) setFollow(s.follow)
      if (s.filters !== undefined) setFilters(s.filters)
      if (s.predicateLabels !== undefined) setPredicateLabels(s.predicateLabels)
      if (s.focusedLayerId !== undefined) focusLayer(s.focusedLayerId)
      if (s.planeLayout !== undefined) setPlaneLayout(s.planeLayout)
      if (s.nodeLabels !== undefined) setNodeLabels(s.nodeLabels)
    },
    [select, setSelectedIds, setFollow, setFilters, setPredicateLabels, focusLayer, setPlaneLayout, setNodeLabels],
  )

  return {
    index, layout, reach, hoverReach, pairNodeIds,
    selectedId, selectedIds, hoveredId, follow, filters, predicateLabels, focusedLayerId, planeLayout, nodeLabels,
    select, setSelectedIds, toggleSelected, hover, setFollow, setFilters, toggleCategory, togglePredicate, toggleLayer,
    setShowIntra, setLayerPair, setPredicateLabels, focusLayer, setPlaneLayout, setNodeLabels,
    emphasisContext, linkEmphasis, nodeEmphasis, snapshot, restore,
  }
}

/** Shares one `useLayeredGraph` result with views and chrome below it: `<LayeredGraphContext.Provider value={graph}>`. */
export const LayeredGraphContext = createContext<LayeredGraphState | null>(null)

/** The enclosing `LayeredGraphContext` value. Throws outside a provider. */
export function useLayeredGraphContext(): LayeredGraphState {
  const ctx = useContext(LayeredGraphContext)
  if (!ctx) throw new Error('useLayeredGraphContext must be used inside <LayeredGraphContext.Provider>')
  return ctx
}
