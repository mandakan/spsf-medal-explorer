import { useMemo } from 'react'
import { LocalStorageDataManager } from '../data/localStorage'

/**
 * Provides a memoized storage manager instance
 */
export function useStorage() {
  const storage = useMemo(() => new LocalStorageDataManager(), [])
  return storage
}
