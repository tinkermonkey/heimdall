import React from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import './ConfigTile.css'

export interface ConfigTileSummaryItem {
  label: string
  value: string
}

export interface ConfigTileProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: IconName
  title: string
  description: string
  summary: ConfigTileSummaryItem[]
  onClick: () => void
}

export const ConfigTile = React.forwardRef<HTMLButtonElement, ConfigTileProps>(
  ({ icon, title, description, summary, onClick, className = '', ...props }, ref) => {
    const classNames = ['config-tile', className].filter(Boolean).join(' ')

    return (
      <button
        ref={ref}
        className={classNames}
        onClick={onClick}
        data-testid="config-tile"
        {...props}
      >
        <div className="config-tile__icon">
          <Icon name={icon} size={24} />
        </div>
        <div className="config-tile__content">
          <div className="config-tile__title">{title}</div>
          <div className="config-tile__description">{description}</div>
          {summary.length > 0 && (
            <div className="config-tile__summary">
              {summary.map((item, index) => (
                <React.Fragment key={index}>
                  <div className="config-tile__summary-key">{item.label}</div>
                  <div className="config-tile__summary-value">{item.value}</div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        <div className="config-tile__chevron">
          <Icon name="chevronRight" size={16} />
        </div>
      </button>
    )
  }
)

ConfigTile.displayName = 'ConfigTile'

export default ConfigTile
