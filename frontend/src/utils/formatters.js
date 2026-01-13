/**
 * Format a duration in hours to a human-readable string
 * @param {number} hours - Duration in hours
 * @returns {string} - Formatted duration (e.g., "2h 30m")
 */
export function formatDuration(hours) {
  if (!hours) return '0m'

  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)

  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Format a duration in hours to HH:MM format
 * @param {number} hours - Duration in hours
 * @returns {string} - Formatted duration (e.g., "2:30")
 */
export function formatDurationHHMM(hours) {
  if (!hours) return '0:00'

  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)

  return `${h}:${String(m).padStart(2, '0')}`
}

/**
 * Format a date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a time to HH:MM
 * @param {string} isoString - ISO timestamp
 * @returns {string}
 */
export function formatTime(isoString) {
  const date = new Date(isoString)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
export function getToday() {
  return formatDate(new Date())
}
