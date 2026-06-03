import { useState } from 'react'
import { ResultCard } from '../components/ResultCard'

export default function CardsAndListsTestPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div style={{ padding: '22px 28px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      {/* ResultCard Component Section */}
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
          ResultCard · Default State
        </div>
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="life"
            source="taxonomy_schema"
            version="v2.1.0"
            snippet="The organism classification system includes all known species in the biological kingdom. This comprehensive schema..."
            provenance={{
              collection: 'biological_data',
              document: 'doc_organism_001',
              section: 'classification',
            }}
            onOpen={() => console.log('Opened result')}
            actions={[
              { label: 'View', icon: 'eye', onClick: () => console.log('View clicked') },
              { label: 'Copy', icon: 'copy', onClick: () => console.log('Copy clicked') },
            ]}
          />
        </div>
      </section>

      {/* ResultCard with Score */}
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
          ResultCard · With Similarity Score
        </div>
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="climate"
            source="weather_patterns"
            version="v1.5.0"
            score={0.87}
            snippet="Climate classification based on temperature and precipitation patterns. Defines tropical, temperate, arid, and..."
            provenance={{
              collection: 'climate_data',
              document: 'doc_climate_001',
            }}
            onOpen={() => console.log('Opened result')}
            actions={[{ label: 'View', icon: 'eye', onClick: () => console.log('View clicked') }]}
          />
        </div>
      </section>

      {/* ResultCard with Mark Elements */}
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
          ResultCard · With Highlighted Matches
        </div>
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="software"
            source="api_documentation"
            score={0.92}
            snippet={
              <>
                The <mark>REST API</mark> provides endpoints for managing resources. The <mark>API</mark> supports standard HTTP
                methods and returns JSON responses for all operations.
              </>
            }
            provenance={{
              collection: 'api_docs',
              document: 'doc_rest_api',
              section: 'overview',
            }}
            onOpen={() => console.log('Opened result')}
            actions={[
              { label: 'View', icon: 'eye', onClick: () => console.log('View clicked') },
              { label: 'Copy', icon: 'copy', onClick: () => console.log('Copy clicked') },
              { label: 'More', icon: 'moreHorizontal', onClick: () => console.log('More clicked') },
            ]}
          />
        </div>
      </section>

      {/* ResultCard without Score */}
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
          ResultCard · Without Score
        </div>
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="data"
            source="database_schema"
            version="3.0.0"
            snippet="The database schema defines tables for users, sessions, and metadata. All tables include timestamp fields for audit trails."
            onOpen={() => console.log('Opened result')}
          />
        </div>
      </section>

      {/* ResultCard Selected State */}
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
          ResultCard · Selected State
        </div>
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="infrastructure"
            source="network_config"
            version="v2.0.0"
            score={0.75}
            snippet="Network configuration for production environment includes load balancers, routing rules, and failover policies..."
            provenance={{
              collection: 'infra_config',
              document: 'doc_network_001',
            }}
            selected={true}
            onOpen={() => console.log('Opened result')}
            actions={[
              { label: 'View', icon: 'eye', onClick: () => console.log('View clicked') },
              { label: 'Edit', icon: 'edit', onClick: () => console.log('Edit clicked') },
            ]}
          />
        </div>
      </section>

      {/* Multiple Results */}
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
          ResultCard · Multiple Results with Selection
        </div>
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            {
              id: 'result-1',
              domain: 'life',
              source: 'taxonomy_v2',
              version: 'v2.1.0',
              score: 0.95,
              snippet: 'Comprehensive biological taxonomy including kingdoms, phyla, classes, orders, families...',
            },
            {
              id: 'result-2',
              domain: 'climate',
              source: 'weather_data',
              version: 'v1.8.0',
              score: 0.82,
              snippet: 'Global weather patterns and climate classifications for meteorological analysis...',
            },
            {
              id: 'result-3',
              domain: 'software',
              source: 'code_repo',
              score: 0.78,
              snippet: 'Source code repository containing implementation and documentation...',
            },
          ].map((result) => (
            <ResultCard
              key={result.id}
              domain={result.domain}
              source={result.source}
              version={result.version}
              score={result.score}
              snippet={result.snippet}
              selected={selectedId === result.id}
              onOpen={() => setSelectedId(result.id)}
              actions={[
                { label: 'View', icon: 'eye', onClick: () => console.log(`View ${result.id}`) },
                { label: 'Copy', icon: 'copy', onClick: () => console.log(`Copy ${result.id}`) },
              ]}
            />
          ))}
        </div>
      </section>

      {/* Minimal ResultCard */}
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
          ResultCard · Minimal (No Version, Score, Provenance)
        </div>
        <div style={{ maxWidth: '600px' }}>
          <ResultCard
            domain="data"
            source="simple_result"
            snippet="A simple result with just domain, source, and snippet content. No additional metadata or actions."
          />
        </div>
      </section>
    </div>
  )
}
