import type { GraphNodeData, GraphEdgeData } from '../index'

/**
 * Demo dataset and sphere-sizing math ported from a prior D3 galaxy-chart proof of concept
 * (github.com/austinsand/rivande — `galaxy_chart.js` / `fixture.js`), used here purely as a
 * stress test for heimdall's own `galaxyLayout` algorithm: a real, uneven hierarchy — 56 nodes,
 * 4 levels deep, node "weight" (size) spanning almost 4 orders of magnitude between the root and
 * its smallest leaf — is a much harder case than the hand-built GALAXY_DEMO_NODES fixture (12-27
 * roughly-uniform nodes) and surfaces spacing/overlap issues that don't show up at that scale.
 * Source data: US federal budget by function, FY-ish figures in $ billions.
 */
interface BudgetRow {
  nodeId: string
  parentId: string | null
  title: string
  size: number
}

// Verbatim from the POC's fixture.js `tuneData` (parentId back-references are preserved as-is).
const BUDGET_ROWS: BudgetRow[] = [
  { nodeId: '001', parentId: null, title: 'Budget', size: 3935.338 },
  { nodeId: '002', parentId: '001', title: 'National Defense', size: 706.43 },
  { nodeId: '003', parentId: '001', title: 'Transportation', size: 92.965 },
  { nodeId: '004', parentId: '001', title: 'Education, Training, Employment, and Social Services', size: 101.233 },
  { nodeId: '005', parentId: '001', title: 'Health', size: 372.5 },
  { nodeId: '006', parentId: '001', title: 'Medicare', size: 485.653 },
  { nodeId: '007', parentId: '001', title: 'Income Security', size: 597.352 },
  { nodeId: '060', parentId: '001', title: 'Social Security', size: 730.811 },
  { nodeId: '008', parentId: '001', title: 'Veterans Benefits and Services', size: 101.233 },
  { nodeId: '009', parentId: '001', title: 'Administration of Justice', size: 56.055 },
  { nodeId: '010', parentId: '001', title: 'Net Interest', size: 453.987 },
  { nodeId: '011', parentId: '001', title: 'Other', size: 211.163 },

  // National Defense
  { nodeId: '012', parentId: '002', title: 'Department of Defense-Military', size: 678.869 },
  { nodeId: '013', parentId: '002', title: 'Atomic energy defense activities', size: 20.41 },
  { nodeId: '014', parentId: '002', title: 'Defense-related activities', size: 7.151 },

  // Transportation
  { nodeId: '015', parentId: '003', title: 'Ground transportation', size: 60.902 },
  { nodeId: '016', parentId: '003', title: 'Air transportation', size: 21.353 },
  { nodeId: '017', parentId: '003', title: 'Water transportation', size: 10.358 },
  { nodeId: '018', parentId: '003', title: 'Other transportation', size: 0.352 },

  // Education
  { nodeId: '019', parentId: '004', title: 'Elementary, secondary, and vocational education', size: 66.473 },
  { nodeId: '020', parentId: '004', title: 'Higher education', size: 1.108 },
  { nodeId: '021', parentId: '004', title: 'Research and general education aids', size: 3.71 },
  { nodeId: '022', parentId: '004', title: 'Training and employment', size: 9.139 },
  { nodeId: '023', parentId: '004', title: 'Other labor services', size: 1.869 },
  { nodeId: '024', parentId: '004', title: 'Social services', size: 18.931 },

  // Health
  { nodeId: '025', parentId: '005', title: 'Health care services', size: 332.21 },
  { nodeId: '026', parentId: '005', title: 'Health research and training', size: 36.194 },
  { nodeId: '027', parentId: '005', title: 'Consumer and occupational health and safety', size: 4.096 },

  // Income Security
  { nodeId: '028', parentId: '007', title: 'General retirement and disability insurance', size: 6.697 },
  { nodeId: '029', parentId: '007', title: 'Federal employee retirement and disability', size: 124.45 },
  { nodeId: '030', parentId: '007', title: 'Unemployment compensation', size: 120.556 },
  { nodeId: '031', parentId: '007', title: 'Housing assistance', size: 55.44 },
  { nodeId: '032', parentId: '007', title: 'Food and nutrition assistance', size: 103.199 },
  { nodeId: '033', parentId: '007', title: 'Other income security', size: 187.01 },

  // Veterans Benefits and Services
  { nodeId: '034', parentId: '008', title: 'Income security for veterans', size: 58.747 },
  { nodeId: '035', parentId: '008', title: 'Veterans education, training, and rehabilitation', size: 10.683 },
  { nodeId: '036', parentId: '008', title: 'Hospital and medical care for veterans', size: 50.062 },
  { nodeId: '037', parentId: '008', title: 'Veterans housing', size: 1.262 },
  { nodeId: '038', parentId: '008', title: 'Other veterans benefits and services', size: 6.435 },

  // Administration of Justice
  { nodeId: '039', parentId: '009', title: 'Federal law enforcement activities', size: 29.801 },
  { nodeId: '040', parentId: '009', title: 'Federal litigative and judicial activities', size: 13.565 },
  { nodeId: '041', parentId: '009', title: 'Federal correctional activities', size: 8.057 },
  { nodeId: '042', parentId: '009', title: 'Criminal justice assistance', size: 4.632 },

  // Net Interest
  { nodeId: '043', parentId: '010', title: 'Interest on Treasury debt securities (gross)', size: 453.987 },

  // Other
  { nodeId: '044', parentId: '011', title: 'General Science, Space, and Technology', size: 12.434 },
  { nodeId: '045', parentId: '011', title: 'Energy', size: 17.032 },
  { nodeId: '046', parentId: '011', title: 'Agriculture', size: 8.084 },
  { nodeId: '047', parentId: '011', title: 'General Government', size: 35.691 },
  { nodeId: '048', parentId: '011', title: 'Community and Regional Development', size: 24.433 },
  { nodeId: '049', parentId: '011', title: 'International Affairs', size: 63.374 },
  { nodeId: '050', parentId: '011', title: 'Natural Resources and Environment', size: 50.115 },

  // Department of Defense-Military
  { nodeId: '051', parentId: '012', title: 'Military Personnel', size: 161.608 },
  { nodeId: '052', parentId: '012', title: 'Operation and Maintenance', size: 291.038 },
  { nodeId: '053', parentId: '012', title: 'Procurement', size: 128.003 },
  { nodeId: '054', parentId: '012', title: 'Research, Development, Test, and Evaluation', size: 74.871 },
  { nodeId: '055', parentId: '012', title: 'Military Construction', size: 19.917 },
  { nodeId: '056', parentId: '012', title: 'Family Housing', size: 3.432 },
]

