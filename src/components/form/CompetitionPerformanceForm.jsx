import React, { useEffect, useRef, useMemo } from 'react'
import { useAchievementForm } from '../../hooks/useAchievementForm'
import { useProfile } from '../../hooks/useProfile'
import { getCompetitionPerformanceDefaults, getRequirementHint } from '../../utils/requirementDefaults'
import CollapsibleOptionalFields from '../CollapsibleOptionalFields'

/**
 * Type-specific form for logging competition performance achievements.
 * Handles both field shooting (percentage-based) and running/skiing (points-based) disciplines.
 * Auto-detects discipline type from medal requirements when possible.
 */
export default function CompetitionPerformanceForm({ medal, onSubmit, onSubmitAndAddAnother, loading, preservedValues }) {
  const dateInputRef = useRef(null)
  const { currentProfile } = useProfile()

  // Extract default values and discipline type from medal requirements
  const defaults = useMemo(() => {
    return getCompetitionPerformanceDefaults(medal, currentProfile)
  }, [medal, currentProfile])

  // Get contextual hint from medal requirements
  const requirementHint = useMemo(() => {
    return getRequirementHint(medal, 'competition_performance')
  }, [medal])

  // Track if discipline is locked (auto-detected from medal)
  const disciplineLocked = Boolean(defaults.disciplineType)

  // Initialize form with appropriate values based on discipline
  // Helper to calculate scorePercent for field shooting
  const calculateScorePercent = (vals) => {
    if (vals.disciplineType === 'field' && vals.maxScore > 0) {
      return Math.round((Number(vals.score) / Number(vals.maxScore)) * 100)
    }
    return 0
  }

  const { values, errors, handleChange, handleSubmit, validate, setErrors } = useAchievementForm({
    initialValues: {
      date: preservedValues?.date ?? new Date().toISOString().split('T')[0],
      disciplineType: preservedValues?.disciplineType ?? defaults.disciplineType ?? '',
      weaponGroup: preservedValues?.weaponGroup ?? defaults.weaponGroup ?? 'C',
      // Field shooting fields
      score: preservedValues?.score ?? '',
      maxScore: preservedValues?.maxScore ?? '',
      // Running/skiing fields - pre-populate with max allowed points (threshold)
      points: preservedValues?.points ?? defaults.maxPoints ?? '',
      // Common optional fields
      competitionName: preservedValues?.competitionName ?? '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {}
      if (!vals.date) errs.date = 'Datum krävs'
      if (!vals.disciplineType) errs.disciplineType = 'Disciplin krävs'

      if (vals.disciplineType === 'field') {
        const score = Number(vals.score)
        const maxScore = Number(vals.maxScore)
        if (vals.score === '' || !Number.isFinite(score) || score < 0) {
          errs.score = 'Uppnådd poäng krävs (0 eller högre)'
        }
        if (vals.maxScore === '' || !Number.isFinite(maxScore) || maxScore <= 0) {
          errs.maxScore = 'Maxpoäng krävs (större än 0)'
        }
        if (score > maxScore && Number.isFinite(score) && Number.isFinite(maxScore)) {
          errs.score = 'Uppnådd poäng kan inte vara högre än maxpoäng'
        }
      } else if (vals.disciplineType === 'running' || vals.disciplineType === 'skiing') {
        const points = Number(vals.points)
        if (vals.points === '' || !Number.isFinite(points) || points < 0) {
          errs.points = 'Totalpoäng krävs (0 eller högre)'
        }
      }

      return errs
    },
    onSubmit: (vals) => {
      onSubmit({
        ...vals,
        scorePercent: calculateScorePercent(vals),
        achievementType: 'competition_performance',
      })
    },
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
      onSubmitAndAddAnother({
        ...values,
        scorePercent: calculateScorePercent(values),
        achievementType: 'competition_performance',
      })
    }
  }

  // Calculate current score percentage for display
  const currentScorePercent = useMemo(() => {
    if (values.disciplineType !== 'field') return null
    const score = Number(values.score)
    const maxScore = Number(values.maxScore)
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) return null
    return Math.round((score / maxScore) * 100)
  }, [values.disciplineType, values.score, values.maxScore])

  // Get threshold hint for field shooting based on weapon group
  const fieldThresholdHint = useMemo(() => {
    if (values.disciplineType !== 'field') return null
    const minPercent = defaults.thresholds?.[values.weaponGroup]?.min
    if (!minPercent) return null
    return `Minst ${minPercent}% krävs för grupp ${values.weaponGroup}`
  }, [values.disciplineType, values.weaponGroup, defaults.thresholds])

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Date Input */}
      <div>
        <label
          htmlFor="competition-date"
          className="field-label mb-2"
        >
          Datum
        </label>
        <input
          ref={dateInputRef}
          id="competition-date"
          type="date"
          name="date"
          aria-label="Datum för tävling"
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

      {/* Discipline Type - only show if not auto-detected */}
      {!disciplineLocked && (
        <fieldset>
          <legend className="field-label mb-2">Disciplin</legend>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-bg-secondary">
              <input
                type="radio"
                name="disciplineType"
                value="field"
                checked={values.disciplineType === 'field'}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span>Fältskytte</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-bg-secondary">
              <input
                type="radio"
                name="disciplineType"
                value="running"
                checked={values.disciplineType === 'running'}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span>Terränglöpning/springskytte</span>
            </label>
          </div>
          {errors.disciplineType && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.disciplineType}
            </p>
          )}
        </fieldset>
      )}

      {/* Show selected discipline name when locked */}
      {disciplineLocked && (
        <div className="p-3 bg-bg-secondary rounded-lg">
          <span className="text-sm text-text-secondary">Disciplin: </span>
          <span className="font-medium">
            {values.disciplineType === 'field' ? 'Fältskytte' : 'Terränglöpning/springskytte'}
          </span>
        </div>
      )}

      {/* Field Shooting Fields */}
      {values.disciplineType === 'field' && (
        <>
          {/* Weapon Group */}
          <div>
            <label
              htmlFor="competition-weapon-group"
              className="field-label mb-2"
            >
              Vapengrupp
            </label>
            <select
              id="competition-weapon-group"
              name="weaponGroup"
              aria-label="Vapengrupp"
              value={values.weaponGroup}
              onChange={handleChange}
              className="select py-3 cursor-pointer"
              required
            >
              <option value="C">Grupp C</option>
              <option value="B">Grupp B</option>
              <option value="A">Grupp A</option>
              <option value="R">Grupp R</option>
            </select>
          </div>

          {/* Score */}
          <div>
            <label
              htmlFor="competition-score"
              className="field-label mb-2"
            >
              Uppnådd poäng
            </label>
            <input
              id="competition-score"
              data-tour="achievement-primary-input"
              type="number"
              name="score"
              inputMode="numeric"
              min="0"
              step="1"
              aria-label="Uppnådd poäng"
              aria-invalid={Boolean(errors.score)}
              aria-describedby={errors.score ? 'error-score' : 'hint-score'}
              value={values.score}
              onChange={handleChange}
              className="input py-3"
              required
            />
            {errors.score ? (
              <p id="error-score" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.score}
              </p>
            ) : (
              <p id="hint-score" className="mt-1 text-sm text-text-secondary" data-tour="achievement-hint">
                {fieldThresholdHint || 'Antal träff/poäng du uppnådde'}
              </p>
            )}
          </div>

          {/* Max Score */}
          <div>
            <label
              htmlFor="competition-maxscore"
              className="field-label mb-2"
            >
              Maxpoäng
            </label>
            <input
              id="competition-maxscore"
              type="number"
              name="maxScore"
              inputMode="numeric"
              min="1"
              step="1"
              aria-label="Maxpoäng"
              aria-invalid={Boolean(errors.maxScore)}
              aria-describedby={errors.maxScore ? 'error-maxScore' : 'hint-maxScore'}
              value={values.maxScore}
              onChange={handleChange}
              className="input py-3"
              required
            />
            {errors.maxScore ? (
              <p id="error-maxScore" className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.maxScore}
              </p>
            ) : (
              <p id="hint-maxScore" className="mt-1 text-sm text-text-secondary">
                Maximal möjlig poäng för tävlingen (t.ex. 60 för 10 stationer)
              </p>
            )}
          </div>

          {/* Calculated Percentage Display */}
          {currentScorePercent !== null && (
            <div className="p-3 bg-bg-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Beräknad procent: </span>
              <span className="font-medium text-lg">{currentScorePercent}%</span>
              {fieldThresholdHint && (
                <span className="text-sm text-text-secondary ml-2">({fieldThresholdHint})</span>
              )}
            </div>
          )}
        </>
      )}

      {/* Running/Skiing Fields */}
      {(values.disciplineType === 'running' || values.disciplineType === 'skiing') && (
        <div>
          <label
            htmlFor="competition-points"
            className="field-label mb-2"
          >
            Totalpoäng (lägre är bättre)
          </label>
          <input
            id="competition-points"
            type="number"
            name="points"
            inputMode="numeric"
            min="0"
            step="1"
            aria-label="Totalpoäng"
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
              {requirementHint || 'Summa av löppoäng och skjutpoäng'}
              {defaults.maxPoints && ` (Max ${defaults.maxPoints} poäng krävs)`}
            </p>
          )}
        </div>
      )}

      {/* Optional Fields - Collapsed by default */}
      <CollapsibleOptionalFields label="Valfria fält">
        {/* Competition Name (optional) */}
        <div>
          <label
            htmlFor="competition-name"
            className="field-label mb-2"
          >
            Tävlingsnamn
          </label>
          <input
            id="competition-name"
            type="text"
            name="competitionName"
            aria-label="Tävlingsnamn"
            value={values.competitionName}
            onChange={handleChange}
            className="input py-3"
            placeholder="T.ex. DM Fältskytte, Klubbmästerskap"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <label
            htmlFor="competition-notes"
            className="field-label mb-2"
          >
            Anteckningar
          </label>
          <textarea
            id="competition-notes"
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
