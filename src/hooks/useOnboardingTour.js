import { useContext } from 'react'
import { OnboardingTourContext } from '../contexts/OnboardingTourContextValue'

export function useOnboardingTour() {
  const ctx = useContext(OnboardingTourContext)
  if (!ctx) {
    throw new Error('useOnboardingTour must be used within OnboardingTourProvider')
  }
  return ctx
}
