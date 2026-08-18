import type { GraphNodeData } from '../components/GraphCanvas'

export interface GalaxyDemoEdge {
  id: string
  sourceId: string
  targetId: string
  label: string
}

/**
 * A larger, denser dataset for demoing, benchmarking, and visually tuning the galaxy layout:
 * three independent hierarchies of different sizes and depths —
 *   - biology: 12 nodes, 4 levels, one large subtree (eukaryote) beside one single-node subtree
 *     (prokaryote), to stress-test how orbit spacing handles very uneven sibling subtree sizes
 *   - climate: 7 nodes, 3 levels, two sibling subtrees of different sizes
 *   - software: 7 nodes, 3 levels, an unrelated domain entirely, to see how independent trees
 *     spread around the shared root ring
 * plus cross-cutting relational edges both within and across trees, a node reachable only by a
 * relational edge ("protein" — becomes its own orbit, not a child of anything), and two true
 * orphans with no edges at all.
 *
 * 'contains' and 'instanceOf' are the structural predicates; everything else is relational.
 */
export const GALAXY_DEMO_STRUCTURAL_PREDICATES = new Set(['contains', 'instanceOf'])

export function isGalaxyDemoEdgeStructural(edge: { label?: string }): boolean {
  return !!edge.label && GALAXY_DEMO_STRUCTURAL_PREDICATES.has(edge.label)
}

export const GALAXY_DEMO_NODES: GraphNodeData[] = [
  // Biology
  { id: 'organism',      label: 'Organism',      kind: 'C', domainColor: 'life' },
  { id: 'eukaryote',     label: 'Eukaryote',     kind: 'C', domainColor: 'life' },
  { id: 'prokaryote',    label: 'Prokaryote',    kind: 'C', domainColor: 'life' },
  { id: 'cell',          label: 'Cell',          kind: 'C', domainColor: 'life' },
  { id: 'nucleus',       label: 'Nucleus',       kind: 'C', domainColor: 'life' },
  { id: 'mitochondrion', label: 'Mitochondrion', kind: 'C', domainColor: 'life' },
  { id: 'membrane',      label: 'Membrane',      kind: 'C', domainColor: 'life' },
  { id: 'chromosome',    label: 'Chromosome',    kind: 'C', domainColor: 'life' },
  { id: 'brca1',         label: 'BRCA1',         kind: 'I', domainColor: 'life' },
  { id: 'tp53',          label: 'TP53',          kind: 'I', domainColor: 'life' },
  { id: 'myc',           label: 'MYC',           kind: 'I', domainColor: 'life' },
  // Reachable only via a relational edge ('encodes', below) — no structural parent, so it
  // becomes its own root and orbit, same as a fully disconnected node would.
  { id: 'protein',       label: 'Protein',       kind: 'C', domainColor: 'life' },

  // Climate
  { id: 'atmosphere',          label: 'Atmosphere',          kind: 'C', domainColor: 'climate' },
  { id: 'greenhouse_gas',      label: 'Greenhouse Gas',      kind: 'C', domainColor: 'climate' },
  { id: 'co2',                 label: 'CO2',                 kind: 'I', domainColor: 'climate' },
  { id: 'methane',             label: 'Methane',             kind: 'I', domainColor: 'climate' },
  { id: 'n2o',                 label: 'N2O',                 kind: 'I', domainColor: 'climate' },
  { id: 'ocean',                label: 'Ocean',               kind: 'C', domainColor: 'climate' },
  { id: 'ocean_acidification',  label: 'Ocean Acidification', kind: 'I', domainColor: 'climate' },

  // Software — a different domain entirely, to test root-ring spread across unrelated trees
  { id: 'platform',        label: 'Platform',        kind: 'C', domainColor: 'software' },
  { id: 'api_gateway',     label: 'API Gateway',     kind: 'C', domainColor: 'software' },
  { id: 'auth_service',    label: 'Auth Service',    kind: 'C', domainColor: 'software' },
  { id: 'billing_service', label: 'Billing Service', kind: 'C', domainColor: 'software' },
  { id: 'data_layer',      label: 'Data Layer',      kind: 'C', domainColor: 'software' },
  { id: 'primary_db',      label: 'Primary DB',      kind: 'C', domainColor: 'software' },
  { id: 'cache',           label: 'Cache',           kind: 'C', domainColor: 'software' },

  // True orphans — no edges at all
  { id: 'note_deprecated',  label: 'Deprecated Note',  kind: 'C', domainColor: 'life' },
  { id: 'claim_unreviewed', label: 'Unreviewed Claim', kind: 'C', domainColor: 'climate' },
]

