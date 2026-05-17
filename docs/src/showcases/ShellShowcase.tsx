import { Titlebar, Statusbar, ShellLayout, Icon, Button } from '@heimdall/ui'
import { PageHeader, ShowcaseSection, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

const border = 'rgb(var(--canvas-border, 229 231 235))'

export function TitlebarShowcase() {
  return (
    <div>
      <PageHeader name="Titlebar" description="Fixed-height application title bar at the very top of the shell. Three slots: left, center, right." />
      <ShowcaseSection label="Left + center + right">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Titlebar
            left={<span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, fontWeight: 600 }}>heimdall</span>}
            center={<span style={{ fontSize: 12 }}>Context Studio</span>}
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                <Icon name="bell" size={14} />
                <Icon name="settings" size={14} />
              </div>
            }
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Left only">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
          <Titlebar left={<span style={{ fontSize: 13, fontWeight: 600 }}>Application Title</span>} />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="left" type="ReactNode" description="Left slot — typically app name or logo" />
          <PropRow name="center" type="ReactNode" description="Center slot — typically page or workspace title" />
          <PropRow name="right" type="ReactNode" description="Right slot — typically icons and actions" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function StatusbarShowcase() {
  return (
    <div>
      <PageHeader name="Statusbar" description="Fixed footer bar at the bottom of the shell. Three slots: left, center, right. Monospace text, small." />
      <ShowcaseSection label="With left and right">
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
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="left" type="ReactNode" description="Left slot" />
          <PropRow name="center" type="ReactNode" description="Center slot" />
          <PropRow name="right" type="ReactNode" description="Right slot" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ShellLayoutShowcase() {
  return (
    <div>
      <PageHeader name="ShellLayout" description="Full application shell. Composes Titlebar, Sidebar, Topbar, Statusbar and a canvas content area." />
      <ShowcaseSection label="Structure" description="ShellLayout renders the full-screen shell you're looking at right now. Each slot accepts the corresponding component's props.">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', height: 320 }}>
          <ShellLayout
            titlebar={{ left: <span style={{ fontSize: 13, fontWeight: 600 }}>heimdall</span>, center: <span style={{ fontSize: 12 }}>Demo</span> }}
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
          <PropRow name="titlebar" type="TitlebarProps & { hide? }" description="Titlebar slot. Pass hide: true to omit it." />
          <PropRow name="sidebar" type="SidebarProps & { hide? }" description="Sidebar slot. Pass hide: true to omit it." />
          <PropRow name="topbar" type="TopbarProps & { hide? }" description="Topbar slot. Pass hide: true to omit it." />
          <PropRow name="statusbar" type="StatusbarProps & { hide? }" description="Statusbar slot. Pass hide: true to omit it." />
          <PropRow name="children" type="ReactNode" description="Canvas content" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
