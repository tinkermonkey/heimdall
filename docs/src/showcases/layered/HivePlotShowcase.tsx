import { useMemo, useState } from 'react'
import {
  FollowControl,
  HivePlot,
  LayeredGraphContext,
  PredicateLabelControl,
  SegmentedControl,
  hiveLayout,
  hiveLinkGeometry,
  hivePoint,
  quadCurve,
  rankWithinLayers,
  useLayeredGraph,
  type IndexedLink,
  type IndexedNode,
  type NodeOrder,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoCard, PropsTable, PropRow } from '../../components/ShowcaseSection'
import {
  Code,
  Control,
  ControlPanel,
  ControlRow,
  DATASETS,
  DATASET_OPTIONS,
  LAYERING,
  Note,
  Status,
  Toggle,
  border,
  fg1,
  fg2,
  fg3,
  mono,
  type DatasetKey,
} from './lanesHiveParts'

type RankKey = 'degree' | 'cross-degree' | 'label'

const DEFAULTS = { splitAngle: 13, axisLabels: 1, innerRadius: 64, axisLength: 300, startAngle: -90 }

// ─── Playground ────────────────────────────────────────────────────────────

function HivePlayground() {
  const [dataset, setDataset] = useState<DatasetKey>('spec')
  return <HivePlaygroundBody key={dataset} dataset={dataset} onDatasetChange={setDataset} />
}

