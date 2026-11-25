/**
 * Branch map placement: the Metro bands layout, a pure and deterministic function from
 * `BranchMapData` to `BranchMapLayout` (positions, lanes, bundles, label boxes). No DOM: text
 * widths come from `options.measureText` or an estimate. Routing is a separate stage
 * (`routeBranchMap`, route.ts) that reads the layout alone.
 *
 * Stages, each in its own module:
 * 1. validate: duplicate ids and dangling references go to `issues`, never thrown;
 * 2. rank (rank.ts): dated done work above the start, open work below it by longest path;
 * 3. trunk (trunk.ts): stated, else the heaviest chain of stops; dated stations no line leads
 *    to run down the trunk too;
 * 4. rows: one band per rank across all groups, one sub-row per station per group, so no two
 *    stations of a group share a row;
 * 5. bundle (bundle.ts) and lanes (lanes.ts): lines to `maxLanes` lanes by interval colouring;
 *    a station off the trunk sits on the lane of the line that carries it, and stations no line
 *    leads to sit on one dotted spur per group;
 * 6. fan: the rows are laid again with room under the start, where the lines that fork from it
 *    leave the trunk one row apart, the outermost first (no crossings, a row for each name);
 * 7. labels (labels.ts): station and line labels per group, no overlaps;
 * 8. pack: groups left to right by their measured width, headers on top.
 *
 * Exported beside it for the view: `BRANCH_MAP_MARK` (the mark sizes kept clear) and
 * `BRANCH_MAP_TEXT` (the type sizes labels were measured at).
 *
 * Promoted from the concept prototype (src/test-pages/branchMap/branchMapLayout.ts); see
 * design-reference/branch-map/README.md.
 */
import type { Point } from '../graph'
import { bundleBranchLines, type BranchLineSet } from './bundle'
import { BRANCH_MAP_TEXT, estimateBranchMapText, placeBranchMapLabels, wrapBranchMapLabel, type BranchLabelLine } from './labels'
import { assignBranchLanes, type BranchLaneSpan } from './lanes'
import { rankBranchMapStations } from './rank'
import { BRANCH_MAP_MARK, branchLinePoints, branchTrunkSpan, effectiveRowGap, routeBranchMap } from './route'
import { chooseBranchMapTrunk } from './trunk'
import type {
  BranchMapData,
  BranchMapGroup,
  BranchMapGroupLayout,
  BranchMapIssue,
  BranchMapLabelBox,
  BranchMapLayout,
  BranchMapLine,
  BranchMapLineKind,
  BranchMapLineLayout,
  BranchMapLineMarks,
  BranchMapLinkLayout,
  BranchMapOptions,
  BranchMapResolvedOptions,
  BranchMapScene,
  BranchMapStation,
  BranchMapStationLayout,
  BranchMapUnplacedLabel,
} from './types'

export { routeBranchMap } from './route'
export { BRANCH_MAP_MARK } from './route'
export { BRANCH_MAP_TEXT, estimateBranchMapText, placeBranchMapLabels, wrapBranchMapLabel } from './labels'
export { bundleIdOf, moreIdOf } from './bundle'

export const BRANCH_MAP_DEFAULTS: Readonly<BranchMapResolvedOptions> = {
  rowGap: 26,
  rankGap: 18,
  laneGap: 24,
  groupGap: 40,
  minBranchRanks: 2,
  maxLanes: 8,
  expanded: [],
  width: 'off',
  maxLabelWidth: 180,
  looseStations: 'spur',
}

/** Options with defaults filled in, `measureText` left out. */
export function resolveBranchMapOptions(options: BranchMapOptions = {}): BranchMapResolvedOptions {
  return {
    rowGap: options.rowGap ?? BRANCH_MAP_DEFAULTS.rowGap,
    rankGap: options.rankGap ?? BRANCH_MAP_DEFAULTS.rankGap,
    laneGap: options.laneGap ?? BRANCH_MAP_DEFAULTS.laneGap,
    groupGap: options.groupGap ?? BRANCH_MAP_DEFAULTS.groupGap,
    minBranchRanks: options.minBranchRanks ?? BRANCH_MAP_DEFAULTS.minBranchRanks,
    maxLanes: options.maxLanes ?? BRANCH_MAP_DEFAULTS.maxLanes,
    expanded: [...(options.expanded ?? [])],
    width: options.width ?? BRANCH_MAP_DEFAULTS.width,
    maxLabelWidth: options.maxLabelWidth ?? BRANCH_MAP_DEFAULTS.maxLabelWidth,
    looseStations: options.looseStations ?? BRANCH_MAP_DEFAULTS.looseStations,
  }
}

