import { validateAchievement, validateCompetition } from '../src/validators/universalValidator'

describe('universalValidator', () => {
  test('validateAchievement requires type, year, weaponGroup', () => {
    const result = validateAchievement({})
    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining(['Invalid type', 'Invalid year', 'Invalid weapon group']))
  })

  test('validateAchievement precision_series requires points 0..50', () => {
    const invalid = validateAchievement({ type: 'precision_series', year: 2024, weaponGroup: 'A' })
    expect(invalid.valid).toBe(false)
    expect(invalid.errors.join(' ')).toMatch(/Points required/)
    const tooHigh = validateAchievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 60 })
    expect(tooHigh.valid).toBe(false)
    const ok = validateAchievement({ type: 'precision_series', year: 2024, weaponGroup: 'A', points: 45 })
    expect(ok.valid).toBe(true)
  })

  test('validateCompetition checks date, group, score', () => {
    const errs = validateCompetition({ date: '', weaponGroup: '', score: '' })
    expect(Object.keys(errs)).toEqual(expect.arrayContaining(['date', 'weaponGroup', 'score']))
  })

  describe('air_pistol_precision validation', () => {
    test('requires points', () => {
      const result = validateAchievement({ type: 'air_pistol_precision', year: 2024, weaponGroup: 'A' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Points required/)
    })

    test('rejects negative points', () => {
      const result = validateAchievement({ type: 'air_pistol_precision', year: 2024, weaponGroup: 'A', points: -5 })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/between 0 and 100/)
    })

    test('rejects points over 100', () => {
      const result = validateAchievement({ type: 'air_pistol_precision', year: 2024, weaponGroup: 'A', points: 105 })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/between 0 and 100/)
    })

    test('accepts points at boundary 0', () => {
      const result = validateAchievement({ type: 'air_pistol_precision', year: 2024, weaponGroup: 'A', points: 0 })
      expect(result.valid).toBe(true)
    })

    test('accepts points at boundary 100', () => {
      const result = validateAchievement({ type: 'air_pistol_precision', year: 2024, weaponGroup: 'A', points: 100 })
      expect(result.valid).toBe(true)
    })

    test('accepts valid points in range', () => {
      const result = validateAchievement({ type: 'air_pistol_precision', year: 2024, weaponGroup: 'A', points: 85 })
      expect(result.valid).toBe(true)
    })
  })

  describe('competition_performance validation', () => {
    test('requires discipline type', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Discipline type required/)
    })

    test('rejects invalid discipline type', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A', disciplineType: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Discipline type required/)
    })

    test('accepts field discipline with scorePercent', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A', disciplineType: 'field', scorePercent: 75 })
      expect(result.valid).toBe(true)
    })

    test('field discipline requires scorePercent', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A', disciplineType: 'field' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Score percent required/)
    })

    test('field discipline rejects invalid scorePercent', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A', disciplineType: 'field', scorePercent: 150 })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Score percent required/)
    })

    test('accepts running discipline with points', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A', disciplineType: 'running', points: 45 })
      expect(result.valid).toBe(true)
    })

    test('running discipline requires points', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A', disciplineType: 'running' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Points required/)
    })

    test('accepts skiing discipline with points', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A', disciplineType: 'skiing', points: 50 })
      expect(result.valid).toBe(true)
    })

    test('skiing discipline requires points', () => {
      const result = validateAchievement({ type: 'competition_performance', year: 2024, weaponGroup: 'A', disciplineType: 'skiing' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Points required/)
    })
  })

  describe('standard_medal validation', () => {
    test('requires discipline type', () => {
      const result = validateAchievement({ type: 'standard_medal', year: 2024, weaponGroup: 'A' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Discipline type required/)
    })

    test('requires medal type', () => {
      const result = validateAchievement({ type: 'standard_medal', year: 2024, weaponGroup: 'A', disciplineType: 'field' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Medal type.*required/)
    })

    test('rejects invalid medal type', () => {
      const result = validateAchievement({ type: 'standard_medal', year: 2024, weaponGroup: 'A', disciplineType: 'field', medalType: 'platinum' })
      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/Medal type.*required/)
    })

    test('accepts bronze medal type', () => {
      const result = validateAchievement({ type: 'standard_medal', year: 2024, weaponGroup: 'A', disciplineType: 'field', medalType: 'bronze' })
      expect(result.valid).toBe(true)
    })

    test('accepts silver medal type', () => {
      const result = validateAchievement({ type: 'standard_medal', year: 2024, weaponGroup: 'A', disciplineType: 'field', medalType: 'silver' })
      expect(result.valid).toBe(true)
    })

    test('accepts gold medal type', () => {
      const result = validateAchievement({ type: 'standard_medal', year: 2024, weaponGroup: 'A', disciplineType: 'field', medalType: 'gold' })
      expect(result.valid).toBe(true)
    })
  })
})
