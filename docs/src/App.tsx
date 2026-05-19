import { useState, useEffect } from 'react'
import { ShellLayout, Icon, type IconName } from '@tinkermonkey/heimdall-ui'

import { ColorsShowcase, TypographyShowcase, SpacingShowcase, RadiusShowcase } from './showcases/FoundationShowcase'
import { IconShowcase, ButtonShowcase, ChipShowcase, BadgeShowcase } from './showcases/PrimitivesShowcase'
import { TextInputShowcase, TextAreaShowcase, NumberInputShowcase, SelectShowcase, TriStateShowcase, FieldShowcase } from './showcases/InputsShowcase'
import { StatTileShowcase, StatGridShowcase, TableShowcase } from './showcases/DataDisplayShowcase'
import { NavItemShowcase, SidebarShowcase, TopbarShowcase, TabBarShowcase } from './showcases/NavigationShowcase'
import { AppTitleShowcase, StatusbarShowcase, ShellLayoutShowcase } from './showcases/ShellShowcase'
import { ModalShowcase, ConfirmDialogShowcase, ToastShowcase, CommandPaletteShowcase } from './showcases/OverlaysShowcase'
import { PanelShowcase, DrawerShowcase, SplitPaneShowcase } from './showcases/LayoutShowcase'
import { ChartsOverviewShowcase, SparklineShowcase, LineChartShowcase, BarChartShowcase, PieChartShowcase, ProgressBarShowcase, MetricRowShowcase } from './showcases/ChartsShowcase'
import { PageHeaderShowcase, FilterBarShowcase, ActivityTimelineShowcase, AlertStripShowcase, QuickAccessGridShowcase } from './showcases/PagePatternsShowcase'
import { ChatMessageShowcase, ChatDividerShowcase, ChatSuggestionsShowcase, ChatComposerShowcase, ChatContainerShowcase } from './showcases/ChatShowcase'
import { EntityPickerShowcase, KeyValueEditorShowcase, OrderedListShowcase, RelationshipBuilderShowcase, RowMenuShowcase, PipelineCardShowcase, FormCalloutShowcase } from './showcases/FormsComplexShowcase'
import { GraphCanvasShowcase, GraphInspectorShowcase, TopologyNodeShowcase } from './showcases/GraphShowcase'
import PrimitivesTestPage from '@/test-pages/PrimitivesTestPage'
import DataDisplayTestPage from '@/test-pages/DataDisplayTestPage'
import OverlayComponentsTestPage from '@/test-pages/OverlayComponentsTestPage'
import AdvancedOverlayComponentsTestPage from '@/test-pages/AdvancedOverlayComponentsTestPage'
import FoundationTestPage from '@/test-pages/FoundationTestPage'
import ShellFrameworkTestPage from '@/test-pages/ShellFrameworkTestPage'
import NavigationComponentTestPage from '@/test-pages/NavigationComponentTestPage'
import ChartsTestPage from '@/test-pages/ChartsTestPage'
import ContextStudioRebuilt from '@/examples/ContextStudioRebuilt'
import HomelabDashboardRebuilt from '@/examples/HomelabDashboardRebuilt'

type NavSection = {
  title: string
  items: { id: string; label: string; icon: IconName }[]
}

