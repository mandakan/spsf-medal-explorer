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
      try {
        // Feature detection
        const hasIndexedDB = isIndexedDBAvailable()
        const storageType = await detectStorageType()

        if (cancelled) return

        // New user or already on IndexedDB
        if (storageType === 'none' || storageType === 'indexeddb') {
          if (hasIndexedDB) {
            try {
              const idbManager = new IndexedDBManager()
              await idbManager.init()
              if (!cancelled) setManager(idbManager)
            } catch (idbError) {
              // IndexedDB init failed, fall back to localStorage
              console.error('IndexedDB initialization failed, falling back to localStorage:', idbError)
              const localManager = new LocalStorageDataManager()
              if (!cancelled) setManager(localManager)
            }
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
            try {
              const idbManager = new IndexedDBManager()
              await idbManager.init()
              if (!cancelled) setManager(idbManager)
            } catch (idbError) {
              // IndexedDB init failed after migration, fall back to localStorage
              console.error('IndexedDB initialization failed after migration, falling back to localStorage:', idbError)
              const localManager = new LocalStorageDataManager()
              if (!cancelled) setManager(localManager)
            }
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
      } catch (error) {
        // Catastrophic failure - fall back to localStorage as last resort
        console.error('Storage initialization failed, falling back to localStorage:', error)
        if (!cancelled) {
          try {
            const localManager = new LocalStorageDataManager()
            setManager(localManager)
          } catch (fallbackError) {
            console.error('Fatal: even localStorage fallback failed:', fallbackError)
            // Set a dummy manager to prevent infinite loading
            setManager(new LocalStorageDataManager())
          }
        }
      }
    }

    initStorage()

    return () => {
      cancelled = true
    }
  }, [])

  return { manager, migrating, migrationProgress }
}
