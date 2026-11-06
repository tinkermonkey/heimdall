import type { Point } from './graph'

/**
 * Orthogonal edge routing over a cell grid in two stages: a path search that decides which
 * channels and empty cells each edge passes through, then an assignment that gives every straight
 * run of every route its own line. The same split as libavoid's orthogonal connector routing
 * (path search, then nudging; Wybrow, Marriott and Stuckey 2009) and yFiles' EdgeRouter (path
 * search over partition cells, then segment coordinate assignment).
 *
 * The plane is a grid of tiles: cell tiles (one per grid cell; a node's cell is closed to every
 * edge but its own), channel tiles between neighboring rows or columns, and junction tiles where
 * two channels meet. A route moves tile to tile. Along a channel it uses a channel track; through
 * an empty cell (or across a channel, in line with a row or column of cells) it uses one of that
 * row's or column's port lines, the lines a node side's ports sit on.
 *
 * Port lines are fixed (`portX` per column, `portY` per row), so the search treats them as hard
 * capacity: a tile carries at most as many routes along a row or column as there are lines, and a
 * node side at most as many as its own ports. Channel tracks are not fixed: a channel holds as many
 * tracks as the routes through it need, at a soft cost past `lanes`, and the caller sizes the cell
 * pitch from the busiest channel (`tracksV`, `tracksH`). So a route never has to cross a node or
 * share a line for want of room, and the search never exhausts the plane looking for a free lane.
 *
 * Assignment is interval coloring per line family (one channel, or one row's or column's port
 * lines): two runs whose tile spans overlap get different lines. Within a family, runs are ranked
 * so that a run whose ends turn toward the low side sits on the low side of the runs it overlaps
 * (fewer crossings, nested fans), and each overlap cluster is centred on the channel's middle.
 *
 * Deterministic: edges in the given order, heap ties by state index, families in index order.
 */

export interface ChannelRouteInput {
  col: Int32Array
  row: Int32Array
  /** Half width and half height per node. */
  hw: number[]
  hh: number[]
  edgeEnds: Array<[number, number] | null>
  /** Edge indices in routing order (edges missing here are not routed). */
  order: number[]
  /** 2 = navigation route (crossings cost double). */
  edgeClass: number[]
  /** Bus group per edge: members may share lines with each other. */
  groups: Array<number | undefined>
  maxW: number
  maxH: number
  clearance: number
  laneSpacing: number
  lanes: number
  /** Port-line offsets from the cell centre, ascending: columns (x) and rows (y). */
  portX: number[]
  portY: number[]
  bendPenalty: number
  crossingPenalty: number
}

export interface ChannelRouting {
  /** Most tracks any vertical / horizontal channel needs. */
  tracksV: number
  tracksH: number
  /** Edge indices that got no route (no free port or line); the caller draws a fallback. */
  failed: number[]
  /** Polylines (port to port) for the routed edges at this pitch; [] for failed or unrouted edges. */
  geometry(origin: Point, cw: number, ch: number): Point[][]
}

const DX = [1, 0, -1, 0]
const DY = [0, 1, 0, -1]
// A route that would make its channel the busiest yet (so widen the uniform pitch) pays this share of
// a bend per route over the current busiest: a free neighboring channel is preferred, a bend is not
// traded for it. 0.5 measured best of 0 / 0.5 / 1 on the Stage 1/2 and Stage 3 fixtures.
const CONGESTION = 0.5
// Refinement tries at most this many lines on each side of a run's current one.
const REFINE_REACH = 8

interface End { port: boolean; sign: number; node: number; pos: number }
interface Run {
  edge: number
  horizontal: boolean
  /** Tile row (horizontal) or tile column (vertical) the run lies in. */
  fam: number
  /** Inclusive tile span along the run's axis, endpoint cells excluded. */
  lo: number
  hi: number
  /** The run's low and high ends: a port (node side) or a turn toward the low (-1) or high (+1) side. */
  a: End
  b: End
  line: number
  /** Index within its edge's runs. */
  k: number
  /** Channel runs: the overlap cluster's lowest and highest line (refinement stays inside). */
  cmin: number
  cmax: number
}

