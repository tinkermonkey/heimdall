import React, { useState } from 'react'
import { Icon } from './Icon'
import { Chip } from './Chip'
import './FilterBar.css'

export interface FilterChip {
  id: string
  label: string
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  filters?: FilterChip[]
  onSearchChange?: (query: string) => void
  onFilterRemove?: (filterId: string) => void
  searchPlaceholder?: string
}

export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      filters = [],
      onSearchChange,
      onFilterRemove,
      searchPlaceholder = 'Search...',
      className = '',
      ...props
    },
    ref
  ) => {
    const [searchValue, setSearchValue] = useState('')

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchValue(value)
      onSearchChange?.(value)
    }

    const classNames = ['filter-bar', className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={classNames} {...props}>
        <div className="filter-bar__search-wrapper">
          <Icon name="search" size={16} className="filter-bar__search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            className="filter-bar__search-input"
            data-testid="filter-bar-search"
          />
        </div>
        {filters.length > 0 && (
          <div className="filter-bar__chips" data-testid="filter-bar-chips">
            {filters.map(filter => (
              <Chip
                key={filter.id}
                variant="neutral"
                className="filter-bar__chip"
                data-testid={`filter-chip-${filter.id}`}
              >
                <span className="filter-bar__chip-label">{filter.label}</span>
                <button
                  className="filter-bar__chip-close"
                  onClick={() => onFilterRemove?.(filter.id)}
                  aria-label={`Remove ${filter.label} filter`}
                  data-testid={`filter-chip-close-${filter.id}`}
                >
                  <Icon name="x" size={14} />
                </button>
              </Chip>
            ))}
          </div>
        )}
      </div>
    )
  }
)

FilterBar.displayName = 'FilterBar'

export default FilterBar
