import React, { useCallback, useContext, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AdjacencyMatrix, MatrixLinkInspector, useMatrixLinkPanel, type AdjacencyMatrixProps } from './AdjacencyMatrix'
import { Button } from './Button'
import { GraphCanvas, type GraphCanvasProps, type GraphEdge, type GraphNodeData } from './GraphCanvas'
import { HivePlot, type HivePlotProps } from './HivePlot'
import { Icon } from './Icon'
import {
  BridgeNodeList,
  FollowControl,
  followOptionLabel,
  LayerList,
  LayerPairList,
  LinkCategoryFilter,
  PlaneLayoutControl,
  PredicateLabelControl,
} from './LayeredGraphControls'
import { LayerStack, type LayerStackHandle, type LayerStackProps } from './LayerStack'
import { ReachInspector } from './ReachInspector'
import { SegmentedControl, type ChromeSurface } from './SegmentedControl'
import {
  LayeredGraphContext,
  layeredGraphSnapshotDefaults,
  useLayeredGraph,
  type LayeredGraphState,
  type UseLayeredGraphOptions,
} from '../hooks/useLayeredGraph'
import { CAMERA_PRESET_NAMES, cameraFromPreset, presetLayerGap, clampCamera, type CameraPresetName, type StackCamera } from '../utils/layered/projection'
import { sanitizeLayeredGraphSnapshot } from '../utils/layered/snapshot'
import type { BuildLayeredIndexOptions, LayeredGraphSnapshot } from '../utils/layered/types'
import './LayeredGraphControls.css'
import './LayeredGraphExplorer.css'

function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// ViewSwitcher
// ---------------------------------------------------------------------------

/** The four layered views the explorer can show. */
export type LayeredGraphView = 'stack' | 'lanes' | 'matrix' | 'hive'

export const LAYERED_GRAPH_VIEWS: readonly LayeredGraphView[] = ['stack', 'lanes', 'matrix', 'hive']

export const LAYERED_GRAPH_VIEW_LABELS: Readonly<Record<LayeredGraphView, string>> = {
  stack: '3D stack',
  lanes: 'Lanes',
  matrix: 'Matrix',
  hive: 'Hive',
}

export interface ViewSwitcherProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The views offered, in order. Default all four. */
  views?: readonly LayeredGraphView[]
  value: LayeredGraphView
  onChange: (view: LayeredGraphView) => void
  /** Segment text per view; default `3D stack`, `Lanes`, `Matrix`, `Hive`. */
  viewLabels?: Partial<Record<LayeredGraphView, React.ReactNode>>
  /** Mono eyebrow before the control; `null` hides it. */
  label?: React.ReactNode
  disabled?: boolean
  /** The surface the control sits on: `shell` for a dark chrome bar in either canvas theme. Default `canvas`. */
  surface?: ChromeSurface
}

/** Segmented control that picks a layered view. Plain props: it holds no state. */
export const ViewSwitcher = React.forwardRef<HTMLDivElement, ViewSwitcherProps>(
  ({ views = LAYERED_GRAPH_VIEWS, value, onChange, viewLabels, label = 'View', disabled, surface = 'canvas', className, ...props }, ref) => (
    <div ref={ref} className={cx('layered-control', surface === 'shell' && 'layered-control--shell', className)} {...props}>
      {label != null && <span className="layered-control__eyebrow">{label}</span>}
      <SegmentedControl
        aria-label="View"
        value={value}
        disabled={disabled}
        surface={surface}
        onChange={(v) => onChange(v as LayeredGraphView)}
        options={views.map((v) => ({ value: v, label: viewLabels?.[v] ?? LAYERED_GRAPH_VIEW_LABELS[v] }))}
      />
    </div>
  ),
)
ViewSwitcher.displayName = 'ViewSwitcher'

// ---------------------------------------------------------------------------
// CameraControls
// ---------------------------------------------------------------------------

const PRESET_LABELS: Record<CameraPresetName, string> = { stack: 'Stack', exploded: 'Exploded', top: 'Top', profile: 'Profile' }

export interface CameraControlsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** The `LayerStack` to drive: presets, zoom, fit and turntable go through its handle. */
  stack?: React.RefObject<LayerStackHandle | null>
  /** The preset shown as active (`null`: none, after a hand move). Wire to the stack's `cameraPreset` / `onCameraPresetChange`. */
  preset?: CameraPresetName | null
  /** Called with a picked preset. With `stack`, the handle applies it as well. */
  onPresetChange?: (preset: CameraPresetName) => void
  /** Presets offered, in order. Default all four; empty hides the control. */
  presets?: readonly CameraPresetName[]
  presetLabels?: Partial<Record<CameraPresetName, React.ReactNode>>
  /** Turntable state shown on the toggle. Wire to the stack's `turntable` / `onTurntableChange`. */
  turntable?: boolean
  /** Called by the toggle. Unset: the handle's `setTurntable`. */
  onTurntableChange?: (on: boolean) => void
  /** Zoom out / in buttons. Default true. */
  showZoom?: boolean
  /** Fit button. Default false. */
  showFit?: boolean
  /** Turntable toggle. Default true. */
  showTurntable?: boolean
  /** Zoom factor per button press. Default 1.2. */
  zoomStep?: number
  /** Mono eyebrow before the presets; `null` (default) hides it. */
  label?: React.ReactNode
  disabled?: boolean
}

