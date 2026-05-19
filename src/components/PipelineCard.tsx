import React from 'react'
import './PipelineCard.css'
import { Icon, type IconName } from './Icon'
import { Badge, type BadgeColor } from './Badge'

export interface PipelineStage {
  id: string
  name: string
  label: string
  icon: IconName
  status?: 'pending' | 'running' | 'success' | 'failed'
  statusColor?: BadgeColor
}

export interface PipelineCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  stages: PipelineStage[]
  statusLabel?: string
  stats?: Array<{
    label: string
    value: string | number
  }>
}

export const PipelineCard = React.forwardRef<HTMLDivElement, PipelineCardProps>(
  ({ title, description, stages, statusLabel, stats = [], className, ...props }, ref) => {
    return (
      <div ref={ref} className={['pipeline-card', className].filter(Boolean).join(' ')} data-testid="pipeline-card" {...props}>
        <div className="pipeline-card__header">
          <div>
            <h3 className="pipeline-card__title">{title}</h3>
            {description && <p className="pipeline-card__description">{description}</p>}
          </div>
          {statusLabel && (
            <Badge className="pipeline-card__status">{statusLabel}</Badge>
          )}
        </div>

        <div className="pipeline-card__flow">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <div
                className="pipeline-card__stage"
                data-testid={`pipeline-stage-${stage.id}`}
              >
                <div
                  className={[
                    'pipeline-card__icon-container',
                    stage.status && `pipeline-card__icon-container--${stage.statusColor || 'cyan'}`,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Icon name={stage.icon} size={13} />
                </div>
                <div className="pipeline-card__stage-content">
                  <div className="pipeline-card__stage-name">{stage.name}</div>
                  <div className="pipeline-card__stage-label">{stage.label}</div>
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className="pipeline-card__connector" />
              )}
            </React.Fragment>
          ))}
        </div>

        {stats.length > 0 && (
          <div className="pipeline-card__footer">
            {stats.map((stat, index) => (
              <div key={index} className="pipeline-card__stat">
                <div className="pipeline-card__stat-label">{stat.label}</div>
                <div className="pipeline-card__stat-value">{stat.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

PipelineCard.displayName = 'PipelineCard'

export default PipelineCard
