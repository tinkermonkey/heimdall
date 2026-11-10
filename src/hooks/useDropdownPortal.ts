import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  computeDropdownPosition,
  dropdownPlacementClass,
  DROPDOWN_MAX_HEIGHT,
  type DropdownPlacement,
} from '../components/dropdownPlacement'

// useLayoutEffect warns during server rendering; the effect only matters in the browser.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Attribute set on every portalled dropdown panel. */
export const DROPDOWN_PORTAL_ATTR = 'data-dropdown-portal'

// Portalled panel → the element it logically belongs to (its anchor).
const portalOwners = new WeakMap<Element, Element>()

/**
 * `container.contains(target)`, but a target inside a portalled dropdown panel
 * counts as inside the panel's anchor. Use it in outside-click handlers so a
 * click in a Select / RowMenu panel doesn't dismiss the Popover (or other
 * surface) that the dropdown's trigger lives in.
 */
export function containsAcrossPortals(container: Node | null, target: Node | null): boolean {
  if (!container) return false
  let node: Node | null = target
  while (node) {
    if (container.contains(node)) return true
    const el = node instanceof Element ? node : node.parentElement
    const panel = el?.closest(`[${DROPDOWN_PORTAL_ATTR}]`)
    const owner = panel ? portalOwners.get(panel) : undefined
    if (!owner) return false
    node = owner
  }
  return false
}

export interface UseDropdownPortalOptions {
  /** Element the panel is positioned against (the trigger or its wrapper). */
  anchorRef: React.RefObject<HTMLElement>
  panelRef: React.RefObject<HTMLElement>
  /** Whether the panel is open; it is only positioned while open. */
  isOpen: boolean
  placement?: DropdownPlacement
  /** Render the panel in a portal on `document.body`. Default `true`. */
  portal?: boolean
}

export interface UseDropdownPortalReturn {
  /** True once the panel is actually rendered into `document.body`. */
  portalled: boolean
  /** Positioning class(es) for the panel. */
  className: string
  /** Extra attributes for the panel element. */
  panelProps: { [DROPDOWN_PORTAL_ATTR]?: '' }
  /** Wraps the panel element in the portal when `portalled`. */
  renderPanel: (panel: ReactNode) => ReactNode
}

/**
 * Renders a `.dropdown-panel` in a portal on `document.body` with
 * `position: fixed`, positioned from the anchor's bounding rect so scrolling
 * or `overflow: hidden` ancestors can't clip it. It flips above / to the other
 * edge when there's no room, and follows the anchor on scroll (any ancestor)
 * and resize. With `portal: false` it returns the in-place placement class.
 *
 * Until mount (and during SSR) the panel renders in place; nothing touches
 * `document` during render.
 */
export function useDropdownPortal({
  anchorRef,
  panelRef,
  isOpen,
  placement = 'bottom-start',
  portal = true,
}: UseDropdownPortalOptions): UseDropdownPortalReturn {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const portalled = portal && mounted

  const update = useCallback(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return
    const rect = anchor.getBoundingClientRect()
    panel.style.setProperty('--dropdown-anchor-width', `${rect.width}px`)
    const cs = getComputedStyle(panel)
    const borders = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
    const pos = computeDropdownPosition({
      anchor: rect,
      panel: {
        width: panel.offsetWidth,
        height: Math.min(panel.scrollHeight + borders, DROPDOWN_MAX_HEIGHT),
      },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      placement,
    })
    panel.style.top = `${pos.top}px`
    panel.style.left = `${pos.left}px`
    panel.style.setProperty('--dropdown-available-height', `${pos.availableHeight}px`)
    panel.dataset.placement = pos.placement
  }, [anchorRef, panelRef, placement])

  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current
    const anchor = anchorRef.current
    if (!portalled || !panel || !anchor) return
    portalOwners.set(panel, anchor)
    return () => {
      portalOwners.delete(panel)
    }
  })

  useIsomorphicLayoutEffect(() => {
    if (!portalled || !isOpen) return
    update()

    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }
    // Capture phase: scroll events don't bubble, so this catches any scrolling ancestor.
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    if (ro) {
      if (anchorRef.current) ro.observe(anchorRef.current)
      if (panelRef.current) ro.observe(panelRef.current)
    }
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      ro?.disconnect()
    }
  }, [portalled, isOpen, update, anchorRef, panelRef])

  return {
    portalled,
    className: portalled ? 'dropdown-panel--portal' : dropdownPlacementClass(placement),
    panelProps: portalled ? { [DROPDOWN_PORTAL_ATTR]: '' } : {},
    renderPanel: (panel) => (portalled ? createPortal(panel, document.body) : panel),
  }
}
