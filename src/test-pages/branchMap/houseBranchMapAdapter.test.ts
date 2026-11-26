import { describe, expect, it } from 'vitest'
import { branchMapScene, type BranchMapData, type BranchMapScene } from '../../utils/branchMap'
import { houseOrganizingSnapshot as SNAPSHOT } from '../fixtures/houseOrganizingSnapshot'
import type { HouseGate, HouseMilestone, HouseOrganizingSnapshot, HouseWorkstream } from '../fixtures/houseOrganizingTypes'
import {
  GATE_STATUS,
  HOUSE_PROJECT_COLORS,
  MILESTONE_STATUS,
  WORKSTREAM_STATUS,
  houseToBranchMap,
  workstreamStyle,
  type HouseLineData,
  type HouseStationData,
} from './houseBranchMapAdapter'

// ---- A small hand-built snapshot, for the rules one at a time --------------------------------

const ms = (ref: string, project: string, status: HouseMilestone['status'], extra: Partial<HouseMilestone> = {}): HouseMilestone => ({
  ref, name: `M ${ref}`, project, status, criteria: [0, 0], dependsOn: [], ...extra,
})
const gate = (ref: string, project: string, status: HouseGate['status'], extra: Partial<HouseGate> = {}): HouseGate => ({
  ref, name: `G ${ref}`, project, status, question: '?', criteria: [0, 0], opens: [], dependsOn: [], ...extra,
})
const ws = (ref: string, project: string, extra: Partial<HouseWorkstream> = {}): HouseWorkstream => ({
  ref, name: `W ${ref}`, project, status: 'active', mode: 'delivery', leadsTo: null, openedBy: [], dependsOn: [],
  tasks: { open: 0, done: 0, inProgress: 0 }, openTasks: [], ...extra,
})

const SMALL: HouseOrganizingSnapshot = {
  snapshot: '2026-11-25',
  projects: [{ id: 'p', name: 'Project P' }, { id: 'q', name: 'Project Q' }, { id: 'r', name: 'Project R' }],
  milestones: [
    ms('p-done', 'p', 'reached', { reachedOn: '2026-11-01', criteria: [3, 3] }),
    ms('p-1', 'p', 'active', { dependsOn: ['p-done'], criteria: [1, 4] }),
    ms('p-2', 'p', 'proposed', { dependsOn: ['p-1'] }),
    ms('p-3', 'p', 'proposed', { dependsOn: ['p-done'] }),
    ms('p-aside', 'p', 'set_aside'),
    ms('q-1', 'q', 'proposed', { dependsOn: ['p-2'] }),
    ms('q-tasks', 'q', 'proposed', { waitsOnTasks: ['Order the parts'] }),
    ms('r-1', 'r', 'proposed'),
  ],
  gates: [
    gate('p-g', 'p', 'open', { opens: ['p-3', 'w-opened'] }),
    gate('p-g-done', 'p', 'decided', { decidedOn: '2026-11-02', opens: ['w-late'] }),
  ],
  workstreams: [
    ws('w-start', 'p', { leadsTo: 'p-1', tasks: { open: 4, done: 2, inProgress: 1 } }),
    ws('w-opened', 'p', { leadsTo: 'p-3', openedBy: ['p-g'] }),
    ws('w-late', 'p', { leadsTo: 'p-2', openedBy: ['p-g-done'], dependsOn: ['p-1'] }),
    ws('w-explore', 'p', { leadsTo: 'p-g', mode: 'exploration' }),
    ws('w-aside', 'p', { leadsTo: 'p-aside', status: 'set_aside', mode: 'exploration' }),
    ws('w-done', 'p', { leadsTo: 'p-done', status: 'done', tasks: { open: 0, done: 5, inProgress: 0 } }),
    ws('w-cross', 'q', { leadsTo: 'q-1', dependsOn: ['p-1'] }),
  ],
  interfaces: [
    { ref: 'i-1', name: 'P API', status: 'active', providers: ['p'], users: ['q', 'r', 'p'], milestones: ['p-done', 'p-2', 'p-1'] },
    { ref: 'i-2', name: 'Q feed', status: 'active', providers: ['q'], users: ['p'], milestones: [] },
    { ref: 'i-3', name: 'Old', status: 'retired', providers: ['p'], users: ['q'], milestones: [] },
  ],
}

const byId = <T extends { id: string }>(xs: readonly T[]) => new Map(xs.map((x) => [x.id, x]))

