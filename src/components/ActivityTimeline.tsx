import React from 'react'
import { Badge } from './Badge'
import './ActivityTimeline.css'

export type ActivityEventType = 'create' | 'update' | 'delete' | 'run'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  subject: string
  timestamp: Date | string
}

export interface ActivityTimelineProps {
  events?: ActivityEvent[]
  emptyState?: string
  className?: string
}

const EVENT_COLOR_MAP: Record<ActivityEventType, 'emerald' | 'cyan' | 'rose' | 'amber'> = {
  create: 'emerald',
  update: 'cyan',
  delete: 'rose',
  run: 'amber',
}

const formatTimestamp = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (Number.isNaN(diffMs)) {
    return date.toLocaleDateString()
  }

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export const ActivityTimeline = React.forwardRef<HTMLDivElement, ActivityTimelineProps>(
  ({ events = [], emptyState = 'No activity recorded', className = '', ...props }, ref) => {
    const classNames = ['activity-timeline', className].filter(Boolean).join(' ')

    if (events.length === 0) {
      return (
        <div ref={ref} className={classNames} data-testid="activity-timeline" {...props}>
          <div className="activity-timeline__empty" data-testid="activity-timeline-empty">
            {emptyState}
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className={classNames} data-testid="activity-timeline" {...props}>
        <div className="activity-timeline__list">
          {events.map(event => (
            <div key={event.id} className="activity-timeline__event" data-testid={`activity-event-${event.id}`}>
              <div className="activity-timeline__dot-container">
                <Badge color={EVENT_COLOR_MAP[event.type]} className="activity-timeline__dot" data-testid={`activity-dot-${event.type}`} />
              </div>
              <div className="activity-timeline__content">
                <div className="activity-timeline__subject" data-testid="activity-subject">
                  {event.subject}
                </div>
                <div className="activity-timeline__timestamp" data-testid="activity-timestamp">
                  {formatTimestamp(event.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

ActivityTimeline.displayName = 'ActivityTimeline'

export default ActivityTimeline
