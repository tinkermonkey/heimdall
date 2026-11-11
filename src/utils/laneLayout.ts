/**
 * Swimlane layout for a layered graph: GraphCanvas `layout="layer-lanes"`. One lane per layer,
 * nodes packed into rows (or columns) in a framework order, so links between layers mostly run
 * straight across the gap between lanes. Pure and deterministic: positions and lane bands come
 * from the index, the in-layer layout (for the `coupled-x` order) and each node's box size.
 * Link geometry is a separate function over two node boxes, so a view can redraw links from
 * live positions (a dragged node) without re-running the layout.
 * See design-reference/layered-graph/breakdown.md, 2.2.
 */
import type { Point } from './graph'
import { cubicCurve, placeEdgeLabels, quadCurve, type EdgeCurve, type LabelBox, type PlacedEdgeLabel } from './layered/edgeLabels'
import { orderWithinLayers, type LayerLayoutResult, type NodeOrder } from './layered/layout'
import type { LayeredIndex } from './layered/types'

export type LaneOrientation = 'horizontal' | 'vertical'

/**
 * Which nodes show their label. `all`: every node is a labeled box. `reached`: nodes are compact
 * chips, and only the selection, its reach, the hovered node and the focused node get a name tag.
 */
export type LaneNodeLabels = 'all' | 'reached'

export interface LaneLayoutOptions {
  /**
   * `horizontal` (default): one lane per layer, stacked top to bottom, nodes packed into rows.
   * `vertical`: one lane per layer, side by side, nodes stacked into columns; suits narrow,
   * tall containers.
   */
  orientation?: LaneOrientation
  /**
   * Node order within each lane. Default: by position along the lane in the coupled in-layer
   * solve (`coupled-x` for horizontal lanes, coupled y for vertical), so cross-layer links run
   * mostly straight; `degree` when there is no in-layer layout.
   */
  order?: NodeOrder
  /** Row length in px before a lane wraps to another row (a column's height, vertical). Default 1120 horizontal, 640 vertical. */
  maxRowWidth?: number
  /** Links within a layer: `arc` (default) draws them as arcs beside their row; `none` leaves them out. */
  intraLinks?: 'arc' | 'none'
  /**
   * Cross-layer links that skip one or more lanes: `direct` (default) draws them straight across
   * the lanes between; `gutter` routes them down a side gutter outside the lanes (left or right
   * of horizontal lanes, above or below vertical ones), in parallel tracks. See `routeLaneGutters`.
   */
  skipLayerRouting?: 'direct' | 'gutter'
  /**
   * `all` or `reached` (see `LaneNodeLabels`). Default: the layered state's `nodeLabels`, `all`
   * when on and `reached` when off, so the explorer's label toggle applies to lanes.
   */
  nodeLabels?: LaneNodeLabels
}

/** A lane's band, top-left anchored. */
export interface LaneBand {
  layerId: string
  label: string
  /** The layer's resolved color (a CSS color, usually a `--graph-layer-*` token reference). */
  color: string
  /** Nodes drawn in the lane. */
  count: number
  x: number
  y: number
  width: number
  height: number
  /** Where the lane title's baseline starts. */
  titleX: number
  titleY: number
}

/** A node's box, centered on (x, y). */
export interface LaneNodeBox {
  x: number
  y: number
  width: number
  height: number
}

export interface LaneLayout {
  orientation: LaneOrientation
  /** Node centers, keyed by node instance id. Nodes on hidden layers are absent. */
  positions: Map<string, Point>
  /** One band per drawn layer, in rank order. */
  bands: LaneBand[]
  /** Bounding box of every band. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

export interface LayoutLanesInput extends LaneLayoutOptions {
  /** Box size per node instance id (GraphCanvas passes its measured node sizes). */
  sizeOf: (id: string) => { width: number; height: number }
  /** Layers to leave out (`LinkFilterState.hiddenLayers`). */
  hiddenLayers?: readonly string[]
  /** Vertical lanes: room kept right of a node, px (a name tag beside a compact chip, see `laneTagRoom`). */
  sideRoomOf?: (id: string) => number
  /**
   * With `skipLayerRouting: 'gutter'`: the drawn cross-layer links, so each gap between lanes
   * is wide enough for its gutter routes' tracks (see `laneGutterGapTracks`).
   */
  gutterLinks?: readonly LaneGutterLink[]
}

// Gutter routing gaps (see routeLaneGutters), px.
const GAP_EDGE = 10 // lane edge to the nearest gap track
const GAP_TRACK = 6 // widest spacing between gap tracks
const MIN_GAP_STEP = 3 // narrowest; layoutLanes widens a gap rather than go under it

