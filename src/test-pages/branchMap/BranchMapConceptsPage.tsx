import { useEffect, useMemo, useState } from 'react'
import { SegmentedControl } from '../../components/SegmentedControl'
import { Chip, type ChipVariant } from '../../components/Chip'
import { KVGrid } from '../../components/KVGrid'
import { ProgressBar } from '../../components/ProgressBar'
import { houseOrganizingSnapshot as DATA } from '../fixtures/houseOrganizingSnapshot'
import {
  layoutBranchMap,
  type BranchMapGeometry,
  type BranchMapHorizon,
  type BranchMapLine,
  type BranchMapRows,
  type BranchMapScene,
  type BranchMapStation,
  type BranchMapWidth,
} from './branchMapLayout'
import './BranchMapConceptsPage.css'

// Concept page for a vertical branch map of House project organization.
//   ?example=branch-map-concepts&concept=metro|commit-metro|commit|flow|portfolio&horizon=forward|all
//   &width=none|streams|tasks&tasks=0|1&links=0|1&projects=heimdall,dr_viewer&select=<ref>&dark=1
const params = new URLSearchParams(window.location.search)

type ConceptId = 'metro' | 'commit-metro' | 'commit' | 'flow' | 'portfolio'
interface Concept {
  label: string
  blurb: string
  geometry: BranchMapGeometry
  rows: BranchMapRows
  widthBy: BranchMapWidth
  projects: string[]
  rowGap: number
  rankGap: number
  laneGap: number
  labelRoom: number
  projectGap: number
  minColumnWidth?: number
  labels: 'stations' | 'table' | 'trunk'
  tasks: boolean
  links: boolean
}

const ALL = DATA.projects.map((p) => p.id)
const CONCEPTS: Record<ConceptId, Concept> = {
  metro: {
    label: 'Metro bands',
    blurb: 'Stations share a rank band; 45° branches; labels beside each project like a line diagram.',
    geometry: 'metro', rows: 'bands', widthBy: 'none', projects: ['heimdall', 'dr_viewer', 'context_studio'],
    rowGap: 22, rankGap: 16, laneGap: 18, labelRoom: 230, projectGap: 36, labels: 'stations', tasks: true, links: true,
  },
  'commit-metro': {
    label: 'Commit graph + metro',
    blurb: 'One row per station with a table for the names, as in the commit graph, but branches leave and rejoin at 45° like the metro map.',
    geometry: 'metro', rows: 'per-station', widthBy: 'none', projects: ['heimdall', 'dr_viewer', 'context_studio'],
    rowGap: 24, rankGap: 0, laneGap: 13, labelRoom: 0, projectGap: 18, minColumnWidth: 160, labels: 'table', tasks: false, links: true,
  },
  commit: {
    label: 'Commit graph',
    blurb: 'One row per station, git-log style; curved forks and joins; a table carries the names.',
    geometry: 'git', rows: 'per-station', widthBy: 'none', projects: ['heimdall', 'dr_viewer', 'context_studio'],
    rowGap: 24, rankGap: 0, laneGap: 13, labelRoom: 0, projectGap: 18, minColumnWidth: 160, labels: 'table', tasks: false, links: true,
  },
  flow: {
    label: 'Flow',
    blurb: 'Line width is work: forks thin the trunk, joins thicken it, dead ends never return.',
    geometry: 'metro', rows: 'bands', widthBy: 'tasks', projects: ['heimdall', 'dr_viewer', 'context_studio'],
    rowGap: 22, rankGap: 16, laneGap: 24, labelRoom: 210, projectGap: 36, labels: 'stations', tasks: false, links: true,
  },
  portfolio: {
    label: 'Portfolio',
    blurb: 'Every project at once, compact; interfaces and cross-project waits are the subject.',
    geometry: 'metro', rows: 'bands', widthBy: 'streams', projects: ALL,
    rowGap: 12, rankGap: 10, laneGap: 9, labelRoom: 34, projectGap: 30, minColumnWidth: 120, labels: 'trunk', tasks: false, links: true,
  },
}

