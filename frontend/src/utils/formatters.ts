/**
 * Format a duration in hours to a human-readable string
 */
export function formatDuration(hours: number | null | undefined): string {
  if (!hours) return '0m'

  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)

  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Format a duration in hours to HH:MM format
 */
export function formatDurationHHMM(hours: number | null | undefined): string {
  if (!hours) return '0:00'

  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)

  return `${h}:${String(m).padStart(2, '0')}`
}

/**
 * Format a date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a time to HH:MM
 * @param isoString - ISO timestamp (stored as naive UTC, treat as local)
 */
export function formatTime(isoString: string): string {
  // Extract time portion directly from ISO string to avoid timezone conversion
  // ISO format: "2024-01-14T08:45:00" or "2024-01-14T08:45:00.000000"
  const timePart = isoString.split('T')[1]
  if (timePart) {
    const [hours, minutes] = timePart.split(':')
    return `${hours}:${minutes}`
  }
  // Fallback to old behavior if format is unexpected
  const date = new Date(isoString)
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getToday(): string {
  return formatDate(new Date())
}
