import React, { useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GraphEdge, GraphNodeData } from './GraphCanvas'
import { LayeredGraphContext, useLayeredGraph, type LayeredGraphState, type UseLayeredGraphOptions } from '../hooks/useLayeredGraph'
import { useControllable } from '../hooks/useControllable'
import { useTweenChannels } from '../hooks/useTween'
import { lineCurve, placeEdgeLabels, edgeLabelPriority, type EdgeLabelCandidate, type LabelBox } from '../utils/layered/edgeLabels'
import { arrowHeadPoints, linkPredicateLabel } from '../utils/layered/labels'
import { mixLayerPositions } from '../utils/layered/layout'
import { reorder } from '../utils/layered/domOrder'
import { visiblePredicates } from '../utils/layered/filters'
import {
  CAMERA_PRESETS,
  TOP_VIEW_PITCH,
  cameraFromPreset,
  presetLayerGap,
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
  type StackFocus,
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
  /** Wheel zoom while the scene has focus, and two-finger pinch. */
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

  /**
   * Camera (controlled). The fields set are held: the view shows them and nothing else, and a move
   * (orbit, zoom, a preset, focus, turntable) only reports through `onCameraChange` until the prop
   * changes. Pass each reported camera back unchanged: a value the stack never reported (rounded
   * or normalized) counts as a change from outside, which jumps and stops the stack's own move on
   * that field. An echo that lands a frame or more late is fine. Fields left out stay uncontrolled.
   */
  camera?: Partial<StackCamera>
  /** Initial camera fields when uncontrolled, over the initial preset. */
  defaultCamera?: Partial<StackCamera>
  /**
   * Called when a camera move settles (drag release, end of a tween, a wheel pause, pinch release,
   * turntable stop), not on every frame, so chrome that shows the camera doesn't re-render while
   * it moves. With `camera` set it is also called on every frame of a move, with the camera the
   * stack proposes, since the view only moves when the prop does; the settle call then carries
   * the move's last proposal. Chrome that only shows the camera should leave it uncontrolled.
   */
  onCameraChange?: (camera: StackCamera, cause: LayerStackCameraCause) => void

  /** Slow continuous yaw (controlled). Off under reduced motion; turns off when the user orbits. */
  turntable?: boolean
  defaultTurntable?: boolean
  onTurntableChange?: (on: boolean) => void
  /** Turntable speed, radians per second. Default 0.27. */
  turntableSpeed?: number

  /**
   * Vertical distance between planes, world units (controlled). Held like `camera`: a preset's gap
   * move reports each frame through `onLayerGapChange`, and the planes move only with the prop.
   * Pass the reported gap back unchanged, as with `camera`.
   */
  layerGap?: number
  /** Initial gap when uncontrolled. Default: the initial preset's (170 for `stack`), closer past five layers (`presetLayerGap`). */
  defaultLayerGap?: number
  /** Called when a preset's gap move ends; with `layerGap` set, also on every frame of it. */
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
  /** 0 = independent layout, 1 = coupled. */
  mix: number
  /**
   * Per layer id, 0..1: how far the planes open around it. More than one is open while focus
   * moves from one layer to another (one closes as the other opens).
   */
  focus: Record<string, number>
}
type ViewKey = Exclude<keyof ViewState, 'focus'>
const CAMERA_KEYS: readonly (keyof StackCamera)[] = ['yaw', 'pitch', 'zoom', 'targetY']
/** Tween channel prefix for a layer's focus amount. */
const FOCUS_KEY = 'focus:'

const r1 = (v: number) => Math.round(v * 10) / 10
const r2 = (v: number) => Math.round(v * 100) / 100
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const nodeRadius = (n: IndexedNode) => 3.2 + Math.sqrt(n.degree) * 1.5

function cameraOf(v: ViewState): StackCamera {
  return { yaw: v.yaw, pitch: v.pitch, zoom: v.zoom, targetY: v.targetY }
}

function pickCamera(c: Partial<StackCamera>, keys: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const k of keys) {
    const val = c[k as keyof StackCamera]
    if (val !== undefined) out[k] = val
  }
  return out
}

