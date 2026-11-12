import type React from 'react'

/** A modifier or non-primary click: the browser opens the link in a new tab or window, or saves it. */
export const isModifiedClick = (event: React.MouseEvent): boolean =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey

/**
 * A plain primary click on a link that nothing has handled yet: the page is about to navigate.
 * Components call their select callbacks for these only, so cmd/ctrl/shift/alt-click and
 * middle-click keep the browser's new-tab behaviour without also selecting in this tab.
 */
export const isPlainLinkClick = (event: React.MouseEvent): boolean => !event.defaultPrevented && !isModifiedClick(event)
