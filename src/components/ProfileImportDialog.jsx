import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import RestorePreviewDialog from './RestorePreviewDialog'
import { parseProfileBackup } from '../utils/importManager'

export default function ProfileImportDialog({
  id = 'profile-import-dialog',
  open,
  onClose,
}) {
  const { restoreProfileFromBackup } = useProfile()
  const [importText, setImportText] = useState('')
  const [strategy, setStrategy] = useState('new-id')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [parsedBackup, setParsedBackup] = useState(null)

  if (!open) return null

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImportText(String(reader.result || ''))
    reader.readAsText(file)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      setBusy(true)
      setError(null)
      if (!importText.trim()) {
        setError('Klistra in JSON eller välj en fil.')
        setBusy(false)
        return
      }

      // Parse backup to show preview
      const parsed = parseProfileBackup(importText)
      setParsedBackup(parsed)
      setShowPreview(true)
      setBusy(false)
    } catch (err) {
      setError(err.message || 'Kunde inte läsa säkerhetskopian')
      setBusy(false)
    }
  }

  const handleRestore = async () => {
    try {
      setBusy(true)
      setError(null)
      await restoreProfileFromBackup(importText, { strategy })
      setImportText('')
      setShowPreview(false)
      setParsedBackup(null)
      onClose?.()
    } catch (err) {
      setError(err.message || 'Import misslyckades')
      setShowPreview(false)
    } finally {
      setBusy(false)
    }
  }

  const handleCancelPreview = () => {
    setShowPreview(false)
    setParsedBackup(null)
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        id={id}
        className="w-[min(92vw,32rem)] max-h-[85vh] overflow-auto rounded-xl bg-bg-secondary border border-border shadow-2xl"
      >
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <h2 id={`${id}-title`} className="text-2xl font-bold text-text-primary">
            Importera profil (säkerhetskopia)
          </h2>

          {error && (
            <div className="alert alert-error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary" htmlFor={`${id}-file`}>Välj fil</label>
            <input
              id={`${id}-file`}
              type="file"
              accept=".json,application/json"
              onChange={onFileChange}
              className="input text-sm file:mr-3 file:px-3 file:py-2 file:rounded-md file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover file:cursor-pointer"
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary" htmlFor={`${id}-textarea`}>Eller klistra in JSON</label>
            <textarea
              id={`${id}-textarea`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="textarea min-h-[8rem]"
              placeholder='{"kind":"profile-backup","version":"1.0","profile":{...}}'
              disabled={busy}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-text-secondary">Metod</legend>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name={`${id}-strategy`}
                  value="new-id"
                  checked={strategy === 'new-id'}
                  onChange={() => setStrategy('new-id')}
                  disabled={busy}
                />
                <span>Skapa ny profil</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name={`${id}-strategy`}
                  value="overwrite"
                  checked={strategy === 'overwrite'}
                  onChange={() => setStrategy('overwrite')}
                  disabled={busy}
                />
                <span>Ersätt profil med samma ID</span>
              </label>
            </div>
          </fieldset>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary min-h-[44px] disabled:opacity-50"
              disabled={busy}
            >
              Förhandsgranska
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary min-h-[44px]"
              disabled={busy}
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>

      {/* Restore Preview Dialog */}
      {showPreview && parsedBackup && (
        <RestorePreviewDialog
          backup={parsedBackup}
          onRestore={handleRestore}
          onCancel={handleCancelPreview}
        />
      )}
    </div>
  )
}
