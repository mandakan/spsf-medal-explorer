import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { Achievement } from '../models/Achievement'
import { InputValidator } from '../logic/validator'

export default function AchievementForm() {
  const { addAchievement, loading } = useProfile()
  const [formData, setFormData] = useState({
    type: 'gold_series',
    year: new Date().getFullYear(),
    weaponGroup: 'A',
    points: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [errors, setErrors] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate (support validators returning array or { errors, isValid })
    const validation = InputValidator.validateGoldSeriesInput(formData)
    const errs = Array.isArray(validation) ? validation : (validation?.errors ?? [])
    const isValid = Array.isArray(validation) ? errs.length === 0 : (validation?.isValid ?? errs.length === 0)

    if (!isValid) {
      setErrors(errs)
      return
    }

    try {
      const achievement = new Achievement({
        ...formData,
        points: parseInt(formData.points, 10)
      })
      await addAchievement(achievement)
      setFormData((prev) => ({
        ...prev,
        points: ''
      }))
      setErrors([])
    } catch (err) {
      setErrors([err.message])
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4">Add Achievement</h2>

      {errors.length > 0 && (
        <div className="bg-background border border-border rounded p-4 mb-4">
          {errors.map((err, i) => (
            <p key={i} className="text-foreground text-sm">• {err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="select"
            disabled={loading}
          >
            <option value="gold_series">Gold Series</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label mb-1">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value || '0', 10) })}
              className="input"
              disabled={loading}
            />
          </div>
          <div>
            <label className="field-label mb-1">Weapon Group</label>
            <select
              value={formData.weaponGroup}
              onChange={(e) => setFormData({ ...formData, weaponGroup: e.target.value })}
              className="select"
              disabled={loading}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="R">R</option>
            </select>
          </div>
        </div>

        <div>
          <label className="field-label mb-1">Points</label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: e.target.value })}
            className="input"
            placeholder="0-50"
            disabled={loading}
          />
        </div>

        <div>
          <label className="field-label mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="input"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Achievement'}
        </button>
      </form>
    </div>
  )
}
