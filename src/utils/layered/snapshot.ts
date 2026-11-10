import { DEFAULT_LINK_FILTERS } from './filters'
import type { LayeredGraphSnapshot, LinkFilterState, PlaneLayoutMode, PredicateLabelMode } from './types'

/** The graph fields a snapshot may carry, multi-select and node labels included. */
export type LayeredGraphSnapshotFields = Partial<LayeredGraphSnapshot> & { selectedIds?: string[]; nodeLabels?: boolean }

const PREDICATE_MODES: readonly PredicateLabelMode[] = ['off', 'highlighted', 'all']
const PLANE_LAYOUTS: readonly PlaneLayoutMode[] = ['independent', 'coupled']

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const stringList = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined)
const idOrNull = (v: unknown): string | null | undefined => (v === null ? null : typeof v === 'string' ? v : undefined)

/** Filters merged onto `DEFAULT_LINK_FILTERS`, keeping only fields of the right type. */
function sanitizeFilters(v: unknown): LinkFilterState | undefined {
  if (!isRecord(v)) return undefined
  const categories: Record<string, boolean> = {}
  if (isRecord(v.categories)) {
    for (const [k, on] of Object.entries(v.categories)) if (typeof on === 'boolean') categories[k] = on
  }
  return {
    hiddenLayers: stringList(v.hiddenLayers) ?? DEFAULT_LINK_FILTERS.hiddenLayers,
    categories,
    hiddenPredicates: stringList(v.hiddenPredicates) ?? DEFAULT_LINK_FILTERS.hiddenPredicates,
    showIntra: typeof v.showIntra === 'boolean' ? v.showIntra : DEFAULT_LINK_FILTERS.showIntra,
    layerPair: idOrNull(v.layerPair) ?? DEFAULT_LINK_FILTERS.layerPair,
  }
}

/**
 * The graph fields of an untrusted snapshot (parsed from a URL, storage or a message), each
 * checked for type and range; anything malformed is dropped, so the state keeps its own value.
 * Filters are merged onto `DEFAULT_LINK_FILTERS`, so a partial `filters` object is safe.
 */
export function sanitizeLayeredGraphSnapshot(input: unknown): LayeredGraphSnapshotFields {
  const out: LayeredGraphSnapshotFields = {}
  if (!isRecord(input)) return out
  const selectedId = idOrNull(input.selectedId)
  if (selectedId !== undefined) out.selectedId = selectedId
  const selectedIds = stringList(input.selectedIds)
  if (selectedIds) out.selectedIds = selectedIds
  if (typeof input.follow === 'number' && Number.isFinite(input.follow)) out.follow = Math.max(0, Math.floor(input.follow))
  const filters = sanitizeFilters(input.filters)
  if (filters) out.filters = filters
  if (PREDICATE_MODES.includes(input.predicateLabels as PredicateLabelMode)) out.predicateLabels = input.predicateLabels as PredicateLabelMode
  const focusedLayerId = idOrNull(input.focusedLayerId)
  if (focusedLayerId !== undefined) out.focusedLayerId = focusedLayerId
  if (PLANE_LAYOUTS.includes(input.planeLayout as PlaneLayoutMode)) out.planeLayout = input.planeLayout as PlaneLayoutMode
  if (typeof input.nodeLabels === 'boolean') out.nodeLabels = input.nodeLabels
  return out
}
