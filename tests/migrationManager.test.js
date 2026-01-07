import {
  detectStorageType,
  migrateFromLocalStorage,
  verifyMigration,
} from '../src/data/migrationManager'
import { LocalStorageDataManager } from '../src/data/localStorage'
import { IndexedDBManager } from '../src/data/indexedDBManager'

function deleteDb(name) {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name)
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })
}

describe('migrationManager', () => {
  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear()

    // Clear IndexedDB database used by IndexedDBManager in jsdom
    await deleteDb('medal-app-main')
  })

  describe('detectStorageType', () => {
    it('returns none for new user with no data', async () => {
      const type = await detectStorageType()
      expect(type).toBe('none')
    })

    it('returns localstorage when localStorage has data', async () => {
      localStorage.setItem('medal-app-data', JSON.stringify({ version: '2.0', profiles: [] }))
      const type = await detectStorageType()
      expect(type).toBe('localstorage')
    })

    it(
      'returns indexeddb when IndexedDB has data',
      async () => {
        const manager = new IndexedDBManager()
        await manager.init()
        await manager.saveUserProfile({
          userId: 'test-user',
          displayName: 'Test',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          unlockedMedals: [],
          prerequisites: [],
          notifications: true,
        })
        manager.close()

        const type = await detectStorageType()
        expect(type).toBe('indexeddb')
      },
      10000
    )

    it(
      'prefers indexeddb over localstorage when both have data',
      async () => {
        // Add localStorage data
        localStorage.setItem('medal-app-data', JSON.stringify({ version: '2.0', profiles: [] }))

        // Add IndexedDB data
        const manager = new IndexedDBManager()
        await manager.init()
        await manager.saveUserProfile({
          userId: 'test-user',
          displayName: 'Test',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          unlockedMedals: [],
          prerequisites: [],
          notifications: true,
        })
        manager.close()

        const type = await detectStorageType()
        expect(type).toBe('indexeddb')
      },
      10000
    )
  })

  describe('migrateFromLocalStorage', () => {
    it(
      'migrates profiles from localStorage to IndexedDB',
      async () => {
        // Setup localStorage with test data
        const localManager = new LocalStorageDataManager()
        await localManager.saveUserProfile({
          userId: 'user-1',
          displayName: 'User One',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          unlockedMedals: [],
          prerequisites: [],
          notifications: true,
        })
        await localManager.saveUserProfile({
          userId: 'user-2',
          displayName: 'User Two',
          dateOfBirth: '1985-05-15',
          sex: 'female',
          unlockedMedals: [],
          prerequisites: [],
          notifications: false,
        })

        // Track progress
        const progressStages = []
        const onProgress = (progress) => {
          progressStages.push(progress.stage)
        }

        // Perform migration
        const result = await migrateFromLocalStorage(onProgress)

        // Verify success
        expect(result.success).toBe(true)
        expect(result.profilesMigrated).toBe(2)

        // Verify progress stages
        expect(progressStages).toContain('loading')
        expect(progressStages).toContain('saving')
        expect(progressStages).toContain('verifying')
        expect(progressStages).toContain('complete')

        // Verify data in IndexedDB
        const idbManager = new IndexedDBManager()
        await idbManager.init()
        const profiles = await idbManager.getAllProfiles()
        expect(profiles.length).toBe(2)

        const user1 = profiles.find((p) => p.userId === 'user-1')
        expect(user1.displayName).toBe('User One')

        const user2 = profiles.find((p) => p.userId === 'user-2')
        expect(user2.displayName).toBe('User Two')

        idbManager.close()
      },
      10000
    )

    it(
      'migrates profiles with achievements',
      async () => {
        const localManager = new LocalStorageDataManager()
        await localManager.saveUserProfile({
          userId: 'user-1',
          displayName: 'User One',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          unlockedMedals: [{ medalId: 'medal-1', unlockedDate: '2025-01-01' }],
          prerequisites: [
            {
              id: 'ach-1',
              type: 'precision_series',
              year: 2025,
              weaponGroup: 'A',
              points: 25,
            },
          ],
          notifications: true,
        })

        const result = await migrateFromLocalStorage()
        expect(result.success).toBe(true)

        const idbManager = new IndexedDBManager()
        await idbManager.init()
        const profile = await idbManager.getUserProfile('user-1')
        expect(profile.unlockedMedals.length).toBe(1)
        expect(profile.prerequisites.length).toBe(1)
        expect(profile.prerequisites[0].id).toBe('ach-1')
        idbManager.close()
      },
      10000
    )

    it(
      'sets migration metadata',
      async () => {
        const localManager = new LocalStorageDataManager()
        await localManager.saveUserProfile({
          userId: 'user-1',
          displayName: 'User One',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          unlockedMedals: [],
          prerequisites: [],
          notifications: true,
        })

        await migrateFromLocalStorage()

        const idbManager = new IndexedDBManager()
        await idbManager.init()

        const migrationComplete = await idbManager.getMetadata('migration_complete')
        const migrationDate = await idbManager.getMetadata('migration_date')
        const migratedFrom = await idbManager.getMetadata('migrated_from')

        expect(migrationComplete).toBe(true)
        expect(migrationDate).toBeTruthy()
        expect(migratedFrom).toBe('localstorage')

        idbManager.close()
      },
      10000
    )

    it('handles migration failure gracefully', async () => {
      // Setup invalid data that will fail migration
      localStorage.setItem('medal-app-data', 'invalid-json')

      const result = await migrateFromLocalStorage()

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it(
      'calls onProgress callback with progress updates',
      async () => {
        const localManager = new LocalStorageDataManager()
        await localManager.saveUserProfile({
          userId: 'user-1',
          displayName: 'User One',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          unlockedMedals: [],
          prerequisites: [],
          notifications: true,
        })

        const progressUpdates = []
        const onProgress = (progress) => {
          progressUpdates.push(progress)
        }

        await migrateFromLocalStorage(onProgress)

        expect(progressUpdates.length).toBeGreaterThan(0)
        expect(progressUpdates[0].stage).toBe('loading')
        expect(progressUpdates[0].percent).toBe(0)

        const lastUpdate = progressUpdates[progressUpdates.length - 1]
        expect(lastUpdate.stage).toBe('complete')
        expect(lastUpdate.percent).toBe(100)
      },
      10000
    )

    it(
      'handles migration with no profiles',
      async () => {
        new LocalStorageDataManager() // Initialize empty storage

        const result = await migrateFromLocalStorage()

        expect(result.success).toBe(true)
        expect(result.profilesMigrated).toBe(0)
      },
      10000
    )
  })

  describe('verifyMigration', () => {
    it(
      'returns complete: false when no migration has occurred',
      async () => {
        const result = await verifyMigration()
        expect(result.complete).toBe(false)
        expect(result.profileCount).toBe(0)
      },
      10000
    )

    it(
      'returns complete: true after successful migration',
      async () => {
        const localManager = new LocalStorageDataManager()
        await localManager.saveUserProfile({
          userId: 'user-1',
          displayName: 'User One',
          dateOfBirth: '1990-01-01',
          sex: 'male',
          unlockedMedals: [],
          prerequisites: [],
          notifications: true,
        })

        await migrateFromLocalStorage()

        const result = await verifyMigration()
        expect(result.complete).toBe(true)
        expect(result.profileCount).toBe(1)
      },
      10000
    )

    it('handles verification errors gracefully', async () => {
      // Create a scenario where IndexedDB can't be opened
      const original = global.indexedDB
      global.indexedDB = {
        ...original,
        open: () => {
          throw new Error('IndexedDB open failed')
        },
      }

      const result = await verifyMigration()
      expect(result.complete).toBe(false)
      expect(result.profileCount).toBe(0)

      global.indexedDB = original
    })
  })

  describe('integration: full migration flow', () => {
    it(
      'performs complete migration from localStorage to IndexedDB',
      async () => {
        // Step 1: Create initial data in localStorage
        const localManager = new LocalStorageDataManager()
        const testProfile = {
          userId: 'integration-user',
          displayName: 'Integration Test User',
          dateOfBirth: '1992-03-20',
          sex: 'male',
          unlockedMedals: [
            { medalId: 'medal-1', unlockedDate: '2025-01-01' },
            { medalId: 'medal-2', unlockedDate: '2025-01-15' },
          ],
          prerequisites: [
            {
              id: 'ach-1',
              type: 'precision_series',
              year: 2025,
              weaponGroup: 'A',
              points: 30,
            },
            {
              id: 'ach-2',
              type: 'precision_series',
              year: 2025,
              weaponGroup: 'B',
              points: 35,
            },
          ],
          notifications: true,
          features: {
            allowManualUnlock: true,
            enforceCurrentYearForSustained: false,
          },
        }
        await localManager.saveUserProfile(testProfile)

        // Step 2: Detect storage type (should be localstorage)
        const initialType = await detectStorageType()
        expect(initialType).toBe('localstorage')

        // Step 3: Perform migration
        const migrationResult = await migrateFromLocalStorage()
        expect(migrationResult.success).toBe(true)
        expect(migrationResult.profilesMigrated).toBe(1)

        // Step 4: Detect storage type (should now be indexeddb)
        const newType = await detectStorageType()
        expect(newType).toBe('indexeddb')

        // Step 5: Verify migration
        const verification = await verifyMigration()
        expect(verification.complete).toBe(true)
        expect(verification.profileCount).toBe(1)

        // Step 6: Verify all data was migrated correctly
        const idbManager = new IndexedDBManager()
        await idbManager.init()
        const migratedProfile = await idbManager.getUserProfile('integration-user')

        expect(migratedProfile.displayName).toBe('Integration Test User')
        expect(migratedProfile.unlockedMedals.length).toBe(2)
        expect(migratedProfile.prerequisites.length).toBe(2)
        expect(migratedProfile.features.allowManualUnlock).toBe(true)
        expect(migratedProfile.features.enforceCurrentYearForSustained).toBe(false)

        idbManager.close()
      },
      15000
    )
  })
})
