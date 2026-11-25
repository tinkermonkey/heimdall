import { useEffect, useMemo, useState } from 'react'
// @ts-expect-error -- BranchMap is piece 2 of the branch map POC (tinkermonkey/heimdall#413), not in this branch yet. Remove this line when it merges.
import { BranchMap } from '../../components/BranchMap'
import { Chip, type ChipVariant } from '../../components/Chip'
import { KVGrid } from '../../components/KVGrid'
import { ProgressBar } from '../../components/ProgressBar'
import { SegmentedControl } from '../../components/SegmentedControl'
import { layoutBranchMap, type BranchMapLine, type BranchMapLink, type BranchMapStation } from '../../utils/branchMap'
import { houseOrganizingSnapshot as DATA } from '../fixtures/houseOrganizingSnapshot'
import {
  HOUSE_PROJECT_COLORS,
  houseToBranchMap,
  type HouseBranchMapHorizon,
  type HouseLineData,
  type HouseStationData,
} from './houseBranchMapAdapter'
import './BranchMapTestPage.css'

// The branch map POC on House data: houseToBranchMap (this folder) feeding the library's BranchMap.
//   ?example=branch-map&projects=heimdall,dr_viewer&horizon=forward|all&width=off|streams|tasks
//   &expand=<group or bundle ids>&select=<id>&dark=1
const params = new URLSearchParams(window.location.search)

type WidthChoice = 'off' | 'streams' | 'tasks'

const ALL = DATA.projects.map((p) => p.id)
const DEFAULT_PROJECTS = ['heimdall', 'dr_viewer', 'context_studio']
const csv = (key: string) => params.get(key)?.split(',').filter(Boolean)

/** The part of BranchMapItem the page reads. A bundle or "N more" line is not in the input, so the tooltip takes its members from here. */
interface MapItem {
  kind: 'station' | 'line' | 'link' | 'group'
  id: string
  line?: { kind: string; label: string; members: string[] }
}

const projectColor = (p: string) => `rgb(var(--graph-layer-${HOUSE_PROJECT_COLORS[p] ?? 1}))`
const projectName = (p: string) => DATA.projects.find((q) => q.id === p)?.name ?? p
const statusText = (s: string) => s.replace('_', ' ')
const statusVariant = (s: string): ChipVariant =>
  s === 'reached' || s === 'decided' || s === 'done' ? 'emerald' : s === 'active' || s === 'open' ? 'cyan' : s === 'set_aside' ? 'amber' : s === 'dropped' ? 'rose' : 'neutral'

