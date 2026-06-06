import { useState } from 'react'
import { DiffViewer, type DiffLine } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

export function DiffViewerShowcase() {
  const sampleAddedItems = ['schema.version', 'metadata.author', 'metadata.created', 'config.debug']
  const sampleRemovedItems = ['old_field', 'deprecated_key']
  const sampleKeptItems = [
    'name',
    'description',
    'type',
    'status',
    'owner',
    'tags',
    'permissions',
    'version',
    'created_at',
    'updated_at',
    'archived',
    'source',
  ]

  const sampleDiffLines: DiffLine[] = [
    { type: 'context', content: 'export interface User {' },
    { type: 'context', content: '  id: string' },
    { type: 'removed', content: '  email: string' },
    { type: 'added', content: '  emailAddress: string' },
    { type: 'context', content: '  name: string' },
    { type: 'context', content: '  createdAt: Date' },
    { type: 'removed', content: '  isActive: boolean' },
    { type: 'added', content: '  status: "active" | "inactive" | "pending"' },
    { type: 'context', content: '  metadata?: Record<string, any>' },
    { type: 'hunk', content: '@@ -24,5 +25,8 @@' },
    { type: 'added', content: '  tags: string[]' },
    { type: 'context', content: '  permissions: string[]' },
    { type: 'context', content: '}' },
  ]

  const [mode, setMode] = useState<'hash-set' | 'side-by-side'>('hash-set')

  return (
    <div>
      <PageHeader
        name="DiffViewer"
        description="Compound component for displaying diffs in two modes: Hash Set (added/removed/kept items) or Side-by-Side (line-based diff). Supports mode switching with keyboard navigation and virtualized rendering."
      />

      <ShowcaseSection label="Hash Set Mode">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <DiffViewer mode="hash-set" onModeChange={setMode}>
            <DiffViewer.HashSet
              added={sampleAddedItems}
              removed={sampleRemovedItems}
              kept={sampleKeptItems}
              label="Schema Changes"
              labelTone="amber"
            />
          </DiffViewer>
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Side-by-Side Mode">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <DiffViewer mode="side-by-side" onModeChange={setMode}>
            <DiffViewer.SideBySide
              lines={sampleDiffLines}
              addedLabel="Updated Type Definition"
              removedLabel="Previous Type Definition"
            />
          </DiffViewer>
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Controlled Mode Example">
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setMode('hash-set')}
            style={{
              padding: '8px 12px',
              background: mode === 'hash-set' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: mode === 'hash-set' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Hash Set
          </button>
          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            style={{
              padding: '8px 12px',
              background: mode === 'side-by-side' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: mode === 'side-by-side' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Side-by-Side
          </button>
        </div>
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <DiffViewer mode={mode} onModeChange={setMode}>
            <DiffViewer.HashSet
              added={sampleAddedItems}
              removed={sampleRemovedItems}
              kept={sampleKeptItems}
              label="Schema Changes"
            />
            <DiffViewer.SideBySide lines={sampleDiffLines} />
          </DiffViewer>
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Dual visualization modes:</strong> Hash Set for item changes or Side-by-Side for line-based diffs
          </li>
          <li>
            <strong>Mode switching:</strong> Tab-based navigation to switch between modes
          </li>
          <li>
            <strong>Hash Set view:</strong> Three-column layout showing added (emerald), removed (rose), and kept (amber) items
          </li>
          <li>
            <strong>Side-by-Side view:</strong> Line-by-line diff with syntax highlighting and context lines
          </li>
          <li>
            <strong>Virtualized rendering:</strong> Efficient rendering for large diffs using virtual scrolling
          </li>
          <li>
            <strong>Customizable labels:</strong> Optional labels with configurable tone (amber, emerald, rose, etc.)
          </li>
          <li>
            <strong>Expand/collapse:</strong> Hash Set shows configurable preview with expand button for hidden items
          </li>
          <li>
            <strong>Hunk markers:</strong> Side-by-Side includes hunk headers for context
          </li>
          <li>
            <strong>Keyboard navigation:</strong> Arrow keys and Home/End to navigate between mode tabs
          </li>
          <li>
            <strong>Accessibility:</strong> Full ARIA roles and labels for screen readers
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="DiffViewer Props">
        <PropsTable>
          <PropRow
            name="mode"
            type="'hash-set' | 'side-by-side'"
            def="hash-set"
            description="Initial visualization mode"
          />
          <PropRow name="onModeChange" type="(mode: DiffViewerMode) => void" description="Fired when mode tab is clicked" />
          <PropRow name="children" type="ReactNode" description="DiffViewer.HashSet and/or DiffViewer.SideBySide components" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="HashSet Props">
        <PropsTable>
          <PropRow name="added" type="string[]" description="Array of added items" />
          <PropRow name="removed" type="string[]" description="Array of removed items" />
          <PropRow name="kept" type="string[]" description="Array of kept/unchanged items" />
          <PropRow name="maxVisible" type="number" def="10" description="Maximum number of kept items to show before collapse" />
          <PropRow name="label" type="string" def="Changes" description="Header label for the changes" />
          <PropRow name="labelTone" type="VersionPillTone" def="amber" description="Color tone of the label" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="SideBySide Props">
        <PropsTable>
          <PropRow name="lines" type="DiffLine[]" description="Array of diff lines with type and content" />
          <PropRow name="addedLabel" type="string" def="Version 2 (Added)" description="Label for added changes side" />
          <PropRow name="removedLabel" type="string" def="Version 1 (Removed)" description="Label for removed changes side" />
          <PropRow name="addedLabelTone" type="VersionPillTone" def="emerald" description="Color tone for added label" />
          <PropRow name="removedLabelTone" type="VersionPillTone" def="rose" description="Color tone for removed label" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="DiffLine Type">
        <PropsTable>
          <PropRow
            name="type"
            type="'context' | 'added' | 'removed' | 'hunk'"
            description="Line classification: context (unchanged), added, removed, or hunk header"
            required
          />
          <PropRow name="content" type="string" description="The diff line content/text" required />
          <PropRow name="lineNumber" type="number" description="Optional line number reference" />
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
          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>← / →</div>
          <div>Navigate between mode tabs</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Home / End</div>
          <div>Jump to first or last mode tab</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Tab</div>
          <div>Focus next mode tab</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
