import React from 'react'
import './PieChart.css'

export interface PieChartSegment {
  name: string
  value: number
  color?: string
}

export interface PieChartProps extends React.HTMLAttributes<HTMLDivElement> {
  segments: PieChartSegment[]
  legend?: boolean
  width?: number
  height?: number
}

const defaultColors = ['rgb(245 158 11)', 'rgb(16 185 129)', 'rgb(244 63 94)', 'rgb(34 211 238)', 'rgb(71 85 105)']

export const PieChart = React.forwardRef<HTMLDivElement, PieChartProps>(
  (
    {
      segments,
      legend = false,
      width = 200,
      height = 200,
      className = '',
      ...rest
    },
    ref
  ) => {
    if (!segments || segments.length === 0) {
      return null
    }

    // Calculate total value
    let total = 0
    for (let i = 0; i < segments.length; i++) {
      total += segments[i].value
    }

    // Handle zero or negative totals
    if (total <= 0) {
      return null
    }

    // SVG dimensions
    const svgWidth = 100
    const svgHeight = 100
    const centerX = svgWidth / 2
    const centerY = svgHeight / 2
    const radius = Math.min(svgWidth, svgHeight) / 2 - 5

    // Generate pie segments
    let currentAngle = -Math.PI / 2
    const slices: Array<{
      startAngle: number
      endAngle: number
      color: string
      value: number
      name: string
      percentage: number
    }> = []

    segments.forEach((segment, idx) => {
      const sliceAngle = (segment.value / total) * 2 * Math.PI
      const endAngle = currentAngle + sliceAngle
      const percentage = (segment.value / total) * 100

      slices.push({
        startAngle: currentAngle,
        endAngle: endAngle,
        color: segment.color || defaultColors[idx % defaultColors.length],
        value: segment.value,
        name: segment.name,
        percentage: percentage,
      })

      currentAngle = endAngle
    })

    // Helper function to convert angle and radius to x, y coordinates
    const polarToCartesian = (angle: number, r: number) => {
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      }
    }

    // Helper function to create arc path
    const createArcPath = (startAngle: number, endAngle: number, r: number) => {
      const start = polarToCartesian(startAngle, r)
      const end = polarToCartesian(endAngle, r)
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

      return [
        `M ${centerX} ${centerY}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        'Z',
      ].join(' ')
    }

    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className={className} {...rest}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width={width}
          height={height}
          style={{ overflow: 'visible' }}
        >
          {/* Pie slices */}
          {slices.map((slice, idx) => (
            <path
              key={`slice-${idx}`}
              d={createArcPath(slice.startAngle, slice.endAngle, radius)}
              fill={slice.color}
              stroke="rgb(var(--canvas-bg))"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Legend */}
        {legend && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            {slices.map((slice, idx) => (
              <div key={`legend-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '1px',
                    backgroundColor: slice.color,
                  }}
                />
                <span>
                  {slice.name} ({slice.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

PieChart.displayName = 'PieChart'

export default PieChart
