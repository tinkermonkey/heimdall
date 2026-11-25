/**
 * Branch map routing: line, trunk and link geometry, read from a `BranchMapLayout` alone (no
 * data, no options beyond `layout.options`), so a serialized layout routes the same.
 *
 * A line leaves its fork point at 45 degrees, runs straight down its lane and either stops at its
 * own station, stops open (or dead, when dropped) or rejoins at 45 degrees. A fork wider than
 * half a row is a short 45-degree drop and then a horizontal run to the lane, so the horizontal
 * sits between sub-rows, clear of the station labels on them. Corners are rounded with
 * `polylineCurve` (laneLayout.ts).
 *
 * The geometry helpers (`branchLinePoints`, `branchTrunkSpan`) are also what label placement uses
 * to keep labels off the lines; they read placement only.
 */
import type { Point } from '../graph'
import { polylineCurve } from '../laneLayout'
import type {
  BranchMapGroupLayout,
  BranchMapLayout,
  BranchMapLineEnd,
  BranchMapLineLayout,
  BranchMapResolvedOptions,
  BranchMapRoutedLine,
  BranchMapRoutedLink,
  BranchMapRun,
  BranchMapScene,
  BranchMapStationLayout,
  BranchMapTrunk,
  BranchMapTrunkSegment,
} from './types'

/**
 * Half-sizes of the marks the layout keeps clear, in px: a station (circle or diamond) and a
 * group's start marker. The view should draw marks no larger.
 */
export const BRANCH_MAP_MARK = { station: 7, start: 8 } as const

/** Corner radius of routed lines. */
const CORNER = 8
/** Stroke widths with `width: 'off'`. */
const FLAT = { line: 2.5, spur: 1.5, trunk: 4 } as const

/** Rows are never closer than two marks. */
export const effectiveRowGap = (options: Pick<BranchMapResolvedOptions, 'rowGap'>): number =>
  Math.max(options.rowGap, 2 * BRANCH_MAP_MARK.station + 2)

/** How far a fork drops at 45 degrees before it runs across to its lane: half a row. */
export const forkDropOf = (options: Pick<BranchMapResolvedOptions, 'rowGap'>): number => effectiveRowGap(options) / 2

/**
 * Where the trunk is drawn: from the start (or the first trunk station above it) to a row past
 * its last station or the last line that leaves it below the start.
 */
export function branchTrunkSpan(
  group: Pick<BranchMapGroupLayout, 'start' | 'trunk'>,
  stationY: (id: string) => number | undefined,
  lines: readonly Pick<BranchMapLineLayout, 'from' | 'y1'>[],
  options: Pick<BranchMapResolvedOptions, 'rowGap' | 'width'>,
): { y1: number; y2: number } {
  const ys = [...group.trunk.map(stationY), ...lines.filter((l) => l.from === null).map((l) => l.y1)].filter((y): y is number => y !== undefined)
  const rowGap = effectiveRowGap(options)
  const lead = options.width === 'weight' ? rowGap * 0.9 : 0
  return { y1: Math.min(group.start.y, ...ys) - lead, y2: Math.max(group.start.y, ...ys) + rowGap }
}

export interface BranchLineGeometry {
  points: Point[]
  run: BranchMapRun | null
  end: BranchMapLineEnd
}

/**
 * A placed line's polyline: fork, run along its lane, end. Reads the line, its group and the
 * placed stations only.
 */
