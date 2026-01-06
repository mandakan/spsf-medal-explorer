import React, { useCallback, useMemo, useState } from 'react'
import { OnboardingTourContext } from './OnboardingTourContextValue'
import { getTourId, isTourSeen, setTourLastSeen } from '../utils/onboardingTour'

const TOUR_STEPS = {
  medals: [
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
  ],
  'tree-view': [
    {
      id: 'welcome',
      title: 'Välkommen till trädvyn',
      body: 'Se alla märken i ett interaktivt träd med kopplingar och progression.',
      target: null,
    },
    {
      id: 'canvas',
      title: 'Interaktiv canvas',
      body: 'Dra för att panorera, nyp eller använd zoomknapparna för att zooma.',
      target: '[data-tour="tree-canvas"]',
    },
    {
      id: 'zoom',
      title: 'Zoomkontroller',
      body: 'Använd dessa knappar för att zooma in, ut eller återställa vyn.',
      target: '[data-tour="zoom-controls"]',
    },
    {
      id: 'legend',
      title: 'Teckenförklaring',
      body: 'Färgerna visar status: grönt för upplåsta, gult för uppnåeliga, grått för låsta.',
      target: '[data-tour="tree-legend"]',
    },
    {
      id: 'actions',
      title: 'Åtgärdsmeny',
      body: 'Här hittar du fler alternativ: exportera, växla visualisering och öppna helskärm.',
      target: '[data-tour="tree-actions"]',
    },
    {
      id: 'node',
      title: 'Klicka på märken',
      body: 'Tryck på ett märke i trädet för att se detaljer. Årsbrickor visar hur många år som krävs.',
      target: '[data-tour="tree-canvas"]',
    },
  ],
}

export function OnboardingTourProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [currentTourType, setCurrentTourType] = useState('medals')

  const tourId = getTourId(currentTourType)
  const steps = TOUR_STEPS[currentTourType] || TOUR_STEPS.medals

  const start = useCallback((tourType = 'medals') => {
    setCurrentTourType(tourType)
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
      const last = steps.length - 1
      if (i >= last) return i
      return i + 1
    })
  }, [steps.length])

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  const canAutoStart = useCallback((tourType = 'medals') => {
    const id = getTourId(tourType)
    return !isTourSeen(id)
  }, [])

  const api = useMemo(
    () => ({
      open,
      stepIndex,
      steps,
      start,
      close,
      complete,
      next,
      back,
      canAutoStart,
      tourId,
      currentTourType,
    }),
    [open, stepIndex, steps, start, close, complete, next, back, canAutoStart, tourId, currentTourType]
  )

  return <OnboardingTourContext.Provider value={api}>{children}</OnboardingTourContext.Provider>
}
