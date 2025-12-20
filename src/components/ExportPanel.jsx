import { useState } from 'react'
import * as exportManager from '../utils/exportManager'
import { downloadFile } from '../utils/fileHandlers'

export default function ExportPanel({ profile }) {
  const [format, setFormat] = useState('json')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleExport = async (exportFormat) => {
    try {
      setLoading(true)
      setError(null)
      let data, filename, mime

      const dateStr = new Date().toISOString().split('T')[0]

      switch (exportFormat) {
        case 'json': {
          data = await exportManager.toJSON(profile)
          filename = `medal-profile-${dateStr}.json`
          mime = 'application/json'
          break
        }
        case 'csv': {
          const achievements = profile?.achievements ?? profile?.prerequisites ?? []
          data = await exportManager.toCSV(achievements)
          filename = `achievements-${dateStr}.csv`
          mime = 'text/csv'
          break
        }
        case 'pdf': {
          data = await exportManager.toPDF(profile)
          filename = `medal-report-${dateStr}.pdf`
          mime = 'application/pdf'
          break
        }
        default:
          throw new Error('Unsupported export format')
      }

      downloadFile(data, filename, mime)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Export error:', err)
      setError(err.message || 'Export failed')
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
        Export Profile
      </h2>

      {/* Format Selection */}
      <fieldset className="mb-6 space-y-3">
        <legend className="
          text-sm font-medium text-color-text-primary mb-3
        ">
          Export Format
        </legend>

        {['json', 'csv', 'pdf'].map((fmt) => (
          <div key={fmt} className="flex items-center">
            <input
              id={`format-${fmt}`}
              type="radio"
              name="format"
              value={fmt}
              checked={format === fmt}
              onChange={(e) => setFormat(e.target.value)}
              className="
                w-5 h-5 rounded
                bg-color-bg-primary
                border-2 border-color-border
                focus-visible:ring-2 focus-visible:ring-offset-2
                focus-visible:ring-color-primary
              "
              aria-label={`Choose ${fmt.toUpperCase()} format`}
            />
            <label
              htmlFor={`format-${fmt}`}
              className="
                ml-3 text-base font-medium
                text-color-text-primary
                cursor-pointer
              "
            >
              {fmt.toUpperCase()} {getFormatDescription(fmt)}
            </label>
          </div>
        ))}
      </fieldset>

      {/* Export Button */}
      <button
        onClick={() => handleExport(format)}
        disabled={loading}
        className="
          w-full py-3 px-4 rounded-lg font-medium
          bg-color-primary text-white
          hover:bg-color-primary-hover
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2 focus-visible:ring-color-primary
        "
        aria-label={`Export as ${format.toUpperCase()}`}
      >
        {loading ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
      </button>

      {success && (
        <div
          className="
            mt-4 p-3 rounded-lg
            bg-color-success-bg text-color-success
            border-2 border-color-success
            flex items-center gap-2
          "
          role="status"
        >
          <span aria-hidden="true">✓</span>
          <span>Exported successfully!</span>
        </div>
      )}

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

function getFormatDescription(format) {
  switch (format) {
    case 'json':
      return '(Complete profile backup)'
    case 'csv':
      return '(Spreadsheet compatible)'
    case 'pdf':
      return '(Printable report)'
    default:
      return ''
  }
}