function HivePlaygroundBody({ dataset, onDatasetChange }: { dataset: DatasetKey; onDatasetChange: (d: DatasetKey) => void }) {
  const data = DATASETS[dataset]
  // The hive places nodes by rank, not by the in-layer layout: skip it.
  const graph = useLayeredGraph({
    nodes: data.nodes,
    edges: data.edges,
    layering: LAYERING,
    layout: false,
    defaultSelectedId: data.selected,
    defaultFollow: 1,
  })
  const [rank, setRank] = useState<RankKey>('degree')
  const [splitAxes, setSplitAxes] = useState(true)
  const [splitAngle, setSplitAngle] = useState(DEFAULTS.splitAngle)
  const [axisLabels, setAxisLabels] = useState(DEFAULTS.axisLabels)
  const [innerRadius, setInnerRadius] = useState(DEFAULTS.innerRadius)
  const [axisLength, setAxisLength] = useState(DEFAULTS.axisLength)
  const [startAngle, setStartAngle] = useState(DEFAULTS.startAngle)
  const [select, setSelect] = useState(true)
  const [hover, setHover] = useState(true)
  const [linkHandler, setLinkHandler] = useState(false)
  const [clicked, setClicked] = useState<IndexedLink | null>(null)

  const interactions = useMemo(() => ({ select, hover }), [select, hover])

  const code = useMemo(() => {
    const props: string[] = []
    if (rank !== 'degree') props.push(`rank="${rank}"`)
    if (!splitAxes) props.push('splitAxes={false}')
    if (splitAxes && splitAngle !== DEFAULTS.splitAngle) props.push(`splitAngle={${splitAngle}}`)
    if (axisLabels !== DEFAULTS.axisLabels) props.push(`axisLabels={${axisLabels}}`)
    if (innerRadius !== DEFAULTS.innerRadius) props.push(`innerRadius={${innerRadius}}`)
    if (axisLength !== DEFAULTS.axisLength) props.push(`axisLength={${axisLength}}`)
    if (startAngle !== DEFAULTS.startAngle) props.push(`startAngle={${startAngle}}`)
    if (!select || !hover) {
      const off = [!select && 'select: false', !hover && 'hover: false'].filter(Boolean).join(', ')
      props.push(`interactions={{ ${off} }}`)
    }
    if (linkHandler) props.push('onLinkSelect={setClickedLink}')
    const jsx = props.length ? `  <HivePlot\n${props.map((p) => `    ${p}`).join('\n')}\n  />` : '  <HivePlot />'
    return [
      'const graph = useLayeredGraph({',
      '  nodes, edges, layering,',
      '  layout: false,   // the hive ranks nodes; no in-layer layout needed',
      `  defaultFollow: ${graph.follow},`,
      `  defaultPredicateLabels: '${graph.predicateLabels}',`,
      '})',
      '',
      '<LayeredGraphContext.Provider value={graph}>',
      jsx,
      '</LayeredGraphContext.Provider>',
    ].join('\n')
  }, [rank, splitAxes, splitAngle, axisLabels, innerRadius, axisLength, startAngle, select, hover, linkHandler, graph.follow, graph.predicateLabels])

  const label = (id: string) => graph.index.nodeById.get(id)?.label ?? id
  const selected = graph.selectedId ? graph.index.nodeById.get(graph.selectedId) : undefined

  const num = (values: number[]) => values.map((v) => ({ value: String(v), label: String(v) }))

  return (
    <LayeredGraphContext.Provider value={graph}>
      <ControlPanel>
        <ControlRow label="Data">
          <SegmentedControl aria-label="Dataset" value={dataset} onChange={(v) => onDatasetChange(v as DatasetKey)} options={DATASET_OPTIONS} />
          <span style={{ fontSize: 12, color: fg2 }}>{data.summary}</span>
        </ControlRow>
        <ControlRow label="rank">
          <SegmentedControl
            aria-label="Rank"
            value={rank}
            onChange={(v) => setRank(v as RankKey)}
            options={[
              { value: 'degree', label: 'degree' },
              { value: 'cross-degree', label: 'cross-degree' },
              { value: 'label', label: 'label' },
            ]}
          />
          <Control label="axisLabels">
            <SegmentedControl aria-label="Axis labels" value={String(axisLabels)} onChange={(v) => setAxisLabels(Number(v))} options={num([0, 1, 2, 4])} />
          </Control>
        </ControlRow>
        <ControlRow label="splitAxes">
          <Toggle on={splitAxes} onChange={setSplitAxes}>
            splitAxes
          </Toggle>
          <Control label="splitAngle">
            <SegmentedControl aria-label="Split angle" value={String(splitAngle)} onChange={(v) => setSplitAngle(Number(v))} options={num([6, 13, 24, 40])} />
          </Control>
        </ControlRow>
        <ControlRow label="Geometry">
          <Control label="innerRadius">
            <SegmentedControl aria-label="Inner radius" value={String(innerRadius)} onChange={(v) => setInnerRadius(Number(v))} options={num([24, 64, 120])} />
          </Control>
          <Control label="axisLength">
            <SegmentedControl aria-label="Axis length" value={String(axisLength)} onChange={(v) => setAxisLength(Number(v))} options={num([200, 300, 420])} />
          </Control>
          <Control label="startAngle">
            <SegmentedControl aria-label="Start angle" value={String(startAngle)} onChange={(v) => setStartAngle(Number(v))} options={num([-90, -30, 0, 90])} />
          </Control>
        </ControlRow>
        <ControlRow label="State">
          <FollowControl />
          <PredicateLabelControl />
        </ControlRow>
        <ControlRow label="interactions">
          <Toggle on={select} onChange={setSelect}>
            select
          </Toggle>
          <Toggle on={hover} onChange={setHover}>
            hover
          </Toggle>
          <Toggle
            on={linkHandler}
            onChange={(on) => {
              setLinkHandler(on)
              setClicked(null)
            }}
          >
            onLinkSelect
          </Toggle>
        </ControlRow>
      </ControlPanel>
      <DemoCard label="HivePlot">
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <HivePlot
            rank={rank as NodeOrder}
            splitAxes={splitAxes}
            splitAngle={splitAngle}
            axisLabels={axisLabels}
            innerRadius={innerRadius}
            axisLength={axisLength}
            startAngle={startAngle}
            interactions={interactions}
            onLinkSelect={linkHandler ? setClicked : undefined}
          />
        </div>
        <Status>
          {linkHandler
            ? clicked
              ? `onLinkSelect · ${label(clicked.sourceId)} → ${label(clicked.targetId)} · ${clicked.predicates.join(' · ') || 'no predicate'} · ${clicked.primaryCategory} · ${clicked.cross ? 'cross-layer' : 'intra-layer'}`
              : 'onLinkSelect · click a link'
            : selected
              ? `selected ${selected.id} · reach ${graph.reach.hopOf.size - 1} · click a link to select its source`
              : 'no selection · click a node or a link'}
        </Status>
      </DemoCard>
      <Code>{code}</Code>
    </LayeredGraphContext.Provider>
  )
}

