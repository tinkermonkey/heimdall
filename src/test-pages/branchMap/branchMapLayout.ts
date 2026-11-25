/**
 * Branch-map layout (concept prototype, not public API). A vertical "git graph / metro map" of how
 * projects are organized in House: per project a trunk from NOW downward, one branch per
 * workstream from where it starts (a gate that opened it, a station it waits on, or NOW) to its
 * destination (leads_to a milestone or gate), stations for milestones and gates, and links for
 * depends_on across projects and for interfaces between them.
 *
 * Follows the graph layout foundation's contract (design-reference/layered-graph/breakdown.md,
 * graph-layout direction): a pure, deterministic function from data and options to a scene of
 * positions and per-line polylines, with routing separate from placement and rendering left to
 * the caller. Rounded octilinear routes reuse `polylineCurve` from laneLayout.ts.
 *
 * Stages: filter (horizon) → rank (longest path over depends_on, opens and leads_to, across all
 * visible projects so cross-project links point down) → trunk (heaviest chain of milestones) →
 * rows (rank bands with sub-rows, or one row per station) → lanes (interval colouring of branch
 * spans, git-graph style) → routes → widths (flow heuristic) → links.
 */
import type { Point } from '../../utils/graph'
import { polylineCurve } from '../../utils/laneLayout'
import type {
  HouseGate,
  HouseMilestone,
  HouseOrganizingSnapshot,
  HouseWorkstream,
} from '../fixtures/houseOrganizingTypes'

export type BranchMapHorizon = 'forward' | 'all'
export type BranchMapWidth = 'none' | 'streams' | 'tasks'
export type BranchMapGeometry = 'metro' | 'git'
export type BranchMapRows = 'bands' | 'per-station'

export interface BranchMapOptions {
  /** Visible projects, in column order: a subset of the snapshot's projects. */
  projects: string[]
  /** `forward` (default): only open work, from now on. `all`: reached, decided, done and dropped too. */
  horizon?: BranchMapHorizon
  /** Line width heuristic: `none`, `streams` (each workstream weighs 1) or `tasks` (open + done tasks). */
  widthBy?: BranchMapWidth
  /** `metro`: 45° bends with rounded corners. `git`: S-curves at forks and joins. */
  geometry?: BranchMapGeometry
  /** `bands` (default): stations of one rank share a band, one sub-row each. `per-station`: one row per station, git-log style. */
  rows?: BranchMapRows
  rowGap?: number
  rankGap?: number
  laneGap?: number
  /** Room right of a project's lanes for station labels. */
  labelRoom?: number
  projectGap?: number
  /** Rows a branch needs at least (fork, run, join). Default 2. */
  minBranchRanks?: number
  /** A project column is at least this wide (room for its header). */
  minColumnWidth?: number
}

export type StationKind = 'now' | 'milestone' | 'gate'

export interface BranchMapStation {
  id: string
  kind: StationKind
  project: string
  name: string
  status: string
  rank: number
  x: number
  y: number
  lane: number
  onTrunk: boolean
  /** Waits on something still open (derived, as House derives blocked). */
  blocked: boolean
  criteria?: [number, number]
  data?: HouseMilestone | HouseGate
}

export type BranchLineKind = 'trunk' | 'branch' | 'spur'

export interface BranchMapSegment {
  from: Point
  to: Point
  width: number
  weight: number
}

export interface BranchMapLine {
  id: string
  kind: BranchLineKind
  project: string
  name: string
  status: string
  mode?: 'delivery' | 'exploration'
  /** SVG path for the whole line at its base width. */
  path: string
  points: Point[]
  lane: number
  /** Trunk only: straight pieces with their own width (the flow heuristic). */
  segments?: BranchMapSegment[]
  width: number
  weight: number
  /** How the line ends: joins another line, stops at its own station, stops with no destination, or was dropped. */
  end: 'join' | 'station' | 'open' | 'dead'
  /** The straight run along the lane, for task ticks and the rotated branch label. */
  run: { x: number; y1: number; y2: number } | null
  fromStation: string | null
  toStation: string | null
  data?: HouseWorkstream
}

