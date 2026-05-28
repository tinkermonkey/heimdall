import { PipelineCard, type Pipeline } from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const FLOW: Pipeline['flow'] = [
  { id: 'src', name: 'source', label: 'http', icon: 'download', color: 'cyan' },
  { id: 'map', name: 'transform', label: 'map', icon: 'edit', color: 'amber' },
  { id: 'sink', name: 'sink', label: 'store', icon: 'data', color: 'emerald' },
]

function basePipeline(overrides: Partial<Pipeline> = {}): Pipeline {
  return {
    id: 'pl_4f3a',
    name: 'ingest_v2',
    description: 'HTTP ingest with transform and store.',
    status: 'running',
    target: 'cls_organism',
    flow: FLOW,
    recent: { ingested: 1284, created: 31, updated: 12, errors: 0 },
    tags: ['ingest', 'http'],
    lastRun: '2 min ago',
    ...overrides,
  }
}

export function BarePipelineCard() {
  return (
    <BareSection name="PipelineCard">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 640 }}>
          <PipelineCard pipeline={basePipeline()} />
        </div>
      </AxisRow>
      <AxisRow label="status" align="stretch">
        {(['running', 'success', 'idle', 'failed'] as const).map(status => (
          <Caption key={status} label={status}>
            <div style={{ width: 480 }}>
              <PipelineCard pipeline={basePipeline({ status })} />
            </div>
          </Caption>
        ))}
      </AxisRow>
      <AxisRow label="compact" align="stretch">
        <div style={{ width: 640 }}>
          <PipelineCard pipeline={basePipeline()} compact />
        </div>
      </AxisRow>
      <AxisRow label="selected" align="stretch">
        <div style={{ width: 640 }}>
          <PipelineCard pipeline={basePipeline()} selected />
        </div>
      </AxisRow>
      <AxisRow label="flowLayout=auto" align="stretch">
        <div style={{ width: 640 }}>
          <PipelineCard pipeline={basePipeline()} flowLayout="auto" />
        </div>
      </AxisRow>
    </BareSection>
  )
}
