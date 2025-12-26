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
          data = await exportManager.toProfileBackup(profile, { version: '1.0' })
          filename = `profil-${dateStr}.json`
          mime = 'application/json'
          break
        }
        case 'csv': {
          const achievements = profile?.achievements ?? profile?.prerequisites ?? []
          data = await exportManager.toCSV(achievements)
          filename = `aktiviteter-${dateStr}.csv`
          mime = 'text/csv'
          break
        }
        case 'pdf': {
          data = await exportManager.toPDF(profile)
          filename = `märkes-rapport-${dateStr}.pdf`
          mime = 'application/pdf'
          break
        }
        default:
          throw new Error('Felaktigt export-format')
      }

      downloadFile(data, filename, mime)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Export-fel:', err)
      setError(err.message || 'Export misslyckades')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-foreground mb-6">
        Exporta profil
      </h2>

      {/* Format Selection */}
      <fieldset className="mb-6 space-y-3">
        <legend className="text-sm font-medium text-foreground mb-3">
          Export-format
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
                bg-bg-primary border border-border
                focus-visible:ring-2 focus-visible:ring-primary
                focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary
              "
              aria-label={`Choose ${fmt.toUpperCase()} format`}
            />
            <label
              htmlFor={`format-${fmt}`}
              className="ml-3 text-base font-medium text-foreground cursor-pointer"
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
        className="btn btn-primary w-full min-h-[44px]"
        aria-label={`Export as ${format.toUpperCase()}`}
      >
        {loading ? 'Exporterar...' : `Exporta som ${format.toUpperCase()}`}
      </button>

      {success && (
        <div className="alert alert-success mt-4 flex items-center gap-2" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          <span>Exporten lyckades!</span>
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

function getFormatDescription(format) {
  switch (format) {
    case 'json':
      return '(Komplett profil-backup)'
    case 'csv':
      return '(Spreadsheet-kompatibel)'
    case 'pdf':
      return '(Utskriftsvänlig rapport)'
    default:
      return ''
  }
}
