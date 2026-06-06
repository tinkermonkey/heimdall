import { useState } from "react";
import { ResultCard } from "../components/ResultCard";
import { AssetCard } from "../components/AssetCard";
import { AssetGrid } from "../components/AssetGrid";
import { LogStream } from "../components/LogStream";

export default function CardsAndListsTestPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div
      style={{
        padding: "22px 28px",
        backgroundColor: "rgb(var(--canvas-bg))",
        minHeight: "100vh",
      }}
    >
      {/* ResultCard Component Section */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          ResultCard · Default State
        </div>
        <div style={{ maxWidth: "600px" }}>
          <ResultCard
            domain="life"
            source="taxonomy_schema"
            version="v2.1.0"
            snippet="The organism classification system includes all known species in the biological kingdom. This comprehensive schema..."
            provenance={{
              collection: "biological_data",
              document: "doc_organism_001",
              section: "classification",
            }}
            onOpen={() => console.log("Opened result")}
            actions={[
              {
                label: "View",
                icon: "eye",
                onClick: () => {
                  console.log("Action clicked");
                  console.log("View clicked");
                },
              },
              {
                label: "Copy",
                icon: "copy",
                onClick: () => {
                  console.log("Action clicked");
                  console.log("Copy clicked");
                },
              },
            ]}
          />
        </div>
      </section>

      {/* ResultCard with Score */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          ResultCard · With Similarity Score
        </div>
        <div style={{ maxWidth: "600px" }}>
          <ResultCard
            domain="climate"
            source="weather_patterns"
            version="v1.5.0"
            score={0.87}
            snippet="Climate classification based on temperature and precipitation patterns. Defines tropical, temperate, arid, and..."
            provenance={{
              collection: "climate_data",
              document: "doc_climate_001",
            }}
            onOpen={() => console.log("Opened result")}
            actions={[
              {
                label: "View",
                icon: "eye",
                onClick: () => {
                  console.log("Action clicked");
                  console.log("View clicked");
                },
              },
            ]}
          />
        </div>
      </section>

      {/* ResultCard with Mark Elements */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          ResultCard · With Highlighted Matches
        </div>
        <div style={{ maxWidth: "600px" }}>
          <ResultCard
            domain="software"
            source="api_documentation"
            score={0.92}
            snippet={
              <>
                The <mark>REST API</mark> provides endpoints for managing
                resources. The <mark>API</mark> supports standard HTTP methods
                and returns JSON responses for all operations.
              </>
            }
            provenance={{
              collection: "api_docs",
              document: "doc_rest_api",
              section: "overview",
            }}
            onOpen={() => console.log("Opened result")}
            actions={[
              {
                label: "View",
                icon: "eye",
                onClick: () => {
                  console.log("Action clicked");
                  console.log("View clicked");
                },
              },
              {
                label: "Copy",
                icon: "copy",
                onClick: () => {
                  console.log("Action clicked");
                  console.log("Copy clicked");
                },
              },
              {
                label: "More",
                icon: "moreHorizontal",
                onClick: () => {
                  console.log("Action clicked");
                  console.log("More clicked");
                },
              },
            ]}
          />
        </div>
      </section>

      {/* ResultCard without Score */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          ResultCard · Without Score
        </div>
        <div style={{ maxWidth: "600px" }}>
          <ResultCard
            domain="data"
            source="database_schema"
            version="3.0.0"
            snippet="The database schema defines tables for users, sessions, and metadata. All tables include timestamp fields for audit trails."
            onOpen={() => console.log("Opened result")}
          />
        </div>
      </section>

      {/* ResultCard Selected State */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          ResultCard · Selected State
        </div>
        <div style={{ maxWidth: "600px" }}>
          <ResultCard
            domain="infrastructure"
            source="network_config"
            version="v2.0.0"
            score={0.75}
            snippet="Network configuration for production environment includes load balancers, routing rules, and failover policies..."
            provenance={{
              collection: "infra_config",
              document: "doc_network_001",
            }}
            selected={true}
            onOpen={() => console.log("Opened result")}
            actions={[
              {
                label: "View",
                icon: "eye",
                onClick: () => {
                  console.log("Action clicked");
                  console.log("View clicked");
                },
              },
              {
                label: "Edit",
                icon: "edit",
                onClick: () => {
                  console.log("Action clicked");
                  console.log("Edit clicked");
                },
              },
            ]}
          />
        </div>
      </section>

      {/* Multiple Results */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          ResultCard · Multiple Results with Selection
        </div>
        <div
          style={{
            maxWidth: "600px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {[
            {
              id: "result-1",
              domain: "life",
              source: "taxonomy_v2",
              version: "v2.1.0",
              score: 0.95,
              snippet:
                "Comprehensive biological taxonomy including kingdoms, phyla, classes, orders, families...",
            },
            {
              id: "result-2",
              domain: "climate",
              source: "weather_data",
              version: "v1.8.0",
              score: 0.82,
              snippet:
                "Global weather patterns and climate classifications for meteorological analysis...",
            },
            {
              id: "result-3",
              domain: "software",
              source: "code_repo",
              score: 0.78,
              snippet:
                "Source code repository containing implementation and documentation...",
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
                {
                  label: "View",
                  icon: "eye",
                  onClick: () => {
                    console.log("Action clicked");
                    console.log(`View ${result.id}`);
                  },
                },
                {
                  label: "Copy",
                  icon: "copy",
                  onClick: () => {
                    console.log("Action clicked");
                    console.log(`Copy ${result.id}`);
                  },
                },
              ]}
            />
          ))}
        </div>
      </section>

      {/* Minimal ResultCard */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          ResultCard · Minimal (No Version, Score, Provenance)
        </div>
        <div style={{ maxWidth: "600px" }}>
          <ResultCard
            domain="data"
            source="simple_result"
            snippet="A simple result with just domain, source, and snippet content. No additional metadata or actions."
          />
        </div>
      </section>

      {/* AssetCard · Doc Thumbnail */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          AssetCard · Doc Thumbnail
        </div>
        <div style={{ maxWidth: "240px" }}>
          <AssetCard
            thumb={{ kind: 'doc', ext: 'pdf' }}
            title="Quarterly Report Q2 2025"
            subtitle="report_q2_2025.pdf"
          />
        </div>
      </section>

      {/* AssetCard · Cover Thumbnail */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          AssetCard · Cover Thumbnail
        </div>
        <div style={{ maxWidth: "240px" }}>
          <AssetCard
            thumb={{
              kind: 'cover',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              glyph: 'palette'
            }}
            title="Summer Vibes Playlist"
            subtitle="playlist_2025"
          />
        </div>
      </section>

      {/* AssetCard · Image Thumbnail */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          AssetCard · Image Thumbnail
        </div>
        <div style={{ maxWidth: "240px" }}>
          <AssetCard
            thumb={{
              kind: 'image',
              src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
              fallbackGlyph: 'file'
            }}
            title="Portrait Photography Session"
            subtitle="photo_session_001"
          />
        </div>
      </section>

      {/* AssetCard · With Badge */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          AssetCard · With Badge
        </div>
        <div style={{ maxWidth: "240px" }}>
          <AssetCard
            thumb={{ kind: 'doc', ext: 'docx' }}
            title="Important Document with Badge"
            subtitle="document.docx"
            badge="cited"
          />
        </div>
      </section>

      {/* AssetCard · Selected State */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          AssetCard · Selected State
        </div>
        <div style={{ maxWidth: "240px" }}>
          <AssetCard
            thumb={{
              kind: 'cover',
              gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              glyph: 'component'
            }}
            title="Conference Recording 2025"
            subtitle="video_conference_001"
            selected={true}
          />
        </div>
      </section>

      {/* AssetCard · Image Fallback */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          AssetCard · Image Fallback (broken src)
        </div>
        <div style={{ maxWidth: "240px" }}>
          <AssetCard
            thumb={{
              kind: 'image',
              src: 'https://invalid-url-that-will-fail.com/image.jpg',
              fallbackGlyph: 'file'
            }}
            title="Broken Image Asset"
            subtitle="broken_image.jpg"
          />
        </div>
      </section>

      {/* AssetGrid · 3 Column Layout */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          AssetGrid · 3 Column Layout
        </div>
        <AssetGrid columns={3}>
          <AssetCard
            thumb={{ kind: 'doc', ext: 'pdf' }}
            title="Annual Report 2024"
            subtitle="annual_report_2024.pdf"
          />
          <AssetCard
            thumb={{
              kind: 'cover',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              glyph: 'star'
            }}
            title="Indie Rock Collection"
            subtitle="playlist_indie"
            badge="new"
          />
          <AssetCard
            thumb={{
              kind: 'image',
              src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop',
              fallbackGlyph: 'file'
            }}
            title="Product Photography"
            subtitle="product_shoot_001"
          />
          <AssetCard
            thumb={{ kind: 'doc', ext: 'xlsx' }}
            title="Financial Spreadsheet"
            subtitle="financials_2025.xlsx"
            badge="cited"
          />
          <AssetCard
            thumb={{
              kind: 'cover',
              gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              glyph: 'component'
            }}
            title="Training Video Series"
            subtitle="training_videos"
          />
          <AssetCard
            thumb={{ kind: 'doc', ext: 'pptx' }}
            title="Q3 Presentation"
            subtitle="q3_presentation.pptx"
            selected={true}
          />
        </AssetGrid>
      </section>

      {/* LogStream · Default State (Info/Warn/Error) */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          LogStream · Default State (Info/Warn/Error/Debug)
        </div>
        <div style={{ height: "300px", maxWidth: "800px" }}>
          <LogStream
            entries={[
              {
                timestamp: new Date(Date.now() - 10000),
                level: 'INFO',
                message: 'Application started successfully',
              },
              {
                timestamp: new Date(Date.now() - 8000),
                level: 'DEBUG',
                message: 'Loading configuration from environment variables',
              },
              {
                timestamp: new Date(Date.now() - 6000),
                level: 'INFO',
                message: 'Database connection established',
              },
              {
                timestamp: new Date(Date.now() - 4000),
                level: 'WARN',
                message: 'Slow query detected: SELECT * FROM users took 2500ms',
              },
              {
                timestamp: new Date(Date.now() - 2000),
                level: 'ERROR',
                message: 'Failed to connect to cache server: ECONNREFUSED',
              },
              {
                timestamp: new Date(),
                level: 'INFO',
                message: 'Retrying cache connection',
              },
            ]}
            follow={true}
          />
        </div>
      </section>

      {/* LogStream · With Op/Target Columns */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          LogStream · With Op/Target Columns
        </div>
        <div style={{ height: "300px", maxWidth: "1000px" }}>
          <LogStream
            entries={[
              {
                timestamp: new Date(Date.now() - 12000),
                level: 'INFO',
                op: 'SELECT',
                target: 'users',
                message: 'Query started for users table',
              },
              {
                timestamp: new Date(Date.now() - 10000),
                level: 'DEBUG',
                op: 'SELECT',
                target: 'users',
                message: 'Executing: SELECT * FROM users WHERE id = ?',
              },
              {
                timestamp: new Date(Date.now() - 8000),
                level: 'INFO',
                op: 'INSERT',
                target: 'logs',
                message: 'Log entry created',
              },
              {
                timestamp: new Date(Date.now() - 6000),
                level: 'WARN',
                op: 'UPDATE',
                target: 'sessions',
                message: 'Session timeout approaching for user_123',
              },
              {
                timestamp: new Date(Date.now() - 4000),
                level: 'ERROR',
                op: 'DELETE',
                target: 'cache',
                message: 'Failed to delete expired cache entries',
              },
              {
                timestamp: new Date(Date.now() - 2000),
                level: 'INFO',
                message: 'Cache cleanup scheduled for next cycle',
              },
              {
                timestamp: new Date(),
                level: 'DEBUG',
                op: 'SELECT',
                target: 'metrics',
                message: 'Retrieving system metrics',
              },
            ]}
            showOps={true}
            follow={true}
          />
        </div>
      </section>

      {/* LogStream · Empty State */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          LogStream · Empty State
        </div>
        <div style={{ height: "200px", maxWidth: "800px" }}>
          <LogStream entries={[]} follow={true} />
        </div>
      </section>

      {/* LogStream · Without Follow (Fixed Scroll) */}
      <section style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgb(var(--canvas-fg-3))",
            marginBottom: "14px",
          }}
        >
          LogStream · Without Follow (Fixed Scroll)
        </div>
        <div style={{ height: "250px", maxWidth: "800px" }}>
          <LogStream
            entries={Array.from({ length: 30 }, (_, i) => ({
              timestamp: new Date(Date.now() - (30 - i) * 1000),
              level: ['INFO', 'WARN', 'ERROR', 'DEBUG'][i % 4] as any,
              message: `Log entry number ${i + 1}`,
            }))}
            follow={false}
            maxRows={500}
          />
        </div>
      </section>
    </div>
  );
}
