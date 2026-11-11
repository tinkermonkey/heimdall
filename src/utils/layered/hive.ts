/**
 * Hive plot geometry for the layered views: one radial axis per layer at evenly divided angles,
 * optionally doubled (split) so links within a layer span the gap between the two copies; nodes
 * placed outward by a rank in (0, 1); links as quadratic curves. Pure and deterministic. Angles are
 * in degrees, measured clockwise from +x in SVG coordinates (y down), so -90 is straight up.
 */
import type { Point } from '../graph'
import type { IndexedNode, LayeredIndex } from './types'

/** How nodes are assigned to hive axes: by layer, or by any categorical value (null or undefined: not drawn). */
export type HiveAxisBy = 'layer' | ((node: IndexedNode) => string | null | undefined)

/** Axis order: ids listed first in that order (the rest follow in default order), or a comparator of axis ids. */
export type HiveAxisOrder = readonly string[] | ((a: string, b: string) => number)

export interface HiveAxisGroups {
  /** Every axis in angle order, with all its node instances (filters not applied). */
  axes: { id: string; nodeIds: string[] }[]
  /** Axis id of each node instance that has one. */
  axisOf: ReadonlyMap<string, string>
  /** Node instances the axis function left without an axis (null or undefined). */
  unassigned: string[]
}

const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * Groups node instances into hive axes. `'layer'`: one axis per layer, in layer order. A function:
 * one axis per distinct value it returns over every node (hidden layers included, so the set of
 * axes doesn't change with filters), sorted by code point. `order` then reorders the axes.
 */
export function hiveAxisGroups(index: LayeredIndex, by: HiveAxisBy = 'layer', order?: HiveAxisOrder): HiveAxisGroups {
  const members = new Map<string, string[]>()
  const axisOf = new Map<string, string>()
  const unassigned: string[] = []
  if (by === 'layer') {
    for (const l of index.layers) {
      members.set(l.id, [...l.nodeIds])
      for (const id of l.nodeIds) axisOf.set(id, l.id)
    }
  } else {
    for (const n of index.nodes) {
      const v = by(n)
      if (v === null || v === undefined) {
        unassigned.push(n.id)
        continue
      }
      const id = String(v)
      axisOf.set(n.id, id)
      const list = members.get(id)
      if (list) list.push(n.id)
      else members.set(id, [n.id])
    }
  }
  let ids = [...members.keys()]
  if (by !== 'layer') ids.sort(byCodePoint)
  if (typeof order === 'function') ids = [...ids].sort(order)
  else if (order) {
    const listed = order.filter((id, i) => members.has(id) && order.indexOf(id) === i)
    ids = [...listed, ...ids.filter((id) => !listed.includes(id))]
  }
  return { axes: ids.map((id) => ({ id, nodeIds: members.get(id)! })), axisOf, unassigned }
}

export interface HiveLayoutOptions {
  /** Radius where the rank-0 end of every axis sits. Default 64. */
  innerRadius?: number
  /** Axis length: a node at rank r sits at `innerRadius + axisLength * r`. Default 300. */
  axisLength?: number
  /** Double every axis at ±`splitAngle`. Default true. */
  splitAxes?: boolean
  /** Half the angle between an axis's two copies, degrees. Clamped to leave room between axes. Default 13. */
  splitAngle?: number
  /** Angle of the first axis, degrees. Default -90 (up). */
  startAngle?: number
  /**
   * Layers to leave out. Their axes keep their angle slot, so hiding a layer leaves a gap and the
   * other axes don't move. Their nodes get no radius and their links no geometry.
   */
  hiddenLayers?: readonly string[]
}

export interface HiveAxis {
  /** The axis id: the layer id by default, else the value `axes` returned. */
  layerId: string
  /** Slot among all the layers (hidden ones included), clockwise from `startAngle`. */
  position: number
  /** Axis angle, degrees. */
  angle: number
  /** Copy offsets from `angle`, degrees: `[-split, split]` when split, else `[0]`. */
  offsets: number[]
  /** Index into `offsets` of the copy that carries node labels (the one whose labels read clear of the gap). */
  labelCopy: number
}

export interface HiveLayout {
  /** The drawn axes: every layer not hidden, in draw order. */
  axes: HiveAxis[]
  /** Every layer's axis slot, hidden ones included, so a renderer can fit its frame to all of them. */
  slots: HiveAxis[]
  /** The drawn axes by layer id. */
  axisOf: ReadonlyMap<string, HiveAxis>
  /** Radius of every placed node (nodes of hidden layers are not placed). */
  radiusOf: ReadonlyMap<string, number>
  /** The split half-angle actually used (0 when not split), degrees. */
  split: number
  innerRadius: number
  axisLength: number
}

const RAD = Math.PI / 180

/**
 * Least bulge of an unsplit intra-layer loop, viewBox units. The loop's apex sits half the bulge off
 * the axis, so this keeps a loop between near neighbours wider than its arrowhead (7) plus the
 * target dot, and the arrowhead arrives close to square on the axis instead of along it, clear of
 * the next dot.
 */
export const HIVE_MIN_LOOP_BULGE = 36

/** Point at `angle` degrees and `radius` from the origin. */
export function hivePoint(angle: number, radius: number): Point {
  return { x: radius * Math.cos(angle * RAD), y: radius * Math.sin(angle * RAD) }
}

/** `count` evenly divided axis angles, degrees, clockwise from `start`. */
export function hiveAxisAngles(count: number, start = -90): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => start + (360 * i) / count)
}

