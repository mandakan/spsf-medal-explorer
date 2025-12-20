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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-text-primary">Batch Add Achievements</h2>

      {successCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <p className="text-green-700">✓ Successfully added {successCount} achievement(s)</p>
        </div>
      )}

      {dupWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <p className="text-yellow-800 font-medium mb-1">Possible duplicates detected:</p>
          <ul className="list-disc list-inside text-yellow-800 text-sm">
            {dupWarnings.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}

      {errors.form && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700">{errors.form}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left px-3 py-2">Year</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Group</th>
                <th className="text-left px-3 py-2">Points</th>
                <th className="text-left px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="2000"
                      max={new Date().getFullYear()}
                      value={row.year}
                      onChange={(e) => handleRowChange(index, 'year', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                      disabled={submitting}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.type}
                      onChange={(e) => handleRowChange(index, 'type', e.target.value)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded"
                      disabled={submitting}
                    >
                      <option value="gold_series">Gold Series</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.weaponGroup}
                      onChange={(e) => handleRowChange(index, 'weaponGroup', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      disabled={submitting}
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
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="0-50"
                      disabled={submitting}
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
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={submitting}
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
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={submitting}
          >
            + Add Row
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-hover disabled:opacity-50"
            disabled={submitting || rows.every(r => !r.points)}
          >
            {submitting ? 'Adding...' : 'Add All Achievements'}
          </button>
        </div>
      </form>
    </div>
  )
}
