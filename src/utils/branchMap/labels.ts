/**
 * Branch map label placement, one group at a time in the group's own coordinates.
 *
 * Station labels sit on their station's own sub-row, beside the station: right of it, or right
 * of the lines running past that row, or (for a station off the trunk) left of it. Line names
 * are horizontal, right of the line's run near its fork, sliding down the run when that spot is
 * taken. Every label wraps to two lines at `maxLabelWidth`, then ends with an ellipsis; a
 * one-line cut is the fallback where two lines do not fit.
 *
 * Placement is greedy by priority: trunk stations, then other stations, then line names, each
 * top to bottom. A box may never overlap a placed box or a station mark (hard); crossing a
 * line costs, and so does distance from the anchor (soft). A label with no clear spot is
 * reported unplaced. Since a group's width is set from its placed labels, boxes never reach
 * another group either.
 */
import type { Point } from '../graph'
import { BRANCH_MAP_MARK } from './route'
import type {
  BranchMapLabelBox,
  BranchMapLabelRole,
  BranchMapLineLayout,
  BranchMapMeasureText,
  BranchMapRun,
  BranchMapStationLayout,
  BranchMapUnplacedLabel,
} from './types'

/**
 * Type the layout assumes per label role: font size, line height and the average character
 * width used when no `measureText` is given. The view should draw labels at these sizes.
 */
export const BRANCH_MAP_TEXT: Readonly<Record<BranchMapLabelRole, { fontSize: number; lineHeight: number; charWidth: number }>> = {
  station: { fontSize: 12, lineHeight: 13, charWidth: 6.4 },
  line: { fontSize: 11, lineHeight: 12, charWidth: 5.9 },
  group: { fontSize: 13, lineHeight: 16, charWidth: 7.4 },
}

/** Text width from an average character width: the fallback for `measureText`. */
export const estimateBranchMapText: BranchMapMeasureText = (text, role) => text.length * BRANCH_MAP_TEXT[role].charWidth

const ELLIPSIS = '…'
/**
 * Clearance between a label and another box or mark: small enough that a line name fits
 * between two station labels on neighbouring sub-rows at the default row gap.
 */
const CLEAR = 0.5
/** Gap between a label and the mark or line it sits beside. */
const BESIDE = 4
/** Soft costs. */
const COST = { crossing: 30, lane: 4, left: 6, oneLine: 20, step: 1.5 } as const

export interface WrappedLabel {
  lines: string[]
  width: number
  height: number
  truncated: boolean
}

function ellipsize(text: string, role: BranchMapLabelRole, maxWidth: number, measure: BranchMapMeasureText): string {
  let t = text.trimEnd()
  while (t.length && measure(t + ELLIPSIS, role) > maxWidth) t = t.slice(0, -1).trimEnd()
  return t + ELLIPSIS
}

/** Wraps a label to at most `maxLines` lines of `maxWidth`; what does not fit ends in an ellipsis. */
export function wrapBranchMapLabel(text: string, role: BranchMapLabelRole, maxWidth: number, measure: BranchMapMeasureText, maxLines = 2): WrappedLabel {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let i = 0
  while (i < words.length && lines.length < maxLines) {
    let line = words[i++]
    while (i < words.length && measure(`${line} ${words[i]}`, role) <= maxWidth) line += ` ${words[i++]}`
    lines.push(line)
  }
  if (!lines.length) lines.push('')
  let truncated = i < words.length
  if (truncated) lines[lines.length - 1] = ellipsize(`${lines[lines.length - 1]} ${words.slice(i).join(' ')}`, role, maxWidth, measure)
  for (let j = 0; j < lines.length; j++) {
    if (measure(lines[j], role) > maxWidth) {
      lines[j] = ellipsize(lines[j], role, maxWidth, measure)
      truncated = true
    }
  }
  const width = Math.min(maxWidth, Math.max(...lines.map((l) => measure(l, role))))
  return { lines, width: Math.ceil(width), height: lines.length * BRANCH_MAP_TEXT[role].lineHeight, truncated }
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

const overlaps = (a: Box, b: Box, gap = 0) =>
  a.x < b.x + b.width + gap && b.x < a.x + a.width + gap && a.y < b.y + b.height + gap && b.y < a.y + a.height + gap

/** Whether segment a-b passes through the box (Liang-Barsky). */
function crosses(a: Point, b: Point, box: Box): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const p = [-dx, dx, -dy, dy]
  const q = [a.x - box.x, box.x + box.width - a.x, a.y - box.y, box.y + box.height - a.y]
  let t0 = 0
  let t1 = 1
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false
      continue
    }
    const r = q[i] / p[i]
    if (p[i] < 0) {
      if (r > t1) return false
      if (r > t0) t0 = r
    } else {
      if (r < t0) return false
      if (r < t1) t1 = r
    }
  }
  return true
}

