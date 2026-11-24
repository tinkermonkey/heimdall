import { describe, expect, it } from 'vitest'
import {
  clampPaneRailPosition,
  nearestPaneRailMarkIndex,
  nextPaneRailMarkIndex,
  orderPaneRailMarks,
  type PaneRailMark,
} from './paneRailMarks'

const mark = (id: string, position: number): PaneRailMark => ({ id, position, label: id })

describe('clampPaneRailPosition', () => {
  it('keeps positions inside 0..1', () => {
    expect(clampPaneRailPosition(0)).toBe(0)
    expect(clampPaneRailPosition(0.42)).toBe(0.42)
    expect(clampPaneRailPosition(1)).toBe(1)
  })

  it('clamps positions outside 0..1', () => {
    expect(clampPaneRailPosition(-0.2)).toBe(0)
    expect(clampPaneRailPosition(1.5)).toBe(1)
  })

  it('sends non-finite positions to 0', () => {
    expect(clampPaneRailPosition(NaN)).toBe(0)
    expect(clampPaneRailPosition(Infinity)).toBe(0)
  })
})

describe('orderPaneRailMarks', () => {
  it('sorts marks top to bottom', () => {
    const ordered = orderPaneRailMarks([mark('c', 0.9), mark('a', 0.1), mark('b', 0.5)])
    expect(ordered.map((m) => m.id)).toEqual(['a', 'b', 'c'])
  })

  it('keeps input order for marks at the same position', () => {
    const ordered = orderPaneRailMarks([mark('x', 0.5), mark('y', 0.2), mark('z', 0.5)])
    expect(ordered.map((m) => m.id)).toEqual(['y', 'x', 'z'])
  })

  it('clamps positions and leaves the input unchanged', () => {
    const input = [mark('below', 2), mark('above', -1)]
    const ordered = orderPaneRailMarks(input)
    expect(ordered.map((m) => [m.id, m.position])).toEqual([
      ['above', 0],
      ['below', 1],
    ])
    expect(input[0].position).toBe(2)
    expect(input[1].position).toBe(-1)
  })

  it('keeps tone and label', () => {
    const [only] = orderPaneRailMarks([{ id: 'r', position: 0.3, tone: 'rose', label: 'Rejected' }])
    expect(only).toEqual({ id: 'r', position: 0.3, tone: 'rose', label: 'Rejected' })
  })

  it('orders hundreds of marks', () => {
    const many = Array.from({ length: 500 }, (_, i) => mark(`m${i}`, ((i * 37) % 500) / 499))
    const ordered = orderPaneRailMarks(many)
    expect(ordered).toHaveLength(500)
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].position).toBeGreaterThanOrEqual(ordered[i - 1].position)
    }
  })
})

describe('nextPaneRailMarkIndex', () => {
  it('moves one mark with the arrow keys and stops at the ends', () => {
    expect(nextPaneRailMarkIndex(2, 'ArrowDown', 5)).toBe(3)
    expect(nextPaneRailMarkIndex(4, 'ArrowDown', 5)).toBe(4)
    expect(nextPaneRailMarkIndex(2, 'ArrowUp', 5)).toBe(1)
    expect(nextPaneRailMarkIndex(0, 'ArrowUp', 5)).toBe(0)
  })

  it('jumps to the ends with Home and End', () => {
    expect(nextPaneRailMarkIndex(3, 'Home', 5)).toBe(0)
    expect(nextPaneRailMarkIndex(1, 'End', 5)).toBe(4)
  })

  it('ignores other keys and empty rails', () => {
    expect(nextPaneRailMarkIndex(1, 'Enter', 5)).toBeNull()
    expect(nextPaneRailMarkIndex(1, 'ArrowLeft', 5)).toBeNull()
    expect(nextPaneRailMarkIndex(0, 'ArrowDown', 0)).toBeNull()
  })
})

describe('nearestPaneRailMarkIndex', () => {
  const ordered = orderPaneRailMarks([mark('a', 0.1), mark('b', 0.4), mark('c', 0.8)])

  it('starts at the first mark without a selection', () => {
    expect(nearestPaneRailMarkIndex(ordered, undefined)).toBe(0)
  })

  it('finds the mark nearest the selection', () => {
    expect(nearestPaneRailMarkIndex(ordered, 0.45)).toBe(1)
    expect(nearestPaneRailMarkIndex(ordered, 0.7)).toBe(2)
    expect(nearestPaneRailMarkIndex(ordered, 3)).toBe(2)
  })

  it('returns 0 for no marks', () => {
    expect(nearestPaneRailMarkIndex([], 0.5)).toBe(0)
  })
})
