/**
 * Branch map layout and routing. STUB (piece 0 of the branch map POC, tinkermonkey/heimdall#411):
 * the signatures are final; the bodies are a trivial placement so the view and the adapter can be
 * built against real output. Piece 1 (#412) replaces them with ranking, trunk selection, bundling,
 * lane assignment, label placement and octilinear routing.
 *
 * The stub: groups side by side, each group's stations down its trunk in input order, each line on
 * its own lane (no lane budget), straight routes, no labels, no validation.
 */
import type { Point } from '../graph'
import type {
  BranchMapData,
  BranchMapGroupLayout,
  BranchMapLayout,
  BranchMapLineLayout,
  BranchMapLinkLayout,
  BranchMapOptions,
  BranchMapResolvedOptions,
  BranchMapRoutedLine,
  BranchMapRoutedLink,
  BranchMapScene,
  BranchMapStationLayout,
  BranchMapTrunk,
} from './types'

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

const TOP = 48

/** Placement: positions, lanes, bundles and label boxes. Never throws; bad input goes to `issues`. */
export function layoutBranchMap(data: BranchMapData, options: BranchMapOptions = {}): BranchMapLayout {
  const opts = resolveBranchMapOptions(options)
  const groups: BranchMapGroupLayout[] = []
  const stations: BranchMapStationLayout[] = []
  const lines: BranchMapLineLayout[] = []
  let x = 0
  let bottom = TOP
  data.groups.forEach((g, index) => {
    const mine = data.stations.filter((s) => s.group === g.id)
    const myLines = data.lines.filter((l) => l.group === g.id)
    const trunkX = x + opts.laneGap / 2
    const start = { x: trunkX, y: TOP }
    mine.forEach((s, i) => {
      stations.push({ id: s.id, group: g.id, x: trunkX, y: TOP + (i + 1) * opts.rowGap, rank: i + 1, lane: 0, onTrunk: true, station: s })
    })
    const yOf = (id: string | null) => stations.find((s) => s.id === id)?.y
    myLines.forEach((l, i) => {
      const y1 = yOf(l.from) ?? start.y
      lines.push({
        id: l.id, kind: 'line', group: g.id, label: l.label, status: l.status, style: l.style ?? 'solid', weight: l.weight ?? 1, marks: l.marks,
        lane: i + 1, from: l.from, to: l.to, y1, y2: yOf(l.to) ?? y1 + opts.minBranchRanks * opts.rowGap, stops: [], members: [l.id], line: l,
      })
    })
    const width = (myLines.length + 1) * opts.laneGap + opts.maxLabelWidth
    groups.push({
      id: g.id, label: g.label, index, color: g.color ?? index, x, width, trunkX, start, lanes: myLines.length,
      trunk: mine.map((s) => s.id),
      counts: { lines: myLines.length, stops: mine.filter((s) => s.kind === 'stop').length, decisions: mine.filter((s) => s.kind === 'decision').length, blocked: mine.filter((s) => s.blocked).length, bundled: 0 },
    })
    bottom = Math.max(bottom, TOP + (mine.length + 1) * opts.rowGap, ...lines.map((l) => l.y2))
    x += width + opts.groupGap
  })
  const groupIds = new Set(data.groups.map((g) => g.id))
  const links: BranchMapLinkLayout[] = (data.links ?? []).map((l) => ({
    id: l.id, kind: l.kind, from: l.from, to: l.to, fromGroupStart: groupIds.has(l.from), toGroupStart: groupIds.has(l.to), label: l.label,
  }))
  return {
    options: opts, groups, stations, lines, links, labels: [], unplacedLabels: [],
    bounds: { x: 0, y: 0, width: Math.max(0, x - opts.groupGap), height: bottom + opts.rowGap },
    issues: [],
  }
}

const pathOf = (points: readonly Point[]) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')

/** Routing: line, trunk and link geometry, read from the layout alone. */
export function routeBranchMap(layout: BranchMapLayout): BranchMapScene {
  const { laneGap } = layout.options
  const station = new Map(layout.stations.map((s) => [s.id, s]))
  const group = new Map(layout.groups.map((g) => [g.id, g]))
  const lines: BranchMapRoutedLine[] = layout.lines.map((l) => {
    const g = group.get(l.group)!
    const laneX = g.trunkX + l.lane * laneGap
    const from = l.from ? station.get(l.from) : undefined
    const to = l.to ? station.get(l.to) : undefined
    const points = [{ x: from?.x ?? g.trunkX, y: l.y1 }, { x: laneX, y: l.y1 }, { x: laneX, y: l.y2 }, ...(to ? [{ x: to.x, y: to.y }] : [])]
    return { ...l, points, path: pathOf(points), run: { x: laneX, y1: l.y1, y2: l.y2 }, end: l.status === 'dropped' ? 'dead' : to ? 'join' : 'open', width: 2.5 }
  })
  const trunks: BranchMapTrunk[] = layout.groups.map((g) => {
    const y2 = Math.max(g.start.y + layout.options.rowGap, ...g.trunk.map((id) => station.get(id)?.y ?? 0))
    const from = { x: g.trunkX, y: g.start.y }
    const to = { x: g.trunkX, y: y2 }
    return { group: g.id, x: g.trunkX, y1: from.y, y2, path: pathOf([from, to]), segments: [{ from, to, weight: 1, width: 4 }] }
  })
  const endpoint = (id: string, isGroup: boolean): Point => (isGroup ? group.get(id)?.start : station.get(id)) ?? { x: 0, y: 0 }
  const links: BranchMapRoutedLink[] = layout.links.map((l) => {
    const a = endpoint(l.from, l.fromGroupStart)
    const b = endpoint(l.to, l.toGroupStart)
    const points = [{ x: a.x, y: a.y }, { x: b.x, y: b.y }]
    return { ...l, points, path: pathOf(points), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
  })
  return { ...layout, lines, links, trunks }
}

/** Placement and routing in one call. Pure: memoize on `data` and `options`. */
export function branchMapScene(data: BranchMapData, options: BranchMapOptions = {}): BranchMapScene {
  return routeBranchMap(layoutBranchMap(data, options))
}
