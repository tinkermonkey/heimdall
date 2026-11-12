# Heimdall UI Design System

Production component library for the Heimdall design system. Built with React 18, TypeScript, Tailwind CSS, and self-hosted fonts.

**Live component showcase:** https://tinkermonkey.github.io/heimdall/

## Phase 1: Foundation & Core Components

This phase establishes the token system, build infrastructure, and core component library.

### ✅ Completed

- Vite + React 18 + TypeScript + Tailwind CSS build pipeline
- CSS custom property token system (light canvas default mode)
- Cyan accent tokens (brand primary color)
- Self-hosted Inter and JetBrains Mono fonts (local file declarations)
- Tailwind theme extending with CSS variable references
- Playwright testing infrastructure with animation freezing utilities
- Base test utilities for font loading, dark-canvas toggle, and token validation
- 28 UI components across 7 categories (primitives, forms, data display, shell, navigation, dialogs, containers)
- Comprehensive test suite (5 spec files covering foundations, primitives, data display, shell, and overlays)

### Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with UI
npm run test:ui
```

### Agent skills

The package ships `agent-skills/`: Claude Code skills that document every exported component (props with defaults, usage examples, gotchas) for coding agents building on Heimdall. Link them into a consumer project's `.claude/skills/` so they update with the package:

```bash
mkdir -p .claude/skills && for d in node_modules/@tinkermonkey/heimdall-ui/agent-skills/*; do ln -sfn "../../$d" ".claude/skills/$(basename "$d")"; done
```

| Skill | Covers |
| ----- | ------ |
| `heimdall-primitives` | Icon, Avatar, Button, Chip, Badge, StatusBadge, VersionPill, SegmentedControl |
| `heimdall-inputs` | TextInput, TextArea, NumberInput, Select, TriState, Field, FilterDropdown, EntityPicker, KeyValueEditor, OrderedList, RelationshipBuilder |
| `heimdall-data-display` | StatTile, StatGrid, Table, KVGrid, InspectorPanel, ResultCard, AssetCard, AssetGrid, MapCanvas |
| `heimdall-navigation` | NavItem, Sidebar, Topbar, TabBar |
| `heimdall-shell` | AppTitle, Titlebar, Statusbar, ShellLayout |
| `heimdall-overlays` | Modal, ConfirmDialog, Toast, Tooltip, Popover, CommandPalette, WorkspaceSwitcherDialog, Drawer |
| `heimdall-layout` | Panel, SplitPane, `useMediaQuery` |
| `heimdall-charts` | ChartWrapper, Sparkline, LineChart, BarChart, BarV, BarH, StackedBar, Donut, Heatmap, StatusTimeline, ProgressBar, MetricRow |
| `heimdall-page-patterns` | PageHeader, FilterBar, ActivityTimeline, AlertStrip, QuickAccessGrid, QuickAccessTile, ConfigTile, PipelineCard, FormCallout, RowMenu |
| `heimdall-chat` | ChatMessage, ToolBlock, ThinkingBlock, ChatDivider, ChatSuggestions, ChatComposer, ChatContainer, ChatMarkdownContent |
| `heimdall-graph` | GraphCanvas and its parts, the headless layout engines, HierarchyTree, DetailDrawer |
| `heimdall-observability` | TraceViewer (with OTLP and X-Ray adapters), LogStream, DiffViewer, HashSetDiff, SideBySideDiff, VersionTimeline, LineageRail |
| `heimdall-planning` | Calendar, MiniCalendar, KanbanBoard |

`npm run check:skills` fails when an exported component or utility has no skill coverage, or when a props table names a prop the code doesn't have or leaves one out. The category list lives in `.claude/commands/refine-component-skills.md`.

### Project Structure

```
src/
├── components/                # 28 UI components
│   ├── Icon.tsx              # Icon renderer
│   ├── Button.tsx            # Button component
│   ├── Modal.tsx             # Modal dialog
│   └── [24 more components]
├── test-pages/               # Test page implementations
├── tokens/
│   └── tokens.css             # Design tokens as CSS custom properties
├── index.css                  # Main stylesheet (tokens + Tailwind)
├── index.ts                   # Barrel export (28 components)
├── main.tsx                   # Vite entry point
└── App.tsx                    # Root component

public/fonts/                  # Self-hosted fonts, copied to dist/fonts/ by the build
├── fonts.css                  # @font-face declarations ("@tinkermonkey/heimdall-ui/fonts")
├── inter/                     # Inter .woff2 files + OFL.txt
└── jetbrains-mono/            # JetBrains Mono .woff2 files + OFL.txt

tests/
├── foundation.spec.ts         # Token system validation tests
├── primitives.spec.ts         # Primitive components tests
├── data-display.spec.ts       # Data display components tests
├── shell-framework.spec.ts    # Shell framework tests
├── overlay-components.spec.ts # Overlay components tests
├── overlay-advanced.spec.ts   # Advanced overlay tests
└── utils/
    └── test-helpers.ts        # Test utilities

tailwind.config.ts             # Tailwind theme extending CSS variables
playwright.config.ts           # Playwright testing configuration
postcss.config.js              # PostCSS + Tailwind + Autoprefixer
vite.config.ts                 # Vite build configuration
```

### Design Token Reference

#### Two-Surface Architecture

Every screen has exactly two surfaces:

- **Shell**: Always dark (`#0B0F14`)
- **Canvas**: Light default (`#FFFFFF`)

Token variables automatically resolve based on surface context. No component-level conditional rendering needed.

#### Accent Color (Cyan)

```css
--accent-primary:       #22d3ee   /* bright, active states */
--accent-primary-hover: #06b6d4   /* hover state */
--accent-primary-deep:  #0e7ea3   /* deep/CTA */
```

#### Semantic Status Colors

```css
--status-ok:       #22c55e   /* emerald, ok/running */
--status-warn:     #eab308   /* amber, warn/degraded */
--status-error:    #ef4444   /* rose, error/failed */
--status-emerald:  #10b981
--status-amber:    #f59e0b
--status-rose:     #f43f5e
--status-violet:   #8b5cf6
```

### Font Files

Inter (300–900) and JetBrains Mono (400–600) ship with the package as `.woff2` files. Import the stylesheet once at the app entry, next to the main one:

```tsx
import '@tinkermonkey/heimdall-ui/css'
import '@tinkermonkey/heimdall-ui/fonts'
```

Its `url()`s are relative to the stylesheet, so the app's bundler (Vite, webpack) resolves them and emits the font files with the rest of the build. Nothing has to serve `/fonts/`.

In this repo the files live in `public/fonts/`: the dev server serves them at `/fonts/` (the Playwright helpers load them from there) and the build copies the directory to `dist/fonts/`. `npm run setup` refetches them from `@fontsource` if they go missing.

Both fonts are licensed under the SIL Open Font License 1.1. Each font directory carries its licence as `OFL.txt` (`dist/fonts/inter/OFL.txt`, `dist/fonts/jetbrains-mono/OFL.txt`), and the OFL requires it to travel with the font files. An app that redistributes the `.woff2` files outside its bundled build output should ship the licence with them.

### Build Output

The library builds to ES modules with TypeScript types, one module per source file, so an app's
bundler keeps only the components it imports:

```
dist/
├── index.js                 # Public API barrel (re-exports the modules below)
├── index.d.ts               # TypeScript declarations
├── components/Panel.js      # One module per component…
├── components/Panel.css     # …importing its own stylesheet
├── hooks/, utils/           # Shared modules
├── tokens/tokens.css        # Design tokens (imported by index.js)
├── styles/utilities.css     # Shared utility classes (imported by index.js)
└── style.css                # Every stylesheet in one file ("@tinkermonkey/heimdall-ui/css")
```

Importing a component brings its CSS with it, so `import '@tinkermonkey/heimdall-ui/css'` is
optional: it loads every component's styles up front, where the per-module imports load only those
of the components in use. The JS modules import `.css` files, so they need a bundler (Vite,
webpack, Next, Astro) or a test runner that handles CSS imports; plain Node can't import them.

### Testing

Tests validate:

- Light canvas tokens applied by default
- Cyan accent color (brand primary)
- Semantic status colors
- Radius and spacing scale
- Animation freezing for consistent screenshots
- Font loading and dark-canvas class application

Run tests:

```bash
npm test              # Headless mode
npm run test:ui       # Interactive UI
```

## Upcoming Work

Future phases will expand the design system with:

- Advanced layout components
- Data visualization components
- Enhanced accessibility features
- Visual regression testing refinements
- Storybook documentation
