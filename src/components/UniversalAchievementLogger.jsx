import React, { useMemo, useState } from 'react'
import CompetitionForm from './form/CompetitionForm'
import QualificationForm from './form/QualificationForm'
import TeamEventForm from './form/TeamEventForm'
import EventForm from './form/EventForm'
import CustomForm from './form/CustomForm'
import AchievementSuccessDialog from './AchievementSuccessDialog'
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
  const { addAchievement, unlockMedal } = useAchievementHistory()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [savedAchievement, setSavedAchievement] = useState(null)
  const [formKey, setFormKey] = useState(0)

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
      await addAchievement(achievement)

      // If in unlock mode, also mark the medal as unlocked (prevents duplicate unlocks and updates UI)
      if (unlockMode && medal?.id) {
        await unlockMedal(medal.id, achievement.date)
      }

      // Show success dialog instead of immediately closing
      setSavedAchievement(achievement)
    } catch (err) {
      setError(err?.message || 'Misslyckades att spara aktivitet')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAnother = () => {
    // Clear success state and reset form by changing key
    setSavedAchievement(null)
    setError(null)
    setFormKey(prev => prev + 1)
  }

  const handleDone = () => {
    // Call parent's onSuccess callback to close the dialog
    onSuccess?.(savedAchievement)
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
        {unlockMode ? 'Lås upp märke' : 'Logga Aktivitet'}: {medal?.displayName || medal?.name || medal?.id}
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
        key={formKey}
        medal={medal}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* Success dialog with "add another" option */}
      <AchievementSuccessDialog
        achievement={savedAchievement}
        onAddAnother={handleAddAnother}
        onDone={handleDone}
      />
    </div>
  )
}
