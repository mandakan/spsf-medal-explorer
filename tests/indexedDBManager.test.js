import { IndexedDBManager } from '../src/data/indexedDBManager'

describe('IndexedDBManager', () => {
  let manager

  beforeEach(async () => {
    // Clear all databases before each test
    const databases = await indexedDB.databases()
    for (const db of databases) {
      indexedDB.deleteDatabase(db.name)
    }

    manager = new IndexedDBManager()
    await manager.init()
  })

  afterEach(() => {
    if (manager && manager.db) {
      manager.close()
    }
  })

  describe('init', () => {
    it('creates database with correct name', () => {
      expect(manager.db).toBeTruthy()
      expect(manager.dbName).toContain('medal-app')
    })

    it('creates profiles and metadata object stores', () => {
      expect(manager.db.objectStoreNames.contains('profiles')).toBe(true)
      expect(manager.db.objectStoreNames.contains('metadata')).toBe(true)
    })
  })

  describe('profile operations', () => {
    const testProfile = {
      userId: 'test-user-1',
      displayName: 'Test User',
      dateOfBirth: '1990-01-01',
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [],
      notifications: true,
      features: {
        allowManualUnlock: false,
        enforceCurrentYearForSustained: true,
      },
    }

    it('saves a new profile', async () => {
      const saved = await manager.saveUserProfile(testProfile)
      expect(saved.userId).toBe(testProfile.userId)
      expect(saved.displayName).toBe(testProfile.displayName)
      expect(saved.createdDate).toBeTruthy()
      expect(saved.lastModified).toBeTruthy()
    })

    it('retrieves a saved profile', async () => {
      await manager.saveUserProfile(testProfile)
      const retrieved = await manager.getUserProfile(testProfile.userId)
      expect(retrieved.userId).toBe(testProfile.userId)
      expect(retrieved.displayName).toBe(testProfile.displayName)
    })

    it('returns null for non-existent profile', async () => {
      const result = await manager.getUserProfile('non-existent')
      expect(result).toBeNull()
    })

    it('updates an existing profile', async () => {
      await manager.saveUserProfile(testProfile)
      const updated = await manager.saveUserProfile({
        ...testProfile,
        displayName: 'Updated Name',
      })
      expect(updated.displayName).toBe('Updated Name')
    })

    it('gets all profiles', async () => {
      await manager.saveUserProfile(testProfile)
      await manager.saveUserProfile({
        ...testProfile,
        userId: 'test-user-2',
        displayName: 'Second User',
      })
      const all = await manager.getAllProfiles()
      expect(all.length).toBe(2)
    })

    it('deletes a profile', async () => {
      await manager.saveUserProfile(testProfile)
      await manager.deleteProfile(testProfile.userId)
      const retrieved = await manager.getUserProfile(testProfile.userId)
      expect(retrieved).toBeNull()
    })

    it('rejects invalid profile (missing sex)', async () => {
      const invalidProfile = { ...testProfile }
      delete invalidProfile.sex
      await expect(manager.saveUserProfile(invalidProfile)).rejects.toThrow(
        'Invalid profile structure'
      )
    })

    it('rejects invalid profile (invalid dateOfBirth)', async () => {
      const invalidProfile = { ...testProfile, dateOfBirth: 'not-a-date' }
      await expect(manager.saveUserProfile(invalidProfile)).rejects.toThrow(
        'Invalid profile structure'
      )
    })
  })

  describe('achievement operations', () => {
    const testProfile = {
      userId: 'test-user-1',
      displayName: 'Test User',
      dateOfBirth: '1990-01-01',
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [],
      notifications: true,
      features: {
        allowManualUnlock: false,
        enforceCurrentYearForSustained: true,
      },
    }

    const testAchievement = {
      id: 'ach-1',
      type: 'precision_series',
      year: 2025,
      weaponGroup: 'A',
      points: 25,
    }

    beforeEach(async () => {
      await manager.saveUserProfile(testProfile)
    })

    it('adds achievement to profile', async () => {
      const added = await manager.addAchievement(testProfile.userId, testAchievement)
      expect(added.id).toBe(testAchievement.id)
      expect(added.points).toBe(testAchievement.points)
    })

    it('gets achievements for user', async () => {
      await manager.addAchievement(testProfile.userId, testAchievement)
      const achievements = await manager.getAchievements(testProfile.userId)
      expect(achievements.length).toBe(1)
      expect(achievements[0].id).toBe(testAchievement.id)
    })

    it('updates achievement', async () => {
      await manager.addAchievement(testProfile.userId, testAchievement)
      const updated = await manager.updateAchievement(testProfile.userId, testAchievement.id, {
        ...testAchievement,
        points: 30,
      })
      expect(updated.points).toBe(30)
    })

    it('removes achievement', async () => {
      await manager.addAchievement(testProfile.userId, testAchievement)
      await manager.removeAchievement(testProfile.userId, testAchievement.id)
      const achievements = await manager.getAchievements(testProfile.userId)
      expect(achievements.length).toBe(0)
    })

    it('rejects invalid achievement (missing type)', async () => {
      const invalid = { ...testAchievement }
      delete invalid.type
      await expect(manager.addAchievement(testProfile.userId, invalid)).rejects.toThrow()
    })

    it('rejects invalid achievement (invalid weaponGroup)', async () => {
      const invalid = { ...testAchievement, weaponGroup: 'X' }
      await expect(manager.addAchievement(testProfile.userId, invalid)).rejects.toThrow()
    })
  })

  describe('metadata operations', () => {
    it('sets and gets metadata', async () => {
      await manager.setMetadata('test-key', 'test-value')
      const value = await manager.getMetadata('test-key')
      expect(value).toBe('test-value')
    })

    it('returns undefined for non-existent metadata', async () => {
      const value = await manager.getMetadata('non-existent')
      expect(value).toBeUndefined()
    })

    it('overwrites existing metadata', async () => {
      await manager.setMetadata('key', 'value1')
      await manager.setMetadata('key', 'value2')
      const value = await manager.getMetadata('key')
      expect(value).toBe('value2')
    })
  })

  describe('restoreProfile', () => {
    const backupProfile = {
      userId: 'backup-user',
      displayName: 'Backup User',
      dateOfBirth: '1985-05-15',
      sex: 'female',
      unlockedMedals: [{ medalId: 'medal-1', unlockedDate: '2025-01-01' }],
      prerequisites: [],
      notifications: false,
      features: {
        allowManualUnlock: true,
        enforceCurrentYearForSustained: false,
      },
    }

    it('restores profile with new-id strategy', async () => {
      const restored = await manager.restoreProfile(backupProfile, { strategy: 'new-id' })
      expect(restored.userId).not.toBe(backupProfile.userId)
      expect(restored.displayName).toBe(backupProfile.displayName)
      expect(restored.unlockedMedals.length).toBe(1)
    })

    it('restores profile with overwrite strategy', async () => {
      const restored = await manager.restoreProfile(backupProfile, { strategy: 'overwrite' })
      expect(restored.userId).toBe(backupProfile.userId)
      expect(restored.displayName).toBe(backupProfile.displayName)
    })

    it('rejects invalid restore strategy', async () => {
      await expect(manager.restoreProfile(backupProfile, { strategy: 'invalid' })).rejects.toThrow(
        'Invalid restore strategy'
      )
    })
  })

  describe('upsertAchievements', () => {
    const testProfile = {
      userId: 'test-user-1',
      displayName: 'Test User',
      dateOfBirth: '1990-01-01',
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [],
      notifications: true,
      features: {
        allowManualUnlock: false,
        enforceCurrentYearForSustained: true,
      },
    }

    beforeEach(async () => {
      await manager.saveUserProfile(testProfile)
    })

    it('adds new achievements in dry-run mode', async () => {
      const achievements = [
        { type: 'precision_series', year: 2025, weaponGroup: 'A', points: 25 },
        { type: 'precision_series', year: 2025, weaponGroup: 'B', points: 30 },
      ]

      const result = await manager.upsertAchievements(testProfile.userId, achievements, {
        dryRun: true,
        addNew: true,
      })

      expect(result.added).toBe(2)
      expect(result.updated).toBe(0)
      expect(result.failed).toBe(0)

      // Verify data was not actually saved
      const profile = await manager.getUserProfile(testProfile.userId)
      expect(profile.prerequisites.length).toBe(0)
    })

    it('adds new achievements when dryRun is false', async () => {
      const achievements = [{ type: 'precision_series', year: 2025, weaponGroup: 'A', points: 25 }]

      const result = await manager.upsertAchievements(testProfile.userId, achievements, {
        dryRun: false,
        addNew: true,
      })

      expect(result.added).toBe(1)

      // Verify data was saved
      const profile = await manager.getUserProfile(testProfile.userId)
      expect(profile.prerequisites.length).toBe(1)
    })

    it('handles validation failures', async () => {
      const achievements = [
        { type: 'precision_series', year: 2025, weaponGroup: 'A', points: 25 }, // valid
        { type: 'invalid', year: 2025, weaponGroup: 'X', points: 999 }, // invalid
      ]

      const result = await manager.upsertAchievements(testProfile.userId, achievements, {
        dryRun: true,
        addNew: true,
      })

      expect(result.added).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors.length).toBe(1)
    })
  })

  describe('database lifecycle', () => {
    it('throws error when transaction attempted without init', async () => {
      const uninitializedManager = new IndexedDBManager()
      await expect(uninitializedManager.getAllProfiles()).rejects.toThrow('Database not initialized')
    })

    it('closes database connection', () => {
      expect(manager.db).toBeTruthy()
      manager.close()
      expect(manager.db).toBeNull()
    })
  })
})
