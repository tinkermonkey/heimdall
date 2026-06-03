import { HashSetDiff, SideBySideDiff, type DiffLine } from '../components'

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
          HashSetDiff · Small Dataset
        </div>
        <HashSetDiff added={smallAdded} removed={smallRemoved} kept={smallKept} maxVisible={10} />
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
          HashSetDiff · Large Dataset with Collapse
        </div>
        <HashSetDiff added={largeAdded} removed={largeRemoved} kept={largeKept} maxVisible={8} />
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
          HashSetDiff · Empty State
        </div>
        <HashSetDiff added={[]} removed={[]} kept={[]} />
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
          SideBySideDiff · Small Diff with Hunks
        </div>
        <SideBySideDiff lines={diffLines} />
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
          SideBySideDiff · Large Diff (Virtualized)
        </div>
        <SideBySideDiff lines={largeDiffLines} />
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
          SideBySideDiff · Empty State
        </div>
        <SideBySideDiff lines={emptyDiffLines} />
      </section>
    </div>
  )
}
