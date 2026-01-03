import { useMemo } from 'react'
import { MedalCalculator } from '../logic/calculator'
import { useMedalDatabase } from './useMedalDatabase'
import { useProfile } from './useProfile'

/**
 * Custom hook for medal calculator
 * Memoizes results for performance
 */
export function useMedalCalculator() {
  const { medalDatabase } = useMedalDatabase()
  const { currentProfile } = useProfile()

  return useMemo(() => {
    if (!medalDatabase) {
      return null
    }
    const fallbackProfile = { unlockedMedals: [], prerequisites: [] }
    const profile = currentProfile ?? fallbackProfile
    return new MedalCalculator(medalDatabase, profile)
  }, [medalDatabase, currentProfile])
}

/**
 * Hook to get medal status
 */
function useMedalStatus(medalId) {
  const calculator = useMedalCalculator()

  return useMemo(() => {
    if (!calculator) return null
    return calculator.evaluateMedal(medalId)
  }, [calculator, medalId])
}

/**
 * Hook to get all medal statuses
 */
export function useAllMedalStatuses() {
  const calculator = useMedalCalculator()

  return useMemo(() => {
    if (!calculator) return { unlocked: [], eligible: [], available: [], locked: [] }
    return calculator.evaluateAllMedals()
  }, [calculator])
}
