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

export function DemoGrid({ children, cols = 3, gap = 12 }: { children: React.ReactNode; cols?: number; gap?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
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

export function PropRow({ name, type, def, description, required }: { name: string; type: string; def?: string; description: string; required?: boolean }) {
  return (
    <tr>
      <td style={{ padding: '7px 12px', fontFamily: mono, fontSize: 12, color: 'rgb(var(--accent-cyan-deep, 14 126 163))' }}>
        {name}{required && <span style={{ color: 'rgb(var(--accent-rose, 244 63 94))', marginLeft: 2 }}>*</span>}
      </td>
      <td style={{ padding: '7px 12px', fontFamily: mono, fontSize: 11, color: fg3 }}>{type}</td>
      <td style={{ padding: '7px 12px', fontFamily: mono, fontSize: 11, color: fg3 }}>{def ?? '—'}</td>
      <td style={{ padding: '7px 12px', fontSize: 12, color: fg2 }}>{description}</td>
    </tr>
  )
}

export function PropsTable({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgb(var(--canvas-bg-2, 243 244 246))' }}>
            {['Prop', 'Type', 'Default', 'Description'].map(h => (
              <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: fg3, fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody style={{ borderTop: `1px solid ${border}` }}>{children}</tbody>
      </table>
    </div>
  )
}
