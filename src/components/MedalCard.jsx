import React, { useState } from 'react'
import { useMedalCalculator } from '../hooks/useMedalCalculator'
import UnlockMedalDialog from './UnlockMedalDialog'
import { useProfile } from '../hooks/useProfile'
import { StatusPill } from './StatusPill'

export default function MedalCard({ medal }) {
  const calculator = useMedalCalculator()
  const status = (() => {
    if (!calculator || !medal?.id) return null
    try {
      return calculator.evaluateMedal(medal.id)
    } catch {
      return null
    }
  })()

  const unlockedOn = (() => {
    if (!calculator || status?.status !== 'unlocked') return null
    try {
      return calculator.getUnlockedDate(medal.id)
    } catch {
      return null
    }
  })()


  const statusClass = status?.status || 'locked'
  const [unlockOpen, setUnlockOpen] = useState(false)
  const { currentProfile } = useProfile()
  const allowManual = !!currentProfile?.features?.allowManualUnlock

  return (
    <div
      className="rounded-lg border p-4 bg-bg-secondary"
      aria-disabled={statusClass === 'locked'}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-text-primary">{medal.displayName}</h3>
        <StatusPill status={statusClass} />
      </div>

      <p className="text-sm text-text-secondary mb-3">
        {medal.type} • {medal.tier}
      </p>

      {medal.description && (
        <p className="text-sm mb-3">{medal.description}</p>
      )}

      {unlockedOn && (
        <p className="text-xs text-text-secondary mb-2" aria-live="polite">
          Upplåst {unlockedOn}
        </p>
      )}

      {status && status.details && (
        <div className="text-xs text-text-secondary">
          {status.details.items?.length > 0 && (
            <p>Krav: {status.details.items.length}</p>
          )}
        </div>
      )}

      {currentProfile && (statusClass === 'eligible' || (allowManual && statusClass !== 'unlocked')) && (
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto min-h-[44px]"
            onClick={() => setUnlockOpen(true)}
            aria-haspopup="dialog"
            aria-controls="unlock-medal"
          >
            Lås upp...
          </button>
        </div>
      )}

      <UnlockMedalDialog
        medal={medal}
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
      />
    </div>
  )
}
