import { useState } from 'react'
import { Panel, Drawer, SplitPane, Button, Icon } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, DemoGrid, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

const border = 'rgb(var(--canvas-border, 229 231 235))'
const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'

export function PanelShowcase() {
  return (
    <div>
      <PageHeader name="Panel" description="Card container with optional title, subtitle, and footer. 8px radius, border only (no shadow)." />
      <ShowcaseSection label="With title">
        <Panel title="Schema classes">
          <p style={{ margin: 0, fontSize: 13, color: fg2 }}>Panel body content goes here. Padding is applied by the panel itself.</p>
        </Panel>
      </ShowcaseSection>
      <ShowcaseSection label="With title and subtitle">
        <Panel title="life.organism" subtitle="428 individuals · last synced 2m ago">
          <p style={{ margin: 0, fontSize: 13, color: fg2 }}>Detailed class view with metadata in the subtitle slot.</p>
        </Panel>
      </ShowcaseSection>
      <ShowcaseSection label="With footer">
        <Panel
          title="Import data"
          footer={
            <DemoRow>
              <Button variant="ghost" size="sm">Cancel</Button>
              <Button variant="primary" size="sm">Import</Button>
            </DemoRow>
          }
        >
          <p style={{ margin: 0, fontSize: 13, color: fg2 }}>Panel with a footer slot — use for action buttons.</p>
        </Panel>
      </ShowcaseSection>
      <ShowcaseSection label="Without border">
        <Panel bordered={false} title="Borderless panel">
          <p style={{ margin: 0, fontSize: 13, color: fg2 }}>Pass bordered=false to remove the border — useful when the parent already provides a container.</p>
        </Panel>
      </ShowcaseSection>
      <ShowcaseSection label="With header action">
        <Panel
          title="Schema classes"
          subtitle="life.organism"
          headerAction={<Button variant="ghost" size="sm"><Icon name="settings" size={14} /></Button>}
        >
          <p style={{ margin: 0, fontSize: 13, color: fg2 }}>headerAction renders a flex container at the trailing edge of the header row.</p>
        </Panel>
      </ShowcaseSection>
      <ShowcaseSection label="No body padding">
        <Panel title="Compact list" noPadding>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {['life.organism', 'cls_4f3a', 'sys.pipeline'].map((id, i) => (
              <div key={id} style={{ padding: '10px 16px', borderTop: i === 0 ? 'none' : `1px solid ${border}`, fontSize: 13, color: fg2, fontFamily: 'var(--font-mono, monospace)' }}>{id}</div>
            ))}
          </div>
        </Panel>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="title" type="string" description="Panel header title" />
          <PropRow name="subtitle" type="string" description="Secondary line in the header" />
          <PropRow name="headerAction" type="ReactNode" description="Trailing action slot in the header row" />
          <PropRow name="footer" type="ReactNode" description="Footer slot with top border" />
          <PropRow name="bordered" type="boolean" def="true" description="Show/hide the outer border" />
          <PropRow name="noPadding" type="boolean" def="false" description="Remove body padding for edge-to-edge content" />
          <PropRow name="children" type="ReactNode" description="Panel body" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function DrawerShowcase() {
  const [rightOpen, setRightOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)
  const [wideOpen, setWideOpen] = useState(false)
  const [noTitleOpen, setNoTitleOpen] = useState(false)

  return (
    <div>
      <PageHeader name="Drawer" description="Slide-in panel from the left or right edge of the screen. Backdrop dismisses it." />
      <ShowcaseSection label="Positions and sizes">
        <DemoRow>
          <Button onClick={() => setRightOpen(true)}>Right drawer (default)</Button>
          <Button variant="secondary" onClick={() => setLeftOpen(true)}>Left drawer</Button>
          <Button variant="ghost" onClick={() => setWideOpen(true)}>Wide right (480px)</Button>
        </DemoRow>
        <Drawer isOpen={rightOpen} onClose={() => setRightOpen(false)} title="Record details" position="right">
          <div style={{ padding: '0 0 16px', color: fg2, fontSize: 13, lineHeight: 1.65 }}>
            <div style={{ marginBottom: 16, borderBottom: `1px solid ${border}`, paddingBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, marginBottom: 4 }}>Identifier</div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}>life.organism · cls_4f3a</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, marginBottom: 4 }}>Description</div>
              <div>Biological organisms classified by kingdom, phylum, and species.</div>
            </div>
          </div>
        </Drawer>
        <Drawer isOpen={leftOpen} onClose={() => setLeftOpen(false)} title="Navigation" position="left">
          <div style={{ color: fg2, fontSize: 13 }}>Left drawer content — typically secondary navigation or filters.</div>
        </Drawer>
        <Drawer isOpen={wideOpen} onClose={() => setWideOpen(false)} title="Wide drawer" position="right" width="480px">
          <div style={{ color: fg2, fontSize: 13 }}>Wide drawer — pass a custom width prop for form-heavy or multi-column content.</div>
        </Drawer>
      </ShowcaseSection>
      <ShowcaseSection label="No title">
        <DemoRow>
          <Button variant="secondary" onClick={() => setNoTitleOpen(true)}>Drawer without title</Button>
        </DemoRow>
        <Drawer isOpen={noTitleOpen} onClose={() => setNoTitleOpen(false)}>
          <div style={{ color: fg2, fontSize: 13 }}>Omit the title prop for a header-free drawer. The close button is always present.</div>
        </Drawer>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="isOpen" type="boolean" description="Controls visibility" />
          <PropRow name="onClose" type="() => void" description="Called on Escape or backdrop click" />
          <PropRow name="title" type="string" description="Header title — omit to render without a header title" />
          <PropRow name="position" type="'left' | 'right'" def="'right'" description="Edge the drawer slides in from" />
          <PropRow name="width" type="string" def="'320px'" description="Drawer width (any CSS length)" />
          <PropRow name="children" type="ReactNode" description="Drawer body" />
          <PropRow name="className" type="string" description="Additional class names applied to the drawer panel" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function SplitPaneShowcase() {
  const [controlled, setControlled] = useState(35)

  return (
    <div>
      <PageHeader name="SplitPane" description="Resizable two-pane layout. Drag the divider or use arrow keys to redistribute space between panes." />
      <ShowcaseSection label="Horizontal split (default)">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', height: 200 }}>
          <SplitPane
            direction="horizontal"
            initialSplitPercent={40}
            first={
              <div style={{ padding: 16, fontSize: 13, color: fg2, height: '100%', boxSizing: 'border-box' }}>
                Left pane — drag the divider →
              </div>
            }
            second={
              <div style={{ padding: 16, fontSize: 13, color: fg2, height: '100%', boxSizing: 'border-box' }}>
                Right pane — expands as left shrinks
              </div>
            }
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Vertical split">
        <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', height: 240 }}>
          <SplitPane
            direction="vertical"
            initialSplitPercent={40}
            first={
              <div style={{ padding: 16, fontSize: 13, color: fg2, height: '100%', boxSizing: 'border-box' }}>
                Top pane
              </div>
            }
            second={
              <div style={{ padding: 16, fontSize: 13, color: fg2, height: '100%', boxSizing: 'border-box' }}>
                Bottom pane — drag the divider above
              </div>
            }
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Controlled split position">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: fg3, fontFamily: 'var(--font-mono)', minWidth: 80 }}>split: {Math.round(controlled)}%</span>
            <Button size="sm" variant="ghost" onClick={() => setControlled(25)}>25%</Button>
            <Button size="sm" variant="ghost" onClick={() => setControlled(50)}>50%</Button>
            <Button size="sm" variant="ghost" onClick={() => setControlled(75)}>75%</Button>
          </div>
          <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', height: 160 }}>
            <SplitPane
              direction="horizontal"
              splitPercent={controlled}
              onSplitChange={setControlled}
              minSize={100}
              maxSize={600}
              first={
                <div style={{ padding: 16, fontSize: 13, color: fg2, height: '100%', boxSizing: 'border-box' }}>
                  Left pane
                </div>
              }
              second={
                <div style={{ padding: 16, fontSize: 13, color: fg2, height: '100%', boxSizing: 'border-box' }}>
                  Right pane
                </div>
              }
            />
          </div>
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="direction" type="'horizontal' | 'vertical'" def="'horizontal'" description="Split orientation" />
          <PropRow name="initialSplitPercent" type="number" def="50" description="Starting split position as a percentage (uncontrolled)" />
          <PropRow name="splitPercent" type="number" description="Controlled split position as a percentage" />
          <PropRow name="onSplitChange" type="(percent: number) => void" description="Called when the split position changes" />
          <PropRow name="minSize" type="number" def="200" description="Minimum first-pane size in px" />
          <PropRow name="maxSize" type="number" def="800" description="Maximum first-pane size in px" />
          <PropRow name="first" type="ReactNode" description="Content for the first (left or top) pane" />
          <PropRow name="second" type="ReactNode" description="Content for the second (right or bottom) pane" />
          <PropRow name="dividerLabel" type="string" description="Accessible label for the divider element" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
