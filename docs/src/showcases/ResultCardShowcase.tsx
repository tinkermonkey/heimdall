import { useState } from 'react'
import { ResultCard } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

export function ResultCardShowcase() {
  const [selectedId, setSelectedId] = useState<string | undefined>('result-1')

  const results = [
    {
      id: 'result-1',
      domain: 'software',
      source: 'github/anthropic/claude-code',
      version: '3.2.1',
      snippet: 'export function useWorkspaceContext() { const ctx = useContext(WorkspaceContext)...',
      score: 0.94,
      provenance: { collection: 'repositories', document: 'src/hooks/useWorkspace.ts', section: 'Context Hook' },
    },
    {
      id: 'result-2',
      domain: 'life',
      source: 'ncbi/pubmed/reference-genome',
      version: '2.5.0',
      snippet:
        'The human reference genome assembly GRCh38 represents the consensus sequence of 3.2 billion base pairs...',
      score: 0.87,
      provenance: { collection: 'publications', document: 'genome-assembly-2024.pdf' },
    },
    {
      id: 'result-3',
      domain: 'climate',
      source: 'noaa/climate-database',
      snippet: 'Global mean temperature anomaly 2024: +1.31°C relative to 20th century baseline...',
      score: 0.76,
      provenance: { collection: 'datasets', document: 'temperature-anomalies.csv', section: 'Annual Summary' },
    },
    {
      id: 'result-4',
      domain: 'data',
      source: 'kaggle/dataset-collection',
      version: '1.0.0',
      snippet: 'This dataset contains 500k records spanning 10 years of transactional data...',
      score: 0.65,
    },
  ]

  return (
    <div>
      <PageHeader
        name="ResultCard"
        description="Search result card component displaying source, version, snippet, relevance score, and provenance information. Supports keyboard interaction and custom actions."
      />

      <ShowcaseSection label="Basic Result">
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="software"
            source="github/anthropic/claude-code"
            version="3.2.1"
            snippet="export function useWorkspaceContext() { const ctx = useContext(WorkspaceContext)..."
            score={0.94}
            selected={true}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="With Provenance">
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="life"
            source="ncbi/pubmed/reference-genome"
            version="2.5.0"
            snippet="The human reference genome assembly GRCh38 represents the consensus sequence of 3.2 billion base pairs..."
            score={0.87}
            provenance={{ collection: 'publications', document: 'genome-assembly-2024.pdf' }}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="With Actions">
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="climate"
            source="noaa/climate-database"
            snippet="Global mean temperature anomaly 2024: +1.31°C relative to 20th century baseline..."
            score={0.76}
            actions={[
              { label: 'Copy', icon: 'copy', onClick: () => alert('Copied') },
              { label: 'Share', icon: 'share', onClick: () => alert('Shared') },
              { label: 'More', icon: 'ellipsis', onClick: () => alert('More options') },
            ]}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="All Domains">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['software', 'life', 'climate', 'data', 'infrastructure'].map((domain) => (
            <div key={domain} style={{ maxWidth: '600px' }}>
              <ResultCard
                domain={domain}
                source={`source/${domain}/example-123`}
                snippet={`Sample content from the ${domain} domain with relevant information...`}
                score={Math.random() * 0.4 + 0.6}
              />
            </div>
          ))}
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Interactive List">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.map((result) => (
            <ResultCard
              key={result.id}
              domain={result.domain}
              source={result.source}
              version={result.version}
              snippet={result.snippet}
              score={result.score}
              selected={selectedId === result.id}
              onClick={() => setSelectedId(result.id)}
              provenance={result.provenance}
            />
          ))}
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Domain-specific styling:</strong> Color-coded domain indicators (life, climate, software, data, infrastructure)
          </li>
          <li>
            <strong>Relevance scoring:</strong> Optional numeric score with visual progress bar (0.0–1.0 range)
          </li>
          <li>
            <strong>Version display:</strong> Optional version pill showing source version
          </li>
          <li>
            <strong>Source and snippet:</strong> Primary content with source attribution and searchable snippet preview
          </li>
          <li>
            <strong>Provenance metadata:</strong> Optional collection, document, and section information
          </li>
          <li>
            <strong>Custom actions:</strong> Icon or text buttons for copy, share, or custom operations
          </li>
          <li>
            <strong>Selection state:</strong> Amber border and background highlight when selected
          </li>
          <li>
            <strong>Keyboard support:</strong> Enter/Space to activate onOpen callback
          </li>
          <li>
            <strong>Accessibility:</strong> Proper ARIA roles and semantic HTML
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="domain" type="string" description="Domain classifier for color coding (software, life, climate, data, infrastructure)" required />
          <PropRow name="source" type="string" description="Source attribution or identifier" required />
          <PropRow name="version" type="string" description="Optional version label displayed as a VersionPill" />
          <PropRow name="snippet" type="ReactNode" description="Searchable content preview" required />
          <PropRow name="provenance" type="ResultCardProvenance" description="Optional metadata: collection, document, section" />
          <PropRow name="score" type="number" description="Optional relevance score (0.0–1.0) displayed with progress bar" />
          <PropRow name="onOpen" type="() => void" description="Fired when card is clicked or Enter/Space pressed" />
          <PropRow
            name="actions"
            type="Array<{ label, icon?, onClick }>"
            description="Array of action buttons with label, optional icon, and onClick handler"
          />
          <PropRow name="selected" type="boolean" def="false" description="When true, renders with amber highlight" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="ResultCardProvenance Type">
        <PropsTable>
          <PropRow name="collection" type="string" description="Collection or dataset name" />
          <PropRow name="document" type="string" description="Document or file identifier" />
          <PropRow name="section" type="string" description="Section or subsection label" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Domain Colors">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            fontSize: '12px',
          }}
        >
          <div style={{ padding: '12px', background: 'rgb(var(--dom-life))', borderRadius: 'var(--radius-sm)', color: 'rgb(var(--canvas-fg-1))' }}>
            <strong>life</strong>
            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>Deterministic gradient</div>
          </div>
          <div style={{ padding: '12px', background: 'rgb(var(--dom-climate))', borderRadius: 'var(--radius-sm)', color: 'rgb(var(--canvas-fg-1))' }}>
            <strong>climate</strong>
            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>Deterministic gradient</div>
          </div>
          <div style={{ padding: '12px', background: 'rgb(var(--dom-software))', borderRadius: 'var(--radius-sm)', color: 'rgb(var(--canvas-fg-1))' }}>
            <strong>software</strong>
            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>Deterministic gradient</div>
          </div>
          <div style={{ padding: '12px', background: 'rgb(var(--dom-default))', borderRadius: 'var(--radius-sm)', color: 'rgb(var(--canvas-fg-1))' }}>
            <strong>data / other</strong>
            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>Fallback color</div>
          </div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
