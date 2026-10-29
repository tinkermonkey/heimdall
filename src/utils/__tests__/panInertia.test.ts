import { describe, expect, it } from 'vitest'
import {
  INERTIA_TIME_CONSTANT,
  MIN_REMAINING_TRAVEL_PX,
  VELOCITY_WINDOW_MS,
  decayVelocity,
  glideHasSettled,
  pruneSamples,
  releaseVelocity,
  type PointerSample,
} from '../panInertia'

// A drag moving at `speed` px/s along x, one pointermove every `stepMs`, for `durationMs`.
function steadyDrag(speed: number, stepMs: number, durationMs: number): PointerSample[] {
  const samples: PointerSample[] = []
  for (let t = 0; t <= durationMs; t += stepMs) samples.push({ x: (speed * t) / 1000, y: 0, t })
  return samples
}

// Run the glide loop as usePanZoom does at 60fps; returns its duration and the distance it skipped.
function glide(speed: number) {
  const dt = 1 / 60
  let v = speed
  let travelled = 0
  let frames = 0
  for (;;) {
    v = decayVelocity(v, dt)
    if (glideHasSettled(v, 0)) break
    travelled += v * dt
    frames++
  }
  // Total travel of the uncut glide, as a geometric series of per-frame steps.
  const decay = decayVelocity(1, dt)
  const total = ((speed * dt) * decay) / (1 - decay)
  return { seconds: frames * dt, skipped: total - travelled }
}

describe('releaseVelocity', () => {
  it('measures a steady drag released straight away', () => {
    const samples = steadyDrag(600, 16, 320)
    const { vx, vy } = releaseVelocity(samples, 320)
    expect(vx).toBeCloseTo(600, 0)
    expect(vy).toBe(0)
  })

  it('gives no velocity when the pointer was held still for the whole window (#321)', () => {
    const samples = steadyDrag(600, 16, 320)
    expect(releaseVelocity(samples, 320 + 300)).toEqual({ vx: 0, vy: 0 })
    expect(releaseVelocity(samples, 320 + VELOCITY_WINDOW_MS)).toEqual({ vx: 0, vy: 0 })
  })

  it('counts a short hold against the velocity', () => {
    const samples = steadyDrag(600, 16, 320)
    // Half the window moving, half held still.
    expect(releaseVelocity(samples, 320 + VELOCITY_WINDOW_MS / 2).vx).toBeCloseTo(300, 0)
  })

  it('counts a slowdown just before the release', () => {
    const fast = steadyDrag(1200, 16, 304)
    const last = fast[fast.length - 1]
    const samples = [...fast, ...[1, 2, 3, 4, 5, 6].map((i) => ({ x: last.x + i, y: 0, t: last.t + i * 16 }))]
    const release = samples[samples.length - 1].t
    // The last 100ms were mostly the slow tail (1px per 16ms ≈ 62px/s), not the 1200px/s flick.
    expect(releaseVelocity(samples, release).vx).toBeLessThan(200)
  })

  it('interpolates the window start between sparse samples', () => {
    // One move every 80ms, so the window start falls between two samples.
    const samples = steadyDrag(500, 80, 400)
    expect(releaseVelocity(samples, 400).vx).toBeCloseTo(500, 0)
  })

  it('uses the press as the start of a drag shorter than the window', () => {
    const samples = steadyDrag(400, 10, 40)
    expect(releaseVelocity(samples, 40).vx).toBeCloseTo(400, 0)
  })

  it('gives no velocity for a press with no moves', () => {
    expect(releaseVelocity([{ x: 5, y: 5, t: 0 }], 50)).toEqual({ vx: 0, vy: 0 })
  })
})

describe('pruneSamples', () => {
  it('keeps the sample before the window so releaseVelocity is unchanged', () => {
    const samples = steadyDrag(700, 16, 2000)
    const before = releaseVelocity(samples, 2000)
    pruneSamples(samples, 2000)
    expect(samples.length).toBeLessThanOrEqual(Math.ceil(VELOCITY_WINDOW_MS / 16) + 2)
    expect(samples[0].t).toBeLessThanOrEqual(2000 - VELOCITY_WINDOW_MS)
    expect(releaseVelocity(samples, 2000)).toEqual(before)
  })
})

describe('glide end (#320)', () => {
  it('stops once under half a pixel of travel is left', () => {
    expect(glideHasSettled(MIN_REMAINING_TRAVEL_PX / INERTIA_TIME_CONSTANT - 0.01, 0)).toBe(true)
    expect(glideHasSettled(MIN_REMAINING_TRAVEL_PX / INERTIA_TIME_CONSTANT + 0.01, 0)).toBe(false)
  })

  it('ends a 2000px/s flick in about 2.3s, skipping under a pixel of travel', () => {
    const { seconds, skipped } = glide(2000)
    // At the old 0.1px/s cutoff this ran ~3.2s, the last ~1s moving under a pixel in total.
    expect(seconds).toBeGreaterThan(2)
    expect(seconds).toBeLessThan(2.5)
    expect(skipped).toBeLessThan(1)
  })

  it('does not start a glide for a release that would travel under half a pixel', () => {
    expect(glideHasSettled(1, 1)).toBe(true)
    expect(glideHasSettled(30, 0)).toBe(false)
  })
})
