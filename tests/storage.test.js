import { LocalStorageDataManager } from '../src/data/localStorage'
import { UserProfile } from '../src/models/Profile'
import { Achievement } from '../src/models/Achievement'

describe('LocalStorageDataManager', () => {
  let storage

  beforeEach(() => {
    localStorage.clear()
    storage = new LocalStorageDataManager()
  })

  test('initializes storage on creation', () => {
    expect(localStorage.getItem('medal-app-data')).toBeTruthy()
  })

  test('saves profile to storage', async () => {
    const profile = new UserProfile({
      displayName: 'Test User',
      dateOfBirth: '2000-01-01',
    })

    const saved = await storage.saveUserProfile(profile)
    expect(saved.userId).toBe(profile.userId)
    expect(saved.lastModified).toBeDefined()
  })

  test('loads saved profile', async () => {
    const profile = new UserProfile({
      displayName: 'Test User',
      dateOfBirth: '2000-01-01',
    })

    await storage.saveUserProfile(profile)
    const loaded = await storage.getUserProfile(profile.userId)

    expect(loaded).toBeDefined()
    expect(loaded.displayName).toBe('Test User')
  })

  test('adds achievement to profile', async () => {
    const profile = new UserProfile({
      displayName: 'Test User',
      dateOfBirth: '2000-01-01',
    })
    await storage.saveUserProfile(profile)

    const achievement = new Achievement({
      type: 'precision_series',
      year: 2025,
      weaponGroup: 'A',
      points: 42,
      date: '2025-06-15',
    })

    await storage.addAchievement(profile.userId, achievement)
    const updated = await storage.getUserProfile(profile.userId)

    expect(updated.prerequisites.length).toBe(1)
  })

  test('deletes profile', async () => {
    const profile = new UserProfile({
      displayName: 'Test User',
      dateOfBirth: '2000-01-01',
    })
    await storage.saveUserProfile(profile)

    await storage.deleteProfile(profile.userId)
    const loaded = await storage.getUserProfile(profile.userId)

    expect(loaded).toBeNull()
  })

  test('validates profile before saving', async () => {
    const invalidProfile = { userId: null }

    await expect(storage.saveUserProfile(invalidProfile)).rejects.toThrow(
      'Invalid profile structure'
    )
  })
})
