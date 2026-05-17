import React from 'react'

export function renderComponentToHtml(element: React.ReactElement): string {
  // For Playwright tests, we render to HTML that can be set on a page
  // This ensures the tests use the actual React components
  const { renderToString } = require('react-dom/server')
  return renderToString(element)
}
