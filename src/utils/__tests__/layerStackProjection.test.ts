import { describe, expect, it } from 'vitest'
import {
  CAMERA_PRESETS,
  DEFAULT_CAMERA_DISTANCE,
  PITCH_RANGE,
  ZOOM_RANGE,
  cameraFromPreset,
  clampCamera,
  createProjector,
  depthSort,
  fitZoom,
  leftmostPoint,
  lerpCamera,
  nearestYaw,
  planeCorners,
  planeGridLines,
  ringPoints,
  screenBounds,
  stackPlaneY,
  svgPoints,
  titleRail,
  wrapAngle,
  type StackCamera,
} from '../layered/projection'
import { easeInOutCubic, interpolateValues } from '../../hooks/useTween'

const cam = (c: Partial<StackCamera> = {}): StackCamera => ({ yaw: 0, pitch: 0, zoom: 1, targetY: 0, ...c })

describe('createProjector', () => {
  it('maps the target to the screen origin (plus offset) at scale = zoom', () => {
    const p = createProjector(cam({ yaw: 0.7, pitch: 0.4, zoom: 1.5 }), { offsetX: 60, offsetY: -10 })({ x: 0, y: 0, z: 0 })
    expect(p.x).toBeCloseTo(60)
    expect(p.y).toBeCloseTo(-10)
    expect(p.scale).toBeCloseTo(1.5)
    expect(p.depth).toBeCloseTo(0)
  })

  it('side-on: world up is screen up, and x maps to x', () => {
    const proj = createProjector(cam())
    const up = proj({ x: 0, y: 100, z: 0 })
    expect(up.x).toBeCloseTo(0)
    expect(up.y).toBeCloseTo(-100)
    expect(proj({ x: 50, y: 0, z: 0 }).x).toBeCloseTo(50)
  })

  it('farther points have larger depth and smaller scale (perspective divide)', () => {
    const proj = createProjector(cam())
    const near = proj({ x: 100, y: 0, z: -200 })
    const far = proj({ x: 100, y: 0, z: 200 })
    expect(far.depth).toBeGreaterThan(near.depth)
    expect(far.scale).toBeCloseTo(DEFAULT_CAMERA_DISTANCE / (DEFAULT_CAMERA_DISTANCE + 200))
    expect(Math.abs(far.x)).toBeLessThan(Math.abs(near.x))
  })

  it('top-down: depth ignores in-plane position and higher planes are nearer', () => {
    const proj = createProjector(cam({ pitch: Math.PI / 2 }))
    const a = proj({ x: 120, y: 50, z: -80 })
    const b = proj({ x: -40, y: 50, z: 200 })
    expect(a.depth).toBeCloseTo(b.depth)
    expect(proj({ x: 0, y: 100, z: 0 }).depth).toBeLessThan(proj({ x: 0, y: -100, z: 0 }).depth)
  })

  it('yaw rotates about the vertical axis', () => {
    const p = createProjector(cam({ yaw: Math.PI / 2 }))({ x: 0, y: 0, z: 100 })
    expect(p.x).toBeCloseTo(-100)
  })

  it('targetY moves the look-at height', () => {
    const p = createProjector(cam({ targetY: 170 }))({ x: 0, y: 170, z: 0 })
    expect(p.y).toBeCloseTo(0)
  })

  it('stays finite for points behind the camera', () => {
    const p = createProjector(cam())({ x: 10, y: 0, z: -5000 })
    expect(Number.isFinite(p.x) && Number.isFinite(p.scale)).toBe(true)
  })
})

describe('camera helpers', () => {
  it('clampCamera clamps pitch and zoom only', () => {
    const c = clampCamera({ yaw: 9, pitch: 3, zoom: 10, targetY: -40 })
    expect(c).toEqual({ yaw: 9, pitch: PITCH_RANGE[1], zoom: ZOOM_RANGE[1], targetY: -40 })
    expect(clampCamera(cam({ pitch: -1, zoom: 0 }))).toMatchObject({ pitch: PITCH_RANGE[0], zoom: ZOOM_RANGE[0] })
  })

  it('wrapAngle and nearestYaw turn the short way', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI)
    expect(wrapAngle(-Math.PI / 2 - 4 * Math.PI)).toBeCloseTo(-Math.PI / 2)
    expect(nearestYaw(3, -3)).toBeCloseTo(-3 + 2 * Math.PI)
    expect(nearestYaw(0.1, -0.62)).toBeCloseTo(-0.62)
  })

  it('lerpCamera interpolates every field, yaw via the shortest arc', () => {
    const m = lerpCamera(cam({ yaw: 3, zoom: 1 }), cam({ yaw: -3, zoom: 2, pitch: 1, targetY: 100 }), 0.5)
    expect(m.zoom).toBeCloseTo(1.5)
    expect(m.pitch).toBeCloseTo(0.5)
    expect(m.targetY).toBeCloseTo(50)
    expect(Math.abs(wrapAngle(m.yaw))).toBeCloseTo(Math.PI, 1)
  })

  it('presets are within range and cameraFromPreset centers the target', () => {
    for (const p of Object.values(CAMERA_PRESETS)) {
      expect(clampCamera({ ...p, targetY: 0 })).toEqual({ yaw: p.yaw, pitch: p.pitch, zoom: p.zoom, targetY: 0 })
    }
    expect(cameraFromPreset('top')).toEqual({ yaw: 0, pitch: 1.5, zoom: 1.05, targetY: 0 })
  })
})

