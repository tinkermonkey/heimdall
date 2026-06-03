export const formatTimestamp = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

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

export const isToday = (d: Date | string): boolean => {
  return isSameDay(d, new Date())
}

export const getWeekDays = (date: Date | string, weekStartsOn: 0 | 1 = 0): Date[] => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)

  // Get the current day of week (0 = Sunday, 1 = Monday, etc.)
  let dayOfWeek = d.getDay()

  // Calculate offset to the start of the week
  let offset = dayOfWeek - weekStartsOn
  if (offset < 0) {
    offset += 7
  }

  // Get the first day of the week
  const firstDayOfWeek = new Date(d)
  firstDayOfWeek.setDate(d.getDate() - offset)

  // Generate 7 days starting from the first day of the week
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek)
    day.setDate(firstDayOfWeek.getDate() + i)
    days.push(day)
  }

  return days
}

export const getMonthGrid = (month: Date | string, weekStartsOn: 0 | 1 = 0): Date[][] => {
  const date = typeof month === 'string' ? new Date(month) : new Date(month)

  // Set to the first day of the month
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)

  // Get the week that contains the first day of the month
  const firstWeekDays = getWeekDays(firstDayOfMonth, weekStartsOn)

  const grid: Date[][] = []
  let currentDate = new Date(firstWeekDays[0])

  // Continue building weeks until we've covered the entire month
  while (true) {
    const week = getWeekDays(currentDate, weekStartsOn)
    grid.push(week)

    // Check if this week contains any days from the next month
    const lastDayOfWeek = week[week.length - 1]
    if (lastDayOfWeek.getMonth() > date.getMonth() || lastDayOfWeek.getFullYear() > date.getFullYear()) {
      break
    }

    currentDate = new Date(lastDayOfWeek)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return grid
}
