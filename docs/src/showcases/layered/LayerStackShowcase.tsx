import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  CameraControls,
  FollowControl,
  LayerStack,
  LayeredGraphContext,
  PlaneLayoutControl,
  PredicateLabelControl,
  PRESET_GAP_FULL_LAYERS,
  presetLayerGap,
  SegmentedControl,
  Select,
  useLayeredGraph,
  type BuildLayeredIndexOptions,
  type CameraPresetName,
  type LayerLayoutOptions,
  type LayerStackCameraCause,
  type LayerStackHandle,
  type LayerStackInteractions,
  type LayerStackNodeLabels,
  type StackCamera,
} from '@tinkermonkey/heimdall-ui'
import {
  drCategoryOrder,
  drLayers,
  drSpecEdges,
  drSpecNodes,
  heimdallUxEdges,
  heimdallUxNodes,
} from '@/test-pages/fixtures/layeredGraphFixtures'
import { drFullEdges, drFullLayers, drFullNodes } from '@/test-pages/fixtures/layeredGraphFullSpec'
import { PageHeader, ShowcaseSection, DemoCard, DemoGrid } from '../../components/ShowcaseSection'
import { LayerStackHandleTable, LayerStackPropsTable } from './LayerStackReference'

const fg1 = 'rgb(var(--canvas-fg-1, 17 24 39))'
const fg2 = 'rgb(var(--canvas-fg-2, 75 85 99))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'
const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

// ─── Data ──────────────────────────────────────────────────────────────────

const UX_NODE = 'business.businessprocess.render-graph-from-domain-data-to-interactive-view'

const LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'layer',
  layers: drLayers,
  categoryOrder: drCategoryOrder,
  linkCategoryBy: 'category',
}

type DatasetKey = 'spec' | 'ux'

const DATASETS = {
  spec: {
    label: 'dr spec meta-model',
    nodes: drSpecNodes,
    edges: drSpecEdges,
    // Dense: laying out on structural links only keeps each plane readable.
    layout: { layoutCategories: ['structural'] } as LayerLayoutOptions,
    selected: 'application.applicationcomponent' as string | null,
    labels: 'reached' as LayerStackNodeLabels,
  },
  ux: {
    label: 'heimdall ux model',
    nodes: heimdallUxNodes,
    edges: heimdallUxEdges,
    layout: { layoutCategories: null } as LayerLayoutOptions,
    selected: UX_NODE as string | null,
    labels: 'reached' as LayerStackNodeLabels,
  },
}

const PRESETS: CameraPresetName[] = ['stack', 'exploded', 'top', 'profile']
const INTERACTION_KEYS = ['select', 'hover', 'orbit', 'zoom', 'focusLayer'] as const
type InteractionKey = (typeof INTERACTION_KEYS)[number]
const STATIC: LayerStackInteractions = { select: false, hover: false, orbit: false, zoom: false, focusLayer: false }

// ─── Small pieces ──────────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: '12px 0 0',
        padding: '12px 14px',
        background: 'rgb(var(--canvas-bg-2))',
        border: `1px solid ${border}`,
        borderRadius: 8,
        fontFamily: mono,
        fontSize: 12,
        lineHeight: 1.6,
        color: fg1,
        overflowX: 'auto',
      }}
    >
      {children}
    </pre>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: fg3, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        fontFamily: mono,
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 4,
        border: `1px solid ${on ? 'rgb(var(--accent-primary) / 0.55)' : border}`,
        background: 'transparent',
        color: on ? fg1 : fg3,
        textDecoration: on ? 'none' : 'line-through',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function MonoLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontFamily: mono, fontSize: 11, color: fg2, minWidth: 0 }}>
      <Eyebrow>{label}</Eyebrow>
      <span style={{ overflowWrap: 'anywhere' }}>{children}</span>
    </div>
  )
}

