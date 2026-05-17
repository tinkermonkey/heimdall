import React, { useState, useRef, useEffect } from 'react'
import './SplitPane.css'

interface SplitPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical'
  initialSplitPercent?: number
  minSize?: number
  maxSize?: number
  first: React.ReactNode
  second: React.ReactNode
}

export const SplitPane = React.forwardRef<HTMLDivElement, SplitPaneProps>(
  ({
    direction = 'horizontal',
    initialSplitPercent = 50,
    minSize = 200,
    maxSize = 800,
    first,
    second,
    className = '',
    ...props
  }, ref) => {
    const [splitPercent, setSplitPercent] = useState(initialSplitPercent)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDraggingRef = useRef(false)

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const isHorizontal = direction === 'horizontal'

        const position = isHorizontal
          ? e.clientX - rect.left
          : e.clientY - rect.top

        const size = isHorizontal ? rect.width : rect.height

        let newPercent = (position / size) * 100
        newPercent = Math.max(minSize / size * 100, Math.min(newPercent, (size - maxSize) / size * 100 + 100))

        setSplitPercent(newPercent)
      }

      const handleMouseUp = () => {
        isDraggingRef.current = false
      }

      if (isDraggingRef.current) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [direction, minSize, maxSize])

    const classNames = ['split-pane', `split-pane--${direction}`, className]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={containerRef || ref}
        className={classNames}
        {...props}
      >
        <div
          className="split-pane__first"
          style={direction === 'horizontal' ? { width: `${splitPercent}%` } : { height: `${splitPercent}%` }}
        >
          {first}
        </div>

        <div
          className={`split-pane__divider split-pane__divider--${direction}`}
          onMouseDown={() => {
            isDraggingRef.current = true
          }}
        />

        <div
          className="split-pane__second"
          style={direction === 'horizontal' ? { width: `${100 - splitPercent}%` } : { height: `${100 - splitPercent}%` }}
        >
          {second}
        </div>
      </div>
    )
  }
)

SplitPane.displayName = 'SplitPane'

export default SplitPane
