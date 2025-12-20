import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ExportPanel from '../components/ExportPanel'
import ImportPanel from '../components/ImportPanel'
import ShareDialog from '../components/ShareDialog'
import * as importManager from '../utils/importManager'
import * as exportManager from '../utils/exportManager'
import { useProfile } from '../hooks/useProfile'

export default function DataBackup() {
  const { currentProfile, updateProfile, loading, error } = useProfile()
  const [shareOpen, setShareOpen] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [localError, setLocalError] = useState(null)
  const [importing, setImporting] = useState(false)

  const canUse = useMemo(() => !!currentProfile && !loading, [currentProfile, loading])

  const handleImport = async (incomingList) => {
    if (!currentProfile) {
      setLocalError('No profile selected')
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
      setLocalError(e.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const openShare = async () => {
    try {
      setLocalError(null)
      const json = await exportManager.toJSON(currentProfile, { includeFilters: true, version: '1.0' })
      setShareData(json)
      setShareOpen(true)
    } catch (e) {
      setLocalError(e.message || 'Failed to prepare share data')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="section-title mb-4">Data &amp; Backup</h1>

      {(error || localError) && (
        <div
          className="
            mb-4 p-3 rounded-lg
            bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300
            border border-red-300 dark:border-red-600
          "
          role="alert"
          aria-live="assertive"
        >
          {error || localError}
        </div>
      )}

      {!canUse ? (
        <div className="card p-6">
          <p className="text-muted-foreground">
            Select or create a profile to import/export achievements.
          </p>
          <div className="mt-4">
            <Link to="/settings" className="btn btn-primary min-h-[44px]">Go to Settings</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <ExportPanel profile={currentProfile} />
          </div>

          <div className="card p-4">
            <ImportPanel onImport={handleImport} />
            {importing && (
              <div
                className="
                  mt-3 p-2 rounded
                  bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300
                  border border-amber-300 dark:border-amber-600
                "
                role="status"
                aria-live="polite"
              >
                Importing…
              </div>
            )}
          </div>

          <div className="card p-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-foreground mb-3">Share</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Generate a QR code containing your profile export for quick sharing or backup.
            </p>
            <button onClick={openShare} className="btn btn-primary min-h-[44px]" aria-label="Open share dialog">
              Share via QR code
            </button>
          </div>
        </div>
      )}

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareData={shareData}
      />
    </div>
  )
}
