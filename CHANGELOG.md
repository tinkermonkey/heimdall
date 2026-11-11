# Changelog

All notable changes to `@tinkermonkey/heimdall-ui` are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.0]

A smaller, ESM-only package and the second wave of layered graphs. The tarball drops `src/`, the
CJS build and bundled copies of four dependencies (1.43 MB → 0.69 MB packed), and the fonts load
in consumer builds. Dropdown panels render in a portal, and the semantic and status tokens have
dark-canvas values. Layered graphs gain a symmetric, clustered, virtualized adjacency matrix with
a link inspector, hive axes by any attribute, gutter-routed and bundled lanes with keyboard
navigation, a LayerStack that holds a controlled camera and draws the full 13-layer DR spec
without React commits per frame, explorer snapshots for URL sync, and opt-in async layout.

### Breaking

- **ESM only; `src/` no longer ships** (tinkermonkey/heimdall#343, tinkermonkey/heimdall#352).
  `dist/index.cjs` is no longer built, `files` is `["dist", "agent-skills"]`, `d3-delaunay`,
  `d3-hierarchy`, `react-markdown` and `remark-gfm` are imported from `node_modules` instead of
  being bundled (they stay in `dependencies` and dedupe with the app's copies), and `sideEffects`
  is `["**/*.css"]`. Declarations no longer include test-page, `App` or `main` types. Packed size
  1.43 MB → 0.69 MB, unpacked 5.19 MB → 1.95 MB, 578 → 188 files, `dist/index.js` 963 kB → 750 kB.
  **Migration:** import only from the package entry, `/css` and `/fonts`; deep imports of
  `dist/index.cjs` or `src/...` no longer resolve, and loaders without node resolution (a CDN
  import with no import map) must supply the four dependencies.
- **Dropdown panels render in a portal by default** (tinkermonkey/heimdall#328,
  tinkermonkey/heimdall#349). `RowMenu`, `Select`, `FilterDropdown` and `EntityPicker` panels
  mount on `document.body` with `position: fixed`, positioned from the trigger, flipping when
  there is no room and following scroll and resize, so scroll containers no longer clip them. The
  panel is no longer a DOM descendant of the component root, so CSS such as
  `.row-menu .dropdown-panel`, root-scoped DOM queries and document-level outside-click checks
  stop matching it. **Migration:** target the panel's own class (`.row-menu__dropdown`,
  `.select__panel`, `.filter-dropdown__panel`, `.entity-picker__dropdown`), query from `document`,
  use `containsAcrossPortals` in outside-click handlers, or pass `portal={false}` to keep in-place
  rendering.
- **`LayerStack` controlled `camera` and `layerGap` are strictly held** (tinkermonkey/heimdall#335,
  tinkermonkey/heimdall#361). The view shows only the props; an orbit, wheel, pinch, preset, focus
  or turntable only proposes values. With `camera` set, `onCameraChange` fires every frame of a
  move plus a settle call carrying the move's last proposal; with `layerGap` set,
  `onLayerGapChange` fires every frame of a preset's gap move. Uncontrolled behaviour is
  unchanged. **Migration:** a stack given `camera` without `onCameraChange` is now frozen on those
  fields; use `defaultCamera`, or pass each report back unchanged and synchronously.
- **`GraphCanvasProps.nodes` is optional** (tinkermonkey/heimdall#334,
  tinkermonkey/heimdall#363). Lanes can draw from a `layeredGraph` or context alone; every other
  layout still needs `nodes` and warns in development without it. **Migration:** wrappers that
  read `props.nodes` under strict null checks need a default (`props.nodes ?? []`).

### Changed

- **Fonts use relative URLs** (tinkermonkey/heimdall#353). `@tinkermonkey/heimdall-ui/fonts`
  references `./inter/...` and `./jetbrains-mono/...`, so a consumer's bundler emits the `.woff2`
  files; before, the root-absolute `/fonts/...` URLs only loaded if the app served `/fonts/`
  itself. The stale `dist/fonts/README.md` files no longer ship. **Migration:** drop any
  workaround that copied the fonts to the app's `/fonts/`.
- **Semantic and status tokens have dark-canvas values** (tinkermonkey/heimdall#329,
  tinkermonkey/heimdall#350). Every `--semantic-*` triplet, `--semantic-version-fg` and
  `--status-{ok,warn,error}-{fg,bg}` is redefined under `body.dark-canvas` (16% tint background,
  35% border, -300 foreground, each at least 8.4:1 except id-tag at 5.7:1), so ActivityTimeline,
  TraceViewer, KanbanBoard, VersionTimeline and version chips no longer show light pastels on the
  dark canvas. **Migration:** code that reads one of these as a fixed deep colour in both modes
  should use the new non-flipping `--status-error-solid` or `--status-{emerald,violet,neutral}-deep`.
- **Library components use `.heimdall-visually-hidden` instead of `.sr-only`**
  (tinkermonkey/heimdall#340, tinkermonkey/heimdall#347). The class ships in
  `@tinkermonkey/heimdall-ui/css`; `.sr-only` was never in the library stylesheet, so
  SideBySideDiff's gutter labels showed as visible text in consuming apps. `LayeredGraphControls`
  drops its `.layered-visually-hidden` copy. **Migration:** CSS that targeted `.sr-only` or
  `.layered-visually-hidden` inside library components should target `.heimdall-visually-hidden`.
- **An explorer matrix cell click opens the link panel** (tinkermonkey/heimdall#336,
  tinkermonkey/heimdall#365). In `LayeredGraphExplorer`'s matrix view a click shows the link in a
  "Link details" panel instead of selecting the source. **Migration:** pass
  `matrixProps.onCellSelect` (or the deprecated `onLinkSelect`) to replace the panel with your own
  handler, or turn `controls.inspector` off to keep selecting the source.
- **Deprecated: `AdjacencyMatrix.onLinkSelect`** (tinkermonkey/heimdall#365). **Migration:**
  rename it to `onCellSelect`, which takes the same `(link, links)` arguments; `onLinkSelect` is
  ignored when both are set. `HivePlot.onLinkSelect` is unchanged.
- **Small adjacency matrices widen to fit their caption** (tinkermonkey/heimdall#359). Matrices of
  about nine nodes or fewer at 18px cells are wider than before, so the caption is no longer
  clipped. **Migration:** none, unless a layout relied on the old width.
- **Lanes on a shared state with `nodeLabels: false` draw chips** (tinkermonkey/heimdall#363). An
  unset `laneOptions.nodeLabels` follows the layered state, so `false` gives `'reached'` (24px
  chips with name tags for the selection, its reach, hover and focus) instead of labeled boxes.
  **Migration:** set `laneOptions.nodeLabels: 'all'` to keep labeled boxes.
- **Node labels are shared layered-graph state** (tinkermonkey/heimdall#338,
  tinkermonkey/heimdall#354). An uncontrolled `LinkCategoryFilter` label toggle, and the
  explorer's, now write `useLayeredGraph`'s `nodeLabels`, which `LayerStack`, `HivePlot` and lanes
  read by default. **Migration:** pass `nodeLabels` to the filter, or `nodeLabels` / `axisLabels`
  to the views, to keep them independent.
- **Tall stacks close up and frame on mount** (tinkermonkey/heimdall#368,
  tinkermonkey/heimdall#371). Past five layers a preset's gap scales by 4 / (layers − 1)
  (`presetLayerGap`), and a stack whose planes overflow the scene fits its zoom on mount, on a
  layer-count change and on `applyPreset`, reporting `onCameraChange(camera, 'fit')`. Stacks of
  five layers or fewer are unchanged; the fit is skipped for a controlled camera, a layer focus or
  a `defaultCamera` zoom or target of its own.
- **`HivePlot` keeps its angles when a layer is hidden** (tinkermonkey/heimdall#337,
  tinkermonkey/heimdall#362). Hidden layers keep their slot, leaving a gap; the other axes and the
  viewBox don't move. Adding or removing a layer in the data still re-divides the angles.
  `HiveAxis.position` is now the slot among all layers.
- **`AdjacencyMatrix` cells are focusable** (tinkermonkey/heimdall#369): cells get
  `role="button"`, a roving `tabIndex` and an `aria-label`. Queries that counted
  `.adjacency-matrix [role="button"]` as headers should use `.adjacency-matrix__header[role="button"]`.
- **`LayerStack` paints frames without React commits** (tinkermonkey/heimdall#368). Tween, orbit,
  wheel, pinch and turntable frames write SVG attributes directly; on the full DR spec (13 layers,
  193 nodes, 897 links) a turntable second goes from 36 commits to 0 and script time per frame
  roughly halves (preset tween 8.1 → 3.5 ms). Rendering is unchanged.
- **`useLayeredGraph` compares `followCategories` by content**, so an inline array no longer
  recomputes reach on every render (tinkermonkey/heimdall#363).

### Added

- **AdjacencyMatrix**
  - `symmetric`: `A→B` and `B→A` share one cell above the diagonal, with a notch when it holds both
    directions (tinkermonkey/heimdall#359).
  - `aggregate="layer"`: a layers-by-layers heat map; a cross-layer cell toggles the layer-pair
    filter, a diagonal cell or header toggles layer focus, and `onLayerCellSelect` replaces both.
    Type `LayerMatrixCell` (tinkermonkey/heimdall#359).
  - `onCellSelect(link, links)`, `selectedLinkId` (outlined, and scrolled into view when set from
    outside), `order="cluster"` (deterministic Louvain within each layer) and
    `linkEdgeMetadata(index, link)` for feeding a `GraphEdgeInspector` (tinkermonkey/heimdall#365).
  - `virtualizeAbove` (default 150): past that many nodes only the rows and columns in view render,
    with sticky labels. `--adjacency-matrix-max-height` (default `80vh`) and
    `--adjacency-matrix-bg` style the scroll area (tinkermonkey/heimdall#369).
  - Roving keyboard focus over cells: one Tab stop, arrows, Home/End, Enter/Space
    (tinkermonkey/heimdall#369).
- **HivePlot**
  - `axes: 'layer' | (node) => axisId`, `axisOrder` (list or comparator) and `axisLabel`; non-layer
    axes take `--graph-layer-<n>` colours by order, and nodes without an axis are not drawn, with
    a development warning. `hiveAxisGroups` is exported and `rankWithinLayers` takes optional
    groups (tinkermonkey/heimdall#366).
  - `hiveLayout` takes `hiddenLayers` and returns every layer's `slots`; `HIVE_MIN_LOOP_BULGE` is
    exported (tinkermonkey/heimdall#362).
- **LayerStack**
  - Pinch zoom on touch (0.4–3, gated by `interactions.zoom`); two-finger `touchmove` no longer
    scrolls the page (tinkermonkey/heimdall#361).
  - Labels behind a nearer plane fade to 30% of their emphasis opacity, recomputed every frame;
    the selection, its reach, hover, focus and the top view never fade (tinkermonkey/heimdall#371).
  - `LayerStackHandle.getLayerGap()` (tinkermonkey/heimdall#356), `presetLayerGap` and
    `PRESET_GAP_FULL_LAYERS` (tinkermonkey/heimdall#368), and the `StackFocus` type; `stackPlaneY`
    accepts several focus entries (tinkermonkey/heimdall#361).
- **Lanes** (`GraphCanvas layout="layer-lanes"`, tinkermonkey/heimdall#334)
  - `laneOptions.nodeLabels: 'all' | 'reached'` (type `LaneNodeLabels`), with `laneTagSize` and
    `laneTagRoom`; pills hold their place while a node is dragged (tinkermonkey/heimdall#363).
  - `laneOptions.skipLayerRouting: 'gutter'` routes links two or more lanes apart down a side
    gutter, each route on its own track, with one shared stub per node and side in each gap.
    Exports `routeLaneGutters`, `retraceLaneGutters` and `laneGutterGapTracks`; `layoutLanes`
    takes `gutterLinks` (tinkermonkey/heimdall#367, tinkermonkey/heimdall#370).
  - `laneOptions.intraLinks: 'bundled'` runs a row's links along one shared trunk; the selection's
    reach and the hovered or focused node's links fan out as arcs. Exports `laneBundler` and
    `laneBundleCurve` (tinkermonkey/heimdall#372).
  - Keyboard focus between lanes: one Tab stop, arrows across and along lanes following the
    orientation, Home/End, and a hint linked by `aria-describedby` (tinkermonkey/heimdall#373).
- **LayeredGraphExplorer / useLayeredGraph** (tinkermonkey/heimdall#338)
  - Shared `nodeLabels` state; multi-select reserved through `selectedIds`, `defaultSelectedIds`,
    `onSelectedIdsChange`, `setSelectedIds` and `toggleSelected` (the views still select one node
    per click); `computeReach` accepts several origins; `useControllable` is exported
    (tinkermonkey/heimdall#354).
  - Serializable explorer snapshots: `explorerRef` (`getSnapshot`, `restore`, `stack`),
    `defaultSnapshot`, `onSnapshotChange`, `layeredGraphSnapshotDefaults`, and the sanitizers
    `sanitizeLayeredGraphExplorerSnapshot` and `sanitizeLayeredGraphSnapshot` for untrusted input
    such as URLs (tinkermonkey/heimdall#356).
  - Opt-in async layout: `asyncLayoutMinNodes` (recommended `ASYNC_LAYOUT_MIN_NODES` = 200),
    `layoutPending` and `layoutLayersAsync` with an abort signal. Default behaviour stays
    synchronous (tinkermonkey/heimdall#357).
  - The matrix view's "Link details" panel (`GraphEdgeInspector`) with Reverse for symmetric cells
    (tinkermonkey/heimdall#365), and the label toggle on the Lanes view (tinkermonkey/heimdall#363).
- **GraphCanvas**: `tooltipDelay` (ms, default 200) for hover `nodeTooltip` and `edgeTooltip`
  (tinkermonkey/heimdall#323, tinkermonkey/heimdall#351).
- **SegmentedControl**: `surface: 'canvas' | 'shell'` (type `ChromeSurface`), also on
  `ViewSwitcher`, `FollowControl`, `PredicateLabelControl`, `PlaneLayoutControl` and
  `LinkCategoryFilter`. The explorer's shell chrome uses it instead of remapping canvas tokens
  (tinkermonkey/heimdall#339, tinkermonkey/heimdall#358).
- **Dropdowns**: `portal` prop (default `true`) on `RowMenu`, `Select`, `FilterDropdown` and
  `EntityPicker`, and `containsAcrossPortals(container, target)`; `Select`'s trigger gets
  `aria-controls` (tinkermonkey/heimdall#349).
- **Tokens**: `--status-error-solid` and `--status-{emerald,violet,neutral}-deep`, fixed in both
  canvas modes (tinkermonkey/heimdall#350); the `.heimdall-visually-hidden` utility
  (tinkermonkey/heimdall#347).

### Fixed

- **`GraphCanvas` node measurement** (tinkermonkey/heimdall#331, tinkermonkey/heimdall#348): nodes
  are measured without the host's line-height strut and widths round up, so edges end on the node
  outline and labels held to their box no longer ellipsize. Node boxes can be 1–3px shorter than
  before. Development builds warn once per node that measures 0×0.
- **`GraphCanvas` hover tooltips** sit 6px beside the node box or the edge's drawn label, trying
  top, bottom, right, then left, instead of covering the label, and follow pan, zoom and drag
  (tinkermonkey/heimdall#323, tinkermonkey/heimdall#351).
- **`LinkCategoryFilter`** no longer leaves a divider at the start or end of a wrapped line, and
  empty children render no trailing divider (tinkermonkey/heimdall#339,
  tinkermonkey/heimdall#358).
- **`LayerStack` focus and preset moves** run on independent tween channels: switching focus from
  one layer to another eases instead of snapping shut and reopening, and a `focusLayer` right
  after `applyPreset` keeps the preset's yaw turning (tinkermonkey/heimdall#361).
- **`HivePlot` labels and loops**: loops between near neighbours on an unsplit axis keep a minimum
  bulge so arrowheads no longer cover them; labels avoid loop ends, arrowheads, rings and dots,
  taking the clear side or dropping (the selection is always labeled); hovering never moves
  another label (tinkermonkey/heimdall#362, tinkermonkey/heimdall#366).
- **`LayerStack` plane titles on tall stacks** stay inside the scene: a title column that runs off
  the bottom moves up, and one taller than the scene closes up evenly over its height
  (tinkermonkey/heimdall#335, tinkermonkey/heimdall#376). Before, the last titles of a 13-layer
  stack fell outside the scene at docs width.
- **Skill and JSDoc corrections** (tinkermonkey/heimdall#376): the explorer's matrix link panel
  returns focus to the clicked cell, not the row header; the `linkFilter` control description
  matches the code; `sanitizeLayeredGraphExplorerSnapshot` drops a `layerGap` above
  `MAX_LAYER_GAP` (5000).

### Docs

- Galaxy: the even-orbits versus round-systems trade-off for many-satellite and dominant-branch
  systems, in `galaxyLayout.ts`, the Graph Layouts page and the skill (tinkermonkey/heimdall#288,
  tinkermonkey/heimdall#360).
- Props and tokens from this release: `surface`, `portal`, the GraphCanvas tooltip props, the
  semantic and status token table, and a Utilities page for `.heimdall-visually-hidden`
  (tinkermonkey/heimdall#374).
- Layered graphs reference: `LayeredGraphExplorer` props and `controls`, the matrix link panel,
  snapshots and URL sync, `useLayeredGraph` options and state, multi-select, async layout, the
  LayerStack 0.11 camera contract, occlusion, fit on load and the full DR spec demo, and lanes
  props on the GraphCanvas page (tinkermonkey/heimdall#375).

### Internal

- CI runs type, lint, unit, skill and package checks and the visual suite in four shards on every
  pull request (tinkermonkey/heimdall#341, tinkermonkey/heimdall#346). When apt can't reach the
  Ubuntu mirrors, CI installs the Playwright browser alone (tinkermonkey/heimdall#364).
- `npm run check:package` also fails on files outside `dist/` and `agent-skills/`, bundled copies
  of dependencies, unresolvable imports, non-relative font URLs and a missing
  `.heimdall-visually-hidden` rule (tinkermonkey/heimdall#347, tinkermonkey/heimdall#352,
  tinkermonkey/heimdall#353).
- The heimdall-layout-loop `systems-round` gate is relaxed for many-satellite and dominant-branch
  galaxy systems (tinkermonkey/heimdall-layout-loop#16).
- Unit tests for `reachRelationships` and `ReachInspector` (tinkermonkey/heimdall#355); a stale
  GraphEdge darwin baseline regenerated (tinkermonkey/heimdall#345).

## [0.10.0]

Layered graphs: a component family that shows one graph split into layers by a node attribute (3D
layer stack, lanes, adjacency matrix and hive plot) on shared selection, link-following and
filter state, with controls, an inspector and a ready-made explorer. Also faster organic and
orthogonal layouts and cleaner ux-navigation routes.

### Added

- **Layered graph framework** (tinkermonkey/heimdall#330). Input is the `GraphCanvas` node and
  edge model; one node attribute (`layerBy`) assigns layers, with `multiValue` (`first`, `last`,
  `exclude`, `all`) and `missingValue` policies.
  - **`buildLayeredIndex`** bundles parallel edges into links and derives categories, cross-layer
    flags, layer pairs, degrees and two-letter predicate codes; bad input goes to `issues`
    instead of throwing.
  - **`computeReach`**: selecting a node lights its direct links, then follows cross-layer links
    away from the clicked layer for `follow` more hops.
  - **Shared state:** `useLayeredGraph` and `LayeredGraphContext` own selection, follow, filters,
    predicate-label mode, layer focus and plane layout, controlled or uncontrolled, with
    `snapshot` / `restore`. One instance can drive several views.
  - **Helpers:** `isLinkVisible`, `linkEmphasis`, `nodeEmphasis`, `layoutLayers`,
    `mixLayerPositions`, orderings, `placeEdgeLabels` with sampled `lineCurve` / `quadCurve` /
    `cubicCurve`, and `arrowHeadPoints`.
  - **Tokens:** `--graph-hop-1…3` (amber reach ramp), `--graph-link-1…6` (link categories),
    `--graph-layer-1…12` (layer palette), `--graph-pill-bg` and `--graph-plane-fill-alpha`, for
    light and dark canvas.
  - `GraphNodeData` and `GraphEdge` gain an optional `attributes` bag (`GraphAttributeValue`),
    which `GraphCanvas` ignores.
- **`LayerStack`** (tinkermonkey/heimdall#332): layers as stacked translucent planes in an SVG
  perspective projection, with cross-layer links between them and a drill-through column under
  the selection.
  - Camera presets (`stack`, `exploded`, `top`, `profile`), drag to orbit, wheel zoom once the
    scene has focus, a turntable (off under reduced motion), layer gap, layer focus and an
    animated independent/coupled plane layout.
  - An imperative handle (`applyPreset`, `setCamera`, `zoomBy`, `fit`, `setTurntable`,
    `focusLayer`, `select`).
  - Keyboard navigation of node labels. The projection math (`createProjector`, presets, …) and
    `useTween` are exported.
- **`GraphCanvas layout="layer-lanes"`** (tinkermonkey/heimdall#332): one swimlane per layer,
  nodes packed in rows ordered so linked nodes line up, arcs within a lane and curves between
  lanes, horizontal or vertical. Keeps tooltips, popovers, `renderNode`, pan/zoom and the
  toolbar. New props `layeredGraph`, `layering`, `layeredGraphOptions` and `laneOptions`; the
  geometry is exported as `layoutLanes` and `laneLinkCurve`.
- **`AdjacencyMatrix`** (tinkermonkey/heimdall#330): a directed block matrix grouped by layer,
  with cross-layer block counts, category-coloured cells, the reach ramp, predicate codes and a
  code legend.
- **`HivePlot`** (tinkermonkey/heimdall#332): one axis per layer, doubled so links within a layer
  span the gap; nodes ranked outward; keyboard navigation along and between axes. Geometry
  exported as `hiveLayout` and `hiveLinkGeometry`.
- **Controls and inspector** (tinkermonkey/heimdall#332): `FollowControl`,
  `PredicateLabelControl`, `PlaneLayoutControl`, `LinkCategoryFilter`, `LayerList`,
  `LayerPairList`, `BridgeNodeList` and `ReachInspector` (with `reachRelationships`). Each reads
  a `graph` prop or the context.
- **`LayeredGraphExplorer`** (tinkermonkey/heimdall#332): the views, controls, inspector and a
  status line in one component, with `ViewSwitcher` and `CameraControls`. A `controls` prop turns
  each piece of chrome on or off. Selection, follow and filters carry across view switches, and
  the stack keeps its camera.
- **`GraphInspector`**: `RelationshipLink` gains optional `hop`, `via` and `layer` fields
  (layer swatch, `+n` hop badge, "via X · predicate" line). Existing output is unchanged.
- **Docs**: a "Layered graphs" section with a page per component
  (tinkermonkey/heimdall#333).

### Changed

- **`organicLayout`** is about 3x faster on large graphs (tinkermonkey/heimdall#326): 1000-node
  random graph 2.1 s → 0.6 s, DR spec graph 140 ms → 62 ms. A stress polish now runs before
  overlap removal on components of 300 nodes or fewer, so small layouts can shift slightly;
  incremental re-solves are unchanged.
- **`orthogonalLayout`** is several times faster on large graphs (tinkermonkey/heimdall#327):
  DR spec graph 14.6 s → 5.2 s (39 s → 3.5 s with all predicates); a 400-node community graph
  and a 401-node star that did not finish in 180 s now take 12 s and 0.5 s. Output is unchanged
  except on components with more than 64 candidate roots (for example long chains), where the
  root search is now capped.

### Fixed

- **`layout="ux-navigation"` navigation routes** go through free gaps between boxes and take the
  cheapest clear path, instead of detouring round the whole drawing (tinkermonkey/heimdall#324).
  Routes leave and arrive perpendicular to their port side, parallel routes are kept apart, and
  routing cost is bounded (400 boxes / 400 routes: about 140 ms).
- **Large ux-navigation sitemaps**: routes no longer pass through other nodes or take long
  detours (tinkermonkey/heimdall#325). On a 582-node sitemap, segments through nodes go from 26
  to 0 and the worst route-length ratio from 8.1 to 1.2. A shifted segment no longer lands on
  another route's line.

## [0.9.5]

Two pan inertia fixes in `usePanZoom`, so `GraphCanvas` and `MapCanvas` drags settle when they look settled.

### Fixed

- **`usePanZoom`** — a drag held still and then released no longer flings
  (tinkermonkey/heimdall#321). The release velocity came from the last `pointermove`, however
  long ago it was, so a drag that had come to rest still glided on release. It is now the
  average over the last 100 ms before the release, counting time the pointer was held still: a
  100 ms hold gives no glide, and a slowdown just before the release gives a gentler one.
- **`usePanZoom`** — an inertia glide now ends when it visibly stops
  (tinkermonkey/heimdall#320). It ran until the speed fell below 0.1 px/s, about a second of
  sub-pixel creep after the view looked still, which delayed the `'end'` gesture phase and so
  `GraphCanvas`'s `onViewportDwell` (about 4.6 s after a flick with `dwellMs` 1500). The glide
  now ends once under half a pixel of travel is left; a 2000 px/s flick ends after about 2.3 s
  instead of 3.2 s, and the view comes to rest within half a pixel of where it did before.

## [0.9.4]

Galaxy drag performance, a layout-busy state, and viewport history for `GraphCanvas`.

### Changed

- **`GraphCanvas` engine layouts now apply one frame after their inputs change, not during the
  same commit** (tinkermonkey/heimdall#307). This lets the new busy state paint before a slow
  engine (for example `orthogonal`) blocks the main thread. **Code or tests that read node
  positions immediately after rendering or after changing `layout`, `nodes` or `edges` must
  now wait**: for `data-layout-state="idle"` on `.graph-canvas`, or for `onLayoutStateChange`
  to report `'idle'`. While a new layout computes, the previous positions stay on screen. Before
  the first layout, nodes and edges without a position are hidden rather than stacked at the
  origin, so the first visible frame is the laid-out (and, with `fitView`, fitted) graph. If
  inputs change again before the deferred run starts, the stale run is dropped. An engine error
  still reaches the nearest error boundary.

### Fixed

- **`GraphCanvas`** (`layout="galaxy"`, live simulation) — dragging a node no longer stalls on
  larger graphs (tinkermonkey/heimdall#287). Each drag frame re-resolved overlaps around the
  dragged system with an all-pairs pass repeated up to 400 times: about 260 ms per frame at 252
  nodes and 30 s at 3000. Overlaps are now found through a spatial grid, only boxes that moved
  are re-checked, and a live frame spends a bounded amount of work on them, finishing any
  remainder over the next frames. A drag frame now costs about 1 ms at 252 nodes and under 10 ms
  at 3000. The settled layout, and static `galaxyLayout()` output, are unchanged.

### Added

- **`GraphCanvas` — layout busy state** (tinkermonkey/heimdall#307).
  - **Reporting:** `onLayoutStateChange` and a `data-layout-state` root attribute report
    `'computing'` while an engine layout runs, `'simulating'` while galaxy live simulation moves
    nodes, and `'idle'` otherwise.
  - **Indicator:** a "Laying out…" status chip (`role="status"`, `aria-live="polite"`) appears
    once a layout has been busy for 150 ms. Turn it off with `showLayoutIndicator={false}`.
  - **Exported type:** `GraphLayoutState`.
  - **Not included:** running engines in a Web Worker.
- **`GraphCanvas` — viewport history** (tinkermonkey/heimdall#309).
  - **`onViewportDwell`** (with `dwellMs`, default 1500) fires once the viewport has been still
    after a user pan/zoom (drag, wheel, pinch, keyboard, toolbar `+`/`-`). It never fires
    mid-gesture or while inertia is still gliding.
  - **`onViewportNavigate`** reports moves the canvas or the app made, with a
    `GraphViewportCause`: `center-on-select` (with `nodeId`), `fit` (`mount`, `toolbar`,
    `fullscreen` or `resize`; `layout` is reserved) or `imperative`.
  - **`initialViewport`** replaces the mount fit and centring, for deep links and reloads.
  - **`setViewport(viewport, { animate, silent })` and `getViewport()`** are on a new
    `viewportRef` handle and on `useGraphCanvas()`. `silent` suppresses `onViewportNavigate`,
    so restoring a history entry doesn't record a new one. `animate` is a 150 ms ease, a jump
    under `prefers-reduced-motion`.
  - **Snapshots** are in world coordinates (`center`, `zoom`, `bounds`).
  - **New types:** `GraphViewportSnapshot`, `GraphViewport`, `GraphViewportCause`,
    `GraphViewportHandle`, `GraphSetViewportOptions`.
- **`usePanZoom`** — optional `onUserGesture('start' | 'change' | 'end')` option and a
  `getViewport()` return value. Existing callers are unaffected.

## [0.9.3]

Canvas interaction and accessibility fixes from downstream testing.

### Fixed

- **`usePanZoom`** (`GraphCanvas`, `MapCanvas`) — wheel or pinch zoom right after a drag-pan now
  zooms around the cursor (tinkermonkey/heimdall#306). The pan inertia glide kept writing its own
  pan every frame and overwrote the zoom's cursor-anchored pan, so the zoom pivoted around an
  unrelated point. Wheel, keyboard, `zoomTo`, `panTo` and `reset` now stop the glide, and wheel
  events that arrive within one frame compound instead of all but the last being dropped.
- **`usePanZoom`** (`GraphCanvas`, `MapCanvas`) — `+`/`-` keyboard zoom now scales about the
  view centre instead of the top-left corner (tinkermonkey/heimdall#302). Each press now
  multiplies or divides the zoom by 1.2 instead of adding or subtracting 0.1, so it is the same
  relative step at any zoom.
- **`GraphCanvas`** — `fitView` and the toolbar's zoom-to-fit now frame cluster boundary circles
  (`showClusterBoundaries`) and radial-tree hierarchy rings (`showHierarchyRings`), not just the
  nodes (tinkermonkey/heimdall#305). Radial-tree trunk boundaries were clipped by up to ~176px
  after fit, and force-clustered bubbles slightly. The initial fit also waits for the current
  layout's positions and boundaries, so it never frames a previous layout's.
- **`GraphCanvas`** — interactive edges and `nodePopover` / `edgePopover` dialogs get their
  accessible names from node labels instead of ids, so screen readers no longer announce opaque
  ids such as UUIDs (tinkermonkey/heimdall#304). An edge is announced as "monitors: WebSocket
  Disconnect Alert to Connection State Gauge", a popover as "Details for <node label>" or
  "Details for <edge name>". Each name falls back to the id when a node has no label.

### Added

- **`GraphEdge`** — optional `sourceLabel` / `targetLabel` props for the interactive edge's
  accessible name, falling back to `sourceId` / `targetId`. `GraphCanvas` passes them
  automatically; pass them yourself when rendering `GraphEdge` standalone with opaque ids.

## [0.9.2]

Hotfix: the stylesheet import works again.

### Fixed

- **Package `./css` export** — `import '@tinkermonkey/heimdall-ui/css'` failed to resolve in 0.9.0
  and 0.9.1 (tinkermonkey/heimdall#303). The build-tool upgrade in 0.9.0 renamed the emitted
  stylesheet from `dist/style.css` to `dist/heimdall-ui.css`, and the `exports` map still pointed
  at the old name. The stylesheet is back at `dist/style.css`. `dist/heimdall-ui.css` remains as
  a deprecated one-line forwarder, so apps that aliased that file directly as a workaround keep
  building; switch back to the documented import.

### Added

- **`npm run check:package`** (`scripts/check-package-exports.mjs`) — fails when a path in
  `package.json`'s `exports`, `main` or `types` is missing from the packed tarball. The release
  workflow runs it after building, before the visual tests, so a release can't publish an export
  consumers can't resolve.

## [0.9.1]

Bug fixes for `MapCanvas`, `LineChart` and `KanbanBoard`, and agent skills regenerated to cover
every public export.

### Fixed

- **`MapCanvas`** — the initial view now fits the data (tinkermonkey/heimdall#296). It used to open
  on an empty grid at the top-left of the world with pins, tracks and heatmaps off-screen: the fit
  misread its own zoom calculation, never applied the zoom it computed, and panned in a different
  coordinate space from the one content is drawn in. Content is now projected once, at the level
  that frames the data (or `bounds`) with 60px padding at scale 1, and centred; a single point
  opens at level 12, the fit stops at level 16, and no data shows the whole world. Zooming only
  scales that projection, so it no longer jumps as you zoom. Tiles come from the integer level
  nearest the on-screen zoom. `onViewportChange`'s `center` is now the map point under the middle
  of the view; `zoom` is still the scale factor, 1 being the fitted view.
- **`usePanZoom`** — `onViewportChange` no longer fires again just because the callback's identity
  changed. A caller that set state from an inline callback, the usual way to write it, re-rendered
  forever (`MapCanvas` with an inline `onViewportChange` logged "Maximum update depth exceeded").
- **`LineChart`** — no longer throws when `series` switches between empty and non-empty data
  (tinkermonkey/heimdall#297). A hook ran after the empty-data early return, so the hook count
  changed between renders.
- **`KanbanBoard`** — `onMoveCard`'s `index` is now the card's final position for pointer drags
  downward within the card's own column too (tinkermonkey/heimdall#298). It was one slot too high,
  so a remove-then-insert handler landed the card one slot low. Keyboard and cross-column moves
  were already correct.

### Added

- **`agent-skills/heimdall-observability`** — new skill for `TraceViewer` (with the `fromOTLP` /
  `fromXRay` adapters and the trace-model helpers), `LogStream`, `DiffViewer`, `HashSetDiff`,
  `SideBySideDiff`, `VersionTimeline` and `LineageRail`.
- **`agent-skills/heimdall-planning`** — new skill for `Calendar`, `MiniCalendar` and `KanbanBoard`.
- **`npm run check:skills`** (`scripts/check-skill-coverage.mjs`) — fails when an exported
  component has no section in its assigned skill, a hook or utility export is never named, a skill
  documents a component that is not exported, or a props table names a prop the component type
  does not accept or leaves out one declared in `src/`. The release workflow runs it before the
  visual tests.

### Changed

- **Every agent skill regenerated against the current source.** The skills were written in May
  and had drifted: 22 public components were in no skill, and many props tables were incomplete.
  All 13 skills now cover every value exported from `src/index.ts`. Notable corrections:
  - `heimdall-charts` documented a `PieChart` that does not exist; it is removed, and the pie case
    is described under `Donut`. `ChartWrapper` and `BarChart` gained sections.
  - `heimdall-inputs` described `Select` as a native `<select>` wrapper. It is a custom dropdown
    with single and multi modes and `Select.Item` / `Select.CheckboxItem` / `Select.Separator` /
    `Select.SectionTitle` children.
  - `heimdall-data-display` implied `Table` sorts its rows; it only tracks the sort header, and
    the consumer sorts in `onSort`. Added `ResultCard`, `AssetCard`, `AssetGrid` and `MapCanvas`.
  - `heimdall-shell` no longer tells consumers to pad the `ShellLayout` canvas (it pads itself),
    and documents the mobile drawer behavior behind `mobileBreakpoint`.
  - Added `Avatar` (primitives), `Tooltip` and `Popover` (overlays), `ChatMarkdownContent`
    (chat), `useMediaQuery` (layout), and in `heimdall-graph`: `GraphEdgeShape`, `GraphToolbar`,
    `GraphCollapseControl`, `GraphEdgeInspector`, `DetailDrawer`, `usePanZoom` and the geometry
    utilities.
  - Missing props added across `Sidebar`, `Topbar`, `AppTitle`, `Statusbar`, `VersionPill`,
    `Drawer`, `FilterDropdown`, `EntityPicker`, `RowMenu`, `PipelineCard`, `ChatComposer`,
    `GraphCanvas`, `GraphNode`, `GraphEdge` and six charts. `Icon` points at `ICONS` instead of a
    stale list of names.
- **`/refine-component-skills`** — the category table now assigns every public export to a skill
  (two new categories: observability, planning). Prop tables use backticked names so the checker
  can read them.
- **README** — new "Agent skills" section with setup instructions and the skill list.
- **`agent-skills/heimdall-graph`** — brought up to date with 0.9.0. The skill now covers all
  eight `GraphCanvas` layouts (what data each suits, the props it reads, and its limits; `organic`
  and `orthogonal` are marked proof of concept), the hierarchy and collapse props,
  `nodePopover` / `edgePopover` and the tooltip triggers, the `renderNode` fourth `props` argument
  a custom renderer must wire for popovers, click tooltips and `aria-describedby`, the new
  `GraphNode` props, and the headless `organicLayout`, `orthogonalLayout`, `radialTreeLayout`,
  `uxNavLayout` and `galaxyLayout` functions.

## [0.9.0]

Graph layout release: four new `GraphCanvas` layout engines (`organic`, `orthogonal`,
`radial-tree`, `ux-navigation`), a rewritten `galaxy`, a fixed `force-clustered`, and
interactive popovers.

### Added

- **`GraphCanvas`** — `layout="organic"`, the first mode of the layout-engine rework and the
  intended successor to `force` / `force-clustered`. A headless, deterministic
  `organicLayout()` (also exported): stress majorization seeded by classical MDS, with a
  GTree-style overlap-removal stage that makes zero overlap and `nodeMargin` (as a minimum
  box-to-box gap, default 24 px) hard post-conditions, and a warm-start rule under which
  re-running the engine on its own output is a no-op. Nodes with explicit `x`/`y` are pinned
  and held exactly. On the 31-node technology-layer benchmark, neighborhood preservation goes
  from 0.34 (`force`) to 0.62 and scale-fitted stress from 0.151 to 0.039; 400-leaf stars,
  which drove `force` to `NaN`, stay finite. Proof of concept: no clustering option yet, and
  isolates are circle-packed rather than gridded.
- **`GraphCanvas`** — `layout="orthogonal"`, the second mode of the rework and the intended
  successor to `ux-navigation`. A headless, deterministic `orthogonalLayout()` (also exported)
  places nodes on a cell grid and routes every edge as an axis-parallel polyline over a lattice
  of routing lanes: routes never pass through a node, never share a segment with another route,
  and are returned boundary to boundary, index-aligned with the edges. GraphCanvas renders them
  in place of bezier paths (edges touching a dragged node fall back to a live bezier).
  - Rows come from the structural forest when `isStructuralEdge` is given, otherwise from the
    BFS layering with the fewest crossings; rows are crossing-minimized.
  - Honors the ux-navigation hooks: with `isPageNode`, a page's views fan out to its right in
    the same row; `isNavigationRoute` edges are routed last, around everything else.
  - Re-running on its own output keeps every node's cell; pinned nodes hold their cell.
  - On the harness's Stage 1 exemplar (22 types / 33 relationships): 1 crossing, 0.73 bends
    per edge, every hard check green.
  - Proof of concept: no incremental routing, and trunk sharing for tree edges
    (`busTreeEdges`) is available from `orthogonalLayout()` only, not through GraphCanvas.
- **`GraphCanvas`** — `layout="radial-tree"`: each structural tree (per `isStructuralEdge`) is
  laid out around its root, with each depth on its own ring and rings sized from their own
  population; several trees are packed as separate trunks without overlap. Supports
  `collapsedNodeIds` and draws a boundary per trunk (`showClusterBoundaries`). Headless
  `radialTreeLayout()` exported, with `RadialTreeLayoutOptions` (`ringSpacing`,
  `nodeSeparationGap`, `trunkPadding`) and `RingGeometry`.
- **`GraphCanvas`** — `showHierarchyRings` prop (`layout="radial-tree"` only, default false):
  draws a ring per occupied depth around each trunk. Visual only.
- **`GraphCanvas`** — `layout="ux-navigation"` for app screen maps: page nodes form top-to-bottom
  trees, a page's views fan out beside it, independent trees and orphan views are arranged in
  rows. New props `isPageNode` (page vs. view) and `isNavigationRoute` (route edges, hidden until
  a page or view touching them is hovered; which routes show depends on whether the hovered node
  is a collapsed page, an expanded page or a view). Structural-edge and route labels show only
  when the edge is in focus. Headless `uxNavLayout()` and `visibleNavigationEdgeIds()` exported.
- **`GraphCanvas`** — `structuralEdgeCurvature` prop (default 0.22): curvature for structural
  edges without their own `curvature`; 0 draws them straight.
- **`GraphCanvas`** — `nodePopover` / `edgePopover` render props: interactive content in a
  `role="dialog"` popover anchored to a clicked or focused node or edge, tracking pan and zoom,
  closed on Escape, background click or click outside. Opening moves focus to the popover's
  first focusable element; Escape closes it from anywhere in the canvas, including while focus
  is still on the node or edge (content with nothing focusable, such as a click tooltip).
- **`GraphCanvas`** — `renderNode` receives a fourth argument, `props: { nodeId, tooltipId,
  onSelect, onPopoverOpen }`. A custom renderer must call `onPopoverOpen(element)` on click when
  it is defined, or `nodePopover` and click-triggered tooltips never open; `tooltipId` is the id
  to put in the node's `aria-describedby`.
- **`GraphNode`** — `popoverOpen`, `popoverPanelId`, `tooltipId`, `onFocus` and `onBlur` props,
  used by GraphCanvas to wire popovers and tooltips to the default node.
- **`GraphCanvas`** — `nodeTooltipTrigger` / `edgeTooltipTrigger` (`'hover' | 'click'`, default
  `'hover'`). `'click'` renders the tooltip content in a `Popover` so it can hold buttons and
  links. Node and edge tooltips are now wired to their targets with `aria-describedby`.
- **`Popover`** — new compound component (`Popover`, `Popover.Trigger`, `Popover.Panel`) for
  interactive, accessible content: controlled (`open` + `onOpenChange`) or uncontrolled,
  `placement`, `offset`, `disableOutsideClick`, `panelId`, and `autoFocus` (move focus to the
  panel's first focusable element on open; default `false`).
- **`GraphCollapseControl`** — the collapse/expand button GraphCanvas shows beside a hovered node
  that has structural children, exported for custom overlays.
- **`Tooltip`** — `id` prop, so a trigger elsewhere in the DOM can reference it with
  `aria-describedby`.
- **`GraphNodeData.weight`** — optional size weight for `layout="galaxy"` (ignored by every other
  layout; unrelated to `GraphEdge.weight`). A node without one weighs the sum of its structural
  children; when no node has a weight, each node weighs its subtree leaf count. Weights are
  resolved over the full tree, so collapsing a subtree never resizes its parent.
- **`GraphNode`** — `bodyRadius` prop: renders the node as a round body of that radius.
- **`galaxyLayout`** — `GalaxyLayoutNode.weight` (orbit order) and `.radius` (true radius for a
  round body, used instead of the box half-diagonal).
- **`ChatComposer`** — `enterBehavior` prop (`'send' | 'newline'`, default `'send'`): controls Enter key behavior in the message textarea. When set to `'send'`, bare Enter submits the message and Shift+Enter inserts a newline (default behavior). When set to `'newline'`, bare Enter inserts a newline and Shift+Enter also inserts a newline — Submit only via the Send button. Enables touch-friendly and mobile-optimized input modes without forking or DOM-patching the component. The shortcut hint text automatically hides desktop-specific wording when `enterBehavior='newline'`.

### Changed

- **`GraphCanvasContextValue.layout`** — the union now includes `'organic'`, `'orthogonal'`,
  `'ux-navigation'` and `'radial-tree'`; an exhaustive `switch` over it needs the new cases.
- **`findClearLabelPosition`** — new `isPolyline` parameter samples the points as a polyline
  (orthogonal routes). Without it, only exactly four points are read as a cubic bezier; five or
  more points are now sampled as a quadratic from the first three, where they were previously
  read as a cubic from the first four.
- **`GraphCanvas`** — `layout="galaxy"` rewritten to follow the original galaxy charts it was
  built to recreate (Risacher's D3 galaxy chart, Galaxies of the Guardian):
  - Without a `renderNode`, nodes are drawn as round bodies whose **area grows with weight**
    (with the square root of weight, so items spanning several orders of magnitude stay
    distinguishable), coloured by `domainColor`, instead of label cards. Labels sit inside bodies
    big enough to hold them, wrapping between words; smaller bodies are named on hover. When no
    node has a `weight`, sizes come from subtree leaf counts with a higher floor. Selection,
    keyboard, popover and collapse behave exactly as before.
  - Each parent's children orbit it **heaviest first** in a full, evenly spaced circle. Each
    satellite sits just far enough out for its whole subtree to clear its parent and stay within
    its own slot, so **no two bodies overlap anywhere**, by construction rather than by a settle
    loop. Only children curl like a galaxy arm instead of running off in a line.
  - Independent trees are separate galaxies packed together compactly; lone nodes are packed as
    their own group; a wide container spreads whole galaxies, never a galaxy's own orbits.
  - Boundary discs are **off by default for galaxy** (`showClusterBoundaries` still turns them
    on; they are now the smallest circle around each system). Structural (orbit) edge labels show
    only when the edge or one of its nodes is hovered or selected. Edges meet round bodies at the
    circle rather than the bounding box.
  - Live simulation eases toward the same construction; a dragged node carries its subtree and a
    held drag settles. Static layout is ~1-30 ms for typical graphs (was ~300 ms for 250 nodes).
  - Options: `startAngle` now defaults to π (first satellite at 9 o'clock; was −π/2).
    `nodeSpread` is now the default gap as a multiple of the median body radius (default 0.6;
    was an orbit-distance multiplier, default 3.2). `nodeMargin` replaces that gap when given (0
    means touching). `settleCycles`, `separateGroups`, `resolvedAspectScale` and
    `resolveAspectRatioScale` are deprecated and have no effect.

### Fixed

- **`GraphCanvas`** — `layout="force-clustered"` no longer smears clusters into each other on
  dense graphs. Each Louvain cluster is now laid out on its own (internal edges only), clusters
  are spaced by their real size, and each cluster is rotated to face the clusters it connects
  to. On the college-football benchmark (115 nodes, 613 edges) node overlaps go from 53 to 0
  and overlapping cluster bubbles from 93% to 2%; layout is also 2-10x faster.

## [0.8.0]

### Added

- **`Tooltip`** — new component (`content`, `children`, `placement`, `delay`, `offset`,
  `disabled`, `open`). Positions relative to its trigger with automatic edge-flip, and supports an
  `open` prop for external/controlled visibility (used by `GraphCanvas`'s node/edge tooltip
  overlays, whose hover state lives on the node or edge rather than on whatever wraps the
  tooltip) — when set, the trigger's own pointer/focus tracking and `delay` are bypassed.
- **`GraphCanvas`** — `nodeTooltip` and `edgeTooltip` render-prop options to show a `Tooltip` over
  a hovered node or edge.
- **`GraphCanvas`** — `onEdgeHover` event, mirroring the existing `onNodeHover`.
- **`GraphCanvas`** — `renderEdge` render-prop (paired with the new exported `EdgeGeometry` type
  and `GraphEdgeShape` component) for fully custom edge rendering, mirroring the existing
  `renderNode`.
- **`useMediaQuery`** — new hook: subscribes to a media query string and returns whether it
  currently matches, updating on change. SSR-safe (returns `false` until mounted).
- **`ShellLayout`** — `mobileBreakpoint` prop (default `768`, matching `Topbar`/`Statusbar`; pass
  `false` to disable): below the breakpoint the sidebar collapses into a slide-over overlay opened
  via a mobile menu toggle instead of the persistent rail.
- **`Drawer`** — `keepMounted` prop: keeps the drawer in the DOM (hidden) while closed instead of
  unmounting it, for consumers that need to preserve its internal state across opens.

### Fixed

- **`Tooltip`** — pointer moving from the trigger onto the tooltip's own content no longer hides
  it immediately; hover now persists across that boundary as intended.

## [0.7.0]

### Added

- **`GraphCanvas`** — `centerOnSelect` prop (default `false`): pans to keep `selectedNodeId`
  centered in the viewport whenever it changes, preserving the current zoom (never re-fits or
  re-zooms). Off by default so existing consumers relying on `selectedNodeId` purely for
  highlighting/inspector wiring see no behavior change. Motivating case: an external selection
  origin — a sidebar, a nav tree — can select a node that's currently off-screen, unlike clicking
  a node directly on the canvas (you had to see it to click it); `centerOnSelect` closes that gap.
  Skipped until the initial mount center/fit has run and while pan/zoom is `locked`, and only acts
  on a genuine change to `selectedNodeId` — it never fights a user's own subsequent pan away from
  the selected node on a re-render. Combining `centerOnSelect` with `fitView` and an already-set
  `selectedNodeId` at mount correctly uses the post-fit zoom rather than a stale pre-fit one; a
  `selectedNodeId` that isn't resolvable yet (e.g. inside a currently-collapsed subtree) is
  retried on a later render instead of being silently given up on.
- **`GraphCanvas`** — `fullscreenContainerRef` prop: pass a ref to an ancestor element and the
  built-in toolbar's Fullscreen button (and `toggleFullscreen`/`isFullscreen` from
  `useGraphCanvas()`) request/track fullscreen on that ancestor instead of GraphCanvas's own root.
  Motivating case: GraphCanvas doesn't accept `children` — it fully owns its internal tree — so a
  consumer composing sibling overlay content next to it (a control strip above it, a
  `DetailDrawer` beside it, the same pattern GraphLayoutsShowcase itself uses) previously lost
  that content the instant Fullscreen was used, since the native Fullscreen API only renders the
  fullscreened element's own DOM subtree. GraphCanvas still measures and lays out against its own
  container's size regardless of which ancestor is actually fullscreened, so nothing else about
  its behavior changes; omitting the prop is identical to previous behavior. Entering/exiting
  fullscreen is bounded and failure-safe: a rejected `requestFullscreen()`/`exitFullscreen()` (no
  permissions-policy grant, a detached or mid-unmount target, ...) is caught and logged via
  `console.warn` instead of surfacing as an unhandled rejection, and the fit applied on entering
  fullscreen no longer stays armed indefinitely waiting for a container resize that may never
  come (a target that's already viewport-sized on entry, say) — it's bounded to a short window
  after entry, so it can't fire later against an unrelated resize instead.

## [0.6.0]

### Added

- **`GraphCanvas`** — opt-in nested bubble-packing layout: `layout="force-clustered"`
  groups nodes into clusters (and clusters of clusters) derived purely from
  edge structure via deterministic Louvain modularity clustering, packs
  them with `d3-hierarchy`, then runs the existing spring simulation within
  each bubble. Trades a larger canvas for a less even, more legible node
  distribution. Renders an additional `.graph-cluster-boundary` circle per
  top-level cluster (see the new `showClusterBoundaries` prop below). New exports: `clusteredForceLayout`,
  `ClusteredLayoutOptions`, `ClusteredLayoutResult`, `louvainCluster`,
  `ClusterEdge`, `ClusterTreeNode`, `LouvainOptions`, `packClusters`,
  `PackedCircle`, `PackOptions`. New dependency: `d3-hierarchy`.
- **`GraphCanvas`** — `onBackgroundClick` prop fires the typical "click empty
  space to deselect" gesture: a press-and-release within a few px of each
  other on genuine canvas background (not a node, edge, or opted-out
  element). A real pan drag never fires it, and it works independently of
  `usePanZoom`'s own drag tracking so it still works while pan/zoom is locked.
- **`DetailDrawer`** — an auto-hiding overlay panel: floats over its nearest
  `position: relative` ancestor (a `GraphCanvas`, for instance) instead of
  reserving dedicated layout space, expanding only once `open` and its
  children are truthy. Translucent/blurred background, no border by default,
  and a left-edge resize handle that highlights in the accent color on hover
  so users can tell it's resizable without a visible seam at rest. New
  exports: `DetailDrawer`, `DetailDrawerProps`.
- **`GraphToolbar`** — a built-in zoom/pan/lock control cluster for
  `GraphCanvas`, shown by default (`showToolbar`, default `true`) in any of
  the 4 corners or 4 edge-centers (`toolbarPosition`, default
  `'bottom-right'`): zoom in, zoom out, zoom to fit, and lock pan/zoom (backed
  by `usePanZoom`'s new `locked` option, which gates wheel/drag/keyboard
  input but not imperative `setZoom`/`setPan`/`zoomToFit` calls). New
  exports: `GraphToolbar`, `GraphToolbarProps`, `GraphToolbarPosition`.
- **`galaxyLayout`** — opt-in `nodeMargin` option, and `GraphCanvas`'s
  existing `nodeMargin` prop (previously `layout="force"` only) now applies
  to `layout="galaxy"` and `layout="force-clustered"` too. Padding is applied
  only during galaxy's settle-cycle separation passes, never its final
  cleanup pass, so the "zero literal overlap" guarantee still holds
  regardless of the margin value. Defaults to `0` (unpadded) for `"galaxy"`
  specifically — unlike `"force"`/`"force-clustered"`, which default to each
  node's own rendered width — since galaxy's radial placement already spaces
  most layouts generously and defaulting padding on would shift every
  existing galaxy layout's node positions for what's a narrow, opt-in-worthy
  edge case (verified on a real 57-node/4-level hierarchy with heavy size
  variance: the tightest sibling pairs went from under 1px apart to 8px+
  with `nodeMargin={12}`, zero overlaps either way).
- **`GraphCanvas`** — `showClusterBoundaries` prop (default `true`) and
  boundary circles now also render under `layout="galaxy"`, not just
  `"force-clustered"` — one per independent root subtree. A root with
  children delegates its group-headship down to each of its own children
  rather than drawing one circle around its entire subtree, so a single deep
  hierarchy (e.g. one root with a dozen direct branches) still reads as
  several legible groups instead of one all-encompassing circle; a childless
  root (an orphan, or a node reachable only via a relational edge) keeps its
  own single-node boundary. Both engines share the same underlying helper,
  newly exported as `boundingCirclesByGroup`.
- **`GraphCanvas`** — non-structural edges (per `isStructuralEdge`) are now
  hidden entirely by default instead of dimmed to a low opacity — line,
  arrow marker, and label all disappear, and the edge isn't clickable while
  hidden. Hovering/selecting a touching node, or `showAllRelations`, still
  reveals them at full opacity, same as before. Removes the internal
  `NON_STRUCTURAL_DIM_OPACITY` constant this replaces.
- **`GraphToolbar`** — a fifth button toggles the canvas container in and out
  of the Fullscreen API. Tracks the platform's own fullscreen state (not
  just its own clicks), so Esc or any other exit path updates the icon too.
  Entering fullscreen also zooms/pans to fit the current nodes once the
  container has actually resized to its new (larger) fullscreen dimensions
  — a previously zoomed-in view no longer stays zoomed into a random corner
  when the canvas suddenly has much more room. Skipped while pan/zoom is
  locked, same as every other automatic viewport change in `GraphCanvas`.
- **`galaxyLayout`** — top-level group boundary circles (the same ones
  `showClusterBoundaries` renders) no longer overlap each other, on by
  default. After the existing per-node settle cycles, a macro separation
  pass treats each group's boundary circle as a single pseudo-node, pushes
  apart any that overlap, then rigidly shifts each group's members by the
  resulting delta — preserving each group's already-correct internal
  arrangement. Computed unconditionally, independent of whether boundaries
  are actually rendered. New `GalaxyLayoutOptions.separateGroups` option
  (default `true`) opts back out. New export: `galaxyGroupHeads` (from
  `utils/graphHierarchy`) — the "a root with children delegates
  group-headship to each of its own children" rule, now shared between this
  pass and `GraphCanvas`'s own boundary rendering so the two always agree on
  what a "group" is.
- **`GraphCanvas`** — opt-in live simulation for `layout="galaxy"`: instead
  of a one-shot computed-then-frozen layout, run a continuous elastic
  simulation. Drag any node ("sun") and its descendants follow in real time,
  spring-pulled toward their algorithmic home position with collision
  detection keeping siblings apart throughout; releasing a node leaves it
  exactly where it was dropped, permanently pinned, same as a static-mode
  drag. A sixth `GraphToolbar` button (galaxy layout only) toggles it —
  purely internal state, no controlling prop. The simulation self-idles
  (stops scheduling animation frames) once movement drops below a small
  threshold for about half a second, and wakes on the next drag. New
  exports: `galaxySimulationStep` (from `utils/galaxyLayout`, the
  single-step primitive `galaxyLayout` itself now loops over),
  `useGalaxySimulation` (new hook, `hooks/useGalaxySimulation`), and a new
  `orbit` icon. `GraphCanvasContextValue` gains `layout` (read-only),
  `liveSimulation`, and `setLiveSimulation`.
  New exports on `GraphCanvasContextValue`: `isFullscreen`,
  `toggleFullscreen`. New icons: `fullscreen`, `fullscreenExit`.
- **`galaxyLayout`** — aspect-ratio-aware placement: a new
  `GalaxyLayoutOptions.aspectRatio` option (container width/height) warps
  every orbital ring from a circle into an ellipse so the layout's overall
  shape leans toward the container's own proportions, instead of always
  producing a footprint that a wide-short or tall-narrow container then has
  to letterbox — the established technique radial tree layouts (e.g.
  Perforce's `IlvTree`, the `d3-radial` library) use for the same problem.
  The correction is computed *relative to the tree's own natural, unwarped
  shape* (measured with a first placement pass) rather than relative to a
  hypothetical circle — a tree with a long single-child chain, in
  particular, is often already far from circular on its own, and correcting
  against the wrong baseline can misjudge the needed warp badly enough to
  move the result in the wrong direction entirely. Both the target ratio and
  the resulting correction factor are clamped to `[1/8, 8]`; the correction
  is then bounded, not by a fixed damping constant, but by a binary search
  over how strong a correction the graph can actually take — `separationPass`'s
  collision floor resists *compression* but not *expansion*, so an
  undamped correction doesn't trade width for height the way it looks like
  it should, it mostly just adds width, and how much depends heavily on the
  graph's own structure (a single fixed damping constant measurably
  under-corrected some real graphs while over-inflating others). The search
  finds the strongest correction whose actual rendered area — measured via
  one real settle step per trial, not just the raw elliptical placement,
  which meaningfully overestimates distortion for graphs with several small
  sibling groups — stays within roughly double the natural (unwarped) area.
  New export `resolveAspectRatioScale` performs this resolution and is what
  `galaxyLayout` calls once per invocation (rather than once per settle
  cycle) and what a live-simulation caller driving `galaxySimulationStep`
  directly should call once per structural/target-ratio change (via its own
  new `resolvedAspectScale` option) rather than paying the search's cost on
  every animation frame. Omitted `aspectRatio` (or exactly `1`) reproduces
  prior circular placement bit-for-bit. `GraphCanvas` feeds its own real
  container aspect ratio in automatically for `layout="galaxy"` (rounded to
  the nearest 5% so sub-pixel resize noise doesn't churn it) and pre-resolves
  it the same way for its own live-simulation loop, and redraws the layout —
  respecting a currently-pinned/dropped node's position exactly — whenever
  that ratio changes meaningfully and pan/zoom isn't locked; live-simulation
  mode eases toward a new shape smoothly via its existing spring mechanism
  instead of snapping. No new `GraphCanvas` prop — the existing lock toggle
  is the complete opt-out. Known limitation: even the strongest correction
  the search allows has a practical ceiling — `separationPass` refuses to
  compress nodes past their own rendered size — so a layout dominated by one
  long chain won't ever fully reach an extreme target ratio; the area-growth
  bound means the *drawn* result deliberately stops short of that ceiling
  too, in exchange for not ballooning the layout's absolute size to get
  there.

### Fixed

- **`GraphCanvas`**: the viewport's visual center didn't survive a container
  resize — most noticeably, toggling Fullscreen would leave pan/zoom at the
  same raw values even though the container had just jumped to a completely
  different size, snapping whatever was centered on screen off to one side.
  A resize (Fullscreen, window resize, a host layout change) now re-anchors
  pan so the same point stays centered.
- **`galaxyLayout`/`boundingCirclesByGroup`**: a group's boundary circle
  (`showClusterBoundaries`) was centered on the plain centroid of its
  members' positions, not on the group's own "sun" node — fine for a
  symmetric subtree, but a deep, lopsided one (a long one-directional chain)
  could drift the centroid well away from the sun itself, drawing the circle
  over empty space and letting members spill past its edge. New
  `boundingCirclesByGroup(..., anchorToHead)` parameter (`GraphCanvas`'s
  galaxy branch passes `true`) centers each circle on the group head's own
  position instead; force-clustered's Louvain clusters, which have no single
  natural anchor, keep the centroid.
- **`GraphCanvas`** live-simulation mode: `showClusterBoundaries`'s rendered
  circles were computed once by the static one-shot layout effect and then
  frozen — while live mode ran, dragging a "sun" moved its own boundary
  circle not at all, even though its descendants correctly followed in real
  time. The live tick now recomputes cluster boundaries too (skipped
  entirely when boundaries aren't shown, to avoid the extra per-frame work).
- **`galaxySimulationStep`**: group separation eroded within the first few
  animation frames of live mode, even with zero user interaction — every
  tick's `homeStrength` nudge pulled each unpinned node straight back toward
  a raw, un-separated home position, since only `galaxyLayout`'s one-shot
  final pass applied `separateGroups` as a single rigid shift on top of
  already-settled positions; nothing kept correcting for it tick after tick.
  `galaxySimulationStep` now group-separates its own per-tick home
  positions too (the group-boundary macro pass only — the individual-node
  safety-net cleanup galaxyLayout's own final pass also runs stays a
  one-shot-only cost), so live mode holds the same non-overlapping bubbles
  its seed layout started with instead of drifting back to full overlap
  within about a second of idling.
- **`galaxySimulationStep`**: dragging a "sun" close enough to another
  group's territory left that OTHER group's real nodes sitting exactly
  where they were, while the dragged group's honestly-reaching boundary
  circle simply grew to enclose them — reading as "I dragged a node into
  another group" even though membership never changed (the fix two commits
  ago kept the *algorithmic target* layout separated, but nothing reacted
  to a group's *actual, currently-dragged* footprint growing into a
  neighbor's actual space). Live ticks now push the other group's real
  positions out of the way instead, the same collision-avoidance reaction
  individual nodes already get — whichever group contains a currently
  pinned/dragged node stays exactly where the user put it; every other
  group yields.
- **`usePanZoom`**: wheel-zoom, drag-to-pan, and keyboard pan/zoom shared a
  single `requestAnimationFrame` ref — if two of those gestures' handlers
  both fired before the frame committed (plausible any time a trackpad
  pinch and a stray pointer event land close together), whichever ran last
  would cancel the others' already-scheduled update before it committed,
  silently dropping that gesture's change for the frame. Each now gets its
  own rAF ref so one input source can no longer clobber another's pending
  update.
- **`GraphCanvas`**: mouse-wheel zoom could occasionally jump to an unrelated
  pan/zoom mid-gesture — `usePanZoom`'s wheel listener calls
  `preventDefault()` to fully own zoom/pan, but that only stops the
  browser's own native handling if JS wins the race for that event; under
  any main-thread load the browser can occasionally act on a wheel event
  first, firing its own native page zoom/scroll for that one event. Adds
  `touch-action: none` to `.graph-canvas`, opting it out of the browser's
  native gesture handling entirely instead of just trying to out-race it —
  the standard fix for a custom-zoom surface (same guidance d3-zoom and
  Mapbox GL give for their own interactive elements).
- **`galaxyLayout`**: root-ring placement sized a root's distance from the
  shared hub off only its own (tiny) radius, with no regard for how far its
  own subtree would go on to spread — a lone orphan and the root of a deep,
  many-node chain started at essentially the same tiny distance. In
  practice this read as a large subtree's own root landing in the shared
  hub's crowded middle, visually disconnected from (and often overlapping)
  its own far-flung descendants, and sitting inside whatever unrelated
  neighboring group happened to also be near that hub — the `GALAXY_DEMO_NODES`
  dataset's "organism" (parent of an entire 9-node biology tree) was the
  case that surfaced it. Root-ring seeding now adds each root's own
  subtree reach (the same recursive orbital-distance math `place()` already
  uses, run once bottom-up first) on top of its existing own-radius term —
  a childless root's placement is unchanged; a root with descendants now
  seeds proportionally farther out, landing on the same radial line as the
  rest of its subtree instead of near the hub.

## [0.5.2]

### Added

- **`GraphCanvas`/`GraphEdge`** — weighted, styled edges: a new `weight`
  prop (0-100) maps to a 1-8px stroke width via a square-root curve so
  low-end differences stay visually distinguishable, plus independent
  `opacity` and `strokeDash` (single value or `[dash, gap]` tuple) controls.
  Arrow markers scale proportionally with stroke width. New export
  `EdgeAnchor` type from `utils/graph`.
- **`Icon`** — six new icons: `image`, `code`, `map`, `sparkles`, `share`,
  `ellipsis`.

### Changed

- **`ShellLayout`** canvas panel is now responsive instead of a fixed
  `min-width: 1100px` — padding steps down at the `1024px` and `640px`
  breakpoints and the canvas reflows instead of forcing horizontal scroll
  on narrower viewports.

### Fixed

- **Graph force layout** (`forceLayout`, used by `GraphCanvas`): nodes could
  settle at force equilibrium with their rendered bounding boxes still
  overlapping, since the simulation treated nodes as dimensionless points.
  Adds a post-process `resolveOverlaps()` pass — capped-displacement
  separation interleaved with spring-only relaxation, then a bounded
  early-exit cleanup — that resolves overlaps without perturbing edge
  crossings. Verified against a real 31-node/33-edge reference layer via the
  project's own layout-quality test loop: node overlaps 7 → 1, zero
  edge-crossing regression (exact parity with the unmodified baseline),
  edge-length-deviation and neighborhood-preservation both improved. The
  first of 8 proposed changes to that loop's regression-gated test to
  actually pass it.
- **Playwright visual regression suite**: `loadSelfHostedFonts()` computed
  the fonts directory via a hardcoded relative `file://` path that broke
  when the package moved to the repo root, silently falling back to a
  system font in every test run and blocked outright by Chromium's
  local-resource policy. Fonts are now loaded through the dev server's
  same-origin `/fonts/` URL instead. `assertFontsLoaded()` previously only
  checked that `@font-face` rules were declared, not that they actually
  loaded — it now checks `document.fonts` status directly. Also fixes
  `calendar.spec.ts`'s "accessibility attributes in month view" test, which
  depended on the real wall-clock date falling inside the fixture's
  hardcoded June 2026 month; the clock is now frozen to that month.
  Linux screenshot baselines regenerated against the corrected renderer.

## [0.5.1]

### Fixed

- **`TraceViewer`** detail panel: long attribute names and values no longer
  overlap. Key and value cells now truncate to a single line with an ellipsis
  and reveal the full text on hover (native `title`); the parent link, service,
  and host values truncate the same way.

## [0.5.0]

### Added

- **`TraceViewer`** — an OpenTelemetry distributed-trace waterfall: span tree,
  service-colored waterfall with a parent→child connector bus, and a fly-out
  detail panel (timing/self-time, identity, attributes, status/exception, trace
  minimap), over a header summary strip. Light + dark canvas, keyboard-navigable
  (ARIA tree), row-virtualized, with brush-to-zoom, hover-sync, and error-jump.
- **Native trace ingestion** — `TraceViewer` accepts `trace` (normalized),
  `otlp` (OTLP/JSON), or `xray` (AWS X-Ray segment document) props.
- **`fromOTLP(payload, opts?)`** — adapter from OTLP/JSON trace data to the
  normalized model (hex/base64 id handling, BigInt nanosecond math, enum
  mapping, attribute flattening, exception events).
- **`fromXRay(segments, opts?)`** — adapter from AWS X-Ray segment documents
  (trace-id reformat, epoch-seconds timing, namespace→kind, fault→error,
  `cause.exceptions`→exception, recursive subsegments).
- Exported trace model + helpers: `Trace`, `TraceSpan`, `TraceMeta`,
  `ServiceInfo`, `SpanStatus`, `SpanKind`, `SpanEvent`, `TraceModel`,
  `TraceModelNode`, `buildTraceModel`, `paletteColor`, `DEFAULT_SERVICE_PALETTE`,
  and the OTLP/X-Ray input types.
