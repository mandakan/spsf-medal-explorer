import React, { useMemo, useRef, useState } from 'react'
import { achievementsToCSV, exportCsvTemplate, downloadCSV } from '../utils/achievementExport'
import { parseCsv, toAchievement } from '../utils/achievementCsv'
import Icon from './Icon'

export default function CsvActivitiesPanel({ profile, updateProfile, upsertAchievements }) {
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvError, setCsvError] = useState(null)
  const [csvPreview, setCsvPreview] = useState(null) // { rows, result }
  const [csvSummary, setCsvSummary] = useState(null) // { added, updated, skipped, failed }
  const [csvOptions, setCsvOptions] = useState({ updateById: true, matchNaturalKey: false, addNew: true })
  const csvFileInputRef = useRef(null)
  const [csvFileName, setCsvFileName] = useState('')
  const [undoSnapshot, setUndoSnapshot] = useState(null)

  const achievements = useMemo(
    () => (Array.isArray(profile?.prerequisites) ? profile.prerequisites : []),
    [profile?.prerequisites]
  )

  function handleExportCsv() {
    try {
      const csv = achievementsToCSV(achievements, '1')
      downloadCSV(csv, 'aktiviteter.csv')
      setCsvError(null)
    } catch (e) {
      setCsvError(e.message || 'Export av CSV misslyckades')
    }
  }

  function handleDownloadTemplate() {
    try {
      const csv = exportCsvTemplate('1')
      downloadCSV(csv, 'aktiviteter_mall.csv')
      setCsvError(null)
    } catch (e) {
      setCsvError(e.message || 'Nedladdning av mall misslyckades')
    }
  }

  async function handleCsvFile(file) {
    if (!file) return
    setCsvError(null)
    setCsvSummary(null)
    setCsvPreview(null)
    setCsvLoading(true)
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      if (parsed.errors?.length) {
        setCsvError(parsed.errors.join('; '))
        return
      }
      const rows = parsed.rows.map(toAchievement)
      const result = await upsertAchievements(rows, { ...csvOptions, dryRun: true })
      setCsvPreview({ rows, result })
      setCsvFileName(file.name)
    } catch (e) {
      setCsvError(e.message || 'Kunde inte läsa/validera CSV')
    } finally {
      setCsvLoading(false)
    }
  }

  async function handleConfirmCsvImport() {
    if (!csvPreview?.rows?.length) return
    setCsvLoading(true)
    setCsvError(null)
    setCsvSummary(null)
    try {
      // snapshot for undo
      setUndoSnapshot({
        userId: profile.userId,
        prerequisites: Array.isArray(profile.prerequisites) ? [...profile.prerequisites] : []
      })
      const result = await upsertAchievements(csvPreview.rows, { ...csvOptions, dryRun: false })
      setCsvSummary(result)
      setCsvPreview(null)
    } catch (e) {
      setCsvError(e.message || 'Import av CSV misslyckades')
    } finally {
      setCsvLoading(false)
    }
  }

  async function handleUndoImport() {
    try {
      if (!undoSnapshot) return
      const next = { ...profile, prerequisites: undoSnapshot.prerequisites, lastModified: new Date().toISOString() }
      await updateProfile(next)
      setUndoSnapshot(null)
      setCsvSummary(null)
    } catch (e) {
      setCsvError(e.message || 'Ångra misslyckades')
    }
  }

  function handleResetCsv() {
    setCsvError(null)
    setCsvPreview(null)
    setCsvSummary(null)
    setCsvFileName('')
  }

  return (
    <div className="card p-4 md:col-span-2" role="region" aria-labelledby="csv-title">
      <h2 id="csv-title" className="text-lg font-semibold text-foreground mb-3">CSV (Aktiviteter)</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Exportera, redigera och importera aktiviteter via CSV. För säkerhet körs en förhandsgranskning först.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={handleExportCsv} className="btn btn-primary min-h-[44px]" aria-label="Exportera aktiviteter som CSV">
          Exportera aktiviteter (CSV)
        </button>
        <button onClick={handleDownloadTemplate} className="btn btn-secondary min-h-[44px]" aria-label="Ladda ned CSV-mall">
          Ladda ned CSV-mall
        </button>
      </div>

      <div className="p-4 rounded-lg border border-border bg-bg-primary" role="group" aria-labelledby="csv-import-label">
        <div id="csv-import-label" className="field-label mb-2">Importera från CSV</div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-primary min-h-[44px]"
            onClick={() => csvFileInputRef.current?.click()}
          >
            Välj CSV-fil
          </button>
          <span className="text-sm text-muted-foreground">{csvFileName || 'Ingen fil vald'}</span>
          <input
            ref={csvFileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])}
          />
          {csvPreview && (
            <button type="button" className="btn btn-muted min-h-[44px]" onClick={handleResetCsv}>
              Rensa
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="w-5 h-5 rounded bg-bg-primary border border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              checked={csvOptions.updateById}
              onChange={(e) => setCsvOptions(o => ({ ...o, updateById: e.target.checked }))}
            />
            <span className="text-foreground">Uppdatera via ID</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="w-5 h-5 rounded bg-bg-primary border border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              checked={csvOptions.matchNaturalKey}
              onChange={(e) => setCsvOptions(o => ({ ...o, matchNaturalKey: e.target.checked }))}
            />
            <span className="text-foreground">Matcha utan ID via nyckel (avancerat)</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="w-5 h-5 rounded bg-bg-primary border border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              checked={csvOptions.addNew}
              onChange={(e) => setCsvOptions(o => ({ ...o, addNew: e.target.checked }))}
            />
            <span className="text-foreground">Lägg till nya rader</span>
          </label>
        </div>
      </div>

      {csvLoading && (
        <div className="alert alert-info mt-3" role="status" aria-live="polite">
          Bearbetar...
        </div>
      )}

      {csvError && (
        <div className="alert alert-error mt-3" role="alert" aria-live="assertive">
          {csvError}
        </div>
      )}

      {csvPreview && !csvError && (
        <div className="mt-3">
          <div className="alert alert-warning" role="status" aria-live="polite">
            <strong>Förhandsgranskning:</strong> inga ändringar har gjorts än.
          </div>

          {/* Summary stats */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <Icon name="Plus" className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
              <span className="text-sm text-green-800 dark:text-green-200">
                <strong>{csvPreview.result.added}</strong> tillägg
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <Icon name="RefreshCw" className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{csvPreview.result.updated}</strong> uppdateringar
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <Icon name="SkipForward" className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>{csvPreview.result.skipped}</strong> överhoppade
              </span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${
              csvPreview.result.failed > 0
                ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
            }`}>
              <Icon
                name={csvPreview.result.failed > 0 ? 'XCircle' : 'CheckCircle'}
                className={`w-4 h-4 ${
                  csvPreview.result.failed > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                aria-hidden="true"
              />
              <span className={`text-sm ${
                csvPreview.result.failed > 0
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                <strong>{csvPreview.result.failed}</strong> fel
              </span>
            </div>
          </div>

          {/* Error details */}
          {csvPreview.result.errors?.length > 0 && (
            <details className="mt-3" open={csvPreview.result.errors.length <= 10}>
              <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                <Icon name="AlertTriangle" className="w-4 h-4" aria-hidden="true" />
                Visa {csvPreview.result.errors.length} rad(er) med fel
              </summary>
              <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-red-100 dark:bg-red-900">
                    <tr>
                      <th className="text-left px-3 py-2 text-red-800 dark:text-red-200 font-medium">Rad</th>
                      <th className="text-left px-3 py-2 text-red-800 dark:text-red-200 font-medium">Fel</th>
                      <th className="text-left px-3 py-2 text-red-800 dark:text-red-200 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.result.errors.map((err, idx) => (
                      <tr key={idx} className="border-t border-red-200 dark:border-red-800">
                        <td className="px-3 py-2 text-red-700 dark:text-red-300 font-mono whitespace-nowrap">
                          #{err.row}
                        </td>
                        <td className="px-3 py-2 text-red-700 dark:text-red-300">
                          {err.error}
                        </td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400 font-mono text-xs max-w-xs truncate" title={JSON.stringify(err.record)}>
                          {err.record?.type || '?'}, {err.record?.year || '?'}, {err.record?.weaponGroup || '?'}
                          {err.record?.points != null && `, p:${err.record.points}`}
                          {err.record?.score != null && `, s:${err.record.score}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirmCsvImport}
            disabled={csvLoading || (csvPreview.result.added === 0 && csvPreview.result.updated === 0)}
            className="btn btn-primary w-full mt-3 min-h-[44px]"
          >
            {csvPreview.result.added === 0 && csvPreview.result.updated === 0
              ? 'Inget att importera'
              : `Bekräfta import (${csvPreview.result.added + csvPreview.result.updated} rader)`}
          </button>
          {csvPreview.result.failed > 0 && (csvPreview.result.added > 0 || csvPreview.result.updated > 0) && (
            <p className="mt-2 text-xs text-muted-foreground">
              Rader med fel kommer att hoppas över vid import.
            </p>
          )}
        </div>
      )}

      {csvSummary && (
        <div className="mt-3">
          <div className="alert alert-success" role="status" aria-live="polite">
            Import klar: {csvSummary.added} tillagda, {csvSummary.updated} uppdaterade, {csvSummary.skipped} överhoppade, {csvSummary.failed} fel.
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary min-h-[44px]" onClick={handleUndoImport}>
              Ångra import
            </button>
          </div>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-foreground">Hjälp: Kolumner och arbetsflöde</summary>
        <div className="mt-2 text-sm text-muted-foreground space-y-2">
          <p>Arbetsflöde: 1) Exportera aktiviteter, 2) Redigera i kalkylark, 3) Importera CSV. Behåll kolumnen <code>id</code> för att uppdatera rader; nya rader kan lämna <code>id</code> tomt.</p>
          <p>Tillåtna kolumner (valfria där det inte krävs): id, type, year, weaponGroup, points, date, timeSeconds, hits, competitionName, competitionType, medalType, disciplineType, weapon, score, teamName, position, eventName, notes, schema_version.</p>
          <p>Standardmatchning: Uppdatera via ID. Alternativt kan du matcha utan ID via naturlig nyckel (avancerat).</p>
        </div>
      </details>
    </div>
  )
}
