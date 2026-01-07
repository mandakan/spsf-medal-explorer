/**
 * Backup Scheduler Utilities
 * Pure functions for calculating backup reminder logic
 */

/**
 * Calculate if a reminder should be shown based on backup/change dates and preferences
 * @param {object} options - Reminder calculation options
 * @param {string|null} options.lastBackupDate - ISO date string of last backup
 * @param {string|null} options.lastDataChange - ISO date string of last data change
 * @param {number} options.reminderFrequency - Days between reminders (0 = never)
 * @param {string|null} options.reminderDismissedUntil - ISO date string when dismissal expires
 * @returns {boolean} Whether to show the reminder
 */
export function shouldShowReminder({
  lastBackupDate,
  lastDataChange,
  reminderFrequency,
  reminderDismissedUntil
}) {
  // Never remind if frequency is 0
  if (reminderFrequency === 0) {
    return false
  }

  // Don't show if dismissed recently
  if (reminderDismissedUntil) {
    const dismissedDate = new Date(reminderDismissedUntil)
    const now = new Date()
    if (dismissedDate > now) {
      return false
    }
  }

  // No data changes, no need to remind
  if (!lastDataChange) {
    return false
  }

  // Never backed up, and data exists - show reminder
  if (!lastBackupDate) {
    return true
  }

  // Calculate days since last backup
  const lastBackup = new Date(lastBackupDate)
  const lastChange = new Date(lastDataChange)
  const now = new Date()

  const daysSinceBackup = calculateDaysBetween(lastBackup, now)
  const dataChangedAfterBackup = lastChange > lastBackup

  return dataChangedAfterBackup && daysSinceBackup >= reminderFrequency
}

/**
 * Calculate number of days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of whole days between dates
 */
export function calculateDaysBetween(startDate, endDate) {
  const milliseconds = endDate - startDate
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24))
}

/**
 * Calculate the date when a dismissed reminder should show again (7 days from now)
 * @param {Date} [fromDate=new Date()] - Date to calculate from (defaults to now)
 * @returns {string} ISO date string 7 days in the future
 */
export function calculateDismissUntilDate(fromDate = new Date()) {
  const sevenDaysFromNow = new Date(fromDate)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  return sevenDaysFromNow.toISOString()
}

/**
 * Get a human-readable description of when the last backup was made
 * @param {string|null} lastBackupDate - ISO date string of last backup
 * @param {string} [locale='sv-SE'] - Locale for date formatting
 * @returns {string} Formatted date string or 'Aldrig' if never backed up
 */
export function formatLastBackupDate(lastBackupDate, locale = 'sv-SE') {
  if (!lastBackupDate) {
    return 'Aldrig'
  }

  const date = new Date(lastBackupDate)
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