// Horizontal geometry (from the concept prototype, in px).
const LANE_X = 20 // band left edge
const ROW_INSET = 32 // band edge to the first row's edge (20 band inset + 12)
const TITLE_SPACE = 34 // band top to the first row
const ROW_GAP = 12 // between rows
const LANE_BOTTOM = 10 // last row to band bottom, past ROW_GAP
const LANE_GAP = 70 // between bands
const PACK_GAP = 14 // minimum node spacing when packing a row
const MAX_NODE_GAP = 40 // widest node spacing in a short row
const TOP = 16
// Vertical geometry.
const COL_GAP = 28 // between sub-columns of one lane
const V_LANE_GAP = 120 // between bands
const V_INSET = 20 // band side to the first column

/**
 * Positions and lane bands for every node on a visible layer. Horizontal: each lane's rows are
 * centered in a common width, so lanes line up; a row wraps once its nodes pass `maxRowWidth`.
 * Vertical: each lane stacks its nodes in columns of at most `maxRowWidth` px, and every band
 * shares the tallest band's height.
 */
export function layoutLanes(index: LayeredIndex, layout: LayerLayoutResult | null, input: LayoutLanesInput): LaneLayout {
  const orientation = input.orientation ?? 'horizontal'
  // Default order: along the lane's own axis of the coupled solve (x for rows, y for columns),
  // so nodes linked across layers sit at similar positions; `degree` without a layout.
  const coupledY: NodeOrder = (a, b) => (layout?.coupled.get(a.id)?.y ?? 0) - (layout?.coupled.get(b.id)?.y ?? 0) || a.label.localeCompare(b.label)
  const order = input.order ?? (layout ? (orientation === 'vertical' ? coupledY : 'coupled-x') : 'degree')
  const hidden = new Set(input.hiddenLayers ?? [])
  const perLayer = orderWithinLayers(index, layout, order)
  const layers = index.layers.filter((l) => !hidden.has(l.id))
  const positions = new Map<string, Point>()
  const bands: LaneBand[] = []
  // Gutter routing: widen a gap that couldn't fit its tracks MIN_GAP_STEP apart.
  const gapTracks =
    input.skipLayerRouting === 'gutter' && input.gutterLinks
      ? laneGutterGapTracks(input.gutterLinks, (id) => index.nodeById.get(id)?.layerId, layers.map((l) => l.id))
      : null
  const gapAfter = (i: number, base: number) => (gapTracks ? Math.max(base, laneGapFor(gapTracks[i])) : base)

  if (orientation === 'horizontal') {
    const W = Math.max(80, input.maxRowWidth ?? 1120)
    let y = TOP
    for (const layer of layers) {
      const ids = perLayer.get(layer.id) ?? []
      const rows: string[][] = [[]]
      let used = 0
      for (const id of ids) {
        const w = input.sizeOf(id).width + PACK_GAP
        if (used + w > W && rows[rows.length - 1].length) {
          rows.push([])
          used = 0
        }
        rows[rows.length - 1].push(id)
        used += w
      }
      let ry = y + TITLE_SPACE
      for (const row of rows) {
        const rowH = row.reduce((m, id) => Math.max(m, input.sizeOf(id).height), 0)
        const total = row.reduce((a, id) => a + input.sizeOf(id).width, 0)
        const gap = row.length > 1 ? Math.min(MAX_NODE_GAP, Math.max(0, (W - total) / (row.length - 1))) : 0
        let x = ROW_INSET + (W - total - gap * (row.length - 1)) / 2
        for (const id of row) {
          const s = input.sizeOf(id)
          positions.set(id, { x: x + s.width / 2, y: ry + rowH / 2 })
          x += s.width + gap
        }
        ry += rowH + ROW_GAP
      }
      if (ids.length === 0) ry += 24 + ROW_GAP
      const height = ry - y + LANE_BOTTOM
      bands.push({
        layerId: layer.id, label: layer.label, color: layer.color, count: ids.length,
        x: LANE_X, y, width: W + 2 * (ROW_INSET - LANE_X), height, titleX: LANE_X + 14, titleY: y + 19,
      })
      y += height + gapAfter(bands.length - 1, LANE_GAP)
    }
  } else {
    const H = Math.max(80, input.maxRowWidth ?? 640)
    let x = LANE_X
    const colTop = TOP + TITLE_SPACE
    let tallest = 0
    for (const layer of layers) {
      const ids = perLayer.get(layer.id) ?? []
      const cols: string[][] = [[]]
      let used = 0
      for (const id of ids) {
        const h = input.sizeOf(id).height + ROW_GAP
        if (used + h > H && cols[cols.length - 1].length) {
          cols.push([])
          used = 0
        }
        cols[cols.length - 1].push(id)
        used += h
      }
      let cx = x + V_INSET
      let laneBottom = colTop
      for (const col of cols) {
        const colW = col.reduce((m, id) => Math.max(m, input.sizeOf(id).width), 0)
        const room = input.sideRoomOf ? col.reduce((m, id) => Math.max(m, input.sideRoomOf!(id)), 0) : 0
        let cy = colTop
        for (const id of col) {
          const s = input.sizeOf(id)
          positions.set(id, { x: cx + colW / 2, y: cy + s.height / 2 })
          cy += s.height + ROW_GAP
        }
        laneBottom = Math.max(laneBottom, cy)
        cx += colW + room + COL_GAP
      }
      const width = Math.max(140, cx - COL_GAP - x + V_INSET)
      const height = laneBottom - TOP + LANE_BOTTOM
      tallest = Math.max(tallest, height)
      bands.push({
        layerId: layer.id, label: layer.label, color: layer.color, count: ids.length,
        x, y: TOP, width, height, titleX: x + 14, titleY: TOP + 19,
      })
      x += width + gapAfter(bands.length - 1, V_LANE_GAP)
    }
    for (const b of bands) b.height = tallest
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of bands) {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  if (!bands.length) minX = minY = maxX = maxY = 0
  return { orientation, positions, bands, bounds: { minX, minY, maxX, maxY } }
}

/** A lane link's curve, plus its arrowhead tip and unit direction there. */
export interface LaneLinkCurve extends EdgeCurve {
  tip: Point
  dir: Point
}

function unit(x: number, y: number): Point {
  const len = Math.hypot(x, y)
  return len > 1e-9 ? { x: x / len, y: y / len } : { x: 0, y: 1 }
}

/**
 * A link's curve between two node boxes. Cross-layer: a cubic leaving the source's facing edge
 * and entering the target's, its control points straight out from each (vertical between
 * horizontal lanes, horizontal between vertical ones). Within a layer: a quadratic arc from the
 * top edges (left edges, vertical) bulging away from the row, higher the farther apart the ends.
 */
export function laneLinkCurve(a: LaneNodeBox, b: LaneNodeBox, cross: boolean, orientation: LaneOrientation = 'horizontal'): LaneLinkCurve {
  if (orientation === 'horizontal') {
    if (cross) {
      const down = a.y < b.y
      const y1 = down ? a.y + a.height / 2 : a.y - a.height / 2
      const y2 = down ? b.y - b.height / 2 : b.y + b.height / 2
      const k = (y2 - y1) * 0.5
      const c = cubicCurve({ x: a.x, y: y1 }, { x: a.x, y: y1 + k }, { x: b.x, y: y2 - k }, { x: b.x, y: y2 })
      return { ...c, tip: { x: b.x, y: y2 }, dir: { x: 0, y: down ? 1 : -1 } }
    }
    const at = a.y - a.height / 2
    const bt = b.y - b.height / 2
    const lift = 10 + Math.abs(b.x - a.x) * 0.12 + Math.abs(b.y - a.y) * 0.3
    const ctrl = { x: (a.x + b.x) / 2, y: Math.min(at, bt) - lift }
    const q = quadCurve({ x: a.x, y: at }, ctrl, { x: b.x, y: bt })
    return { ...q, tip: { x: b.x, y: bt }, dir: unit(b.x - ctrl.x, bt - ctrl.y) }
  }
  if (cross) {
    const right = a.x < b.x
    const x1 = right ? a.x + a.width / 2 : a.x - a.width / 2
    const x2 = right ? b.x - b.width / 2 : b.x + b.width / 2
    const k = (x2 - x1) * 0.5
    const c = cubicCurve({ x: x1, y: a.y }, { x: x1 + k, y: a.y }, { x: x2 - k, y: b.y }, { x: x2, y: b.y })
    return { ...c, tip: { x: x2, y: b.y }, dir: { x: right ? 1 : -1, y: 0 } }
  }
  const al = a.x - a.width / 2
  const bl = b.x - b.width / 2
  const lift = 10 + Math.abs(b.y - a.y) * 0.12 + Math.abs(b.x - a.x) * 0.3
  const ctrl = { x: Math.min(al, bl) - lift, y: (a.y + b.y) / 2 }
  const q = quadCurve({ x: al, y: a.y }, ctrl, { x: bl, y: b.y })
  return { ...q, tip: { x: bl, y: b.y }, dir: unit(bl - ctrl.x, b.y - ctrl.y) }
}

/**
 * A polyline with rounded corners (`radius`, shrunk on short segments) as a lane link curve:
 * `pointAt` / `tangentAt` walk the straight segments by length, the arrow sits on the last point.
 */
export function polylineCurve(points: readonly Point[], radius = 8): LaneLinkCurve {
  const p = points.reduce<Point[]>((acc, q) => {
    const last = acc[acc.length - 1]
    if (!last || Math.hypot(q.x - last.x, q.y - last.y) > 1e-6) acc.push(q)
    return acc
  }, [])
  const lens = p.slice(1).map((q, i) => Math.hypot(q.x - p[i].x, q.y - p[i].y))
  const dirs = p.slice(1).map((q, i) => unit(q.x - p[i].x, q.y - p[i].y))
  const total = lens.reduce((a, b) => a + b, 0)
  const r1 = (v: number) => Math.round(v * 10) / 10
  let d = p.length ? `M${r1(p[0].x)},${r1(p[0].y)}` : ''
  for (let i = 1; i < p.length - 1; i++) {
    const r = Math.min(radius, lens[i - 1] / 2, lens[i] / 2)
    const a = { x: p[i].x - dirs[i - 1].x * r, y: p[i].y - dirs[i - 1].y * r }
    const b = { x: p[i].x + dirs[i].x * r, y: p[i].y + dirs[i].y * r }
    d += ` L${r1(a.x)},${r1(a.y)} Q${r1(p[i].x)},${r1(p[i].y)} ${r1(b.x)},${r1(b.y)}`
  }
  if (p.length > 1) d += ` L${r1(p[p.length - 1].x)},${r1(p[p.length - 1].y)}`
  const at = (t: number): { i: number; f: number } => {
    let s = Math.max(0, Math.min(1, t)) * total
    for (let i = 0; i < lens.length; i++) {
      if (s <= lens[i] || i === lens.length - 1) return { i, f: lens[i] > 0 ? Math.min(1, s / lens[i]) : 0 }
      s -= lens[i]
    }
    return { i: 0, f: 0 }
  }
  const tip = p[p.length - 1] ?? { x: 0, y: 0 }
  return {
    d,
    pointAt: (t) => {
      if (p.length < 2) return tip
      const { i, f } = at(t)
      return { x: p[i].x + (p[i + 1].x - p[i].x) * f, y: p[i].y + (p[i + 1].y - p[i].y) * f }
    },
    tangentAt: (t) => (p.length < 2 ? { x: 0, y: 1 } : dirs[at(t).i]),
    tip,
    dir: dirs[dirs.length - 1] ?? { x: 0, y: 1 },
  }
}

/** A cross-layer link for `routeLaneGutters`. */
export interface LaneGutterLink {
  id: string
  sourceId: string
  targetId: string
}

/** A gutter route's held tracks, in the horizontal frame (vertical lanes are transposed). */
export interface LaneGutterTrack {
  sourceId: string
  targetId: string
  /** The source is on the lower lane. */
  reversed: boolean
  /** Gap track next to the upper lane, gutter track, gap track next to the lower lane. */
  top: number
  gx: number
  bot: number
}

export interface LaneGutterRoutes {
  /** Curves for the links that skip a lane, by link id. The rest are absent: draw them with `laneLinkCurve`. */
  curves: Map<string, LaneLinkCurve>
  /** Bounding box of every gutter route, or null when there are none. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null
  /** Each route's tracks, for `retraceLaneGutters` (a drag keeps them). */
  tracks: Map<string, LaneGutterTrack>
}

const GUTTER_INSET = 16 // band edge to the first gutter track
const GUTTER_TRACK = 8 // between gutter tracks
const GUTTER_SPAN = 200 // gutter width past which its tracks tighten

interface GutterRoute extends LaneGutterTrack {
  id: string
  /** Ends in the horizontal frame: `up` on the lane nearer the top. */
  up: LaneNodeBox
  low: LaneNodeBox
  iu: number
  il: number
  /** On the right (bottom, vertical) gutter. */
  end: boolean
}

/** Lane ranks of a skip link's ends (upper, lower), or null when they are under two lanes apart. */
function skipSpan(l: LaneGutterLink, rank: ReadonlyMap<string, number>, layerOf: (id: string) => string | undefined): [number, number] | null {
  const ia = rank.get(layerOf(l.sourceId) ?? '')
  const ib = rank.get(layerOf(l.targetId) ?? '')
  if (ia === undefined || ib === undefined || Math.abs(ia - ib) < 2) return null
  return ia < ib ? [ia, ib] : [ib, ia]
}

/**
 * Gap tracks each gap between drawn lanes can need under gutter routing (index g: the gap after
 * lane g). Routes share a stub per node and gutter side, so a node with routes through a gap
 * needs one track, or two when its routes could go to both gutters. Positions aren't known
 * yet (they pick the side), so this is an upper bound.
 */
export function laneGutterGapTracks(links: readonly LaneGutterLink[], layerOf: (id: string) => string | undefined, layerIds: readonly string[]): number[] {
  const rank = new Map(layerIds.map((id, i) => [id, i]))
  const perGap = layerIds.map(() => new Map<string, number>())
  const add = (g: number, id: string) => perGap[g].set(id, (perGap[g].get(id) ?? 0) + 1)
  for (const l of links) {
    const span = skipSpan(l, rank, layerOf)
    if (!span) continue
    const upper = rank.get(layerOf(l.sourceId)!) === span[0] ? l.sourceId : l.targetId
    add(span[0], upper)
    add(span[1] - 1, upper === l.sourceId ? l.targetId : l.sourceId)
  }
  return perGap.map((m) => [...m.values()].reduce((sum, n) => sum + Math.min(n, 2), 0))
}

/** The px a gap needs for `tracks` gap tracks at least `MIN_GAP_STEP` apart. */
export const laneGapFor = (tracks: number) => 2 * GAP_EDGE + Math.max(0, tracks - 1) * MIN_GAP_STEP

function gutterPoints(r: LaneGutterTrack, up: LaneNodeBox, low: LaneNodeBox): Point[] {
  const pts = [
    { x: up.x, y: up.y + up.height / 2 },
    { x: up.x, y: r.top },
    { x: r.gx, y: r.top },
    { x: r.gx, y: r.bot },
    { x: low.x, y: r.bot },
    { x: low.x, y: low.y - low.height / 2 },
  ]
  return r.reversed ? pts.reverse() : pts
}

function frame(vertical: boolean) {
  return {
    T: (p: Point): Point => (vertical ? { x: p.y, y: p.x } : p),
    TB: (b: LaneNodeBox): LaneNodeBox => (vertical ? { x: b.y, y: b.x, width: b.height, height: b.width } : b),
  }
}

function curvesOf(entries: Iterable<[string, Point[]]>): Pick<LaneGutterRoutes, 'curves' | 'bounds'> {
  const curves = new Map<string, LaneLinkCurve>()
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [id, pts] of entries) {
    for (const q of pts) {
      minX = Math.min(minX, q.x)
      minY = Math.min(minY, q.y)
      maxX = Math.max(maxX, q.x)
      maxY = Math.max(maxY, q.y)
    }
    curves.set(id, polylineCurve(pts))
  }
  return { curves, bounds: curves.size ? { minX, minY, maxX, maxY } : null }
}

