import {
  HierarchyRow,
  HierarchyTree,
  TopologyNode,
  type HierarchyDomain,
  type HierarchyKind,
  type TopologyNodeStatus,
  type TopologyNodeMetric,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const HIERARCHY_DOMAINS: HierarchyDomain[] = ['default', 'life', 'climate', 'software']
const HIERARCHY_KINDS: HierarchyKind[] = ['taxonomy', 'scheme', 'class']
const TOPOLOGY_STATUSES: TopologyNodeStatus[] = ['ok', 'warning', 'error', 'idle']

export function BareHierarchyRow() {
  return (
    <BareSection name="HierarchyRow">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 480 }}>
          <HierarchyRow domain="default" kind="class" label="cls_default" />
        </div>
      </AxisRow>
      <AxisRow label="domain" align="stretch">
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {HIERARCHY_DOMAINS.map(d => (
            <HierarchyRow key={d} domain={d} kind="class" label={`cls_${d}`} meta={d} />
          ))}
        </div>
      </AxisRow>
      <AxisRow label="kind" align="stretch">
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {HIERARCHY_KINDS.map(k => (
            <HierarchyRow key={k} domain="default" kind={k} label={`${k} example`} />
          ))}
        </div>
      </AxisRow>
      <AxisRow label="depth" align="stretch">
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0, 1, 2, 3].map(d => (
            <HierarchyRow key={d} domain="life" kind="class" label={`depth=${d}`} depth={d} />
          ))}
        </div>
      </AxisRow>
      <AxisRow label="selected" align="stretch">
        <div style={{ width: 480 }}>
          <HierarchyRow domain="life" kind="class" label="cls_selected" selected />
        </div>
      </AxisRow>
      <AxisRow label="with description" align="stretch">
        <div style={{ width: 480 }}>
          <HierarchyRow
            domain="life"
            kind="class"
            label="cls_organism"
            description="Top-level class for biological organisms."
            meta="9 fields"
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareHierarchyTree() {
  return (
    <BareSection name="HierarchyTree">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 520 }}>
          <HierarchyTree>
            <HierarchyRow domain="life" kind="taxonomy" label="biology" depth={0} />
            <HierarchyRow domain="life" kind="class" label="cls_organism" depth={1} meta="9 fields" />
            <HierarchyRow domain="life" kind="class" label="cls_event" depth={2} />
            <HierarchyRow domain="life" kind="class" label="cls_record" depth={2} />
            <HierarchyRow domain="climate" kind="taxonomy" label="climate" depth={0} />
            <HierarchyRow domain="climate" kind="class" label="cls_climate" depth={1} />
            <HierarchyRow domain="climate" kind="class" label="cls_event" depth={2} selected />
          </HierarchyTree>
        </div>
      </AxisRow>
    </BareSection>
  )
}

const TOPOLOGY_METRICS: TopologyNodeMetric[] = [
  { label: 'cpu', value: 42, unit: '%', percent: 42, sparklineData: [10, 14, 12, 18, 22, 20, 26, 30, 28, 33], color: 'cyan' },
  { label: 'mem', value: 64, unit: '%', percent: 64, sparklineData: [40, 44, 46, 50, 54, 58, 62, 64, 62, 64], color: 'amber' },
]

export function BareTopologyNode() {
  return (
    <BareSection name="TopologyNode">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 280 }}>
          <TopologyNode title="api-gateway" />
        </div>
      </AxisRow>
      <AxisRow label="status" align="stretch">
        {TOPOLOGY_STATUSES.map(s => (
          <Caption key={s} label={s}>
            <div style={{ width: 240 }}>
              <TopologyNode title={`${s}-service`} status={s} nodeRole="service" />
            </div>
          </Caption>
        ))}
      </AxisRow>
      <AxisRow label="with metrics" align="stretch">
        <div style={{ width: 320 }}>
          <TopologyNode
            title="api-gateway"
            nodeRole="service"
            status="ok"
            metrics={TOPOLOGY_METRICS}
          />
        </div>
      </AxisRow>
      <AxisRow label="selected" align="stretch">
        <div style={{ width: 280 }}>
          <TopologyNode title="api-gateway" status="ok" selected onSelect={() => {}} />
        </div>
      </AxisRow>
    </BareSection>
  )
}
