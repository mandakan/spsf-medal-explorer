import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'

/**
 * Type-specific form for logging precision series achievements.
 * Optimized for precision shooting with points-based scoring.
 */
export default function PrecisionSeriesForm({ onSubmit, loading }) {
  const { values, errors, handleChange, handleSubmit } = useAchievementForm({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      weaponGroup: 'A',
      points: '',
      competitionName: '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {}
      if (!vals.date) errs.date = 'Datum krävs'

      const points = Number(vals.points)
      if (!Number.isFinite(points) || points < 0 || points > 50) {
        errs.points = 'Poäng måste vara mellan 0-50'
      }

      return errs
    },
    onSubmit: (vals) => onSubmit({ ...vals, achievementType: 'precision_series' }),
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Date Input */}
      <div>
        <label
          htmlFor="precision-date"
          className="field-label mb-2"
        >
          Datum
        </label>
        <input
          id="precision-date"
          type="date"
          name="date"
          aria-label="Datum för precisionsserie"
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
          htmlFor="precision-weapon-group"
          className="field-label mb-2"
        >
          Vapengrupp
        </label>
        <select
          id="precision-weapon-group"
          name="weaponGroup"
          aria-label="Vapengrupp"
          aria-invalid={Boolean(errors.weaponGroup)}
          aria-describedby={errors.weaponGroup ? 'error-weaponGroup' : undefined}
          value={values.weaponGroup}
          onChange={handleChange}
          className="select py-3 cursor-pointer"
          required
        >
          <option value="A">Grupp A</option>
          <option value="B">Grupp B</option>
          <option value="C">Grupp C</option>
          <option value="R">Grupp R</option>
        </select>
        {errors.weaponGroup && (
          <p id="error-weaponGroup" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.weaponGroup}
          </p>
        )}
      </div>

      {/* Points */}
      <div>
        <label
          htmlFor="precision-points"
          className="field-label mb-2"
        >
          Poäng (0-50)
        </label>
        <input
          id="precision-points"
          type="number"
          name="points"
          inputMode="decimal"
          min="0"
          max="50"
          step="0.1"
          aria-label="Poäng i precisionsserie"
          aria-invalid={Boolean(errors.points)}
          aria-describedby={errors.points ? 'error-points' : 'hint-points'}
          value={values.points}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.points ? (
          <p id="error-points" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.points}
          </p>
        ) : (
          <p id="hint-points" className="mt-1 text-sm text-text-secondary">
            Resultat från 5 skott på 25m pistoltavla
          </p>
        )}
      </div>

      {/* Competition Name (optional) */}
      <div>
        <label
          htmlFor="precision-competition"
          className="field-label mb-2"
        >
          Tävling / Bana (valfritt)
        </label>
        <input
          id="precision-competition"
          type="text"
          name="competitionName"
          aria-label="Tävlingsnamn"
          value={values.competitionName}
          onChange={handleChange}
          className="input py-3"
          placeholder="T.ex. Klubbmästerskap"
        />
      </div>

      {/* Notes (optional) */}
      <div>
        <label
          htmlFor="precision-notes"
          className="field-label mb-2"
        >
          Anteckningar (valfritt)
        </label>
        <textarea
          id="precision-notes"
          name="notes"
          aria-label="Anteckningar"
          value={values.notes}
          onChange={handleChange}
          className="textarea py-3 resize-none"
          rows={3}
          placeholder="T.ex. väderförhållanden, vapen använt, etc."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full py-3 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sparar...' : 'Spara Precisionsserie'}
      </button>
    </form>
  )
}
