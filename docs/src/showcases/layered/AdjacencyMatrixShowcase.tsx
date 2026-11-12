import { useState } from 'react'
import {
  AdjacencyMatrix,
  DEFAULT_LINK_FILTERS,
  FollowControl,
  LayeredGraphContext,
  PredicateLabelControl,
  SegmentedControl,
  useLayeredGraph,
  type BuildLayeredIndexOptions,
  type IndexedLink,
  type LayerLayoutOptions,
  type LayerMatrixCell,
  type NodeOrder,
  type PredicateCatalog,
  type UseLayeredGraphOptions,
} from '@tinkermonkey/heimdall-ui'
import {
  drCategoryOrder,
  drLayers,
  drSpecEdges,
  drSpecNodes,
  heimdallUxEdges,
  heimdallUxNodes,
} from '@/test-pages/fixtures/layeredGraphFixtures'
import { PageHeader, ShowcaseSection, DemoCard, PropsTable, PropRow } from '../../components/ShowcaseSection'

const fg1 = 'rgb(var(--canvas-fg-1, 17 24 39))'
const fg2 = 'rgb(var(--canvas-fg-2, 75 85 99))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'
const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

// ─── Data ──────────────────────────────────────────────────────────────────

type DatasetKey = 'spec' | 'ux'

const DATASETS = {
  spec: {
    label: 'Spec meta-model',
    summary: '36 element types, 204 relationship schemas across business, application and technology.',
    nodes: drSpecNodes,
    edges: drSpecEdges,
    layout: { layoutCategories: ['structural'] } as LayerLayoutOptions,
    selected: 'application.applicationcomponent' as string | null,
  },
  ux: {
    label: 'heimdall-ux model',
    summary: 'A model of heimdall-ui itself: many links within each layer, few across.',
    nodes: heimdallUxNodes,
    edges: heimdallUxEdges,
    layout: { layoutCategories: null } as LayerLayoutOptions,
    selected: null as string | null,
  },
} as const

const LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'layer',
  layers: drLayers,
  categoryOrder: drCategoryOrder,
  linkCategoryBy: 'category',
}

// A catalog sets each predicate's display label and matrix code. `category` is the fallback
// when an edge carries no category attribute.
const CATALOG: PredicateCatalog = {
  serves: { category: 'behavioral', code: 'SV', label: 'Serves' },
  realizes: { category: 'structural', code: 'RZ', label: 'Realizes' },
  triggers: { category: 'behavioral', code: 'TR', label: 'Triggers' },
  composes: { category: 'structural', code: 'CO', label: 'Is composed of' },
  'assigned-to': { category: 'structural', code: 'AS', label: 'Is assigned to' },
  accesses: { category: 'security', code: 'AC', label: 'Accesses' },
  'flows-to': { category: 'behavioral', code: 'FL', label: 'Flows to' },
  uses: { category: 'dependency', code: 'US', label: 'Uses' },
  aggregates: { category: 'structural', code: 'AG', label: 'Aggregates' },
  'depends-on': { category: 'dependency', code: 'DP', label: 'Depends on' },
}

const CATALOG_LAYERING: BuildLayeredIndexOptions = { ...LAYERING, catalog: CATALOG }
const CATALOG_OPTIONS: Omit<UseLayeredGraphOptions, 'nodes' | 'edges' | 'layering'> = {
  defaultPredicateLabels: 'all',
  defaultFilters: { ...DEFAULT_LINK_FILTERS, hiddenLayers: ['technology'] },
  layout: { layoutCategories: ['structural'] },
}

// ─── Code samples ──────────────────────────────────────────────────────────

const CATALOG_CODE = `const catalog: PredicateCatalog = {
  serves:   { category: 'behavioral', code: 'SV', label: 'Serves' },
  realizes: { category: 'structural', code: 'RZ', label: 'Realizes' },
  composes: { category: 'structural', code: 'CO', label: 'Is composed of' },
  // predicates left out get a derived code and show as written
}

const layering = useMemo(() => ({ layerBy: 'layer', linkCategoryBy: 'category', catalog }), [])

<AdjacencyMatrix
  nodes={nodes}
  edges={edges}
  layering={layering}
  graphOptions={{
    defaultPredicateLabels: 'all',
    defaultFilters: { ...DEFAULT_LINK_FILTERS, hiddenLayers: ['technology'] },
  }}
/>`

const SHARED_CODE = `// Standalone: the matrix builds its own layered-graph state.
<AdjacencyMatrix nodes={nodes} edges={edges} layering={layering} />

// Shared with other layered views and controls:
const graph = useLayeredGraph({ nodes, edges, layering })
<LayeredGraphContext.Provider value={graph}>
  <FollowControl />
  <AdjacencyMatrix order="degree" />
</LayeredGraphContext.Provider>`

