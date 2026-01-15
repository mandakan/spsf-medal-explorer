import React, { useEffect, useMemo, useState } from 'react'
import CompetitionForm from './form/CompetitionForm'
import QualificationForm from './form/QualificationForm'
import TeamEventForm from './form/TeamEventForm'
import EventForm from './form/EventForm'
import CustomForm from './form/CustomForm'
import PrecisionSeriesForm from './form/PrecisionSeriesForm'
import ApplicationSeriesForm from './form/ApplicationSeriesForm'
import SpeedShootingSeriesForm from './form/SpeedShootingSeriesForm'
import AirPistolPrecisionForm from './form/AirPistolPrecisionForm'
import CompetitionPerformanceForm from './form/CompetitionPerformanceForm'
import RunningShootingCourseForm from './form/RunningShootingCourseForm'
import StandardMedalForm from './form/StandardMedalForm'
import { useAchievementHistory } from '../hooks/useAchievementHistory'
import { detectMedalFormType, mapFormToAchievement } from '../utils/achievementMapper'
import { validateAchievement as validateAchievementObject } from '../validators/universalValidator'
import Icon from './Icon'

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
  air_pistol_precision: AirPistolPrecisionForm,
  competition_performance: CompetitionPerformanceForm,
  running_shooting_course: RunningShootingCourseForm,
  skis_shooting_course: RunningShootingCourseForm, // Same form as running
  standard_medal: StandardMedalForm,
}

// Swedish labels for achievement types
const achievementTypeLabels = {
  precision_series: 'Precisionsserie',
  application_series: 'Tillämpningsserie',
  speed_shooting_series: 'Duellserie',
  competition_performance: 'Tävlingsprestation',
  air_pistol_precision: 'Luftpistolprecision',
  running_shooting_course: 'Terränglopp med skytte',
  skis_shooting_course: 'Skidlopp med skytte',
  standard_medal: 'Standardmedalj',
}

/**
 * Extract achievement types from medal requirements recursively
 * @param {object} requirements - Medal requirements object
 * @param {number} maxDepth - Maximum recursion depth (default: 20)
 * @returns {string[]} Array of achievement type strings
 */
function extractAchievementTypes(requirements, maxDepth = 20) {
  if (!requirements) return []
  const types = new Set()

  function traverse(node, depth = 0) {
    if (!node || typeof node !== 'object') return
    // Prevent stack overflow on malformed data
    if (depth >= maxDepth) return

    // If node is an array, traverse each element
    if (Array.isArray(node)) {
      node.forEach(child => traverse(child, depth + 1))
      return
    }

    // If node has a type, add it
    if (node.type && typeof node.type === 'string') {
      // Filter out logical operators and medal prerequisites
      if (!['and', 'or', 'medal'].includes(node.type.toLowerCase())) {
        types.add(node.type)
      }
    }

    // Recursively traverse nested requirements with depth tracking
    if (node.and && Array.isArray(node.and)) {
      node.and.forEach(child => traverse(child, depth + 1))
    }
    if (node.or && Array.isArray(node.or)) {
      node.or.forEach(child => traverse(child, depth + 1))
    }
  }

  traverse(requirements)
  return Array.from(types)
}

export default function UniversalAchievementLogger({ medal, onSuccess, unlockMode = false, compact = false }) {
  const { addAchievement, unlockMedal } = useAchievementHistory()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [selectedType, setSelectedType] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [preservedValues, setPreservedValues] = useState(null)

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

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

      // Close the dialog immediately after successful save
      onSuccess?.(achievement)
    } catch (err) {
      setError(err?.message || 'Misslyckades att spara aktivitet')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAndAddAnother = async (formData) => {
    try {
      setLoading(true)
      setError(null)

      // Map to app's internal achievement shape
      const achievement = mapFormToAchievement({ medal, medalType: effectiveType, formData })

      // Validate the mapped achievement object
      const validation = validateAchievementObject(achievement)
      if (!validation.valid) {
        throw new Error(validation.errors.join(' '))
      }

      // Persist and recalc
      await addAchievement(achievement)

      // If in unlock mode, also mark the medal as unlocked
      if (unlockMode && medal?.id) {
        await unlockMedal(medal.id, achievement.date)
      }

      // Store values to preserve for next entry
      setPreservedValues({
        date: formData.date,
        weaponGroup: formData.weaponGroup,
        competitionName: formData.competitionName,
        disciplineType: formData.disciplineType,
        courseName: formData.courseName,
        // Score/result fields
        points: formData.points,
        hits: formData.hits,
        timeSeconds: formData.timeSeconds,
        score: formData.score,
        maxScore: formData.maxScore,
      })

      // Show success feedback
      setSuccessMessage('Aktivitet sparad!')

      // Reset form by changing key to allow adding another
      setFormKey(prev => prev + 1)
      setError(null)

      // Keep type selection - don't reset to allow quick batch entry
    } catch (err) {
      setError(err?.message || 'Misslyckades att spara aktivitet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="region"
      aria-labelledby={headingId}
      className={compact ? 'w-full' : 'card p-4 w-full'}
    >
      {!compact && (
        <h2
          id={headingId}
          className="section-title mb-4 break-words"
        >
          {unlockMode ? 'Lås upp märke' : 'Logga Aktivitet'}: {medal?.displayName || medal?.name || medal?.id}
        </h2>
      )}

      {/* Hidden heading for accessibility when compact */}
      {compact && (
        <h2 id={headingId} className="sr-only">
          {unlockMode ? 'Lås upp märke' : 'Logga Aktivitet'}: {medal?.displayName || medal?.name || medal?.id}
        </h2>
      )}

      {/* Success toast for "save and add more" */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 flex items-center gap-2 animate-slide-down"
        >
          <Icon name="CheckCircle" className="w-5 h-5" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

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
        <div className="space-y-3 mb-4 animate-fade-in" data-tour="achievement-type-selector">
          {!compact && (
            <p className="text-sm text-text-secondary">
              Detta märke kan tjänas genom olika typer av aktiviteter. Välj vilken typ du vill logga:
            </p>
          )}
          <div className="grid gap-2">
            {availableTypes.map((type, index) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className="btn btn-secondary py-3 min-h-[44px] text-left justify-start transform transition-all hover:scale-[1.02]"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'slideInUp 0.2s ease-out forwards',
                  opacity: 0,
                }}
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
            <div className={`mb-4 rounded-lg ${compact ? 'p-2 bg-bg-secondary/50' : 'p-3 bg-bg-secondary border border-border'}`}>
              <p className="text-sm text-text-secondary flex items-center justify-between">
                <span>
                  <span className="font-medium text-text-primary">Typ:</span>{' '}
                  {achievementTypeLabels[selectedType] || selectedType}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="text-xs text-primary hover:underline ml-2"
                >
                  Byt typ
                </button>
              </p>
            </div>
          )}
          <FormComponent
            key={formKey}
            medal={medal}
            preservedValues={preservedValues}
            onSubmit={handleSubmit}
            onSubmitAndAddAnother={handleSubmitAndAddAnother}
            loading={loading}
          />
        </>
      )}
    </div>
  )
}
