import { validateAchievements, detectDuplicateAchievements } from '../src/logic/achievementValidator'

jest.mock('../src/logic/validator', () => ({
  InputValidator: {
    validatePrecisionSeriesInput: (input) => {
      const errors = []
      const currentYear = new Date().getFullYear()
      if (typeof input.year !== 'number' || input.year < 2000 || input.year > currentYear) {
        errors.push('Year invalid')
      }
      if (!['A', 'B', 'C', 'R'].includes(input.weaponGroup)) {
        errors.push('Group invalid')
      }
      if (typeof input.points !== 'number' || input.points < 0 || input.points > 50) {
        errors.push('Points invalid')
      }
      return { isValid: errors.length === 0, errors }
    }
  }
}))

describe('achievementValidator', () => {
  test('validateAchievements filters invalid and reports errors', () => {
    const rows = [
      { year: 2025, weaponGroup: 'A', points: 42, type: 'precision_series' },
      { year: 1999, weaponGroup: 'A', points: 42, type: 'precision_series' }, // invalid year
      { year: 2025, weaponGroup: 'Z', points: 42, type: 'precision_series' }, // invalid group
      { year: 2025, weaponGroup: 'A', points: 99, type: 'precision_series' }  // invalid points
    ]
    const res = validateAchievements(rows)
    expect(res.isValid).toBe(true) // at least one valid
    expect(res.validAchievements.length).toBe(1)
    expect(Object.keys(res.errors).length).toBe(3)
  })

  test('detectDuplicateAchievements identifies duplicates', () => {
    const rows = [
      { year: 2025, type: 'precision_series', weaponGroup: 'A', points: 40 },
      { year: 2025, type: 'precision_series', weaponGroup: 'A', points: 40 }, // dup
      { year: 2025, type: 'precision_series', weaponGroup: 'B', points: 40 }
    ]
    const dups = detectDuplicateAchievements(rows)
    expect(dups.length).toBe(1)
    expect(dups[0]).toBe('2025-precision_series-A-40')
  })
})
