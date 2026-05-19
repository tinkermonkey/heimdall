import React from 'react'
import './Sparkline.css'
import type { StatusColor } from './chartTypes'

export type SparklineColor = StatusColor

export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data: number[]
  width?: number
  height?: number
  color?: SparklineColor
}

const colorMap: Record<SparklineColor, string> = {
  emerald: 'rgb(16 185 129)',
  amber: 'rgb(245 158 11)',
  rose: 'rgb(244 63 94)',
  cyan: 'rgb(34 211 238)',
  violet: 'rgb(139 92 246)',
  neutral: '', // handled via style prop for dark canvas support
}

export const Sparkline = React.forwardRef<SVGSVGElement, SparklineProps>(
  ({ data, width = 84, height = 22, color = 'emerald', className = '', ...rest }, ref) => {
    if (!data || data.length === 0) {
      return null
    }

    // For single data point, create a flat line
    const points = data.length === 1 ? [data[0], data[0]] : data

    // Find min and max for scaling using loop to avoid stack overflow with large arrays
    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < points.length; i++) {
      if (points[i] < min) min = points[i]
      if (points[i] > max) max = points[i]
    }
    const range = max - min

    // Normalize points to 0-1 range
    const normalizedPoints = points.map((p) => (range === 0 ? 0.5 : (p - min) / range))

    // Calculate path coordinates using viewBox (0, 0, 100, 100)
    const svgWidth = 100
    const svgHeight = 100
    const padding = 5

    // Generate line path
    const linePoints = normalizedPoints
      .map((p, i) => {
        const x = padding + (i / (normalizedPoints.length - 1)) * (svgWidth - padding * 2)
        const y = svgHeight - padding - p * (svgHeight - padding * 2)
        return `${x},${y}`
      })
      .join(' ')

    // Generate area path (line + bottom rectangle)
    const areaPoints = [
      `${padding},${svgHeight - padding}`,
      ...normalizedPoints
        .map((p, i) => {
          const x = padding + (i / (normalizedPoints.length - 1)) * (svgWidth - padding * 2)
          const y = svgHeight - padding - p * (svgHeight - padding * 2)
          return `${x},${y}`
        }),
      `${padding + (normalizedPoints.length - 1) / (normalizedPoints.length - 1) * (svgWidth - padding * 2)},${svgHeight - padding}`,
    ]
      .join(' ')

    const colorValue = colorMap[color]

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={width}
        height={height}
        className={className}
        style={{ overflow: 'visible' }}
        {...rest}
      >
        {/* Area fill */}
        <polyline
          points={areaPoints}
          fill={color === 'neutral' ? undefined : colorValue}
          fillOpacity="0.15"
          stroke="none"
          style={color === 'neutral' ? { fill: 'rgb(var(--canvas-fg-2))', fillOpacity: '0.15' } : undefined}
        />
        {/* Line stroke */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={color === 'neutral' ? undefined : colorValue}
          strokeWidth="2"
          style={color === 'neutral' ? { stroke: 'rgb(var(--canvas-fg-2))' } : undefined}
        />
      </svg>
    )
  }
)

Sparkline.displayName = 'Sparkline'

export default Sparkline
