import { PropsTable, PropRow, TableFrame, TypeText } from '../../components/ShowcaseSection'

const fg2 = 'rgb(var(--canvas-fg-2, 75 85 99))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const border = 'rgb(var(--canvas-border, 229 231 235))'
const mono = 'var(--font-mono, "JetBrains Mono", monospace)'

// ─── Generic name / signature / description table ──────────────────────────

interface Entry {
  name: string
  signature: string
  description: string
}

function EntryTable({ entries, columns }: { entries: Entry[]; columns: [string, string, string] }) {
  const cell = { padding: '7px 10px' } as const
  return (
    <TableFrame>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgb(var(--canvas-bg-2, 243 244 246))' }}>
            {columns.map((h, i) => (
              <th key={h} style={{ ...cell, textAlign: 'left', fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, fontWeight: 500, whiteSpace: 'nowrap', minWidth: i === 2 ? 160 : 'auto' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ borderTop: `1px solid ${border}` }}>
          {entries.map((m) => (
            <tr key={m.name}>
              <td style={{ ...cell, fontFamily: mono, fontSize: 12, color: 'rgb(var(--accent-cyan-deep, 14 126 163))', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{m.name}</td>
              <td style={{ ...cell, fontFamily: mono, fontSize: 11, color: fg3, verticalAlign: 'top' }}><TypeText>{m.signature}</TypeText></td>
              <td style={{ ...cell, fontSize: 12, color: fg2, verticalAlign: 'top', overflowWrap: 'anywhere' }}>{m.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableFrame>
  )
}

// ─── LayeredGraphExplorer ──────────────────────────────────────────────────

/** Every `LayeredGraphExplorerProps` prop, in source order. */
export function ExplorerPropsTable() {
  return (
    <PropsTable>
      <PropRow name="graph" type="LayeredGraphState" def="context" description="External state from useLayeredGraph. Unset: the enclosing LayeredGraphContext, else the explorer builds its own from nodes, edges and layering." />
      <PropRow name="nodes" type="GraphNodeData[]" description="Standalone nodes; ignored with graph or a context. Also passed to the lanes canvas, whose links copy their first source edge's fields from edges." />
      <PropRow name="edges" type="GraphEdge[]" description="Standalone edges; ignored with graph or a context. Also passed to the lanes canvas." />
      <PropRow name="layering" type="BuildLayeredIndexOptions" description="Standalone layering (layerBy, layers, linkCategoryBy, …). Memoize it: a new object rebuilds the index." />
      <PropRow name="graphOptions" type="Omit<UseLayeredGraphOptions, …>" description="useLayeredGraph options without nodes, edges and layering: standalone selection, follow, filters, label mode, focus and plane layout, controlled or default. A defaultSnapshot overrides its default… fields." />
      <PropRow name="views" type="readonly LayeredGraphView[]" def="all four" description="Views offered, in switcher order: 'stack' | 'lanes' | 'matrix' | 'hive' (LAYERED_GRAPH_VIEWS). One view hides the switcher; an empty list means all four." />
      <PropRow name="viewLabels" type="Partial<Record<LayeredGraphView, ReactNode>>" description="Switcher text per view. Default 3D stack, Lanes, Matrix, Hive (LAYERED_GRAPH_VIEW_LABELS)." />
      <PropRow name="view" type="LayeredGraphView" description="Controlled view. A view not in views falls back to the first." />
      <PropRow name="defaultView" type="LayeredGraphView" def="first of views" description="Initial view when uncontrolled. A defaultSnapshot view wins over it." />
      <PropRow name="onViewChange" type="(view: LayeredGraphView) => void" description="Called by the switcher and by a restore that changes the view." />
      <PropRow name="explorerRef" type="Ref<LayeredGraphExplorerHandle>" description="Imperative handle: getSnapshot(), restore(snapshot), stack(). See the snapshot section below. ref is the root element." />
      <PropRow name="defaultSnapshot" type="LayeredGraphExplorerSnapshotInput" description="Initial state, such as a snapshot parsed from the URL. Read once, on mount, and sanitized first: malformed fields are dropped. Seeds the view, node labels, 3D camera and the explorer's own graph state. With a graph prop or a context, seed that state yourself (layeredGraphSnapshotDefaults); the rest still applies." />
      <PropRow name="onSnapshotChange" type="(snapshot: LayeredGraphExplorerSnapshot) => void" description="Called when the snapshot changes, not on mount. A camera move reports once it settles; a picked preset reports once, already settled." />
      <PropRow name="controls" type="LayeredGraphExplorerControls" def="all on" description="Which chrome renders; every field defaults to true. See the controls table below." />
      <PropRow name="followOptions" type="readonly number[]" def="[0, 1, 2]" description="Follow depths offered by FollowControl." />
      <PropRow name="title" type="ReactNode" description="Heading in the header." />
      <PropRow name="eyebrow" type="ReactNode" description="Mono eyebrow above the title." />
      <PropRow name="statusLabel" type="ReactNode" description="Dataset label at the start of the status line." />
      <PropRow name="chromeSurface" type="'shell' | 'canvas'" def="'shell'" description="Header and status line on the shell surface or the canvas. On shell the header's ViewSwitcher and FollowControl get surface='shell'." />
      <PropRow name="nodeLabels" type="boolean" def="graph state" description="Node labels on or off (controlled), over the graph's nodeLabels. On: the stack and lanes label every node and the hive labels the busiest node per axis. Off: the stack and lanes label only the selection, its reach and the hovered node, and the hive drops its axis labels." />
      <PropRow name="defaultNodeLabels" type="boolean" def="true" description="Initial node labels. Seeds the explorer's own graph state; with a graph prop or a context the explorer keeps it apart from that state." />
      <PropRow name="onNodeLabelsChange" type="(on: boolean) => void" description="Called by the node-label toggle in the link bar." />
      <PropRow name="stackProps" type="Omit<LayerStackProps, …>" description="Passed to LayerStack, without graph, nodes, edges, layering and graphOptions. Its preset, camera, gap and turntable values seed the remembered camera; after that the explorer owns cameraPreset, defaultCamera, defaultLayerGap and turntable. Camera, preset, gap and turntable callbacks are chained; className is merged; nodeLabels overrides the toggle." />
      <PropRow name="lanesProps" type="Partial<Omit<GraphCanvasProps, …>>" description="Passed to the lanes GraphCanvas, without layout, layeredGraph, layering and layeredGraphOptions. laneOptions is merged over the label toggle's nodeLabels, and style over the default size (full width, 560px tall; with height set on a wide explorer, the scene's height). A laneOptions.nodeLabels or a renderNode hides the toggle on lanes." />
      <PropRow name="matrixProps" type="Omit<AdjacencyMatrixProps, …>" description="Passed to AdjacencyMatrix, without the five data props above. An onCellSelect (or the deprecated onLinkSelect) replaces the link panel; see Matrix link panel." />
      <PropRow name="hiveProps" type="Omit<HivePlotProps, …>" description="Passed to HivePlot, without the five data props above. axisLabels defaults to 1 with node labels on, 0 with them off." />
      <PropRow name="height" type="number | string" description="Fixed height (px or a CSS length): the scene fills what the chrome leaves and the panels scroll. Unset: the explorer grows with its content." />
      <PropRow name="stackBelow" type="number" def="960" description="Below this width in px the inspector panel stacks under the scene." />
      <PropRow name="asideWidth" type="number" def="340" description="Width of the inspector panel in px." />
      <PropRow name="ref" type="Ref<HTMLDivElement>" description="The root element." />
      <PropRow name="…div props" type="HTMLAttributes<HTMLDivElement>" description="Spread on the root (className, style, aria-label, data-*). onSelect and title are omitted; title is the heading prop above." />
    </PropsTable>
  )
}

/** Every `LayeredGraphExplorerControls` field. */
export function ExplorerControlsTable() {
  return (
    <PropsTable>
      <PropRow name="viewSwitcher" type="boolean" def="true" description="The view switcher in the header. Always hidden with a single view." />
      <PropRow name="follow" type="boolean" def="true" description="FollowControl in the header." />
      <PropRow name="predicateLabels" type="boolean" def="true" description="PredicateLabelControl in the link bar. With linkFilter off it shows in a bar of its own." />
      <PropRow name="linkFilter" type="boolean" def="true" description="The link bar (LinkCategoryFilter). Off also hides the node-label toggle in it." />
      <PropRow name="nodeLabels" type="boolean" def="true" description="Node-label toggle in the link bar: stack, hive, and lanes unless lanesProps fixes laneOptions.nodeLabels or passes renderNode." />
      <PropRow name="camera" type="boolean" def="true" description="CameraControls above the 3D stack: presets, zoom out and in, turntable." />
      <PropRow name="planeLayout" type="boolean" def="true" description="PlaneLayoutControl above the 3D stack." />
      <PropRow name="inspector" type="boolean" def="true" description="ReachInspector in the side panel, and the matrix link panel. Off: a matrix cell click selects the link's source node." />
      <PropRow name="layers" type="boolean" def="true" description="LayerList in the side panel with no selection." />
      <PropRow name="layerPairs" type="boolean" def="true" description="LayerPairList in the side panel with no selection." />
      <PropRow name="bridgeNodes" type="boolean" def="true" description="BridgeNodeList in the side panel with no selection." />
      <PropRow name="status" type="boolean" def="true" description="The mono status line: statusLabel, counts, view and follow, and on the stack the camera." />
    </PropsTable>
  )
}

const EXPLORER_HANDLE: Entry[] = [
  { name: 'getSnapshot', signature: '() => LayeredGraphExplorerSnapshot', description: 'The snapshot as it is now. On the stack view with a hand-moved camera, the camera and gap are read live (mid-tween included); with a preset active, the preset\'s own camera and gap.' },
  { name: 'restore', signature: '(snapshot: LayeredGraphExplorerSnapshotInput) => void', description: 'Applies the fields given, sanitized first (malformed ones are dropped); the rest stay. A changed stack camera jumps without a tween, stops the turntable and remounts the stack, so read stack() again afterwards. An unchanged one leaves the stack alone.' },
  { name: 'stack', signature: '() => LayerStackHandle | null', description: 'The 3D stack\'s handle while the stack view shows, else null.' },
]

/** `LayeredGraphExplorerHandle` methods. */
export function ExplorerHandleTable() {
  return <EntryTable entries={EXPLORER_HANDLE} columns={['Method', 'Signature', 'Description']} />
}

const SNAPSHOT_TYPES: Entry[] = [
  { name: 'LayeredGraphExplorerSnapshot', signature: 'LayeredGraphSnapshot & { view, nodeLabels, stack }', description: 'The whole explorer as plain JSON: the graph state plus the view, node labels and the 3D camera (kept while another view shows).' },
  { name: 'LayeredGraphExplorerCamera', signature: '{ preset, camera, layerGap }', description: 'The stack\'s camera: preset (CameraPresetName | null, null once moved by hand), camera ({ yaw, pitch, zoom, targetY }) and layerGap in world units.' },
  { name: 'LayeredGraphExplorerSnapshotInput', signature: 'Partial<…> & { stack?: Partial<…> }', description: 'A snapshot to restore or seed from: any field may be left out, stack fields included.' },
  { name: 'LayeredGraphSnapshot', signature: '{ selectedId, selectedIds?, follow, filters, … }', description: 'The graph fields, useLayeredGraph\'s snapshot: selectedId, selectedIds, follow, filters, predicateLabels, focusedLayerId, planeLayout and nodeLabels. useLayeredGraph always sets selectedIds and nodeLabels.' },
]

/** Snapshot types. */
export function SnapshotTypesTable() {
  return <EntryTable entries={SNAPSHOT_TYPES} columns={['Type', 'Shape', 'Description']} />
}

const SNAPSHOT_HELPERS: Entry[] = [
  { name: 'sanitizeLayeredGraphExplorerSnapshot', signature: '(input: unknown, views?) => LayeredGraphExplorerSnapshotInput', description: 'An untrusted explorer snapshot reduced to well-formed fields: the graph fields as below, view among views, nodeLabels a boolean, preset a known name or null, camera fields finite numbers, layerGap finite, positive and at most 5000. defaultSnapshot and restore run their input through it.' },
  { name: 'sanitizeLayeredGraphSnapshot', signature: '(input: unknown) => LayeredGraphSnapshotFields', description: 'The graph fields of an untrusted snapshot, each checked for type and range; malformed ones are dropped. A partial filters object is merged onto DEFAULT_LINK_FILTERS. useLayeredGraph\'s own restore does not check its input: pass URL input through this first.' },
  { name: 'layeredGraphSnapshotDefaults', signature: '(snapshot) => Partial<UseLayeredGraphOptions>', description: 'Turns snapshot fields into useLayeredGraph default… options (selectedId → defaultSelectedId, …), sanitized. Use it to seed external state: useLayeredGraph({ nodes, edges, layering, ...layeredGraphSnapshotDefaults(saved) }).' },
]

/** Snapshot sanitizers and seeding helpers. */
export function SnapshotHelpersTable() {
  return <EntryTable entries={SNAPSHOT_HELPERS} columns={['Function', 'Signature', 'Description']} />
}

// ─── useLayeredGraph ───────────────────────────────────────────────────────

/** Every `UseLayeredGraphOptions` field, in source order. */
export function UseLayeredGraphOptionsTable() {
  return (
    <PropsTable>
      <PropRow name="nodes" type="readonly GraphNodeData[]" required description="The same node data GraphCanvas takes." />
      <PropRow name="edges" type="readonly GraphEdge[]" required description="The same edge data GraphCanvas takes." />
      <PropRow name="layering" type="BuildLayeredIndexOptions" required description="layerBy (required), multiValue, missingValue, layers, linkCategoryBy, categoryOrder, … Memoize it: a new object rebuilds the index." />
      <PropRow name="layout" type="LayerLayoutOptions | false" def="{}" description="In-layer layout options (engine, layoutCategories, nodeSize, organic), or false to skip layout for views that need no positions. Memoize it." />
      <PropRow name="asyncLayoutMinNodes" type="number | false" def="false" description="Opt-in asynchronous layout (layoutLayersAsync) from this many nodes; ASYNC_LAYOUT_MIN_NODES (200) is the recommended value, 0 means always. Default false: synchronous. See Async layout." />
      <PropRow name="selectedId" type="string | null" description="The selected node instance (controlled): the single-select path. Controlling only selectedId keeps the selection to one node. With several selected, it is the primary." />
      <PropRow name="defaultSelectedId" type="string | null" description="Initial selection when uncontrolled." />
      <PropRow name="onSelect" type="(id: string | null) => void" description="Called with the primary selection on every select and restore. Other selection and filter actions call it when they change the visible primary. A parent changing a controlled filters or selectedIds prop is not reported back." />
      <PropRow name="selectedIds" type="readonly string[]" description="Multi-select (controlled): every selected node instance, primary first. Takes precedence over selectedId. Reach is the union of each node's reach." />
      <PropRow name="defaultSelectedIds" type="readonly string[]" description="Initial multi-selection when uncontrolled. Wins over defaultSelectedId." />
      <PropRow name="onSelectedIdsChange" type="(ids: string[]) => void" description="Called with the new ids on every selection write (select, setSelectedIds, toggleSelected, restore, a hidden layer dropping ids)." />
      <PropRow name="follow" type="number" description="Followed hops past the direct links (controlled)." />
      <PropRow name="defaultFollow" type="number" def="1" description="Initial follow depth." />
      <PropRow name="onFollowChange" type="(follow: number) => void" description="Follow depth changed." />
      <PropRow name="followCategories" type="readonly string[] | null" def="any" description="Follow only links in these categories past the direct links; direct links are unaffected. Compared by content, so an inline array is safe: it does not recompute reach every render." />
      <PropRow name="filters" type="LinkFilterState" description="Controlled filters: hiddenLayers, categories, hiddenPredicates, showIntra, layerPair." />
      <PropRow name="defaultFilters" type="LinkFilterState" def="DEFAULT_LINK_FILTERS" description="Initial filters; the default hides nothing." />
      <PropRow name="onFiltersChange" type="(filters: LinkFilterState) => void" description="Filters changed by any filter action." />
      <PropRow name="predicateLabels" type="'off' | 'highlighted' | 'all'" description="Predicate pill mode (controlled)." />
      <PropRow name="defaultPredicateLabels" type="PredicateLabelMode" def="'highlighted'" description="Initial predicate pill mode." />
      <PropRow name="onPredicateLabelsChange" type="(mode: PredicateLabelMode) => void" description="Predicate pill mode changed." />
      <PropRow name="focusedLayerId" type="string | null" description="Focused layer (controlled)." />
      <PropRow name="defaultFocusedLayerId" type="string | null" def="null" description="Initial focused layer." />
      <PropRow name="onFocusLayer" type="(layerId: string | null) => void" description="Layer focus changed." />
      <PropRow name="planeLayout" type="'independent' | 'coupled'" description="Which in-layer layout the views show (controlled)." />
      <PropRow name="defaultPlaneLayout" type="PlaneLayoutMode" def="'independent'" description="Initial plane layout." />
      <PropRow name="onPlaneLayoutChange" type="(mode: PlaneLayoutMode) => void" description="Plane layout changed." />
      <PropRow name="nodeLabels" type="boolean" description="Node labels on or off (controlled), shared by every view and the label toggle in LinkCategoryFilter." />
      <PropRow name="defaultNodeLabels" type="boolean" def="true" description="Initial node labels." />
      <PropRow name="onNodeLabelsChange" type="(on: boolean) => void" description="Node labels toggled." />
      <PropRow name="linkStyles" type="Record<string, LinkCategoryStyle>" description="Per-category color and dash overrides for linkEmphasis; others use the --graph-link-* ramp. Memoize it: a new object recomputes every link's emphasis." />
    </PropsTable>
  )
}

const STATE_VALUES: Entry[] = [
  { name: 'index', signature: 'LayeredIndex', description: 'Layers, node instances, bundled links, lookups, layer pairs, categories, predicate codes and issues.' },
  { name: 'layout', signature: 'LayerLayoutResult | null', description: 'In-layer positions (independent and coupled). null with layout: false, and until the first asynchronous layout lands; then the last landed one while a newer run is pending.' },
  { name: 'layoutPending', signature: 'boolean', description: 'True while an asynchronous layout runs.' },
  { name: 'reach', signature: 'ReachResult', description: 'The selection\'s reach at the current follow depth: hop per node and link, via, maxHop.' },
  { name: 'hoverReach', signature: 'ReachResult', description: 'The hovered node\'s direct links only (follow 0), for cheap hover previews.' },
  { name: 'pairNodeIds', signature: 'ReadonlySet<string>', description: 'Nodes at either end of the cross-layer links of the filtered layer pair; empty with no pair.' },
  { name: 'selectedId', signature: 'string | null', description: 'The primary selection: the first of selectedIds, or null.' },
  { name: 'selectedIds', signature: 'readonly string[]', description: 'Every selected node instance, primary first. Nodes missing from the graph or on a hidden layer are left out.' },
  { name: 'hoveredId', signature: 'string | null', description: 'The hovered node.' },
  { name: 'follow', signature: 'number', description: 'Follow depth.' },
  { name: 'filters', signature: 'LinkFilterState', description: 'Current filters.' },
  { name: 'predicateLabels', signature: 'PredicateLabelMode', description: 'Predicate pill mode.' },
  { name: 'focusedLayerId', signature: 'string | null', description: 'Focused layer.' },
  { name: 'planeLayout', signature: 'PlaneLayoutMode', description: 'Plane layout.' },
  { name: 'nodeLabels', signature: 'boolean', description: 'Node labels on or off.' },
  { name: 'emphasisContext', signature: 'EmphasisContext', description: 'What linkEmphasis and nodeEmphasis read, for custom views.' },
  { name: 'linkEmphasis', signature: '(link: IndexedLink) => LinkEmphasis', description: 'visible, hop, color, dash, width, opacity, arrow and label for a link under the current state.' },
  { name: 'nodeEmphasis', signature: '(node: IndexedNode) => NodeEmphasis', description: 'hop, selected, followed, opacity and tint for a node under the current state.' },
  { name: 'snapshot', signature: 'LayeredGraphSnapshot', description: 'The state as plain JSON, selectedIds and nodeLabels included.' },
]

/** The values `useLayeredGraph` returns. */
export function LayeredGraphStateTable() {
  return <EntryTable entries={STATE_VALUES} columns={['Field', 'Type', 'Description']} />
}

const STATE_ACTIONS: Entry[] = [
  { name: 'select', signature: '(id: string | null) => void', description: 'Selects one node (null clears), replacing any multi-selection. Always calls onSelect.' },
  { name: 'setSelectedIds', signature: '(ids: readonly string[]) => void', description: 'Replaces the selection with these nodes, primary first; duplicates dropped.' },
  { name: 'toggleSelected', signature: '(id: string) => void', description: 'Adds a node to the end of the selection, or removes it if selected.' },
  { name: 'hover', signature: '(id: string | null) => void', description: 'Sets the hovered node.' },
  { name: 'setFollow', signature: '(follow: number) => void', description: 'Sets the follow depth, floored and at least 0.' },
  { name: 'setFilters', signature: '(filters: LinkFilterState) => void', description: 'Replaces the filters. Composes with the other actions called in the same handler.' },
  { name: 'toggleCategory', signature: '(category: string) => void', description: 'Shows or hides a link category.' },
  { name: 'togglePredicate', signature: '(predicate: string) => void', description: 'Shows or hides one predicate.' },
  { name: 'toggleLayer', signature: '(layerId: string) => void', description: 'Hides or shows a layer. Hiding drops the selected nodes on it, and exits focus if it is the focused layer.' },
  { name: 'setShowIntra', signature: '(show: boolean) => void', description: 'Shows or hides links within a layer.' },
  { name: 'setLayerPair', signature: '(pairKey: string | null) => void', description: 'Shows only cross-layer links of one layer pair; pass the current pair, or null, to clear.' },
  { name: 'setPredicateLabels', signature: '(mode: PredicateLabelMode) => void', description: 'Sets the predicate pill mode.' },
  { name: 'focusLayer', signature: '(layerId: string | null) => void', description: 'Focuses a layer; null exits.' },
  { name: 'setPlaneLayout', signature: '(mode: PlaneLayoutMode) => void', description: 'Sets the plane layout.' },
  { name: 'setNodeLabels', signature: '(on: boolean) => void', description: 'Turns node labels on or off for every view.' },
  { name: 'restore', signature: '(snapshot: Partial<LayeredGraphSnapshot>) => void', description: 'Applies the fields given; the rest stay. Filters first, then whichever of selectedId or selectedIds changed (selectedId wins if both changed and disagree), and always calls onSelect. Does not check its input: sanitize URL input first.' },
]

/** The actions `useLayeredGraph` returns. */
export function LayeredGraphActionsTable() {
  return <EntryTable entries={STATE_ACTIONS} columns={['Action', 'Signature', 'Description']} />
}

const LAYERED_EXPORTS: Entry[] = [
  { name: 'LayeredGraphContext', signature: 'Context<LayeredGraphState | null>', description: 'Shares one useLayeredGraph result with every view and control below it. Views and controls read a graph prop first, then this context.' },
  { name: 'useLayeredGraphContext', signature: '() => LayeredGraphState', description: 'The enclosing context value, for custom views and chrome. Throws outside a provider.' },
  { name: 'ASYNC_LAYOUT_MIN_NODES', signature: '200', description: 'The recommended asyncLayoutMinNodes: about 100 ms of solves.' },
  { name: 'layoutLayersAsync', signature: '(index, options?, { signal? }) => Promise<LayerLayoutResult>', description: 'layoutLayers without blocking for the whole run: the same result, one solve at a time (each layer, then the coupled solve) with a paint between. signal aborts between solves; the promise then rejects with an AbortError.' },
  { name: 'useControllable', signature: '(value, defaultValue, onChange) => [current, set]', description: 'The hook\'s value / default… / on…Change pattern, for custom views and chrome. Controlled when value is defined; null counts as a value.' },
]

/** Context and the other exports that go with the hook. */
export function LayeredGraphExportsTable() {
  return <EntryTable entries={LAYERED_EXPORTS} columns={['Export', 'Type', 'Description']} />
}
