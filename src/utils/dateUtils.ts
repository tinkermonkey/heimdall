/** A point in time a component compares against instead of the clock (see the `now` props). */
export type DateInput = Date | string | number

const toDate = (value: DateInput): Date => (value instanceof Date ? value : new Date(value))

/**
 * Relative time (`5m ago`, `3h ago`, `2d ago`), or the locale date after a week. `now` defaults to
 * the clock; pass a fixed value to render the same text on the server and the client.
 */
export const formatTimestamp = (timestamp: Date | string, now: DateInput = new Date()): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const diffMs = toDate(now).getTime() - date.getTime()

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

  return date.toLocaleDateString()
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

/** Whether `d` falls on the same local day as `today` (default: the clock). */
export const isToday = (d: Date | string, today: DateInput = new Date()): boolean => {
  return isSameDay(d, toDate(today))
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
