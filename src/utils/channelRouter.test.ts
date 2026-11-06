import { describe, it, expect } from 'vitest'
import { nudgeOverlappingSegments, polylineToRoutedEdge, routeNavigationEdge, routeNavigationEdges, searchStats } from './channelRouter'
import type { EdgeEndpointRect } from './graph'

describe('channelRouter', () => {
  describe('routeNavigationEdge', () => {
    it('creates orthogonal paths with no obstacles', () => {
      const source: EdgeEndpointRect = { x: 0, y: 0, width: 50, height: 50 }
      const target: EdgeEndpointRect = { x: 200, y: 150, width: 50, height: 50 }

      const result = routeNavigationEdge(source, target)

      expect(result.isPolyline).toBe(true)
      expect(result.points.length).toBeGreaterThanOrEqual(3)

      // Verify all segments are orthogonal (not diagonal)
      for (let i = 0; i < result.points.length - 1; i++) {
        const p1 = result.points[i]
        const p2 = result.points[i + 1]
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })

    it('avoids obstacles with orthogonal paths', () => {
      const source: EdgeEndpointRect = { x: 0, y: 0, width: 50, height: 50 }
      const target: EdgeEndpointRect = { x: 200, y: 0, width: 50, height: 50 }
      const obstacle: EdgeEndpointRect = { x: 100, y: 0, width: 50, height: 50 }

      const result = routeNavigationEdge(source, target, [obstacle])

      // Path should avoid the obstacle, not go straight through
      expect(result.points.length).toBeGreaterThan(3)

      // Verify orthogonality maintained despite obstacles
      for (let i = 0; i < result.points.length - 1; i++) {
        const p1 = result.points[i]
        const p2 = result.points[i + 1]
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })

    it('maintains orthogonality without obstacles', () => {
      const source: EdgeEndpointRect = { x: 0, y: 0, width: 50, height: 50 }
      const target: EdgeEndpointRect = { x: 200, y: 150, width: 50, height: 50 }

      const result = routeNavigationEdge(source, target)

      // Path must be orthogonal
      for (let i = 0; i < result.points.length - 1; i++) {
        const p1 = result.points[i]
        const p2 = result.points[i + 1]
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })
  })

  describe('routeNavigationEdges', () => {
    it('routes multiple edges without breaking polylines', () => {
      const edges = [
        {
          id: 'edge1',
          source: { x: 0, y: 0, width: 50, height: 50 },
          target: { x: 200, y: 100, width: 50, height: 50 },
        },
        {
          id: 'edge2',
          source: { x: 0, y: 200, width: 50, height: 50 },
          target: { x: 200, y: 300, width: 50, height: 50 },
        },
      ]

      const result = routeNavigationEdges(edges)

      expect(result.size).toBe(2)

      // Check both routes maintain orthogonality
      for (const route of result.values()) {
        expect(route.isPolyline).toBe(true)
        for (let i = 0; i < route.points.length - 1; i++) {
          const p1 = route.points[i]
          const p2 = route.points[i + 1]
          const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
          const isVertical = Math.abs(p1.x - p2.x) < 0.01
          expect(isHorizontal || isVertical).toBe(true)
        }
      }
    })

    it('routes single edge with specified trace spacing', () => {
      const edges = [
        {
          id: 'edge1',
          source: { x: 0, y: 0, width: 50, height: 50 },
          target: { x: 300, y: 300, width: 50, height: 50 },
        },
      ]

      const result = routeNavigationEdges(edges, [], 16)

      expect(result.size).toBe(1)
      const route = result.get('edge1')!
      expect(route).toBeDefined()

      // Verify path is orthogonal
      for (let i = 0; i < route.points.length - 1; i++) {
        const p1 = route.points[i]
        const p2 = route.points[i + 1]
        const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
        const isVertical = Math.abs(p1.x - p2.x) < 0.01
        expect(isHorizontal || isVertical).toBe(true)
      }
    })

    it('nudges overlapping segments while maintaining orthogonality', () => {
      const edges = [
        {
          id: 'edge1',
          source: { x: 0, y: 0, width: 50, height: 50 },
          target: { x: 300, y: 0, width: 50, height: 50 },
        },
        {
          id: 'edge2',
          source: { x: 0, y: 10, width: 50, height: 50 },
          target: { x: 300, y: 10, width: 50, height: 50 },
        },
      ]

      const result = routeNavigationEdges(edges, [], 16)

      expect(result.size).toBe(2)

      // Both routes should remain orthogonal after nudging
      for (const route of result.values()) {
        for (let i = 0; i < route.points.length - 1; i++) {
          const p1 = route.points[i]
          const p2 = route.points[i + 1]
          const isHorizontal = Math.abs(p1.y - p2.y) < 0.01
          const isVertical = Math.abs(p1.x - p2.x) < 0.01
          expect(isHorizontal || isVertical).toBe(true)
        }
      }
    })

    it('generates valid SVG path strings', () => {
      const edges = [
        {
          id: 'edge1',
          source: { x: 0, y: 0, width: 50, height: 50 },
          target: { x: 200, y: 100, width: 50, height: 50 },
        },
      ]

      const result = routeNavigationEdges(edges)
      const route = result.get('edge1')!

      // Path should start with M and contain L commands
      expect(route.d).toMatch(/^M \d+ \d+/)
      expect(route.d).toContain('L')

      // Path should be parseable (basic validation)
      const parts = route.d.split(' ')
      expect(parts[0]).toBe('M')
      expect(parts.length).toBeGreaterThanOrEqual(5) // At least M x y L x y
    })
  })
})

describe('polylineToRoutedEdge', () => {
  it('anchors the label on the longest straight segment, never on a bend corner', () => {
    // An L: a short 20 px stub, then a 200 px run.
    const r = polylineToRoutedEdge([{ x: 0, y: 0 }, { x: 0, y: 20 }, { x: 200, y: 20 }])!
    expect(r.labelAnchors![0]).toEqual({ x: 100, y: 20 })
    expect(r.mid).toEqual({ x: 100, y: 20 })
    expect(r.labelAnchors!.slice(1, 3)).toEqual([{ x: 60, y: 20 }, { x: 140, y: 20 }])
    expect(r.labelAnchors).toHaveLength(6)
    expect(r.d.startsWith('M')).toBe(true)
    expect(polylineToRoutedEdge([{ x: 0, y: 0 }])).toBeNull()
  })

  describe('blocked routes', () => {
    // Four full rows of 100x30 boxes 10 px apart (too narrow for a route); the two middle rows
    // each have one wide gap, on opposite sides. No shape with three bends or fewer is clear, so
    // the route must search: down through the row gaps, sideways at each gap (2026-11-05).
    it('steps through staggered row gaps instead of crossing a box', () => {
      const rects = staggeredRows(3, -3)
      const { source, target, route } = routeBetween(rects, { x: 0, y: 0 }, { x: 0, y: 300 })
      expectClear(route.points, rects, source, target)
      // Through the two gaps (330 px out and back, twice), not round the 2,300 px wide rows.
      expect(length(route.points)).toBeLessThan(2000)
      // Not along the target's row 10 px above its boxes' tops: the gap above it is 70 px tall,
      // and its middle is as short (searchLanes' near-box cost).
      expect(huggedLength(route.points, rects, source, target)).toBeLessThanOrEqual(2 * OBSTACLE_PADDING)
    })

    // The same rows with both gaps outside the first search window (300 px past the two boxes):
    // only the search over the whole drawing finds them.
    it('searches the whole drawing when the window round the two boxes has no route', () => {
      const rects = staggeredRows(6, -6)
      const { source, target, route } = routeBetween(rects, { x: 0, y: 0 }, { x: 0, y: 300 })
      expectClear(route.points, rects, source, target)
      // Through the gaps at x = ±660 (about 2,940 px), not round the rows' ends (about 5,000).
      expect(length(route.points)).toBeLessThan(3500)
    })

    // Row 100's only gap is 25 px wide (255..280): too narrow for the lanes 20 px outside its
    // boxes, so only its middle (267.5) passes. A box elsewhere (y = -150) has its left edge at
    // 262, inside the gap; "the next box edge past this box" was that edge, and the gap's middle
    // was never a lane.
    it('finds the middle of a narrow gap that another row\'s box edge falls inside', () => {
      const rects = staggeredRows(null, -3)
      const narrow = rects.findIndex(r => r.x === 220 && r.y === 100)
      rects[narrow] = { x: 212.5, y: 100, width: 85, height: 30 }
      rects.push({ x: 312, y: -150, width: 100, height: 30 })
      const { source, target, route } = routeBetween(rects, { x: 0, y: 0 }, { x: 0, y: 300 })
      expectClear(route.points, rects, source, target)
      expect(route.points.some(p => p.x === 267.5)).toBe(true)
      expect(length(route.points)).toBeLessThan(2000)
    })

    // A 300 px wide source over a row whose only gap (50..170) is under its right half: the
    // route leaves the bottom side above the gap, not from the side's middle (over a box) with a
    // jog over to the gap.
    it('leaves a wide box off-centre, straight down through a gap', () => {
      const box = (x: number, y: number): EdgeEndpointRect => ({ x, y, width: 100, height: 30 })
      const rects: EdgeEndpointRect[] = [{ x: 0, y: 0, width: 300, height: 30 }]
      for (let k = -10; k <= 10; k++) {
        if (Math.abs(k) >= 2) rects.push(box(k * 110, 0))
        rects.push(box(k * 110, 300))
        if (k !== 1) rects.push(box(k * 110, 100))
        if (k !== -1) rects.push(box(k * 110, 200))
      }
      const { source, target, route } = routeBetween(rects, { x: 0, y: 0 }, { x: 0, y: 300 })
      expectClear(route.points, rects, source, target)
      // Off-centre, through the gap at least OBSTACLE_PADDING from its sides (50..170), past row 100.
      const [port, bend] = route.points
      expect(port.y).toBe(15)
      expect(port.x).toBeGreaterThanOrEqual(50 + OBSTACLE_PADDING)
      expect(port.x).toBeLessThanOrEqual(170 - OBSTACLE_PADDING)
      expect(bend.x).toBe(port.x)
      expect(bend.y).toBeGreaterThan(115)
    })

    // Two rows of 100x30 boxes with gaps at ±110; source above, target below, nothing beside
    // them. A clear shape exists (out past the rows' ends and back, 1,440 px), but it is more than
    // SEARCH_DETOUR times the shortest possible, so the search runs and goes through the gaps.
    it('searches for a shorter route when the cheapest clear shape goes round everything', () => {
      const box = (x: number, y: number): EdgeEndpointRect => ({ x, y, width: 100, height: 30 })
      const rects: EdgeEndpointRect[] = [box(0, 0), box(0, 300)]
      for (let k = -5; k <= 5; k++) {
        if (k !== 1) rects.push(box(k * 110, 100))
        if (k !== -1) rects.push(box(k * 110, 200))
      }
      const { source, target, route } = routeBetween(rects, { x: 0, y: 0 }, { x: 0, y: 300 })
      expectClear(route.points, rects, source, target)
      expect(length(route.points)).toBeLessThan(900)
    })

    // 20x20 grid of 160x40 boxes with 30 px column and 40 px row gaps, routes to the diagonal
    // neighbour: the best route is a Z (110 px) against a 70 px box-to-box gap, which is no
    // detour — the ports are on the sides' middles. The search must not run for it.
    it('does not search for routes between close diagonal neighbours', () => {
      const rects: EdgeEndpointRect[] = []
      for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) rects.push({ x: i * 190, y: j * 80, width: 160, height: 40 })
      const edges = []
      for (let i = 0; i < 19; i++) for (let j = 0; j < 19; j += 3) edges.push({ id: `${i}_${j}`, source: rects[i * 20 + j], target: rects[(i + 1) * 20 + j + 1] })
      const before = searchStats.calls
      const routes = routeNavigationEdges(edges, rects)
      expect(searchStats.calls - before).toBe(0)
      for (const e of edges) {
        const route = routes.get(e.id)!
        expectClear(route.points, rects, e.source, e.target)
        expect(length(route.points)).toBeLessThanOrEqual(110)
      }
    })

    // A target boxed in by four neighbours closer than 2 * MIN_CLEARANCE: no route can reach it.
    // Each route takes the fewest-hits shape at once instead of searching the whole drawing (the
    // first search version: 10 such routes among 196 boxes took 4-6 s, a frozen canvas on drag).
    // A second target ringed 40 px out (room to arrive, no way in) bounds a search that fails.
    it('gives up quickly on a target no route can reach', () => {
      let seed = 1
      const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647)
      const rects: EdgeEndpointRect[] = []
      for (let i = 0; i < 190; i++) rects.push({ x: Math.round(rnd() * 6000) + 0.5 * i, y: Math.round(rnd() * 6000) + 0.3 * i, width: 60 + Math.round(rnd() * 40), height: 30 })
      const hemmed = { x: 3000, y: 3000, width: 100, height: 30 }
      rects.push(hemmed, { x: 3000, y: 2970, width: 140, height: 20 }, { x: 3000, y: 3030, width: 140, height: 20 }, { x: 2930, y: 3000, width: 20, height: 90 }, { x: 3070, y: 3000, width: 20, height: 90 })
      const ringed = { x: 1000, y: 5000, width: 100, height: 30 }
      rects.push(ringed, { x: 1000, y: 4935, width: 220, height: 20 }, { x: 1000, y: 5065, width: 220, height: 20 }, { x: 900, y: 5000, width: 20, height: 150 }, { x: 1100, y: 5000, width: 20, height: 150 })
      const edges = []
      for (let i = 0; i < 10; i++) edges.push({ id: `h${i}`, source: rects[i], target: hemmed }, { id: `r${i}`, source: rects[i], target: ringed })
      const t0 = performance.now()
      const routes = routeNavigationEdges(edges, rects)
      // About 100 ms on an idle machine (main, without the search: 50 ms); the bound has headroom for a loaded one.
      expect(performance.now() - t0).toBeLessThan(1500)
      expect(routes.size).toBe(20)
    })
  })
})

describe('nudgeOverlappingSegments', () => {
  // A and B share y = 0 over x 0..400; C runs at y = 8 beside them. Fanning A and B out puts B's
  // slot at +8, on C's line: B takes the next free slot out (+16) instead (2026-11-05).
  it('does not move a segment onto another route\'s line', () => {
    const rect = (x: number, y: number): EdgeEndpointRect => ({ x, y, width: 40, height: 30 })
    const make = (x1: number, y: number, x2: number) => polylineToRoutedEdge([{ x: x1, y: -85 }, { x: x1, y }, { x: x2, y }, { x: x2, y: 85 }])!
    const routes = new Map([['a', make(0, 0, 400)], ['b', make(10, 0, 390)], ['c', make(20, 8, 380)]])
    const endpoints = new Map([
      ['a', { source: rect(0, -100), target: rect(400, 100) }],
      ['b', { source: rect(10, -100), target: rect(390, 100) }],
      ['c', { source: rect(20, -100), target: rect(380, 100) }],
    ])
    nudgeOverlappingSegments(routes, endpoints, [], 16)
    const y = (id: string) => routes.get(id)!.points[1].y
    expect(y('c')).toBe(8)
    expect(Math.abs(y('a') - y('b'))).toBeGreaterThanOrEqual(16)
    for (const id of ['a', 'b']) expect(Math.abs(y(id) - y('c'))).toBeGreaterThanOrEqual(8)
  })
})

// ─── helpers ────────────────────────────────────────────────────────────────

const OBSTACLE_PADDING = 20
const MIN_CLEARANCE = 10

type P = { x: number; y: number }

/** Rows of 100x30 boxes, 110 px pitch, at y = 0, 100, 200, 300; one box missing from row 100 at k = gap100, from row 200 at k = gap200. */
function staggeredRows(gap100: number | null, gap200: number | null): EdgeEndpointRect[] {
  const box = (x: number, y: number): EdgeEndpointRect => ({ x, y, width: 100, height: 30 })
  const rects: EdgeEndpointRect[] = []
  for (let k = -10; k <= 10; k++) {
    rects.push(box(k * 110, 0), box(k * 110, 300))
    if (k !== gap100) rects.push(box(k * 110, 100))
    if (k !== gap200) rects.push(box(k * 110, 200))
  }
  return rects
}

function routeBetween(rects: EdgeEndpointRect[], s: P, t: P) {
  const source = rects.find(r => r.x === s.x && r.y === s.y)!
  const target = rects.find(r => r.x === t.x && r.y === t.y)!
  const route = routeNavigationEdges([{ id: 'e', source, target }], rects).get('e')!
  return { source, target, route }
}

function length(points: P[]): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) total += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y)
  return total
}

