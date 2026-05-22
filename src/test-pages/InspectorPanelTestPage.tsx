import { InspectorPanel, KVGrid, Button } from '../components'

export default function InspectorPanelTestPage() {
  const kvRows = [
    { key: 'CREATED', value: '2026-05-22T14:30:00Z' },
    { key: 'STATUS', value: 'active' },
    { key: 'REGION', value: 'us-east-1' },
    { key: 'REPLICAS', value: '3' },
    { key: 'CPU', value: '2 cores' },
    { key: 'MEMORY', value: '8 GB' },
  ]

  return (
    <div style={{ padding: '22px 26px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
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
          InspectorPanel · Basic
        </div>
        <div style={{ display: 'flex', gap: '20px', height: '400px' }}>
          <div style={{ flex: 1, backgroundColor: 'rgb(var(--canvas-surface))', borderRadius: '6px' }}>
            <InspectorPanel
              eyebrow="SERVICE"
              title="auth-gateway"
              id="svc_4f3a8b"
              actions={<Button>Configure</Button>}
            >
              <InspectorPanel.Section title="METADATA" count={6}>
                <KVGrid rows={kvRows} />
              </InspectorPanel.Section>
              <InspectorPanel.Section title="TAGS" count={2}>
                <KVGrid
                  rows={[
                    { key: 'ENVIRONMENT', value: 'production' },
                    { key: 'TEAM', value: 'platform' },
                  ]}
                />
              </InspectorPanel.Section>
            </InspectorPanel>
          </div>
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
          InspectorPanel · With Version
        </div>
        <div style={{ display: 'flex', gap: '20px', height: '400px' }}>
          <div style={{ flex: 1, backgroundColor: 'rgb(var(--canvas-surface))', borderRadius: '6px' }}>
            <InspectorPanel
              eyebrow="DEPLOYMENT"
              title="api-server"
              id="deploy_e8c2"
              version={1}
              actions={<Button>Rollback</Button>}
            >
              <InspectorPanel.Section title="INFO" count={4}>
                <KVGrid
                  rows={[
                    { key: 'IMAGE', value: 'registry.io/api-server:1.2.3' },
                    { key: 'REPLICAS', value: '5' },
                    { key: 'CPU', value: '1 core' },
                    { key: 'MEMORY', value: '512 MB' },
                  ]}
                />
              </InspectorPanel.Section>
              <InspectorPanel.Section title="CONDITIONS" count={3}>
                <KVGrid
                  rows={[
                    { key: 'READY', value: 'True' },
                    { key: 'PROGRESS', value: 'True' },
                    { key: 'AVAILABLE', value: 'True' },
                  ]}
                />
              </InspectorPanel.Section>
            </InspectorPanel>
          </div>
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
          KVGrid · Standalone
        </div>
        <div style={{ backgroundColor: 'rgb(var(--canvas-surface))', padding: '16px', borderRadius: '6px' }}>
          <KVGrid
            rows={[
              { key: 'ID', value: 'cls_4f3a8b21' },
              { key: 'NAME', value: 'organism' },
              { key: 'CLASS', value: 'life' },
              { key: 'DOMAIN', value: 'biology' },
              { key: 'DESCRIPTION', value: 'A living system with complex interactions' },
              { key: 'STATUS', value: 'active' },
            ]}
          />
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
          InspectorPanel · Multiple Sections with Actions
        </div>
        <div style={{ display: 'flex', gap: '20px', height: '500px' }}>
          <div style={{ flex: 1, backgroundColor: 'rgb(var(--canvas-surface))', borderRadius: '6px' }}>
            <InspectorPanel
              eyebrow="RESOURCE"
              title="database-cluster"
              id="db_cluster_xyz"
              version={3}
              actions={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button style={{ fontSize: '12px', padding: '4px 8px' }}>Edit</Button>
                  <Button style={{ fontSize: '12px', padding: '4px 8px' }}>Delete</Button>
                </div>
              }
            >
              <InspectorPanel.Section title="BASIC" count={3}>
                <KVGrid
                  rows={[
                    { key: 'CREATED', value: '2026-01-15T10:30:00Z' },
                    { key: 'REGION', value: 'us-west-2' },
                    { key: 'TYPE', value: 'PostgreSQL 14' },
                  ]}
                />
              </InspectorPanel.Section>
              <InspectorPanel.Section title="METRICS" count={2}>
                <KVGrid
                  rows={[
                    { key: 'CONNECTIONS', value: '42 / 100' },
                    { key: 'DISK_USAGE', value: '65%' },
                  ]}
                />
              </InspectorPanel.Section>
              <InspectorPanel.Section title="REPLICAS" count={1}>
                <KVGrid
                  rows={[
                    { key: 'PRIMARY', value: 'db-1-primary' },
                  ]}
                />
              </InspectorPanel.Section>
              <InspectorPanel.Section
                title="ACTIONS"
                count={0}
                actions={
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button style={{ fontSize: '11px', padding: '2px 6px' }}>Backup</Button>
                    <Button style={{ fontSize: '11px', padding: '2px 6px' }}>Restore</Button>
                  </div>
                }
              />
            </InspectorPanel>
          </div>
        </div>
      </section>
    </div>
  )
}