const n2 = (v: number) => v.toFixed(2)
function formatCamera(c: StackCamera | null, cause: LayerStackCameraCause | null) {
  if (!c) return '—'
  return `yaw ${n2(c.yaw)} · pitch ${n2(c.pitch)} · zoom ${n2(c.zoom)} · targetY ${Math.round(c.targetY)}${cause ? ` · cause ${cause}` : ''}`
}

const rangeStyle: React.CSSProperties = { width: 140, accentColor: 'rgb(var(--accent-primary))' }

// ─── Code samples ──────────────────────────────────────────────────────────

const BASIC_CODE = `import { LayerStack } from '@tinkermonkey/heimdall-ui'

// Memoize layering: a new object rebuilds the index.
const layering = useMemo(() => ({ layerBy: 'layer', linkCategoryBy: 'category' }), [])

<LayerStack nodes={nodes} edges={edges} layering={layering} nodeLabels="reached" />`

const HANDLE_CODE = `const stack = useRef<LayerStackHandle>(null)

<LayerStack ref={stack} nodes={nodes} edges={edges} layering={layering} />

stack.current?.applyPreset('exploded')          // { animate: false } jumps
stack.current?.zoomBy(1.25)
stack.current?.fit()
stack.current?.setTurntable(true)
stack.current?.focusLayer('application')        // null exits
stack.current?.select('application.applicationcomponent')
stack.current?.getCamera()                      // { yaw, pitch, zoom, targetY }`

const VARIANTS_CODE = `<LayeredGraphContext.Provider value={graph}>
  {(['stack', 'exploded', 'top', 'profile'] as const).map((p) => (
    <LayerStack
      key={p}
      defaultCameraPreset={p}
      nodeLabels="none"
      interactions={{ select: false, hover: false, orbit: false, zoom: false, focusLayer: false }}
    />
  ))}
</LayeredGraphContext.Provider>`

const UX_CODE = `<LayerStack
  nodes={heimdallUxNodes}
  edges={heimdallUxEdges}
  layering={layering}
  graphOptions={{
    defaultSelectedId: 'business.businessprocess.render-graph-from-domain-data-to-interactive-view',
  }}
  defaultCameraPreset="exploded"
  nodeLabels="reached"
/>`

const FULL_CODE = `// 13 layers: the preset's gap closes up (presetLayerGap) and, when the planes
// would still overflow the frame, the mount fits them (reported once as 'fit').
<LayerStack
  nodes={drFullNodes}
  edges={drFullEdges}
  layering={layering}            // layerBy: 'layer', layers: drFullLayers
  graphOptions={{ defaultSelectedId: 'application.applicationcomponent' }}
  nodeLabels="reached"
  onCameraChange={(camera, cause) => console.log(cause)}   // 'fit' after mount
/>`

const CONTROLLED_CODE = `const [camera, setCamera] = useState<StackCamera>(() => cameraFromPreset('stack'))
const [gap, setGap] = useState(170)

<LayerStack
  camera={camera}
  onCameraChange={(c) => setCamera(c)}   // every frame of a move; pass it back unchanged
  layerGap={gap}
  onLayerGapChange={setGap}
/>

// Wrong: a rounded value is a change from outside. It jumps, and stops the move.
onCameraChange={(c) => setCamera({ ...c, yaw: Math.round(c.yaw * 100) / 100 })}`

// ─── Page ──────────────────────────────────────────────────────────────────

