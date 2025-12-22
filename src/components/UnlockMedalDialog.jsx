import React, { useMemo, useState } from 'react'
import MobileBottomSheet from './MobileBottomSheet'
import { useMedalCalculator } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'

export default function UnlockMedalDialog({ medal, open, onClose }) {
  const calculator = useMedalCalculator()
  const { currentProfile, unlockMedal } = useProfile()
  const allowManual = !!currentProfile?.features?.allowManualUnlock
  const [year, setYear] = useState('')
  const eligibleYears = useMemo(() => {
    if (!open || !calculator || !medal?.id) return []
    try {
      return calculator.getEligibleYears(medal.id) || []
    } catch {
      return []
    }
  }, [open, calculator, medal])
  const birthYear = useMemo(() => {
    const dob = currentProfile?.dateOfBirth
    if (!dob) return null
    const y = new Date(dob).getFullYear()
    return Number.isFinite(y) ? y : null
  }, [currentProfile])
  const nowYear = new Date().getFullYear()

  const sameTypePrereqs = useMemo(() => {
    if (!calculator || !medal) return []
    try {
      return calculator.getSameTypePrereqMedalIds(medal)
    } catch {
      return []
    }
  }, [calculator, medal])

  const earliestCountingYear = useMemo(() => {
    if (!calculator || !medal) return null
    try {
      return calculator.getEarliestCountingYearForMedal(medal)
    } catch {
      return null
    }
  }, [calculator, medal])

  const requireCurrentYear = useMemo(() => {
    if (!medal?.requirements) return false
    return medal.requirements.some(req =>
      req?.type === 'sustained_achievement' &&
      (req.mustIncludeCurrentYear === true || medal.mustIncludeCurrentYear === true || (Array.isArray(req.references) && req.references.length > 0) || sameTypePrereqs.length > 0)
    )
  }, [medal, sameTypePrereqs])

  const selectedYear = allowManual
    ? (year === '' ? '' : Number(year))
    : (eligibleYears.length <= 1 ? (eligibleYears[0] ?? '') : (year || (eligibleYears[0] ?? '')))

  const yearOutOfBounds = allowManual && (!Number.isFinite(selectedYear) || typeof birthYear !== 'number' || selectedYear < birthYear || selectedYear > nowYear)
  const yearTooEarly = allowManual && (typeof earliestCountingYear === 'number') && Number.isFinite(selectedYear) && (selectedYear < earliestCountingYear)
  const wrongCurrentReq = allowManual && requireCurrentYear && Number.isFinite(selectedYear) && (selectedYear !== nowYear)
  const yearIsValid = allowManual ? (!yearOutOfBounds && !yearTooEarly && !wrongCurrentReq) : (selectedYear !== '')

  const prereqsMet = useMemo(() => {
    if (!allowManual) return true
    if (!calculator || !medal?.id || !Number.isFinite(selectedYear)) return false
    try {
      const res = calculator.checkPrerequisites(medal, selectedYear)
      return !!res?.allMet
    } catch {
      return false
    }
  }, [allowManual, calculator, medal, selectedYear])

  const canUnlock = allowManual ? (yearIsValid && prereqsMet) : (eligibleYears.length > 0 && selectedYear !== '')

  const doUnlock = async () => {
    if (!canUnlock) return
    const y = allowManual ? selectedYear : Number(selectedYear)
    const unlockedDate = `${y}-12-31`
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
      {allowManual ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canUnlock) return
            doUnlock()
          }}
          noValidate
        >
          <div>
            <label htmlFor="unlock-year" className="field-label mb-2">
              Year
            </label>
            <input
              id="unlock-year"
              type="number"
              inputMode="numeric"
              className="input py-3"
              min={birthYear ?? undefined}
              max={nowYear}
              list="eligible-years"
              value={year}
              onChange={(e) => {
                const v = e.target.value
                setYear(v === '' ? '' : Number(v))
              }}
              aria-invalid={(!canUnlock) || undefined}
              aria-describedby="unlock-year-hint"
            />
            <datalist id="eligible-years">
              {eligibleYears.map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
            <p id="unlock-year-hint" className="field-hint">
              Enter a year between {birthYear} and {nowYear}. Prerequisites must be met for that year.
            </p>
            {yearOutOfBounds && (
              <p className="field-hint text-red-600 dark:text-red-400" role="status">
                Invalid year. Please choose between {birthYear} and {nowYear}.
              </p>
            )}
            {yearTooEarly && (
              <p className="field-hint text-red-600 dark:text-red-400" role="status">
                This medal cannot be unlocked before {earliestCountingYear}.
              </p>
            )}
            {wrongCurrentReq && (
              <p className="field-hint text-red-600 dark:text-red-400" role="status">
                This medal requires the current year to be selected.
              </p>
            )}
            {yearIsValid && !prereqsMet && (
              <p className="field-hint text-red-600 dark:text-red-400" role="status">
                Prerequisites are not met for the selected year.
              </p>
            )}
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
      ) : eligibleYears.length === 0 ? (
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
            if (selectedYear !== '') doUnlock()
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
            <button type="submit" className="btn btn-primary min-h-[44px]" disabled={selectedYear === ''}>
              Unlock
            </button>
          </div>
        </form>
      )}
    </MobileBottomSheet>
  )
}
