import React from 'react'
import { Sparkline, type SparklineColor } from './Sparkline'
import { ProgressBar } from './ProgressBar'
import './MetricRow.css'

export interface MetricRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: number | string
  unit?: string
  percent: number
  sparklineData: number[]
  color?: SparklineColor
}

export const MetricRow = React.forwardRef<HTMLDivElement, MetricRowProps>(
  ({ label, value, unit, percent, sparklineData, color = 'emerald', className = '', ...rest }, ref) => {
    return (
      <div ref={ref} className={`metric-row ${className}`.trim()} {...rest}>
        <div className="metric-row__label">{label}</div>
        <div className="metric-row__progress">
          <ProgressBar percent={percent} color={color} height={6} />
        </div>
        <div className="metric-row__sparkline">
          <Sparkline data={sparklineData} width={60} height={18} color={color} />
        </div>
        <div className="metric-row__value">
          {value}
          {unit && <span className="metric-row__unit">{unit}</span>}
        </div>
      </div>
    )
  }
)

MetricRow.displayName = 'MetricRow'

export default MetricRow
