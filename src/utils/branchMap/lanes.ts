/**
 * Branch map lane assignment: interval colouring of a group's line spans, the way commit graphs
 * assign lanes (pvigier, "Commit graph drawing algorithms", 2019). Lane 0 is the trunk; branch
 * lanes count from 1. Spans are taken in order of their fork, each into the free lane nearest
 * the lane it forks from (the trunk's, lane 0, for the start or a trunk station), the lower on a
 * tie. A lane is free once every line on it has ended above the new line's fork, or when the
 * line on it ends at the very station the new line forks from, so a line forking from a station
 * off the trunk continues straight down when it can.
 *
 * Among lines that fork at the same height, lines that rejoin go innermost, the soonest first,
 * so a join crosses no line still running; lines that end on their own lane go outside them,
 * the longest first, so the label right of an end station crosses no line still running.
 */

export interface BranchLaneSpan {
  id: string
  /** Fork y. */
  start: number
  /** End y: the station it ends at, or where it stops. */
  end: number
  /** Station it forks from. */
  from: string | null
  /** Station it carries at its end, on its own lane (not a join). */
  endsAt: string | null
  /** It ends by rejoining another lane (the trunk, or a station on another line). */
  joins: boolean
}

export interface BranchLaneAssignment {
  /** Lane per span id, from 1. */
  lane: Map<string, number>
  /** Branch lanes used. */
  count: number
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export function assignBranchLanes(spans: readonly BranchLaneSpan[]): BranchLaneAssignment {
  const sorted = [...spans].sort(
    (a, b) => a.start - b.start || Number(b.joins) - Number(a.joins) || (a.joins ? a.end - b.end : b.end - a.end) || cmp(a.id, b.id),
  )
  const lanes: { end: number; endsAt: string | null }[][] = []
  const lane = new Map<string, number>()
  /** Lane of each station a line carries at its end. */
  const stationLane = new Map<string, number>()
  for (const s of sorted) {
    const home = (s.from !== null ? stationLane.get(s.from) : undefined) ?? 0
    let pick = -1
    for (let i = 0; i < lanes.length; i++) {
      if (!lanes[i].every((o) => o.end < s.start || (s.from !== null && o.endsAt === s.from && o.end <= s.start))) continue
      if (pick < 0 || Math.abs(i + 1 - home) < Math.abs(pick + 1 - home)) pick = i
    }
    if (pick < 0) {
      lanes.push([])
      pick = lanes.length - 1
    }
    lanes[pick].push({ end: s.end, endsAt: s.endsAt })
    lane.set(s.id, pick + 1)
    if (s.endsAt) stationLane.set(s.endsAt, pick + 1)
  }
  return { lane, count: lanes.length }
}
