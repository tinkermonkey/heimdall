import React, { useState } from 'react'
import './Table.css'
import { Icon } from './Icon'

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, row: T, index: number) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: string | ((row: T, index: number) => string | number)
  selectable?: boolean
  selectedRows?: (string | number)[]
  onSelectRows?: (rowKeys: (string | number)[]) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  className?: string
}

const TableComponent = React.forwardRef(
  <T,>(
    {
      columns,
      data,
      rowKey,
      selectable = true,
      selectedRows = [],
      onSelectRows,
      onSort,
      className = '',
      ...props
    }: TableProps<T>,
    ref: React.Ref<HTMLTableElement>,
  ) => {
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const getRowKey = (row: any, index: number) => {
      if (typeof rowKey === 'function') {
        return rowKey(row, index)
      }
      return row[rowKey]
    }

    const handleSelectAll = () => {
      if (selectedRows.length === data.length) {
        onSelectRows?.([])
      } else {
        onSelectRows?.(data.map((row, idx) => getRowKey(row, idx)))
      }
    }

    const handleSelectRow = (rowKeyValue: string | number) => {
      if (selectedRows.includes(rowKeyValue)) {
        onSelectRows?.(selectedRows.filter(k => k !== rowKeyValue))
      } else {
        onSelectRows?.([...selectedRows, rowKeyValue])
      }
    }

    const handleSort = (key: string) => {
      const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
      setSortKey(key)
      setSortDirection(newDirection)
      onSort?.(key, newDirection)
    }

    const classNames = ['table', className].filter(Boolean).join(' ')

    return (
      <table ref={ref} className={classNames} {...props}>
        <thead className="table__head">
          <tr className="table__row">
            {selectable && (
              <th className="table__header table__header--checkbox" style={{ width: '30px' }}>
                <input
                  type="checkbox"
                  className="table__checkbox"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map(column => (
              <th
                key={column.key}
                className={`table__header ${column.sortable ? 'table__header--sortable' : ''}`}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="table__header-content">
                  {column.label}
                  {sortKey === column.key && (
                    <Icon
                      name={sortDirection === 'asc' ? 'chevronUp' : 'chevronDown'}
                      size={14}
                      className="table__sort-icon"
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table__body">
          {data.map((row, index) => {
            const rowKeyValue = getRowKey(row, index)
            const isSelected = selectedRows.includes(rowKeyValue)
            return (
              <tr key={rowKeyValue} className={`table__row ${isSelected ? 'table__row--selected' : ''}`}>
                {selectable && (
                  <td className="table__cell table__cell--checkbox">
                    <input
                      type="checkbox"
                      className="table__checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(rowKeyValue)}
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td key={`${rowKeyValue}-${column.key}`} className="table__cell">
                    {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
) as <T,>(props: TableProps<T> & { ref?: React.Ref<HTMLTableElement> }) => React.ReactElement

TableComponent.displayName = 'Table'

export const Table = TableComponent

export default Table
