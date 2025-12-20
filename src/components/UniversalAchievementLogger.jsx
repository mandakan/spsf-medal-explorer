import React, { useMemo, useState } from 'react'
import CompetitionForm from './form/CompetitionForm'
import QualificationForm from './form/QualificationForm'
import TeamEventForm from './form/TeamEventForm'
import EventForm from './form/EventForm'
import CustomForm from './form/CustomForm'
import { useAchievementHistory } from '../hooks/useAchievementHistory'
import { detectMedalFormType, mapFormToAchievement } from '../utils/achievementMapper'
import { validateAchievement as validateAchievementObject } from '../validators/universalValidator'

const formComponents = {
  competition: CompetitionForm,
  qualification: QualificationForm,
  team_event: TeamEventForm,
  event: EventForm,
  custom: CustomForm,
}

export default function UniversalAchievementLogger({ medal, onSuccess, unlockMode = false }) {
  const history = useAchievementHistory()
  const addFn = history?.addOne || history?.addAchievement
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Detect form variant from medal data
  const medalType = useMemo(() => detectMedalFormType(medal), [medal])
  const effectiveType = unlockMode ? 'event' : medalType
  const FormComponent = unlockMode ? CustomForm : (formComponents[medalType] || CustomForm)
  const headingId = useMemo(
    () => `achievement-logger-title-${medal?.id || medal?.medalId || 'unknown'}`,
    [medal]
  )

  const handleSubmit = async (formData) => {
    try {
      setLoading(true)
      setError(null)

      // Map to app's internal achievement shape (compatible with LocalStorageDataManager)
      const achievement = mapFormToAchievement({ medal, medalType: effectiveType, formData })

      // Validate the mapped achievement object
      const validation = validateAchievementObject(achievement)
      if (!validation.valid) {
        throw new Error(validation.errors.join(' '))
      }

      // Persist and recalc (context integrates with storage + calculator)
      if (typeof addFn !== 'function') {
        throw new Error('Add achievement function not available')
      }
      await addFn(achievement)

      onSuccess?.(achievement)
    } catch (err) {
      setError(err?.message || 'Failed to save achievement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="region"
      aria-labelledby={headingId}
      className="card p-4 w-full"
    >
      <h2
        id={headingId}
        className="section-title mb-4 break-words"
      >
        {unlockMode ? 'Unlock Medal' : 'Log Achievement'}: {medal?.displayName || medal?.name || medal?.id}
      </h2>

      {error && (
        <div
          className="
            mb-4 p-3 rounded-lg
            bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300
            border border-red-200 dark:border-red-800
            flex items-center gap-2
          "
          role="alert"
          aria-live="assertive"
        >
          <span aria-hidden="true">✕</span>
          <span>{error}</span>
        </div>
      )}

      <FormComponent
        medal={medal}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}
