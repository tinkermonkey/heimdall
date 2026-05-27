import { useState } from 'react'
import { NavItem, Sidebar, Topbar, TabBar, Icon, Chip } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, DemoCard, DemoGrid, PropsTable, PropRow } from '../components/ShowcaseSection'

const border = 'rgb(var(--canvas-border, 229 231 235))'
const shellBg = '#0b0f14'

export function NavItemShowcase() {
  const [active, setActive] = useState('cls-organism')

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const },
    {
      id: 'schema', label: 'Schema', icon: 'schema' as const, count: 128,
      children: [
        { id: 'cls-organism', label: 'life.organism', count: 42 },
        { id: 'cls-cell', label: 'life.cell', count: 18 },
        { id: 'cls-gene', label: 'molecular.gene', count: 67 },
      ],
    },
    { id: 'data', label: 'Individuals', icon: 'data' as const, count: 12480 },
    { id: 'pipeline', label: 'Pipelines', icon: 'pipeline' as const, count: 17 },
  ]

  return (
    <div>
      <PageHeader name="NavItem" description="Single navigation item for the sidebar. Active state: 2px amber left border + shell-surface background. Supports one level of sub-item hierarchy." />
      <ShowcaseSection label="Flat and hierarchical">
        <div style={{ background: shellBg, borderRadius: 8, padding: '10px 8px', width: 280, border: `1px solid #1e2733` }}>
          {items.map(item => (
            <div key={item.id}>
              <NavItem
                icon={item.icon}
                label={item.label}
                count={item.count}
                active={active === item.id}
                onClick={() => setActive(item.id)}
              />
              {item.children && item.children.map(sub => (
                <NavItem
                  key={sub.id}
                  label={sub.label}
                  count={sub.count}
                  depth={1}
                  active={active === sub.id}
                  onClick={() => setActive(sub.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="label" type="string" description="Nav item text" />
          <PropRow name="icon" type="IconName" description="Icon rendered left of the label (top-level only)" />
          <PropRow name="count" type="number" description="Badge count rendered right-aligned" />
          <PropRow name="active" type="boolean" def="false" description="Active state — amber border + surface bg" />
          <PropRow name="depth" type="0 | 1" def="0" description="Nesting depth — 1 renders as an indented sub-item without an icon" />
          <PropRow name="disabled" type="boolean" description="Disables the button; inherited from ButtonHTMLAttributes" />
          <PropRow name="onClick" type="() => void" description="Click handler" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function SidebarShowcase() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState('schema')

  const sections = [
    {
      title: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const },
        {
          id: 'schema', label: 'Schema', icon: 'schema' as const, count: 128,
          children: [
            { id: 'cls-organism', label: 'life.organism', count: 42 },
            { id: 'cls-cell', label: 'life.cell', count: 18 },
            { id: 'cls-gene', label: 'molecular.gene', count: 67 },
          ],
        },
        { id: 'data', label: 'Individuals', icon: 'data' as const, count: 12480 },
        { id: 'pipeline', label: 'Pipelines', icon: 'pipeline' as const, count: 17 },
      ],
    },
    {
      title: 'Tools',
      items: [
        { id: 'graph', label: 'Graph view', icon: 'graph' as const },
        { id: 'settings', label: 'Settings', icon: 'settings' as const },
      ],
    },
  ]

  return (
    <div>
      <PageHeader name="Sidebar" description="Left navigation panel. 256px expanded, 64px collapsed. Groups items into labeled sections. Toggle button at top-right collapses and expands the sidebar." />
      <ShowcaseSection label="Interactive" description="Click the chevron toggle button to collapse or expand. Click items to select. Click a parent with children to expand its sub-items.">
        <div style={{ border: `1px solid #1e2733`, borderRadius: 8, overflow: 'hidden', display: 'inline-block' }}>
          <Sidebar
            sections={sections}
            activeItemId={activeItem}
            collapsed={collapsed}
            onSelectItem={setActiveItem}
            onCollapse={setCollapsed}
            defaultExpandedIds={['schema']}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Collapsed (static)">
        <div style={{ border: `1px solid #1e2733`, borderRadius: 8, overflow: 'hidden', display: 'inline-block' }}>
          <Sidebar
            sections={sections}
            activeItemId={activeItem}
            collapsed={true}
            onSelectItem={setActiveItem}
            onCollapse={() => {}}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="sections" type="SidebarSection[]" description="Array of section groups, each with a title and items array" />
          <PropRow name="activeItemId" type="string" description="ID of the currently active nav item" />
          <PropRow name="collapsed" type="boolean" def="false" description="Collapsed state — icon-only 64px width" />
          <PropRow name="onSelectItem" type="(id: string) => void" description="Called when a non-parent nav item is clicked" />
          <PropRow name="onCollapse" type="(collapsed: boolean) => void" description="Called when the toggle button is clicked, receives next collapsed value" />
          <PropRow name="defaultExpandedIds" type="string[]" description="Parent item ids expanded on first render (uncontrolled)" />
          <PropRow name="expandedIds" type="string[]" description="Controlled expansion — reflect this set and report changes via onExpandedChange" />
          <PropRow name="onExpandedChange" type="(ids: string[]) => void" description="Called with the next expanded id set when a parent is toggled" />
          <PropRow name="showCollapseToggle" type="boolean" def="true" description="Show the built-in collapse toggle. Set false to host it elsewhere (e.g. AppTitle action)." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function TopbarShowcase() {
  return (
    <div>
      <PageHeader name="Topbar" description="Bar above the canvas with breadcrumb navigation and an optional search input." />
      <ShowcaseSection label="Static breadcrumbs">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Topbar
            breadcrumbs={[
              { label: 'Workspace' },
              { label: 'Schema' },
              { label: 'life.organism' },
            ]}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Linked breadcrumbs (href)">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Topbar
            breadcrumbs={[
              { label: 'Workspace', href: '#' },
              { label: 'Schema', href: '#' },
              { label: 'life.organism' },
            ]}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="With search">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Topbar
            breadcrumbs={[{ label: 'Individuals' }]}
            searchPlaceholder="Filter individuals…"
            onSearch={() => {}}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="With children (custom actions)">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Topbar breadcrumbs={[{ label: 'Pipelines' }]}>
            <Icon name="plus" size={16} />
          </Topbar>
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="breadcrumbs" type="BreadcrumbItem[]" description="Breadcrumb items. href renders an anchor; onClick renders a button; neither renders a static span." />
          <PropRow name="searchPlaceholder" type="string" def="'Search…'" description="Placeholder text for the search input" />
          <PropRow name="onSearch" type="(query: string) => void" description="Passing this prop renders the search input" />
          <PropRow name="children" type="ReactNode" description="Custom actions rendered in the right slot" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function TabBarShowcase() {
  const [active1, setActive1] = useState('overview')
  const [active2, setActive2] = useState('all')
  const [active3, setActive3] = useState('active')

  return (
    <div>
      <PageHeader name="TabBar" description="Horizontal tab navigation bar. Active tab has an underline indicator. Keyboard navigation: arrow keys move between tabs, Tab key moves focus to/from the tablist." />
      <ShowcaseSection label="Basic">
        <TabBar
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'details', label: 'Details' },
            { id: 'history', label: 'History' },
          ]}
          activeTabId={active1}
          onSelectTab={setActive1}
        />
      </ShowcaseSection>
      <ShowcaseSection label="With counts">
        <TabBar
          tabs={[
            { id: 'all', label: 'All', count: 248 },
            { id: 'running', label: 'Running', count: 12 },
            { id: 'degraded', label: 'Degraded', count: 3 },
            { id: 'stopped', label: 'Stopped', count: 1 },
          ]}
          activeTabId={active2}
          onSelectTab={setActive2}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Disabled tabs" description="Tabs with disabled set to true are skipped during keyboard navigation and cannot be clicked.">
        <TabBar
          tabs={[
            { id: 'active', label: 'Active' },
            { id: 'archived', label: 'Archived', disabled: true },
            { id: 'deleted', label: 'Deleted', disabled: true },
            { id: 'settings', label: 'Settings' },
          ]}
          activeTabId={active3}
          onSelectTab={setActive3}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Count chips" description="Chips render automatically for tabs with count values using the id-tag form.">
        <DemoRow>
          <Chip form="id-tag">248</Chip>
          <Chip form="id-tag">12</Chip>
          <Chip form="id-tag">3</Chip>
          <Chip form="id-tag">1</Chip>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="TabBar props">
        <PropsTable>
          <PropRow name="tabs" type="Tab[]" description="Array of tab descriptor objects." />
          <PropRow name="activeTabId" type="string" description="ID of the currently active tab." />
          <PropRow name="onSelectTab" type="(id: string) => void" description="Called when the user selects a tab." />
          <PropRow name="className" type="string" description="Additional class names applied to the root element." />
        </PropsTable>
      </ShowcaseSection>
      <ShowcaseSection label="Tab object fields">
        <PropsTable>
          <PropRow name="id" type="string" description="Unique identifier for the tab." />
          <PropRow name="label" type="string" description="Display label shown in the tab." />
          <PropRow name="count" type="number" description="Optional count badge rendered as a Chip." />
          <PropRow name="disabled" type="boolean" description="When true the tab is non-interactive and skipped by keyboard navigation." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
