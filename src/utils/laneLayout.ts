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
}

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
      y += height + LANE_GAP
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
      x += width + V_LANE_GAP
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

/** Room a name tag takes beside its chip: pass as `sideRoomOf` for vertical lanes of chips. */
export const laneTagRoom = (text: string) => TAG_GAP + laneTagSize(text).width

/**
 * Name tags beside node chips, clear of each other and of `obstacles` (node chips, pills,
 * titles) and inside the candidate's lane band. Horizontal lanes try above, below, right, then
 * left of the chip; vertical lanes try right, left, above, then below. A tag with no clear spot
 * is dropped unless forced, which takes its first spot regardless.
 */
export function placeLaneTags(candidates: readonly LaneTagCandidate[], obstacles: readonly LabelBox[], orientation: LaneOrientation = 'horizontal'): PlacedEdgeLabel[] {
  const spots = (c: LaneTagCandidate) => {
    const { width, height } = laneTagSize(c.text)
    const b = c.box
    const above = { x: b.x, y: b.y - b.height / 2 - TAG_GAP - height / 2 }
    const below = { x: b.x, y: b.y + b.height / 2 + TAG_GAP + height / 2 }
    const right = { x: b.x + b.width / 2 + TAG_GAP + width / 2, y: b.y }
    const left = { x: b.x - b.width / 2 - TAG_GAP - width / 2, y: b.y }
    return orientation === 'horizontal' ? [above, below, right, left] : [right, left, above, below]
  }
  const inside = (c: LaneTagCandidate, p: Point) => {
    const w = c.within
    if (!w) return true
    const { width, height } = laneTagSize(c.text)
    return p.x - width / 2 >= w.x && p.x + width / 2 <= w.x + w.width && p.y - height / 2 >= w.y && p.y + height / 2 <= w.y + w.height
  }
  const ts = [0, 1, 2, 3]
  const byId = new Map(candidates.map((c) => [c.id, spots(c)]))
  const NOWHERE = { x: NaN, y: NaN } // placeEdgeLabels skips non-finite spots
  const placed = placeEdgeLabels(
    candidates.map((c) => ({
      id: c.id,
      text: c.text,
      priority: c.priority,
      pointAt: (t: number) => (inside(c, byId.get(c.id)![t]) ? byId.get(c.id)![t] : NOWHERE),
    })),
    { obstacles, ts, size: laneTagSize },
  )
  const done = new Set(placed.map((p) => p.id))
  for (const c of candidates) {
    if (!c.forced || done.has(c.id)) continue
    const at = byId.get(c.id)![0]
    placed.push({ id: c.id, text: c.text, t: 0, ...laneTagSize(c.text), ...at })
  }
  return placed
}
