import React, { useMemo, useState } from 'react'
import CompetitionForm from './form/CompetitionForm'
import QualificationForm from './form/QualificationForm'
import TeamEventForm from './form/TeamEventForm'
import EventForm from './form/EventForm'
import CustomForm from './form/CustomForm'
import PrecisionSeriesForm from './form/PrecisionSeriesForm'
import ApplicationSeriesForm from './form/ApplicationSeriesForm'
import SpeedShootingSeriesForm from './form/SpeedShootingSeriesForm'
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

// Type-specific forms for direct achievement entry
const typeSpecificForms = {
  precision_series: PrecisionSeriesForm,
  application_series: ApplicationSeriesForm,
  speed_shooting_series: SpeedShootingSeriesForm,
}

// Swedish labels for achievement types
const achievementTypeLabels = {
  precision_series: 'Precisionsserie',
  application_series: 'Tillämpningsserie',
  speed_shooting_series: 'Duellserie',
  competition_performance: 'Tävlingsprestation',
  air_pistol_precision: 'Luftpistolprecision',
}

/**
 * Extract achievement types from medal requirements recursively
 */
function extractAchievementTypes(requirements) {
  if (!requirements) return []
  const types = new Set()

  function traverse(node) {
    if (!node || typeof node !== 'object') return

    // If node has a type, add it
    if (node.type && typeof node.type === 'string') {
      // Filter out logical operators and medal prerequisites
      if (!['and', 'or', 'medal'].includes(node.type.toLowerCase())) {
        types.add(node.type)
      }
    }

    // Recursively traverse nested requirements
    if (node.and && Array.isArray(node.and)) {
      node.and.forEach(traverse)
    }
    if (node.or && Array.isArray(node.or)) {
      node.or.forEach(traverse)
    }
  }

  traverse(requirements)
  return Array.from(types)
}

export default function UniversalAchievementLogger({ medal, onSuccess, unlockMode = false }) {
  const { addAchievement, unlockMedal } = useAchievementHistory()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [savedAchievement, setSavedAchievement] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const [selectedType, setSelectedType] = useState(null)

  // Extract available achievement types from medal requirements
  const availableTypes = useMemo(() => {
    if (unlockMode) return []
    const types = extractAchievementTypes(medal?.requirements)
    // Filter to only types we have specific forms for
    return types.filter(t => typeSpecificForms[t])
  }, [medal, unlockMode])

  // Detect form variant from medal data
  const medalType = useMemo(() => detectMedalFormType(medal), [medal])
  const effectiveType = unlockMode ? 'event' : medalType

  // Determine which form to show
  const FormComponent = useMemo(() => {
    if (unlockMode) return CustomForm

    // If user has selected a specific type, use that form
    if (selectedType && typeSpecificForms[selectedType]) {
      return typeSpecificForms[selectedType]
    }

    // If there's only one available type, use it automatically
    if (availableTypes.length === 1 && typeSpecificForms[availableTypes[0]]) {
      return typeSpecificForms[availableTypes[0]]
    }

    // Otherwise fall back to medal-type detection
    return formComponents[medalType] || CustomForm
  }, [unlockMode, selectedType, availableTypes, medalType])
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
    // Reset type selection if there are multiple types
    if (availableTypes.length > 1) {
      setSelectedType(null)
    }
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

      {/* Type selector for medals with multiple achievement types */}
      {availableTypes.length > 1 && !selectedType && (
        <div className="space-y-3 mb-4">
          <p className="text-sm text-text-secondary">
            Detta märke kan tjänas genom olika typer av aktiviteter. Välj vilken typ du vill logga:
          </p>
          <div className="grid gap-2">
            {availableTypes.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className="btn btn-secondary py-3 min-h-[44px] text-left justify-start"
              >
                {achievementTypeLabels[type] || type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Show form if type is selected or only one type available */}
      {(availableTypes.length <= 1 || selectedType) && (
        <>
          {availableTypes.length > 1 && selectedType && (
            <div className="mb-4 p-3 rounded-lg bg-bg-secondary border border-border">
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Typ:</span>{' '}
                {achievementTypeLabels[selectedType] || selectedType}
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="ml-2 text-xs text-primary hover:underline"
                >
                  Byt typ
                </button>
              </p>
            </div>
          )}
          <FormComponent
            key={formKey}
            medal={medal}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </>
      )}

      {/* Success dialog with "add another" option */}
      <AchievementSuccessDialog
        achievement={savedAchievement}
        onAddAnother={handleAddAnother}
        onDone={handleDone}
      />
    </div>
  )
}
