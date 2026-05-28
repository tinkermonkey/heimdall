import {
  AppTitle,
  Titlebar,
  Statusbar,
  ShellLayout,
  Panel,
  SplitPane,
  Button,
  Icon,
  type StatusbarItem,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

export function BareAppTitle() {
  return (
    <BareSection name="AppTitle">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 256, background: 'rgb(var(--shell-bg))', padding: 12 }}>
          <AppTitle title="Heimdall" />
        </div>
      </AxisRow>
      <AxisRow label="with version" align="stretch">
        <div style={{ width: 256, background: 'rgb(var(--shell-bg))', padding: 12 }}>
          <AppTitle title="Heimdall" version="v0.1.0" />
        </div>
      </AxisRow>
      <AxisRow label="collapsed" align="stretch">
        <div style={{ width: 64, background: 'rgb(var(--shell-bg))', padding: 12 }}>
          <AppTitle title="Heimdall" version="v0.1.0" collapsed />
        </div>
      </AxisRow>
      <AxisRow label="with action" align="stretch">
        <div style={{ width: 256, background: 'rgb(var(--shell-bg))', padding: 12 }}>
          <AppTitle
            title="Heimdall"
            version="v0.1.0"
            action={<Icon name="chevronLeft" size={14} />}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareTitlebar() {
  return (
    <BareSection name="Titlebar">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%', background: 'rgb(var(--shell-bg))' }}>
          <Titlebar />
        </div>
      </AxisRow>
      <AxisRow label="left/center/right" align="stretch">
        <div style={{ width: '100%', background: 'rgb(var(--shell-bg))' }}>
          <Titlebar
            left={<span>heimdall-ui</span>}
            center={<span>Untitled workspace</span>}
            right={<span>v0.1.0</span>}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

const STATUSBAR_LEFT: StatusbarItem[] = [
  { kind: 'pulse', tone: 'emerald', label: 'connected' },
  { kind: 'divider' },
  { kind: 'icon', icon: 'gitBranch', label: 'main', mono: true },
]

const STATUSBAR_RIGHT: StatusbarItem[] = [
  { kind: 'icon', icon: 'clock', label: '12ms', mono: true },
  { kind: 'divider' },
  { kind: 'pulse', tone: 'cyan', label: 'syncing' },
]

export function BareStatusbar() {
  return (
    <BareSection name="Statusbar">
      <AxisRow label="default" align="stretch">
        <div style={{ width: '100%' }}>
          <Statusbar />
        </div>
      </AxisRow>
      <AxisRow label="nodes" align="stretch">
        <div style={{ width: '100%' }}>
          <Statusbar left={<span>heimdall-ui</span>} right={<span>v0.1.0</span>} />
        </div>
      </AxisRow>
      <AxisRow label="items" align="stretch">
        <div style={{ width: '100%' }}>
          <Statusbar left={STATUSBAR_LEFT} right={STATUSBAR_RIGHT} />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareShellLayout() {
  return (
    <BareSection name="ShellLayout">
      <AxisRow label="nested preview (800×500)" align="stretch">
        <div
          style={{
            width: 880,
            height: 520,
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <ShellLayout
            appTitle={{ title: 'Heimdall', version: 'v0.1.0' }}
            topbar={{ breadcrumbs: [{ label: 'Workspace' }, { label: 'Schemas' }] }}
            sidebar={{
              sections: [
                {
                  title: 'Workspace',
                  items: [
                    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
                    { id: 'schemas', label: 'Schemas', icon: 'schema' },
                    { id: 'data', label: 'Data', icon: 'data' },
                  ],
                },
              ],
              activeItemId: 'schemas',
              onSelectItem: () => {},
            }}
            statusbar={{
              left: <span>heimdall-ui</span>,
              right: <span>3 items</span>,
            }}
          >
            <div style={{ padding: 24, color: 'rgb(var(--canvas-fg))' }}>
              <p style={{ margin: 0 }}>Canvas content area.</p>
            </div>
          </ShellLayout>
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BarePanel() {
  return (
    <BareSection name="Panel">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 420 }}>
          <Panel>Panel body.</Panel>
        </div>
      </AxisRow>
      <AxisRow label="with title" align="stretch">
        <div style={{ width: 420 }}>
          <Panel title="Panel title">Panel body.</Panel>
        </div>
      </AxisRow>
      <AxisRow label="with subtitle + header action" align="stretch">
        <div style={{ width: 420 }}>
          <Panel
            title="Pipelines"
            subtitle="4 active"
            headerAction={<Button variant="ghost" size="sm">View all</Button>}
          >
            Panel body.
          </Panel>
        </div>
      </AxisRow>
      <AxisRow label="with footer" align="stretch">
        <div style={{ width: 420 }}>
          <Panel title="Footer demo" footer={<Button size="sm">Save</Button>}>
            Panel body.
          </Panel>
        </div>
      </AxisRow>
      <AxisRow label="bordered=false" align="stretch">
        <div style={{ width: 420 }}>
          <Panel bordered={false} title="No border">Panel body without border.</Panel>
        </div>
      </AxisRow>
      <AxisRow label="noPadding" align="stretch">
        <div style={{ width: 420 }}>
          <Panel noPadding title="No padding">
            <div style={{ padding: '12px 16px' }}>Custom inner padding.</div>
          </Panel>
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareSplitPane() {
  return (
    <BareSection name="SplitPane">
      <AxisRow label="horizontal (default)" align="stretch">
        <div style={{ width: 720, height: 240, border: '1px solid rgb(var(--canvas-border))', borderRadius: 8 }}>
          <SplitPane
            first={<div style={{ padding: 16 }}>Left pane</div>}
            second={<div style={{ padding: 16 }}>Right pane</div>}
          />
        </div>
      </AxisRow>
      <AxisRow label="vertical" align="stretch">
        <div style={{ width: 480, height: 320, border: '1px solid rgb(var(--canvas-border))', borderRadius: 8 }}>
          <SplitPane
            direction="vertical"
            first={<div style={{ padding: 16 }}>Top pane</div>}
            second={<div style={{ padding: 16 }}>Bottom pane</div>}
          />
        </div>
      </AxisRow>
      <AxisRow label="with divider label" align="stretch">
        <Caption label="dividerLabel='drag'">
          <div style={{ width: 720, height: 200, border: '1px solid rgb(var(--canvas-border))', borderRadius: 8 }}>
            <SplitPane
              dividerLabel="drag"
              first={<div style={{ padding: 16 }}>Left</div>}
              second={<div style={{ padding: 16 }}>Right</div>}
            />
          </div>
        </Caption>
      </AxisRow>
    </BareSection>
  )
}