/**
 * Routes for `skipLayerRouting: 'gutter'`: every link whose ends are two or more drawn lanes
 * apart leaves its node toward the next lane, runs along the gap below (beside, vertical) its
 * lane to a gutter outside the lanes, along the gutter, and back in through the gap next to the
 * target lane. Each link takes the nearer gutter (left or right of horizontal lanes, top or
 * bottom of vertical ones).
 *
 * Tracks, so routes share a line only in their own node's stub:
 * - Gaps: a node's routes to one gutter share a stub, one track that fans out into their gutter
 *   tracks. Stubs are spread over the whole gap (exits from the lane above, entries to the lane
 *   below), at most `GAP_TRACK` apart. `layoutLanes` widens a gap that would put them under
 *   `MIN_GAP_STEP` apart (see `laneGutterGapTracks`). Per gutter side, the stub nearest the
 *   gutter takes the track nearest its lane, so no stub crosses a run of its own side.
 * - Gutters: interval colouring that respects containment. Shortest spans first, each route
 *   takes the lowest track above every route it spans and free of every route it overlaps, so
 *   an outer route wraps the inner ones and routes whose spans don't overlap share a track.
 *   Tracks are `GUTTER_TRACK` apart until a gutter passes `GUTTER_SPAN`, then tighten down to
 *   `MIN_GAP_STEP`.
 *
 * A dedicated router rather than `routeNavigationEdges`: that one searches a lattice around
 * obstacles per route, while lane gutters are a fixed corridor where only track order matters.
 * Pure. To re-route a drag without moving other routes' tracks, use `retraceLaneGutters`.
 */
