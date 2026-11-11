// LayerStack paints depth order by moving the fewest elements: everything outside a longest
// increasing run of current positions (tinkermonkey/heimdall#335).
import { describe, it, expect } from 'vitest'
import { longestIncreasing, reorder } from '../layered/domOrder'

const isIncreasing = (seq: number[], idx: number[]) => idx.every((k, i) => i === 0 || (k > idx[i - 1] && seq[k] > seq[idx[i - 1]]))

describe('longestIncreasing', () => {
  it('keeps an already sorted sequence whole', () => {
    expect(longestIncreasing([0, 1, 2, 3])).toEqual([0, 1, 2, 3])
  })

  it('one element moved from front to back: every other element stays', () => {
    // Wanted order lists current positions [1, 2, 3, 0]: only the last needs to move.
    expect(longestIncreasing([1, 2, 3, 0])).toEqual([0, 1, 2])
  })

  it('a reversed sequence keeps one element', () => {
    expect(longestIncreasing([3, 2, 1, 0])).toHaveLength(1)
  })

  it('returns a valid longest run on a shuffled sequence', () => {
    const seq = [5, 1, 6, 2, 7, 3, 8, 0, 4, 9]
    const idx = longestIncreasing(seq)
    expect(isIncreasing(seq, idx)).toBe(true)
    expect(idx).toHaveLength(5) // e.g. 5 6 7 8 9, or 1 2 3 4 9
  })

  it('handles empty input', () => {
    expect(longestIncreasing([])).toEqual([])
  })
})

/** Just enough of a DOM parent for `reorder`: children, parentNode, insertBefore, and a move count. */
class FakeParent {
  children: FakeChild[] = []
  moves = 0
  insertBefore(el: FakeChild, ref: FakeChild | null) {
    this.moves++
    this.children.splice(this.children.indexOf(el), 1)
    const at = ref ? this.children.indexOf(ref) : this.children.length
    this.children.splice(at, 0, el)
    return el
  }
}
class FakeChild {
  constructor(
    readonly id: string,
    readonly parentNode: FakeParent,
  ) {}
}

function setup(ids: string[]) {
  const parent = new FakeParent()
  parent.children = ids.map((id) => new FakeChild(id, parent))
  const els = new Map(parent.children.map((c) => [c.id, c as unknown as Element]))
  const run = (want: string[], last: Record<string, string> = {}) => {
    parent.moves = 0
    reorder(parent as unknown as Element, els, want, last, 'k')
    return { order: parent.children.map((c) => c.id), moves: parent.moves }
  }
  return run
}

describe('reorder', () => {
  it('reaches the wanted order, moving only what lies outside the longest kept run', () => {
    const run = setup(['a', 'b', 'c', 'd', 'e', 'f'])
    const want = ['b', 'c', 'a', 'e', 'f', 'd']
    const { order, moves } = run(want)
    expect(order).toEqual(want)
    // Current positions in wanted order: [1, 2, 0, 4, 5, 3]; the longest run is 4 long.
    expect(moves).toBe(want.length - longestIncreasing([1, 2, 0, 4, 5, 3]).length)
    expect(moves).toBe(2)
  })

  it('one element from the front to the back is one move, not n − 1', () => {
    const run = setup(['a', 'b', 'c', 'd', 'e'])
    expect(run(['b', 'c', 'd', 'e', 'a'])).toEqual({ order: ['b', 'c', 'd', 'e', 'a'], moves: 1 })
  })

  it('a reversal reaches the reversed order', () => {
    const run = setup(['a', 'b', 'c', 'd'])
    expect(run(['d', 'c', 'b', 'a'])).toEqual({ order: ['d', 'c', 'b', 'a'], moves: 3 })
  })

  it('an unchanged order since the last call does nothing', () => {
    const run = setup(['a', 'b', 'c'])
    const last: Record<string, string> = {}
    run(['c', 'a', 'b'], last)
    expect(run(['c', 'a', 'b'], last).moves).toBe(0)
  })
})