export default function BranchMapTestPage() {
  const [projects, setProjects] = useState<string[]>(() => {
    const asked = csv('projects')?.filter((p) => ALL.includes(p))
    return asked?.length ? asked : DEFAULT_PROJECTS
  })
  const [horizon, setHorizon] = useState<HouseBranchMapHorizon>(params.get('horizon') === 'all' ? 'all' : 'forward')
  const [width, setWidth] = useState<WidthChoice>(() => {
    const w = params.get('width')
    return w === 'streams' || w === 'tasks' ? w : 'off'
  })
  const [expanded, setExpanded] = useState<string[]>(csv('expand') ?? [])
  const [selected, setSelected] = useState<string | null>(params.get('select'))
  const [dark, setDark] = useState(params.get('dark') === '1')

  useEffect(() => {
    document.body.classList.toggle('dark-canvas', dark)
    return () => document.body.classList.remove('dark-canvas')
  }, [dark])

  const data = useMemo(
    () => houseToBranchMap(DATA, { projects, horizon, widthBy: width === 'tasks' ? 'tasks' : 'streams' }),
    [projects, horizon, width],
  )
  // The page's own layout pass, for the caption and the notices only; BranchMap lays out to draw.
  const layout = useMemo(() => layoutBranchMap(data, { expanded, width: width === 'off' ? 'off' : 'weight' }), [data, expanded, width])
  const index = useMemo(
    () => ({
      stations: new Map(data.stations.map((s) => [s.id, s])),
      lines: new Map(data.lines.map((l) => [l.id, l])),
      links: new Map((data.links ?? []).map((k) => [k.id, k])),
    }),
    [data],
  )

  const toggleProject = (p: string) =>
    setProjects((cur) => (cur.includes(p) ? (cur.length > 1 ? cur.filter((q) => q !== p) : cur) : ALL.filter((q) => cur.includes(q) || q === p)))
  const bundled = layout.groups.reduce((a, g) => a + g.counts.bundled, 0)

  return (
    <div className="bmt">
      <header className="bmt__head">
        <div>
          <div className="bmt__eyebrow">HOUSE · ORGANIZING SNAPSHOT {DATA.snapshot}</div>
          <h1 className="bmt__title">Branch map</h1>
          <p className="bmt__blurb">
            Each project runs down from now; workstreams branch off toward the milestone or gate they deliver. Links cross where one project
            waits on another or uses what it provides.
          </p>
        </div>
        <div className="bmt__controls">
          <Control label="HORIZON">
            <SegmentedControl value={horizon} onChange={(v) => setHorizon(v as HouseBranchMapHorizon)} options={[{ value: 'forward', label: 'From now' }, { value: 'all', label: 'Whole history' }]} />
          </Control>
          <Control label="WIDTH">
            <SegmentedControl value={width} onChange={(v) => setWidth(v as WidthChoice)} options={[{ value: 'off', label: 'Off' }, { value: 'streams', label: 'Streams' }, { value: 'tasks', label: 'Tasks' }]} />
          </Control>
          <Control label="CANVAS">
            <SegmentedControl value={dark ? 'dark' : 'light'} onChange={(v) => setDark(v === 'dark')} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
          </Control>
        </div>
        <div className="bmt__projects" role="group" aria-label="Visible projects">
          <span className="bmt__eyebrow">PROJECTS</span>
          {DATA.projects.map((p) => (
            <button key={p.id} type="button" className={`bmt__project${projects.includes(p.id) ? ' is-on' : ''}`} onClick={() => toggleProject(p.id)} aria-pressed={projects.includes(p.id)}>
              <span className="bmt__swatch" style={{ background: projectColor(p.id) }} />
              {p.name}
            </button>
          ))}
        </div>
        <div className="bmt__status">
          <span data-testid="branch-map-caption">
            {`${data.groups.length} projects · ${data.stations.length} stations · ${data.lines.length} lines · ${data.links?.length ?? 0} links · ${bundled} bundled`}
          </span>
          <span data-testid="branch-map-selection">{selected ? `selected ${selected}` : 'selected none'}</span>
          <span data-testid="branch-map-expanded">{`expanded ${expanded.length ? expanded.join(',') : 'none'}`}</span>
        </div>
      </header>
      <div className="bmt__body">
        <BranchMap
          className="bmt__map"
          data-testid="branch-map"
          data={data}
          startLabel="NOW"
          width={width === 'off' ? 'off' : 'weight'}
          expanded={expanded}
          onExpandedChange={setExpanded}
          selectedId={selected}
          onSelect={(id: string | null) => setSelected(id)}
          renderTooltip={(item: MapItem) => <Tooltip item={item} index={index} />}
        />
        <Inspector selected={selected} index={index} expanded={expanded} onSelect={setSelected} />
      </div>
      {layout.issues.length > 0 && (
        <details className="bmt__issues">
          <summary className="bmt__eyebrow">LAYOUT NOTICES · {layout.issues.length}</summary>
          <ul className="bmt__list">{layout.issues.map((i) => <li key={`${i.kind}:${i.ids.join(',')}`}>{i.message}</li>)}</ul>
        </details>
      )}
    </div>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bmt__control">
      <span className="bmt__eyebrow">{label}</span>
      {children}
    </div>
  )
}

interface Index {
  stations: Map<string, BranchMapStation>
  lines: Map<string, BranchMapLine>
  links: Map<string, BranchMapLink>
}

const stationRecord = (s: BranchMapStation | undefined) => s?.data as HouseStationData | undefined
const lineRecord = (l: BranchMapLine | undefined) => (l?.data as HouseLineData | undefined)?.record

function nameOf(index: Index, id: string): string {
  return index.stations.get(id)?.label ?? index.lines.get(id)?.label ?? (ALL.includes(id) ? `${projectName(id)} start` : DATA.milestones.find((m) => m.ref === id)?.name ?? DATA.gates.find((g) => g.ref === id)?.name ?? id)
}

