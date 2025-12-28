import React, { useState } from 'react'
import AchievementDialog from './AchievementDialog'
import AchievementRowCard from './AchievementRowCard'
import { detectDuplicateAchievements } from '../logic/achievementValidator'
import { useAchievementHistory } from '../hooks/useAchievementHistory'
import FeatureGate from './FeatureGate'

const WG = ['A', 'B', 'C', 'R']
const COMP_TYPES = ['national', 'regional/landsdels', 'crewmate/krets', 'championship']
const DISCIPLINE_TYPES = ['field', 'precision', 'military_fast']
const COMP_DISCIPLINE_TYPES = ['national_whole_match', 'military_fast_match', 'ppc']
const PPC_CLASS_SUGGESTIONS = ['R1500', 'P1500', 'Open', 'SSA', 'SR 4"', 'SR 2,75"', 'Dist pistol', 'Dist revolver']
const MEDAL_TYPES = ['bronze', 'silver', 'gold']
const APP_TIME_OPTIONS = [
  { value: 60, label: '60, Brons' },
  { value: 40, label: '40, Silver' },
  { value: 17, label: '17, Guld A/R' },
  { value: 15, label: '15, Guld B/C' },
]
const currentYear = new Date().getFullYear()
const newRow = () => ({
  year: currentYear,
  weaponGroup: 'A',
  type: 'precision_series',
  date: new Date().toISOString().slice(0, 10),
  timeSeconds: '',
  hits: '',
  points: '',
  competitionType: '',
  medalType: '',
  disciplineType: '',
  competitionName: '',
  weapon: '',
  score: '',
  ppcClass: '',
  teamName: '',
  position: '',
  participants: '',
  eventName: '',
  notes: ''
})

