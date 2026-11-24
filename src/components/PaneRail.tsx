import React, { useCallback, useMemo, useRef, useState } from 'react'
import './PaneRail.css'
import { Icon } from './Icon'
import {
  clampPaneRailPosition,
  nearestPaneRailMarkIndex,
  nextPaneRailMarkIndex,
  orderPaneRailMarks,
  paneRailMarkKeys,
  type PaneRailMark,
} from './paneRailMarks'

export type { PaneRailMark } from './paneRailMarks'

export interface PaneRailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The folded pane's name, written up the rail and used in the button's accessible name. */
  label: string
  /** Called by the expand button and by a click anywhere on the rail outside a handled mark. */
  onExpand: () => void
  /** The pane's items, drawn as toned marks along the rail. Default `[]`. */
  marks?: PaneRailMark[]
  /** Position (0..1) of the selection: draws the amber notch there. Omit for no notch. */
  selectedPosition?: number
  /** Short text under the map, e.g. `'5 / 37'`. Written up the rail like the name. */
  positionLabel?: string
  /** Key that toggles the pane, shown as a hint and set as the button's `aria-keyshortcuts`. The app handles the key itself. */
  shortcut?: string
  /** Which edge of the layout the folded pane sits on: the border faces the content and the chevron points into it. Default `'left'`. */
  side?: 'left' | 'right'
  /** Accessible name of the expand button. Default `` `Expand ${label}` ``. */
  expandLabel?: string
  /** Accessible name of the marks' toolbar. Default `` `${label} map` ``. */
  mapLabel?: string
  /** Called with a mark's id when it is clicked or activated by keyboard. Without it, a mark click expands the pane. */
  onMarkClick?: (id: string) => void
  /** Called with a mark's id and its element on mouse enter and on focus, for the app's hover card. */
  onMarkHover?: (id: string, anchor: HTMLElement) => void
  /** Called with a mark's id on mouse leave and on blur. */
  onMarkLeave?: (id: string) => void
}

const NO_MARKS: PaneRailMark[] = []

export const PaneRail = React.forwardRef<HTMLDivElement, PaneRailProps>(
  (
    {
      label,
      onExpand,
      marks = NO_MARKS,
      selectedPosition,
      positionLabel,
      shortcut,
      side = 'left',
      expandLabel,
      mapLabel,
      onMarkClick,
      onMarkHover,
      onMarkLeave,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const ordered = useMemo(() => orderPaneRailMarks(marks), [marks])
    const keys = useMemo(() => paneRailMarkKeys(ordered), [ordered])
    const marksRef = useRef<HTMLDivElement>(null)
    // The key of the mark that holds the toolbar's single tab stop while focus is inside it.
    // Cleared when focus leaves the toolbar, so the next Tab in lands next to the notch again.
    const [focusedKey, setFocusedKey] = useState<string | null>(null)

    const focusedIndex = focusedKey === null ? -1 : keys.indexOf(focusedKey)
    const tabStop = focusedIndex >= 0 ? focusedIndex : nearestPaneRailMarkIndex(ordered, selectedPosition)

    const markAt = (el: HTMLElement): PaneRailMark | undefined => ordered[Number(el.dataset.index)]

    const handleRootClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented) onExpand()
    }

    const handleExpandClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onExpand()
    }

    const handleMarkClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const mark = markAt(e.currentTarget)
      if (!mark || !onMarkClick) return // bubbles to the rail, which expands the pane
      e.stopPropagation()
      onMarkClick(mark.id)
    }

    const handleMarkEnter = (e: React.SyntheticEvent<HTMLButtonElement>) => {
      const mark = markAt(e.currentTarget)
      if (mark) onMarkHover?.(mark.id, e.currentTarget)
    }

    const handleMarkLeave = (e: React.SyntheticEvent<HTMLButtonElement>) => {
      const mark = markAt(e.currentTarget)
      if (mark) onMarkLeave?.(mark.id)
    }

    const handleMarkFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      const index = Number(e.currentTarget.dataset.index)
      const mark = ordered[index]
      if (!mark) return
      setFocusedKey(keys[index])
      onMarkHover?.(mark.id, e.currentTarget)
    }

    const handleMarksBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      const next = e.relatedTarget as Node | null
      if (!next || !e.currentTarget.contains(next)) setFocusedKey(null)
    }

    const handleMarkKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        const next = nextPaneRailMarkIndex(Number(e.currentTarget.dataset.index), e.key, ordered.length)
        if (next === null) return
        e.preventDefault()
        const target = marksRef.current?.children[next] as HTMLElement | undefined
        target?.focus()
      },
      [ordered.length]
    )

    const classNames = ['pane-rail', `pane-rail--${side}`, className].filter(Boolean).join(' ')

    return (
      // The rail's empty area expands the pane by mouse; the expand button is the keyboard path.
      <div ref={ref} className={classNames} onClick={handleRootClick} {...props}>
        <button
          type="button"
          className="pane-rail__expand"
          aria-expanded={false}
          aria-label={expandLabel ?? `Expand ${label}`}
          aria-keyshortcuts={shortcut}
          onClick={handleExpandClick}
        >
          <Icon name={side === 'left' ? 'chevronRight' : 'chevronLeft'} size={16} />
        </button>

        <div className="pane-rail__map">
          {ordered.length > 0 && (
            <div
              ref={marksRef}
              className="pane-rail__marks"
              role="toolbar"
              aria-orientation="vertical"
              aria-label={mapLabel ?? `${label} map`}
              onBlur={handleMarksBlur}
            >
              {ordered.map((mark, index) => (
                <button
                  key={keys[index]}
                  type="button"
                  className={`pane-rail__mark pane-rail__mark--${mark.tone ?? 'neutral'}`}
                  style={{ top: `${mark.position * 100}%` }}
                  aria-label={mark.label}
                  tabIndex={index === tabStop ? 0 : -1}
                  data-index={index}
                  data-mark-id={mark.id}
                  onClick={handleMarkClick}
                  onMouseEnter={handleMarkEnter}
                  onMouseLeave={handleMarkLeave}
                  onFocus={handleMarkFocus}
                  onBlur={handleMarkLeave}
                  onKeyDown={handleMarkKeyDown}
                />
              ))}
            </div>
          )}
          {selectedPosition !== undefined && (
            <span
              className="pane-rail__notch"
              style={{ top: `${clampPaneRailPosition(selectedPosition) * 100}%` }}
              aria-hidden="true"
            />
          )}
        </div>

        {positionLabel && <span className="pane-rail__position">{positionLabel}</span>}
        <span className="pane-rail__name">{label}</span>
        {shortcut && (
          <kbd className="pane-rail__key" aria-hidden="true">
            {shortcut}
          </kbd>
        )}
      </div>
    )
  }
)

PaneRail.displayName = 'PaneRail'

export default PaneRail