export function routeLaneGutters(
  links: readonly LaneGutterLink[],
  boxOf: (id: string) => LaneNodeBox | null | undefined,
  layerOf: (id: string) => string | undefined,
  layout: LaneLayout,
): LaneGutterRoutes {
  const vertical = layout.orientation === 'vertical'
  const { T, TB } = frame(vertical)
  const bands = layout.bands.map((b) =>
    vertical ? { top: b.x, bottom: b.x + b.width, left: b.y, right: b.y + b.height } : { top: b.y, bottom: b.y + b.height, left: b.x, right: b.x + b.width },
  )
  const empty: LaneGutterRoutes = { curves: new Map(), bounds: null, tracks: new Map() }
  if (bands.length < 3) return empty
  const rank = new Map(layout.bands.map((b, i) => [b.layerId, i]))
  const L = Math.min(...bands.map((b) => b.left))
  const R = Math.max(...bands.map((b) => b.right))
  const routes: GutterRoute[] = []
  for (const l of links) {
    const span = skipSpan(l, rank, layerOf)
    const a = span && boxOf(l.sourceId)
    const b = span && boxOf(l.targetId)
    if (!span || !a || !b) continue
    const reversed = rank.get(layerOf(l.sourceId)!)! > rank.get(layerOf(l.targetId)!)!
    const [up, low] = reversed ? [TB(b), TB(a)] : [TB(a), TB(b)]
    routes.push({
      id: l.id, sourceId: l.sourceId, targetId: l.targetId, reversed, up, low, iu: span[0], il: span[1],
      end: (up.x + low.x) / 2 >= (L + R) / 2, top: 0, bot: 0, gx: 0,
    })
  }
  if (!routes.length) return empty
  const byId = (p: GutterRoute, q: GutterRoute) => (p.id < q.id ? -1 : p.id > q.id ? 1 : 0)

  // Gap tracks, exits and entries together across the whole gap. A node's routes to one gutter
  // share a stub: one track, which fans out into their own gutter tracks.
  interface Stub { key: string; x: number; end: boolean; routes: GutterRoute[] }
  const gaps = new Map<number, { exits: Map<string, Stub>; entries: Map<string, Stub> }>()
  const stubOf = (g: number, exit: boolean, r: GutterRoute) => {
    let v = gaps.get(g)
    if (!v) gaps.set(g, (v = { exits: new Map(), entries: new Map() }))
    const nodeId = exit === r.reversed ? r.targetId : r.sourceId
    const key = `${nodeId}|${r.end}`
    const m = exit ? v.exits : v.entries
    let st = m.get(key)
    if (!st) m.set(key, (st = { key, x: exit ? r.up.x : r.low.x, end: r.end, routes: [] }))
    st.routes.push(r)
  }
  for (const r of routes) {
    stubOf(r.iu, true, r)
    stubOf(r.il - 1, false, r)
  }
  // Each gutter side ordered on its own (nearest the gutter first), then interleaved.
  const toGutterX = (end: boolean, x: number) => (end ? R - x : x - L)
  const order = (stubs: Iterable<Stub>) => {
    const all = [...stubs]
    const sides = [false, true].map((end) =>
      all.filter((st) => st.end === end).sort((p, q) => toGutterX(end, p.x) - toGutterX(end, q.x) || (p.key < q.key ? -1 : p.key > q.key ? 1 : 0)),
    )
    const out: Stub[] = []
    for (let i = 0; i < Math.max(sides[0].length, sides[1].length); i++) for (const sd of sides) if (sd[i]) out.push(sd[i])
    return out
  }
  for (const [g, { exits, entries }] of gaps) {
    const top = bands[g].bottom
    const bottom = bands[g + 1].top
    const n = exits.size + entries.size
    const step = n > 1 ? Math.max(0, Math.min(GAP_TRACK, (bottom - top - 2 * GAP_EDGE) / (n - 1))) : 0
    order(exits.values()).forEach((st, k) => st.routes.forEach((r) => (r.top = top + GAP_EDGE + k * step)))
    order(entries.values()).forEach((st, k) => st.routes.forEach((r) => (r.bot = bottom - GAP_EDGE - k * step)))
  }

  // Gutter tracks: containment-respecting interval colouring, shortest spans first.
  for (const end of [false, true]) {
    const side = routes.filter((r) => r.end === end).sort((p, q) => p.bot - p.top - (q.bot - q.top) || p.top - q.top || byId(p, q))
    const track = new Map<GutterRoute, number>()
    for (let i = 0; i < side.length; i++) {
      const r = side[i]
      let min = 0
      const used = new Set<number>()
      for (let j = 0; j < i; j++) {
        const o = side[j]
        if (o.top >= r.top && o.bot <= r.bot) min = Math.max(min, track.get(o)! + 1)
        else if (o.top < r.bot && r.top < o.bot) used.add(track.get(o)!)
      }
      let t = min
      while (used.has(t)) t++
      track.set(r, t)
    }
    // Spacing tightens past GUTTER_SPAN of tracks, down to MIN_GAP_STEP, so a dense graph's
    // gutter stays a bundle rather than growing 8px per track.
    const count = Math.max(0, ...track.values()) + 1
    const step = Math.max(MIN_GAP_STEP, Math.min(GUTTER_TRACK, GUTTER_SPAN / count))
    for (const [r, t] of track) r.gx = end ? R + GUTTER_INSET + t * step : L - GUTTER_INSET - t * step
  }

  const tracks = new Map<string, LaneGutterTrack>()
  for (const r of routes) tracks.set(r.id, { sourceId: r.sourceId, targetId: r.targetId, reversed: r.reversed, top: r.top, gx: r.gx, bot: r.bot })
  return { ...curvesOf(routes.map((r): [string, Point[]] => [r.id, gutterPoints(r, r.up, r.low).map(T)])), tracks }
}