describe('house branch map adapter > maps workstreams, interfaces and blocked as House does', () => {
  const data = houseToBranchMap(SMALL)
  const stations = byId(data.stations)
  const lines = byId(data.lines)

  it('maps projects to groups with stable colours, in the order asked', () => {
    const shown = houseToBranchMap(SMALL, { projects: ['r', 'p', 'unknown'] })
    expect(shown.groups.map((g) => [g.id, g.label])).toEqual([['r', 'Project R'], ['p', 'Project P']])
    const real = houseToBranchMap(SNAPSHOT, { projects: ['heimdall', 'dr_viewer'] })
    expect(real.groups.map((g) => g.color)).toEqual([HOUSE_PROJECT_COLORS.heimdall, HOUSE_PROJECT_COLORS.dr_viewer])
  })

  it('gives the milestones that deliver an interface as trunk waypoints, in depends_on order, else none', () => {
    const groups = byId(data.groups)
    expect(groups.get('p')?.trunk).toEqual(['p-1', 'p-2']) // p-done is closed, so not shown from now on
    expect(groups.get('q')?.trunk).toBeUndefined() // delivers nothing: the trunk is all derived
    expect(groups.get('r')?.trunk).toBeUndefined()
    expect(byId(houseToBranchMap(SMALL, { horizon: 'all' }).groups).get('p')?.trunk).toEqual(['p-done', 'p-1', 'p-2'])
    const retiredOnly: HouseOrganizingSnapshot = { ...SMALL, interfaces: SMALL.interfaces.map((i) => ({ ...i, status: 'retired' as const })) }
    expect(byId(houseToBranchMap(retiredOnly).groups).get('p')?.trunk).toBeUndefined()
  })

  it('maps milestones to stops and gates to decisions; the forward horizon keeps open work only', () => {
    expect(stations.get('p-1')).toMatchObject({ kind: 'stop', status: 'active', group: 'p', label: 'M p-1', progress: [1, 4] })
    expect(stations.get('p-g')).toMatchObject({ kind: 'decision', status: 'active' })
    expect(stations.get('p-aside')?.status).toBe('set-aside')
    expect(stations.has('p-done')).toBe(false)
    expect(stations.has('p-g-done')).toBe(false)
    expect(lines.has('w-done')).toBe(false)
    expect(lines.has('w-aside')).toBe(true)
    expect(stations.get('p-2')?.progress).toBeUndefined() // no criteria

    const all = houseToBranchMap(SMALL, { horizon: 'all' })
    expect(byId(all.stations).get('p-done')).toMatchObject({ status: 'done', date: '2026-11-01' })
    expect(byId(all.stations).get('p-g-done')).toMatchObject({ kind: 'decision', status: 'done', date: '2026-11-02' })
    expect(byId(all.lines).get('w-done')?.status).toBe('done')
  })

  it('maps every House status', () => {
    expect(MILESTONE_STATUS).toEqual({ proposed: 'planned', active: 'active', reached: 'done', set_aside: 'set-aside', dropped: 'dropped' })
    expect(GATE_STATUS).toEqual({ open: 'active', decided: 'done', set_aside: 'set-aside', dropped: 'dropped' })
    expect(WORKSTREAM_STATUS).toEqual({ active: 'active', done: 'done', set_aside: 'set-aside', dropped: 'dropped' })
  })

  it('orders stations by depends_on and opens within a project, never across', () => {
    expect(stations.get('p-2')?.after).toEqual(['p-1'])
    expect(stations.get('p-3')?.after).toEqual(['p-g']) // opened by the gate; p-done is closed and hidden
    expect(stations.get('q-1')?.after).toBeUndefined() // its wait is in p: a link, not an after
    expect(byId(houseToBranchMap(SMALL, { horizon: 'all' }).stations).get('p-3')?.after).toEqual(['p-done', 'p-g'])
  })

  it('starts a line at the latest gate that opened it or station it waits on, else at the start', () => {
    expect(lines.get('w-start')).toMatchObject({ from: null, to: 'p-1' })
    expect(lines.get('w-opened')).toMatchObject({ from: 'p-g', to: 'p-3' })
    expect(lines.get('w-late')).toMatchObject({ from: 'p-1', to: 'p-2' }) // the gate is closed and hidden
    // Whole history: the decided gate (closed) comes before the open p-1, so p-1 is still latest.
    expect(byId(houseToBranchMap(SMALL, { horizon: 'all' }).lines).get('w-late')?.from).toBe('p-1')
    expect(lines.get('w-cross')?.from).toBeNull() // waits on another project: not a start
  })

  it('styles explorations dashed and set-aside lines dotted, and carries tasks as marks', () => {
    expect(lines.get('w-start')?.style).toBe('solid')
    expect(lines.get('w-explore')?.style).toBe('dashed')
    expect(lines.get('w-aside')).toMatchObject({ style: 'dotted', status: 'set-aside' })
    expect(workstreamStyle({ status: 'active', mode: 'exploration' })).toBe('dashed')
    expect(lines.get('w-start')?.marks).toEqual({ total: 4, emphasized: 1 })
    expect(lines.get('w-opened')?.marks).toBeUndefined()
  })

  it('weighs lines by streams or by tasks', () => {
    expect(lines.get('w-start')?.weight).toBe(1)
    const tasks = byId(houseToBranchMap(SMALL, { widthBy: 'tasks' }).lines)
    expect(tasks.get('w-start')?.weight).toBe(6)
    expect(tasks.get('w-opened')?.weight).toBe(1) // never below 1
  })

  it('maps depends_on across projects to dependency links, from what is waited on', () => {
    const deps = data.links!.filter((l) => l.kind === 'dependency')
    expect(deps).toEqual([
      { id: 'dep:p-2->q-1', kind: 'dependency', from: 'p-2', to: 'q-1' },
      { id: 'dep:p-1->q-1', kind: 'dependency', from: 'p-1', to: 'q-1' }, // w-cross's wait, on its destination
    ])
    expect(houseToBranchMap(SMALL, { projects: ['q'] }).links!.filter((l) => l.kind === 'dependency')).toEqual([])
  })

  it('maps interfaces to provides links from the next open delivering milestone to each user', () => {
    const provides = data.links!.filter((l) => l.kind === 'provides')
    expect(provides).toEqual([
      { id: 'if:i-1:p->q', kind: 'provides', from: 'p-1', to: 'q', label: 'P API' }, // p-done is closed; p-1 before p-2
      { id: 'if:i-1:p->r', kind: 'provides', from: 'p-1', to: 'r', label: 'P API' },
      { id: 'if:i-2:q->p', kind: 'provides', from: 'q', to: 'p', label: 'Q feed' }, // no milestone: the start marker
    ])
    const noR = houseToBranchMap(SMALL, { projects: ['p', 'q'] }).links!.filter((l) => l.kind === 'provides')
    expect(noR.map((l) => l.id)).toEqual(['if:i-1:p->q', 'if:i-2:q->p'])
  })

  it('derives blocked as House does: waits on open work or on a task', () => {
    expect(stations.get('p-1')?.blocked).toBe(false) // waits on a reached milestone: order only
    expect(stations.get('p-2')?.blocked).toBe(true)
    expect(stations.get('q-1')?.blocked).toBe(true) // across projects, even with p hidden
    expect(byId(houseToBranchMap(SMALL, { projects: ['q'] }).stations).get('q-1')?.blocked).toBe(true)
    expect(stations.get('q-tasks')?.blocked).toBe(true)
    expect(stations.get('r-1')?.blocked).toBe(false)
  })

  it('passes the House record through as data', () => {
    expect((stations.get('p-g')?.data as HouseStationData).kind).toBe('gate')
    expect((lines.get('w-start')?.data as HouseLineData).record.ref).toBe('w-start')
  })
})

