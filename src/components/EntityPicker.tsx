import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import './EntityPicker.css'
import { Icon } from './Icon'
import { Badge, type BadgeColor } from './Badge'

export interface EntityPickerResult {
  id: string
  label: string
  domain?: string
  domainColor?: BadgeColor
}

export interface EntityPickerProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onChange' | 'onSelect' | 'results'
  > {
  query: string
  onQueryChange: (query: string) => void
  results?: EntityPickerResult[]
  onSelect: (result: EntityPickerResult) => void
  onClear: () => void
  placeholder?: string
}

export const EntityPicker = React.forwardRef<HTMLDivElement, EntityPickerProps>(
  ({
    query,
    onQueryChange,
    results = [],
    onSelect,
    onClear,
    placeholder = 'Search entities...',
    className,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const container = containerRef.current
      const handleClickOutside = (e: MouseEvent) => {
        if (container && !container.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
      const container = containerRef.current
      if (!container || !isOpen) return

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setIsOpen(false)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          if (results.length > 0) {
            setSelectedIndex((i) => (i + 1) % results.length)
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          if (results.length > 0) {
            setSelectedIndex((i) => (i - 1 + results.length) % results.length)
          }
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (results[selectedIndex]) {
            onSelect(results[selectedIndex])
            setIsOpen(false)
          }
        }
      }

      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, results, selectedIndex, onSelect])

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(e.target.value)
      setIsOpen(true)
      setSelectedIndex(0)
    }

    const handleInputFocus = () => {
      if (query.length > 0 && results.length > 0) {
        setIsOpen(true)
      }
    }

    const handleClear = () => {
      onClear()
      setIsOpen(false)
      inputRef.current?.focus()
    }

    const handleResultClick = (result: EntityPickerResult) => {
      onSelect(result)
      setIsOpen(false)
    }

    return (
      <div ref={containerRef} className={['entity-picker', className].filter(Boolean).join(' ')} {...props}>
        <div className="entity-picker__input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="entity-picker__input"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            data-testid="entity-picker-input"
          />
          {query && (
            <button
              className="entity-picker__clear"
              onClick={handleClear}
              aria-label="Clear search"
              data-testid="entity-picker-clear"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        {isOpen && results.length > 0 && (
          <div
            className="entity-picker__dropdown"
            data-testid="entity-picker-dropdown"
          >
            {results.map((result, index) => (
              <button
                key={result.id}
                className={[
                  'entity-picker__result',
                  index === selectedIndex && 'entity-picker__result--selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleResultClick(result)}
                data-testid={`entity-picker-result-${result.id}`}
              >
                {result.domain && result.domainColor && (
                  <Badge color={result.domainColor} className="entity-picker__badge">
                    {result.domain}
                  </Badge>
                )}
                <span className="entity-picker__label">{result.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

EntityPicker.displayName = 'EntityPicker'

export default EntityPicker
