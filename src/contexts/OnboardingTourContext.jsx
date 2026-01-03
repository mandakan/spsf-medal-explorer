import React, { useCallback, useMemo, useState } from 'react'
import { OnboardingTourContext } from './OnboardingTourContextValue'
import { getTourId, isTourSeen, setTourLastSeen } from '../utils/onboardingTour'

const STEPS = [
  {
    id: 'welcome',
    title: 'Snabbguide',
    body: 'Sök, filtrera och öppna detaljer för att se krav och status.',
    target: null,
  },
  {
    id: 'search',
    title: 'Sök',
    body: 'Skriv för att filtrera märken.',
    target: '[data-tour="medals-search"]',
  },
  {
    id: 'chips',
    title: 'Snabbfilter',
    body: 'Tryck på en status för att filtrera snabbt.',
    target: '[data-tour="chip-unlocked"]',
  },
  {
    id: 'filters',
    title: 'Fler filter',
    body: 'Öppna filterpanelen för fler val.',
    target: '[data-tour="open-filters"], [data-tour="filter-panel"]',
  },
  {
    id: 'open',
    title: 'Öppna ett märke',
    body: 'Tryck på ett märke i listan för att se detaljer. Lämna guiden öppen och tryck sedan Nästa.',
    target: '[data-tour="medal-row-0"]',
    requiresTarget: true,
    autoAdvanceToNextOn: '[data-tour="medal-detail-panel"]',
  },
  {
    id: 'detail',
    title: 'Detaljer',
    body: 'När detaljvyn är öppen ser du krav, förhandskrav och status. Tryck Nästa för att avsluta.',
    target: '[data-tour="medal-detail-panel"]',
    requiresTarget: true,
  },
]

export function OnboardingTourProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const tourId = getTourId()

  const start = useCallback(() => {
    setStepIndex(0)
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const complete = useCallback(() => {
    setTourLastSeen(tourId)
    setOpen(false)
  }, [tourId])

  const next = useCallback(() => {
    setStepIndex((i) => {
      const last = STEPS.length - 1
      if (i >= last) return i
      return i + 1
    })
  }, [])

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const canAutoStart = useCallback(() => {
    return !isTourSeen(tourId)
  }, [tourId])

  const api = useMemo(
    () => ({
      open,
      stepIndex,
      steps: STEPS,
      start,
      close,
      complete,
      next,
      back,
      canAutoStart,
      tourId,
    }),
    [open, stepIndex, start, close, complete, next, back, canAutoStart, tourId]
  )

  return <OnboardingTourContext.Provider value={api}>{children}</OnboardingTourContext.Provider>
}