// ---- The whole 2026-11-25 snapshot ---------------------------------------------------------

/** Every reference in the data resolves, and ids are unique. */
function expectResolved(data: BranchMapData) {
  const groups = new Set(data.groups.map((g) => g.id))
  const stations = new Map(data.stations.map((s) => [s.id, s]))
  const ids = [...data.groups, ...data.stations, ...data.lines, ...(data.links ?? [])].map((x) => x.id)
  expect(new Set(ids).size).toBe(ids.length)
  for (const s of data.stations) {
    expect(groups.has(s.group)).toBe(true)
    for (const a of s.after ?? []) expect(stations.get(a)?.group).toBe(s.group)
  }
  for (const l of data.lines) {
    expect(groups.has(l.group)).toBe(true)
    if (l.from) expect(stations.get(l.from)?.group).toBe(l.group)
    if (l.to) expect(stations.get(l.to)?.group).toBe(l.group)
  }
  for (const k of data.links ?? []) {
    expect(stations.has(k.from) || groups.has(k.from)).toBe(true)
    expect(k.kind === 'provides' ? groups.has(k.to) : stations.has(k.to)).toBe(true)
  }
}

describe('house branch map adapter > the 2026-11-25 snapshot', () => {
  it('maps every milestone, gate and workstream over the whole history', () => {
    const data = houseToBranchMap(SNAPSHOT, { horizon: 'all' })
    expect(data.groups).toHaveLength(7)
    expect(data.stations).toHaveLength(SNAPSHOT.milestones.length + SNAPSHOT.gates.length)
    expect(data.lines).toHaveLength(SNAPSHOT.workstreams.length)
    const project = new Map([...SNAPSHOT.milestones, ...SNAPSHOT.gates, ...SNAPSHOT.workstreams].map((n) => [n.ref, n.project]))
    for (const x of [...data.stations, ...data.lines]) expect(x.group).toBe(project.get(x.id))
    // Every workstream has a destination in its own project.
    expect(data.lines.every((l) => l.to !== null)).toBe(true)
    expectResolved(data)
  })

  it('keeps only open work from now on', () => {
    const data = houseToBranchMap(SNAPSHOT)
    const open = (s: string) => ['proposed', 'active', 'set_aside', 'open'].includes(s)
    expect(data.stations).toHaveLength([...SNAPSHOT.milestones, ...SNAPSHOT.gates].filter((n) => open(n.status)).length)
    expect(data.lines).toHaveLength(SNAPSHOT.workstreams.filter((w) => w.status === 'active' || w.status === 'set_aside').length)
    expect(data.stations.every((s) => s.status !== 'done' && s.date === undefined)).toBe(true)
    expectResolved(data)
    const perGroup = (id: string) => data.lines.filter((l) => l.group === id).length
    expect(perGroup('documentation_robotics')).toBe(20)
    expect(perGroup('claude_plugins')).toBe(17)
  })

  it('draws the cross-project waits and the interfaces between different projects', () => {
    const all = houseToBranchMap(SNAPSHOT, { horizon: 'all' }).links!
    expect(all.filter((l) => l.kind === 'dependency')).toHaveLength(4)
    // 7 active interfaces, 10 provider-to-user pairs, one of them a project using its own.
    expect(all.filter((l) => l.kind === 'provides')).toHaveLength(9)
  })
})

