import { useState, useEffect } from 'react'
import { ShellLayout, Icon, type IconName } from '@heimdall/ui'

import { ColorsShowcase, TypographyShowcase, SpacingShowcase, RadiusShowcase } from './showcases/FoundationShowcase'
import { IconShowcase, ButtonShowcase, ChipShowcase, BadgeShowcase } from './showcases/PrimitivesShowcase'
import { TextInputShowcase, TextAreaShowcase, NumberInputShowcase, SelectShowcase, TriStateShowcase, FieldShowcase } from './showcases/InputsShowcase'
import { StatTileShowcase, StatGridShowcase, TableShowcase } from './showcases/DataDisplayShowcase'
import { NavItemShowcase, SidebarShowcase, TopbarShowcase, TabBarShowcase } from './showcases/NavigationShowcase'
import { TitlebarShowcase, StatusbarShowcase, ShellLayoutShowcase } from './showcases/ShellShowcase'
import { ModalShowcase, ConfirmDialogShowcase, ToastShowcase, CommandPaletteShowcase } from './showcases/OverlaysShowcase'
import { PanelShowcase, DrawerShowcase, SplitPaneShowcase } from './showcases/LayoutShowcase'

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
  // Primitives
  icon: IconShowcase,
  button: ButtonShowcase,
  chip: ChipShowcase,
  badge: BadgeShowcase,
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
  // Navigation
  'nav-item': NavItemShowcase,
  sidebar: SidebarShowcase,
  topbar: TopbarShowcase,
  'tab-bar': TabBarShowcase,
  // Shell
  titlebar: TitlebarShowcase,
  statusbar: StatusbarShowcase,
  'shell-layout': ShellLayoutShowcase,
  // Overlays
  modal: ModalShowcase,
  'confirm-dialog': ConfirmDialogShowcase,
  toast: ToastShowcase,
  'command-palette': CommandPaletteShowcase,
  // Layout
  panel: PanelShowcase,
  drawer: DrawerShowcase,
  'split-pane': SplitPaneShowcase,
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
      { id: 'titlebar', label: 'Titlebar', icon: 'menu' },
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
  const [currentId, setCurrentId] = useState(DEFAULT_SHOWCASE)
  const [darkCanvas, setDarkCanvas] = useState(() => localStorage.getItem('heimdall-dark-canvas') === '1')

  useEffect(() => {
    document.body.classList.toggle('dark-canvas', darkCanvas)
    localStorage.setItem('heimdall-dark-canvas', darkCanvas ? '1' : '0')
  }, [darkCanvas])

  const Showcase = SHOWCASE_MAP[currentId] ?? SHOWCASE_MAP[DEFAULT_SHOWCASE]
  const sectionLabel = NAV_SECTIONS.find(s => s.items.some(i => i.id === currentId))?.title ?? ''

  return (
    <ShellLayout
      titlebar={{
        left: <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, fontWeight: 600 }}>heimdall</span>,
        center: <span style={{ fontSize: 12 }}>Design System</span>,
      }}
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
