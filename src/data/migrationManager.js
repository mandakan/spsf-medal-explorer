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
  try {
    const manager = new IndexedDBManager()
    await manager.init()
    const profiles = await manager.getAllProfiles()
    manager.close()
    return profiles && profiles.length > 0
  } catch {
    return false
  }
}

/**
 * Migrate data from localStorage to IndexedDB
 * @param {function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, profilesMigrated?: number, error?: string}>}
 */
export async function migrateFromLocalStorage(onProgress) {
  try {
    onProgress?.({ stage: 'loading', percent: 0 })

    // Load from localStorage
    const localManager = new LocalStorageDataManager()
    const profiles = await localManager.getAllProfiles()

    onProgress?.({ stage: 'saving', percent: 33 })

    // Save to IndexedDB
    const idbManager = new IndexedDBManager()
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
  }
}

/**
 * Verify migration was successful
 * @returns {Promise<{complete: boolean, profileCount: number}>}
 */
export async function verifyMigration() {
  try {
    const idbManager = new IndexedDBManager()
    await idbManager.init()

    const migrationComplete = await idbManager.getMetadata('migration_complete')
    const profiles = await idbManager.getAllProfiles()

    idbManager.close()

    return {
      complete: !!migrationComplete,
      profileCount: profiles.length,
    }
  } catch {
    return {
      complete: false,
      profileCount: 0,
    }
  }
}
