import { useState } from 'react'
import { DiffViewer, VersionTimeline, type VersionEntry, type DiffLine } from '../components'

export default function DiffViewerTestPage() {
  const smallAdded = ['user_id_1', 'user_id_2']
  const smallRemoved = ['user_id_3']
  const smallKept = ['user_id_4', 'user_id_5', 'user_id_6']

  const largeAdded = Array.from({ length: 35 }, (_, i) => `item_added_${i + 1}`)
  const largeRemoved = Array.from({ length: 28 }, (_, i) => `item_removed_${i + 1}`)
  const largeKept = Array.from({ length: 150 }, (_, i) => `item_kept_${i + 1}`)

  const diffLines: DiffLine[] = [
    { type: 'hunk', content: '@@ -12,7 +12,9 @@ export function processData(input: string) {' },
    { type: 'context', content: '  const lines = input.split("\\n")', lineNumber: 12 },
    { type: 'context', content: '  const filtered = lines.filter(Boolean)', lineNumber: 13 },
    { type: 'removed', content: '  return filtered.map(String)', lineNumber: 14 },
    { type: 'added', content: '  const mapped = filtered.map(String)', lineNumber: 14 },
    { type: 'added', content: '  return mapped.join("\\n")', lineNumber: 15 },
    { type: 'context', content: '}', lineNumber: 16 },
    { type: 'hunk', content: '@@ -24,5 +26,12 @@ export const API_CONFIG = {' },
    { type: 'context', content: '  baseUrl: "https://api.example.com",', lineNumber: 24 },
    { type: 'removed', content: '  timeout: 5000,', lineNumber: 25 },
    { type: 'added', content: '  timeout: 10000,', lineNumber: 25 },
    { type: 'added', content: '  retries: 3,', lineNumber: 26 },
    { type: 'context', content: '  headers: {', lineNumber: 27 },
    { type: 'context', content: '    "Content-Type": "application/json",', lineNumber: 28 },
    { type: 'context', content: '  },', lineNumber: 29 },
    { type: 'context', content: '}', lineNumber: 30 },
  ]

  const largeDiffLines: DiffLine[] = [
    { type: 'hunk', content: '@@ -1,20 +1,25 @@ function largeChanges() {' },
    ...Array.from({ length: 120 }, (_, i) => ({
      type: (i % 5 === 0 ? 'added' : i % 7 === 0 ? 'removed' : 'context') as DiffLine['type'],
      content: `line_content_${i + 1}: some code or text that may be quite long`,
      lineNumber: i + 1,
    })),
  ]

  const emptyDiffLines: DiffLine[] = []

  const versionEntries: VersionEntry[] = [
    {
      id: 'v3',
      label: 'v3.2.1',
      headline: 'Latest changes',
      timestamp: new Date(Date.now()),
      head: true,
      stats: { added: 12, removed: 5, kept: 156 },
    },
    {
      id: 'v2',
      label: 'v3.2.0',
      headline: 'Previous release',
      timestamp: new Date(Date.now() - 86400000),
      stats: { added: 35, removed: 28, kept: 150 },
    },
    {
      id: 'v1',
      label: 'v3.1.9',
      headline: 'Earlier version',
      timestamp: new Date(Date.now() - 172800000),
      stats: { added: 8, removed: 3, kept: 160 },
    },
  ]

  const [selectedVersionId, setSelectedVersionId] = useState('v3')
  const [diffMode, setDiffMode] = useState<'hash-set' | 'side-by-side'>('hash-set')

  const selectedVersion = versionEntries.find(v => v.id === selectedVersionId)
  const isLatest = selectedVersion?.id === 'v3'

  return (
    <div style={{ padding: '22px 26px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <section style={{ marginBottom: '48px' }}>
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
          DiffViewer · With VersionTimeline
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
          <div>
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
              Version Timeline
            </div>
            <VersionTimeline
              entries={versionEntries}
              selectedId={selectedVersionId}
              onSelect={setSelectedVersionId}
              order="newest-first"
            />
          </div>

          <div>
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
              {isLatest ? 'Hash Set View (Latest)' : 'Side by Side View'}
            </div>
            <DiffViewer mode={diffMode} onModeChange={setDiffMode}>
              {diffMode === 'hash-set' && (
                <DiffViewer.HashSet
                  added={smallAdded}
                  removed={smallRemoved}
                  kept={smallKept}
                  maxVisible={10}
                  label={selectedVersion?.label}
                  labelTone="amber"
                />
              )}
              {diffMode === 'side-by-side' && (
                <DiffViewer.SideBySide
                  lines={diffLines}
                  addedLabel={`Added in ${selectedVersion?.label}`}
                  removedLabel={`Removed in ${selectedVersion?.label}`}
                  addedLabelTone="emerald"
                  removedLabelTone="rose"
                />
              )}
            </DiffViewer>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '48px' }}>
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
          DiffViewer · Hash Set View
        </div>
        <DiffViewer mode="hash-set">
          <DiffViewer.HashSet
            added={smallAdded}
            removed={smallRemoved}
            kept={smallKept}
            maxVisible={10}
            label="Small Dataset"
          />
        </DiffViewer>
      </section>

      <section style={{ marginBottom: '48px' }}>
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
          DiffViewer · Hash Set View (Large Dataset)
        </div>
        <DiffViewer mode="hash-set">
          <DiffViewer.HashSet
            added={largeAdded}
            removed={largeRemoved}
            kept={largeKept}
            maxVisible={8}
            label="Large Dataset"
          />
        </DiffViewer>
      </section>

      <section style={{ marginBottom: '48px' }}>
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
          DiffViewer · Hash Set View (Empty State)
        </div>
        <DiffViewer mode="hash-set">
          <DiffViewer.HashSet added={[]} removed={[]} kept={[]} label="Empty" />
        </DiffViewer>
      </section>

      <section style={{ marginBottom: '48px' }}>
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
          DiffViewer · Side by Side View (Small Diff)
        </div>
        <DiffViewer mode="side-by-side">
          <DiffViewer.SideBySide
            lines={diffLines}
            addedLabel="Current Version"
            removedLabel="Previous Version"
          />
        </DiffViewer>
      </section>

      <section style={{ marginBottom: '48px' }}>
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
          DiffViewer · Side by Side View (Large Diff)
        </div>
        <DiffViewer mode="side-by-side">
          <DiffViewer.SideBySide
            lines={largeDiffLines}
            addedLabel="Current Version"
            removedLabel="Previous Version"
          />
        </DiffViewer>
      </section>

      <section style={{ marginBottom: '48px' }}>
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
          DiffViewer · Side by Side View (Empty State)
        </div>
        <DiffViewer mode="side-by-side">
          <DiffViewer.SideBySide lines={emptyDiffLines} />
        </DiffViewer>
      </section>
    </div>
  )
}
