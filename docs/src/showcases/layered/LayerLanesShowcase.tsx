import { useCallback, useMemo, useState } from 'react'
import {
  FollowControl,
  GraphCanvas,
  HivePlot,
  LayeredGraphContext,
  PredicateLabelControl,
  SegmentedControl,
  arrowHeadPoints,
  laneLinkCurve,
  layoutLanes,
  useLayeredGraph,
  type GraphCanvasProps,
  type GraphEdgeData,
  type GraphNodeData,
  type LaneLayoutOptions,
  type LaneNodeLabels,
  type LaneOrientation,
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

const canvasFrame = { border: `1px solid ${border}`, borderRadius: 6, overflow: 'hidden' } as const

// ─── Playground ────────────────────────────────────────────────────────────

type OrderKey = 'default' | 'coupled-x' | 'degree' | 'cross-degree' | 'label'
type RowWidthKey = 'default' | '400' | '640' | '1120' | '1600'

function LanesPlayground() {
  const [dataset, setDataset] = useState<DatasetKey>('spec')
  return <LanesPlaygroundBody key={dataset} dataset={dataset} onDatasetChange={setDataset} />
}

function LanesPlaygroundBody({ dataset, onDatasetChange }: { dataset: DatasetKey; onDatasetChange: (d: DatasetKey) => void }) {
  const data = DATASETS[dataset]
  const graph = useLayeredGraph({
    nodes: data.nodes,
    edges: data.edges,
    layering: LAYERING,
    layout: data.layout,
    defaultSelectedId: data.selected,
    defaultFollow: 1,
  })
  const [orientation, setOrientation] = useState<LaneOrientation>('horizontal')
  const [order, setOrder] = useState<OrderKey>('default')
  const [intraLinks, setIntraLinks] = useState<'arc' | 'none'>('arc')
  const [skipRouting, setSkipRouting] = useState<'direct' | 'gutter'>('direct')
  const [nodeLabels, setNodeLabels] = useState<LaneNodeLabels>('all')
  const [rowWidth, setRowWidth] = useState<RowWidthKey>('default')

  const laneOptions = useMemo<LaneLayoutOptions>(
    () => ({
      orientation,
      order: order === 'default' ? undefined : (order as NodeOrder),
      intraLinks,
      skipLayerRouting: skipRouting,
      nodeLabels,
      maxRowWidth: rowWidth === 'default' ? undefined : Number(rowWidth),
    }),
    [orientation, order, intraLinks, skipRouting, nodeLabels, rowWidth],
  )

  const code = useMemo(() => {
    const opts: string[] = []
    if (orientation !== 'horizontal') opts.push(`orientation: '${orientation}'`)
    if (order !== 'default') opts.push(`order: '${order}'`)
    if (rowWidth !== 'default') opts.push(`maxRowWidth: ${rowWidth}`)
    if (intraLinks !== 'arc') opts.push(`intraLinks: '${intraLinks}'`)
    if (skipRouting !== 'direct') opts.push(`skipLayerRouting: '${skipRouting}'`)
    if (nodeLabels !== 'all') opts.push(`nodeLabels: '${nodeLabels}'`)
    const lines = [
      'const graph = useLayeredGraph({',
      '  nodes, edges, layering,',
      `  defaultFollow: ${graph.follow},`,
      `  defaultPredicateLabels: '${graph.predicateLabels}',`,
      '})',
      '',
      '<LayeredGraphContext.Provider value={graph}>',
      '  <GraphCanvas',
      '    layout="layer-lanes"',
    ]
    if (opts.length) lines.push(`    laneOptions={{ ${opts.join(', ')} }}`)
    lines.push('    fitView', '  />', '</LayeredGraphContext.Provider>')
    if (!graph.filters.showIntra) lines.push('', '// filters.showIntra: false', 'graph.setShowIntra(false)')
    return lines.join('\n')
  }, [orientation, order, rowWidth, intraLinks, skipRouting, nodeLabels, graph.follow, graph.predicateLabels, graph.filters.showIntra])

  const selected = graph.selectedId ? graph.index.nodeById.get(graph.selectedId) : undefined
  const cross = graph.index.links.filter((l) => l.cross).length
  // Remount on layout changes so fitView frames the new lanes.
  const canvasKey = `${orientation}|${order}|${rowWidth}|${intraLinks}|${skipRouting}|${nodeLabels}`

  return (
    <LayeredGraphContext.Provider value={graph}>
      <ControlPanel>
        <ControlRow label="Data">
          <SegmentedControl aria-label="Dataset" value={dataset} onChange={(v) => onDatasetChange(v as DatasetKey)} options={DATASET_OPTIONS} />
          <span style={{ fontSize: 12, color: fg2 }}>{data.summary}</span>
        </ControlRow>
        <ControlRow label="orientation">
          <SegmentedControl
            aria-label="Orientation"
            value={orientation}
            onChange={(v) => setOrientation(v as LaneOrientation)}
            options={[
              { value: 'horizontal', label: 'horizontal' },
              { value: 'vertical', label: 'vertical' },
            ]}
          />
          <Control label="intraLinks">
            <SegmentedControl
              aria-label="Intra-layer links"
              value={intraLinks}
              onChange={(v) => setIntraLinks(v as 'arc' | 'none')}
              options={[
                { value: 'arc', label: 'arc' },
                { value: 'none', label: 'none' },
              ]}
            />
          </Control>
          <Control label="skipLayerRouting">
            <SegmentedControl
              aria-label="Skip-layer routing"
              value={skipRouting}
              onChange={(v) => setSkipRouting(v as 'direct' | 'gutter')}
              options={[
                { value: 'direct', label: 'direct' },
                { value: 'gutter', label: 'gutter' },
              ]}
            />
          </Control>
          <Control label="nodeLabels">
            <SegmentedControl
              aria-label="Node labels"
              value={nodeLabels}
              onChange={(v) => setNodeLabels(v as LaneNodeLabels)}
              options={[
                { value: 'all', label: 'all' },
                { value: 'reached', label: 'reached' },
              ]}
            />
          </Control>
        </ControlRow>
        <ControlRow label="order">
          <SegmentedControl
            aria-label="Node order"
            value={order}
            onChange={(v) => setOrder(v as OrderKey)}
            options={[
              { value: 'default', label: 'default' },
              { value: 'coupled-x', label: 'coupled-x' },
              { value: 'degree', label: 'degree' },
              { value: 'cross-degree', label: 'cross-degree' },
              { value: 'label', label: 'label' },
            ]}
          />
        </ControlRow>
        <ControlRow label="maxRowWidth">
          <SegmentedControl
            aria-label="Maximum row width"
            value={rowWidth}
            onChange={(v) => setRowWidth(v as RowWidthKey)}
            options={[
              { value: 'default', label: 'default' },
              { value: '400', label: '400' },
              { value: '640', label: '640' },
              { value: '1120', label: '1120' },
              { value: '1600', label: '1600' },
            ]}
          />
        </ControlRow>
        <ControlRow label="State">
          <FollowControl />
          <PredicateLabelControl />
          <Toggle on={graph.filters.showIntra} onChange={graph.setShowIntra}>
            filters.showIntra
          </Toggle>
        </ControlRow>
      </ControlPanel>
      <DemoCard label='GraphCanvas layout="layer-lanes"'>
        <div style={{ ...canvasFrame, height: orientation === 'vertical' ? 600 : 540 }}>
          <GraphCanvas
            key={canvasKey}
            layout="layer-lanes"
            laneOptions={laneOptions}
            fitView
            fitPadding={24}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <Status>
          {graph.index.nodes.length} nodes · {graph.index.links.length} links · {cross} cross-layer ·{' '}
          {selected ? `selected ${selected.id} · reach ${graph.reach.hopOf.size - 1}` : 'no selection'}
        </Status>
      </DemoCard>
      <Code>{code}</Code>
    </LayeredGraphContext.Provider>
  )
}

// ─── Inherited: tooltips and toolbar ───────────────────────────────────────

const ux = DATASETS.ux
const TOOLTIP_GRAPH_OPTIONS = { defaultFollow: 1 }

function nodeTooltip(node: GraphNodeData) {
  const layer = String(node.attributes?.layer ?? '')
  const description = typeof node.attributes?.description === 'string' ? node.attributes.description : null
  return (
    <div style={{ maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontWeight: 600 }}>{node.label}</span>
      <span style={{ fontFamily: mono, fontSize: 11, opacity: 0.75 }}>
        {layer} · {node.kind}
      </span>
      {description && <span style={{ fontSize: 12, lineHeight: 1.5 }}>{description}</span>}
    </div>
  )
}

const uxLabel = new Map(ux.nodes.map((n) => [n.id, n.label]))

function edgeTooltip(edge: GraphEdgeData) {
  const category = String(edge.attributes?.category ?? 'other')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 280 }}>
      <span style={{ fontFamily: mono, fontSize: 12 }}>{edge.label ?? 'link'}</span>
      <span style={{ fontSize: 12 }}>
        {uxLabel.get(edge.sourceId) ?? edge.sourceId} to {uxLabel.get(edge.targetId) ?? edge.targetId}
      </span>
      <span style={{ fontFamily: mono, fontSize: 11, opacity: 0.75 }}>{category}</span>
    </div>
  )
}