// ─── Variants ──────────────────────────────────────────────────────────────

const VARIANT_OPTIONS = { defaultSelectedId: 'business.businessactor', defaultFollow: 0 } as const

function SplitVariants() {
  const data = DATASETS.spec
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
      <DemoCard label="splitAxes (default)">
        <HivePlot nodes={data.nodes} edges={data.edges} layering={LAYERING} graphOptions={VARIANT_OPTIONS} axisLabels={0} />
      </DemoCard>
      <DemoCard label="splitAxes={false}">
        <HivePlot nodes={data.nodes} edges={data.edges} layering={LAYERING} graphOptions={VARIANT_OPTIONS} axisLabels={0} splitAxes={false} />
      </DemoCard>
    </div>
  )
}

const VARIANTS_CODE = `<HivePlot nodes={nodes} edges={edges} layering={layering} />
<HivePlot nodes={nodes} edges={edges} layering={layering} splitAxes={false} />`

// ─── Axes by attribute ─────────────────────────────────────────────────────

// ArchiMate aspect from the element kind: a categorical attribute that cuts across the layers.
const aspect = (n: IndexedNode) => {
  const k = n.kind ?? ''
  if (/service$/.test(k)) return 'service'
  if (/(process|function|interaction|event)$/.test(k)) return 'behavior'
  if (/(object|contract|product|representation|artifact)$/.test(k)) return 'passive'
  return 'active'
}
const ASPECT_ORDER = ['active', 'behavior', 'service', 'passive']

function AttributeAxes() {
  const data = DATASETS.spec
  return (
    <DemoCard label="axes={aspect} axisOrder={['active', 'behavior', 'service', 'passive']}">
      <HivePlot nodes={data.nodes} edges={data.edges} layering={LAYERING} graphOptions={VARIANT_OPTIONS} axisLabels={1} axes={aspect} axisOrder={ASPECT_ORDER} />
    </DemoCard>
  )
}

const ATTRIBUTE_CODE = `// Module scope (or useCallback / useMemo): a new function or array recomputes the axes.
const aspect = (n: IndexedNode) =>
  /service$/.test(n.kind ?? '') ? 'service'
  : /(process|function|interaction|event)$/.test(n.kind ?? '') ? 'behavior'
  : /(object|contract|product|representation|artifact)$/.test(n.kind ?? '') ? 'passive'
  : 'active'
const order = ['active', 'behavior', 'service', 'passive']

<HivePlot nodes={nodes} edges={edges} layering={layering} axes={aspect} axisOrder={order} />`

// ─── Geometry ──────────────────────────────────────────────────────────────

