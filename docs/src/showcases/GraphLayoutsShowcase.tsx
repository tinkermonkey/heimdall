import { useCallback, useMemo, useState } from 'react'
import {
  GraphCanvas,
  GraphInspector,
  GraphEdgeInspector,
  GraphNode,
  TopologyNode,
  SegmentedControl,
  SplitPane,
  type GraphNodeData,
  type GraphEdgeData,
  type GraphNodeHierarchyMeta,
  type GraphNodeMetadata,
  type GraphEdgeMetadata,
  type RelationshipLink,
  type TopologyNodeStatus,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoCard } from '../components/ShowcaseSection'

const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

// ─── Datasets ──────────────────────────────────────────────────────────────
// Two differently-shaped datasets so the same controls read as a genuine
// comparison, not just one demo: Ontology is deep and narrow (a 6-level
// biology chain beside a shallower climate branch); Services is wide and
// shallow (a 3-level org/infra tree with wide fan-out at every level). Both
// mix structural hierarchy with cross-cutting relational edges and include
// one true orphan, so collapse/expand and "show all relations" have
// something real to demonstrate on either one.

interface DemoNode extends GraphNodeData {
  title?: string
  domain?: string
}

const STRUCTURAL_PREDICATES = new Set(['contains', 'instanceOf'])
function isStructuralEdge(edge: GraphEdgeData): boolean {
  return !!edge.label && STRUCTURAL_PREDICATES.has(edge.label)
}

const ONTOLOGY_NODES: DemoNode[] = [
  { id: 'organism', label: 'Organism', kind: 'C', domainColor: 'life', title: 'Organism', domain: 'life' },
  { id: 'eukaryote', label: 'Eukaryote', kind: 'C', domainColor: 'life', title: 'Eukaryote', domain: 'life' },
  { id: 'cell', label: 'Cell', kind: 'C', domainColor: 'life', title: 'Cell', domain: 'life' },
  { id: 'nucleus', label: 'Nucleus', kind: 'C', domainColor: 'life', title: 'Nucleus', domain: 'life' },
  { id: 'mitochondrion', label: 'Mitochondrion', kind: 'C', domainColor: 'life', title: 'Mitochondrion', domain: 'life' },
  { id: 'chromosome', label: 'Chromosome', kind: 'C', domainColor: 'life', title: 'Chromosome', domain: 'life' },
  { id: 'brca1', label: 'BRCA1', kind: 'I', domainColor: 'life', title: 'BRCA1', domain: 'life' },
  { id: 'tp53', label: 'TP53', kind: 'I', domainColor: 'life', title: 'TP53', domain: 'life' },
  // Reachable only via a relational edge (encodes, below) — no structural parent, so it
  // becomes its own root and orbit under layout="galaxy", same as a disconnected node would.
  { id: 'protein', label: 'Protein', kind: 'C', domainColor: 'life', title: 'Protein', domain: 'life' },
  { id: 'atmosphere', label: 'Atmosphere', kind: 'C', domainColor: 'climate', title: 'Atmosphere', domain: 'climate' },
  { id: 'greenhouse_gas', label: 'Greenhouse Gas', kind: 'C', domainColor: 'climate', title: 'Greenhouse Gas', domain: 'climate' },
  { id: 'co2', label: 'CO2', kind: 'I', domainColor: 'climate', title: 'CO2', domain: 'climate' },
  { id: 'ocean', label: 'Ocean', kind: 'C', domainColor: 'climate', title: 'Ocean', domain: 'climate' },
  { id: 'ocean_acidification', label: 'Ocean Acidification', kind: 'I', domainColor: 'climate', title: 'Ocean Acidification', domain: 'climate' },
  // A true orphan — no edges at all.
  { id: 'unreviewed_claim', label: 'Unreviewed Claim', kind: 'C', domainColor: 'climate', title: 'Unreviewed Claim', domain: 'climate' },
]

