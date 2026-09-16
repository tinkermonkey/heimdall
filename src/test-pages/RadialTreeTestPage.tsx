import { useCallback, useMemo, useState } from 'react'
import { GraphCanvas, type GraphNodeData, type GraphEdge } from '../components/GraphCanvas'
import GraphNode from '../components/GraphNode'

interface RadialTreeNode extends GraphNodeData {
  title?: string
  domain?: string
  description?: string
}

// Test data: a single-trunk tree with 3 levels
const SINGLE_TRUNK_NODES: RadialTreeNode[] = [
  // Root
  { id: 'root', label: 'Root', kind: 'R', domain: 'life', title: 'Root', description: 'Root node' },
  // Level 1
  { id: 'l1_a', label: 'Child A', kind: 'C', domain: 'life', title: 'Child A' },
  { id: 'l1_b', label: 'Child B', kind: 'C', domain: 'climate', title: 'Child B' },
  { id: 'l1_c', label: 'Child C', kind: 'C', domain: 'software', title: 'Child C' },
  // Level 2
  { id: 'l2_a1', label: 'Grandchild A1', kind: 'G', domain: 'life' },
  { id: 'l2_a2', label: 'Grandchild A2', kind: 'G', domain: 'life' },
  { id: 'l2_b1', label: 'Grandchild B1', kind: 'G', domain: 'climate' },
  { id: 'l2_c1', label: 'Grandchild C1', kind: 'G', domain: 'software' },
  // Level 3
  { id: 'l3_a1', label: 'Great-grandchild A1', kind: 'X', domain: 'life' },
  { id: 'l3_a2', label: 'Great-grandchild A2', kind: 'X', domain: 'life' },
  { id: 'l3_b1', label: 'Great-grandchild B1', kind: 'X', domain: 'climate' },
]

// Test data: multi-trunk with orphan nodes
const MULTI_TRUNK_NODES: RadialTreeNode[] = [
  // Trunk 1
  { id: 'trunk1_root', label: 'Trunk 1 Root', kind: 'R', domain: 'life' },
  { id: 'trunk1_child1', label: 'Trunk 1 Child 1', kind: 'C', domain: 'life' },
  { id: 'trunk1_child2', label: 'Trunk 1 Child 2', kind: 'C', domain: 'life' },
  { id: 'trunk1_gc1', label: 'Trunk 1 GC1', kind: 'G', domain: 'life' },
  // Trunk 2
  { id: 'trunk2_root', label: 'Trunk 2 Root', kind: 'R', domain: 'climate' },
  { id: 'trunk2_child1', label: 'Trunk 2 Child 1', kind: 'C', domain: 'climate' },
  { id: 'trunk2_child2', label: 'Trunk 2 Child 2', kind: 'C', domain: 'climate' },
  // Trunk 3 (single orphan node)
  { id: 'orphan1', label: 'Orphan 1', kind: 'O', domain: 'software' },
  // Trunk 4 (another orphan)
  { id: 'orphan2', label: 'Orphan 2', kind: 'O', domain: 'software' },
]

// Structural edges define the hierarchy
const SINGLE_TRUNK_EDGES: GraphEdge[] = [
  { id: 'edge_root_a', sourceId: 'root', targetId: 'l1_a' },
  { id: 'edge_root_b', sourceId: 'root', targetId: 'l1_b' },
  { id: 'edge_root_c', sourceId: 'root', targetId: 'l1_c' },
  { id: 'edge_a_a1', sourceId: 'l1_a', targetId: 'l2_a1' },
  { id: 'edge_a_a2', sourceId: 'l1_a', targetId: 'l2_a2' },
  { id: 'edge_b_b1', sourceId: 'l1_b', targetId: 'l2_b1' },
  { id: 'edge_c_c1', sourceId: 'l1_c', targetId: 'l2_c1' },
  { id: 'edge_a1_ga1', sourceId: 'l2_a1', targetId: 'l3_a1' },
  { id: 'edge_a1_ga2', sourceId: 'l2_a1', targetId: 'l3_a2' },
  { id: 'edge_b1_gb1', sourceId: 'l2_b1', targetId: 'l3_b1' },
  // Cross-trunk edge (non-structural relation)
  { id: 'cross_edge', sourceId: 'l3_a1', targetId: 'l2_b1', label: 'related', variant: 'irrelevant' },
]

const MULTI_TRUNK_EDGES: GraphEdge[] = [
  // Trunk 1 structure
  { id: 'edge_t1_root_c1', sourceId: 'trunk1_root', targetId: 'trunk1_child1' },
  { id: 'edge_t1_root_c2', sourceId: 'trunk1_root', targetId: 'trunk1_child2' },
  { id: 'edge_t1_c1_gc1', sourceId: 'trunk1_child1', targetId: 'trunk1_gc1' },
  // Trunk 2 structure
  { id: 'edge_t2_root_c1', sourceId: 'trunk2_root', targetId: 'trunk2_child1' },
  { id: 'edge_t2_root_c2', sourceId: 'trunk2_root', targetId: 'trunk2_child2' },
  // Cross-trunk edge between Trunk 1 and Trunk 2
  { id: 'cross_trunk_edge', sourceId: 'trunk1_gc1', targetId: 'trunk2_child1', label: 'cross-trunk', variant: 'irrelevant' },
]

function isStructuralEdge(edge: GraphEdge): boolean {
  // All edges are structural in our test data
  return edge.variant !== 'irrelevant'
}