const TOOLTIP_CODE = `<GraphCanvas
  layout="layer-lanes"
  nodes={nodes}
  edges={edges}
  layering={layering}
  layeredGraphOptions={{ defaultFollow: 1 }}
  nodeTooltip={(node) => <NodeSummary node={node} />}
  edgeTooltip={(edge) => <>{edge.label} · {edge.attributes?.category}</>}
  toolbarPosition="top-right"
  fitView
/>`

// ─── Inherited: renderNode ─────────────────────────────────────────────────

function CustomNodeDemo() {
  const graph = useLayeredGraph({
    nodes: ux.nodes,
    edges: ux.edges,
    layering: LAYERING,
    layout: ux.layout,
    defaultSelectedId: 'application.applicationcomponent.graph-canvas-component',
    defaultFollow: 1,
  })

  const renderNode = useCallback<NonNullable<GraphCanvasProps['renderNode']>>(
    (node, selected, _hierarchy, props) => {
      const inst = graph.index.nodeById.get(node.id)
      const em = inst ? graph.nodeEmphasis(inst) : undefined
      const layer = inst ? graph.index.layerById.get(inst.layerId) : undefined
      const reached = !!em && em.hop !== null && !selected
      const edgeColor = selected ? 'rgb(var(--accent-primary))' : reached ? 'rgb(var(--graph-hop-1) / 0.7)' : border
      return (
        <div
          role="button"
          tabIndex={0}
          aria-pressed={selected}
          aria-label={node.label}
          aria-describedby={props?.tooltipId}
          onClick={(e) => {
            e.stopPropagation()
            props?.onSelect?.(node.id)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              props?.onSelect?.(node.id)
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            padding: '4px 8px 5px',
            minWidth: 96,
            borderRadius: 4,
            borderStyle: 'solid',
            borderWidth: '1px 1px 1px 3px',
            borderColor: `${edgeColor} ${edgeColor} ${edgeColor} ${layer?.color ?? fg3}`,
            background: 'rgb(var(--canvas-bg))',
            boxShadow: selected ? 'var(--focus-ring)' : undefined,
            opacity: em?.opacity ?? 1,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: fg3 }}>
            {node.kind}
            {inst ? ` · ${inst.degree}` : ''}
          </span>
          <span style={{ fontSize: 11, color: fg1, whiteSpace: 'nowrap' }}>{inst?.displayLabel ?? node.label}</span>
        </div>
      )
    },
    [graph],
  )

  return (
    <div style={{ ...canvasFrame, height: 520 }}>
      <GraphCanvas
        layout="layer-lanes"
        nodes={ux.nodes}
        edges={ux.edges}
        layeredGraph={graph}
        renderNode={renderNode}
        fitView
        fitPadding={24}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

const RENDER_NODE_CODE = `const graph = useLayeredGraph({ nodes, edges, layering })

const renderNode = useCallback((node, selected, _hierarchy, props) => {
  const inst = graph.index.nodeById.get(node.id)   // node.id is the node instance id
  const em = graph.nodeEmphasis(inst)              // hop, opacity, tint around the selection
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-describedby={props?.tooltipId}
      onClick={(e) => { e.stopPropagation(); props?.onSelect?.(node.id) }}
      style={{ opacity: em.opacity }}
    >
      <span className="eyebrow">{node.kind} · {inst.degree}</span>
      {inst.displayLabel}
    </div>
  )
}, [graph])

<GraphCanvas layout="layer-lanes" nodes={nodes} edges={edges} layeredGraph={graph} renderNode={renderNode} fitView />`

// ─── Shared state ──────────────────────────────────────────────────────────

function SharedStateDemo() {
  const data = DATASETS.spec
  const graph = useLayeredGraph({
    nodes: data.nodes,
    edges: data.edges,
    layering: LAYERING,
    layout: data.layout,
    defaultSelectedId: 'technology.node',
    defaultFollow: 1,
  })
  const laneOptions = useMemo<LaneLayoutOptions>(() => ({ orientation: 'vertical', intraLinks: 'none' }), [])
  const selected = graph.selectedId ? graph.index.nodeById.get(graph.selectedId) : undefined
  return (
    <LayeredGraphContext.Provider value={graph}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <FollowControl />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        <div style={{ ...canvasFrame, height: 460 }}>
          <GraphCanvas
            layout="layer-lanes"
            nodes={data.nodes}
            edges={data.edges}
            laneOptions={laneOptions}
            showToolbar={false}
            fitView
            fitPadding={16}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <HivePlot style={{ width: '100%' }} />
        </div>
      </div>
      <Status>{selected ? `selected ${selected.id} in both views` : 'no selection'}</Status>
    </LayeredGraphContext.Provider>
  )
}

const STANDALONE_CODE = `// Standalone: the canvas builds its own state from nodes, edges and layering.
const layering = useMemo(() => ({ layerBy: 'layer', linkCategoryBy: 'category' }), [])

<GraphCanvas
  layout="layer-lanes"
  nodes={nodes}
  edges={edges}
  layering={layering}
  layeredGraphOptions={{ defaultSelectedId: 'technology.node', defaultFollow: 1 }}
  fitView
/>`

const SHARED_CODE = `// Shared: one state for the lanes, the hive plot and the chrome controls.
const graph = useLayeredGraph({ nodes, edges, layering, defaultFollow: 1 })

<LayeredGraphContext.Provider value={graph}>
  <FollowControl />
  <GraphCanvas layout="layer-lanes" nodes={nodes} edges={edges} laneOptions={{ orientation: 'vertical' }} fitView />
  <HivePlot />
</LayeredGraphContext.Provider>

// Or pass it directly, without a provider:
<GraphCanvas layout="layer-lanes" nodes={nodes} edges={edges} layeredGraph={graph} fitView />`

// ─── Geometry ──────────────────────────────────────────────────────────────

const GEO_NODE_H = 20
const geoNodeWidth = (label: string) => Math.round(label.length * 6 + 18)

function LaneGeometryDemo() {
  const graph = useLayeredGraph({ nodes: ux.nodes, edges: ux.edges, layering: LAYERING, layout: ux.layout, defaultSelectedId: null })
  const { index, layout } = graph

  const lanes = useMemo(() => {
    const sizeOf = (id: string) => ({ width: geoNodeWidth(index.nodeById.get(id)?.displayLabel ?? id), height: GEO_NODE_H })
    const lane = layoutLanes(index, layout, { sizeOf, maxRowWidth: 1120 })
    const box = (id: string) => ({ ...lane.positions.get(id)!, ...sizeOf(id) })
    const links = index.links
      .filter((l) => lane.positions.has(l.sourceId) && lane.positions.has(l.targetId))
      .map((l) => ({ link: l, curve: laneLinkCurve(box(l.sourceId), box(l.targetId), l.cross, lane.orientation) }))
    return { lane, links, sizeOf }
  }, [index, layout])

  const { bounds } = lanes.lane
  const pad = 8
  const vb = `${bounds.minX - pad} ${bounds.minY - pad} ${bounds.maxX - bounds.minX + pad * 2} ${bounds.maxY - bounds.minY + pad * 2}`

  return (
    <svg viewBox={vb} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Lane layout drawn from layoutLanes and laneLinkCurve">
      {lanes.lane.bands.map((b) => (
        <g key={b.layerId}>
          <rect x={b.x} y={b.y} width={b.width} height={b.height} rx={6} fill={b.color} fillOpacity={0.07} stroke={b.color} strokeOpacity={0.35} />
          <text x={b.titleX} y={b.titleY} fontFamily={mono} fontSize={10} letterSpacing="0.08em" fill={fg3}>
            {b.label.toUpperCase()} · {b.count}
          </text>
        </g>
      ))}
      {lanes.links.map(({ link, curve }) => {
        const em = graph.linkEmphasis(link)
        return (
          <g key={link.id} opacity={link.cross ? 0.8 : 0.45}>
            <path d={curve.d} fill="none" stroke={em.color} strokeWidth={1.1} strokeDasharray={em.dash || undefined} />
            <polygon points={arrowHeadPoints(curve.tip, curve.dir.x, curve.dir.y, 5, 2.4)} fill={em.color} />
          </g>
        )
      })}
      {index.nodes.map((n) => {
        const p = lanes.lane.positions.get(n.id)
        if (!p) return null
        const s = lanes.sizeOf(n.id)
        return (
          <g key={n.id}>
            <rect x={p.x - s.width / 2} y={p.y - s.height / 2} width={s.width} height={s.height} rx={3} fill="rgb(var(--canvas-bg))" stroke={border} />
            <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontFamily={mono} fontSize={10} fill={fg1}>
              {n.displayLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const GEOMETRY_CODE = `import { layoutLanes, laneLinkCurve, arrowHeadPoints, useLayeredGraph } from '@tinkermonkey/heimdall-ui'

const { index, layout, linkEmphasis } = useLayeredGraph({ nodes, edges, layering })
const sizeOf = (id) => ({ width: textWidth(index.nodeById.get(id).displayLabel) + 18, height: 20 })

const lanes = layoutLanes(index, layout, { sizeOf, maxRowWidth: 1120 })
// lanes.positions: node centres · lanes.bands: one LaneBand per layer · lanes.bounds

const box = (id) => ({ ...lanes.positions.get(id), ...sizeOf(id) })
for (const link of index.links) {
  const curve = laneLinkCurve(box(link.sourceId), box(link.targetId), link.cross, lanes.orientation)
  // <path d={curve.d} stroke={linkEmphasis(link).color} />
  // <polygon points={arrowHeadPoints(curve.tip, curve.dir.x, curve.dir.y)} />
}`

// ─── Page ──────────────────────────────────────────────────────────────────

export function LayerLanesShowcase() {
  return (
    <div>
      <PageHeader
        name="Layer lanes"
        description='A GraphCanvas layout for layered graphs: one swimlane per layer, nodes packed into rows in an order that keeps linked nodes in line, so links between layers mostly run straight across the gap. Links within a layer arc above their row. Selection, follow depth, filters and predicate labels come from the layered graph state, so the lanes can share one selection with the hive plot, the matrix and the layer stack. Use it with layout="layer-lanes" on a graph whose nodes carry a layering attribute.'
      />

      <ShowcaseSection
        label="Playground"
        description="Lane options are props on the canvas; follow, predicate labels and the intra-layer filter are layered state, here held in a LayeredGraphContext. Click a node to select it, again or Escape to clear."
      >
        <LanesPlayground />
      </ShowcaseSection>

      <ShowcaseSection
        label="Inherited from GraphCanvas"
        description="Lanes are a GraphCanvas layout, so the canvas features carry over: the toolbar (zoom, fit, lock, fullscreen), pan and zoom, fitView, drag, tooltips, popovers, renderNode and renderEdge. Edge callbacks receive one GraphEdgeData per bundled link, with label set to its predicates joined by ' · ' and the first bundled edge's attributes."
      >
        <DemoCard label="nodeTooltip · edgeTooltip · toolbar">
          <Note>Hover a node for its layer, kind and description; hover a link for its predicates and category. The toolbar sits top right here.</Note>
          <div style={{ ...canvasFrame, height: 480 }}>
            <GraphCanvas
              layout="layer-lanes"
              nodes={ux.nodes}
              edges={ux.edges}
              layering={LAYERING}
              layeredGraphOptions={TOOLTIP_GRAPH_OPTIONS}
              nodeTooltip={nodeTooltip}
              edgeTooltip={edgeTooltip}
              toolbarPosition="top-right"
              fitView
              fitPadding={24}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <Code>{TOOLTIP_CODE}</Code>
        </DemoCard>
        <div style={{ height: 12 }} />
        <DemoCard label="renderNode">
          <Note>
            A custom node: kind and degree eyebrow over the label, the layer color as a left bar, the amber border on the selection and a dim
            outside its reach. renderNode receives the node instance id; look the instance up in the index for its layer, degree and emphasis.
            The renderer wires selection itself through props.onSelect.
          </Note>
          <CustomNodeDemo />
          <Code>{RENDER_NODE_CODE}</Code>
        </DemoCard>
      </ShowcaseSection>

      <ShowcaseSection
        label="Standalone or shared state"
        description="The canvas looks for state in this order: the layeredGraph prop, then an enclosing LayeredGraphContext, then its own state built from nodes, edges and layering (with layeredGraphOptions). Standalone suits a lanes-only page. Shared state lets the lanes, the other layered views and the chrome controls show one selection; with it, the drawn graph is the state's index and layering is ignored. Selection always belongs to the layered state: selectedNodeId is ignored, onNodeSelect still fires."
      >
        <DemoCard label="Shared: vertical lanes and HivePlot on one state">
          <Note>Select a node in either view; the other follows.</Note>
          <SharedStateDemo />
        </DemoCard>
        <Code>{STANDALONE_CODE}</Code>
        <Code>{SHARED_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Props" description='Read only with layout="layer-lanes". Every other GraphCanvas prop applies as documented on the GraphCanvas page.'>
        <PropsTable>
          <PropRow name="layeredGraph" type="LayeredGraphState" def="context" description="Shared state from useLayeredGraph. Unset: the enclosing LayeredGraphContext, else the canvas builds its own from nodes, edges and layering." />
          <PropRow name="layering" type="BuildLayeredIndexOptions" def="{ layerBy: 'kind', missingValue: 'layer' }" description="Standalone layering of nodes; memoize it. Ignored with layeredGraph or a context." />
          <PropRow name="layeredGraphOptions" type="Omit<UseLayeredGraphOptions, 'nodes' | 'edges' | 'layering'>" description="Standalone selection, follow, filters, label mode and in-layer layout." />
          <PropRow name="laneOptions" type="LaneLayoutOptions" description="Orientation, node order, row width, intra-layer links and node labels; fields below." />
          <PropRow name="nodes / edges" type="GraphNodeData[] / GraphEdgeData[]" description="Optional with layeredGraph or a context, which supply the drawn graph; edges then only add each link's source edge fields (for edgeTooltip, renderEdge)." />
        </PropsTable>
        <div style={{ height: 16 }} />
        <div style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: fg3, marginBottom: 10 }}>LaneLayoutOptions</div>
        <PropsTable>
          <PropRow name="orientation" type="'horizontal' | 'vertical'" def="'horizontal'" description="horizontal: lanes stacked top to bottom, nodes packed into rows. vertical: lanes side by side as columns, for narrow, tall containers." />
          <PropRow name="order" type="NodeOrder" def="coupled position" description="Node order within each lane: 'coupled-x', 'degree', 'cross-degree', 'label' or a comparator. Default: position along the lane in the coupled in-layer solve (x for rows, y for columns), so cross-layer links run mostly straight; 'degree' with no in-layer layout." />
          <PropRow name="maxRowWidth" type="number" def="1120 / 640" description="Row length in px before a lane wraps to another row; a column's height when vertical (default 640)." />
          <PropRow name="intraLinks" type="'arc' | 'none'" def="'arc'" description="Links within a layer: arc draws them beside their row; none leaves them out. filters.showIntra on the state hides them in every view instead." />
          <PropRow name="skipLayerRouting" type="'direct' | 'gutter'" def="'direct'" description="Links that skip a lane: direct crosses the lanes between; gutter runs them along the gap next to their lane to a side gutter outside the lanes (left/right, or top/bottom when vertical), along it, and back in, in parallel tracks. A node's routes to one gutter share a stub that fans out into their tracks. Gaps widen to keep stubs 3px apart, so on a dense graph the lanes get taller and the gutters wider." />
          <PropRow name="nodeLabels" type="'all' | 'reached'" def="state's nodeLabels" description="all: every node is a labeled box. reached: 24px chips, with name tags only for the selection, its reach and the hovered or focused node, placed clear of chips, titles, link ends and pills (dropped where none fits). Unset: the layered state's nodeLabels (all when on), so the label toggle applies; with fitView the canvas fits again after a switch. A custom renderNode is unaffected." />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection
        label="Geometry for custom renderers"
        description="The lane math is exported and free of React. layoutLanes(index, layout, input) returns a LaneLayout: node centres keyed by instance id, one LaneBand per drawn layer (color, count, box, title position) and the bounds. Its input (LayoutLanesInput) is the LaneLayoutOptions plus sizeOf(id) for each node box and hiddenLayers. laneLinkCurve(sourceBox, targetBox, cross, orientation) returns a LaneLinkCurve between two LaneNodeBoxes: an EdgeCurve (d, pointAt, tangentAt) plus the arrow tip and dir. The link curve is separate from the layout, so a renderer can redraw links from live positions without re-running it."
      >
        <DemoCard label="Static SVG from layoutLanes and laneLinkCurve">
          <LaneGeometryDemo />
        </DemoCard>
        <Code>{GEOMETRY_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Keyboard">
        <Note>
          The lane nodes are one Tab stop, entering at the selection (or the last focused node, or the first). Arrow keys follow the screen:
          in horizontal lanes Up and Down move to the linked node in the next lane (else the nearest one) and Left and Right move along the
          lane; in vertical lanes Left and Right cross lanes and Up and Down move along one. Home and End go to the lane&apos;s ends, Enter
          or Space selects, Escape clears. Hiding the focused node&apos;s layer moves focus to the nearest remaining node.
        </Note>
      </ShowcaseSection>

      <ShowcaseSection label="Limits">
        <Note>
          Dense layers (near-cliques) draw many arcs; set laneOptions intraLinks to none, or filters.showIntra to false, to read only the
          cross-layer links. Links that skip a layer cross the lane between. The default lane node truncates long labels; the full label is
          its accessible name.
        </Note>
      </ShowcaseSection>
    </div>
  )
}
