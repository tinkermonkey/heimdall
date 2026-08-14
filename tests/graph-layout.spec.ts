import { test, expect } from '@playwright/test'
import { forceLayout, type LayoutNode, type LayoutEdge } from '../src/utils/graphLayout'

// Every pixel of true overlap is measured against a tiny tolerance rather than requiring exactly
// zero: graphLayout.ts documents (see FINAL_CLEANUP_MAX_PASSES) that in rare, extreme cases a
// sub-pixel-to-few-pixel sliver of overlap can survive even a generous cleanup budget — this
// tolerance is deliberately smaller than anything a real layout should visibly show.
const OVERLAP_TOLERANCE = 3

function maxOverlap(nodes: readonly LayoutNode[], positions: Map<string, { x: number; y: number }>): number {
  let worst = 0
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      const pa = positions.get(a.id)!
      const pb = positions.get(b.id)!
      const overlapX = (a.width + b.width) / 2 - Math.abs(pb.x - pa.x)
      const overlapY = (a.height + b.height) / 2 - Math.abs(pb.y - pa.y)
      if (overlapX > 0 && overlapY > 0) worst = Math.max(worst, Math.min(overlapX, overlapY))
    }
  }
  return worst
}

// Nodes without explicit coords start on a circle, mirroring GraphCanvas's own seeding so the
// simulation converges the way it does in real use rather than from an arbitrary stacked start.
function seededNodes(specs: { id: string; width: number; height: number }[]): LayoutNode[] {
  return specs.map((s, i) => ({
    id: s.id,
    x: Math.cos((2 * Math.PI * i) / specs.length) * 120,
    y: Math.sin((2 * Math.PI * i) / specs.length) * 120,
    width: s.width,
    height: s.height,
  }))
}

test.describe('forceLayout', () => {
  test('positions every node', () => {
    const nodes = seededNodes([
      { id: 'a', width: 138, height: 30 },
      { id: 'b', width: 138, height: 30 },
      { id: 'c', width: 138, height: 30 },
    ])
    const edges: LayoutEdge[] = [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]

    const positions = forceLayout(nodes, edges)

    expect(positions.size).toBe(3)
    for (const node of nodes) {
      const p = positions.get(node.id)
      expect(p).toBeTruthy()
      expect(Number.isFinite(p!.x)).toBe(true)
      expect(Number.isFinite(p!.y)).toBe(true)
    }
  })

  test('respects pinned nodes — their position never changes', () => {
    const nodes: LayoutNode[] = [
      { id: 'pinned', x: 500, y: 500, width: 138, height: 30, pinned: true },
      { id: 'free', x: 0, y: 0, width: 138, height: 30 },
    ]
    const edges: LayoutEdge[] = [{ source: 'pinned', target: 'free' }]

    const positions = forceLayout(nodes, edges)

    expect(positions.get('pinned')).toEqual({ x: 500, y: 500 })
  })

  test('keeps default-sized chip nodes non-overlapping in a simple chain', () => {
    const nodes = seededNodes(
      Array.from({ length: 8 }, (_, i) => ({ id: `n${i}`, width: 138, height: 30 }))
    )
    const edges: LayoutEdge[] = nodes.slice(1).map((n, i) => ({ source: nodes[i].id, target: n.id }))

    const positions = forceLayout(nodes, edges)

    expect(maxOverlap(nodes, positions)).toBeLessThanOrEqual(OVERLAP_TOLERANCE)
  })

  // Regression test: springLength and the generic inverse-square repulsion force are both flat
  // constants with no awareness of actual node size. For substantially larger nodes (e.g. a
  // card-style renderNode) fanned out as several children around one shared hub — the same shape
  // that originally surfaced this — that equilibrium settled with real, visible box overlap that
  // the old fixed-budget cleanup pass never fully resolved. Node dimensions here (200x110)
  // approximate a TopologyNode-style card; default GraphNode-sized nodes are covered above.
  test('keeps large card-sized nodes non-overlapping in a bushy hub-and-spoke topology', () => {
    const hubs = ['frontend', 'backend', 'data', 'infra']
    const specs = [
      { id: 'platform', width: 200, height: 110 },
      ...hubs.map(id => ({ id, width: 200, height: 110 })),
      ...hubs.flatMap(hub => [0, 1, 2].map(i => ({ id: `${hub}_${i}`, width: 200, height: 110 }))),
    ]
    const nodes = seededNodes(specs)

    const edges: LayoutEdge[] = [
      ...hubs.map(hub => ({ source: 'platform', target: hub })),
      ...hubs.flatMap(hub => [0, 1, 2].map(i => ({ source: hub, target: `${hub}_${i}` }))),
    ]

    const positions = forceLayout(nodes, edges)

    expect(maxOverlap(nodes, positions)).toBeLessThanOrEqual(OVERLAP_TOLERANCE)
  })
})