/** The camera fields a (partial) camera prop sets. */
function definedCamera(camera: Partial<StackCamera> | undefined): Partial<StackCamera> {
  const out: Partial<StackCamera> = {}
  if (camera) for (const k of CAMERA_KEYS) if (camera[k] !== undefined) out[k] = camera[k]
  return out
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6
/** Proposals kept to recognise a late echo: about a second of frames. */
const RECENT_PROPOSALS = 64
function remember<T>(list: T[], value: T) {
  list.push(value)
  if (list.length > RECENT_PROPOSALS) list.shift()
}

/** The view fields that move the picture, as one comparable string. */
function viewKey(v: ViewState): string {
  return [v.yaw, v.pitch, v.zoom, v.targetY, v.gap, v.mix, ...Object.entries(v.focus).flat()].join('|')
}

function capturePointer(el: Element, id: number) {
  try {
    el.setPointerCapture?.(id)
  } catch {
    // Not an active pointer (a synthetic event): nothing to capture.
  }
}

function releasePointer(el: Element, id: number) {
  try {
    if (el.hasPointerCapture?.(id)) el.releasePointerCapture(id)
  } catch {
    // Already released.
  }
}

const GRID_LINES = planeGridLines(0, 1).map((_, i) => i)

/** The elements `paint` writes to, found after each commit. */
interface SceneElements {
  planeGroup: Element
  planes: Map<string, Element>
  linkGroup: Element
  links: Map<string, Element>
  arrowGroup: Element
  arrows: Map<string, Element>
  nodeGroup: Element
  nodes: Map<string, Element>
  labels: Map<string, HTMLElement>
  titles: Map<string, HTMLElement>
  drillColumn: Element | null
  drillRings: Map<string, Element>
}

function collectElements(root: HTMLElement): SceneElements | null {
  const group = (cls: string) => root.querySelector(`.${cls}`)
  const byAttr = <T extends Element>(selector: string, attr: string) =>
    new Map([...root.querySelectorAll<T>(selector)].map((el) => [el.getAttribute(attr) ?? '', el]))
  const planeGroup = group('layer-stack__planes')
  const linkGroup = group('layer-stack__links')
  const arrowGroup = group('layer-stack__arrows')
  const nodeGroup = group('layer-stack__discs')
  if (!planeGroup || !linkGroup || !arrowGroup || !nodeGroup) return null
  return {
    planeGroup,
    planes: byAttr('.layer-stack__plane', 'data-layer-id'),
    linkGroup,
    links: byAttr('.layer-stack__link', 'data-link-id'),
    arrowGroup,
    arrows: byAttr('.layer-stack__arrow', 'data-link-id'),
    nodeGroup,
    nodes: byAttr('.layer-stack__node', 'data-node-id'),
    labels: byAttr<HTMLElement>('.layer-stack__label', 'data-node-id'),
    titles: byAttr<HTMLElement>('.layer-stack__title', 'data-layer-id'),
    drillColumn: group('layer-stack__drill-column'),
    drillRings: byAttr('.layer-stack__drill-ring', 'data-layer-id'),
  }
}

function setAttr(el: Element, name: string, value: string) {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value)
}