/**
 * Gutter routes rebuilt from held tracks and live node boxes: only the stubs of a moved node
 * change, so a drag doesn't reshuffle other routes. Routes whose ends are gone are dropped.
 */
export function retraceLaneGutters(
  tracks: ReadonlyMap<string, LaneGutterTrack>,
  boxOf: (id: string) => LaneNodeBox | null | undefined,
  orientation: LaneOrientation,
): LaneGutterRoutes {
  const { T, TB } = frame(orientation === 'vertical')
  const out: [string, Point[]][] = []
  for (const [id, r] of tracks) {
    const a = boxOf(r.sourceId)
    const b = boxOf(r.targetId)
    if (!a || !b) continue
    const [up, low] = r.reversed ? [TB(b), TB(a)] : [TB(a), TB(b)]
    out.push([id, gutterPoints(r, up, low).map(T)])
  }
  return { ...curvesOf(out), tracks: new Map(tracks) }
}

/**
 * Pills from an earlier placement, moved onto the live curves at the same t. Used while a node is
 * dragged, so pills follow their links without re-running the placement every frame. Pills whose
 * link is gone are dropped.
 */
export function retraceLabels(placed: readonly PlacedEdgeLabel[], curveOf: (id: string) => EdgeCurve | undefined): PlacedEdgeLabel[] {
  const out: PlacedEdgeLabel[] = []
  for (const p of placed) {
    const curve = curveOf(p.id)
    if (!curve) continue
    const at = curve.pointAt(p.t)
    out.push({ ...p, x: at.x, y: at.y })
  }
  return out
}

