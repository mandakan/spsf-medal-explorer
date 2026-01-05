import { LocalStorageDataManager } from '../src/data/localStorage'
import { exportProfileBackupToJson, importProfileBackupFromJson } from '../src/logic/exporter'
import { parseProfileBackup } from '../src/utils/importManager'
import { Achievement } from '../src/models/Achievement'
import { UserProfile } from '../src/models/Profile'

describe('Profile backup export/import (new format)', () => {
  let storage

  beforeEach(() => {
    localStorage.clear()
    storage = new LocalStorageDataManager()
  })

  test('exports profile to valid profile-backup JSON string', async () => {
    const profile = new UserProfile({ displayName: 'Exporter User', dateOfBirth: '1990-05-10', sex: 'male' })
    const saved = await storage.saveUserProfile(profile)

    const json = await exportProfileBackupToJson(storage, saved.userId)
    expect(typeof json).toBe('string')

    const parsed = JSON.parse(json)
    expect(parsed.kind).toBe('profile-backup')
    expect(parsed.version).toBe('1.0')
    expect(parsed.profile.displayName).toBe('Exporter User')
    expect(parsed.profile.sex).toBe('male')
  })

  test('import after export preserves achievements and medals', async () => {
    const profile = new UserProfile({ displayName: 'Roundtrip User', dateOfBirth: '1985-01-20', sex: 'female' })
    const saved = await storage.saveUserProfile(profile)

    const a1 = new Achievement({
      type: 'precision_series',
      year: 2025,
      weaponGroup: 'A',
      points: 40,
      date: '2025-04-10',
    })
    await storage.addAchievement(saved.userId, a1)

    // Export with new format
    const json = await exportProfileBackupToJson(storage, saved.userId)

    // Import (restore) using new format
    const importedProfile = await importProfileBackupFromJson(storage, json, { strategy: 'new-id' })

    expect(importedProfile).toBeDefined()
    expect(importedProfile.userId).not.toBe(saved.userId)
    expect(importedProfile.prerequisites.length).toBe(1)
    expect(importedProfile.unlockedMedals.length).toBe(0)
    expect(importedProfile.sex).toBe('female')
  })

  test('invalid JSON throws descriptive error', async () => {
    await expect(importProfileBackupFromJson(storage, '{ invalid json')).rejects.toThrow(/Invalid JSON/)
    expect(() => parseProfileBackup('{ invalid json')).toThrow(/Invalid JSON/)
  })
})
