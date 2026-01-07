import { useState } from 'react'
import * as exportManager from '../utils/exportManager'
import ShareBackupDialog from './ShareBackupDialog'

export default function ExportPanel({ profile }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [backupBlob, setBackupBlob] = useState(null)
  const [backupFilename, setBackupFilename] = useState('')

  const handleBackup = async () => {
    try {
      setLoading(true)
      setError(null)

      const dateStr = new Date().toISOString().split('T')[0]
      const jsonString = await exportManager.toProfileBackup(profile, { version: '1.0' })
      const filename = `medal-backup-${dateStr}.json`
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })

      // Show dialog instead of immediate download
      setBackupBlob(blob)
      setBackupFilename(filename)
      setShowShareDialog(true)
    } catch (err) {
      console.error('Backup-fel:', err)
      setError(err.message || 'Säkerhetskopieringen misslyckades')
    } finally {
      setLoading(false)
    }
  }

  const handleShareComplete = () => {
    setShowShareDialog(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
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

      {showShareDialog && backupBlob && (
        <ShareBackupDialog
          blob={backupBlob}
          filename={backupFilename}
          onClose={() => setShowShareDialog(false)}
          onComplete={handleShareComplete}
        />
      )}
    </div>
  )
}
