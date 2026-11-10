/**
 * Types for the layered-graph framework. Input is the same node and edge model GraphCanvas uses
 * (`GraphNodeData`, `GraphEdge`); one node attribute, chosen with `layerBy`, assigns each node its
 * layer. The layered views (3D stack, lanes, matrix, hive) draw the result. See
 * design-reference/layered-graph/breakdown.md.
 *
 * Vocabulary: a `GraphEdge` is one relationship; its `label` is its predicate (read source to
 * target). The index bundles every edge between the same two node instances, in that direction,
 * into one `IndexedLink`; the views draw links, not edges.
 */
import type { GraphAttributeValue, GraphEdge, GraphNodeData } from '../../components/GraphCanvas'

/**
 * Display overrides for a layer. `id` is the layering attribute's value, as a string. Layers are
 * the distinct values found; listing one here sets its order, label or color (an unlisted value
 * is still a layer, placed after the listed ones).
 */
export interface LayerDef {
  id: string
  label?: string
  /** Any CSS color. Unset uses the layer palette token `--graph-layer-<n>` by rank. */
  color?: string
}

/**
 * Which node attribute defines the layers:
 * - a key in `GraphNodeData.attributes`, or `kind` / `domainColor` for those fields;
 * - or an accessor returning the value (or values) for a node.
 */
export type LayerAccessor = string | ((node: GraphNodeData) => GraphAttributeValue | readonly GraphAttributeValue[] | undefined)

/**
 * A node whose layering attribute holds several values:
 * - `first` / `last`: use that value (default `first`);
 * - `exclude`: leave the node out (reported in `issues`);
 * - `all`: one node instance per value, each on its own layer. Instances share `IndexedNode.nodeId`
 *   and have the id `<nodeId>@<layerId>`; an edge links every instance of its source to every
 *   instance of its target.
 */
export type MultiValuePolicy = 'first' | 'last' | 'exclude' | 'all'

/** A node with no layering value: `exclude` it (default) or place it on a layer of its own (`layer`). */
export type MissingValuePolicy = 'exclude' | 'layer'

export interface LinkCategoryInfo {
  /** Category for every edge with this predicate (`GraphEdge.label`). */
  category: string
  /** Display text. Unset shows the predicate itself. */
  label?: string
  /** Short code for matrix cells, e.g. `RZ`. Unset derives one from the predicate. */
  code?: string
}

/** Optional per-predicate categories, labels and codes. */
export type PredicateCatalog = Readonly<Record<string, LinkCategoryInfo>>

export interface BuildLayeredIndexOptions {
  layerBy: LayerAccessor
  multiValue?: MultiValuePolicy
  missingValue?: MissingValuePolicy
  /** Label of the layer `missingValue: 'layer'` creates. Default `Unassigned`. Its id is `''`. */
  missingLayerLabel?: string
  /** Order, labels and colors for known layer values. Unlisted values follow, in first-appearance order. */
  layers?: readonly LayerDef[]
  /**
   * An edge's category: an attribute key in `GraphEdge.attributes`, or an accessor. Unset (or no
   * value) falls back to `catalog[edge.label].category`, then `fallbackCategory`.
   */
  linkCategoryBy?: string | ((edge: GraphEdge) => string | undefined)
  catalog?: PredicateCatalog
  /** Category of edges with none. Default `other`. */
  fallbackCategory?: string
  /**
   * Category order: sets the order of `LayeredIndex.categories` (and so the category styles) and
   * picks a bundled link's primary category (the first of these it carries). Categories not listed
   * follow in first-appearance order.
   */
  categoryOrder?: readonly string[]
  /** Labels longer than this get an ellipsis in `displayLabel`. Default 30. */
  maxLabelLength?: number
}

export interface IndexedLayer {
  /** The layering value, as a string (`''` for the missing-value layer). */
  id: string
  label: string
  /** Resolved color: `LayerDef.color` or a palette token reference. */
  color: string
  /** Position in layer order, 0 = top. */
  rank: number
  /** Node instance ids on this layer. */
  nodeIds: string[]
  /** Bundled links with both ends on this layer. */
  intraLinkCount: number
  /** Bundled links with one end on this layer and the other elsewhere. */
  crossLinkCount: number
}

export interface IndexedAdjacency {
  linkId: string
  otherId: string
  /** `out`: this node is the link's source. */
  direction: 'out' | 'in'
}

/** One node instance: a node, or one of its copies under `multiValue: 'all'`. */
export interface IndexedNode {
  /** Instance id: the node's id, or `<nodeId>@<layerId>` for a multi-layer copy (suffixed `#2`, `#3`, … if that collides with another id). */
  id: string
  /** The `GraphNodeData.id` this instance came from. */
  nodeId: string
  layerId: string
  layerRank: number
  label: string
  /** `label`, truncated to `maxLabelLength` with an ellipsis. */
  displayLabel: string
  kind?: string
  /** `attributes.description` when it is a string. */
  description?: string
  weight?: number
  position?: { x: number; y: number }
  source: GraphNodeData
  /** Bundled links touching this instance. */
  degree: number
  /** Bundled cross-layer links touching this instance. */
  crossDegree: number
  adjacency: IndexedAdjacency[]
}