// ─── Bits ──────────────────────────────────────────────────────────────────

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

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: fg3 }}>{label}</span>
      {children}
    </div>
  )
}

function OnOff({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Control label={label}>
      <SegmentedControl
        aria-label={label}
        value={value ? 'on' : 'off'}
        onChange={(v) => onChange(v === 'on')}
        options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]}
      />
    </Control>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function AdjacencyMatrixShowcase() {
  const [dataset, setDataset] = useState<DatasetKey>('spec')
  return (
    <div>
      <PageHeader
        name="AdjacencyMatrix"
        description="A directed block adjacency matrix of a layered graph. Rows are sources, columns are targets, both grouped by layer. Diagonal blocks hold links within a layer; off-diagonal blocks hold links across layers, with a count in the corner. Every link is visible and nothing crosses, so it is the best reading for dense graphs where node-link drawings tangle."
      />

      {/* Keyed by dataset: switching data resets selection and filters. */}
      <Playground key={dataset} dataset={dataset} onDatasetChange={setDataset} />

      <ShowcaseSection
        label="Custom predicate catalog"
        description="A PredicateCatalog in the layering options supplies each predicate's two-letter code and display label. Codes from the catalog win; predicates left out get a derived code. Labels show in the legend, the cell tooltips and every other layered view. This one is standalone (nodes, edges, layering) with the technology layer hidden and predicate labels on for every link."
      >
        <DemoCard label="AdjacencyMatrix · catalog">
          <AdjacencyMatrix nodes={drSpecNodes} edges={drSpecEdges} layering={CATALOG_LAYERING} graphOptions={CATALOG_OPTIONS} />
        </DemoCard>
        <Code>{CATALOG_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="State" description="Reads the graph prop, else the enclosing LayeredGraphContext, else builds its own state from nodes, edges and layering.">
        <Code>{SHARED_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="graph" type="LayeredGraphState" def="context" description="State from useLayeredGraph. Unset: the enclosing LayeredGraphContext, else its own from nodes / edges / layering." />
          <PropRow name="nodes" type="GraphNodeData[]" description="Standalone nodes; ignored with graph or a context." />
          <PropRow name="edges" type="GraphEdgeData[]" description="Standalone edges; ignored with graph or a context." />
          <PropRow name="layering" type="BuildLayeredIndexOptions" description="Standalone layering (layerBy, catalog, …); memoize it." />
          <PropRow name="graphOptions" type="Omit<UseLayeredGraphOptions, …>" description="Standalone selection, follow, filters, label mode." />
          <PropRow name="order" type="NodeOrder | 'cluster'" def="'coupled-x'" description="Row and column order within each layer: 'coupled-x' | 'degree' | 'cross-degree' | 'label' | 'cluster' | comparator. 'degree' when there is no layout. cluster: Louvain communities within each layer, deterministic." />
          <PropRow name="cellSize" type="number | 'auto'" def="'auto'" description="Cell size in px; auto fits about 820px, clamped to 10–18." />
          <PropRow name="labelWidth" type="number" def="210" description="Row-label column width in px." />
          <PropRow name="showBlockCounts" type="boolean" def="true" description="Link count in each cross-layer block." />
          <PropRow name="showCodeLegend" type="boolean" def="true" description="Legend of the predicate codes shown." />
          <PropRow name="onCellSelect" type="(link: IndexedLink, links: readonly IndexedLink[]) => void" description="Cell click handler. Unset: selects the link's source. link is the drawn link (in a symmetric cell holding both directions, the reached one, else row → column); links holds every link in the cell, row → column first. Show it with GraphEdgeInspector and linkEdgeMetadata(index, link)." />
          <PropRow name="onLinkSelect" type="(link: IndexedLink, links: readonly IndexedLink[]) => void" description="Deprecated: use onCellSelect (same arguments). Ignored when onCellSelect is set." />
          <PropRow name="selectedLinkId" type="string | null" description="Outline the cell holding this link, e.g. the one shown in an inspector. Set from outside, its cell scrolls into view." />
          <PropRow name="virtualizeAbove" type="number" def="150" description="Above this many nodes, only the rows and columns in view render and the labels stick to the edges." />
          <PropRow name="symmetric" type="boolean" def="false" description="Merge A→B and B→A into one cell above the diagonal, for an undirected reading. A notch marks a cell holding both directions." />
          <PropRow name="aggregate" type="'none' | 'layer'" def="'none'" description="layer: a layers-by-layers heat map of link counts, the overview for many layers. Counts ignore the layer-pair filter; the active pair is outlined." />
          <PropRow name="onLayerCellSelect" type="(cell: LayerMatrixCell) => void" description="Heat-map cell click handler. Unset: a cross-layer cell toggles the layer-pair filter, a diagonal cell (or a layer header) the layer focus." />
          <PropRow name="...divProps" type="HTMLAttributes<HTMLDivElement>" description="Remaining props spread onto the root div." />
        </PropsTable>
        <p style={{ fontSize: 12, color: fg2, margin: '12px 0 0', lineHeight: 1.65 }}>
          Large graphs scroll inside the component; it renders at natural size so cells stay crisp. Past virtualizeAbove nodes (default 150) only the rows and columns in view render and the labels stick to the edges; the scroll area is capped at --adjacency-matrix-max-height (80vh), and the sticky labels paint --adjacency-matrix-bg. Windowing follows the matrix's own scroll area, so with --adjacency-matrix-max-height: none every row renders. Cells are one Tab stop: arrow keys move between them, Home and End go to the row's ends, Enter or Space acts as a click. Screen readers get a grid (role grid, with row and column headers, aria-rowcount and aria-colcount for the full size, and aria-rowindex and aria-colindex on the rows and cells in view), so they announce each cell's row and column and pass the arrow keys through; a cell's name gives its row, column, link state and links. The grid is visually hidden and holds the focus; the drawn cell shows the focus ring. Row headers stay buttons that select a node.
        </p>
      </ShowcaseSection>
    </div>
  )
}

type CellSizeKey = 'auto' | '10' | '14' | '18'
type CellClick = 'select' | 'report'

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
  const [order, setOrder] = useState<Exclude<NodeOrder, (...args: never[]) => number> | 'cluster'>('coupled-x')
  const [cellSize, setCellSize] = useState<CellSizeKey>('auto')
  const [labelWidth, setLabelWidth] = useState(210)
  const [blockCounts, setBlockCounts] = useState(true)
  const [legend, setLegend] = useState(true)
  const [cellClick, setCellClick] = useState<CellClick>('select')
  const [picked, setPicked] = useState<IndexedLink | null>(null)
  const [symmetric, setSymmetric] = useState(false)
  const [aggregate, setAggregate] = useState<'none' | 'layer'>('none')
  const [pickedLayers, setPickedLayers] = useState<LayerMatrixCell | null>(null)

  const size = cellSize === 'auto' ? 'auto' : Number(cellSize)
  const jsxProps = [
    order !== 'coupled-x' && `order="${order}"`,
    cellSize !== 'auto' && `cellSize={${cellSize}}`,
    labelWidth !== 210 && `labelWidth={${labelWidth}}`,
    !blockCounts && 'showBlockCounts={false}',
    !legend && 'showCodeLegend={false}',
    symmetric && 'symmetric',
    aggregate === 'layer' && 'aggregate="layer"',
    cellClick === 'report' && (aggregate === 'layer' ? 'onLayerCellSelect={setPickedLayers}' : 'onCellSelect={setPicked} selectedLinkId={picked?.id}'),
  ].filter(Boolean)
  const jsx = `<AdjacencyMatrix${jsxProps.length ? ' ' + jsxProps.join(' ') : ''} />`

  const pickedSource = picked ? graph.index.nodeById.get(picked.sourceId) : undefined
  const pickedTarget = picked ? graph.index.nodeById.get(picked.targetId) : undefined

  return (
    <LayeredGraphContext.Provider value={graph}>
      <ShowcaseSection
        label="Playground"
        description="Click a row or column header to select a node; its cells and every reached cell take the amber reach ramp, including followed hops. Predicate labels decide which cells show their two-letter code: none, the highlighted ones, or all. With cell click set to Report, onCellSelect receives the link instead of the matrix selecting its source, and selectedLinkId outlines it. Order: Cluster groups Louvain communities within each layer. Symmetric folds both directions above the diagonal; Aggregate: Layer collapses to a layer heat map, where a cross-layer cell toggles the layer-pair filter and a diagonal cell the layer focus."
      >
        <DemoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, rowGap: 10 }}>
              <Control label="Data">
                <SegmentedControl
                  aria-label="Dataset"
                  value={dataset}
                  onChange={(v) => onDatasetChange(v as DatasetKey)}
                  options={[{ value: 'spec', label: 'Spec' }, { value: 'ux', label: 'UX' }]}
                />
              </Control>
              <Control label="Order">
                <SegmentedControl
                  aria-label="Order"
                  value={order}
                  onChange={(v) => setOrder(v as typeof order)}
                  options={[
                    { value: 'coupled-x', label: 'Coupled x' },
                    { value: 'degree', label: 'Degree' },
                    { value: 'cross-degree', label: 'Cross degree' },
                    { value: 'label', label: 'Label' },
                    { value: 'cluster', label: 'Cluster' },
                  ]}
                />
              </Control>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, rowGap: 10 }}>
              <Control label="Cell size">
                <SegmentedControl
                  aria-label="Cell size"
                  value={cellSize}
                  onChange={(v) => setCellSize(v as CellSizeKey)}
                  options={[
                    { value: 'auto', label: 'Auto' },
                    { value: '10', label: '10' },
                    { value: '14', label: '14' },
                    { value: '18', label: '18' },
                  ]}
                />
              </Control>
              <Control label="Label width">
                <SegmentedControl
                  aria-label="Label width"
                  value={labelWidth}
                  onChange={(v) => setLabelWidth(Number(v))}
                  options={[
                    { value: 150, label: '150' },
                    { value: 210, label: '210' },
                    { value: 270, label: '270' },
                  ]}
                />
              </Control>
              <OnOff label="Block counts" value={blockCounts} onChange={setBlockCounts} />
              <OnOff label="Code legend" value={legend} onChange={setLegend} />
              <OnOff label="Symmetric" value={symmetric} onChange={setSymmetric} />
              <Control label="Aggregate">
                <SegmentedControl
                  aria-label="Aggregate"
                  value={aggregate}
                  onChange={(v) => setAggregate(v as 'none' | 'layer')}
                  options={[{ value: 'none', label: 'None' }, { value: 'layer', label: 'Layer' }]}
                />
              </Control>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, rowGap: 10 }}>
              <FollowControl />
              <PredicateLabelControl />
              <Control label="Cell click">
                <SegmentedControl
                  aria-label="Cell click"
                  value={cellClick}
                  onChange={(v) => {
                    setCellClick(v as CellClick)
                    setPicked(null)
                    setPickedLayers(null)
                  }}
                  options={[{ value: 'select', label: 'Select source' }, { value: 'report', label: 'Report' }]}
                />
              </Control>
            </div>
            <div style={{ fontSize: 12, color: fg2, lineHeight: 1.5 }}>
              {data.label}: {data.summary}
            </div>
            <div style={{ borderTop: `1px solid ${border}`, paddingTop: 12 }}>
              <AdjacencyMatrix
                order={order}
                cellSize={size}
                labelWidth={labelWidth}
                showBlockCounts={blockCounts}
                showCodeLegend={legend}
                onCellSelect={cellClick === 'report' ? setPicked : undefined}
                selectedLinkId={cellClick === 'report' ? picked?.id : undefined}
                symmetric={symmetric}
                aggregate={aggregate}
                onLayerCellSelect={cellClick === 'report' ? setPickedLayers : undefined}
              />
            </div>
            {cellClick === 'report' && (
              <div
                aria-live="polite"
                style={{ padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 6, background: 'rgb(var(--canvas-bg-2))', fontSize: 12, color: fg2 }}
              >
                {aggregate === 'layer' ? (
                  pickedLayers ? (
                    <span style={{ fontFamily: mono, fontSize: 11 }}>
                      onLayerCellSelect · {pickedLayers.rowLayerId} → {pickedLayers.colLayerId} · {pickedLayers.linkCount} link{pickedLayers.linkCount === 1 ? '' : 's'} · pair {pickedLayers.pairKey ?? 'none (diagonal)'}
                    </span>
                  ) : (
                    'Click a cell to read its layer pair.'
                  )
                ) : picked && pickedSource && pickedTarget ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: fg3 }}>
                      onCellSelect · {picked.cross ? 'cross-layer' : 'within layer'} · {picked.edgeIds.length} edge{picked.edgeIds.length === 1 ? '' : 's'}
                    </span>
                    <span style={{ color: fg1 }}>
                      {pickedSource.label} → {pickedTarget.label}
                    </span>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontFamily: mono, fontSize: 11 }}>
                      {picked.predicates.length === 0 && <span>no predicates · {picked.primaryCategory}</span>}
                      {picked.predicates.map((p, i) => (
                        <span key={p}>
                          <b style={{ color: fg1 }}>{graph.index.predicateCodes.get(p)}</b> {p} · {picked.predicateCategories[i]}
                        </span>
                      ))}
                    </span>
                  </div>
                ) : (
                  'Click a cell to read its link.'
                )}
              </div>
            )}
          </div>
        </DemoCard>
        <Code>{jsx}</Code>
      </ShowcaseSection>
    </LayeredGraphContext.Provider>
  )
}