export function LayerStackShowcase() {
  const [dataset, setDataset] = useState<DatasetKey>('spec')
  return (
    <div>
      <PageHeader
        name="LayerStack"
        description="A layered graph as a 3D stack: one translucent plane per layer, nodes as layer-coloured discs sized by degree, links within a layer drawn on its plane and cross-layer links running between planes. Selecting a node lights its reach in the amber hop ramp and drops a drill-through column through every plane, so what sits above and below the node reads at a glance. Drawn as SVG with a perspective projection: crisp, accessible and snapshot-testable, comfortable at a few hundred nodes."
      />

      <ShowcaseSection
        label="When to use"
        description="Use it to show how layers stack and where cross-layer links concentrate: architecture tiers, a meta-model's business, application and technology layers, any graph where one attribute splits nodes into a handful of ordered groups. It reads best with 2 to about 6 layers and up to a few hundred nodes. For exact link lookup on a dense graph prefer AdjacencyMatrix; to compare how layers connect, HivePlot; for a flat, scrollable reading, the layer-lanes layout."
      >
        <Code>{BASIC_CODE}</Code>
      </ShowcaseSection>

      {/* Keyed by dataset: switching data resets selection, filters and camera. */}
      <Playground key={dataset} dataset={dataset} onDatasetChange={setDataset} />

      <HandleDemo />

      <PresetVariants />

      <ShowcaseSection
        label="heimdall ux model"
        description="A model of heimdall-ui itself: many links inside each layer, only two across. The selected business process reaches the application plane over one of them; the drill-through column marks where it sits above the planes below. The application plane is dense, so reached labels keep it readable."
      >
        <DemoCard label="LayerStack · exploded">
          <LayerStack
            nodes={heimdallUxNodes}
            edges={heimdallUxEdges}
            layering={LAYERING}
            graphOptions={UX_OPTIONS}
            defaultCameraPreset="exploded"
            nodeLabels="reached"
            aria-label="heimdall ux model layer stack"
          />
        </DemoCard>
        <Code>{UX_CODE}</Code>
      </ShowcaseSection>

      <FullSpecDemo />

      <ShowcaseSection
        label="Labels behind nearer planes"
        description="A node label whose node sits behind another layer's plane fades to 30% of its emphasis opacity (class layer-stack__label--occluded). It fades rather than hides, so labels do not pop in and out during an orbit. A plane counts when it lies between the node and the camera and the label's point falls inside the plane's projected outline."
      >
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>Never faded: the selection, every node in its reach, the hovered node and the keyboard-focused node.</li>
          <li>The top preset is the x-ray through every plane: nothing fades in top view.</li>
          <li>Planes dimmed by a layer focus are see-through and fade no label; only the focused plane can.</li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Interaction">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>Click a node to select it; click it again, or click the background, to clear. Clicking a plane title focuses its layer; clicking it again exits.</li>
          <li>Drag to orbit. Pitch is clamped between side-on and top-down, and a 4px threshold keeps a click a click. Orbiting stops the turntable and clears the preset.</li>
          <li>The wheel zooms only while the scene has focus (click it, or tab to a node label), so it never hijacks page scroll.</li>
          <li>Two fingers pinch to zoom, with the same 0.4–3 clamp as the wheel. A pinch stops any camera move and clears the preset; lifting one finger ends it without starting an orbit. interactions.zoom covers the wheel and the pinch.</li>
          <li>On touch, one finger swiping vertically scrolls the page (touch-action: pan-y) and a horizontal swipe orbits. With two fingers down the scene cancels touchmove, so a pinch is never taken as a scroll. Put both fingers down together: a second finger added after a one-finger scroll has started cannot pinch, because the browser already owns that touch.</li>
          <li>Node labels are buttons with one tab stop. Left and Right move within a layer, Up and Down move to a linked node (or the first node) on the next layer, Home and End jump to the ends, Enter selects. Labels hidden by nodeLabels stay focusable and show while focused.</li>
          <li>Escape clears the selection.</li>
          <li>Camera moves tween 600–900 ms ease-in-out. Under prefers-reduced-motion they jump, and the turntable stays off.</li>
          <li>Uncontrolled, onCameraChange fires when a move settles (drag release, end of a tween, a wheel pause, pinch release, turntable stop), not per frame, so chrome that shows the camera does not re-render while it moves. Predicate pills are skipped during a drag and placed again on release.</li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection
        label="Controlled camera"
        description="Changed in 0.11: a controlled camera and layerGap are strictly held. In 0.10.0 a changed camera prop applied at once and the stack moved on its own between changes; now the view shows the props and nothing else."
      >
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>The camera fields set are held. An orbit, zoom, preset, focus or turntable only proposes a camera through onCameraChange, on every frame of the move, and the view moves only when the parent passes it back. layerGap works the same through onLayerGapChange. Fields left out of camera stay uncontrolled.</li>
          <li>Pass each reported value back unchanged. A value the stack never reported (rounded or normalized) counts as a change from outside: it jumps there and stops the stack's move on that field.</li>
          <li>An echo that lands a frame or more late (React batching on a slow device) is fine: the stack remembers about a second of its own proposals and still treats it as its own.</li>
          <li>The settle call carries the move's last proposal, so a parent that commits only settled reports still gets the gesture's result.</li>
          <li>A controlled camera re-renders its parent on every frame. Chrome that only shows or remembers the camera should leave it uncontrolled (defaultCamera, defaultLayerGap) and listen to the settle calls.</li>
        </ul>
        <Code>{CONTROLLED_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <LayerStackPropsTable />
      </ShowcaseSection>

      <ShowcaseSection
        label="LayerStackHandle"
        description="The ref handle. onCameraChange causes (LayerStackCameraCause): orbit, zoom, preset, focus, fit, turntable, api."
      >
        <LayerStackHandleTable />
      </ShowcaseSection>
    </div>
  )
}

const UX_OPTIONS = { defaultSelectedId: UX_NODE } as const

// ─── Playground ────────────────────────────────────────────────────────────

function Playground({ dataset, onDatasetChange }: { dataset: DatasetKey; onDatasetChange: (d: DatasetKey) => void }) {
  const data = DATASETS[dataset]
  const graph = useLayeredGraph({
    nodes: data.nodes,
    edges: data.edges,
    layering: LAYERING,
    layout: data.layout,
    defaultSelectedId: data.selected,
    defaultFollow: 1,
    defaultPredicateLabels: 'highlighted',
  })
  const stack = useRef<LayerStackHandle>(null)
  const [preset, setPreset] = useState<CameraPresetName | null>('stack')
  const [turntable, setTurntable] = useState(false)
  const [gap, setGap] = useState(170)
  const [nodeLabels, setNodeLabels] = useState<LayerStackNodeLabels>(data.labels)
  const [enabled, setEnabled] = useState<Record<InteractionKey, boolean>>({ select: true, hover: true, orbit: true, zoom: true, focusLayer: true })
  const [cam, setCam] = useState<{ camera: StackCamera; cause: LayerStackCameraCause | null } | null>(null)

  useEffect(() => {
    const c = stack.current?.getCamera()
    if (c) setCam({ camera: c, cause: null })
  }, [])

  const interactions = useMemo<LayerStackInteractions>(() => ({ ...enabled }), [enabled])
  const off = INTERACTION_KEYS.filter((k) => !enabled[k])

  const jsx = [
    '<LayerStack',
    '  ref={stack}',
    `  cameraPreset={${preset ? `'${preset}'` : 'null'}}`,
    '  onCameraPresetChange={setPreset}',
    `  turntable={${turntable}}`,
    `  layerGap={${gap}}`,
    `  nodeLabels="${nodeLabels}"`,
    ...(off.length ? [`  interactions={{ ${off.map((k) => `${k}: false`).join(', ')} }}`] : []),
    '  onCameraChange={(camera, cause) => setCamera(camera)}',
    '/>',
  ].join('\n')

  const graphState = `follow ${graph.follow} · planeLayout ${graph.planeLayout} · predicateLabels ${graph.predicateLabels} · focusedLayerId ${graph.focusedLayerId ?? 'null'} · selectedId ${graph.selectedId ?? 'null'}`

  return (
    <LayeredGraphContext.Provider value={graph}>
      <ShowcaseSection
        label="Playground"
        description="Every control below drives the real props or the shared graph state. The camera line updates when a move settles; drag the scene or use the wheel after clicking into it to see the preset clear."
      >
        <DemoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' }}>
              <Control label="Data">
                <SegmentedControl
                  aria-label="Dataset"
                  value={dataset}
                  onChange={(v) => onDatasetChange(v as DatasetKey)}
                  options={[
                    { value: 'spec', label: 'Spec' },
                    { value: 'ux', label: 'UX' },
                  ]}
                />
              </Control>
              <CameraControls stack={stack} preset={preset} turntable={turntable} onTurntableChange={setTurntable} showFit label="Camera" />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' }}>
              <Control label="Layer gap">
                <input
                  type="range"
                  min={80}
                  max={400}
                  step={10}
                  value={gap}
                  aria-label="Layer gap"
                  onChange={(e) => setGap(Number(e.target.value))}
                  style={rangeStyle}
                />
                <span style={{ fontFamily: mono, fontSize: 11, color: fg2, minWidth: 28 }}>{Math.round(gap)}</span>
              </Control>
              <Control label="Node labels">
                <SegmentedControl
                  aria-label="Node labels"
                  value={nodeLabels}
                  onChange={(v) => setNodeLabels(v as LayerStackNodeLabels)}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'reached', label: 'Reached' },
                    { value: 'none', label: 'None' },
                  ]}
                />
              </Control>
              <Control label="Focus layer">
                <div style={{ width: 160 }}>
                  <Select
                    ariaLabel="Focus layer"
                    value={graph.focusedLayerId ?? '__none'}
                    onChange={(v) => graph.focusLayer(v === '__none' ? null : v)}
                  >
                    <Select.Item value="__none">None</Select.Item>
                    {graph.index.layers.map((l) => (
                      <Select.Item key={l.id} value={l.id}>
                        {l.label}
                      </Select.Item>
                    ))}
                  </Select>
                </div>
              </Control>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 18px' }}>
              <PlaneLayoutControl />
              <FollowControl />
              <PredicateLabelControl />
            </div>
            <Control label="Interactions">
              {INTERACTION_KEYS.map((k) => (
                <Toggle key={k} on={enabled[k]} onClick={() => setEnabled((e) => ({ ...e, [k]: !e[k] }))}>
                  {k}
                </Toggle>
              ))}
            </Control>
          </div>

          <div style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: 'hidden' }}>
            <LayerStack
              ref={stack}
              cameraPreset={preset}
              onCameraPresetChange={setPreset}
              turntable={turntable}
              onTurntableChange={setTurntable}
              layerGap={gap}
              onLayerGapChange={setGap}
              nodeLabels={nodeLabels}
              interactions={interactions}
              onCameraChange={(camera, cause) => setCam({ camera, cause })}
              aria-label={`${data.label} layer stack`}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
            <MonoLine label="Camera">
              {formatCamera(cam?.camera ?? null, cam?.cause ?? null)} · preset {preset ?? 'null'}
            </MonoLine>
            <MonoLine label="Graph">{graphState}</MonoLine>
          </div>
        </DemoCard>
        <Code>{jsx}</Code>
      </ShowcaseSection>
    </LayeredGraphContext.Provider>
  )
}

