import { useState, useEffect } from 'react'
import { IndexedDBManager } from '../data/indexedDBManager'
import { LocalStorageDataManager } from '../data/localStorage'
import { isIndexedDBAvailable } from '../utils/storageDetection'
import { detectStorageType, migrateFromLocalStorage } from '../data/migrationManager'

/**
 * Hook providing appropriate storage manager
 * Automatically migrates from localStorage to IndexedDB
 * @returns {{manager: DataManager|null, migrating: boolean, migrationProgress: object|null}}
 */
export function useStorage() {
  const [manager, setManager] = useState(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function initStorage() {
      // Feature detection
      const hasIndexedDB = isIndexedDBAvailable()
      const storageType = await detectStorageType()

      if (cancelled) return

      // New user or already on IndexedDB
      if (storageType === 'none' || storageType === 'indexeddb') {
        if (hasIndexedDB) {
          const idbManager = new IndexedDBManager()
          await idbManager.init()
          if (!cancelled) setManager(idbManager)
        } else {
          // Fallback to localStorage
          const localManager = new LocalStorageDataManager()
          if (!cancelled) setManager(localManager)
        }
        return
      }

      // Has localStorage data, needs migration
      if (storageType === 'localstorage' && hasIndexedDB) {
        if (!cancelled) setMigrating(true)

        const result = await migrateFromLocalStorage((progress) => {
          if (!cancelled) setMigrationProgress(progress)
        })

        if (cancelled) return
        setMigrating(false)

        if (result.success) {
          const idbManager = new IndexedDBManager()
          await idbManager.init()
          if (!cancelled) setManager(idbManager)
        } else {
          // Migration failed, use localStorage
          console.error('Migration failed:', result.error)
          const localManager = new LocalStorageDataManager()
          if (!cancelled) setManager(localManager)
        }
      } else {
        // No IndexedDB support, use localStorage
        const localManager = new LocalStorageDataManager()
        if (!cancelled) setManager(localManager)
      }
    }

    initStorage()

    return () => {
      cancelled = true
    }
  }, [])

  return { manager, migrating, migrationProgress }
}
