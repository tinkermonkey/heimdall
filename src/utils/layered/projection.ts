/**
 * Camera and projection math for the 3D layer stack, kept free of React and the DOM so another
 * renderer (three.js, say) can take the same world model. The world: one horizontal plane per
 * layer at height `y` (higher rank = lower), nodes at (x, y, z) on their plane. The camera orbits
 * the stack's vertical axis (`yaw`), tilts down toward it (`pitch`, 0 = side-on, π/2 = top-down),
 * scales the picture (`zoom`) and looks at height `targetY`. Screen space is a viewBox centered on
 * (0, 0), y down.
 */
import type { Point } from '../graph'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface StackCamera {
  /** Rotation about the vertical axis, radians. */
  yaw: number
  /** Tilt down toward the stack, radians: 0 is side-on, π/2 looks straight down. Clamped to `PITCH_RANGE`. */
  pitch: number
  /** Picture scale. Clamped to `ZOOM_RANGE`. */
  zoom: number
  /** World height the camera looks at (0 = the middle of the stack). */
  targetY: number
}

export type CameraPresetName = 'stack' | 'exploded' | 'top' | 'profile'

/** A preset sets the camera angles and zoom, and the layer gap it reads best at. */
export interface CameraPreset {
  yaw: number
  pitch: number
  zoom: number
  layerGap: number
}

/**
 * `stack`: three-quarter view. `exploded`: lower and wider apart, for cross-layer links. `top`:
 * straight down through every plane (x-ray). `profile`: side-on, the cross-layer links as a ladder.
 */
export const CAMERA_PRESETS: Readonly<Record<CameraPresetName, CameraPreset>> = Object.freeze({
  stack: { yaw: -0.62, pitch: 0.5, zoom: 1, layerGap: 170 },
  exploded: { yaw: -0.5, pitch: 0.34, zoom: 0.86, layerGap: 300 },
  top: { yaw: 0, pitch: 1.5, zoom: 1.05, layerGap: 170 },
  profile: { yaw: 0, pitch: 0.04, zoom: 0.95, layerGap: 210 },
})

export const CAMERA_PRESET_NAMES: readonly CameraPresetName[] = ['stack', 'exploded', 'top', 'profile']

export const PITCH_RANGE: readonly [number, number] = [0.02, 1.52]
export const ZOOM_RANGE: readonly [number, number] = [0.4, 3]

/** Camera distance from the target, in world units: smaller is stronger perspective. */
export const DEFAULT_CAMERA_DISTANCE = 1600

/** Above this pitch the planes overlap on screen, and plane titles move to a side rail. */
export const TOP_VIEW_PITCH = 1.2

/** Up to this many layers a preset keeps its own gap; a taller stack closes up to the same height. */
export const PRESET_GAP_FULL_LAYERS = 5

/**
 * A preset's layer gap for a stack of `layerCount` layers: the preset's own (`CAMERA_PRESETS`) up
 * to `PRESET_GAP_FULL_LAYERS` layers, and closer together beyond, so the stack keeps the height of
 * five layers and a 13-layer stack still frames.
 */
export function presetLayerGap(name: CameraPresetName, layerCount: number): number {
  return CAMERA_PRESETS[name].layerGap * Math.min(1, (PRESET_GAP_FULL_LAYERS - 1) / Math.max(1, layerCount - 1))
}

