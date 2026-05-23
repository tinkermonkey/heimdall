import React from 'react'
import './SegmentedControl.css'

export interface SegmentedControlOption {
  value: string | number
  label: React.ReactNode
}

export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: string | number
  onChange: (value: string | number) => void
  options: SegmentedControlOption[]
}

export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ value, onChange, options, className = '', ...props }, ref) => {
    const classNames = ['segmented-control', className]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classNames} role="radiogroup" {...props}>
        {options.map((option) => (
          <button
            key={option.value}
            className={`segmented-control__segment ${value === option.value ? 'segmented-control__segment--active' : ''}`}
            onClick={() => onChange(option.value)}
            type="button"
            role="radio"
            aria-checked={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    )
  }
)

SegmentedControl.displayName = 'SegmentedControl'

export default SegmentedControl
