import { LocalStorageDataManager } from '../src/data/localStorage'
import { UserProfile } from '../src/models/Profile'
import { Achievement } from '../src/models/Achievement'
import { exportProfileToJson, parseExportJson, validateExportPayload, importProfileFromJson } from '../src/logic/exporter'

describe('Exporter import/export', () => {
  let storage

  beforeEach(() => {
    localStorage.clear()
    storage = new LocalStorageDataManager()
  })

  test('exports profile to valid JSON string', async () => {
    const profile = new UserProfile({ displayName: 'Exporter User', weaponGroupPreference: 'B' })
    await storage.saveUserProfile(profile)

    const json = await exportProfileToJson(storage, profile.userId)
    expect(typeof json).toBe('string')

    const parsed = parseExportJson(json)
    expect(parsed.userProfile.displayName).toBe('Exporter User')
    validateExportPayload(parsed) // should not throw
  })

  test('import after export preserves achievements and medals', async () => {
    const profile = new UserProfile({ displayName: 'Roundtrip User', weaponGroupPreference: 'A' })
    await storage.saveUserProfile(profile)

    const a1 = new Achievement({
      type: 'precision_series',
      year: 2025,
      weaponGroup: 'A',
      points: 40,
      date: '2025-04-10',
    })
    await storage.addAchievement(profile.userId, a1)

    const exported = await storage.exportData(profile.userId)
    const importedProfile = await importProfileFromJson(storage, JSON.stringify(exported))

    expect(importedProfile).toBeDefined()
    expect(importedProfile.userId).not.toBe(profile.userId) // new profile created on import
    expect(importedProfile.prerequisites.length).toBe(1)
    expect(importedProfile.unlockedMedals.length).toBe(0)
  })

  test('invalid JSON throws descriptive error', () => {
    expect(() => parseExportJson('{ invalid json')).toThrow(/Invalid JSON/)
  })
})
