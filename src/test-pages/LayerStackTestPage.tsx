import { useEffect, useMemo, useRef, useState } from 'react'
import { LayerStack, type LayerStackHandle, type LayerStackNodeLabels } from '../components/LayerStack'
import { Button } from '../components/Button'
import { SegmentedControl } from '../components/SegmentedControl'
import { LayeredGraphContext, useLayeredGraph } from '../hooks/useLayeredGraph'
import { CAMERA_PRESET_NAMES, type CameraPresetName, type StackCamera } from '../utils/layered/projection'
import type { BuildLayeredIndexOptions, PlaneLayoutMode, PredicateLabelMode } from '../utils/layered/types'
import { drCategoryOrder, drLayers, drSpecEdges, drSpecNodes, heimdallUxEdges, heimdallUxNodes } from './fixtures/layeredGraphFixtures'

// LayerStack on the layered-graph fixtures. Turntable off and a fixed camera; URL params make
// screenshots deterministic:
//   ?example=layer-stack&data=spec|ux&select=<node id>&follow=0|1|2&labels=off|highlighted|all
//     &nodeLabels=all|reached|none&preset=stack|exploded|top|profile&focus=<layer id>&layout=coupled&dark=1
const params = new URLSearchParams(window.location.search)
const DATA = params.get('data') === 'ux' ? 'ux' : 'spec'
const PRESET = (CAMERA_PRESET_NAMES as readonly string[]).includes(params.get('preset') ?? '') ? (params.get('preset') as CameraPresetName) : 'stack'

const deg = (a: number) => Math.round((a * 180) / Math.PI)
const describe = (c: StackCamera) => `yaw ${deg(c.yaw)}° pitch ${deg(c.pitch)}° zoom ${c.zoom.toFixed(2)}`

export default function LayerStackTestPage() {
  useEffect(() => {
    document.body.classList.toggle('dark-canvas', params.get('dark') === '1')
    return () => document.body.classList.remove('dark-canvas')
  }, [])

  const layering = useMemo<BuildLayeredIndexOptions>(
    () => ({ layerBy: 'layer', layers: drLayers, categoryOrder: drCategoryOrder, linkCategoryBy: 'category' }),
    [],
  )
  const layout = useMemo(() => ({ layoutCategories: DATA === 'spec' ? ['structural'] : null }), [])
  const graph = useLayeredGraph({
    nodes: DATA === 'spec' ? drSpecNodes : heimdallUxNodes,
    edges: DATA === 'spec' ? drSpecEdges : heimdallUxEdges,
    layering,
    layout,
    defaultSelectedId: params.get('select'),
    defaultFollow: params.has('follow') ? Number(params.get('follow')) : 1,
    defaultPredicateLabels: (params.get('labels') as PredicateLabelMode | null) ?? 'highlighted',
    defaultFocusedLayerId: params.get('focus'),
    defaultPlaneLayout: (params.get('layout') as PlaneLayoutMode | null) ?? 'independent',
  })

  const stack = useRef<LayerStackHandle>(null)
  const [preset, setPreset] = useState<CameraPresetName | null>(PRESET)
  const [turntable, setTurntable] = useState(false)
  const [cameraText, setCameraText] = useState('')
  const [nodeLabels, setNodeLabels] = useState<LayerStackNodeLabels>((params.get('nodeLabels') as LayerStackNodeLabels | null) ?? 'all')

  return (
    <LayeredGraphContext.Provider value={graph}>
      <div style={{ minHeight: '100vh', background: 'rgb(var(--canvas-bg))', color: 'rgb(var(--canvas-fg-1))', padding: '16px 20px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 12 }}>
          <span data-testid="layer-stack-caption" style={{ fontFamily: 'var(--font-mono)' }}>
            LayerStack · {DATA} · {graph.index.nodes.length} nodes · {graph.index.links.length} links · {graph.index.links.filter((l) => l.cross).length} cross-layer
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
        </div>
        <div style={{ width: 1160, maxWidth: '100%' }}>
          <LayerStack
            ref={stack}
            data-testid="layer-stack"
            cameraPreset={preset}
            onCameraPresetChange={setPreset}
            turntable={turntable}
            onTurntableChange={setTurntable}
            nodeLabels={nodeLabels}
            onCameraChange={(c, cause) => setCameraText(`${cause} · ${describe(c)}`)}
          />
        </div>
      </div>
    </LayeredGraphContext.Provider>
  )
}
