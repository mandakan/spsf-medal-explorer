import { IndexedDBManager } from './indexedDBManager'
import { LocalStorageDataManager } from './localStorage'

/**
 * Detect which storage type is currently in use
 * @returns {Promise<'indexeddb' | 'localstorage' | 'none'>}
 */
export async function detectStorageType() {
  // Check localStorage for existing data
  const hasLocalStorageData = localStorage.getItem('medal-app-data') !== null

  // Check IndexedDB for existing data
  const hasIndexedDBData = await checkIndexedDBData()

  if (hasIndexedDBData) return 'indexeddb'
  if (hasLocalStorageData) return 'localstorage'
  return 'none' // New user
}

/**
 * Check if IndexedDB has data
 * @returns {Promise<boolean>}
 */
async function checkIndexedDBData() {
  let manager
  try {
    manager = new IndexedDBManager()
    await manager.init()
    const profiles = await manager.getAllProfiles()
    return profiles && profiles.length > 0
  } catch {
    return false
  } finally {
    try {
      manager?.close?.()
    } catch {
      // ignore close errors
    }
  }
}

/**
 * Migrate data from localStorage to IndexedDB
 * @param {function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, profilesMigrated?: number, error?: string}>}
 */
export async function migrateFromLocalStorage(onProgress) {
  let idbManager
  try {
    onProgress?.({ stage: 'loading', percent: 0 })

    // Load from localStorage
    const localManager = new LocalStorageDataManager()
    const profiles = await localManager.getAllProfiles()

    onProgress?.({ stage: 'saving', percent: 33 })

    // Save to IndexedDB
    idbManager = new IndexedDBManager()
    await idbManager.init()

    for (let i = 0; i < profiles.length; i++) {
      await idbManager.saveUserProfile(profiles[i])
      onProgress?.({
        stage: 'saving',
        percent: 33 + ((i + 1) / profiles.length) * 34,
      })
    }

    // Mark migration complete
    await idbManager.setMetadata('migration_complete', true)
    await idbManager.setMetadata('migration_date', new Date().toISOString())
    await idbManager.setMetadata('migrated_from', 'localstorage')

    onProgress?.({ stage: 'verifying', percent: 75 })

    // Verify migration
    const migratedProfiles = await idbManager.getAllProfiles()
    if (migratedProfiles.length !== profiles.length) {
      throw new Error('Migration verification failed: profile count mismatch')
    }

    // Clean up old localStorage data after successful migration
    try {
      localStorage.removeItem('medal-app-data')
      await idbManager.setMetadata('localstorage_cleaned', true)
    } catch (cleanupError) {
      // Log but don't fail migration if cleanup fails
      console.warn('[migrationManager] Failed to clean up localStorage:', cleanupError)
    }

    onProgress?.({ stage: 'complete', percent: 100 })

    return {
      success: true,
      profilesMigrated: profiles.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  } finally {
    try {
      idbManager?.close?.()
    } catch {
      // ignore close errors
    }
  }
}

/**
 * Verify migration was successful
 * @returns {Promise<{complete: boolean, profileCount: number}>}
 */
export async function verifyMigration() {
  let idbManager
  try {
    idbManager = new IndexedDBManager()
    await idbManager.init()

    const migrationComplete = await idbManager.getMetadata('migration_complete')
    const profiles = await idbManager.getAllProfiles()

    return {
      complete: !!migrationComplete,
      profileCount: profiles.length,
    }
  } catch {
    return {
      complete: false,
      profileCount: 0,
    }
  } finally {
    try {
      idbManager?.close?.()
    } catch {
      // ignore close errors
    }
  }
}
