import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ExportPanel from '../components/ExportPanel'
import ImportPanel from '../components/ImportPanel'
import ShareDialog from '../components/ShareDialog'
import ProfileImportDialog from '../components/ProfileImportDialog'
import * as importManager from '../utils/importManager'
import * as exportManager from '../utils/exportManager'
import { useProfile } from '../hooks/useProfile'
import FeatureGate from '../components/FeatureGate.jsx'
import CsvActivitiesPanel from '../components/CsvActivitiesPanel.jsx'

export default function DataBackup() {
  const { currentProfile, updateProfile, loading, error, upsertAchievements } = useProfile()
  const [shareOpen, setShareOpen] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [localError, setLocalError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importProfileOpen, setImportProfileOpen] = useState(false)


  const canUse = useMemo(() => !!currentProfile && !loading, [currentProfile, loading])

  const handleImport = async (incomingList) => {
    if (!currentProfile) {
      setLocalError('Ingen profil vald')
      return
    }
    try {
      setImporting(true)
      setLocalError(null)

      const existing = Array.isArray(currentProfile.prerequisites) ? currentProfile.prerequisites : []

      const keyOf = (a) => `${a?.type}|${a?.medalId || ''}|${a?.date || ''}|${a?.points ?? ''}`
      const existingKeys = new Set(existing.map(keyOf))

      const prepared = (incomingList || []).map((a, i) => {
        const isNew = !existingKeys.has(keyOf(a))
        if (isNew && !a.id) {
          return {
            ...a,
            id: `imp-${Date.now()}-${i}`,
            source: a.source || 'imported',
            enteredDate: a.enteredDate || new Date().toISOString(),
          }
        }
        return a
      })

      const merged = importManager.resolveConflicts(existing, prepared)
      const nextProfile = {
        ...currentProfile,
        prerequisites: merged,
        lastModified: new Date().toISOString(),
      }
      await updateProfile(nextProfile)
    } catch (e) {
      setLocalError(e.message || 'Import misslyckades')
    } finally {
      setImporting(false)
    }
  }

  const openShare = async () => {
    try {
      setLocalError(null)
      const json = await exportManager.toProfileBackup(currentProfile, { version: '1.0' })
      setShareData(json)
      setShareOpen(true)
    } catch (e) {
      setLocalError(e.message || 'Misslyckades med förberedelser för att dela data')
    }
  }







  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="section-title mb-4">Data &amp; Backup</h1>

      {(error || localError) && (
        <div className="alert alert-error mb-4" role="alert" aria-live="assertive">
          {error || localError}
        </div>
      )}

      {!canUse ? (
        <div className="card p-6">
          <p className="text-muted-foreground">
            Välj eller skapa en profil för att importera/exportera aktiviteter.
          </p>
          <div className="mt-4">
            <Link to="/settings" className="btn btn-primary min-h-[44px]">Till Inställningar</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card md:row-span-2 p-4">
            <ExportPanel profile={currentProfile} />
          </div>

          <div className="card p-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Importera profil (backup)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Återställ en hel profil från en JSON-backup. Du kan skapa en ny profil eller ersätta en profil med samma ID.
            </p>
            <button
              onClick={() => setImportProfileOpen(true)}
              className="btn btn-secondary min-h-[44px]"
              aria-haspopup="dialog"
              aria-controls="profile-import-dialog"
            >
              Importera profil
            </button>
          </div>

          <div className="card p-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Share</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Skapa en QR-kod som innehåller profilen för att dela eller göra backup.
            </p>
            <button onClick={openShare} className="btn btn-primary min-h-[44px]" aria-label="Open share dialog">
              Dela via QR-kod
            </button>
          </div>

          <FeatureGate name="csvImport" className="md:col-span-2">
            <CsvActivitiesPanel
              profile={currentProfile}
              updateProfile={updateProfile}
              upsertAchievements={upsertAchievements}
            />
          </FeatureGate>
        </div>
      )}

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareData={shareData}
      />

      <ProfileImportDialog
        id="profile-import-dialog"
        open={importProfileOpen}
        onClose={() => setImportProfileOpen(false)}
      />
    </div>
  )
}
