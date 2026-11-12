# Open-issue decisions (2026-11-09)

Decisions taken before work starts on the open issues. Each fix PR follows these; a reviewer should treat a departure as a blocking finding unless the PR explains why.

## #288 Galaxy: lopsided many-satellite systems

**Decision: accept the trade-off and relax the gate.** No layout change.

- Even orbits (vision item 3) win over round systems (vision item 5) for parents with many satellites or one dominant branch.
- Document the trade-off in the Galaxy docs and in `galaxyLayout.ts` next to `SLOT_EVENNESS_BAND`.
- Relax the `systems-round` gate for these systems in heimdall-layout-loop (tinkermonkey/heimdall-layout-loop#5). The exact threshold is set there, using the measurements in #288 (Rodentia root 8.1:1, Vespertilionidae 5.6:1).

## #343 npm package size

| Question | Decision | Why |
|---|---|---|
| Ship `src/`? | **No.** `files` becomes `["dist", "agent-skills"]`. | Nothing loads it: there are no source maps, and the agent skills only mention `src/` paths as text. This also drops test pages, fixtures, `__tests__` and the duplicate `src/fonts/`. |
| `dist/index.cjs` | **Remove the CJS build.** | The package is `"type": "module"` and `exports` has no `require` condition, so nothing resolves to it. |
| `d3-delaunay`, `d3-hierarchy`, `react-markdown`, `remark-gfm` | **Externalize all four** in `vite.config`, and keep them in `dependencies`. | Consumers dedupe with their own copies, and the ESM bundle shrinks. |
| `agent-skills/` | **Keep shipping it.** | Agents in consumer repos read the skills from `node_modules`. |

Also from the issue: add `"sideEffects": ["**/*.css"]`, and record packed size, unpacked size and ESM bundle size before and after in the PR. The agent skills must not tell readers to open `node_modules/.../src`.

## #328 Dropdown panels clipped by scroll containers

**Decision: the portal is on by default.** `portal={false}` keeps today's in-place rendering.

- This applies to every `.dropdown-panel` user: `RowMenu`, `FilterDropdown`, `Select`, `EntityPicker`.
- The panel is positioned from the trigger's rect (`position: fixed`), flips when there's no room, repositions or closes on scroll, and keeps focus management and keyboard navigation.
- Note the behaviour change in the release notes (it affects CSS that targets the panel by DOM position).

## #337 HivePlot: hiding a layer

**Decision: keep angles stable.** A hidden layer leaves a gap and the other axes don't move.

## PR size for #334–#338

**Decision: one PR per issue, split a PR once it passes about 600 changed lines,** so each review stays focused.

## #379 LayerStack: per-frame style recalc on the full spec

**Decision: batched SVG link paths, not a canvas.** Links off the selection's reach are drawn as one `<path>` per style bucket (colour, opacity, width, dash and z, the emphasis draw order), painted in `paint()`; the reach keeps a path per link.

- Overlap compounding within a bucket is accepted: links of one style no longer darken each other where they cross, a visible change in dense areas.
- A consequence of batching: within one z level, overlapping links of different styles are ordered by their buckets' mean depth, not link by link.
- A consequence of batching: stroke widths (scaled by perspective) are rounded to 0.1 scene units, so links of similar width share a bucket.
