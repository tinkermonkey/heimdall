import { PropsTable, PropRow } from '../../components/ShowcaseSection'

const fg2 = 'rgb(var(--canvas-fg-2, 75 85 99))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'
const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

/** Every `LayerStackProps` prop, in source order. */
export function LayerStackPropsTable() {
  return (
    <PropsTable>
      <PropRow name="graph" type="LayeredGraphState" def="context" description="State from useLayeredGraph. Unset: the enclosing LayeredGraphContext, else the stack builds its own from nodes, edges and layering." />
      <PropRow name="nodes" type="GraphNodeData[]" description="Standalone nodes; ignored with graph or a context." />
      <PropRow name="edges" type="GraphEdge[]" description="Standalone edges; ignored with graph or a context." />
      <PropRow name="layering" type="BuildLayeredIndexOptions" description="Standalone layering (layerBy, layers, linkCategoryBy, …). Memoize it: a new object rebuilds the index." />
      <PropRow name="graphOptions" type="Omit<UseLayeredGraphOptions, 'nodes' | 'edges' | 'layering'>" description="Standalone selection, follow, filters, focus and plane layout." />
      <PropRow name="cameraPreset" type="'stack' | 'exploded' | 'top' | 'profile' | null" description="Controlled preset; a new value animates to it. Becomes null when the camera is moved by hand." />
      <PropRow name="defaultCameraPreset" type="CameraPresetName" def="'stack'" description="Initial preset when uncontrolled." />
      <PropRow name="onCameraPresetChange" type="(preset: CameraPresetName | null) => void" description="Preset applied, or cleared by a hand move, a turntable or a layer focus." />
      <PropRow name="camera" type="Partial<StackCamera>" description="Controlled { yaw, pitch, zoom, targetY }. A changed value is applied at once (a jump); fields left out keep their value." />
      <PropRow name="defaultCamera" type="Partial<StackCamera>" description="Initial camera fields over the initial preset." />
      <PropRow name="onCameraChange" type="(camera: StackCamera, cause: LayerStackCameraCause) => void" description="Called when a camera move settles (drag release, end of a tween, a wheel pause, turntable stop), never per frame." />
      <PropRow name="turntable" type="boolean" description="Controlled slow yaw. Off under reduced motion; turns off when the user orbits or a preset applies." />
      <PropRow name="defaultTurntable" type="boolean" def="false" description="Initial turntable when uncontrolled." />
      <PropRow name="onTurntableChange" type="(on: boolean) => void" description="Turntable toggled, including off on orbit." />
      <PropRow name="turntableSpeed" type="number" def="0.27" description="Turntable speed, radians per second." />
      <PropRow name="layerGap" type="number" description="Controlled distance between planes, world units; applied at once when it changes." />
      <PropRow name="defaultLayerGap" type="number" def="preset's" description="Initial gap when uncontrolled (170 for stack, 300 for exploded, 210 for profile)." />
      <PropRow name="onLayerGapChange" type="(gap: number) => void" description="Gap changed by a preset, when its tween ends." />
      <PropRow name="nodeLabels" type="'all' | 'reached' | 'none'" def="graph state" description="Which node labels show: unset follows the graph's nodeLabels (all when on, reached when off). The hovered or keyboard-focused node always shows; hidden labels stay focusable." />
      <PropRow name="interactions" type="LayerStackInteractions" def="all on" description="{ select, hover, orbit, zoom, focusLayer }: turn direct manipulation off per kind. The ref handle still works." />
      <PropRow name="sceneWidth" type="number" def="1160" description="Scene (viewBox) width; with sceneHeight sets the aspect ratio. The scene renders at 100% of its container's width." />
      <PropRow name="sceneHeight" type="number" def="780" description="Scene (viewBox) height." />
      <PropRow name="planeSize" type="number" def="300" description="Plane half-width in world units; every plane shares it, so the stack reads square." />
      <PropRow name="ref" type="Ref<LayerStackHandle>" description="Imperative handle; see the methods table below." />
      <PropRow name="…div props" type="HTMLAttributes<HTMLDivElement>" description="Spread on the scene root (className, style, aria-label, data-*). onSelect is omitted; selection goes through the graph state." />
    </PropsTable>
  )
}

const METHODS: { name: string; signature: string; description: string }[] = [
  { name: 'applyPreset', signature: '(name: CameraPresetName, options?: { animate?: boolean }) => void', description: 'Moves to a preset (angles, zoom and layer gap), animated by default, stops the turntable and exits layer focus.' },
  { name: 'setCamera', signature: '(camera: Partial<StackCamera>, options?: { animate?: boolean }) => void', description: 'Sets any camera fields; the rest stay. Clears the preset.' },
  { name: 'getCamera', signature: '() => StackCamera', description: 'The camera as it is now, mid-tween included.' },
  { name: 'getLayerGap', signature: '() => number', description: 'The layer gap as it is now, mid-tween included.' },
  { name: 'zoomBy', signature: '(factor: number) => void', description: 'Multiplies the zoom, clamped to 0.4–3, animated.' },
  { name: 'fit', signature: '() => void', description: 'Zooms and re-centers so every visible plane fits the scene.' },
  { name: 'setTurntable', signature: '(on: boolean) => void', description: 'Starts or stops the turntable (reports through onTurntableChange).' },
  { name: 'focusLayer', signature: '(layerId: string | null) => void', description: 'Focuses a layer through the graph state; null exits.' },
  { name: 'select', signature: '(id: string | null) => void', description: 'Selects a node instance through the graph state; null clears.' },
  { name: 'setFollow', signature: '(follow: number) => void', description: 'Sets the follow depth through the graph state.' },
  { name: 'element', signature: '() => HTMLDivElement | null', description: 'The scene root element.' },
]

/** `LayerStackHandle` methods. */
export function LayerStackHandleTable() {
  const cell = { padding: '7px 12px' } as const
  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgb(var(--canvas-bg-2, 243 244 246))' }}>
            {['Method', 'Signature', 'Description'].map((h) => (
              <th key={h} style={{ ...cell, textAlign: 'left', fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, fontWeight: 500, whiteSpace: 'nowrap', minWidth: h === 'Description' ? 200 : 'auto' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ borderTop: `1px solid ${border}` }}>
          {METHODS.map((m) => (
            <tr key={m.name}>
              <td style={{ ...cell, fontFamily: mono, fontSize: 12, color: 'rgb(var(--accent-cyan-deep, 14 126 163))', whiteSpace: 'nowrap' }}>{m.name}</td>
              <td style={{ ...cell, fontFamily: mono, fontSize: 11, color: fg3, whiteSpace: 'nowrap' }}>{m.signature}</td>
              <td style={{ ...cell, fontSize: 12, color: fg2 }}>{m.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
