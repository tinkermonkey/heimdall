import React, { useMemo } from 'react'
import { useVirtualList } from '../hooks/useVirtualList'
import { VersionPill } from './VersionPill'
import './SideBySideDiff.css'

export type DiffLineType = 'context' | 'added' | 'removed' | 'hunk'

export interface DiffLine {
  type: DiffLineType
  content: string
  lineNumber?: number
}

export interface SideBySideDiffProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: DiffLine[]
}

const ITEM_HEIGHT = 24
const CONTAINER_HEIGHT = 500

export const SideBySideDiff = React.forwardRef<HTMLDivElement, SideBySideDiffProps>(
  ({ lines = [], className = '', ...props }, ref) => {
    const { visibleRange, offsetY, containerRef } = useVirtualList({
      itemCount: lines.length,
      itemHeight: ITEM_HEIGHT,
      containerHeight: CONTAINER_HEIGHT,
    })

    const [startIdx, endIdx] = visibleRange

    const classNames = ['side-by-side-diff', className].filter(Boolean).join(' ')

    const hasLines = lines.length > 0

    if (!hasLines) {
      return (
        <div ref={ref} className={classNames} {...props}>
          <div className="side-by-side-diff__empty">No changes between these versions</div>
        </div>
      )
    }

    return (
      <div ref={ref} className={classNames} {...props}>
        <div className="side-by-side-diff__header">
          <div className="side-by-side-diff__gutter" />
          <VersionPill tone="emerald" className="side-by-side-diff__pill side-by-side-diff__pill--added">
            Version 2 (Added)
          </VersionPill>
        </div>

        <div className="side-by-side-diff__viewport" ref={containerRef}>
          <div
            className="side-by-side-diff__content"
            style={{
              height: lines.length * ITEM_HEIGHT,
            }}
          >
            {Array.from({ length: lines.length }).map((_, index) => {
              if (index < startIdx || index >= endIdx) {
                return (
                  <div key={index} className="side-by-side-diff__row" style={{ height: ITEM_HEIGHT }} />
                )
              }

              const line = lines[index]
              const isHunk = line.type === 'hunk'
              const isAdded = line.type === 'added'
              const isRemoved = line.type === 'removed'

              return (
                <div
                  key={index}
                  className={[
                    'side-by-side-diff__row',
                    `side-by-side-diff__row--${line.type}`,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ height: ITEM_HEIGHT }}
                >
                  {isHunk ? (
                    <div className="side-by-side-diff__hunk">{line.content}</div>
                  ) : (
                    <>
                      <div className="side-by-side-diff__gutter" data-line-number={line.lineNumber}>
                        <span
                          className={[
                            'side-by-side-diff__glyph',
                            isAdded && 'side-by-side-diff__glyph--added',
                            isRemoved && 'side-by-side-diff__glyph--removed',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-hidden="true"
                        >
                          {isAdded ? '+' : isRemoved ? '−' : ''}
                        </span>
                      </div>
                      <div
                        className={[
                          'side-by-side-diff__line',
                          isAdded && 'side-by-side-diff__line--added',
                          isRemoved && 'side-by-side-diff__line--removed',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span className="side-by-side-diff__content">{line.content}</span>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
)

SideBySideDiff.displayName = 'SideBySideDiff'

export default SideBySideDiff