export function routeChannels(inp: ChannelRouteInput): ChannelRouting {
  const n = inp.col.length
  const E = inp.edgeEnds.length
  const empty: ChannelRouting = { tracksV: 0, tracksH: 0, failed: [], geometry: () => inp.edgeEnds.map(() => []) }
  if (n === 0) return empty
  let minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity
  for (let i = 0; i < n; i++) {
    minCol = Math.min(minCol, inp.col[i]); maxCol = Math.max(maxCol, inp.col[i])
    minRow = Math.min(minRow, inp.row[i]); maxRow = Math.max(maxRow, inp.row[i])
  }
  const TX = 2 * (maxCol - minCol + 1) + 1
  const TY = 2 * (maxRow - minRow + 1) + 1
  const NT = TX * TY
  const tileOf = new Int32Array(n)
  const occ = new Int32Array(NT).fill(-1)
  for (let i = 0; i < n; i++) {
    tileOf[i] = (2 * (inp.row[i] - minRow) + 1) * TX + 2 * (inp.col[i] - minCol) + 1
    occ[tileOf[i]] = i
  }
  const s = inp.laneSpacing
  const nX = inp.portX.length, nY = inp.portY.length
  // Port lines a node side may use: within the side, 3 px from its corners (as the lattice router).
  const sideLines = (node: number, side: number): number[] => {
    const offs = side % 2 === 1 ? inp.portX : inp.portY
    const half = side % 2 === 1 ? inp.hw[node] : inp.hh[node]
    const out: number[] = []
    offs.forEach((o, k) => { if (Math.abs(o) <= half - 3) out.push(k) })
    return out
  }
  const sideCap = new Int32Array(n * 4)
  for (let i = 0; i < n; i++) for (let d = 0; d < 4; d++) sideCap[i * 4 + d] = sideLines(i, d).length
  const sideUse = new Int32Array(n * 4)

  // Tile sizes for path cost: cells span the largest node plus clearance, channels `lanes` tracks.
  const cellW = inp.maxW + 2 * inp.clearance, cellH = inp.maxH + 2 * inp.clearance
  const chan = inp.lanes * s
  const cx = new Float64Array(TX), cy = new Float64Array(TY)
  for (let x = 1; x < TX; x++) cx[x] = cx[x - 1] + ((x % 2 ? cellW : chan) + ((x - 1) % 2 ? cellW : chan)) / 2
  for (let y = 1; y < TY; y++) cy[y] = cy[y - 1] + ((y % 2 ? cellH : chan) + ((y - 1) % 2 ? cellH : chan)) / 2

  // Along a cell row (odd tile row) a route uses a row port line; along a cell column, a column
  // port line. Elsewhere it is in a channel.
  const capH = (t: number) => (((t / TX) | 0) % 2 === 1 ? nY : Infinity)
  const capV = (t: number) => ((t % TX) % 2 === 1 ? nX : Infinity)
  const useH = new Int32Array(NT), useV = new Int32Array(NT)
  const thruH = new Int32Array(NT), thruV = new Int32Array(NT)
  const groupTiles = new Map<number, Set<number>>()
  // Most routes over one channel tile so far, per axis (the pitch is set by the busiest channel).
  let busiestH = 0, busiestV = 0
  const groupSide = new Map<number, number>()

  const sideFree = (node: number, side: number, g: number | undefined) => {
    if (g !== undefined && groupSide.get(g) === node * 4 + side) return true
    return sideUse[node * 4 + side] < sideCap[node * 4 + side]
  }
  const room = (t: number, horizontal: boolean, g: number | undefined) => {
    if (g !== undefined && groupTiles.get(g)?.has(t * 2 + (horizontal ? 0 : 1))) return true
    return horizontal ? useH[t] < capH(t) : useV[t] < capV(t)
  }

  // ─── path search ───────────────────────────────────────────────────────────
  const NS = NT * 4
  const gScore = new Float64Array(NS)
  const cameFrom = new Int32Array(NS)
  const seen = new Int32Array(NS) // stamp: gScore valid
  const done = new Int32Array(NS) // stamp: closed
  let stamp = 0
  const heap = new StateHeap()

  type Path = { states: number[] }
  const paths: Array<Path | null> = inp.edgeEnds.map(() => null)

  const search = (ei: number): Path | null => {
    const [src, dst] = inp.edgeEnds[ei]!
    const g = inp.groups[ei]
    const sT = tileOf[src], tT = tileOf[dst]
    const crossPen = inp.edgeClass[ei] === 2 ? 2 * inp.crossingPenalty : inp.crossingPenalty
    const ttx = tT % TX, tty = (tT / TX) | 0
    const h = (t: number) => Math.abs(cx[t % TX] - cx[ttx]) + Math.abs(cy[(t / TX) | 0] - cy[tty])
    stamp++
    heap.clear()
    for (let d = 0; d < 4; d++) {
      if (!sideFree(src, d, g)) continue
      const st = sT * 4 + d
      seen[st] = stamp; gScore[st] = 0; cameFrom[st] = -1
      heap.push(h(sT), 0, st)
    }
    let goal = -1
    while (heap.size) {
      const st = heap.pop()
      if (done[st] === stamp) continue
      done[st] = stamp
      const v = st >> 2, dir = st & 3
      if (v === tT) { goal = st; break }
      const tx = v % TX, ty = (v / TX) | 0
      for (let nd = 0; nd < 4; nd++) {
        if (v === sT ? nd !== dir : nd === (dir + 2) % 4) continue
        const nx = tx + DX[nd], ny = ty + DY[nd]
        if (nx < 0 || ny < 0 || nx >= TX || ny >= TY) continue
        const nv = ny * TX + nx
        const horizontal = nd % 2 === 0
        const turn = nd !== dir
        if (nv === tT) { if (!sideFree(dst, (nd + 2) % 4, undefined)) continue }
        else if (occ[nv] >= 0 || !room(nv, horizontal, g)) continue
        if (turn && v !== sT && !room(v, horizontal, g)) continue
        let cost = horizontal ? Math.abs(cx[nx] - cx[tx]) : Math.abs(cy[ny] - cy[ty])
        // Crossings: passing straight through a tile crosses every route that passes straight
        // through it the other way. Routes that turn in it cross or not by line order, which the
        // assignment below decides (pricing them here measured worse: more detours and bends).
        if (turn && v !== sT) cost += inp.bendPenalty
        else if (v !== sT) cost += crossPen * (horizontal ? thruV[v] : thruH[v])
        // Congestion past `lanes` in a channel (port-line capacity is hard, above).
        if (nv !== tT && (horizontal ? capH(nv) : capV(nv)) === Infinity && !(g !== undefined && groupTiles.get(g)?.has(nv * 2 + (horizontal ? 0 : 1)))) {
          // The pitch is uniform, so only a route that would make this channel the busiest yet
          // widens the drawing; below that a channel's extra track is free.
          const u = horizontal ? useH[nv] : useV[nv]
          const cap = Math.max(inp.lanes, horizontal ? busiestH : busiestV)
          if (u >= cap) cost += CONGESTION * inp.bendPenalty * (u - cap + 1)
        }
        const ns = nv * 4 + nd
        const ng = gScore[st] + cost
        if (seen[ns] !== stamp || ng < gScore[ns]) {
          seen[ns] = stamp; gScore[ns] = ng; cameFrom[ns] = st
          heap.push(ng + h(nv), ng, ns)
        }
      }
    }
    if (goal < 0) return null
    const states: number[] = []
    for (let st = goal; st >= 0; st = cameFrom[st]) states.push(st)
    states.reverse()
    return { states }
  }

  // Usage of a committed path: every tile it covers per axis (a turn tile on both), straight-through
  // traffic for the crossing estimate, and its two node sides. A bus group counts once.
  const apply = (ei: number, p: Path, sign: 1 | -1) => {
    const st = p.states
    const g = inp.groups[ei]
    const [src, dst] = inp.edgeEnds[ei]!
    const seenTiles = g !== undefined ? (groupTiles.get(g) ?? groupTiles.set(g, new Set()).get(g)!) : null
    const use = (t: number, horizontal: boolean) => {
      if (seenTiles) { const k = t * 2 + (horizontal ? 0 : 1); if (seenTiles.has(k)) return; seenTiles.add(k) }
      if (horizontal) useH[t] += sign; else useV[t] += sign
      if (sign > 0 && horizontal && capH(t) === Infinity) busiestH = Math.max(busiestH, useH[t])
      if (sign > 0 && !horizontal && capV(t) === Infinity) busiestV = Math.max(busiestV, useV[t])
    }
    for (let k = 1; k < st.length - 1; k++) {
      const t = st[k] >> 2, d = st[k] & 3, nd = st[k + 1] & 3
      use(t, d % 2 === 0)
      if (nd !== d) use(t, nd % 2 === 0)
      else if (d % 2 === 0) thruH[t] += sign; else thruV[t] += sign
    }
    const s0 = src * 4 + (st[0] & 3)
    if (g === undefined) sideUse[s0] += sign
    else if (!groupSide.has(g)) { groupSide.set(g, s0); sideUse[s0] += sign }
    sideUse[dst * 4 + (((st[st.length - 1] & 3) + 2) % 4)] += sign
  }
  const crossingsOf = (p: Path): number => {
    let c = 0
    const st = p.states
    for (let k = 1; k < st.length - 1; k++) {
      const t = st[k] >> 2, d = st[k] & 3
      if ((st[k + 1] & 3) === d) c += d % 2 === 0 ? thruV[t] : thruH[t]
    }
    return c
  }

  const failed: number[] = []
  const searchFailed: number[] = []
  for (const ei of inp.order) {
    if (!inp.edgeEnds[ei]) continue
    const p = search(ei)
    if (!p) { failed.push(ei); searchFailed.push(ei); continue }
    paths[ei] = p
    apply(ei, p, 1)
  }
  // Rip-up and re-route: an early route committed to crossings before the routes it crosses
  // existed. Re-route each crossing edge against all the others; keep the new path only when it
  // crosses less. Two passes, in route order; bus members stay.
  for (let pass = 0; pass < 2; pass++) {
    let changed = false
    for (const ei of inp.order) {
      const p = paths[ei]
      if (!p || inp.groups[ei] !== undefined) continue
      apply(ei, p, -1)
      const before = crossingsOf(p)
      if (before === 0) { apply(ei, p, 1); continue }
      const alt = search(ei)
      if (alt && crossingsOf(alt) < before) { paths[ei] = alt; apply(ei, alt, 1); changed = true }
      else apply(ei, p, 1)
    }
    if (!changed) break
  }

  // ─── runs ──────────────────────────────────────────────────────────────────
  const runsOf: Array<Run[] | null> = inp.edgeEnds.map(() => null)
  const families = new Map<number, Run[]>()
  const famKey = (horizontal: boolean, fam: number) => (horizontal ? 0 : 1) + 2 * fam
  for (let ei = 0; ei < E; ei++) {
    const p = paths[ei]
    if (!p) continue
    const [src, dst] = inp.edgeEnds[ei]!
    const st = p.states
    const runs: Run[] = []
    // Group consecutive moves of one direction; a run covers the tiles it enters, plus the tile it
    // turned in (the first run starts at the source cell, which is excluded).
    let k = 1
    while (k < st.length) {
      const d = st[k] & 3
      let j = k
      while (j + 1 < st.length && (st[j + 1] & 3) === d) j++
      const horizontal = d % 2 === 0
      const startTile = st[k - 1] >> 2, endTile = st[j] >> 2
      const along = (t: number) => (horizontal ? t % TX : (t / TX) | 0)
      const fam = horizontal ? ((startTile / TX) | 0) : startTile % TX
      let from = along(startTile), to = along(endTile)
      if (k === 1) from += d < 2 ? 1 : -1 // leave the source cell out
      if (j === st.length - 1) to += d < 2 ? -1 : 1 // and the target cell
      // Ends in travel order: start (port or turn), finish (port or turn); sign is the side the
      // route continues to, perpendicular to this run.
      const prevD = k === 1 ? -1 : st[k - 1] & 3
      const nextD = j === st.length - 1 ? -1 : st[j + 1] & 3
      // Coming from direction prevD means the route is on the side opposite to prevD's motion.
      const startSign = prevD < 0 ? 0 : prevD === 1 || prevD === 0 ? -1 : 1
      const finishSign = nextD < 0 ? 0 : nextD === 1 || nextD === 0 ? 1 : -1
      const startEnd: End = { port: k === 1, sign: startSign, node: k === 1 ? src : -1, pos: from }
      const finishEnd: End = { port: j === st.length - 1, sign: finishSign, node: j === st.length - 1 ? dst : -1, pos: to }
      const [lo, hi, a, b] = from <= to ? [from, to, startEnd, finishEnd] : [to, from, finishEnd, startEnd]
      const run: Run = { edge: ei, horizontal, fam, lo, hi, a, b, line: 0, k: runs.length, cmin: 0, cmax: 0 }
      runs.push(run)
      const key = famKey(horizontal, fam)
      ;(families.get(key) ?? families.set(key, []).get(key)!).push(run)
      k = j + 1
    }
    runsOf[ei] = runs
  }

  // ─── line assignment ───────────────────────────────────────────────────────
  // Crossing cost of putting run x on the low side of run y: an end of x that turns toward the
  // high side inside y's span crosses y, and so does an end of y turning low inside x's span.
  const inside = (p: number, r: Run) => p > r.lo && p < r.hi
  const costLow = (x: Run, y: Run) =>
    (x.a.sign > 0 && inside(x.a.pos, y) ? 1 : 0) + (x.b.sign > 0 && inside(x.b.pos, y) ? 1 : 0) +
    (y.a.sign < 0 && inside(y.a.pos, x) ? 1 : 0) + (y.b.sign < 0 && inside(y.b.pos, x) ? 1 : 0)
  const overlaps = (x: Run, y: Run) => x.lo <= y.hi && y.lo <= x.hi
  const sameBus = (x: Run, y: Run) => inp.groups[x.edge] !== undefined && inp.groups[x.edge] === inp.groups[y.edge]

  // A run ending on a node side may use only that side's port lines.
  const allowedLines = (r: Run): boolean[] => {
    const lines = r.horizontal ? nY : nX
    const ok = new Array<boolean>(lines).fill(true)
    for (const e of [r.a, r.b]) {
      if (!e.port) continue
      const side = r.horizontal ? (e === r.a ? 0 : 2) : (e === r.a ? 1 : 3)
      const mine = new Set(sideLines(e.node, side))
      for (let k2 = 0; k2 < lines; k2++) if (!mine.has(k2)) ok[k2] = false
    }
    return ok
  }

  let tracksV = 0, tracksH = 0
  const famKeys = [...families.keys()].sort((p, q) => p - q)
  for (const key of famKeys) {
    const runs = families.get(key)!
    const horizontal = key % 2 === 0
    const fam = key >> 1
    const fixed = horizontal ? fam % 2 === 1 : fam % 2 === 1
    // Rank: how much each run wants the low side, against every run it overlaps (bus mates excluded).
    runs.sort((p, q) => p.lo - q.lo || p.hi - q.hi || p.edge - q.edge)
    const want = new Float64Array(runs.length)
    for (let i = 0; i < runs.length; i++) {
      for (let j = i + 1; j < runs.length && runs[j].lo <= runs[i].hi; j++) {
        if (sameBus(runs[i], runs[j])) continue
        const d = costLow(runs[j], runs[i]) - costLow(runs[i], runs[j])
        want[i] += d; want[j] -= d
      }
    }
    const pref = (r: Run) => r.a.sign + r.b.sign
    const idx = runs.map((_, i) => i)
    idx.sort((p, q) => want[q] - want[p] || pref(runs[p]) - pref(runs[q]) || runs[p].lo - runs[q].lo || runs[p].edge - runs[q].edge)
    // Overlap clusters (connected spans), each centred on its own.
    const cluster = new Int32Array(runs.length)
    let c = -1, reach = -Infinity
    for (let i = 0; i < runs.length; i++) { if (runs[i].lo > reach) c++; cluster[i] = c; reach = Math.max(reach, runs[i].hi) }
    const clusterSize = new Int32Array(c + 1)
    for (let i = 0; i < runs.length; i++) clusterSize[cluster[i]]++
    const placed: number[] = []
    const lineOfRun = new Int32Array(runs.length)
    const rankInCluster = new Int32Array(runs.length)
    const counted = new Int32Array(c + 1)
    for (const i of idx) rankInCluster[i] = counted[cluster[i]]++
    if (!fixed) {
      // Channel: the left-edge algorithm (runs by span start, each on a free track), which uses
      // exactly as many tracks as the most runs over any one tile. Among the free tracks a run takes
      // the one nearest its rank's share of the cluster; refinement below fixes the order exactly.
      const density = new Int32Array(c + 1)
      {
        const evs: Array<[number, number, number]> = []
        for (let i = 0; i < runs.length; i++) { evs.push([runs[i].lo, 1, cluster[i]]); evs.push([runs[i].hi + 1, -1, cluster[i]]) }
        evs.sort((p, q) => p[0] - q[0] || p[1] - q[1])
        const cur = new Int32Array(c + 1)
        for (const [, d, cl] of evs) { cur[cl] += d; density[cl] = Math.max(density[cl], cur[cl]) }
      }
      const freeAt: number[][] = Array.from({ length: c + 1 }, (_, cl) => new Array<number>(density[cl]).fill(-Infinity)) // track -> span end
      const mates = new Map<number, number>() // bus group -> track, per cluster key
      for (let i = 0; i < runs.length; i++) {
        const cl = cluster[i], r = runs[i]
        const g = inp.groups[r.edge]
        const mateKey = g !== undefined ? g * (c + 1) + cl : -1
        if (mateKey >= 0 && mates.has(mateKey)) {
          const t = mates.get(mateKey)!
          lineOfRun[i] = t; freeAt[cl][t] = Math.max(freeAt[cl][t], r.hi)
          continue
        }
        const want01 = clusterSize[cl] > 1 ? rankInCluster[i] / (clusterSize[cl] - 1) : 0.5
        const target = want01 * (density[cl] - 1)
        let best = -1
        for (let t = 0; t < density[cl]; t++) if (freeAt[cl][t] < r.lo && (best < 0 || Math.abs(t - target) < Math.abs(best - target))) best = t
        if (best < 0) { best = freeAt[cl].length; freeAt[cl].push(-Infinity) } // a bus mate's extended span
        lineOfRun[i] = best; freeAt[cl][best] = r.hi
        if (mateKey >= 0) mates.set(mateKey, best)
      }
      // Centre each cluster: lines are track indices relative to the channel middle.
      const lo = new Int32Array(c + 1).fill(1 << 30), hi = new Int32Array(c + 1).fill(-(1 << 30))
      for (let i = 0; i < runs.length; i++) { lo[cluster[i]] = Math.min(lo[cluster[i]], lineOfRun[i]); hi[cluster[i]] = Math.max(hi[cluster[i]], lineOfRun[i]) }
      for (let i = 0; i < runs.length; i++) {
        const mid = (lo[cluster[i]] + hi[cluster[i]]) / 2
        runs[i].line = lineOfRun[i] - mid
        runs[i].cmin = lo[cluster[i]] - mid; runs[i].cmax = hi[cluster[i]] - mid
      }
      let need = 0
      for (let k2 = 0; k2 <= c; k2++) need = Math.max(need, hi[k2] - lo[k2] + 1)
      if (horizontal) tracksH = Math.max(tracksH, need); else tracksV = Math.max(tracksV, need)
    } else {
      // Port lines: fixed set; a run ending on a node side may use only that side's lines.
      const lines = horizontal ? nY : nX
      const centre = (lines - 1) / 2
      for (const i of idx) {
        const r = runs[i]
        const ok = allowedLines(r)
        const taken = new Array<boolean>(lines).fill(false)
        let floor = -1
        let mateLine = -1
        for (const j of placed) {
          if (!overlaps(r, runs[j])) continue
          if (sameBus(r, runs[j])) { mateLine = runs[j].line; continue }
          taken[runs[j].line] = true
          floor = Math.max(floor, runs[j].line)
        }
        const ideal = centre - (clusterSize[cluster[i]] - 1) / 2 + rankInCluster[i]
        let best = -1
        if (mateLine >= 0 && ok[mateLine]) best = mateLine
        // Below every overlapping run ranked above it when possible, else any free allowed line.
        for (const strict of [true, false]) {
          if (best >= 0) break
          for (let k2 = 0; k2 < lines; k2++) {
            if (!ok[k2] || taken[k2] || (strict && k2 <= floor)) continue
            if (best < 0 || Math.abs(k2 - ideal) < Math.abs(best - ideal)) best = k2
          }
        }
        if (best < 0) { failed.push(r.edge); r.line = -1 } else r.line = best
        placed.push(i)
      }
    }
  }
  // Runs of a failed edge leave their lines to nobody: they are simply not drawn.
  const failedSet = new Set(failed)

  // ─── exact crossing refinement ─────────────────────────────────────────────
  // The ranking above decides each family alone, so a fan's port lines and its channel tracks can
  // disagree. With every line now known, count crossings exactly (a horizontal and a vertical run
  // can only cross in a tile both cover) and move a run to another line of its family, or swap it
  // with the run on that line, whenever that strictly lowers the crossings of the runs it moves.
  // Channel runs stay inside their cluster's lines, so no channel needs more tracks.
  const pw = inp.maxW + 2 * inp.clearance + Math.max(inp.lanes, tracksV) * s
  const ph = inp.maxH + 2 * inp.clearance + Math.max(inp.lanes, tracksH) * s
  const coordOf = (r: Run): number => {
    const odd = r.fam % 2 === 1
    if (r.horizontal) return (minRow + (r.fam - 1) / 2) * ph + (odd ? inp.portY[r.line] : r.line * s)
    return (minCol + (r.fam - 1) / 2) * pw + (odd ? inp.portX[r.line] : r.line * s)
  }
  // Along-axis coordinate where a run starts / finishes: the neighbouring run's line, or the port.
  const endAlong = (r: Run, start: boolean): number => {
    const runs = runsOf[r.edge]!
    const st = paths[r.edge]!.states
    const [src, dst] = inp.edgeEnds[r.edge]!
    const atStart = start ? r.k === 0 : r.k === runs.length - 1
    if (!atStart) return coordOf(runs[r.k + (start ? -1 : 1)])
    if (start) {
      const d0 = st[0] & 3
      return r.horizontal ? inp.col[src] * pw + (d0 === 0 ? inp.hw[src] : -inp.hw[src]) : inp.row[src] * ph + (d0 === 1 ? inp.hh[src] : -inp.hh[src])
    }
    const dl = st[st.length - 1] & 3
    return r.horizontal ? inp.col[dst] * pw + (dl === 0 ? -inp.hw[dst] : inp.hw[dst]) : inp.row[dst] * ph + (dl === 1 ? -inp.hh[dst] : inp.hh[dst])
  }
  const hAt = new Map<number, Run[]>(), vAt = new Map<number, Run[]>()
  const tilesOf = (r: Run): number[] => {
    const out: number[] = []
    for (let p = r.lo; p <= r.hi; p++) out.push(r.horizontal ? r.fam * TX + p : p * TX + r.fam)
    return out
  }
  for (const runs of runsOf) {
    if (!runs || failedSet.has(runs[0].edge)) continue
    for (const r of runs) for (const t of tilesOf(r)) { const m = r.horizontal ? hAt : vAt; (m.get(t) ?? m.set(t, []).get(t)!).push(r) }
  }
  const crosses = (h: Run, v: Run): boolean => {
    const x = coordOf(v), y = coordOf(h)
    const h0 = endAlong(h, true), h1 = endAlong(h, false), v0 = endAlong(v, true), v1 = endAlong(v, false)
    return x > Math.min(h0, h1) + 1e-6 && x < Math.max(h0, h1) - 1e-6 && y > Math.min(v0, v1) + 1e-6 && y < Math.max(v0, v1) - 1e-6
  }
  const crossingsWith = (set: Set<Run>): number => {
    let total = 0
    for (const a of set) for (const t of tilesOf(a)) {
      for (const b of (a.horizontal ? vAt : hAt).get(t) ?? []) {
        if (b.edge === a.edge || (set.has(b) && !a.horizontal)) continue
        if (a.horizontal ? crosses(a, b) : crosses(b, a)) total++
      }
    }
    return total
  }
  const neighbourhood = (moved: Run[]): Set<Run> => {
    const set = new Set<Run>()
    for (const r of moved) {
      const runs = runsOf[r.edge]!
      set.add(r)
      if (r.k > 0) set.add(runs[r.k - 1])
      if (r.k + 1 < runs.length) set.add(runs[r.k + 1])
    }
    return set
  }
  for (let pass = 0; pass < 3; pass++) {
    let improved = false
    for (const key of famKeys) {
      const runs = families.get(key)!.filter(r => !failedSet.has(r.edge) && inp.groups[r.edge] === undefined)
      const fixed = (key >> 1) % 2 === 1
      for (const p of runs) {
        // A run whose neighbourhood crosses nothing has nothing to gain.
        if (crossingsWith(neighbourhood([p])) === 0) continue
        const candidates: number[] = []
        if (fixed) { const ok = allowedLines(p); ok.forEach((v, k2) => { if (v && k2 !== p.line) candidates.push(k2) }) }
        else for (let l = p.cmin; l <= p.cmax + 1e-9; l++) if (Math.abs(l - p.line) > 1e-9) candidates.push(l)
        // Nearest lines first, at most REFINE_REACH on each side (a 70-track channel otherwise tries 70).
        candidates.sort((u, w) => Math.abs(u - p.line) - Math.abs(w - p.line) || u - w)
        candidates.splice(2 * REFINE_REACH)
        for (const L of candidates) {
          // Who is on line L over p's span? At most one run, which then takes p's line.
          const on = runs.filter(r => r !== p && Math.abs(r.line - L) < 1e-9 && overlaps(r, p))
          if (on.length > 1) continue
          const q = on[0]
          if (q) {
            if (fixed && !allowedLines(q)[p.line]) continue
            if (runs.some(r => r !== q && r !== p && Math.abs(r.line - p.line) < 1e-9 && overlaps(r, q))) continue
            if (!fixed && (p.line < q.cmin - 1e-9 || p.line > q.cmax + 1e-9)) continue
          }
          const moved = q ? [p, q] : [p]
          const set = neighbourhood(moved)
          const before = crossingsWith(set)
          const pl = p.line
          p.line = L; if (q) q.line = pl
          const after = crossingsWith(set)
          if (after < before) { improved = true; break }
          p.line = pl; if (q) q.line = L
        }
      }
    }
    if (!improved) break
  }

  const geometry = (origin: Point, cw: number, ch: number): Point[][] => {
    const colX = (tx: number) => origin.x + (minCol + (tx - 1) / 2) * cw // odd tx: cell centre; even: channel middle
    const rowY = (ty: number) => origin.y + (minRow + (ty - 1) / 2) * ch
    const coord = (r: Run) => {
      const odd = r.fam % 2 === 1
      if (r.horizontal) return rowY(r.fam) + (odd ? inp.portY[r.line] : r.line * s)
      return colX(r.fam) + (odd ? inp.portX[r.line] : r.line * s)
    }
    return inp.edgeEnds.map((ends, ei) => {
      const runs = runsOf[ei]
      if (!ends || !runs || failedSet.has(ei)) return []
      const [src, dst] = ends
      const nodeX = (i: number) => origin.x + inp.col[i] * cw
      const nodeY = (i: number) => origin.y + inp.row[i] * ch
      const st = paths[ei]!.states
      const d0 = st[0] & 3, dl = st[st.length - 1] & 3
      const pts: Point[] = []
      const first = runs[0], last = runs[runs.length - 1]
      // Source port: on the side the route leaves by, at the first run's line.
      pts.push(first.horizontal
        ? { x: nodeX(src) + (d0 === 0 ? inp.hw[src] : -inp.hw[src]), y: coord(first) }
        : { x: coord(first), y: nodeY(src) + (d0 === 1 ? inp.hh[src] : -inp.hh[src]) })
      for (let k = 0; k + 1 < runs.length; k++) {
        const p = runs[k], q = runs[k + 1]
        pts.push(p.horizontal ? { x: coord(q), y: coord(p) } : { x: coord(p), y: coord(q) })
      }
      // Target port: on the side the route arrives at.
      pts.push(last.horizontal
        ? { x: nodeX(dst) + (dl === 0 ? -inp.hw[dst] : inp.hw[dst]), y: coord(last) }
        : { x: coord(last), y: nodeY(dst) + (dl === 1 ? -inp.hh[dst] : inp.hh[dst]) })
      return pts
    })
  }
  const dbg = (globalThis as { __orthoDebug?: unknown[] }).__orthoDebug
  if (dbg) dbg.push({ TX, TY, minCol, minRow, paths: paths.map(p => p?.states ?? null), runsOf, tracksV, tracksH, failed: [...failedSet], searchFailed, sideUse: Array.from(sideUse), sideCap: Array.from(sideCap), tileOf: Array.from(tileOf), useH: Array.from(useH), useV: Array.from(useV) })
  return { tracksV, tracksH, failed: [...failedSet].sort((p, q) => p - q), geometry }
}

