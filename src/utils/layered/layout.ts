import { organicLayout, type OrganicLayoutOptions } from '../organicLayout'
import type { IndexedLink, IndexedNode, LayeredIndex } from './types'

export type Point = { x: number; y: number }

export interface LayerLayoutOptions {
  /**
   * `organic` (default): `organicLayout`, with `LayeredNode.position` as a starting sketch.
   * `manual`: `LayeredNode.position` as given; nodes without one sit at the layer's center.
   */
  engine?: 'organic' | 'manual'
  /**
   * Only links carrying one of these categories drive the in-layer solve (cross-layer links always
   * drive the coupled solve). Unset or `null` = all links. Dense graphs, where layers are close to
   * fully connected, read best laid out on one category alone (e.g. structural relationships).
   */
  layoutCategories?: readonly string[] | null
  /** Box a node occupies, for overlap removal. Default: 6.4px per label character + 22 wide, 24 tall. */
  nodeSize?: (node: IndexedNode) => { width: number; height: number }
  /** Passed through to `organicLayout`. Default preferredEdgeLength 120, minimumNodeDistance 18. */
  organic?: OrganicLayoutOptions
}

export interface LayerLayoutResult {
  /** One solve per layer on its own links; each layer centered and scaled into [-1, 1]. */
  independent: ReadonlyMap<string, Point>
  /** One solve over every layer including cross-layer links, so linked nodes line up; centered and scaled into [-1, 1] as a whole. */
  coupled: ReadonlyMap<string, Point>
  /** The px half-extent each normalization divided by: per layer for `independent`, one for `coupled`. */
  scale: { independent: ReadonlyMap<string, number>; coupled: number }
}

const defaultSize = (n: IndexedNode) => ({ width: Math.round(n.displayLabel.length * 6.4 + 22), height: 24 })

function layoutLinkFilter(cats: readonly string[] | null | undefined): (l: IndexedLink) => boolean {
  if (!cats) return () => true
  return (l) => l.categories.some((c) => cats.includes(c))
}

function solve(
  nodes: readonly IndexedNode[],
  links: readonly IndexedLink[],
  options: LayerLayoutOptions,
  size: (n: IndexedNode) => { width: number; height: number },
): Map<string, Point> {
  if (options.engine === 'manual') {
    return new Map(nodes.map((n) => [n.id, n.position ? { ...n.position } : { x: 0, y: 0 }]))
  }
  const res = organicLayout(
    nodes.map((n) => ({ id: n.id, x: n.position?.x ?? NaN, y: n.position?.y ?? NaN, ...size(n) })),
    links.map((l) => ({ source: l.sourceId, target: l.targetId })),
    { preferredEdgeLength: 120, minimumNodeDistance: 18, ...options.organic },
  )
  return res.positions
}

/** Centers the group on its mean and divides by the largest extent (node half-boxes included). */
function normalize(
  group: readonly IndexedNode[],
  pos: ReadonlyMap<string, Point>,
  size: (n: IndexedNode) => { width: number; height: number },
  out: Map<string, Point>,
): number {
  if (group.length === 0) return 1
  let cx = 0
  let cy = 0
  for (const n of group) {
    cx += pos.get(n.id)!.x
    cy += pos.get(n.id)!.y
  }
  cx /= group.length
  cy /= group.length
  let r = 0
  for (const n of group) {
    const p = pos.get(n.id)!
    const s = size(n)
    r = Math.max(r, Math.abs(p.x - cx) + s.width / 2, Math.abs(p.y - cy) + s.height / 2)
  }
  r = r || 1
  for (const n of group) {
    const p = pos.get(n.id)!
    out.set(n.id, { x: (p.x - cx) / r, y: (p.y - cy) / r })
  }
  return r
}

/**
 * In-plane positions for every node, both ways the layered views use them: `independent` (each
 * layer solved alone, so each reads best on its own) and `coupled` (one solve with cross-layer
 * links, so nodes linked across layers line up). Deterministic. Views tween between the two with
 * `mixLayerPositions`.
 */
