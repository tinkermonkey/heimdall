import React from 'react'
import './OrderedList.css'
import { Button } from './Button'
import { Icon } from './Icon'

export interface OrderedItem {
  id: string
  label: string
}

export interface OrderedListProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: OrderedItem[]
  onChange: (items: OrderedItem[]) => void
  primaryItemId?: string
}

export const OrderedList = React.forwardRef<HTMLDivElement, OrderedListProps>(
  ({ items, onChange, primaryItemId, ...props }, ref) => {
    const handleMoveUp = (index: number) => {
      if (index > 0) {
        const newItems = [...items]
        ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
        onChange(newItems)
      }
    }

    const handleMoveDown = (index: number) => {
      if (index < items.length - 1) {
        const newItems = [...items]
        ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
        onChange(newItems)
      }
    }

    return (
      <div ref={ref} className="ordered-list" data-testid="ordered-list" {...props}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={[
              'ordered-list__item',
              primaryItemId === item.id && 'ordered-list__item--primary',
            ]
              .filter(Boolean)
              .join(' ')}
            data-testid={`ordered-item-${item.id}`}
          >
            <div className="ordered-list__rank">
              {primaryItemId === item.id && (
                <div className="ordered-list__primary-badge" title="Primary item">
                  ★
                </div>
              )}
              <div className="ordered-list__index">{index + 1}</div>
            </div>

            <span className="ordered-list__label">{item.label}</span>

            <div className="ordered-list__controls">
              <Button
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => handleMoveUp(index)}
                aria-label="Move up"
                data-testid={`move-up-${item.id}`}
              >
                <Icon name="arrowUp" size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={index === items.length - 1}
                onClick={() => handleMoveDown(index)}
                aria-label="Move down"
                data-testid={`move-down-${item.id}`}
              >
                <Icon name="arrowDown" size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }
)

OrderedList.displayName = 'OrderedList'

export default OrderedList
