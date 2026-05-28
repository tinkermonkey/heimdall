import type { IconName, SidebarSection } from '@tinkermonkey/heimdall-ui'
import {
  BareIcon,
  BareButton,
  BareChip,
  BareBadge,
  BareStatusBadge,
  BareVersionPill,
} from './bare/Primitives'
import {
  BareTextInput,
  BareTextArea,
  BareNumberInput,
  BareSelect,
  BareTriState,
  BareField,
  BareSegmentedControl,
  BareFilterDropdown,
} from './bare/Inputs'
import {
  BareStatTile,
  BareStatGrid,
  BareTable,
  BareMetricRow,
  BareKVGrid,
  BareProgressBar,
} from './bare/DataDisplay'
import {
  BareNavItem,
  BareSidebar,
  BareTopbar,
  BareTabBar,
} from './bare/Navigation'
import {
  BareAppTitle,
  BareTitlebar,
  BareStatusbar,
  BareShellLayout,
  BarePanel,
  BareSplitPane,
} from './bare/Shell'
import {
  BareModal,
  BareConfirmDialog,
  BareToast,
  BareCommandPalette,
  BareDrawer,
  BareWorkspaceSwitcherDialog,
} from './bare/Overlays'
import {
  BareChartWrapper,
  BareSparkline,
  BareLineChart,
  BareBarChart,
  BareBarV,
  BareBarH,
  BareStackedBar,
  BareDonut,
  BarePieChart,
  BareHeatmap,
  BareStatusTimeline,
} from './bare/Charts'
import {
  BarePageHeader,
  BareFilterBar,
  BareAlertStrip,
  BareActivityTimeline,
  BareQuickAccessTile,
  BareQuickAccessGrid,
  BareConfigTile,
  BareFormCallout,
} from './bare/Content'
import {
  BareChatMessage,
  BareToolBlock,
  BareThinkingBlock,
  BareChatDivider,
  BareChatSuggestions,
  BareChatComposer,
  BareChatContainer,
} from './bare/Chat'
import {
  BareKeyValueEditor,
  BareOrderedList,
  BareEntityPicker,
  BareRelationshipBuilder,
  BareRowMenu,
} from './bare/DataEditing'
import { BarePipelineCard } from './bare/Pipeline'
import {
  BareGraphNode,
  BareGraphCanvas,
  BareGraphEdge,
  BareGraphInspector,
} from './bare/Graph'
import {
  BareHierarchyRow,
  BareHierarchyTree,
  BareTopologyNode,
} from './bare/Hierarchy'
import { BareInspectorPanel } from './bare/Inspector'

export type NavItemEntry = {
  id: string
  label: string
  icon: IconName
}