const ONTOLOGY_EDGES: GraphEdgeData[] = [
  { id: 'o_organism_eukaryote', sourceId: 'organism', targetId: 'eukaryote', label: 'contains' },
  { id: 'o_eukaryote_cell', sourceId: 'eukaryote', targetId: 'cell', label: 'contains' },
  { id: 'o_cell_nucleus', sourceId: 'cell', targetId: 'nucleus', label: 'contains' },
  { id: 'o_cell_mito', sourceId: 'cell', targetId: 'mitochondrion', label: 'contains' },
  { id: 'o_nucleus_chromosome', sourceId: 'nucleus', targetId: 'chromosome', label: 'contains' },
  { id: 'o_chromosome_brca1', sourceId: 'chromosome', targetId: 'brca1', label: 'instanceOf' },
  { id: 'o_chromosome_tp53', sourceId: 'chromosome', targetId: 'tp53', label: 'instanceOf' },
  { id: 'o_atmosphere_ghg', sourceId: 'atmosphere', targetId: 'greenhouse_gas', label: 'contains' },
  { id: 'o_atmosphere_ocean', sourceId: 'atmosphere', targetId: 'ocean', label: 'contains' },
  { id: 'o_ghg_co2', sourceId: 'greenhouse_gas', targetId: 'co2', label: 'instanceOf' },
  { id: 'o_ocean_acidification', sourceId: 'ocean', targetId: 'ocean_acidification', label: 'instanceOf' },
  { id: 'o_brca1_protein', sourceId: 'brca1', targetId: 'protein', label: 'encodes' },
  { id: 'o_co2_ocean_acid', sourceId: 'co2', targetId: 'ocean_acidification', label: 'causes' },
]

const SERVICES_NODES: DemoNode[] = [
  { id: 'platform', label: 'Platform', kind: 'C', title: 'Platform', domain: 'platform' },
  { id: 'frontend', label: 'Frontend', kind: 'C', domainColor: 'life', title: 'Frontend', domain: 'frontend' },
  { id: 'web_app', label: 'Web App', kind: 'C', domainColor: 'life', title: 'Web App', domain: 'frontend' },
  { id: 'mobile_app', label: 'Mobile App', kind: 'C', domainColor: 'life', title: 'Mobile App', domain: 'frontend' },
  { id: 'admin_console', label: 'Admin Console', kind: 'C', domainColor: 'life', title: 'Admin Console', domain: 'frontend' },
  { id: 'backend', label: 'Backend', kind: 'C', domainColor: 'software', title: 'Backend', domain: 'backend' },
  { id: 'api_gateway', label: 'API Gateway', kind: 'C', domainColor: 'software', title: 'API Gateway', domain: 'backend' },
  { id: 'auth_service', label: 'Auth Service', kind: 'C', domainColor: 'software', title: 'Auth Service', domain: 'backend' },
  { id: 'billing_service', label: 'Billing Service', kind: 'C', domainColor: 'software', title: 'Billing Service', domain: 'backend' },
  { id: 'notification_service', label: 'Notification Service', kind: 'C', domainColor: 'software', title: 'Notification Service', domain: 'backend' },
  { id: 'data', label: 'Data', kind: 'C', domainColor: 'climate', title: 'Data', domain: 'data' },
  { id: 'primary_db', label: 'Primary DB', kind: 'C', domainColor: 'climate', title: 'Primary DB', domain: 'data' },
  { id: 'cache', label: 'Cache', kind: 'C', domainColor: 'climate', title: 'Cache', domain: 'data' },
  { id: 'analytics_warehouse', label: 'Analytics Warehouse', kind: 'C', domainColor: 'climate', title: 'Analytics Warehouse', domain: 'data' },
  { id: 'infra', label: 'Infra', kind: 'C', title: 'Infra', domain: 'infra' },
  { id: 'load_balancer', label: 'Load Balancer', kind: 'C', title: 'Load Balancer', domain: 'infra' },
  { id: 'message_queue', label: 'Message Queue', kind: 'C', title: 'Message Queue', domain: 'infra' },
  // A true orphan — no edges at all.
  { id: 'legacy_reporting_tool', label: 'Legacy Reporting Tool', kind: 'C', title: 'Legacy Reporting Tool', domain: 'infra' },
]

