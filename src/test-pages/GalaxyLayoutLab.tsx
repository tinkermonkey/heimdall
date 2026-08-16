import { useCallback, useState } from 'react'
import { GraphCanvas, type GraphNodeData } from '../index'
import { GALAXY_BUDGET_NODES, GALAXY_BUDGET_EDGES, budgetNodeRadius, type BudgetNodeData } from './galaxyBudgetData'
import { GalaxySphereNode } from './GalaxySphereNode'

/**
 * Not a component showcase — a standalone tuning aid for galaxyLayout itself. Real hierarchy (56
 * nodes, 4 levels, node weight spanning ~4 orders of magnitude), rendered as bare spheres with
 * straight edges — see galaxyBudgetData.ts for why this dataset over the hand-built one. Nothing
 * here is wired into GraphCanvas's public API beyond what already exists; it exists to make
 * crowding/overlap in the layout algorithm easy to eyeball, not to add product surface.
 */
export default function GalaxyLayoutLab() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>()

  const handleNodeSelect = useCallback((id: string) => {
    setSelectedNodeId(current => (current === id ? undefined : id))
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodeId(undefined)
  }, [])

  const renderNode = useCallback((node: GraphNodeData, selected: boolean) => {
    const budgetNode = node as BudgetNodeData
    return (
      <GalaxySphereNode
        id={budgetNode.id}
        label={budgetNode.label}
        selected={selected}
        onSelect={handleNodeSelect}
        radius={budgetNodeRadius(budgetNode.size)}
        depth={budgetNode.depth}
      />
    )
  }, [handleNodeSelect])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgb(var(--canvas-border))', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>
        Galaxy Layout Lab &mdash; {GALAXY_BUDGET_NODES.length} nodes &middot; {GALAXY_BUDGET_EDGES.length} edges
        {selectedNodeId && <> &middot; selected: {selectedNodeId}</>}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GraphCanvas
          data-testid="galaxy-lab-canvas"
          nodes={GALAXY_BUDGET_NODES}
          edges={GALAXY_BUDGET_EDGES}
          layout="galaxy"
          // galaxyLayout defaults nodeMargin to 0 (see its JSDoc) — this dataset's density is
          // exactly the case that default exists to leave alone by default, so opt in here to
          // demonstrate the fix: the closest pair goes from ~0px to 8px+ apart, still zero overlap.
          nodeMargin={12}
          fitView
          fitPadding={60}
          selectedNodeId={selectedNodeId}
          onNodeSelect={handleNodeSelect}
          onBackgroundClick={handleBackgroundClick}
          renderNode={renderNode}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
