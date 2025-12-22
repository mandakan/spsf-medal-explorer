import React, { useMemo, useState } from 'react'
import MobileBottomSheet from './MobileBottomSheet'
import { useMedalCalculator } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'

export default function UnlockMedalDialog({ medal, open, onClose }) {
  const calculator = useMedalCalculator()
  const { unlockMedal } = useProfile()
  const [year, setYear] = useState('')
  const eligibleYears = useMemo(() => {
    if (!open || !calculator || !medal?.id) return []
    try {
      return calculator.getEligibleYears(medal.id) || []
    } catch {
      return []
    }
  }, [open, calculator, medal])
  const selectedYear = eligibleYears.length <= 1 ? (eligibleYears[0] ?? '') : (year || (eligibleYears[0] ?? ''))

  const canUnlock = eligibleYears.length > 0 && selectedYear !== ''

  const doUnlock = async () => {
    if (!canUnlock) return
    const unlockedDate = `${selectedYear}-12-31`
    await unlockMedal(medal.id, unlockedDate)
    onClose?.()
  }

  return (
    <MobileBottomSheet
      id="unlock-medal"
      title={`Unlock ${medal?.displayName || 'medal'}`}
      open={open}
      onClose={onClose}
      swipeToDismiss
    >
      {eligibleYears.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">No qualifying years found.</p>
          <div className="flex justify-end">
            <button type="button" className="btn btn-primary min-h-[44px]" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      ) : eligibleYears.length === 1 ? (
        <div className="space-y-4">
          <p className="text-sm">
            Unlock for year: <strong>{eligibleYears[0]}</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-muted min-h-[44px]" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary min-h-[44px]" onClick={doUnlock}>
              Unlock
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            doUnlock()
          }}
          noValidate
        >
          <div>
            <label htmlFor="unlock-year" className="field-label mb-2">
              Year
            </label>
            <select
              id="unlock-year"
              className="select py-3"
              value={selectedYear}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {eligibleYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-muted min-h-[44px]" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary min-h-[44px]" disabled={!canUnlock}>
              Unlock
            </button>
          </div>
        </form>
      )}
    </MobileBottomSheet>
  )
}
