import { useState, useRef } from 'react'
import * as importManager from '../utils/importManager'

export default function ImportPanel({ onImport }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [conflicts, setConflicts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file) => {
    try {
      setLoading(true)
      setError(null)
      const data = await importManager.parseFile(file)

      // Check for duplicates
      const dupes = await importManager.detectDuplicates(data)

      if (dupes.length > 0) {
        setConflicts(dupes)
      } else {
        setConflicts(null)
      }

      setPreview(data)
    } catch (err) {
      setPreview(null)
      setConflicts(null)
      setError(err.message || 'Failed to read file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    try {
      setLoading(true)
      if (!preview) return
      const toImport = preview.achievements || []
      const validation = importManager.validateData(toImport)
      if (validation.invalid.length) {
        setError(`Validation failed for ${validation.invalid.length} item(s).`)
        return
      }
      await onImport(toImport)
      setPreview(null)
      setConflicts(null)
    } catch (err) {
      setError(err.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="
        p-6 bg-color-bg-secondary dark:bg-color-bg-secondary
        rounded-lg border-2 border-color-border
      "
    >
      <h2 className="
        text-xl font-bold text-color-text-primary mb-6
      ">
        Import Achievements
      </h2>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          p-8 rounded-lg border-2 border-dashed
          text-center cursor-pointer
          transition-colors
          ${isDragging
            ? 'bg-color-primary-light border-color-primary'
            : 'bg-color-bg-primary border-color-border'
          }
        `}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop JSON/CSV file here or click to choose"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
      >
        <p className="text-color-text-secondary mb-2">
          Drag &amp; drop JSON/CSV file here
        </p>
        <p className="text-color-text-tertiary text-sm mb-4">
          or
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="
            px-4 py-2 rounded-lg
            bg-color-primary text-white
            hover:bg-color-primary-hover
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-offset-2 focus-visible:ring-color-primary
          "
          aria-label="Choose file to import"
        >
          Choose File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={(e) => e.target.files?.length && handleFile(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Preview */}
      {preview && !error && (
        <div className="mt-6">
          <h3 className="
            font-medium text-color-text-primary mb-3
          ">
            Preview ({preview.achievements?.length || 0} achievements)
          </h3>
          <div className="
            max-h-48 overflow-y-auto
            border-2 border-color-border rounded-lg p-3
          ">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-color-text-secondary">
                  <th className="text-left">Medal</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {preview.achievements?.map((ach, i) => (
                  <tr key={i} className="border-t border-color-border">
                    <td className="py-2">{ach.medalId || '-'}</td>
                    <td className="py-2">{ach.type || '-'}</td>
                    <td className="py-2">{ach.date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Conflicts */}
          {conflicts && conflicts.length > 0 && (
            <div
              className="
                mt-4 p-3 rounded-lg
                bg-color-warning-bg text-color-warning
                border-2 border-color-warning
              "
              role="status"
            >
              Found {conflicts.length} possible duplicate(s). They will be skipped.
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={loading}
            className="
              w-full mt-4 py-3 px-4 rounded-lg font-medium
              bg-color-primary text-white
              hover:bg-color-primary-hover
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 focus-visible:ring-color-primary
            "
            aria-label="Import achievements"
          >
            {loading ? 'Importing...' : 'Import Achievements'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="
            mt-4 p-3 rounded-lg
            bg-color-error-bg text-color-error
            border-2 border-color-error
            flex items-center gap-2
          "
          role="alert"
        >
          <span aria-hidden="true">✕</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
