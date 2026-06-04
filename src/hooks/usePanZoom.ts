import { useCallback, useEffect, useRef, useState } from 'react'

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
}

export interface UsePanZoomReturn {
  transform: string
  viewport: { x: number; y: number; zoom: number }
  bind: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void
    onWheel: (e: React.WheelEvent<HTMLElement>) => void
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
    tabIndex: number
    role: string
  }
  zoomTo: (zoom: number, x?: number, y?: number) => void
  panTo: (x: number, y: number) => void
  reset: () => void
}

const DEFAULT_MIN_ZOOM = 0.25
const DEFAULT_MAX_ZOOM = 4
const ZOOM_STEP = 0.1
const PAN_STEP = 20

export function usePanZoom({
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  bounds,
  onViewportChange,
}: UsePanZoomOptions = {}): UsePanZoomReturn {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const listenersAttachedRef = useRef(false)
  const handlePointerMoveRef = useRef<(e: PointerEvent) => void>()
  const handlePointerUpRef = useRef<() => void>()

  // Keep refs current for event handlers
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    panRef.current = pan
  }, [pan])

  // Notify viewport changes
  useEffect(() => {
    onViewportChange?.({ x: pan.x, y: pan.y, zoom })
  }, [pan, zoom, onViewportChange])

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

    const newPan = clampPan(
      dragRef.current.panX + (e.clientX - dragRef.current.x),
      dragRef.current.panY + (e.clientY - dragRef.current.y)
    )

    setPan(newPan)
  }, [clampPan])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
    detachListeners()
  }, [detachListeners])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    }
    attachListeners()
  }, [attachListeners])

  // Keep refs in sync with the current implementations
  useEffect(() => {
    handlePointerMoveRef.current = handlePointerMove
  }, [handlePointerMove])

  useEffect(() => {
    handlePointerUpRef.current = handlePointerUp
  }, [handlePointerUp])

  // Cleanup listeners on unmount if they were attached
  useEffect(() => {
    return () => {
      detachListeners()
    }
  }, [detachListeners])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLElement>) => {
    e.preventDefault()

    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const prev = zoomRef.current
    const next = Math.min(maxZoom, Math.max(minZoom, prev + delta))
    const change = next - prev

    const newPan = clampPan(
      panRef.current.x - (cx / prev) * change,
      panRef.current.y - (cy / prev) * change
    )

    setZoom(next)
    setPan(newPan)
  }, [clampPan, minZoom, maxZoom])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const key = e.key

      if (key === '+' || key === '=') {
        e.preventDefault()
        const next = Math.min(maxZoom, zoomRef.current + ZOOM_STEP)
        setZoom(next)
      } else if (key === '-' || key === '_') {
        e.preventDefault()
        const next = Math.max(minZoom, zoomRef.current - ZOOM_STEP)
        setZoom(next)
      } else if (key === 'ArrowUp') {
        e.preventDefault()
        const newPan = clampPan(panRef.current.x, panRef.current.y + PAN_STEP)
        setPan(newPan)
      } else if (key === 'ArrowDown') {
        e.preventDefault()
        const newPan = clampPan(panRef.current.x, panRef.current.y - PAN_STEP)
        setPan(newPan)
      } else if (key === 'ArrowLeft') {
        e.preventDefault()
        const newPan = clampPan(panRef.current.x + PAN_STEP, panRef.current.y)
        setPan(newPan)
      } else if (key === 'ArrowRight') {
        e.preventDefault()
        const newPan = clampPan(panRef.current.x - PAN_STEP, panRef.current.y)
        setPan(newPan)
      }
    },
    [clampPan, minZoom, maxZoom]
  )

  const zoomTo = useCallback(
    (targetZoom: number, cx?: number, cy?: number) => {
      const clamped = Math.min(maxZoom, Math.max(minZoom, targetZoom))
      const prev = zoomRef.current
      const change = clamped - prev

      if (cx !== undefined && cy !== undefined) {
        const newPan = clampPan(
          panRef.current.x - (cx / prev) * change,
          panRef.current.y - (cy / prev) * change
        )
        setPan(newPan)
      }

      setZoom(clamped)
    },
    [clampPan, minZoom, maxZoom]
  )

  const panTo = useCallback(
    (x: number, y: number) => {
      const newPan = clampPan(x, y)
      setPan(newPan)
    },
    [clampPan]
  )

  const reset = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

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
      onWheel: handleWheel,
      onKeyDown: handleKeyDown,
      tabIndex: 0,
      role: 'region',
    },
    zoomTo,
    panTo,
    reset,
  }
}
