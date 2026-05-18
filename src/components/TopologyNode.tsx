import React from 'react'
import './TopologyNode.css'

export type TopologyNodeStatus = 'ok' | 'warning' | 'error' | 'idle'

export interface TopologyNodeMetric {
  label: string
  value: number | string
  unit?: string
  percent: number
  sparklineData: number[]
  color?: 'emerald' | 'amber' | 'rose' | 'violet'
}

export interface TopologyNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  role: string
  status?: TopologyNodeStatus
  metrics?: TopologyNodeMetric[]
  x?: number
  y?: number
  onSelect?: () => void
}

const statusDotColorMap: Record<TopologyNodeStatus, string> = {
  ok: 'var(--status-emerald, #10b981)',
  warning: 'var(--status-amber, #f59e0b)',
  error: 'var(--status-rose, #ef4444)',
  idle: 'var(--status-neutral, #6b7280)',
}

export const TopologyNode = React.forwardRef<HTMLDivElement, TopologyNodeProps>(
  (
    { title, role, status = 'idle', metrics = [], x, y, onSelect, className = '', ...props },
    ref
  ) => {
    const classNames = ['topology-node', `topology-node--${status}`, className]
      .filter(Boolean)
      .join(' ')

    const style = {
      ...(x !== undefined && y !== undefined
        ? {
            position: 'absolute' as const,
            left: `${x}px`,
            top: `${y}px`,
          }
        : {}),
      ...props.style,
    }

    return (
      <div
        ref={ref}
        className={classNames}
        style={style}
        data-testid={`topology-node-${title}`}
        onClick={onSelect}
        {...props}
      >
        <div className="topology-node__head">
          <div className="topology-node__title">{title}</div>
          <div
            className="topology-node__status-dot"
            style={{ backgroundColor: statusDotColorMap[status] }}
            data-testid={`topology-status-${title}`}
            aria-label={`Status: ${status}`}
          />
        </div>

        <div className="topology-node__role" data-testid={`topology-role-${title}`}>
          {role}
        </div>

        {metrics.length > 0 && (
          <div className="topology-node__metrics" data-testid={`topology-metrics-${title}`}>
            {metrics.map((metric, idx) => (
              <div key={idx} className="topology-node__metric-row">
                <div className="topology-node__metric-label">{metric.label}</div>
                <div className="topology-node__metric-value">
                  {metric.value}
                  {metric.unit && <span className="topology-node__metric-unit">{metric.unit}</span>}
                </div>
                <div className="topology-node__metric-bar">
                  <div
                    className="topology-node__metric-fill"
                    style={{
                      width: `${metric.percent}%`,
                      backgroundColor: metric.color ? `var(--status-${metric.color}, #06b6d4)` : 'var(--accent-primary, #06b6d4)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

TopologyNode.displayName = 'TopologyNode'

export default TopologyNode
