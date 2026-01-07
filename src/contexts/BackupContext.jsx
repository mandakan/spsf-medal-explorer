import { useState, useEffect, useCallback } from 'react'
import { BackupContext } from './backupContext.js'
import { useStorage } from '../hooks/useStorage'
import { shouldShowReminder as calculateShouldShowReminder, calculateDismissUntilDate } from '../utils/backupScheduler'

/**
 * BackupProvider - Manages backup reminder state and preferences
 * Tracks last backup date, last data change, and reminder preferences
 */
export function BackupProvider({ children }) {
  const { manager } = useStorage()
  const [lastBackupDate, setLastBackupDate] = useState(null)
  const [lastDataChange, setLastDataChange] = useState(null)
  const [reminderFrequency, setReminderFrequency] = useState(30) // days
  const [reminderDismissedUntil, setReminderDismissedUntil] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load metadata on mount
  useEffect(() => {
    async function loadMetadata() {
      if (!manager) return

      try {
        const lastBackup = await manager.getMetadata('lastBackupDate')
        const lastChange = await manager.getMetadata('lastDataChange')
        const frequency = await manager.getMetadata('backupReminderFrequency')
        const dismissed = await manager.getMetadata('reminderDismissedUntil')

        setLastBackupDate(lastBackup || null)
        setLastDataChange(lastChange || null)
        setReminderFrequency(frequency ?? 30)
        setReminderDismissedUntil(dismissed || null)
      } catch (error) {
        console.error('Failed to load backup metadata:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetadata()
  }, [manager])

  /**
   * Mark backup created - updates lastBackupDate to now
   */
  const markBackupCreated = useCallback(async () => {
    const now = new Date().toISOString()
    setLastBackupDate(now)

    if (manager) {
      try {
        await manager.setMetadata('lastBackupDate', now)
      } catch (error) {
        console.error('Failed to save lastBackupDate:', error)
      }
    }
  }, [manager])

  /**
   * Mark data changed - updates lastDataChange to now
   */
  const markDataChanged = useCallback(async () => {
    const now = new Date().toISOString()
    setLastDataChange(now)

    if (manager) {
      try {
        await manager.setMetadata('lastDataChange', now)
      } catch (error) {
        console.error('Failed to save lastDataChange:', error)
      }
    }
  }, [manager])

  /**
   * Update reminder frequency preference
   * @param {number} days - Number of days between reminders (0 = never)
   */
  const updateReminderFrequency = useCallback(async (days) => {
    setReminderFrequency(days)

    if (manager) {
      try {
        await manager.setMetadata('backupReminderFrequency', days)
      } catch (error) {
        console.error('Failed to save backupReminderFrequency:', error)
      }
    }
  }, [manager])

  /**
   * Dismiss reminder for 7 days
   */
  const dismissReminder = useCallback(async () => {
    const dismissUntil = calculateDismissUntilDate()
    setReminderDismissedUntil(dismissUntil)

    if (manager) {
      try {
        await manager.setMetadata('reminderDismissedUntil', dismissUntil)
      } catch (error) {
        console.error('Failed to save reminderDismissedUntil:', error)
      }
    }
  }, [manager])

  /**
   * Calculate if reminder should show based on current state
   */
  const shouldShowReminder = useCallback(() => {
    return calculateShouldShowReminder({
      lastBackupDate,
      lastDataChange,
      reminderFrequency,
      reminderDismissedUntil
    })
  }, [lastBackupDate, lastDataChange, reminderFrequency, reminderDismissedUntil])

  const value = {
    lastBackupDate,
    lastDataChange,
    reminderFrequency,
    reminderDismissedUntil,
    isLoading,
    shouldShowReminder: shouldShowReminder(),
    markBackupCreated,
    markDataChanged,
    updateReminderFrequency,
    dismissReminder
  }

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>
}