export interface IndexedLink {
  /** The first bundled edge's id, suffixed with `@<source>><target>` instance ids when an edge spans several instances (then `#2`, … on a collision). */
  id: string
  sourceId: string
  targetId: string
  /** Unique predicates (edge labels) across the bundled edges, in input order. Empty when no edge has a label. */
  predicates: string[]
  /** Category of each entry in `predicates`, same order. */
  predicateCategories: string[]
  /** Unique categories, in `categoryOrder`. */
  categories: string[]
  primaryCategory: string
  /** Ends on different layers. */
  cross: boolean
  /** Unordered layer-pair key: the two layer ids in rank order, as a JSON array string. */
  pairKey: string
  /** Ids of the input edges bundled into this link. */
  edgeIds: string[]
}

export interface LayerPairSummary {
  key: string
  /** The two layer ids in rank order. */
  layerIds: [string, string]
  linkCount: number
}

export type LayeredIndexIssueKind = 'missing-layer-value' | 'multi-value-excluded' | 'dangling-edge' | 'self-loop' | 'duplicate-node'

export interface LayeredIndexIssue {
  kind: LayeredIndexIssueKind
  /** Id of the offending node or edge. */
  id: string
  detail: string
}

export interface LayeredIndex {
  /** In rank order. */
  layers: IndexedLayer[]
  /** Node instances, in input order. */
  nodes: IndexedNode[]
  /** Bundled links, in order of first appearance. */
  links: IndexedLink[]
  layerById: ReadonlyMap<string, IndexedLayer>
  nodeById: ReadonlyMap<string, IndexedNode>
  linkById: ReadonlyMap<string, IndexedLink>
  /** Instance ids per input node id (one, or several under `multiValue: 'all'`). */
  instancesOf: ReadonlyMap<string, readonly string[]>
  /** Every unordered pair of distinct layers, in rank order, with its cross-layer link count (zero included). */
  layerPairs: LayerPairSummary[]
  /** Bundled links per primary category. */
  categoryCounts: Readonly<Record<string, number>>
  /** Every category present, in `categoryOrder`. */
  categories: string[]
  catalog: PredicateCatalog
  /** Two-letter code per predicate present, unique (catalog codes first). */
  predicateCodes: ReadonlyMap<string, string>
  /** Input that was left out or adjusted, rather than thrown. */
  issues: LayeredIndexIssue[]
}

/** What is drawn. Reach traversal ignores `showIntra` and `layerPair` (they only hide). */
export interface LinkFilterState {
  hiddenLayers: readonly string[]
  /** `false` hides a category; a category missing from the record is visible. */
  categories: Readonly<Record<string, boolean>>
  /** Individual predicates to hide. A link is hidden when none of its predicates remain. */
  hiddenPredicates: readonly string[]
  /** Draw links whose ends are on the same layer. */
  showIntra: boolean
  /** Show only cross-layer links between this layer pair (`LayerPairSummary.key`). */
  layerPair: string | null
}

export interface ReachOptions {
  /** Followed hops after the direct links. 0 = direct links only. Default 1. */
  follow?: number
  /** Follow only links carrying one of these categories (direct links are unaffected). Unset = any. */
  followCategories?: readonly string[] | null
  /** Hidden layers, categories and predicates are not traversed. Default: nothing hidden. */
  filters?: LinkFilterState | null
}

export interface ReachVia {
  fromId: string
  linkId: string
}

export interface ReachResult {
  /** The origin; with several (a multi-selection), the first one in the graph. */
  originId: string | null
  /** Every origin, `originId` first. Set by `computeReach` (empty with no origin). */
  originIds?: readonly string[]
  /** 0 = origin, 1 = direct neighbour, 2+ = followed hops. */
  hopOf: ReadonlyMap<string, number>
  /** Hop at which each traversed link was first used. */
  linkHop: ReadonlyMap<string, number>
  /** For every reached node but the origin: the node and link it was first reached through. */
  via: ReadonlyMap<string, ReachVia>
  /** Deepest hop reached (0 with no origin or no links). */
  maxHop: number
}

export type PredicateLabelMode = 'off' | 'highlighted' | 'all'
export type PlaneLayoutMode = 'independent' | 'coupled'

/** Serializable view-independent state; views extend it with camera or viewport fields. */
export interface LayeredGraphSnapshot {
  /** The primary selection. */
  selectedId: string | null
  /** Every selected node, primary first. `useLayeredGraph` always sets it; on `restore` it wins over `selectedId`. */
  selectedIds?: string[]
  follow: number
  filters: LinkFilterState
  predicateLabels: PredicateLabelMode
  focusedLayerId: string | null
  planeLayout: PlaneLayoutMode
  /** Node labels on or off. `useLayeredGraph` always sets it. */
  nodeLabels?: boolean
}
