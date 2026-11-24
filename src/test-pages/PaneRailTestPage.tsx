import { useState, type CSSProperties } from 'react'
import { PaneRail, type PaneRailMark } from '../components/PaneRail'
import type { StatusColor } from '../components/statusColors'

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgb(var(--canvas-fg-3))',
  marginBottom: '14px',
}

const frame: CSSProperties = {
  display: 'flex',
  height: '360px',
  border: '1px solid rgb(var(--canvas-border))',
  borderRadius: '8px',
  overflow: 'hidden',
  background: 'rgb(var(--canvas-bg))',
}

const paneBody: CSSProperties = {
  flex: 1,
  padding: '14px 16px',
  fontSize: '13px',
  color: 'rgb(var(--canvas-fg-2))',
}

// Highlights in a source text, coloured by verdict, at their offsets in the text.
const SOURCE_MARKS: PaneRailMark[] = [
  { id: 'h1', position: 0.04, tone: 'emerald', label: 'Accepted: Payment service' },
  { id: 'h2', position: 0.11, tone: 'emerald', label: 'Accepted: Order store' },
  { id: 'h3', position: 0.19, tone: 'rose', label: 'Rejected: Retry policy' },
  { id: 'h4', position: 0.27, tone: 'amber', label: 'Pending: Checkout flow' },
  { id: 'h5', position: 0.28, tone: 'amber', label: 'Pending: Cart' },
  { id: 'h6', position: 0.42, tone: 'violet', label: 'Edited: Inventory sync' },
  { id: 'h7', position: 0.55, tone: 'cyan', label: 'Added: Fraud check' },
  { id: 'h8', position: 0.63, tone: 'emerald', label: 'Accepted: Ledger' },
  { id: 'h9', position: 0.71, tone: 'neutral', label: 'Unreviewed: Audit log' },
  { id: 'h10', position: 0.84, tone: 'rose', label: 'Rejected: Batch export' },
  { id: 'h11', position: 0.96, tone: 'emerald', label: 'Accepted: Notifications' },
]

const LIST_TONES: StatusColor[] = ['emerald', 'emerald', 'amber', 'rose', 'emerald', 'neutral', 'violet']

// Rows of a 37-row operations list, in list order.
const LIST_MARKS: PaneRailMark[] = Array.from({ length: 37 }, (_, i) => ({
  id: `op${i + 1}`,
  position: i / 36,
  tone: LIST_TONES[i % LIST_TONES.length],
  label: `Operation ${i + 1}`,
}))

// 400 marks, deterministic, many at nearly the same position.
const DENSE_MARKS: PaneRailMark[] = Array.from({ length: 400 }, (_, i) => ({
  id: `d${i}`,
  position: ((i * 97) % 400) / 399,
  tone: (['emerald', 'amber', 'rose', 'cyan', 'violet', 'neutral'] as StatusColor[])[i % 6],
  label: `Item ${i + 1}`,
}))

export default function PaneRailTestPage() {
  const [log, setLog] = useState('none')

  return (
    <div style={{ padding: '22px 26px 32px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <section data-testid="pane-rail-section-source">
          <div style={eyebrow}>PaneRail · Source, toned marks and notch</div>
          <div style={{ ...frame, width: '280px' }}>
            <PaneRail
              data-testid="pane-rail-source"
              label="Source"
              shortcut="["
              marks={SOURCE_MARKS}
              selectedPosition={0.42}
              onExpand={() => setLog('expand:Source')}
              onMarkClick={(id) => setLog(`click:${id}`)}
              onMarkHover={(id, anchor) => setLog(`hover:${id}:${anchor.tagName.toLowerCase()}`)}
              onMarkLeave={(id) => setLog(`leave:${id}`)}
            />
            <div style={paneBody}>Review content</div>
          </div>
        </section>

        <section data-testid="pane-rail-section-list">
          <div style={eyebrow}>PaneRail · List, position label</div>
          <div style={{ ...frame, width: '280px' }}>
            <PaneRail
              data-testid="pane-rail-list"
              label="Operations"
              shortcut="]"
              marks={LIST_MARKS}
              selectedPosition={4 / 36}
              positionLabel="5 / 37"
              onExpand={() => setLog('expand:Operations')}
            />
            <div style={paneBody}>Review content</div>
          </div>
        </section>

        <section data-testid="pane-rail-section-dense">
          <div style={eyebrow}>PaneRail · 400 marks, right side</div>
          <div style={{ ...frame, width: '280px' }}>
            <div style={paneBody}>Review content</div>
            <PaneRail
              data-testid="pane-rail-dense"
              label="Inspector"
              side="right"
              marks={DENSE_MARKS}
              selectedPosition={0.75}
              onExpand={() => setLog('expand:Inspector')}
            />
          </div>
        </section>

        <section data-testid="pane-rail-section-empty">
          <div style={eyebrow}>PaneRail · No marks</div>
          <div style={{ ...frame, width: '120px' }}>
            <PaneRail data-testid="pane-rail-empty" label="Source" onExpand={() => setLog('expand:empty')} />
          </div>
        </section>
      </div>

      <div
        data-testid="pane-rail-log"
        style={{ marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}
      >
        {log}
      </div>
    </div>
  )
}
