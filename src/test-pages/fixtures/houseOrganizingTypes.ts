/**
 * How a project is organized in House (House ontology §3.11, Context Studio's House taxonomy):
 * the kinds and edges the branch-map concepts read. Names follow the ontology; edge directions
 * are kept (a `dependsOn` lists what this node waits for or follows).
 */
export type MilestoneStatus = 'proposed' | 'active' | 'reached' | 'set_aside' | 'dropped'
export type GateStatus = 'open' | 'decided' | 'set_aside' | 'dropped'
export type WorkstreamStatus = 'active' | 'set_aside' | 'done' | 'dropped'

export interface HouseProject {
  id: string
  name: string
}

interface OrganizingNode {
  ref: string
  name: string
  /** Top-level project id. */
  project: string
  /** The sub-project it is filed in, rolled up into `project`. */
  subProject?: string
  aliases?: string[]
  /** depends_on: milestones and gates this waits for (open) or follows (already reached/decided). */
  dependsOn: string[]
  /** depends_on to tasks, kept by name. */
  waitsOnTasks?: string[]
}

export interface HouseMilestone extends OrganizingNode {
  status: MilestoneStatus
  /** Criteria met, criteria total. */
  criteria: [number, number]
  reachedOn?: string
  due?: string
}

export interface HouseGate extends OrganizingNode {
  status: GateStatus
  question: string
  criteria: [number, number]
  decision?: string
  decidedOn?: string
  /** opens: milestones and workstreams the gate's decision starts. */
  opens: string[]
}

export interface HouseWorkstream extends OrganizingNode {
  status: WorkstreamStatus
  mode: 'delivery' | 'exploration'
  /** leads_to: its one destination, a milestone or a gate. */
  leadsTo: string | null
  /** The gates whose decision opened it (the inverse of opens). */
  openedBy: string[]
  tasks: { open: number; done: number; inProgress: number }
  openTasks: string[]
  next?: string
  question?: string
  until?: string
}

export interface HouseInterface {
  ref: string
  name: string
  status: 'active' | 'retired'
  providers: string[]
  users: string[]
  /** delivers (inverse): milestones that deliver part of it. */
  milestones: string[]
}

export interface HouseOrganizingSnapshot {
  snapshot: string
  projects: HouseProject[]
  milestones: HouseMilestone[]
  gates: HouseGate[]
  workstreams: HouseWorkstream[]
  interfaces: HouseInterface[]
}
