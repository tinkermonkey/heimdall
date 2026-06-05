import { useState } from 'react'
import { AssetCard, AssetGrid } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

export function AssetCardShowcase() {
  const [selectedId, setSelectedId] = useState<string>('doc-1')

  const assets = [
    {
      id: 'doc-1',
      thumb: { kind: 'doc' as const, ext: 'pdf' },
      title: 'Architecture Guide',
      subtitle: 'Component Design System',
      meta: 'Updated 2 hours ago',
      badge: 'Latest',
    },
    {
      id: 'img-1',
      thumb: { kind: 'image' as const, src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop', fallbackGlyph: 'image' },
      title: 'Team Photo',
      subtitle: 'Engineering team gathering',
      meta: '3.2 MB',
    },
    {
      id: 'cover-1',
      thumb: { kind: 'cover' as const, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glyph: 'sparkles' },
      title: 'Design Tokens',
      subtitle: 'Color & typography specs',
      meta: 'Shared by @designer',
      badge: 'Draft',
    },
    {
      id: 'doc-2',
      thumb: { kind: 'doc' as const, ext: 'xlsx' },
      title: 'Q2 Roadmap',
      subtitle: 'Quarterly planning document',
      meta: '1.5 MB',
    },
    {
      id: 'img-2',
      thumb: { kind: 'image' as const, src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop', fallbackGlyph: 'code' },
      title: 'Codebase Snapshot',
      subtitle: 'Repository visualization',
      meta: '5.1 MB',
    },
    {
      id: 'cover-2',
      thumb: { kind: 'cover' as const, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', glyph: 'palette' },
      title: 'Brand Guidelines',
      subtitle: 'Logo and usage rules',
      meta: 'by @brand-team',
    },
  ]

  return (
    <div>
      <PageHeader
        name="AssetCard & AssetGrid"
        description="Asset card component for displaying documents, images, and cover designs with optional badges and metadata. AssetGrid provides a responsive grid layout for multiple cards."
      />

      <ShowcaseSection label="Individual Asset Cards">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '280px' }}>
          <AssetCard
            thumb={{ kind: 'doc', ext: 'pdf' }}
            title="Design Document"
            subtitle="Component specifications"
            meta="5.2 MB"
            badge="Updated"
            selected={selectedId === 'card-1'}
            onClick={() => setSelectedId('card-1')}
          />
          <AssetCard
            thumb={{
              kind: 'image',
              src: 'https://images.unsplash.com/photo-1551316679-9c6ae9dec224?w=200&h=200&fit=crop',
              fallbackGlyph: 'image',
            }}
            title="Team Photo"
            subtitle="Summer gathering 2024"
            meta="3.2 MB"
            selected={selectedId === 'card-2'}
            onClick={() => setSelectedId('card-2')}
          />
          <AssetCard
            thumb={{ kind: 'cover', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glyph: 'sparkles' }}
            title="Design Tokens"
            subtitle="Color palette specs"
            selected={selectedId === 'card-3'}
            onClick={() => setSelectedId('card-3')}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="AssetGrid - 3 Columns">
        <AssetGrid columns={3} gap={14}>
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              thumb={asset.thumb}
              title={asset.title}
              subtitle={asset.subtitle}
              meta={asset.meta}
              badge={asset.badge}
              selected={selectedId === asset.id}
              onClick={() => setSelectedId(asset.id)}
            />
          ))}
        </AssetGrid>
      </ShowcaseSection>

      <ShowcaseSection label="AssetGrid - 4 Columns">
        <AssetGrid columns={4} gap={12}>
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              thumb={asset.thumb}
              title={asset.title}
              subtitle={asset.subtitle}
              meta={asset.meta}
              badge={asset.badge}
            />
          ))}
        </AssetGrid>
      </ShowcaseSection>

      <ShowcaseSection label="AssetGrid - 2 Columns with Larger Gap">
        <AssetGrid columns={2} gap={20}>
          {assets.slice(0, 4).map((asset) => (
            <AssetCard
              key={asset.id}
              thumb={asset.thumb}
              title={asset.title}
              subtitle={asset.subtitle}
              meta={asset.meta}
              badge={asset.badge}
            />
          ))}
        </AssetGrid>
      </ShowcaseSection>

      <ShowcaseSection label="Thumbnail Types">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'rgb(var(--canvas-fg-2))' }}>
              Document Thumbnails
            </h4>
            <AssetGrid columns={4} gap={12}>
              {['pdf', 'docx', 'xlsx', 'pptx'].map((ext) => (
                <AssetCard
                  key={ext}
                  thumb={{ kind: 'doc', ext }}
                  title={`${ext.toUpperCase()} File`}
                  subtitle="Document type"
                />
              ))}
            </AssetGrid>
          </div>

          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'rgb(var(--canvas-fg-2))' }}>
              Cover Thumbnails
            </h4>
            <AssetGrid columns={3} gap={12}>
              {[
                { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', glyph: 'sparkles' },
                { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', glyph: 'palette' },
                { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', glyph: 'zap' },
              ].map((cover, idx) => (
                <AssetCard
                  key={idx}
                  thumb={{ kind: 'cover' as const, ...cover }}
                  title="Styled Cover"
                  subtitle="Custom gradient"
                />
              ))}
            </AssetGrid>
          </div>

          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'rgb(var(--canvas-fg-2))' }}>
              Image Thumbnails (with fallback)
            </h4>
            <AssetGrid columns={3} gap={12}>
              {[
                { src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop', fallbackGlyph: 'image' },
                { src: 'https://invalid-url-for-testing.com/image.jpg', fallbackGlyph: 'image' },
                { src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop', fallbackGlyph: 'code' },
              ].map((thumb, idx) => (
                <AssetCard
                  key={idx}
                  thumb={{ kind: 'image' as const, ...thumb }}
                  title={idx === 1 ? 'Broken Image' : 'Photo Asset'}
                  subtitle="Image thumbnail"
                />
              ))}
            </AssetGrid>
          </div>
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Multiple thumbnail types:</strong> Document (with file extension tab), image (with fallback), or styled cover
          </li>
          <li>
            <strong>Image fallback:</strong> Graceful degradation with customizable fallback glyph on load error
          </li>
          <li>
            <strong>Metadata display:</strong> Title, subtitle, and custom meta content (size, date, etc.)
          </li>
          <li>
            <strong>Optional badge:</strong> Top-right badge for status, version, or labels (e.g., "Latest", "Draft")
          </li>
          <li>
            <strong>Selection state:</strong> Visual highlight when selected
          </li>
          <li>
            <strong>AssetGrid responsive:</strong> Configurable column count and gap spacing
          </li>
          <li>
            <strong>CSS Grid layout:</strong> Automatic responsive wrapping based on container width
          </li>
          <li>
            <strong>Flexible content:</strong> Supports any ReactNode for meta content
          </li>
          <li>
            <strong>Accessibility:</strong> Proper semantic structure and aria-selected support
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="AssetCard Props">
        <PropsTable>
          <PropRow
            name="thumb"
            type="AssetThumb"
            description="Thumbnail configuration: doc (file), image (src), or cover (gradient + glyph)"
            required
          />
          <PropRow name="title" type="string" description="Card title" required />
          <PropRow name="subtitle" type="string" description="Optional subtitle or secondary text" />
          <PropRow name="meta" type="ReactNode" description="Optional metadata (size, date, author, etc.)" />
          <PropRow name="badge" type="string" description="Optional badge text displayed in top-right corner" />
          <PropRow name="selected" type="boolean" def="false" description="When true, renders with selection highlight" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="AssetGrid Props">
        <PropsTable>
          <PropRow name="columns" type="number" def="3" description="Number of grid columns" />
          <PropRow name="gap" type="number" def="14" description="Gap between items in pixels" />
          <PropRow name="children" type="ReactNode" description="AssetCard components or other content" required />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="AssetThumb Types">
        <div
          style={{
            background: 'rgb(var(--canvas-surface))',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'rgb(var(--canvas-fg-1))',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div>
            <strong>Doc:</strong> &#123; kind: 'doc'; ext: string &#125;
            <div style={{ color: 'rgb(var(--canvas-fg-2))', marginTop: '4px' }}>File extension (pdf, docx, xlsx, etc.)</div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <strong>Image:</strong> &#123; kind: 'image'; src: string; fallbackGlyph?: IconName &#125;
            <div style={{ color: 'rgb(var(--canvas-fg-2))', marginTop: '4px' }}>Image URL with optional fallback icon</div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <strong>Cover:</strong> &#123; kind: 'cover'; gradient: string; glyph: IconName &#125;
            <div style={{ color: 'rgb(var(--canvas-fg-2))', marginTop: '4px' }}>CSS gradient and centered icon</div>
          </div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
