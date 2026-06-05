import { useState, useRef, useEffect } from 'react'
import { LogStream, type LogEntry } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

export function LogStreamShowcase() {
  const [staticEntries] = useState<LogEntry[]>([
    { id: 'log-1', timestamp: '2026-06-05T14:30:15Z', level: 'INFO', message: 'Server started on port 3000' },
    { id: 'log-2', timestamp: '2026-06-05T14:30:16Z', level: 'INFO', message: 'Database connection established' },
    { id: 'log-3', timestamp: '2026-06-05T14:30:18Z', level: 'INFO', message: 'Loading configuration from environment' },
    { id: 'log-4', timestamp: '2026-06-05T14:30:20Z', level: 'WARN', message: 'Deprecated middleware detected in route /api/v1' },
    { id: 'log-5', timestamp: '2026-06-05T14:30:22Z', level: 'INFO', message: 'Cache warmed up (15,432 entries)' },
    { id: 'log-6', timestamp: '2026-06-05T14:30:25Z', level: 'DEBUG', message: 'Health check endpoint responding normally' },
    { id: 'log-7', timestamp: '2026-06-05T14:30:27Z', level: 'INFO', message: 'Message queue listener initialized' },
    { id: 'log-8', timestamp: '2026-06-05T14:30:30Z', level: 'ERROR', message: 'Failed to connect to backup database, retrying...' },
    { id: 'log-9', timestamp: '2026-06-05T14:30:32Z', level: 'INFO', message: 'Backup database connection recovered' },
    { id: 'log-10', timestamp: '2026-06-05T14:30:35Z', level: 'WARN', message: 'Memory usage approaching threshold: 87.3%' },
    { id: 'log-11', timestamp: '2026-06-05T14:30:38Z', level: 'INFO', message: 'Scheduled maintenance task started' },
    { id: 'log-12', timestamp: '2026-06-05T14:30:42Z', level: 'INFO', message: 'Scheduled maintenance task completed' },
  ])

  const [liveEntries, setLiveEntries] = useState<LogEntry[]>(staticEntries.slice(0, 5))
  const logStreamRef = useRef<HTMLDivElement>(null)

  // Simulate live log streaming
  useEffect(() => {
    if (liveEntries.length >= staticEntries.length) {
      return
    }

    const timer = setTimeout(() => {
      setLiveEntries((prev) => [...prev, staticEntries[prev.length]])
    }, 1500)

    return () => clearTimeout(timer)
  }, [liveEntries, staticEntries])

  const [followMode, setFollowMode] = useState(true)
  const [showOps, setShowOps] = useState(false)

  const opsEntries: LogEntry[] = [
    { id: 'op-1', timestamp: '2026-06-05T14:30:15Z', level: 'INFO', op: 'fetch_user', target: 'user:12345', message: 'User data retrieved' },
    { id: 'op-2', timestamp: '2026-06-05T14:30:16Z', level: 'INFO', op: 'validate_schema', target: 'schema:user', message: 'Schema validation passed' },
    { id: 'op-3', timestamp: '2026-06-05T14:30:17Z', level: 'WARN', op: 'cache_miss', target: 'cache:session', message: 'Session not found in cache' },
    { id: 'op-4', timestamp: '2026-06-05T14:30:18Z', level: 'ERROR', op: 'db_query', target: 'postgres:main', message: 'Query timeout after 5000ms' },
    { id: 'op-5', timestamp: '2026-06-05T14:30:19Z', level: 'INFO', op: 'retry', target: 'db_query:1', message: 'Retrying operation (attempt 1/3)' },
    { id: 'op-6', timestamp: '2026-06-05T14:30:21Z', level: 'INFO', op: 'queue_message', target: 'queue:emails', message: 'Pushed 3 messages to queue' },
  ]

  return (
    <div>
      <PageHeader
        name="LogStream"
        description="Real-time log display component with auto-follow, virtualized rendering, and configurable columns. Supports various log levels with color-coding."
      />

      <ShowcaseSection label="Basic Log Stream">
        <div style={{ height: '400px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <LogStream entries={staticEntries} follow={false} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Live Streaming with Auto-Follow">
        <div style={{ marginBottom: '12px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
          <span>
            {liveEntries.length} / {staticEntries.length} entries loaded
          </span>
          <span style={{ marginLeft: '16px' }}>
            {followMode ? '📌 Following' : '📍 Paused (scroll to resume)'}
          </span>
        </div>
        <div style={{ height: '400px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <LogStream ref={logStreamRef} entries={liveEntries} follow={followMode} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="With Operations & Targets">
        <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', color: 'rgb(var(--canvas-fg-2))' }}>
            <input
              type="checkbox"
              checked={showOps}
              onChange={(e) => setShowOps(e.target.checked)}
              style={{ marginRight: '6px' }}
            />
            Show operation and target columns
          </label>
        </div>
        <div style={{ height: '400px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <LogStream entries={opsEntries} follow={false} showOps={showOps} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Log Levels">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            fontSize: '12px',
          }}
        >
          <div style={{ padding: '12px', background: 'rgb(var(--log-info-bg))', borderRadius: 'var(--radius-sm)', color: 'rgb(var(--canvas-fg-1))' }}>
            <strong style={{ color: 'rgb(var(--log-info))' }}>INFO</strong>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>Informational messages</div>
          </div>
          <div style={{ padding: '12px', background: 'rgb(var(--log-warn-bg))', borderRadius: 'var(--radius-sm)', color: 'rgb(var(--canvas-fg-1))' }}>
            <strong style={{ color: 'rgb(var(--log-warn))' }}>WARN</strong>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>Warning messages</div>
          </div>
          <div style={{ padding: '12px', background: 'rgb(var(--log-error-bg))', borderRadius: 'var(--radius-sm)', color: 'rgb(var(--canvas-fg-1))' }}>
            <strong style={{ color: 'rgb(var(--log-error))' }}>ERROR</strong>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>Error messages</div>
          </div>
          <div style={{ padding: '12px', background: 'rgb(var(--log-debug-bg))', borderRadius: 'var(--radius-sm)', color: 'rgb(var(--canvas-fg-1))' }}>
            <strong style={{ color: 'rgb(var(--log-debug))' }}>DEBUG</strong>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>Debug messages</div>
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Real-time streaming:</strong> Designed for live log tail with efficient updates
          </li>
          <li>
            <strong>Auto-follow:</strong> Automatically scrolls to newest entry; pauses when user scrolls up
          </li>
          <li>
            <strong>Color-coded levels:</strong> INFO (blue), WARN (amber), ERROR (rose), DEBUG (violet)
          </li>
          <li>
            <strong>Timestamp formatting:</strong> Compact time display (HH:mm:ss)
          </li>
          <li>
            <strong>Operation tracking:</strong> Optional op and target columns for operation-level logging
          </li>
          <li>
            <strong>Virtual scrolling:</strong> Efficient rendering of large log buffers
          </li>
          <li>
            <strong>Max rows limiting:</strong> Configurable buffer size (default 500 rows)
          </li>
          <li>
            <strong>Empty state:</strong> Clear message when no entries present
          </li>
          <li>
            <strong>Unique keying:</strong> Automatic deduplication using id, timestamp, level, message, op, target
          </li>
          <li>
            <strong>Accessibility:</strong> Live region announcements when following
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="entries" type="LogEntry[]" description="Array of log entries to display" required />
          <PropRow name="follow" type="boolean" def="true" description="When true, auto-scrolls to newest entry and announces changes" />
          <PropRow
            name="maxRows"
            type="number"
            def="500"
            description="Maximum number of entries to render (older entries are hidden)"
          />
          <PropRow name="showOps" type="boolean" def="false" description="When true, displays op and target columns" />
          <PropRow name="aria-label" type="string" def="Log stream" description="Accessibility label for the log container" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="LogEntry Type">
        <PropsTable>
          <PropRow name="id" type="string" description="Optional unique entry identifier" />
          <PropRow name="timestamp" type="Date | string" description="Log entry timestamp (ISO string or Date object)" required />
          <PropRow
            name="level"
            type="'INFO' | 'WARN' | 'ERROR' | 'DEBUG'"
            description="Log level (color-coded)"
            required
          />
          <PropRow name="message" type="string" description="Log message text" required />
          <PropRow name="op" type="string" description="Optional operation name (shown when showOps is true)" />
          <PropRow name="target" type="string" description="Optional target identifier (shown when showOps is true)" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Interactions">
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', fontSize: '13px', color: 'rgb(var(--canvas-fg-1))' }}>
          <div style={{ fontWeight: 600 }}>Auto-follow active</div>
          <div>New entries automatically scroll into view</div>

          <div style={{ fontWeight: 600 }}>Scroll up</div>
          <div>Pauses auto-follow (manual scroll mode)</div>

          <div style={{ fontWeight: 600 }}>Scroll to bottom</div>
          <div>Resumes auto-follow when following is enabled</div>

          <div style={{ fontWeight: 600 }}>Live region</div>
          <div>Screen readers announced new entries when following</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