function setStyle(el: Element, name: 'left' | 'top' | 'fontSize' | 'zIndex' | 'strokeWidth' | 'display', value: string) {
  const style = (el as HTMLElement | SVGElement).style
  if (style[name] !== value) style[name] = value
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
      const base = clampCamera({ ...cameraFromPreset(cameraPreset ?? defaultCameraPreset), ...defaultCamera, ...definedCamera(camera) })
      const focused = focusedLayerId != null && index.layerById.has(focusedLayerId)
      view.current = {
        ...base,
        ...(focused ? { pitch: FOCUS_PITCH, zoom: FOCUS_ZOOM } : null),
        gap: layerGap ?? defaultLayerGap ?? presetLayerGap(cameraPreset ?? defaultCameraPreset, index.layers.length),
        mix: planeLayout === 'coupled' ? 1 : 0,
        focus: focused ? { [focusedLayerId]: 1 } : {},
      }
    }
    // Controlled fields are held: every render shows the props, and a move only proposes new
    // values through the change callbacks (see `propose…`).
    const held = useRef<{ camera: Partial<StackCamera>; gap: number | undefined }>({ camera: {}, gap: undefined })
    held.current = { camera: definedCamera(camera), gap: layerGap }
    /** Puts the held (controlled) fields back into the view; every render and paint starts here. */
    const applyHeld = useCallback(() => {
      const v = view.current!
      const c = held.current.camera
      if (Object.keys(c).length > 0) Object.assign(v, pickCamera(clampCamera({ ...cameraOf(v), ...c }), Object.keys(c)))
      if (held.current.gap !== undefined) v.gap = held.current.gap
    }, [])
    applyHeld()

    // Frames (tweens, orbit, zoom, turntable) only paint: `paint` writes the projected geometry
    // straight into the elements React rendered, so the React tree re-renders only when the graph,
    // the selection or the emphasis change, and once when motion starts and settles (pills).
    const [, setFrame] = useState(0)
    const repaintNow = useCallback(() => setFrame((f) => (f + 1) % 1e9), [])
    const paintRef = useRef<() => void>(() => {})
    const pendingRaf = useRef<number | null>(null)
    const repaint = useCallback(() => {
      if (pendingRaf.current !== null) return
      pendingRaf.current = requestAnimationFrame(() => {
        pendingRaf.current = null
        paintRef.current()
      })
    }, [])
    useEffect(() => () => {
      if (pendingRaf.current !== null) cancelAnimationFrame(pendingRaf.current)
      pendingRaf.current = null
    }, [])

    const onCameraChangeRef = useRef(onCameraChange)
    onCameraChangeRef.current = onCameraChange
    const onLayerGapChangeRef = useRef(onLayerGapChange)
    onLayerGapChangeRef.current = onLayerGapChange
    // A controlled camera or gap reports every frame of a move (the view moves only when the prop
    // does), as well as when the move settles. Recent proposals tell an outside change apart from
    // the parent's own echo, which may land a frame or more late.
    const controlledRef = useRef({ camera: false, gap: false })
    controlledRef.current = { camera: camera !== undefined, gap: layerGap !== undefined }
    const proposed = useRef<{ camera: StackCamera | null; gap: number | null }>({ camera: null, gap: null })
    const recent = useRef<{ camera: StackCamera[]; gap: number[] }>({ camera: [], gap: [] })
    const proposeCamera = useCallback((cause: LayerStackCameraCause) => {
      if (!controlledRef.current.camera) return
      const c = cameraOf(view.current!)
      proposed.current.camera = c
      remember(recent.current.camera, c)
      onCameraChangeRef.current?.(c, cause)
    }, [])
    const proposeGap = useCallback(() => {
      if (!controlledRef.current.gap) return
      const gap = view.current!.gap
      proposed.current.gap = gap
      remember(recent.current.gap, gap)
      onLayerGapChangeRef.current?.(gap)
    }, [])
    /**
     * Reports a settled camera. Controlled, that is the move's latest proposal: the hold has already
     * put the prop back into the view, and a parent that commits only the settled report must still
     * get the gesture's result.
     */
    const emitCamera = useCallback((cause: LayerStackCameraCause) => {
      const c = controlledRef.current.camera && proposed.current.camera ? proposed.current.camera : cameraOf(view.current!)
      onCameraChangeRef.current?.(c, cause)
    }, [])
    /** A new gesture starts without a proposal, so its settle report never repeats an older one. */
    const zoomEmitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    /** A wheel zoom is under way (until its 160 ms settle); pills stay hidden meanwhile. */
    const wheeling = useRef(false)
    const startGesture = () => {
      // A wheel zoom still waiting to settle settles now, before this gesture's proposals.
      if (zoomEmitTimer.current) {
        clearTimeout(zoomEmitTimer.current)
        zoomEmitTimer.current = null
        wheeling.current = false
        emitCamera('zoom')
      }
      proposed.current.camera = null
    }

    const writeView = useCallback((values: Record<string, number>) => {
      const v = view.current!
      for (const k in values) {
        if (k.startsWith(FOCUS_KEY)) v.focus[k.slice(FOCUS_KEY.length)] = values[k]
        else v[k as ViewKey] = values[k]
      }
    }, [])
    /** What started the latest camera move; reported when it settles. */
    const moveCause = useRef<LayerStackCameraCause>('api')
    /** A tween wrote camera fields that have not been reported settled yet. */
    const cameraDirty = useRef(false)
    // Every move (camera fields, layer gap, layer focus, plane layout) runs on its own channels, so
    // a later move replaces only the fields it names: a focus right after a preset keeps the
    // preset's yaw move, and an orbit stops the camera but lets the planes settle.
    const tween = useTweenChannels((values) => {
      writeView(values)
      if (CAMERA_KEYS.some((k) => k in values)) {
        cameraDirty.current = true
        proposeCamera(moveCause.current)
      }
      if ('gap' in values) proposeGap()
      paintRef.current()
      if (cameraDirty.current && !tween.isActive(CAMERA_KEYS)) {
        cameraDirty.current = false
        emitCamera(moveCause.current)
      }
    })
    const reducedMotion = tween.reducedMotion
    /** Stops a camera move where it is (orbit, wheel, pinch); planes and gap keep settling. */
    const stopCameraMove = useCallback(() => {
      tween.cancel(CAMERA_KEYS)
      cameraDirty.current = false
    }, [tween])

    /** Tweens the given camera fields from where they are now (or jumps when `animate` is false). */
    const moveView = useCallback(
      (to: Partial<StackCamera>, cause: LayerStackCameraCause, opts: { animate?: boolean; duration?: number } = {}) => {
        const v = view.current!
        const target: Partial<StackCamera> = { ...to }
        if (target.yaw !== undefined) target.yaw = nearestYaw(v.yaw, target.yaw)
        if (target.pitch !== undefined || target.zoom !== undefined) {
          const c = clampCamera({ ...cameraOf(v), ...target } as StackCamera)
          if (target.pitch !== undefined) target.pitch = c.pitch
          if (target.zoom !== undefined) target.zoom = c.zoom
        }
        const keys = Object.keys(target)
        moveCause.current = cause
        tween.start(pickCamera(cameraOf(v), keys), pickCamera(target, keys), {
          duration: opts.animate === false ? 0 : opts.duration ?? CAMERA_MS,
        })
      },
      [tween],
    )

    /** Opens the planes around `layerId` (null closes them), easing from wherever they are. */
    const movePlaneFocus = useCallback(
      (layerId: string | null, duration = CAMERA_MS) => {
        const v = view.current!
        const from: Record<string, number> = {}
        const to: Record<string, number> = {}
        for (const [id, amount] of Object.entries(v.focus)) {
          if (amount <= 0 && id !== layerId && !tween.isActive([FOCUS_KEY + id])) {
            delete v.focus[id]
            continue
          }
          from[FOCUS_KEY + id] = amount
          to[FOCUS_KEY + id] = id === layerId ? 1 : 0
        }
        if (layerId != null && !(FOCUS_KEY + layerId in to)) {
          v.focus[layerId] = 0
          from[FOCUS_KEY + layerId] = 0
          to[FOCUS_KEY + layerId] = 1
        }
        tween.start(from, to, { duration })
      },
      [tween],
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
      if (focusedLayerId != null && index.layerById.has(focusedLayerId)) {
        clearPreset()
        movePlaneFocus(focusedLayerId)
        moveView({ pitch: FOCUS_PITCH, zoom: FOCUS_ZOOM }, 'focus')
      } else {
        const s = CAMERA_PRESETS.stack
        movePlaneFocus(null)
        moveView({ pitch: s.pitch, zoom: s.zoom }, 'focus')
      }
    }, [focusedLayerId, index, moveView, movePlaneFocus, clearPreset])
    // Declared after the focus effect, so it sees the commit after `applyPreset` once that has run.
    useEffect(() => {
      commits.current += 1
      if (skipFocusExit.current !== null && commits.current > skipFocusExit.current) skipFocusExit.current = null
    })

    // ── presets ───────────────────────────────────────────────────────────
    const applyPreset = useCallback(
      (name: CameraPresetName, opts: LayerStackMoveOptions = {}) => {
        const p = CAMERA_PRESETS[name]
        const gap = presetLayerGap(name, index.layers.length)
        appliedPresetRef.current = name
        if (presetRef.current !== name) setPreset(name)
        if (focusedLayerId != null) {
          skipFocusExit.current = commits.current
          g.focusLayer(null)
        }
        setTurntableRef.current(false)
        const duration = opts.animate === false ? 0 : CAMERA_MS
        movePlaneFocus(null, duration)
        tween.start({ gap: view.current!.gap }, { gap }, { duration, onDone: () => onLayerGapChangeRef.current?.(gap) })
        moveView({ yaw: p.yaw, pitch: p.pitch, zoom: p.zoom, targetY: 0 }, 'preset', { animate: opts.animate })
      },
      [focusedLayerId, g, index, moveView, movePlaneFocus, tween, setPreset],
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
    // The view already shows the props (held above). A value the stack never proposed comes from
    // outside, and stops the stack's move on that field; an echo of a recent proposal, however
    // late, is the parent following along.
    const camKey = camera ? CAMERA_KEYS.map((k) => camera[k]).join('|') : ''
    useEffect(() => {
      if (!camera) return
      const own = recent.current.camera
      const outside = CAMERA_KEYS.filter((k) => camera[k] !== undefined && !own.some((p) => near(p[k], camera[k]!)))
      if (outside.length === 0) return
      tween.cancel(outside)
      // A stopped camera move must not settle later, from a gap, focus or layout frame.
      if (!tween.isActive(CAMERA_KEYS)) cameraDirty.current = false
      // The cancelled move never runs its last frame: paint, so pills come back once it stops.
      repaint()
    }, [camKey])
    useEffect(() => {
      if (layerGap === undefined) return
      if (recent.current.gap.some((p) => near(p, layerGap))) return
      tween.cancel(['gap'])
      repaint()
    }, [layerGap, tween, repaint])

    // ── layer count ───────────────────────────────────────────────────────
    // A graph that arrives (or changes its layer count) after mount takes the active preset's gap
    // for that many layers (`presetLayerGap`), unless the gap is controlled.
    const prevLayerCount = useRef(index.layers.length)
    useEffect(() => {
      const n = index.layers.length
      if (prevLayerCount.current === n) return
      prevLayerCount.current = n
      const name = presetRef.current
      if (!name || layerGap !== undefined) return
      const gap = presetLayerGap(name, n)
      if (near(view.current!.gap, gap)) return
      tween.start({ gap: view.current!.gap }, { gap }, { duration: CAMERA_MS, onDone: () => onLayerGapChangeRef.current?.(gap) })
    }, [index, layerGap, tween])

    // ── plane layout mix ──────────────────────────────────────────────────
    useEffect(() => {
      const to = planeLayout === 'coupled' ? 1 : 0
      if (Math.abs(view.current!.mix - to) < 1e-6) return
      tween.start({ mix: view.current!.mix }, { mix: to }, { duration: LAYOUT_MS })
    }, [planeLayout, tween])

    // ── turntable ─────────────────────────────────────────────────────────
    const setTurntableRef = useRef(setTurntable)
    setTurntableRef.current = setTurntable
    const turntableRef = useRef(turntableOn)
    turntableRef.current = turntableOn
    const spinning = turntableOn && !reducedMotion
    useEffect(() => {
      if (!spinning) return
      clearPreset()
      startGesture()
      let raf = 0
      let last: number | null = null
      const step = (now: number) => {
        if (last !== null) {
          view.current!.yaw += (turntableSpeed * Math.min(100, now - last)) / 1000
          proposeCamera('turntable')
        }
        last = now
        paintRef.current()
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => {
        cancelAnimationFrame(raf)
        emitCamera('turntable')
      }
    }, [spinning, turntableSpeed, clearPreset, emitCamera, proposeCamera])

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

    // ── orbit (drag) and pinch zoom ───────────────────────────────────────
    const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; pointerId: number; moved: boolean } | null>(null)
    const suppressClick = useRef(false)
    const dragging = useRef(false)
    /** Pointers down on the scene; two make a pinch. */
    const pointers = useRef(new Map<number, { x: number; y: number }>())
    const pinch = useRef<{ dist: number; zoom: number } | null>(null)
    const pointerDistance = () => {
      const [a, b] = [...pointers.current.values()]
      return Math.max(1, Math.hypot(b.x - a.x, b.y - a.y))
    }
    const releaseClickSoon = () =>
      setTimeout(() => {
        suppressClick.current = false
      }, 0)

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.current.size === 2 && can.zoom) {
        // A second finger turns the gesture into a pinch; the orbit (if any) ends where it is.
        const d = drag.current
        drag.current = null
        dragging.current = false
        if (d?.moved) emitCamera('orbit')
        suppressClick.current = true
        stopCameraMove()
        clearPreset()
        startGesture()
        pinch.current = { dist: pointerDistance(), zoom: view.current!.zoom }
        for (const id of pointers.current.keys()) capturePointer(e.currentTarget, id)
        return
      }
      if (pointers.current.size > 1) return
      suppressClick.current = false
      const v = view.current!
      drag.current = { x: e.clientX, y: e.clientY, yaw: v.yaw, pitch: v.pitch, pointerId: e.pointerId, moved: false }
    }
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const pz = pinch.current
      if (pz) {
        if (pointers.current.size < 2) return
        const v = view.current!
        v.zoom = clampCamera({ ...cameraOf(v), zoom: pz.zoom * (pointerDistance() / pz.dist) }).zoom
        proposeCamera('zoom')
        repaint()
        return
      }
      const d = drag.current
      if (!d || d.pointerId !== e.pointerId || !can.orbit) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.moved) {
        if (Math.abs(dx) + Math.abs(dy) <= DRAG_THRESHOLD) return
        d.moved = true
        dragging.current = true
        suppressClick.current = true
        // Capture only once it is a drag, so a plain click still reaches the node under it.
        capturePointer(e.currentTarget, d.pointerId)
        stopCameraMove()
        startGesture()
        if (turntableRef.current) setTurntable(false)
        clearPreset()
      }
      const v = view.current!
      v.yaw = d.yaw + dx * ORBIT_YAW_PER_PX
      v.pitch = clampCamera({ ...cameraOf(v), pitch: d.pitch + dy * ORBIT_PITCH_PER_PX }).pitch
      proposeCamera('orbit')
      repaint()
    }
    const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
      pointers.current.delete(e.pointerId)
      releasePointer(e.currentTarget, e.pointerId)
      if (pinch.current) {
        if (pointers.current.size >= 2) {
          // The pinching pair changed: measure from here so the zoom doesn't jump.
          pinch.current = { dist: pointerDistance(), zoom: view.current!.zoom }
          return
        }
        // The finger left down does not start an orbit.
        pinch.current = null
        releaseClickSoon()
        repaint()
        emitCamera('zoom')
        return
      }
      const d = drag.current
      if (d && d.pointerId !== e.pointerId) return // another finger (pinch zoom off)
      drag.current = null
      if (!d?.moved) return
      dragging.current = false
      // The click that follows this pointerup is swallowed; anything after it (a later keyboard
      // activation included) goes through.
      releaseClickSoon()
      repaint() // places predicate pills again
      emitCamera('orbit')
    }

    // ── zoom (wheel, only while the scene has focus) ──────────────────────
    const canZoomRef = useRef(can.zoom)
    canZoomRef.current = can.zoom
    useEffect(() => {
      const el = stageRef.current
      if (!el) return
      const onWheel = (e: WheelEvent) => {
        if (!canZoomRef.current || !el.contains(document.activeElement)) return
        e.preventDefault()
        stopCameraMove()
        clearPreset()
        const v = view.current!
        v.zoom = clampCamera({ ...cameraOf(v), zoom: v.zoom * Math.exp(-e.deltaY * 0.0015) }).zoom
        proposeCamera('zoom')
        wheeling.current = true
        repaint()
        if (zoomEmitTimer.current) clearTimeout(zoomEmitTimer.current)
        zoomEmitTimer.current = setTimeout(() => {
          zoomEmitTimer.current = null
          wheeling.current = false
          repaint() // places the pills again
          emitCamera('zoom')
        }, 160)
      }
      // One finger scrolls the page vertically (touch-action: pan-y); two are a pinch, never a scroll.
      const onTouchMove = (e: TouchEvent) => {
        if (canZoomRef.current && e.targetTouches.length >= 2 && e.cancelable) e.preventDefault()
      }
      el.addEventListener('wheel', onWheel, { passive: false })
      el.addEventListener('touchmove', onTouchMove, { passive: false })
      return () => {
        el.removeEventListener('wheel', onWheel)
        el.removeEventListener('touchmove', onTouchMove)
        if (zoomEmitTimer.current) clearTimeout(zoomEmitTimer.current)
      }
    }, [stopCameraMove, clearPreset, repaint, emitCamera, proposeCamera])

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

    const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes])
    /** Links with both ends shown, in a stable order (paint sorts the elements by depth). */
    const drawnLinks = useMemo(
      () => linkEm.filter(({ link }) => visibleIds.has(link.sourceId) && visibleIds.has(link.targetId)),
      [linkEm, visibleIds],
    )

    // ── projection ────────────────────────────────────────────────────────
    // A closure over this render's data. `paint` calls the latest one through `projectRef` on every
    // frame, so a frame reads the live view (refs) against the structure React last rendered.
    const layerCount = index.layers.length
    const W = sceneWidth
    const H = sceneHeight
    const pcx = (x: number) => r2(((x + W / 2) / W) * 100)
    const pcy = (y: number) => r2(((y + H / 2) / H) * 100)
    const extent = planeSize
    const mixCache = useRef<{ layout: unknown; mix: number; positions: ReadonlyMap<string, Point> } | null>(null)
    const project = () => {
      const v = view.current!
      let positions: ReadonlyMap<string, Point> = fallbackPositions ?? new Map()
      if (layout) {
        const c = mixCache.current
        if (!c || c.layout !== layout || c.mix !== v.mix) mixCache.current = { layout, mix: v.mix, positions: mixLayerPositions(layout, v.mix) }
        positions = mixCache.current!.positions
      }
      const focus: StackFocus[] = []
      for (const [id, amount] of Object.entries(v.focus)) {
        const l = index.layerById.get(id)
        if (l && amount > 0) focus.push({ rank: l.rank, amount })
      }
      const focusAmt = Math.min(1, focus.reduce((s, f) => s + f.amount, 0))
      const planeYOf = (rank: number) => stackPlaneY(rank, layerCount, v.gap, focus, FOCUS_PUSH)
      // The camera follows the open plane (a blend of two while focus moves between layers);
      // `targetY` stays a free offset on top of that.
      const renderCam = clampCamera({
        ...cameraOf(v),
        targetY: v.targetY + focus.reduce((s, f) => s + f.amount * stackPlaneY(f.rank, layerCount, v.gap), 0),
      })
      const proj = createProjector(renderCam, axisOffset(renderCam.pitch, focusAmt))

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
          const center = proj({ x: 0, y, z: 0 })
          return {
            layer,
            depth: center.depth,
            points: svgPoints(corners),
            grid: planeGridLines(y, extent).map(([a, b]) => svgPoints([proj(a), proj(b)])),
            anchor: leftmostPoint(corners),
            center,
          }
        }),
        (p) => p.depth,
      )

      // Plane titles: at each plane's left corner; on a side rail when the planes overlap (top view).
      const titleSpacing = 46 * unitsPerPx
      const titles = (() => {
        const ranked = [...planes].sort((a, b) => a.layer.rank - b.layer.rank)
        if (topView && ranked.length > 0) {
          // Kept inside the scene, like the titles below: about 150px wide, right-aligned at x.
          const x = Math.max(-W / 2 + 150 * unitsPerPx, Math.min(...ranked.map((p) => p.anchor.x)) - 16)
          const cy = ranked.reduce((s, p) => s + p.center.y, 0) / ranked.length
          const rail = titleRail(ranked.length, x, cy, titleSpacing)
          return ranked.map((p, i) => ({ id: p.layer.id, x: rail[i].x, y: rail[i].y }))
        }
        // Kept inside the scene: a title is about 150px wide, right-aligned at x.
        const minX = -W / 2 + 150 * unitsPerPx
        const minY = -H / 2 + 22 * unitsPerPx
        const maxY = H / 2 - 22 * unitsPerPx
        const placed = ranked
          .map((p) => ({ id: p.layer.id, x: Math.max(minX, p.anchor.x - 8), y: clamp(p.anchor.y, minY, maxY) }))
          .sort((a, b) => a.y - b.y)
        for (let k = 1; k < placed.length; k++) {
          if (placed[k].y - placed[k - 1].y < titleSpacing) placed[k].y = placed[k - 1].y + titleSpacing
        }
        return placed
      })()

      // Links, arrowheads and pill candidates.
      const segs: { id: string; d: string; width: number; key: number }[] = []
      const arrows: { id: string; points: string | null; key: number }[] = []
      const candidates: (EdgeLabelCandidate & { color: string; opacity: number })[] = []
      for (const { link, em, text } of drawnLinks) {
        const a = P.get(link.sourceId)!
        const b = P.get(link.targetId)!
        const curve = lineCurve(a, b)
        const key = (a.depth + b.depth) / 2 - em.z * 1e4
        segs.push({ id: link.id, d: curve.d, width: r2(em.width * Math.min(a.scale, b.scale)), key })
        if (em.arrow) {
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.hypot(dx, dy) || 1
          const rb = radius(index.nodeById.get(link.targetId)!) + 2
          const ux = dx / len
          const uy = dy / len
          // Too short to carry a head: hidden.
          const points = len > rb + 14 ? arrowHeadPoints({ x: b.x - ux * rb, y: b.y - uy * rb }, ux, uy, 8 * b.scale, 3.6 * b.scale) : null
          arrows.push({ id: link.id, points, key })
        }
        if (text && em.opacity >= 0.2) {
          candidates.push({ id: link.id, text, pointAt: curve.pointAt, priority: edgeLabelPriority(link, em), color: em.color, opacity: em.highlighted ? 1 : 0.9 })
        }
      }

      // Drill-through column for the selection.
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
      return {
        P,
        radius,
        topView,
        planes,
        titles,
        segs: depthSort(segs, (s) => s.key),
        arrows: depthSort(arrows, (s) => s.key),
        candidates,
        drill,
        nodeDraw,
      }
    }
    const projectRef = useRef(project)
    const selNode = selectedId != null ? index.nodeById.get(selectedId) : undefined
    const scene = project()
    const planeOpacity = (layerId: string) => (focusedLayerId && layerId !== focusedLayerId ? 0.2 : 1)

    // Pills: skipped while the camera or the planes move (drag, turntable, any tween) and placed
    // once motion settles; placing them is far too costly per frame, and they would jump.
    const spinningRef = useRef(spinning)
    spinningRef.current = spinning
    const isMoving = useCallback(
      () => dragging.current || pinch.current !== null || wheeling.current || spinningRef.current || tween.isActive(),
      [tween],
    )
    const moving = isMoving()
    /** Motion and view as of the last commit: pills are placed for that view. */
    const renderedMoving = useRef(moving)
    const renderedView = useRef('')
    const viewNow = viewKey(view.current!)
    const pills = (() => {
      if (moving || scene.candidates.length === 0) return []
      const { P, radius, candidates } = scene
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

    // ── paint (per frame, and after every commit) ─────────────────────────
    const els = useRef<SceneElements | null>(null)
    const order = useRef<Record<string, string>>({})
    const paint = useCallback(() => {
      const e = els.current
      if (!e) return
      applyHeld()
      // Motion starting or settling re-renders once: pills hide, then are placed again. So does a
      // view that changed without motion (a jump: reduced motion, `animate: false`, a held prop).
      const nowMoving = isMoving()
      if (nowMoving !== renderedMoving.current || (!nowMoving && viewKey(view.current!) !== renderedView.current)) repaintNow()
      const s = projectRef.current()
      reorder(e.planeGroup, e.planes, s.planes.map((p) => p.layer.id), order.current, 'planes')
      for (const p of s.planes) {
        const g = e.planes.get(p.layer.id)
        if (!g) continue
        const [fill, ...grid] = g.children
        setAttr(fill, 'points', p.points)
        grid.forEach((line, i) => setAttr(line, 'points', p.grid[i] ?? ''))
      }
      reorder(e.linkGroup, e.links, s.segs.map((l) => l.id), order.current, 'links')
      for (const l of s.segs) {
        const path = e.links.get(l.id)
        if (!path) continue
        setAttr(path, 'd', l.d)
        setStyle(path, 'strokeWidth', String(l.width))
      }
      reorder(e.arrowGroup, e.arrows, s.arrows.map((a) => a.id), order.current, 'arrows')
      for (const a of s.arrows) {
        const head = e.arrows.get(a.id)
        if (!head) continue
        setAttr(head, 'points', a.points ?? '')
        setStyle(head, 'display', a.points ? '' : 'none')
      }
      if (s.drill && e.drillColumn) {
        setAttr(e.drillColumn, 'points', s.drill.column)
        for (const r of s.drill.rings) {
          const ring = e.drillRings.get(r.id)
          if (ring) setAttr(ring, 'points', r.points)
        }
      }
      const ids = s.nodeDraw.map((n) => n.id)
      reorder(e.nodeGroup, e.nodes, ids, order.current, 'nodes')
      s.nodeDraw.forEach((n, i) => {
        const p = s.P.get(n.id)!
        const r = s.radius(n)
        const g = e.nodes.get(n.id)
        if (g) {
          for (const c of g.children) {
            setAttr(c, 'cx', String(r1(p.x)))
            setAttr(c, 'cy', String(r1(p.y)))
            setAttr(c, 'r', String(r1(c.classList.contains('layer-stack__disc') ? r : r + 3.5)))
          }
        }
        const label = e.labels.get(n.id)
        if (label) {
          setStyle(label, 'left', `${pcxRef.current(p.x + r + 4)}%`)
          setStyle(label, 'top', `${pcyRef.current(p.y)}%`)
          setStyle(label, 'fontSize', `${r1(clamp(10.5 * p.scale, 8, 14))}px`)
          setStyle(label, 'zIndex', String(i + 1))
        }
      })
      for (const t of s.titles) {
        const el = e.titles.get(t.id)
        if (!el) continue
        setStyle(el, 'left', `${pcxRef.current(t.x)}%`)
        setStyle(el, 'top', `${pcyRef.current(t.y)}%`)
        el.classList.toggle('layer-stack__title--rail', s.topView)
      }
    }, [applyHeld, isMoving, repaintNow])
    const pcxRef = useRef(pcx)
    const pcyRef = useRef(pcy)
    // What a frame reads, as of this commit (before the paint below).
    useLayoutEffect(() => {
      projectRef.current = project
      paintRef.current = paint
      pcxRef.current = pcx
      pcyRef.current = pcy
      renderedMoving.current = moving
      renderedView.current = viewNow
    })
    // After every commit: find the elements React rendered, then draw them.
    useLayoutEffect(() => {
      els.current = stageRef.current ? collectElements(stageRef.current) : null
      order.current = {}
      paint()
    })
    // ── keyboard (roving focus over the node label buttons) ───────────────
    const [rovingId, setRovingId] = useState<string | null>(null)
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
    const buttonRefs = useRef(new Map<string, HTMLButtonElement>())
    const tabStop = (rovingId && visibleIds.has(rovingId) ? rovingId : null) ?? (selectedId && visibleIds.has(selectedId) ? selectedId : null) ?? visibleNodes[0]?.id ?? null
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
      moveView({ targetY: 0, zoom: fitZoom(pts, cam, { width: W, height: H, margin: 40 }, axisOffset(cam.pitch, 0)) }, 'fit')
    }, [visibleLayers, layerCount, extent, W, H, moveView, clearPreset])
    useImperativeHandle(
      ref,
      () => ({
        applyPreset,
        setCamera: (c, opts = {}) => {
          clearPreset()
          moveView(c, 'api', { animate: opts.animate })
        },
        getCamera: () => cameraOf(view.current!),
        getLayerGap: () => view.current!.gap,
        zoomBy: (f) => {
          clearPreset()
          moveView({ zoom: view.current!.zoom * f }, 'zoom', { duration: ZOOM_MS })
        },
        fit,
        setTurntable: (on) => setTurntableRef.current(on),
        focusLayer: (id) => g.focusLayer(id),
        select: (id) => g.select(id),
        setFollow: (n) => g.setFollow(n),
        element: () => stageRef.current,
      }),
      [applyPreset, clearPreset, moveView, fit, g],
    )

    // ── render ────────────────────────────────────────────────────────────
    const showLabel = (n: IndexedNode) => {
      const em = nodeEm.get(n.id)!
      if (n.id === hoveredId || n.id === focusedNodeId) return true
      if (nodeLabels === 'none') return false
      if (em.hop !== null) return true
      return nodeLabels === 'all' && em.opacity > 0.5
    }
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
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && selectedId && can.select) g.select(null)
        }}
        {...props}
      >
        <svg className="layer-stack__svg" viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <rect className="layer-stack__bg" x={-W / 2} y={-H / 2} width={W} height={H} onClick={onBackgroundClick} />
          {/* Geometry (points, d, cx/cy/r) and depth order are written by `paint`. */}
          <g className="layer-stack__planes">
            {visibleLayers.map((layer) => (
              <g key={layer.id} className="layer-stack__plane" opacity={planeOpacity(layer.id)} data-layer-id={layer.id}>
                <polygon
                  className={focusedLayerId === layer.id ? 'layer-stack__plane-fill layer-stack__plane-fill--focused' : 'layer-stack__plane-fill'}
                  style={{ fill: layer.color, stroke: layer.color }}
                  onClick={onBackgroundClick}
                />
                {GRID_LINES.map((i) => (
                  <polyline key={i} className="layer-stack__grid" style={{ stroke: layer.color }} />
                ))}
              </g>
            ))}
          </g>
          <g className="layer-stack__links">
            {drawnLinks.map(({ link, em }) => (
              <path
                key={link.id}
                className="layer-stack__link"
                data-link-id={link.id}
                style={{ stroke: em.color, strokeOpacity: em.opacity }}
                strokeDasharray={em.dash || undefined}
              />
            ))}
          </g>
          <g className="layer-stack__arrows">
            {drawnLinks.map(({ link, em }) =>
              em.arrow ? (
                <polygon
                  key={link.id}
                  className="layer-stack__arrow"
                  data-link-id={link.id}
                  style={{ fill: em.color, fillOpacity: em.highlighted ? 1 : 0.8 }}
                />
              ) : null,
            )}
          </g>
          {scene.drill && (
            <g className="layer-stack__drill">
              <polyline className="layer-stack__drill-column" />
              {scene.drill.rings.map((r) => (
                <polyline key={r.id} className="layer-stack__drill-ring" data-layer-id={r.id} />
              ))}
            </g>
          )}
          <g className="layer-stack__discs">
            {visibleNodes.map((n) => {
              const em = nodeEm.get(n.id)!
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
                  {ring && <circle className={`layer-stack__ring layer-stack__ring--${ring}`} />}
                  <circle className="layer-stack__disc" style={{ fill: layer.color }} />
                </g>
              )
            })}
          </g>
        </svg>

        <div className="layer-stack__overlay">
          {pills.map((pl) => (
            <span
              key={pl.id}
              data-link-id={pl.id}
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
                    style={{ opacity: r2(Math.max(em.opacity, 0.35)) }}
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
          {visibleLayers.map((layer) => {
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
              className: `layer-stack__title${focused ? ' layer-stack__title--focused' : ''}${scene.topView ? ' layer-stack__title--rail' : ''}`,
              style: { opacity: planeOpacity(layer.id) },
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