export function cameraFromPreset(name: CameraPresetName): StackCamera {
  const p = CAMERA_PRESETS[name]
  return { yaw: p.yaw, pitch: p.pitch, zoom: p.zoom, targetY: 0 }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Pitch and zoom clamped to their ranges; yaw and targetY as given. */
export function clampCamera(c: StackCamera): StackCamera {
  return {
    yaw: c.yaw,
    pitch: clamp(c.pitch, PITCH_RANGE[0], PITCH_RANGE[1]),
    zoom: clamp(c.zoom, ZOOM_RANGE[0], ZOOM_RANGE[1]),
    targetY: c.targetY,
  }
}

/** Angle wrapped into (-π, π]. */
export function wrapAngle(a: number): number {
  const t = 2 * Math.PI
  let r = ((a % t) + t) % t
  if (r > Math.PI) r -= t
  return r
}

/** The yaw equal to `to` (mod 2π) nearest `from`, so a tween turns the short way round. */
export function nearestYaw(from: number, to: number): number {
  return from + wrapAngle(to - from)
}

export interface ProjectionOptions {
  /** Camera distance, world units. Default `DEFAULT_CAMERA_DISTANCE`. */
  distance?: number
  /** Screen offset of the stack's axis, px. Default (0, 0). */
  offsetX?: number
  offsetY?: number
}

export interface ProjectedPoint {
  x: number
  y: number
  /** Perspective scale at this point, zoom included: multiply px sizes (radius, stroke) by it. */
  scale: number
  /** Distance along the view direction from the target plane: larger is farther away. */
  depth: number
}

/**
 * A projector for one camera: yaw about the vertical axis, then pitch, then a perspective divide
 * (`distance / (distance + depth)`). Points nearer than the camera are clamped so the divide stays
 * finite.
 */
export function createProjector(camera: StackCamera, options: ProjectionOptions = {}): (p: Vec3) => ProjectedPoint {
  const D = options.distance ?? DEFAULT_CAMERA_DISTANCE
  const ox = options.offsetX ?? 0
  const oy = options.offsetY ?? 0
  const cy = Math.cos(camera.yaw)
  const sy = Math.sin(camera.yaw)
  const cp = Math.cos(camera.pitch)
  const sp = Math.sin(camera.pitch)
  const zoom = camera.zoom
  const ty = camera.targetY
  return (p) => {
    const x1 = p.x * cy - p.z * sy
    const z1 = p.x * sy + p.z * cy
    const yy = p.y - ty
    const y2 = yy * cp + z1 * sp
    const z2 = -yy * sp + z1 * cp
    const s = (D / Math.max(D * 0.05, D + z2)) * zoom
    return { x: x1 * s + ox, y: -y2 * s + oy, scale: s, depth: z2 }
  }
}

export function projectPoint(p: Vec3, camera: StackCamera, options?: ProjectionOptions): ProjectedPoint {
  return createProjector(camera, options)(p)
}

/** Painter's order: farthest first, so nearer items draw on top. Stable; returns a new array. */
export function depthSort<T>(items: readonly T[], depthOf: (item: T) => number): T[] {
  return items
    .map((item, i) => ({ item, i, d: depthOf(item) }))
    .sort((a, b) => b.d - a.d || a.i - b.i)
    .map((e) => e.item)
}

/**
 * Height of a layer's plane: ranks spread evenly about y = 0 (rank 0 on top), `gap` apart. With a
 * focused layer, planes above it move up and planes below it move down by `push * amount`, opening
 * room around it. Several focus entries add up, so a switch from one focused layer to another
 * blends (one amount falls while the other rises) instead of closing the stack first.
 */
export function stackPlaneY(
  rank: number,
  layerCount: number,
  gap: number,
  focus?: StackFocus | readonly StackFocus[] | null,
  push = 150,
): number {
  let y = ((layerCount - 1) / 2 - rank) * gap
  const list: readonly StackFocus[] = focus == null ? [] : Array.isArray(focus) ? focus : [focus as StackFocus]
  for (const f of list) {
    if (f.amount > 0 && rank !== f.rank) y += (rank < f.rank ? 1 : -1) * push * f.amount
  }
  return y
}

/** A layer the stack opens around: its rank and how far open (0..1). */
export interface StackFocus {
  rank: number
  amount: number
}

/** The four corners of a square plane at height y, half-width `extent`, in winding order. */
export function planeCorners(y: number, extent: number): Vec3[] {
  return [
    { x: -extent, y, z: -extent },
    { x: extent, y, z: -extent },
    { x: extent, y, z: extent },
    { x: -extent, y, z: extent },
  ]
}

/** Grid lines across a plane, both directions, at each fraction of the half-width in `at`. */
export function planeGridLines(y: number, extent: number, at: readonly number[] = [-0.5, 0, 0.5]): [Vec3, Vec3][] {
  const out: [Vec3, Vec3][] = []
  for (const g of at) {
    const v = g * extent
    out.push([{ x: v, y, z: -extent }, { x: v, y, z: extent }])
    out.push([{ x: -extent, y, z: v }, { x: extent, y, z: v }])
  }
  return out
}

/** A horizontal circle at height y around (cx, cz), as `segments + 1` points (closed). */
export function ringPoints(cx: number, y: number, cz: number, radius: number, segments = 24): Vec3[] {
  const out: Vec3[] = []
  for (let k = 0; k <= segments; k++) {
    const t = (k / segments) * Math.PI * 2
    out.push({ x: cx + Math.cos(t) * radius, y, z: cz + Math.sin(t) * radius })
  }
  return out
}

/** Points as an SVG `points` string, one decimal. */
export function svgPoints(pts: readonly Point[]): string {
  return pts.map((p) => `${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`).join(' ')
}

/** The leftmost point on screen (ties: the lower one). Where a plane's title anchors. */
export function leftmostPoint<T extends Point>(pts: readonly T[]): T {
  let best = pts[0]
  for (const p of pts) if (p.x < best.x || (p.x === best.x && p.y > best.y)) best = p
  return best
}

export interface ScreenBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function screenBounds(pts: readonly Point[]): ScreenBounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY }
}

