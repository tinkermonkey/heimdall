import { LineageRail, type LineageNode } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

export function LineageRailShowcase() {
  const simpleChain: LineageNode[] = [
    { label: 'source_table' },
    { label: 'transform' },
    { label: 'aggregate' },
  ]

  const withIcons: LineageNode[] = [
    { icon: 'data', label: 'raw_data' },
    { icon: 'pipeline', label: 'process' },
    { icon: 'schema', label: 'output' },
  ]

  const longChain: LineageNode[] = [
    { label: 'ingestion' },
    { label: 'validation' },
    { label: 'cleaning' },
    { label: 'enrichment' },
    { label: 'aggregation' },
    { label: 'publishing' },
  ]

  const interactive: LineageNode[] = [
    { label: 'source', onClick: () => alert('source clicked') },
    { label: 'process', onClick: () => alert('process clicked') },
    { label: 'result', onClick: () => alert('result clicked') },
  ]

  return (
    <div>
      <PageHeader
        name="LineageRail"
        description="Horizontal process chain visualization showing data or task lineage. Displays stages as connected boxes with optional icons and click handlers."
      />

      <ShowcaseSection label="Simple Chain">
        <DemoRow>
          <LineageRail nodes={simpleChain} />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="With Icons">
        <DemoRow>
          <LineageRail nodes={withIcons} />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Long Chain">
        <DemoRow>
          <LineageRail nodes={longChain} />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Interactive Nodes">
        <DemoRow>
          <LineageRail nodes={interactive} />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Empty State">
        <DemoRow>
          <LineageRail nodes={[]} />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Single Node">
        <DemoRow>
          <LineageRail nodes={[{ label: 'single_stage' }]} />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Horizontal layout:</strong> Left-to-right chain of connected stages
          </li>
          <li>
            <strong>Arrow connectors:</strong> Visual arrows connecting stages in sequence
          </li>
          <li>
            <strong>Optional icons:</strong> Each stage can have an icon (from Icon library)
          </li>
          <li>
            <strong>Click handlers:</strong> Stages can be clickable with optional onClick callbacks
          </li>
          <li>
            <strong>Label display:</strong> Stage names rendered in monospace for clarity
          </li>
          <li>
            <strong>Responsive width:</strong> Nodes size to fit content with consistent spacing
          </li>
          <li>
            <strong>Empty state handling:</strong> Gracefully handles empty node arrays
          </li>
          <li>
            <strong>Accessibility:</strong> Proper semantic HTML and keyboard navigation support
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow
            name="nodes"
            type="LineageNode[]"
            description="Array of nodes defining the process chain"
            required
          />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="LineageNode Type">
        <PropsTable>
          <PropRow
            name="label"
            type="string"
            description="Stage name displayed below the node"
            required
          />
          <PropRow
            name="icon"
            type="IconName"
            description="Optional icon name (from Icon component library)"
          />
          <PropRow
            name="onClick"
            type="() => void"
            description="Optional click handler; stage becomes clickable when provided"
          />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Use Cases">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', color: 'rgb(var(--canvas-fg-1))' }}>
          <div>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Data Pipeline</strong>
            <div style={{ color: 'rgb(var(--canvas-fg-2))' }}>Show ingestion → processing → publication flow</div>
          </div>
          <div>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Workflow Stages</strong>
            <div style={{ color: 'rgb(var(--canvas-fg-2))' }}>Visualize process steps like draft → review → approval</div>
          </div>
          <div>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Data Lineage</strong>
            <div style={{ color: 'rgb(var(--canvas-fg-2))' }}>Show how data transforms through a pipeline</div>
          </div>
          <div>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Task Execution</strong>
            <div style={{ color: 'rgb(var(--canvas-fg-2))' }}>Display sequential task progression with status</div>
          </div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