/** The split half-angle, kept below half the gap between neighbouring axes (minus 6° of air). */
export function clampSplitAngle(split: number, count: number): number {
  const max = count > 1 ? 180 / count - 6 : 45
  return Math.max(0, Math.min(split, max))
}

/** Signed smallest difference b - a in degrees, in (-180, 180]. */
function angleDiff(a: number, b: number): number {
  let d = (b - a) % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

/**
 * Which copy carries node labels and which way they run. Labels are horizontal text pushed
 * sideways from the dot, so the copy whose outward normal (away from its twin) points most
 * upward and rightward is chosen.
 */
function pickLabelCopy(angle: number, offsets: readonly number[]): number {
  if (offsets.length === 1) return 0
  let best = 0
  let bestScore = -Infinity
  offsets.forEach((off, k) => {
    const normal = (angle + off + (off >= 0 ? 90 : -90)) * RAD
    const score = 0.5 * Math.cos(normal) - Math.sin(normal)
    if (score > bestScore + 1e-9) {
      bestScore = score
      best = k
    }
  })
  return best
}

/** Horizontal side a label sits on at a dot on axis copy `angle + offset`: 1 = right (text-anchor start), -1 = left. */
export function hiveLabelSide(axis: HiveAxis, copy = axis.labelCopy): 1 | -1 {
  const off = axis.offsets[copy] ?? 0
  // Unsplit: the side the axis leans toward (right for a vertical axis), so text runs away from the center.
  if (off === 0) return Math.cos(axis.angle * RAD) >= -0.1 ? 1 : -1
  const normal = axis.angle + off + (off > 0 ? 90 : -90)
  return Math.cos(normal * RAD) >= -1e-9 ? 1 : -1
}

/**
 * Axes for the given layers (in draw order) and each node's radius from its rank in (0, 1)
 * (`rankWithinLayers`). Nodes without a rank sit mid-axis. Angles are divided among all the
 * layers, hidden ones included, so they stay put when a layer is hidden.
 */
export function hiveLayout(
  layers: readonly { id: string; nodeIds: readonly string[] }[],
  rank: ReadonlyMap<string, number>,
  options: HiveLayoutOptions = {},
): HiveLayout {
  const innerRadius = options.innerRadius ?? 64
  const axisLength = options.axisLength ?? 300
  const split = options.splitAxes === false ? 0 : clampSplitAngle(options.splitAngle ?? 13, layers.length)
  const angles = hiveAxisAngles(layers.length, options.startAngle ?? -90)
  const hidden = new Set(options.hiddenLayers ?? [])
  const slots: HiveAxis[] = layers.map((l, i) => {
    const offsets = split > 0 ? [-split, split] : [0]
    return { layerId: l.id, position: i, angle: angles[i], offsets, labelCopy: pickLabelCopy(angles[i], offsets) }
  })
  const axes = slots.filter((a) => !hidden.has(a.layerId))
  const radiusOf = new Map<string, number>()
  for (const l of layers) {
    if (hidden.has(l.id)) continue
    for (const id of l.nodeIds) radiusOf.set(id, innerRadius + axisLength * (rank.get(id) ?? 0.5))
  }
  return { axes, slots, axisOf: new Map(axes.map((a) => [a.layerId, a])), radiusOf, split, innerRadius, axisLength }
}

export interface HiveLinkGeometry {
  /** Source end, control point, target end of the quadratic curve. */
  a: Point
  c: Point
  b: Point
  /** Copy indices used at each end. */
  sourceCopy: number
  targetCopy: number
}

/**
 * The quadratic curve of one link. Cross-layer links leave from the copy facing the other axis
 * and bow toward the center (control at 0.42 of the mean radius, on the bisector). With split
 * axes, links within a layer run from the clockwise copy to the counter-clockwise one, bowing
 * just outside the gap; without, they leave the axis as an arc to one side (clockwise when the
 * target sits farther out), so the side reads as direction, and at least `HIVE_MIN_LOOP_BULGE`
 * wide so short loops keep room for their arrowhead. Between exactly opposite axes, links
 * always leave clockwise, so each direction takes its own side.
 */
export function hiveLinkGeometry(
  layout: HiveLayout,
  source: { layerId: string; radius: number },
  target: { layerId: string; radius: number },
): HiveLinkGeometry | null {
  const sa = layout.axisOf.get(source.layerId)
  const ta = layout.axisOf.get(target.layerId)
  if (!sa || !ta) return null
  const s = layout.split
  const ra = source.radius
  const rb = target.radius
  const copyOf = (axis: HiveAxis, off: number) => Math.max(0, axis.offsets.indexOf(off))

  if (sa === ta) {
    if (s > 0) {
      const a = hivePoint(sa.angle + s, ra)
      const b = hivePoint(sa.angle - s, rb)
      const c = hivePoint(sa.angle, ((ra + rb) / 2) * 1.02)
      return { a, b, c, sourceCopy: copyOf(sa, s), targetCopy: copyOf(sa, -s) }
    }
    const a = hivePoint(sa.angle, ra)
    const b = hivePoint(sa.angle, rb)
    const m = hivePoint(sa.angle, (ra + rb) / 2)
    const sign = rb >= ra ? 1 : -1
    const bulge = Math.max(Math.abs(rb - ra) * 0.6 + 10, HIVE_MIN_LOOP_BULGE)
    const nx = -Math.sin(sa.angle * RAD)
    const ny = Math.cos(sa.angle * RAD)
    return { a, b, c: { x: m.x + nx * bulge * sign, y: m.y + ny * bulge * sign }, sourceCopy: 0, targetCopy: 0 }
  }

  const d = angleDiff(sa.angle, ta.angle)
  // Exactly opposite axes: always leave clockwise, so the two directions take opposite sides.
  const dir = d > 0 || Math.abs(Math.abs(d) - 180) < 1e-9 ? 1 : -1
  const oa = s * dir
  const ob = -oa
  const angA = sa.angle + oa
  const angB = ta.angle + ob
  const a = hivePoint(angA, ra)
  const b = hivePoint(angB, rb)
  // Bisector of the two end angles, on the side the link travels.
  const mid = angA + angleDiff(angA, angB) / 2
  const c = hivePoint(mid, ((ra + rb) / 2) * 0.42)
  return { a, b, c, sourceCopy: copyOf(sa, oa), targetCopy: copyOf(ta, ob) }
}
