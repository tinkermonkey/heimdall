import { Profiler, useEffect, useMemo, useRef, useState } from 'react'
import { LayerStack, type LayerStackHandle, type LayerStackNodeLabels } from '../components/LayerStack'
import { Button } from '../components/Button'
import { SegmentedControl } from '../components/SegmentedControl'
import { LayeredGraphContext, useLayeredGraph } from '../hooks/useLayeredGraph'
import { CAMERA_PRESETS, CAMERA_PRESET_NAMES, cameraFromPreset, type CameraPresetName, type StackCamera } from '../utils/layered/projection'
import type { BuildLayeredIndexOptions, PlaneLayoutMode, PredicateLabelMode } from '../utils/layered/types'
import { drCategoryOrder, drLayers, drSpecEdges, drSpecNodes, heimdallUxEdges, heimdallUxNodes } from './fixtures/layeredGraphFixtures'
import { drFullEdges, drFullLayers, drFullNodes } from './fixtures/layeredGraphFullSpec'

// LayerStack on the layered-graph fixtures. Turntable off and a fixed camera; URL params make
// screenshots deterministic:
//   ?example=layer-stack&data=spec|ux|full (full: the whole DR spec, 13 layers)&select=<node id>&follow=0|1|2&labels=off|highlighted|all
//     &nodeLabels=all|reached|none&preset=stack|exploded|top|profile&focus=<layer id>&layout=coupled&dark=1
//     &asyncLayout=1 (lay out asynchronously at any size; the caption shows `layout pending|ready`)
//     &camera=controlled|lagged|held (camera and layer gap as controlled props: `controlled` takes
//       every change the stack reports, `lagged` takes each two frames late, `held` none; a counter
//       shows the reports and the page's camera)
const params = new URLSearchParams(window.location.search)
const DATA = params.get('data') === 'ux' || params.get('data') === 'full' ? (params.get('data') as 'ux' | 'full') : 'spec'
const FIXTURE = {
  spec: { nodes: drSpecNodes, edges: drSpecEdges, layers: drLayers },
  ux: { nodes: heimdallUxNodes, edges: heimdallUxEdges, layers: drLayers },
  full: { nodes: drFullNodes, edges: drFullEdges, layers: drFullLayers },
}[DATA]
const CAMERA_MODE = ['controlled', 'lagged', 'held'].includes(params.get('camera') ?? '') ? params.get('camera') : null
/** Applies a reported value: at once, two frames late (a slow parent), or never. */
function follow<T>(set: (v: T) => void, v: T) {
  if (CAMERA_MODE === 'controlled') set(v)
  else if (CAMERA_MODE === 'lagged') requestAnimationFrame(() => requestAnimationFrame(() => set(v)))
}
const PRESET = (CAMERA_PRESET_NAMES as readonly string[]).includes(params.get('preset') ?? '') ? (params.get('preset') as CameraPresetName) : 'stack'

/** LayerStack commits so far, for the spec's per-frame render check (`window.__layerStackCommits`). */
const countCommit = () => {
  const w = window as unknown as { __layerStackCommits?: number }
  w.__layerStackCommits = (w.__layerStackCommits ?? 0) + 1
}

const deg = (a: number) => Math.round((a * 180) / Math.PI)
const describe = (c: StackCamera) => `yaw ${deg(c.yaw)}° pitch ${deg(c.pitch)}° zoom ${c.zoom.toFixed(2)}`

