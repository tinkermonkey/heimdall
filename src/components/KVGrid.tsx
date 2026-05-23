import React from 'react'
import './KVGrid.css'

export interface KVGridRow {
  key: string
  value: React.ReactNode
}

export interface KVGridProps extends React.HTMLAttributes<HTMLDivElement> {
  rows: KVGridRow[]
}

export const KVGrid = React.forwardRef<HTMLDivElement, KVGridProps>(
  ({ rows, className = '', ...props }, ref) => {
    const classNames = ['kv-grid', className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        {rows.map((row, index) => (
          <React.Fragment key={index}>
            <div className="kv-grid__key">{row.key}</div>
            <div className="kv-grid__value">{row.value}</div>
          </React.Fragment>
        ))}
      </div>
    )
  }
)

KVGrid.displayName = 'KVGrid'

export default KVGrid