export const BARE_MAP: Record<string, React.ComponentType> = {
  // Primitives
  icon: BareIcon,
  button: BareButton,
  chip: BareChip,
  badge: BareBadge,
  'status-badge': BareStatusBadge,
  'version-pill': BareVersionPill,
  // Inputs
  'text-input': BareTextInput,
  'text-area': BareTextArea,
  'number-input': BareNumberInput,
  select: BareSelect,
  'tri-state': BareTriState,
  field: BareField,
  'segmented-control': BareSegmentedControl,
  'filter-dropdown': BareFilterDropdown,
  // Data display
  'stat-tile': BareStatTile,
  'stat-grid': BareStatGrid,
  table: BareTable,
  'metric-row': BareMetricRow,
  'kv-grid': BareKVGrid,
  'progress-bar': BareProgressBar,
  // Navigation
  'nav-item': BareNavItem,
  sidebar: BareSidebar,
  topbar: BareTopbar,
  'tab-bar': BareTabBar,
  // Shell / layout
  'app-title': BareAppTitle,
  titlebar: BareTitlebar,
  statusbar: BareStatusbar,
  'shell-layout': BareShellLayout,
  panel: BarePanel,
  'split-pane': BareSplitPane,
  // Overlays
  modal: BareModal,
  'confirm-dialog': BareConfirmDialog,
  toast: BareToast,
  'command-palette': BareCommandPalette,
  drawer: BareDrawer,
  'workspace-switcher-dialog': BareWorkspaceSwitcherDialog,
  // Charts
  'chart-wrapper': BareChartWrapper,
  sparkline: BareSparkline,
  'line-chart': BareLineChart,
  'bar-chart': BareBarChart,
  'bar-v': BareBarV,
  'bar-h': BareBarH,
  'stacked-bar': BareStackedBar,
  donut: BareDonut,
  'pie-chart': BarePieChart,
  heatmap: BareHeatmap,
  'status-timeline': BareStatusTimeline,
  // Content
  'page-header': BarePageHeader,
  'filter-bar': BareFilterBar,
  'alert-strip': BareAlertStrip,
  'activity-timeline': BareActivityTimeline,
  'quick-access-tile': BareQuickAccessTile,
  'quick-access-grid': BareQuickAccessGrid,
  'config-tile': BareConfigTile,
  'form-callout': BareFormCallout,
  // Chat
  'chat-message': BareChatMessage,
  'tool-block': BareToolBlock,
  'thinking-block': BareThinkingBlock,
  'chat-divider': BareChatDivider,
  'chat-suggestions': BareChatSuggestions,
  'chat-composer': BareChatComposer,
  'chat-container': BareChatContainer,
  // Data editing
  'key-value-editor': BareKeyValueEditor,
  'ordered-list': BareOrderedList,
  'entity-picker': BareEntityPicker,
  'relationship-builder': BareRelationshipBuilder,
  'row-menu': BareRowMenu,
  // Pipeline
  'pipeline-card': BarePipelineCard,
  // Graph
  'graph-node': BareGraphNode,
  'graph-canvas': BareGraphCanvas,
  'graph-edge': BareGraphEdge,
  'graph-inspector': BareGraphInspector,
  // Hierarchy
  'hierarchy-row': BareHierarchyRow,
  'hierarchy-tree': BareHierarchyTree,
  'topology-node': BareTopologyNode,
  // Inspector
  'inspector-panel': BareInspectorPanel,
}

