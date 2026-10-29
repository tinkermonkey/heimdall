import { useCallback, useEffect, useRef, useState } from 'react'
import { decayVelocity, glideHasSettled, pruneSamples, releaseVelocity, type PointerSample } from '../utils/panInertia'

export interface UsePanZoomOptions {
  minZoom?: number
  maxZoom?: number
  bounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void
  /**
   * The element to zoom/pan from wheel and pinch-zoom gestures. Required for those to work:
   * React registers onWheel as a passive listener, so calling event.preventDefault() inside a
   * synthetic handler is silently a no-op — the browser's own native scroll/pinch-zoom then
   * fires *alongside* ours, uncoordinated, which is what actually causes the "jumpy, snaps to a
   * random center" symptom (not React state, and not the cursor-anchor math — both were already
   * correct). Wheel handling is instead attached here as a real { passive: false } native
   * listener, which can genuinely suppress the browser default.
   */
  containerRef: React.RefObject<HTMLElement>
  /** Freezes wheel-zoom, drag-to-pan, and the keyboard zoom/pan shortcuts. Doesn't affect
   *  imperative calls (zoomTo/panTo/reset) — those are deliberate actions, not the accidental
   *  scroll/drag input this is meant to guard against. Default false. */
  locked?: boolean
  /**
   * Reports user-driven viewport input only — never zoomTo/panTo/reset. 'start' when a drag-pan
   * presses down (it also stops any running inertia), 'change' for every user-driven write (each
   * drag frame, inertia frame, wheel/pinch event, or keyboard step), and 'end' once that input is
   * at rest: a drag released without inertia, an inertia glide that has run out, or straight after
   * each discrete wheel/keyboard step. A drag released into inertia reports no 'end' until the
   * glide stops, which is once under half a pixel of travel is left. A drag held still for about
   * 100ms before the release has no inertia. Read through a ref, so an inline arrow is fine.
   * GraphCanvas uses this to time onViewportDwell.
   */
  onUserGesture?: (phase: 'start' | 'change' | 'end') => void
}

export interface UsePanZoomReturn {
  transform: string
  viewport: { x: number; y: number; zoom: number }
  bind: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
    tabIndex: number
    role: string
  }
  zoomTo: (zoom: number, x?: number, y?: number) => void
  panTo: (x: number, y: number) => void
  reset: () => void
  /** The current zoom and pan, read from the refs every write lands in synchronously — so it is
   *  already up to date between a write and the render that mirrors it into `viewport`. */
  getViewport: () => { x: number; y: number; zoom: number }
}

const DEFAULT_MIN_ZOOM = 0.25
const DEFAULT_MAX_ZOOM = 4
// Keyboard +/- multiply or divide the zoom by this, so each press is the same relative step at
// any scale (an additive step shrinks to nothing at high zoom and overshoots at low zoom).
const KEY_ZOOM_FACTOR = 1.2
const PAN_STEP = 20

// Wheel-to-zoom sensitivity, ported from d3-zoom's default wheelDelta: zoom scales
// exponentially with deltaY (2^(-deltaY * sensitivity)) instead of jumping a fixed step per
// event regardless of magnitude. That's what makes a light trackpad scroll produce a light
// zoom change — a flat per-event step blows past the target after a couple of the dozens of
// small events one scroll gesture fires. deltaMode distinguishes pixel (0, trackpads and most
// mice), line (1), and page (2) delta units, which otherwise differ by 1-2 orders of magnitude.
// ctrlKey is how browsers report a trackpad pinch gesture over 'wheel'; its deltaY tends to be
// much smaller per event than a scroll's, so it gets amplified to match — also straight from d3.
const WHEEL_PIXEL_SENSITIVITY = 0.002
const WHEEL_LINE_SENSITIVITY = 0.05
const WHEEL_PAGE_SENSITIVITY = 1
const WHEEL_CTRL_MULTIPLIER = 10

function wheelZoomFactor(e: WheelEvent): number {
  const sensitivity =
    e.deltaMode === 1 ? WHEEL_LINE_SENSITIVITY : e.deltaMode === 2 ? WHEEL_PAGE_SENSITIVITY : WHEEL_PIXEL_SENSITIVITY
  const multiplier = e.ctrlKey ? WHEEL_CTRL_MULTIPLIER : 1
  return Math.pow(2, -e.deltaY * sensitivity * multiplier)
}

