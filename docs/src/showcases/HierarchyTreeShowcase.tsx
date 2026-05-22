import {
  HierarchyTree,
  HierarchyRow,
  type HierarchyRowProps,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const TREE_ROWS: HierarchyRowProps[] = [
  { depth: 0, kind: 'database', label: 'main_db', count: 12 },
  { depth: 1, kind: 'schema', label: 'public', count: 8 },
  { depth: 2, kind: 'table', label: 'users', count: 1000 },
  { depth: 2, kind: 'table', label: 'posts', count: 5500 },
  { depth: 1, kind: 'schema', label: 'private', count: 4 },
  { depth: 2, kind: 'table', label: 'sessions', count: 150 },
  { depth: 0, kind: 'database', label: 'analytics_db', count: 3 },
  { depth: 1, kind: 'schema', label: 'metrics', count: 3 },
  { depth: 2, kind: 'table', label: 'page_views', count: 2000000 },
]

export function HierarchyTreeShowcase() {
  return (
    <div>
      <PageHeader name="HierarchyTree / HierarchyRow" description="Hierarchical tree display with depth-based indentation, domain-colored swatches, and row metadata." />
      <ShowcaseSection label="Full hierarchy tree">
        <HierarchyTree rows={TREE_ROWS} />
      </ShowcaseSection>
      <ShowcaseSection label="Custom tree">
        <HierarchyTree
          rows={[
            { depth: 0, kind: 'graph', label: 'knowledge_graph', count: 500 },
            { depth: 1, kind: 'entity', label: 'Person', count: 250 },
            { depth: 1, kind: 'entity', label: 'Organization', count: 150 },
            { depth: 2, kind: 'attribute', label: 'name', count: 150 },
            { depth: 2, kind: 'attribute', label: 'email', count: 120 },
            { depth: 1, kind: 'relationship', label: 'works_at', count: 100 },
          ]}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="rows" type="HierarchyRowProps[]" description="Array of row definitions with depth, kind, label, count" />
          <PropRow name="HierarchyRow.depth" type="number" description="Nesting depth for indentation (0-based)" />
          <PropRow name="HierarchyRow.kind" type="HierarchyKind" description="Entity type (database, schema, table, graph, entity, relationship, etc.)" />
          <PropRow name="HierarchyRow.label" type="string" description="Display label for the row" />
          <PropRow name="HierarchyRow.count" type="number" description="Optional count/metric displayed right-aligned" />
          <PropRow name="HierarchyRow.selected" type="boolean" description="Whether the row shows the selected state (amber ring)" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