const SERVICES_EDGES: GraphEdgeData[] = [
  { id: 's_platform_frontend', sourceId: 'platform', targetId: 'frontend', label: 'contains' },
  { id: 's_platform_backend', sourceId: 'platform', targetId: 'backend', label: 'contains' },
  { id: 's_platform_data', sourceId: 'platform', targetId: 'data', label: 'contains' },
  { id: 's_platform_infra', sourceId: 'platform', targetId: 'infra', label: 'contains' },
  { id: 's_frontend_web', sourceId: 'frontend', targetId: 'web_app', label: 'contains' },
  { id: 's_frontend_mobile', sourceId: 'frontend', targetId: 'mobile_app', label: 'contains' },
  { id: 's_frontend_admin', sourceId: 'frontend', targetId: 'admin_console', label: 'contains' },
  { id: 's_backend_api', sourceId: 'backend', targetId: 'api_gateway', label: 'contains' },
  { id: 's_backend_auth', sourceId: 'backend', targetId: 'auth_service', label: 'contains' },
  { id: 's_backend_billing', sourceId: 'backend', targetId: 'billing_service', label: 'contains' },
  { id: 's_backend_notification', sourceId: 'backend', targetId: 'notification_service', label: 'contains' },
  { id: 's_data_primary', sourceId: 'data', targetId: 'primary_db', label: 'contains' },
  { id: 's_data_cache', sourceId: 'data', targetId: 'cache', label: 'contains' },
  { id: 's_data_analytics', sourceId: 'data', targetId: 'analytics_warehouse', label: 'contains' },
  { id: 's_infra_lb', sourceId: 'infra', targetId: 'load_balancer', label: 'contains' },
  { id: 's_infra_mq', sourceId: 'infra', targetId: 'message_queue', label: 'contains' },
  { id: 's_web_api', sourceId: 'web_app', targetId: 'api_gateway', label: 'callsInto' },
  { id: 's_mobile_api', sourceId: 'mobile_app', targetId: 'api_gateway', label: 'callsInto' },
  { id: 's_admin_api', sourceId: 'admin_console', targetId: 'api_gateway', label: 'callsInto' },
  { id: 's_api_auth', sourceId: 'api_gateway', targetId: 'auth_service', label: 'dependsOn' },
  { id: 's_billing_db', sourceId: 'billing_service', targetId: 'primary_db', label: 'dependsOn' },
  { id: 's_notification_mq', sourceId: 'notification_service', targetId: 'message_queue', label: 'dependsOn' },
  { id: 's_analytics_db', sourceId: 'analytics_warehouse', targetId: 'primary_db', label: 'readsFrom' },
]

const DATASETS = {
  ontology: {
    label: 'Ontology',
    nodes: ONTOLOGY_NODES,
    edges: ONTOLOGY_EDGES,
    description: 'Deep and narrow — a 6-level biology chain beside a shallower climate branch, both under one shared root.',
  },
  services: {
    label: 'Service topology',
    nodes: SERVICES_NODES,
    edges: SERVICES_EDGES,
    description: 'Wide and shallow — a 3-level org/infra tree with 3-4 children at every branch instead of one long chain.',
  },
} as const

type DatasetKey = keyof typeof DATASETS

// ─── Card-mode rendering ───────────────────────────────────────────────────
// Proves the layouts work for substantial-size cards, not just compact
// GraphNode chips, and demonstrates reading GraphNodeHierarchyMeta in a
// fully custom renderNode to build a hand-rolled collapse affordance.

const CARD_STATUS: Record<string, TopologyNodeStatus> = { life: 'ok', climate: 'warning', software: 'idle' }

function pseudoMetricPercent(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 100
  return Math.abs(hash)
}

// ─── Component ─────────────────────────────────────────────────────────────

