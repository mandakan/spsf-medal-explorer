import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

/**
 * Success dialog shown after logging an achievement.
 * Offers "add another" or "done" options for better UX flow.
 * Includes smooth animations for better perceived performance.
 */
export default function AchievementSuccessDialog({ achievement, onAddAnother, onDone }) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  // Trigger animation on mount
  useEffect(() => {
    if (achievement) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setShouldAnimate(true), 10)
      return () => {
        setShouldAnimate(false)
        clearTimeout(timer)
      }
    }
  }, [achievement])

  if (!achievement) return null

  // Derive visibility from both achievement and animation state
  const isVisible = achievement && shouldAnimate

  // Format achievement details for display
  const getAchievementSummary = () => {
    const parts = []

    if (achievement.date) {
      const date = new Date(achievement.date)
      parts.push(`Datum: ${date.toLocaleDateString('sv-SE')}`)
    }

    if (achievement.points != null) {
      parts.push(`Poäng: ${achievement.points}`)
    } else if (achievement.score != null) {
      parts.push(`Resultat: ${achievement.score}`)
    }

    if (achievement.weaponGroup) {
      parts.push(`Vapengrupp: ${achievement.weaponGroup}`)
    }

    return parts.join(' • ')
  }

  const dialogContent = (
    <>
      {/* Backdrop with fade-in animation */}
      <div
        className={`fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onDone}
        aria-hidden="true"
      />

      {/* Dialog with scale-in animation */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-dialog-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2001,
        }}
        className={`
          bg-bg-primary rounded-xl p-6 shadow-xl max-w-md w-[90vw] border border-border
          transition-all duration-200 ease-out
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >
        {/* Success Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Icon
              name="CheckCircle"
              className="w-6 h-6 text-green-600 dark:text-green-400"
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="success-dialog-title"
              className="text-xl font-semibold text-text-primary mb-1"
            >
              Aktivitet sparad!
            </h2>
            <p className="text-sm text-text-secondary">
              {getAchievementSummary()}
            </p>
          </div>
        </div>

        {/* Competition name if available */}
        {achievement.competitionName && (
          <div className="mb-4 p-3 rounded-lg bg-bg-secondary border border-border">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">Tävling:</span>{' '}
              {achievement.competitionName}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onAddAnother}
            className="btn btn-primary flex-1 py-3 min-h-[44px]"
          >
            <Icon name="Plus" className="w-5 h-5 mr-2" />
            Lägg till en till
          </button>
          <button
            type="button"
            onClick={onDone}
            className="btn btn-secondary flex-1 py-3 min-h-[44px]"
          >
            Klar
          </button>
        </div>
      </div>
    </>
  )

  return createPortal(dialogContent, document.body)
}
