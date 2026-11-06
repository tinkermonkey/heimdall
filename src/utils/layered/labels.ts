import type { IndexedLink, PredicateCatalog } from './types'

/** A link's predicate label: each predicate's catalog label (or the predicate), joined with ` · `. */
export function linkPredicateLabel(link: IndexedLink, catalog: PredicateCatalog, predicates: readonly string[] = link.predicates): string {
  return predicates.map((p) => catalog[p]?.label ?? p).join(' · ')
}

/**
 * Arrowhead polygon at `tip`, pointing along the unit vector (ux, uy): three points as an SVG
 * `points` string. `length` back from the tip, `halfWidth` either side.
 */
export function arrowHeadPoints(tip: { x: number; y: number }, ux: number, uy: number, length = 7, halfWidth = 3.2): string {
  const r = (v: number) => Math.round(v * 10) / 10
  const bx = tip.x - ux * length
  const by = tip.y - uy * length
  return `${r(tip.x)},${r(tip.y)} ${r(bx - uy * halfWidth)},${r(by + ux * halfWidth)} ${r(bx + uy * halfWidth)},${r(by - ux * halfWidth)}`
}