// The exact point-under-cursor-stays-under-cursor solution for transform matrix(zoom,0,0,zoom,panX,panY)
// (screen = world * zoom + pan): a linear approximation (pan - (cursor/zoom)*Δzoom, used here
// previously) only holds for infinitesimally small Δzoom and drifts visibly as either the step
// size or the distance from zoom=1 grows — this is correct for any zoom change.
function anchoredPan(
  cx: number,
  cy: number,
  prevZoom: number,
  nextZoom: number,
  prevPan: { x: number; y: number }
): { x: number; y: number } {
  const ratio = nextZoom / prevZoom
  return {
    x: cx - ratio * (cx - prevPan.x),
    y: cy - ratio * (cy - prevPan.y),
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function usePanZoom({
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  bounds,
  onViewportChange,
  containerRef,
  locked = false,
  onUserGesture,
}: UsePanZoomOptions): UsePanZoomReturn {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // zoomRef/panRef are the source of truth; zoom/pan state only mirrors them for rendering.
  // Every write lands in the ref synchronously, so input events that arrive before the next
  // commit compound on each other instead of all reading the same stale base and dropping all
  // but the last (tinkermonkey/heimdall#306).
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  // Read from input handlers instead of taking `locked` as a dependency — those handlers
  // (attached as a native listener, or otherwise expensive to reattach) shouldn't need to be
  // torn down and recreated just because lock was toggled.
  const lockedRef = useRef(locked)
  useEffect(() => {
    lockedRef.current = locked
  }, [locked])
  // `samples` holds the press and the recent pointer positions, for the release velocity.
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number; samples: PointerSample[] } | null>(null)
  const listenersAttachedRef = useRef(false)
  const handlePointerMoveRef = useRef<(e: PointerEvent) => void>()
  const handlePointerUpRef = useRef<() => void>()
  // Wheel and keyboard input write zoomRef/panRef at event time and share one rAF that flushes
  // the refs to state: whichever fires first schedules it, and the flush picks up everything
  // written since, so no input source can cancel another's pending update. The drag rAF is
  // separate because it computes its pan inside the frame.
  const dragRafRef = useRef<number | null>(null)
  const flushRafRef = useRef<number | null>(null)
  const inertiaRafRef = useRef<number | null>(null)

  const commitZoom = useCallback((next: number) => {
    zoomRef.current = next
    setZoom(next)
  }, [])

  const commitPan = useCallback((next: { x: number; y: number }) => {
    panRef.current = next
    setPan(next)
  }, [])

  // Copies zoomRef/panRef to state on the next frame, at most once per frame.
  const scheduleFlush = useCallback(() => {
    if (flushRafRef.current !== null) return
    flushRafRef.current = requestAnimationFrame(() => {
      flushRafRef.current = null
      setZoom(zoomRef.current)
      setPan(panRef.current)
    })
  }, [])

  // Every viewport change except a drag stops a running inertia glide. The glide writes pan
  // every frame, so left running it overwrites a zoom's anchored pan with one meant for the old
  // zoom, and the zoom pivots around the wrong point (tinkermonkey/heimdall#306).
  const cancelInertia = useCallback(() => {
    if (inertiaRafRef.current !== null) {
      cancelAnimationFrame(inertiaRafRef.current)
      inertiaRafRef.current = null
    }
  }, [])

  // Notify viewport changes. The callback is read through a ref so a new function identity
  // (an inline arrow in the caller) doesn't re-fire it: a caller that sets state from it would
  // otherwise re-render, pass a new callback, and loop forever.
  const onViewportChangeRef = useRef(onViewportChange)
  onViewportChangeRef.current = onViewportChange
  // Same ref idiom: the input handlers below call this without depending on its identity.
  const onUserGestureRef = useRef(onUserGesture)
  onUserGestureRef.current = onUserGesture
  const reportGesture = useCallback((phase: 'start' | 'change' | 'end') => {
    onUserGestureRef.current?.(phase)
  }, [])
  useEffect(() => {
    onViewportChangeRef.current?.({ x: pan.x, y: pan.y, zoom })
  }, [pan, zoom])

  const clampPan = useCallback(
    (panX: number, panY: number): { x: number; y: number } => {
      if (!bounds) return { x: panX, y: panY }

      const minPanX = -bounds.maxX * zoomRef.current
      const maxPanX = -bounds.minX * zoomRef.current
      const minPanY = -bounds.maxY * zoomRef.current
      const maxPanY = -bounds.minY * zoomRef.current

      return {
        x: Math.max(minPanX, Math.min(maxPanX, panX)),
        y: Math.max(minPanY, Math.min(maxPanY, panY)),
      }
    },
    [bounds]
  )

  const stableHandlePointerMove = useCallback((e: PointerEvent) => {
    handlePointerMoveRef.current?.(e)
  }, [])

  const stableHandlePointerUp = useCallback(() => {
    handlePointerUpRef.current?.()
  }, [])

  const attachListeners = useCallback(() => {
    if (listenersAttachedRef.current) return
    document.addEventListener('pointermove', stableHandlePointerMove)
    document.addEventListener('pointerup', stableHandlePointerUp)
    listenersAttachedRef.current = true
  }, [stableHandlePointerMove, stableHandlePointerUp])

  const detachListeners = useCallback(() => {
    if (!listenersAttachedRef.current) return
    document.removeEventListener('pointermove', stableHandlePointerMove)
    document.removeEventListener('pointerup', stableHandlePointerUp)
    listenersAttachedRef.current = false
  }, [stableHandlePointerMove, stableHandlePointerUp])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return

    const now = performance.now()
    const samples = dragRef.current.samples
    samples.push({ x: e.clientX, y: e.clientY, t: now })
    pruneSamples(samples, now)

    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current)
    }

    dragRafRef.current = requestAnimationFrame(() => {
      if (!dragRef.current) return

      const newPan = clampPan(
        dragRef.current.panX + (e.clientX - dragRef.current.x),
        dragRef.current.panY + (e.clientY - dragRef.current.y)
      )

      commitPan(newPan)
      dragRafRef.current = null
      reportGesture('change')
    })
  }, [clampPan, commitPan, reportGesture])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) {
      detachListeners()
      return
    }

    const shouldReduceMotion = prefersReducedMotion()
    // Averaged over the last moments of the drag, counting any time the pointer was held still,
    // so a drag that came to rest before the release doesn't fling (#321).
    const { vx, vy } = releaseVelocity(dragRef.current.samples, performance.now())

    dragRef.current = null
    detachListeners()

    if (shouldReduceMotion || glideHasSettled(vx, vy)) {
      reportGesture('end')
      return
    }

    let currentVx = vx
    let currentVy = vy
    let lastFrameTime = performance.now()

    const animate = () => {
      const now = performance.now()
      const dt = (now - lastFrameTime) / 1000
      lastFrameTime = now

      currentVx = decayVelocity(currentVx, dt)
      currentVy = decayVelocity(currentVy, dt)

      // Stop once under half a pixel of travel is left rather than at a near-zero speed, so
      // 'end' (and onViewportDwell) tracks when the view visibly stops (#320).
      if (glideHasSettled(currentVx, currentVy)) {
        inertiaRafRef.current = null
        reportGesture('end')
        return
      }

      // Steps from panRef rather than a pan captured at release, so a drag frame that lands
      // after the release isn't undone.
      commitPan(clampPan(panRef.current.x + currentVx * dt, panRef.current.y + currentVy * dt))
      reportGesture('change')

      inertiaRafRef.current = requestAnimationFrame(animate)
    }

    inertiaRafRef.current = requestAnimationFrame(animate)
  }, [detachListeners, clampPan, commitPan, reportGesture])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (lockedRef.current) return
    cancelInertia()

    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
      samples: [{ x: e.clientX, y: e.clientY, t: performance.now() }],
    }
    attachListeners()
    reportGesture('start')
  }, [attachListeners, cancelInertia, reportGesture])

  // Keep refs in sync with the current implementations
  useEffect(() => {
    handlePointerMoveRef.current = handlePointerMove
  }, [handlePointerMove])

  useEffect(() => {
    handlePointerUpRef.current = handlePointerUp
  }, [handlePointerUp])

  // Cleanup listeners and animations on unmount
  useEffect(() => {
    return () => {
      detachListeners()
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current)
      }
      if (flushRafRef.current !== null) {
        cancelAnimationFrame(flushRafRef.current)
      }
      cancelInertia()
    }
  }, [detachListeners, cancelInertia])

  // Native WheelEvent, not React.WheelEvent — this is attached directly via addEventListener
  // below (with { passive: false }) rather than as a React onWheel prop, specifically so
  // preventDefault() actually works. See UsePanZoomOptions.containerRef for why.
  const handleWheel = useCallback((e: WheelEvent) => {
    if (lockedRef.current) return
    e.preventDefault()

    const container = e.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return

    cancelInertia()
    const prev = zoomRef.current
    const next = Math.min(maxZoom, Math.max(minZoom, prev * wheelZoomFactor(e)))
    const anchored = anchoredPan(cx, cy, prev, next, panRef.current)
    // zoomRef first: clampPan scales the bounds by it, and they should be the new zoom's.
    zoomRef.current = next
    panRef.current = clampPan(anchored.x, anchored.y)
    scheduleFlush()
    reportGesture('change')
    reportGesture('end')
  }, [clampPan, minZoom, maxZoom, cancelInertia, scheduleFlush, reportGesture])

  // A real, non-passive native listener — see UsePanZoomOptions.containerRef.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [containerRef, handleWheel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (lockedRef.current) return
      const key = e.key
      let nextZoom: number | null = null
      let nextPan: { x: number; y: number } | null = null

      if (key === '+' || key === '=') {
        nextZoom = Math.min(maxZoom, zoomRef.current * KEY_ZOOM_FACTOR)
      } else if (key === '-' || key === '_') {
        nextZoom = Math.max(minZoom, zoomRef.current / KEY_ZOOM_FACTOR)
      } else if (key === 'ArrowUp') {
        nextPan = { x: panRef.current.x, y: panRef.current.y + PAN_STEP }
      } else if (key === 'ArrowDown') {
        nextPan = { x: panRef.current.x, y: panRef.current.y - PAN_STEP }
      } else if (key === 'ArrowLeft') {
        nextPan = { x: panRef.current.x + PAN_STEP, y: panRef.current.y }
      } else if (key === 'ArrowRight') {
        nextPan = { x: panRef.current.x - PAN_STEP, y: panRef.current.y }
      } else {
        return
      }

      e.preventDefault()
      cancelInertia()
      if (nextZoom !== null) {
        // Anchored at the container centre, like GraphCanvas's toolbar zoom buttons, so the
        // middle of the view stays put (tinkermonkey/heimdall#302).
        const container = containerRef.current
        const cx = container ? container.clientWidth / 2 : 0
        const cy = container ? container.clientHeight / 2 : 0
        nextPan = anchoredPan(cx, cy, zoomRef.current, nextZoom, panRef.current)
        zoomRef.current = nextZoom
      }
      if (nextPan !== null) {
        panRef.current = clampPan(nextPan.x, nextPan.y)
      }
      scheduleFlush()
      reportGesture('change')
      reportGesture('end')
    },
    [clampPan, minZoom, maxZoom, containerRef, cancelInertia, scheduleFlush, reportGesture]
  )

  const zoomTo = useCallback(
    (targetZoom: number, cx?: number, cy?: number) => {
      cancelInertia()
      const clamped = Math.min(maxZoom, Math.max(minZoom, targetZoom))
      const prev = zoomRef.current

      commitZoom(clamped)

      if (cx !== undefined && cy !== undefined) {
        const anchored = anchoredPan(cx, cy, prev, clamped, panRef.current)
        commitPan(clampPan(anchored.x, anchored.y))
      }
    },
    [clampPan, minZoom, maxZoom, cancelInertia, commitZoom, commitPan]
  )

  const panTo = useCallback(
    (x: number, y: number) => {
      cancelInertia()
      commitPan(clampPan(x, y))
    },
    [clampPan, cancelInertia, commitPan]
  )

  const reset = useCallback(() => {
    cancelInertia()
    commitZoom(1)
    commitPan({ x: 0, y: 0 })
  }, [cancelInertia, commitZoom, commitPan])

  const getViewport = useCallback(
    () => ({ x: panRef.current.x, y: panRef.current.y, zoom: zoomRef.current }),
    []
  )

  // matrix(a, b, c, d, e, f) represents:
  // | a  c  e |
  // | b  d  f |
  // | 0  0  1 |
  // For translate(x, y) scale(z), we get: matrix(z, 0, 0, z, x, y)
  const transform = `matrix(${zoom}, 0, 0, ${zoom}, ${pan.x}, ${pan.y})`

  return {
    transform,
    viewport: { x: pan.x, y: pan.y, zoom },
    bind: {
      onPointerDown: handlePointerDown,
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      role: 'region',
    },
    zoomTo,
    panTo,
    reset,
    getViewport,
  }
}