/** A node that wants a name tag under `nodeLabels: 'reached'`. */
export interface LaneTagCandidate {
  id: string
  text: string
  /** The node's chip, centered. */
  box: LabelBox
  /** Lower places first. */
  priority: number
  /** Placed even when no position is clear (the selection, hover and focus). */
  forced?: boolean
  /** The node's lane band: a tag must fit inside it unless forced. */
  within?: { x: number; y: number; width: number; height: number }
}

/** A lane title's box (11px mono, 0.1em tracking), centered, for tags and pills to keep clear of. */
export function laneTitleBox(band: LaneBand): LabelBox {
  const width = (band.label.length + String(band.count).length) * 7.7 + 9
  return { x: band.titleX + width / 2, y: band.titleY - 4, width, height: 14 }
}

/** Name tag size: 10px mono at about 6px per character, plus padding. */
export const laneTagSize = (text: string) => ({ width: Math.round(text.length * 6 + 12), height: 16 })

const TAG_GAP = 3
/** How far from a chip `curveEndBoxes` marks its links' ends, px. */
const LINK_END_LENGTH = 18
/** Vertical lanes: a tag's offset past that zone (end boxes are 4px, plus placement clearance). */
const PAST_LINK_ENDS = LINK_END_LENGTH + 6

/**
 * Small boxes along the first `length` px of a curve from one end (`t` 0 or 1): a link's end
 * near a node, for name tags to keep clear of.
 */
