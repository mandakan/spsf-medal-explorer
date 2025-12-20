import React, { useState } from 'react'
import { validateAchievements, detectDuplicateAchievements } from '../logic/achievementValidator'
import { useAchievementHistory } from '../hooks/useAchievementHistory'

export default function BatchAchievementForm() {
  const { addMany } = useAchievementHistory()
  const [rows, setRows] = useState([
    { year: new Date().getFullYear(), weaponGroup: 'A', points: '', type: 'gold_series' }
  ])
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
      { year: new Date().getFullYear(), weaponGroup: 'A', points: '', type: 'gold_series' }
    ])
  }

  const handleRemoveRow = (index) => {
    setRows(rows.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate all rows
    const validation = validateAchievements(rows)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    // Duplicate detection in the batch
    const duplicates = detectDuplicateAchievements(validation.validAchievements)
    setDupWarnings(duplicates)
    if (duplicates.length > 0) {
      // Allow user to proceed anyway; in a fuller UX we might block and require confirm
      // For now, continue but show warning.
    }

    try {
      setSubmitting(true)
      let added = await addMany(validation.validAchievements)

      setSuccessCount(added)
      setRows([
        { year: new Date().getFullYear(), weaponGroup: 'A', points: '', type: 'gold_series' }
      ])
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
        Batch add currently supports Gold Series achievements only. To add competition, qualification,
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
                <th scope="col" className="text-left px-3 py-2">Points</th>
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
                      <option value="gold_series">Gold Series</option>
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
            disabled={submitting || rows.every(r => !r.points)}
          >
            {submitting ? 'Adding...' : 'Add All Achievements'}
          </button>
        </div>
      </form>
    </div>
  )
}
