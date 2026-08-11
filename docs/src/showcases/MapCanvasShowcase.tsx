import { useState } from 'react'
import { MapCanvas, type MapPin, type MapTrackPoint, type HeatmapDataPoint } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, PropsTable, PropRow } from '../components/ShowcaseSection'

const SAMPLE_PINS: MapPin[] = [
  { id: '1', lat: 40.7128, lng: -74.006, label: 'New York', timestamp: '2024-01-15 10:30' },
  { id: '2', lat: 51.5074, lng: -0.1278, label: 'London', timestamp: '2024-01-15 15:45' },
  { id: '3', lat: 48.8566, lng: 2.3522, label: 'Paris', timestamp: '2024-01-15 18:20' },
  { id: '4', lat: 52.52, lng: 13.405, label: 'Berlin', timestamp: '2024-01-15 21:00' },
]

const SAMPLE_TRACK: MapTrackPoint[] = [
  { lat: 40.7128, lng: -74.006, timestamp: '2024-01-15 10:30' },
  { lat: 51.5074, lng: -0.1278, timestamp: '2024-01-15 15:45' },
  { lat: 48.8566, lng: 2.3522, timestamp: '2024-01-15 18:20' },
  { lat: 52.52, lng: 13.405, timestamp: '2024-01-15 21:00' },
]

const SAMPLE_HEATMAP: HeatmapDataPoint[] = [
  { lat: 40.7128, lng: -74.006, value: 100 },
  { lat: 40.73, lng: -73.99, value: 85 },
  { lat: 40.75, lng: -73.98, value: 70 },
  { lat: 40.77, lng: -73.97, value: 55 },
  { lat: 40.78, lng: -74.0, value: 40 },
  { lat: 40.72, lng: -74.02, value: 65 },
]

