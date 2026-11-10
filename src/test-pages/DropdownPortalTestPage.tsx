import { useState, type CSSProperties, type ReactNode } from 'react'
import { RowMenu, type RowMenuAction } from '../components/RowMenu'
import { Select } from '../components/Select'
import { Popover } from '../components/Popover'
import { Button } from '../components/Button'

// Test page for #328: dropdown panels inside clipping containers.
// Each frame is a small overflow:auto box, like a horizontally scrolling table
// frame, with a RowMenu in a 48px last column flush against its right edge.

const actions: RowMenuAction[] = [
  { id: 'edit', label: 'Edit', icon: 'edit' },
  { id: 'duplicate', label: 'Duplicate', icon: 'copy' },
  { type: 'separator' },
  { id: 'delete', label: 'Delete', icon: 'trash', danger: true },
]

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(var(--canvas-fg-3))',
  marginBottom: '10px',
}

const frame: CSSProperties = {
  width: 220,
  height: 120,
  overflow: 'auto',
  border: '1px solid rgb(var(--canvas-border))',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'rgb(var(--canvas-card))',
}

function ScrollFrame({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <div style={frame} data-testid={testId}>
      {/* Taller than the frame so it can scroll vertically. */}
      <div style={{ height: 320 }}>
        {['cls_organism', 'cls_cell', 'cls_tissue'].map((id) => (
          <div
            key={id}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 40,
              borderBottom: '1px solid rgb(var(--canvas-border))',
            }}
          >
            <code style={{ flex: 1, paddingLeft: 10, fontSize: 12, color: 'rgb(var(--canvas-fg-1))' }}>{id}</code>
            <div style={{ width: 48, display: 'flex', justifyContent: 'center' }}>
              {id === 'cls_organism' ? children : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DropdownPortalTestPage() {
  const [lastAction, setLastAction] = useState('none')
  const [kind, setKind] = useState('')

  return (
    <div style={{ padding: '22px 28px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <section>
          <div style={eyebrow}>Portal (default)</div>
          <ScrollFrame testId="frame-portal">
            <RowMenu
              actions={actions}
              onAction={setLastAction}
              triggerLabel="Actions for cls_organism"
              data-testid="row-menu-portal"
            />
          </ScrollFrame>
        </section>

        <section>
          <div style={eyebrow}>portal=false</div>
          <ScrollFrame testId="frame-inline">
            <RowMenu
              actions={actions}
              onAction={setLastAction}
              portal={false}
              triggerLabel="Actions for cls_organism"
              data-testid="row-menu-inline"
            />
          </ScrollFrame>
        </section>

        <section>
          <div style={eyebrow}>Select in overflow:hidden</div>
          <div
            data-testid="frame-select"
            style={{ ...frame, width: 200, height: 60, overflow: 'hidden', padding: 10, boxSizing: 'border-box' }}
          >
            <Select value={kind} onChange={setKind} placeholder="Kind" data-testid="select-portal">
              <Select.Item value="class">Class</Select.Item>
              <Select.Item value="property">Property</Select.Item>
              <Select.Item value="individual">Individual</Select.Item>
            </Select>
          </div>
        </section>

        <section>
          <div style={eyebrow}>Select in Popover</div>
          <Popover>
            <Popover.Trigger>
              <Button variant="secondary" size="sm" data-testid="popover-trigger">
                Edit kind
              </Button>
            </Popover.Trigger>
            <Popover.Panel aria-label="Edit kind">
              <div style={{ padding: 12 }} data-testid="popover-content">
                <Select value={kind} onChange={setKind} placeholder="Kind" data-testid="select-in-popover">
                  <Select.Item value="class">Class</Select.Item>
                  <Select.Item value="property">Property</Select.Item>
                </Select>
              </div>
            </Popover.Panel>
          </Popover>
        </section>
      </div>

      <div style={{ marginTop: 24, fontSize: 13, color: 'rgb(var(--canvas-fg-2))' }}>
        Last action: <code data-testid="last-action">{lastAction}</code> · Kind:{' '}
        <code data-testid="kind">{kind || 'none'}</code>
      </div>

      {/* Pinned to the bottom-right corner: the panel must flip up and left. */}
      <div style={{ position: 'fixed', right: 8, bottom: 8 }}>
        <RowMenu actions={actions} onAction={setLastAction} data-testid="row-menu-corner" />
      </div>
    </div>
  )
}
