import React, { createContext, useCallback, useMemo, useState } from 'react'
import { getTourId, isTourSeen, setTourLastSeen } from '../utils/onboardingTour'

export const OnboardingTourContext = createContext(null)

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
    body: 'Tryck på ett märke för att se detaljer.',
    target: '[data-tour="medal-row-0"]',
  },
  {
    id: 'detail',
    title: 'Detaljer',
    body: 'Här ser du krav, förhandskrav och status.',
    target: '[data-tour="medal-detail-title"]',
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
