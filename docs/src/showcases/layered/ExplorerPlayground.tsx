import { useMemo, useState } from 'react'
import {
  LayeredGraphExplorer,
  LAYERED_GRAPH_VIEWS,
  LAYERED_GRAPH_VIEW_LABELS,
  SegmentedControl,
  type BuildLayeredIndexOptions,
  type LayeredGraphExplorerControls,
  type LayeredGraphView,
} from '@tinkermonkey/heimdall-ui'
import {
  drCategoryOrder,
  drLayers,
  drSpecEdges,
  drSpecNodes,
  heimdallUxEdges,
  heimdallUxNodes,
} from '@/test-pages/fixtures/layeredGraphFixtures'
import { DemoCard } from '../../components/ShowcaseSection'

const fg2 = 'rgb(var(--canvas-fg-2, 75 85 99))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'
const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

const LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'layer',
  layers: drLayers,
  categoryOrder: drCategoryOrder,
  linkCategoryBy: 'category',
}

const CONTROL_KEYS: { key: keyof LayeredGraphExplorerControls; label: string }[] = [
  { key: 'viewSwitcher', label: 'viewSwitcher' },
  { key: 'follow', label: 'follow' },
  { key: 'camera', label: 'camera' },
  { key: 'planeLayout', label: 'planeLayout' },
  { key: 'linkFilter', label: 'linkFilter' },
  { key: 'predicateLabels', label: 'predicateLabels' },
  { key: 'nodeLabels', label: 'nodeLabels' },
  { key: 'inspector', label: 'inspector' },
  { key: 'layers', label: 'layers' },
  { key: 'layerPairs', label: 'layerPairs' },
  { key: 'bridgeNodes', label: 'bridgeNodes' },
  { key: 'status', label: 'status' },
]

type Dataset = 'spec' | 'ux'

const DATA = {
  spec: { nodes: drSpecNodes, edges: drSpecEdges, label: 'dr spec meta-model', select: 'application.applicationcomponent' },
  ux: { nodes: heimdallUxNodes, edges: heimdallUxEdges, label: 'heimdall ux model', select: null },
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
        color: on ? 'rgb(var(--canvas-fg-1))' : fg3,
        textDecoration: on ? 'none' : 'line-through',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: fg3, minWidth: 74 }}>{label}</span>
      {children}
    </div>
  )
}

/**
 * Explorer playground: which views it offers, which chrome it renders (the `controls` prop),
 * the chrome surface and the dataset, with the JSX for the current settings.
 */
export function ExplorerPlayground() {
  const [dataset, setDataset] = useState<Dataset>('spec')
  const [views, setViews] = useState<LayeredGraphView[]>([...LAYERED_GRAPH_VIEWS])
  const [controls, setControls] = useState<Required<LayeredGraphExplorerControls>>(() =>
    Object.fromEntries(CONTROL_KEYS.map((c) => [c.key, true])) as Required<LayeredGraphExplorerControls>,
  )
  const [surface, setSurface] = useState<'shell' | 'canvas'>('shell')

  const toggleView = (v: LayeredGraphView) =>
    setViews((cur) => {
      if (cur.includes(v)) return cur.length > 1 ? cur.filter((x) => x !== v) : cur
      return LAYERED_GRAPH_VIEWS.filter((x) => x === v || cur.includes(x))
    })

  const off = CONTROL_KEYS.filter((c) => !controls[c.key]).map((c) => c.key)
  const code = useMemo(() => {
    const lines = ['<LayeredGraphExplorer', '  nodes={nodes}', '  edges={edges}', '  layering={layering}']
    if (views.length !== LAYERED_GRAPH_VIEWS.length) lines.push(`  views={[${views.map((v) => `'${v}'`).join(', ')}]}`)
    if (off.length) lines.push(`  controls={{ ${off.map((k) => `${k}: false`).join(', ')} }}`)
    if (surface !== 'shell') lines.push(`  chromeSurface="${surface}"`)
    lines.push('/>')
    return lines.join('\n')
  }, [views, off, surface])

  const d = DATA[dataset]
  const graphOptions = useMemo(
    () => ({ defaultSelectedId: d.select, defaultFollow: 1, layout: { layoutCategories: dataset === 'spec' ? ['structural'] : null } }),
    [d.select, dataset],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', border: `1px solid ${border}`, borderRadius: 8 }}>
        <Row label="Dataset">
          <SegmentedControl
            value={dataset}
            onChange={(v) => setDataset(v as Dataset)}
            options={[
              { value: 'spec', label: 'DR spec' },
              { value: 'ux', label: 'Heimdall UX' },
            ]}
          />
          <span style={{ width: 14 }} />
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: fg3 }}>Chrome</span>
          <SegmentedControl
            value={surface}
            onChange={(v) => setSurface(v as 'shell' | 'canvas')}
            options={[
              { value: 'shell', label: 'Shell' },
              { value: 'canvas', label: 'Canvas' },
            ]}
          />
        </Row>
        <Row label="views">
          {LAYERED_GRAPH_VIEWS.map((v) => (
            <Toggle key={v} on={views.includes(v)} onClick={() => toggleView(v)}>
              {String(LAYERED_GRAPH_VIEW_LABELS[v])}
            </Toggle>
          ))}
        </Row>
        <Row label="controls">
          {CONTROL_KEYS.map((c) => (
            <Toggle key={c.key} on={controls[c.key]} onClick={() => setControls((cur) => ({ ...cur, [c.key]: !cur[c.key] }))}>
              {c.label}
            </Toggle>
          ))}
        </Row>
        <p style={{ margin: 0, fontSize: 12, color: fg2 }}>
          Each switch removes one piece of chrome; the state it controls stays in the shared graph state and can be driven from an app's own UI.
        </p>
      </div>
      <DemoCard>
        <LayeredGraphExplorer
          key={dataset}
          nodes={d.nodes}
          edges={d.edges}
          layering={LAYERING}
          graphOptions={graphOptions}
          views={views}
          controls={controls}
          chromeSurface={surface}
          statusLabel={d.label}
        />
      </DemoCard>
      <pre
        style={{
          margin: 0,
          padding: '10px 12px',
          fontFamily: mono,
          fontSize: 11.5,
          lineHeight: 1.6,
          color: fg2,
          background: 'rgb(var(--canvas-bg-2, 249 250 251))',
          border: `1px solid ${border}`,
          borderRadius: 6,
          overflowX: 'auto',
        }}
      >
        {code}
      </pre>
    </div>
  )
}
