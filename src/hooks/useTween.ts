import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useMediaQuery } from './useMediaQuery'

/** Cubic ease-in-out: slow start, slow finish. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Each key of `from` moved toward `to` by eased progress `e` (keys missing from `to` stay put). */
export function interpolateValues<T extends Record<string, number>>(from: T, to: Partial<T>, e: number): T {
  const out = { ...from }
  for (const k in to) {
    const b = to[k]
    if (b === undefined) continue
    const a = from[k]
    ;(out as Record<string, number>)[k] = a + (b - a) * e
  }
  return out
}

export interface TweenOptions {
  /** Milliseconds. Default 750 (camera moves: 600–900). */
  duration?: number
  easing?: (t: number) => number
  /** Called once, after the final frame. Not called when the tween is cancelled or replaced. */
  onDone?: () => void
}

export interface TweenControls<T extends Record<string, number>> {
  /**
   * Animates from `from` to `to`, calling `onFrame` with the values once per animation frame and
   * with `done: true` on the last. Starting again replaces a running tween. Under
   * `prefers-reduced-motion: reduce` (or `duration <= 0`) it jumps: one `onFrame(to, true)` call,
   * synchronously.
   */
  start: (from: T, to: Partial<T>, options?: TweenOptions) => void
  /** Stops a running tween where it is (call on user interaction: drag, wheel). */
  cancel: () => void
  /** Whether a tween is running. */
  isActive: () => boolean
  /** Whether the user prefers reduced motion. */
  reducedMotion: boolean
}

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** Whether the user asked for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY)
}

/**
 * One shared tween runner for camera and layout moves: ease-in-out, requestAnimationFrame-driven,
 * cancelled by the caller on interaction, and a jump under reduced motion. Values are plain
 * numbers; the caller owns where they go (usually a ref, then a repaint), so a tween re-renders
 * only what `onFrame` touches.
 */
export function useTween<T extends Record<string, number>>(onFrame: (values: T, done: boolean) => void): TweenControls<T> {
  const reducedMotion = usePrefersReducedMotion()
  const reducedRef = useRef(reducedMotion)
  reducedRef.current = reducedMotion
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame
  const rafRef = useRef<number | null>(null)

  const cancel = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  const start = useCallback(
    (from: T, to: Partial<T>, options: TweenOptions = {}) => {
      cancel()
      const duration = options.duration ?? 750
      const target = interpolateValues(from, to, 1)
      if (reducedRef.current || duration <= 0) {
        onFrameRef.current(target, true)
        options.onDone?.()
        return
      }
      const ease = options.easing ?? easeInOutCubic
      let t0: number | null = null
      const step = (now: number) => {
        if (t0 === null) t0 = now
        const t = Math.min(1, (now - t0) / duration)
        const done = t >= 1
        onFrameRef.current(done ? target : interpolateValues(from, to, ease(t)), done)
        if (done) {
          rafRef.current = null
          options.onDone?.()
        } else {
          rafRef.current = requestAnimationFrame(step)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    },
    [cancel],
  )

  const isActive = useCallback(() => rafRef.current !== null, [])

  useEffect(() => cancel, [cancel])

  return useMemo(() => ({ start, cancel, isActive, reducedMotion }), [start, cancel, isActive, reducedMotion])
}
