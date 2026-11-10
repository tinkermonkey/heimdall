import { describe, expect, it } from 'vitest'
import { computeDropdownPosition, type DropdownRect } from './dropdownPlacement'

const viewport = { width: 1000, height: 800 }
const panel = { width: 160, height: 200 }

// A 32×32 trigger with its top-left corner at (x, y).
const anchorAt = (x: number, y: number, w = 32, h = 32): DropdownRect => ({
  left: x,
  top: y,
  right: x + w,
  bottom: y + h,
})

describe('computeDropdownPosition', () => {
  it('places bottom-start below the trigger, left edges aligned', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(100, 100), panel, viewport })
    expect(pos).toEqual({ top: 136, left: 100, placement: 'bottom-start', availableHeight: 800 - 132 - 4 - 8 })
  })

  it('places bottom-end with right edges aligned', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(300, 100), panel, viewport, placement: 'bottom-end' })
    expect(pos.left).toBe(332 - 160)
    expect(pos.placement).toBe('bottom-end')
  })

  it('places top-start above the trigger', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(100, 400), panel, viewport, placement: 'top-start' })
    expect(pos.top).toBe(400 - 4 - 200)
    expect(pos.placement).toBe('top-start')
    expect(pos.availableHeight).toBe(400 - 4 - 8)
  })

  it('honours a custom offset and margin', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(100, 100), panel, viewport, offset: 10, margin: 0 })
    expect(pos.top).toBe(142)
    expect(pos.availableHeight).toBe(800 - 132 - 10)
  })

  it('flips bottom to top when there is no room below and more room above', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(100, 700), panel, viewport })
    expect(pos.placement).toBe('top-start')
    expect(pos.top).toBe(700 - 4 - 200)
  })

  it('flips top to bottom when there is no room above and more room below', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(300, 40), panel, viewport, placement: 'top-end' })
    expect(pos.placement).toBe('bottom-end')
    expect(pos.top).toBe(76)
  })

  it('keeps the requested side when neither side fits but it has more room', () => {
    const tall = { width: 160, height: 700 }
    const pos = computeDropdownPosition({ anchor: anchorAt(100, 300), panel: tall, viewport })
    expect(pos.placement).toBe('bottom-start')
    expect(pos.availableHeight).toBe(800 - 332 - 4 - 8)
  })

  it('anchors a top panel that is shorter than its content to the available space', () => {
    const tall = { width: 160, height: 700 }
    const pos = computeDropdownPosition({ anchor: anchorAt(100, 600), panel: tall, viewport })
    expect(pos.placement).toBe('top-start')
    // Panel is capped at availableHeight, so its top sits at the margin.
    expect(pos.top).toBe(8)
  })

  it('flips start to end when the panel would cross the right edge', () => {
    // Kebab in a narrow last column, flush with the right edge of the viewport.
    const pos = computeDropdownPosition({ anchor: anchorAt(950, 100), panel, viewport })
    expect(pos.placement).toBe('bottom-end')
    expect(pos.left).toBe(982 - 160)
  })

  it('flips end to start when the panel would cross the left edge', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(10, 100), panel, viewport, placement: 'bottom-end' })
    expect(pos.placement).toBe('bottom-start')
    expect(pos.left).toBe(10)
  })

  it('clamps inside the viewport when neither alignment fits', () => {
    const wide = { width: 900, height: 100 }
    const pos = computeDropdownPosition({ anchor: anchorAt(500, 100), panel: wide, viewport })
    expect(pos.left).toBe(1000 - 8 - 900)
    expect(pos.placement).toBe('bottom-start')
  })

  it('clamps to the margin when the trigger is scrolled past the left edge', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(-50, 100), panel, viewport })
    expect(pos.left).toBe(8)
  })

  it('never reports negative available height', () => {
    const pos = computeDropdownPosition({ anchor: anchorAt(100, 900), panel, viewport })
    expect(pos.availableHeight).toBeGreaterThanOrEqual(0)
  })
})