export function layoutLayers(index: LayeredIndex, options: LayerLayoutOptions = {}): LayerLayoutResult {
  const size = options.nodeSize ?? defaultSize
  const keep = layoutLinkFilter(options.layoutCategories)

  const independent = new Map<string, Point>()
  const indepScale = new Map<string, number>()
  for (const layer of index.layers) {
    const nodes = layer.nodeIds.map((id) => index.nodeById.get(id)!)
    const links = index.links.filter((l) => !l.cross && keep(l) && index.nodeById.get(l.sourceId)!.layerId === layer.id)
    const pos = solve(nodes, links, options, size)
    indepScale.set(layer.id, normalize(nodes, pos, size, independent))
  }

  const coupledLinks = index.links.filter((l) => l.cross || keep(l))
  const coupledRaw = solve(index.nodes, coupledLinks, options, size)
  const coupled = new Map<string, Point>()
  const coupledScale = normalize(index.nodes, coupledRaw, size, coupled)

  return { independent, coupled, scale: { independent: indepScale, coupled: coupledScale } }
}

/** Positions between `independent` (mix 0) and `coupled` (mix 1). */
export function mixLayerPositions(layout: LayerLayoutResult, mix: number): Map<string, Point> {
  const t = Math.max(0, Math.min(1, mix))
  const out = new Map<string, Point>()
  for (const [id, a] of layout.independent) {
    const b = layout.coupled.get(id) ?? a
    out.set(id, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
  }
  return out
}

export type NodeOrder = 'coupled-x' | 'degree' | 'cross-degree' | 'label' | ((a: IndexedNode, b: IndexedNode) => number)

function comparator(order: NodeOrder, layout: LayerLayoutResult | null): (a: IndexedNode, b: IndexedNode) => number {
  if (typeof order === 'function') return order
  const byLabel = (a: IndexedNode, b: IndexedNode) => a.label.localeCompare(b.label)
  switch (order) {
    case 'coupled-x':
      return (a, b) => (layout?.coupled.get(a.id)?.x ?? 0) - (layout?.coupled.get(b.id)?.x ?? 0) || byLabel(a, b)
    case 'degree':
      return (a, b) => b.degree - a.degree || byLabel(a, b)
    case 'cross-degree':
      return (a, b) => b.crossDegree - a.crossDegree || b.degree - a.degree || byLabel(a, b)
    case 'label':
      return byLabel
  }
}

/** Node ids per layer, in the given order. Lanes default: `coupled-x` (cross-layer links run straight). */
export function orderWithinLayers(index: LayeredIndex, layout: LayerLayoutResult | null, order: NodeOrder = 'coupled-x'): Map<string, string[]> {
  const cmp = comparator(order, layout)
  return new Map(
    index.layers.map((l) => [l.id, l.nodeIds.map((id) => index.nodeById.get(id)!).sort(cmp).map((n) => n.id)]),
  )
}

/** All node ids, layer by layer in rank order, each layer in the given order. The matrix's row and column order. */
export function orderAcrossLayers(index: LayeredIndex, layout: LayerLayoutResult | null, order: NodeOrder = 'coupled-x'): string[] {
  const per = orderWithinLayers(index, layout, order)
  return index.layers.flatMap((l) => per.get(l.id) ?? [])
}

/**
 * Each node's position along its layer's axis, (i + 0.5) / n for the i-th node. `degree` and
 * `cross-degree` put the busiest node last (farthest out on a hive axis); `label` and a custom
 * comparator run in their own ascending order. Hive default: `degree`.
 */
export function rankWithinLayers(index: LayeredIndex, by: NodeOrder = 'degree'): Map<string, number> {
  const cmp = comparator(by, null)
  const busiestLast = by === 'degree' || by === 'cross-degree'
  const out = new Map<string, number>()
  for (const l of index.layers) {
    const ids = l.nodeIds.map((id) => index.nodeById.get(id)!).sort(cmp)
    if (busiestLast) ids.reverse()
    ids.forEach((n, i) => out.set(n.id, (i + 0.5) / ids.length))
  }
  return out
}
