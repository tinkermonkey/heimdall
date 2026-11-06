/**
 * Edge path builders that can also sample points along themselves, and greedy predicate-pill
 * placement over those samples. Shared by every layered view that draws curves (lanes, stack,
 * hive). Coordinates are whatever space the view draws in (viewBox or projected screen px).
 */
import type { Point } from '../graph'
import type { IndexedLink } from './types'
import type { LinkEmphasis } from './emphasis'

/** A drawn edge: its SVG path, plus point and unit tangent at parameter t ∈ [0, 1]. */
export interface EdgeCurve {
  d: string
  pointAt: (t: number) => Point
  /** Unit direction of travel at t (source → target). */
  tangentAt: (t: number) => Point
}

const r1 = (v: number) => Math.round(v * 10) / 10

function unit(x: number, y: number): Point {
  const len = Math.hypot(x, y)
  return len > 1e-9 ? { x: x / len, y: y / len } : { x: 1, y: 0 }
}

export function lineCurve(a: Point, b: Point): EdgeCurve {
  const u = unit(b.x - a.x, b.y - a.y)
  return {
    d: `M${r1(a.x)},${r1(a.y)} L${r1(b.x)},${r1(b.y)}`,
    pointAt: (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
    tangentAt: () => u,
  }
}

export function quadCurve(a: Point, c: Point, b: Point): EdgeCurve {
  return {
    d: `M${r1(a.x)},${r1(a.y)} Q${r1(c.x)},${r1(c.y)} ${r1(b.x)},${r1(b.y)}`,
    pointAt: (t) => {
      const m = 1 - t
      return { x: m * m * a.x + 2 * m * t * c.x + t * t * b.x, y: m * m * a.y + 2 * m * t * c.y + t * t * b.y }
    },
    tangentAt: (t) => unit(2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x), 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y)),
  }
}

export function cubicCurve(a: Point, c1: Point, c2: Point, b: Point): EdgeCurve {
  return {
    d: `M${r1(a.x)},${r1(a.y)} C${r1(c1.x)},${r1(c1.y)} ${r1(c2.x)},${r1(c2.y)} ${r1(b.x)},${r1(b.y)}`,
    pointAt: (t) => {
      const m = 1 - t
      const k0 = m * m * m
      const k1 = 3 * m * m * t
      const k2 = 3 * m * t * t
      const k3 = t * t * t
      return { x: k0 * a.x + k1 * c1.x + k2 * c2.x + k3 * b.x, y: k0 * a.y + k1 * c1.y + k2 * c2.y + k3 * b.y }
    },
    tangentAt: (t) => {
      const m = 1 - t
      const dx = 3 * m * m * (c1.x - a.x) + 6 * m * t * (c2.x - c1.x) + 3 * t * t * (b.x - c2.x)
      const dy = 3 * m * m * (c1.y - a.y) + 6 * m * t * (c2.y - c1.y) + 3 * t * t * (b.y - c2.y)
      return unit(dx, dy)
    },
  }
}

/** Axis-aligned box, centered on (x, y). */
export interface LabelBox {
  x: number
  y: number
  width: number
  height: number
}

export interface EdgeLabelCandidate {
  /** Usually the link id. */
  id: string
  text: string
  /** Where along its edge the pill may sit. */
  pointAt: (t: number) => Point
  /** Lower places first. See `edgeLabelPriority`. */
  priority: number
}

export interface PlacedEdgeLabel extends LabelBox {
  id: string
  text: string
  /** The t the pill landed at. */
  t: number
}

export interface PlaceEdgeLabelsOptions {
  /** Boxes pills must clear, e.g. node boxes. Centered boxes, like the result. */
  obstacles?: readonly LabelBox[]
  /** Positions tried along each edge, in order. Default [.5, .36, .64, .24, .76]. */
  ts?: readonly number[]
  /** Pill size from its text. Default: 6.4px per character + 12 wide, 15 tall (9.5px mono). */
  size?: (text: string) => { width: number; height: number }
  /** Clearance kept between boxes, px. Default 2 horizontal, 1 vertical. */
  gapX?: number
  gapY?: number
}

export const DEFAULT_LABEL_TS: readonly number[] = [0.5, 0.36, 0.64, 0.24, 0.76]

export const defaultPillSize = (text: string) => ({ width: Math.round(text.length * 6.4 + 12), height: 15 })

/**
 * Greedy predicate-pill placement. Candidates go in priority order (ties keep input order); each
 * tries `ts` along its own edge and takes the first position whose box clears every placed pill
 * and obstacle. A candidate with no clear position is left out of the result: views drop that
 * pill, and the inspector still lists every predicate. Pure and deterministic.
 */
export function placeEdgeLabels(candidates: readonly EdgeLabelCandidate[], options: PlaceEdgeLabelsOptions = {}): PlacedEdgeLabel[] {
  const ts = options.ts ?? DEFAULT_LABEL_TS
  const size = options.size ?? defaultPillSize
  const gx = options.gapX ?? 2
  const gy = options.gapY ?? 1
  const taken: LabelBox[] = [...(options.obstacles ?? [])]
  const clear = (b: LabelBox) =>
    taken.every((q) => Math.abs(q.x - b.x) > (q.width + b.width) / 2 + gx || Math.abs(q.y - b.y) > (q.height + b.height) / 2 + gy)
  const order = candidates.map((c, i) => ({ c, i })).sort((p, q) => p.c.priority - q.c.priority || p.i - q.i)
  const out: PlacedEdgeLabel[] = []
  for (const { c } of order) {
    const { width, height } = size(c.text)
    for (const t of ts) {
      const p = c.pointAt(t)
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue
      const box = { x: p.x, y: p.y, width, height }
      if (clear(box)) {
        taken.push(box)
        out.push({ id: c.id, text: c.text, t, ...box })
        break
      }
    }
  }
  return out
}

/**
 * Placement priority for a link's pill: reached links by hop (direct first), then the rest;
 * cross-layer before intra-layer at each level. Lower places first.
 */
export function edgeLabelPriority(link: Pick<IndexedLink, 'cross'>, emphasis: Pick<LinkEmphasis, 'highlighted' | 'hop'>): number {
  return (emphasis.highlighted ? emphasis.hop * 2 : 10) + (link.cross ? 0 : 1)
}
