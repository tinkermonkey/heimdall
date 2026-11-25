/**
 * Branch map trunk selection: which of a group's stations run down its trunk (lane 0).
 *
 * A stated trunk (`group.trunk`) wins: its stations, in rank order (stations of one rank in
 * their band's row order). Ids that are not stations of the group are reported as
 * `invalid-trunk` and skipped, and so is an order that puts a later rank before an earlier one;
 * with nothing valid left, the trunk is derived.
 *
 * The derived trunk is the heaviest chain of stops in strictly increasing rank. A stop weighs
 * what arrives at it (each line 1 plus the square root of its weight) and one more when it is
 * active or done; a stop no line leads to weighs nothing and stays off the trunk. Consecutive
 * stops where one follows the other (`after`) earn a bonus. Decisions join the trunk when no line
 * leads to them and no trunk station has their rank. Promoted from the concept prototype's trunk
 * stage (src/test-pages/branchMap/branchMapLayout.ts).
 */
import type { BranchMapGroup, BranchMapIssue, BranchMapLine, BranchMapStation } from './types'

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Bonus for consecutive trunk stops where the later one follows the earlier. */
const AFTER_BONUS = 2

export interface BranchMapTrunkChoice {
  /** Station ids, top to bottom. */
  trunk: string[]
  stated: boolean
  issues: BranchMapIssue[]
}

/**
 * Chooses one group's trunk. `stations` and `lines` are the group's own, validated and sorted by
 * id; `rank` covers every station.
 */
export function chooseBranchMapTrunk(
  group: BranchMapGroup,
  stations: readonly BranchMapStation[],
  lines: readonly BranchMapLine[],
  rank: ReadonlyMap<string, number>,
): BranchMapTrunkChoice {
  const issues: BranchMapIssue[] = []
  const mine = new Map(stations.map((s) => [s.id, s]))
  const byRank = (a: string, b: string) => rank.get(a)! - rank.get(b)! || cmp(a, b)

  if (group.trunk && group.trunk.length) {
    const unknown = group.trunk.filter((id) => !mine.has(id))
    if (unknown.length) {
      issues.push({ kind: 'invalid-trunk', message: `Trunk of ${group.id} names stations that are not in the group: ${unknown.join(', ')}.`, ids: [group.id, ...unknown] })
    }
    const valid = [...new Set(group.trunk.filter((id) => mine.has(id)))]
    // Stations that share a rank are not out of order whichever way they were given: a tie is not
    // a contradiction. Their final top-to-bottom order is their band's row order.
    const given = new Map(valid.map((id, i) => [id, i]))
    const sorted = [...valid].sort((a, b) => rank.get(a)! - rank.get(b)! || given.get(a)! - given.get(b)!)
    if (sorted.some((id, i) => id !== valid[i])) {
      issues.push({ kind: 'invalid-trunk', message: `Trunk of ${group.id} is not in rank order; drawn in rank order.`, ids: [group.id, ...valid] })
    }
    if (sorted.length) return { trunk: sorted, stated: true, issues }
  }

  const into = new Map<string, BranchMapLine[]>()
  for (const l of lines) if (l.to && l.status !== 'dropped') into.set(l.to, [...(into.get(l.to) ?? []), l])

  const stops = stations
    .filter((s) => s.kind === 'stop' && s.status !== 'dropped' && into.has(s.id))
    .sort((a, b) => byRank(a.id, b.id))
  const best = new Map<string, { score: number; prev: string | null }>()
  for (const s of stops) {
    const own = (s.status === 'active' || s.status === 'done' ? 1 : 0) + into.get(s.id)!.reduce((a, l) => a + 1 + Math.sqrt(Math.max(0, l.weight ?? 1)), 0)
    let pick: { score: number; prev: string | null } = { score: own, prev: null }
    for (const q of stops) {
      if (rank.get(q.id)! >= rank.get(s.id)!) break
      const score = best.get(q.id)!.score + own + ((s.after ?? []).includes(q.id) ? AFTER_BONUS : 0)
      if (score > pick.score) pick = { score, prev: q.id }
    }
    best.set(s.id, pick)
  }
  let tail: string | null = null
  let tailScore = -Infinity
  for (const s of stops) {
    const b = best.get(s.id)!
    if (b.score > tailScore) {
      tail = s.id
      tailScore = b.score
    }
  }
  const chain: string[] = []
  while (tail) {
    chain.unshift(tail)
    tail = best.get(tail)!.prev
  }

  const taken = new Set(chain.map((id) => rank.get(id)!))
  for (const d of stations.filter((s) => s.kind === 'decision' && s.status !== 'dropped' && !into.has(s.id)).sort((a, b) => byRank(a.id, b.id))) {
    if (taken.has(rank.get(d.id)!)) continue
    chain.push(d.id)
    taken.add(rank.get(d.id)!)
  }
  return { trunk: chain.sort(byRank), stated: false, issues }
}
