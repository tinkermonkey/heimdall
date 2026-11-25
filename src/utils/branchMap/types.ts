/**
 * Types for the branch map: a vertical metro map of how groups of work are organized. Each group
 * is a column with a trunk running down from its start marker; lines branch off the trunk, run
 * along their own lane and end at the station they deliver to; stations sit on the lines; links
 * cross between groups. See design-reference/branch-map/README.md.
 *
 * The model is vocabulary-free: it knows groups, stations, lines and links, not where they come
 * from. Mapping a source onto it is the consuming app's job.
 *
 * Three stages, each a pure function (layout.ts):
 * - `layoutBranchMap(data, options)` → `BranchMapLayout`: placement only (positions, lanes,
 *   bundles, label boxes). No DOM: text widths come from `options.measureText` or an estimate.
 * - `routeBranchMap(layout)` → `BranchMapScene`: line, trunk and link geometry, read from the
 *   layout alone.
 * - `branchMapScene(data, options)`: both.
 */
import type { Point } from '../graph'

// ---- Input ---------------------------------------------------------------------------------

/** `stop` is drawn as a circle, `decision` as a diamond. */
export type BranchMapStationKind = 'stop' | 'decision'

export type BranchMapStationStatus = 'planned' | 'active' | 'done' | 'set-aside' | 'dropped'

/** `dropped` ends with a bar (a dead end). */
export type BranchMapLineStatus = 'active' | 'done' | 'set-aside' | 'dropped'

export type BranchMapLineStyle = 'solid' | 'dashed' | 'dotted'

/**
 * - `dependency`: an arrow from the station waited on (`from`) to the waiting one (`to`). It also
 *   orders ranks, so the waiting station is placed below.
 * - `provides`: a dotted arch from a provider station (`from`) to another group's start (`to`, a
 *   group id).
 */
export type BranchMapLinkKind = 'dependency' | 'provides'

/** One group: a column with its own trunk. */
export interface BranchMapGroup {
  id: string
  label: string
  /** Palette index into `--graph-layer-<n>`. Unset: by the group's order. */
  color?: number
  /**
   * Waypoints: station ids of this group, top to bottom, that its trunk must pass through. The
   * rest of the trunk is still derived (the heaviest chain of stops), between and around them.
   */
  trunk?: readonly string[]
}

/** A station on a group's map. */
export interface BranchMapStation {
  id: string
  /** Id of the group it belongs to. */
  group: string
  label: string
  kind: BranchMapStationKind
  status: BranchMapStationStatus
  /** ISO date. A `done` station with a date is placed above the start marker, in date order. */
  date?: string
  /** Ids of stations (in any group) this one follows. Orders ranks; drawn as no link of its own. */
  after?: readonly string[]
  /** Criteria or parts met of total, as `[met, total]`. */
  progress?: readonly [number, number]
  /** Waits on something still open. Set by the caller. */
  blocked?: boolean
  /** Passed through untouched, for the caller's callbacks. */
  data?: unknown
}

/** Ticks along a line's run: `total` marks, the first `emphasized` of them highlighted. */
export interface BranchMapLineMarks {
  total: number
  emphasized?: number
}

/** A line: a branch from where it starts to where it delivers. */
export interface BranchMapLine {
  id: string
  /** Id of the group it belongs to. */
  group: string
  label: string
  /** Station it forks from. `null`: the group's start marker. */
  from: string | null
  /** Station it delivers to. `null`: an open end. */
  to: string | null
  status: BranchMapLineStatus
  /** Default `solid`. */
  style?: BranchMapLineStyle
  /** Drives width (with `width: 'weight'`) and which lines bundle first. Default 1. */
  weight?: number
  marks?: BranchMapLineMarks
  /** Passed through untouched, for the caller's callbacks. */
  data?: unknown
}

/** A link between groups. */
export interface BranchMapLink {
  id: string
  kind: BranchMapLinkKind
  /** A station id, or a group id for that group's start marker. */
  from: string
  /** A station id, or a group id for that group's start marker. */
  to: string
  label?: string
}

