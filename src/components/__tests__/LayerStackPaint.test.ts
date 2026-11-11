// LayerStack paints depth order by moving the fewest elements: everything outside a longest
// increasing run of current positions (tinkermonkey/heimdall#335).
import { describe, it, expect } from 'vitest'
import { longestIncreasing } from '../LayerStack'

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
