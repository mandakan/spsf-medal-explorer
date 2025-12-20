import { validateAchievement, validateCompetition } from '../src/validators/universalValidator'

describe('universalValidator', () => {
  test('validateAchievement requires type, year, weaponGroup', () => {
    const result = validateAchievement({})
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining(['Invalid type', 'Invalid year', 'Invalid weapon group']))
  })

  test('validateAchievement gold_series requires points 0..50', () => {
    const invalid = validateAchievement({ type: 'gold_series', year: 2024, weaponGroup: 'A' })
    expect(invalid.valid).toBe(false)
    expect(invalid.errors.join(' ')).toMatch(/Points required/)
    const tooHigh = validateAchievement({ type: 'gold_series', year: 2024, weaponGroup: 'A', points: 60 })
    expect(tooHigh.valid).toBe(false)
    const ok = validateAchievement({ type: 'gold_series', year: 2024, weaponGroup: 'A', points: 45 })
    expect(ok.valid).toBe(true)
  })

  test('validateCompetition checks date, group, score', () => {
    const errs = validateCompetition({ date: '', weaponGroup: '', score: '' })
    expect(Object.keys(errs)).toEqual(expect.arrayContaining(['date', 'weaponGroup', 'score']))
  })
})
