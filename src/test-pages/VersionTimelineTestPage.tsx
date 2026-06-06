import { useState } from 'react'
import { VersionTimeline, type VersionEntry } from '../components/VersionTimeline'

export default function VersionTimelineTestPage() {
  const [selectedId, setSelectedId] = useState<string>('v2')
  const [selectedIdNewest, setSelectedIdNewest] = useState<string>('v1')

  const entries: VersionEntry[] = [
    {
      id: 'v1',
      label: 'v1.2.3',
      timestamp: new Date(Date.now() - 5 * 60000),
      head: true,
    },
    {
      id: 'v2',
      label: 'v1.2.2',
      timestamp: new Date(Date.now() - 2 * 3600000),
      stats: {
        added: 12,
        removed: 3,
        kept: 45,
      },
    },
    {
      id: 'v3',
      label: 'v1.2.1',
      timestamp: new Date(Date.now() - 24 * 3600000),
      stats: {
        added: 8,
        removed: 5,
        kept: 40,
      },
    },
    {
      id: 'v4',
      label: 'v1.2.0',
      timestamp: new Date(Date.now() - 48 * 3600000),
      transition: {
        from: 'beta',
        to: 'stable',
      },
    },
    {
      id: 'v5',
      label: 'v1.1.9',
      timestamp: new Date(Date.now() - 7 * 24 * 3600000),
      stats: {
        added: 3,
        removed: 2,
        kept: 50,
      },
    },
  ]

  return (
    <div style={{ padding: '22px 26px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          VersionTimeline · Default (Newest First)
        </div>
        <div style={{ maxWidth: '500px' }}>
          <VersionTimeline
            entries={entries}
            selectedId={selectedIdNewest}
            onSelect={setSelectedIdNewest}
            order="newest-first"
          />
        </div>
        <div style={{ marginTop: '14px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
          Selected: {selectedIdNewest}
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          VersionTimeline · Oldest First
        </div>
        <div style={{ maxWidth: '500px' }}>
          <VersionTimeline
            entries={entries}
            selectedId={selectedId}
            onSelect={setSelectedId}
            order="oldest-first"
          />
        </div>
        <div style={{ marginTop: '14px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
          Selected: {selectedId}
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          VersionTimeline · Single Entry (No Connector Rail)
        </div>
        <div style={{ maxWidth: '500px' }}>
          <VersionTimeline
            entries={[entries[0]]}
            selectedId={entries[0].id}
            onSelect={() => {}}
          />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          VersionTimeline · Empty State
        </div>
        <div style={{ maxWidth: '500px' }}>
          <VersionTimeline
            entries={[]}
            emptyState="No version history available"
          />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          VersionTimeline · Read-Only (No Selection)
        </div>
        <div style={{ maxWidth: '500px' }}>
          <VersionTimeline entries={entries} />
        </div>
      </section>
    </div>
  )
}
