/**
 * Shared placement vocabulary for floating dropdown panels
 * (Select, FilterDropdown, EntityPicker, RowMenu).
 *
 * `start` / `end` refer to the trigger's edge the panel aligns with on the
 * horizontal axis. `top` / `bottom` is the vertical side the panel opens to.
 *
 *  bottom-start (default) → panel hangs below, left edge aligned with trigger
 *  bottom-end             → panel hangs below, right edge aligned with trigger
 *  top-start              → panel rises above, left edge aligned with trigger
 *  top-end                → panel rises above, right edge aligned with trigger
 */
export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'

export const dropdownPlacementClass = (placement: DropdownPlacement = 'bottom-start'): string =>
  `dropdown-panel--placement-${placement}`

/** Default `max-height` of `.dropdown-panel`, in px. Keep in sync with dropdown-base.css. */
export const DROPDOWN_MAX_HEIGHT = 320

export interface DropdownRect {
  top: number
  left: number
  right: number
  bottom: number
}

export interface DropdownPositionInput {
  /** The trigger's bounding rect, in viewport coordinates. */
  anchor: DropdownRect
  /** The panel's natural size (already capped at its max height). */
  panel: { width: number; height: number }
  viewport: { width: number; height: number }
  /** The placement the consumer asked for. */
  placement?: DropdownPlacement
  /** Gap between trigger and panel, in px. */
  offset?: number
  /** Minimum gap between panel and viewport edge, in px. */
  margin?: number
}

export interface DropdownPosition {
  /** Viewport-relative top of the panel (for `position: fixed`). */
  top: number
  /** Viewport-relative left of the panel (for `position: fixed`). */
  left: number
  /** Placement actually used after flipping. */
  placement: DropdownPlacement
  /** Vertical room on the chosen side; the panel must not grow taller. */
  availableHeight: number
}

/**
 * Positions a `position: fixed` panel next to its trigger.
 *
 * Vertical: opens on the requested side unless the panel doesn't fit there and
 * the opposite side has more room. Horizontal: aligns the requested edge unless
 * the panel would cross the viewport edge and the other alignment fits. The
 * result is then clamped so the panel stays `margin` px inside the viewport.
 */
export function computeDropdownPosition({
  anchor,
  panel,
  viewport,
  placement = 'bottom-start',
  offset = 4,
  margin = 8,
}: DropdownPositionInput): DropdownPosition {
  const [requestedSide, requestedAlign] = placement.split('-') as ['top' | 'bottom', 'start' | 'end']

  const spaceBelow = viewport.height - anchor.bottom - offset - margin
  const spaceAbove = anchor.top - offset - margin
  let side = requestedSide
  if (side === 'bottom' && panel.height > spaceBelow && spaceAbove > spaceBelow) side = 'top'
  else if (side === 'top' && panel.height > spaceAbove && spaceBelow > spaceAbove) side = 'bottom'

  const availableHeight = Math.max(0, side === 'bottom' ? spaceBelow : spaceAbove)
  const height = Math.min(panel.height, availableHeight)
  const top = side === 'bottom' ? anchor.bottom + offset : anchor.top - offset - height

  const maxRight = viewport.width - margin
  let align = requestedAlign
  if (align === 'start' && anchor.left + panel.width > maxRight && anchor.right - panel.width >= margin) {
    align = 'end'
  } else if (align === 'end' && anchor.right - panel.width < margin && anchor.left + panel.width <= maxRight) {
    align = 'start'
  }
  let left = align === 'start' ? anchor.left : anchor.right - panel.width
  left = Math.max(margin, Math.min(left, maxRight - panel.width))

  return { top, left, placement: `${side}-${align}` as DropdownPlacement, availableHeight }
}
