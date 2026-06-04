import { useState } from 'react'
import { MapCanvas, type MapPin, type MapTrackPoint, type HeatmapDataPoint } from '../components/MapCanvas'

const SAMPLE_PINS: MapPin[] = [
  { id: '1', lat: 40.7128, lng: -74.006, label: 'NYC', timestamp: '2024-01-15 10:30' },
  { id: '2', lat: 51.5074, lng: -0.1278, label: 'LON', timestamp: '2024-01-15 15:45' },
  { id: '3', lat: 48.8566, lng: 2.3522, label: 'PAR', timestamp: '2024-01-15 18:20' },
  { id: '4', lat: 52.52, lng: 13.405, label: 'BER', timestamp: '2024-01-15 21:00' },
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

export default function MapCanvasTestPage() {
  const [mode, setMode] = useState<'pins' | 'track' | 'heatmap'>('pins')
  const [selectedPinId, setSelectedPinId] = useState<string | null>('1')
  const [viewport, setViewport] = useState({ lat: 0, lng: 0, zoom: 1 })
  const [showScaleBar, setShowScaleBar] = useState(true)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'rgb(var(--canvas-bg))' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgb(var(--canvas-border))', background: 'rgb(var(--canvas-surface))' }}>
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMode('pins')}
            style={{
              padding: '8px 12px',
              background: mode === 'pins' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: mode === 'pins' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Pins Mode
          </button>
          <button
            onClick={() => setMode('track')}
            style={{
              padding: '8px 12px',
              background: mode === 'track' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: mode === 'track' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Track Mode
          </button>
          <button
            onClick={() => setMode('heatmap')}
            style={{
              padding: '8px 12px',
              background: mode === 'heatmap' ? 'rgb(var(--accent-primary))' : 'rgb(var(--canvas-surface-2))',
              color: mode === 'heatmap' ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-2))',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Heatmap Mode
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px', color: 'rgb(var(--canvas-fg-2))' }}>
          <label>
            <input
              type="checkbox"
              checked={showScaleBar}
              onChange={(e) => setShowScaleBar(e.target.checked)}
              style={{ marginRight: '4px' }}
            />
            Show Scale Bar
          </label>
        </div>

        <div style={{ marginTop: '12px', fontSize: '12px', color: 'rgb(var(--canvas-fg-3))', fontFamily: 'var(--font-mono)' }}>
          Center: {viewport.lat.toFixed(4)}, {viewport.lng.toFixed(4)} | Zoom: {viewport.zoom.toFixed(1)}
        </div>
      </div>

      <MapCanvas
        mode={mode}
        pins={mode === 'pins' ? SAMPLE_PINS : []}
        trackPoints={mode === 'track' ? SAMPLE_TRACK : []}
        heatmapData={mode === 'heatmap' ? SAMPLE_HEATMAP : []}
        selectedPinId={mode === 'pins' ? selectedPinId ?? undefined : undefined}
        onSelectPin={(id) => setSelectedPinId(id)}
        scaleBar={showScaleBar}
        onViewportChange={(vp) => {
          setViewport({ lat: vp.center.lat, lng: vp.center.lng, zoom: vp.zoom })
        }}
        style={{ flex: 1 }}
      />
    </div>
  )
}
