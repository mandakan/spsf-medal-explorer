import { useState } from 'react'
import { useBackup } from '../hooks/useBackup'
import { useProfile } from '../hooks/useProfile'
import * as exportManager from '../utils/exportManager'
import { downloadFile } from '../utils/fileHandlers'
import Icon from './Icon'

/**
 * Gentle reminder banner for backups
 * Non-intrusive, dismissible, educational
 * WCAG 2.1 AA compliant with Swedish text
 */
export default function BackupReminder() {
  const { shouldShowReminder, dismissReminder, markBackupCreated } = useBackup()
  const { currentProfile } = useProfile()
  const [isBackingUp, setIsBackingUp] = useState(false)

  if (!shouldShowReminder || !currentProfile) {
    return null
  }

  const handleBackup = async () => {
    try {
      setIsBackingUp(true)

      const dateStr = new Date().toISOString().split('T')[0]
      const data = await exportManager.toProfileBackup(currentProfile, { version: '1.0' })
      const filename = `medal-backup-${dateStr}.json`

      downloadFile(data, filename, 'application/json')

      // Issue 2: Mark backup as created (non-critical - don't fail if this fails)
      await markBackupCreated().catch((error) => {
        console.error('Failed to mark backup as created:', error)
      })
    } catch (error) {
      console.error('Backup error:', error)
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleDismiss = async () => {
    await dismissReminder()
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[2000] bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-b-2 border-yellow-400 dark:border-yellow-600 px-4 py-3 shadow-sm"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Icon + Message */}
        <div className="flex items-start gap-3 flex-1">
          <Icon
            name="AlertTriangle"
            className="w-6 h-6 text-yellow-600 dark:text-yellow-400 shrink-0"
            aria-hidden="true"
          />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-color-text-primary">
              Dags att säkerhetskopiera dina uppgifter
            </p>
            <p className="text-sm text-color-text-secondary mt-0.5">
              Din data finns bara på den här enheten. Säkerhetskopiera regelbundet för att vara säker.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="btn btn-primary flex-1 sm:flex-none min-h-[44px] px-4 py-2"
          >
            <Icon name="Download" className="w-4 h-4" aria-hidden="true" />
            {isBackingUp ? 'Säkerhetskopierar...' : 'Säkerhetskopiera nu'}
          </button>

          <button
            onClick={handleDismiss}
            aria-label="Påminn mig om 7 dagar"
            className="btn btn-secondary min-h-[44px] px-4 py-2"
          >
            Senare
          </button>
        </div>
      </div>
    </div>
  )
}
