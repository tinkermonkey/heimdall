/**
 * Branch map ranking: which band each station sits in.
 *
 * Rank 0 is the start markers' band. A `done` station with a date sits above it (rank -1 is the
 * latest date), in date order, and within one date after what it follows. Every other station
 * sits below it by longest path over three kinds of constraint, solved across all groups at
 * once so links between groups point down:
 * - `station.after`: one rank below what it follows;
 * - a line `from` → `to`: at least `minBranchRanks` below the fork (the start for `from: null`),
 *   so the line has room to fork, run and rejoin;
 * - a dependency link between stations: one rank below the station waited on.
 *
 * Cycles are reported once per strongly connected set and their inner constraints dropped.
 */
import type { BranchMapIssue, BranchMapLine, BranchMapLinkLayout, BranchMapStation } from './types'

export interface BranchMapRanking {
  rank: Map<string, number>
  issues: BranchMapIssue[]
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** A done station with a date: placed above the start by date. */
export const isDated = (s: BranchMapStation): boolean => s.status === 'done' && !!s.date

/**
 * Ranks every station. Inputs are validated: every id referenced exists, `stations` is sorted by
 * id. Unknown references are ignored.
 */
export function rankBranchMapStations(
  stations: readonly BranchMapStation[],
  lines: readonly BranchMapLine[],
  links: readonly BranchMapLinkLayout[],
  minBranchRanks: number,
): BranchMapRanking {
  const byId = new Map(stations.map((s) => [s.id, s]))
  const rank = new Map<string, number>()
  const issues: BranchMapIssue[] = []
  const span = Math.max(1, Math.round(minBranchRanks))

  // ---- Dated done work, above the start ---------------------------------------------------
  const dated = stations.filter(isDated)
  const depth = new Map(dated.map((s) => [s.id, 0]))
  for (let pass = 0; pass <= dated.length; pass++) {
    let moved = false
    for (const s of dated)
      for (const a of s.after ?? []) {
        const p = byId.get(a)
        if (p && depth.has(a) && p.date === s.date && depth.get(a)! + 1 > depth.get(s.id)!) {
          depth.set(s.id, depth.get(a)! + 1)
          moved = true
        }
      }
    if (!moved) break
  }
  const keyOf = (s: BranchMapStation) => `${s.date}#${String(depth.get(s.id)).padStart(4, '0')}`
  const keys = [...new Set(dated.map(keyOf))].sort(cmp).reverse()
  for (const s of dated) rank.set(s.id, -1 - keys.indexOf(keyOf(s)))

  // ---- Open work, below the start: longest path ----------------------------------------------
  const open = stations.filter((s) => !isDated(s))
  const floor = new Map(open.map((s) => [s.id, 1]))
  const edges = new Map<string, { to: string; delta: number }[]>(open.map((s) => [s.id, []]))
  const constrain = (from: string | null, to: string, delta: number) => {
    if (!floor.has(to)) return // dated stations are fixed
    if (from === null || rank.has(from)) {
      // From the start (rank 0) or a fixed dated station: a lower bound.
      const r = (from === null ? 0 : rank.get(from)!) + delta
      floor.set(to, Math.max(floor.get(to)!, r))
    } else if (edges.has(from)) {
      edges.get(from)!.push({ to, delta })
    }
  }
  for (const s of open) for (const a of s.after ?? []) if (byId.has(a)) constrain(a, s.id, 1)
  for (const l of lines) if (l.to && byId.has(l.to)) constrain(l.from && byId.has(l.from) ? l.from : null, l.to, span)
  for (const k of links) if (k.kind === 'dependency' && !k.toGroupStart) constrain(k.fromGroupStart ? null : k.from, k.to, 1)

  // Strongly connected sets (Tarjan); a set of two or more, or a self-loop, is a cycle.
  const ids = open.map((s) => s.id)
  const index = new Map<string, number>()
  const low = new Map<string, number>()
  const onStack = new Set<string>()
  const stack: string[] = []
  const component = new Map<string, number>()
  let counter = 0
  let components = 0
  const strong = (v: string) => {
    index.set(v, counter)
    low.set(v, counter++)
    stack.push(v)
    onStack.add(v)
    for (const { to } of edges.get(v)!) {
      if (!index.has(to)) {
        strong(to)
        low.set(v, Math.min(low.get(v)!, low.get(to)!))
      } else if (onStack.has(to)) low.set(v, Math.min(low.get(v)!, index.get(to)!))
    }
    if (low.get(v) === index.get(v)) {
      const members: string[] = []
      let w: string
      do {
        w = stack.pop()!
        onStack.delete(w)
        component.set(w, components)
        members.push(w)
      } while (w !== v)
      components++
      const selfLoop = members.length === 1 && edges.get(v)!.some((e) => e.to === v)
      if (members.length > 1 || selfLoop) {
        members.sort(cmp)
        issues.push({ kind: 'cycle', message: `Stations wait on each other in a cycle: ${members.join(', ')}. The cycle's order is ignored.`, ids: members })
      }
    }
  }
  for (const v of ids) if (!index.has(v)) strong(v)

  // Constraints inside a cycle are dropped; what is left is acyclic. Kahn's order, then relax.
  const incoming = new Map(ids.map((v) => [v, 0]))
  for (const v of ids) for (const e of edges.get(v)!) if (component.get(e.to) !== component.get(v)) incoming.set(e.to, incoming.get(e.to)! + 1)
  const queue = ids.filter((v) => incoming.get(v) === 0)
  const value = new Map(floor)
  while (queue.length) {
    const v = queue.shift()!
    for (const e of edges.get(v)!) {
      if (component.get(e.to) === component.get(v)) continue
      value.set(e.to, Math.max(value.get(e.to)!, value.get(v)! + e.delta))
      incoming.set(e.to, incoming.get(e.to)! - 1)
      if (incoming.get(e.to) === 0) queue.push(e.to)
    }
  }
  for (const v of ids) rank.set(v, value.get(v)!)
  return { rank, issues }
}
