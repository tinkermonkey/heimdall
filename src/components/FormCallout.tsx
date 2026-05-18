import React from 'react'
import './FormCallout.css'
import { Icon, type IconName } from './Icon'

export interface FormCalloutProps {
  icon?: IconName
  children: React.ReactNode
}

const parseBody = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  const regex = /`([^`]+)`/g
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    parts.push(
      <code key={`code-${match.index}`} className="form-callout__code">
        {match[1]}
      </code>
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export const FormCallout = React.forwardRef<HTMLDivElement, FormCalloutProps>(
  ({ icon, children }, ref) => {
    const bodyText = typeof children === 'string' ? children : ''
    const parsedBody = typeof children === 'string' ? parseBody(bodyText) : children

    return (
      <div ref={ref} className="form-callout" data-testid="form-callout">
        {icon && (
          <div className="form-callout__icon">
            <Icon name={icon} size={16} />
          </div>
        )}
        <div className="form-callout__body">{parsedBody}</div>
      </div>
    )
  }
)

FormCallout.displayName = 'FormCallout'

export default FormCallout
