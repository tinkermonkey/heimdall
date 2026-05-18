import React from 'react'

export type SparklineColor = 'emerald' | 'amber' | 'rose' | 'cyan' | 'neutral'

export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data: number[]
  width?: number
  height?: number
  color?: SparklineColor
}

const colorClasses: Record<SparklineColor, string> = {
  emerald: 'var(--accent-ok)',
  amber: 'var(--accent-primary)',
  rose: 'var(--accent-error)',
  cyan: 'var(--accent-updating)',
  neutral: 'var(--canvas-fg-2)',
}

export const Sparkline = React.forwardRef<SVGSVGElement, SparklineProps>(
  ({ data, width = 84, height = 22, color = 'emerald', className = '', ...rest }, ref) => {
    if (!data || data.length === 0) {
      return null
    }

    // For single data point, create a flat line
    const points = data.length === 1 ? [data[0], data[0]] : data

    // Find min and max for scaling
    const min = Math.min(...points)
    const max = Math.max(...points)
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

    const colorValue = colorClasses[color]

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
          fill={`rgb(${colorValue})`}
          fillOpacity="0.15"
          stroke="none"
        />
        {/* Line stroke */}
        <polyline points={linePoints} fill="none" stroke={`rgb(${colorValue})`} strokeWidth="2" />
      </svg>
    )
  }
)

Sparkline.displayName = 'Sparkline'

export default Sparkline
