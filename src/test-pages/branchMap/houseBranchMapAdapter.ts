/**
 * House → branch map. Maps how projects are organized in House (the organizing snapshot, typed
 * by houseOrganizingTypes.ts) onto the branch map's vocabulary-free model (BranchMapData). The
 * library knows groups, stations, lines and links; this file is the only place that knows House,
 * and it stays in the test pages (design-reference/branch-map/README.md).
 *
 * | House                              | Branch map                                             |
 * |------------------------------------|--------------------------------------------------------|
 * | project                            | group (one column, one colour)                         |
 * | milestone                          | `stop` station                                         |
 * | gate                               | `decision` station                                     |
 * | workstream                         | line, from where it starts to its `leads_to`           |
 * | depends_on within a project, opens | station `after` (orders ranks, drawn as nothing)        |
 * | depends_on across projects         | `dependency` link                                      |
 * | interface                          | `provides` link, provider's next delivering milestone → |
 * |                                    | each user's start marker                               |
 *
 * House stores no start for a workstream, so a line starts at the latest of the visible stations
 * in its own project that opened it (`opens`) or that it waits on (`depends_on`); failing those,
 * at the group's start marker. "Latest" is: closed stations by the day they closed, then open
 * ones by dependency depth.
 */
import type {
  BranchMapData,
  BranchMapGroup,
  BranchMapLine,
  BranchMapLineStatus,
  BranchMapLineStyle,
  BranchMapLink,
  BranchMapStation,
  BranchMapStationStatus,
} from '../../utils/branchMap'
import type {
  GateStatus,
  HouseGate,
  HouseMilestone,
  HouseOrganizingSnapshot,
  HouseWorkstream,
  MilestoneStatus,
  WorkstreamStatus,
} from '../fixtures/houseOrganizingTypes'

/** `forward`: open work only, from now on. `all`: the whole history, closed work included. */
export type HouseBranchMapHorizon = 'forward' | 'all'

/** What a line weighs: every workstream 1 (`streams`), or its open and done tasks (`tasks`). */
export type HouseBranchMapWidthBy = 'streams' | 'tasks'

export interface HouseBranchMapOptions {
  /** Projects to map, in column order. Default: every project, in snapshot order. */
  projects?: readonly string[]
  /** Default `forward`. */
  horizon?: HouseBranchMapHorizon
  /** Default `streams`. Weight only shows when the map's `width` is `weight`. */
  widthBy?: HouseBranchMapWidthBy
}

/** A station's `data`: the House record it was mapped from. */
export type HouseStationData = { kind: 'milestone'; record: HouseMilestone } | { kind: 'gate'; record: HouseGate }

/** A line's `data`: the workstream it was mapped from. */
export interface HouseLineData {
  kind: 'workstream'
  record: HouseWorkstream
}

/**
 * Palette index (`--graph-layer-<n>`) per project, in snapshot order: Context Studio, DR Viewer,
 * Documentation Robotics, Heimdall, Reference API Buddy, House MCP, Claude Plugins. The same
 * colours as the concept page, and stable when projects are hidden.
 */
export const HOUSE_PROJECT_COLORS: Readonly<Record<string, number>> = {
  context_studio: 3,
  dr_viewer: 1,
  documentation_robotics: 2,
  heimdall: 5,
  reference_api_buddy: 4,
  house_mcp: 6,
  claude_plugins: 12,
}

const OPEN_MILESTONE: ReadonlySet<MilestoneStatus> = new Set(['proposed', 'active', 'set_aside'])
const OPEN_GATE: ReadonlySet<GateStatus> = new Set(['open', 'set_aside'])
const OPEN_STREAM: ReadonlySet<WorkstreamStatus> = new Set(['active', 'set_aside'])

export const MILESTONE_STATUS: Readonly<Record<MilestoneStatus, BranchMapStationStatus>> = {
  proposed: 'planned',
  active: 'active',
  reached: 'done',
  set_aside: 'set-aside',
  dropped: 'dropped',
}

/** An open gate is a question being worked on, so it reads as active. */
export const GATE_STATUS: Readonly<Record<GateStatus, BranchMapStationStatus>> = {
  open: 'active',
  decided: 'done',
  set_aside: 'set-aside',
  dropped: 'dropped',
}