export function GraphLayoutsShowcase() {
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('ontology')
  const [layout, setLayout] = useState<'force' | 'galaxy'>('galaxy')
  const [edgeStyle, setEdgeStyle] = useState<'curved' | 'straight'>('curved')
  const [nodeStyle, setNodeStyle] = useState<'compact' | 'cards'>('compact')
  const [showAllRelations, setShowAllRelations] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>()
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => new Set())
  const [draggable, setDraggable] = useState(true)
  // undefined = GraphCanvas's own default (each node's own rendered width). 'tight' goes to 0 —
  // the minimum legal packing, no breathing room for edges. Only meaningful for layout="force";
  // galaxy's radial hierarchy doesn't use nodeMargin at all.
  const [nodeMarginPreset, setNodeMarginPreset] = useState<'tight' | 'default' | 'wide'>('default')
  const nodeMargin = nodeMarginPreset === 'tight' ? 0 : nodeMarginPreset === 'wide' ? 280 : undefined

  const dataset = DATASETS[datasetKey]

  const selectDataset = useCallback((key: DatasetKey) => {
    setDatasetKey(key)
    setSelectedNodeId(undefined)
    setSelectedEdgeId(undefined)
    setCollapsedNodeIds(new Set())
  }, [])

  // Node and edge selection are mutually exclusive in this demo's inspector column — picking
  // one clears the other, same as clicking a different tab. GraphCanvas itself doesn't enforce
  // this (selectedNodeId/selectedEdgeId are independent controlled props); it's just how this
  // particular detail panel chooses to present them.
  const handleNodeSelect = useCallback((id: string) => {
    setSelectedNodeId(id)
    setSelectedEdgeId(undefined)
  }, [])

  const handleEdgeSelect = useCallback((id: string) => {
    setSelectedEdgeId(id)
    setSelectedNodeId(undefined)
  }, [])

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedNodeIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // curvature: 0 degenerates both the quadratic and cubic bezier paths GraphCanvas draws into
  // an exactly straight line — no separate "straight" rendering mode needed, just override the
  // per-edge curvature the same way any consumer could.
  const edges = useMemo(
    () => (edgeStyle === 'straight' ? dataset.edges.map(e => ({ ...e, curvature: 0 })) : dataset.edges),
    [dataset.edges, edgeStyle]
  )

  const renderCardNode = useCallback((node: GraphNodeData, selected: boolean, hierarchy?: GraphNodeHierarchyMeta) => {
    const percent = pseudoMetricPercent(node.id)
    return (
      <div style={{ position: 'relative' }}>
        <TopologyNode
          title={node.label}
          nodeRole={node.kind === 'I' ? 'individual' : 'class'}
          status={CARD_STATUS[node.domainColor ?? ''] ?? 'idle'}
          metrics={[{ label: 'Weight', value: `${percent}%`, percent, sparklineData: [], color: 'amber' }]}
          selected={selected}
          onSelect={() => handleNodeSelect(node.id)}
        />
        {hierarchy?.hasChildren && hierarchy.onToggleCollapse && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); hierarchy.onToggleCollapse!() }}
            aria-label={hierarchy.collapsed ? 'Expand' : 'Collapse'}
            style={{
              position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 4,
              border: '1px solid rgb(var(--canvas-border, 229 231 235))',
              background: 'rgb(var(--canvas-bg-2, 243 244 246))',
              cursor: 'pointer', fontSize: 11, lineHeight: 1,
            }}
          >
            {hierarchy.collapsed ? `+${hierarchy.hiddenDescendantCount}` : '−'}
          </button>
        )}
      </div>
    )
  }, [handleNodeSelect])

  const renderCompactNode = useCallback((node: GraphNodeData, selected: boolean, hierarchy?: GraphNodeHierarchyMeta) => (
    <GraphNode
      id={node.id}
      label={node.label}
      kind={node.kind}
      domainColor={node.domainColor}
      selected={selected}
      onSelect={handleNodeSelect}
      hasChildren={hierarchy?.hasChildren}
      collapsed={hierarchy?.collapsed}
      hiddenDescendantCount={hierarchy?.hiddenDescendantCount}
      onToggleCollapse={hierarchy?.onToggleCollapse}
    />
  ), [handleNodeSelect])

  const toNodeMetadata = useCallback((n: DemoNode): GraphNodeMetadata => (
    { id: n.id, title: n.title ?? n.label, kind: n.kind, domain: n.domain }
  ), [])

  // Shared by the single-node panel and, when an edge is selected, its source/target panels —
  // every relationship touching `nodeId`, same shape GraphInspector expects.
  const relationshipsFor = useCallback((nodeId: string): RelationshipLink[] =>
    dataset.edges
      .filter(e => e.sourceId === nodeId || e.targetId === nodeId)
      .map(e => {
        const isOutgoing = e.sourceId === nodeId
        const otherId = isOutgoing ? e.targetId : e.sourceId
        const other = dataset.nodes.find(n => n.id === otherId) as DemoNode | undefined
        return {
          id: e.id,
          target: otherId,
          targetTitle: other?.title ?? other?.label ?? otherId,
          targetDomain: other?.domain,
          predicate: e.label ?? 'related',
          direction: isOutgoing ? 'out' as const : 'in' as const,
        }
      }), [dataset])

  const selectedNode = dataset.nodes.find(n => n.id === selectedNodeId)
  const inspectorNode: GraphNodeMetadata | undefined = selectedNode ? toNodeMetadata(selectedNode) : undefined
  const relationships: RelationshipLink[] = selectedNodeId ? relationshipsFor(selectedNodeId) : []

  const selectedEdge = selectedEdgeId ? dataset.edges.find(e => e.id === selectedEdgeId) : undefined
  const edgeSourceNode = selectedEdge ? dataset.nodes.find(n => n.id === selectedEdge.sourceId) as DemoNode | undefined : undefined
  const edgeTargetNode = selectedEdge ? dataset.nodes.find(n => n.id === selectedEdge.targetId) as DemoNode | undefined : undefined
  const edgeInspectorData: GraphEdgeMetadata | undefined = selectedEdge && edgeSourceNode && edgeTargetNode
    ? {
        id: selectedEdge.id,
        predicate: selectedEdge.label ?? 'related',
        sourceId: edgeSourceNode.id,
        sourceTitle: edgeSourceNode.title ?? edgeSourceNode.label,
        sourceDomain: edgeSourceNode.domain,
        targetId: edgeTargetNode.id,
        targetTitle: edgeTargetNode.title ?? edgeTargetNode.label,
        targetDomain: edgeTargetNode.domain,
        variant: selectedEdge.variant,
        weight: selectedEdge.weight,
      }
    : undefined

  return (
    <div>
      <PageHeader
        name="Graph Layouts"
        description="Compares GraphCanvas's automatic layout engines side by side: force (spring simulation) and galaxy (radial hierarchy of orbits, built from structural edges). Same controls also demonstrate straight vs. curved edges and compact chips vs. substantial-size cards — the layouts measure real rendered node size either way, so switching node style never causes overlap."
      />
      <ShowcaseSection
        label="Interactive comparison"
        description="Nodes with a chevron have structural children — click it to collapse/expand their subtree. Dimmed edges are relational (not part of the hierarchy); hover a node or turn on 'All relations' to see them at full opacity. Drag a node to reposition it, or turn dragging off. Node margin (force layout only) controls how much breathing room the layout leaves around each node — tight packing can leave connected nodes with almost no visible edge between them."
      >
        <DemoCard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, rowGap: 10 }}>
              <Control label="Dataset">
                <SegmentedControl
                  value={datasetKey}
                  onChange={(v) => selectDataset(v as DatasetKey)}
                  options={Object.entries(DATASETS).map(([key, d]) => ({ value: key, label: d.label }))}
                />
              </Control>
              <Control label="Layout">
                <SegmentedControl
                  value={layout}
                  onChange={(v) => setLayout(v as 'force' | 'galaxy')}
                  options={[{ value: 'galaxy', label: 'Galaxy' }, { value: 'force', label: 'Force' }]}
                />
              </Control>
              <Control label="Edges">
                <SegmentedControl
                  value={edgeStyle}
                  onChange={(v) => setEdgeStyle(v as 'curved' | 'straight')}
                  options={[{ value: 'curved', label: 'Curved' }, { value: 'straight', label: 'Straight' }]}
                />
              </Control>
              <Control label="Nodes">
                <SegmentedControl
                  value={nodeStyle}
                  onChange={(v) => setNodeStyle(v as 'compact' | 'cards')}
                  options={[{ value: 'compact', label: 'Compact' }, { value: 'cards', label: 'Cards' }]}
                />
              </Control>
              <Control label="Relations">
                <SegmentedControl
                  value={showAllRelations ? 'all' : 'dim'}
                  onChange={(v) => setShowAllRelations(v === 'all')}
                  options={[{ value: 'dim', label: 'Dim' }, { value: 'all', label: 'All' }]}
                />
              </Control>
              <Control label="Drag">
                <SegmentedControl
                  value={draggable ? 'on' : 'off'}
                  onChange={(v) => setDraggable(v === 'on')}
                  options={[{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }]}
                />
              </Control>
              {layout === 'force' && (
                <Control label="Node margin">
                  <SegmentedControl
                    value={nodeMarginPreset}
                    onChange={(v) => setNodeMarginPreset(v as 'tight' | 'default' | 'wide')}
                    options={[
                      { value: 'tight', label: 'Tight' },
                      { value: 'default', label: 'Default' },
                      { value: 'wide', label: 'Wide' },
                    ]}
                  />
                </Control>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: fg3, fontStyle: 'italic' }}>{dataset.description}</p>
            <div style={{ height: 520 }}>
              <SplitPane
                first={
                  <GraphCanvas
                    // GraphCanvas only auto-fits the viewport once per mount, so anything that
                    // changes the overall footprint (a different dataset, a different layout
                    // engine, cards vs. compact nodes, or the force layout's node margin) needs a
                    // fresh mount to re-fit — otherwise the camera stays wherever it was framed
                    // for the previous shape. Dimming/edge-curvature/collapse/drag state don't
                    // affect the footprint enough to warrant it, so they're deliberately left out
                    // of this key.
                    key={`${datasetKey}-${layout}-${nodeStyle}-${nodeMarginPreset}`}
                    nodes={dataset.nodes}
                    edges={edges}
                    layout={layout}
                    nodeMargin={nodeMargin}
                    isStructuralEdge={isStructuralEdge}
                    showAllRelations={showAllRelations}
                    collapsedNodeIds={collapsedNodeIds}
                    onToggleCollapse={handleToggleCollapse}
                    draggable={draggable}
                    fitView
                    fitPadding={40}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={handleNodeSelect}
                    selectedEdgeId={selectedEdgeId}
                    onEdgeSelect={handleEdgeSelect}
                    renderNode={nodeStyle === 'cards' ? renderCardNode : renderCompactNode}
                    style={{ width: '100%', height: '100%' }}
                  />
                }
                second={
                  // box-sizing: border-box keeps this padded column from overflowing its own
                  // box by the padding amount alone — that was forcing a vertical scrollbar in
                  // .split-pane__second even with nothing selected. minHeight (not height): a
                  // fixed height here would let the default flex-shrink compress the stacked
                  // source/edge/target panels to fit instead of letting them take their natural
                  // size and scrolling the ancestor pane, which is the single scroll owner.
                  <div style={{ padding: 16, boxSizing: 'border-box', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {edgeInspectorData
                      ? (
                        <>
                          {edgeSourceNode && <GraphInspector node={toNodeMetadata(edgeSourceNode)} relationships={relationshipsFor(edgeSourceNode.id)} onNodeSelect={handleNodeSelect} />}
                          <GraphEdgeInspector edge={edgeInspectorData} onNodeSelect={handleNodeSelect} />
                          {edgeTargetNode && <GraphInspector node={toNodeMetadata(edgeTargetNode)} relationships={relationshipsFor(edgeTargetNode.id)} onNodeSelect={handleNodeSelect} />}
                        </>
                      )
                      : inspectorNode
                        ? <GraphInspector node={inspectorNode} relationships={relationships} onNodeSelect={handleNodeSelect} />
                        : <p style={{ fontSize: 13, color: fg2, margin: 0 }}>Select a node or edge to inspect it.</p>
                    }
                  </div>
                }
                initialSplitPercent={70}
              />
            </div>
          </div>
        </DemoCard>
      </ShowcaseSection>
    </div>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3 }}>
        {label}
      </span>
      {children}
    </div>
  )
}
