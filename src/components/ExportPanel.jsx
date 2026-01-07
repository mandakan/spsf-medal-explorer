import { useState } from 'react'
import * as exportManager from '../utils/exportManager'
import { downloadFile } from '../utils/fileHandlers'
import { useBackup } from '../hooks/useBackup'

export default function ExportPanel({ profile }) {
  const { markBackupCreated } = useBackup()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleBackup = async () => {
    try {
      setLoading(true)
      setError(null)

      const dateStr = new Date().toISOString().split('T')[0]
      const data = await exportManager.toProfileBackup(profile, { version: '1.0' })
      const filename = `medal-backup-${dateStr}.json`

      downloadFile(data, filename, 'application/json')

      // Mark backup as created in the system
      await markBackupCreated()

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Backup-fel:', err)
      setError(err.message || 'Säkerhetskopieringen misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Säkerhetskopiera profil
      </h2>

      <p className="text-sm text-muted-foreground mb-4">
        Ladda ner en komplett säkerhetskopia av din profil som en JSON-fil.
        Innehåller alla dina aktiviteter och upplåsta märken.
      </p>

      {/* Backup Button */}
      <button
        onClick={handleBackup}
        disabled={loading}
        className="btn btn-primary w-full min-h-[44px]"
        aria-label="Säkerhetskopiera profil"
      >
        {loading ? 'Skapar säkerhetskopia...' : 'Säkerhetskopiera profil'}
      </button>

      {success && (
        <div className="alert alert-success mt-4 flex items-center gap-2" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          <span>Säkerhetskopieringen lyckades!</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-4 flex items-center gap-2" role="alert" aria-live="assertive">
          <span aria-hidden="true">✕</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
