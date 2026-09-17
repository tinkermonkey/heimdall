# /refine-component-skills

Create and update the Heimdall consumer skill library at `agent-skills/`. These skills are distributed with the design system package and auto-discovered by Claude Code agents building applications with `@tinkermonkey/heimdall-ui`.

**Usage:** `/refine-component-skills`
**No arguments.**

---

## Your Task

Produce (or update) 11 category-level skill files in `agent-skills/` at the repo root. Each file is a self-contained reference guide for a group of related Heimdall components — copy-paste ready, with full prop tables, usage examples, and gotchas.

Process categories **one at a time** via sub-agents and write the file after each category completes, so partial runs are recoverable. The target audience for these skills is a coding agent building a consumer application — not a design system contributor.

**How consumers use these skills:** The `agent-skills/` directory is distributed as part of the `@tinkermonkey/heimdall-ui` package. Consumer projects add it to their `.claude/skills/` by symlinking or copying — see the package README for setup instructions. Each `SKILL.md` file's `name` frontmatter field (`heimdall-primitives`, `heimdall-charts`, etc.) becomes the slash command name the agent uses to load it.

---

## Category Definitions

| Category slug            | Skill file                                     | Components                                                                                                                                |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `heimdall-primitives`    | `agent-skills/heimdall-primitives/SKILL.md`    | Icon, Button, Chip, Badge, StatusBadge, VersionPill, SegmentedControl                                                                     |
| `heimdall-inputs`        | `agent-skills/heimdall-inputs/SKILL.md`        | TextInput, TextArea, NumberInput, Select, TriState, Field, FilterDropdown, EntityPicker, KeyValueEditor, OrderedList, RelationshipBuilder |
| `heimdall-data-display`  | `agent-skills/heimdall-data-display/SKILL.md`  | StatTile, StatGrid, Table, KVGrid, InspectorPanel                                                                                         |
| `heimdall-navigation`    | `agent-skills/heimdall-navigation/SKILL.md`    | NavItem, Sidebar, Topbar, TabBar                                                                                                          |
| `heimdall-shell`         | `agent-skills/heimdall-shell/SKILL.md`         | AppTitle, Titlebar, Statusbar, ShellLayout                                                                                                |
| `heimdall-overlays`      | `agent-skills/heimdall-overlays/SKILL.md`      | Modal, ConfirmDialog, Toast, CommandPalette, WorkspaceSwitcherDialog, Drawer                                                              |
| `heimdall-layout`        | `agent-skills/heimdall-layout/SKILL.md`        | Panel, SplitPane                                                                                                                          |
| `heimdall-charts`        | `agent-skills/heimdall-charts/SKILL.md`        | Sparkline, LineChart, BarChart, BarV, BarH, StackedBar, Donut, PieChart, Heatmap, StatusTimeline, ProgressBar, MetricRow                  |
| `heimdall-page-patterns` | `agent-skills/heimdall-page-patterns/SKILL.md` | PageHeader, FilterBar, ActivityTimeline, AlertStrip, QuickAccessGrid, QuickAccessTile, ConfigTile, PipelineCard, FormCallout, RowMenu     |
| `heimdall-chat`          | `agent-skills/heimdall-chat/SKILL.md`          | ChatMessage, ToolBlock, ThinkingBlock, ChatDivider, ChatSuggestions, ChatComposer, ChatContainer                                          |
| `heimdall-graph`         | `agent-skills/heimdall-graph/SKILL.md`         | GraphCanvas, GraphNode, GraphEdge, GraphInspector, TopologyNode, HierarchyRow, HierarchyTree                                              |

---

## Processing Instructions Per Category

For each category:

### Step 1: Research (spawn an Explore agent)

Instruct the Explore agent to:

- Read `src/components/<ComponentName>.tsx` for every component in this category
- Read the corresponding sections in `docs/src/showcases/` that demonstrate these components
- Report back: full props interface, default values, subcomponents/compound patterns, and any usage examples from the showcase

### Step 2: Write the SKILL.md

Create or overwrite `agent-skills/heimdall-<slug>/SKILL.md` with this exact structure:

```markdown
---
name: heimdall-<slug>
description: Heimdall component guide for <Category>: <comma-separated component list>
---

Import all components from `@tinkermonkey/heimdall-ui`. Import the CSS once at your app entry point:

\`\`\`tsx
import '@tinkermonkey/heimdall-ui/css'
\`\`\`

<one section per component, using the template below>
```

### Component Section Template

For each component in the category, write a section with this structure:

```markdown
## ComponentName

One sentence describing what this component is for and when to use it.

\`\`\`tsx
import { ComponentName } from '@tinkermonkey/heimdall-ui'
\`\`\`

### Props

| Prop     | Type | Default | Description      |
| -------- | ---- | ------- | ---------------- |
| propName | type | default | What it controls |

### Usage

\`\`\`tsx
// Minimal working example
<ComponentName
  requiredProp="value"
  optionalProp={handler}
/>
\`\`\`

\`\`\`tsx
// Full-featured example showing key capabilities
<ComponentName
...
/>
\`\`\`

### Compound Subcomponents

(Only include this section if the component uses a compound pattern)

- `ComponentName.Sub` — what it does

### Gotchas

- Bullet list of common mistakes or non-obvious behaviors
```

---

## Quality Rules for Generated Content

- **Props table must be complete** — every prop from the TypeScript interface, with accurate types and defaults. Do not omit props.
- **Usage examples must be copy-paste ready** — valid TypeScript/JSX that compiles without modification (aside from replacing placeholder data)
- **No made-up props** — only document props that actually exist in the source
- **Defaults from source** — copy defaults directly from the component source, not from memory
- **Gotchas from source** — identify real gotchas by reading the code (e.g., "FilterDropdown uses a compound pattern — you must include `<FilterDropdown.Trigger>` and `<FilterDropdown.Panel>` as children"), not generic advice
- **Audience is a consumer app developer** — explain how to use the component, not how it's implemented internally
- **Concise** — prop descriptions should be ≤10 words; usage examples should show the minimal viable usage first, then the rich example

---

## Output After All Categories

When all 11 files are written:

```
## /refine-component-skills — Complete

Generated or updated 11 skill files in agent-skills/:

| File | Components | Lines |
|------|-----------|-------|
| heimdall-primitives/SKILL.md | 7 | ~N |
| ... | ... | ... |

Consumer agents load these skills via the `name` field in each SKILL.md frontmatter (e.g., `heimdall-primitives`). Consumer projects must symlink or copy `agent-skills/` into their `.claude/skills/` directory for auto-discovery to work.
```
