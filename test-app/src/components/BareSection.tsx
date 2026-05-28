import type { ReactNode } from 'react'

const ROOT_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
}

const EYEBROW_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(var(--canvas-fg-3))',
  marginBottom: 6,
}

const TITLE_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 24,
  fontWeight: 600,
  lineHeight: 1.2,
  color: 'rgb(var(--canvas-fg))',
  margin: 0,
}

const AXIS_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const AXIS_LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(var(--canvas-fg-3))',
}

const AXIS_ITEMS_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 18,
  rowGap: 22,
}

const CAPTION_WRAP_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  alignItems: 'flex-start',
}

const CAPTION_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.04em',
  color: 'rgb(var(--canvas-fg-3))',
}

export function BareSection({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div style={ROOT_STYLE}>
      <header>
        <div style={EYEBROW_STYLE}>Component</div>
        <h1 style={TITLE_STYLE}>{name}</h1>
      </header>
      {children}
    </div>
  )
}

export function AxisRow({
  label,
  children,
  align = 'flex-start',
}: {
  label?: string
  children: ReactNode
  align?: React.CSSProperties['alignItems']
}) {
  return (
    <div style={AXIS_ROW_STYLE}>
      {label ? <div style={AXIS_LABEL_STYLE}>{label}</div> : null}
      <div style={{ ...AXIS_ITEMS_STYLE, alignItems: align }}>{children}</div>
    </div>
  )
}

export function Caption({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={CAPTION_WRAP_STYLE}>
      <div>{children}</div>
      <div style={CAPTION_STYLE}>{label}</div>
    </div>
  )
}
