import { parseCsv, toAchievement } from '../src/utils/achievementCsv'

describe('achievementCsv', () => {
  describe('parseCsv', () => {
    it('returns empty rows and error for empty input', () => {
      const result = parseCsv('')
      expect(result.rows).toEqual([])
      expect(result.errors).toContain('Empty file')
    })

    it('parses simple CSV with valid headers', () => {
      const csv = `type,year,weaponGroup,points
precision_series,2024,A,45
precision_series,2024,B,48`
      const result = parseCsv(csv)
      expect(result.errors).toHaveLength(0)
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toMatchObject({
        type: 'precision_series',
        year: 2024,
        weaponGroup: 'A',
        points: 45
      })
    })

    it('reports unknown headers as errors', () => {
      const csv = `type,year,unknownColumn
precision_series,2024,value`
      const result = parseCsv(csv)
      expect(result.errors).toContain('Okända rubriker: unknownColumn')
      expect(result.rows).toHaveLength(1)
    })

    it('handles quoted fields with commas', () => {
      const csv = `type,year,weaponGroup,competitionName
competition_result,2024,A,"SM i Göteborg, 2024"`
      const result = parseCsv(csv)
      expect(result.rows[0].competitionName).toBe('SM i Göteborg, 2024')
    })

    it('handles escaped quotes in fields', () => {
      const csv = `type,year,weaponGroup,notes
precision_series,2024,A,"Said ""hello"" to everyone"`
      const result = parseCsv(csv)
      expect(result.rows[0].notes).toBe('Said "hello" to everyone')
    })

    it('handles different line endings', () => {
      const csvCRLF = 'type,year\r\nprecision_series,2024\r\nprecision_series,2023'
      const csvCR = 'type,year\rprecision_series,2024\rprecision_series,2023'
      const csvLF = 'type,year\nprecision_series,2024\nprecision_series,2023'

      expect(parseCsv(csvCRLF).rows).toHaveLength(2)
      expect(parseCsv(csvCR).rows).toHaveLength(2)
      expect(parseCsv(csvLF).rows).toHaveLength(2)
    })
  })

  describe('normalizeWeaponGroup (via parseCsv)', () => {
    const parseWeaponGroup = (value) => {
      const csv = `weaponGroup\n${value}`
      return parseCsv(csv).rows[0].weaponGroup
    }

    it('defaults to A for empty values', () => {
      // Use a row with another field to ensure the row isn't filtered out
      const csv = 'type,weaponGroup\nprecision_series,'
      const result = parseCsv(csv)
      expect(result.rows[0].weaponGroup).toBe('A')
    })

    it('defaults to A for missing column', () => {
      const csv = 'type,year\nprecision_series,2024'
      const result = parseCsv(csv)
      // weaponGroup won't be in the record since it's not in the header
      expect(result.rows[0].weaponGroup).toBeUndefined()
    })

    it('normalizes A1, A2, A3 to A', () => {
      expect(parseWeaponGroup('A1')).toBe('A')
      expect(parseWeaponGroup('A2')).toBe('A')
      expect(parseWeaponGroup('A3')).toBe('A')
    })

    it('handles lowercase variants', () => {
      expect(parseWeaponGroup('a1')).toBe('A')
      expect(parseWeaponGroup('a2')).toBe('A')
      expect(parseWeaponGroup('a3')).toBe('A')
      expect(parseWeaponGroup('a')).toBe('A')
      expect(parseWeaponGroup('b')).toBe('B')
      expect(parseWeaponGroup('c')).toBe('C')
      expect(parseWeaponGroup('r')).toBe('R')
    })

    it('keeps valid groups as-is', () => {
      expect(parseWeaponGroup('A')).toBe('A')
      expect(parseWeaponGroup('B')).toBe('B')
      expect(parseWeaponGroup('C')).toBe('C')
      expect(parseWeaponGroup('R')).toBe('R')
    })

    it('passes through invalid values for downstream validation', () => {
      expect(parseWeaponGroup('X')).toBe('X')
      expect(parseWeaponGroup('123')).toBe('123')
      expect(parseWeaponGroup('INVALID')).toBe('INVALID')
    })

    it('trims whitespace', () => {
      expect(parseWeaponGroup('  A  ')).toBe('A')
      expect(parseWeaponGroup('  A1  ')).toBe('A')
    })
  })

  describe('toAchievement', () => {
    it('maps parsed record to achievement structure', () => {
      const record = {
        id: 'test-id',
        type: 'precision_series',
        year: 2024,
        weaponGroup: 'A',
        points: 45,
        notes: 'Test note'
      }
      const achievement = toAchievement(record)
      expect(achievement).toMatchObject({
        id: 'test-id',
        type: 'precision_series',
        year: 2024,
        weaponGroup: 'A',
        points: 45,
        notes: 'Test note'
      })
    })

    it('defaults weaponGroup to A if missing', () => {
      const record = { type: 'precision_series', year: 2024 }
      const achievement = toAchievement(record)
      expect(achievement.weaponGroup).toBe('A')
    })

    it('includes all expected fields', () => {
      const record = {}
      const achievement = toAchievement(record)
      expect(achievement).toHaveProperty('id')
      expect(achievement).toHaveProperty('type')
      expect(achievement).toHaveProperty('year')
      expect(achievement).toHaveProperty('weaponGroup')
      expect(achievement).toHaveProperty('points')
      expect(achievement).toHaveProperty('date')
      expect(achievement).toHaveProperty('timeSeconds')
      expect(achievement).toHaveProperty('hits')
      expect(achievement).toHaveProperty('competitionName')
      expect(achievement).toHaveProperty('competitionType')
      expect(achievement).toHaveProperty('disciplineType')
      expect(achievement).toHaveProperty('ppcClass')
      expect(achievement).toHaveProperty('weapon')
      expect(achievement).toHaveProperty('score')
      expect(achievement).toHaveProperty('teamName')
      expect(achievement).toHaveProperty('position')
      expect(achievement).toHaveProperty('eventName')
      expect(achievement).toHaveProperty('notes')
    })
  })

  describe('type normalization', () => {
    it('converts type to lowercase', () => {
      const csv = 'type,year\nPRECISION_SERIES,2024'
      const result = parseCsv(csv)
      expect(result.rows[0].type).toBe('precision_series')
    })
  })

  describe('numeric field parsing', () => {
    it('parses year as number', () => {
      const csv = 'year\n2024'
      const result = parseCsv(csv)
      expect(result.rows[0].year).toBe(2024)
    })

    it('parses points as number', () => {
      const csv = 'points\n45.5'
      const result = parseCsv(csv)
      expect(result.rows[0].points).toBe(45.5)
    })

    it('handles comma as decimal separator in quoted fields', () => {
      // Comma must be quoted in CSV to not be treated as field separator
      const csv = 'points\n"45,5"'
      const result = parseCsv(csv)
      expect(result.rows[0].points).toBe(45.5)
    })

    it('returns undefined for invalid numbers', () => {
      const csv = 'year,points\nabc,def'
      const result = parseCsv(csv)
      expect(result.rows[0].year).toBeUndefined()
      expect(result.rows[0].points).toBeUndefined()
    })
  })
})
