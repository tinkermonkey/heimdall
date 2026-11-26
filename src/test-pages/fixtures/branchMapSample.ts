/**
 * A small, vocabulary-free branch map sample (BranchMapData) for the layout's unit tests and the
 * view. Four groups:
 *
 * - `atlas`: a small group with a stated trunk, dated done stations above the start, a decision
 *   that opens two lines, a dropped line, a dashed line, ticks and progress.
 * - `borealis`: 20 active lines to 9 destinations (5, 5 and 4 lines, then six singles), plus two
 *   stations no line leads to. Shaped like the largest group in the 2026-11-25 organizing
 *   snapshot (houseOrganizingSnapshot.ts); past an 8-lane budget it has to bundle.
 * - `cirrus`: 17 lines to 15 destinations (two pairs, then thirteen singles), two of them set
 *   aside. Shaped like the second largest; bundling by destination alone cannot bring it under 8.
 * - `deneb`: a small group on the receiving end of links.
 *
 * Links: a dependency from atlas into deneb, and two provides arches.
 */
import type { BranchMapData, BranchMapLine, BranchMapStation } from '../../utils/branchMap'

export const BRANCH_MAP_SAMPLE_GROUPS = {
  small: 'atlas',
  twentyLines: 'borealis',
  seventeenLines: 'cirrus',
  receiving: 'deneb',
} as const

const stop = (id: string, group: string, label: string, extra: Partial<BranchMapStation> = {}): BranchMapStation => ({
  id, group, label, kind: 'stop', status: 'planned', ...extra,
})

const decision = (id: string, group: string, label: string, extra: Partial<BranchMapStation> = {}): BranchMapStation => ({
  id, group, label, kind: 'decision', status: 'planned', ...extra,
})

const line = (id: string, group: string, label: string, from: string | null, to: string | null, extra: Partial<BranchMapLine> = {}): BranchMapLine => ({
  id, group, label, from, to, status: 'active', ...extra,
})

// ---- atlas ---------------------------------------------------------------------------------

const atlasStations: BranchMapStation[] = [
  stop('a-s0', 'atlas', 'First release', { status: 'done', date: '2026-10-02' }),
  stop('a-s1', 'atlas', 'Public preview', { status: 'done', date: '2026-11-03', after: ['a-s0'] }),
  decision('a-d1', 'atlas', 'Keep the current storage engine?', { status: 'active' }),
  stop('a-s2', 'atlas', 'Storage rework', { status: 'active', after: ['a-d1'], progress: [2, 5] }),
  stop('a-s3', 'atlas', 'General availability', { after: ['a-s2'], progress: [0, 4], blocked: true }),
  stop('a-s4', 'atlas', 'Hosted offering'),
]

const atlasLines: BranchMapLine[] = [
  line('a-l1', 'atlas', 'Benchmark the candidates', null, 'a-d1', { style: 'dashed', marks: { total: 3, emphasized: 1 } }),
  line('a-l2', 'atlas', 'Migrate the write path', 'a-d1', 'a-s2', { weight: 4, marks: { total: 8, emphasized: 2 } }),
  line('a-l3', 'atlas', 'Read replicas', 'a-d1', 'a-s2', { weight: 2, marks: { total: 4 } }),
  line('a-l4', 'atlas', 'Documentation for operators', null, 'a-s3', { marks: { total: 5, emphasized: 0 } }),
  line('a-l5', 'atlas', 'Embedded mode', null, null, { status: 'dropped', marks: { total: 2 } }),
]

// ---- borealis: 20 lines, 9 destinations (5, 5, 4, 1 x 6) ------------------------------------

const borealisStations: BranchMapStation[] = [
  stop('b-s1', 'borealis', 'Schema 2.0', { status: 'active', progress: [3, 7] }),
  stop('b-s2', 'borealis', 'Extraction from source', { after: ['b-s1'], progress: [1, 6] }),
  stop('b-s3', 'borealis', 'Review in the viewer', { after: ['b-s2'] }),
  stop('b-s4', 'borealis', 'Command line parity'),
  stop('b-s5', 'borealis', 'Plugin packaging'),
  stop('b-s6', 'borealis', 'Telemetry'),
  stop('b-s7', 'borealis', 'Changelog automation'),
  decision('b-d1', 'borealis', 'Split the validator?'),
  stop('b-s8', 'borealis', 'Faster validation', { after: ['b-d1'] }),
  // No line leads to these two: they sit on the group's planned spur.
  stop('b-s9', 'borealis', 'Second language binding'),
  stop('b-s10', 'borealis', 'Long-term support branch', { after: ['b-s3'] }),
]

