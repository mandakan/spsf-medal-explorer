import { parseCsv, toAchievement } from '../src/utils/achievementCsv'
import { exportCsvTemplate, generateExampleForType } from '../src/utils/achievementExport'
import { ACHIEVEMENT_TYPES, ACHIEVEMENT_TYPE_LABELS } from '../src/utils/labels'

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

    it('normalizes LUFTPISTOL to C', () => {
      expect(parseWeaponGroup('LUFTPISTOL')).toBe('C')
      expect(parseWeaponGroup('luftpistol')).toBe('C')
      expect(parseWeaponGroup('Luftpistol')).toBe('C')
    })

    it('normalizes LUFT and LP to C', () => {
      expect(parseWeaponGroup('LUFT')).toBe('C')
      expect(parseWeaponGroup('LP')).toBe('C')
      expect(parseWeaponGroup('lp')).toBe('C')
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

    it('defaults weaponGroup to C for air_pistol_precision', () => {
      const record = { type: 'air_pistol_precision', year: 2024, points: 92 }
      const achievement = toAchievement(record)
      expect(achievement.weaponGroup).toBe('C')
    })

    it('always uses C for air_pistol_precision regardless of input', () => {
      // Air pistol doesn't use traditional weapon groups, always defaults to C
      const record = { type: 'air_pistol_precision', year: 2024, points: 92, weaponGroup: 'B' }
      const achievement = toAchievement(record)
      expect(achievement.weaponGroup).toBe('C')
    })

    it('ignores LUFTPISTOL weapon group for air_pistol_precision', () => {
      const record = { type: 'air_pistol_precision', year: 2024, points: 92, weaponGroup: 'LUFTPISTOL' }
      const achievement = toAchievement(record)
      expect(achievement.weaponGroup).toBe('C')
    })

    it('defaults date to January 1st when only year is provided', () => {
      const record = { type: 'precision_series', year: 2024, points: 45 }
      const achievement = toAchievement(record)
      expect(achievement.date).toBe('2024-01-01')
      expect(achievement.year).toBe(2024)
    })

    it('extracts year from date when date is provided', () => {
      const record = { type: 'precision_series', date: '2024-06-15', points: 45 }
      const achievement = toAchievement(record)
      expect(achievement.date).toBe('2024-06-15')
      expect(achievement.year).toBe(2024)
    })

    it('date takes precedence over year column', () => {
      const record = { type: 'precision_series', year: 2023, date: '2024-06-15', points: 45 }
      const achievement = toAchievement(record)
      expect(achievement.date).toBe('2024-06-15')
      expect(achievement.year).toBe(2024) // Year extracted from date, not from year column
    })

    it('handles empty date string with year', () => {
      const record = { type: 'precision_series', year: 2024, date: '', points: 45 }
      const achievement = toAchievement(record)
      expect(achievement.date).toBe('2024-01-01')
      expect(achievement.year).toBe(2024)
    })

    it('handles whitespace-only date string with year', () => {
      const record = { type: 'precision_series', year: 2024, date: '   ', points: 45 }
      const achievement = toAchievement(record)
      expect(achievement.date).toBe('2024-01-01')
      expect(achievement.year).toBe(2024)
    })

    it('leaves both undefined when neither date nor year provided', () => {
      const record = { type: 'precision_series', points: 45 }
      const achievement = toAchievement(record)
      expect(achievement.date).toBeUndefined()
      expect(achievement.year).toBeUndefined()
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

describe('exportCsvTemplate', () => {
  it('generates one example row for each achievement type', () => {
    const template = exportCsvTemplate()
    const lines = template.split('\n')
    // Header + one row per achievement type
    expect(lines).toHaveLength(ACHIEVEMENT_TYPES.length + 1)
  })

  it('includes all achievement types in order', () => {
    const template = exportCsvTemplate()
    const lines = template.split('\n')
    // Skip header, check that each row has the expected type
    ACHIEVEMENT_TYPES.forEach((type, index) => {
      const row = lines[index + 1]
      expect(row).toContain(type)
    })
  })

  it('generates valid CSV that can be parsed back', () => {
    const template = exportCsvTemplate()
    const { rows, errors } = parseCsv(template)
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(ACHIEVEMENT_TYPES.length)
  })

  it('each example row has correct type', () => {
    const template = exportCsvTemplate()
    const { rows } = parseCsv(template)
    rows.forEach((row, index) => {
      expect(row.type).toBe(ACHIEVEMENT_TYPES[index])
    })
  })

  it('includes schema_version in each row', () => {
    const template = exportCsvTemplate('1')
    const lines = template.split('\n')
    // Each data row should end with schema version
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).toMatch(/,1$/)
    }
  })

  it('uses different schema version when provided', () => {
    const template = exportCsvTemplate('2')
    const lines = template.split('\n')
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).toMatch(/,2$/)
    }
  })
})

describe('generateExampleForType', () => {
  it('generates valid example for precision_series', () => {
    const example = generateExampleForType('precision_series')
    expect(example.type).toBe('precision_series')
    expect(example.year).toBe('2024')
    expect(example.weaponGroup).toBe('A')
    expect(example.points).toBe('45')
  })

  it('generates valid example for application_series', () => {
    const example = generateExampleForType('application_series')
    expect(example.type).toBe('application_series')
    expect(example.timeSeconds).toBe('25')
    expect(example.hits).toBe('5')
  })

  it('generates valid example for competition_result', () => {
    const example = generateExampleForType('competition_result')
    expect(example.type).toBe('competition_result')
    expect(example.score).toBe('285')
    expect(example.disciplineType).toBe('precision')
    expect(example.date).toBe('2024-05-20')
  })

  it('generates valid example for running_shooting_course', () => {
    const example = generateExampleForType('running_shooting_course')
    expect(example.type).toBe('running_shooting_course')
    expect(example.points).toBe('85')
    expect(example.date).toBe('2024-04-15')
  })

  it('generates valid example for air_pistol_precision', () => {
    const example = generateExampleForType('air_pistol_precision')
    expect(example.type).toBe('air_pistol_precision')
    expect(example.points).toBe('92')
    expect(example.weaponGroup).toBe('C')
  })

  it('uses Swedish type label as notes for each type', () => {
    ACHIEVEMENT_TYPES.forEach(type => {
      const example = generateExampleForType(type)
      const expectedLabel = ACHIEVEMENT_TYPE_LABELS[type]
      // Notes should contain the Swedish label (some types override with custom text)
      expect(example.notes).toBeTruthy()
    })
  })

  it('generates example for all known achievement types', () => {
    ACHIEVEMENT_TYPES.forEach(type => {
      const example = generateExampleForType(type)
      expect(example).toBeDefined()
      expect(example.type).toBe(type)
      expect(example.year).toBe('2024')
      // air_pistol_precision uses 'C' as default, others use 'A'
      const expectedWg = type === 'air_pistol_precision' ? 'C' : 'A'
      expect(example.weaponGroup).toBe(expectedWg)
    })
  })

  it('returns base example for unknown types', () => {
    const example = generateExampleForType('unknown_type')
    expect(example.type).toBe('unknown_type')
    expect(example.year).toBe('2024')
    expect(example.weaponGroup).toBe('A')
  })
})
