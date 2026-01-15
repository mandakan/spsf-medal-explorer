import { LocalStorageDataManager } from '../src/data/localStorage'
import { UserProfile, VALID_PROFILE_SEX } from '../src/models/Profile'

function isoDobForAge(years) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

describe('Profile sex field', () => {
  let dm

  beforeEach(() => {
    localStorage.clear()
    dm = new LocalStorageDataManager()
  })

  test('VALID_PROFILE_SEX contains only allowed values', () => {
    expect(Array.isArray(VALID_PROFILE_SEX)).toBe(true)
    expect(VALID_PROFILE_SEX).toEqual(['male', 'female'])
  })

  test('UserProfile keeps provided sex value', () => {
    const profile = new UserProfile({
      userId: 'user-1',
      displayName: 'Test',
      dateOfBirth: isoDobForAge(20),
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [],
    })
    expect(profile.sex).toBe('male')
  })

  test('saveUserProfile persists valid sex (male)', async () => {
    const profile = {
      userId: 'user-2',
      displayName: 'Alex',
      dateOfBirth: isoDobForAge(25),
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [],
      features: { allowManualUnlock: true, enforceCurrentYearForSustained: false },
    }
    const saved = await dm.saveUserProfile(profile)
    expect(saved.sex).toBe('male')

    const fetched = await dm.getUserProfile('user-2')
    expect(fetched).not.toBeNull()
    expect(fetched.sex).toBe('male')
  })

  test('saveUserProfile persists valid sex (female)', async () => {
    const profile = {
      userId: 'user-3',
      displayName: 'Sam',
      dateOfBirth: isoDobForAge(30),
      sex: 'female',
      unlockedMedals: [],
      prerequisites: [],
    }
    const saved = await dm.saveUserProfile(profile)
    expect(saved.sex).toBe('female')

    const fetched = await dm.getUserProfile('user-3')
    expect(fetched.sex).toBe('female')
  })

  test('saveUserProfile rejects missing sex', async () => {
    const profile = {
      userId: 'user-4',
      displayName: 'Casey',
      dateOfBirth: isoDobForAge(22),
      unlockedMedals: [],
      prerequisites: [],
    }
    await expect(dm.saveUserProfile(profile)).rejects.toThrow(/Kön saknas/)
  })

  test('saveUserProfile rejects invalid sex', async () => {
    const profile = {
      userId: 'user-5',
      displayName: 'Jordan',
      dateOfBirth: isoDobForAge(22),
      sex: 'other',
      unlockedMedals: [],
      prerequisites: [],
    }
    await expect(dm.saveUserProfile(profile)).rejects.toThrow(/Ogiltigt kön/)
  })

  test('restoreProfile with strategy=new-id assigns new id and keeps valid sex', async () => {
    const original = {
      userId: 'user-original',
      displayName: 'Taylor',
      dateOfBirth: isoDobForAge(18),
      sex: 'female',
      unlockedMedals: [],
      prerequisites: [],
      notifications: false,
    }
    const restored = await dm.restoreProfile(original, { strategy: 'new-id' })
    expect(restored.userId).toMatch(/^user-/)
    expect(restored.userId).not.toBe('user-original')
    expect(restored.sex).toBe('female')

    const loaded = await dm.getUserProfile(restored.userId)
    expect(loaded.sex).toBe('female')
  })

  test('restoreProfile with strategy=overwrite keeps id and updates profile when sex is valid', async () => {
    const existing = {
      userId: 'user-6',
      displayName: 'Initial',
      dateOfBirth: isoDobForAge(40),
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [],
    }
    await dm.saveUserProfile(existing)

    const backup = {
      userId: 'user-6',
      displayName: 'Updated',
      dateOfBirth: isoDobForAge(41),
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [{ id: 'a1', type: 'precision_series', year: 2024, weaponGroup: 'A', points: 42 }],
      notifications: true,
    }
    const restored = await dm.restoreProfile(backup, { strategy: 'overwrite' })
    expect(restored.userId).toBe('user-6')
    expect(restored.displayName).toBe('Updated')
    expect(restored.sex).toBe('male')

    const loaded = await dm.getUserProfile('user-6')
    expect(loaded.displayName).toBe('Updated')
    expect(loaded.sex).toBe('male')
  })

  test('restoreProfile rejects invalid sex', async () => {
    const bad = {
      userId: 'user-7',
      displayName: 'Bad',
      dateOfBirth: isoDobForAge(20),
      sex: 'x',
      unlockedMedals: [],
      prerequisites: [],
    }
    await expect(dm.restoreProfile(bad, { strategy: 'new-id' })).rejects.toThrow(/Ogiltigt kön/)
  })

  test('saveUserProfile rejects age below 8 years', async () => {
    const profile = {
      userId: 'user-young',
      displayName: 'Young',
      dateOfBirth: isoDobForAge(6),
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [],
    }
    await expect(dm.saveUserProfile(profile)).rejects.toThrow(/Åldern måste vara minst 8 år/)
  })

  test('saveUserProfile accepts age exactly 8 years', async () => {
    const profile = {
      userId: 'user-min-age',
      displayName: 'MinAge',
      dateOfBirth: isoDobForAge(8),
      sex: 'female',
      unlockedMedals: [],
      prerequisites: [],
    }
    const saved = await dm.saveUserProfile(profile)
    expect(saved.userId).toBe('user-min-age')
  })

  test('saveUserProfile accepts age exactly 100 years', async () => {
    const profile = {
      userId: 'user-max-age',
      displayName: 'MaxAge',
      dateOfBirth: isoDobForAge(100),
      sex: 'male',
      unlockedMedals: [],
      prerequisites: [],
    }
    const saved = await dm.saveUserProfile(profile)
    expect(saved.userId).toBe('user-max-age')
  })

  test('saveUserProfile rejects age above 100 years', async () => {
    const profile = {
      userId: 'user-old',
      displayName: 'TooOld',
      dateOfBirth: isoDobForAge(101),
      sex: 'female',
      unlockedMedals: [],
      prerequisites: [],
    }
    await expect(dm.saveUserProfile(profile)).rejects.toThrow(/Åldern får inte överstiga 100 år/)
  })
})
