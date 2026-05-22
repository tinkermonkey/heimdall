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
  kind: 'icon'
  icon: IconName
  mono?: boolean
}

export interface StatusbarDividerItem {
  kind: 'divider'
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
    switch (item.kind) {
      case 'divider':
        return <div key={index} className="statusbar__divider" />
      case 'pulse':
        return (
          <div key={index} className="statusbar__item statusbar__item--pulse">
            <div className={`statusbar__pulse statusbar__pulse--${item.tone}`} />
            {item.mono ? (
              <span className="statusbar__label statusbar__label--mono">{item.label}</span>
            ) : (
              <span className="statusbar__label">{item.label}</span>
            )}
          </div>
        )
      case 'icon':
        return (
          <div key={index} className={`statusbar__item ${item.mono ? 'statusbar__item--mono' : ''}`}>
            <Icon name={item.icon} size={14} />
          </div>
        )
      default: {
        const _exhaustiveCheck: never = item
        return _exhaustiveCheck
      }
    }
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
        {left && <div className="statusbar__slot statusbar__slot--left statusbar__left">{renderSlot(left)}</div>}
        {center && <div className="statusbar__slot statusbar__slot--center">{center}</div>}
        {right && <div className="statusbar__slot statusbar__slot--right statusbar__right">{renderSlot(right)}</div>}
      </div>
    )
  }
)

Statusbar.displayName = 'Statusbar'

export default Statusbar
