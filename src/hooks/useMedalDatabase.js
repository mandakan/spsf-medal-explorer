import { useContext } from 'react'
import { MedalContext } from '../contexts/MedalContext'

/**
 * Custom hook to access medal database
 * Usage: const { medalDatabase, loading, error } = useMedalDatabase()
 */
export function useMedalDatabase() {
  const context = useContext(MedalContext)
  
  if (!context) {
    throw new Error('useMedalDatabase must be used within MedalProvider')
  }
  
  return context
}