/** Binary min-heap of A* states keyed by (f, -g, state): deterministic for equal f. */
class StateHeap {
  private f: number[] = []
  private g: number[] = []
  private s: number[] = []
  get size(): number { return this.f.length }
  clear(): void { this.f.length = 0; this.g.length = 0; this.s.length = 0 }
  private less(i: number, j: number): boolean {
    return this.f[i] < this.f[j] || (this.f[i] === this.f[j] && (this.g[i] > this.g[j] || (this.g[i] === this.g[j] && this.s[i] < this.s[j])))
  }
  private swap(i: number, j: number): void {
    [this.f[i], this.f[j]] = [this.f[j], this.f[i]]; [this.g[i], this.g[j]] = [this.g[j], this.g[i]]; [this.s[i], this.s[j]] = [this.s[j], this.s[i]]
  }
  push(f: number, g: number, state: number): void {
    this.f.push(f); this.g.push(g); this.s.push(state)
    let i = this.f.length - 1
    while (i > 0) { const p = (i - 1) >> 1; if (this.less(i, p)) { this.swap(i, p); i = p } else break }
  }
  pop(): number {
    const top = this.s[0]
    const lf = this.f.pop()!, lg = this.g.pop()!, ls = this.s.pop()!
    if (this.f.length) {
      this.f[0] = lf; this.g[0] = lg; this.s[0] = ls
      let i = 0
      for (;;) {
        const l = 2 * i + 1, r = l + 1
        let m = i
        if (l < this.f.length && this.less(l, m)) m = l
        if (r < this.f.length && this.less(r, m)) m = r
        if (m === i) break
        this.swap(i, m); i = m
      }
    }
    return top
  }
}
