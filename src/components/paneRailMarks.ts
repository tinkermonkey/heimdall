import type { StatusColor } from './statusColors'

/** One item of a folded pane, drawn on its `PaneRail` map. */
export interface PaneRailMark {
  /** Passed back to `onMarkClick`, `onMarkHover` and `onMarkLeave`. */
  id: string
  /** Where the item sits in the pane, from 0 (top) to 1 (bottom). Clamped to that range. */
  position: number
  /** Semantic tone of the mark (the `Chip` tones). Default `'neutral'`. */
  tone?: StatusColor
  /** Accessible name of the mark's button, e.g. the item's text. */
  label: string
}

/** Clamps a 0..1 rail position; a non-finite value goes to 0. */
export function clampPaneRailPosition(position: number): number {
  if (!Number.isFinite(position)) return 0
  return Math.min(1, Math.max(0, position))
}

/**
 * The marks in the order the rail renders them: positions clamped to 0..1, sorted top to bottom.
 * Marks at the same position keep their input order. Returns a new array; the input is unchanged.
 */
export function orderPaneRailMarks(marks: readonly PaneRailMark[]): PaneRailMark[] {
  return marks
    .map((mark, index) => ({ mark: { ...mark, position: clampPaneRailPosition(mark.position) }, index }))
    .sort((a, b) => a.mark.position - b.mark.position || a.index - b.index)
    .map(({ mark }) => mark)
}

/**
 * The index of the mark that takes focus after `key` on the mark at `current`, for the rail's
 * single tab stop: ArrowDown/ArrowUp move one mark and stop at the ends, Home and End jump to the
 * first and last. Returns `null` for any other key or when there are no marks.
 */
export function nextPaneRailMarkIndex(current: number, key: string, count: number): number | null {
  if (count <= 0) return null
  const last = count - 1
  switch (key) {
    case 'ArrowDown':
      return Math.min(last, current + 1)
    case 'ArrowUp':
      return Math.max(0, current - 1)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return null
  }
}

/**
 * The index of the mark nearest `position` in marks ordered by `orderPaneRailMarks`, or 0 when
 * `position` is undefined. The rail's tab stop starts there, so Tab lands next to the notch.
 */
export function nearestPaneRailMarkIndex(ordered: readonly PaneRailMark[], position: number | undefined): number {
  if (position === undefined || ordered.length === 0) return 0
  const target = clampPaneRailPosition(position)
  let best = 0
  for (let i = 1; i < ordered.length; i++) {
    if (Math.abs(ordered[i].position - target) < Math.abs(ordered[best].position - target)) best = i
  }
  return best
}

/**
 * One React key per mark, unique even when ids repeat: a mark keeps its id as its key, and the
 * second and later marks with an id already seen get `${id}#${n}` (n counting from 2). Keys of
 * marks with unique ids stay stable when other marks are added or removed.
 */
export function paneRailMarkKeys(ordered: readonly PaneRailMark[]): string[] {
  const used = new Set<string>()
  const seen = new Map<string, number>()
  return ordered.map((mark) => {
    let count = (seen.get(mark.id) ?? 0) + 1
    let key = count === 1 ? mark.id : `${mark.id}#${count}`
    // An id may itself look like `a#2`; skip on until the key is free.
    while (used.has(key)) {
      count += 1
      key = `${mark.id}#${count}`
    }
    seen.set(mark.id, count)
    used.add(key)
    return key
  })
}
