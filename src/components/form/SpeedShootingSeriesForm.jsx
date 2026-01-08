import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'

/**
 * Type-specific form for logging speed shooting series achievements.
 * Optimized for duellskjutning (duel shooting) with points-based scoring.
 */
export default function SpeedShootingSeriesForm({ onSubmit, loading }) {
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
    onSubmit: (vals) => onSubmit({ ...vals, achievementType: 'speed_shooting_series' }),
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Date Input */}
      <div>
        <label
          htmlFor="speed-date"
          className="field-label mb-2"
        >
          Datum
        </label>
        <input
          id="speed-date"
          type="date"
          name="date"
          aria-label="Datum för duellserie"
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
          htmlFor="speed-weapon-group"
          className="field-label mb-2"
        >
          Vapengrupp
        </label>
        <select
          id="speed-weapon-group"
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
          htmlFor="speed-points"
          className="field-label mb-2"
        >
          Poäng (0-50)
        </label>
        <input
          id="speed-points"
          type="number"
          name="points"
          inputMode="decimal"
          min="0"
          max="50"
          step="0.1"
          aria-label="Poäng i duellserie"
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
            Resultat från duellskjutning
          </p>
        )}
      </div>

      {/* Competition Name (optional) */}
      <div>
        <label
          htmlFor="speed-competition"
          className="field-label mb-2"
        >
          Tävling / Bana (valfritt)
        </label>
        <input
          id="speed-competition"
          type="text"
          name="competitionName"
          aria-label="Tävlingsnamn"
          value={values.competitionName}
          onChange={handleChange}
          className="input py-3"
          placeholder="T.ex. Elitmärkestävling"
        />
      </div>

      {/* Notes (optional) */}
      <div>
        <label
          htmlFor="speed-notes"
          className="field-label mb-2"
        >
          Anteckningar (valfritt)
        </label>
        <textarea
          id="speed-notes"
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
        {loading ? 'Sparar...' : 'Spara Duellserie'}
      </button>
    </form>
  )
}
