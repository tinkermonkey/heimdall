// Deterministic multi-level Louvain modularity clustering.
//
// Used to derive relationship-based clusters for the opt-in
// clusteredForceLayout() (see graphLayout.ts) — cluster membership comes
// from the graph's own edge structure, not from node metadata, since most
// fixtures don't carry a usable group/kind field (see
// docs/layout-loop-design.md's clustering section for why).
//
// Determinism is required (not just nice-to-have): the layout loop's
// scoring depends on reproducible layouts across runs of the same input,
// same discipline scripts/generate-corpus.mjs already documents for fixture
// generation. This implementation never uses Math.random or wall-clock
// time, always iterates nodes/communities in a fixed order (the order
// `nodeIds` was passed in, or ascending numeric index derived from it), and
// breaks every tie by preferring the lowest community index.
//
// Standard two-phase Louvain (Blondel et al. 2008):
//   Phase 1 (local moving): repeatedly move each node into whichever
//   neighboring community yields the largest modularity gain, until a full
//   pass makes no move.
//   Phase 2 (aggregation): collapse each community from phase 1 into a
//   single node of a coarser graph (inter-community edges sum their
//   weight; intra-community edges become that coarse node's self-loop),
//   then repeat phase 1 on the coarser graph.
// Each phase-2 aggregation is one level of the returned dendrogram — this
// is what makes Louvain a natural fit for "bubbles containing bubbles":
// the dendrogram IS the nested-cluster hierarchy, not something built
// separately from the clustering.

export interface ClusterEdge {
  source: string
  target: string
  weight?: number
}

// d3.hierarchy()-compatible shape: leaves are real node ids (no children),
// internal nodes are synthetic cluster ids.
export interface ClusterTreeNode {
  id: string
  children?: ClusterTreeNode[]
}

export interface LouvainOptions {
  /** Cap on dendrogram depth (phase-2 aggregation rounds). Default 10. */
  maxLevels?: number
  /** Cap on local-moving passes within one level. Default 100. */
  maxLocalPasses?: number
}

const DEFAULT_MAX_LEVELS = 10
const DEFAULT_MAX_LOCAL_PASSES = 100

// One level's graph: nodes identified by dense integer index (fast to work
// with), `id[i]` recovers the original-level string id. `adj[i]` is a
// Map<neighborIndex, weight> — a Map so lookups/updates during local moving
// are O(1) instead of a linear scan, while still iterating in insertion
// order for determinism. `selfLoop[i]` holds weight already internal to
// node i (nonzero only for coarsened nodes, from phase 2 aggregation).
interface LevelGraph {
  id: string[]
  adj: Map<number, number>[]
  selfLoop: number[]
}

function buildLevelGraph(nodeIds: readonly string[], edges: readonly ClusterEdge[]): LevelGraph {
  const index = new Map(nodeIds.map((id, i) => [id, i]))
  const adj: Map<number, number>[] = nodeIds.map(() => new Map())
  const selfLoop = nodeIds.map(() => 0)

  for (const e of edges) {
    const a = index.get(e.source)
    const b = index.get(e.target)
    if (a === undefined || b === undefined) continue
    const w = e.weight ?? 1
    if (a === b) {
      selfLoop[a] += w
      continue
    }
    adj[a].set(b, (adj[a].get(b) ?? 0) + w)
    adj[b].set(a, (adj[b].get(a) ?? 0) + w)
  }

  return { id: [...nodeIds], adj, selfLoop }
}

interface LocalMovingResult {
  // comm[i] = community index assigned to node i, values are a subset of
  // 0..n-1 (the representative index that "won" that community), not
  // necessarily contiguous.
  comm: number[]
  moved: boolean
}

// Phase 1: local moving. Returns the community assignment and whether any
// node ever moved away from its initial singleton community — the caller
// uses `moved` to decide whether aggregating into another level is
// worthwhile (no moves ⇒ every node is its own community ⇒ aggregating
// would be a no-op level, so the dendrogram stops here).
function localMoving(graph: LevelGraph, maxPasses: number): LocalMovingResult {
  const n = graph.id.length
  const degree = graph.adj.map((neighbors, i) => {
    let sum = 2 * graph.selfLoop[i]
    for (const w of neighbors.values()) sum += w
    return sum
  })
  const m2 = degree.reduce((s, d) => s + d, 0) // 2m
  const comm = Array.from({ length: n }, (_, i) => i)
  const commTot = [...degree] // Σ_tot per community, indexed by representative
  let everMoved = false

  if (m2 === 0) return { comm, moved: false } // no edges at all — nothing to cluster

  for (let pass = 0; pass < maxPasses; pass++) {
    let movedThisPass = false

    for (let i = 0; i < n; i++) {
      const currentComm = comm[i]
      commTot[currentComm] -= degree[i]

      // k_i,in(C) for every community reachable from i's neighbors, plus
      // i's own (now-vacated) community so "stay put" is always a
      // candidate. Iterating graph.adj[i] (a Map) is insertion-order —
      // deterministic for a given edge list.
      const kIn = new Map<number, number>([[currentComm, 0]])
      for (const [j, w] of graph.adj[i]) {
        const cj = comm[j]
        kIn.set(cj, (kIn.get(cj) ?? 0) + w)
      }

      let bestComm = currentComm
      let bestScore = -Infinity
      // Map iteration order is insertion order; candidates were inserted
      // as currentComm first, then in adjacency order — stable given the
      // input, but we still break ties on the smaller community index so
      // the result never depends on incidental insertion order.
      for (const [c, kIC] of kIn) {
        const score = kIC - (commTot[c] * degree[i]) / m2
        if (score > bestScore || (score === bestScore && c < bestComm)) {
          bestScore = score
          bestComm = c
        }
      }

      comm[i] = bestComm
      commTot[bestComm] += degree[i]
      if (bestComm !== currentComm) movedThisPass = true
    }

    if (movedThisPass) everMoved = true
    else break
  }

  return { comm, moved: everMoved }
}