export default function RadialTreeTestPage() {
  const [view, setView] = useState<'single' | 'multi' | 'mixed' | 'custom'>('single')
  const [layout, setLayout] = useState<'radial-tree' | 'galaxy'>('radial-tree')
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())
  const [showRings, setShowRings] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedNodeIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Filtered nodes based on collapse state
  const getVisibleNodes = useCallback((allNodes: RadialTreeNode[], edges: GraphEdge[]): RadialTreeNode[] => {
    if (collapsedNodeIds.size === 0) return allNodes

    const childrenOf = new Map<string, Set<string>>()
    for (const edge of edges) {
      if (!isStructuralEdge(edge)) continue
      if (!childrenOf.has(edge.sourceId)) childrenOf.set(edge.sourceId, new Set())
      childrenOf.get(edge.sourceId)!.add(edge.targetId)
    }

    const isDescendantOf = (nodeId: string, potentialAncestor: string): boolean => {
      if (nodeId === potentialAncestor) return true
      const children = childrenOf.get(potentialAncestor)
      if (!children) return false
      for (const child of children) {
        if (isDescendantOf(nodeId, child)) return true
      }
      return false
    }

    return allNodes.filter(node => {
      // Keep all collapsed nodes and their ancestors
      for (const collapsedId of collapsedNodeIds) {
        if (node.id === collapsedId) return true
        if (isDescendantOf(node.id, collapsedId)) return false
      }
      return true
    })
  }, [collapsedNodeIds])

  // Generate filtered nodes and edges
  const [nodes, edges] = useMemo(() => {
    let baseNodes: RadialTreeNode[], baseEdges: GraphEdge[]
    if (view === 'single') {
      baseNodes = SINGLE_TRUNK_NODES
      baseEdges = SINGLE_TRUNK_EDGES
    } else if (view === 'multi') {
      baseNodes = MULTI_TRUNK_NODES
      baseEdges = MULTI_TRUNK_EDGES
    } else if (view === 'mixed') {
      // Combine both with all nodes visible
      baseNodes = [...SINGLE_TRUNK_NODES, ...MULTI_TRUNK_NODES.map(n => ({ ...n, id: `multi_${n.id}` }))]
      baseEdges = [
        ...SINGLE_TRUNK_EDGES,
        ...MULTI_TRUNK_EDGES.map(e => ({ ...e, id: `multi_${e.id}`, sourceId: `multi_${e.sourceId}`, targetId: `multi_${e.targetId}` })),
      ]
    } else {
      // Custom view with predetermined collapses
      baseNodes = SINGLE_TRUNK_NODES
      baseEdges = SINGLE_TRUNK_EDGES
    }

    const visible = getVisibleNodes(baseNodes, baseEdges)
    const visibleIds = new Set(visible.map(n => n.id))
    const filteredEdges = baseEdges.filter(e => visibleIds.has(e.sourceId) && visibleIds.has(e.targetId))

    return [visible, filteredEdges]
  }, [view, getVisibleNodes])

  // Custom renderNode
  const renderNode = useCallback((
    node: GraphNodeData,
    selected: boolean
  ) => (
    <GraphNode id={node.id} label={node.label} kind={node.kind} selected={selected} onSelect={() => setSelectedNodeId(node.id)} />
  ), [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'rgb(var(--canvas-bg))' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--canvas-border)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', fontWeight: 500 }}>View:</label>
          <select
            value={view}
            onChange={(e) => {
              setView(e.target.value as any)
              setCollapsedNodeIds(new Set())
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--canvas-border)',
              background: 'var(--canvas-bg-2)',
              color: 'var(--canvas-fg)',
            }}
          >
            <option value="single">Single Trunk</option>
            <option value="multi">Multi-Trunk</option>
            <option value="mixed">Mixed (Both)</option>
            <option value="custom">Custom Collapse</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', fontWeight: 500 }}>Layout:</label>
          <select
            value={layout}
            onChange={(e) => {
              setLayout(e.target.value as any)
              setCollapsedNodeIds(new Set())
            }}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--canvas-border)',
              background: 'var(--canvas-bg-2)',
              color: 'var(--canvas-fg)',
            }}
          >
            <option value="radial-tree">Radial Tree</option>
            <option value="galaxy">Galaxy</option>
          </select>
        </div>

        {layout === 'radial-tree' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={showRings}
                onChange={(e) => setShowRings(e.target.checked)}
                style={{ marginRight: '4px' }}
              />
              Show Rings
            </label>
          </div>
        )}

        {collapsedNodeIds.size > 0 && (
          <button
            type="button"
            onClick={() => setCollapsedNodeIds(new Set())}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid var(--accent-primary)',
              background: 'transparent',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Expand All
          </button>
        )}

        {view === 'custom' && collapsedNodeIds.size === 0 && (
          <button
            type="button"
            onClick={() => {
              // Collapse some nodes to show mixed state
              setCollapsedNodeIds(new Set(['l1_b']))
            }}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid var(--accent-primary)',
              background: 'transparent',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Set Mixed Collapse
          </button>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          layout={layout}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          collapsedNodeIds={collapsedNodeIds}
          onToggleCollapse={handleToggleCollapse}
          isStructuralEdge={isStructuralEdge}
          renderNode={renderNode}
          showClusterBoundaries={false}
          showHierarchyRings={layout === 'radial-tree' && showRings}
        />
      </div>

      {/* Info */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--canvas-border)',
          fontSize: '12px',
          color: 'var(--canvas-fg-2)',
        }}
      >
        Nodes: {nodes.length} | Edges: {edges.length} | Collapsed: {collapsedNodeIds.size}
        {selectedNodeId && ` | Selected: ${selectedNodeId}`}
      </div>
    </div>
  )
}