/**
 * The branch map's input. Ids are unique across groups, stations, lines and links; a duplicate
 * or a reference to an unknown id is reported in `BranchMapLayout.issues`, never thrown.
 */
export interface BranchMapData {
  groups: readonly BranchMapGroup[]
  stations: readonly BranchMapStation[]
  lines: readonly BranchMapLine[]
  links?: readonly BranchMapLink[]
}

// ---- Options -------------------------------------------------------------------------------

/** `off`: every line one width. `weight`: width grows with weight (square root), trunk included. */
export type BranchMapWidthMode = 'off' | 'weight'

/** `spur`: stations no line leads to sit on one dotted planned line per group, in rank order. */
export type BranchMapLooseStations = 'spur'

/** What a label names: a station, a line (at its fork) or a group (its header). */
export type BranchMapLabelRole = 'station' | 'line' | 'group'

/**
 * Text width in px for a label, injected so layout stays headless. Unset: a character-width
 * estimate.
 */
export type BranchMapMeasureText = (text: string, role: BranchMapLabelRole) => number

export interface BranchMapOptions {
  /** Between the sub-rows of one rank band. */
  rowGap?: number
  /** Between rank bands. */
  rankGap?: number
  /** Between lanes. Default 24. */
  laneGap?: number
  /** Between groups. */
  groupGap?: number
  /** Ranks a line spans at least (fork, run, join). */
  minBranchRanks?: number
  /** Branch lanes a group draws at most before its lines bundle. Default 8. */
  maxLanes?: number
  /** Group and bundle ids drawn whole: their lines are not bundled. */
  expanded?: readonly string[]
  /** Default `off`. */
  width?: BranchMapWidthMode
  /** Labels wrap to two lines at this width, then end with an ellipsis. Default 180. */
  maxLabelWidth?: number
  measureText?: BranchMapMeasureText
  /** Default `spur`. */
  looseStations?: BranchMapLooseStations
}

/** The options a layout ran with, defaults filled in. Serializable: `measureText` is left out. */
export interface BranchMapResolvedOptions {
  rowGap: number
  rankGap: number
  laneGap: number
  groupGap: number
  minBranchRanks: number
  maxLanes: number
  expanded: string[]
  width: BranchMapWidthMode
  maxLabelWidth: number
  looseStations: BranchMapLooseStations
}

// ---- Layout (placement) --------------------------------------------------------------------

export interface BranchMapGroupCounts {
  /** Input lines in the group, bundled or not. */
  lines: number
  stops: number
  decisions: number
  blocked: number
  /** Input lines drawn inside a bundle or an "N more" line. */
  bundled: number
}

export interface BranchMapGroupLayout {
  id: string
  label: string
  /** Column order, from 0. */
  index: number
  /** Resolved palette index into `--graph-layer-<n>`. */
  color: number
  /** Left edge. */
  x: number
  /** Lanes plus the widest placed label. */
  width: number
  /** The trunk's x (lane 0). */
  trunkX: number
  /** The start marker: where the trunk begins and `from: null` lines fork. */
  start: Point
  /** Branch lanes used, the trunk not counted. */
  lanes: number
  /** Station ids on the trunk, top to bottom. */
  trunk: string[]
  counts: BranchMapGroupCounts
}

export interface BranchMapStationLayout {
  id: string
  group: string
  x: number
  y: number
  /** Dependency rank: 0 is the start marker's band, negative is dated done work above it. */
  rank: number
  /** 0 is the trunk. */
  lane: number
  onTrunk: boolean
  station: BranchMapStation
}

/**
 * - `line`: one input line.
 * - `bundle`: input lines with the same fork rank and destination, drawn as one.
 * - `more`: the lightest lines left over the lane budget, drawn as one "N more" line.
 * - `spur`: the dotted planned line that carries stations no line leads to.
 */
export type BranchMapLineKind = 'line' | 'bundle' | 'more' | 'spur'