export const GALAXY_DEMO_EDGES: GalaxyDemoEdge[] = [
  // Structural — biology
  { id: 'e_organism_eukaryote',  sourceId: 'organism',   targetId: 'eukaryote',     label: 'contains' },
  { id: 'e_organism_prokaryote', sourceId: 'organism',   targetId: 'prokaryote',    label: 'contains' },
  { id: 'e_eukaryote_cell',      sourceId: 'eukaryote',  targetId: 'cell',          label: 'contains' },
  { id: 'e_cell_nucleus',        sourceId: 'cell',       targetId: 'nucleus',       label: 'contains' },
  { id: 'e_cell_mito',           sourceId: 'cell',       targetId: 'mitochondrion', label: 'contains' },
  { id: 'e_cell_membrane',       sourceId: 'cell',       targetId: 'membrane',      label: 'contains' },
  { id: 'e_nucleus_chromosome',  sourceId: 'nucleus',    targetId: 'chromosome',    label: 'contains' },
  { id: 'e_chromosome_brca1',    sourceId: 'chromosome', targetId: 'brca1',         label: 'instanceOf' },
  { id: 'e_chromosome_tp53',     sourceId: 'chromosome', targetId: 'tp53',          label: 'instanceOf' },
  { id: 'e_chromosome_myc',      sourceId: 'chromosome', targetId: 'myc',           label: 'instanceOf' },

  // Structural — climate
  { id: 'e_atmosphere_ghg',      sourceId: 'atmosphere',     targetId: 'greenhouse_gas',      label: 'contains' },
  { id: 'e_atmosphere_ocean',    sourceId: 'atmosphere',     targetId: 'ocean',               label: 'contains' },
  { id: 'e_ghg_co2',             sourceId: 'greenhouse_gas', targetId: 'co2',                 label: 'instanceOf' },
  { id: 'e_ghg_methane',         sourceId: 'greenhouse_gas', targetId: 'methane',             label: 'instanceOf' },
  { id: 'e_ghg_n2o',             sourceId: 'greenhouse_gas', targetId: 'n2o',                 label: 'instanceOf' },
  { id: 'e_ocean_acidification', sourceId: 'ocean',          targetId: 'ocean_acidification', label: 'instanceOf' },

  // Structural — software
  { id: 'e_platform_api',    sourceId: 'platform',    targetId: 'api_gateway',     label: 'contains' },
  { id: 'e_platform_data',   sourceId: 'platform',    targetId: 'data_layer',      label: 'contains' },
  { id: 'e_api_auth',        sourceId: 'api_gateway', targetId: 'auth_service',    label: 'contains' },
  { id: 'e_api_billing',     sourceId: 'api_gateway', targetId: 'billing_service', label: 'contains' },
  { id: 'e_data_primary_db', sourceId: 'data_layer',  targetId: 'primary_db',      label: 'contains' },
  { id: 'e_data_cache',      sourceId: 'data_layer',  targetId: 'cache',           label: 'contains' },

  // Relational — rendered, but layout-irrelevant. Mixes local (within one tree), cross-branch
  // (within the same tree, different subtree), and cross-domain links.
  { id: 'r_brca1_protein',  sourceId: 'brca1',           targetId: 'protein',             label: 'encodes' },
  { id: 'r_tp53_myc',       sourceId: 'tp53',            targetId: 'myc',                 label: 'regulates' },
  { id: 'r_co2_ocean_acid', sourceId: 'co2',             targetId: 'ocean_acidification', label: 'causes' },
  { id: 'r_auth_db',        sourceId: 'auth_service',    targetId: 'primary_db',          label: 'dependsOn' },
  { id: 'r_billing_db',     sourceId: 'billing_service', targetId: 'primary_db',          label: 'dependsOn' },
  { id: 'r_billing_cache',  sourceId: 'billing_service', targetId: 'cache',               label: 'dependsOn' },
  { id: 'r_cache_ocean',    sourceId: 'cache',           targetId: 'ocean',               label: 'monitors' },
]
