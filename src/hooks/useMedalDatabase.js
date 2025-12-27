import { useContext } from 'react'
import { MedalContext, defaultMedalContextValue } from '../contexts/medalContext'

/**
 * Custom hook to access medal database
 * Usage: const { medalDatabase, loading, error } = useMedalDatabase()
 */
export function useMedalDatabase() {
  const context = useContext(MedalContext)
  
  const isProd = globalThis.process?.env?.NODE_ENV === 'production'
  if (context === defaultMedalContextValue && isProd) {
    throw new Error('useMedalDatabase must be used within MedalProvider')
  }
  
  return context
}
