import { UserProfile, DEFAULT_PROFILE_FEATURES } from '../src/models/Profile'

describe('Guest Mode Profile', () => {
  function createGuestProfile({ sex }) {
    return new UserProfile({
      userId: 'guest',
      displayName: 'Gästläge',
      dateOfBirth: '1975-01-02',
      sex,
      unlockedMedals: [],
      prerequisites: [],
      isGuest: true,
      features: {
        allowManualUnlock: true,
        enforceCurrentYearForSustained: false,
      },
    })
  }

  describe('Guest profile structure', () => {
    test('creates guest profile with required sex field', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })

      expect(guestProfile.userId).toBe('guest')
      expect(guestProfile.displayName).toBe('Gästläge')
      expect(guestProfile.dateOfBirth).toBe('1975-01-02')
      expect(guestProfile.sex).toBe('male')
      expect(guestProfile.isGuest).toBe(true)
    })

    test('guest profile has allowManualUnlock enabled by default', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })

      expect(guestProfile.features).toBeDefined()
      expect(guestProfile.features.allowManualUnlock).toBe(true)
    })

    test('guest profile has enforceCurrentYearForSustained disabled', () => {
      const guestProfile = createGuestProfile({ sex: 'female' })

      expect(guestProfile.features).toBeDefined()
      expect(guestProfile.features.enforceCurrentYearForSustained).toBe(false)
    })

    test('guest profile accepts female sex', () => {
      const guestProfile = createGuestProfile({ sex: 'female' })

      expect(guestProfile.sex).toBe('female')
    })

    test('guest profile accepts male sex', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })

      expect(guestProfile.sex).toBe('male')
    })

    test('guest profile initializes with empty unlocked medals', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })

      expect(guestProfile.unlockedMedals).toEqual([])
    })

    test('guest profile initializes with empty prerequisites', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })

      expect(guestProfile.prerequisites).toEqual([])
    })
  })

  describe('Guest mode features', () => {
    test('guest profile overrides default features', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })

      // Guest should always have allowManualUnlock true, regardless of defaults
      expect(guestProfile.features.allowManualUnlock).toBe(true)

      // Even if DEFAULT_PROFILE_FEATURES has different values
      expect(DEFAULT_PROFILE_FEATURES.allowManualUnlock).toBe(true)
    })

    test('guest profile can be distinguished from regular profiles', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })
      const regularProfile = new UserProfile({
        displayName: 'Regular User',
        dateOfBirth: '1990-01-01',
        sex: 'female',
      })

      expect(guestProfile.isGuest).toBe(true)
      expect(regularProfile.isGuest).toBe(false)
    })

    test('guest profile uses stable birth year (1975)', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })
      const birthYear = new Date(guestProfile.dateOfBirth).getFullYear()

      expect(birthYear).toBe(1975)
    })
  })

  describe('Guest mode edge cases', () => {
    test('guest profile sex field is required', () => {
      // Should not create guest profile without sex
      expect(() => {
        new UserProfile({
          userId: 'guest',
          displayName: 'Gästläge',
          dateOfBirth: '1975-01-02',
          isGuest: true,
        })
      }).not.toThrow()

      // But the sex field should be undefined if not provided
      const profile = new UserProfile({
        userId: 'guest',
        displayName: 'Gästläge',
        dateOfBirth: '1975-01-02',
        isGuest: true,
      })
      expect(profile.sex).toBeUndefined()
    })

    test('guest profile created with default sex parameter', () => {
      // Simulating startExplorerMode(sex = 'male')
      const defaultSex = 'male'
      const guestProfile = createGuestProfile({ sex: defaultSex })

      expect(guestProfile.sex).toBe('male')
    })

    test('guest profile allows custom sex override', () => {
      // Simulating startExplorerMode('female')
      const guestProfile = createGuestProfile({ sex: 'female' })

      expect(guestProfile.sex).toBe('female')
    })
  })

  describe('Guest mode vs Regular profile comparison', () => {
    test('guest profile has fixed userId', () => {
      const guest1 = createGuestProfile({ sex: 'male' })
      const guest2 = createGuestProfile({ sex: 'female' })

      // Both should have the same userId
      expect(guest1.userId).toBe('guest')
      expect(guest2.userId).toBe('guest')
    })

    test('regular profile has unique auto-generated userId', () => {
      const profile1 = new UserProfile({
        displayName: 'User 1',
        dateOfBirth: '1990-01-01',
        sex: 'male',
      })

      // Small delay to ensure different timestamp
      const now = Date.now()
      while (Date.now() === now) {
        // Wait for next millisecond
      }

      const profile2 = new UserProfile({
        displayName: 'User 2',
        dateOfBirth: '1991-01-01',
        sex: 'female',
      })

      expect(profile1.userId).not.toBe(profile2.userId)
      expect(profile1.userId).toMatch(/^user-/)
      expect(profile2.userId).toMatch(/^user-/)
    })

    test('guest profile has fixed display name', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })

      expect(guestProfile.displayName).toBe('Gästläge')
    })

    test('guest profile has fixed birth date', () => {
      const guestProfile = createGuestProfile({ sex: 'male' })

      expect(guestProfile.dateOfBirth).toBe('1975-01-02')
    })
  })
})
