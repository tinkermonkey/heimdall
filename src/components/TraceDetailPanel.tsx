import React from 'react'
import { Icon } from './Icon'
import {
  createTimeScale,
  fmtMs,
  selfTime,
  type TraceModel,
  type TraceModelNode,
  type TraceSpan,
} from './traceViewerModel'

// span.kind -> BEM modifier; colors come from contrast-tuned semantic tokens
// (see .trace-detail__kind--* in TraceViewer.css), not raw hex, so the badge
// stays AA-legible on both canvases.
const KIND_MOD: Record<string, string> = {
  SERVER: 'server',
  CLIENT: 'client',
  INTERNAL: 'internal',
  PRODUCER: 'producer',
  CONSUMER: 'consumer',
  UNSPECIFIED: 'internal',
}

const STATUS_LABEL: Record<string, string> = { ok: 'OK', warn: 'WARN', error: 'ERROR' }

export interface TraceDetailPanelProps {
  span: TraceModelNode
  model: TraceModel
  traceId?: string
  /** resolve any service key -> color (used by the minimap). */
  resolveColor: (service: string) => string
  serviceLabel: string
  serviceHost?: string
  onClose: () => void
  onSelect: (id: string) => void
  renderAttributes?: (span: TraceSpan) => React.ReactNode
  closeButtonRef?: React.RefObject<HTMLButtonElement>
}

/** Minimap of every span's position in the whole trace, current span highlighted. */
function MiniMap({
  model,
  resolveColor,
  selectedId,
}: {
  model: TraceModel
  resolveColor: (service: string) => string
  selectedId: string
}) {
  const { ordered, total } = model
  const W = 100
  const lh = 2
  const gap = 1
  const top = 3
  const n = ordered.length
  const H = top * 2 + n * (lh + gap)
  const selIndex = ordered.findIndex((s) => s.id === selectedId)

  // The per-span rects don't depend on selection (the highlight band conveys it),
  // so memoize them to avoid rebuilding one <rect> per span on every selection.
  const rects = React.useMemo(() => {
    const scale = createTimeScale(0, total)
    return ordered.map((s, i) => (
      <rect
        key={s.id}
        x={scale.x(s.start)}
        y={top + i * (lh + gap)}
        width={scale.w(s.duration)}
        height={lh}
        rx="0.6"
        fill={s.status === 'error' ? 'rgb(var(--status-error))' : resolveColor(s.service)}
        fillOpacity={0.5}
      />
    ))
  }, [ordered, total, resolveColor])

  return (
    <svg className="trace-detail__minimap" width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {selIndex >= 0 && (
        <rect x="0" y={top + selIndex * (lh + gap) - 1} width={W} height={lh + 2} className="trace-detail__minimap-band" />
      )}
      {rects}
    </svg>
  )
}

function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="trace-detail__kv">
      {rows.map(([k, v], i) => (
        <React.Fragment key={k + i}>
          <div className="trace-detail__kv-key">{k}</div>
          <div className="trace-detail__kv-val">{v}</div>
        </React.Fragment>
      ))}
    </div>
  )
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="trace-detail__section">
      <div className="trace-detail__section-head">
        <span className="trace-detail__eyebrow">{title}</span>
        {right}
      </div>
      <div className="trace-detail__section-body">{children}</div>
    </div>
  )
}