export function MapCanvasShowcase() {
  const [mode, setMode] = useState<'pins' | 'track' | 'heatmap'>('pins')
  const [selectedPinId, setSelectedPinId] = useState<string | null>('1')
  const [showScaleBar, setShowScaleBar] = useState(true)

  return (
    <div>
      <PageHeader
        name="MapCanvas"
        description="Interactive tile-based map component with support for pins, tracking, heatmaps, pan/zoom, and viewport management. Uses Web Mercator projection with OpenStreetMap tile rendering."
      />

      <ShowcaseSection label="Pins Mode">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <MapCanvas
            mode="pins"
            pins={SAMPLE_PINS}
            selectedPinId={selectedPinId}
            onSelectPin={setSelectedPinId}
            scaleBar={showScaleBar}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Track Mode">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <MapCanvas
            mode="track"
            trackPoints={SAMPLE_TRACK}
            scaleBar={showScaleBar}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Heatmap Mode">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <MapCanvas
            mode="heatmap"
            heatmapData={SAMPLE_HEATMAP}
            scaleBar={showScaleBar}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Mode Toggle Example">
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setMode('pins')}
            style={{
              padding: '8px 12px',
              background: mode === 'pins' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: mode === 'pins' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Pins
          </button>
          <button
            type="button"
            onClick={() => setMode('track')}
            style={{
              padding: '8px 12px',
              background: mode === 'track' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: mode === 'track' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Track
          </button>
          <button
            type="button"
            onClick={() => setMode('heatmap')}
            style={{
              padding: '8px 12px',
              background: mode === 'heatmap' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: mode === 'heatmap' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Heatmap
          </button>
          <label style={{ display: 'flex', alignItems: 'center', marginLeft: '16px', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
            <input
              type="checkbox"
              checked={showScaleBar}
              onChange={(e) => setShowScaleBar(e.target.checked)}
              style={{ marginRight: '4px' }}
            />
            Show Scale Bar
          </label>
        </div>

        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {mode === 'pins' && (
            <MapCanvas
              mode="pins"
              pins={SAMPLE_PINS}
              selectedPinId={selectedPinId ?? undefined}
              onSelectPin={(id) => setSelectedPinId(id)}
              scaleBar={showScaleBar}
            />
          )}
          {mode === 'track' && <MapCanvas mode="track" trackPoints={SAMPLE_TRACK} scaleBar={showScaleBar} />}
          {mode === 'heatmap' && <MapCanvas mode="heatmap" heatmapData={SAMPLE_HEATMAP} scaleBar={showScaleBar} />}
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Web Mercator projection:</strong> Standard geographic projection for accurate map display
          </li>
          <li>
            <strong>OpenStreetMap tiles:</strong> Free tile-based map rendering with zoom levels 1-18
          </li>
          <li>
            <strong>Pins visualization:</strong> Custom markers with labels and timestamps
          </li>
          <li>
            <strong>Track rendering:</strong> Connected polyline showing movement path between points
          </li>
          <li>
            <strong>Heatmap visualization:</strong> Gradient-based density rendering with configurable values
          </li>
          <li>
            <strong>Interactive pan/zoom:</strong> Mouse wheel zoom and pointer drag pan with smooth animation
          </li>
          <li>
            <strong>Scale bar:</strong> Optional geographic scale reference (optional toggle)
          </li>
          <li>
            <strong>Pin selection:</strong> Click pins to select with visual highlight
          </li>
          <li>
            <strong>Viewport management:</strong> Track current center coordinates and zoom level
          </li>
          <li>
            <strong>Responsive sizing:</strong> Fills parent container with optional explicit dimensions
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow
            name="mode"
            type="'pins' | 'track' | 'heatmap'"
            description="Visualization mode: pins for markers, track for polyline, heatmap for density"
            required
          />
          <PropRow name="pins" type="MapPin[]" description="Array of pin markers (used in pins mode)" />
          <PropRow name="trackPoints" type="MapTrackPoint[]" description="Array of track points (used in track mode)" />
          <PropRow name="heatmapData" type="HeatmapDataPoint[]" description="Array of heatmap data points (used in heatmap mode)" />
          <PropRow name="selectedPinId" type="string | undefined" description="ID of the currently selected pin" />
          <PropRow name="onSelectPin" type="(id: string) => void" description="Fired when a pin is clicked" />
          <PropRow name="onViewportChange" type="(viewport: MapViewport) => void" description="Fired when map is panned or zoomed" />
          <PropRow name="scaleBar" type="boolean" def="true" description="Whether to show the geographic scale bar" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="MapPin Type">
        <PropsTable>
          <PropRow name="id" type="string" description="Unique pin identifier" required />
          <PropRow name="lat" type="number" description="Latitude in decimal degrees" required />
          <PropRow name="lng" type="number" description="Longitude in decimal degrees" required />
          <PropRow name="label" type="string" description="Displayed label or tooltip text" required />
          <PropRow name="timestamp" type="string | undefined" description="Optional timestamp for the pin" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="MapTrackPoint Type">
        <PropsTable>
          <PropRow name="lat" type="number" description="Latitude in decimal degrees" required />
          <PropRow name="lng" type="number" description="Longitude in decimal degrees" required />
          <PropRow name="timestamp" type="string | undefined" description="Optional timestamp for the point" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="HeatmapDataPoint Type">
        <PropsTable>
          <PropRow name="lat" type="number" description="Latitude in decimal degrees" required />
          <PropRow name="lng" type="number" description="Longitude in decimal degrees" required />
          <PropRow name="value" type="number" description="Numeric value for heatmap intensity (0-100)" required />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Interactions">
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', fontSize: '13px', color: 'rgb(var(--canvas-fg-1))' }}>
          <div style={{ fontWeight: 600 }}>Scroll / Pinch</div>
          <div>Zoom in/out (levels 1-18)</div>

          <div style={{ fontWeight: 600 }}>Drag</div>
          <div>Pan the map to view different areas</div>

          <div style={{ fontWeight: 600 }}>Click Pin</div>
          <div>Select a pin and fire onSelectPin callback</div>

          <div style={{ fontWeight: 600 }}>Click Map</div>
          <div>Trigger onViewportChange with current center and zoom</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
