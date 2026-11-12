/** A point in time a component compares against instead of the clock (see the `now` props). */
export type DateInput = Date | string | number

const toDate = (value: DateInput): Date => (value instanceof Date ? value : new Date(value))

/**
 * Relative time (`5m ago`, `3h ago`, `2d ago`), or a date after a week.
 *
 * Without `now` it measures from the clock and prints the date in the runtime's locale and
 * timezone, as before 0.13. With a fixed `now` the output depends only on its arguments: the date
 * is `en-US` in UTC (`11/3/2026`), so a server and any browser print the same text. For another
 * format, pass the components' `formatTimestamp` prop.
 */
export const formatTimestamp = (timestamp: Date | string, now?: DateInput): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const diffMs = (now === undefined ? Date.now() : toDate(now).getTime()) - date.getTime()

  if (Number.isNaN(diffMs)) {
    return ''
  }

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return now === undefined ? date.toLocaleDateString() : date.toLocaleDateString('en-US', { timeZone: 'UTC' })
}

export const formatTime = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

export const isSameDay = (a: Date | string, b: Date | string): boolean => {
  const dateA = typeof a === 'string' ? new Date(a) : a
  const dateB = typeof b === 'string' ? new Date(b) : b

  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Whether the calendar day `d` is today. `d` is a calendar cell: a Date read in local time (or a
 * `YYYY-MM-DD` string).
 *
 * Without `today` it compares against the clock's local day, as before 0.13. A fixed `today` is a
 * date, not an instant: a `YYYY-MM-DD` string names the day, and any other value counts as the
 * UTC day it falls on. So a server in UTC and a browser in Los Angeles agree on the day, which
 * comparing local days would not. Prefer the string: `new Date()` just after midnight east of UTC
 * (Tokyo at 08:00) is still the previous day in UTC.
 */
export const isToday = (d: Date | string, today?: DateInput): boolean => {
  if (today === undefined) return isSameDay(d, new Date())
  const cell = typeof d === 'string' && DATE_ONLY.test(d) ? d : localDayKey(typeof d === 'string' ? new Date(d) : d)
  return cell === utcDayKey(today)
}

const pad = (n: number) => String(n).padStart(2, '0')
const localDayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const utcDayKey = (value: DateInput): string => {
  if (typeof value === 'string' && DATE_ONLY.test(value)) return value
  const date = toDate(value)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export const getWeekDays = (date: Date | string, weekStartsOn: 0 | 1 = 0): Date[] => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)

  const dayOfWeek = d.getDay()

  let offset = dayOfWeek - weekStartsOn
  if (offset < 0) {
    offset += 7
  }

  const firstDayOfWeek = new Date(d)
  firstDayOfWeek.setDate(d.getDate() - offset)

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek)
    day.setDate(firstDayOfWeek.getDate() + i)
    days.push(day)
  }

  return days
}

const MAX_WEEKS = 8

export const getMonthGrid = (month: Date | string, weekStartsOn: 0 | 1 = 0): Date[][] => {
  const date = typeof month === 'string' ? new Date(month) : month

  if (Number.isNaN(date.getTime())) {
    return []
  }

  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)

  const firstWeekDays = getWeekDays(firstDayOfMonth, weekStartsOn)

  const grid: Date[][] = []
  let currentDate = new Date(firstWeekDays[0])

  while (grid.length < MAX_WEEKS) {
    const week = getWeekDays(currentDate, weekStartsOn)
    grid.push(week)

    const lastDayOfWeek = week[week.length - 1]
    if (lastDayOfWeek.getMonth() > date.getMonth() || lastDayOfWeek.getFullYear() > date.getFullYear()) {
      break
    }

    currentDate = new Date(lastDayOfWeek)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return grid
}

export const formatMonthYear = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export const formatDateOnly = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const formatWeekRange = (date: Date | string, weekStartsOn: 0 | 1): string => {
  const days = getWeekDays(date, weekStartsOn)
  const start = formatDateOnly(days[0])
  const end = formatDateOnly(days[6])
  return `${start} – ${end}`
}
