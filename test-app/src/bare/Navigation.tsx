import { useState } from 'react'
import { NavItem, Sidebar, Topbar, TabBar, Button, Icon } from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

export function BareNavItem() {
  return (
    <BareSection name="NavItem">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 240 }}>
          <NavItem label="Dashboard" />
        </div>
      </AxisRow>
      <AxisRow label="with icon" align="stretch">
        <div style={{ width: 240 }}>
          <NavItem icon="dashboard" label="Dashboard" />
        </div>
      </AxisRow>
      <AxisRow label="active" align="stretch">
        <div style={{ width: 240 }}>
          <NavItem icon="schema" label="Schemas" active />
        </div>
      </AxisRow>
      <AxisRow label="with count" align="stretch">
        <div style={{ width: 240 }}>
          <NavItem icon="data" label="Data" count={42} />
        </div>
      </AxisRow>
      <AxisRow label="depth=1 (child)" align="stretch">
        <div style={{ width: 240 }}>
          <NavItem label="Subitem" depth={1} />
        </div>
        <div style={{ width: 240 }}>
          <NavItem label="Active subitem" depth={1} active />
        </div>
      </AxisRow>
    </BareSection>
  )
}

const SIDEBAR_SECTIONS = [
  {
    title: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' as const },
      { id: 'schemas', label: 'Schemas', icon: 'schema' as const, count: 8 },
      {
        id: 'data',
        label: 'Data',
        icon: 'data' as const,
        children: [
          { id: 'data-raw', label: 'Raw' },
          { id: 'data-derived', label: 'Derived', count: 12 },
        ],
      },
    ],
  },
  {
    title: 'Ops',
    items: [
      { id: 'pipelines', label: 'Pipelines', icon: 'pipeline' as const, count: 4 },
      { id: 'graph', label: 'Graph', icon: 'graph' as const },
    ],
  },
]

export function BareSidebar() {
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  return (
    <BareSection name="Sidebar">
      <AxisRow label="default" align="stretch">
        <div style={{ height: 420, display: 'flex', background: 'rgb(var(--shell-bg))' }}>
          <Sidebar
            sections={SIDEBAR_SECTIONS}
            activeItemId={active}
            onSelectItem={setActive}
            collapsed={collapsed}
            onCollapse={setCollapsed}
            defaultExpandedIds={['data']}
          />
        </div>
      </AxisRow>
      <AxisRow label="collapsed" align="stretch">
        <div style={{ height: 420, display: 'flex', background: 'rgb(var(--shell-bg))' }}>
          <Sidebar
            sections={SIDEBAR_SECTIONS}
            activeItemId={active}
            onSelectItem={setActive}
            collapsed
            onCollapse={() => {}}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareTopbar() {
  return (
    <BareSection name="Topbar">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%', background: 'rgb(var(--shell-bg))' }}>
          <Topbar />
        </div>
      </AxisRow>
      <AxisRow label="with breadcrumbs" align="stretch">
        <div style={{ width: '100%', background: 'rgb(var(--shell-bg))' }}>
          <Topbar
            breadcrumbs={[
              { label: 'Workspace' },
              { label: 'Schemas' },
              { label: 'cls_organism' },
            ]}
          />
        </div>
      </AxisRow>
      <AxisRow label="with actions" align="stretch">
        <div style={{ width: '100%', background: 'rgb(var(--shell-bg))' }}>
          <Topbar breadcrumbs={[{ label: 'Workspace' }, { label: 'Schemas' }]}>
            <Button variant="secondary" icon aria-label="bell"><Icon name="bell" size={14} /></Button>
            <Button variant="primary">New</Button>
          </Topbar>
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareTabBar() {
  const [active, setActive] = useState('overview')
  return (
    <BareSection name="TabBar">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%' }}>
          <TabBar
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'data', label: 'Data' },
              { id: 'graph', label: 'Graph' },
              { id: 'settings', label: 'Settings' },
            ]}
            activeTabId={active}
            onSelectTab={setActive}
          />
        </div>
      </AxisRow>
      <AxisRow label="with counts" align="stretch">
        <div style={{ width: '100%' }}>
          <TabBar
            tabs={[
              { id: 'all', label: 'All', count: 124 },
              { id: 'active', label: 'Active', count: 12 },
              { id: 'failed', label: 'Failed', count: 3 },
            ]}
            activeTabId="all"
            onSelectTab={() => {}}
          />
        </div>
      </AxisRow>
      <AxisRow label="with disabled" align="stretch">
        <div style={{ width: '100%' }}>
          <TabBar
            tabs={[
              { id: 'one', label: 'One' },
              { id: 'two', label: 'Two' },
              { id: 'three', label: 'Coming soon', disabled: true },
            ]}
            activeTabId="one"
            onSelectTab={() => {}}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}
