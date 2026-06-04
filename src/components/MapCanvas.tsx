import React, { useState, useRef, useCallback, useEffect, useId } from 'react'
import { usePanZoom } from '../hooks/usePanZoom'
import './MapCanvas.css'

// ─── Mercator Projection ──────────────────────────────────────────────────────

function latLngToPixels(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom)
  const x = ((lng + 180) / 360) * n * 256
  const y = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n * 256
  return { x, y }
}

function pixelsToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const n = Math.pow(2, zoom)
  const lng = (x / (n * 256)) * 360 - 180
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * (y / (n * 256))))) * 180) / Math.PI
  return { lat, lng }
}

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface MapPin {
  id: string
  lat: number
  lng: number
  label?: string
  detail?: React.ReactNode
  timestamp?: string
}

export interface MapTrackPoint {
  lat: number
  lng: number
  timestamp?: string
}

export interface HeatmapDataPoint {
  lat: number
  lng: number
  value: number
}

export interface MapCanvasProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  mode: 'pins' | 'track' | 'heatmap'
  pins?: MapPin[]
  selectedPinId?: string
  onSelectPin?: (pinId: string | null) => void
  trackPoints?: MapTrackPoint[]
  heatmapData?: HeatmapDataPoint[]
  heatmapColor?: string
  tileUrl?: string
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
  scaleBar?: boolean
  minZoom?: number
  maxZoom?: number
  onViewportChange?: (viewport: { center: { lat: number; lng: number }; zoom: number }) => void
}

// ─── Grid Pattern ─────────────────────────────────────────────────────────────

interface GridPatternProps {
  patternId: string
  zoomLevel: number
}

function GridPattern({ patternId, zoomLevel }: GridPatternProps) {
  const tileSize = 32 * Math.pow(2, zoomLevel)
  return (
    <pattern
      id={patternId}
      x={0}
      y={0}
      width={tileSize}
      height={tileSize}
      patternUnits="userSpaceOnUse"
    >
      <rect width={tileSize} height={tileSize} fill="none" stroke="rgb(var(--canvas-fg-3))" strokeWidth="0.5" opacity="0.3" />
      <circle cx={0} cy={0} r={1} fill="rgb(var(--canvas-fg-3))" opacity="0.4" />
    </pattern>
  )
}

// ─── Pin Popover ──────────────────────────────────────────────────────────────

interface PinPopoverProps {
  pin: MapPin
  x: number
  y: number
  onClose: () => void
}

function PinPopover({ pin, x, y, onClose }: PinPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={popoverRef}
      className="map-popover"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      role="dialog"
      aria-modal="true"
    >
      {pin.label && <div className="map-popover__label">{pin.label}</div>}
      {pin.timestamp && <div className="map-popover__timestamp">{pin.timestamp}</div>}
      {pin.detail && <div className="map-popover__detail">{pin.detail}</div>}
    </div>
  )
}

// ─── MapCanvas ────────────────────────────────────────────────────────────────