export const NAV_SECTIONS: SidebarSection[] = [
  {
    title: 'Primitives',
    items: [
      { id: 'icon', label: 'Icon', icon: 'star' },
      { id: 'button', label: 'Button', icon: 'component' },
      { id: 'chip', label: 'Chip', icon: 'tag' },
      { id: 'badge', label: 'Badge', icon: 'alert' },
      { id: 'status-badge', label: 'StatusBadge', icon: 'alert' },
      { id: 'version-pill', label: 'VersionPill', icon: 'gitBranch' },
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
      { id: 'segmented-control', label: 'SegmentedControl', icon: 'component' },
      { id: 'filter-dropdown', label: 'FilterDropdown', icon: 'filter' },
    ],
  },
  {
    title: 'Data display',
    items: [
      { id: 'stat-tile', label: 'StatTile', icon: 'dashboard' },
      { id: 'stat-grid', label: 'StatGrid', icon: 'table' },
      { id: 'table', label: 'Table', icon: 'table' },
      { id: 'metric-row', label: 'MetricRow', icon: 'bar-chart' },
      { id: 'kv-grid', label: 'KVGrid', icon: 'data' },
      { id: 'progress-bar', label: 'ProgressBar', icon: 'trending-up' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { id: 'nav-item', label: 'NavItem', icon: 'menu' },
      { id: 'sidebar', label: 'Sidebar', icon: 'layout' },
      { id: 'topbar', label: 'Topbar', icon: 'arrowUp' },
      { id: 'tab-bar', label: 'TabBar', icon: 'menu' },
    ],
  },
  {
    title: 'Shell / Layout',
    items: [
      { id: 'app-title', label: 'AppTitle', icon: 'star' },
      { id: 'titlebar', label: 'Titlebar', icon: 'arrowUp' },
      { id: 'statusbar', label: 'Statusbar', icon: 'info' },
      { id: 'shell-layout', label: 'ShellLayout', icon: 'layout' },
      { id: 'panel', label: 'Panel', icon: 'layout' },
      { id: 'split-pane', label: 'SplitPane', icon: 'layout' },
    ],
  },
  {
    title: 'Overlays',
    items: [
      { id: 'modal', label: 'Modal', icon: 'copy' },
      { id: 'confirm-dialog', label: 'ConfirmDialog', icon: 'alert' },
      { id: 'toast', label: 'Toast', icon: 'bell' },
      { id: 'command-palette', label: 'CommandPalette', icon: 'search' },
      { id: 'drawer', label: 'Drawer', icon: 'chevronLeft' },
      { id: 'workspace-switcher-dialog', label: 'WorkspaceSwitcherDialog', icon: 'folder' },
    ],
  },
  {
    title: 'Charts',
    items: [
      { id: 'chart-wrapper', label: 'ChartWrapper', icon: 'component' },
      { id: 'sparkline', label: 'Sparkline', icon: 'trending-up' },
      { id: 'line-chart', label: 'LineChart', icon: 'trending-up' },
      { id: 'bar-chart', label: 'BarChart', icon: 'bar-chart' },
      { id: 'bar-v', label: 'BarV', icon: 'bar-chart' },
      { id: 'bar-h', label: 'BarH', icon: 'data' },
      { id: 'stacked-bar', label: 'StackedBar', icon: 'bar-chart' },
      { id: 'donut', label: 'Donut', icon: 'pie-chart' },
      { id: 'pie-chart', label: 'PieChart', icon: 'pie-chart' },
      { id: 'heatmap', label: 'Heatmap', icon: 'table' },
      { id: 'status-timeline', label: 'StatusTimeline', icon: 'clock' },
    ],
  },
  {
    title: 'Content',
    items: [
      { id: 'page-header', label: 'PageHeader', icon: 'layout' },
      { id: 'filter-bar', label: 'FilterBar', icon: 'filter' },
      { id: 'alert-strip', label: 'AlertStrip', icon: 'alert' },
      { id: 'activity-timeline', label: 'ActivityTimeline', icon: 'clock' },
      { id: 'quick-access-tile', label: 'QuickAccessTile', icon: 'component' },
      { id: 'quick-access-grid', label: 'QuickAccessGrid', icon: 'table' },
      { id: 'config-tile', label: 'ConfigTile', icon: 'settings' },
      { id: 'form-callout', label: 'FormCallout', icon: 'info' },
    ],
  },
  {
    title: 'Chat',
    items: [
      { id: 'chat-message', label: 'ChatMessage', icon: 'bot' },
      { id: 'tool-block', label: 'ToolBlock', icon: 'data' },
      { id: 'thinking-block', label: 'ThinkingBlock', icon: 'zap' },
      { id: 'chat-divider', label: 'ChatDivider', icon: 'slash' },
      { id: 'chat-suggestions', label: 'ChatSuggestions', icon: 'star' },
      { id: 'chat-composer', label: 'ChatComposer', icon: 'edit' },
      { id: 'chat-container', label: 'ChatContainer', icon: 'layout' },
    ],
  },
  {
    title: 'Data editing',
    items: [
      { id: 'key-value-editor', label: 'KeyValueEditor', icon: 'edit' },
      { id: 'ordered-list', label: 'OrderedList', icon: 'arrowDown' },
      { id: 'entity-picker', label: 'EntityPicker', icon: 'search' },
      { id: 'relationship-builder', label: 'RelationshipBuilder', icon: 'schema' },
      { id: 'row-menu', label: 'RowMenu', icon: 'moreVertical' },
    ],
  },
  {
    title: 'Pipeline',
    items: [{ id: 'pipeline-card', label: 'PipelineCard', icon: 'pipeline' }],
  },
  {
    title: 'Graph',
    items: [
      { id: 'graph-node', label: 'GraphNode', icon: 'component' },
      { id: 'graph-canvas', label: 'GraphCanvas', icon: 'schema' },
      { id: 'graph-edge', label: 'GraphEdge', icon: 'arrowRight' },
      { id: 'graph-inspector', label: 'GraphInspector', icon: 'info' },
    ],
  },
  {
    title: 'Hierarchy',
    items: [
      { id: 'hierarchy-row', label: 'HierarchyRow', icon: 'menu' },
      { id: 'hierarchy-tree', label: 'HierarchyTree', icon: 'schema' },
      { id: 'topology-node', label: 'TopologyNode', icon: 'data' },
    ],
  },
  {
    title: 'Inspector',
    items: [{ id: 'inspector-panel', label: 'InspectorPanel', icon: 'info' }],
  },
]

export const DEFAULT_ID = 'button'

export function getItemLabel(id: string): string {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find(i => i.id === id)
    if (item) return item.label
  }
  return id
}

export function getSectionTitle(id: string): string {
  for (const section of NAV_SECTIONS) {
    if (section.items.some(i => i.id === id)) return section.title
  }
  return ''
}
