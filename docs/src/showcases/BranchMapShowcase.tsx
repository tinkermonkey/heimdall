import { useState } from 'react'
import { BranchMap, SegmentedControl } from '@tinkermonkey/heimdall-ui'
import { branchMapSample, BRANCH_MAP_SAMPLE_GROUPS } from '@/test-pages/fixtures/branchMapSample'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const fg1 = 'rgb(var(--canvas-fg-1))'
const fg2 = 'rgb(var(--canvas-fg-2))'
const fg3 = 'rgb(var(--canvas-fg-3))'
const border = 'rgb(var(--canvas-border))'
const mono = 'var(--font-mono)'

// ─── Code samples ──────────────────────────────────────────────────────────

const DATA_CODE = `import type { BranchMapData } from '@tinkermonkey/heimdall-ui'

const data: BranchMapData = {
  groups: [{ id: 'atlas', label: 'Atlas' }],
  stations: [
    { id: 'beta', group: 'atlas', label: 'Public beta', kind: 'stop', status: 'active', progress: [2, 5] },
    { id: 'engine', group: 'atlas', label: 'Keep the storage engine?', kind: 'decision', status: 'planned' },
    { id: 'ga', group: 'atlas', label: 'General availability', kind: 'stop', status: 'planned', after: ['beta'] },
  ],
  lines: [
    // from: null forks from the group's start marker; to: the station it delivers to.
    { id: 'bench', group: 'atlas', label: 'Benchmark the candidates', from: null, to: 'engine', status: 'active', style: 'dashed' },
    { id: 'docs', group: 'atlas', label: 'Operator docs', from: 'beta', to: 'ga', status: 'active', marks: { total: 5, emphasized: 1 } },
  ],
  links: [],
}`

const VIEW_CODE = `const [selected, setSelected] = useState<string | null>(null)
const [expanded, setExpanded] = useState<string[]>([])

<BranchMap
  data={data}                       // memoize: a new object re-runs the layout
  startLabel="NOW"
  selectedId={selected}
  onSelect={(id) => setSelected(id)}
  expanded={expanded}               // group and bundle ids drawn whole
  onExpandedChange={setExpanded}
  maxLanes={8}
  width="off"                       // or 'weight'
/>`

const HEADLESS_CODE = `import { layoutBranchMap, routeBranchMap, branchMapScene } from '@tinkermonkey/heimdall-ui'

const layout = layoutBranchMap(data, { maxLanes: 8 })  // positions, lanes, bundles, label boxes, issues
const scene = routeBranchMap(layout)                    // line, trunk and link geometry, from the layout alone
// or both at once: branchMapScene(data, options)`

const ADAPTER_CODE = `// In the app, not the library: a pure function from your records to BranchMapData.
const data = useMemo(() => houseToBranchMap(snapshot, { projects, horizon: 'forward' }), [projects])

<BranchMap data={data} startLabel="NOW" />`

function Code({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: '12px 0 0',
        padding: '12px 14px',
        background: 'rgb(var(--canvas-bg-2))',
        border: `1px solid ${border}`,
        borderRadius: 8,
        fontFamily: mono,
        fontSize: 12,
        lineHeight: 1.6,
        color: fg1,
        overflowX: 'auto',
      }}
    >
      {children}
    </pre>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: fg3 }}>
      {children}
    </span>
  )
}

const listStyle = { margin: 0, paddingLeft: 18, fontSize: 12, color: fg2, lineHeight: 1.8 } as const

// ─── Page ──────────────────────────────────────────────────────────────────