export function branchLinePoints(
  line: Pick<BranchMapLineLayout, 'lane' | 'from' | 'to' | 'y1' | 'y2' | 'status' | 'kind' | 'stops'>,
  group: Pick<BranchMapGroupLayout, 'trunkX'>,
  station: (id: string) => Pick<BranchMapStationLayout, 'x' | 'y'> | undefined,
  options: Pick<BranchMapResolvedOptions, 'rowGap' | 'laneGap'>,
): BranchLineGeometry {
  const k = forkDropOf(options)
  const laneX = group.trunkX + line.lane * options.laneGap
  const from = line.from ? station(line.from) : undefined
  const a: Point = from ? { x: from.x, y: from.y } : { x: group.trunkX, y: line.y1 }
  const points: Point[] = [a]
  let runTop = a.y
  if (Math.abs(laneX - a.x) > 1e-6) {
    const s = Math.sign(laneX - a.x)
    const d = Math.min(Math.abs(laneX - a.x), k)
    points.push({ x: a.x + s * d, y: a.y + d })
    if (Math.abs(laneX - a.x) > d) points.push({ x: laneX, y: a.y + d })
    runTop = a.y + d
  }
  const dead = line.status === 'dropped'
  const to = !dead && line.to ? station(line.to) : undefined
  let end: BranchMapLineEnd
  let runBottom: number
  if (!to) {
    end = dead ? 'dead' : 'open'
    runBottom = Math.max(runTop, line.y2)
    points.push({ x: laneX, y: runBottom })
  } else if (Math.abs(to.x - laneX) <= 1e-6) {
    end = 'station'
    runBottom = Math.max(runTop, to.y)
    points.push({ x: laneX, y: runBottom })
  } else {
    end = 'join'
    const s = Math.sign(to.x - laneX)
    const d = Math.min(Math.abs(to.x - laneX), k)
    runBottom = Math.max(runTop, to.y - d)
    points.push({ x: laneX, y: runBottom })
    if (Math.abs(to.x - laneX) > d) points.push({ x: to.x - s * d, y: to.y - d })
    points.push({ x: to.x, y: to.y })
  }
  const run = runBottom > runTop ? { x: laneX, y1: runTop, y2: runBottom } : null
  return { points: dedupe(points), run, end }
}

function dedupe(points: Point[]): Point[] {
  return points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > 1e-6)
}

const r1 = (v: number) => Math.round(v * 10) / 10

