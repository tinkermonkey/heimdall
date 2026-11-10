import React, { useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GraphEdge, GraphNodeData } from './GraphCanvas'
import { LayeredGraphContext, useLayeredGraph, type LayeredGraphState, type UseLayeredGraphOptions } from '../hooks/useLayeredGraph'
import { useControllable } from '../hooks/useControllable'
import { useTween } from '../hooks/useTween'
import { lineCurve, placeEdgeLabels, edgeLabelPriority, type EdgeLabelCandidate, type LabelBox } from '../utils/layered/edgeLabels'
import { arrowHeadPoints, linkPredicateLabel } from '../utils/layered/labels'
import { mixLayerPositions } from '../utils/layered/layout'
import { visiblePredicates } from '../utils/layered/filters'
import {
  CAMERA_PRESETS,
  TOP_VIEW_PITCH,
  cameraFromPreset,
  clampCamera,
  createProjector,
  depthSort,
  fitZoom,
  leftmostPoint,
  nearestYaw,
  planeCorners,
  planeGridLines,
  ringPoints,
  stackPlaneY,
  svgPoints,
  titleRail,
  type CameraPresetName,
  type ProjectedPoint,
  type StackCamera,
  type Vec3,
} from '../utils/layered/projection'
import type { Point } from '../utils/graph'
import type { BuildLayeredIndexOptions, IndexedNode } from '../utils/layered/types'
import './LayerStack.css'

/** Which direct manipulation the scene accepts. Every kind defaults to on. */
export interface LayerStackInteractions {
  /** Click a node to select it (again to clear), click the background to clear. */
  select?: boolean
  /** Hovering a node shows its label and sets the graph's hovered node. */
  hover?: boolean
  /** Drag to orbit. */
  orbit?: boolean
  /** Wheel zoom while the scene has focus. */
  zoom?: boolean
  /** Click a plane title to focus its layer (again to exit). */
  focusLayer?: boolean
}

/** `all`: every node not dimmed. `reached`: the selection, its reach and the hovered node. `none`: only the hovered or keyboard-focused node. */
export type LayerStackNodeLabels = 'all' | 'reached' | 'none'

/** What moved the camera, passed to `onCameraChange`. */
export type LayerStackCameraCause = 'orbit' | 'zoom' | 'preset' | 'focus' | 'fit' | 'turntable' | 'api'

export interface LayerStackMoveOptions {
  /** Tween the move (600–900 ms ease-in-out; a jump under reduced motion). Default true. */
  animate?: boolean
}

/** Imperative handle (`ref`). */
export interface LayerStackHandle {
  /** Moves to a camera preset (angles, zoom and layer gap), animated, and exits layer focus. */
  applyPreset: (name: CameraPresetName, options?: LayerStackMoveOptions) => void
  /** Sets any camera fields; the rest stay. Clears the preset. */
  setCamera: (camera: Partial<StackCamera>, options?: LayerStackMoveOptions) => void
  /** The camera as it is now (mid-tween included). */
  getCamera: () => StackCamera
  /** The layer gap as it is now (mid-tween included), world units. */
  getLayerGap: () => number
  /** Multiplies the zoom (clamped to 0.4–3), animated. */
  zoomBy: (factor: number) => void
  /** Zooms and re-centers so every visible plane fits the scene. */
  fit: () => void
  setTurntable: (on: boolean) => void
  /** Focuses a layer (null exits), through the graph state. */
  focusLayer: (layerId: string | null) => void
  /** Selects a node (null clears), through the graph state. */
  select: (id: string | null) => void
  setFollow: (follow: number) => void
  /** The scene's root element. */
  element: () => HTMLDivElement | null
}