/** A line as placed, before routing. */
export interface BranchMapLineLayout {
  /** The input line's id for `line`; a stable generated id otherwise (usable in `expanded`). */
  id: string
  kind: BranchMapLineKind
  group: string
  label: string
  status: BranchMapLineStatus
  style: BranchMapLineStyle
  /** The input weight, or the members' sum. */
  weight: number
  marks?: BranchMapLineMarks
  lane: number
  /** Station it forks from; `null` for the group's start marker. */
  from: string | null
  /** Station it ends at; `null` for an open end. */
  to: string | null
  /** Where it leaves and where it arrives. */
  y1: number
  y2: number
  /** Stations along it, for a `spur`. */
  stops: string[]
  /** Input line ids it draws: itself for `line`, its members for `bundle` and `more`. */
  members: string[]
  /** The input line, for `line`. */
  line?: BranchMapLine
}

/** A placed label. Boxes never overlap each other, a station mark or another group. */
export interface BranchMapLabelBox {
  role: BranchMapLabelRole
  /** The station, line or group it names. */
  target: string
  group: string
  text: string
  /** The text as drawn: one or two lines, the last ending in an ellipsis when cut. */
  lines: string[]
  truncated: boolean
  /** Top-left corner. */
  x: number
  y: number
  width: number
  height: number
  /** Which side of the box the text is anchored to. */
  anchor: 'start' | 'end'
}

/** A label with no clear spot, left for hover and the inspector. */
export interface BranchMapUnplacedLabel {
  role: BranchMapLabelRole
  target: string
  group: string
  text: string
}

/** Links as validated, endpoints resolved. */
export interface BranchMapLinkLayout {
  id: string
  kind: BranchMapLinkKind
  /** Station id, or group id for a start marker (`fromGroupStart`). */
  from: string
  to: string
  fromGroupStart: boolean
  toGroupStart: boolean
  label?: string
}

export type BranchMapIssueKind = 'duplicate-id' | 'dangling-reference' | 'cycle' | 'invalid-trunk'

/** Something in the input the layout could not use as given. */
export interface BranchMapIssue {
  kind: BranchMapIssueKind
  message: string
  /** The ids involved. */
  ids: string[]
}

export interface BranchMapBounds {
  x: number
  y: number
  width: number
  height: number
}

/** Output of `layoutBranchMap`: positions only. */
export interface BranchMapLayout {
  options: BranchMapResolvedOptions
  groups: BranchMapGroupLayout[]
  stations: BranchMapStationLayout[]
  lines: BranchMapLineLayout[]
  links: BranchMapLinkLayout[]
  labels: BranchMapLabelBox[]
  unplacedLabels: BranchMapUnplacedLabel[]
  bounds: BranchMapBounds
  issues: BranchMapIssue[]
}

// ---- Scene (routed) ------------------------------------------------------------------------

/**
 * How a line ends: rejoins the trunk or another line (`join`), stops at its own station
 * (`station`), stops with no destination (`open`), or was dropped (`dead`).
 */
export type BranchMapLineEnd = 'join' | 'station' | 'open' | 'dead'

/** The straight piece along a line's lane, where ticks go. */
export interface BranchMapRun {
  x: number
  y1: number
  y2: number
}

export interface BranchMapRoutedLine extends BranchMapLineLayout {
  points: Point[]
  /** SVG path, corners rounded. */
  path: string
  run: BranchMapRun | null
  end: BranchMapLineEnd
  /** Stroke width in px. */
  width: number
}

/** A straight piece of a trunk with its own weight and width. */
export interface BranchMapTrunkSegment {
  from: Point
  to: Point
  weight: number
  width: number
}

export interface BranchMapTrunk {
  group: string
  x: number
  y1: number
  y2: number
  path: string
  /** One segment when `width` is `off`; with `weight`, a fork takes weight off and a join gives it back. */
  segments: BranchMapTrunkSegment[]
}

export interface BranchMapRoutedLink extends BranchMapLinkLayout {
  points: Point[]
  path: string
  /** Where its label goes. */
  mid: Point
}

/** Output of `routeBranchMap`: the layout plus geometry. */
export interface BranchMapScene extends BranchMapLayout {
  lines: BranchMapRoutedLine[]
  links: BranchMapRoutedLink[]
  trunks: BranchMapTrunk[]
}
