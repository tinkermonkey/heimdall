import React from 'react'
import { Chip } from '../components/Chip'
import { FormCallout } from '../components/FormCallout'
import { ActivityTimeline, type ActivityEvent } from '../components/ActivityTimeline'
import { VersionPill } from '../components/VersionPill'
import type { StatusColor } from '../components/statusColors'

/*
 * Semantic token coverage — renders every consumer of the --semantic-* and
 * --status-{ok,warn,error}-{bg,fg} tokens side by side so the light and dark
 * canvas screenshots catch a token that is missing its body.dark-canvas value
 * (issue #329).
 */

const CHIP_VARIANTS: StatusColor[] = ['cyan', 'amber', 'violet', 'emerald', 'rose', 'neutral']

const SEMANTIC_TRIPLETS = ['cyan', 'amber', 'violet', 'emerald', 'rose', 'neutral', 'id-tag'] as const

const STATUS_PAIRS = ['ok', 'warn', 'error'] as const

// Offsets from load time keep the relative timestamps stable across runs.
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000)

const EVENTS: ActivityEvent[] = [
  { id: 'e1', type: 'create', subject: 'life.organism', kind: 'class', timestamp: minutesAgo(8) },
  { id: 'e2', type: 'update', subject: 'cls_4f3a', kind: 'schema', timestamp: minutesAgo(42) },
  { id: 'e3', type: 'run', subject: 'ingest_nightly', kind: 'job', timestamp: minutesAgo(180) },
  { id: 'e4', type: 'delete', subject: 'cls_legacy', kind: 'class', timestamp: minutesAgo(60 * 26) },
]

const eyebrow: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(var(--canvas-fg-3))',
  marginBottom: '12px',
}

const row: React.CSSProperties = { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }

const swatch = (name: string): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  padding: '2px 7px',
  borderRadius: '3px',
  border: `1px solid rgb(var(--semantic-${name}-border))`,
  background: `rgb(var(--semantic-${name}-bg))`,
  color: `rgb(var(--semantic-${name}-fg))`,
})

const statusSwatch = (name: string): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  padding: '2px 7px',
  borderRadius: '3px',
  background: `rgb(var(--status-${name}-bg))`,
  color: `rgb(var(--status-${name}-fg))`,
})

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '28px' }}>
      <div style={eyebrow}>{title}</div>
      {children}
    </section>
  )
}

export default function SemanticTokensTestPage() {
  return (
    <div
      data-testid="semantic-tokens-page"
      style={{ padding: '22px 26px 32px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh', maxWidth: 760 }}
    >
      <Section title="Chip · variants">
        <div style={row}>
          {CHIP_VARIANTS.map((v) => (
            <Chip key={v} variant={v}>
              {v}
            </Chip>
          ))}
          <Chip form="id-tag">cls_4f3a</Chip>
          <Chip form="version">v2.4.0</Chip>
          <Chip form="env">staging</Chip>
          <Chip form="inferred">inferred</Chip>
        </div>
      </Section>

      <Section title="Semantic tokens · fg / bg / border">
        <div style={row}>
          {SEMANTIC_TRIPLETS.map((n) => (
            <span key={n} style={swatch(n)}>
              {n}
            </span>
          ))}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '3px',
              border: '1px solid var(--semantic-version-border-alpha)',
              background: 'var(--semantic-version-bg-alpha)',
              color: 'rgb(var(--semantic-version-fg))',
            }}
          >
            version
          </span>
        </div>
      </Section>

      <Section title="Status tokens · fg on bg">
        <div style={row}>
          {STATUS_PAIRS.map((n) => (
            <span key={n} style={statusSwatch(n)}>
              {n}
            </span>
          ))}
        </div>
      </Section>

      <Section title="FormCallout · variants">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <FormCallout variant="info">
            Identifiers are immutable once published.
          </FormCallout>
          <FormCallout variant="warn">
            Renaming <code className="form-callout__code">life.organism</code> breaks 3 downstream queries.
          </FormCallout>
          <FormCallout variant="error">
            Delete <code className="form-callout__code">cls_organism</code>? 47 individuals will be unlinked.
          </FormCallout>
        </div>
      </Section>

      <Section title="ActivityTimeline · kind labels">
        <ActivityTimeline events={EVENTS} />
      </Section>

      <Section title="VersionPill · tones">
        <div style={row}>
          <VersionPill tone="amber">v2.4.0</VersionPill>
          <VersionPill tone="emerald">v2.5.0</VersionPill>
          <VersionPill tone="rose">v2.3.1</VersionPill>
        </div>
      </Section>
    </div>
  )
}
