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
      <PageHeader name="Sidebar" description="Left navigation panel. 256px expanded, 64px collapsed. Groups items into labeled sections." />
      <ShowcaseSection label="Expanded and collapsed" description="Click the menu toggle at the top of the sidebar.">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgb(var(--canvas-fg-3))', marginBottom: 8, fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Expanded
            </div>
            <div style={{ border: `1px solid #1e2733`, borderRadius: 8, overflow: 'hidden' }}>
              <Sidebar
                sections={sections}
                activeItemId={activeItem}
                collapsed={false}
                onSelectItem={setActiveItem}
                onCollapse={() => {}}
              />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgb(var(--canvas-fg-3))', marginBottom: 8, fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Collapsed
            </div>
            <div style={{ border: `1px solid #1e2733`, borderRadius: 8, overflow: 'hidden' }}>
              <Sidebar
                sections={sections}
                activeItemId={activeItem}
                collapsed={true}
                onSelectItem={setActiveItem}
                onCollapse={() => {}}
              />
            </div>
          </div>
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="sections" type="SidebarSection[]" description="Array of section groups, each with a title and items array" />
          <PropRow name="activeItemId" type="string" description="ID of the currently active nav item" />
          <PropRow name="collapsed" type="boolean" def="false" description="Collapsed state — icon-only 64px width" />
          <PropRow name="onSelectItem" type="(id: string) => void" description="Called when a nav item is clicked" />
          <PropRow name="onCollapse" type="(collapsed: boolean) => void" description="Called when the toggle button is clicked" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function TopbarShowcase() {
  return (
    <div>
      <PageHeader name="Topbar" description="Bar above the canvas with breadcrumb navigation and an optional search input." />
      <ShowcaseSection label="With breadcrumbs">
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
          <PropRow name="breadcrumbs" type="Array<{ label, href?, onClick? }>" description="Breadcrumb items — linked or plain" />
          <PropRow name="searchPlaceholder" type="string" def="'Search...'" description="Placeholder text for the search input" />
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

  return (
    <div>
      <PageHeader name="TabBar" description="Horizontal tab navigation bar. Active tab has an underline indicator." />
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
      <ShowcaseSection label="Count chips" description="Chips render automatically for tabs with count values using the id-tag form.">
        <DemoRow>
          <Chip form="id-tag">248</Chip>
          <Chip form="id-tag">12</Chip>
          <Chip form="id-tag">3</Chip>
          <Chip form="id-tag">1</Chip>
        </DemoRow>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="tabs" type="Tab[]" description="Array of tab objects: { id, label, count? }" />
          <PropRow name="activeTabId" type="string" description="ID of the currently active tab" />
          <PropRow name="onSelectTab" type="(id: string) => void" description="Tab selection handler" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