const borealisLines: BranchMapLine[] = [
  ...['Attribute catalogue', 'Relationship rules', 'Layer naming', 'Migration notes', 'Spec examples'].map((label, i) =>
    line(`b-l${i + 1}`, 'borealis', label, null, 'b-s1', { weight: 1 + (i % 3), marks: { total: 3 + i, emphasized: i % 2 } }),
  ),
  ...['Parser coverage', 'Symbol index', 'Incremental extraction', 'Source references', 'Extraction rules'].map((label, i) =>
    line(`b-l${i + 6}`, 'borealis', label, null, 'b-s2', { weight: 1 + (i % 2), marks: { total: 2 + i } }),
  ),
  ...['Annotation threads', 'Diff view', 'Review verdicts', 'Viewer performance'].map((label, i) =>
    line(`b-l${i + 11}`, 'borealis', label, null, 'b-s3', { weight: 1, marks: { total: 4 } }),
  ),
  line('b-l15', 'borealis', 'Command line parity', null, 'b-s4', { weight: 3 }),
  line('b-l16', 'borealis', 'Package the plugin for the marketplace', null, 'b-s5', { weight: 2 }),
  line('b-l17', 'borealis', 'Usage telemetry', null, 'b-s6'),
  line('b-l18', 'borealis', 'Changelog from commits', null, 'b-s7', { weight: 0.5 }),
  line('b-l19', 'borealis', 'Profile the validator', null, 'b-d1', { style: 'dashed' }),
  line('b-l20', 'borealis', 'Validator rewrite', 'b-d1', 'b-s8', { weight: 5, marks: { total: 9, emphasized: 3 } }),
]

// ---- cirrus: 17 lines, 15 destinations (2, 2, 1 x 13) ---------------------------------------

const cirrusLabels = [
  'Release automation', 'Shared rules file', 'Session notes', 'Review skill', 'Docs gardening',
  'Planning skill', 'Mirror to the tracker', 'Weekly review', 'Debrief prompts', 'Install script',
  'Marketplace listing', 'Eval suite', 'Hook timing', 'Status line', 'Settings migration',
]

const cirrusStations: BranchMapStation[] = cirrusLabels.map((label, i) =>
  stop(`c-s${i + 1}`, 'cirrus', label, i === 0 ? { status: 'active', progress: [1, 3] } : {}),
)

const cirrusLines: BranchMapLine[] = [
  line('c-l1', 'cirrus', 'Tag and publish', null, 'c-s1', { weight: 2 }),
  line('c-l2', 'cirrus', 'Release notes', null, 'c-s1'),
  line('c-l3', 'cirrus', 'One rules file for every project', null, 'c-s2', { weight: 3 }),
  line('c-l4', 'cirrus', 'Rule loading after compaction', null, 'c-s2'),
  ...cirrusLabels.slice(2).map((label, i) =>
    line(`c-l${i + 5}`, 'cirrus', label, null, `c-s${i + 3}`, i >= 11 ? { status: 'set-aside', style: 'dotted' } : { weight: 1 + (i % 4) }),
  ),
]

// ---- deneb ---------------------------------------------------------------------------------

const denebStations: BranchMapStation[] = [
  stop('d-s1', 'deneb', 'Import from atlas', { blocked: true }),
  stop('d-s2', 'deneb', 'Dashboard', { after: ['d-s1'] }),
]

const denebLines: BranchMapLine[] = [
  line('d-l1', 'deneb', 'Connector', null, 'd-s1', { weight: 2, marks: { total: 3 } }),
  line('d-l2', 'deneb', 'Charts', null, 'd-s2', { marks: { total: 2, emphasized: 1 } }),
]

export const branchMapSample: BranchMapData = {
  groups: [
    { id: 'atlas', label: 'Atlas', trunk: ['a-s0', 'a-s1', 'a-s2', 'a-s3'] },
    { id: 'borealis', label: 'Borealis' },
    { id: 'cirrus', label: 'Cirrus' },
    { id: 'deneb', label: 'Deneb', color: 5 },
  ],
  stations: [...atlasStations, ...borealisStations, ...cirrusStations, ...denebStations],
  lines: [...atlasLines, ...borealisLines, ...cirrusLines, ...denebLines],
  links: [
    { id: 'k-dep-1', kind: 'dependency', from: 'a-s3', to: 'd-s1' },
    { id: 'k-prov-1', kind: 'provides', from: 'a-s2', to: 'borealis', label: 'Storage API' },
    { id: 'k-prov-2', kind: 'provides', from: 'c-s2', to: 'deneb', label: 'Shared rules' },
  ],
}
