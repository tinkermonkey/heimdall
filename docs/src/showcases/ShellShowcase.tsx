import { AppTitle, Titlebar, Statusbar, ShellLayout, Icon, type StatusbarItem } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const border = 'rgb(var(--canvas-border, 229 231 235))'

export function TitlebarShowcase() {
  return (
    <div>
      <PageHeader name="Titlebar" description="Fixed-height header bar at the top of the shell. Three slots — left, center, right — each accepts any ReactNode." />
      <ShowcaseSection label="Left and right slots">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Titlebar
            left={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>heimdall</span>}
            right={
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--shell-fg-2))', fontSize: 13, padding: '0 4px' }}>
                <Icon name="settings" size={14} />
                Settings
              </button>
            }
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="With center slot">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Titlebar
            left={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>heimdall</span>}
            center={
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(var(--shell-fg-3))' }}>
                production
              </span>
            }
            right={<Icon name="bell" size={14} />}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Left only">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Titlebar
            left={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="dashboard" size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Overview</span>
              </div>
            }
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="left" type="ReactNode" description="Left slot — brand mark, app name, or navigation controls" />
          <PropRow name="center" type="ReactNode" description="Center slot — expands to fill available space, content is centered" />
          <PropRow name="right" type="ReactNode" description="Right slot — actions, settings, user controls" />
          <PropRow name="role" type="string" def="banner" description="ARIA landmark role" />
          <PropRow name="aria-label" type="string" def="Application titlebar" description="Accessible label for the landmark region" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

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
          <PropRow name="aria-label" type="string" description="Accessible label for the banner region. Defaults to title + version." />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function StatusbarShowcase() {
  const leftItems: StatusbarItem[] = [
    { kind: 'pulse', tone: 'emerald', label: 'connected' },
    { kind: 'divider' },
    { kind: 'icon', icon: 'check', label: 'no errors' },
  ]

  const rightItems: StatusbarItem[] = [
    { kind: 'pulse', tone: 'amber', label: 'Ln 42, Col 8', mono: true },
    { kind: 'divider' },
    { kind: 'icon', icon: 'info', label: 'info' },
  ]

  const toneItems: StatusbarItem[] = [
    { kind: 'pulse', tone: 'emerald', label: 'ok' },
    { kind: 'divider' },
    { kind: 'pulse', tone: 'cyan', label: 'updating' },
    { kind: 'divider' },
    { kind: 'pulse', tone: 'rose', label: 'error' },
    { kind: 'divider' },
    { kind: 'pulse', tone: 'amber', label: 'warning' },
    { kind: 'divider' },
    { kind: 'pulse', tone: 'violet', label: 'secondary' },
    { kind: 'divider' },
    { kind: 'pulse', tone: 'neutral', label: 'idle' },
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
      <ShowcaseSection label="With structured items">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Statusbar left={leftItems} right={rightItems} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="All pulse tones">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Statusbar left={toneItems} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="left" type="ReactNode | StatusbarItem[]" description="Left slot — ReactNode or structured items array" />
          <PropRow name="center" type="ReactNode | StatusbarItem[]" description="Center slot — ReactNode or structured items array" />
          <PropRow name="right" type="ReactNode | StatusbarItem[]" description="Right slot — ReactNode or structured items array" />
          <PropRow name="StatusbarItem (pulse)" type="{ kind: 'pulse'; tone: StatusbarTone; label: string; mono?: boolean }" description="Animated pulse indicator with tone and label. mono renders label in monospace." />
          <PropRow name="StatusbarItem (icon)" type="{ kind: 'icon'; icon: IconName; label?: string; mono?: boolean }" description="Icon element with optional visible label and aria-label for accessibility." />
          <PropRow name="StatusbarItem (divider)" type="{ kind: 'divider' }" description="Vertical divider line" />
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
          <PropRow name="titlebar" type="TitlebarProps & { hide? }" description="Titlebar slot — fixed header row above all content. Pass hide: true to omit." />
          <PropRow name="appTitle" type="AppTitleProps & { hide? }" description="App title slot — brand mark + name + version at top of sidebar. Pass hide: true to omit." />
          <PropRow name="sidebar" type="SidebarProps & { hide? }" description="Sidebar slot. Pass hide: true to omit it." />
          <PropRow name="topbar" type="TopbarProps & { hide? }" description="Topbar slot. Pass hide: true to omit it." />
          <PropRow name="statusbar" type="StatusbarProps & { hide? }" description="Statusbar slot. Pass hide: true to omit it." />
          <PropRow name="children" type="ReactNode" description="Canvas content rendered inside the main content area" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