export function BranchMapShowcase() {
  return (
    <div>
      <PageHeader
        name="BranchMap"
        description="A vertical metro map of how groups of work are organized: per group a trunk running down from a start marker, a line for each piece of work from where it starts to the station it delivers to, stations along the lines, and links between groups. The model is vocabulary-free; mapping a source onto it is the consuming app's job."
      />

      <BranchMapDemo />

      <ShowcaseSection
        label="Where the idea comes from"
        description="The branch map combines three established forms; it interprets them rather than inventing a new one."
      >
        <ul style={listStyle}>
          <li>The metro map metaphor for abstract data: Nesbitt (IV 2004), and Stott, Rodgers et al.'s project plans as metro maps (IV 2005). Lines branch at 45° with rounded corners, as transit diagrams do.</li>
          <li>The commit graph (git log --graph): branches on lanes that are reused once free, after Pierre Vigier's "Commit graph drawing algorithms" (2019).</li>
          <li>Storylines and alluvial flows, for the optional width by weight: a fork takes a line's weight off the trunk and a join gives it back, in the manner of Minard's 1812 campaign map.</li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection
        label="The model"
        description="Groups, stations, lines and links. Ids are unique across all four; a duplicate, a dangling reference or a cycle is reported in the layout's issues, never thrown."
      >
        <ul style={listStyle}>
          <li>A station is a stop (circle) or a decision (diamond), with a status: planned, active, done, set-aside or dropped. A done station with a date sits above the start marker, in date order; the rest sit below it in dependency order (after, line from and to, dependency links).</li>
          <li>A line runs from a station, or from the group's start marker (from: null), to the station it delivers to, or to an open end (to: null). Dropped lines end with a bar; style is solid, dashed or dotted; marks draw ticks along its run.</li>
          <li>A dependency link is an arrow from the station waited on to the waiting one, and it orders ranks across groups. A provides link is a dotted arch from a provider station to another group's start.</li>
          <li>The trunk is the heaviest chain of stops, unless the group states one (group.trunk).</li>
        </ul>
        <Code>{DATA_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Scale: the lane budget"
        description="A group draws at most maxLanes branch lanes (default 8). Past it, lines with the same fork rank and destination merge into one bundle with a count; if that is still over budget, the lightest lines left collapse into one 'N more' line. Activating a bundle adds its id to expanded and draws its lines; the group toggle beside its name expands or collapses the whole group."
      >
        <Code>{VIEW_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="data" type="BranchMapData" description="Groups, stations, lines and links. Memoize it: a new object re-runs the layout." required />
          <PropRow name="selectedId" type="string | null" description="The selected station, line, link or group (controlled). A line drawn inside a bundle selects the bundle." />
          <PropRow name="onSelect" type="(id, item) => void" description="Click, Enter or Space selects; again clears. Escape and a click on empty canvas clear." />
          <PropRow name="hoveredId" type="string | null" description="The hovered or keyboard-focused item (controlled)." />
          <PropRow name="onHoverChange" type="(id, item) => void" description="Hover and keyboard focus." />
          <PropRow name="expanded" type="string[]" description="Group and bundle ids drawn whole (controlled)." />
          <PropRow name="defaultExpanded" type="string[]" def="[]" description="Initial expanded when uncontrolled." />
          <PropRow name="onExpandedChange" type="(ids) => void" description="A bundle was activated, or a group toggled." />
          <PropRow name="renderTooltip" type="(item) => ReactNode" description="Hover detail in a floating box. Unset: native tooltips." />
          <PropRow name="startLabel" type="string" description="Text beside each group's start marker, such as NOW." />
          <PropRow name="maxLanes" type="number" def="8" description="Branch lanes per group before lines bundle." />
          <PropRow name="width" type="'off' | 'weight'" def="'off'" description="'weight' widens lines and the trunk by the square root of weight." />
          <PropRow name="maxLabelWidth" type="number" def="180" description="Labels wrap to two lines at this width, then end with an ellipsis." />
          <PropRow name="rowGap, rankGap, laneGap, groupGap, minBranchRanks" type="number" description="Spacing. laneGap defaults to 24." />
          <PropRow name="measureText" type="(text, role) => number" description="Label width in px. Unset: measured with a canvas in the map's fonts." />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection
        label="Headless layout"
        description="Placement and routing are separate, pure stages with no DOM, so a layout can be computed, tested or serialized without the view."
      >
        <Code>{HEADLESS_CODE}</Code>
      </ShowcaseSection>

      <ShowcaseSection
        label="Mapping a source"
        description="The library knows nothing of where the data comes from. The test page ?example=branch-map maps House's project organization onto it (src/test-pages/branchMap/houseBranchMapAdapter.ts): projects to groups, milestones to stops, gates to decisions, workstreams to lines, depends_on across projects to dependency links, interfaces to provides links."
      >
        <Code>{ADAPTER_CODE}</Code>
      </ShowcaseSection>
    </div>
  )
}

function BranchMapDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string[]>([])
  const [width, setWidth] = useState<'off' | 'weight'>('off')
  const wide = BRANCH_MAP_SAMPLE_GROUPS.twentyLines

  return (
    <ShowcaseSection
      label="Sample"
      description="Four groups: a small one with a stated trunk and dated done stations, two past the lane budget (20 lines to 9 destinations, and 17 lines to 15), and one on the receiving end of links."
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eyebrow>Width</Eyebrow>
          <SegmentedControl
            aria-label="Width"
            value={width}
            onChange={(v) => setWidth(v as 'off' | 'weight')}
            options={[{ value: 'off', label: 'Off' }, { value: 'weight', label: 'Weight' }]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Eyebrow>{wide}</Eyebrow>
          <SegmentedControl
            aria-label={`Draw ${wide}`}
            value={expanded.includes(wide) ? 'expanded' : 'bundled'}
            onChange={(v) => setExpanded((cur) => (v === 'expanded' ? [...cur, wide] : cur.filter((id) => id !== wide)))}
            options={[{ value: 'bundled', label: 'Bundled' }, { value: 'expanded', label: 'Expanded' }]}
          />
        </div>
        <span style={{ fontFamily: mono, fontSize: 11, color: fg3 }}>{selected ? `selected ${selected}` : 'nothing selected'}</span>
      </div>
      <div style={{ height: 560, border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
        <BranchMap
          data={branchMapSample}
          startLabel="NOW"
          width={width}
          selectedId={selected}
          onSelect={(id: string | null) => setSelected(id)}
          expanded={expanded}
          onExpandedChange={setExpanded}
          style={{ height: '100%' }}
        />
      </div>
    </ShowcaseSection>
  )
}
