import React, { useMemo, useState, useCallback } from 'react'
import MobileBottomSheet from './MobileBottomSheet'
import { useMedalCalculator } from '../hooks/useMedalCalculator'
import { useProfile } from '../hooks/useProfile'

export default function UnlockMedalDialog({ medal, open, onClose, preferredYear = null }) {
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

  

  const earliestCountingYear = useMemo(() => {
    if (!calculator || !medal) return null
    try {
      return calculator.getEarliestCountingYearForMedal(medal)
    } catch {
      return null
    }
  }, [calculator, medal])

  const minimalSustainedYear = useMemo(() => {
    if (!calculator || !medal) return null
    try {
      return calculator.getMinimalUnlockYearForSustained(medal)
    } catch {
      return null
    }
  }, [calculator, medal])

  const enforceSustainedCurrent = !!currentProfile?.features?.enforceCurrentYearForSustained
  const hasSustainedReq = Array.isArray(medal?.requirements) && medal.requirements.some(r => r?.type === 'sustained_achievement')




  const computeDefaultYear = useCallback(() => {
    if (!calculator || !medal) return ''
    // If sustained requires current year, prefer it
    if (enforceSustainedCurrent && hasSustainedReq) {
      if (!allowManual) {
        if (eligibleYears?.includes(nowYear)) return nowYear
      } else {
        return nowYear
      }
    }

    if (!allowManual) {
      if (!eligibleYears || eligibleYears.length === 0) return ''
      return Math.min(...eligibleYears)
    }

    // Manual mode: compute earliest valid year that satisfies rules and prerequisites
    const minRuleYear = (() => {
      const vals = []
      if (typeof earliestCountingYear === 'number') vals.push(earliestCountingYear)
      if (typeof minimalSustainedYear === 'number') vals.push(minimalSustainedYear)
      return vals.length ? Math.max(...vals) : null
    })()

    const start = Math.max(
      Number.isFinite(birthYear) ? birthYear : -Infinity,
      Number.isFinite(minRuleYear) ? minRuleYear : -Infinity
    )
    const firstCandidate = Number.isFinite(start) ? start : nowYear

    for (let y = firstCandidate; y <= nowYear; y++) {
      try {
        const res = calculator.checkPrerequisites(medal, y)
        if (res?.allMet) return y
      } catch {
        // ignore and continue
      }
    }

    if (enforceSustainedCurrent && hasSustainedReq) return nowYear
    return ''
  }, [
    allowManual,
    calculator,
    medal,
    eligibleYears,
    earliestCountingYear,
    minimalSustainedYear,
    birthYear,
    nowYear,
    enforceSustainedCurrent,
    hasSustainedReq,
  ])

  const suggestedYear = useMemo(() => {
    if (!open) return ''
    // If a preferred year is provided, use it
    if (preferredYear != null && Number.isFinite(preferredYear)) {
      return preferredYear
    }
    const y = computeDefaultYear()
    return (y !== '' && Number.isFinite(y)) ? y : ''
  }, [open, preferredYear, computeDefaultYear])

  const manualYearValue = allowManual ? (year === '' ? suggestedYear : year) : null

  const selectedYear = allowManual
    ? ((manualYearValue === '' ? '' : Number(manualYearValue)))
    : (eligibleYears.length <= 1 ? (eligibleYears[0] ?? '') : (year || (eligibleYears[0] ?? '')))

  const yearOutOfBounds =
    allowManual &&
    (!Number.isFinite(selectedYear) ||
      typeof birthYear !== 'number' ||
      selectedYear < birthYear ||
      selectedYear > nowYear)

  // If feature is ON and medal has sustained achievement, selected year must be the real current year
  const wrongCurrentReq =
    enforceSustainedCurrent &&
    hasSustainedReq &&
    Number.isFinite(selectedYear) &&
    (selectedYear !== nowYear)

  // Consolidate rule-based minimum year: max of earliestCountingYear and sustained minimal year
  const effectiveRuleMinYear = (() => {
    const vals = []
    if (typeof earliestCountingYear === 'number') vals.push(earliestCountingYear)
    if (typeof minimalSustainedYear === 'number') vals.push(minimalSustainedYear)
    if (vals.length === 0) return null
    return Math.max(...vals)
  })()

  const yearTooEarlyByRules =
    allowManual &&
    Number.isFinite(selectedYear) &&
    (typeof effectiveRuleMinYear === 'number') &&
    (selectedYear < effectiveRuleMinYear)

  const yearIsValid = allowManual
    ? (!yearOutOfBounds && !wrongCurrentReq && !yearTooEarlyByRules)
    : (selectedYear !== '')

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
      title={`Lås upp ${medal?.displayName || 'medalj'}`}
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
              År
              {typeof effectiveRuleMinYear === 'number' && (
                <span className="ml-2 text-xs text-muted-foreground">(Tidigast: {effectiveRuleMinYear})</span>
              )}
            </label>
            <input
              id="unlock-year"
              type="number"
              inputMode="numeric"
              className="input py-3 mb-2"
              min={birthYear ?? undefined}
              max={nowYear}
              list="eligible-years"
              value={manualYearValue}
              onChange={(e) => {
                const v = e.target.value
                setYear(v === '' ? '' : Number(v))
              }}
              aria-invalid={(() => {
                if (!allowManual) return undefined
                // Only mark invalid when an error message is actually shown
                if (year === '' || !Number.isFinite(selectedYear)) return undefined
                if (yearOutOfBounds || wrongCurrentReq || yearTooEarlyByRules || (yearIsValid && !prereqsMet)) return true
                return undefined
              })()}
              aria-describedby="unlock-year-hint"
            />
            <datalist id="eligible-years">
              {eligibleYears.map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
            <p id="unlock-year-hint" className="field-hint mt-2">
              Välj ett år mellan {birthYear} och {nowYear}. Vi stämmer av med förhandskraven för året.
            </p>
            {(() => {
              if (!allowManual) return null
              // Don’t show an error while the field is empty or NaN
              if (year === '' || !Number.isFinite(selectedYear)) return null

              let msg = null
              if (yearOutOfBounds) {
                msg = `Året måste vara mellan ${birthYear} och ${nowYear}.`
              } else if (wrongCurrentReq) {
                msg = 'Det här märket kräver att innevarande år väljs.'
              } else if (yearTooEarlyByRules) {
                msg = `Tidigaste året du kan låsa upp märket är ${effectiveRuleMinYear}.`
              } else if (!prereqsMet) {
                msg = `Förhandskraven är inte mötta för ${selectedYear}.`
              }

              return msg ? (
                <p className="field-hint mt-2 text-danger" role="status">
                  {msg}
                </p>
              ) : null
            })()}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-muted min-h-[44px]" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="btn btn-primary min-h-[44px]" disabled={!canUnlock}>
              Lås upp
            </button>
          </div>
        </form>
      ) : eligibleYears.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Inga giltiga år funna.</p>
          <div className="flex justify-end">
            <button type="button" className="btn btn-primary min-h-[44px]" onClick={onClose}>
              Stäng
            </button>
          </div>
        </div>
      ) : eligibleYears.length === 1 ? (
        <div className="space-y-4">
          <p className="text-sm">
            Lås upp för: <strong>{eligibleYears[0]}</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-muted min-h-[44px]" onClick={onClose}>
              Avbryt
            </button>
            <button type="button" className="btn btn-primary min-h-[44px]" onClick={doUnlock}>
              Lås upp
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
              År
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
              Avbryt
            </button>
            <button type="submit" className="btn btn-primary min-h-[44px]" disabled={selectedYear === ''}>
              Lås upp
            </button>
          </div>
        </form>
      )}
    </MobileBottomSheet>
  )
}