export function curveEndBoxes(curve: EdgeCurve, end: 0 | 1, length = LINK_END_LENGTH, size = 4): LabelBox[] {
  const a = curve.pointAt(end)
  const at = (s: number) => curve.pointAt(end === 0 ? s : 1 - s)
  const away = (s: number) => {
    const p = at(s)
    return Math.hypot(p.x - a.x, p.y - a.y)
  }
  // The parameter where the curve is `length` from its end, by bisection (a long route's first
  // px are a tiny slice of t), at most halfway along.
  let lo = 0
  let hi = 0.5
  if (away(hi) <= length) lo = hi
  else {
    for (let i = 0; i < 30; i++) {
      const m = (lo + hi) / 2
      if (away(m) < length) lo = m
      else hi = m
    }
  }
  const out: LabelBox[] = []
  for (let k = 0; k <= 8; k++) {
    const p = at((lo * k) / 8)
    out.push({ x: p.x, y: p.y, width: size, height: size })
  }
  return out
}

/**
 * Room a name tag takes right of its chip in vertical lanes, past the zone where the chip's
 * links leave (so the tag fits even when its links leave on that side): pass as `sideRoomOf`.
 */
export const laneTagRoom = (text: string) => PAST_LINK_ENDS + TAG_GAP + laneTagSize(text).width

