import { useContext } from 'react'
import { ProfileContext } from '../contexts/ProfileContext.jsx'

/**
 * Custom hook to access profile operations
 */
export function useProfile() {
  const context = useContext(ProfileContext)

  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }

  return context
}