function Tooltip({ item, index }: { item: MapItem; index: Index }) {
  const st = index.stations.get(item.id)
  const ws = lineRecord(index.lines.get(item.id))
  if (st) {
    const rec = stationRecord(st)!
    return (
      <div className="bmt__tip">
        <span className="bmt__eyebrow">{rec.kind === 'gate' ? 'GATE' : 'MILESTONE'}</span>
        <strong>{st.label}</strong>
        <span>{`${statusText(rec.record.status)}${st.blocked ? ' · blocked' : ''}${st.progress ? ` · ${st.progress[0]} of ${st.progress[1]} criteria` : ''}`}</span>
      </div>
    )
  }
  if (ws) {
    return (
      <div className="bmt__tip">
        <span className="bmt__eyebrow">{ws.mode === 'exploration' ? 'EXPLORATION' : 'WORKSTREAM'}</span>
        <strong>{ws.name}</strong>
        <span>{`${statusText(ws.status)} · ${ws.tasks.open} open, ${ws.tasks.done} done`}</span>
      </div>
    )
  }
  if (item.line) {
    return (
      <div className="bmt__tip">
        <span className="bmt__eyebrow">{item.line.kind === 'more' ? 'MORE LINES' : 'BUNDLE'}</span>
        <strong>{item.line.label}</strong>
        <span>{`${item.line.members.length} workstreams; click or Enter to draw them`}</span>
      </div>
    )
  }
  return (
    <div className="bmt__tip">
      <strong>{nameOf(index, item.id)}</strong>
    </div>
  )
}

interface InspectorProps {
  selected: string | null
  index: Index
  expanded: string[]
  onSelect: (id: string) => void
}

function Inspector({ selected, index, expanded, onSelect }: InspectorProps) {
  const st = selected ? index.stations.get(selected) : undefined
  const line = selected ? index.lines.get(selected) : undefined
  const link = selected ? index.links.get(selected) : undefined
  const refLink = (ref: string) => (
    <button key={ref} type="button" className="bmt__ref" onClick={() => onSelect(ref)}>{nameOf(index, ref)}</button>
  )

  let body: React.ReactNode
  if (st) {
    const { kind, record } = stationRecord(st)!
    const arriving = [...index.lines.values()].filter((l) => l.to === st.id)
    body = (
      <>
        <div className="bmt__eyebrow">{kind === 'gate' ? 'GATE' : 'MILESTONE'}</div>
        <h2 className="bmt__ititle">{record.name}</h2>
        <div className="bmt__chips">
          <Chip variant={statusVariant(record.status)}>{statusText(record.status)}</Chip>
          {st.blocked && <Chip variant="amber">blocked</Chip>}
        </div>
        {record.criteria[1] > 0 && (
          <ProgressBar percent={(100 * record.criteria[0]) / record.criteria[1]} label={`${record.criteria[0]} of ${record.criteria[1]} criteria met`} color={kind === 'gate' ? 'violet' : 'emerald'} />
        )}
        <KVGrid
          keyWidth={96}
          rows={[
            { key: 'PROJECT', value: projectName(record.project) + (record.subProject ? ` › ${record.subProject}` : '') },
            ...(kind === 'gate' ? [{ key: 'QUESTION', value: record.question }] : []),
            ...(kind === 'gate' && record.decision ? [{ key: 'DECISION', value: record.decision }] : []),
            ...(record.aliases?.length ? [{ key: 'ALIASES', value: <span className="bmt__mono">{record.aliases.join(', ')}</span> }] : []),
            { key: 'WAITS ON', value: record.dependsOn.length ? <div className="bmt__refs">{record.dependsOn.map(refLink)}</div> : '—' },
            ...(record.waitsOnTasks?.length ? [{ key: 'TASKS', value: record.waitsOnTasks.join('; ') }] : []),
            { key: 'ARRIVING', value: arriving.length ? <div className="bmt__refs">{arriving.map((l) => refLink(l.id))}</div> : '—' },
          ]}
        />
      </>
    )
  } else if (line) {
    const ws = lineRecord(line)!
    body = (
      <>
        <div className="bmt__eyebrow">{ws.mode === 'exploration' ? 'EXPLORATION' : 'WORKSTREAM'}</div>
        <h2 className="bmt__ititle">{ws.name}</h2>
        <div className="bmt__chips">
          <Chip variant={statusVariant(ws.status)}>{statusText(ws.status)}</Chip>
        </div>
        <KVGrid
          keyWidth={96}
          rows={[
            { key: 'PROJECT', value: projectName(ws.project) + (ws.subProject ? ` › ${ws.subProject}` : '') },
            { key: 'FROM', value: line.from ? refLink(line.from) : 'NOW' },
            { key: 'LEADS TO', value: line.to ? refLink(line.to) : '—' },
            { key: 'TASKS', value: <span className="bmt__mono">{`${ws.tasks.open} open · ${ws.tasks.inProgress} in progress · ${ws.tasks.done} done`}</span> },
            ...(ws.question ? [{ key: 'QUESTION', value: ws.question }] : []),
            ...(ws.next ? [{ key: 'NEXT', value: ws.next }] : []),
            ...(ws.openTasks.length ? [{ key: 'OPEN', value: <ul className="bmt__list">{ws.openTasks.map((t) => <li key={t}>{t}</li>)}</ul> }] : []),
          ]}
        />
      </>
    )
  } else if (link) {
    body = (
      <>
        <div className="bmt__eyebrow">{link.kind === 'dependency' ? 'DEPENDS ON, ANOTHER PROJECT' : 'INTERFACE'}</div>
        <h2 className="bmt__ititle">{link.label ?? `${nameOf(index, link.from)} → ${nameOf(index, link.to)}`}</h2>
        <KVGrid
          keyWidth={96}
          rows={[
            { key: link.kind === 'dependency' ? 'WAITED ON' : 'PROVIDER', value: refLink(link.from) },
            { key: link.kind === 'dependency' ? 'WAITING' : 'USER', value: ALL.includes(link.to) ? projectName(link.to) : refLink(link.to) },
          ]}
        />
      </>
    )
  } else if (selected && ALL.includes(selected)) {
    const lines = [...index.lines.values()].filter((l) => l.group === selected)
    body = (
      <>
        <div className="bmt__eyebrow">PROJECT</div>
        <h2 className="bmt__ititle">{projectName(selected)}</h2>
        <KVGrid
          keyWidth={96}
          rows={[
            { key: 'STATIONS', value: [...index.stations.values()].filter((s) => s.group === selected).length },
            { key: 'WORKSTREAMS', value: lines.length },
            { key: 'DRAWN', value: expanded.includes(selected) ? 'every line' : 'bundled past the lane budget' },
          ]}
        />
      </>
    )
  } else {
    body = (
      <>
        <div className="bmt__eyebrow">SELECTION</div>
        <p className="bmt__muted">Select a station or a line to see its House record.</p>
      </>
    )
  }

  return (
    <aside className="bmt__inspector" aria-label="Inspector">
      {body}
      <Legend />
    </aside>
  )
}