export interface LayerStackProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** State from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`, else the stack builds its own from `nodes`, `edges` and `layering`. */
  graph?: LayeredGraphState
  /** Standalone data (ignored when `graph` or a context is present). */
  nodes?: readonly GraphNodeData[]
  edges?: readonly GraphEdge[]
  /** Standalone layering (ignored when `graph` or a context is present). Memoize it. */
  layering?: BuildLayeredIndexOptions
  /** Standalone options passed to `useLayeredGraph` (selection, follow, filters, focus, plane layout). */
  graphOptions?: Omit<UseLayeredGraphOptions, 'nodes' | 'edges' | 'layering'>

  /** Camera preset (controlled). A new value animates to it; `null` once the camera is moved by hand. */
  cameraPreset?: CameraPresetName | null
  /** Initial preset when uncontrolled. Default `stack`. */
  defaultCameraPreset?: CameraPresetName
  onCameraPresetChange?: (preset: CameraPresetName | null) => void

  /** Camera (controlled). A changed value is applied at once. Fields left out keep their value. */
  camera?: Partial<StackCamera>
  /** Initial camera fields when uncontrolled, over the initial preset. */
  defaultCamera?: Partial<StackCamera>
  /**
   * Called when a camera move settles (drag release, end of a tween, a wheel pause, turntable
   * stop), not on every frame, so chrome that shows the camera doesn't re-render while it moves.
   */
  onCameraChange?: (camera: StackCamera, cause: LayerStackCameraCause) => void

  /** Slow continuous yaw (controlled). Off under reduced motion; turns off when the user orbits. */
  turntable?: boolean
  defaultTurntable?: boolean
  onTurntableChange?: (on: boolean) => void
  /** Turntable speed, radians per second. Default 0.27. */
  turntableSpeed?: number

  /** Vertical distance between planes, world units (controlled). A changed value is applied at once. */
  layerGap?: number
  /** Initial gap when uncontrolled. Default: the initial preset's (170 for `stack`). */
  defaultLayerGap?: number
  onLayerGapChange?: (gap: number) => void

  /** Which node labels to show. Default: the graph's `nodeLabels` state, `all` when on and `reached` when off. */
  nodeLabels?: LayerStackNodeLabels
  /** Turn direct manipulation off per kind. */
  interactions?: LayerStackInteractions

  /** Scene coordinate size (viewBox), which also sets the aspect ratio. Default 1160 × 780. */
  sceneWidth?: number
  sceneHeight?: number
  /** Half-width of every plane, world units; in-plane layout positions ([-1, 1]) scale to it. Default 300. */
  planeSize?: number
}

const EMPTY_NODES: GraphNodeData[] = []
const EMPTY_EDGES: GraphEdge[] = []
const EMPTY_LAYERING: BuildLayeredIndexOptions = { layerBy: '' }
const ALL_INTERACTIONS: Required<LayerStackInteractions> = { select: true, hover: true, orbit: true, zoom: true, focusLayer: true }

/**
 * Screen offset of the stack's axis: right, for plane titles on the left; and up when the stack is
 * tilted (most at 45°, none side-on or top-down), where the near corners of the lowest plane would
 * otherwise leave the frame. A focused plane is centered, so the lift fades out with the focus.
 */
function axisOffset(pitch: number, focusAmt: number) {
  return { offsetX: 60, offsetY: -50 * Math.sin(2 * pitch) * (1 - focusAmt) }
}
/** Planes above and below a focused layer move this far apart. */
const FOCUS_PUSH = 150
/** Camera while a layer is focused: tilted toward the plane and closer. */
const FOCUS_PITCH = 0.95
const FOCUS_ZOOM = 1.12
const CAMERA_MS = 750
const LAYOUT_MS = 900
const ZOOM_MS = 180
const DRAG_THRESHOLD = 4
const ORBIT_YAW_PER_PX = 0.0075
const ORBIT_PITCH_PER_PX = 0.006
const NODE_PLANE_INSET = 0.98

interface ViewState {
  yaw: number
  pitch: number
  zoom: number
  targetY: number
  gap: number
  /** 0..1: how far planes around the focused layer are pushed apart. */
  focusAmt: number
  /** 0 = independent layout, 1 = coupled. */
  mix: number
}
type ViewKey = keyof ViewState

const r1 = (v: number) => Math.round(v * 10) / 10
const r2 = (v: number) => Math.round(v * 100) / 100
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const nodeRadius = (n: IndexedNode) => 3.2 + Math.sqrt(n.degree) * 1.5

function cameraOf(v: ViewState): StackCamera {
  return { yaw: v.yaw, pitch: v.pitch, zoom: v.zoom, targetY: v.targetY }
}

function pick(v: ViewState, keys: readonly ViewKey[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const k of keys) out[k] = v[k]
  return out
}

/** Positions for a graph built without layout: each layer's nodes on a circle. */
function circlePositions(nodesByLayer: ReadonlyMap<string, readonly IndexedNode[]>): Map<string, Point> {
  const out = new Map<string, Point>()
  for (const group of nodesByLayer.values()) {
    group.forEach((n, i) => {
      if (group.length === 1) return out.set(n.id, { x: 0, y: 0 })
      const t = (i / group.length) * Math.PI * 2
      out.set(n.id, { x: Math.cos(t) * 0.75, y: Math.sin(t) * 0.75 })
    })
  }
  return out
}

/**
 * The layered graph as a 3D stack: one translucent plane per layer, nodes as layer-coloured discs
 * sized by degree, intra-layer links on their plane and cross-layer links between planes. A
 * selection lights its reach (the framework's follow rule) and adds a drill-through column, a
 * dashed vertical through every plane at the node's position with a ring on each other plane.
 * Labels, plane titles and predicate pills sit in an HTML overlay, upright and crisp at any angle;
 * node labels are focusable buttons (arrow keys move within and between layers).
 *
 * Drawn as SVG with a perspective projection (`projection.ts`): camera state lives in refs and
 * only the projected geometry recomputes per frame. Camera, turntable and layer gap are props with
 * `on…Change` callbacks and uncontrolled defaults; the `ref` handle drives them imperatively.
 */
export const LayerStack = React.forwardRef<LayerStackHandle, LayerStackProps>(
  (
    {
      graph,
      nodes,
      edges,
      layering,
      graphOptions,
      cameraPreset,
      defaultCameraPreset = 'stack',
      onCameraPresetChange,
      camera,
      defaultCamera,
      onCameraChange,
      turntable,
      defaultTurntable = false,
      onTurntableChange,
      turntableSpeed = 0.27,
      layerGap,
      defaultLayerGap,
      onLayerGapChange,
      nodeLabels: nodeLabelsProp,
      interactions,
      sceneWidth = 1160,
      sceneHeight = 780,
      planeSize = 300,
      className = '',
      style,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const ctx = useContext(LayeredGraphContext)
    const external = graph ?? ctx
    const own = useLayeredGraph(
      external
        ? { nodes: EMPTY_NODES, edges: EMPTY_EDGES, layering: EMPTY_LAYERING, layout: false }
        : { ...graphOptions, nodes: nodes ?? EMPTY_NODES, edges: edges ?? EMPTY_EDGES, layering: layering ?? EMPTY_LAYERING },
    )
    const g = external ?? own
    const { index, layout, filters, selectedId, hoveredId, focusedLayerId, planeLayout } = g
    const can = { ...ALL_INTERACTIONS, ...interactions }
    const nodeLabels: LayerStackNodeLabels = nodeLabelsProp ?? (g.nodeLabels !== false ? 'all' : 'reached')

    // ── controllable state ────────────────────────────────────────────────
    const [preset, setPreset] = useControllable<CameraPresetName | null>(cameraPreset, defaultCameraPreset, onCameraPresetChange)
    const [turntableOn, setTurntable] = useControllable(turntable, defaultTurntable, onTurntableChange)

    // ── view state (refs) and repaint ─────────────────────────────────────
    const view = useRef<ViewState | null>(null)
    if (view.current === null) {
      const base = clampCamera({ ...cameraFromPreset(cameraPreset ?? defaultCameraPreset), ...defaultCamera, ...camera })
      const focused = focusedLayerId != null && index.layerById.has(focusedLayerId)
      view.current = {
        ...base,
        ...(focused ? { pitch: FOCUS_PITCH, zoom: FOCUS_ZOOM } : null),
        gap: layerGap ?? defaultLayerGap ?? CAMERA_PRESETS[cameraPreset ?? defaultCameraPreset].layerGap,
        focusAmt: focused ? 1 : 0,
        mix: planeLayout === 'coupled' ? 1 : 0,
      }
    }
    /** The layer the planes open around; kept through the exit tween so planes close eased. */
    const focusLayerRef = useRef<string | null>(focusedLayerId ?? null)
    const [, setFrame] = useState(0)
    const repaintNow = useCallback(() => setFrame((f) => (f + 1) % 1e9), [])
    const pendingRaf = useRef<number | null>(null)
    const repaint = useCallback(() => {
      if (pendingRaf.current !== null) return
      pendingRaf.current = requestAnimationFrame(() => {
        pendingRaf.current = null
        repaintNow()
      })
    }, [repaintNow])
    useEffect(() => () => {
      if (pendingRaf.current !== null) cancelAnimationFrame(pendingRaf.current)
    }, [])

    const onCameraChangeRef = useRef(onCameraChange)
    onCameraChangeRef.current = onCameraChange
    const onLayerGapChangeRef = useRef(onLayerGapChange)
    onLayerGapChangeRef.current = onLayerGapChange
    const emitCamera = useCallback((cause: LayerStackCameraCause) => onCameraChangeRef.current?.(cameraOf(view.current!), cause), [])

    const writeView = useCallback((values: Record<string, number>) => {
      Object.assign(view.current!, values)
    }, [])
    const cameraTween = useTween<Record<string, number>>((values) => {
      writeView(values)
      repaintNow()
    })
    const mixTween = useTween<Record<string, number>>((values) => {
      writeView(values)
      repaintNow()
    })
    // Layer focus and layer gap run on their own tweens, which orbit and zoom never cancel: a drag
    // part-way through a focus exit or a preset still lets the planes settle (and the gap report).
    const focusTween = useTween<Record<string, number>>((values) => {
      writeView(values)
      repaintNow()
    })
    const gapTween = useTween<Record<string, number>>((values) => {
      writeView(values)
      repaintNow()
    })
    const reducedMotion = cameraTween.reducedMotion

    /** Tweens the given view fields from where they are now (or jumps when `animate` is false). */
    const moveView = useCallback(
      (to: Partial<ViewState>, opts: { animate?: boolean; duration?: number; onDone?: () => void } = {}) => {
        const v = view.current!
        const target: Partial<ViewState> = { ...to }
        if (target.yaw !== undefined) target.yaw = nearestYaw(v.yaw, target.yaw)
        if (target.pitch !== undefined || target.zoom !== undefined) {
          const c = clampCamera({ ...cameraOf(v), ...target } as StackCamera)
          if (target.pitch !== undefined) target.pitch = c.pitch
          if (target.zoom !== undefined) target.zoom = c.zoom
        }
        const keys = Object.keys(target) as ViewKey[]
        cameraTween.start(pick(v, keys), target as Record<string, number>, {
          duration: opts.animate === false ? 0 : opts.duration ?? CAMERA_MS,
          onDone: opts.onDone,
        })
      },
      [cameraTween],
    )

    const presetRef = useRef(preset)
    presetRef.current = preset
    const appliedPresetRef = useRef<CameraPresetName | null>(preset)
    const clearPreset = useCallback(() => {
      appliedPresetRef.current = null
      if (presetRef.current !== null) setPreset(null)
    }, [setPreset])

    // ── layer focus ───────────────────────────────────────────────────────
    /**
     * Set by `applyPreset` when it exits focus itself (the commit count at that moment), so the
     * focus effect skips its own exit tween. Dropped after the next commit whatever happened, so a
     * controlled parent that ignores the exit does not leave it armed for a later focus change.
     */
    const skipFocusExit = useRef<number | null>(null)
    const commits = useRef(0)
    const prevFocus = useRef(focusedLayerId)
    useEffect(() => {
      if (prevFocus.current === focusedLayerId) return
      prevFocus.current = focusedLayerId
      const skip = skipFocusExit.current !== null && focusedLayerId == null
      skipFocusExit.current = null
      if (skip) return
      const v = view.current!
      if (focusedLayerId != null && index.layerById.has(focusedLayerId)) {
        const wasOpen = focusLayerRef.current !== null && v.focusAmt > 0
        if (wasOpen && focusLayerRef.current !== focusedLayerId) v.focusAmt = 0
        focusLayerRef.current = focusedLayerId
        clearPreset()
        focusTween.start({ focusAmt: v.focusAmt }, { focusAmt: 1 }, { duration: CAMERA_MS })
        moveView({ pitch: FOCUS_PITCH, zoom: FOCUS_ZOOM }, { onDone: () => emitCamera('focus') })
      } else {
        const s = CAMERA_PRESETS.stack
        focusTween.start(
          { focusAmt: v.focusAmt },
          { focusAmt: 0 },
          {
            duration: CAMERA_MS,
            onDone: () => {
              focusLayerRef.current = null
            },
          },
        )
        moveView({ pitch: s.pitch, zoom: s.zoom }, { onDone: () => emitCamera('focus') })
      }
    }, [focusedLayerId, index, moveView, focusTween, clearPreset, emitCamera])
    // Declared after the focus effect, so it sees the commit after `applyPreset` once that has run.
    useEffect(() => {
      commits.current += 1
      if (skipFocusExit.current !== null && commits.current > skipFocusExit.current) skipFocusExit.current = null
    })

    // ── presets ───────────────────────────────────────────────────────────
    const applyPreset = useCallback(
      (name: CameraPresetName, opts: LayerStackMoveOptions = {}) => {
        const p = CAMERA_PRESETS[name]
        appliedPresetRef.current = name
        if (presetRef.current !== name) setPreset(name)
        if (focusedLayerId != null) {
          skipFocusExit.current = commits.current
          g.focusLayer(null)
        }
        setTurntableRef.current(false)
        const v = view.current!
        const duration = opts.animate === false ? 0 : CAMERA_MS
        focusTween.start(
          { focusAmt: v.focusAmt },
          { focusAmt: 0 },
          {
            duration,
            onDone: () => {
              focusLayerRef.current = null
            },
          },
        )
        gapTween.start({ gap: v.gap }, { gap: p.layerGap }, { duration, onDone: () => onLayerGapChangeRef.current?.(p.layerGap) })
        moveView({ yaw: p.yaw, pitch: p.pitch, zoom: p.zoom, targetY: 0 }, { animate: opts.animate, onDone: () => emitCamera('preset') })
      },
      [focusedLayerId, g, moveView, focusTween, gapTween, setPreset, emitCamera],
    )
    // Only a change of the prop applies a preset (not a re-render with the same value).
    const prevPresetProp = useRef(cameraPreset)
    useEffect(() => {
      if (prevPresetProp.current === cameraPreset) return
      prevPresetProp.current = cameraPreset
      if (cameraPreset == null || cameraPreset === appliedPresetRef.current) return
      applyPreset(cameraPreset)
    }, [cameraPreset, applyPreset])

    // ── controlled camera and gap props ───────────────────────────────────
    const camKey = camera ? [camera.yaw, camera.pitch, camera.zoom, camera.targetY].join('|') : ''
    useEffect(() => {
      if (!camera) return
      const v = view.current!
      const next = clampCamera({ ...cameraOf(v), ...camera })
      const same = (Object.keys(next) as (keyof StackCamera)[]).every((k) => Math.abs(next[k] - v[k]) < 1e-6)
      if (same) return
      cameraTween.cancel()
      writeView({ ...next })
      repaint()
    }, [camKey])
    useEffect(() => {
      if (layerGap === undefined || Math.abs(layerGap - view.current!.gap) < 1e-6) return
      gapTween.cancel()
      view.current!.gap = layerGap
      repaint()
    }, [layerGap, repaint, gapTween])

    // ── plane layout mix ──────────────────────────────────────────────────
    useEffect(() => {
      const to = planeLayout === 'coupled' ? 1 : 0
      if (Math.abs(view.current!.mix - to) < 1e-6) return
      mixTween.start({ mix: view.current!.mix }, { mix: to }, { duration: LAYOUT_MS })
    }, [planeLayout, mixTween])

    // ── turntable ─────────────────────────────────────────────────────────
    const setTurntableRef = useRef(setTurntable)
    setTurntableRef.current = setTurntable
    const turntableRef = useRef(turntableOn)
    turntableRef.current = turntableOn
    const spinning = turntableOn && !reducedMotion
    useEffect(() => {
      if (!spinning) return
      clearPreset()
      let raf = 0
      let last: number | null = null
      const step = (now: number) => {
        if (last !== null) view.current!.yaw += (turntableSpeed * Math.min(100, now - last)) / 1000
        last = now
        repaintNow()
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => {
        cancelAnimationFrame(raf)
        emitCamera('turntable')
      }
    }, [spinning, turntableSpeed, repaintNow, clearPreset, emitCamera])

    // ── stage size (px per scene unit, for pill and title sizes) ──────────
    const stageRef = useRef<HTMLDivElement | null>(null)
    const [unitsPerPx, setUnitsPerPx] = useState(1)
    useLayoutEffect(() => {
      const el = stageRef.current
      if (!el) return
      const measure = () => {
        const w = el.clientWidth
        if (w > 0) setUnitsPerPx(sceneWidth / w)
      }
      measure()
      if (typeof ResizeObserver === 'undefined') return
      const ro = new ResizeObserver(measure)
      ro.observe(el)
      return () => ro.disconnect()
    }, [sceneWidth])

    // ── orbit (drag) ──────────────────────────────────────────────────────
    const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; pointerId: number; moved: boolean } | null>(null)
    const suppressClick = useRef(false)
    const dragging = useRef(false)

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      suppressClick.current = false
      const v = view.current!
      drag.current = { x: e.clientX, y: e.clientY, yaw: v.yaw, pitch: v.pitch, pointerId: e.pointerId, moved: false }
    }
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current
      if (!d || !can.orbit) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.moved) {
        if (Math.abs(dx) + Math.abs(dy) <= DRAG_THRESHOLD) return
        d.moved = true
        dragging.current = true
        suppressClick.current = true
        // Capture only once it is a drag, so a plain click still reaches the node under it.
        e.currentTarget.setPointerCapture?.(d.pointerId)
        cameraTween.cancel()
        if (turntableRef.current) setTurntable(false)
        clearPreset()
      }
      const v = view.current!
      v.yaw = d.yaw + dx * ORBIT_YAW_PER_PX
      v.pitch = clampCamera({ ...cameraOf(v), pitch: d.pitch + dy * ORBIT_PITCH_PER_PX }).pitch
      repaint()
    }
    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current
      drag.current = null
      if (!d?.moved) return
      if (e.currentTarget.hasPointerCapture?.(d.pointerId)) e.currentTarget.releasePointerCapture(d.pointerId)
      dragging.current = false
      // The click that follows this pointerup is swallowed; anything after it (a later keyboard
      // activation included) goes through.
      setTimeout(() => {
        suppressClick.current = false
      }, 0)
      repaint() // places predicate pills again
      emitCamera('orbit')
    }

    // ── zoom (wheel, only while the scene has focus) ──────────────────────
    const zoomEmitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const canZoomRef = useRef(can.zoom)
    canZoomRef.current = can.zoom
    useEffect(() => {
      const el = stageRef.current
      if (!el) return
      const onWheel = (e: WheelEvent) => {
        if (!canZoomRef.current || !el.contains(document.activeElement)) return
        e.preventDefault()
        cameraTween.cancel()
        clearPreset()
        const v = view.current!
        v.zoom = clampCamera({ ...cameraOf(v), zoom: v.zoom * Math.exp(-e.deltaY * 0.0015) }).zoom
        repaint()
        if (zoomEmitTimer.current) clearTimeout(zoomEmitTimer.current)
        zoomEmitTimer.current = setTimeout(() => emitCamera('zoom'), 160)
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => {
        el.removeEventListener('wheel', onWheel)
        if (zoomEmitTimer.current) clearTimeout(zoomEmitTimer.current)
      }
    }, [cameraTween, clearPreset, repaint, emitCamera])

    // ── derived data (changes with the graph, not the camera) ─────────────
    const visibleLayers = useMemo(() => index.layers.filter((l) => !filters.hiddenLayers.includes(l.id)), [index, filters.hiddenLayers])
    const visibleNodes = useMemo(
      () => visibleLayers.flatMap((l) => l.nodeIds.map((id) => index.nodeById.get(id)!)),
      [visibleLayers, index],
    )
    /** Keyboard order: layer by layer, each by label. */
    const nodesByLayer = useMemo(() => {
      const m = new Map<string, IndexedNode[]>()
      for (const l of visibleLayers) {
        m.set(l.id, l.nodeIds.map((id) => index.nodeById.get(id)!).sort((a, b) => a.label.localeCompare(b.label)))
      }
      return m
    }, [visibleLayers, index])
    // Without a layout, or with one that lacks some nodes (a stale layout while a newer
    // asynchronous one is pending), nodes without a position sit on their layer's circle.
    const fallbackPositions = useMemo(
      () =>
        layout && index.nodes.every((n) => layout.independent.has(n.id))
          ? null
          : circlePositions(new Map(index.layers.map((l) => [l.id, l.nodeIds.map((id) => index.nodeById.get(id)!)]))),
      [layout, index],
    )
    const { nodeEmphasis, linkEmphasis } = g
    const nodeEm = useMemo(() => new Map(visibleNodes.map((n) => [n.id, nodeEmphasis(n)])), [visibleNodes, nodeEmphasis])
    const linkEm = useMemo(
      () =>
        index.links.flatMap((link) => {
          const em = linkEmphasis(link)
          if (!em.visible) return []
          const preds = visiblePredicates(link, filters)
          return [{ link, em, text: em.label && preds.length ? linkPredicateLabel(link, index.catalog, preds) : '' }]
        }),
      [index, linkEmphasis, filters],
    )

    const v = view.current!
    const mix = v.mix
    const positions = useMemo(
      () => (layout ? mixLayerPositions(layout, mix) : fallbackPositions!),
      [layout, mix, fallbackPositions],
    )

    // ── per-frame projection ──────────────────────────────────────────────
    const layerCount = index.layers.length
    const focusLayer = focusLayerRef.current != null ? index.layerById.get(focusLayerRef.current) : undefined
    const focus = focusLayer ? { rank: focusLayer.rank, amount: v.focusAmt } : null
    const planeYOf = (rank: number) => stackPlaneY(rank, layerCount, v.gap, focus, FOCUS_PUSH)
    // The camera follows the focused plane; `targetY` stays a free offset on top of that.
    const renderCam = clampCamera({
      ...cameraOf(v),
      targetY: v.targetY + (focusLayer ? v.focusAmt * stackPlaneY(focusLayer.rank, layerCount, v.gap) : 0),
    })
    const proj = createProjector(renderCam, axisOffset(renderCam.pitch, focusLayer ? v.focusAmt : 0))
    const W = sceneWidth
    const H = sceneHeight
    const pcx = (x: number) => r2(((x + W / 2) / W) * 100)
    const pcy = (y: number) => r2(((y + H / 2) / H) * 100)
    const extent = planeSize

    const world = new Map<string, Vec3>()
    const P = new Map<string, ProjectedPoint>()
    for (const n of visibleNodes) {
      const p = positions.get(n.id) ?? fallbackPositions?.get(n.id) ?? { x: 0, y: 0 }
      const w = { x: p.x * extent * NODE_PLANE_INSET, y: planeYOf(n.layerRank), z: p.y * extent * NODE_PLANE_INSET }
      world.set(n.id, w)
      P.set(n.id, proj(w))
    }
    const radius = (n: IndexedNode) => nodeRadius(n) * P.get(n.id)!.scale

    const topView = renderCam.pitch >= TOP_VIEW_PITCH
    const planes = depthSort(
      visibleLayers.map((layer) => {
        const y = planeYOf(layer.rank)
        const corners = planeCorners(y, extent).map(proj)
        return {
          layer,
          depth: proj({ x: 0, y, z: 0 }).depth,
          points: svgPoints(corners),
          grid: planeGridLines(y, extent).map(([a, b]) => svgPoints([proj(a), proj(b)])),
          anchor: leftmostPoint(corners),
          center: proj({ x: 0, y, z: 0 }),
        }
      }),
      (p) => p.depth,
    )
    const planeOpacity = (layerId: string) => (focusedLayerId && layerId !== focusedLayerId ? 0.2 : 1)

    // Plane titles: at each plane's left corner; on a side rail when the planes overlap (top view).
    const titleSpacing = 46 * unitsPerPx
    const titles = (() => {
      const ranked = [...planes].sort((a, b) => a.layer.rank - b.layer.rank)
      if (topView && ranked.length > 0) {
        // Kept inside the scene, like the titles below: about 150px wide, right-aligned at x.
        const x = Math.max(-W / 2 + 150 * unitsPerPx, Math.min(...ranked.map((p) => p.anchor.x)) - 16)
        const cy = ranked.reduce((s, p) => s + p.center.y, 0) / ranked.length
        const rail = titleRail(ranked.length, x, cy, titleSpacing)
        return ranked.map((p, i) => ({ p, x: rail[i].x, y: rail[i].y }))
      }
      // Kept inside the scene: a title is about 150px wide, right-aligned at x.
      const minX = -W / 2 + 150 * unitsPerPx
      const minY = -H / 2 + 22 * unitsPerPx
      const maxY = H / 2 - 22 * unitsPerPx
      const placed = ranked
        .map((p) => ({ p, x: Math.max(minX, p.anchor.x - 8), y: clamp(p.anchor.y, minY, maxY) }))
        .sort((a, b) => a.y - b.y)
      for (let k = 1; k < placed.length; k++) {
        if (placed[k].y - placed[k - 1].y < titleSpacing) placed[k].y = placed[k - 1].y + titleSpacing
      }
      return placed.sort((a, b) => a.p.layer.rank - b.p.layer.rank)
    })()

    // Links, arrowheads and pill candidates.
    const segs: { id: string; d: string; color: string; width: number; opacity: number; dash: string; key: number }[] = []
    const arrows: { id: string; points: string; color: string; opacity: number; key: number }[] = []
    const candidates: (EdgeLabelCandidate & { color: string; opacity: number })[] = []
    for (const { link, em, text } of linkEm) {
      const a = P.get(link.sourceId)
      const b = P.get(link.targetId)
      if (!a || !b) continue
      const curve = lineCurve(a, b)
      const key = (a.depth + b.depth) / 2 - em.z * 1e4
      segs.push({ id: link.id, d: curve.d, color: em.color, width: r2(em.width * Math.min(a.scale, b.scale)), opacity: em.opacity, dash: em.dash, key })
      if (em.arrow) {
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        const rb = radius(index.nodeById.get(link.targetId)!) + 2
        if (len > rb + 14) {
          const ux = dx / len
          const uy = dy / len
          arrows.push({
            id: link.id,
            points: arrowHeadPoints({ x: b.x - ux * rb, y: b.y - uy * rb }, ux, uy, 8 * b.scale, 3.6 * b.scale),
            color: em.color,
            opacity: em.highlighted ? 1 : 0.8,
            key,
          })
        }
      }
      if (text && em.opacity >= 0.2) {
        candidates.push({ id: link.id, text, pointAt: curve.pointAt, priority: edgeLabelPriority(link, em), color: em.color, opacity: em.highlighted ? 1 : 0.9 })
      }
    }
    const segsSorted = depthSort(segs, (s) => s.key)
    const arrowsSorted = depthSort(arrows, (s) => s.key)

    // Pills: skipped while the camera or the planes move (drag, turntable, any tween) and placed
    // once motion settles; placing them is far too costly per frame, and they would jump.
    const moving =
      dragging.current || spinning || cameraTween.isActive() || focusTween.isActive() || gapTween.isActive() || mixTween.isActive()
    const pills = (() => {
      if (moving || candidates.length === 0) return []
      const obstacles: LabelBox[] = visibleNodes.map((n) => {
        const p = P.get(n.id)!
        const r = radius(n)
        return { x: p.x, y: p.y, width: r * 2, height: r * 2 }
      })
      const byId = new Map(candidates.map((c) => [c.id, c]))
      return placeEdgeLabels(candidates, {
        obstacles,
        size: (t) => ({ width: (t.length * 5.8 + 12) * unitsPerPx, height: 15 * unitsPerPx }),
      }).map((pl) => ({ ...pl, color: byId.get(pl.id)!.color, opacity: byId.get(pl.id)!.opacity }))
    })()

    // Drill-through column for the selection.
    const selNode = selectedId != null ? index.nodeById.get(selectedId) : undefined
    const drill = (() => {
      if (!selNode || !world.has(selNode.id) || visibleLayers.length < 2) return null
      const w = world.get(selNode.id)!
      const ys = visibleLayers.map((l) => planeYOf(l.rank))
      const column = svgPoints([proj({ x: w.x, y: Math.max(...ys), z: w.z }), proj({ x: w.x, y: Math.min(...ys), z: w.z })])
      const rings = visibleLayers
        .filter((l) => l.id !== selNode.layerId)
        .map((l) => ({ id: l.id, points: svgPoints(ringPoints(w.x, planeYOf(l.rank), w.z, 14).map(proj)) }))
      return { column, rings }
    })()

    // Nodes, far first; the selection on top.
    const nodeDraw = depthSort(visibleNodes, (n) => P.get(n.id)!.depth - (n.id === selectedId ? 1e6 : 0))
    const zOf = new Map(nodeDraw.map((n, i) => [n.id, i + 1]))

    // ── keyboard (roving focus over the node label buttons) ───────────────
    const [rovingId, setRovingId] = useState<string | null>(null)
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
    const buttonRefs = useRef(new Map<string, HTMLButtonElement>())
    const tabStop = (rovingId && P.has(rovingId) ? rovingId : null) ?? (selectedId && P.has(selectedId) ? selectedId : null) ?? visibleNodes[0]?.id ?? null
    const moveFocus = (id: string | undefined) => {
      if (!id) return
      setRovingId(id)
      buttonRefs.current.get(id)?.focus()
    }
    const onNodeKey = (e: React.KeyboardEvent, n: IndexedNode) => {
      const list = nodesByLayer.get(n.layerId) ?? []
      const i = list.findIndex((x) => x.id === n.id)
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        moveFocus(list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length]?.id)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const li = visibleLayers.findIndex((l) => l.id === n.layerId)
        const next = visibleLayers[li + (e.key === 'ArrowUp' ? -1 : 1)]
        if (!next) return
        const linked = n.adjacency.map((a) => index.nodeById.get(a.otherId)!).find((o) => o.layerId === next.id)
        moveFocus(linked?.id ?? nodesByLayer.get(next.id)?.[0]?.id)
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        moveFocus(e.key === 'Home' ? list[0]?.id : list[list.length - 1]?.id)
      } else if (e.key === 'Escape') {
        if (selectedId) {
          e.preventDefault()
          g.select(null)
        }
      }
    }
    /** The click that ends an orbit drag; keyboard activations (`detail` 0) are never swallowed. */
    const isDragClick = (e: React.MouseEvent) => suppressClick.current && e.detail !== 0
    const toggleSelect = (e: React.MouseEvent, id: string) => {
      if (!can.select || isDragClick(e)) return
      g.select(selectedId === id ? null : id)
    }
    const onBackgroundClick = (e: React.MouseEvent) => {
      if (!can.select || isDragClick(e)) return
      if (selectedId) g.select(null)
    }
    const onTitleClick = (e: React.MouseEvent, layerId: string) => {
      if (!can.focusLayer || isDragClick(e)) return
      g.focusLayer(focusedLayerId === layerId ? null : layerId)
    }

    // ── imperative handle ─────────────────────────────────────────────────
    const fit = useCallback(() => {
      const vv = view.current!
      const pts = visibleLayers.flatMap((l) => planeCorners(stackPlaneY(l.rank, layerCount, vv.gap), extent))
      const cam = { ...cameraOf(vv), targetY: 0 }
      clearPreset()
      moveView(
        { targetY: 0, zoom: fitZoom(pts, cam, { width: W, height: H, margin: 40 }, axisOffset(cam.pitch, 0)) },
        { onDone: () => emitCamera('fit') },
      )
    }, [visibleLayers, layerCount, extent, W, H, moveView, clearPreset, emitCamera])
    useImperativeHandle(
      ref,
      () => ({
        applyPreset,
        setCamera: (c, opts = {}) => {
          clearPreset()
          moveView(c, { animate: opts.animate, onDone: () => emitCamera('api') })
        },
        getCamera: () => cameraOf(view.current!),
        getLayerGap: () => view.current!.gap,
        zoomBy: (f) => {
          clearPreset()
          moveView({ zoom: view.current!.zoom * f }, { duration: ZOOM_MS, onDone: () => emitCamera('zoom') })
        },
        fit,
        setTurntable: (on) => setTurntableRef.current(on),
        focusLayer: (id) => g.focusLayer(id),
        select: (id) => g.select(id),
        setFollow: (n) => g.setFollow(n),
        element: () => stageRef.current,
      }),
      [applyPreset, clearPreset, moveView, emitCamera, fit, g],
    )

    // ── render ────────────────────────────────────────────────────────────
    const showLabel = (n: IndexedNode) => {
      const em = nodeEm.get(n.id)!
      if (n.id === hoveredId || n.id === focusedNodeId) return true
      if (nodeLabels === 'none') return false
      if (em.hop !== null) return true
      return nodeLabels === 'all' && em.opacity > 0.5
    }
    const fsOf = (n: IndexedNode) => r1(clamp(10.5 * P.get(n.id)!.scale, 8, 14))
    const label =
      ariaLabel ??
      `Layer stack: ${visibleLayers.length} layers, ${visibleNodes.length} nodes, ${linkEm.length} links${selNode ? `; ${selNode.label} selected` : ''}`

    return (
      <div
        ref={stageRef}
        className={['layer-stack', can.orbit ? 'layer-stack--orbit' : '', className].filter(Boolean).join(' ')}
        style={{ aspectRatio: `${W} / ${H}`, ...style }}
        tabIndex={-1}
        role="group"
        aria-roledescription="3D layer stack"
        aria-label={label}
        data-preset={preset ?? ''}
        data-focused-layer={focusedLayerId ?? ''}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && selectedId && can.select) g.select(null)
        }}
        {...props}
      >
        <svg className="layer-stack__svg" viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <rect className="layer-stack__bg" x={-W / 2} y={-H / 2} width={W} height={H} onClick={onBackgroundClick} />
          {planes.map((p) => (
            <g key={p.layer.id} className="layer-stack__plane" opacity={planeOpacity(p.layer.id)} data-layer-id={p.layer.id}>
              <polygon
                points={p.points}
                className={focusedLayerId === p.layer.id ? 'layer-stack__plane-fill layer-stack__plane-fill--focused' : 'layer-stack__plane-fill'}
                style={{ fill: p.layer.color, stroke: p.layer.color }}
                onClick={onBackgroundClick}
              />
              {p.grid.map((pts, i) => (
                <polyline key={i} points={pts} className="layer-stack__grid" style={{ stroke: p.layer.color }} />
              ))}
            </g>
          ))}
          {segsSorted.map((s) => (
            <path
              key={s.id}
              className="layer-stack__link"
              data-link-id={s.id}
              d={s.d}
              style={{ stroke: s.color, strokeWidth: s.width, strokeOpacity: s.opacity }}
              strokeDasharray={s.dash || undefined}
            />
          ))}
          {arrowsSorted.map((a) => (
            <polygon key={a.id} className="layer-stack__arrow" points={a.points} style={{ fill: a.color, fillOpacity: a.opacity }} />
          ))}
          {drill && (
            <g className="layer-stack__drill">
              <polyline className="layer-stack__drill-column" points={drill.column} />
              {drill.rings.map((r) => (
                <polyline key={r.id} className="layer-stack__drill-ring" points={r.points} />
              ))}
            </g>
          )}
          {nodeDraw.map((n) => {
            const p = P.get(n.id)!
            const em = nodeEm.get(n.id)!
            const r = radius(n)
            const layer = index.layerById.get(n.layerId)!
            const ring = em.selected ? 'selected' : em.followed ? 'followed' : n.id === hoveredId ? 'hover' : null
            return (
              <g
                key={n.id}
                className="layer-stack__node"
                data-node-id={n.id}
                opacity={r2(em.opacity)}
                onClick={(e) => toggleSelect(e, n.id)}
                onPointerEnter={() => can.hover && !drag.current?.moved && g.hover(n.id)}
                onPointerLeave={() => can.hover && hoveredId === n.id && g.hover(null)}
              >
                {ring && <circle className={`layer-stack__ring layer-stack__ring--${ring}`} cx={r1(p.x)} cy={r1(p.y)} r={r1(r + 3.5)} />}
                <circle className="layer-stack__disc" cx={r1(p.x)} cy={r1(p.y)} r={r1(r)} style={{ fill: layer.color }} />
              </g>
            )
          })}
        </svg>

        <div className="layer-stack__overlay">
          {pills.map((pl) => (
            <span
              key={pl.id}
              className="layer-stack__pill"
              style={{
                left: `${pcx(pl.x)}%`,
                top: `${pcy(pl.y)}%`,
                color: pl.color,
                borderColor: `color-mix(in srgb, ${pl.color} 34%, transparent)`,
                opacity: pl.opacity,
              }}
            >
              {pl.text}
            </span>
          ))}
          <div role="group" aria-label="Nodes" className="layer-stack__nodes">
            {visibleLayers.flatMap((l) =>
              (nodesByLayer.get(l.id) ?? []).map((n) => {
                const p = P.get(n.id)!
                const em = nodeEm.get(n.id)!
                const shown = showLabel(n)
                const tint = em.selected ? ' layer-stack__label--selected' : em.followed ? ' layer-stack__label--followed' : ''
                return (
                  <button
                    key={n.id}
                    ref={(el) => {
                      if (el) buttonRefs.current.set(n.id, el)
                      else buttonRefs.current.delete(n.id)
                    }}
                    type="button"
                    className={`layer-stack__label${tint}${shown ? '' : ' layer-stack__label--hidden'}`}
                    data-node-id={n.id}
                    tabIndex={n.id === tabStop ? 0 : -1}
                    aria-pressed={em.selected}
                    aria-label={`${n.label}, ${l.label} layer${em.selected ? ', selected' : ''}`}
                    style={{
                      left: `${pcx(p.x + radius(n) + 4)}%`,
                      top: `${pcy(p.y)}%`,
                      fontSize: fsOf(n),
                      opacity: r2(Math.max(em.opacity, 0.35)),
                      zIndex: zOf.get(n.id),
                    }}
                    onClick={(e) => toggleSelect(e, n.id)}
                    onFocus={() => {
                      setRovingId(n.id)
                      setFocusedNodeId(n.id)
                    }}
                    onBlur={() => setFocusedNodeId((f) => (f === n.id ? null : f))}
                    onPointerEnter={() => can.hover && !drag.current?.moved && g.hover(n.id)}
                    onPointerLeave={() => can.hover && hoveredId === n.id && g.hover(null)}
                    onKeyDown={(e) => onNodeKey(e, n)}
                  >
                    {n.displayLabel}
                  </button>
                )
              }),
            )}
          </div>
          {titles.map(({ p, x, y }) => {
            const layer = p.layer
            const focused = focusedLayerId === layer.id
            const body = (
              <>
                <span className="layer-stack__title-name" style={{ color: layer.color }}>
                  {layer.label.toUpperCase()}
                </span>
                <span className="layer-stack__title-sub">{`${layer.nodeIds.length} nodes · ${layer.intraLinkCount} links`}</span>
              </>
            )
            const common = {
              className: `layer-stack__title${focused ? ' layer-stack__title--focused' : ''}${topView ? ' layer-stack__title--rail' : ''}`,
              style: { left: `${pcx(x)}%`, top: `${pcy(y)}%`, opacity: planeOpacity(layer.id) },
              'data-layer-id': layer.id,
            }
            return can.focusLayer ? (
              <button
                key={layer.id}
                type="button"
                {...common}
                aria-pressed={focused}
                aria-label={`${focused ? 'Exit focus on' : 'Focus'} ${layer.label} layer: ${layer.nodeIds.length} nodes, ${layer.intraLinkCount} links`}
                onClick={(e) => onTitleClick(e, layer.id)}
              >
                {body}
              </button>
            ) : (
              <div key={layer.id} {...common}>
                {body}
              </div>
            )
          })}
          {visibleNodes.length === 0 && <span className="layer-stack__empty">No nodes to show.</span>}
        </div>
      </div>
    )
  },
)

LayerStack.displayName = 'LayerStack'
