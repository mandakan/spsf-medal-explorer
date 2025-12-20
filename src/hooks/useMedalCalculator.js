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
    if (!medalDatabase || !currentProfile) {
      return null
    }

    return new MedalCalculator(medalDatabase, currentProfile)
  }, [medalDatabase, currentProfile])
}

/**
 * Hook to get medal status
 */
export function useMedalStatus(medalId) {
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
    if (!calculator) return { unlocked: [], achievable: [], locked: [] }
    return calculator.evaluateAllMedals()
  }, [calculator])
}
