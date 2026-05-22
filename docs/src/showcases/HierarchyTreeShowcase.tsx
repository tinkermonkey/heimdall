import {
  HierarchyTree,
  HierarchyRow,
  type HierarchyRowProps,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const TREE_ROWS: HierarchyRowProps[] = [
  { depth: 0, kind: 'taxonomy', label: 'root_taxonomy', domain: 'life', description: 'Root taxonomy for life sciences' },
  { depth: 1, kind: 'scheme', label: 'public_scheme', domain: 'life', description: 'Public classification scheme', meta: '8 classes' },
  { depth: 2, kind: 'class', label: 'class_a', domain: 'life', description: 'First class in public scheme' },
  { depth: 2, kind: 'class', label: 'class_b', domain: 'life', description: 'Second class in public scheme', meta: '5500 items' },
  { depth: 1, kind: 'scheme', label: 'private_scheme', domain: 'life', description: 'Private classification scheme' },
  { depth: 2, kind: 'class', label: 'class_c', domain: 'life', description: 'First class in private scheme', meta: '150 items' },
  { depth: 0, kind: 'taxonomy', label: 'secondary_taxonomy', domain: 'climate', description: 'Secondary taxonomy for climate data' },
  { depth: 1, kind: 'scheme', label: 'metrics_scheme', domain: 'climate', description: 'Climate metrics classification', meta: '3 classes' },
  { depth: 2, kind: 'class', label: 'class_d', domain: 'climate', description: 'Temperature class' },
]

export function HierarchyTreeShowcase() {
  return (
    <div>
      <PageHeader name="HierarchyTree / HierarchyRow" description="Hierarchical tree display with depth-based indentation, domain-colored swatches, and row metadata." />
      <ShowcaseSection label="Full hierarchy tree">
        <HierarchyTree>
          {TREE_ROWS.map((row, idx) => (
            <HierarchyRow key={idx} {...row} />
          ))}
        </HierarchyTree>
      </ShowcaseSection>
      <ShowcaseSection label="Custom tree">
        <HierarchyTree>
          <HierarchyRow depth={0} kind="taxonomy" label="knowledge_taxonomy" domain="software" description="Knowledge taxonomy for software concepts" meta="6 schemes" />
          <HierarchyRow depth={1} kind="scheme" label="entity_scheme" domain="software" description="Entity classification scheme" meta="250 classes" />
          <HierarchyRow depth={2} kind="class" label="person_class" domain="software" description="Person entity class" />
          <HierarchyRow depth={2} kind="class" label="organization_class" domain="software" description="Organization entity class" meta="150 items" />
          <HierarchyRow depth={1} kind="scheme" label="relation_scheme" domain="software" description="Relationship classification scheme" meta="100 classes" />
          <HierarchyRow depth={2} kind="class" label="works_at_class" domain="software" description="Works at relationship class" />
        </HierarchyTree>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="HierarchyTree" type="component" description="Container for HierarchyRow children" />
          <PropRow name="HierarchyRow" type="component" description="Individual row with depth, kind, label, domain, and description" />
          <PropRow name="HierarchyRow.depth" type="number" description="Nesting depth for indentation (0-based)" />
          <PropRow name="HierarchyRow.kind" type="'taxonomy' | 'scheme' | 'class'" description="Entity type classification" />
          <PropRow name="HierarchyRow.label" type="string" description="Display label for the row" />
          <PropRow name="HierarchyRow.domain" type="string" description="Domain classification for color-coding (life, climate, software, etc.)" />
          <PropRow name="HierarchyRow.description" type="string" description="Description text displayed on hover/expanded" />
          <PropRow name="HierarchyRow.meta" type="string | undefined" description="Optional metadata (count, item count, etc.) displayed right-aligned" />
          <PropRow name="HierarchyRow.selected" type="boolean | undefined" description="Whether the row shows the selected state (amber ring)" />
          <PropRow name="HierarchyRow.onSelect" type="() => void | undefined" description="Optional selection handler" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
