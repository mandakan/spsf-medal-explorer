import React from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'

/**
 * Type-specific form for logging application series achievements.
 * Optimized for timed shooting with hits counting.
 */
export default function ApplicationSeriesForm({ onSubmit, onSubmitAndAddAnother, loading }) {
  const { values, errors, handleChange, handleSubmit, validate } = useAchievementForm({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      weaponGroup: 'A',
      hits: '',
      timeSeconds: '',
      competitionName: '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {}
      if (!vals.date) errs.date = 'Datum krävs'

      const hits = Number(vals.hits)
      if (!Number.isFinite(hits) || hits < 0 || hits > 6) {
        errs.hits = 'Antal träffar måste vara mellan 0-6'
      }

      const time = Number(vals.timeSeconds)
      if (!Number.isFinite(time) || time <= 0) {
        errs.timeSeconds = 'Tid måste vara större än 0 sekunder'
      }

      return errs
    },
    onSubmit: (vals) => onSubmit({ ...vals, achievementType: 'application_series' }),
  })

  // Handle "Save & Add Another" button click
  const handleSaveAndAddAnother = (e) => {
    e.preventDefault()
    const validationErrors = validate(values)
    if (Object.keys(validationErrors).length === 0 && onSubmitAndAddAnother) {
      onSubmitAndAddAnother({ ...values, achievementType: 'application_series' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Date Input */}
      <div>
        <label
          htmlFor="application-date"
          className="field-label mb-2"
        >
          Datum
        </label>
        <input
          id="application-date"
          type="date"
          name="date"
          aria-label="Datum för tillämpningsserie"
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
          htmlFor="application-weapon-group"
          className="field-label mb-2"
        >
          Vapengrupp
        </label>
        <select
          id="application-weapon-group"
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

      {/* Hits */}
      <div>
        <label
          htmlFor="application-hits"
          className="field-label mb-2"
        >
          Antal träffar (0-6)
        </label>
        <input
          id="application-hits"
          type="number"
          name="hits"
          inputMode="numeric"
          min="0"
          max="6"
          step="1"
          aria-label="Antal träffar i tillämpningsserie"
          aria-invalid={Boolean(errors.hits)}
          aria-describedby={errors.hits ? 'error-hits' : 'hint-hits'}
          value={values.hits}
          onChange={handleChange}
          className="input py-3"
          required
        />
        {errors.hits ? (
          <p id="error-hits" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.hits}
          </p>
        ) : (
          <p id="hint-hits" className="mt-1 text-sm text-text-secondary">
            6 skott på B100 (50m) eller 1/6 mål C30 (25m)
          </p>
        )}
      </div>

      {/* Time in Seconds */}
      <div>
        <label
          htmlFor="application-time"
          className="field-label mb-2"
        >
          Tid (sekunder)
        </label>
        <input
          id="application-time"
          type="number"
          name="timeSeconds"
          inputMode="decimal"
          min="0"
          step="0.1"
          aria-label="Tid i sekunder"
          aria-invalid={Boolean(errors.timeSeconds)}
          aria-describedby={errors.timeSeconds ? 'error-time' : 'hint-time'}
          value={values.timeSeconds}
          onChange={handleChange}
          className="input py-3"
          required
          placeholder="T.ex. 45.5"
        />
        {errors.timeSeconds ? (
          <p id="error-time" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.timeSeconds}
          </p>
        ) : (
          <p id="hint-time" className="mt-1 text-sm text-text-secondary">
            Skjuttid från första till sista skottet
          </p>
        )}
      </div>

      {/* Competition Name (optional) */}
      <div>
        <label
          htmlFor="application-competition"
          className="field-label mb-2"
        >
          Tävling / Bana (valfritt)
        </label>
        <input
          id="application-competition"
          type="text"
          name="competitionName"
          aria-label="Tävlingsnamn"
          value={values.competitionName}
          onChange={handleChange}
          className="input py-3"
          placeholder="T.ex. Träning, Klubbmästerskap"
        />
      </div>

      {/* Notes (optional) */}
      <div>
        <label
          htmlFor="application-notes"
          className="field-label mb-2"
        >
          Anteckningar (valfritt)
        </label>
        <textarea
          id="application-notes"
          name="notes"
          aria-label="Anteckningar"
          value={values.notes}
          onChange={handleChange}
          className="textarea py-3 resize-none"
          rows={3}
          placeholder="T.ex. väderförhållanden, utgångsställning, etc."
        />
      </div>

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
            Spara & Lägg till fler
          </button>
        )}
      </div>
    </form>
  )
}
