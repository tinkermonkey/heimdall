import { useCallback, useEffect, useRef } from 'react'
import { galaxySimulationStep, type GalaxyLayoutNode, type GalaxyLayoutEdge, type GalaxyLayoutOptions } from '../utils/galaxyLayout'

export interface UseGalaxySimulationOptions {
  /** Only ticks while true — GraphCanvas passes `liveSimulation && layout === 'galaxy'`. Flipping
   *  this off (or the component unmounting) cancels any in-flight animation frame and leaves
   *  whatever the last live frame produced exactly as it was — nothing reverts to a fresh static
   *  layout on its own. */
  active: boolean
  nodes: GalaxyLayoutNode[]
  edges: GalaxyLayoutEdge[]
  options?: GalaxyLayoutOptions
  /** Called with the updated positions once per animation frame — at most one commit per frame
   *  regardless of how many times `nodes` changed since the last one, same coalescing usePanZoom's
   *  own inertia loop already relies on. */
  onTick: (positions: Map<string, { x: number; y: number }>) => void
  /** Seeds the very first frame when the simulation (re)activates, so turning live mode on starts
   *  from whatever's already on screen instead of an initial snap/jump. Falls back to computing a
   *  fresh settled layout itself if omitted or empty. */
  initialPositions?: Map<string, { x: number; y: number }>
}

export interface UseGalaxySimulationReturn {
  /** Call after changing something the simulation should react to — most importantly, every
   *  `dragPositions` update while a node is being live-dragged. A no-op while `active` is false.
   *  Resets the idle/convergence counter and, if the loop had already gone idle (no frame
   *  pending), immediately schedules one — nothing else polls for that once the loop has
   *  genuinely stopped ticking. */
  wake: () => void
}

// A tick below this per-node movement (px) doesn't count toward "still moving" — both for
// deciding when to stop scheduling frames, and as a free signal that nothing could have created
// new overlap this frame, so separationPass can be skipped too.
const SETTLE_EPSILON = 0.15
// ~0.5s at 60fps of sustained near-zero movement before the loop stops scheduling frames.
const IDLE_FRAMES_THRESHOLD = 30

/**
 * Drives a continuous, self-scheduling requestAnimationFrame loop over galaxySimulationStep —
 * the "live" counterpart to galaxyLayout's bounded one-shot settle loop. Mirrors usePanZoom's own
 * inertia-loop pattern: inputs are read from a ref (synced by a lightweight effect) rather than
 * being dependencies of the loop-owning effect, so per-frame input changes (a node being dragged)
 * never tear down and reschedule the loop — they just change what the next tick reads. Commits to
 * React state (via onTick) at most once per animation frame, never per input change.
 */
export function useGalaxySimulation({
  active,
  nodes,
  edges,
  options,
  onTick,
  initialPositions,
}: UseGalaxySimulationOptions): UseGalaxySimulationReturn {
  const inputsRef = useRef({ nodes, edges, options })
  const onTickRef = useRef(onTick)
  const positionsRef = useRef<Map<string, { x: number; y: number }> | undefined>(undefined)
  const rafRef = useRef<number | null>(null)
  const idleFramesRef = useRef(0)

  useEffect(() => {
    inputsRef.current = { nodes, edges, options }
  }, [nodes, edges, options])

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  const tick = useCallback(() => {
    const { nodes: n, edges: e, options: o } = inputsRef.current
    const prev = positionsRef.current
    const next = galaxySimulationStep(n, e, prev, o)

    let maxDelta = 0
    if (prev) {
      for (const [id, p] of next) {
        const before = prev.get(id)
        if (!before) continue
        const d = Math.hypot(p.x - before.x, p.y - before.y)
        if (d > maxDelta) maxDelta = d
      }
    } else {
      maxDelta = Infinity // first frame always counts as motion
    }

    positionsRef.current = next
    onTickRef.current(next)

    idleFramesRef.current = maxDelta < SETTLE_EPSILON ? idleFramesRef.current + 1 : 0

    if (idleFramesRef.current >= IDLE_FRAMES_THRESHOLD) {
      rafRef.current = null
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const wake = useCallback(() => {
    idleFramesRef.current = 0
    if (rafRef.current === null && active) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [active, tick])

  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    positionsRef.current = initialPositions && initialPositions.size > 0
      ? new Map(initialPositions)
      : undefined
    idleFramesRef.current = 0
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
    // Deliberately depends on `active` only — nodes/edges/options/initialPositions are read live
    // via inputsRef each tick (see above), so a change to any of them shouldn't tear down and
    // reschedule the whole loop, just change what the next already-running tick reads.
  }, [active])

  return { wake }
}
