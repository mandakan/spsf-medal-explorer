import React, { useState, useMemo } from 'react'
import SectionCard from './SectionCard'
import Icon from './Icon'
import {
  getReceiptAchievements,
  formatAchievementForDisplay,
  generateReceiptText,
} from '../utils/receiptGenerator'

/**
 * Displays a collapsible receipt of achievements used to unlock a medal
 * Only shows for medals with stored achievementIds (auto-unlocked)
 */
export default function AchievementReceipt({
  medal,
  unlockedEntry,
  profile,
}) {
  const [copied, setCopied] = useState(false)

  const achievements = useMemo(
    () => getReceiptAchievements({ unlockedEntry, profile }),
    [unlockedEntry, profile]
  )

  const formattedAchievements = useMemo(
    () => achievements.map(formatAchievementForDisplay),
    [achievements]
  )

  const receiptText = useMemo(
    () =>
      generateReceiptText({
        medal,
        achievements,
        unlockedDate: unlockedEntry?.unlockedDate,
        profileName: profile?.displayName,
      }),
    [medal, achievements, unlockedEntry, profile]
  )

  // Only show for medals with stored achievement IDs
  if (!unlockedEntry?.achievementIds?.length) {
    return null
  }

  // Don't show if no achievements found
  if (achievements.length === 0) {
    return null
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = receiptText
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Silently fail
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <SectionCard
      id={`receipt-${medal?.id || 'unknown'}`}
      title="Kvalificeringskvitto"
      summary={`${achievements.length} aktivitet${achievements.length !== 1 ? 'er' : ''}`}
      collapsible
      defaultOpen={false}
    >
      <ul className="space-y-3 mb-4" role="list">
        {formattedAchievements.map((ach) => (
          <li key={ach.id} className="flex items-start gap-2 text-sm">
            <Icon
              name="CheckCircle2"
              className="w-4 h-4 text-foreground shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="text-foreground font-medium">{ach.label}</div>
              {ach.details && (
                <div className="text-muted-foreground text-xs mt-0.5">
                  {ach.details}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleCopy}
        className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary flex items-center justify-center gap-2"
      >
        <Icon
          name={copied ? 'Check' : 'Copy'}
          className="w-4 h-4"
          aria-hidden="true"
        />
        <span aria-live="polite">
          {copied ? 'Kopierat!' : 'Kopiera som text'}
        </span>
      </button>
    </SectionCard>
  )
}
