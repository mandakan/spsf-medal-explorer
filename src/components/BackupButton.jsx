import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import * as exportManager from '../utils/exportManager'
import { downloadFile } from '../utils/fileHandlers'
import BackupConfirmation from './BackupConfirmation'

/**
 * Prominent backup button for Home page
 * WCAG 2.1 AA compliant with proper ARIA labels
 */
export default function BackupButton() {
  const { currentProfile } = useProfile()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [filename, setFilename] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBackup = async () => {
    try {
      setLoading(true)

      // Generate smart filename
      const date = new Date().toISOString().split('T')[0]
      const name = `medal-backup-${date}.json`

      // Export with smart filename
      const backup = await exportManager.toProfileBackup(currentProfile, { version: '1.0' })
      downloadFile(backup, name, 'application/json')

      setFilename(name)
      setShowConfirmation(true)
    } catch (error) {
      console.error('Backup error:', error)
      alert('Säkerhetskopieringen misslyckades. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  if (!currentProfile || currentProfile.isGuest) {
    return null // Don't show for guest profiles
  }

  return (
    <>
      <button
        onClick={handleBackup}
        disabled={loading}
        aria-label="Säkerhetskopiera mina data"
        className="
          w-full min-h-[120px] p-6
          bg-gradient-to-br from-primary to-accent
          hover:from-primary/90 hover:to-accent/90
          text-primary-foreground rounded-xl
          flex flex-col items-center justify-center gap-3
          transition-all duration-200
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-4
          focus-visible:ring-primary focus-visible:ring-offset-2
        "
      >
        {/* Icon */}
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>

        {/* Label */}
        <span className="text-xl font-bold">
          {loading ? 'Skapar säkerhetskopia...' : 'Säkerhetskopiera mina data'}
        </span>

        {/* Subtitle */}
        <span className="text-sm opacity-90">
          Spara dina framsteg säkert
        </span>
      </button>

      {showConfirmation && (
        <BackupConfirmation
          filename={filename}
          onClose={() => setShowConfirmation(false)}
        />
      )}
    </>
  )
}
