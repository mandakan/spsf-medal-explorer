import React, { useState } from 'react'
import { detectDuplicateAchievements } from '../logic/achievementValidator'
import { useAchievementHistory } from '../hooks/useAchievementHistory'

const WG = ['A', 'B', 'C', 'R']
const COMP_TYPES = ['national', 'regional/landsdels', 'crewmate/krets', 'championship']
const MEDAL_TYPES = ['bronze', 'silver', 'gold']
const parseTimeToSeconds = (s) => {
  if (!s) return NaN
  const m = String(s).trim().match(/^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/)
  if (!m) return NaN
  const mins = Number(m[1])
  const secs = Number(m[2])
  const ms = m[3] ? Number(m[3].padEnd(3, '0')) : 0
  if (!Number.isFinite(mins) || !Number.isFinite(secs) || secs >= 60) return NaN
  return mins * 60 + secs + ms / 1000
}
const currentYear = new Date().getFullYear()
const newRow = () => ({
  year: currentYear,
  weaponGroup: 'A',
  type: 'precision_series',
  date: new Date().toISOString().slice(0, 10),
  time: '',
  hits: '',
  points: '',
  competitionType: '',
  medalType: '',
  competitionName: '',
  weapon: '',
  score: '',
  teamName: '',
  position: '',
  participants: '',
  eventName: '',
  notes: ''
})

