import React, { createContext, useContext, ReactNode } from 'react'
import './InspectorPanel.css'
import { VersionPill } from './VersionPill'

const InspectorPanelContext = createContext<true | undefined>(undefined)

const useInspectorPanelContext = () => {
  const context = useContext(InspectorPanelContext)
  if (!context) {
    throw new Error('InspectorPanel.Section must be used within an InspectorPanel')
  }
  return context
}

export interface InspectorPanelSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  count?: number
  actions?: ReactNode
  children?: ReactNode
}

const InspectorPanelSection = React.forwardRef<HTMLDivElement, InspectorPanelSectionProps>(
  ({ title, count, actions, children, className = '', ...props }, ref) => {
    useInspectorPanelContext()

    const classNames = ['inspector-panel__section', className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        <div className="inspector-panel__section-header">
          <div className="inspector-panel__section-title">
            <span>{title}</span>
            {count !== undefined && (
              <span className="inspector-panel__section-count">· {count}</span>
            )}
          </div>
          {actions && <div className="inspector-panel__section-actions">{actions}</div>}
        </div>
        {children && <div className="inspector-panel__section-content">{children}</div>}
      </div>
    )
  }
)

InspectorPanelSection.displayName = 'InspectorPanel.Section'

export interface InspectorPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow: string
  title: string
  id: string
  version?: number
  actions?: ReactNode
  children?: ReactNode
}

const InspectorPanelComponent = React.forwardRef<HTMLDivElement, InspectorPanelProps>(
  (
    { eyebrow, title, id, version, actions, children, className = '', ...props },
    ref
  ) => {
    const classNames = ['inspector-panel', className].filter(Boolean).join(' ')

    return (
      <InspectorPanelContext.Provider value={true}>
        <div ref={ref} className={classNames} {...props}>
          <div className="inspector-panel__head">
            <div className="inspector-panel__eyebrow">{eyebrow}</div>
            <div className="inspector-panel__title">{title}</div>
            <div className="inspector-panel__id-version">
              <span className="inspector-panel__id">{id}</span>
              {version !== undefined && (
                <VersionPill>{version}</VersionPill>
              )}
            </div>
            {actions && <div className="inspector-panel__actions">{actions}</div>}
          </div>
          <div className="inspector-panel__body">{children}</div>
        </div>
      </InspectorPanelContext.Provider>
    )
  }
)

InspectorPanelComponent.displayName = 'InspectorPanel'

export const InspectorPanel = Object.assign(InspectorPanelComponent, {
  Section: InspectorPanelSection,
})

export default InspectorPanel