/** Margin round the whole map. */
const PAD = 8
/** Gap between a group's header and its topmost content. */
const HEADER_GAP = 12
/** Space right of a group's widest content. */
const RIGHT_PAD = 4

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

// ---- Validate --------------------------------------------------------------------------------

interface Valid {
  groups: BranchMapGroup[]
  /** Sorted by id. */
  stations: BranchMapStation[]
  /** Sorted by id; `from`/`to` cleared where they do not resolve to a station of the group. */
  lines: BranchMapLine[]
  /** The input line per id, for `BranchMapLineLayout.line`. */
  inputLine: Map<string, BranchMapLine>
  links: BranchMapLinkLayout[]
  issues: BranchMapIssue[]
}

function validate(data: BranchMapData): Valid {
  const issues: BranchMapIssue[] = []
  const seen = new Set<string>()
  const claim = (id: string, what: string) => {
    if (!seen.has(id)) {
      seen.add(id)
      return true
    }
    issues.push({ kind: 'duplicate-id', message: `Duplicate id ${id} (a ${what}); the later one is ignored.`, ids: [id] })
    return false
  }
  const dangling = (id: string, ref: string, message: string) => issues.push({ kind: 'dangling-reference', message, ids: [id, ref] })

  const groups = data.groups.filter((g) => claim(g.id, 'group'))
  const groupIds = new Set(groups.map((g) => g.id))
  const stations: BranchMapStation[] = []
  for (const s of data.stations) {
    if (!claim(s.id, 'station')) continue
    if (!groupIds.has(s.group)) {
      dangling(s.id, s.group, `Station ${s.id} names an unknown group ${s.group}; it is left out.`)
      continue
    }
    stations.push(s)
  }
  stations.sort((a, b) => cmp(a.id, b.id))
  const stationById = new Map(stations.map((s) => [s.id, s]))
  for (const s of stations)
    for (const a of s.after ?? []) if (!stationById.has(a)) dangling(s.id, a, `Station ${s.id} follows an unknown station ${a}; ignored.`)

  const lines: BranchMapLine[] = []
  const inputLine = new Map<string, BranchMapLine>()
  for (const l of data.lines) {
    if (!claim(l.id, 'line')) continue
    if (!groupIds.has(l.group)) {
      dangling(l.id, l.group, `Line ${l.id} names an unknown group ${l.group}; it is left out.`)
      continue
    }
    const end = (ref: string | null, which: 'from' | 'to'): string | null => {
      if (ref === null) return null
      const s = stationById.get(ref)
      if (!s) dangling(l.id, ref, `Line ${l.id} ${which} an unknown station ${ref}; drawn from the start or open-ended.`)
      else if (s.group !== l.group) dangling(l.id, ref, `Line ${l.id} ${which} ${ref}, a station of another group; drawn from the start or open-ended.`)
      else return ref
      return null
    }
    const from = end(l.from, 'from')
    let to = end(l.to, 'to')
    if (to !== null && to === from) {
      issues.push({ kind: 'cycle', message: `Line ${l.id} forks from and delivers to ${to}; drawn open-ended.`, ids: [l.id, to] })
      to = null
    }
    inputLine.set(l.id, l)
    lines.push(from === l.from && to === l.to ? l : { ...l, from, to })
  }
  lines.sort((a, b) => cmp(a.id, b.id))

  const links: BranchMapLinkLayout[] = []
  for (const k of data.links ?? []) {
    if (!claim(k.id, 'link')) continue
    const known = (ref: string) => stationById.has(ref) || groupIds.has(ref)
    const bad = [k.from, k.to].filter((r) => !known(r))
    if (bad.length) {
      for (const r of bad) dangling(k.id, r, `Link ${k.id} names an unknown station or group ${r}; it is left out.`)
      continue
    }
    links.push({
      id: k.id, kind: k.kind, from: k.from, to: k.to, fromGroupStart: groupIds.has(k.from), toGroupStart: groupIds.has(k.to),
      ...(k.label !== undefined ? { label: k.label } : {}),
    })
  }
  links.sort((a, b) => cmp(a.id, b.id))
  return { groups, stations, lines, inputLine, links, issues }
}

// ---- Drawn lines before lanes ------------------------------------------------------------------

