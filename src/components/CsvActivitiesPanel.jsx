import React, { useMemo, useRef, useState } from 'react'
import { achievementsToCSV, exportCsvTemplate, downloadCSV } from '../utils/achievementExport'
import { parseCsv, toAchievement } from '../utils/achievementCsv'

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
          Ladda ned CSV‑mall
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
            Förhandsgranskning: inga ändringar har gjorts än.
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Skulle importera: {csvPreview.result.added} tillägg, {csvPreview.result.updated} uppdateringar, {csvPreview.result.skipped} överhoppade, {csvPreview.result.failed} fel.
          </div>
          <button
            onClick={handleConfirmCsvImport}
            disabled={csvLoading}
            className="btn btn-primary w-full mt-3 min-h-[44px]"
          >
            Bekräfta import
          </button>
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
