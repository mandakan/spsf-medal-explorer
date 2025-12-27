import { useContext } from 'react'
import { MedalContext, defaultMedalContextValue } from '../contexts/medalContext'

/**
 * Custom hook to access medal database
 * Usage: const { medalDatabase, loading, error } = useMedalDatabase()
 */
export function useMedalDatabase() {
  const context = useContext(MedalContext)
  
  if (context === defaultMedalContextValue && import.meta.env.PROD) {
    throw new Error('useMedalDatabase must be used within MedalProvider')
  }
  
  return context
}
