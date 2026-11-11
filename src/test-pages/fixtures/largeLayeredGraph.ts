import type { GraphEdge, GraphNodeData } from '../../components/GraphCanvas'

const CATEGORIES = ['structural', 'behavioral', 'dependency']

/**
 * A deterministic large layered graph for virtualization tests: `n` nodes in 6 layers (`layer0`…),
 * about 3 links per node, mostly within a layer. Seeded, so every run draws the same graph.
 */
export function largeLayeredGraph(n: number): { nodes: GraphNodeData[]; edges: GraphEdge[] } {
  let seed = 7
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  const nodes = Array.from({ length: n }, (_, i) => ({ id: `n${i}`, label: `Node ${i}`, attributes: { layer: `layer${i % 6}` } }))
  const edges: GraphEdge[] = []
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) {
      const j = rand() < 0.7 ? (i + 6 * (1 + Math.floor(rand() * 20))) % n : Math.floor(rand() * n)
      if (j === i) continue
      edges.push({ id: `e${i}-${k}`, sourceId: `n${i}`, targetId: `n${j}`, label: 'uses', attributes: { category: CATEGORIES[(i + k) % 3] } })
    }
  }
  return { nodes, edges }
}
