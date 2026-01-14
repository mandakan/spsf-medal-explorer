import { useContext } from 'react'
import { OnboardingTourContext } from '../contexts/OnboardingTourContextValue'

/** No-op API returned when hook is used outside provider in production */
const noopApi = {
  open: false,
  stepIndex: 0,
  steps: [],
  start: () => {},
  close: () => {},
  complete: () => {},
  next: () => {},
  back: () => {},
  canAutoStart: () => false,
  tourId: '',
  currentTourType: 'medals',
}

export function useOnboardingTour() {
  const ctx = useContext(OnboardingTourContext)
  if (!ctx) {
    // In production, return no-op API to avoid crashing the app
    // eslint-disable-next-line no-undef
    const isProduction = typeof process !== 'undefined' && process.env.NODE_ENV === 'production'
    if (isProduction) {
      return noopApi
    }
    throw new Error('useOnboardingTour must be used within OnboardingTourProvider')
  }
  return ctx
}