// One line colour per project, in snapshot order: Context Studio, DR Viewer, Documentation Robotics,
// Heimdall, Reference API Buddy, House MCP, Claude Plugins.
const COLOR_TOKENS = ['--graph-layer-3', '--graph-layer-1', '--graph-layer-2', '--graph-layer-5', '--graph-layer-4', '--graph-layer-6', '--graph-layer-12']
const projectColor = (p: string) => `rgb(var(${COLOR_TOKENS[ALL.indexOf(p) % COLOR_TOKENS.length]}))`

const statusVariant = (s: string): ChipVariant =>
  s === 'reached' || s === 'decided' || s === 'done' ? 'emerald' : s === 'active' || s === 'open' ? 'cyan' : s === 'set_aside' ? 'amber' : s === 'dropped' ? 'rose' : 'neutral'

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, Math.max(1, n - 1))}…` : s)

export default function BranchMapConceptsPage() {
  const initial = (params.get('concept') as ConceptId) in CONCEPTS ? (params.get('concept') as ConceptId) : 'metro'
  const [concept, setConcept] = useState<ConceptId>(initial)
  const preset = CONCEPTS[concept]
  const [horizon, setHorizon] = useState<BranchMapHorizon>((params.get('horizon') as BranchMapHorizon) ?? 'forward')
  const [widthBy, setWidthBy] = useState<BranchMapWidth>((params.get('width') as BranchMapWidth) ?? preset.widthBy)
  const [tasks, setTasks] = useState(params.has('tasks') ? params.get('tasks') === '1' : preset.tasks)
  const [links, setLinks] = useState(params.has('links') ? params.get('links') === '1' : preset.links)
  const [projects, setProjects] = useState<string[]>(params.get('projects')?.split(',') ?? preset.projects)
  const [selected, setSelected] = useState<string | null>(params.get('select'))
  const [dark, setDark] = useState(params.get('dark') === '1')

  useEffect(() => {
    document.body.classList.toggle('dark-canvas', dark)
    return () => document.body.classList.remove('dark-canvas')
  }, [dark])

  const pickConcept = (c: ConceptId) => {
    setConcept(c)
    setWidthBy(CONCEPTS[c].widthBy)
    setTasks(CONCEPTS[c].tasks)
    setLinks(CONCEPTS[c].links)
    setProjects(CONCEPTS[c].projects)
    setSelected(null)
  }
  const toggleProject = (p: string) =>
    setProjects((cur) => (cur.includes(p) ? (cur.length > 1 ? cur.filter((q) => q !== p) : cur) : ALL.filter((q) => cur.includes(q) || q === p)))

  const scene = useMemo(
    () =>
      layoutBranchMap(DATA, {
        projects,
        horizon,
        widthBy,
        geometry: preset.geometry,
        rows: preset.rows,
        rowGap: preset.rowGap,
        rankGap: preset.rankGap,
        laneGap: preset.laneGap,
        labelRoom: preset.labelRoom,
        projectGap: preset.projectGap,
        minColumnWidth: preset.minColumnWidth,
      }),
    [projects, horizon, widthBy, preset],
  )

  const related = useMemo(() => relatedSet(scene, selected), [scene, selected])

  return (
    <div className="bmc">
      <header className="bmc__head">
        <div>
          <div className="bmc__eyebrow">HOUSE · ORGANIZING SNAPSHOT {DATA.snapshot}</div>
          <h1 className="bmc__title">Branch map concepts</h1>
          <p className="bmc__blurb">{preset.blurb}</p>
        </div>
        <div className="bmc__controls">
          <Control label="CONCEPT">
            <SegmentedControl value={concept} onChange={(v) => pickConcept(v as ConceptId)} options={(Object.keys(CONCEPTS) as ConceptId[]).map((c) => ({ value: c, label: CONCEPTS[c].label }))} />
          </Control>
          <Control label="HORIZON">
            <SegmentedControl value={horizon} onChange={(v) => setHorizon(v as BranchMapHorizon)} options={[{ value: 'forward', label: 'From now' }, { value: 'all', label: 'Whole history' }]} />
          </Control>
          <Control label="WIDTH">
            <SegmentedControl value={widthBy} onChange={(v) => setWidthBy(v as BranchMapWidth)} options={[{ value: 'none', label: 'Off' }, { value: 'streams', label: 'Streams' }, { value: 'tasks', label: 'Tasks' }]} />
          </Control>
          <Control label="TASKS">
            <SegmentedControl value={tasks ? 'on' : 'off'} onChange={(v) => setTasks(v === 'on')} options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]} />
          </Control>
          <Control label="LINKS">
            <SegmentedControl value={links ? 'on' : 'off'} onChange={(v) => setLinks(v === 'on')} options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]} />
          </Control>
          <Control label="CANVAS">
            <SegmentedControl value={dark ? 'dark' : 'light'} onChange={(v) => setDark(v === 'dark')} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
          </Control>
        </div>
        <div className="bmc__projects" role="group" aria-label="Visible projects">
          <span className="bmc__eyebrow">PROJECTS</span>
          {DATA.projects.map((p) => (
            <button key={p.id} type="button" className={`bmc__project${projects.includes(p.id) ? ' is-on' : ''}`} onClick={() => toggleProject(p.id)} aria-pressed={projects.includes(p.id)}>
              <span className="bmc__swatch" style={{ background: projectColor(p.id) }} />
              {p.name}
            </button>
          ))}
        </div>
      </header>
      <div className="bmc__body">
        <div className="bmc__scroll" onClick={() => setSelected(null)}>
          <BranchMapSvg scene={scene} concept={preset} tasks={tasks} links={links} related={related} selected={selected} onSelect={setSelected} />
        </div>
        <Inspector scene={scene} selected={selected} onSelect={setSelected} />
      </div>
    </div>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bmc__control">
      <span className="bmc__eyebrow">{label}</span>
      {children}
    </div>
  )
}

/** The selection, what it waits on and what waits on it (one step), and the lines touching them. */
function relatedSet(scene: BranchMapScene, selected: string | null): Set<string> | null {
  if (!selected) return null
  const out = new Set<string>([selected])
  const line = scene.lines.find((l) => l.id === selected)
  if (line) {
    if (line.fromStation) out.add(line.fromStation)
    if (line.toStation) out.add(line.toStation)
    return out
  }
  const st = scene.stations.find((s) => s.id === selected)
  if (!st) return out
  for (const d of st.data?.dependsOn ?? []) out.add(d)
  for (const s of scene.stations) if (s.data?.dependsOn.includes(selected)) out.add(s.id)
  for (const l of scene.lines) if (l.toStation === selected || l.fromStation === selected) out.add(l.id)
  for (const k of scene.links) if (k.from === selected || k.to === selected) (out.add(k.id), out.add(k.from), out.add(k.to))
  return out
}

interface SvgProps {
  scene: BranchMapScene
  concept: Concept
  tasks: boolean
  links: boolean
  related: Set<string> | null
  selected: string | null
  onSelect: (id: string) => void
}

const TABLE_COLS = [
  { key: 'name', label: 'NAME', w: 300 },
  { key: 'kind', label: 'KIND', w: 82 },
  { key: 'status', label: 'STATUS', w: 86 },
  { key: 'crit', label: 'CRITERIA', w: 70 },
  { key: 'project', label: 'PROJECT', w: 150 },
]

function BranchMapSvg({ scene, concept, tasks, links, related, selected, onSelect }: SvgProps) {
  const table = concept.labels === 'table'
  const tableX = scene.width + 8
  const width = scene.width + (table ? TABLE_COLS.reduce((a, c) => a + c.w, 0) + 24 : 0)
  const dim = (id: string) => (related && !related.has(id) ? ' is-dim' : '')
  const pick = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(id)
  }
  const colName = new Map(scene.columns.map((c) => [c.project, c.name]))
  const rows = [...scene.stations].filter((s) => s.kind !== 'now').sort((a, b) => a.y - b.y || a.x - b.x)

  return (
    <svg className="bmc__svg" width={width} height={scene.height} viewBox={`0 0 ${width} ${scene.height}`} role="img" aria-label="Branch map">
      <defs>
        <marker id="bmc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" className="bmc__arrow" />
        </marker>
      </defs>

      {table && rows.map((s, i) => <rect key={`row:${s.id}`} x={0} y={s.y - concept.rowGap / 2} width={width} height={concept.rowGap} className={`bmc__row${i % 2 ? ' is-odd' : ''}${selected === s.id ? ' is-selected' : ''}`} />)}

      {scene.columns.map((c) => (
        <g key={c.project} className="bmc__colhead">
          <text x={c.x} y={18} className="bmc__colname">{concept.labels !== 'stations' ? clip(c.name, 20) : c.name}</text>
          <text x={c.x} y={32} className="bmc__colmeta">
            {concept.labels !== 'stations' ? `${c.counts.streams} STR · ${c.counts.milestones} MS · ${c.counts.gates} G` : `${c.counts.streams} STREAMS · ${c.counts.milestones} MILESTONES · ${c.counts.gates} GATES${c.counts.blocked ? ` · ${c.counts.blocked} BLOCKED` : ''}`}
          </text>
        </g>
      ))}

      {links && scene.links.map((k) => (
        <g key={k.id} className={`bmc__link bmc__link--${k.kind}${dim(k.id)}`} onClick={pick(k.to)}>
          <path d={k.path} markerEnd={k.kind === 'depends' ? 'url(#bmc-arrow)' : undefined} />
          {k.kind === 'interface' && concept.labels === 'stations' && <text x={k.mid.x + 4} y={k.mid.y - 3}>{clip(k.label ?? '', 28)}</text>}
          <title>{k.kind === 'interface' ? `Interface: ${k.label}` : 'depends_on across projects'}</title>
        </g>
      ))}

      {scene.lines.filter((l) => l.kind === 'trunk').map((l) => (
        <g key={l.id} className={`bmc__trunk${dim(l.id)}`} style={{ color: projectColor(l.project) }}>
          {l.segments!.map((s, i) => (
            <line key={i} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} strokeWidth={s.width} className={i === l.segments!.length - 1 ? 'is-tail' : undefined}>
              <title>{`${l.name} trunk · weight ${Math.round(s.weight)}`}</title>
            </line>
          ))}
        </g>
      ))}

      {scene.lines.filter((l) => l.kind !== 'trunk').map((l) => (
        <BranchLine key={l.id} line={l} concept={concept} tasks={tasks} cls={dim(l.id)} selected={selected === l.id} onPick={pick(l.id)} />
      ))}

      {scene.stations.map((s) => (
        <StationMark key={s.id} s={s} cls={dim(s.id)} selected={selected === s.id} onPick={pick(s.id)} />
      ))}

      {concept.labels === 'stations' &&
        scene.stations.filter((s) => s.kind !== 'now').map((s) => {
          const c = scene.columns.find((q) => q.project === s.project)!
          return (
            <g key={`lab:${s.id}`} className={`bmc__label${s.status === 'reached' || s.status === 'decided' ? ' is-closed' : ''}${dim(s.id)}`} onClick={pick(s.id)}>
              {c.labelX - s.x > 14 && <line x1={s.x + 8} y1={s.y} x2={c.labelX - 3} y2={s.y} className="bmc__leader" />}
              <text x={c.labelX} y={s.y + 4}>
                {clip(s.name, 30)}
                <tspan className="bmc__crit" dx={6}>{s.criteria ? `${s.criteria[0]}/${s.criteria[1]}` : ''}</tspan>
              </text>
            </g>
          )
        })}

      {concept.labels === 'trunk' &&
        scene.stations.filter((s) => s.onTrunk && s.kind === 'milestone').map((s) => (
          <text key={`lab:${s.id}`} x={s.x + 7} y={s.y + 3} className={`bmc__tiny${dim(s.id)}`}>{clip(s.name, 6)}</text>
        ))}

      {table && (
        <g className="bmc__table">
          {(() => {
            let x = tableX
            return TABLE_COLS.map((col) => {
              const cx = x
              x += col.w
              return <text key={col.key} x={cx} y={scene.top - 22} className="bmc__th">{col.label}</text>
            })
          })()}
          {rows.map((s) => {
            let x = tableX
            const cells = [clip(s.name, 44), s.kind, s.status.replace('_', ' '), s.criteria ? `${s.criteria[0]} of ${s.criteria[1]}` : '', colName.get(s.project) ?? '']
            return (
              <g key={`tr:${s.id}`} className={`bmc__tr${dim(s.id)}`} onClick={pick(s.id)}>
                {cells.map((v, i) => {
                  const cx = x
                  x += TABLE_COLS[i].w
                  return <text key={i} x={cx} y={s.y + 4} className={i === 0 ? 'bmc__td bmc__td--name' : 'bmc__td'}>{v}</text>
                })}
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}

function BranchLine({ line: l, concept, tasks, cls, selected, onPick }: { line: BranchMapLine; concept: Concept; tasks: boolean; cls: string; selected: boolean; onPick: (e: React.MouseEvent) => void }) {
  const mods = [`bmc__branch--${l.kind}`, l.mode === 'exploration' ? 'is-exploration' : '', l.status === 'set_aside' ? 'is-aside' : '', l.status === 'done' ? 'is-done' : '', selected ? 'is-selected' : ''].filter(Boolean).join(' ')
  const run = l.run
  const span = run ? run.y2 - run.y1 : 0
  const open = l.data?.tasks.open ?? 0
  const inProg = l.data?.tasks.inProgress ?? 0
  const n = tasks && run ? Math.min(open, Math.floor((span - 10) / 7)) : 0
  const showLabel = run && concept.labels !== 'trunk' && span > 40 && l.kind === 'branch'
  return (
    <g className={`bmc__branch ${mods}${cls}`} style={{ color: projectColor(l.project) }} onClick={onPick}>
      <path d={l.path} className="bmc__halo" strokeWidth={l.width + 4} />
      <path d={l.path} className="bmc__stroke" strokeWidth={l.width} />
      <path d={l.path} className="bmc__hit" />
      {l.end === 'dead' && run && <line x1={run.x - 5} x2={run.x + 5} y1={run.y2} y2={run.y2} className="bmc__cap" />}
      {l.end === 'open' && run && <line x1={run.x} x2={run.x} y1={run.y2} y2={run.y2 + 14} className="bmc__fade" />}
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={run!.x} cy={run!.y1 + 8 + (i * (span - 16)) / Math.max(1, n - 1 || 1)} r={2.3} className={i < inProg ? 'bmc__tick is-progress' : 'bmc__tick'} />
      ))}
      {showLabel && (
        <text className="bmc__lane-label" transform={`translate(${run!.x + l.width / 2 + 3},${run!.y1 + 4}) rotate(90)`}>
          {clip(l.name, Math.floor((span - 8) / 5.6))}
        </text>
      )}
      <title>{`${l.kind === 'spur' ? 'Planned' : l.mode === 'exploration' ? 'Exploration' : 'Workstream'}: ${l.name} (${l.status.replace('_', ' ')})${l.data ? ` · ${l.data.tasks.open} open, ${l.data.tasks.done} done` : ''}`}</title>
    </g>
  )
}

function StationMark({ s, cls, selected, onPick }: { s: BranchMapStation; cls: string; selected: boolean; onPick: (e: React.MouseEvent) => void }) {
  const state = `is-${s.status}${s.blocked ? ' is-blocked' : ''}${selected ? ' is-selected' : ''}${s.onTrunk ? ' on-trunk' : ''}`
  if (s.kind === 'now') {
    return (
      <g className={`bmc__now${cls}`}>
        <rect x={s.x - 8} y={s.y - 2} width={16} height={4} rx={1} />
        <text x={s.x + 11} y={s.y + 3}>NOW</text>
      </g>
    )
  }
  const r = s.onTrunk ? 6 : 5
  return (
    <g className={`bmc__station bmc__station--${s.kind} ${state}${cls}`} style={{ color: projectColor(s.project) }} onClick={onPick} tabIndex={0} role="button" aria-label={`${s.kind} ${s.name}, ${s.status}`}>
      {selected && <circle cx={s.x} cy={s.y} r={r + 5} className="bmc__ring" />}
      {s.kind === 'gate' ? <path d={`M${s.x},${s.y - r - 1} L${s.x + r + 1},${s.y} L${s.x},${s.y + r + 1} L${s.x - r - 1},${s.y} Z`} className="bmc__shape" /> : <circle cx={s.x} cy={s.y} r={r} className="bmc__shape" />}
      {s.blocked && <circle cx={s.x + r} cy={s.y - r} r={2.6} className="bmc__blocked" />}
      <title>{`${s.kind === 'gate' ? 'Gate' : 'Milestone'}: ${s.name} (${s.status.replace('_', ' ')})${s.blocked ? ' · blocked' : ''}`}</title>
    </g>
  )
}

function Inspector({ scene, selected, onSelect }: { scene: BranchMapScene; selected: string | null; onSelect: (id: string) => void }) {
  const st = scene.stations.find((s) => s.id === selected)
  const line = scene.lines.find((l) => l.id === selected)
  const nameOf = (ref: string) => scene.stations.find((s) => s.id === ref)?.name ?? DATA.milestones.find((m) => m.ref === ref)?.name ?? DATA.gates.find((g) => g.ref === ref)?.name ?? ref
  const projectName = (p: string) => DATA.projects.find((q) => q.id === p)?.name ?? p
  const refLink = (ref: string) => (
    <button key={ref} type="button" className="bmc__ref" onClick={() => onSelect(ref)}>{nameOf(ref)}</button>
  )

  return (
    <aside className="bmc__inspector">
      {st && st.kind !== 'now' ? (
        <>
          <div className="bmc__eyebrow">{st.kind.toUpperCase()}</div>
          <h2 className="bmc__ititle">{st.name}</h2>
          <div className="bmc__chips">
            <Chip variant={statusVariant(st.status)}>{st.status.replace('_', ' ')}</Chip>
            {st.blocked && <Chip variant="amber">blocked</Chip>}
            {st.onTrunk && <Chip variant="neutral">trunk</Chip>}
          </div>
          {st.criteria && st.criteria[1] > 0 && <ProgressBar percent={(100 * st.criteria[0]) / st.criteria[1]} label={`${st.criteria[0]} of ${st.criteria[1]} criteria met`} color={st.kind === 'gate' ? 'violet' : 'emerald'} />}
          <KVGrid
            keyWidth={96}
            rows={[
              { key: 'PROJECT', value: projectName(st.project) + (st.data?.subProject ? ` › ${st.data.subProject}` : '') },
              ...(st.kind === 'gate' ? [{ key: 'QUESTION', value: (st.data as { question?: string }).question ?? '' }] : []),
              ...((st.data as { decision?: string })?.decision ? [{ key: 'DECISION', value: (st.data as { decision?: string }).decision }] : []),
              ...(st.data?.aliases?.length ? [{ key: 'ALIASES', value: <span className="bmc__mono">{st.data.aliases.join(', ')}</span> }] : []),
              { key: 'WAITS ON', value: st.data?.dependsOn.length ? <div className="bmc__refs">{st.data.dependsOn.map(refLink)}</div> : '—' },
              ...(st.data?.waitsOnTasks?.length ? [{ key: 'TASKS', value: st.data.waitsOnTasks.join('; ') }] : []),
              { key: 'ARRIVING', value: scene.lines.filter((l) => l.toStation === st.id && l.kind === 'branch').map((l) => l.name).join('; ') || '—' },
            ]}
          />
        </>
      ) : line && line.kind !== 'trunk' ? (
        <>
          <div className="bmc__eyebrow">{line.kind === 'spur' ? 'PLANNED, NO WORKSTREAM' : line.mode === 'exploration' ? 'EXPLORATION' : 'WORKSTREAM'}</div>
          <h2 className="bmc__ititle">{line.name}</h2>
          <div className="bmc__chips">
            <Chip variant={statusVariant(line.status)}>{line.status.replace('_', ' ')}</Chip>
            <Chip variant="neutral">ends: {line.end}</Chip>
          </div>
          <KVGrid
            keyWidth={96}
            rows={[
              { key: 'PROJECT', value: projectName(line.project) },
              { key: 'FROM', value: !line.fromStation ? 'Before this map' : line.fromStation.startsWith('now:') ? 'NOW' : refLink(line.fromStation) },
              { key: 'LEADS TO', value: line.toStation ? refLink(line.toStation) : '—' },
              ...(line.data ? [{ key: 'TASKS', value: <span className="bmc__mono">{`${line.data.tasks.open} open · ${line.data.tasks.inProgress} in progress · ${line.data.tasks.done} done`}</span> }] : []),
              ...(line.data?.question ? [{ key: 'QUESTION', value: line.data.question }] : []),
              ...(line.data?.next ? [{ key: 'NEXT', value: line.data.next }] : []),
              ...(line.data?.openTasks.length ? [{ key: 'OPEN', value: <ul className="bmc__list">{line.data.openTasks.map((t) => <li key={t}>{t}</li>)}</ul> }] : []),
            ]}
          />
        </>
      ) : (
        <>
          <div className="bmc__eyebrow">SELECTION</div>
          <p className="bmc__muted">Select a station or a line to see its House record.</p>
        </>
      )}
      <Legend />
      {scene.issues.length > 0 && (
        <details className="bmc__issues">
          <summary className="bmc__eyebrow">LAYOUT NOTICES · {scene.issues.length}</summary>
          <ul className="bmc__list">{scene.issues.map((i) => <li key={i}>{i}</li>)}</ul>
        </details>
      )}
    </aside>
  )
}

function Legend() {
  const c = 'rgb(var(--graph-layer-2))'
  const item = (svg: React.ReactNode, text: string) => (
    <div className="bmc__legend-item">
      <svg width={34} height={16} style={{ color: c }}>{svg}</svg>
      <span>{text}</span>
    </div>
  )
  return (
    <div className="bmc__legend">
      <div className="bmc__eyebrow">LEGEND</div>
      {item(<circle cx={17} cy={8} r={5} className="bmc__lg-open" />, 'Milestone, active')}
      {item(<circle cx={17} cy={8} r={5} className="bmc__lg-proposed" />, 'Milestone, proposed')}
      {item(<circle cx={17} cy={8} r={5} className="bmc__lg-filled" />, 'Reached / decided')}
      {item(<path d="M17,2 L23,8 L17,14 L11,8 Z" className="bmc__lg-open" />, 'Gate, open')}
      {item(<><circle cx={17} cy={8} r={5} className="bmc__lg-open" /><circle cx={22} cy={3} r={2.6} className="bmc__blocked" /></>, 'Blocked (waits on open work)')}
      {item(<line x1={2} x2={32} y1={8} y2={8} className="bmc__lg-line" />, 'Delivery workstream')}
      {item(<line x1={2} x2={32} y1={8} y2={8} className="bmc__lg-line is-exploration" />, 'Exploration (ends at a gate)')}
      {item(<line x1={2} x2={32} y1={8} y2={8} className="bmc__lg-line is-aside" />, 'Set aside')}
      {item(<line x1={2} x2={32} y1={8} y2={8} className="bmc__lg-line is-spur" />, 'Planned, no workstream yet')}
      {item(<><line x1={2} x2={26} y1={8} y2={8} className="bmc__lg-line" /><line x1={26} x2={26} y1={3} y2={13} className="bmc__lg-line" /></>, 'Dropped (dead end)')}
      {item(<path d="M2,8 L30,8" className="bmc__lg-dep" markerEnd="url(#bmc-arrow)" />, 'depends_on, another project')}
      {item(<path d="M2,8 L32,8" className="bmc__lg-if" />, 'Interface (provides → uses)')}
      {item(<circle cx={17} cy={8} r={2.3} className="bmc__tick is-progress" />, 'Task in progress')}
    </div>
  )
}
