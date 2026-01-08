import React, { useState, useEffect, useRef } from 'react'
import { useProfile } from '../hooks/useProfile'
import RestorePreviewDialog from './RestorePreviewDialog'
import { parseProfileBackup } from '../utils/importManager'
import { quickValidate } from '../utils/backupValidator'
import Icon from './Icon'

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
  const [validationStatus, setValidationStatus] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState(null)
  const fileInputRef = useRef(null)

  // Real-time validation when text changes
  useEffect(() => {
    if (!importText.trim()) {
      setValidationStatus(null)
      return
    }

    const result = quickValidate(importText)
    setValidationStatus(result)
  }, [importText])

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setSelectedFileName(null)
      setImportText('')
      setValidationStatus(null)
      setShowAdvanced(false)
    }
  }, [open])

  if (!open) return null

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setImportText(String(reader.result || ''))
    reader.readAsText(file)
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
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
            <label className="block text-sm font-medium text-text-secondary">Välj säkerhetskopia</label>

            {/* Helper text for accessibility */}
            <p id={`${id}-file-hint`} className="text-xs text-muted-foreground">
              JSON-filer (.json eller .txt) accepteras
            </p>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              id={`${id}-file`}
              type="file"
              accept=".json,.txt,application/json"
              onChange={onFileChange}
              className="sr-only"
              disabled={busy}
              aria-describedby={`${id}-file-hint`}
            />

            {/* Custom file button in Swedish */}
            <button
              type="button"
              onClick={handleFileButtonClick}
              disabled={busy}
              aria-describedby={`${id}-file-hint`}
              className="
                w-full min-h-[44px] px-4 py-2
                bg-bg-secondary border-2 border-border rounded-lg
                hover:bg-bg-tertiary hover:border-primary
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-primary focus-visible:ring-offset-2
                transition-colors
                flex items-center gap-3
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Icon name="Upload" className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1 text-left text-sm">
                {selectedFileName || 'Välj fil att återställa från...'}
              </span>
              {selectedFileName && (
                <Icon name="CheckCircle" className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
            disabled={busy}
          >
            <Icon
              name={showAdvanced ? 'ChevronDown' : 'ChevronRight'}
              className="w-4 h-4"
              aria-hidden="true"
            />
            <span>{showAdvanced ? 'Dölj avancerade alternativ' : 'Visa avancerade alternativ'}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary" htmlFor={`${id}-textarea`}>Klistra in JSON</label>
            <textarea
              id={`${id}-textarea`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="textarea min-h-[8rem]"
              placeholder="Klistra in JSON-innehållet från din säkerhetskopia här..."
              disabled={busy}
              aria-describedby={validationStatus ? `${id}-validation-status` : undefined}
            />

            {/* Validation Status Badge */}
            {validationStatus && (
              <div
                id={`${id}-validation-status`}
                role="status"
                aria-live="polite"
                className={`
                  flex items-start gap-2 p-3 rounded-lg text-sm
                  ${validationStatus.status === 'valid' ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : ''}
                  ${validationStatus.status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800' : ''}
                  ${validationStatus.status === 'error' ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' : ''}
                `}
              >
                <Icon
                  name={
                    validationStatus.status === 'valid' ? 'CheckCircle' :
                    validationStatus.status === 'warning' ? 'AlertTriangle' :
                    'XCircle'
                  }
                  className={`
                    w-5 h-5 shrink-0 mt-0.5
                    ${validationStatus.status === 'valid' ? 'text-green-600 dark:text-green-400' : ''}
                    ${validationStatus.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                    ${validationStatus.status === 'error' ? 'text-red-600 dark:text-red-400' : ''}
                  `}
                  aria-hidden="true"
                />
                <span
                  className={`
                    ${validationStatus.status === 'valid' ? 'text-green-800 dark:text-green-200' : ''}
                    ${validationStatus.status === 'warning' ? 'text-yellow-800 dark:text-yellow-200' : ''}
                    ${validationStatus.status === 'error' ? 'text-red-800 dark:text-red-200' : ''}
                  `}
                >
                  {validationStatus.message}
                </span>
              </div>
            )}
            </div>
          )}

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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary min-h-[44px] disabled:opacity-50 order-1 sm:order-2"
              disabled={busy || !importText.trim() || validationStatus?.status === 'error'}
              aria-describedby={validationStatus?.status === 'error' ? `${id}-validation-status` : undefined}
            >
              Förhandsgranska
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary min-h-[44px] order-2 sm:order-1"
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
