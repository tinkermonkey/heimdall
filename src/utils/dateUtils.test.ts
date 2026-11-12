// formatTimestamp and isToday with a fixed reference time print the same thing in every timezone,
// so a build server in UTC and a browser in Los Angeles or Tokyo agree (0.13.0). Node re-reads
// process.env.TZ when it changes, so each case runs under several zones in one process.
import { afterAll, describe, expect, it } from 'vitest'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { formatTimestamp, isToday } from './dateUtils'
import { ActivityTimeline } from '../components/ActivityTimeline'
import { MiniCalendar } from '../components/MiniCalendar'

const ZONES = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']
const originalTz = process.env.TZ

/** `run()` under each zone; returns the results by zone. */
function inZones<T>(run: () => T): Record<string, T> {
  const out: Record<string, T> = {}
  for (const zone of ZONES) {
    process.env.TZ = zone
    out[zone] = run()
  }
  return out
}
const sameEverywhere = <T,>(results: Record<string, T>) => new Set(Object.values(results).map((v) => JSON.stringify(v))).size

afterAll(() => {
  process.env.TZ = originalTz
})

describe('formatTimestamp with a fixed now', () => {
  it('runs under the zones it claims to (the TZ switch takes effect)', () => {
    const offsets = inZones(() => new Date('2026-11-12T03:00:00Z').getTimezoneOffset())
    expect(sameEverywhere(offsets)).toBe(ZONES.length)
  })

  it('prints dates past a week as en-US in UTC, whatever the timezone', () => {
    // 01:30 UTC is the previous evening in Los Angeles and Pago Pago.
    const results = inZones(() => formatTimestamp('2026-11-03T01:30:00Z', '2026-11-12T12:00:00Z'))
    expect(Object.values(results)).toEqual(ZONES.map(() => '11/3/2026'))
  })

  it('relative labels depend only on the two instants', () => {
    const results = inZones(() => [
      formatTimestamp('2026-11-12T11:59:40Z', '2026-11-12T12:00:00Z'),
      formatTimestamp('2026-11-12T09:00:00Z', Date.parse('2026-11-12T12:00:00Z')),
      formatTimestamp(new Date('2026-11-09T23:00:00Z'), new Date('2026-11-12T12:00:00Z')),
    ])
    expect(Object.values(results)).toEqual(ZONES.map(() => ['just now', '3h ago', '2d ago']))
  })

  it('ActivityTimeline server HTML is the same in every timezone', () => {
    const events = [
      { id: 'a', type: 'create' as const, subject: 'cls_a', timestamp: '2026-11-12T11:15:00Z' },
      { id: 'b', type: 'update' as const, subject: 'cls_b', timestamp: '2026-11-03T01:30:00Z' },
    ]
    const html = inZones(() => renderToString(h(ActivityTimeline, { events, now: '2026-11-12T12:00:00Z' })))
    expect(sameEverywhere(html)).toBe(1)
    expect(html.UTC).toContain('11/3/2026')
  })
})

describe('isToday with a fixed today', () => {
  it('a YYYY-MM-DD string names the day in every timezone', () => {
    const results = inZones(() => [
      isToday(new Date(2026, 10, 12), '2026-11-12'),
      isToday(new Date(2026, 10, 11), '2026-11-12'),
      isToday('2026-11-12', '2026-11-12'),
    ])
    expect(Object.values(results)).toEqual(ZONES.map(() => [true, false, true]))
  })

  it('an instant counts as its UTC day, not the local one', () => {
    // 03:00 UTC on the 12th is still the 11th in Los Angeles; the 12th is today everywhere.
    const results = inZones(() => [
      isToday(new Date(2026, 10, 12), '2026-11-12T03:00:00Z'),
      isToday(new Date(2026, 10, 11), Date.parse('2026-11-12T03:00:00Z')),
      isToday(new Date(2026, 10, 12, 23, 30), new Date('2026-11-12T23:59:00Z')),
    ])
    expect(Object.values(results)).toEqual(ZONES.map(() => [true, false, true]))
  })

  it('MiniCalendar highlights the same day in every timezone', () => {
    const today = inZones(() => {
      const html = renderToString(h(MiniCalendar, { focusedDate: '2026-11-15', today: '2026-11-12T03:00:00Z' }))
      return html.match(/mini-calendar__date--today[^>]*><span[^>]*>(\d+)</)?.[1]
    })
    expect(Object.values(today)).toEqual(ZONES.map(() => '12'))
  })

  it('without today, compares against the local clock (unchanged)', () => {
    expect(isToday(new Date())).toBe(true)
  })
})
