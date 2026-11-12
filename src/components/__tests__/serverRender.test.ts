// Server rendering (no window), as a static site generator does it: link variants, media queries
// and clock-relative text (0.13.0). The hydration side is tests/static-links.spec.ts.
import { describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { ShellLayout } from '../ShellLayout'
import { NavItem } from '../NavItem'
import { QuickAccessTile } from '../QuickAccessTile'
import { ActivityTimeline } from '../ActivityTimeline'
import { VersionTimeline } from '../VersionTimeline'
import { MiniCalendar } from '../MiniCalendar'
import { formatTimestamp, isToday } from '../../utils/dateUtils'

describe('server rendering', () => {
  it('has no window to read', () => {
    expect(typeof window).toBe('undefined')
  })

  it('renders ShellLayout without data-mobile, leaving the layout to CSS until hydration', () => {
    const html = renderToString(
      h(ShellLayout, {
        sidebar: {
          sections: [
            {
              title: 'Notes',
              items: [
                { id: 'home', label: 'Home', href: '/' },
                { id: 'topics', label: 'Topics', children: [{ id: 'graphs', label: 'Graphs', href: '/graphs' }] },
              ],
            },
          ],
          activeItemId: 'home',
          defaultExpandedIds: ['topics'],
        },
        topbar: { breadcrumbs: [{ label: 'Notes', href: '/' }] },
        statusbar: { left: 'ready' },
      })
    )
    expect(html).not.toContain('data-mobile')
    expect(html).toContain('<a href="/" class="sidebar__item sidebar__item--active" aria-current="page">')
    expect(html).toContain('<a href="/graphs" class="sidebar__item sidebar__item--child ">')
    expect(html).toMatch(/<button type="button" class="sidebar__item "[^>]*aria-expanded="true"/)
    expect(html).toContain('shell-layout__sidebar-col')
  })

  it('renders NavItem and QuickAccessTile as links with href, buttons without', () => {
    expect(renderToString(h(NavItem, { label: 'Home', href: '/', active: true }))).toMatch(
      /^<a class="nav-item nav-item--active" aria-current="page" href="\/">/
    )
    expect(renderToString(h(NavItem, { label: 'Home' }))).toMatch(/^<button type="button" class="nav-item"/)
    expect(renderToString(h(QuickAccessTile, { icon: 'schema', title: 'Schema', href: '/schema' }))).toMatch(
      /^<a class="quick-access-tile" data-testid="quick-access-tile" href="\/schema">/
    )
    expect(renderToString(h(QuickAccessTile, { icon: 'schema', title: 'Schema' }))).toMatch(
      /^<button type="button" class="quick-access-tile"/
    )
  })

  it('measures relative times from `now`, or uses formatTimestamp', () => {
    const now = '2026-11-12T12:00:00Z'
    const events = [{ id: 'a', type: 'create' as const, subject: 'cls_a', timestamp: '2026-11-12T11:15:00Z' }]
    expect(renderToString(h(ActivityTimeline, { events, now }))).toContain('45m ago')
    expect(
      renderToString(h(ActivityTimeline, { events, formatTimestamp: (t) => h('time', null, String(t)) }))
    ).toContain('<time>2026-11-12T11:15:00Z</time>')
    const entries = [{ id: 'v1', label: 'v1', timestamp: '2026-11-10T12:00:00Z' }]
    expect(renderToString(h(VersionTimeline, { entries, now }))).toContain('2d ago')
  })

  it('highlights `today` in MiniCalendar', () => {
    const html = renderToString(h(MiniCalendar, { focusedDate: new Date(2026, 1, 10), today: new Date(2026, 1, 3) }))
    expect(html.match(/mini-calendar__date--today/g)).toHaveLength(1)
  })
})

describe('dateUtils', () => {
  it('formatTimestamp takes a fixed now', () => {
    expect(formatTimestamp('2026-11-12T11:59:40Z', '2026-11-12T12:00:00Z')).toBe('just now')
    expect(formatTimestamp(new Date('2026-11-12T09:00:00Z'), Date.parse('2026-11-12T12:00:00Z'))).toBe('3h ago')
  })

  it('isToday takes a fixed today (a date; dateUtils.test.ts covers timezones)', () => {
    expect(isToday(new Date(2026, 0, 5), '2026-01-05')).toBe(true)
    expect(isToday(new Date(2026, 0, 5), '2026-01-06')).toBe(false)
  })
})
