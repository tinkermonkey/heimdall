import { LineageRail, type LineageNode } from '../components/LineageRail'

export default function LineageRailTestPage() {
  const simpleNodes: LineageNode[] = [
    { label: 'source_table' },
    { label: 'transform' },
    { label: 'aggregate' },
  ]

  const manyNodes: LineageNode[] = [
    { label: 'raw_data' },
    { label: 'clean' },
    { label: 'validate' },
    { label: 'enrich' },
    { label: 'deduplicate' },
    { label: 'filter' },
    { label: 'group' },
    { label: 'summarize' },
    { label: 'normalize' },
    { label: 'publish' },
    { label: 'archive' },
  ]

  const withIconsNodes: LineageNode[] = [
    { icon: 'data', label: 'raw_data' },
    { icon: 'pipeline', label: 'transform' },
    { icon: 'schema', label: 'output' },
  ]

  const interactiveNodes: LineageNode[] = [
    { label: 'source', onClick: () => console.log('source clicked') },
    { label: 'process', onClick: () => console.log('process clicked') },
    { label: 'result', onClick: () => console.log('result clicked') },
  ]

  const singleNode: LineageNode[] = [{ label: 'only_stage' }]

  const emptyNodes: LineageNode[] = []

  return (
    <div style={{ padding: '22px 26px 32px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      {/* Section: Simple 3-Node Chain */}
      <section style={{ marginBottom: '40px' }}>
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
          LineageRail · Simple 3-Node Chain
        </div>
        <LineageRail nodes={simpleNodes} aria-label="Simple lineage chain: source_table → transform → aggregate" />
      </section>

      {/* Section: Many Nodes (Scroll) */}
      <section style={{ marginBottom: '40px' }}>
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
          LineageRail · Many Nodes (Scroll)
        </div>
        <LineageRail
          nodes={manyNodes}
          aria-label="Complex lineage: raw_data → clean → validate → enrich → deduplicate → filter → group → summarize → normalize → publish → archive"
        />
      </section>

      {/* Section: Many Nodes (Wrap) */}
      <section style={{ marginBottom: '40px' }}>
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
          LineageRail · Many Nodes (Wrap)
        </div>
        <LineageRail
          nodes={manyNodes}
          wrap
          aria-label="Complex lineage with wrapping: raw_data → clean → validate → enrich → deduplicate → filter → group → summarize → normalize → publish → archive"
        />
      </section>

      {/* Section: With Icons */}
      <section style={{ marginBottom: '40px' }}>
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
          LineageRail · With Icons
        </div>
        <LineageRail nodes={withIconsNodes} aria-label="Lineage with icons: raw_data → transform → output" />
      </section>

      {/* Section: Interactive Nodes */}
      <section style={{ marginBottom: '40px' }}>
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
          LineageRail · Interactive Nodes (Click Me!)
        </div>
        <LineageRail nodes={interactiveNodes} aria-label="Interactive lineage: source → process → result" />
      </section>

      {/* Section: Single Node */}
      <section style={{ marginBottom: '40px' }}>
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
          LineageRail · Single Node (No Arrow)
        </div>
        <LineageRail nodes={singleNode} aria-label="Single stage lineage: only_stage" />
      </section>

      {/* Section: Empty Nodes */}
      <section style={{ marginBottom: '40px' }}>
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
          LineageRail · Empty Nodes (Renders Nothing)
        </div>
        <div style={{ color: 'rgb(var(--canvas-fg-3))', fontSize: '12px' }}>
          {emptyNodes.length === 0 ? 'No lineage to display' : <LineageRail nodes={emptyNodes} />}
        </div>
      </section>
    </div>
  )
}