const SHOWCASE_MAP: Record<string, React.ComponentType> = {
  // Foundation
  colors: ColorsShowcase,
  typography: TypographyShowcase,
  spacing: SpacingShowcase,
  radius: RadiusShowcase,
  foundation: FoundationTestPage,
  // Primitives
  icon: IconShowcase,
  button: ButtonShowcase,
  chip: ChipShowcase,
  badge: BadgeShowcase,
  primitives: PrimitivesTestPage,
  // Inputs
  'text-input': TextInputShowcase,
  'text-area': TextAreaShowcase,
  'number-input': NumberInputShowcase,
  select: SelectShowcase,
  'tri-state': TriStateShowcase,
  field: FieldShowcase,
  // Data Display
  'stat-tile': StatTileShowcase,
  'stat-grid': StatGridShowcase,
  table: TableShowcase,
  'data-display': DataDisplayTestPage,
  // Navigation
  'nav-item': NavItemShowcase,
  sidebar: SidebarShowcase,
  topbar: TopbarShowcase,
  'tab-bar': TabBarShowcase,
  navigation: NavigationComponentTestPage,
  // Shell
  'app-title': AppTitleShowcase,
  statusbar: StatusbarShowcase,
  'shell-layout': ShellLayoutShowcase,
  shell: ShellFrameworkTestPage,
  // Overlays
  modal: ModalShowcase,
  'confirm-dialog': ConfirmDialogShowcase,
  toast: ToastShowcase,
  'command-palette': CommandPaletteShowcase,
  overlays: OverlayComponentsTestPage,
  'advanced-overlays': AdvancedOverlayComponentsTestPage,
  // Layout
  panel: PanelShowcase,
  drawer: DrawerShowcase,
  'split-pane': SplitPaneShowcase,
  // Charts
  charts: ChartsOverviewShowcase,
  sparkline: SparklineShowcase,
  'line-chart': LineChartShowcase,
  'bar-chart': BarChartShowcase,
  'pie-chart': PieChartShowcase,
  'progress-bar': ProgressBarShowcase,
  'metric-row': MetricRowShowcase,
  // Page Patterns
  'page-header': PageHeaderShowcase,
  'filter-bar': FilterBarShowcase,
  'activity-timeline': ActivityTimelineShowcase,
  'alert-strip': AlertStripShowcase,
  'quick-access-grid': QuickAccessGridShowcase,
  // Chat
  'chat-message': ChatMessageShowcase,
  'chat-divider': ChatDividerShowcase,
  'chat-suggestions': ChatSuggestionsShowcase,
  'chat-composer': ChatComposerShowcase,
  'chat-container': ChatContainerShowcase,
  // Complex Inputs
  'entity-picker': EntityPickerShowcase,
  'key-value-editor': KeyValueEditorShowcase,
  'ordered-list': OrderedListShowcase,
  'relationship-builder': RelationshipBuilderShowcase,
  'row-menu': RowMenuShowcase,
  'pipeline-card': PipelineCardShowcase,
  'form-callout': FormCalloutShowcase,
  // Graph
  'graph-canvas': GraphCanvasShowcase,
  'graph-inspector': GraphInspectorShowcase,
  'topology-node': TopologyNodeShowcase,
  // Rebuilt Examples
  rebuilt: ContextStudioRebuilt,
  homelab: HomelabDashboardRebuilt,
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Foundation',
    items: [
      { id: 'colors', label: 'Colors', icon: 'palette' },
      { id: 'typography', label: 'Typography', icon: 'edit' },
      { id: 'spacing', label: 'Spacing', icon: 'layout' },
      { id: 'radius', label: 'Radius', icon: 'component' },
    ],
  },
  {
    title: 'Primitives',
    items: [
      { id: 'icon', label: 'Icon', icon: 'star' },
      { id: 'button', label: 'Button', icon: 'component' },
      { id: 'chip', label: 'Chip', icon: 'filter' },
      { id: 'badge', label: 'Badge', icon: 'alert' },
    ],
  },
  {
    title: 'Inputs',
    items: [
      { id: 'text-input', label: 'TextInput', icon: 'edit' },
      { id: 'text-area', label: 'TextArea', icon: 'edit' },
      { id: 'number-input', label: 'NumberInput', icon: 'data' },
      { id: 'select', label: 'Select', icon: 'chevronDown' },
      { id: 'tri-state', label: 'TriState', icon: 'check' },
      { id: 'field', label: 'Field', icon: 'layout' },
    ],
  },
  {
    title: 'Data Display',
    items: [
      { id: 'stat-tile', label: 'StatTile', icon: 'dashboard' },
      { id: 'stat-grid', label: 'StatGrid', icon: 'table' },
      { id: 'table', label: 'Table', icon: 'table' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { id: 'nav-item', label: 'NavItem', icon: 'menu' },
      { id: 'sidebar', label: 'Sidebar', icon: 'layout' },
      { id: 'topbar', label: 'Topbar', icon: 'arrowUp' },
      { id: 'tab-bar', label: 'TabBar', icon: 'schema' },
    ],
  },
  {
    title: 'Shell',
    items: [
      { id: 'app-title', label: 'AppTitle', icon: 'menu' },
      { id: 'statusbar', label: 'Statusbar', icon: 'info' },
      { id: 'shell-layout', label: 'ShellLayout', icon: 'layout' },
    ],
  },
  {
    title: 'Overlays',
    items: [
      { id: 'modal', label: 'Modal', icon: 'copy' },
      { id: 'confirm-dialog', label: 'ConfirmDialog', icon: 'alert' },
      { id: 'toast', label: 'Toast', icon: 'bell' },
      { id: 'command-palette', label: 'CommandPalette', icon: 'search' },
    ],
  },
  {
    title: 'Layout',
    items: [
      { id: 'panel', label: 'Panel', icon: 'layout' },
      { id: 'drawer', label: 'Drawer', icon: 'chevronLeft' },
      { id: 'split-pane', label: 'SplitPane', icon: 'layout' },
    ],
  },
  {
    title: 'Charts',
    items: [
      { id: 'charts', label: 'Overview', icon: 'dashboard' },
      { id: 'sparkline', label: 'Sparkline', icon: 'trending-up' },
      { id: 'line-chart', label: 'LineChart', icon: 'trending-up' },
      { id: 'bar-chart', label: 'BarChart', icon: 'bar-chart' },
      { id: 'pie-chart', label: 'PieChart', icon: 'component' },
      { id: 'progress-bar', label: 'ProgressBar', icon: 'data' },
      { id: 'metric-row', label: 'MetricRow', icon: 'data' },
    ],
  },
  {
    title: 'Page Patterns',
    items: [
      { id: 'page-header', label: 'PageHeader', icon: 'layout' },
      { id: 'filter-bar', label: 'FilterBar', icon: 'filter' },
      { id: 'activity-timeline', label: 'ActivityTimeline', icon: 'clock' },
      { id: 'alert-strip', label: 'AlertStrip', icon: 'alert' },
      { id: 'quick-access-grid', label: 'QuickAccessGrid', icon: 'table' },
    ],
  },
  {
    title: 'Chat',
    items: [
      { id: 'chat-message', label: 'ChatMessage', icon: 'bot' },
      { id: 'chat-divider', label: 'ChatDivider', icon: 'slash' },
      { id: 'chat-suggestions', label: 'ChatSuggestions', icon: 'star' },
      { id: 'chat-composer', label: 'ChatComposer', icon: 'edit' },
      { id: 'chat-container', label: 'ChatContainer', icon: 'layout' },
    ],
  },
  {
    title: 'Complex Inputs',
    items: [
      { id: 'entity-picker', label: 'EntityPicker', icon: 'search' },
      { id: 'key-value-editor', label: 'KeyValueEditor', icon: 'edit' },
      { id: 'ordered-list', label: 'OrderedList', icon: 'arrowDown' },
      { id: 'relationship-builder', label: 'RelationshipBuilder', icon: 'schema' },
      { id: 'row-menu', label: 'RowMenu', icon: 'menu' },
      { id: 'pipeline-card', label: 'PipelineCard', icon: 'pipeline' },
      { id: 'form-callout', label: 'FormCallout', icon: 'info' },
    ],
  },
  {
    title: 'Graph',
    items: [
      { id: 'graph-canvas', label: 'GraphCanvas', icon: 'schema' },
      { id: 'graph-inspector', label: 'GraphInspector', icon: 'info' },
      { id: 'topology-node', label: 'TopologyNode', icon: 'data' },
    ],
  },
]

