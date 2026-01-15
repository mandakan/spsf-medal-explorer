import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'
import { validateCompetition } from '../../validators/universalValidator'

export default function CompetitionForm({ medal, onSubmit, loading, preservedValues }) {
  const { values, errors, handleChange, handleSubmit } = useAchievementForm({
    initialValues: {
      date: preservedValues?.date ?? new Date().toISOString().split('T')[0],
      weaponGroup: preservedValues?.weaponGroup ?? 'C',
      score: preservedValues?.score ?? '',
      competitionName: preservedValues?.competitionName ?? '',
      notes: '',
    },
    validate: (vals) => validateCompetition(vals, medal),
    onSubmit,
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Date Input */}
      <div>
        <label
          htmlFor="achievement-date"
          className="field-label mb-2"
        >
          Date of Achievement
        </label>
        <input
          id="achievement-date"
          type="date"
          name="date"
          aria-label="Achievement date"
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'error-date' : undefined}
          value={values.date}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.date && (
          <p id="error-date" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.date}
          </p>
        )}
      </div>

      {/* Weapon Group */}
      <div>
        <label
          htmlFor="weapon-group"
          className="field-label mb-2"
        >
          Weapon Group
        </label>
        <select
          id="weapon-group"
          name="weaponGroup"
          aria-label="Weapon group"
          aria-invalid={Boolean(errors.weaponGroup)}
          aria-describedby={errors.weaponGroup ? 'error-weaponGroup' : undefined}
          value={values.weaponGroup}
          onChange={handleChange}
          className="select py-3 cursor-pointer"
          required
        >
          <option value="C">Group C</option>
          <option value="B">Group B</option>
          <option value="A">Group A</option>
          <option value="R">Group R</option>
        </select>
        {errors.weaponGroup && (
          <p id="error-weaponGroup" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.weaponGroup}
          </p>
        )}
      </div>

      {/* Score/Points */}
      <div>
        <label
          htmlFor="achievement-score"
          className="field-label mb-2"
        >
          Score / Points
        </label>
        <input
          id="achievement-score"
          type="number"
          name="score"
          inputMode="decimal"
          aria-label="Score or points"
          aria-invalid={Boolean(errors.score)}
          aria-describedby={errors.score ? 'error-score' : undefined}
          value={values.score}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.score && (
          <p id="error-score" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.score}
          </p>
        )}
      </div>

      {/* Competition Name */}
      <div>
        <label
          htmlFor="competition-name"
          className="field-label mb-2"
        >
          Competition (optional)
        </label>
        <input
          id="competition-name"
          type="text"
          name="competitionName"
          aria-label="Competition name"
          value={values.competitionName}
          onChange={handleChange}
          className="input py-3"
        />
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="achievement-notes"
          className="field-label mb-2"
        >
          Notes (optional)
        </label>
        <textarea
          id="achievement-notes"
          name="notes"
          aria-label="Notes"
          value={values.notes}
          onChange={handleChange}
          className="textarea py-3 resize-none"
          rows={3}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Log Achievement'}
      </button>
    </form>
  )
}
