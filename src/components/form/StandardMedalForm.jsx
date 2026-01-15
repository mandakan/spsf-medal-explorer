import React, { useEffect, useRef, useMemo } from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'
import { getStandardMedalDefaults, getRequirementHint } from '../../utils/requirementDefaults'
import CollapsibleOptionalFields from '../CollapsibleOptionalFields'

const DISCIPLINE_OPTIONS = [
  { value: 'field', label: 'Fält' },
  { value: 'precision', label: 'Precision' },
  { value: 'national_whole_match', label: 'Nationell hel match' },
  { value: 'military_fast_match', label: 'Militär snabbmatch' },
  { value: 'ppc', label: 'PPC' },
]

const MEDAL_TYPE_OPTIONS = [
  { value: 'bronze', label: 'Brons' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Guld' },
]

/**
 * Type-specific form for logging standard medal achievements.
 * Used when a medal requirement can be fulfilled by achieving a standard medal
 * in a specific discipline (e.g., field shooting standard medal).
 */
export default function StandardMedalForm({ medal, onSubmit, onSubmitAndAddAnother, loading, preservedValues }) {
  const dateInputRef = useRef(null)

  // Extract default values from medal requirements
  const defaults = useMemo(() => {
    return getStandardMedalDefaults(medal)
  }, [medal])

  // Get contextual hint from medal requirements
  const requirementHint = useMemo(() => {
    return getRequirementHint(medal, 'standard_medal')
  }, [medal])

  // Check if discipline is locked by medal requirement
  const disciplineLocked = Boolean(defaults.disciplineType)

  const { values, errors, handleChange, handleSubmit, validate, setErrors } = useAchievementForm({
    initialValues: {
      date: preservedValues?.date ?? new Date().toISOString().split('T')[0],
      disciplineType: defaults.disciplineType || '',
      medalType: defaults.medalType || '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {}
      if (!vals.date) errs.date = 'Datum krävs'

      if (!vals.disciplineType) {
        errs.disciplineType = 'Välj en disciplin'
      }

      if (!vals.medalType) {
        errs.medalType = 'Välj medaljnivå'
      }

      return errs
    },
    onSubmit: (vals) => onSubmit({ ...vals, achievementType: 'standard_medal' }),
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
      onSubmitAndAddAnother({ ...values, achievementType: 'standard_medal' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Requirement hint */}
      {requirementHint && (
        <p className="text-sm text-text-secondary bg-bg-secondary p-3 rounded-lg" data-tour="achievement-hint">
          {requirementHint}
        </p>
      )}

      {/* Date Input */}
      <div>
        <label
          htmlFor="standard-medal-date"
          className="field-label mb-2"
        >
          Datum
        </label>
        <input
          ref={dateInputRef}
          id="standard-medal-date"
          type="date"
          name="date"
          aria-label="Datum för standardmedalj"
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

      {/* Discipline Type */}
      <div>
        <label
          htmlFor="standard-medal-discipline"
          className="field-label mb-2"
        >
          Disciplin
        </label>
        {disciplineLocked ? (
          <>
            <input
              type="hidden"
              name="disciplineType"
              value={values.disciplineType}
            />
            <div className="input py-3 bg-bg-secondary text-text-secondary">
              {DISCIPLINE_OPTIONS.find(o => o.value === values.disciplineType)?.label || values.disciplineType}
              <span className="text-xs ml-2">(bestämt av märkeskrav)</span>
            </div>
          </>
        ) : (
          <select
            id="standard-medal-discipline"
            name="disciplineType"
            aria-label="Välj disciplin"
            aria-invalid={Boolean(errors.disciplineType)}
            aria-describedby={errors.disciplineType ? 'error-discipline' : undefined}
            value={values.disciplineType}
            onChange={handleChange}
            className="input py-3"
            required
          >
            <option value="">Välj disciplin...</option>
            {DISCIPLINE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        {errors.disciplineType ? (
          <p id="error-discipline" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.disciplineType}
          </p>
        ) : !disciplineLocked && (
          <p className="mt-1 text-sm text-text-secondary">
            Vilken skyttedisciplin standardmedaljen gäller
          </p>
        )}
      </div>

      {/* Medal Type */}
      <div>
        <label
          htmlFor="standard-medal-type"
          className="field-label mb-2"
        >
          Medaljnivå
        </label>
        <select
          id="standard-medal-type"
          data-tour="achievement-primary-input"
          name="medalType"
          aria-label="Välj medaljnivå"
          aria-invalid={Boolean(errors.medalType)}
          aria-describedby={errors.medalType ? 'error-medal-type' : undefined}
          value={values.medalType}
          onChange={handleChange}
          className="input py-3"
          required
        >
          <option value="">Välj nivå...</option>
          {MEDAL_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.medalType ? (
          <p id="error-medal-type" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.medalType}
          </p>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">
            Vilken nivå på standardmedaljen du uppnått
          </p>
        )}
      </div>

      {/* Optional Fields - Collapsed by default */}
      <CollapsibleOptionalFields label="Valfria fält">
        {/* Notes (optional) */}
        <div>
          <label
            htmlFor="standard-medal-notes"
            className="field-label mb-2"
          >
            Anteckningar
          </label>
          <textarea
            id="standard-medal-notes"
            name="notes"
            aria-label="Anteckningar"
            value={values.notes}
            onChange={handleChange}
            className="textarea py-3 resize-none"
            rows={3}
            placeholder="T.ex. tävlingsnamn, plats, etc."
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