const DEFAULT_SHOWCASE = 'colors'

function getLabel(id: string): string {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find(i => i.id === id)
    if (item) return item.label
  }
  return id
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentId, setCurrentId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('example') || DEFAULT_SHOWCASE
  })
  const [darkCanvas, setDarkCanvas] = useState(() => localStorage.getItem('heimdall-dark-canvas') === '1')

  useEffect(() => {
    document.body.classList.toggle('dark-canvas', darkCanvas)
    localStorage.setItem('heimdall-dark-canvas', darkCanvas ? '1' : '0')
  }, [darkCanvas])

  const Showcase = SHOWCASE_MAP[currentId] ?? SHOWCASE_MAP[DEFAULT_SHOWCASE]
  const sectionLabel = NAV_SECTIONS.find(s => s.items.some(i => i.id === currentId))?.title ?? ''

  return (
    <ShellLayout
      appTitle={{ title: 'Heimdall', version: 'v0.1.0' }}
      topbar={{
        breadcrumbs: [
          { label: sectionLabel },
          { label: getLabel(currentId) },
        ],
        children: (
          <button
            onClick={() => setDarkCanvas(v => !v)}
            title={darkCanvas ? 'Switch to light canvas' : 'Switch to dark canvas'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6, border: '1px solid',
              background: 'transparent', cursor: 'pointer',
              borderColor: darkCanvas ? 'rgba(245,158,11,0.35)' : 'rgb(var(--shell-border))',
              color: darkCanvas ? 'rgb(var(--accent-primary))' : 'rgb(var(--shell-fg-3))',
              transition: 'color 120ms, border-color 120ms, background 120ms',
            }}
          >
            <Icon name={darkCanvas ? 'sun' : 'moon'} size={14} />
          </button>
        ),
      }}
      sidebar={{
        collapsed: sidebarCollapsed,
        onCollapse: setSidebarCollapsed,
        onSelectItem: setCurrentId,
        sections: NAV_SECTIONS,
        activeItemId: currentId,
      }}
      statusbar={{
        left: <span>heimdall-ui</span>,
        right: <span>{NAV_SECTIONS.reduce((n, s) => n + s.items.length, 0)} components</span>,
      }}
    >
      <div style={{ padding: '22px 26px 32px', maxWidth: 900 }}>
        <Showcase />
      </div>
    </ShellLayout>
  )
}

export default App
