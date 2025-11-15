const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

const relativeFormatter = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' })

export const formatTemperature = (value: number) => `${Math.round(value)}°C`

export const formatLocalTime = (unixSeconds: number, timezoneOffset: number) => {
  return timeFormatter.format(new Date((unixSeconds + timezoneOffset) * 1000))
}

export const formatDate = (timestamp: number) => {
  return dateFormatter.format(new Date(timestamp))
}

export const formatRelativeUpdatedAt = (timestamp: number) => {
  const now = Date.now()
  const diffMs = timestamp - now
  const diffMinutes = diffMs / (60 * 1000)
  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(Math.round(diffMinutes), 'minute')
  }
  const diffHours = diffMinutes / 60
  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(Math.round(diffHours), 'hour')
  }
  const diffDays = diffHours / 24
  return relativeFormatter.format(Math.round(diffDays), 'day')
}

export const titleCase = (text: string) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}
