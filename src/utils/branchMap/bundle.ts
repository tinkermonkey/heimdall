/**
 * Branch map line bundling: keeps a group within `maxLanes` branch lanes.
 *
 * Past the budget, lines that fork from the same place (a station, or the start) and deliver to
 * the same station merge into one bundle, the largest sets first, until the group fits. If it
 * still does not fit, the lightest of what is left (lines, then bundles, by weight, then id)
 * collapse one at a time into a single "N more" line for the group. A group id in `expanded`
 * leaves the group whole; a bundle id leaves that set of lines unbundled and out of "N more".
 *
 * How many lanes a set of lines needs depends on where they sit, which the caller knows, so it
 * is passed in as `laneCount`.
 */
import type { BranchMapLine } from './types'

export type BranchLineSetKind = 'line' | 'bundle' | 'more'

/** One drawn line: an input line, a bundle of them, or the group's "N more" line. */
export interface BranchLineSet {
  id: string
  kind: BranchLineSetKind
  /** Input lines it draws, sorted by id. */
  members: BranchMapLine[]
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export const bundleIdOf = (group: string, from: string | null, to: string): string => `bundle:${group}:${from ?? 'start'}:${to}`
export const moreIdOf = (group: string): string => `more:${group}`

const weightOf = (set: BranchLineSet) => set.members.reduce((a, l) => a + (l.weight ?? 1), 0)
const singles = (lines: readonly BranchMapLine[]): BranchLineSet[] => lines.map((l) => ({ id: l.id, kind: 'line', members: [l] }))

/**
 * Bundles one group's lines. `lines` are the group's validated input lines, sorted by id;
 * `fromOf` gives the station a line forks from as placed (`null` for the start).
 */
export function bundleBranchLines(
  group: string,
  lines: readonly BranchMapLine[],
  options: { maxLanes: number; expanded: ReadonlySet<string> },
  fromOf: (line: BranchMapLine) => string | null,
  laneCount: (sets: readonly BranchLineSet[]) => number,
): BranchLineSet[] {
  let sets = singles(lines)
  if (options.expanded.has(group) || laneCount(sets) <= options.maxLanes) return sets

  // ---- By destination ---------------------------------------------------------------------
  const keyed = new Map<string, BranchMapLine[]>()
  for (const l of lines) {
    if (!l.to || l.status === 'dropped') continue
    const id = bundleIdOf(group, fromOf(l), l.to)
    keyed.set(id, [...(keyed.get(id) ?? []), l])
  }
  const candidates = [...keyed.entries()]
    .filter(([id, members]) => members.length > 1 && !options.expanded.has(id))
    .sort((a, b) => b[1].length - a[1].length || cmp(a[0], b[0]))
  const held = new Set<string>()
  for (const [id, members] of keyed) if (members.length > 1 && options.expanded.has(id)) for (const l of members) held.add(l.id)

  for (const [id, members] of candidates) {
    const inside = new Set(members.map((l) => l.id))
    sets = [...sets.filter((s) => !inside.has(s.id)), { id, kind: 'bundle', members }]
    if (laneCount(sets) <= options.maxLanes) return order(sets)
  }

  // ---- The lightest into "N more" ---------------------------------------------------------
  const pool = sets
    .filter((s) => !s.members.some((l) => held.has(l.id)))
    .sort((a, b) => Number(a.kind === 'bundle') - Number(b.kind === 'bundle') || weightOf(a) - weightOf(b) || cmp(a.id, b.id))
  const more: BranchLineSet = { id: moreIdOf(group), kind: 'more', members: [] }
  let rest = sets
  for (const s of pool) {
    more.members = [...more.members, ...s.members].sort((a, b) => cmp(a.id, b.id))
    rest = rest.filter((r) => r.id !== s.id)
    sets = [...rest, { ...more }]
    if (laneCount(sets) <= options.maxLanes) break
  }
  return order(sets)
}

function order(sets: BranchLineSet[]): BranchLineSet[] {
  return [...sets].sort((a, b) => cmp(a.id, b.id))
}
