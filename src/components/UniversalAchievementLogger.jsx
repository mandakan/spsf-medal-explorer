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

export default function UniversalAchievementLogger({ medal, onSuccess }) {
  const { addAchievement } = useAchievementHistory()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Detect form variant from medal data
  const medalType = useMemo(() => detectMedalFormType(medal), [medal])
  const FormComponent = formComponents[medalType] || CustomForm

  const handleSubmit = async (formData) => {
    try {
      setLoading(true)
      setError(null)

      // Map to app's internal achievement shape (compatible with LocalStorageDataManager)
      const achievement = mapFormToAchievement({ medal, medalType, formData })

      // Validate the mapped achievement object
      const validation = validateAchievementObject(achievement)
      if (!validation.valid) {
        throw new Error(validation.errors.join(' '))
      }

      // Persist and recalc (context integrates with storage + calculator)
      await addAchievement(achievement)

      onSuccess?.(achievement)
    } catch (err) {
      setError(err?.message || 'Failed to save achievement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="
        p-4 bg-slate-50 dark:bg-slate-800
        rounded-lg border border-slate-200 dark:border-slate-700
        max-w-2xl
      "
    >
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Log Achievement: {medal?.displayName || medal?.name || medal?.id}
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
