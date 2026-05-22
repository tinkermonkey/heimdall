import { AppTitle, Statusbar, ShellLayout, Icon, type StatusbarItem } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const border = 'rgb(var(--canvas-border, 229 231 235))'

export function AppTitleShowcase() {
  return (
    <div>
      <PageHeader name="AppTitle" description="Brand mark and app name at the top of the sidebar column. Amber gradient logo square, app name, and optional version tag." />
      <ShowcaseSection label="Expanded">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', width: 256 }}>
          <AppTitle title="Heimdall" version="v0.1.0" />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Collapsed (icon only)">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', width: 64 }}>
          <AppTitle title="Heimdall" version="v0.1.0" collapsed />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="title" type="string" description="Application name displayed next to the mark" />
          <PropRow name="version" type="string" description="Version string rendered in mono below the title" />
          <PropRow name="collapsed" type="boolean" def="false" description="Collapsed state — hides the text, shows mark only" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function StatusbarShowcase() {
  const leftItems: StatusbarItem[] = [
    { kind: 'pulse', tone: 'emerald', label: 'connected' },
    { divider: true },
    { icon: 'check' },
  ]

  const rightItems: StatusbarItem[] = [
    { kind: 'pulse', tone: 'amber', label: 'Ln 42, Col 8' },
    { divider: true },
    { icon: 'info' },
  ]

  return (
    <div>
      <PageHeader name="Statusbar" description="Fixed footer bar at the bottom of the shell. Three slots: left, center, right. Accepts ReactNode or structured StatusbarItem[]." />
      <ShowcaseSection label="With left and right text">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Statusbar
            left={<span>context-studio · v0.4.1</span>}
            right={<span>12,480 individuals · 128 classes</span>}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="With center">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Statusbar
            left={<span>nyx-01</span>}
            center={<span style={{ color: 'rgb(var(--status-emerald, 16 185 129))' }}>● connected</span>}
            right={<span>Ln 42, Col 8</span>}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="With structured items (left)">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Statusbar left={leftItems} right={rightItems} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="left" type="ReactNode | StatusbarItem[]" description="Left slot — text node or structured items array" />
          <PropRow name="center" type="ReactNode | StatusbarItem[]" description="Center slot — text node or structured items array" />
          <PropRow name="right" type="ReactNode | StatusbarItem[]" description="Right slot — text node or structured items array" />
          <PropRow name="StatusbarItem (text)" type="{ type: 'text'; content: string }" description="Text element in the status bar" />
          <PropRow name="StatusbarItem (icon)" type="{ type: 'icon'; icon: IconName; tone?: StatusbarTone }" description="Icon element with optional tone color" />
          <PropRow name="StatusbarItem (divider)" type="{ type: 'divider' }" description="Vertical divider line" />
          <PropRow name="StatusbarItem (pulse)" type="{ type: 'pulse'; label?: string; tone?: StatusbarTone }" description="Animated pulse indicator" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ShellLayoutShowcase() {
  return (
    <div>
      <PageHeader name="ShellLayout" description="Full application shell. Composes AppTitle, Sidebar, Topbar, Statusbar and a canvas content area." />
      <ShowcaseSection label="Structure" description="ShellLayout renders the full-screen shell you're looking at right now. Each slot accepts the corresponding component's props.">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', height: 320 }}>
          <ShellLayout
            appTitle={{ title: 'Heimdall', version: 'v0.1.0' }}
            sidebar={{
              sections: [
                { title: 'Nav', items: [
                  { id: 'a', label: 'Page A', icon: 'dashboard' as const },
                  { id: 'b', label: 'Page B', icon: 'schema' as const },
                ]},
              ],
              activeItemId: 'a',
              onSelectItem: () => {},
              onCollapse: () => {},
            }}
            topbar={{ breadcrumbs: [{ label: 'Page A' }] }}
            statusbar={{ right: <span>ShellLayout demo</span> }}
          >
            <div style={{ padding: 22, color: 'rgb(var(--canvas-fg-2, 55 65 81))', fontSize: 13 }}>
              Canvas content area
            </div>
          </ShellLayout>
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="appTitle" type="AppTitleProps & { hide? }" description="App title slot — brand mark + name + version at top of sidebar. Pass hide: true to omit." />
          <PropRow name="sidebar" type="SidebarProps & { hide? }" description="Sidebar slot. Pass hide: true to omit it." />
          <PropRow name="topbar" type="TopbarProps & { hide? }" description="Topbar slot. Pass hide: true to omit it." />
          <PropRow name="statusbar" type="StatusbarProps & { hide? }" description="Statusbar slot. Pass hide: true to omit it." />
          <PropRow name="children" type="ReactNode" description="Canvas content" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