/**
 * Name tags beside node chips, clear of each other and of `obstacles` (node chips, pills,
 * titles) and inside the candidate's lane band. Horizontal lanes try above, below, right, then
 * left of the chip; vertical lanes try right, right past the link ends, left, above, then below.
 * Forced tags go first, so other tags avoid them; a forced tag with no clear spot takes its
 * first spot regardless. Any other tag with no clear spot is dropped. Pass link ends
 * (`curveEndBoxes`) as obstacles so a tag takes the side its links don't use.
 */
export function placeLaneTags(candidates: readonly LaneTagCandidate[], obstacles: readonly LabelBox[], orientation: LaneOrientation = 'horizontal'): PlacedEdgeLabel[] {
  const spots = (c: LaneTagCandidate) => {
    const { width, height } = laneTagSize(c.text)
    const b = c.box
    const above = { x: b.x, y: b.y - b.height / 2 - TAG_GAP - height / 2 }
    const below = { x: b.x, y: b.y + b.height / 2 + TAG_GAP + height / 2 }
    const right = { x: b.x + b.width / 2 + TAG_GAP + width / 2, y: b.y }
    const left = { x: b.x - b.width / 2 - TAG_GAP - width / 2, y: b.y }
    // Vertical: past the link ends on the right, when links leave there (see laneTagRoom).
    const rightPast = { x: right.x + PAST_LINK_ENDS, y: b.y }
    return orientation === 'horizontal' ? [above, below, right, left] : [right, rightPast, left, above, below]
  }
  const inside = (c: LaneTagCandidate, p: Point) => {
    const w = c.within
    if (!w) return true
    const { width, height } = laneTagSize(c.text)
    return p.x - width / 2 >= w.x && p.x + width / 2 <= w.x + w.width && p.y - height / 2 >= w.y && p.y + height / 2 <= w.y + w.height
  }
  const ts = [0, 1, 2, 3, 4]
  const byId = new Map(candidates.map((c) => [c.id, spots(c)]))
  const NOWHERE = { x: NaN, y: NaN } // placeEdgeLabels skips non-finite spots
  const place = (cs: readonly LaneTagCandidate[], obs: readonly LabelBox[]) =>
    placeEdgeLabels(
      cs.map((c) => ({
        id: c.id,
        text: c.text,
        priority: c.priority,
        pointAt: (t: number) => {
          const p = byId.get(c.id)![t]
          return p && inside(c, p) ? p : NOWHERE
        },
      })),
      { obstacles: obs, ts, size: laneTagSize },
    )
  // Forced tags first, one at a time (a fallback takes its first spot), so nothing lands on them.
  const placed: PlacedEdgeLabel[] = []
  const forced = candidates.filter((c) => c.forced).sort((a, b) => a.priority - b.priority)
  for (const c of forced) {
    const [tag] = place([c], [...obstacles, ...placed])
    placed.push(tag ?? { id: c.id, text: c.text, t: 0, ...laneTagSize(c.text), ...byId.get(c.id)![0] })
  }
  placed.push(...place(candidates.filter((c) => !c.forced), [...obstacles, ...placed]))
  return placed
}
