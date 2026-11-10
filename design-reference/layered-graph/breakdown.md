# Layered graph components: functional breakdown

Status: decisions recorded 2026-11-06 (see [Decisions](#decisions)); steps 1–6 are implemented
(see [Implementation status](#implementation-status)). Source prototypes: the Claude Design canvas
[Layered graph concepts](https://claude.ai/artifact/TxKdLSuLqm4PU9fFEohNcj)
(artboards `3D layer stack` and `2D multi-layer counterpoint`).

This turns the two prototypes into a component family for `@tinkermonkey/heimdall-ui`: one
3D view (**layer stack**) and three 2D views (**lanes**, **matrix**, **hive**) over the same
multi-layer graph, with the same selection, link-following, filtering and predicate-labelling
behaviour in every view.

The breakdown is in four parts:

1. [Shared framework](#1-shared-framework): what every view uses. Built once, in `src/utils/layered/` and
   `src/hooks/`, and exported so client apps can build their own views or chrome on it.
2. [Views](#2-views): each view's own scene, options and interactions.
3. [Chrome and composition](#3-chrome-and-composition): the controls, inspector and the ready-made explorer.
4. [Sequencing and open questions](#4-sequencing-and-open-questions).

Throughout, **[F]** marks framework (shared) functionality and **[V]** marks view-specific functionality.

---

## Component map

```
                         LayeredGraphExplorer (composite: view switcher + chrome)
                                          │
        ┌──────────────┬──────────────────┼──────────────────┬──────────────┐
   LayerStack3D   lanes (GraphCanvas)  LayerMatrix        LayerHive     (client views)
        │              │                  │                  │              │
        └──────────────┴────────── useLayeredGraph ──────────┴──────────────┘
                                          │
     index · layout · reach · filters · predicate labels · styling tokens · state snapshot
```

Views are **scene components without chrome**: they render the graph and handle direct
manipulation (click, hover, drag). Every control in the prototypes (filters, follow depth,
predicate mode, camera presets, zoom, turntable, layer gap) is a prop with a matching
`on…Change` callback, so an app can drive them from its own UI or from the shipped chrome
components. This mirrors how `GraphCanvas` separates the canvas from `GraphToolbar`.

---

## 1. Shared framework

### 1.1 Data model and index [F]

Input is the **same node and edge model `GraphCanvas` uses** (`GraphNodeData`, `GraphEdge`). There
are no data-source adapters: the library knows nothing about DR or any other vocabulary. Both
types gained an optional `attributes` bag (`Record<string, GraphAttributeValue | GraphAttributeValue[]>`),
which `GraphCanvas` ignores.

Layering is choosing one node attribute (`layerBy`):

| Option | Values | Notes |
|---|---|---|
| `layerBy` | attribute key, `'kind'`, `'domainColor'`, or `(node) => value(s)` | Each distinct value (as a string) is a layer. |
| `multiValue` | `'first'` (default), `'last'`, `'exclude'`, `'all'` | `all`: one node instance per value, id `<nodeId>@<layerId>`; an edge links every instance of its source to every instance of its target. |
| `missingValue` | `'exclude'` (default), `'layer'` | `layer` collects them on an "Unassigned" layer (`missingLayerLabel`). |
| `layers` | `{ id, label?, color? }[]` | Order, labels and colors for known values; unlisted values follow in first-appearance order. |
| `linkCategoryBy` | edge attribute key or `(edge) => category` | Falls back to `catalog[edge.label].category`, then `fallbackCategory` (`other`). |
| `catalog` | `{ [predicate]: { category, label?, code? } }` | Optional; client-provided. |
| `categoryOrder` | `string[]` | Orders categories (and so their styles) and picks a link's primary category. |

An edge's `label` is its predicate. `buildLayeredIndex(nodes, edges, options)` is pure and
memoizable. It:

- **Bundles parallel edges per directed instance pair.** `A→B` and `B→A` stay separate.
- **Derives per-link fields:** `predicates`, `categories`, `primaryCategory`, `cross` and `pairKey`.
- **Derives per-node fields:** `nodeId` (the source node), `degree`, `crossDegree`, adjacency and a truncated display label.
- **Builds summaries:** per layer and per layer pair (zero pairs included), category counts and unique two-letter predicate codes.
- **Reports problems instead of throwing:** missing or excluded layer values, dangling edges, self-loops and duplicate nodes go in `issues`.

Generalizes to N layers: the palette, plane spacing and hive angles all derive from N.

### 1.2 In-layer layout service [F]

`layoutLayers(index, options)` returns normalized in-plane positions per node. It is pure,
deterministic and async-capable (uses `yieldToPaint` for large inputs).

- **`engine`:** `'organic'` (default, `organicLayout`), `'orthogonal'`, or `'manual'` (use `LayeredNode.position`).
- **`mode`:**
  - `'independent'`: one solve per layer on intra-layer links. Each plane reads best on its own.
  - `'coupled'`: one joint solve including cross-layer links, so linked nodes stack.
  - Both are always computed, so a view can tween between them (`mix: 0..1`).
- **`layoutEdgeFilter`:** which links drive layout. Default: the `structural` category, the agreed default for the near-clique spec layers. Rendering filters are separate (1.4).
- **Derived orderings for the 2D views:**
  - `laneOrder` (by coupled x, or `'degree' | 'label' | custom comparator`)
  - `matrixOrder` (layer, then coupled x; options `'degree' | 'label' | 'cluster'` via `louvainCluster`)
  - `hiveRank` (by `degree | crossDegree | label | custom`)

Cache keyed on index identity plus options; views share one result through `useLayeredGraph`.

### 1.3 Selection and link projection ("follow") [F]

The core interaction across all four views. `computeReach(index, selection, options)` is pure and
unit-tested. It returns:

- `hopOf: Map<nodeId, hop>`: 0 is the selection, 1 is direct, 2 and up are followed hops.
- `edgeHop: Map<edgeId, hop>`
- `via: Map<nodeId, { fromId, edgeId }>`: the chain shown in the inspector ("via TechnologyService · serves").

| Option | Default | Notes |
|---|---|---|
| `follow` | `1` | Extra cross-layer hops after the direct ring. 0 is direct only. Prototypes expose 0/1/2. |
| *(rule)* | fixed | One generic rule ("away from the clicked layer"): continue only from cross-layer neighbours, only along cross-layer links, never back into the selection's layer. No alternative rules (decided 2026-11-06). |
| `followCategories` | all visible | Follow only along chosen categories, independent of what is drawn. |
| `respectFilters` | `true` | Hidden layers and toggled-off categories are not traversed (prototype behaviour). |

Related selection state, also in the framework:

- **Layer focus:** one layer emphasized, the others dimmed. The 3D view also re-frames the camera.
- **Layer-pair focus:** show only the cross-layer links between two layers and dim uninvolved nodes.
- **Hover:** transient highlight with the same reach rules at `follow: 0`, so hover stays cheap.
- **Multi-select:** not in the prototypes. Reserve the API (`selectedIds: string[]`) now, so it isn't a breaking change later.

### 1.4 Visibility filters [F]

`LinkFilterState`:

| Field | Purpose |
|---|---|
| `hiddenLayers` | Hide a layer's nodes and links. |
| `categories` | Toggle links by predicate category. Counts per category are shown in the toggles. |
| `predicates?` | Finer than categories: hide individual predicates. |
| `showIntra` | Intra-layer links on or off. Showing only cross-layer links is the main inter-layer reading. |
| `layerPair` | Layer-pair focus (1.3). |

One function, `isEdgeVisible(edge, filters)`, is used by every view and by reach. Today's
prototypes duplicate it, so the production code should have exactly one copy.

### 1.5 Edge emphasis and styling [F]

`edgeEmphasis(edge, reach, filters, focus)` returns `{ color, width, opacity, dash, z }`. It is
the single source for the following rules:

- **Hop ramp:** amber-400 for direct links, then amber-200, then amber-100 for followed hops.
- **Dimming:** non-reached links fade when there is a selection; layers outside a focused layer are dimmed.
- **Category styles:** each category has a colour and dash pattern (structural solid, behavioral dashed, dependency dotted, other sparse).
- **Arrowheads:** drawn on reached links, and on all labelled links when predicates are on. Arrow geometry comes from a shared helper that takes a tip point and a unit direction, reusing the marker sizing in `graphEdgeStyle.ts`.

### 1.6 Predicate labels [F]

- **Modes:** `predicateLabels: 'off' | 'highlighted' | 'all'`, default `'highlighted'`. Highlighted means reached links plus the links of the active layer pair.
- **Pill:** a monospace label in the link's colour, with a translucent canvas background and a hairline border tinted with the link colour. This becomes a new token-styled primitive.
- **Placement:** `placeEdgeLabels(candidates, obstacles)` generalizes the existing `findClearLabelPosition`:
  - Candidates are sorted by priority: lower hop first, cross-layer before intra-layer.
  - Each candidate samples positions along its own curve or segment (t = .5, .36, .64, .24, .76).
  - A position must clear placed pills and node boxes.
  - A pill with no free position is dropped from the scene. The inspector still lists every predicate.
- **Matrix codes:** two-letter codes from `PredicateCatalog.code`, with `+` when a cell bundles several predicates. A generated legend lists only the codes in view.
- **Accessibility:** every link's accessible name comes from `edgeAccessibleName(predicateLabel, source, target)`.

### 1.7 Tokens and theming [F]

New tokens in `src/tokens/tokens.css` (both canvas modes), Tailwind-mapped:

- `--graph-hop-1/2/3`: the amber reach ramp.
- `--graph-link-1…6`: category colours by position in `categoryOrder`, each paired with a dash pattern in code (solid, dashed, dotted, sparse, dash-dot, short dash). Categories are generic; a client picks which category takes which slot.
- `--graph-layer-1…12`: the layer palette, drawn from design-system hues (emerald, indigo, cyan, rose, violet, teal) in two shades each. Neighbouring ranks differ in lightness as well as hue, and amber stays reserved for selection. Past 12 layers the palette repeats; an app can set `LayerDef.color`.
- `--graph-pill-bg`, `--graph-plane-fill-alpha`.

The prototypes were built on dark canvas. Light-canvas variants are needed for every token (no
`filter`/`invert`, per house rules).

### 1.8 State, control surface and imperative API [F]

Every option is available three ways:

1. **Controlled props** plus `on…Change` callbacks: for example `follow` / `onFollowChange`, `predicateLabels` / `onPredicateLabelsChange`, `filters` / `onFiltersChange`, `selectedId` / `onSelect`.
2. **Uncontrolled defaults** (`defaultFollow`, …) for drop-in use.
3. **The `useLayeredGraph()` hook**, which owns all of the above for an app that composes several views or its own chrome. One hook instance can drive several views at once, for example lanes and a matrix side by side with a shared selection.

Feature gating, the "software interface to enable or disable controls":

- `interactions={{ select, hover, orbit, zoom, focusLayer, … }}` turns direct manipulation on or off per view.
- `controls` on the explorer and chrome components chooses which control UIs render and in what order. Each control component is also exported for custom layouts.

Other parts of the control surface:

- **Imperative handle** (`ref`), following `GraphViewportHandle`: `select(id)`, `focusLayer(id | null)`, `setFollow(n)`, `fit()` (all views), plus the view-specific camera methods (2.1).
- **Serializable snapshot:** `LayeredGraphSnapshot` holds selection, follow, filters, predicate mode, view and camera. It round-trips through a URL or history entry, mirroring `GraphViewportSnapshot`.
- **Events:** `onSelect`, `onHover`, `onFocusLayer`, `onCameraChange` (3D) and `onViewportNavigate` (2D pan/zoom). Each carries a cause, like `GraphViewportCause`.

### 1.9 Labels, overlay and rendering primitives [F]

- **2D views** draw node labels as SVG `<text>`, consistent with `GraphCanvas`. The HTML overlay in the prototypes worked around a Claude Design runtime limitation and isn't needed in React.
- **3D view** keeps an HTML overlay for node labels, plane titles and predicate pills. These "billboard" labels stay upright and crisp at any camera angle, and stay focusable.
- **Shared `LabelOverlay`:** positions children in viewBox or projected coordinates, as percentages of a fixed-aspect container.

### 1.10 Motion, accessibility, performance [F]

- **Motion:** camera and layout tweens use one shared `useTween` helper with ease-in-out and a cancel-on-interaction rule. Under `prefers-reduced-motion`, tweens become jumps and the turntable is disabled. Matching the GraphCanvas convention, durations are 600–900 ms for camera moves, longer than the 80–180 ms hover rule.
- **Keyboard:**
  - Every node is reachable from a list in the inspector (as in the prototypes).
  - In-scene roving focus cycles nodes within a layer, with Up/Down moving between layers along cross-layer links.
  - Escape clears the selection.
- **Performance targets:** the full DR spec (183 node types, about 1,600 relationship schemas, 13 layers) must stay interactive.
  - Camera state lives in refs, and only the projected geometry recomputes per frame. Inspector and chrome do not re-render on orbit; the prototype's `setState` per frame does not scale.
  - Label placement is skipped during drag and rerun on release.

### 1.11 Testing and docs [F]

- **Unit tests:** `buildLayeredIndex` (bundling, counts), `computeReach` (each rule, filter interaction), `placeEdgeLabels`, and 3D projection math.
- **Playwright:** one test page per view under `src/test-pages/` (`LayerStackTestPage`, …) with a fixed camera and the turntable off, over two fixtures:
  - the spec meta-model (3 layers, 36 types, 162 links, 22 cross-layer)
  - the heimdall-ux model (48 elements, 2 cross-layer links)

  Generated by `scripts/build-layered-fixtures.mjs` as plain GraphCanvas data with a `layer` attribute. Linux baselines through the update-snapshots workflow.
- **Docs:** a "Layered graphs" showcase page in `docs/` with all four views on the same data and live controls.

---

## 2. Views

### 2.1 `LayerStack3D` [V]

**Scene**

- One translucent plane per layer, with a grid and a clickable plane title (title plus node and link counts) that focuses the layer.
- Nodes are layer-coloured discs sized by degree, with billboard labels.
- Links: intra-layer links on their plane, cross-layer links between planes.
- Selection adds a **drill-through column**, a dashed vertical through all planes at the node's in-plane position, with a ring on each other plane. This makes "what sits above or below this node" readable.
- Arrowheads and predicate pills follow the framework rules.

**Camera and view controls** (props, chrome and imperative)

| Control | Prop | Notes |
|---|---|---|
| Presets | `cameraPreset: 'stack' \| 'exploded' \| 'top' \| 'profile'` | Animated. Top is the x-ray view through all planes. Profile is a side-on view of the cross-layer links. |
| Orbit | `camera: { yaw, pitch, zoom, targetY }` | Drag to orbit, pitch clamped. A drag threshold separates orbit from click. |
| Zoom | `zoom`, `zoomBy(f)` | Buttons, wheel and pinch. Wheel needs a non-passive listener and should only capture when the scene is focused, so it doesn't fight page scroll. |
| Turntable | `turntable: boolean`, `turntableSpeed` | Off under reduced motion. Stops on user orbit. |
| Layer gap | `layerGap` | Slider in chrome. |
| Layer focus | `focusedLayerId` | Pushes other planes apart (eased), tilts the camera toward the plane and dims the others. Clicking again exits. |
| Plane layout | `planeLayout: 'independent' \| 'coupled'` | Animated mix between the two layout results (1.2). |
| Labels | `nodeLabels: 'all' \| 'reached' \| 'none'` | Prototype: a toggle between all and reached-plus-hover. |

Imperative: `applyPreset`, `setCamera`, `zoomBy`, `fit`, `setTurntable`, `focusLayer`.

**Renderer decision (decided 2026-11-06: SVG projection for v1)**

- **SVG plus perspective projection (prototype approach):** no new dependency, crisp lines and labels, accessible, snapshot-testable, comfortable at about 200 nodes. Weaknesses: painter's-order sorting only, no lighting or true occlusion.
- **react-three-fiber with a CSS2D overlay:** the direction already noted in the graph-layout plan for the 13-layer DR view. Adds three.js, WebGL testing variance and bundle weight.

Decision: v1 ships on SVG projection behind a small scene model (projected nodes, segments and planes), so a three.js renderer can come later without changing the public API.

**View-specific gaps from the prototype**

- Top view: plane titles collide. The prototype nudges them; production should pin titles to a side rail in top view.
- Occlusion of labels behind planes.
- Planes scale with layout extent per layer, but should share a common extent so the stack reads square.

### 2.2 Lanes (`GraphCanvas` layout) [V]

**Scene**

- One horizontal swimlane per layer: a layer-coloured bar and a title with a count.
- Nodes are monospace boxes, packed into rows and ordered by `laneOrder` (coupled x by default, so cross-layer links mostly run straight down).
- Intra-layer links are arcs above their row; cross-layer links are vertical cubic curves between lanes.
- Arrowheads and predicate pills placed along the curves.

| Option | Prop | Notes |
|---|---|---|
| Orientation | `orientation: 'horizontal' \| 'vertical'` | Vertical lanes suit narrow containers. |
| Ordering | `laneOrder` | Framework orderings (1.2). |
| Row packing | `maxRowWidth`, `nodeWidth: 'label' \| number` | Lanes grow in height with row count. |
| Intra-link style | `intraLinkStyle: 'arc' \| 'none' \| 'bundled'` | Arcs are honest but noisy on near-clique layers; bundled is future work. |
| Skip-layer links | `skipLayerRouting: 'direct' \| 'gutter'` | Direct crosses intermediate lanes (prototype); gutter routes down the side. |
| Pan and zoom | inherits `usePanZoom` | Needed beyond about 60 nodes per lane. |

Decided 2026-11-06: lanes are a **`GraphCanvas` layout**, starting with a new layout mode that
replicates the concept design (lane bands, packed rows ordered by coupled x, intra-layer arcs,
cross-layer curves). It inherits tooltips, `renderNode`, pan and zoom, fullscreen and the toolbar,
and reads selection, follow and filters from the framework. The skip-layer gutter routing can
later move onto `orthogonalLayout`'s channel router. The options table above becomes props of
that layout mode.

### 2.3 `LayerMatrix` [V]

**Scene**

- A directed block adjacency matrix: row is source, column is target.
- Rows and columns are ordered by layer, then by `matrixOrder`, with a layer colour strip on the headers.
- Blocks:
  - Diagonal blocks are within-layer, tinted with the layer colour.
  - Off-diagonal blocks are cross-layer, with a link count in the corner.
- Cells are coloured by category and show predicate codes plus a legend.
- Selection adds row and column bands; reach colours the cells by hop.

| Option | Prop | Notes |
|---|---|---|
| Ordering | `matrixOrder` | Including a cluster seriation via `louvainCluster`. |
| Cell size | `cellSize: 'auto' \| number` | Auto fits the container between 10 and 18 px. |
| Codes | follows `predicateLabels` | Plus `codeLegend: boolean`. |
| Symmetric mode | `symmetric: boolean` | Merges `A→B` and `B→A` into the upper triangle for an undirected reading. |
| Aggregate mode | `aggregate: 'none' \| 'layer'` | Collapses to a layers-by-layers heat map: the overview for 13 layers. |
| Cell click | `onCellSelect(edge)` | The prototype selects the source node. Production should select the link and show it in a link inspector (`GraphEdgeInspector`). |
| Large N | virtualized rows and columns | Reuse `useVirtualList` patterns above about 80 nodes. |

### 2.4 `LayerHive` [V]

**Scene**

- One axis per layer at evenly divided angles, each **doubled** (±13°) so intra-layer links span the gap.
- Nodes sit outward by `hiveRank`; cross-layer links are quadratic curves between the facing copies of two axes.
- Default labels are the top node per axis plus the selection and its reach.
- Arrowheads and pills placed along the curves.

| Option | Prop | Notes |
|---|---|---|
| Axis assignment | `axes: 'layer' \| (node) => axisId` | Layer by default; any categorical attribute is the general hive case. |
| Rank | `hiveRank` | Degree by default. |
| Doubled axes | `splitAxes: boolean`, `splitAngle` | Off draws intra-layer links as loops off the axis. |
| Labels | `axisLabels: number` (top-k) | Plus reached nodes. |
| N layers | angles from N | 3 to about 6 reads well. Beyond that, recommend the matrix aggregate. |

### 2.5 Common 2D scene concerns [F]

- **Fit and resize:** fixed-aspect viewBox fit, recomputed on container resize.
- **Pan and zoom:** `usePanZoom`, opt-in for lanes and matrix.
- **Hit targets:** at least 24 px through invisible hit shapes, especially matrix cells and hive dots.
- **Rendering:** shared edge-path builders (cubic, quadratic, polyline) that also sample points for label placement.

---

## 3. Chrome and composition

All chrome components read and write through `useLayeredGraph` (context) or plain props, and
each is exported for custom layouts.

| Component | Contents | Used by |
|---|---|---|
| `LinkFilterBar` [F] | Category toggles with dash sample and count, intra-layer toggle, labels toggle | all |
| `PredicateModeControl` [F] | `SegmentedControl` Off / Highlighted / All | all |
| `FollowControl` [F] | `SegmentedControl` Direct / +1 layer / +2 layers (options configurable) | all |
| `LayerList` [F] | Per layer: swatch, counts, focus (row button), hide (eye icon button) | all |
| `LayerPairList` [F] | Per layer pair: swatches, cross-layer link count, toggles pair focus | all |
| `BridgeNodeList` [F] | Top-k nodes by cross-layer degree; click selects | all |
| `LayeredNodeInspector` [F] | Builds on `GraphInspector`; see the bullets below | all |
| `CameraControls` [V] | Preset `SegmentedControl`, zoom buttons, turntable toggle, layer-gap slider | 3D |
| `PlaneLayoutControl` [V] | Independent / Coupled | 3D (and lanes ordering) |
| `ViewSwitcher` [F] | 3D stack / Lanes / Matrix / Hive | explorer |
| `LayeredGraphStatusbar` [F] | Dataset, counts, layout, camera (mono status line) | explorer |

`LayeredNodeInspector` contents:

- Layer eyebrow, name, identifier and description.
- Stat tiles for cross-layer and within-layer link counts.
- "Across layers" and "Within layer" relationship rows, with a direction icon, predicate and layer dot.
- A "Followed across layers" list (name, via node and predicate, hop badge) and a reach summary line.

It extends `RelationshipLink` with optional `hop`, `via` and `layer` fields, a backwards-compatible change to `GraphInspector`.

**`LayeredGraphExplorer`** is the ready-made pattern, essentially the prototypes made generic:
header controls, a scene for the chosen view, the link bar under the scene, the inspector in a
right drawer that stacks below the scene on narrow widths, and the status bar. Props:

- `views` (which of the four to offer)
- `controls` (which chrome to show)
- the full controlled-state surface from 1.8

Note: the explorer shares selection and filters across view switches; camera state is per view.

---

## 4. Sequencing and open questions

### Suggested order

1. **Framework core:** types, `buildLayeredIndex`, `isEdgeVisible`, `computeReach`, `edgeEmphasis`, tokens, `useLayeredGraph`, unit tests, fixtures script. Everything else depends on this.
2. **`LayerMatrix`:** the simplest geometry and the strongest reading of the dense spec. It proves the state, filter, reach and predicate-code path end to end.
3. **`placeEdgeLabels`, then `LayerLanes`:** proves curve label placement and arrowheads.
4. **`LayerStack3D`:** projection scene model, camera, tweens and the label overlay. The largest piece; it can start in parallel with step 3 once the framework lands.
5. **`LayerHive`.**
6. **Chrome components and `LayeredGraphExplorer`**, the docs showcase and Playwright baselines for all views.

Steps 2–5 are independent once step 1 merges and can run as separate branches or PRs.

### Decisions

All recorded 2026-11-06.

1. **3D renderer:** SVG projection for v1, behind a renderer-agnostic scene model. react-three-fiber stays a possible later renderer.
2. **Lanes:** a `GraphCanvas` layout mode, starting with a new layout that replicates the concept design (2.2).
3. **Layer palette:** 12 tokens from design-system hues and shades (1.7).
4. **Follow:** one generic rule, "away from the clicked layer" (1.3).
5. **Data:** no data-source adapters. Input is the `GraphCanvas` node and edge model with a chosen layering attribute and multi-value and missing-value policies (1.1).
6. **Names:** pattern A. The views are `LayerStack`, `AdjacencyMatrix`, `HivePlot` and `GraphCanvas layout="layer-lanes"`; the composite is `LayeredGraphExplorer`; the chrome is `FollowControl`, `LinkCategoryFilter`, `PredicateLabelControl`, `LayerList`, `LayerPairList`, `BridgeNodeList` and `ReachInspector`. The working names elsewhere in this doc (`LayerStack3D`, `LayerMatrix`, `LayerHive`, `LayeredNodeInspector`) map onto these.

### Naming (decided 2026-11-06: pattern A)

The framework's names are already generic and are what shipped in step 1: `useLayeredGraph`,
`LayeredGraphContext`, `buildLayeredIndex`, `computeReach`, `layoutLayers`, `linkEmphasis`, and the
`--graph-*` tokens. The open question is the views and chrome.

| Pattern | 3D view | Matrix | Hive | Lanes (GraphCanvas) | Composite | Chrome |
|---|---|---|---|---|---|---|
| **A. Standard visualization names** (chosen) | `LayerStack` | `AdjacencyMatrix` | `HivePlot` | `layout="layer-lanes"` | `LayeredGraphExplorer` | `FollowControl`, `LinkCategoryFilter`, `PredicateLabelControl`, `LayerList`, `LayerPairList`, `BridgeNodeList`, `ReachInspector` |
| B. `Layered` prefix on everything | `LayeredStack` | `LayeredMatrix` | `LayeredHive` | `layout="layered-lanes"` | `LayeredGraphExplorer` | `LayeredFollowControl`, `LayeredLinkFilter`, … |
| C. One component, a `view` prop | `<LayeredGraph view="stack">` | `view="matrix"` | `view="hive"` | `GraphCanvas layout="layer-lanes"` | the same component plus chrome | as A |

Why A was chosen:
- Matrix and hive are standard, recognizable visualizations that work for any attribute grouping, so their standard names help people find them.
- `LayerStack` names the one novel view plainly.
- The shared `Layered*` / `layer*` framework names make the family visible without a prefix on every component.
- B's prefixes read heavily in JSX.
- C hides four different prop surfaces behind one `view` switch and weakens type checking per view.

## Implementation status

**Step 1, shared framework: implemented (merged in #330).**

- `src/utils/layered/`: `types`, `buildLayeredIndex`, `predicates` (codes), `filters`, `reach`, `emphasis`, `layout`, `labels` and an `index` barrel.
- `src/hooks/useLayeredGraph.ts`: the hook plus `LayeredGraphContext` / `useLayeredGraphContext`.
- `GraphNodeData.attributes` / `GraphEdge.attributes` and the `GraphAttributeValue` type, all exported from `src/index.ts`.
- `--graph-*` tokens for light and dark canvas in `src/tokens/tokens.css`.
- `scripts/build-layered-fixtures.mjs` generates `src/test-pages/fixtures/layeredGraphFixtures.ts`: the DR spec meta-model (36 / 204) and the heimdall-ux model (48 / 68) as plain `GraphCanvas` data with a `layer` attribute. Test data only.
- `src/utils/__tests__/layered.test.ts`: 20 tests. They reproduce the prototype's reach counts (ApplicationComponent: 10 / 13 / 14 nodes at follow 0 / 1 / 2).
- Documented in `agent-skills/heimdall-graph/SKILL.md` ("Layered graph framework", "LayeredGraphContext"); `check:skills` passes.

**Not in step 1, deferred to the views:**

- `placeEdgeLabels` (step 3).
- The camera, tween and label-overlay helpers (step 4).
- Async layout for large graphs: `layoutLayers` is synchronous and fast at fixture scale.

**Step 2, `AdjacencyMatrix`: implemented (merged in #330).**

- `src/components/AdjacencyMatrix.tsx` / `.css`, exported from `src/index.ts`.
- **Data:** reads state from a `graph` prop, the `LayeredGraphContext`, or its own `useLayeredGraph` (standalone `nodes` / `edges` / `layering`).
- **Drawing:**
  - layer blocks with cross-layer counts
  - layer colour strips on the headers, and rotated column labels sized to the longest label
  - category-coloured cells, with the amber hop ramp around the selection
  - predicate codes per `predicateLabels`, plus a code legend
  - selection and hover crosshair bands
- **Interaction:** row headers are focusable buttons (Enter or Space selects, selecting again clears). A cell click selects the source, or calls `onLinkSelect`.
- **Test page:** `?example=adjacency-matrix`. URL params `data`, `select`, `follow`, `labels` and `dark` make it deterministic.
- **Spec:** `tests/adjacency-matrix.spec.ts` (4 behaviour tests, 2 screenshots). Darwin baselines are generated (not yet committed); **linux baselines are still to generate** with the Update Visual Snapshots workflow after pushing.
- **Docs:** documented in the `heimdall-graph` skill. The docs-app showcase waits for step 6, alongside the other views.
- **Not yet:** `symmetric` and `aggregate` modes, `onCellSelect` link inspection through `GraphEdgeInspector`, and virtualization past about 150 nodes.

**Steps 3–6: implemented.**

- **Step 3:** `placeEdgeLabels` and the sampled curve builders (`lineCurve`, `quadCurve`, `cubicCurve`) in `src/utils/layered/edgeLabels.ts`. Lanes is `GraphCanvas layout="layer-lanes"` (`src/utils/laneLayout.ts`), with `layeredGraph`, `layering`, `layeredGraphOptions` and `laneOptions` props; horizontal and vertical orientation.
- **Step 4:** `LayerStack` on SVG projection (`src/utils/layered/projection.ts`, `src/hooks/useTween.ts`): presets, orbit, wheel zoom, turntable, layer gap, layer focus, plane-layout tween, drill-through column, a side title rail in top view and a common plane extent, plus an imperative handle.
- **Step 5:** `HivePlot` with split axes (`src/utils/layered/hive.ts`).
- **Step 6:** `FollowControl`, `PredicateLabelControl`, `PlaneLayoutControl`, `LinkCategoryFilter`, `LayerList`, `LayerPairList`, `BridgeNodeList`, `ReachInspector`; `LayeredGraphExplorer` with `ViewSwitcher`, `CameraControls` and a `controls` prop that switches each piece of chrome on or off; a "Layered graphs" docs page. `GraphInspector`'s `RelationshipLink` gained optional `hop`, `via` and `layer`.
- **Tests:** unit tests for label placement, lanes, projection and hive geometry; a Playwright spec per view and for the chrome and the explorer, with darwin and linux baselines.
- **`ReachInspector` tests (#338):** `src/components/__tests__/ReachInspector.test.ts` covers `reachRelationships` (cross and intra rows, followed nodes with `via`, filters, bundled predicates, ordering), `reachSummaryText`, and the error thrown without a `graph` prop or provider.

**Not yet:**

- Lanes (#334): `skipLayerRouting: 'gutter'`, bundled intra-layer links, a node-label mode, Up/Down focus between lanes.
- Stack (#335): pinch zoom, label occlusion behind planes, and per-frame rendering past fixture size (the full DR spec is untested).
- Hive (#337): the generic `axes` option (axis by any attribute).
- Matrix (#336): `symmetric` and `aggregate` modes, link inspection, virtualization.
- Framework (#338, #339): shared `nodeLabels` state in `useLayeredGraph`, a view and camera snapshot for the explorer, a shell variant of `SegmentedControl` (the explorer remaps canvas tokens to shell tokens on its header and status line).
