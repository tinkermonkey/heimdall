import React, { useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AdjacencyMatrix, type AdjacencyMatrixProps } from './AdjacencyMatrix'
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
import { SegmentedControl } from './SegmentedControl'
import { LayeredGraphContext, useLayeredGraph, type LayeredGraphState, type UseLayeredGraphOptions } from '../hooks/useLayeredGraph'
import { CAMERA_PRESET_NAMES, CAMERA_PRESETS, cameraFromPreset, type CameraPresetName, type StackCamera } from '../utils/layered/projection'
import type { BuildLayeredIndexOptions } from '../utils/layered/types'
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
}

/** Segmented control that picks a layered view. Plain props: it holds no state. */
export const ViewSwitcher = React.forwardRef<HTMLDivElement, ViewSwitcherProps>(
  ({ views = LAYERED_GRAPH_VIEWS, value, onChange, viewLabels, label = 'View', disabled, className, ...props }, ref) => (
    <div ref={ref} className={cx('layered-control', className)} {...props}>
      {label != null && <span className="layered-control__eyebrow">{label}</span>}
      <SegmentedControl
        aria-label="View"
        value={value}
        disabled={disabled}
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
  /** The link bar (`LinkCategoryFilter`); off also hides the predicate and node-label controls in it. */
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
  /** Header and status line on the shell surface (default) or the canvas. */
  chromeSurface?: 'shell' | 'canvas'

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
    const ctx = useContext(LayeredGraphContext)
    const external = graph ?? ctx
    const own = useLayeredGraph(
      external
        ? { nodes: EMPTY_NODES, edges: EMPTY_EDGES, layering: EMPTY_LAYERING, layout: false }
        : {
            ...graphOptions,
            defaultNodeLabels: graphOptions?.defaultNodeLabels ?? defaultNodeLabels,
            nodes: nodes ?? EMPTY_NODES,
            edges: edges ?? EMPTY_EDGES,
            layering: layering ?? EMPTY_LAYERING,
          },
    )
    const g = external ?? own
    const show = { ...ALL_CONTROLS, ...controls }

    // ── view ──────────────────────────────────────────────────────────────
    const views = viewsProp.length > 0 ? viewsProp : LAYERED_GRAPH_VIEWS
    const [innerView, setInnerView] = useState<LayeredGraphView>(defaultView ?? views[0])
    const requested = viewProp ?? innerView
    const view = views.includes(requested) ? requested : views[0]

    // ── node labels: the graph's state, unless controlled here ─────────────
    // `defaultNodeLabels` with external state is kept here, as it was before the graph held labels.
    const [localLabels, setLocalLabels] = useState<boolean | undefined>(external ? defaultNodeLabels : undefined)
    const nodeLabels = nodeLabelsProp ?? localLabels ?? g.nodeLabels
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
    const [stackMem, setStackMem] = useState<StackMemory>(() => {
      const preset = stackProps?.cameraPreset ?? stackProps?.defaultCameraPreset ?? 'stack'
      return {
        camera: { ...cameraFromPreset(preset ?? 'stack'), ...stackProps?.defaultCamera },
        preset,
        gap: stackProps?.layerGap ?? stackProps?.defaultLayerGap ?? CAMERA_PRESETS[preset ?? 'stack'].layerGap,
        turntable: stackProps?.turntable ?? stackProps?.defaultTurntable ?? false,
      }
    })

    const changeView = useCallback(
      (next: LayeredGraphView) => {
        if (next === view) return
        if (view === 'stack' && stackRef.current) {
          const remembered = { ...stackMem, camera: stackRef.current.getCamera() }
          setStackMem(remembered)
        }
        if (viewProp === undefined) setInnerView(next)
        onViewChange?.(next)
      },
      [view, viewProp, onViewChange, stackMem],
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

    // ── scene ─────────────────────────────────────────────────────────────
    let scene: React.ReactNode = null
    if (view === 'stack') {
      scene = (
        <LayerStack
          key="stack"
          nodeLabels={nodeLabels ? 'all' : 'reached'}
          {...stackProps}
          ref={stackRef}
          graph={g}
          cameraPreset={stackMem.preset}
          defaultCamera={stackMem.camera}
          defaultLayerGap={stackMem.gap}
          turntable={stackMem.turntable}
          onCameraPresetChange={(preset) => {
            setStackMem((m) => ({ ...m, preset }))
            stackProps?.onCameraPresetChange?.(preset)
          }}
          onTurntableChange={(on) => {
            setStackMem((m) => ({ ...m, turntable: on }))
            stackProps?.onTurntableChange?.(on)
          }}
          onLayerGapChange={(gap) => {
            setStackMem((m) => ({ ...m, gap }))
            stackProps?.onLayerGapChange?.(gap)
          }}
          onCameraChange={(camera, cause) => {
            setStackMem((m) => ({ ...m, camera }))
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
          className={cx('layered-graph-explorer__lanes', lanesProps?.className)}
          style={{ width: '100%', height: fixed && !narrow ? '100%' : LANES_HEIGHT, ...lanesProps?.style }}
        />
      )
    } else if (view === 'matrix') {
      scene = <AdjacencyMatrix key="matrix" {...matrixProps} graph={g} />
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
    const labelsApply = view === 'stack' || view === 'hive'
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
                  {eyebrow != null && <span className="layered-control__eyebrow">{eyebrow}</span>}
                  {title != null && <h2 className="layered-graph-explorer__title">{title}</h2>}
                </div>
              )}
              {headerControls && (
                <div className="layered-graph-explorer__header-controls">
                  {showSwitcher && <ViewSwitcher views={views} value={view} onChange={changeView} viewLabels={viewLabels} />}
                  {show.follow && <FollowControl options={followOptions} />}
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
                <span className="layered-graph-explorer__status-camera">{cameraSummary(stackMem.camera, stackMem.preset, stackMem.gap)}</span>
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
