import { useContext } from 'react'
import { BackupContext } from '../contexts/backupContext.js'

/**
 * Hook to access backup context
 * @returns {object} Backup context value
 * @throws {Error} If used outside BackupProvider
 */
export function useBackup() {
  const context = useContext(BackupContext)
  if (!context) {
    throw new Error('useBackup must be used within BackupProvider')
  }
  return context
}
