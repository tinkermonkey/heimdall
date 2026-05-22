import { useState } from 'react'
import {
  QuickAccessTile,
  Button,
  type QuickAccessTileProps,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

export function QuickAccessTileShowcase() {
  const [lastClicked, setLastClicked] = useState<string | null>(null)

  const tiles: QuickAccessTileProps[] = [
    { id: 'create', icon: 'plus', title: 'Create Entity', description: 'Add a new entity to the schema' },
    { id: 'schema', icon: 'schema', title: 'View Schema', description: 'Browse the full schema graph' },
    { id: 'export', icon: 'data', title: 'Export Data', description: 'Download a filtered data export' },
    { id: 'pipeline', icon: 'pipeline', title: 'Run Pipeline', description: 'Execute a processing task' },
    { id: 'settings', icon: 'settings', title: 'Settings', description: 'Configure system settings' },
    { id: 'docs', icon: 'help', title: 'Documentation', description: 'Read the documentation' },
  ]

  return (
    <div>
      <PageHeader name="QuickAccessTile" description="Standalone action tile with icon, title, and description. Clickable, typically used in grids." />
      <ShowcaseSection label="Tile grid">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {tiles.map(tile => (
            <QuickAccessTile
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
      <ShowcaseSection label="Single tile">
        <div style={{ maxWidth: 250 }}>
          <QuickAccessTile
            id="demo"
            icon="plus"
            title="Create New"
            description="Start a new project or workflow"
            onClick={() => setLastClicked('demo')}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="id" type="string" description="Unique identifier for the tile" />
          <PropRow name="icon" type="IconName" description="Icon name from the Icon system" />
          <PropRow name="title" type="string" description="Primary label for the action" />
          <PropRow name="description" type="string" description="Secondary description text" />
          <PropRow name="onClick" type="() => void" description="Handler called when tile is clicked" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