export interface BranchMapLink {
  id: string
  kind: 'depends' | 'interface'
  from: string
  to: string
  path: string
  label?: string
  mid: Point
}

export interface BranchMapColumn {
  project: string
  name: string
  index: number
  x: number
  trunkX: number
  width: number
  lanes: number
  labelX: number
  counts: { streams: number; milestones: number; gates: number; blocked: number }
}

export interface BranchMapScene {
  stations: BranchMapStation[]
  lines: BranchMapLine[]
  links: BranchMapLink[]
  columns: BranchMapColumn[]
  width: number
  height: number
  top: number
  /** What the layout could not place as asked: no destination, cycles, closed destinations. */
  issues: string[]
}

const OPEN_MILESTONE = new Set(['proposed', 'active', 'set_aside'])
const OPEN_GATE = new Set(['open', 'set_aside'])
const OPEN_STREAM = new Set(['active', 'set_aside'])

export function layoutBranchMap(data: HouseOrganizingSnapshot, options: BranchMapOptions): BranchMapScene {
  const horizon = options.horizon ?? 'forward'
  const widthBy = options.widthBy ?? 'none'
  const geometry = options.geometry ?? 'metro'
  const rowsMode = options.rows ?? 'bands'
  const rowGap = options.rowGap ?? 26
  const rankGap = options.rankGap ?? 18
  const laneGap = options.laneGap ?? 18
  const labelRoom = options.labelRoom ?? 220
  const projectGap = options.projectGap ?? 40
  const minBranch = options.minBranchRanks ?? 2
  const minColumnWidth = options.minColumnWidth ?? 0
  const top = 72
  const issues: string[] = []
  const visible = new Set(options.projects)
  const forward = horizon === 'forward'

  // ---- Filter ----------------------------------------------------------------------------
  const milestones = data.milestones.filter((m) => visible.has(m.project) && (!forward || OPEN_MILESTONE.has(m.status)))
  const gates = data.gates.filter((g) => visible.has(g.project) && (!forward || OPEN_GATE.has(g.status)))
  const streams = data.workstreams.filter((w) => visible.has(w.project) && (!forward || OPEN_STREAM.has(w.status)))

  const stations = new Map<string, BranchMapStation>()
  const nowId = (p: string) => `now:${p}`
  for (const p of options.projects) {
    const proj = data.projects.find((q) => q.id === p)
    stations.set(nowId(p), { id: nowId(p), kind: 'now', project: p, name: proj?.name ?? p, status: 'now', rank: 0, x: 0, y: 0, lane: 0, onTrunk: true, blocked: false })
  }
  for (const m of milestones) stations.set(m.ref, { id: m.ref, kind: 'milestone', project: m.project, name: m.name, status: m.status, rank: 1, x: 0, y: 0, lane: 0, onTrunk: false, blocked: false, criteria: m.criteria, data: m })
  for (const g of gates) stations.set(g.ref, { id: g.ref, kind: 'gate', project: g.project, name: g.name, status: g.status, rank: 1, x: 0, y: 0, lane: 0, onTrunk: false, blocked: false, criteria: g.criteria, data: g })

  const deps = (s: BranchMapStation) => (s.data?.dependsOn ?? []).filter((r) => stations.has(r))
  // A dependency on something open blocks (reached / decided ones only record order).
  const isOpen = (s: BranchMapStation) => (s.kind === 'milestone' ? s.status !== 'reached' && s.status !== 'dropped' : s.kind === 'gate' ? s.status !== 'decided' && s.status !== 'dropped' : false)
  for (const s of stations.values()) s.blocked = deps(s).some((r) => isOpen(stations.get(r)!)) || (s.data?.waitsOnTasks?.length ?? 0) > 0

  // Where each workstream starts: the latest of the gates that opened it and the stations it waits on, else NOW.
  const streamFrom = (w: HouseWorkstream) => {
    const cands = [...w.openedBy, ...w.dependsOn].filter((r) => stations.has(r))
    if (!cands.length) return nowId(w.project)
    return cands.reduce((a, b) => (stations.get(b)!.rank > stations.get(a)!.rank ? b : a))
  }
  const streamTo = (w: HouseWorkstream) => (w.leadsTo && stations.has(w.leadsTo) ? w.leadsTo : null)
  for (const w of streams) {
    if (!w.leadsTo) issues.push(`no destination: ${w.name}`)
    else if (!stations.has(w.leadsTo)) issues.push(`destination closed or hidden: ${w.name}`)
  }

  // ---- Rank: closed work above NOW by date, open work below NOW by longest path -------------
  // House has no schedule: the only times are reached_on and decided_on, so the past is ordered by
  // date and the future by depends_on, opens and leads_to.
  const closedDate = (s: BranchMapStation) => (s.data as HouseMilestone | undefined)?.reachedOn ?? (s.data as HouseGate | undefined)?.decidedOn ?? ''
  const closed = [...stations.values()].filter((s) => s.kind !== 'now' && !isOpen(s))
  // Within one date, what follows something closed the same day comes after it.
  const depth = new Map(closed.map((s) => [s.id, 0]))
  for (let pass = 0; pass < closed.length; pass++) {
    let moved = false
    for (const s of closed)
      for (const d of deps(s))
        if (depth.has(d) && closedDate(stations.get(d)!) === closedDate(s) && depth.get(d)! + 1 > depth.get(s.id)!) (depth.set(s.id, depth.get(d)! + 1), (moved = true))
    if (!moved) break
  }
  const key = (s: BranchMapStation) => `${closedDate(s) || '0000'}#${String(depth.get(s.id)).padStart(3, '0')}`
  const keys = [...new Set(closed.map(key))].sort().reverse()
  for (const s of closed) s.rank = -1 - keys.indexOf(key(s))
  const opensFrom = new Map<string, string[]>()
  for (const g of gates) for (const o of g.opens) if (stations.has(o)) opensFrom.set(o, [...(opensFrom.get(o) ?? []), g.ref])
  let changed = true
  let guard = 0
  while (changed && guard++ < 400) {
    changed = false
    const bump = (s: BranchMapStation, r: number) => {
      if (s.rank < 0) return
      if (r > s.rank) {
        s.rank = r
        changed = true
      }
    }
    for (const s of stations.values()) {
      if (s.kind === 'now') continue
      for (const d of deps(s)) bump(s, stations.get(d)!.rank + 1)
      for (const g of opensFrom.get(s.id) ?? []) bump(s, stations.get(g)!.rank + 1)
    }
    for (const w of streams) {
      const to = streamTo(w)
      if (to) bump(stations.get(to)!, stations.get(streamFrom(w))!.rank + minBranch)
    }
  }
  if (guard >= 400) issues.push('depends_on cycle: ranks capped')

  // ---- Trunk: heaviest chain of milestones (rank strictly increasing) ----------------------
  const streamWeight = (w: HouseWorkstream) => (widthBy === 'tasks' ? Math.max(1, w.tasks.open + w.tasks.done) : 1)
  const into = new Map<string, HouseWorkstream[]>()
  for (const w of streams) {
    const to = streamTo(w)
    if (to) into.set(to, [...(into.get(to) ?? []), w])
  }
  const trunkOf = new Map<string, string[]>()
  for (const p of options.projects) {
    const ms = [...stations.values()].filter((s) => s.project === p && s.kind === 'milestone' && s.status !== 'dropped').sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id))
    const best = new Map<string, { score: number; prev: string | null }>()
    for (const m of ms) {
      const own = 1 + (m.status === 'active' || m.status === 'reached' ? 1 : 0) + (into.get(m.id) ?? []).reduce((a, w) => a + 1 + Math.sqrt(w.tasks.open + w.tasks.done), 0)
      let pick: { score: number; prev: string | null } = { score: own, prev: null }
      for (const q of ms) {
        if (q.rank >= m.rank) break
        const linked = deps(m).includes(q.id) ? 2 : 0
        const sc = best.get(q.id)!.score + own + linked
        if (sc > pick.score) pick = { score: sc, prev: q.id }
      }
      best.set(m.id, pick)
    }
    let tail: string | null = null
    let tailScore = -1
    for (const [id, b] of best) if (b.score > tailScore) (tail = id), (tailScore = b.score)
    const chain: string[] = []
    while (tail) {
      chain.unshift(tail)
      tail = best.get(tail)!.prev
    }
    // Gates on the trunk where their rank is free and no workstream leads to them.
    const taken = new Set([0, ...chain.map((id) => stations.get(id)!.rank)])
    for (const g of [...stations.values()].filter((s) => s.project === p && s.kind === 'gate').sort((a, b) => a.rank - b.rank)) {
      if (!into.has(g.id) && !taken.has(g.rank)) {
        chain.push(g.id)
        taken.add(g.rank)
      }
    }
    chain.push(nowId(p))
    chain.sort((a, b) => stations.get(a)!.rank - stations.get(b)!.rank)
    for (const id of chain) stations.get(id)!.onTrunk = true
    trunkOf.set(p, chain)
  }

  // ---- Branches: workstreams, then one planned line per project for stations nothing leads to
  interface Branch { id: string; kind: BranchLineKind; project: string; from: string | null; to: string | null; stops: string[]; w?: HouseWorkstream; host: boolean; lane: number; name: string; status: string }
  // Work that started before anything recorded on this map: the trunk station just before it, or none.
  const before = (p: string, rank: number) => {
    const prior = trunkOf.get(p)!.map((id) => stations.get(id)!).filter((s) => s.rank < rank)
    return prior.length ? prior[prior.length - 1].id : null
  }
  const branches: Branch[] = []
  const hosted = new Map<string, Branch>()
  for (const w of streams) {
    const to = streamTo(w)
    let from: string | null = streamFrom(w)
    if (to && from === nowId(w.project) && stations.get(to)!.rank < 0) from = before(w.project, stations.get(to)!.rank)
    const b: Branch = { id: w.ref, kind: 'branch', project: w.project, from, to, stops: [], w, host: false, lane: 0, name: w.name, status: w.status }
    if (to && !stations.get(to)!.onTrunk && !hosted.has(to)) {
      b.host = true
      hosted.set(to, b)
    }
    branches.push(b)
  }
  for (const p of options.projects) {
    const loose = [...stations.values()].filter((s) => s.project === p && !s.onTrunk && !hosted.has(s.id)).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    for (const [part, list] of [['past', loose.filter((s) => s.rank < 0)], ['planned', loose.filter((s) => s.rank > 0)]] as const) {
      if (!list.length) continue
      const last = list[list.length - 1].id
      const b: Branch = {
        id: `spur:${p}:${part}`, kind: 'spur', project: p, from: part === 'planned' ? nowId(p) : before(p, list[0].rank), to: last,
        stops: list.map((s) => s.id), host: true, lane: 0, name: part === 'planned' ? 'Planned, no workstream yet' : 'Reached off the trunk', status: part === 'planned' ? 'proposed' : 'reached',
      }
      for (const s of list) hosted.set(s.id, b)
      branches.push(b)
    }
  }

  // ---- Rows (y) -------------------------------------------------------------------------
  const byRank = new Map<number, BranchMapStation[]>()
  for (const s of stations.values()) byRank.set(s.rank, [...(byRank.get(s.rank) ?? []), s])
  const ranks = [...byRank.keys()].sort((a, b) => a - b)
  const order = new Map(options.projects.map((p, i) => [p, i]))
  const stationOrder = (a: BranchMapStation, b: BranchMapStation) => order.get(a.project)! - order.get(b.project)! || Number(b.onTrunk) - Number(a.onTrunk) || a.name.localeCompare(b.name)
  let y = top
  for (const r of ranks) {
    const list = byRank.get(r)!.sort(stationOrder)
    if (rowsMode === 'per-station') {
      if (r === 0) {
        for (const s of list) s.y = y
        y += rowGap
      } else {
        for (const s of list) {
          s.y = y
          y += rowGap
        }
      }
    } else {
      const sub = new Map<string, number>()
      for (const s of list) {
        const k = sub.get(s.project) ?? 0
        s.y = y + k * rowGap
        sub.set(s.project, k + 1)
      }
      y += Math.max(...sub.values()) * rowGap + rankGap
    }
  }
  const bottom = y + rowGap
  // A branch with no recorded start begins two rows above its first station.
  const startY = (b: Branch) => (b.from ? stations.get(b.from)!.y : Math.max(top - 8, (stations.get(b.stops[0] ?? b.to ?? '')?.y ?? top + 2 * rowGap) - 2 * rowGap))
  const endY = (b: Branch) => (b.to ? stations.get(b.to)!.y : Math.min(bottom - rowGap, startY(b) + rowGap * (minBranch + 1)))

  // ---- Lanes: interval colouring per project, trunk on lane 0 -------------------------------
  const laneCount = new Map<string, number>()
  for (const p of options.projects) {
    const mine = branches.filter((b) => b.project === p).sort((a, b) => startY(a) - startY(b) || endY(b) - endY(a))
    const lanes: { end: number; to: string | null }[][] = []
    for (const b of mine) {
      const y1 = startY(b)
      const y2 = endY(b)
      let lane = lanes.findIndex((occ) => occ.every((o) => o.end < y1 - 1 || (o.to === b.from && o.end <= y1)))
      if (lane < 0) {
        lanes.push([])
        lane = lanes.length - 1
      }
      lanes[lane].push({ end: y2, to: b.host ? b.to : null })
      b.lane = lane + 1
      if (b.host && b.to) stations.get(b.to)!.lane = b.lane
      for (const id of b.stops) stations.get(id)!.lane = b.lane
    }
    laneCount.set(p, lanes.length)
  }

  // ---- Columns (x) ----------------------------------------------------------------------
  const columns: BranchMapColumn[] = []
  let x = 24
  options.projects.forEach((p, index) => {
    const lanes = laneCount.get(p) ?? 0
    const lanesW = (lanes + 1) * laneGap
    const proj = data.projects.find((q) => q.id === p)
    const mine = (k: StationKind) => [...stations.values()].filter((s) => s.project === p && s.kind === k)
    columns.push({
      project: p,
      name: proj?.name ?? p,
      index,
      x,
      trunkX: x + laneGap / 2,
      width: Math.max(minColumnWidth, lanesW + labelRoom),
      lanes,
      labelX: x + lanesW + 6,
      counts: {
        streams: branches.filter((b) => b.project === p && b.kind === 'branch').length,
        milestones: mine('milestone').length,
        gates: mine('gate').length,
        blocked: [...stations.values()].filter((s) => s.project === p && s.blocked).length,
      },
    })
    x += Math.max(minColumnWidth, lanesW + labelRoom) + projectGap
  })
  const colOf = new Map(columns.map((c) => [c.project, c]))
  for (const s of stations.values()) s.x = colOf.get(s.project)!.trunkX + s.lane * laneGap

  // ---- Routes ---------------------------------------------------------------------------
  const route = (a: Point, laneX: number, b: Point, joins: boolean): { path: string; points: Point[]; run: BranchMapLine['run'] } => {
    const span = Math.max(1, b.y - a.y)
    const d1 = Math.min(Math.abs(laneX - a.x), span * 0.42)
    const d2 = joins ? Math.min(Math.abs(laneX - b.x), span * 0.42) : 0
    const y1 = a.y + (laneX === a.x ? 0 : geometry === 'git' ? Math.min(rowGap, span * 0.42) : d1)
    const y2 = b.y - (joins ? (geometry === 'git' ? Math.min(rowGap, span * 0.42) : d2) : 0)
    const points = [a, { x: laneX, y: y1 }, { x: laneX, y: y2 }, ...(joins ? [b] : [])]
    const run = { x: laneX, y1, y2 }
    if (geometry === 'git') {
      const h1 = y1 - a.y
      const h2 = b.y - y2
      let d = `M${a.x},${a.y}`
      d += laneX === a.x ? ` L${laneX},${y1}` : ` C${a.x},${a.y + h1 / 2} ${laneX},${a.y + h1 / 2} ${laneX},${y1}`
      d += ` L${laneX},${y2}`
      if (joins) d += ` C${laneX},${y2 + h2 / 2} ${b.x},${y2 + h2 / 2} ${b.x},${b.y}`
      return { path: d, points, run }
    }
    return { path: polylineCurve(points, 9).d, points, run }
  }

  const lines: BranchMapLine[] = []
  const branchW = (w?: HouseWorkstream) => (widthBy === 'none' || !w ? 1 : streamWeight(w))
  const px = (weight: number, max: number) => (widthBy === 'none' ? 3 : 1.5 + 13 * Math.sqrt(weight / Math.max(1, max)))

  // Flow heuristic, trunk side: a trunk carries what is done plus every branch it forks; a fork
  // takes the branch's weight off, a join gives it back, a dead end never returns it.
  let maxTrunk = 1
  const trunkEvents = new Map<string, { y: number; delta: number }[]>()
  const trunkBase = new Map<string, number>()
  for (const p of options.projects) {
    const all = data.workstreams.filter((w) => w.project === p)
    const base = widthBy === 'tasks' ? 1 + all.reduce((a, w) => a + w.tasks.done, 0) : widthBy === 'streams' ? 1 + all.filter((w) => w.status === 'done').length : 1
    let total = base
    const events: { y: number; delta: number }[] = []
    for (const b of branches.filter((q) => q.project === p && q.kind === 'branch')) {
      const w = branchW(b.w)
      const fromTrunk = !!b.from && stations.get(b.from)!.onTrunk
      const joins = !!b.to && stations.get(b.to)!.onTrunk
      if (fromTrunk) {
        total += w
        events.push({ y: stations.get(b.from!)!.y, delta: -w })
      }
      if (joins) events.push({ y: stations.get(b.to!)!.y, delta: w })
    }
    trunkBase.set(p, total)
    trunkEvents.set(p, events)
    maxTrunk = Math.max(maxTrunk, total)
  }
  // Branches share the trunk's scale, capped so neighbouring lanes stay apart.
  const branchPx = (weight: number) => Math.min(laneGap - 4, px(weight, maxTrunk))

  for (const b of branches) {
    const to = b.to ? stations.get(b.to)! : null
    const laneX = colOf.get(b.project)!.trunkX + b.lane * laneGap
    const a = b.from ? stations.get(b.from)! : { x: laneX, y: startY(b) }
    const end: BranchMapLine['end'] = b.status === 'dropped' ? 'dead' : !to ? 'open' : b.host ? 'station' : 'join'
    const target = to ? { x: to.x, y: to.y } : { x: laneX, y: endY(b) }
    const r = route({ x: a.x, y: a.y }, laneX, target, end === 'join')
    const weight = branchW(b.w)
    lines.push({
      id: b.id,
      kind: b.kind,
      project: b.project,
      name: b.name,
      status: b.status,
      mode: b.w?.mode,
      path: r.path,
      points: r.points,
      lane: b.lane,
      width: b.kind === 'spur' ? 1.5 : widthBy === 'none' ? 2.5 : branchPx(weight),
      weight,
      end,
      run: r.run,
      fromStation: b.from,
      toStation: b.to,
      data: b.w,
    })
  }

  // Trunks: straight pieces between stations and fork/join points, each with its own width.
  for (const p of options.projects) {
    const chain = trunkOf.get(p)!.map((id) => stations.get(id)!)
    const tx = colOf.get(p)!.trunkX
    const lastY = chain[chain.length - 1].y
    const tailY = Math.max(lastY + rowGap * 1.5, top + rowGap)
    const pts = chain.map((s) => ({ x: tx, y: s.y }))
    const leadY = chain[0].y - (widthBy === 'none' ? 0 : rowGap * 0.9)
    const ys = [...new Set([leadY, ...chain.map((s) => s.y), ...trunkEvents.get(p)!.map((e) => e.y).filter((v) => v <= lastY), tailY])].sort((a, b) => a - b)
    let weight = trunkBase.get(p)!
    const segments: BranchMapSegment[] = []
    for (let i = 0; i < ys.length - 1; i++) {
      for (const e of trunkEvents.get(p)!) if (e.y === ys[i]) weight += e.delta
      weight = Math.max(weight, 0.5)
      segments.push({ from: { x: tx, y: ys[i] }, to: { x: tx, y: ys[i + 1] }, weight, width: widthBy === 'none' ? 4 : px(weight, maxTrunk) })
    }
    lines.push({
      id: `trunk:${p}`,
      kind: 'trunk',
      project: p,
      name: colOf.get(p)!.name,
      status: 'active',
      path: `M${tx},${leadY} L${tx},${tailY}`,
      points: [...pts, { x: tx, y: tailY }],
      lane: 0,
      segments,
      width: widthBy === 'none' ? 4 : px(trunkBase.get(p)!, maxTrunk),
      weight: trunkBase.get(p)!,
      end: 'open',
      run: null,
      fromStation: nowId(p),
      toStation: null,
    })
  }

  // ---- Links: depends_on across projects, interfaces between visible projects -------------
  const links: BranchMapLink[] = []
  const curve = (a: Point, b: Point) => {
    const my = (a.y + b.y) / 2
    return { path: `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`, mid: { x: (a.x + b.x) / 2, y: my } }
  }
  for (const s of stations.values()) {
    for (const d of deps(s)) {
      const t = stations.get(d)!
      if (t.project === s.project) continue
      const c = curve({ x: t.x, y: t.y }, { x: s.x, y: s.y })
      links.push({ id: `dep:${d}->${s.id}`, kind: 'depends', from: d, to: s.id, ...c })
    }
  }
  for (const i of data.interfaces) {
    if (i.status !== 'active') continue
    for (const p of i.providers) {
      if (!visible.has(p)) continue
      const delivering = i.milestones.map((r) => stations.get(r)).filter((s): s is BranchMapStation => !!s && s.project === p && isOpen(s)).sort((a, b) => a.y - b.y)[0]
      const from = delivering ?? stations.get(nowId(p))!
      for (const u of i.users) {
        if (!visible.has(u) || u === p) continue
        const to = stations.get(nowId(u))!
        const lift = Math.min(from.y, to.y) - 26
        const c = { path: `M${from.x},${from.y} C${from.x},${lift} ${to.x},${lift} ${to.x},${to.y}`, mid: { x: (from.x + to.x) / 2, y: lift + 6 } }
        links.push({ id: `if:${i.ref}:${u}`, kind: 'interface', from: from.id, to: to.id, label: i.name, ...c })
      }
    }
  }

  return { stations: [...stations.values()], lines, links, columns, width: x, height: bottom + 24, top, issues }
}
