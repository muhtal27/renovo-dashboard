const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

export function relativeTime(value: string | null | undefined): string {
  if (!value) return ''

  const date = new Date(value)
  const diff = Date.now() - date.getTime()

  if (diff < 0) return 'just now'
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE)
    return `${mins}m ago`
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR)
    return `${hours}h ago`
  }
  if (diff < DAY * 7) {
    const days = Math.floor(diff / DAY)
    return `${days}d ago`
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  }).format(date)
}