// ─── Imperative handle ─────────────────────────────────────────────────────

const HANDLE_OPTIONS = { defaultFollow: 1, layout: { layoutCategories: ['structural'] } }
const HANDLE_NODE = 'application.applicationcomponent'

function HandleDemo() {
  const stack = useRef<LayerStackHandle>(null)
  const [turntable, setTurntable] = useState(false)
  const [last, setLast] = useState<{ camera: StackCamera; cause: LayerStackCameraCause } | null>(null)
  const call = (fn: (s: LayerStackHandle) => void) => () => {
    if (stack.current) fn(stack.current)
  }

  return (
    <ShowcaseSection
      label="Imperative handle"
      description="A ref gives app code the camera and the graph actions without controlling every prop. Each button calls one handle method on an uncontrolled stack; the line below shows the camera and cause reported by onCameraChange."
    >
      <DemoCard>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {PRESETS.map((p) => (
            <Button key={p} variant="secondary" size="sm" onClick={call((s) => s.applyPreset(p))}>
              applyPreset('{p}')
            </Button>
          ))}
          <Button variant="secondary" size="sm" onClick={call((s) => s.zoomBy(1.25))}>
            zoomBy(1.25)
          </Button>
          <Button variant="secondary" size="sm" onClick={call((s) => s.zoomBy(0.8))}>
            zoomBy(0.8)
          </Button>
          <Button variant="secondary" size="sm" onClick={call((s) => s.fit())}>
            fit()
          </Button>
          <Button variant={turntable ? 'accent' : 'secondary'} size="sm" aria-pressed={turntable} onClick={call((s) => s.setTurntable(!turntable))}>
            setTurntable({String(!turntable)})
          </Button>
          <Button variant="secondary" size="sm" onClick={call((s) => s.focusLayer('application'))}>
            focusLayer('application')
          </Button>
          <Button variant="secondary" size="sm" onClick={call((s) => s.focusLayer(null))}>
            focusLayer(null)
          </Button>
          <Button variant="secondary" size="sm" onClick={call((s) => s.select(HANDLE_NODE))}>
            select('{HANDLE_NODE}')
          </Button>
          <Button variant="secondary" size="sm" onClick={call((s) => s.select(null))}>
            select(null)
          </Button>
        </div>
        <div style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: 'hidden' }}>
          <LayerStack
            ref={stack}
            nodes={drSpecNodes}
            edges={drSpecEdges}
            layering={LAYERING}
            graphOptions={HANDLE_OPTIONS}
            nodeLabels="reached"
            onTurntableChange={setTurntable}
            onCameraChange={(camera, cause) => setLast({ camera, cause })}
            aria-label="Layer stack driven by its ref handle"
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <MonoLine label="onCameraChange">{last ? formatCamera(last.camera, last.cause) : 'no move yet'}</MonoLine>
        </div>
      </DemoCard>
      <Code>{HANDLE_CODE}</Code>
    </ShowcaseSection>
  )
}

