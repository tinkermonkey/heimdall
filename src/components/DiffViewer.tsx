import React, { useState, ReactNode } from 'react'
import { HashSetDiff, type HashSetDiffProps } from './HashSetDiff'
import { SideBySideDiff, type SideBySideDiffProps } from './SideBySideDiff'
import { VersionPill, type VersionPillTone } from './VersionPill'
import './DiffViewer.css'

export type DiffViewerMode = 'hash-set' | 'side-by-side'

export interface DiffViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: DiffViewerMode
  onModeChange?: (mode: DiffViewerMode) => void
  children?: ReactNode
}

export interface DiffViewerHashSetProps extends Omit<HashSetDiffProps, 'className'> {
  label?: string
  labelTone?: VersionPillTone
  className?: string
}

export interface DiffViewerSideBySideProps extends Omit<SideBySideDiffProps, 'className'> {
  addedLabel?: string
  removedLabel?: string
  addedLabelTone?: VersionPillTone
  removedLabelTone?: VersionPillTone
  className?: string
}

const DiffViewerComponent = React.forwardRef<HTMLDivElement, DiffViewerProps>(
  ({ mode = 'hash-set', onModeChange, children, className = '', ...props }, ref) => {
    const [currentMode, setCurrentMode] = useState<DiffViewerMode>(mode)

    const handleModeChange = (newMode: DiffViewerMode) => {
      setCurrentMode(newMode)
      onModeChange?.(newMode)
    }

    const classNames = ['diff-viewer', className].filter(Boolean).join(' ')

    return (
      <div
        ref={ref}
        className={classNames}
        role="region"
        aria-label="Diff Viewer"
        data-testid="diff-viewer"
        {...props}
      >
        <div className="diff-viewer__header" role="tablist">
          <button
            id="diff-viewer-hash-set-tab"
            role="tab"
            aria-selected={currentMode === 'hash-set'}
            aria-controls="diff-viewer-hash-set-panel"
            className={[
              'diff-viewer__tab',
              currentMode === 'hash-set' && 'diff-viewer__tab--active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleModeChange('hash-set')}
          >
            Hash Set
          </button>
          <button
            id="diff-viewer-side-by-side-tab"
            role="tab"
            aria-selected={currentMode === 'side-by-side'}
            aria-controls="diff-viewer-side-by-side-panel"
            className={[
              'diff-viewer__tab',
              currentMode === 'side-by-side' && 'diff-viewer__tab--active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => handleModeChange('side-by-side')}
          >
            Side by Side
          </button>
        </div>

        <div className="diff-viewer__content" data-testid="diff-viewer-content">
          {currentMode === 'hash-set' && (
            <div
              id="diff-viewer-hash-set-panel"
              role="tabpanel"
              aria-labelledby="diff-viewer-hash-set-tab"
              className="diff-viewer__panel diff-viewer__panel--hash-set"
            >
              {children}
            </div>
          )}
          {currentMode === 'side-by-side' && (
            <div
              id="diff-viewer-side-by-side-panel"
              role="tabpanel"
              aria-labelledby="diff-viewer-side-by-side-tab"
              className="diff-viewer__panel diff-viewer__panel--side-by-side"
            >
              {children}
            </div>
          )}
        </div>
      </div>
    )
  }
)

DiffViewerComponent.displayName = 'DiffViewer'

function DiffViewerHashSet({
  added,
  removed,
  kept,
  maxVisible,
  label = 'Changes',
  labelTone = 'amber',
  className = '',
  ...props
}: DiffViewerHashSetProps) {
  return (
    <div className={['diff-viewer-hash-set', className].filter(Boolean).join(' ')} {...props}>
      {label && (
        <div className="diff-viewer-hash-set__header">
          <VersionPill tone={labelTone} className="diff-viewer-hash-set__label">
            {label}
          </VersionPill>
        </div>
      )}
      <HashSetDiff added={added} removed={removed} kept={kept} maxVisible={maxVisible} />
    </div>
  )
}

DiffViewerHashSet.displayName = 'DiffViewerHashSet'

function DiffViewerSideBySide({
  lines,
  addedLabel = 'Version 2 (Added)',
  removedLabel = 'Version 1 (Removed)',
  addedLabelTone = 'emerald',
  removedLabelTone = 'rose',
  className = '',
  ...props
}: DiffViewerSideBySideProps) {
  return (
    <div className={['diff-viewer-side-by-side', className].filter(Boolean).join(' ')} {...props}>
      {(addedLabel || removedLabel) && (
        <div className="diff-viewer-side-by-side__header">
          <div className="diff-viewer-side-by-side__labels">
            {addedLabel && (
              <VersionPill tone={addedLabelTone} className="diff-viewer-side-by-side__label">
                {addedLabel}
              </VersionPill>
            )}
            {removedLabel && (
              <VersionPill tone={removedLabelTone} className="diff-viewer-side-by-side__label">
                {removedLabel}
              </VersionPill>
            )}
          </div>
        </div>
      )}
      <SideBySideDiff lines={lines} />
    </div>
  )
}

DiffViewerSideBySide.displayName = 'DiffViewerSideBySide'

interface DiffViewerComponentType
  extends React.ForwardRefExoticComponent<DiffViewerProps & React.RefAttributes<HTMLDivElement>> {
  HashSet: typeof DiffViewerHashSet
  SideBySide: typeof DiffViewerSideBySide
}

const DiffViewer = Object.assign(DiffViewerComponent, {
  HashSet: DiffViewerHashSet,
  SideBySide: DiffViewerSideBySide,
}) as DiffViewerComponentType

export { DiffViewer }
export default DiffViewer
