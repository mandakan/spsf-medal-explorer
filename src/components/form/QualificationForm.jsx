import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'

export default function QualificationForm({ onSubmit, loading }) {
  const { values, errors, handleChange, handleSubmit } = useAchievementForm({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      weaponGroup: 'A',
      weapon: '',
      score: '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {}
      if (!vals.date) errs.date = 'Date is required'
      if (!vals.weaponGroup) errs.weaponGroup = 'Weapon group is required'
      if (!vals.weapon?.trim()) errs.weapon = 'Weapon is required'
      const score = Number(vals.score)
      if (!Number.isFinite(score) || score < 0) {
        errs.score = 'Enter a valid score'
      }
      return errs
    },
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="q-date" className="field-label mb-2">
          Date
        </label>
        <input
          id="q-date"
          type="date"
          name="date"
          aria-label="Qualification date"
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'q-error-date' : undefined}
          value={values.date}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.date && <p id="q-error-date" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="q-weapon-group" className="field-label mb-2">
          Weapon Group
        </label>
        <select
          id="q-weapon-group"
          name="weaponGroup"
          aria-label="Weapon group"
          aria-invalid={Boolean(errors.weaponGroup)}
          aria-describedby={errors.weaponGroup ? 'q-error-weaponGroup' : undefined}
          value={values.weaponGroup}
          onChange={handleChange}
          className="select py-3 cursor-pointer"
          required
        >
          <option value="A">Group A</option>
          <option value="B">Group B</option>
          <option value="C">Group C</option>
          <option value="R">Group R</option>
        </select>
        {errors.weaponGroup && <p id="q-error-weaponGroup" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weaponGroup}</p>}
      </div>

      <div>
        <label htmlFor="q-weapon" className="field-label mb-2">
          Weapon
        </label>
        <input
          id="q-weapon"
          type="text"
          name="weapon"
          aria-label="Weapon"
          aria-invalid={Boolean(errors.weapon)}
          aria-describedby={errors.weapon ? 'q-error-weapon' : undefined}
          value={values.weapon}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.weapon && <p id="q-error-weapon" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.weapon}</p>}
      </div>

      <div>
        <label htmlFor="q-score" className="field-label mb-2">
          Score
        </label>
        <input
          id="q-score"
          type="number"
          name="score"
          aria-label="Score"
          aria-invalid={Boolean(errors.score)}
          aria-describedby={errors.score ? 'q-error-score' : undefined}
          value={values.score}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.score && <p id="q-error-score" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.score}</p>}
      </div>

      <div>
        <label htmlFor="q-notes" className="field-label mb-2">
          Notes (optional)
        </label>
        <textarea
          id="q-notes"
          name="notes"
          aria-label="Notes"
          value={values.notes}
          onChange={handleChange}
          className="textarea py-3 resize-none"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Log Qualification'}
      </button>
    </form>
  )
}