/** A placed line with its routed geometry, for label placement. */
export interface BranchLabelLine {
  line: BranchMapLineLayout
  run: BranchMapRun | null
}

export interface BranchLabelContext {
  group: string
  trunkX: number
  start: Point
  laneGap: number
  /** Branch lanes the group uses. */
  lanes: number
  maxLabelWidth: number
  measure: BranchMapMeasureText
  stations: readonly BranchMapStationLayout[]
  lines: readonly BranchLabelLine[]
  /** Every drawn segment of the group (trunk, lines), as soft obstacles. */
  segments: readonly (readonly [Point, Point])[]
}

export interface BranchLabelPlacement {
  labels: BranchMapLabelBox[]
  unplaced: BranchMapUnplacedLabel[]
}

interface Candidate {
  x: number
  y: number
  wrap: WrappedLabel
  anchor: 'start' | 'end'
  cost: number
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Places one group's station and line labels (not its header). */
export function placeBranchMapLabels(ctx: BranchLabelContext): BranchLabelPlacement {
  const placed: BranchMapLabelBox[] = []
  const unplaced: BranchMapUnplacedLabel[] = []
  const marks: Box[] = [
    ...ctx.stations.map((s) => ({ x: s.x - BRANCH_MAP_MARK.station, y: s.y - BRANCH_MAP_MARK.station, width: 2 * BRANCH_MAP_MARK.station, height: 2 * BRANCH_MAP_MARK.station })),
    { x: ctx.start.x - BRANCH_MAP_MARK.start, y: ctx.start.y - BRANCH_MAP_MARK.start, width: 2 * BRANCH_MAP_MARK.start, height: 2 * BRANCH_MAP_MARK.start },
  ]
  const laneX = (lane: number) => ctx.trunkX + lane * ctx.laneGap
  const variants = (text: string, role: BranchMapLabelRole): { wrap: WrappedLabel; cost: number }[] => {
    const two = wrapBranchMapLabel(text, role, ctx.maxLabelWidth, ctx.measure, 2)
    if (two.lines.length < 2) return [{ wrap: two, cost: 0 }]
    return [{ wrap: two, cost: 0 }, { wrap: wrapBranchMapLabel(text, role, ctx.maxLabelWidth, ctx.measure, 1), cost: COST.oneLine }]
  }
  const crossings = (box: Box) => {
    const hit = { x: box.x - 1.5, y: box.y - 1.5, width: box.width + 3, height: box.height + 3 }
    let n = 0
    for (const [a, b] of ctx.segments) if (crosses(a, b, hit)) n++
    return n
  }
  const place = (role: BranchMapLabelRole, target: string, text: string, candidates: Candidate[]) => {
    let best: { c: Candidate; score: number } | null = null
    for (const c of candidates) {
      const box = { x: c.x, y: c.y, width: c.wrap.width, height: c.wrap.height }
      if (box.x < 0) continue
      if (best && c.cost >= best.score) continue
      if (placed.some((p) => overlaps(box, p, CLEAR)) || marks.some((m) => overlaps(box, m, CLEAR))) continue
      const score = c.cost + crossings(box) * COST.crossing
      if (!best || score < best.score) best = { c, score }
    }
    if (!best) {
      unplaced.push({ role, target, group: ctx.group, text })
      return
    }
    const { c } = best
    placed.push({ role, target, group: ctx.group, text, lines: c.wrap.lines, truncated: c.wrap.truncated, x: c.x, y: c.y, width: c.wrap.width, height: c.wrap.height, anchor: c.anchor })
  }

  // ---- Stations: trunk first, then the rest, top to bottom ---------------------------------
  const stations = [...ctx.stations].sort((a, b) => Number(b.onTrunk) - Number(a.onTrunk) || a.y - b.y || cmp(a.id, b.id))
  for (const s of stations) {
    const candidates: Candidate[] = []
    for (const v of variants(s.station.label, 'station')) {
      const y = s.y - v.wrap.height / 2
      const x0 = s.x + BRANCH_MAP_MARK.station + BESIDE
      candidates.push({ x: x0, y, wrap: v.wrap, anchor: 'start', cost: v.cost })
      for (let l = s.lane + 1; l <= ctx.lanes; l++) {
        const x = laneX(l) + BESIDE + 1
        if (x > x0) candidates.push({ x, y, wrap: v.wrap, anchor: 'start', cost: v.cost + (l - s.lane) * COST.lane })
      }
      if (!s.onTrunk) {
        const x = s.x - BRANCH_MAP_MARK.station - BESIDE - v.wrap.width
        if (x >= ctx.trunkX + BRANCH_MAP_MARK.start) candidates.push({ x, y, wrap: v.wrap, anchor: 'end', cost: v.cost + COST.left })
      }
    }
    place('station', s.id, s.station.label, candidates)
  }

  // ---- Line names: horizontal, right of the run, near the fork -----------------------------
  const lines = [...ctx.lines].sort((a, b) => Number(a.line.kind === 'spur') - Number(b.line.kind === 'spur') || a.line.y1 - b.line.y1 || a.line.lane - b.line.lane || cmp(a.line.id, b.line.id))
  for (const { line, run } of lines) {
    if (!run) {
      unplaced.push({ role: 'line', target: line.id, group: ctx.group, text: line.label })
      continue
    }
    const candidates: Candidate[] = []
    const top = run.y1 + 1
    // Steps down the run, and the spots just below each box already there, so a name can
    // slot between two station labels on neighbouring sub-rows.
    const snaps = [...placed, ...marks].map((b) => b.y + b.height + CLEAR).filter((y) => y > top && y < run.y2)
    const ys = [...new Set([...Array.from({ length: 17 }, (_, j) => top + j * 6), ...snaps])].sort((a, b) => a - b)
    for (const v of variants(line.label, 'line')) {
      // First choice: centred on the row where the line turns down its lane.
      const turn = run.y1 - v.wrap.height / 2
      candidates.push({ x: run.x + BESIDE + 1, y: turn, wrap: v.wrap, anchor: 'start', cost: v.cost })
      for (let l = line.lane + 1; l <= ctx.lanes; l++) {
        candidates.push({ x: laneX(l) + BESIDE + 1, y: turn, wrap: v.wrap, anchor: 'start', cost: v.cost + (l - line.lane) * COST.lane })
      }
      for (const y of ys) {
        if (y > top && y + v.wrap.height > run.y2) break
        const along = ((y - top) / 6) * COST.step
        candidates.push({ x: run.x + BESIDE + 1, y, wrap: v.wrap, anchor: 'start', cost: v.cost + along })
        for (let l = line.lane + 1; l <= ctx.lanes; l++) {
          candidates.push({ x: laneX(l) + BESIDE + 1, y, wrap: v.wrap, anchor: 'start', cost: v.cost + along + (l - line.lane) * COST.lane })
        }
      }
    }
    place('line', line.id, line.label, candidates)
  }
  return { labels: placed, unplaced }
}