// Same rescale-then-sqrt sizing the POC used (galaxy_chart.js): raw `size` is linearly remapped
// into [MIN_SIZE, MAX_SIZE] against the dataset's own min/max, then radius = sqrt(size) — so
// radius scales with the square root of magnitude (area-proportional, not linear), same as the
// POC's bubble sizing.
const MIN_SIZE = 36
const MAX_SIZE = 10000

const rawSizes = BUDGET_ROWS.map(r => r.size)
const dataMin = Math.min(...rawSizes)
const dataMax = Math.max(...rawSizes)
const sizeScale = (MAX_SIZE - MIN_SIZE) / (dataMax - dataMin)
const sizeOffset = MIN_SIZE - dataMin * sizeScale

/** Rescaled + sqrt'd render radius (px) for a raw `size` value, matching the POC's bubble sizing. */
export function budgetNodeRadius(size: number): number {
  return Math.sqrt(size * sizeScale + sizeOffset)
}

// Depth (root = 0) drives the POC's per-level stroke color (see GalaxySphereNode).
const parentOf = new Map(BUDGET_ROWS.map(r => [r.nodeId, r.parentId]))
function depthOf(id: string): number {
  let depth = 0
  let current = parentOf.get(id)
  while (current) {
    depth++
    current = parentOf.get(current)
  }
  return depth
}

export interface BudgetNodeData extends GraphNodeData {
  size: number
  depth: number
}

export const GALAXY_BUDGET_NODES: BudgetNodeData[] = BUDGET_ROWS.map(row => ({
  id: row.nodeId,
  label: row.title,
  size: row.size,
  depth: depthOf(row.nodeId),
}))

// One structural edge per parent → child link. Every edge here is structural (no relational
// edges in this dataset) — GraphCanvas already treats every edge as structural when
// isStructuralEdge is omitted, so there's no need to pass that prop at all.
export const GALAXY_BUDGET_EDGES: GraphEdgeData[] = BUDGET_ROWS
  .filter((row): row is BudgetRow & { parentId: string } => row.parentId !== null)
  .map(row => ({
    id: `e_${row.parentId}_${row.nodeId}`,
    sourceId: row.parentId,
    targetId: row.nodeId,
    curvature: 0, // straight lines, per the POC's LineLinkHandler
  }))
