import { isLinkVisible } from './filters'
import type { IndexedLink, IndexedNode, LayeredIndex, LinkFilterState, PredicateLabelMode, ReachResult } from './types'

export interface LinkCategoryStyle {
  /** CSS color. */
  color: string
  /** SVG stroke-dasharray; '' = solid. */
  dash: string
}

/** Number of `--graph-link-<n>` category tokens; categories past it reuse them from the start. */
export const LINK_CATEGORY_PALETTE_SIZE = 6

const CATEGORY_DASHES = ['', '6 4', '2 3', '1 5', '10 3 2 3', '4 2']

/**
 * Style of the category at position `i` in `LayeredIndex.categories`: color token
 * `--graph-link-<i+1>` and a dash pattern (solid, dashed, dotted, sparse, dash-dot, short dash).
 * Set `categoryOrder` when indexing to choose which category gets which.
 */
export function linkCategoryStyleAt(i: number): LinkCategoryStyle {
  const k = ((i % LINK_CATEGORY_PALETTE_SIZE) + LINK_CATEGORY_PALETTE_SIZE) % LINK_CATEGORY_PALETTE_SIZE
  return { color: `rgb(var(--graph-link-${k + 1}))`, dash: CATEGORY_DASHES[k] }
}

/** Reach hop colors: index 1 = direct, 2 and 3 = followed hops (deeper hops reuse 3). */
export const HOP_COLORS: readonly string[] = ['', 'rgb(var(--graph-hop-1))', 'rgb(var(--graph-hop-2))', 'rgb(var(--graph-hop-3))']

const HOP_STYLE = [null, { opacity: 1, width: 1.8 }, { opacity: 0.85, width: 1.4 }, { opacity: 0.7, width: 1.2 }] as const

export interface EmphasisContext {
  index: LayeredIndex
  filters: LinkFilterState
  reach?: ReachResult | null
  focusedLayerId?: string | null
  /** Nodes on the active layer pair's links (`layerPairNodeIds`); dims the others when a pair is set. */
  pairNodeIds?: ReadonlySet<string> | null
  predicateLabels?: PredicateLabelMode
  /** Per-category overrides; other categories use `linkCategoryStyleAt` by their position. */
  styles?: Readonly<Record<string, LinkCategoryStyle>>
}

export interface LinkEmphasis {
  visible: boolean
  /** 0 = not on the selection's reach. */
  hop: number
  highlighted: boolean
  color: string
  dash: string
  /** Stroke width in px at scale 1. */
  width: number
  opacity: number
  /** Draw order: higher on top. */
  z: number
  /** Draw an arrowhead at the target end. */
  arrow: boolean
  /** Show the predicate label. */
  label: boolean
}

/** A category's style: an override from `ctx.styles`, else the token ramp by its position in the index. */
export function linkCategoryStyle(category: string, ctx: Pick<EmphasisContext, 'index' | 'styles'>): LinkCategoryStyle {
  return ctx.styles?.[category] ?? linkCategoryStyleAt(Math.max(0, ctx.index.categories.indexOf(category)))
}

/**
 * How a view draws a link: color and dash by category, the amber hop ramp when the selection
 * reaches it, dimming for unreached links and links outside a focused layer, plus whether it gets
 * an arrowhead and a predicate label. One source of these rules for every layered view.
 */
export function linkEmphasis(link: IndexedLink, ctx: EmphasisContext): LinkEmphasis {
  const visible = isLinkVisible(link, ctx.index, ctx.filters)
  const style = linkCategoryStyle(link.primaryCategory, ctx)
  const hasSelection = !!ctx.reach?.originId
  const hop = ctx.reach?.linkHop.get(link.id) ?? 0
  const highlighted = hop > 0
  let opacity = link.cross ? 0.75 : 0.3
  if (hasSelection && !highlighted) opacity = 0.06
  if (!highlighted && ctx.focusedLayerId) {
    const s = ctx.index.nodeById.get(link.sourceId)
    const t = ctx.index.nodeById.get(link.targetId)
    if (s?.layerId !== ctx.focusedLayerId && t?.layerId !== ctx.focusedLayerId) opacity *= 0.25
  }
  const hs = highlighted ? HOP_STYLE[Math.min(hop, 3)]! : null
  const mode = ctx.predicateLabels ?? 'highlighted'
  const label =
    visible &&
    (mode === 'all' ? !hasSelection || highlighted : mode === 'highlighted' ? highlighted || !!ctx.filters.layerPair : false)
  return {
    visible,
    hop,
    highlighted,
    color: highlighted ? HOP_COLORS[Math.min(hop, 3)] : style.color,
    dash: highlighted ? '' : style.dash,
    width: hs ? hs.width : link.cross ? 1.3 : 1,
    opacity: hs ? hs.opacity : opacity,
    z: highlighted ? 10 - Math.min(hop, 9) : link.cross ? 1 : 0,
    arrow: visible && (highlighted || label),
    label,
  }
}

export interface NodeEmphasis {
  /** null = not on the selection's reach. */
  hop: number | null
  selected: boolean
  /** On the reach at hop 2 or deeper. */
  followed: boolean
  opacity: number
  /** Outline / label tint: the selection, a followed node, or neither. */
  tint: 'selected' | 'followed' | 'none'
}

export function nodeEmphasis(node: IndexedNode, ctx: EmphasisContext): NodeEmphasis {
  const hop = ctx.reach?.hopOf.get(node.id) ?? null
  const hasSelection = !!ctx.reach?.originId
  const selected = hop === 0
  const followed = hop !== null && hop >= 2
  let opacity = 1
  if (hasSelection && hop === null) opacity = 0.2
  if (ctx.filters.layerPair && ctx.pairNodeIds && !ctx.pairNodeIds.has(node.id)) opacity *= 0.25
  if (ctx.focusedLayerId && node.layerId !== ctx.focusedLayerId && hop === null) opacity *= 0.2
  return { hop, selected, followed, opacity, tint: selected ? 'selected' : followed ? 'followed' : 'none' }
}