/**
 * Camera chrome for a `LayerStack`: preset segmented control, zoom out / in, fit and a turntable
 * toggle. Drives the stack through its ref handle; the active preset and turntable shown come
 * from props (wire them to the stack's controlled props).
 */
export const CameraControls = React.forwardRef<HTMLDivElement, CameraControlsProps>(
  (
    {
      stack,
      preset = null,
      onPresetChange,
      presets = CAMERA_PRESET_NAMES,
      presetLabels,
      turntable = false,
      onTurntableChange,
      showZoom = true,
      showFit = false,
      showTurntable = true,
      zoomStep = 1.2,
      label = null,
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const pickPreset = (name: CameraPresetName) => {
      stack?.current?.applyPreset(name)
      onPresetChange?.(name)
    }
    const toggleTurntable = () => {
      if (onTurntableChange) onTurntableChange(!turntable)
      else stack?.current?.setTurntable(!turntable)
    }
    return (
      <div ref={ref} className={cx('layered-camera-controls', className)} role="group" aria-label="Camera" {...props}>
        {presets.length > 0 && (
          <div className="layered-control">
            {label != null && <span className="layered-control__eyebrow">{label}</span>}
            <SegmentedControl
              aria-label="Camera preset"
              value={preset ?? ''}
              disabled={disabled}
              onChange={(v) => pickPreset(v as CameraPresetName)}
              options={presets.map((p) => ({ value: p, label: presetLabels?.[p] ?? PRESET_LABELS[p] }))}
            />
          </div>
        )}
        {(showZoom || showFit || showTurntable) && (
          <div className="layered-camera-controls__buttons">
            {showZoom && (
              <>
                <Button variant="ghost" size="sm" disabled={disabled} onClick={() => stack?.current?.zoomBy(1 / zoomStep)}>
                  <Icon name="zoomOut" size={14} />
                  Zoom out
                </Button>
                <Button variant="ghost" size="sm" disabled={disabled} onClick={() => stack?.current?.zoomBy(zoomStep)}>
                  <Icon name="zoomIn" size={14} />
                  Zoom in
                </Button>
              </>
            )}
            {showFit && (
              <Button variant="ghost" size="sm" disabled={disabled} onClick={() => stack?.current?.fit()}>
                <Icon name="maximize" size={14} />
                Fit
              </Button>
            )}
            {showTurntable && (
              <Button
                variant={turntable ? 'accent' : 'ghost'}
                size="sm"
                disabled={disabled}
                aria-pressed={turntable}
                onClick={toggleTurntable}
              >
                <Icon name="reload" size={14} />
                Turntable
              </Button>
            )}
          </div>
        )}
      </div>
    )
  },
)
CameraControls.displayName = 'CameraControls'

// ---------------------------------------------------------------------------
// LayeredGraphExplorer
// ---------------------------------------------------------------------------

/** Which chrome the explorer renders. Every field defaults to true. */
export interface LayeredGraphExplorerControls {
  /** The view switcher (always hidden with a single view). */
  viewSwitcher?: boolean
  follow?: boolean
  /** `PredicateLabelControl` in the link bar. */
  predicateLabels?: boolean
  /**
   * The link bar (`LinkCategoryFilter`); off also hides its node-label toggle. With `predicateLabels`
   * on, the predicate control then shows in a bar of its own.
   */
  linkFilter?: boolean
  /** Node-label toggle in the link bar (stack and hive). */
  nodeLabels?: boolean
  /** `CameraControls` above the 3D stack. */
  camera?: boolean
  /** `PlaneLayoutControl` above the 3D stack. */
  planeLayout?: boolean
  /** `ReachInspector` in the side panel. */
  inspector?: boolean
  /** `LayerList` in the side panel with no selection. */
  layers?: boolean
  layerPairs?: boolean
  bridgeNodes?: boolean
  /** The mono status line. */
  status?: boolean
}

const ALL_CONTROLS: Required<LayeredGraphExplorerControls> = {
  viewSwitcher: true,
  follow: true,
  predicateLabels: true,
  linkFilter: true,
  nodeLabels: true,
  camera: true,
  planeLayout: true,
  inspector: true,
  layers: true,
  layerPairs: true,
  bridgeNodes: true,
  status: true,
}

type Passthrough<P> = Omit<P, 'graph' | 'nodes' | 'edges' | 'layering' | 'graphOptions'>

/** The 3D stack's camera in an explorer snapshot. */
export interface LayeredGraphExplorerCamera {
  /** The active preset; null once the camera has been moved by hand. */
  preset: CameraPresetName | null
  camera: StackCamera
  /** Distance between planes, world units. */
  layerGap: number
}

/**
 * The whole explorer as plain, JSON-serializable data: the shared graph state
 * (`LayeredGraphSnapshot`), the view, node labels and the 3D stack's camera (kept while another
 * view shows). Round-trip it through a URL or history entry with `defaultSnapshot`,
 * `onSnapshotChange` and the `explorerRef` handle's `restore`.
 */
export interface LayeredGraphExplorerSnapshot extends LayeredGraphSnapshot {
  view: LayeredGraphView
  nodeLabels: boolean
  stack: LayeredGraphExplorerCamera
}

/** A snapshot to restore: any field may be left out, `stack` fields included. */
export type LayeredGraphExplorerSnapshotInput = Partial<Omit<LayeredGraphExplorerSnapshot, 'stack'>> & {
  stack?: Partial<LayeredGraphExplorerCamera>
}

/** The explorer's imperative handle (`explorerRef`). */
export interface LayeredGraphExplorerHandle {
  /** The snapshot as it is now; the 3D camera is read live when the stack shows (mid-tween included). */
  getSnapshot: () => LayeredGraphExplorerSnapshot
  /**
   * Applies the fields given (sanitized first: malformed ones are dropped); the rest stay. A
   * changed `stack` camera jumps (no tween), stops the turntable and remounts the stack, so read
   * `stack()` again afterwards; an unchanged one leaves the stack alone.
   */
  restore: (snapshot: LayeredGraphExplorerSnapshotInput) => void
  /** The 3D stack's handle while it shows, else null. Re-read it after a `restore` that changes the camera. */
  stack: () => LayerStackHandle | null
}

export interface LayeredGraphExplorerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'title'> {
  /** External state from `useLayeredGraph`. Unset: the enclosing `LayeredGraphContext`, else its own from `nodes` / `edges` / `layering`. */
  graph?: LayeredGraphState
  /** Standalone data (ignored with `graph` or a context). */
  nodes?: readonly GraphNodeData[]
  edges?: readonly GraphEdge[]
  /** Standalone layering. Memoize it. */
  layering?: BuildLayeredIndexOptions
  /** Standalone selection, follow, filters, label mode, focus, plane layout (controlled or default). */
  graphOptions?: Omit<UseLayeredGraphOptions, 'nodes' | 'edges' | 'layering'>

  /** Views offered, in switcher order. One view hides the switcher. Default all four. */
  views?: readonly LayeredGraphView[]
  viewLabels?: Partial<Record<LayeredGraphView, React.ReactNode>>
  /** Controlled view. */
  view?: LayeredGraphView
  /** Initial view when uncontrolled. Default the first of `views`. */
  defaultView?: LayeredGraphView
  onViewChange?: (view: LayeredGraphView) => void

  /** Imperative handle: `getSnapshot()`, `restore(snapshot)`, `stack()`. (`ref` is the root element.) */
  explorerRef?: React.Ref<LayeredGraphExplorerHandle>
  /**
   * Initial state, e.g. a snapshot parsed from the URL (sanitized: malformed fields are dropped).
   * Read once, on mount. Seeds the view, node
   * labels, 3D camera and the explorer's own graph state. With a `graph` prop or a context, seed
   * that state yourself (`layeredGraphSnapshotDefaults`); the rest still applies.
   */
  defaultSnapshot?: LayeredGraphExplorerSnapshotInput
  /** Called when the snapshot changes (not on mount). A camera move reports once it settles. */
  onSnapshotChange?: (snapshot: LayeredGraphExplorerSnapshot) => void

  /** Which chrome to render; every field defaults to true. */
  controls?: LayeredGraphExplorerControls
  /** Follow depths offered by `FollowControl`. Default `[0, 1, 2]`. */
  followOptions?: readonly number[]

  /** Heading in the header. */
  title?: React.ReactNode
  /** Mono eyebrow above the title. */
  eyebrow?: React.ReactNode
  /** Dataset label at the start of the status line. */
  statusLabel?: React.ReactNode
  /**
   * Header and status line on the shell surface (default) or the canvas. On `shell` the header's
   * `ViewSwitcher` and `FollowControl` get `surface="shell"`.
   */
  chromeSurface?: ChromeSurface

  /**
   * Node labels on or off (controlled), over the graph's `nodeLabels` state. Unset: the graph
   * state, which the label toggle writes (the same as `graphOptions.nodeLabels`).
   */
  nodeLabels?: boolean
  /** Initial node labels. Seeds the explorer's own graph state; with a `graph` prop or a context, the explorer keeps it apart from that state. Default true. */
  defaultNodeLabels?: boolean
  /** Called by the label toggle. */
  onNodeLabelsChange?: (on: boolean) => void

  /** Per-view passthrough. Explorer-owned props (state, camera wiring) are composed with these. */
  stackProps?: Passthrough<LayerStackProps>
  lanesProps?: Partial<Omit<GraphCanvasProps, 'layout' | 'layeredGraph' | 'layering' | 'layeredGraphOptions'>>
  matrixProps?: Passthrough<AdjacencyMatrixProps>
  hiveProps?: Passthrough<HivePlotProps>

  /** Fixed height (px or CSS length): the scene fills what the chrome leaves and the panels scroll. Unset: the explorer grows with its content. */
  height?: number | string
  /** Below this width (px) the inspector panel stacks under the scene. Default 960. */
  stackBelow?: number
  /** Width of the inspector panel in px. Default 340. */
  asideWidth?: number
}

const EMPTY_NODES: GraphNodeData[] = []
const EMPTY_EDGES: GraphEdge[] = []
const EMPTY_LAYERING: BuildLayeredIndexOptions = { layerBy: '' }
const LANES_HEIGHT = 560

const deg = (a: number) => Math.round((a * 180) / Math.PI)

/** `stack · yaw -36° pitch 29° zoom 1.00 · gap 170` */
function cameraSummary(camera: StackCamera, preset: CameraPresetName | null, gap: number): string {
  return [preset, `yaw ${deg(camera.yaw)}° pitch ${deg(camera.pitch)}° zoom ${camera.zoom.toFixed(2)}`, `gap ${Math.round(gap)}`]
    .filter(Boolean)
    .join(' · ')
}

interface StackMemory {
  camera: StackCamera
  preset: CameraPresetName | null
  gap: number
  turntable: boolean
}

const CAMERA_FIELDS = ['yaw', 'pitch', 'zoom', 'targetY'] as const
/** Largest layer gap a snapshot may restore, world units (the presets use 170–300). */
const MAX_LAYER_GAP = 5000

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * An untrusted explorer snapshot (parsed from a URL, storage or a message) reduced to well-formed
 * fields: the graph fields through `sanitizeLayeredGraphSnapshot`, `view` among `views`,
 * `nodeLabels` a boolean, and the stack's preset a known name, camera fields finite numbers and
 * `layerGap` finite and positive. Anything else is dropped. Every explorer entry point
 * (`defaultSnapshot`, `restore`) runs its input through this.
 */
export function sanitizeLayeredGraphExplorerSnapshot(
  input: unknown,
  views: readonly LayeredGraphView[] = LAYERED_GRAPH_VIEWS,
): LayeredGraphExplorerSnapshotInput {
  if (!isRecord(input)) return {}
  const out: LayeredGraphExplorerSnapshotInput = { ...sanitizeLayeredGraphSnapshot(input) }
  if (typeof input.view === 'string' && (views as readonly string[]).includes(input.view)) out.view = input.view as LayeredGraphView
  if (typeof input.nodeLabels === 'boolean') out.nodeLabels = input.nodeLabels
  if (isRecord(input.stack)) {
    const s = input.stack
    const stack: Partial<LayeredGraphExplorerCamera> = {}
    if (s.preset === null || (typeof s.preset === 'string' && (CAMERA_PRESET_NAMES as readonly string[]).includes(s.preset))) {
      stack.preset = s.preset as CameraPresetName | null
    }
    if (isRecord(s.camera)) {
      const camera: Partial<StackCamera> = {}
      for (const k of CAMERA_FIELDS) {
        const v = s.camera[k]
        if (typeof v === 'number' && Number.isFinite(v)) camera[k] = v
      }
      stack.camera = camera as StackCamera
    }
    if (typeof s.layerGap === 'number' && Number.isFinite(s.layerGap) && s.layerGap > 0 && s.layerGap <= MAX_LAYER_GAP) stack.layerGap = s.layerGap
    out.stack = stack
  }
  return out
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6

/**
 * The stack memory's invariant: a preset is active exactly when the stored camera and gap are the
 * preset's own. Memory that names a preset but holds another camera or gap (a `stackProps`
 * override, or a snapshot with both) keeps the camera and gap and drops the preset.
 */
function withPresetInvariant(m: StackMemory, layerCount: number): StackMemory {
  if (!m.preset) return m
  const p = cameraFromPreset(m.preset)
  const matches = near(m.gap, presetLayerGap(m.preset, layerCount)) && CAMERA_FIELDS.every((k) => near(m.camera[k], p[k]))
  return matches ? m : { ...m, preset: null }
}

/** The memory after a preset is picked: the preset's camera and gap, written at once (the stack tweens to them). */
function presetMemory(m: StackMemory, preset: CameraPresetName, layerCount: number): StackMemory {
  return { ...m, preset, camera: cameraFromPreset(preset), gap: presetLayerGap(preset, layerCount) }
}

/**
 * The remembered stack camera with a (sanitized) snapshot's fields applied: a preset fills what the
 * snapshot leaves out, pitch and zoom are clamped to the ranges the stack draws, and a camera or
 * gap other than the preset's drops the preset (`withPresetInvariant`). A restored camera stops the
 * turntable, which would otherwise move it at once.
 */
function withCamera(m: StackMemory, s: Partial<LayeredGraphExplorerCamera>, layerCount: number): StackMemory {
  const base = s.preset ? presetMemory(m, s.preset, layerCount) : s.preset === null ? { ...m, preset: null } : m
  return withPresetInvariant(
    {
    preset: base.preset,
    camera: clampCamera({ ...base.camera, ...s.camera }),
    gap: s.layerGap ?? base.gap,
    turntable: false,
    },
    layerCount,
  )
}
function sameStackMemory(a: StackMemory, b: StackMemory): boolean {
  return a.preset === b.preset && near(a.gap, b.gap) && a.turntable === b.turntable && CAMERA_FIELDS.every((k) => near(a.camera[k], b.camera[k]))
}

/**
 * The stack camera as a snapshot reports it: the memory as is. A picked preset writes its camera and
 * gap at once, so a preset move reports its destination once (the tween-end reports change nothing).
 */
function stackSnapshot(m: StackMemory): LayeredGraphExplorerCamera {
  return { preset: m.preset, camera: m.camera, layerGap: m.gap }
}

/**
 * The ready-made layered graph explorer: a header with the view switcher and follow control, the
 * chosen view's scene with its own controls (camera for the 3D stack), the link bar, the reach
 * inspector in a side panel (stacked below on narrow widths) and a mono status line. Selection,
 * follow, filters and focus are one `useLayeredGraph` state shared across view switches; the 3D
 * camera is remembered when switching away and back.
 */
export const LayeredGraphExplorer = React.forwardRef<HTMLDivElement, LayeredGraphExplorerProps>(
  (
    {
      graph,
      nodes,
      edges,
      layering,
      graphOptions,
      views: viewsProp = LAYERED_GRAPH_VIEWS,
      viewLabels,
      view: viewProp,
      defaultView,
      onViewChange,
      explorerRef,
      defaultSnapshot,
      onSnapshotChange,
      controls,
      followOptions,
      title,
      eyebrow,
      statusLabel,
      chromeSurface = 'shell',
      nodeLabels: nodeLabelsProp,
      defaultNodeLabels,
      onNodeLabelsChange,
      stackProps,
      lanesProps,
      matrixProps,
      hiveProps,
      height,
      stackBelow = 960,
      asideWidth = 340,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    // Read once: the initial snapshot is untrusted (a URL), so it is sanitized first.
    const [initialSnapshot] = useState(() => sanitizeLayeredGraphExplorerSnapshot(defaultSnapshot, viewsProp.length > 0 ? viewsProp : LAYERED_GRAPH_VIEWS))
    const ctx = useContext(LayeredGraphContext)
    const external = graph ?? ctx
    const own = useLayeredGraph(
      external
        ? { nodes: EMPTY_NODES, edges: EMPTY_EDGES, layering: EMPTY_LAYERING, layout: false }
        : {
            ...graphOptions,
            defaultNodeLabels: graphOptions?.defaultNodeLabels ?? defaultNodeLabels,
            ...layeredGraphSnapshotDefaults(initialSnapshot),
            nodes: nodes ?? EMPTY_NODES,
            edges: edges ?? EMPTY_EDGES,
            layering: layering ?? EMPTY_LAYERING,
          },
    )
    const g = external ?? own
    const show = { ...ALL_CONTROLS, ...controls }

    // ── view ──────────────────────────────────────────────────────────────
    const views = viewsProp.length > 0 ? viewsProp : LAYERED_GRAPH_VIEWS
    const [innerView, setInnerView] = useState<LayeredGraphView>(initialSnapshot.view ?? defaultView ?? views[0])
    const requested = viewProp ?? innerView
    const view = views.includes(requested) ? requested : views[0]

    // ── matrix cell shown in the inspector; a consumer cell handler replaces the panel ──
    const consumerCellSelect = matrixProps?.onCellSelect ?? matrixProps?.onLinkSelect
    const linkPanel = useMatrixLinkPanel(g, show.inspector && !consumerCellSelect && view === 'matrix', view)
    const shownCell = linkPanel.shown

    // ── node labels: the graph's state, unless controlled here ─────────────
    // `defaultNodeLabels` with external state is kept here, as it was before the graph held labels.
    const [localLabels, setLocalLabels] = useState<boolean | undefined>(external ? (initialSnapshot.nodeLabels ?? defaultNodeLabels) : undefined)
    const nodeLabels = nodeLabelsProp ?? localLabels ?? (g.nodeLabels !== false)
    const setNodeLabels = useCallback(
      (on: boolean) => {
        if (nodeLabelsProp === undefined) {
          if (localLabels !== undefined) setLocalLabels(on)
          else g.setNodeLabels(on)
        }
        onNodeLabelsChange?.(on)
      },
      [nodeLabelsProp, localLabels, g, onNodeLabelsChange],
    )

    // ── 3D camera, remembered across view switches ────────────────────────
    const stackRef = useRef<LayerStackHandle | null>(null)
    // Preset gaps close up on tall stacks (`presetLayerGap`), so the memory needs the layer count.
    const layerCount = g.index.layers.length
    const layerCountRef = useRef(layerCount)
    layerCountRef.current = layerCount
    const [stackMem, setStackMem] = useState<StackMemory>(() => {
      const preset = stackProps?.cameraPreset ?? stackProps?.defaultCameraPreset ?? 'stack'
      const initial: StackMemory = {
        camera: { ...cameraFromPreset(preset ?? 'stack'), ...stackProps?.defaultCamera },
        preset,
        gap: stackProps?.layerGap ?? stackProps?.defaultLayerGap ?? presetLayerGap(preset ?? 'stack', layerCount),
        turntable: stackProps?.turntable ?? stackProps?.defaultTurntable ?? false,
      }
      return initialSnapshot.stack ? withCamera(initial, initialSnapshot.stack, layerCount) : withPresetInvariant(initial, layerCount)
    })
    const stackMemRef = useRef(stackMem)
    stackMemRef.current = stackMem
    // A graph that arrives (or changes its layer count) after mount: an active preset takes its gap
    // for that many layers, as the stack does, so the memory keeps the preset invariant.
    const controlledGap = stackProps?.layerGap !== undefined
    useEffect(() => {
      if (controlledGap) return
      setStackMem((m) => (m.preset && !near(m.gap, presetLayerGap(m.preset, layerCount)) ? presetMemory(m, m.preset, layerCount) : m))
    }, [layerCount, controlledGap])
    // Bumped by `restore` to remount the stack, which then starts from the restored camera. Camera
    // reports from a stack of an older epoch (its unmount reports the turntable stopping) are ignored.
    const [stackEpoch, setStackEpoch] = useState(0)
    /**
     * The camera the stack last reported, for the status line: a preset's own camera in memory can
     * differ from what the stack shows (a tall stack is fitted). Cleared when a preset is picked or
     * the stack remounts, until the stack reports again.
     */
    const [liveCamera, setLiveCamera] = useState<StackCamera | null>(null)
    const stackEpochRef = useRef(stackEpoch)

    const changeView = useCallback(
      (next: LayeredGraphView, rememberCamera = true) => {
        if (next === view) return
        // With a preset active the memory already holds its camera (even mid-tween); otherwise keep the live one.
        if (rememberCamera && view === 'stack' && stackRef.current && !stackMemRef.current.preset) {
          const camera = stackRef.current.getCamera()
          setStackMem((m) => (m.preset ? m : { ...m, camera }))
        }
        if (viewProp === undefined) setInnerView(next)
        onViewChange?.(next)
      },
      [view, viewProp, onViewChange],
    )

    // ── narrow layout (inspector below the scene) ─────────────────────────
    const rootRef = useRef<HTMLDivElement | null>(null)
    const setRoot = useCallback(
      (el: HTMLDivElement | null) => {
        rootRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
      },
      [ref],
    )
    const [narrow, setNarrow] = useState(false)
    useLayoutEffect(() => {
      const el = rootRef.current
      if (!el) return
      const measure = () => {
        const w = el.getBoundingClientRect().width
        if (w > 0) setNarrow(w < stackBelow)
      }
      measure()
      if (typeof ResizeObserver === 'undefined') return
      const ro = new ResizeObserver(measure)
      ro.observe(el)
      return () => ro.disconnect()
    }, [stackBelow])

    const fixed = height !== undefined

    // ── snapshot ──────────────────────────────────────────────────────────
    const snapshot = useMemo<LayeredGraphExplorerSnapshot>(
      () => ({ ...g.snapshot, view, nodeLabels, stack: stackSnapshot(stackMem) }),
      [g.snapshot, view, nodeLabels, stackMem],
    )
    const snapshotRef = useRef(snapshot)
    snapshotRef.current = snapshot
    const onSnapshotChangeRef = useRef(onSnapshotChange)
    onSnapshotChangeRef.current = onSnapshotChange
    const lastSnapshotKey = useRef<string | null>(null)
    useEffect(() => {
      const key = JSON.stringify(snapshot)
      const first = lastSnapshotKey.current === null
      if (key === lastSnapshotKey.current) return
      lastSnapshotKey.current = key
      if (!first) onSnapshotChangeRef.current?.(snapshot)
    }, [snapshot])

    const restore = useCallback(
      (input: LayeredGraphExplorerSnapshotInput) => {
        const s = sanitizeLayeredGraphExplorerSnapshot(input, views)
        g.restore(s)
        if (s.nodeLabels !== undefined) setNodeLabels(s.nodeLabels)
        let stackChanged = false
        if (s.stack) {
          const next = withCamera(stackMemRef.current, s.stack, layerCountRef.current)
          stackChanged = !sameStackMemory(next, stackMemRef.current)
          if (stackChanged) {
            stackMemRef.current = next
            setStackMem(next)
            stackEpochRef.current += 1
            setStackEpoch(stackEpochRef.current)
            setLiveCamera(null)
          }
        }
        if (s.view !== undefined) changeView(s.view, !stackChanged)
      },
      [g, views, setNodeLabels, changeView],
    )
    useImperativeHandle(
      explorerRef,
      () => ({
        getSnapshot: () => {
          const snap = snapshotRef.current
          // A hand-moved camera is read live; a preset reports its own camera (see stackSnapshot).
          const live = snap.view === 'stack' && snap.stack.preset === null ? stackRef.current : null
          return live ? { ...snap, stack: { ...snap.stack, camera: live.getCamera(), layerGap: live.getLayerGap() } } : snap
        },
        restore,
        stack: () => stackRef.current,
      }),
      [restore],
    )

    // ── scene ─────────────────────────────────────────────────────────────
    let scene: React.ReactNode = null
    const epoch = stackEpoch
    if (view === 'stack') {
      scene = (
        <LayerStack
          key={`stack-${stackEpoch}`}
          nodeLabels={nodeLabels ? 'all' : 'reached'}
          {...stackProps}
          ref={stackRef}
          graph={g}
          cameraPreset={stackMem.preset}
          defaultCamera={stackMem.camera}
          defaultLayerGap={stackMem.gap}
          turntable={stackMem.turntable}
          onCameraPresetChange={(preset) => {
            if (epoch !== stackEpochRef.current) return
            setStackMem((m) => (preset ? presetMemory(m, preset, layerCountRef.current) : { ...m, preset: null }))
            if (preset) setLiveCamera(null)
            stackProps?.onCameraPresetChange?.(preset)
          }}
          onTurntableChange={(on) => {
            if (epoch !== stackEpochRef.current) return
            setStackMem((m) => ({ ...m, turntable: on }))
            stackProps?.onTurntableChange?.(on)
          }}
          onLayerGapChange={(gap) => {
            if (epoch !== stackEpochRef.current) return
            setStackMem((m) => (m.preset ? m : { ...m, gap }))
            stackProps?.onLayerGapChange?.(gap)
          }}
          onCameraChange={(camera, cause) => {
            if (epoch !== stackEpochRef.current) return
            setStackMem((m) => (m.preset ? m : { ...m, camera }))
            setLiveCamera(camera)
            stackProps?.onCameraChange?.(camera, cause)
          }}
          className={cx('layered-graph-explorer__stack', stackProps?.className)}
        />
      )
    } else if (view === 'lanes') {
      scene = (
        <GraphCanvas
          key="lanes"
          nodes={(nodes ?? EMPTY_NODES) as GraphNodeData[]}
          edges={(edges ?? EMPTY_EDGES) as GraphEdge[]}
          fitView
          fitPadding={24}
          {...lanesProps}
          layout="layer-lanes"
          layeredGraph={g}
          laneOptions={{ nodeLabels: nodeLabels ? 'all' : 'reached', ...lanesProps?.laneOptions }}
          className={cx('layered-graph-explorer__lanes', lanesProps?.className)}
          style={{ width: '100%', height: fixed && !narrow ? '100%' : LANES_HEIGHT, ...lanesProps?.style }}
        />
      )
    } else if (view === 'matrix') {
      scene = (
        <AdjacencyMatrix
          key="matrix"
          selectedLinkId={shownCell?.links[shownCell.at].id}
          {...matrixProps}
          graph={g}
          onCellSelect={linkPanel.enabled ? linkPanel.open : matrixProps?.onCellSelect}
        />
      )
    } else {
      scene = (
        <HivePlot
          key="hive"
          axisLabels={nodeLabels ? 1 : 0}
          {...hiveProps}
          graph={g}
          className={cx('layered-graph-explorer__hive', hiveProps?.className)}
        />
      )
    }

    // ── chrome ────────────────────────────────────────────────────────────
    const showSwitcher = show.viewSwitcher && views.length > 1
    const headerControls = showSwitcher || show.follow
    const showHeader = headerControls || title != null || eyebrow != null
    // On lanes the toggle can't apply over a fixed laneOptions.nodeLabels or a custom renderNode.
    const lanesLabelsApply = lanesProps?.laneOptions?.nodeLabels === undefined && !lanesProps?.renderNode
    const labelsApply = view === 'stack' || view === 'hive' || (view === 'lanes' && lanesLabelsApply)
    const sceneTools = view === 'stack' && (show.camera || show.planeLayout)
    const listsShown = show.layers || show.layerPairs || show.bridgeNodes
    const lists = listsShown ? (
      <>
        {show.layers && <LayerList />}
        {show.layerPairs && <LayerPairList />}
        {show.bridgeNodes && <BridgeNodeList />}
      </>
    ) : null
    const showAside = show.inspector || listsShown

    const { index } = g
    const crossCount = useMemo(() => index.links.filter((l) => l.cross).length, [index])
    const statusParts = [
      `${index.nodes.length} nodes · ${index.links.length} links · ${crossCount} cross-layer · ${index.layers.length} layers`,
      `${LAYERED_GRAPH_VIEW_LABELS[view].toLowerCase()} · follow ${followOptionLabel(g.follow).toLowerCase()}`,
    ]

    return (
      <LayeredGraphContext.Provider value={g}>
        <div
          ref={setRoot}
          className={cx(
            'layered-graph-explorer',
            `layered-graph-explorer--${view}`,
            fixed && 'layered-graph-explorer--fixed',
            narrow && 'layered-graph-explorer--narrow',
            chromeSurface === 'shell' && 'layered-graph-explorer--shell-chrome',
            className,
          )}
          style={{ height, ['--layered-explorer-aside' as string]: `${asideWidth}px`, ...style }}
          data-view={view}
          {...props}
        >
          {showHeader && (
            <header className="layered-graph-explorer__header">
              {(title != null || eyebrow != null) && (
                <div className="layered-graph-explorer__heading">
                  {eyebrow != null && <span className="layered-control__eyebrow layered-graph-explorer__eyebrow">{eyebrow}</span>}
                  {title != null && <h2 className="layered-graph-explorer__title">{title}</h2>}
                </div>
              )}
              {headerControls && (
                <div className="layered-graph-explorer__header-controls">
                  {showSwitcher && (
                    <ViewSwitcher views={views} value={view} onChange={changeView} viewLabels={viewLabels} surface={chromeSurface} />
                  )}
                  {show.follow && <FollowControl options={followOptions} surface={chromeSurface} />}
                </div>
              )}
            </header>
          )}
          <div className="layered-graph-explorer__body">
            <div className="layered-graph-explorer__main">
              {sceneTools && (
                <div className="layered-graph-explorer__tools">
                  {show.camera && (
                    <CameraControls
                      stack={stackRef}
                      preset={stackMem.preset}
                      turntable={stackMem.turntable}
                      onTurntableChange={(on) => setStackMem((m) => ({ ...m, turntable: on }))}
                    />
                  )}
                  {show.planeLayout && <PlaneLayoutControl className="layered-graph-explorer__plane-layout" />}
                </div>
              )}
              <div className={`layered-graph-explorer__scene layered-graph-explorer__scene--${view}`}>{scene}</div>
              {show.linkFilter && (
                <LinkCategoryFilter
                  className="layered-graph-explorer__link-bar"
                  showLabelToggle={show.nodeLabels && labelsApply}
                  nodeLabels={nodeLabels}
                  onNodeLabelsChange={setNodeLabels}
                >
                  {show.predicateLabels && <PredicateLabelControl />}
                </LinkCategoryFilter>
              )}
              {!show.linkFilter && show.predicateLabels && (
                <div className="layered-graph-explorer__link-bar">
                  <PredicateLabelControl />
                </div>
              )}
            </div>
            {showAside && (
              <aside className="layered-graph-explorer__aside" aria-label="Inspector">
                {shownCell && (
                  <MatrixLinkInspector graph={g} links={shownCell.links} at={shownCell.at} onStep={linkPanel.step} onClose={linkPanel.close} />
                )}
                {show.inspector ? <ReachInspector empty={lists ?? undefined} /> : lists}
              </aside>
            )}
          </div>
          {show.status && (
            <footer className="layered-graph-explorer__status" role="status" aria-live="off">
              {statusLabel != null && <span>{statusLabel}</span>}
              {statusParts.map((s) => (
                <span key={s}>{s}</span>
              ))}
              {view === 'stack' && (
                <span className="layered-graph-explorer__status-camera">{cameraSummary(liveCamera ?? stackMem.camera, stackMem.preset, stackMem.gap)}</span>
              )}
            </footer>
          )}
        </div>
      </LayeredGraphContext.Provider>
    )
  },
)
LayeredGraphExplorer.displayName = 'LayeredGraphExplorer'

export default LayeredGraphExplorer