/** Whether segment a-b passes strictly inside box r grown by `pad`. */
function hitsBox(a: P, b: P, r: EdgeEndpointRect, pad: number): boolean {
  return Math.min(a.x, b.x) < r.x + r.width / 2 + pad && Math.max(a.x, b.x) > r.x - r.width / 2 - pad &&
    Math.min(a.y, b.y) < r.y + r.height / 2 + pad && Math.max(a.y, b.y) > r.y - r.height / 2 - pad
}

/** Orthogonal, and MIN_CLEARANCE clear of every box but the route's own two ends. */
function expectClear(points: P[], rects: EdgeEndpointRect[], source: EdgeEndpointRect, target: EdgeEndpointRect) {
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]]
    expect(a.x === b.x || a.y === b.y).toBe(true)
    for (const r of rects) {
      if (r === source || r === target) continue
      expect(hitsBox(a, b, r, MIN_CLEARANCE), `segment ${JSON.stringify([a, b])} within ${MIN_CLEARANCE} px of ${JSON.stringify(r)}`).toBe(false)
    }
  }
}

/** Length of the route's segments running parallel to a box side closer than OBSTACLE_PADDING (own ends included). */
function huggedLength(points: P[], rects: EdgeEndpointRect[], source: EdgeEndpointRect, target: EdgeEndpointRect): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]]
    let worst = 0
    for (const r of [...rects, source, target]) {
      if (!hitsBox(a, b, r, OBSTACLE_PADDING)) continue
      const along = a.y === b.y
        ? Math.min(Math.max(a.x, b.x), r.x + r.width / 2 + OBSTACLE_PADDING) - Math.max(Math.min(a.x, b.x), r.x - r.width / 2 - OBSTACLE_PADDING)
        : Math.min(Math.max(a.y, b.y), r.y + r.height / 2 + OBSTACLE_PADDING) - Math.max(Math.min(a.y, b.y), r.y - r.height / 2 - OBSTACLE_PADDING)
      worst = Math.max(worst, along)
    }
    total += worst
  }
  return total
}
