import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
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

/** Controlled when `value` is defined; otherwise holds its own state seeded from `defaultValue`. */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = useState(defaultValue)
  const controlled = value !== undefined
  const current = controlled ? value : inner
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const set = useCallback(
    (v: T) => {
      if (!controlled) setInner(v)
      onChangeRef.current?.(v)
    },
    [controlled],
  )
  return [current, set]
}

export interface UseLayeredGraphOptions {
  /** The same node and edge data GraphCanvas takes. */
  nodes: readonly GraphNodeData[]
  edges: readonly GraphEdge[]
  /** Layering attribute (`layerBy`), multi- and missing-value policies, layer display, categories. Memoize it: a new object rebuilds the index. */
  layering: BuildLayeredIndexOptions
  /** In-layer layout options, or `false` to skip layout (views that don't need positions). Memoize it. */
  layout?: LayerLayoutOptions | false

  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelect?: (id: string | null) => void

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

  /** Category colors and dashes for `linkEmphasis`. Default `DEFAULT_LINK_CATEGORY_STYLES`. */
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

  selectedId: string | null
  hoveredId: string | null
  follow: number
  filters: LinkFilterState
  predicateLabels: PredicateLabelMode
  focusedLayerId: string | null
  planeLayout: PlaneLayoutMode

  select: (id: string | null) => void
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

  emphasisContext: EmphasisContext
  linkEmphasis: (link: IndexedLink) => LinkEmphasis
  nodeEmphasis: (node: IndexedNode) => NodeEmphasis

  snapshot: LayeredGraphSnapshot
  restore: (snapshot: Partial<LayeredGraphSnapshot>) => void
}

/**
 * State and derived data for the layered views, shared by every view and chrome control that
 * reads it: the index, in-layer layouts, the selection's reach, filters, predicate-label mode,
 * layer focus and plane layout. Each piece of state is controlled when its prop is set and
 * otherwise kept here. Share one instance between views (or chrome) with `LayeredGraphContext`.
 */
export function useLayeredGraph(options: UseLayeredGraphOptions): LayeredGraphState {
  const { nodes, edges, layering, layout: layoutOptions = DEFAULT_LAYOUT_OPTIONS, followCategories, linkStyles } = options

  const index = useMemo(() => buildLayeredIndex(nodes, edges, layering), [nodes, edges, layering])
  const layout = useMemo(() => (layoutOptions === false ? null : layoutLayers(index, layoutOptions)), [index, layoutOptions])

  const [rawSelected, select] = useControllable(options.selectedId, options.defaultSelectedId ?? null, options.onSelect)
  const [follow, setFollowRaw] = useControllable(options.follow, options.defaultFollow ?? 1, options.onFollowChange)
  const [filters, setFilters] = useControllable(options.filters, options.defaultFilters ?? DEFAULT_LINK_FILTERS, options.onFiltersChange)
  const [predicateLabels, setPredicateLabels] = useControllable(options.predicateLabels, options.defaultPredicateLabels ?? 'highlighted', options.onPredicateLabelsChange)
  const [focusedLayerId, focusLayer] = useControllable(options.focusedLayerId, options.defaultFocusedLayerId ?? null, options.onFocusLayer)
  const [planeLayout, setPlaneLayout] = useControllable(options.planeLayout, options.defaultPlaneLayout ?? 'independent', options.onPlaneLayoutChange)
  const [hoveredId, hover] = useState<string | null>(null)

  const selectedId = rawSelected != null && index.nodeById.has(rawSelected) ? rawSelected : null

  const reach = useMemo(
    () => computeReach(index, selectedId, { follow, followCategories, filters }),
    [index, selectedId, follow, followCategories, filters],
  )
  const hoverReach = useMemo(() => computeReach(index, hoveredId, { follow: 0, filters }), [index, hoveredId, filters])
  const pairNodeIds = useMemo(() => layerPairNodeIds(index, filters.layerPair), [index, filters.layerPair])

  const setFollow = useCallback((n: number) => setFollowRaw(Math.max(0, Math.floor(n))), [setFollowRaw])
  const toggleCategory = useCallback(
    (c: string) => setFilters({ ...filters, categories: { ...filters.categories, [c]: filters.categories[c] === false } }),
    [filters, setFilters],
  )
  const togglePredicate = useCallback(
    (p: string) =>
      setFilters({
        ...filters,
        hiddenPredicates: filters.hiddenPredicates.includes(p) ? filters.hiddenPredicates.filter((x) => x !== p) : [...filters.hiddenPredicates, p],
      }),
    [filters, setFilters],
  )
  const toggleLayer = useCallback(
    (id: string) => {
      const hidden = filters.hiddenLayers.includes(id)
      setFilters({ ...filters, hiddenLayers: hidden ? filters.hiddenLayers.filter((x) => x !== id) : [...filters.hiddenLayers, id] })
      if (!hidden && focusedLayerId === id) focusLayer(null)
    },
    [filters, setFilters, focusedLayerId, focusLayer],
  )
  const setShowIntra = useCallback((show: boolean) => setFilters({ ...filters, showIntra: show }), [filters, setFilters])
  const setLayerPair = useCallback(
    (key: string | null) => setFilters({ ...filters, layerPair: key === filters.layerPair ? null : key }),
    [filters, setFilters],
  )

  const emphasisContext = useMemo<EmphasisContext>(
    () => ({ index, filters, reach, focusedLayerId, pairNodeIds, predicateLabels, styles: linkStyles }),
    [index, filters, reach, focusedLayerId, pairNodeIds, predicateLabels, linkStyles],
  )
  const linkEmphasis = useCallback((l: IndexedLink) => computeLinkEmphasis(l, emphasisContext), [emphasisContext])
  const nodeEmphasis = useCallback((n: IndexedNode) => computeNodeEmphasis(n, emphasisContext), [emphasisContext])

  const snapshot = useMemo<LayeredGraphSnapshot>(
    () => ({ selectedId, follow, filters, predicateLabels, focusedLayerId, planeLayout }),
    [selectedId, follow, filters, predicateLabels, focusedLayerId, planeLayout],
  )
  const restore = useCallback(
    (s: Partial<LayeredGraphSnapshot>) => {
      if (s.selectedId !== undefined) select(s.selectedId)
      if (s.follow !== undefined) setFollow(s.follow)
      if (s.filters !== undefined) setFilters(s.filters)
      if (s.predicateLabels !== undefined) setPredicateLabels(s.predicateLabels)
      if (s.focusedLayerId !== undefined) focusLayer(s.focusedLayerId)
      if (s.planeLayout !== undefined) setPlaneLayout(s.planeLayout)
    },
    [select, setFollow, setFilters, setPredicateLabels, focusLayer, setPlaneLayout],
  )

  return {
    index, layout, reach, hoverReach, pairNodeIds,
    selectedId, hoveredId, follow, filters, predicateLabels, focusedLayerId, planeLayout,
    select, hover, setFollow, setFilters, toggleCategory, togglePredicate, toggleLayer, setShowIntra, setLayerPair,
    setPredicateLabels, focusLayer, setPlaneLayout,
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
