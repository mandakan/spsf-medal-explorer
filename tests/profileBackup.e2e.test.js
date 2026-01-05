import { LocalStorageDataManager } from '../src/data/localStorage'
import { toProfileBackup } from '../src/utils/exportManager'
import { parseProfileBackup } from '../src/utils/importManager'

const STORAGE_KEY = 'medal-app-data'

function resetStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

describe('Export → Restore profile roundtrip', () => {
  beforeEach(() => {
    resetStorage()
  })

  test('create → export → delete → restore (new-id)', async () => {
    const dm = new LocalStorageDataManager()

    // Create a profile
    const profile = {
      userId: 'user-initial',
      displayName: 'Roundtrip',
      dateOfBirth: '2000-02-02',
      sex: 'male',
      prerequisites: [
        { id: 'a1', type: 'precision_series', year: 2023, weaponGroup: 'A', points: 40 },
        { id: 'a2', type: 'precision_series', year: 2024, weaponGroup: 'B', points: 46 },
      ],
      unlockedMedals: [{ medalId: 'm1', unlockedDate: '2024-06-01' }],
      features: { allowManualUnlock: true, enforceCurrentYearForSustained: false },
    }

    const saved = await dm.saveUserProfile(profile)

    // Export backup
    const backupJson = await toProfileBackup(saved)
    expect(typeof backupJson).toBe('string')

    // Delete original
    await dm.deleteProfile(saved.userId)
    const allAfterDelete = await dm.getAllProfiles()
    expect(allAfterDelete.find(p => p.userId === saved.userId)).toBeUndefined()

    // Restore using new-id strategy
    const parsed = parseProfileBackup(backupJson)
    const restored = await dm.restoreProfile(parsed, { strategy: 'new-id' })

    expect(restored.userId).not.toBe(saved.userId)
    expect(restored.displayName).toBe('Roundtrip')
    expect(restored.unlockedMedals.length).toBe(1)
    expect(restored.prerequisites.length).toBe(2)

    const all = await dm.getAllProfiles()
    expect(all.some(p => p.userId === restored.userId)).toBe(true)
  })

  test('overwrite strategy keeps provided userId', async () => {
    const dm = new LocalStorageDataManager()

    // Seed a profile with the target id
    const base = await dm.saveUserProfile({
      userId: 'user-target',
      displayName: 'Will be overwritten',
      dateOfBirth: '1999-01-01',
      sex: 'female',
      prerequisites: [],
      unlockedMedals: [],
      features: { allowManualUnlock: false, enforceCurrentYearForSustained: false },
    })

    const backupJson = await toProfileBackup({
      ...base,
      displayName: 'New Name',
      prerequisites: [{ id: 'b1', type: 'precision_series', year: 2024, weaponGroup: 'A', points: 50 }],
    })

    const parsed = parseProfileBackup(backupJson)
    parsed.userId = 'user-target' // ensure id matches
    const restored = await dm.restoreProfile(parsed, { strategy: 'overwrite' })

    expect(restored.userId).toBe('user-target')
    expect(restored.displayName).toBe('New Name')
    expect(restored.prerequisites.length).toBe(1)
  })
})