// ─── Preset variants ───────────────────────────────────────────────────────

const PRESET_NOTES: Record<CameraPresetName, string> = {
  stack: 'Default three-quarter view, gap 170.',
  exploded: 'Lower and wider, gap 300: cross-layer links stretch out.',
  top: 'X-ray from above; plane titles move to a side rail.',
  profile: 'Side-on, gap 210: the planes read as lines, links as their vertical span.',
}

function PresetVariants() {
  const graph = useLayeredGraph({
    nodes: drSpecNodes,
    edges: drSpecEdges,
    layering: LAYERING,
    layout: DATASETS.spec.layout,
    defaultSelectedId: 'application.applicationcomponent',
    defaultFollow: 1,
    defaultPredicateLabels: 'off',
  })
  return (
    <ShowcaseSection
      label="Camera presets"
      description="The same graph and selection at each preset, sharing one graph state. Static: interactions off, node labels off."
    >
      <LayeredGraphContext.Provider value={graph}>
        <DemoGrid cols={2} minWidth={300}>
          {PRESETS.map((p) => (
            <DemoCard key={p} label={p}>
              <LayerStack defaultCameraPreset={p} nodeLabels="none" interactions={STATIC} aria-label={`${p} preset`} />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: fg2, lineHeight: 1.5 }}>{PRESET_NOTES[p]}</p>
            </DemoCard>
          ))}
        </DemoGrid>
      </LayeredGraphContext.Provider>
      <Code>{VARIANTS_CODE}</Code>
    </ShowcaseSection>
  )
}

