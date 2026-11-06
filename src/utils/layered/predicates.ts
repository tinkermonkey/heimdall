import type { PredicateCatalog } from './types'

function candidateCodes(predicate: string): string[] {
  const letters = predicate.toUpperCase().replace(/[^A-Z]/g, '')
  const words = predicate.toUpperCase().split(/[^A-Z]+/).filter(Boolean)
  const out: string[] = []
  if (words.length > 1) out.push(words[0][0] + words[1][0])
  for (let i = 1; i < letters.length; i++) out.push(letters[0] + letters[i])
  return out
}

/**
 * Two-letter codes for matrix cells, unique within `predicates`. A catalog `code` wins; others
 * take a hyphenated predicate's initials or its first letter plus a later one, skipping codes
 * already taken (then a letter and a number). Deterministic for a given predicate order.
 */
export function assignPredicateCodes(predicates: Iterable<string>, catalog: PredicateCatalog = {}): Map<string, string> {
  const codes = new Map<string, string>()
  const taken = new Set<string>()
  const pending: string[] = []
  for (const p of predicates) {
    if (codes.has(p) || pending.includes(p)) continue
    const fixed = catalog[p]?.code
    if (fixed && !taken.has(fixed)) {
      codes.set(p, fixed)
      taken.add(fixed)
    } else {
      pending.push(p)
    }
  }
  for (const p of pending) {
    let code = candidateCodes(p).find((c) => !taken.has(c))
    if (!code) {
      const base = (p.replace(/[^a-zA-Z]/g, '')[0] ?? 'X').toUpperCase()
      let n = 1
      while (taken.has(base + n)) n++
      code = base + n
    }
    codes.set(p, code)
    taken.add(code)
  }
  return codes
}
