import React from 'react'
import { Icon, type IconName } from './Icon'
import './Statusbar.css'

export type StatusbarTone = 'emerald' | 'cyan' | 'rose' | 'amber' | 'violet' | 'neutral'

export interface StatusbarPulseItem {
  kind: 'pulse'
  tone: StatusbarTone
  label: string
  mono?: boolean
}

export interface StatusbarIconItem {
  icon: IconName
  mono?: boolean
}

export interface StatusbarDividerItem {
  divider: true
}

export type StatusbarItem = StatusbarPulseItem | StatusbarIconItem | StatusbarDividerItem

export interface StatusbarProps {
  left?: React.ReactNode | StatusbarItem[]
  center?: React.ReactNode
  right?: React.ReactNode | StatusbarItem[]
  className?: string
}

const renderStatusbarItems = (items: StatusbarItem[]): React.ReactNode => {
  return items.map((item, index) => {
    if ('divider' in item) {
      return <div key={index} className="statusbar__divider" />
    }
    if ('kind' in item) {
      const pulseItem = item as StatusbarPulseItem
      return (
        <div key={index} className="statusbar__item statusbar__item--pulse">
          <div className={`statusbar__pulse statusbar__pulse--${pulseItem.tone}`} />
          {pulseItem.mono ? (
            <span className="statusbar__label statusbar__label--mono">{pulseItem.label}</span>
          ) : (
            <span className="statusbar__label">{pulseItem.label}</span>
          )}
        </div>
      )
    }
    if ('icon' in item) {
      const iconItem = item as StatusbarIconItem
      return (
        <div key={index} className={`statusbar__item ${iconItem.mono ? 'statusbar__item--mono' : ''}`}>
          <Icon name={iconItem.icon} size={14} />
        </div>
      )
    }
    return null
  })
}

export const Statusbar = React.forwardRef<HTMLDivElement, StatusbarProps>(
  ({ left, center, right, className = '', ...props }, ref) => {
    const classNames = ['statusbar', className].filter(Boolean).join(' ')

    const renderSlot = (content: React.ReactNode | StatusbarItem[] | undefined) => {
      if (!content) return null
      if (Array.isArray(content)) {
        return renderStatusbarItems(content)
      }
      return content
    }

    return (
      <div ref={ref} className={classNames} {...props}>
        {left && <div className="statusbar__slot statusbar__slot--left">{renderSlot(left)}</div>}
        {center && <div className="statusbar__slot statusbar__slot--center">{center}</div>}
        {right && <div className="statusbar__slot statusbar__slot--right">{renderSlot(right)}</div>}
      </div>
    )
  }
)

Statusbar.displayName = 'Statusbar'

export default Statusbar
