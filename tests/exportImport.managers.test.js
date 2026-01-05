import { toProfileBackup } from '../src/utils/exportManager'
import { parseProfileBackup } from '../src/utils/importManager'

describe('profile backup format', () => {
  test('toProfileBackup produces valid profile-backup JSON', async () => {
    const profile = {
      userId: 'user-123',
      displayName: 'Test User',
      createdDate: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-01-02T00:00:00.000Z',
      dateOfBirth: '2001-05-20',
      sex: 'male',
      unlockedMedals: [{ medalId: 'm1', unlockedDate: '2024-06-01' }],
      prerequisites: [{ id: 'a1', type: 'precision_series', year: 2024, weaponGroup: 'A', points: 45 }],
      features: { allowManualUnlock: true, enforceCurrentYearForSustained: false },
      notifications: true,
    }

    const json = await toProfileBackup(profile)
    const parsed = JSON.parse(json)
    expect(parsed.kind).toBe('profile-backup')
    expect(parsed.version).toBe('1.0')
    expect(parsed.profile.displayName).toBe('Test User')
    expect(parsed.profile.sex).toBe('male')
    expect(Array.isArray(parsed.profile.prerequisites)).toBe(true)
    expect(Array.isArray(parsed.profile.unlockedMedals)).toBe(true)
  })

  test('parseProfileBackup accepts the new format and normalizes', () => {
    const backup = {
      kind: 'profile-backup',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: {
        userId: 'user-abc',
        displayName: 'User ABC',
        createdDate: '2024-01-01T00:00:00.000Z',
        lastModified: '2024-01-02T00:00:00.000Z',
        dateOfBirth: '2000-01-01',
        sex: 'FEMALE',
        unlockedMedals: [{ medalId: 'm1', unlockedDate: '2024-06-01' }],
        prerequisites: [{ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 50 }],
        features: { allowManualUnlock: 1, enforceCurrentYearForSustained: 0 },
        notifications: 1,
      },
    }
    const normalized = parseProfileBackup(JSON.stringify(backup))
    expect(normalized.userId).toBe('user-abc')
    expect(normalized.displayName).toBe('User ABC')
    expect(Array.isArray(normalized.prerequisites)).toBe(true)
    expect(normalized.features.allowManualUnlock).toBe(true)
    expect(normalized.features.enforceCurrentYearForSustained).toBe(false)
    expect(normalized.notifications).toBe(true)
    expect(normalized.prerequisites[0].id).toBeTruthy()
    expect(normalized.sex).toBe('female')
  })
})