function HiveGeometryDemo() {
  const data = DATASETS.ux
  const graph = useLayeredGraph({ nodes: data.nodes, edges: data.edges, layering: LAYERING, layout: false })
  const { index } = graph
  const drawn = useMemo(() => {
    const ranks = rankWithinLayers(index, 'degree')
    const hive = hiveLayout(index.layers, ranks, { innerRadius: 40, axisLength: 200 })
    const links = index.links.flatMap((l) => {
      const s = index.nodeById.get(l.sourceId)
      const t = index.nodeById.get(l.targetId)
      if (!s || !t) return []
      const geo = hiveLinkGeometry(hive, { layerId: s.layerId, radius: hive.radiusOf.get(s.id)! }, { layerId: t.layerId, radius: hive.radiusOf.get(t.id)! })
      return geo ? [{ link: l, d: quadCurve(geo.a, geo.c, geo.b).d }] : []
    })
    return { hive, links }
  }, [index])
  const { hive, links } = drawn
  const outer = hive.innerRadius + hive.axisLength

  return (
    <svg viewBox={`${-outer - 24} ${-outer - 24} ${(outer + 24) * 2} ${(outer + 24) * 2}`} style={{ width: '100%', maxWidth: 380, display: 'block', margin: '0 auto' }} role="img" aria-label="Hive geometry drawn from hiveLayout and hiveLinkGeometry">
      {links.map(({ link, d }) => (
        <path key={link.id} d={d} fill="none" stroke={graph.linkEmphasis(link).color} strokeWidth={0.9} opacity={0.6} />
      ))}
      {hive.axes.map((axis) => {
        const layer = index.layerById.get(axis.layerId)
        return (
          <g key={axis.layerId}>
            {axis.offsets.map((off) => {
              const a = hivePoint(axis.angle + off, hive.innerRadius)
              const b = hivePoint(axis.angle + off, outer)
              return <line key={off} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={layer?.color ?? fg3} strokeWidth={2} strokeLinecap="round" />
            })}
            {(() => {
              const p = hivePoint(axis.angle, outer + 14)
              return (
                <text x={p.x} y={p.y + 3} textAnchor="middle" fontFamily={mono} fontSize={10} letterSpacing="0.08em" fill={fg3}>
                  {(layer?.label ?? axis.layerId).toUpperCase()}
                </text>
              )
            })()}
          </g>
        )
      })}
      {index.nodes.map((n) => {
        const axis = hive.axisOf.get(n.layerId)
        const r = hive.radiusOf.get(n.id)
        if (!axis || r === undefined) return null
        return axis.offsets.map((off) => {
          const p = hivePoint(axis.angle + off, r)
          return <circle key={`${n.id}:${off}`} cx={p.x} cy={p.y} r={2.6} fill="rgb(var(--canvas-bg))" stroke={fg1} strokeWidth={1} />
        })
      })}
    </svg>
  )
}

const GEOMETRY_CODE = `import { hiveLayout, hiveLinkGeometry, hivePoint, quadCurve, rankWithinLayers } from '@tinkermonkey/heimdall-ui'

const ranks = rankWithinLayers(index, 'degree')   // id → rank in (0, 1), busiest last
const hive = hiveLayout(index.layers, ranks, { innerRadius: 40, axisLength: 200 })
const outer = hive.innerRadius + hive.axisLength

// Axes: one line per copy (offsets is [-split, split], or [0] unsplit).
for (const axis of hive.axes)
  for (const off of axis.offsets)
    drawLine(hivePoint(axis.angle + off, hive.innerRadius), hivePoint(axis.angle + off, outer))

// Links: a quadratic curve; sourceCopy / targetCopy say which copy each end uses.
for (const link of index.links) {
  const s = index.nodeById.get(link.sourceId)
  const t = index.nodeById.get(link.targetId)
  const geo = hiveLinkGeometry(
    hive,
    { layerId: s.layerId, radius: hive.radiusOf.get(s.id) },
    { layerId: t.layerId, radius: hive.radiusOf.get(t.id) },
  )
  if (geo) drawPath(quadCurve(geo.a, geo.c, geo.b).d)
}`

// ─── Page ──────────────────────────────────────────────────────────────────

const li = { margin: '0 0 6px', fontSize: 12, color: fg2, lineHeight: 1.6 } as const
const kbd = { fontFamily: mono, fontSize: 11, color: fg1, padding: '0 4px', border: `1px solid ${border}`, borderRadius: 3 } as const