export const TraceDetailPanel = React.forwardRef<HTMLDivElement, TraceDetailPanelProps>(function TraceDetailPanel(
  { span, model, traceId, resolveColor, serviceLabel, serviceHost, onClose, onSelect, renderAttributes, closeButtonRef },
  ref
) {
  const color = resolveColor(span.service)
  const total = model.total
  const self = selfTime(span)
  const pct = total > 0 ? (span.duration / total) * 100 : 0
  const selfPct = span.duration > 0 ? (self / span.duration) * 100 : 0
  const parent = span.parentId ? model.byId[span.parentId] : null
  const kindMod = KIND_MOD[span.kind] ?? 'internal'
  const rowIndex = model.ordered.findIndex((s) => s.id === span.id) + 1

  const attrEntries = span.attributes ? Object.entries(span.attributes) : []
  const otherEvents = (span.events ?? []).filter((e) => e.name !== 'exception')

  const TimingRow = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="trace-detail__timing-row">
      <span className="trace-detail__timing-label">{label}</span>
      <span className="trace-detail__timing-value">
        {value}
        {sub && <span className="trace-detail__timing-sub"> {sub}</span>}
      </span>
    </div>
  )

  return (
    <div
      className="trace-detail"
      ref={ref}
      role="complementary"
      aria-label={`Span detail: ${span.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <div className="trace-detail__head">
        <span className="trace-detail__head-swatch" style={{ background: color }} />
        <div className="trace-detail__head-main">
          <div className="trace-detail__eyebrow">
            {serviceLabel.toUpperCase()} · {span.kind}
          </div>
          <div className="trace-detail__title">{span.name}</div>
          <div className="trace-detail__status-row">
            <span className={`trace-detail__status-pill trace-detail__status-pill--${span.status}`}>
              <span className="trace-detail__status-dot" />
              {STATUS_LABEL[span.status]}
              {span.statusCode != null && span.statusCode !== 0 ? ` · ${span.statusCode}` : ''}
            </span>
          </div>
        </div>
        <button type="button" className="trace-detail__close" onClick={onClose} title="Close panel" aria-label="Close span detail" ref={closeButtonRef}>
          <Icon name="x" size={14} />
        </button>
      </div>

      <div className="trace-detail__scroll">
        <Section title="TRACE MAP">
          <div className="trace-detail__minimap-wrap">
            <MiniMap model={model} resolveColor={resolveColor} selectedId={span.id} />
          </div>
          <div className="trace-detail__minimap-caption">
            row {rowIndex} of {model.ordered.length}
          </div>
        </Section>

        <Section title="TIMING">
          <TimingRow label="start offset" value={fmtMs(span.start)} />
          <TimingRow label="duration" value={fmtMs(span.duration)} />
          <TimingRow label="self time" value={fmtMs(self)} sub={`· ${selfPct.toFixed(0)}%`} />
          <TimingRow label="% of trace" value={`${pct.toFixed(1)}%`} />
          <div className="trace-detail__selfbar">
            <div className="trace-detail__selfbar-self" style={{ width: `${selfPct}%`, background: color }} />
            <div className="trace-detail__selfbar-children" />
          </div>
          <div className="trace-detail__selfbar-legend">
            <span>SELF {fmtMs(self)}</span>
            <span>IN CHILDREN {fmtMs(span.duration - self)}</span>
          </div>
        </Section>

        <Section title="IDENTITY">
          <KV
            rows={[
              ['span_id', <span className="trace-detail__mono">{span.id}</span>],
              [
                'parent',
                parent ? (
                  <button type="button" className="trace-detail__link" onClick={() => onSelect(parent.id)}>
                    {parent.name}
                  </button>
                ) : (
                  <span className="trace-detail__muted">— root —</span>
                ),
              ],
              [
                'service',
                <span className="trace-detail__svc">
                  <span className="trace-detail__svc-dot" style={{ background: color }} />
                  {serviceLabel}
                </span>,
              ],
              ...(serviceHost ? ([['host', <span className="trace-detail__mono">{serviceHost}</span>]] as [string, React.ReactNode][]) : []),
              ['kind', <span className={`trace-detail__kind trace-detail__kind--${kindMod}`}>{span.kind}</span>],
              ...(traceId ? ([['trace_id', <span className="trace-detail__mono">{traceId}</span>]] as [string, React.ReactNode][]) : []),
            ]}
          />
        </Section>

        {renderAttributes ? (
          <Section title="ATTRIBUTES">{renderAttributes(span)}</Section>
        ) : attrEntries.length > 0 ? (
          <Section title="ATTRIBUTES" right={<span className="trace-detail__count">{attrEntries.length}</span>}>
            <KV rows={attrEntries.map(([k, v]) => [k, <span className="trace-detail__mono">{String(v)}</span>])} />
          </Section>
        ) : null}

        {otherEvents.length > 0 && (
          <Section title="EVENTS" right={<span className="trace-detail__count">{otherEvents.length}</span>}>
            <div className="trace-detail__events">
              {otherEvents.map((ev, i) => (
                <div key={i} className="trace-detail__event">
                  <span className="trace-detail__event-time">{fmtMs(ev.time)}</span>
                  <span className="trace-detail__event-name">{ev.name}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="STATUS">
          {span.status === 'error' && span.exception ? (
            <div className="trace-detail__error">
              <div className="trace-detail__error-head">
                <Icon name="alert" size={14} />
                <span>{span.exception.type ?? 'Error'}</span>
              </div>
              {span.exception.message && <div className="trace-detail__error-msg">{span.exception.message}</div>}
              {span.exception.stacktrace && <pre className="trace-detail__error-stack">{span.exception.stacktrace}</pre>}
            </div>
          ) : span.status === 'warn' ? (
            <div className="trace-detail__warn">
              <Icon name="alert" size={13} />
              degraded — {String(span.attributes?.note ?? 'elevated latency on this span')}
            </div>
          ) : (
            <div className="trace-detail__ok">
              <span className="trace-detail__ok-dot" />
              OK{span.statusCode ? ` · ${span.statusCode}` : ''}
            </div>
          )}
        </Section>
        <div className="trace-detail__foot-spacer" />
      </div>
    </div>
  )
})

TraceDetailPanel.displayName = 'TraceDetailPanel'

export default TraceDetailPanel
