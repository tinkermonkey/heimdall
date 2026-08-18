import { test, expect } from '@playwright/test'
import { bezierPath, cubicBezierPath, edgeLabelSize, findClearLabelPosition, type EdgeEndpointRect } from '../src/utils/graph'

// findClearLabelPosition doesn't touch the browser — same pure-function testing style as
// graph-layout.spec.ts's forceLayout coverage.

function overlaps(labelCenter: { x: number; y: number }, size: { width: number; height: number }, rect: EdgeEndpointRect): boolean {
  const halfW = size.width / 2
  const halfH = size.height / 2
  const oHalfW = rect.width / 2
  const oHalfH = rect.height / 2
  return Math.abs(labelCenter.x - rect.x) < halfW + oHalfW && Math.abs(labelCenter.y - rect.y) < halfH + oHalfH
}

test.describe('findClearLabelPosition', () => {
  test('keeps the default midpoint when nothing is in the way', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 300, y: 0 }
    const path = bezierPath(p1, p2, 0.15)
    const size = edgeLabelSize('contains')

    const pos = findClearLabelPosition(path.points, size, [])

    expect(pos.x).toBeCloseTo(path.mid.x, 5)
    expect(pos.y).toBeCloseTo(path.mid.y, 5)
  })

  test('steps away from the midpoint when a third node sits on top of it', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 400, y: 0 }
    const path = bezierPath(p1, p2, 0.15)
    const size = edgeLabelSize('contains')
    // A default-sized GraphNode parked right on the curve's natural midpoint — same shape as
    // the bug report: a third, unrelated node sitting where an edge label would otherwise land.
    const blocker: EdgeEndpointRect = { x: path.mid.x, y: path.mid.y, width: 138, height: 30 }

    const pos = findClearLabelPosition(path.points, size, [blocker], 6)

    expect(overlaps(pos, size, blocker)).toBe(false)
    // And it didn't have to abandon the curve to do it — still one of the sampled candidates.
    expect(pos.x === path.mid.x && pos.y === path.mid.y).toBe(false)
  })

  test('falls back to the exact midpoint when every candidate collides', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 300, y: 0 }
    const path = bezierPath(p1, p2, 0.15)
    const size = edgeLabelSize('contains')
    // One giant blocker spanning the whole curve — no candidate t can clear it, so the function
    // should give up and return the true midpoint rather than silently picking something arbitrary.
    const blocker: EdgeEndpointRect = { x: 150, y: 0, width: 500, height: 500 }

    const pos = findClearLabelPosition(path.points, size, [blocker], 6)

    expect(pos.x).toBeCloseTo(path.mid.x, 5)
    expect(pos.y).toBeCloseTo(path.mid.y, 5)
  })

  test('clears an obstacle sitting on the midpoint of a cubic (anchored) edge', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 400, y: 0 }
    const path = cubicBezierPath(p1, p2, 'right', 'left', 0.3)
    const size = edgeLabelSize('depends on')
    const blocker: EdgeEndpointRect = { x: path.mid.x, y: path.mid.y, width: 138, height: 30 }

    const pos = findClearLabelPosition(path.points, size, [blocker], 6)

    expect(overlaps(pos, size, blocker)).toBe(false)
  })

  test('never needs to consider a fourth candidate when the midpoint is already clear', () => {
    // Two nodes far from the curve's midpoint — the very first (and default) candidate should win.
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 300, y: 0 }
    const path = bezierPath(p1, p2, 0.15)
    const size = edgeLabelSize('contains')
    const farAway: EdgeEndpointRect[] = [
      { x: -500, y: -500, width: 100, height: 40 },
      { x: 800, y: 800, width: 100, height: 40 },
    ]

    const pos = findClearLabelPosition(path.points, size, farAway, 6)

    expect(pos.x).toBeCloseTo(path.mid.x, 5)
    expect(pos.y).toBeCloseTo(path.mid.y, 5)
  })
})
