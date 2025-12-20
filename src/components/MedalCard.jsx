import React, { useMemo } from 'react'
import { useMedalCalculator } from '../hooks/useMedalCalculator'

export default function MedalCard({ medal }) {
  const calculator = useMedalCalculator()
  const status = useMemo(() => {
    if (!calculator || !medal?.id) return null
    try {
      return calculator.evaluateMedal(medal.id)
    } catch {
      return null
    }
  }, [calculator, medal?.id])

  const unlockedOn = useMemo(() => {
    if (!calculator || status?.status !== 'unlocked') return null
    try {
      return calculator.getUnlockedDate(medal.id)
    } catch {
      return null
    }
  }, [calculator, status?.status, medal?.id])

  const statusDecor = {
    unlocked:
      'border-amber-300 ring-1 ring-amber-500/20 dark:border-amber-700 dark:ring-amber-400/30',
    achievable:
      'border-emerald-300 ring-1 ring-emerald-500/20 dark:border-emerald-700 dark:ring-emerald-400/30',
    locked: 'border-slate-200 dark:border-slate-700'
  }

  const statusBadge = {
    unlocked: '🏆 Unlocked',
    achievable: '🎯 Achievable',
    locked: '🔒 Locked'
  }

  const statusClass = status?.status || 'locked'

  return (
    <div
      className={`rounded-lg border p-4 bg-bg-secondary ${statusDecor[statusClass]}`}
      aria-disabled={statusClass === 'locked'}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-text-primary">{medal.displayName}</h3>
        <span className="text-sm font-semibold">
          {statusBadge[statusClass]}
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-3">
        {medal.type} • {medal.tier}
      </p>

      {medal.description && (
        <p className="text-sm mb-3">{medal.description}</p>
      )}

      {unlockedOn && (
        <p className="text-xs text-text-secondary mb-2" aria-live="polite">
          Unlocked on {unlockedOn}
        </p>
      )}

      {status && status.details && (
        <div className="text-xs text-text-secondary">
          {status.details.items?.length > 0 && (
            <p>Requirements: {status.details.items.length}</p>
          )}
        </div>
      )}
    </div>
  )
}
