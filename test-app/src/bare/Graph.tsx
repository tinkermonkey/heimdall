import { useState } from 'react'
import {
  GraphCanvas,
  GraphNode,
  GraphInspector,
  type GraphNodeData,
  type GraphEdgeData,
  type GraphNodeMetadata,
  type RelationshipLink,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

const DOMAIN_COLORS: Array<{ name: string; color: string }> = [
  { name: 'default', color: 'default' },
  { name: 'life', color: 'life' },
  { name: 'climate', color: 'climate' },
  { name: 'software', color: 'software' },
]

export function BareGraphNode() {
  const [sel, setSel] = useState<string | null>(null)
  return (
    <BareSection name="GraphNode">
      <AxisRow label="default">
        <GraphNode id="n1" label="cls_organism" />
      </AxisRow>
      <AxisRow label="with kind">
        <GraphNode id="n1" label="cls_organism" kind="class" />
      </AxisRow>
      <AxisRow label="domainColor">
        {DOMAIN_COLORS.map(({ name, color }) => (
          <Caption key={name} label={name}>
            <GraphNode id={`n_${name}`} label={`cls_${name}`} kind="class" domainColor={color} />
          </Caption>
        ))}
      </AxisRow>
      <AxisRow label="selected">
        <GraphNode
          id="n_sel"
          label="cls_selected"
          kind="class"
          selected={sel === 'n_sel'}
          onSelect={id => setSel(prev => (prev === id ? null : id))}
        />
      </AxisRow>
    </BareSection>
  )
}

const GRAPH_NODES: GraphNodeData[] = [
  { id: 'a', label: 'cls_organism', kind: 'class', domainColor: 'life' },
  { id: 'b', label: 'cls_climate', kind: 'class', domainColor: 'climate' },
  { id: 'c', label: 'cls_software', kind: 'class', domainColor: 'software' },
  { id: 'd', label: 'cls_event', kind: 'class' },
  { id: 'e', label: 'cls_record', kind: 'class' },
]

const GRAPH_EDGES: GraphEdgeData[] = [
  { id: 'e1', sourceId: 'a', targetId: 'd' },
  { id: 'e2', sourceId: 'b', targetId: 'd' },
  { id: 'e3', sourceId: 'c', targetId: 'd' },
  { id: 'e4', sourceId: 'd', targetId: 'e' },
  { id: 'e5', sourceId: 'a', targetId: 'b', variant: 'hot' },
  { id: 'e6', sourceId: 'c', targetId: 'a', variant: 'irrelevant' },
]

export function BareGraphCanvas() {
  const [selected, setSelected] = useState<string | undefined>(undefined)
  return (
    <BareSection name="GraphCanvas">
      <AxisRow label="default (force layout)" align="stretch">
        <div
          style={{
            width: 720,
            height: 420,
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <GraphCanvas
            nodes={GRAPH_NODES}
            edges={GRAPH_EDGES}
            selectedNodeId={selected}
            onNodeSelect={setSelected}
            layout="force"
          />
        </div>
      </AxisRow>
      <AxisRow label="manual layout" align="stretch">
        <div
          style={{
            width: 720,
            height: 360,
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <GraphCanvas
            layout="manual"
            nodes={[
              { id: 'a', label: 'A', kind: 'class', x: 120, y: 80 },
              { id: 'b', label: 'B', kind: 'class', x: 360, y: 80 },
              { id: 'c', label: 'C', kind: 'class', x: 240, y: 240 },
            ]}
            edges={[
              { id: 'e1', sourceId: 'a', targetId: 'c' },
              { id: 'e2', sourceId: 'b', targetId: 'c' },
            ]}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareGraphEdge() {
  return (
    <BareSection name="GraphEdge">
      <AxisRow label="rendered inside GraphCanvas">
        <div style={{ maxWidth: 720, color: 'rgb(var(--canvas-fg-3))', fontSize: 13 }}>
          GraphEdge requires GraphCanvas context (it reads node rects from{' '}
          <code>useGraphCanvas()</code>). The variants below are rendered via the GraphCanvas
          edges prop.
        </div>
      </AxisRow>
      <AxisRow label="variant" align="stretch">
        <div
          style={{
            width: 720,
            height: 320,
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <GraphCanvas
            layout="manual"
            nodes={[
              { id: 'a', label: 'default →', x: 80, y: 60 },
              { id: 'b', label: 'default ↗', x: 480, y: 40 },
              { id: 'c', label: 'hot →', x: 80, y: 160 },
              { id: 'd', label: 'hot ↗', x: 480, y: 140 },
              { id: 'e', label: 'irrelevant →', x: 80, y: 260 },
              { id: 'f', label: 'irrelevant ↗', x: 480, y: 240 },
            ]}
            edges={[
              { id: 'e1', sourceId: 'a', targetId: 'b' },
              { id: 'e2', sourceId: 'c', targetId: 'd', variant: 'hot' },
              { id: 'e3', sourceId: 'e', targetId: 'f', variant: 'irrelevant' },
            ]}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

const NODE_META: GraphNodeMetadata = {
  id: 'cls_organism',
  title: 'cls_organism',
  kind: 'class',
  domain: 'life',
  description: 'Top-level class for biological organisms.',
  metadata: {
    version: 4,
    fields: 9,
    deprecated: false,
  },
}

const RELATIONSHIPS: RelationshipLink[] = [
  { id: 'r1', target: 'cls_climate', targetTitle: 'cls_climate', targetDomain: 'climate', predicate: 'lives in', direction: 'out' },
  { id: 'r2', target: 'cls_event', targetTitle: 'cls_event', predicate: 'recorded by', direction: 'in' },
]

export function BareGraphInspector() {
  return (
    <BareSection name="GraphInspector">
      <AxisRow label="default (no node)" align="stretch">
        <div style={{ width: 360 }}>
          <GraphInspector />
        </div>
      </AxisRow>
      <AxisRow label="with node + relationships" align="stretch">
        <div style={{ width: 360 }}>
          <GraphInspector node={NODE_META} relationships={RELATIONSHIPS} />
        </div>
      </AxisRow>
    </BareSection>
  )
}