export const WORKSTREAM_STATUS: Readonly<Record<WorkstreamStatus, BranchMapLineStatus>> = {
  active: 'active',
  done: 'done',
  set_aside: 'set-aside',
  dropped: 'dropped',
}

type Organizing = HouseStationData

/** Still open in House's sense: a wait on it holds things up. Reached, decided and dropped do not. */
function isOpen(node: Organizing): boolean {
  return node.kind === 'milestone'
    ? node.record.status !== 'reached' && node.record.status !== 'dropped'
    : node.record.status !== 'decided' && node.record.status !== 'dropped'
}

const closedOn = (node: Organizing) => (node.kind === 'milestone' ? node.record.reachedOn : node.record.decidedOn)

/** A workstream's style: set aside wins (dotted), then exploration (dashed). */
export function workstreamStyle(w: Pick<HouseWorkstream, 'status' | 'mode'>): BranchMapLineStyle {
  if (w.status === 'set_aside') return 'dotted'
  return w.mode === 'exploration' ? 'dashed' : 'solid'
}

/** Maps the snapshot to the branch map's input. Pure; unknown project ids are ignored. */
export function houseToBranchMap(snapshot: HouseOrganizingSnapshot, options: HouseBranchMapOptions = {}): BranchMapData {
  const horizon = options.horizon ?? 'forward'
  const widthBy = options.widthBy ?? 'streams'
  const forward = horizon === 'forward'
  const known = new Set(snapshot.projects.map((p) => p.id))
  const projects = (options.projects ?? snapshot.projects.map((p) => p.id)).filter((p) => known.has(p))
  const visible = new Set(projects)

  // Every organizing node in the snapshot, visible or not: blocked is derived from all of them.
  const everything = new Map<string, Organizing>()
  for (const m of snapshot.milestones) everything.set(m.ref, { kind: 'milestone', record: m })
  for (const g of snapshot.gates) everything.set(g.ref, { kind: 'gate', record: g })

  const shown = (n: Organizing) => visible.has(n.record.project) && (!forward || (n.kind === 'milestone' ? OPEN_MILESTONE.has(n.record.status) : OPEN_GATE.has(n.record.status)))
  const kept = new Map([...everything].filter(([, n]) => shown(n)))
  const projectOf = (ref: string) => kept.get(ref)!.record.project

  // The gates that open each kept node (the inverse of `opens`).
  const openedBy = new Map<string, string[]>()
  for (const g of snapshot.gates) {
    if (!kept.has(g.ref)) continue
    for (const o of g.opens) if (kept.has(o)) openedBy.set(o, [...(openedBy.get(o) ?? []), g.ref])
  }

  // `after`: what a station follows in its own project. Waits across projects become links.
  const after = new Map<string, string[]>()
  for (const [ref, n] of kept) {
    const own = [...n.record.dependsOn, ...(openedBy.get(ref) ?? [])].filter((d) => kept.has(d) && projectOf(d) === n.record.project && d !== ref)
    after.set(ref, [...new Set(own)])
  }

  // Order used to pick a line's start and an interface's next milestone. Closed work by date;
  // open work after it, by longest path over `after` (cycles cut, never thrown).
  const depth = new Map<string, number>()
  const visiting = new Set<string>()
  const depthOf = (ref: string): number => {
    const known = depth.get(ref)
    if (known !== undefined) return known
    if (visiting.has(ref)) return 0
    visiting.add(ref)
    const d = Math.max(0, ...(after.get(ref) ?? []).map((p) => depthOf(p) + 1))
    visiting.delete(ref)
    depth.set(ref, d)
    return d
  }
  const order = (ref: string): [number, string, number] => {
    const n = kept.get(ref)!
    return isOpen(n) ? [1, '', depthOf(ref)] : [0, closedOn(n) ?? '', depthOf(ref)]
  }
  const compare = (a: string, b: string) => {
    const [ka, da, na] = order(a)
    const [kb, db, nb] = order(b)
    return ka - kb || da.localeCompare(db) || na - nb || a.localeCompare(b)
  }

  const groups: BranchMapGroup[] = projects.map((id, i) => ({
    id,
    label: snapshot.projects.find((p) => p.id === id)!.name,
    color: HOUSE_PROJECT_COLORS[id] ?? i,
  }))

  const stations: BranchMapStation[] = []
  for (const [ref, n] of kept) {
    const r = n.record
    const date = isOpen(n) ? undefined : closedOn(n)
    const followed = after.get(ref)!
    stations.push({
      id: ref,
      group: r.project,
      label: r.name,
      kind: n.kind === 'milestone' ? 'stop' : 'decision',
      status: n.kind === 'milestone' ? MILESTONE_STATUS[n.record.status] : GATE_STATUS[n.record.status],
      ...(date ? { date } : {}),
      ...(followed.length ? { after: followed } : {}),
      ...(r.criteria[1] > 0 ? { progress: [r.criteria[0], r.criteria[1]] as const } : {}),
      blocked: isOpen(n) && isBlocked(r, everything),
      data: n satisfies HouseStationData,
    })
  }

  const streams = snapshot.workstreams.filter((w) => visible.has(w.project) && (!forward || OPEN_STREAM.has(w.status)))
  const lines: BranchMapLine[] = streams.map((w) => {
    const starts = [...w.openedBy, ...w.dependsOn].filter((r) => kept.has(r) && projectOf(r) === w.project)
    const ordered = [...new Set(starts)].sort(compare)
    const from = ordered.length ? ordered[ordered.length - 1] : null
    const to = w.leadsTo && kept.has(w.leadsTo) && projectOf(w.leadsTo) === w.project ? w.leadsTo : null
    const open = w.tasks.open
    return {
      id: w.ref,
      group: w.project,
      label: w.name,
      from,
      to,
      status: WORKSTREAM_STATUS[w.status],
      style: workstreamStyle(w),
      weight: widthBy === 'tasks' ? Math.max(1, w.tasks.open + w.tasks.done) : 1,
      ...(open > 0 ? { marks: { total: open, emphasized: Math.min(w.tasks.inProgress, open) } } : {}),
      data: { kind: 'workstream', record: w } satisfies HouseLineData,
    }
  })

  const links: BranchMapLink[] = []
  const seen = new Set<string>()
  const addLink = (l: BranchMapLink) => {
    if (seen.has(l.id)) return
    seen.add(l.id)
    links.push(l)
  }

  // depends_on across projects: from the station waited on to the waiting one. A workstream's
  // wait lands on the station it delivers to, since a line is not a link endpoint.
  for (const [ref, n] of kept) {
    for (const d of n.record.dependsOn) {
      if (kept.has(d) && projectOf(d) !== n.record.project) addLink({ id: `dep:${d}->${ref}`, kind: 'dependency', from: d, to: ref })
    }
  }
  for (const l of lines) {
    const w = (l.data as HouseLineData).record
    for (const d of w.dependsOn) {
      if (l.to && kept.has(d) && projectOf(d) !== w.project) addLink({ id: `dep:${d}->${l.to}`, kind: 'dependency', from: d, to: l.to })
    }
  }

  // Interfaces: from the provider's next open milestone that delivers it (else its start marker)
  // to each other visible project that uses it.
  for (const i of snapshot.interfaces) {
    if (i.status !== 'active') continue
    for (const p of i.providers) {
      if (!visible.has(p)) continue
      const delivering = i.milestones.filter((r) => kept.has(r) && projectOf(r) === p && isOpen(kept.get(r)!)).sort(compare)
      const from = delivering[0] ?? p
      for (const u of i.users) {
        if (u === p || !visible.has(u)) continue
        addLink({ id: `if:${i.ref}:${p}->${u}`, kind: 'provides', from, to: u, label: i.name })
      }
    }
  }

  return { groups, stations, lines, links }
}

/** House's rule: an open node is blocked while it waits on a milestone or gate still open, or on a task. */
export function isBlocked(node: { dependsOn: readonly string[]; waitsOnTasks?: readonly string[] }, nodes: ReadonlyMap<string, Organizing>): boolean {
  return node.dependsOn.some((d) => {
    const n = nodes.get(d)
    return !!n && isOpen(n)
  }) || (node.waitsOnTasks?.length ?? 0) > 0
}
