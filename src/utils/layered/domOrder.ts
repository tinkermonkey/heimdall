/**
 * Depth order for a projected scene: elements are re-stacked in painter's order every frame, so
 * the fewer moves the better (each move restyles the element).
 */

/**
 * Puts the elements in `ids` order (painter's order) inside `parent`, moving as few as possible:
 * the longest run already in order stays, the rest are inserted around it. Skipped when the
 * order is unchanged since the last call.
 */
export function reorder(parent: Element, els: ReadonlyMap<string, Element>, ids: readonly string[], last: Record<string, string>, key: string) {
  const sig = ids.join('\n')
  if (last[key] === sig) return
  last[key] = sig
  const want = ids.map((id) => els.get(id)).filter((el): el is Element => el !== undefined && el.parentNode === parent)
  const pos = new Map<Element, number>()
  Array.from(parent.children).forEach((el, i) => pos.set(el, i))
  const keep = new Set(longestIncreasing(want.map((el) => pos.get(el)!)).map((i) => want[i]))
  // Backwards: each moved element goes right before the one that follows it in the wanted order.
  let next: Element | null = null
  for (let i = want.length - 1; i >= 0; i--) {
    const el = want[i]
    if (!keep.has(el)) parent.insertBefore(el, next)
    next = el
  }
}

/** Indices of a longest strictly increasing subsequence of `seq` (patience sorting, O(n log n)). */
export function longestIncreasing(seq: readonly number[]): number[] {
  const tails: number[] = []
  const prev: number[] = new Array(seq.length)
  for (let i = 0; i < seq.length; i++) {
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (seq[tails[mid]] < seq[i]) lo = mid + 1
      else hi = mid
    }
    prev[i] = lo > 0 ? tails[lo - 1] : -1
    tails[lo] = i
  }
  const out: number[] = []
  for (let k = tails.length ? tails[tails.length - 1] : -1; k >= 0; k = prev[k]) out.push(k)
  return out.reverse()
}