// ---- Layout over the snapshot --------------------------------------------------------------

interface Box { x: number; y: number; width: number; height: number }
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
/** A station mark's box: a diamond reaches about 7 px from its centre. */
const markBox = (s: { x: number; y: number }): Box => ({ x: s.x - 7, y: s.y - 7, width: 14, height: 14 })

function overlapsIn(scene: BranchMapScene): string[] {
  const found: string[] = []
  const marks = scene.stations.map((s) => ({ id: s.id, box: markBox(s) }))
  for (let i = 0; i < marks.length; i++)
    for (let j = i + 1; j < marks.length; j++) if (overlaps(marks[i].box, marks[j].box)) found.push(`station ${marks[i].id} / ${marks[j].id}`)
  for (let i = 0; i < scene.labels.length; i++) {
    const a = scene.labels[i]
    for (let j = i + 1; j < scene.labels.length; j++) if (overlaps(a, scene.labels[j])) found.push(`label ${a.target} / ${scene.labels[j].target}`)
    for (const m of marks) if (overlaps(a, m.box)) found.push(`label ${a.target} / station ${m.id}`)
    const g = scene.groups.find((q) => q.id === a.group)!
    if (a.x < g.x || a.x + a.width > g.x + g.width) found.push(`label ${a.target} outside group ${g.id}`)
  }
  for (let i = 0; i < scene.groups.length; i++)
    for (let j = i + 1; j < scene.groups.length; j++) {
      const a = scene.groups[i]
      const b = scene.groups[j]
      if (a.x < b.x + b.width && b.x < a.x + a.width) found.push(`group ${a.id} / ${b.id}`)
    }
  return found
}

describe('branch map layout > no stations, labels or groups overlap on the House snapshot', () => {
  for (const horizon of ['forward', 'all'] as const) {
    it(`all seven projects, ${horizon === 'forward' ? 'from now' : 'whole history'}`, () => {
      const scene = branchMapScene(houseToBranchMap(SNAPSHOT, { horizon }))
      expect(scene.issues).toEqual([])
      // Every station and group is named: placed, or left for hover and the inspector.
      const named = new Set([...scene.labels, ...scene.unplacedLabels].map((l) => `${l.role}:${l.target}`))
      for (const s of scene.stations) expect(named.has(`station:${s.id}`)).toBe(true)
      for (const g of scene.groups) expect(named.has(`group:${g.id}`)).toBe(true)
      expect(scene.labels.length).toBeGreaterThan(scene.stations.length / 2)
      expect(scene.groups.every((g) => g.lanes <= scene.options.maxLanes)).toBe(true)
      expect(overlapsIn(scene)).toEqual([])
    })
  }
})