interface Draft {
  id: string
  kind: BranchMapLineKind
  label: string
  status: BranchMapLineLayout['status']
  style: BranchMapLineLayout['style']
  weight: number
  marks?: BranchMapLineMarks
  from: string | null
  to: string | null
  y1: number
  y2: number
  stops: string[]
  members: string[]
  line?: BranchMapLine
  /** Stations it carries on its own lane. */
  carries: string[]
}

const common = <T>(values: T[]): T | undefined => (values.every((v) => v === values[0]) ? values[0] : undefined)

function sumMarks(lines: readonly BranchMapLine[]): BranchMapLineMarks | undefined {
  const withMarks = lines.filter((l) => l.marks)
  if (!withMarks.length) return undefined
  return {
    total: withMarks.reduce((a, l) => a + l.marks!.total, 0),
    emphasized: withMarks.reduce((a, l) => a + (l.marks!.emphasized ?? 0), 0),
  }
}

/** Placement: positions, lanes, bundles and label boxes. Never throws; bad input goes to `issues`. */
export function layoutBranchMap(data: BranchMapData, options: BranchMapOptions = {}): BranchMapLayout {
  const opts = resolveBranchMapOptions(options)
  const measure = options.measureText ?? estimateBranchMapText
  const rowGap = effectiveRowGap(opts)
  const span = Math.max(1, Math.round(opts.minBranchRanks))
  const openSpan = rowGap * (span + 1)
  /** Rows of the fan under the start: one line name high. */
  const fanStep = Math.max(rowGap / 2, BRANCH_MAP_TEXT.line.lineHeight + 1)
  const expanded = new Set(opts.expanded)
  const valid = validate(data)
  const issues = valid.issues

  // ---- Rank -----------------------------------------------------------------------------
  const ranking = rankBranchMapStations(valid.stations, valid.lines, valid.links, span)
  issues.push(...ranking.issues)
  const rank = ranking.rank
  const stationsOf = new Map(valid.groups.map((g) => [g.id, valid.stations.filter((s) => s.group === g.id)]))
  const linesOf = new Map(valid.groups.map((g) => [g.id, valid.lines.filter((l) => l.group === g.id)]))

  // ---- Trunk ----------------------------------------------------------------------------
  const onTrunk = new Set<string>()
  const trunkOf = new Map<string, string[]>()
  for (const g of valid.groups) {
    const choice = chooseBranchMapTrunk(g, stationsOf.get(g.id)!, linesOf.get(g.id)!, rank)
    issues.push(...choice.issues)
    const led = new Set(linesOf.get(g.id)!.filter((l) => l.to && l.status !== 'dropped').map((l) => l.to!))
    const trunk = new Set(choice.trunk)
    // History runs down the trunk: dated work no live line leads to joins it.
    for (const s of stationsOf.get(g.id)!) if (rank.get(s.id)! < 0 && !led.has(s.id)) trunk.add(s.id)
    for (const id of trunk) onTrunk.add(id)
    trunkOf.set(g.id, [...trunk])
  }

  // ---- Rows: a band per rank, a sub-row per station per group -------------------------------
  // The start's band also holds the fan: lines that fork from the start leave the trunk one
  // row apart, the outermost first, so none crosses another and each name has its own row.
  const y = new Map<string, number>()
  const ranks = [...new Set([0, ...rank.values()])].sort((a, b) => a - b)
  let startY = 0
  let fanRows = 0
  const layRows = () => {
    let cursor = 0
    for (const r of ranks) {
      if (r === 0) startY = cursor
      let rows = 1
      for (const g of valid.groups) {
        const band = stationsOf.get(g.id)!
          .filter((s) => rank.get(s.id) === r)
          .sort((a, b) => Number(onTrunk.has(b.id)) - Number(onTrunk.has(a.id)) || cmp(a.label, b.label) || cmp(a.id, b.id))
        band.forEach((s, i) => y.set(s.id, cursor + i * rowGap))
        rows = Math.max(rows, band.length)
      }
      cursor += rows * rowGap + (r === 0 ? fanRows * fanStep : 0) + opts.rankGap
    }
  }
  layRows()
  const Y = (id: string) => y.get(id)!
  for (const g of valid.groups) trunkOf.get(g.id)!.sort((a, b) => Y(a) - Y(b) || cmp(a, b))

  // ---- Per group: bundle, then (after the fan) lanes, local x and labels -----------------------
  interface Placed {
    group: BranchMapGroup
    index: number
    trunkX: number
    start: Point
    lanes: number
    width: number
    stations: BranchMapStationLayout[]
    lines: BranchMapLineLayout[]
    labels: BranchMapLabelBox[]
    unplaced: BranchMapUnplacedLabel[]
    bundled: number
  }
  const trunkX = Math.max(opts.laneGap / 2, BRANCH_MAP_MARK.start + 2)
  const groupStage = (g: BranchMapGroup) => {
    const trunk = trunkOf.get(g.id)!
    const mine = stationsOf.get(g.id)!

    // Where a line forks: its station, or the start; a destination at or above that forks from
    // the trunk station (or the start) just above it instead.
    const forkAbove = (toY: number): { from: string | null; y: number } => {
      const above = [{ from: null as string | null, y: startY }, ...trunk.map((id) => ({ from: id as string | null, y: Y(id) }))].filter((c) => c.y < toY)
      if (!above.length) return { from: null, y: toY - span * rowGap }
      return above.reduce((a, b) => (b.y > a.y ? b : a))
    }
    // An open end stops a few rows below its fork (below the whole fan, for a fork at the start,
    // so rows shifting under the fan never change which lanes overlap).
    const openEnd = (f: { from: string | null; y: number }) => (f.from === null && f.y === startY ? startY + fanRows * fanStep : f.y) + openSpan
    const forkOf = (l: BranchMapLine): { from: string | null; y: number } => {
      const f = { from: l.from, y: l.from ? Y(l.from) : startY }
      if (l.to && l.status !== 'dropped' && Y(l.to) <= f.y) return forkAbove(Y(l.to))
      return f
    }

    const materialize = (sets: readonly BranchLineSet[]): Draft[] => {
      const drafts: Draft[] = []
      for (const set of sets) {
        if (set.kind === 'more') continue
        const m = set.members
        const f = forkOf(m[0])
        const dropped = m[0].status === 'dropped'
        const to = m[0].to
        drafts.push({
          id: set.id,
          kind: set.kind,
          label: set.kind === 'line' ? m[0].label : `${m.length} lines`,
          status: common(m.map((l) => l.status)) ?? 'active',
          style: common(m.map((l) => l.style ?? 'solid')) ?? 'solid',
          weight: m.reduce((a, l) => a + (l.weight ?? 1), 0),
          marks: set.kind === 'line' ? m[0].marks : sumMarks(m),
          from: f.from,
          to,
          y1: f.y,
          y2: to && !dropped ? Y(to) : openEnd(f),
          stops: [],
          members: m.map((l) => l.id),
          line: set.kind === 'line' ? valid.inputLine.get(m[0].id) : undefined,
          carries: [],
        })
      }
      // A station off the trunk rides on the lane of the line that carries it: the earliest
      // fork, then the heaviest, then by id.
      const carried = new Set<string>()
      for (const s of mine) {
        if (onTrunk.has(s.id)) continue
        const host = drafts
          .filter((d) => d.to === s.id && d.status !== 'dropped' && d.y1 < Y(s.id))
          .sort((a, b) => a.y1 - b.y1 || b.weight - a.weight || cmp(a.id, b.id))[0]
        if (host) {
          host.carries = [s.id]
          carried.add(s.id)
        }
      }
      const more = sets.find((s) => s.kind === 'more')
      if (more && more.members.length) {
        const top = more.members.map((l) => ({ l, f: forkOf(l) })).sort((a, b) => a.f.y - b.f.y || cmp(a.l.id, b.l.id))[0]
        const stops = [...new Set(more.members.filter((l) => l.to && l.status !== 'dropped').map((l) => l.to!))]
          .filter((id) => !onTrunk.has(id) && !carried.has(id) && Y(id) > top.f.y)
          .sort((a, b) => Y(a) - Y(b) || cmp(a, b))
        for (const id of stops) carried.add(id)
        const m = more.members
        drafts.push({
          id: more.id, kind: 'more', label: `${m.length} more`,
          status: common(m.map((l) => l.status)) ?? 'active', style: common(m.map((l) => l.style ?? 'solid')) ?? 'solid',
          weight: m.reduce((a, l) => a + (l.weight ?? 1), 0), marks: sumMarks(m),
          from: top.f.from, to: stops[stops.length - 1] ?? null, y1: top.f.y, y2: stops.length ? Y(stops[stops.length - 1]) : openEnd(top.f),
          stops, members: m.map((l) => l.id), carries: stops,
        })
      }
      const loose = mine.filter((s) => !onTrunk.has(s.id) && !carried.has(s.id)).map((s) => s.id).sort((a, b) => Y(a) - Y(b) || cmp(a, b))
      if (loose.length) {
        const f = forkAbove(Y(loose[0]))
        drafts.push({
          id: `spur:${g.id}`, kind: 'spur', label: 'Planned', status: 'active', style: 'dotted', weight: 0,
          from: f.from, to: loose[loose.length - 1], y1: f.y, y2: Y(loose[loose.length - 1]), stops: loose, members: [], carries: loose,
        })
      }
      return drafts
    }
    const spansOf = (drafts: readonly Draft[]): BranchLaneSpan[] =>
      drafts.map((d) => ({
        id: d.id, start: d.y1, end: d.y2, from: d.from, endsAt: d.carries[d.carries.length - 1] ?? null,
        joins: !!d.to && d.status !== 'dropped' && !d.carries.length,
      }))

    const bundle = () => bundleBranchLines(g.id, linesOf.get(g.id)!, { maxLanes: opts.maxLanes, expanded }, (l) => forkOf(l).from, (s) => assignBranchLanes(spansOf(materialize(s))).count)
    const fanSize = (sets: readonly BranchLineSet[]) => materialize(sets).filter((d) => d.from === null && d.y1 === startY).length
    return { bundle, fanSize, place: (sets: BranchLineSet[], index: number) => placeGroup(g, index, sets, materialize, spansOf, trunk, mine) }
  }
  const stages = valid.groups.map(groupStage)
  // Bundle once; rows then make room for the largest fan. Lanes do not change: every row below
  // the start moves down by the same amount.
  const setsOf = stages.map((st) => st.bundle())
  fanRows = Math.max(0, ...stages.map((st, i) => st.fanSize(setsOf[i]) - 1))
  layRows()

  const placeGroup = (
    g: BranchMapGroup,
    index: number,
    sets: BranchLineSet[],
    materialize: (sets: readonly BranchLineSet[]) => Draft[],
    spansOf: (drafts: readonly Draft[]) => BranchLaneSpan[],
    trunk: string[],
    mine: BranchMapStation[],
  ): Placed => {
    const start = { x: trunkX, y: startY }
    const drafts = materialize(sets)
    const lanes = assignBranchLanes(spansOf(drafts))
    drafts
      .filter((d) => d.from === null && d.y1 === startY)
      .sort((a, b) => lanes.lane.get(b.id)! - lanes.lane.get(a.id)! || cmp(a.id, b.id))
      .forEach((d, i) => (d.y1 = startY + i * fanStep))

    const laneOf = new Map<string, number>()
    for (const d of drafts) for (const id of d.carries) laneOf.set(id, lanes.lane.get(d.id)!)
    const stations: BranchMapStationLayout[] = mine
      .map((s) => {
        const lane = onTrunk.has(s.id) ? 0 : laneOf.get(s.id) ?? 0
        return { id: s.id, group: g.id, x: trunkX + lane * opts.laneGap, y: Y(s.id), rank: rank.get(s.id)!, lane, onTrunk: onTrunk.has(s.id), station: s }
      })
      .sort((a, b) => a.y - b.y || cmp(a.id, b.id))
    const lines: BranchMapLineLayout[] = drafts
      .map((d) => ({
        id: d.id, kind: d.kind, group: g.id, label: d.label, status: d.status, style: d.style, weight: d.weight,
        ...(d.marks ? { marks: d.marks } : {}),
        lane: lanes.lane.get(d.id)!, from: d.from, to: d.to, y1: d.y1, y2: d.y2, stops: d.stops, members: d.members,
        ...(d.line ? { line: d.line } : {}),
      }))
      .sort((a, b) => a.lane - b.lane || a.y1 - b.y1 || cmp(a.id, b.id))

    // Labels, against the routed geometry of this group's lines and trunk.
    const stationById = new Map(stations.map((s) => [s.id, s]))
    const segments: [Point, Point][] = []
    const labelLines: BranchLabelLine[] = lines.map((l) => {
      const geo = branchLinePoints(l, { trunkX }, (id) => stationById.get(id), opts)
      for (let i = 1; i < geo.points.length; i++) segments.push([geo.points[i - 1], geo.points[i]])
      return { line: l, run: geo.run }
    })
    const tspan = branchTrunkSpan({ start, trunk }, Y, lines, opts)
    segments.push([{ x: trunkX, y: tspan.y1 }, { x: trunkX, y: tspan.y2 }])
    const { labels, unplaced } = placeBranchMapLabels({
      group: g.id, trunkX, start, laneGap: opts.laneGap, lanes: lanes.count, maxLabelWidth: opts.maxLabelWidth, measure,
      stations, lines: labelLines, segments,
    })
    const right = Math.max(trunkX + lanes.count * opts.laneGap + opts.laneGap / 2, ...labels.map((b) => b.x + b.width))
    const bundled = sets.filter((s) => s.kind !== 'line').reduce((a, s) => a + s.members.length, 0)
    return { group: g, index, trunkX, start, lanes: lanes.count, width: right + RIGHT_PAD, stations, lines, labels, unplaced, bundled }
  }
  const placedGroups: Placed[] = stages.map((st, i) => st.place(setsOf[i], i))

  // ---- Headers and the vertical extent ---------------------------------------------------------
  const headers = placedGroups.map((p) => wrapBranchMapLabel(p.group.label, 'group', opts.maxLabelWidth, measure))
  const headerHeight = Math.max(BRANCH_MAP_TEXT.group.lineHeight, ...headers.map((h) => h.height))
  const tops: number[] = [startY - BRANCH_MAP_MARK.start]
  const bottoms: number[] = [startY + BRANCH_MAP_MARK.start]
  for (const p of placedGroups) {
    for (const s of p.stations) {
      tops.push(s.y - BRANCH_MAP_MARK.station)
      bottoms.push(s.y + BRANCH_MAP_MARK.station)
    }
    for (const l of p.lines) {
      tops.push(l.y1)
      bottoms.push(l.y2)
    }
    for (const b of p.labels) {
      tops.push(b.y)
      bottoms.push(b.y + b.height)
    }
    const t = branchTrunkSpan({ start: p.start, trunk: trunkOf.get(p.group.id)! }, Y, p.lines, opts)
    tops.push(t.y1)
    bottoms.push(t.y2)
  }
  const headerY = Math.min(...tops) - HEADER_GAP - headerHeight
  const dy = PAD - headerY

  // ---- Pack groups left to right ------------------------------------------------------------
  const groups: BranchMapGroupLayout[] = []
  const stations: BranchMapStationLayout[] = []
  const lines: BranchMapLineLayout[] = []
  const labels: BranchMapLabelBox[] = []
  const unplacedLabels: BranchMapUnplacedLabel[] = []
  let x = PAD
  placedGroups.forEach((p, i) => {
    const header = headers[i]
    const width = Math.max(p.width, header.width + RIGHT_PAD)
    const mine = stationsOf.get(p.group.id)!
    groups.push({
      id: p.group.id, label: p.group.label, index: p.index, color: p.group.color ?? p.index, x, width,
      trunkX: x + p.trunkX, start: { x: x + p.start.x, y: p.start.y + dy }, lanes: p.lanes, trunk: trunkOf.get(p.group.id)!,
      counts: {
        lines: linesOf.get(p.group.id)!.length,
        stops: mine.filter((s) => s.kind === 'stop').length,
        decisions: mine.filter((s) => s.kind === 'decision').length,
        blocked: mine.filter((s) => s.blocked).length,
        bundled: p.bundled,
      },
    })
    labels.push({ role: 'group', target: p.group.id, group: p.group.id, text: p.group.label, lines: header.lines, truncated: header.truncated, x, y: PAD, width: header.width, height: header.height, anchor: 'start' })
    for (const s of p.stations) stations.push({ ...s, x: s.x + x, y: s.y + dy })
    for (const l of p.lines) lines.push({ ...l, y1: l.y1 + dy, y2: l.y2 + dy })
    for (const b of p.labels) labels.push({ ...b, x: b.x + x, y: b.y + dy })
    unplacedLabels.push(...p.unplaced)
    x += width + opts.groupGap
  })

  issues.sort((a, b) => cmp(a.kind, b.kind) || cmp(a.ids.join(' '), b.ids.join(' ')) || cmp(a.message, b.message))
  return {
    options: opts,
    groups,
    stations,
    lines,
    links: valid.links,
    labels,
    unplacedLabels,
    bounds: { x: 0, y: 0, width: Math.max(0, x - opts.groupGap) + PAD, height: Math.max(...bottoms) + dy + PAD },
    issues,
  }
}

/** Placement and routing in one call. Pure: memoize on `data` and `options`. */
export function branchMapScene(data: BranchMapData, options: BranchMapOptions = {}): BranchMapScene {
  return routeBranchMap(layoutBranchMap(data, options))
}