describe('stack geometry', () => {
  it('stackPlaneY spreads ranks evenly about 0, rank 0 on top', () => {
    expect([0, 1, 2].map((r) => stackPlaneY(r, 3, 170))).toEqual([170, 0, -170])
    expect([0, 1].map((r) => stackPlaneY(r, 2, 100))).toEqual([50, -50])
  })

  it('a focused layer pushes the others apart by push × amount and stays put itself', () => {
    const f = { rank: 1, amount: 0.5 }
    expect([0, 1, 2].map((r) => stackPlaneY(r, 3, 170, f, 150))).toEqual([245, 0, -245])
    expect(stackPlaneY(0, 3, 170, { rank: 0, amount: 1 }, 150)).toBe(170)
  })

  it('planes share one square extent', () => {
    const c = planeCorners(-20, 300)
    expect(c).toHaveLength(4)
    expect(c.every((p) => p.y === -20 && Math.abs(p.x) === 300 && Math.abs(p.z) === 300)).toBe(true)
    expect(planeGridLines(0, 300)).toHaveLength(6)
  })

  it('ringPoints closes the circle at the given radius', () => {
    const r = ringPoints(10, 5, -10, 14, 24)
    expect(r).toHaveLength(25)
    expect(r[0].x).toBeCloseTo(r[24].x)
    for (const p of r) expect(Math.hypot(p.x - 10, p.z + 10)).toBeCloseTo(14)
  })

  it('depthSort is painter order (far first) and stable', () => {
    const items = [{ id: 'a', d: 1 }, { id: 'b', d: 5 }, { id: 'c', d: 1 }, { id: 'd', d: -2 }]
    expect(depthSort(items, (i) => i.d).map((i) => i.id)).toEqual(['b', 'a', 'c', 'd'])
  })

  it('fitZoom fits the projected stack in the viewport with the margin', () => {
    const pts = [0, 1, 2].flatMap((r) => planeCorners(stackPlaneY(r, 3, 170), 300))
    const c = cameraFromPreset('stack')
    const opts = { offsetX: 60, offsetY: -45 }
    const z = fitZoom(pts, c, { width: 1160, height: 780, margin: 40 }, opts)
    const b = screenBounds(pts.map(createProjector({ ...c, zoom: z }, opts)))
    expect(b.minX).toBeGreaterThanOrEqual(-580 + 40 - 1e-6)
    expect(b.maxX).toBeLessThanOrEqual(580 - 40 + 1e-6)
    expect(b.minY).toBeGreaterThanOrEqual(-390 + 40 - 1e-6)
    expect(b.maxY).toBeLessThanOrEqual(390 - 40 + 1e-6)
    // and it is tight on at least one side
    const slack = Math.min(540 - b.maxX, b.minX + 540, 350 - b.maxY, b.minY + 350)
    expect(slack).toBeLessThan(1)
  })

  it('leftmostPoint, screenBounds, svgPoints and titleRail', () => {
    expect(leftmostPoint([{ x: 3, y: 0 }, { x: -2, y: 1 }, { x: -2, y: 4 }])).toEqual({ x: -2, y: 4 })
    expect(screenBounds([{ x: 1, y: 2 }, { x: -3, y: 5 }])).toEqual({ minX: -3, minY: 2, maxX: 1, maxY: 5 })
    expect(svgPoints([{ x: 1.234, y: -5.06 }, { x: 0, y: 2 }])).toBe('1.2,-5.1 0,2')
    expect(titleRail(3, -400, 10, 40)).toEqual([{ x: -400, y: -30 }, { x: -400, y: 10 }, { x: -400, y: 50 }])
  })
})

describe('tween math', () => {
  it('easeInOutCubic is symmetric and pinned at the ends', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5)
    expect(easeInOutCubic(0.25) + easeInOutCubic(0.75)).toBeCloseTo(1)
  })

  it('interpolateValues moves only the keys in `to`', () => {
    expect(interpolateValues({ a: 0, b: 10 }, { a: 4 }, 0.5)).toEqual({ a: 2, b: 10 })
  })
})