export default function BatchAchievementForm() {
  const { addMany } = useAchievementHistory()
  const [rows, setRows] = useState([ newRow() ])
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
    setRows([
      ...rows,
      newRow()
    ])
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
        errs.push(`Year must be between 2000 and ${currentYear}`)
      }
      if (!WG.includes(row.weaponGroup)) {
        errs.push('Invalid group (A, B, C, R)')
      }

      switch (row.type) {
        case 'precision_series': {
          const p = Number(row.points)
          if (!Number.isFinite(p) || p < 0 || p > 50) {
            errs.push('Points must be 0–50')
          }
          break
        }
        case 'application_series': {
          const d = new Date(row.date)
          if (!row.date || Number.isNaN(d.getTime())) {
            errs.push('Date is invalid')
          } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            d.setHours(0, 0, 0, 0)
            if (d.getTime() > today.getTime()) {
              errs.push('Date cannot be in the future')
            }
          }
          const t = parseTimeToSeconds(row.time)
          if (!Number.isFinite(t) || t <= 0 || t > 36000) {
            errs.push('Enter time as MM:SS or MM:SS.ms')
          }
          const h = Number(row.hits)
          if (!Number.isFinite(h) || h < 0) {
            errs.push('Enter a valid hits number')
          }
          break
        }
        case 'competition_result': {
          const ct = String(row.competitionType || '').toLowerCase()
          const mt = String(row.medalType || '').toLowerCase()
          if (!COMP_TYPES.includes(ct)) errs.push('Select a valid competition type')
          if (!MEDAL_TYPES.includes(mt)) errs.push('Select a valid medal type')
          break
        }
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

    // Duplicate detection for series types
    const seriesRows = validRows.filter(r =>
      r.type === 'precision_series' || r.type === 'application_series'
    )
    const duplicates = detectDuplicateAchievements(seriesRows)
    setDupWarnings(duplicates)

    try {
      setSubmitting(true)
      let added = await addMany(validRows)

      setSuccessCount(added)
      setRows([ newRow() ])
      setErrors({})

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessCount(0), 3000)
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-2 text-text-primary">Batch Add Achievements</h2>
      <p id="batch-type-help" className="text-sm text-text-secondary mb-4">
        Batch add supports Precision Series and Application Series. To add competition, qualification,
        team event, or event entries, use the single-entry logger on a medal card.
      </p>

      {successCount > 0 && (
        <div role="status" aria-live="polite" className="card p-4 mb-4">
          <p className="text-foreground">✓ Successfully added {successCount} achievement(s)</p>
        </div>
      )}

      {dupWarnings.length > 0 && (
        <div role="alert" className="card p-4 mb-4">
          <p className="font-medium text-foreground mb-1">Possible duplicates detected:</p>
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

      <form onSubmit={handleSubmit}>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-foreground">
            <caption className="sr-only">Batch achievement input</caption>
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th scope="col" className="text-left px-3 py-2">Year</th>
                <th scope="col" className="text-left px-3 py-2">Type</th>
                <th scope="col" className="text-left px-3 py-2">Group</th>
                <th scope="col" className="text-left px-3 py-2">Details</th>
                <th scope="col" className="text-left px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
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
                      <option value="precision_series">Precision Series</option>
                      <option value="application_series">Application Series</option>
                      <option value="competition_result">Competition Result</option>
                      <option value="qualification_result">Qualification</option>
                      <option value="team_event">Team Event</option>
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
                      aria-label={`Weapon group for row ${index + 1}`}
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
                        aria-label={`Points for row ${index + 1}`}
                      />
                    ) : row.type === 'application_series' ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                          className="input w-44"
                          disabled={submitting}
                          aria-label={`Date for row ${index + 1}`}
                        />
                        <input
                          type="text"
                          value={row.time}
                          onChange={(e) => handleRowChange(index, 'time', e.target.value)}
                          className="input w-28"
                          placeholder="MM:SS[.ms]"
                          inputMode="numeric"
                          disabled={submitting}
                          aria-label={`Time for row ${index + 1}`}
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.hits}
                          onChange={(e) => handleRowChange(index, 'hits', e.target.value)}
                          className="input w-24"
                          placeholder="Hits"
                          disabled={submitting}
                          aria-label={`Hits for row ${index + 1}`}
                        />
                      </div>
                    ) : row.type === 'competition_result' ? (
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={row.competitionType}
                          onChange={(e) => handleRowChange(index, 'competitionType', e.target.value)}
                          className="select w-40"
                          disabled={submitting}
                          aria-label={`Competition type for row ${index + 1}`}
                        >
                          <option value="">Select type…</option>
                          {COMP_TYPES.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <select
                          value={row.medalType}
                          onChange={(e) => handleRowChange(index, 'medalType', e.target.value)}
                          className="select w-32"
                          disabled={submitting}
                          aria-label={`Medal type for row ${index + 1}`}
                        >
                          <option value="">Select medal…</option>
                          {MEDAL_TYPES.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={row.competitionName}
                          onChange={(e) => handleRowChange(index, 'competitionName', e.target.value)}
                          className="input flex-1 min-w-[10rem]"
                          placeholder="Competition name (optional)"
                          disabled={submitting}
                          aria-label={`Competition name for row ${index + 1}`}
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
                          aria-label={`Weapon for row ${index + 1}`}
                        />
                        <input
                          type="number"
                          value={row.score}
                          onChange={(e) => handleRowChange(index, 'score', e.target.value)}
                          className="input w-24"
                          placeholder="Score"
                          disabled={submitting}
                          aria-label={`Score for row ${index + 1}`}
                        />
                      </div>
                    ) : row.type === 'team_event' ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={row.teamName}
                          onChange={(e) => handleRowChange(index, 'teamName', e.target.value)}
                          className="input w-40"
                          placeholder="Team name"
                          disabled={submitting}
                          aria-label={`Team name for row ${index + 1}`}
                        />
                        <input
                          type="number"
                          min="1"
                          value={row.position}
                          onChange={(e) => handleRowChange(index, 'position', e.target.value)}
                          className="input w-24"
                          placeholder="Position"
                          disabled={submitting}
                          aria-label={`Position for row ${index + 1}`}
                        />
                        <input
                          type="text"
                          value={row.participants}
                          onChange={(e) => handleRowChange(index, 'participants', e.target.value)}
                          className="input w-56"
                          placeholder="Participants (comma separated)"
                          disabled={submitting}
                          aria-label={`Participants for row ${index + 1}`}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={row.eventName}
                        onChange={(e) => handleRowChange(index, 'eventName', e.target.value)}
                        className="input w-48"
                        placeholder="Event name / details"
                        disabled={submitting}
                        aria-label={`Event name for row ${index + 1}`}
                      />
                    )}
                    {errors[index]?.length > 0 && (
                      <div className="text-red-600 text-xs mt-1">
                        {Array.isArray(errors[index]) ? errors[index].join(', ') : String(errors[index])}
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
                        aria-label={`Remove row ${index + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="btn btn-muted disabled:opacity-50"
            disabled={submitting}
          >
            + Add Row
          </button>
          <button
            type="submit"
            className="btn btn-primary disabled:opacity-50"
            disabled={submitting || rows.length === 0}
          >
            {submitting ? 'Adding...' : 'Add All Achievements'}
          </button>
        </div>
      </form>
    </div>
  )
}