function Legend() {
  const item = (svg: React.ReactNode, text: string) => (
    <div className="bmt__legend-item">
      <svg width={34} height={16} aria-hidden="true">{svg}</svg>
      <span>{text}</span>
    </div>
  )
  return (
    <div className="bmt__legend">
      <div className="bmt__eyebrow">LEGEND</div>
      {item(<circle cx={17} cy={8} r={5} className="bmt__lg-open" />, 'Milestone, active')}
      {item(<circle cx={17} cy={8} r={5} className="bmt__lg-planned" />, 'Milestone, proposed')}
      {item(<circle cx={17} cy={8} r={5} className="bmt__lg-done" />, 'Reached or decided')}
      {item(<path d="M17,2 L23,8 L17,14 L11,8 Z" className="bmt__lg-open" />, 'Gate, open')}
      {item(<><circle cx={17} cy={8} r={5} className="bmt__lg-open" /><circle cx={22} cy={3} r={2.6} className="bmt__lg-blocked" /></>, 'Blocked: waits on open work')}
      {item(<line x1={2} x2={32} y1={8} y2={8} className="bmt__lg-line" />, 'Workstream')}
      {item(<line x1={2} x2={32} y1={8} y2={8} className="bmt__lg-line is-dashed" />, 'Exploration')}
      {item(<line x1={2} x2={32} y1={8} y2={8} className="bmt__lg-line is-dotted" />, 'Set aside')}
      {item(<><line x1={2} x2={26} y1={8} y2={8} className="bmt__lg-line" /><line x1={26} x2={26} y1={3} y2={13} className="bmt__lg-line" /></>, 'Dropped: a dead end')}
      {item(<path d="M2,8 L32,8" className="bmt__lg-dep" />, 'Waits on another project')}
      {item(<path d="M2,8 L32,8" className="bmt__lg-if" />, 'Interface: provides → uses')}
    </div>
  )
}