export const MapCanvas = React.forwardRef<HTMLDivElement, MapCanvasProps>(
  (
    {
      mode = 'pins',
      pins = [],
      selectedPinId,
      onSelectPin,
      trackPoints = [],
      heatmapData = [],
      heatmapColor = '#10b981',
      tileUrl,
      bounds,
      scaleBar = false,
      minZoom = 0,
      maxZoom = 18,
      onViewportChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
    const [selectedPopover, setSelectedPopover] = useState<{ x: number; y: number } | null>(null)
    const didInitRef = useRef(false)

    const { transform, viewport, bind, panTo } = usePanZoom({
      minZoom,
      maxZoom,
      onViewportChange: (vp) => {
        const center = pixelsToLatLng(vp.x / vp.zoom, vp.y / vp.zoom, Math.round(vp.zoom * 4))
        onViewportChange?.({
          center: { lat: center.lat, lng: center.lng },
          zoom: vp.zoom,
        })
      },
    })

    const rawId = useId()
    const gridPatternId = `map-grid-${rawId.replace(/:/g, '')}`

    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      const ro = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect
        if (width > 0 && height > 0) setContainerSize({ width, height })
      })
      ro.observe(container)
      return () => ro.disconnect()
    }, [])

    // Initialize bounds on first render
    useEffect(() => {
      if (didInitRef.current || !containerSize) return
      if (!bounds && pins.length === 0 && trackPoints.length === 0 && heatmapData.length === 0) return

      const items = [
        ...pins.map((p) => ({ lat: p.lat, lng: p.lng })),
        ...trackPoints.map((t) => ({ lat: t.lat, lng: t.lng })),
        ...heatmapData.map((h) => ({ lat: h.lat, lng: h.lng })),
      ]

      let boundsToUse = bounds
      if (!boundsToUse && items.length > 0) {
        const lats = items.map((i) => i.lat)
        const lngs = items.map((i) => i.lng)
        boundsToUse = {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lngs),
          west: Math.min(...lngs),
        }
      }

      if (!boundsToUse) return

      // Fit bounds: add padding and calculate zoom
      const padding = 60
      const northPixel = latLngToPixels(boundsToUse.north, boundsToUse.west, 10).y
      const southPixel = latLngToPixels(boundsToUse.south, boundsToUse.east, 10).y
      const westPixel = latLngToPixels(boundsToUse.north, boundsToUse.west, 10).x
      const eastPixel = latLngToPixels(boundsToUse.north, boundsToUse.east, 10).x

      const height = Math.abs(southPixel - northPixel)
      const width = Math.abs(eastPixel - westPixel)

      const zoomH = Math.log2((containerSize.height - padding * 2) / height)
      const zoomW = Math.log2((containerSize.width - padding * 2) / width)
      const calculatedZoom = Math.max(minZoom, Math.min(maxZoom, Math.floor(Math.min(zoomH, zoomW))))

      const centerLat = (boundsToUse.north + boundsToUse.south) / 2
      const centerLng = (boundsToUse.east + boundsToUse.west) / 2
      const centerPixel = latLngToPixels(centerLat, centerLng, calculatedZoom)

      const panX = containerSize.width / 2 - centerPixel.x * calculatedZoom
      const panY = containerSize.height / 2 - centerPixel.y * calculatedZoom

      panTo(panX, panY)
      didInitRef.current = true
    }, [containerSize, bounds, pins.length, trackPoints.length, heatmapData.length, minZoom, maxZoom, panTo])

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (
          e.target instanceof Element &&
          (e.target.closest('.map-pin') || e.target.closest('.map-popover') || e.target.closest('[data-no-drag]'))
        ) {
          return
        }
        bind.onPointerDown(e)
      },
      [bind]
    )

    const renderPins = useCallback(() => {
      if (mode !== 'pins' || !pins.length) return null

      return (
        <div className="map-pins" data-testid="map-pins" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {pins.map((pin) => {
            const pixel = latLngToPixels(pin.lat, pin.lng, Math.round(viewport.zoom * 4))
            const screenX = viewport.x + pixel.x * viewport.zoom
            const screenY = viewport.y + pixel.y * viewport.zoom

            return (
              <button
                key={pin.id}
                className={['map-pin', selectedPinId === pin.id && 'map-pin--selected'].filter(Boolean).join(' ')}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectPin?.(pin.id)
                  const rect = (e.target as HTMLElement).getBoundingClientRect()
                  setSelectedPopover({ x: rect.right + 8, y: rect.top })
                }}
                aria-label={`${pin.label || 'Pin'} at latitude ${pin.lat.toFixed(4)}, longitude ${pin.lng.toFixed(4)}${
                  pin.timestamp ? ` on ${pin.timestamp}` : ''
                }`}
                data-testid={`map-pin-${pin.id}`}
                data-no-drag
                style={{
                  position: 'absolute',
                  left: `${screenX}px`,
                  top: `${screenY}px`,
                  pointerEvents: 'auto',
                }}
              >
                <span className="map-pin__dot" />
                {pin.label && <span className="map-pin__label">{pin.label}</span>}
              </button>
            )
          })}
        </div>
      )
    }, [mode, pins, viewport.zoom, viewport.x, viewport.y, selectedPinId, onSelectPin])

    const renderTrack = useCallback(() => {
      if (mode !== 'track' || !trackPoints.length) return null

      const points = trackPoints.map((p) => latLngToPixels(p.lat, p.lng, Math.round(viewport.zoom * 4)))
      const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

      return (
        <g className="map-track" data-testid="map-track">
          <path d={pathData} className="map-track__line" />
        </g>
      )
    }, [mode, trackPoints, viewport.zoom])

    const renderHeatmap = useCallback(() => {
      if (mode !== 'heatmap' || !heatmapData.length) return null

      const values = heatmapData.map((h) => h.value).filter((v) => v != null)
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)

      return (
        <g className="map-heatmap" data-testid="map-heatmap">
          {heatmapData.map((point, i) => {
            const pixel = latLngToPixels(point.lat, point.lng, Math.round(viewport.zoom * 4))
            const t = (point.value - minValue) / (maxValue - minValue || 1)
            const alpha = Math.round((0.12 + t * 0.88) * 255)
              .toString(16)
              .padStart(2, '0')
            const color = heatmapColor.replace('#', '')
            const fill = `#${color}${alpha}`

            return (
              <circle
                key={i}
                cx={pixel.x}
                cy={pixel.y}
                r={8 + t * 4}
                fill={fill}
                opacity={0.6}
                data-testid={`heatmap-point-${i}`}
              />
            )
          })}
        </g>
      )
    }, [mode, heatmapData, heatmapColor, viewport.zoom])

    const renderTiles = useCallback(() => {
      if (!tileUrl || !containerSize) return null

      const zoom = Math.min(Math.max(Math.floor(viewport.zoom * 4), 0), 28)
      const n = Math.pow(2, zoom)

      // Calculate visible tile range
      const xStart = Math.max(0, Math.floor(-viewport.x / (256 * viewport.zoom)))
      const yStart = Math.max(0, Math.floor(-viewport.y / (256 * viewport.zoom)))
      const xEnd = Math.min(n, Math.ceil((containerSize.width - viewport.x) / (256 * viewport.zoom)))
      const yEnd = Math.min(n, Math.ceil((containerSize.height - viewport.y) / (256 * viewport.zoom)))

      const tiles = []
      for (let x = xStart; x < xEnd; x++) {
        for (let y = yStart; y < yEnd; y++) {
          const url = tileUrl.replace('{x}', String(x)).replace('{y}', String(y)).replace('{z}', String(zoom))
          tiles.push(
            <image
              key={`${zoom}-${x}-${y}`}
              xlinkHref={url}
              x={x * 256}
              y={y * 256}
              width={256}
              height={256}
              data-testid={`tile-${x}-${y}`}
            />
          )
        }
      }
      return tiles
    }, [tileUrl, containerSize, viewport])

    const handleRef = (el: HTMLDivElement | null) => {
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
      ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    }

    return (
      <div
        ref={handleRef}
        className={['map-canvas', className].filter(Boolean).join(' ')}
        {...bind}
        onPointerDown={handlePointerDown}
        role="application"
        aria-label="Map canvas"
        {...props}
      >
        <svg
          className="map-svg"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          <defs>
            <GridPattern patternId={gridPatternId} zoomLevel={viewport.zoom} />
          </defs>

          {/* Background: tiles or grid */}
          {tileUrl ? (
            <g className="map-tiles" transform={transform}>
              {renderTiles()}
            </g>
          ) : (
            <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} className="map-grid" />
          )}

          {/* Content layer with pan/zoom */}
          <g className="map-viewport" transform={transform}>
            {renderTrack()}
            {renderHeatmap()}
          </g>
        </svg>

        {/* Pins rendered as HTML overlay */}
        {renderPins()}

        {/* Overlay chrome */}
        <div className="map-overlay">
          {mode === 'track' && (
            <div className="map-legend">
              <div className="map-legend__item">
                <div className="map-legend__line" style={{ backgroundColor: 'rgb(var(--status-cyan))' }} />
                Track
              </div>
            </div>
          )}

          {mode === 'heatmap' && (
            <div className="map-legend">
              <div className="map-legend__item">
                <div
                  className="map-legend__gradient"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${heatmapColor}20, ${heatmapColor}cc)`,
                  }}
                />
                Density
              </div>
            </div>
          )}

          {scaleBar && (
            <div className="map-scale-bar">
              <div className="map-scale-bar__label">Zoom: {viewport.zoom.toFixed(1)}</div>
            </div>
          )}
        </div>

        {/* Pin popover */}
        {selectedPinId && selectedPopover && (
          <PinPopover
            pin={pins.find((p) => p.id === selectedPinId)!}
            x={selectedPopover.x}
            y={selectedPopover.y}
            onClose={() => {
              onSelectPin?.(null)
              setSelectedPopover(null)
            }}
          />
        )}
      </div>
    )
  }
)

MapCanvas.displayName = 'MapCanvas'

export default MapCanvas
