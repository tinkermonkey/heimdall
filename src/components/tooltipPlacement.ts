import type { TooltipPlacement } from './Tooltip'

/**
 * Side-picking placement for a free-floating tooltip card next to an anchor box — used by
 * GraphCanvas's nodeTooltip/edgeTooltip overlay, where the anchor (a node box or an edge label)
 * can sit anywhere inside a clipped canvas.
 */

export interface TooltipRect {
  top: number
  left: number
  right: number
  bottom: number
}

export interface TooltipPositionInput {
  /** The box the card explains (zero-size for a point anchor). Same coordinate space as `bounds`. */
  anchor: TooltipRect
  /** The card's natural size. */
  card: { width: number; height: number }
  /** The area the card must stay inside (e.g. the visible part of the canvas). */
  bounds: TooltipRect
  /** Side tried first. Default 'top'. */
  placement?: TooltipPlacement
  /** Gap between anchor and card, in px. Default 6 (the Tooltip component's default offset). */
  offset?: number
  /** Minimum gap between card and `bounds` edge, in px. Default 4. */
  margin?: number
}

export interface TooltipPosition {
  /** Top-left corner of the card, in the same space as `anchor`/`bounds`. */
  top: number
  left: number
  /** Side actually used. */
  placement: TooltipPlacement
}

const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

const PERPENDICULAR: Record<TooltipPlacement, [TooltipPlacement, TooltipPlacement]> = {
  top: ['right', 'left'],
  bottom: ['right', 'left'],
  left: ['top', 'bottom'],
  right: ['top', 'bottom'],
}

/**
 * Places a card beside `anchor`, never over it while any side has room: tries `placement`, then
 * the opposite side, then the two perpendicular sides, taking the first where the card fits
 * between the anchor (plus `offset`) and `bounds` (minus `margin`). The card is centred on the
 * anchor along the other axis and clamped into `bounds`. When no side fits, the side with the
 * least overflow is used and the card is clamped into `bounds` on both axes.
 */
export function computeTooltipPosition({
  anchor,
  card,
  bounds,
  placement = 'top',
  offset = 6,
  margin = 4,
}: TooltipPositionInput): TooltipPosition {
  const room: Record<TooltipPlacement, number> = {
    top: anchor.top - offset - (bounds.top + margin),
    bottom: bounds.bottom - margin - (anchor.bottom + offset),
    left: anchor.left - offset - (bounds.left + margin),
    right: bounds.right - margin - (anchor.right + offset),
  }
  const need = (side: TooltipPlacement) => (side === 'top' || side === 'bottom' ? card.height : card.width)
  const order: TooltipPlacement[] = [placement, OPPOSITE[placement], ...PERPENDICULAR[placement]]

  let side = order.find((s) => room[s] >= need(s))
  if (!side) {
    side = order.reduce((best, s) => (room[s] - need(s) > room[best] - need(best) ? s : best))
  }

  const centreX = (anchor.left + anchor.right) / 2
  const centreY = (anchor.top + anchor.bottom) / 2
  let left: number
  let top: number
  switch (side) {
    case 'top':
      top = anchor.top - offset - card.height
      left = centreX - card.width / 2
      break
    case 'bottom':
      top = anchor.bottom + offset
      left = centreX - card.width / 2
      break
    case 'left':
      left = anchor.left - offset - card.width
      top = centreY - card.height / 2
      break
    case 'right':
      left = anchor.right + offset
      top = centreY - card.height / 2
      break
  }

  // Clamp into bounds; the low edge wins when the card is larger than the bounds.
  left = Math.max(bounds.left + margin, Math.min(left, bounds.right - margin - card.width))
  top = Math.max(bounds.top + margin, Math.min(top, bounds.bottom - margin - card.height))

  return { top, left, placement: side }
}