// ─── Full DR spec ──────────────────────────────────────────────────────────

const FULL_LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'layer',
  layers: drFullLayers,
  categoryOrder: drCategoryOrder,
  linkCategoryBy: 'category',
}
const FULL_OPTIONS = {
  defaultSelectedId: 'application.applicationcomponent',
  defaultFollow: 1,
  layout: { layoutCategories: ['structural'] },
}
const GAP_COUNTS = [3, 5, 8, 13]

function GapTable() {
  const cell = { padding: '7px 12px' } as const
  const head = { ...cell, textAlign: 'left', fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, fontWeight: 500, whiteSpace: 'nowrap' } as const
  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgb(var(--canvas-bg-2, 243 244 246))' }}>
            <th style={head}>Preset</th>
            {GAP_COUNTS.map((n) => (
              <th key={n} style={{ ...head, textAlign: 'right' }}>
                {n} layers
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ borderTop: `1px solid ${border}` }}>
          {PRESETS.map((p) => (
            <tr key={p}>
              <td style={{ ...cell, fontFamily: mono, fontSize: 12, color: 'rgb(var(--accent-cyan-deep, 14 126 163))' }}>{p}</td>
              {GAP_COUNTS.map((n) => (
                <td key={n} style={{ ...cell, fontFamily: mono, fontSize: 12, color: fg2, textAlign: 'right' }}>
                  {Math.round(presetLayerGap(p, n))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FullSpecDemo() {
  const [first, setFirst] = useState<{ camera: StackCamera; cause: LayerStackCameraCause } | null>(null)
  const layers = drFullLayers.length
  return (
    <ShowcaseSection
      label="Full DR spec"
      description={`The whole Documentation Robotics spec meta-model: ${layers} layers, ${drFullNodes.length} node types and ${drFullEdges.length} relationship schemas, which bundle into about 900 links. The stack is tested at this scale. Past ${PRESET_GAP_FULL_LAYERS} layers a preset's gap closes up so the stack keeps the height of ${PRESET_GAP_FULL_LAYERS} layers, and the mount fits the planes to the scene.`}
    >
      <DemoCard label={`LayerStack · ${layers} layers`}>
        <LayerStack
          nodes={drFullNodes}
          edges={drFullEdges}
          layering={FULL_LAYERING}
          graphOptions={FULL_OPTIONS}
          nodeLabels="reached"
          onCameraChange={(camera, cause) => setFirst((f) => f ?? { camera, cause })}
          aria-label="Full DR spec layer stack"
        />
        <div style={{ marginTop: 10 }}>
          <MonoLine label="First onCameraChange">{first ? formatCamera(first.camera, first.cause) : 'none yet'}</MonoLine>
        </div>
      </DemoCard>
      <Code>{FULL_CODE}</Code>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Eyebrow>Fit on load</Eyebrow>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 }}>
          <li>On a stack of more than {PRESET_GAP_FULL_LAYERS} layers, a preset's frame is fitted when the planes would overflow it: the same angles, the zoom that fits, the target centred. The preset stays active.</li>
          <li>It runs on mount (a jump, reported once to onCameraChange with cause fit), when the data arrives or its layer count changes (a fit move toward the preset's destination), and when a preset is picked (the preset's move goes to the fitted frame).</li>
          <li>Skipped with {PRESET_GAP_FULL_LAYERS} layers or fewer, when the planes already fit, with no preset (cameraPreset null), with a controlled camera, with a defaultCamera zoom or targetY other than the preset's own, and while a layer is focused.</li>
        </ul>
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Eyebrow>presetLayerGap</Eyebrow>
        <p style={{ margin: 0, fontSize: 12, color: fg2, lineHeight: 1.65 }}>
          presetLayerGap(name, layerCount) is a preset's gap for a stack of that many layers: the preset's own up to PRESET_GAP_FULL_LAYERS ({PRESET_GAP_FULL_LAYERS}) layers, then scaled by (PRESET_GAP_FULL_LAYERS − 1) / (layerCount − 1). It is the default defaultLayerGap and the gap a preset moves to. Both are exported. Values below come from the function.
        </p>
        <GapTable />
      </div>
    </ShowcaseSection>
  )
}