export default function LayerStackTestPage() {
  useEffect(() => {
    document.body.classList.toggle('dark-canvas', params.get('dark') === '1')
    return () => document.body.classList.remove('dark-canvas')
  }, [])

  const layering = useMemo<BuildLayeredIndexOptions>(
    () => ({ layerBy: 'layer', layers: FIXTURE.layers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }),
    [],
  )
  const layout = useMemo(() => ({ layoutCategories: DATA === 'ux' ? null : ['structural'] }), [])
  const graph = useLayeredGraph({
    nodes: FIXTURE.nodes,
    edges: FIXTURE.edges,
    layering,
    layout,
    defaultSelectedId: params.get('select'),
    defaultFollow: params.has('follow') ? Number(params.get('follow')) : 1,
    defaultPredicateLabels: (params.get('labels') as PredicateLabelMode | null) ?? 'highlighted',
    defaultFocusedLayerId: params.get('focus'),
    defaultPlaneLayout: (params.get('layout') as PlaneLayoutMode | null) ?? 'independent',
    asyncLayoutMinNodes: params.get('asyncLayout') === '1' ? 0 : undefined,
  })

  const stack = useRef<LayerStackHandle>(null)
  const [preset, setPreset] = useState<CameraPresetName | null>(PRESET)
  const [turntable, setTurntable] = useState(false)
  const [cameraText, setCameraText] = useState('')
  const [nodeLabels, setNodeLabels] = useState<LayerStackNodeLabels>((params.get('nodeLabels') as LayerStackNodeLabels | null) ?? 'all')
  const [camera, setCamera] = useState<StackCamera>(() => cameraFromPreset(PRESET))
  const [gap, setGap] = useState(CAMERA_PRESETS[PRESET].layerGap)
  const [reports, setReports] = useState(0)

  return (
    <LayeredGraphContext.Provider value={graph}>
      <div style={{ minHeight: '100vh', background: 'rgb(var(--canvas-bg))', color: 'rgb(var(--canvas-fg-1))', padding: '16px 20px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 12 }}>
          <span data-testid="layer-stack-caption" style={{ fontFamily: 'var(--font-mono)' }}>
            LayerStack · {DATA} · {graph.index.nodes.length} nodes · {graph.index.links.length} links · {graph.index.links.filter((l) => l.cross).length} cross-layer
            {params.get('asyncLayout') === '1' && ` · layout ${graph.layoutPending ? 'pending' : 'ready'}`}
          </span>
          <SegmentedControl
            aria-label="Camera preset"
            value={preset ?? ''}
            onChange={(v) => setPreset(v as CameraPresetName)}
            options={CAMERA_PRESET_NAMES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))}
          />
          <SegmentedControl
            aria-label="Follow"
            value={graph.follow}
            onChange={(v) => graph.setFollow(Number(v))}
            options={[{ value: 0, label: 'Direct' }, { value: 1, label: '+1 layer' }, { value: 2, label: '+2 layers' }]}
          />
          <SegmentedControl
            aria-label="Plane layout"
            value={graph.planeLayout}
            onChange={(v) => graph.setPlaneLayout(v as PlaneLayoutMode)}
            options={[{ value: 'independent', label: 'Independent' }, { value: 'coupled', label: 'Coupled' }]}
          />
          <SegmentedControl
            aria-label="Node labels"
            value={nodeLabels}
            onChange={(v) => setNodeLabels(v as LayerStackNodeLabels)}
            options={[{ value: 'all', label: 'All labels' }, { value: 'reached', label: 'Reached' }, { value: 'none', label: 'None' }]}
          />
          <Button variant="ghost" size="sm" onClick={() => stack.current?.zoomBy(1 / 1.2)}>Zoom out</Button>
          <Button variant="ghost" size="sm" onClick={() => stack.current?.zoomBy(1.2)}>Zoom in</Button>
          <Button variant="ghost" size="sm" onClick={() => stack.current?.fit()}>Fit</Button>
          <Button variant={turntable ? 'accent' : 'ghost'} size="sm" aria-pressed={turntable} onClick={() => setTurntable(!turntable)}>Turntable</Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-3))' }}>
          <span data-testid="layer-stack-selection">
            {graph.selectedId ? `selected ${graph.selectedId} · reach ${graph.reach.hopOf.size - 1}` : 'no selection'}
          </span>
          <span data-testid="layer-stack-focus">{graph.focusedLayerId ? `focus ${graph.focusedLayerId}` : 'no focus'}</span>
          <span data-testid="layer-stack-preset">{preset ? `preset ${preset}` : 'preset none'}</span>
          <span data-testid="layer-stack-camera">{cameraText}</span>
          {CAMERA_MODE && <span data-testid="layer-stack-reports">{`${CAMERA_MODE} · ${reports} reports · gap ${Math.round(gap)} · ${describe(camera)}`}</span>}
        </div>
        <div style={{ width: 1160, maxWidth: '100%' }}>
          <Profiler id="layer-stack" onRender={countCommit}>
          <LayerStack
            ref={stack}
            data-testid="layer-stack"
            cameraPreset={preset}
            onCameraPresetChange={setPreset}
            turntable={turntable}
            onTurntableChange={setTurntable}
            nodeLabels={nodeLabels}
            camera={CAMERA_MODE ? camera : undefined}
            layerGap={CAMERA_MODE ? gap : undefined}
            onLayerGapChange={(g) => follow(setGap, g)}
            onCameraChange={(c, cause) => {
              setCameraText(`${cause} · ${describe(c)}`)
              setReports((n) => n + 1)
              follow(setCamera, c)
            }}
          />
          </Profiler>
        </div>
      </div>
    </LayeredGraphContext.Provider>
  )
}
