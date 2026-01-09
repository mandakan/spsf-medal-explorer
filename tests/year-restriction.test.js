import { MedalCalculator } from '../src/logic/calculator'
import { MedalDatabase } from '../src/models/Medal'
import { UserProfile } from '../src/models/Profile'
import { Achievement } from '../src/models/Achievement'
import { loadBestAvailableData } from '../src/utils/medalDatabase'

/**
 * Comprehensive tests to verify year restrictions for medal requirements.
 *
 * This test suite validates that:
 * 1. Achievements from year A CANNOT unlock medals for year B
 * 2. Multiple requirement parts must be satisfied from the SAME year
 * 3. Time windows respect the endYear boundary
 * 4. Candidate year scanning works correctly
 */

describe('Year Restrictions for Medal Requirements', () => {
  let medalDb, profile, calculator

  beforeAll(async () => {
    const medalData = await loadBestAvailableData()
    medalDb = new MedalDatabase(medalData)
  })

  beforeEach(() => {
    profile = new UserProfile({
      displayName: 'Test User',
      dateOfBirth: '2000-01-01',
      sex: 'male',
      unlockedMedals: [],
      prerequisites: []
    })
    calculator = new MedalCalculator(medalDb, profile)
  })

  describe('Precision Series - Year Restriction', () => {
    test('achievements from 2023 should NOT make medal eligible in 2024', () => {
      // Add precision series from 2023
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 37 })
      ]

      // Pistol mark bronze requires precision + application series with timeWindowYears: 1
      // Evaluating for 2024 should not find 2023 achievements
      const result = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2024 })
      expect(result.status).toBe('available') // Not eligible because precision requirement not met in 2024
    })

    test('achievements from 2024 should make precision requirement eligible in 2024', () => {
      // Add precision series from 2024
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 37 }),
        // Add application series to complete the requirements
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      const result = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2024 })
      expect(result.status).toBe('eligible')
    })
  })

  describe('Application Series - Year Restriction', () => {
    test('achievements from 2023 should NOT make medal eligible in 2024', () => {
      // Add application series from 2023
      profile.prerequisites = [
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      const result = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2024 })
      expect(result.status).toBe('available') // Not eligible because application requirement not met in 2024
    })

    test('achievements from 2024 should make application requirement eligible in 2024', () => {
      profile.prerequisites = [
        // Add precision series for 2024
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 37 }),
        // Add application series from 2024
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      const result = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2024 })
      expect(result.status).toBe('eligible')
    })
  })

  describe('Mixed Years - Should Fail', () => {
    test('precision from 2023 + application from 2024 should NOT make medal eligible', () => {
      profile.prerequisites = [
        // Precision series from 2023
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 37 }),
        // Application series from 2024
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      // Neither 2023 nor 2024 should make the medal eligible
      const result2023 = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2023 })
      expect(result2023.status).toBe('available') // Missing application in 2023

      const result2024 = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2024 })
      expect(result2024.status).toBe('available') // Missing precision in 2024
    })

    test('precision from 2024 + application from 2023 should NOT make medal eligible', () => {
      profile.prerequisites = [
        // Precision series from 2024
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 37 }),
        // Application series from 2023
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      const result2023 = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2023 })
      expect(result2023.status).toBe('available') // Missing precision in 2023

      const result2024 = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2024 })
      expect(result2024.status).toBe('available') // Missing application in 2024
    })
  })

  describe('Candidate Year Scanning - Without endYear', () => {
    test('should find first eligible year when evaluating without endYear', () => {
      const currentYear = new Date().getFullYear()

      profile.prerequisites = [
        // 2022: incomplete (only precision)
        new Achievement({ type: 'precision_series', year: 2022, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2022, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2022, weaponGroup: 'A', points: 37 }),
        // 2023: complete
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 37 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 6 }),
        // 2024: incomplete (only application)
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      // When called without endYear, should scan candidate years
      const result = calculator.evaluateMedal('pistol-mark-bronze')
      expect(result.status).toBe('eligible')
      expect(result.eligibleYear).toBe(2023) // Should find 2023 as eligible year
    })

    test('should return available if no year is eligible', () => {
      profile.prerequisites = [
        // 2023: incomplete (only precision)
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 37 }),
        // 2024: incomplete (only application)
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      const result = calculator.evaluateMedal('pistol-mark-bronze')
      expect(result.status).toBe('available')
      // When not eligible, eligibleYear is not set in the result (available status doesn't include eligibleYear)
    })
  })

  describe('Real-World Scenario - Pistol Mark Bronze', () => {
    test('should NOT be eligible in current year with only 2023 achievements', () => {
      const currentYear = new Date().getFullYear()

      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 37 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      // Should be eligible for 2023
      const result2023 = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2023 })
      expect(result2023.status).toBe('eligible')

      // Should NOT be eligible for current year
      const resultCurrent = calculator.evaluateMedal('pistol-mark-bronze', { endYear: currentYear })
      expect(resultCurrent.status).toBe('available')
    })

    test('should be eligible in current year with current year achievements', () => {
      const currentYear = new Date().getFullYear()

      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: currentYear, weaponGroup: 'A', points: 37 }),
        new Achievement({ type: 'application_series', year: currentYear, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: currentYear, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: currentYear, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      const result = calculator.evaluateMedal('pistol-mark-bronze', { endYear: currentYear })
      expect(result.status).toBe('eligible')
    })
  })

  describe('Edge Case - Already Unlocked Medals', () => {
    test('already unlocked medals should remain unlocked regardless of year', () => {
      const currentYear = new Date().getFullYear()

      // Medal was unlocked in 2023
      profile.unlockedMedals = [
        { medalId: 'pistol-mark-bronze', unlockedDate: '2023-06-15', year: 2023 }
      ]

      // Add achievements from 2023 (the year it was unlocked)
      profile.prerequisites = [
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 37 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      // Even when evaluating for current year, medal should show as unlocked
      const result = calculator.evaluateMedal('pistol-mark-bronze', { endYear: currentYear })
      expect(result.status).toBe('unlocked')
    })
  })

  describe('Integration Test - Multiple Years with Progression', () => {
    test('user can unlock medals in different years independently', () => {
      profile.prerequisites = [
        // 2022: complete set
        new Achievement({ type: 'precision_series', year: 2022, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2022, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2022, weaponGroup: 'A', points: 37 }),
        new Achievement({ type: 'application_series', year: 2022, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2022, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2022, weaponGroup: 'A', timeSeconds: 60, hits: 6 }),
        // 2023: complete set
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2023, weaponGroup: 'A', points: 37 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2023, weaponGroup: 'A', timeSeconds: 60, hits: 6 }),
        // 2024: complete set
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 35 }),
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 36 }),
        new Achievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 37 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 5 }),
        new Achievement({ type: 'application_series', year: 2024, weaponGroup: 'A', timeSeconds: 60, hits: 6 })
      ]

      // Each year should be independently eligible
      const result2022 = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2022 })
      expect(result2022.status).toBe('eligible')

      const result2023 = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2023 })
      expect(result2023.status).toBe('eligible')

      const result2024 = calculator.evaluateMedal('pistol-mark-bronze', { endYear: 2024 })
      expect(result2024.status).toBe('eligible')
    })
  })
})
