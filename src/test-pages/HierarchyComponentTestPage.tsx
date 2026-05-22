import { useState } from 'react'
import { HierarchyRow } from '../components/HierarchyRow'
import { HierarchyTree } from '../components/HierarchyTree'

export default function HierarchyComponentTestPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const hierarchyData = [
    {
      id: 'root-1',
      depth: 0,
      domain: 'life',
      kind: 'taxonomy' as const,
      label: 'organism',
      meta: 'v1.0',
      description: 'Living organisms and their biological classification system.',
    },
    {
      id: 'child-1',
      depth: 1,
      domain: 'life',
      kind: 'class' as const,
      label: 'mammal',
      description: 'A vertebrate animal that feeds its young with milk.',
    },
    {
      id: 'child-2',
      depth: 2,
      domain: 'life',
      kind: 'scheme' as const,
      label: 'primate',
      meta: 'draft',
      description: 'An order of mammals that includes humans, apes, and monkeys.',
    },
    {
      id: 'root-2',
      depth: 0,
      domain: 'climate',
      kind: 'taxonomy' as const,
      label: 'weather_system',
      description: 'Classification of atmospheric weather patterns and systems.',
    },
    {
      id: 'child-3',
      depth: 1,
      domain: 'climate',
      kind: 'class' as const,
      label: 'storm_system',
      description: 'Violent disturbance of the atmosphere with strong wind.',
    },
    {
      id: 'root-3',
      depth: 0,
      domain: 'software',
      kind: 'taxonomy' as const,
      label: 'service_mesh',
      description: 'Infrastructure layer for service-to-service communication.',
    },
    {
      id: 'child-4',
      depth: 1,
      domain: 'software',
      kind: 'scheme' as const,
      label: 'load_balancer',
      description: 'Distributes network traffic across multiple servers.',
    },
  ]

  return (
    <div style={{ padding: '22px 28px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          HierarchyRow & HierarchyTree Components
        </div>

        <div style={{ maxWidth: '900px', marginBottom: '24px' }}>
          <HierarchyTree>
            {hierarchyData.map((item) => (
              <HierarchyRow
                key={item.id}
                depth={item.depth}
                domain={item.domain}
                kind={item.kind}
                label={item.label}
                meta={item.meta}
                description={item.description}
                selected={selectedId === item.id}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
          </HierarchyTree>
        </div>

        <div style={{ fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
          Selected: {selectedId || 'none'}
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Domain Color Swatches
        </div>

        <div style={{ display: 'flex', gap: '16px', maxWidth: '900px' }}>
          {['life', 'climate', 'software', 'default'].map((domain) => (
            <div key={domain} style={{ flex: 1 }}>
              <HierarchyTree>
                <HierarchyRow
                  depth={0}
                  domain={domain}
                  kind="taxonomy"
                  label={`domain: ${domain}`}
                  description="Shows the domain color swatch on the kg-node pill"
                  selected={false}
                />
              </HierarchyTree>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgb(var(--canvas-fg-3))',
            marginBottom: '14px',
          }}
        >
          Depth Indentation with Connectors
        </div>

        <div style={{ maxWidth: '900px' }}>
          <HierarchyTree>
            {[0, 1, 2].map((depth) => (
              <HierarchyRow
                key={`depth-${depth}`}
                depth={depth}
                domain="life"
                kind="class"
                label={`depth_level_${depth}`}
                description={`Indented by ${depth * 20}px with dashed connector`}
                selected={false}
              />
            ))}
          </HierarchyTree>
        </div>
      </section>
    </div>
  )
}
