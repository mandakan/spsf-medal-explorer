import React, { useMemo } from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'
import { getSpeedShootingSeriesDefaults, getRequirementHint } from '../../utils/requirementDefaults'
import CollapsibleOptionalFields from '../CollapsibleOptionalFields'

/**
 * Type-specific form for logging speed shooting series achievements.
 * Optimized for duellskjutning (duel shooting) with points-based scoring.
 * Pre-populates fields with minimum requirements from medal definition.
 */
export default function SpeedShootingSeriesForm({ medal, onSubmit, onSubmitAndAddAnother, loading }) {
  // Extract default values from medal requirements
  const defaults = useMemo(() => {
    return getSpeedShootingSeriesDefaults(medal)
  }, [medal])

  // Get contextual hint from medal requirements
  const requirementHint = useMemo(() => {
    return getRequirementHint(medal, 'speed_shooting_series')
  }, [medal])

  const { values, errors, handleChange, handleSubmit, validate, setErrors } = useAchievementForm({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      weaponGroup: defaults.weaponGroup,
      points: defaults.points,
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

  // Handle "Save & Add Another" button click
  const handleSaveAndAddAnother = (e) => {
    e.preventDefault()
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length === 0 && onSubmitAndAddAnother) {
      onSubmitAndAddAnother({ ...values, achievementType: 'speed_shooting_series' })
    }
  }

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
            {requirementHint || 'Resultat från duellskjutning'}
            {defaults.points && ` (Minst ${defaults.points} poäng krävs)`}
          </p>
        )}
      </div>

      {/* Optional Fields - Collapsed by default */}
      <CollapsibleOptionalFields label="Valfria fält">
        {/* Competition Name (optional) */}
        <div>
          <label
            htmlFor="speed-competition"
            className="field-label mb-2"
          >
            Tävling / Bana
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
            Anteckningar
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
      </CollapsibleOptionalFields>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex-1 py-3 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sparar...' : 'Spara & Stäng'}
        </button>
        {onSubmitAndAddAnother && (
          <button
            type="button"
            onClick={handleSaveAndAddAnother}
            disabled={loading}
            className="btn btn-secondary flex-1 py-3 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sparar...' : 'Spara & Lägg till fler'}
          </button>
        )}
      </div>
    </form>
  )
}
