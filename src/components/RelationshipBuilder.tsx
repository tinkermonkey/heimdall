import React from 'react'
import './RelationshipBuilder.css'
import { Select } from './Select'
import { EntityPicker, type EntityPickerResult } from './EntityPicker'

export interface RelationshipBuilderValue {
  source?: EntityPickerResult
  predicate: string
  target?: EntityPickerResult
}

export interface RelationshipBuilderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: RelationshipBuilderValue
  onChange: (value: RelationshipBuilderValue) => void
  sourceResults?: EntityPickerResult[]
  targetResults?: EntityPickerResult[]
  sourceQuery: string
  onSourceQueryChange: (query: string) => void
  targetQuery: string
  onTargetQueryChange: (query: string) => void
  predicates?: string[]
  onSourceClear: () => void
  onTargetClear: () => void
}

export const RelationshipBuilder = React.forwardRef<HTMLDivElement, RelationshipBuilderProps>(
  ({
    value,
    onChange,
    sourceResults = [],
    targetResults = [],
    sourceQuery,
    onSourceQueryChange,
    targetQuery,
    onTargetQueryChange,
    predicates = ['contains', 'relates to', 'depends on', 'is used by'],
    onSourceClear,
    onTargetClear,
    className,
    ...props
  }, ref) => {
    const handleSourceSelect = (result: EntityPickerResult) => {
      onChange({ ...value, source: result })
      onSourceQueryChange('')
    }

    const handleTargetSelect = (result: EntityPickerResult) => {
      onChange({ ...value, target: result })
      onTargetQueryChange('')
    }

    const handlePredicateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ ...value, predicate: e.target.value })
    }

    return (
      <div ref={ref} className={['relationship-builder', className].filter(Boolean).join(' ')} data-testid="relationship-builder" {...props}>
        <div className="relationship-builder__column">
          <label className="relationship-builder__label">Source</label>
          <EntityPicker
            query={sourceQuery}
            onQueryChange={onSourceQueryChange}
            results={sourceResults}
            onSelect={handleSourceSelect}
            onClear={onSourceClear}
            placeholder="Search source entity..."
          />
          {value.source && (
            <div className="relationship-builder__selected" data-testid="source-selected">
              {value.source.domain && (
                <span className="relationship-builder__domain">{value.source.domain}</span>
              )}
              <span>{value.source.label}</span>
            </div>
          )}
        </div>

        <div className="relationship-builder__column">
          <label className="relationship-builder__label">Predicate</label>
          <Select
            value={value.predicate}
            onChange={handlePredicateChange}
            data-testid="predicate-select"
          >
            <option value="">Select relation type...</option>
            {predicates.map((pred) => (
              <option key={pred} value={pred}>
                {pred}
              </option>
            ))}
          </Select>
        </div>

        <div className="relationship-builder__column">
          <label className="relationship-builder__label">Target</label>
          <EntityPicker
            query={targetQuery}
            onQueryChange={onTargetQueryChange}
            results={targetResults}
            onSelect={handleTargetSelect}
            onClear={onTargetClear}
            placeholder="Search target entity..."
          />
          {value.target && (
            <div className="relationship-builder__selected" data-testid="target-selected">
              {value.target.domain && (
                <span className="relationship-builder__domain">{value.target.domain}</span>
              )}
              <span>{value.target.label}</span>
            </div>
          )}
        </div>
      </div>
    )
  }
)

RelationshipBuilder.displayName = 'RelationshipBuilder'

export default RelationshipBuilder