/** Routing: line, trunk and link geometry, read from the layout alone. */
export function routeBranchMap(layout: BranchMapLayout): BranchMapScene {
  const opts = layout.options
  const stationById = new Map(layout.stations.map((s) => [s.id, s]))
  const station = (id: string) => stationById.get(id)
  const groupById = new Map(layout.groups.map((g) => [g.id, g]))

  // ---- Weights: a fork takes a line's weight off the trunk, a join gives it back --------------
  const events = new Map<string, { y: number; delta: number }[]>()
  const base = new Map<string, number>()
  for (const g of layout.groups) {
    events.set(g.id, [])
    base.set(g.id, 1)
  }
  const geometry = new Map<string, BranchLineGeometry>()
  for (const l of layout.lines) {
    const g = groupById.get(l.group)
    if (!g) continue
    const geo = branchLinePoints(l, g, station, opts)
    geometry.set(l.id, geo)
    if (l.kind === 'spur') continue
    const from = l.from ? station(l.from) : undefined
    const forksFromTrunk = !from || from.onTrunk
    if (forksFromTrunk) {
      base.set(g.id, base.get(g.id)! + l.weight)
      events.get(g.id)!.push({ y: from ? from.y : l.y1, delta: -l.weight })
    }
    const to = l.to ? station(l.to) : undefined
    // A join lands its weight on the trunk; a dead end (or an open one, or one ending off the
    // trunk) never gives it back.
    if (geo.end === 'join' && to?.onTrunk) events.get(g.id)!.push({ y: to.y, delta: l.weight })
  }
  const linesOf = new Map<string, BranchMapLineLayout[]>()
  for (const l of layout.lines) linesOf.set(l.group, [...(linesOf.get(l.group) ?? []), l])
  const maxBase = Math.max(1, ...base.values())
  const weighted = opts.width === 'weight'
  const px = (weight: number) => 1.5 + 13 * Math.sqrt(Math.max(0, weight) / maxBase)

  const lines: BranchMapRoutedLine[] = layout.lines.map((l) => {
    const geo = geometry.get(l.id) ?? { points: [], run: null, end: 'open' as const }
    const width = l.kind === 'spur' ? FLAT.spur : weighted ? Math.min(opts.laneGap - 6, px(l.weight)) : FLAT.line
    return { ...l, points: geo.points, path: geo.points.length ? polylineCurve(geo.points, CORNER).d : '', run: geo.run, end: geo.end, width: r1(width) }
  })

  const trunks: BranchMapTrunk[] = layout.groups.map((g) => {
    const { y1, y2 } = branchTrunkSpan(g, (id) => station(id)?.y, linesOf.get(g.id) ?? [], opts)
    const x = g.trunkX
    const path = `M${r1(x)},${r1(y1)} L${r1(x)},${r1(y2)}`
    if (!weighted) {
      return { group: g.id, x, y1, y2, path, segments: [{ from: { x, y: y1 }, to: { x, y: y2 }, weight: base.get(g.id)!, width: FLAT.trunk }] }
    }
    const ev = events.get(g.id)!
    const ys = [...new Set([y1, y2, ...g.trunk.map((id) => station(id)?.y ?? y1), ...ev.map((e) => e.y)])]
      .filter((y) => y >= y1 && y <= y2)
      .sort((a, b) => a - b)
    let weight = base.get(g.id)!
    const segments: BranchMapTrunkSegment[] = []
    for (let i = 0; i < ys.length - 1; i++) {
      for (const e of ev) if (e.y === ys[i]) weight += e.delta
      const w = Math.max(weight, 0.5)
      segments.push({ from: { x, y: ys[i] }, to: { x, y: ys[i + 1] }, weight: w, width: r1(px(w)) })
    }
    return { group: g.id, x, y1, y2, path, segments }
  })

  const endpoint = (id: string, isGroup: boolean): { p: Point; r: number } | undefined => {
    if (isGroup) {
      const g = groupById.get(id)
      return g ? { p: g.start, r: BRANCH_MAP_MARK.start } : undefined
    }
    const s = station(id)
    return s ? { p: { x: s.x, y: s.y }, r: BRANCH_MAP_MARK.station } : undefined
  }
  const links: BranchMapRoutedLink[] = []
  for (const l of layout.links) {
    const a = endpoint(l.from, l.fromGroupStart)
    const b = endpoint(l.to, l.toGroupStart)
    if (!a || !b) continue
    let c: Point[]
    if (l.kind === 'provides') {
      // An arch over the top: from the provider up and across to the other group's start.
      const lift = Math.min(a.p.y - a.r, b.p.y - b.r) - 26
      const p0 = { x: a.p.x, y: a.p.y - a.r }
      const p3 = { x: b.p.x, y: b.p.y - b.r }
      c = [p0, { x: p0.x, y: lift }, { x: p3.x, y: lift }, p3]
    } else {
      // A vertical S from the station waited on to the waiting one, arriving from above.
      const down = a.p.y <= b.p.y
      const p0 = { x: a.p.x, y: a.p.y + (down ? a.r : -a.r) }
      const p3 = { x: b.p.x, y: b.p.y + (down ? -b.r - 2 : b.r + 2) }
      const my = (p0.y + p3.y) / 2
      c = [p0, { x: p0.x, y: my }, { x: p3.x, y: my }, p3]
    }
    const points = c.map((p) => ({ x: r1(p.x), y: r1(p.y) }))
    const [p0, c1, c2, p3] = points
    const mid = { x: r1((p0.x + 3 * c1.x + 3 * c2.x + p3.x) / 8), y: r1((p0.y + 3 * c1.y + 3 * c2.y + p3.y) / 8) }
    links.push({ ...l, points, path: `M${p0.x},${p0.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p3.x},${p3.y}`, mid })
  }

  return { ...layout, lines, links, trunks }
}