export default function BatchAchievementForm() {
  const { addMany } = useAchievementHistory()
  const [rows, setRows] = useState([ newRow() ])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editIndex, setEditIndex] = useState(-1)
  const [errors, setErrors] = useState({})
  const [successCount, setSuccessCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [dupWarnings, setDupWarnings] = useState([])

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: value }
    setRows(newRows)
  }

  const handleAddRow = () => {
    setRows([...rows, newRow()])
  }

  const openAddEditor = () => {
    setEditIndex(-1)
    setEditorOpen(true)
  }

  const openEditEditor = (index) => {
    setEditIndex(index)
    setEditorOpen(true)
  }

  const handleEditorSave = (row, { addAnother } = {}) => {
    if (editIndex >= 0) {
      setRows(prev => prev.map((r, i) => (i === editIndex ? row : r)))
    } else {
      setRows(prev => [...prev, row])
    }
    if (!addAnother) {
      setEditorOpen(false)
      setEditIndex(-1)
    }
  }

  const handleRemoveRow = (index) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all rows (type-aware)
    const rowErrors = {}
    const validRows = []

    rows.forEach((row, idx) => {
      const errs = []
      const y = Number(row.year)
      if (!Number.isFinite(y) || y < 2000 || y > currentYear) {
        errs.push(`Året måste vara mellan 2000 och ${currentYear}`)
      }
      if (!WG.includes(row.weaponGroup)) {
        errs.push('Ogiltig grupp (A, B, C, R)')
      }

      switch (row.type) {
        case 'precision_series': {
          const p = Number(row.points)
          if (!Number.isFinite(p) || p < 0 || p > 50) {
            errs.push('Poäng måste vara mellan 0-50')
          }
          break
        }
        case 'application_series': {
          const d = new Date(row.date)
          if (!row.date || Number.isNaN(d.getTime())) {
            errs.push('Ogiltigt datum')
          } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            d.setHours(0, 0, 0, 0)
            if (d.getTime() > today.getTime()) {
              errs.push('Datum kan inte vara i framtiden')
            }
          }
          const allowed = [60, 40, 17, 15]
          const t = Number(row.timeSeconds)
          if (!Number.isFinite(t) || !allowed.includes(t)) {
            errs.push('Välj giltig tid')
          }
          const h = Number(row.hits)
          if (!Number.isFinite(h) || h < 0) {
            errs.push('Ange giltigt antal träffar')
          }
          break
        }
        case 'competition_result': {
          const ct = String(row.competitionType || '').toLowerCase()
          const dt = String(row.disciplineType || '').toLowerCase()
          const sc = Number(row.score)
          if (!COMP_TYPES.includes(ct)) errs.push('Välj giltig tävlingstyp')
          if (!COMP_DISCIPLINE_TYPES.includes(dt)) errs.push('Välj giltig gren')
          if (!Number.isFinite(sc)) errs.push('Poäng måste vara ett tal')
          if (dt === 'ppc' && !String(row.ppcClass || '').trim()) errs.push('Välj PPC-klass')
          break
        }
        case 'standard_medal':
        case 'qualification_result':
        case 'team_event':
        case 'event':
        case 'custom':
        default:
          break
      }

      if (errs.length) {
        rowErrors[idx] = errs
      } else {
        validRows.push(row)
      }
    })

    if (Object.keys(rowErrors).length) {
      setErrors(rowErrors)
      return
    }

    // Duplicate detection (precision series only)
    const seriesRows = validRows.filter(r => r.type === 'precision_series')
    const duplicates = detectDuplicateAchievements(seriesRows)
    setDupWarnings(duplicates)

    try {
      setSubmitting(true)
      const added = await addMany(validRows)
      if (added > 0) {
        setSuccessCount(added)
        setRows([ newRow() ])
        setErrors({})
        setTimeout(() => setSuccessCount(0), 3000)
      } else {
        setErrors({ form: 'Inga aktiviteter blev tillagda. Granska din input.' })
      }
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FeatureGate name="achievementEntry">
      <div className="card p-6">
      <h2 className="text-xl font-bold mb-2 text-text-primary">Lägg till aktiviteter i batch</h2>
      <p id="batch-type-help" className="text-sm text-text-secondary mb-4">
        Batcher stödjer precisionsserier och tillämpningsserier. För att lägga till övriga, logga
        dem på ett märkeskort.
      </p>

      {successCount > 0 && (
        <div role="status" aria-live="polite" className="card p-4 mb-4">
          <p className="text-foreground">✓ Lyckades lägga till {successCount} aktivitet(er)</p>
        </div>
      )}

      {dupWarnings.length > 0 && (
        <div role="alert" className="card p-4 mb-4">
          <p className="font-medium text-foreground mb-1">Möjliga duplikat:</p>
          <ul className="list-disc list-inside text-muted-foreground text-sm">
            {dupWarnings.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}

      {errors.form && (
        <div role="alert" className="card p-4 mb-4">
          <p className="text-foreground">{errors.form}</p>
        </div>
      )}

      {/* Mobile: card list + sticky add button */}
      <div className="sm:hidden space-y-3 mb-4">
        {rows.map((row, idx) => (
          <AchievementRowCard
            key={idx}
            row={row}
            index={idx}
            onEdit={openEditEditor}
            onRemove={handleRemoveRow}
          />
        ))}
        <div className="sticky bottom-0 safe-bottom pt-2 bg-transparent">
          <button
            type="button"
            onClick={openAddEditor}
            className="btn btn-primary w-full min-h-[44px]"
            aria-label="Add achievement"
          >
            + Lägg till
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="hidden sm:block overflow-x-auto mb-4">
          <table className="w-full text-sm text-foreground">
            <caption className="sr-only">Batch achievement input</caption>
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th scope="col" className="text-left px-3 py-2">År</th>
                <th scope="col" className="text-left px-3 py-2">Typ</th>
                <th scope="col" className="text-left px-3 py-2">Grupp</th>
                <th scope="col" className="text-left px-3 py-2">Detailer</th>
                <th scope="col" className="text-left px-3 py-2">Åtgärd</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const rowErrs = Array.isArray(errors[index]) ? errors[index] : []
                const errorId = `row-${index}-errors`
                const hasYearErr = rowErrs.some(e => /year/i.test(e))
                const hasGroupErr = rowErrs.some(e => /group/i.test(e))
                const hasPointsErr = rowErrs.some(e => /points?/i.test(e))
                const hasDateErr = rowErrs.some(e => /date/i.test(e))
                const hasTimeErr = rowErrs.some(e => /time/i.test(e))
                const hasHitsErr = rowErrs.some(e => /hits?/i.test(e))
                return (
                <tr key={index} className="border-b border-border hover:bg-bg-secondary/60">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={row.year}
                      onChange={(e) => handleRowChange(index, 'year', e.target.value)}
                      className="input w-24"
                      disabled={submitting}
                      aria-label={`Year for row ${index + 1}`}
                      aria-invalid={hasYearErr || undefined}
                      aria-describedby={rowErrs.length ? errorId : undefined}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.type}
                      onChange={(e) => handleRowChange(index, 'type', e.target.value)}
                      className="select w-32"
                      disabled={submitting}
                      aria-label={`Type for row ${index + 1}`}
                      aria-describedby="batch-type-help"
                    >
                      <option value="precision_series">Precisionsserie</option>
                      <option value="application_series">Tillämpningsserie</option>
                      <option value="standard_medal">Standardmedalj</option>
                      <option value="competition_result">Tävlingsresultat</option>
                      <option value="qualification_result">Kvalificering</option>
                      <option value="team_event">Lag-Event</option>
                      <option value="event">Event</option>
                      <option value="custom">Custom</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.weaponGroup}
                      onChange={(e) => handleRowChange(index, 'weaponGroup', e.target.value)}
                      className="select w-20"
                      disabled={submitting}
                      aria-label={`Vapengrupp för rad ${index + 1}`}
                      aria-invalid={hasGroupErr || undefined}
                      aria-describedby={rowErrs.length ? errorId : undefined}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="R">R</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {row.type === 'precision_series' ? (
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={row.points}
                        onChange={(e) => handleRowChange(index, 'points', e.target.value)}
                        className="input w-20"
                        placeholder="0-50"
                        disabled={submitting}
                        aria-label={`Poäng för rad ${index + 1}`}
                        aria-invalid={hasPointsErr || undefined}
                        aria-describedby={rowErrs.length ? errorId : undefined}
                      />
                    ) : row.type === 'application_series' ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                          className="input w-44"
                          disabled={submitting}
                          aria-label={`Datum för rad ${index + 1}`}
                          aria-invalid={hasDateErr || undefined}
                          aria-describedby={rowErrs.length ? errorId : undefined}
                        />
                        <select
                          value={row.timeSeconds === '' ? '' : Number(row.timeSeconds)}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              'timeSeconds',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="select w-40"
                          disabled={submitting}
                          aria-label={`Tid för rad ${index + 1}`}
                          aria-invalid={hasTimeErr || undefined}
                          aria-describedby={rowErrs.length ? errorId : undefined}
                        >
                          <option value="">Select time…</option>
                          {APP_TIME_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.hits}
                          onChange={(e) => handleRowChange(index, 'hits', e.target.value)}
                          className="input w-24"
                          placeholder="Hits"
                          disabled={submitting}
                          aria-label={`Träffar för rad ${index + 1}`}
                          aria-invalid={hasHitsErr || undefined}
                          aria-describedby={rowErrs.length ? errorId : undefined}
                        />
                      </div>
                    ) : row.type === 'standard_medal' ? (
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={row.disciplineType}
                          onChange={(e) => handleRowChange(index, 'disciplineType', e.target.value)}
                          className="select w-40"
                          disabled={submitting}
                          aria-label={`Tävlinggren för rad ${index + 1}`}
                        >
                          <option value="">Välj disciplin...</option>
                          {DISCIPLINE_TYPES.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <select
                          value={row.medalType}
                          onChange={(e) => handleRowChange(index, 'medalType', e.target.value)}
                          className="select w-32"
                          disabled={submitting}
                          aria-label={`Medaljtyp för rad ${index + 1}`}
                        >
                          <option value="">Välj medalj...</option>
                          {MEDAL_TYPES.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                         <input
                          type="text"
                          value={row.competitionName}
                          onChange={(e) => handleRowChange(index, 'competitionName', e.target.value)}
                          className="input flex-1 min-w-[10rem]"
                          placeholder="Tävlingsnamn (valfritt)"
                          disabled={submitting}
                          aria-label={`Tävlingsnamn för rad ${index + 1}`}
                        />
                        </div>
                    ) : row.type === 'competition_result' ? (
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={row.competitionType}
                          onChange={(e) => handleRowChange(index, 'competitionType', e.target.value)}
                          className="select w-40"
                          disabled={submitting}
                          aria-label={`Tävlingstyp för rad ${index + 1}`}
                        >
                          <option value="">Select type…</option>
                          {COMP_TYPES.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>

                        <select
                          value={row.disciplineType}
                          onChange={(e) => handleRowChange(index, 'disciplineType', e.target.value)}
                          className="select w-44"
                          disabled={submitting}
                          aria-label={`Gren för rad ${index + 1}`}
                        >
                          <option value="">Välj gren…</option>
                          {COMP_DISCIPLINE_TYPES.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>

                        {String(row.disciplineType || '') === 'ppc' && (
                          <>
                            <input
                              type="text"
                              value={row.ppcClass}
                              onChange={(e) => handleRowChange(index, 'ppcClass', e.target.value)}
                              className="input w-36"
                              list={`ppc-classes-row-${index}`}
                              placeholder="PPC-klass"
                              disabled={submitting}
                              aria-label={`PPC-klass för rad ${index + 1}`}
                            />
                            <datalist id={`ppc-classes-row-${index}`}>
                              {PPC_CLASS_SUGGESTIONS.map(opt => (
                                <option key={opt} value={opt} />
                              ))}
                            </datalist>
                          </>
                        )}

                        <input
                          type="number"
                          value={row.score}
                          onChange={(e) => handleRowChange(index, 'score', e.target.value)}
                          className="input w-28"
                          placeholder="Poäng"
                          disabled={submitting}
                          aria-label={`Poäng för rad ${index + 1}`}
                        />

                        <input
                          type="text"
                          value={row.competitionName}
                          onChange={(e) => handleRowChange(index, 'competitionName', e.target.value)}
                          className="input flex-1 min-w-[10rem]"
                          placeholder="Tävlingsnamn (valfritt)"
                          disabled={submitting}
                          aria-label={`Tävlingsnamn för rad ${index + 1}`}
                        />
                      </div>
                    ) : row.type === 'qualification_result' ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={row.weapon}
                          onChange={(e) => handleRowChange(index, 'weapon', e.target.value)}
                          className="input w-32"
                          placeholder="Weapon"
                          disabled={submitting}
                          aria-label={`Vapen för rad ${index + 1}`}
                        />
                        <input
                          type="number"
                          value={row.score}
                          onChange={(e) => handleRowChange(index, 'score', e.target.value)}
                          className="input w-24"
                          placeholder="Score"
                          disabled={submitting}
                          aria-label={`Poäng för rad ${index + 1}`}
                        />
                      </div>
                    ) : row.type === 'team_event' ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={row.teamName}
                          onChange={(e) => handleRowChange(index, 'teamName', e.target.value)}
                          className="input w-40"
                          placeholder="Lagnamn"
                          disabled={submitting}
                          aria-label={`Lagamn för rad ${index + 1}`}
                        />
                        <input
                          type="number"
                          min="1"
                          value={row.position}
                          onChange={(e) => handleRowChange(index, 'position', e.target.value)}
                          className="input w-24"
                          placeholder="Placering"
                          disabled={submitting}
                          aria-label={`Placering för rad ${index + 1}`}
                        />
                        <input
                          type="text"
                          value={row.participants}
                          onChange={(e) => handleRowChange(index, 'participants', e.target.value)}
                          className="input w-56"
                          placeholder="Deltagare (komma-separerad)"
                          disabled={submitting}
                          aria-label={`Deltagara för rad ${index + 1}`}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={row.eventName}
                        onChange={(e) => handleRowChange(index, 'eventName', e.target.value)}
                        className="input w-48"
                        placeholder="Event-namn / detaljer"
                        disabled={submitting}
                        aria-label={`Event-namn för rad ${index + 1}`}
                      />
                    )}
                    {rowErrs.length > 0 && (
                      <div
                        id={errorId}
                        role="alert"
                        className="text-red-600 text-xs mt-1"
                      >
                        {rowErrs.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="btn btn-muted text-red-600"
                        disabled={submitting}
                        aria-label={`Ta bort rad ${index + 1}`}
                      >
                        Ta bort
                      </button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden sticky bottom-0 safe-bottom bg-bg-secondary/80 backdrop-blur p-3 border-t border-border">
          <button
            type="submit"
            className="btn btn-primary w-full min-h-[44px]"
            disabled={submitting || rows.length === 0}
          >
            {submitting ? 'Lägger till...' : 'Lägg till alla aktiviteter'}
          </button>
        </div>

        <div className="hidden sm:flex gap-2 mb-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="btn btn-muted disabled:opacity-50"
            disabled={submitting}
          >
            + Lägg till rad
          </button>
          <button
            type="submit"
            className="btn btn-primary disabled:opacity-50"
            disabled={submitting || rows.length === 0}
          >
            {submitting ? 'Lägger till...' : 'Lägg till alla aktiviteter'}
          </button>
        </div>
      </form>

      <AchievementDialog
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditIndex(-1) }}
        initialRow={editIndex >= 0 ? rows[editIndex] : newRow()}
        onSave={handleEditorSave}
        WG={WG}
        COMP_TYPES={COMP_TYPES}
        MEDAL_TYPES={MEDAL_TYPES}
        APP_TIME_OPTIONS={APP_TIME_OPTIONS}
        COMP_DISCIPLINE_TYPES={COMP_DISCIPLINE_TYPES}
        PPC_CLASS_SUGGESTIONS={PPC_CLASS_SUGGESTIONS}
      />
    </div>
    </FeatureGate>
  )
}
