import React from 'react'
import './ProgressBar.css'

export type ProgressBarColor = 'emerald' | 'amber' | 'rose' | 'cyan' | 'neutral'

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  percent: number
  color?: ProgressBarColor
  height?: number
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ percent, color = 'emerald', height = 6, className = '', ...rest }, ref) => {
    const clampedPercent = Math.min(Math.max(percent, 0), 100)
    const colorClass = `progress-bar--${color}`

    return (
      <div
        ref={ref}
        className={`progress-bar ${colorClass} ${className}`.trim()}
        style={{ height: `${height}px` }}
        {...rest}
      >
        <div className="progress-bar__fill" style={{ width: `${clampedPercent}%` }} />
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

export default ProgressBar
