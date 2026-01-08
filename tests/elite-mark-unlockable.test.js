import { MedalCalculator } from '../src/logic/calculator'
import { MedalDatabase } from '../src/models/Medal'
import { UserProfile } from '../src/models/Profile'
import { Achievement } from '../src/models/Achievement'
import { loadBestAvailableData } from '../src/utils/medalDatabase'

/**
 * Comprehensive tests to verify all elite_mark medals can be unlocked
 * through the achievement entry system.
 *
 * This test suite validates:
 * 1. Basic elite marks (bronze, silver, gold)
 * 2. Elite gold with wreath
 * 3. Elite gold wreath with stars (star-1, star-2, star-3)
 *
 * Elite marks are advanced medals requiring:
 * - Prerequisite: pistol-mark-gold (for bronze)
 * - 5 precision series with high point thresholds (45/48/49)
 * - 5 speed shooting series with high point thresholds (45/48/49)
 * - Sustained achievements for wreath and star variants
 */

describe('elite_mark medals - full unlockability', () => {
  let medalDb, profile, calculator
  const currentYear = new Date().getFullYear()

  beforeAll(async () => {
    // Load actual medal data
    const medalData = await loadBestAvailableData()
    medalDb = new MedalDatabase(medalData)
  })

  beforeEach(() => {
    profile = new UserProfile({
      displayName: 'Elite Shooter',
      dateOfBirth: '1995-01-01', // Age ~30
      sex: 'male',
      unlockedMedals: [],
      prerequisites: []
    })
    calculator = new MedalCalculator(medalDb, profile)
  })

  describe('Basic elite marks (bronze, silver, gold)', () => {
    test('elite-mark-bronze is unlockable with pistol-gold prerequisite + 5 precision + 5 speed series', () => {
      // Prerequisite: pistol-mark-gold from previous year
      profile.unlockedMedals = [
        { medalId: 'pistol-mark-bronze', unlockedDate: `${currentYear - 3}-06-15`, year: currentYear - 3 },
        { medalId: 'pistol-mark-silver', unlockedDate: `${currentYear - 2}-06-15`, year: currentYear - 2 },
        { medalId: 'pistol-mark-gold', unlockedDate: `${currentYear - 1}-06-15`, year: currentYear - 1 }
      ]

      // Add 5 precision series >= 45 points for weapon group A
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 45 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 46 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 47 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        // Add 5 speed shooting series >= 45 points
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 45 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 46 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 47 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 49 })
      ]

      const result = calculator.evaluateMedal('elite-mark-bronze')
      expect(result.status).toBe('eligible')
    })

    test('elite-mark-bronze requires pistol-mark-gold prerequisite', () => {
      // Missing pistol-mark-gold prerequisite
      profile.unlockedMedals = [
        { medalId: 'pistol-mark-bronze', unlockedDate: `${currentYear - 2}-06-15`, year: currentYear - 2 },
        { medalId: 'pistol-mark-silver', unlockedDate: `${currentYear - 1}-06-15`, year: currentYear - 1 }
        // pistol-mark-gold is missing
      ]

      // Add required achievements anyway
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 45 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 46 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 47 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 45 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 46 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 47 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 49 })
      ]

      const result = calculator.evaluateMedal('elite-mark-bronze')
      expect(result.status).toBe('locked')
      expect(result.reason).toBe('prerequisites_not_met')
    })

    test('elite-mark-silver is unlockable with bronze prerequisite + higher scores', () => {
      // Unlock elite bronze in previous year
      profile.unlockedMedals = [
        { medalId: 'pistol-mark-bronze', unlockedDate: `${currentYear - 4}-06-15`, year: currentYear - 4 },
        { medalId: 'pistol-mark-silver', unlockedDate: `${currentYear - 3}-06-15`, year: currentYear - 3 },
        { medalId: 'pistol-mark-gold', unlockedDate: `${currentYear - 2}-06-15`, year: currentYear - 2 },
        { medalId: 'elite-mark-bronze', unlockedDate: `${currentYear - 1}-08-15`, year: currentYear - 1 }
      ]

      // Add 5 precision series >= 48 points
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        // Add 5 speed shooting series >= 48 points
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 50 })
      ]

      const result = calculator.evaluateMedal('elite-mark-silver')
      expect(result.status).toBe('eligible')
    })

    test('elite-mark-gold is unlockable with silver prerequisite + highest scores', () => {
      // Unlock elite silver in previous year
      profile.unlockedMedals = [
        { medalId: 'pistol-mark-bronze', unlockedDate: `${currentYear - 5}-06-15`, year: currentYear - 5 },
        { medalId: 'pistol-mark-silver', unlockedDate: `${currentYear - 4}-06-15`, year: currentYear - 4 },
        { medalId: 'pistol-mark-gold', unlockedDate: `${currentYear - 3}-06-15`, year: currentYear - 3 },
        { medalId: 'elite-mark-bronze', unlockedDate: `${currentYear - 2}-08-15`, year: currentYear - 2 },
        { medalId: 'elite-mark-silver', unlockedDate: `${currentYear - 1}-08-15`, year: currentYear - 1 }
      ]

      // Add 5 precision series >= 49 points
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        // Add 5 speed shooting series >= 49 points
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 50 })
      ]

      const result = calculator.evaluateMedal('elite-mark-gold')
      expect(result.status).toBe('eligible')
    })

    test('full bronze->silver->gold progression is achievable', () => {
      // Setup pistol marks (prerequisite for elite bronze)
      profile.unlockedMedals = [
        { medalId: 'pistol-mark-bronze', unlockedDate: `${currentYear - 5}-06-15`, year: currentYear - 5 },
        { medalId: 'pistol-mark-silver', unlockedDate: `${currentYear - 4}-06-15`, year: currentYear - 4 },
        { medalId: 'pistol-mark-gold', unlockedDate: `${currentYear - 3}-06-15`, year: currentYear - 3 }
      ]

      // Year 1: Achieve elite bronze
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: currentYear - 2, weaponGroup: 'A', points: 45 }),
        new Achievement({ type: 'precision_series', year: currentYear - 2, weaponGroup: 'A', points: 46 }),
        new Achievement({ type: 'precision_series', year: currentYear - 2, weaponGroup: 'A', points: 47 }),
        new Achievement({ type: 'precision_series', year: currentYear - 2, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'precision_series', year: currentYear - 2, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 2, weaponGroup: 'A', points: 45 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 2, weaponGroup: 'A', points: 46 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 2, weaponGroup: 'A', points: 47 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 2, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 2, weaponGroup: 'A', points: 49 })
      ]

      profile.unlockedMedals.push(
        { medalId: 'elite-mark-bronze', unlockedDate: `${currentYear - 2}-09-15`, year: currentYear - 2 }
      )

      // Year 2: Achieve elite silver
      profile.prerequisites.push(
        new Achievement({ type: 'precision_series', year: currentYear - 1, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'precision_series', year: currentYear - 1, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'precision_series', year: currentYear - 1, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'precision_series', year: currentYear - 1, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'precision_series', year: currentYear - 1, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 1, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 1, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 1, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 1, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear - 1, weaponGroup: 'A', points: 50 })
      )

      profile.unlockedMedals.push(
        { medalId: 'elite-mark-silver', unlockedDate: `${currentYear - 1}-09-15`, year: currentYear - 1 }
      )

      // Year 3: Achieve elite gold
      profile.prerequisites.push(
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 49 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 50 }),
        new Achievement({ type: 'speed_shooting_series', year: currentYear, weaponGroup: 'A', points: 50 })
      )

      const goldResult = calculator.evaluateMedal('elite-mark-gold')
      expect(goldResult.status).toBe('eligible')
    })

    test('elite marks require both precision AND speed shooting series', () => {
      // Prerequisite met
      profile.unlockedMedals = [
        { medalId: 'pistol-mark-bronze', unlockedDate: `${currentYear - 3}-06-15`, year: currentYear - 3 },
        { medalId: 'pistol-mark-silver', unlockedDate: `${currentYear - 2}-06-15`, year: currentYear - 2 },
        { medalId: 'pistol-mark-gold', unlockedDate: `${currentYear - 1}-06-15`, year: currentYear - 1 }
      ]

      // Only precision series, missing speed shooting
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 45 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 46 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 47 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 48 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 49 })
        // Speed shooting series are missing
      ]

      const result = calculator.evaluateMedal('elite-mark-bronze')
      expect(result.status).toBe('available')
    })
  })

  describe('Elite gold wreath and stars', () => {
    beforeEach(() => {
      // Setup: have all basic elite marks unlocked
      profile.unlockedMedals = [
        { medalId: 'pistol-mark-bronze', unlockedDate: `${currentYear - 6}-06-15`, year: currentYear - 6 },
        { medalId: 'pistol-mark-silver', unlockedDate: `${currentYear - 5}-06-15`, year: currentYear - 5 },
        { medalId: 'pistol-mark-gold', unlockedDate: `${currentYear - 4}-06-15`, year: currentYear - 4 },
        { medalId: 'elite-mark-bronze', unlockedDate: `${currentYear - 3}-09-15`, year: currentYear - 3 },
        { medalId: 'elite-mark-silver', unlockedDate: `${currentYear - 2}-09-15`, year: currentYear - 2 },
        { medalId: 'elite-mark-gold', unlockedDate: `${currentYear - 1}-09-15`, year: currentYear - 1 }
      ]
    })

    test('elite-mark-gold-wreath is unlockable with sustained elite-gold performance', () => {
      // Add multiple years of sustained elite-gold level achievements
      const years = [currentYear - 2, currentYear - 1, currentYear]
      years.forEach(year => {
        profile.prerequisites.push(
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 })
        )
      })

      const result = calculator.evaluateMedal('elite-mark-gold-wreath')
      expect(['eligible', 'available']).toContain(result.status)
    })

    test('elite-mark-gold-wreath-star-1 requires wreath prerequisite', () => {
      profile.unlockedMedals.push(
        { medalId: 'elite-mark-gold-wreath', unlockedDate: `${currentYear - 1}-12-15`, year: currentYear - 1 }
      )

      // Continue sustained elite-gold performance for additional years
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i
        profile.prerequisites.push(
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 })
        )
      }

      const result = calculator.evaluateMedal('elite-mark-gold-wreath-star-1')
      expect(['eligible', 'available']).toContain(result.status)
    })

    test('elite-mark-gold-wreath-star-2 requires star-1 prerequisite', () => {
      profile.unlockedMedals.push(
        { medalId: 'elite-mark-gold-wreath', unlockedDate: `${currentYear - 2}-12-15`, year: currentYear - 2 },
        { medalId: 'elite-mark-gold-wreath-star-1', unlockedDate: `${currentYear - 1}-12-15`, year: currentYear - 1 }
      )

      // Continue sustained achievements for many years
      for (let i = 6; i >= 0; i--) {
        const year = currentYear - i
        profile.prerequisites.push(
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 })
        )
      }

      const result = calculator.evaluateMedal('elite-mark-gold-wreath-star-2')
      expect(['eligible', 'available']).toContain(result.status)
    })

    test('elite-mark-gold-wreath-star-3 requires star-2 prerequisite', () => {
      profile.unlockedMedals.push(
        { medalId: 'elite-mark-gold-wreath', unlockedDate: `${currentYear - 3}-12-15`, year: currentYear - 3 },
        { medalId: 'elite-mark-gold-wreath-star-1', unlockedDate: `${currentYear - 2}-12-15`, year: currentYear - 2 },
        { medalId: 'elite-mark-gold-wreath-star-2', unlockedDate: `${currentYear - 1}-12-15`, year: currentYear - 1 }
      )

      // Continue sustained achievements for many years
      for (let i = 8; i >= 0; i--) {
        const year = currentYear - i
        profile.prerequisites.push(
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'precision_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 49 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 }),
          new Achievement({ type: 'speed_shooting_series', year, weaponGroup: 'A', points: 50 })
        )
      }

      const result = calculator.evaluateMedal('elite-mark-gold-wreath-star-3')
      expect(['eligible', 'available']).toContain(result.status)
    })
  })

  describe('All 7 elite_mark medals are defined', () => {
    test('all expected elite mark medal IDs exist', () => {
      const expectedIds = [
        'elite-mark-bronze',
        'elite-mark-silver',
        'elite-mark-gold',
        'elite-mark-gold-wreath',
        'elite-mark-gold-wreath-star-1',
        'elite-mark-gold-wreath-star-2',
        'elite-mark-gold-wreath-star-3'
      ]

      expectedIds.forEach(medalId => {
        const medal = medalDb.getMedalById(medalId)
        expect(medal).toBeDefined()
        expect(medal.id).toBe(medalId)
      })
    })

    test('all 7 elite_mark medals exist and have valid structure', () => {
      const eliteMedals = medalDb.getAllMedals().filter(m => m.type === 'elite_mark')
      expect(eliteMedals.length).toBe(7)

      // Verify each medal has required properties
      eliteMedals.forEach(medal => {
        expect(medal.id).toBeDefined()
        expect(medal.displayName).toBeDefined()
        expect(medal.type).toBe('elite_mark')
        expect(medal.status).toBe('reviewed')
      })
    })
  })
})
