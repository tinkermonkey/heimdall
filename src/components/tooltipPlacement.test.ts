import { describe, expect, it } from 'vitest'
import { computeTooltipPosition, type TooltipRect } from './tooltipPlacement'

const bounds: TooltipRect = { top: 0, left: 0, right: 800, bottom: 600 }
const card = { width: 200, height: 60 }

// A 40×12 label box with its top-left corner at (x, y).
const labelAt = (x: number, y: number, w = 40, h = 12): TooltipRect => ({ left: x, top: y, right: x + w, bottom: y + h })

const overlaps = (a: TooltipRect, b: TooltipRect) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

const cardRect = (pos: { top: number; left: number }): TooltipRect => ({
  top: pos.top,
  left: pos.left,
  right: pos.left + card.width,
  bottom: pos.top + card.height,
})

describe('computeTooltipPosition', () => {
  it('places the card above the anchor, centred, with the gap', () => {
    const anchor = labelAt(380, 300)
    const pos = computeTooltipPosition({ anchor, card, bounds })
    expect(pos).toEqual({ placement: 'top', top: 300 - 6 - 60, left: 400 - 100 })
    expect(overlaps(cardRect(pos), anchor)).toBe(false)
  })

  it('flips below when there is no room above', () => {
    const anchor = labelAt(380, 20)
    const pos = computeTooltipPosition({ anchor, card, bounds })
    expect(pos.placement).toBe('bottom')
    expect(pos.top).toBe(32 + 6)
    expect(overlaps(cardRect(pos), anchor)).toBe(false)
  })

  it('flips above from a bottom preference when there is no room below', () => {
    const anchor = labelAt(380, 570)
    const pos = computeTooltipPosition({ anchor, card, bounds, placement: 'bottom' })
    expect(pos.placement).toBe('top')
    expect(pos.top).toBe(570 - 6 - 60)
  })

  it('falls back to a perpendicular side when neither vertical side has room', () => {
    const short: TooltipRect = { top: 0, left: 0, right: 800, bottom: 100 }
    const anchor = labelAt(100, 44)
    const pos = computeTooltipPosition({ anchor, card, bounds: short })
    expect(pos.placement).toBe('right')
    expect(pos.left).toBe(140 + 6)
    expect(overlaps(cardRect(pos), anchor)).toBe(false)
  })

  it('takes the left side when the right has no room either', () => {
    const short: TooltipRect = { top: 0, left: 0, right: 800, bottom: 100 }
    const anchor = labelAt(700, 44)
    const pos = computeTooltipPosition({ anchor, card, bounds: short })
    expect(pos.placement).toBe('left')
    expect(pos.left).toBe(700 - 6 - 200)
    expect(overlaps(cardRect(pos), anchor)).toBe(false)
  })

  it('clamps along the cross axis near a side edge', () => {
    const pos = computeTooltipPosition({ anchor: labelAt(5, 300), card, bounds })
    expect(pos.placement).toBe('top')
    expect(pos.left).toBe(4)
    const right = computeTooltipPosition({ anchor: labelAt(770, 300), card, bounds })
    expect(right.left).toBe(800 - 4 - 200)
  })

  it('treats a zero-size anchor as a point', () => {
    const pos = computeTooltipPosition({ anchor: { top: 300, bottom: 300, left: 400, right: 400 }, card, bounds })
    expect(pos).toEqual({ placement: 'top', top: 300 - 6 - 60, left: 300 })
  })

  it('uses the least-overflowing side and stays inside bounds when nothing fits', () => {
    const tiny: TooltipRect = { top: 0, left: 0, right: 220, bottom: 80 }
    const pos = computeTooltipPosition({ anchor: labelAt(90, 30, 40, 12), card, bounds: tiny })
    expect(pos.left).toBeGreaterThanOrEqual(4)
    expect(pos.left + card.width).toBeLessThanOrEqual(220 - 4 + 1e-9)
    expect(pos.top).toBeGreaterThanOrEqual(4)
  })

  it('respects custom offset and margin', () => {
    const pos = computeTooltipPosition({ anchor: labelAt(380, 300), card, bounds, offset: 10, margin: 0 })
    expect(pos.top).toBe(300 - 10 - 60)
  })
})
