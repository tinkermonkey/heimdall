import { useState } from 'react'
import { VersionTimeline, type VersionEntry } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

export function VersionTimelineShowcase() {
  const entries: VersionEntry[] = [
    {
      id: 'v3.2.1',
      label: 'v3.2.1',
      headline: 'Bug fix release',
      timestamp: '2026-06-05T14:30:00Z',
      head: true,
      stats: { added: 2, removed: 3, kept: 145 },
    },
    {
      id: 'v3.2.0',
      label: 'v3.2.0',
      headline: 'Feature release with new components',
      timestamp: '2026-06-01T10:15:00Z',
      stats: { added: 12, removed: 5, kept: 140 },
    },
    {
      id: 'v3.1.5',
      label: 'v3.1.5',
      headline: 'Performance improvements',
      timestamp: '2026-05-25T08:00:00Z',
      transition: { from: 'stable', to: 'deprecated' },
    },
    {
      id: 'v3.1.0',
      label: 'v3.1.0',
      timestamp: '2026-05-20T16:45:00Z',
      stats: { added: 8, removed: 2, kept: 135 },
    },
    {
      id: 'v3.0.0',
      label: 'v3.0.0',
      headline: 'Major version bump',
      timestamp: '2026-05-10T12:00:00Z',
      stats: { added: 25, removed: 15, kept: 130 },
    },
  ]

  const [selectedId, setSelectedId] = useState<string>('v3.2.1')
  const [order, setOrder] = useState<'newest-first' | 'oldest-first'>('newest-first')

  return (
    <div>
      <PageHeader
        name="VersionTimeline"
        description="Vertical timeline display for version history with selection support, keyboard navigation, and optional state transition or diff statistics display."
      />

      <ShowcaseSection label="Basic Timeline">
        <div style={{ maxWidth: '500px' }}>
          <VersionTimeline entries={entries} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Order Toggle">
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setOrder('newest-first')}
            style={{
              padding: '8px 12px',
              background: order === 'newest-first' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: order === 'newest-first' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Newest First
          </button>
          <button
            type="button"
            onClick={() => setOrder('oldest-first')}
            style={{
              padding: '8px 12px',
              background: order === 'oldest-first' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: order === 'oldest-first' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Oldest First
          </button>
        </div>
        <div style={{ maxWidth: '500px' }}>
          <VersionTimeline entries={entries} selectedId={selectedId} onSelect={setSelectedId} order={order} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Empty State">
        <div style={{ maxWidth: '500px' }}>
          <VersionTimeline entries={[]} emptyState="No version history available" />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Vertical timeline:</strong> Visual representation of version history with connector lines between entries
          </li>
          <li>
            <strong>Head indicator:</strong> Amber dot and "head" chip mark the current version
          </li>
          <li>
            <strong>Diff statistics:</strong> Optional display of added, removed, and kept items
          </li>
          <li>
            <strong>State transitions:</strong> Show transitions between states (e.g., stable → deprecated)
          </li>
          <li>
            <strong>Timestamps:</strong> Formatted timestamps on the right for each entry
          </li>
          <li>
            <strong>Selection:</strong> Click to select an entry with visual highlight
          </li>
          <li>
            <strong>Keyboard navigation:</strong> Arrow keys to move between entries, Enter to select
          </li>
          <li>
            <strong>Order control:</strong> Toggle between newest-first and oldest-first ordering
          </li>
          <li>
            <strong>Auto-scroll:</strong> Selected entry automatically scrolls into view
          </li>
          <li>
            <strong>Empty state:</strong> Customizable message when no versions available
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="entries" type="VersionEntry[]" description="Array of version entries to display" required />
          <PropRow name="selectedId" type="string" description="ID of the currently selected entry" />
          <PropRow
            name="onSelect"
            type="(id: string) => void"
            description="Fired when an entry is clicked or keyboard-selected"
          />
          <PropRow
            name="order"
            type="'newest-first' | 'oldest-first'"
            def="newest-first"
            description="Display order of entries"
          />
          <PropRow name="emptyState" type="string" def="No versions available" description="Message shown when entries is empty" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="VersionEntry Type">
        <PropsTable>
          <PropRow name="id" type="string" description="Unique entry identifier" required />
          <PropRow name="label" type="string" description="Version label (e.g., v3.2.1)" required />
          <PropRow name="headline" type="string" description="Optional headline describing the version" />
          <PropRow name="timestamp" type="Date | string" description="Release timestamp" required />
          <PropRow name="head" type="boolean" description="When true, renders with filled dot and 'head' chip" />
          <PropRow
            name="stats"
            type="DiffStats"
            description="Optional diff statistics with added, removed, and kept counts"
          />
          <PropRow
            name="transition"
            type="StateTransition"
            description="Optional state transition with from and to values"
          />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Keyboard Shortcuts">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: '16px',
            fontSize: '13px',
            color: 'rgb(var(--canvas-fg-1))',
          }}
        >
          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>↑</div>
          <div>Select previous entry</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>↓</div>
          <div>Select next entry</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Enter / Space</div>
          <div>Activate current selection</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
