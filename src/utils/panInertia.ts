// Pure math behind usePanZoom's drag-release glide, kept apart from the hook so it can be
// unit tested without a DOM.

/** Fraction of the glide velocity kept per 60fps frame. */
export const INERTIA_DECAY = 0.95

/** Seconds of "remaining travel per px/s of speed". Velocity v decaying by INERTIA_DECAY each
 *  60fps frame has about v * INERTIA_TIME_CONSTANT px left to travel (≈ v / 3.08). */
export const INERTIA_TIME_CONSTANT = 1 / (60 * -Math.log(INERTIA_DECAY))

/** A glide ends once less than this much travel is left. Past that point nothing visibly moves,
 *  so carrying on only delays the 'end' gesture phase (and onViewportDwell) — #320. */
export const MIN_REMAINING_TRAVEL_PX = 0.5

/** Release velocity is the average pointer velocity over this window before the release. A
 *  pointer held still for the whole window releases with no velocity — #321. */
export const VELOCITY_WINDOW_MS = 100

export interface PointerSample {
  x: number
  y: number
  /** performance.now() timestamp, ms. */
  t: number
}

/** Drop samples that can no longer affect releaseVelocity: keep the newest sample at or before
 *  the window start (needed to interpolate the window's starting position) and everything after
 *  it. Mutates and returns `samples`, which must be in time order. */
export function pruneSamples(samples: PointerSample[], now: number): PointerSample[] {
  const start = now - VELOCITY_WINDOW_MS
  let drop = 0
  while (drop + 1 < samples.length && samples[drop + 1].t <= start) drop++
  if (drop > 0) samples.splice(0, drop)
  return samples
}

/**
 * Average pointer velocity (px/s) over the VELOCITY_WINDOW_MS before `now`. The pointer is taken
 * to have stayed at the newest sample since it was recorded (a still pointer fires no
 * pointermove), so time spent holding still before the release counts against the velocity: a
 * full window of stillness gives 0, and a slowdown just before the release lowers it. `samples`
 * must be in time order, starting with the press.
 */
export function releaseVelocity(samples: readonly PointerSample[], now: number): { vx: number; vy: number } {
  if (samples.length < 2) return { vx: 0, vy: 0 }
  const latest = samples[samples.length - 1]
  const start = now - VELOCITY_WINDOW_MS
  if (latest.t <= start) return { vx: 0, vy: 0 }

  // Pointer position at the start of the window, or the press if the drag is younger than that.
  let from: { x: number; y: number }
  let fromT: number
  if (start <= samples[0].t) {
    from = samples[0]
    fromT = samples[0].t
  } else {
    let i = 0
    while (samples[i + 1].t <= start) i++
    const a = samples[i]
    const b = samples[i + 1]
    const f = (start - a.t) / (b.t - a.t)
    from = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    fromT = start
  }

  const dt = Math.max(1, now - fromT) / 1000
  return { vx: (latest.x - from.x) / dt, vy: (latest.y - from.y) / dt }
}

/** Velocity after `dt` seconds of glide. */
export function decayVelocity(v: number, dt: number): number {
  return v * Math.pow(INERTIA_DECAY, dt * 60)
}

/** True once a glide at this velocity has less than MIN_REMAINING_TRAVEL_PX left to travel. */
export function glideHasSettled(vx: number, vy: number): boolean {
  return Math.hypot(vx, vy) * INERTIA_TIME_CONSTANT < MIN_REMAINING_TRAVEL_PX
}
