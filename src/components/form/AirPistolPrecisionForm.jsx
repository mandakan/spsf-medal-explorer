import React, { useEffect, useRef, useMemo } from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'
import { getAirPistolPrecisionDefaults, getRequirementHint } from '../../utils/requirementDefaults'
import CollapsibleOptionalFields from '../CollapsibleOptionalFields'

/**
 * Type-specific form for logging air pistol precision series achievements.
 * Optimized for air pistol shooting with points-based scoring (0-100).
 * Pre-populates fields with minimum requirements from medal definition.
 */
export default function AirPistolPrecisionForm({ medal, onSubmit, onSubmitAndAddAnother, loading }) {
  const dateInputRef = useRef(null)

  // Extract default values from medal requirements
  const defaults = useMemo(() => {
    return getAirPistolPrecisionDefaults(medal)
  }, [medal])

  // Get contextual hint from medal requirements
  const requirementHint = useMemo(() => {
    return getRequirementHint(medal, 'air_pistol_precision')
  }, [medal])

  const { values, errors, handleChange, handleSubmit, validate, setErrors } = useAchievementForm({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      points: defaults.minPointsPerSeries ?? '',
      seriesName: '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {}
      if (!vals.date) errs.date = 'Datum krävs'

      const points = Number(vals.points)
      if (vals.points === '' || vals.points === undefined) {
        errs.points = 'Poäng krävs'
      } else if (!Number.isFinite(points) || points < 0 || points > 100) {
        errs.points = 'Poäng måste vara mellan 0-100'
      }

      return errs
    },
    onSubmit: (vals) => onSubmit({ ...vals, achievementType: 'air_pistol_precision' }),
  })

  // Auto-focus first field for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      dateInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Handle "Save & Add Another" button click
  const handleSaveAndAddAnother = (e) => {
    e.preventDefault()
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length === 0 && onSubmitAndAddAnother) {
      onSubmitAndAddAnother({ ...values, achievementType: 'air_pistol_precision' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Date Input */}
      <div>
        <label
          htmlFor="airpistol-date"
          className="field-label mb-2"
        >
          Datum
        </label>
        <input
          ref={dateInputRef}
          id="airpistol-date"
          type="date"
          name="date"
          aria-label="Datum för luftpistolserie"
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

      {/* Points */}
      <div>
        <label
          htmlFor="airpistol-points"
          className="field-label mb-2"
        >
          Poäng (0-100)
        </label>
        <input
          id="airpistol-points"
          type="number"
          name="points"
          inputMode="decimal"
          min="0"
          max="100"
          step="1"
          aria-label="Poäng i luftpistolserie"
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
            {requirementHint || '10 skott mot 10-ringad internationell luftpistoltavla'}
            {defaults.minPointsPerSeries && ` (Minst ${defaults.minPointsPerSeries} poäng krävs)`}
          </p>
        )}
      </div>

      {/* Optional Fields - Collapsed by default */}
      <CollapsibleOptionalFields label="Valfria fält">
        {/* Series Name (optional) */}
        <div>
          <label
            htmlFor="airpistol-series"
            className="field-label mb-2"
          >
            Serienamn
          </label>
          <input
            id="airpistol-series"
            type="text"
            name="seriesName"
            aria-label="Serienamn"
            value={values.seriesName}
            onChange={handleChange}
            className="input py-3"
            placeholder="T.ex. Serie 1, Klubbtävling"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <label
            htmlFor="airpistol-notes"
            className="field-label mb-2"
          >
            Anteckningar
          </label>
          <textarea
            id="airpistol-notes"
            name="notes"
            aria-label="Anteckningar"
            value={values.notes}
            onChange={handleChange}
            className="textarea py-3 resize-none"
            rows={3}
            placeholder="T.ex. väderförhållanden, pistol använd, etc."
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
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sparar...
            </span>
          ) : (
            'Spara & Stäng'
          )}
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
