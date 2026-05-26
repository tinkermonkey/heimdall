import { useState } from 'react'
import {
  ConfigTile,
  type ConfigTileProps,
  type ConfigTileSummaryItem,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

export function ConfigTileShowcase() {
  const [lastClicked, setLastClicked] = useState<string | null>(null)

  const tiles: ConfigTileProps[] = [
    {
      id: 'database',
      icon: 'schema',
      title: 'Database Config',
      description: 'PostgreSQL connection and settings',
      summary: [
        { label: 'host', value: 'localhost' },
        { label: 'port', value: '5432' },
      ],
      onClick: () => setLastClicked('database'),
    },
    {
      id: 'cache',
      icon: 'settings',
      title: 'Cache Settings',
      description: 'Redis cache configuration',
      summary: [
        { label: 'ttl', value: '3600s' },
        { label: 'size', value: '2GB' },
      ],
      onClick: () => setLastClicked('cache'),
    },
    {
      id: 'logging',
      icon: 'info',
      title: 'Logging Config',
      description: 'Log levels and outputs',
      summary: [
        { label: 'level', value: 'INFO' },
        { label: 'output', value: '/var/log' },
      ],
      onClick: () => setLastClicked('logging'),
    },
  ]

  return (
    <div>
      <PageHeader name="ConfigTile" description="Configuration tile with icon, title, description, and key-value summary pairs. Extended QuickAccessTile pattern." />
      <ShowcaseSection label="Configuration tile grid">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {tiles.map(tile => (
            <ConfigTile
              key={tile.id}
              {...tile}
              onClick={() => setLastClicked(tile.id)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
        {lastClicked && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}>
            Last clicked: <span style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--canvas-fg-2))' }}>{lastClicked}</span>
          </div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="Single config tile">
        <div style={{ maxWidth: 300 }}>
          <ConfigTile
            id="api"
            icon="upload"
            title="API Settings"
            description="REST API configuration"
            summary={[
              { label: 'base_url', value: 'https://api.example.com' },
              { label: 'timeout', value: '30s' },
              { label: 'version', value: 'v2' },
            ]}
            onClick={() => setLastClicked('api')}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Without description or summary">
        <div style={{ maxWidth: 300 }}>
          <ConfigTile
            icon="settings"
            title="Minimal Tile"
            onClick={() => setLastClicked('minimal')}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Disabled state">
        <div style={{ maxWidth: 300 }}>
          <ConfigTile
            icon="schema"
            title="Read-only Config"
            description="Cannot be modified in this environment"
            summary={[{ label: 'env', value: 'production' }]}
            disabled
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="icon" type="IconName" required description="Icon name from the Icon system" />
          <PropRow name="title" type="string" required description="Primary label for the configuration" />
          <PropRow name="description" type="string" description="Secondary description text" />
          <PropRow name="summary" type="ConfigTileSummaryItem[]" defaultValue="[]" description="Array of {label, value} configuration pairs shown below the description" />
          <PropRow name="onClick" type="() => void" description="Handler called when tile is clicked" />
          <PropRow name="disabled" type="boolean" description="Disables interaction and reduces opacity" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
