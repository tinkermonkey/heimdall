# Changelog

All notable changes to `@tinkermonkey/heimdall-ui` are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0]

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
