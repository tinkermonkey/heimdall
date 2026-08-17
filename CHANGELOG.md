# Changelog

All notable changes to `@tinkermonkey/heimdall-ui` are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  edge case (verified on a real 56-node/4-level hierarchy with heavy size
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
