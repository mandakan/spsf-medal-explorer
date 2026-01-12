/**
 * Tests for age-based threshold resolution in MedalCalculator
 *
 * These tests verify that:
 * 1. Precision series requirements use age-based thresholds when ageCategories are defined
 * 2. Application series requirements use age-based thresholds when ageCategories are defined
 * 3. The yearly mark (årtalsmärke) requirements correctly apply age discounts per PDF rules:
 *    - Ages ≤54: A=43, B=45, C=46, application 17/15s
 *    - Ages 55-64: A=42, B=44, C=45, application 17/15s
 *    - Ages 65+: A=36, B=37, C=38, application 40s
 */

import { MedalCalculator } from '../calculator.js'

// Helper to create a minimal profile with a specific birth date
function createProfile(birthYear, achievements = []) {
  // Birth date: January 1st of the given year
  const dateOfBirth = `${birthYear}-01-01`
  return {
    dateOfBirth,
    unlockedMedals: [],
    prerequisites: achievements
  }
}

// Helper to create precision series achievements
function createPrecisionSeries(year, weaponGroup, points) {
  return {
    id: `ps-${year}-${weaponGroup}-${points}`,
    type: 'precision_series',
    year,
    weaponGroup,
    points,
    date: `${year}-06-15`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// Helper to create application series achievements
function createApplicationSeries(year, weaponGroup, hits, timeSeconds) {
  return {
    id: `as-${year}-${weaponGroup}-${timeSeconds}`,
    type: 'application_series',
    year,
    weaponGroup,
    hits,
    timeSeconds,
    date: `${year}-06-15`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// Mock medal database for testing
const mockMedalDb = {
  getMedalById: () => null,
  medals: []
}

describe('MedalCalculator - Age-based precision series thresholds', () => {
  const yearlyMarkPrecisionReq = {
    type: 'precision_series',
    minAchievements: 3,
    timeWindowYears: 1,
    pointThresholds: {
      A: { min: 43 },
      B: { min: 45 },
      C: { min: 46 }
    },
    ageCategories: [
      {
        name: 'under_55',
        ageMin: 0,
        ageMax: 54,
        pointThresholds: { A: { min: 43 }, B: { min: 45 }, C: { min: 46 } }
      },
      {
        name: 'age_55_64',
        ageMin: 55,
        ageMax: 64,
        pointThresholds: { A: { min: 42 }, B: { min: 44 }, C: { min: 45 } }
      },
      {
        name: 'age_65_plus',
        ageMin: 65,
        ageMax: 999,
        pointThresholds: { A: { min: 36 }, B: { min: 37 }, C: { min: 38 } }
      }
    ]
  }

  describe('resolveAgeBasedPrecisionThresholds', () => {
    test('returns base thresholds when age is null', () => {
      const profile = { unlockedMedals: [], prerequisites: [] } // No dateOfBirth
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.resolveAgeBasedPrecisionThresholds(yearlyMarkPrecisionReq, null)

      expect(result.A.min).toBe(43)
      expect(result.B.min).toBe(45)
      expect(result.C.min).toBe(46)
    })

    test('returns base thresholds when no ageCategories defined', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1990))
      const reqWithoutAgeCategories = {
        pointThresholds: { A: { min: 43 }, B: { min: 45 }, C: { min: 46 } }
      }

      const result = calc.resolveAgeBasedPrecisionThresholds(reqWithoutAgeCategories, 30)

      expect(result.A.min).toBe(43)
    })

    test('returns under_55 thresholds for age 30', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1990))

      const result = calc.resolveAgeBasedPrecisionThresholds(yearlyMarkPrecisionReq, 30)

      expect(result.A.min).toBe(43)
      expect(result.B.min).toBe(45)
      expect(result.C.min).toBe(46)
    })

    test('returns under_55 thresholds for age 54 (boundary)', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1970))

      const result = calc.resolveAgeBasedPrecisionThresholds(yearlyMarkPrecisionReq, 54)

      expect(result.A.min).toBe(43)
      expect(result.B.min).toBe(45)
      expect(result.C.min).toBe(46)
    })

    test('returns age_55_64 thresholds for age 55 (boundary)', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1969))

      const result = calc.resolveAgeBasedPrecisionThresholds(yearlyMarkPrecisionReq, 55)

      expect(result.A.min).toBe(42)
      expect(result.B.min).toBe(44)
      expect(result.C.min).toBe(45)
    })

    test('returns age_55_64 thresholds for age 60', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1964))

      const result = calc.resolveAgeBasedPrecisionThresholds(yearlyMarkPrecisionReq, 60)

      expect(result.A.min).toBe(42)
      expect(result.B.min).toBe(44)
      expect(result.C.min).toBe(45)
    })

    test('returns age_55_64 thresholds for age 64 (boundary)', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1960))

      const result = calc.resolveAgeBasedPrecisionThresholds(yearlyMarkPrecisionReq, 64)

      expect(result.A.min).toBe(42)
      expect(result.B.min).toBe(44)
      expect(result.C.min).toBe(45)
    })

    test('returns age_65_plus thresholds for age 65 (boundary)', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1959))

      const result = calc.resolveAgeBasedPrecisionThresholds(yearlyMarkPrecisionReq, 65)

      expect(result.A.min).toBe(36)
      expect(result.B.min).toBe(37)
      expect(result.C.min).toBe(38)
    })

    test('returns age_65_plus thresholds for age 70', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1954))

      const result = calc.resolveAgeBasedPrecisionThresholds(yearlyMarkPrecisionReq, 70)

      expect(result.A.min).toBe(36)
      expect(result.B.min).toBe(37)
      expect(result.C.min).toBe(38)
    })
  })

  describe('checkPrecisionSeriesRequirement with age categories', () => {
    test('age 30: requires 43 points for weapon group A', () => {
      const achievements = [
        createPrecisionSeries(2024, 'A', 43),
        createPrecisionSeries(2024, 'A', 44),
        createPrecisionSeries(2024, 'A', 45)
      ]
      const profile = createProfile(1994, achievements) // Age 30 at end of 2024
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkPrecisionSeriesRequirement(yearlyMarkPrecisionReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(true)
      expect(result.progress.current).toBe(3)
    })

    test('age 30: 42 points for weapon group A is NOT enough', () => {
      const achievements = [
        createPrecisionSeries(2024, 'A', 42),
        createPrecisionSeries(2024, 'A', 42),
        createPrecisionSeries(2024, 'A', 42)
      ]
      const profile = createProfile(1994, achievements) // Age 30 at end of 2024
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkPrecisionSeriesRequirement(yearlyMarkPrecisionReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(false)
      expect(result.progress.current).toBe(0)
    })

    test('age 55: requires 42 points for weapon group A (discount)', () => {
      const achievements = [
        createPrecisionSeries(2024, 'A', 42),
        createPrecisionSeries(2024, 'A', 42),
        createPrecisionSeries(2024, 'A', 42)
      ]
      const profile = createProfile(1969, achievements) // Age 55 at end of 2024
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkPrecisionSeriesRequirement(yearlyMarkPrecisionReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(true)
      expect(result.progress.current).toBe(3)
    })

    test('age 65: requires only 36 points for weapon group A (max discount)', () => {
      const achievements = [
        createPrecisionSeries(2024, 'A', 36),
        createPrecisionSeries(2024, 'A', 36),
        createPrecisionSeries(2024, 'A', 36)
      ]
      const profile = createProfile(1959, achievements) // Age 65 at end of 2024
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkPrecisionSeriesRequirement(yearlyMarkPrecisionReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(true)
      expect(result.progress.current).toBe(3)
    })

    test('age 65: 35 points is NOT enough even with discount', () => {
      const achievements = [
        createPrecisionSeries(2024, 'A', 35),
        createPrecisionSeries(2024, 'A', 35),
        createPrecisionSeries(2024, 'A', 35)
      ]
      const profile = createProfile(1959, achievements) // Age 65 at end of 2024
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkPrecisionSeriesRequirement(yearlyMarkPrecisionReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(false)
      expect(result.progress.current).toBe(0)
    })
  })
})

describe('MedalCalculator - Age-based application series thresholds', () => {
  const yearlyMarkApplicationReq = {
    type: 'application_series',
    minAchievements: 3,
    timeWindowYears: 1,
    thresholds: {
      A: { minHits: 6, maxTimeSeconds: 17 },
      B: { minHits: 6, maxTimeSeconds: 15 },
      C: { minHits: 6, maxTimeSeconds: 15 },
      R: { minHits: 6, maxTimeSeconds: 17 }
    },
    ageCategories: [
      {
        name: 'under_65',
        ageMin: 0,
        ageMax: 64,
        thresholds: {
          A: { minHits: 6, maxTimeSeconds: 17 },
          B: { minHits: 6, maxTimeSeconds: 15 },
          C: { minHits: 6, maxTimeSeconds: 15 },
          R: { minHits: 6, maxTimeSeconds: 17 }
        }
      },
      {
        name: 'age_65_plus',
        ageMin: 65,
        ageMax: 999,
        thresholds: {
          A: { minHits: 6, maxTimeSeconds: 40 },
          B: { minHits: 6, maxTimeSeconds: 40 },
          C: { minHits: 6, maxTimeSeconds: 40 },
          R: { minHits: 6, maxTimeSeconds: 40 }
        }
      }
    ]
  }

  describe('resolveAgeBasedApplicationThresholds', () => {
    test('returns base thresholds when age is null', () => {
      const profile = { unlockedMedals: [], prerequisites: [] }
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.resolveAgeBasedApplicationThresholds(yearlyMarkApplicationReq, null)

      expect(result.A.maxTimeSeconds).toBe(17)
    })

    test('returns under_65 thresholds for age 30', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1990))

      const result = calc.resolveAgeBasedApplicationThresholds(yearlyMarkApplicationReq, 30)

      expect(result.A.maxTimeSeconds).toBe(17)
      expect(result.B.maxTimeSeconds).toBe(15)
    })

    test('returns under_65 thresholds for age 64 (boundary)', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1960))

      const result = calc.resolveAgeBasedApplicationThresholds(yearlyMarkApplicationReq, 64)

      expect(result.A.maxTimeSeconds).toBe(17)
    })

    test('returns age_65_plus thresholds for age 65 (boundary)', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1959))

      const result = calc.resolveAgeBasedApplicationThresholds(yearlyMarkApplicationReq, 65)

      expect(result.A.maxTimeSeconds).toBe(40)
      expect(result.B.maxTimeSeconds).toBe(40)
      expect(result.C.maxTimeSeconds).toBe(40)
      expect(result.R.maxTimeSeconds).toBe(40)
    })

    test('returns age_65_plus thresholds for age 70', () => {
      const calc = new MedalCalculator(mockMedalDb, createProfile(1954))

      const result = calc.resolveAgeBasedApplicationThresholds(yearlyMarkApplicationReq, 70)

      expect(result.A.maxTimeSeconds).toBe(40)
    })
  })

  describe('checkApplicationSeriesRequirement with age categories', () => {
    test('age 30: requires 17 seconds for weapon group A', () => {
      const achievements = [
        createApplicationSeries(2024, 'A', 6, 17),
        createApplicationSeries(2024, 'A', 6, 16),
        createApplicationSeries(2024, 'A', 6, 15)
      ]
      const profile = createProfile(1994, achievements)
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkApplicationSeriesRequirement(yearlyMarkApplicationReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(true)
    })

    test('age 30: 18 seconds for weapon group A is NOT fast enough', () => {
      const achievements = [
        createApplicationSeries(2024, 'A', 6, 18),
        createApplicationSeries(2024, 'A', 6, 18),
        createApplicationSeries(2024, 'A', 6, 18)
      ]
      const profile = createProfile(1994, achievements)
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkApplicationSeriesRequirement(yearlyMarkApplicationReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(false)
    })

    test('age 65: 40 seconds is allowed for weapon group A', () => {
      const achievements = [
        createApplicationSeries(2024, 'A', 6, 40),
        createApplicationSeries(2024, 'A', 6, 38),
        createApplicationSeries(2024, 'A', 6, 35)
      ]
      const profile = createProfile(1959, achievements) // Age 65 at end of 2024
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkApplicationSeriesRequirement(yearlyMarkApplicationReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(true)
    })

    test('age 65: 41 seconds is NOT fast enough even with discount', () => {
      const achievements = [
        createApplicationSeries(2024, 'A', 6, 41),
        createApplicationSeries(2024, 'A', 6, 41),
        createApplicationSeries(2024, 'A', 6, 41)
      ]
      const profile = createProfile(1959, achievements) // Age 65 at end of 2024
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkApplicationSeriesRequirement(yearlyMarkApplicationReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(false)
    })

    test('age 64: still requires 17 seconds (no discount yet)', () => {
      const achievements = [
        createApplicationSeries(2024, 'A', 6, 40),
        createApplicationSeries(2024, 'A', 6, 40),
        createApplicationSeries(2024, 'A', 6, 40)
      ]
      const profile = createProfile(1960, achievements) // Age 64 at end of 2024
      const calc = new MedalCalculator(mockMedalDb, profile)

      const result = calc.checkApplicationSeriesRequirement(yearlyMarkApplicationReq, 0, { endYear: 2024 })

      expect(result.isMet).toBe(false)
    })
  })
})

describe('MedalCalculator - getAgeAtYear', () => {
  test('calculates age correctly at end of year', () => {
    // Born Jan 1, 1990 - at end of 2024, age is 34
    const profile = createProfile(1990)
    const calc = new MedalCalculator(mockMedalDb, profile)

    expect(calc.getAgeAtYear(2024)).toBe(34)
  })

  test('returns null when dateOfBirth is missing', () => {
    const profile = { unlockedMedals: [], prerequisites: [] }
    const calc = new MedalCalculator(mockMedalDb, profile)

    expect(calc.getAgeAtYear(2024)).toBeNull()
  })

  test('handles birthday in December correctly', () => {
    // Born Dec 31, 1990 - at end of 2024, age is 34 (birthday is on Dec 31)
    const profile = { dateOfBirth: '1990-12-31', unlockedMedals: [], prerequisites: [] }
    const calc = new MedalCalculator(mockMedalDb, profile)

    expect(calc.getAgeAtYear(2024)).toBe(34)
  })
})
