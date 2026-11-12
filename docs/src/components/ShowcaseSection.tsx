import React from 'react'

const mono = 'var(--font-mono, "JetBrains Mono", monospace)'
const fg3 = 'rgb(var(--canvas-fg-3, 107 114 128))'
const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'
const fg1 = 'rgb(var(--canvas-fg-1, 17 24 39))'
const border = 'rgb(var(--canvas-border, 229 231 235))'

export function PageHeader({ name, description }: { name: string; description: string }) {
  return (
    <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: `1px solid ${border}` }}>
      <h1 style={{ margin: '0 0 6px 0', fontSize: 22, fontWeight: 700, color: fg1, letterSpacing: '-0.01em' }}>
        {name}
      </h1>
      <p style={{ margin: 0, fontSize: 13, color: fg2, lineHeight: 1.65 }}>{description}</p>
    </div>
  )
}

export function ShowcaseSection({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: fg3, fontWeight: 500, marginBottom: description ? 8 : 14 }}>
        {label}
      </div>
      {description && (
        <p style={{ fontSize: 12, color: fg2, margin: '0 0 14px', lineHeight: 1.65 }}>{description}</p>
      )}
      {children}
    </div>
  )
}

export function DemoRow({ children, gap = 10, wrap = true }: { children: React.ReactNode; gap?: number; wrap?: boolean }) {
  return (
    <div style={{ display: 'flex', gap, flexWrap: wrap ? 'wrap' : 'nowrap', alignItems: 'center' }}>
      {children}
    </div>
  )
}

export function DemoGrid({ children, cols = 3, gap = 12, minWidth }: { children: React.ReactNode; cols?: number; gap?: number; minWidth?: number }) {
  const effectiveMinWidth = minWidth ?? Math.max(100, Math.floor((900 - gap * (cols - 1)) / cols))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${effectiveMinWidth}px, 1fr))`, gap }}>
      {children}
    </div>
  )
}

export function DemoCard({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
      {label && (
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${border}`, fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3 }}>
          {label}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

// Where a type may wrap, between tokens only. Main breaks: before `|` and `&`; after `,`, `;`,
// `=>` and a ` / ` between alternatives. Soft breaks, used only in a narrow table (see
// `.type-soft-break` in styles/main.css): after a `: ` annotation and an opening `<`.
const TYPE_BREAK = /(\s*[|&]\s*|,\s*|;\s*|=>\s*|\s\/\s+)|(:\s+|<)/g

/** Splits a type into runs that are never broken inside; `soft` marks a soft break before a run. */
function typeRuns(text: string): { run: string; soft: boolean }[] {
  const runs: { run: string; soft: boolean }[] = []
  let start = 0
  let soft = false
  for (const m of text.matchAll(TYPE_BREAK)) {
    const sep = m[0].trimStart()
    const at = sep[0] === '|' || sep[0] === '&' ? m.index! + m[0].length - sep.length : m.index! + m[0].length
    if (at > start) {
      runs.push({ run: text.slice(start, at), soft })
      start = at
      soft = m[2] !== undefined
    }
  }
  runs.push({ run: text.slice(start), soft })
  return runs
}

const TYPE_MAX_WIDTH = 240

/**
 * A type or signature that wraps only between tokens, never inside a name.
 * `maxWidth` caps how wide it asks its table column to be.
 */
export function TypeText({ children, maxWidth = TYPE_MAX_WIDTH }: { children: string; maxWidth?: number }) {
  return (
    <div style={{ maxWidth }}>
      {typeRuns(children).map(({ run, soft }, i) => (
        <React.Fragment key={i}>
          {i > 0 && <wbr className={soft ? 'type-soft-break' : undefined} />}
          <span style={{ whiteSpace: 'nowrap' }}>{run}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

/** Frame for a reference table; `.props-table` is the container the soft type breaks query. */
export function TableFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="props-table" style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: 'auto' }}>
      {children}
    </div>
  )
}

/** A full type too long for a table cell, shown as a code block under the table. */
export function TypeBlock({ name, children }: { name: string; children: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 12, color: fg2, margin: '0 0 6px', lineHeight: 1.65 }}>
        Full type of <code style={{ fontFamily: mono, fontSize: 11.5, color: 'rgb(var(--accent-cyan-deep, 14 126 163))' }}>{name}</code>:
      </p>
      <pre style={{ margin: 0, padding: '10px 12px', background: 'rgb(var(--canvas-bg-2, 243 244 246))', border: `1px solid ${border}`, borderRadius: 6, fontFamily: mono, fontSize: 11.5, lineHeight: 1.6, color: fg2, overflowX: 'auto' }}>
        {children}
      </pre>
    </div>
  )
}

export function PropRow({ name, type, def, description, required }: { name: string; type: string; def?: string; description: string; required?: boolean }) {
  const cell = { padding: '7px 10px', verticalAlign: 'top' } as const
  return (
    <tr>
      <td style={{ ...cell, fontFamily: mono, fontSize: 12, color: 'rgb(var(--accent-cyan-deep, 14 126 163))', whiteSpace: 'nowrap' }}>
        {name}{required && <span style={{ color: 'rgb(var(--accent-rose, 244 63 94))', marginLeft: 2 }}>*</span>}
      </td>
      <td style={{ ...cell, fontFamily: mono, fontSize: 11, color: fg3 }}><TypeText>{type}</TypeText></td>
      {/* Defaults are often prose ("graph state"), so they wrap at spaces. */}
      <td style={{ ...cell, fontFamily: mono, fontSize: 11, color: fg3 }}><div style={{ maxWidth: 150 }}>{def ?? '—'}</div></td>
      {/* A code token in prose may break only when nothing else fits. */}
      <td style={{ ...cell, fontSize: 12, color: fg2, overflowWrap: 'anywhere' }}>{description}</td>
    </tr>
  )
}

export function PropsTable({ children }: { children: React.ReactNode }) {
  return (
    <TableFrame>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgb(var(--canvas-bg-2, 243 244 246))' }}>
            {['Prop', 'Type', 'Default', 'Description'].map(h => (
              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, fontWeight: 500, whiteSpace: 'nowrap', minWidth: h === 'Description' ? 160 : 'auto' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody style={{ borderTop: `1px solid ${border}` }}>{children}</tbody>
      </table>
    </TableFrame>
  )
}