// Phase 2: aggregate `graph` by `comm` into a coarser LevelGraph, one node
// per distinct community. New ids are deterministic — built from the
// *sorted* original-level ids of each community's members, not from
// insertion order, so the id is stable regardless of local-moving's
// traversal order. Also returns, per new community id, the original-level
// ids of its members (used to attach children when assembling the
// dendrogram).
function aggregate(
  graph: LevelGraph,
  comm: number[],
  level: number
): { coarse: LevelGraph; membersOf: Map<string, string[]> } {
  const membersByComm = new Map<number, string[]>()
  for (let i = 0; i < graph.id.length; i++) {
    const c = comm[i]
    if (!membersByComm.has(c)) membersByComm.set(c, [])
    membersByComm.get(c)!.push(graph.id[i])
  }

  // Deterministic, human-legible synthetic id: level + smallest member id.
  const commIds = new Map<number, string>()
  const membersOf = new Map<string, string[]>()
  for (const [c, members] of membersByComm) {
    members.sort()
    const newId = `cluster-L${level}-${members[0]}`
    commIds.set(c, newId)
    membersOf.set(newId, members)
  }

  const coarseIds = [...membersByComm.keys()].sort((a, b) => {
    const ai = commIds.get(a)!
    const bi = commIds.get(b)!
    return ai < bi ? -1 : ai > bi ? 1 : 0
  })
  const coarseIndex = new Map(coarseIds.map((c, i) => [c, i]))
  const coarseGraph: LevelGraph = {
    id: coarseIds.map(c => commIds.get(c)!),
    adj: coarseIds.map(() => new Map()),
    selfLoop: coarseIds.map(() => 0),
  }

  for (let i = 0; i < graph.id.length; i++) {
    const ci = coarseIndex.get(comm[i])!
    coarseGraph.selfLoop[ci] += graph.selfLoop[i]
    for (const [j, w] of graph.adj[i]) {
      if (j <= i) continue // each undirected pair aggregated once
      const cj = coarseIndex.get(comm[j])!
      if (ci === cj) {
        coarseGraph.selfLoop[ci] += w
      } else {
        coarseGraph.adj[ci].set(cj, (coarseGraph.adj[ci].get(cj) ?? 0) + w)
        coarseGraph.adj[cj].set(ci, (coarseGraph.adj[cj].get(ci) ?? 0) + w)
      }
    }
  }

  return { coarse: coarseGraph, membersOf }
}

/**
 * Runs deterministic multi-level Louvain clustering and returns the result
 * as a d3.hierarchy()-ready dendrogram: `root.children` are the top-level
 * clusters, each recursively containing sub-clusters down to leaves, which
 * are the original `nodeIds` (unchanged, no children).
 *
 * Degenerate cases return a flat tree (root's children are the leaves
 * directly) rather than a synthetic single-node cluster: an empty node
 * list, or a graph with no edges (nothing to cluster on).
 */
export function louvainCluster(
  nodeIds: readonly string[],
  edges: readonly ClusterEdge[],
  options: LouvainOptions = {}
): ClusterTreeNode {
  const maxLevels = options.maxLevels ?? DEFAULT_MAX_LEVELS
  const maxLocalPasses = options.maxLocalPasses ?? DEFAULT_MAX_LOCAL_PASSES
  const rootId = 'cluster-root'

  if (nodeIds.length === 0) return { id: rootId, children: [] }

  // childrenOf[id] holds the already-built subtree for a cluster id from
  // the previous level (or undefined for a plain leaf id, built lazily).
  let childrenOf = new Map<string, ClusterTreeNode>()
  let graph = buildLevelGraph(nodeIds, edges)
  let level = 0
  let topLevelIds: string[] = [...nodeIds]

  while (level < maxLevels) {
    const { comm, moved } = localMoving(graph, maxLocalPasses)
    if (!moved) break // every node its own community — no useful aggregation

    const { coarse, membersOf } = aggregate(graph, comm, level)
    if (coarse.id.length === graph.id.length) break // aggregation didn't actually reduce size

    const nextChildrenOf = new Map<string, ClusterTreeNode>()
    for (const [clusterId, members] of membersOf) {
      const children = members.map(
        m => childrenOf.get(m) ?? ({ id: m } satisfies ClusterTreeNode)
      )
      nextChildrenOf.set(clusterId, { id: clusterId, children })
    }

    childrenOf = nextChildrenOf
    topLevelIds = coarse.id
    graph = coarse
    level++
  }

  const rootChildren = topLevelIds.map(id => childrenOf.get(id) ?? ({ id } satisfies ClusterTreeNode))
  return { id: rootId, children: rootChildren }
}