/**
 * The zoom that fits world points into a viewport `width` × `height` centered on (0, 0), keeping
 * the camera's angles and target, with `margin` px clear on every side. Screen coordinates scale
 * linearly with zoom about the projection offset, so one projection at zoom 1 is enough.
 */
export function fitZoom(
  points: readonly Vec3[],
  camera: StackCamera,
  viewport: { width: number; height: number; margin?: number },
  options: ProjectionOptions = {},
): number {
  if (points.length === 0) return camera.zoom
  const ox = options.offsetX ?? 0
  const oy = options.offsetY ?? 0
  const proj = createProjector({ ...camera, zoom: 1 }, options)
  const m = viewport.margin ?? 24
  const hw = viewport.width / 2 - m
  const hh = viewport.height / 2 - m
  let z = Infinity
  for (const p of points) {
    const q = proj(p)
    const dx = q.x - ox
    const dy = q.y - oy
    // The axis offset shifts the picture: the room on each side differs.
    if (dx > 1e-6) z = Math.min(z, (hw - ox) / dx)
    if (dx < -1e-6) z = Math.min(z, (-hw - ox) / dx)
    if (dy > 1e-6) z = Math.min(z, (hh - oy) / dy)
    if (dy < -1e-6) z = Math.min(z, (-hh - oy) / dy)
  }
  if (!Number.isFinite(z) || z <= 0) return camera.zoom
  return clamp(z, ZOOM_RANGE[0], ZOOM_RANGE[1])
}

/** Camera between a and b at t ∈ [0, 1]; yaw turns the short way round. */
export function lerpCamera(a: StackCamera, b: StackCamera, t: number): StackCamera {
  const yb = nearestYaw(a.yaw, b.yaw)
  return {
    yaw: a.yaw + (yb - a.yaw) * t,
    pitch: a.pitch + (b.pitch - a.pitch) * t,
    zoom: a.zoom + (b.zoom - a.zoom) * t,
    targetY: a.targetY + (b.targetY - a.targetY) * t,
  }
}

/**
 * Plane-title positions on a side rail, for views where the planes overlap on screen (top view):
 * one title per layer in rank order, `spacing` px apart, centered on `centerY`, right-aligned at `x`.
 */
export function titleRail(count: number, x: number, centerY: number, spacing = 44): Point[] {
  const top = centerY - ((count - 1) * spacing) / 2
  return Array.from({ length: count }, (_, i) => ({ x, y: top + i * spacing }))
}

/** Whether a screen point lies inside a polygon (even-odd ray cast); for projected plane quads. */
export function insidePolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

/**
 * Title centres for a column of plane titles, top to bottom (`ys` ascending): at least `spacing`
 * apart, pushed down from their anchors, and kept inside [minY, maxY]: moved back up when the
 * column runs off the bottom, and evenly spaced over the whole range when it is taller than the
 * scene (a tall stack in a short scene). A column that fits comes back as the push-down alone.
 */
export function fitTitleColumn(ys: readonly number[], spacing: number, minY: number, maxY: number): number[] {
  const n = ys.length
  if (n === 0) return []
  const gap = n > 1 ? Math.min(spacing, (maxY - minY) / (n - 1)) : spacing
  const out = ys.map((y) => clamp(y, minY, maxY))
  for (let k = 1; k < n; k++) if (out[k] - out[k - 1] < gap) out[k] = out[k - 1] + gap
  if (out[n - 1] > maxY) {
    out[n - 1] = maxY
    for (let k = n - 2; k >= 0; k--) if (out[k + 1] - out[k] < gap) out[k] = out[k + 1] - gap
  }
  return out
}