export function HivePlotShowcase() {
  return (
    <div>
      <PageHeader
        name="HivePlot"
        description="A hive plot of a layered graph: one radial axis per layer at evenly divided angles, nodes placed outward along their axis by rank (degree by default, busiest farthest out), links drawn as curves between axes. Position carries no layout, only layer and rank, so the drawing is the same for the same data and differences between layer pairs stand out: which pairs carry the most links, which nodes are the hubs, how much stays within a layer. Each axis is doubled so links within a layer span the gap between its two copies. Works for 2 to 6 layers; beyond that, the axes crowd and AdjacencyMatrix reads better."
      />

      <ShowcaseSection
        label="Playground"
        description="Rank and geometry are props on the plot; follow and predicate labels are layered state, here held in a LayeredGraphContext. Click a node to select it and light its reach; click a link to select its source, or turn on onLinkSelect to receive the link instead."
      >
        <HivePlayground />
      </ShowcaseSection>

      <ShowcaseSection
        label="Split and unsplit axes"
        description="Split (default): each axis is drawn twice at ±splitAngle, cross-layer links run between the facing copies of two axes and links within a layer cross the gap between one axis's copies. Unsplit: one line per axis, and links within a layer leave it as arcs, clockwise when the target sits farther out, so the side reads as direction; arcs between near neighbours keep a minimum bulge so each arrowhead stays on its own loop, and node labels take the side the highlighted loops cross least. Both show business.businessactor selected."
      >
        <SplitVariants />
        <Code>{VARIANTS_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Axes by any attribute"
        description="axes takes a function of the node: one axis per distinct value over every node, in code-point order unless axisOrder lists ids to put first or gives a comparator. Axes are coloured from the --graph-layer-<n> palette by axis order (layer colour when axes are layers), and titled with the axis id unless axisLabel says otherwise. Layer filters still hide nodes; an axis with no visible node leaves a gap and no angle moves. Selection, reach and link styles are unchanged, and links within one axis are drawn like intra-layer links. The function receives node instances: a node on several layers has one per layer (id@layer), each on its own axis, so read node.nodeId for the source node. A node it returns null, undefined or '' for is not drawn, with a warning in development; a selection on one isn't drawn either, and its reach shows without links to it. Ids sort as code points ('10' before '9'): pass a comparator for numbers."
      >
        <AttributeAxes />
        <Code>{ATTRIBUTE_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Labels and colours">
        <Note>
          With no selection, the axisLabels busiest nodes on each axis are labeled; with one, the selection and its reach are, dropping labels
          that would overlap another label, a dot or ring that isn't faded, or an arrowhead (the tooltip and accessible name still carry them).
          Hovering a node labels it, on top, without moving other labels. Links take their category colour and
          dash; around the selection they take the amber reach ramp, with arrowheads and predicate pills per predicateLabels.
        </Note>
        <Note>
          Hiding a layer (filters.hiddenLayers, for example from LayerList) leaves a gap: angles are divided among every layer, so the other axes
          and the frame don't move. Adding or removing a layer from the data re-divides the angles.
        </Note>
      </ShowcaseSection>

      <ShowcaseSection label="Keyboard" description="The nodes are one tab stop: Tab focuses the plot's current node, then the keys below move within it.">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li style={li}>
            <span style={kbd}>↑</span> <span style={kbd}>↓</span> move outward and inward along the axis.
          </li>
          <li style={li}>
            <span style={kbd}>→</span> <span style={kbd}>←</span> move to the next and previous axis, at the nearest rank.
          </li>
          <li style={li}>
            <span style={kbd}>Home</span> <span style={kbd}>End</span> jump to the ends of the axis.
          </li>
          <li style={li}>
            <span style={kbd}>Enter</span> <span style={kbd}>Space</span> select the focused node; again clears. <span style={kbd}>Escape</span> clears the selection.
          </li>
          <li style={li}>Selection keys need interactions.select (on by default). Node hit targets stay at least 24 px across at any scale.</li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Props" description="The SVG fills its container's width at a fixed aspect ratio; wrap it to bound its size. Remaining props go to the root div.">
        <PropsTable>
          <PropRow name="graph" type="LayeredGraphState" def="context" description="State from useLayeredGraph. Unset: the enclosing LayeredGraphContext, else its own from nodes, edges and layering." />
          <PropRow name="nodes" type="GraphNodeData[]" description="Standalone nodes; ignored with graph or a context." />
          <PropRow name="edges" type="GraphEdgeData[]" description="Standalone edges; ignored with graph or a context." />
          <PropRow name="layering" type="BuildLayeredIndexOptions" description="Standalone layering (layerBy, …); memoize it." />
          <PropRow name="graphOptions" type="Omit<UseLayeredGraphOptions, 'nodes' | 'edges' | 'layering'>" description="Standalone selection, follow, filters and label mode." />
          <PropRow name="axes" type="'layer' | ((node: IndexedNode) => string | null | undefined)" def="'layer'" description="Axis per layer, or per value of any attribute of a node instance (node.nodeId is the source node); null, undefined or '': not drawn. Memoize it." />
          <PropRow name="axisOrder" type="readonly string[] | ((a: string, b: string) => number)" def="layer order / code point" description="Axis ids to put first (the rest follow), or a comparator (numbers need one). Memoize it." />
          <PropRow name="axisLabel" type="(axisId: string) => string" def="layer label / axis id" description="Axis title. Memoize it." />
          <PropRow name="rank" type="NodeOrder" def="'degree'" description="Placement outward along each axis (rankWithinLayers): 'degree', 'cross-degree', 'label', 'coupled-x' or a comparator." />
          <PropRow name="splitAxes" type="boolean" def="true" description="Double each axis; off draws intra-layer links as arcs off the single axis." />
          <PropRow name="splitAngle" type="number" def="13" description="Half the angle between an axis's copies, degrees; clamped to leave room between axes." />
          <PropRow name="axisLabels" type="number" def="1" description="Nodes labeled per axis with no selection (busiest first)." />
          <PropRow name="innerRadius" type="number" def="64" description="Radius of the axes' inner end, viewBox units." />
          <PropRow name="axisLength" type="number" def="300" description="Axis length, viewBox units (the plot scales to its container)." />
          <PropRow name="startAngle" type="number" def="-90" description="First axis angle, degrees clockwise from the right (−90 = up)." />
          <PropRow name="interactions" type="HivePlotInteractions" def="both on" description="{ select?: boolean; hover?: boolean }: node selection (click, Enter, Space, Escape) and hover lift." />
          <PropRow name="onLinkSelect" type="(link: IndexedLink) => void" description="Link click handler. Unset: selects the link's source." />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection
        label="Geometry for custom renderers"
        description="The hive math is exported and free of React. hiveLayout(layers, rank, options) returns a HiveLayout: each HiveAxis with its angle, copy offsets and label copy, every node's radius, and the split actually used. hiveLinkGeometry(layout, source, target) returns a link's quadratic curve as HiveLinkGeometry (a, c, b and the copy used at each end); feed it to quadCurve. HiveLayoutOptions takes the same innerRadius, axisLength, splitAxes, splitAngle and startAngle as the component, plus hiddenLayers: those keep their angle slot (HiveLayout.slots) but get no drawn axis, radius or link geometry."
      >
        <DemoCard label="Static SVG from hiveLayout and hiveLinkGeometry">
          <HiveGeometryDemo />
        </DemoCard>
        <Code>{GEOMETRY_CODE}</Code>
        <div style={{ height: 12 }} />
        <PropsTable>
          <PropRow name="hiveLayout" type="(layers, rank, options?) => HiveLayout" description="Axes for the layers in draw order and each node's radius from its rank in (0, 1); nodes without a rank sit mid-axis. Angles are divided among all layers, hidden ones included." />
          <PropRow name="hiveLinkGeometry" type="(layout, source, target) => HiveLinkGeometry | null" description="One link's curve; source and target are { layerId, radius }. Null when a layer has no axis." />
          <PropRow name="hivePoint" type="(angle, radius) => Point" description="Point at angle degrees (clockwise from +x, y down) and radius from the origin." />
          <PropRow name="hiveAxisAngles" type="(count, start?) => number[]" def="start -90" description="count evenly divided axis angles, degrees, clockwise from start." />
          <PropRow name="clampSplitAngle" type="(split, count) => number" description="The split half-angle, kept below half the gap between neighbouring axes, minus 6° of air." />
          <PropRow name="hiveLabelSide" type="(axis, copy?) => 1 | -1" description="Horizontal side a label sits on at a dot on that axis copy: 1 = right (text-anchor start), -1 = left." />
          <PropRow name="hiveAxisGroups" type="(index, axes?, axisOrder?) => HiveAxisGroups" description="The axes in angle order with their node instances (filters not applied), each node's axis id, and the nodes left without an axis." />
          <PropRow name="rankWithinLayers" type="(index, by?, groups?) => Map<string, number>" description="Position along a layer axis in (0, 1): (i + 0.5) / n. degree and cross-degree put the busiest last." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
