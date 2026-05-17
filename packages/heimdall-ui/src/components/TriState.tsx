import React from 'react'
import './TriState.css'

interface TriStateProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean
}

export const TriState = React.forwardRef<HTMLInputElement, TriStateProps>(
  ({ indeterminate = false, className = '', ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null)
    const combinedRef = ref || innerRef

    React.useEffect(() => {
      if (typeof combinedRef === 'function') {
        return
      }
      if (combinedRef && combinedRef.current) {
        combinedRef.current.indeterminate = indeterminate
      }
    }, [indeterminate, combinedRef])

    const classNames = [
      'tri-state',
      indeterminate && 'tri-state--indeterminate',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <input
        ref={combinedRef}
        type="checkbox"
        className={classNames}
        {...props}
      />
    )
  }
)

TriState.displayName = 'TriState'

export default TriState
